import {
  adaptSimulationResponseV2ToPublicSimulatorEnvelope,
  SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
  validatePublicSimulationEnvelopeShape,
} from "../../../lib/decision-engine/simulation-response-public-adapter";
import {
  DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER,
  runInternalSimulationPipeline,
} from "../../../lib/decision-engine/simulation-pipeline-runner";

const SIMULATE_API_CONTRACT_VERSION = "simulate-api-v1-mock";
const MAX_BODY_LENGTH = 8192;
const MAX_INPUT_LENGTH = 1200;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const RATE_LIMIT_MAX_BUCKETS = 500;

type SimulateErrorCode =
  | "invalid_content_type"
  | "body_too_large"
  | "invalid_json"
  | "invalid_payload"
  | "input_required"
  | "input_too_long"
  | "rate_limited"
  | "SIMULATION_FAILED";

type RateLimitBucket = {
  count: number;
  windowStartedAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const ALLOWED_PAYLOAD_FIELDS = new Set(["input", "lang"]);

function createRequestId() {
  return crypto.randomUUID();
}

function meta(options?: { retryAfterSeconds?: number }) {
  return {
    lang: "es",
    safeRender: true,
    mockOnly: true,
    apiReady: true,
    maxInputLength: MAX_INPUT_LENGTH,
    maxBodyLength: MAX_BODY_LENGTH,
    generatedAt: new Date().toISOString(),
    ...(options?.retryAfterSeconds === undefined
      ? {}
      : { retryAfterSeconds: options.retryAfterSeconds }),
  };
}

function errorResponse(
  requestId: string,
  code: SimulateErrorCode,
  message: string,
  status: number,
  options?: {
    headers?: HeadersInit;
    retryAfterSeconds?: number;
  },
) {
  return Response.json(
    {
      contractVersion: SIMULATE_API_CONTRACT_VERSION,
      requestId,
      status: "failed",
      data: null,
      error: {
        code,
        message,
      },
      meta: meta({ retryAfterSeconds: options?.retryAfterSeconds }),
    },
    {
      status,
      headers: options?.headers,
    },
  );
}

function simulationFailedResponse(requestId: string) {
  return errorResponse(
    requestId,
    "SIMULATION_FAILED",
    "No se pudo completar la simulación de forma segura.",
    500,
  );
}

function isJsonContentType(contentType: string) {
  const mediaType = contentType.split(";")[0]?.trim() ?? "";
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidPayloadResponse(requestId: string) {
  return errorResponse(
    requestId,
    "invalid_payload",
    "El cuerpo de la solicitud no cumple el contrato público del simulador.",
    400,
  );
}

function pruneExpiredRateLimitBuckets(now: number) {
  if (rateLimitBuckets.size <= RATE_LIMIT_MAX_BUCKETS) {
    return;
  }

  for (const [source, bucket] of rateLimitBuckets) {
    if (now - bucket.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
      rateLimitBuckets.delete(source);
    }
  }
}

function getRequestSource(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const vercelForwardedFor = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const connectingIp = req.headers.get("cf-connecting-ip")?.trim();
  const userAgent = req.headers.get("user-agent")?.trim();

  return (
    forwardedFor ||
    realIp ||
    vercelForwardedFor ||
    connectingIp ||
    `anonymous:${userAgent || "unknown"}`
  );
}

function checkRateLimit(source: string) {
  const now = Date.now();
  pruneExpiredRateLimitBuckets(now);

  const bucket = rateLimitBuckets.get(source);

  if (!bucket || now - bucket.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(source, {
      count: 1,
      windowStartedAt: now,
    });

    return {
      limited: false as const,
    };
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((bucket.windowStartedAt + RATE_LIMIT_WINDOW_MS - now) / 1000),
  );

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      limited: true as const,
      retryAfterSeconds,
    };
  }

  bucket.count += 1;

  return {
    limited: false as const,
  };
}

async function readJsonBody(req: Request, requestId: string) {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";

  if (!isJsonContentType(contentType)) {
    return {
      ok: false as const,
      response: errorResponse(
        requestId,
        "invalid_content_type",
        "Envía la simulación como JSON.",
        415,
      ),
    };
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_LENGTH) {
    return {
      ok: false as const,
      response: errorResponse(
        requestId,
        "body_too_large",
        "La solicitud es demasiado grande para una simulación mock.",
        413,
      ),
    };
  }

  const rawBody = await req.text();

  if (rawBody.length > MAX_BODY_LENGTH) {
    return {
      ok: false as const,
      response: errorResponse(
        requestId,
        "body_too_large",
        "La solicitud es demasiado grande para una simulación mock.",
        413,
      ),
    };
  }

  try {
    return {
      ok: true as const,
      body: JSON.parse(rawBody) as unknown,
    };
  } catch {
    return {
      ok: false as const,
      response: errorResponse(
        requestId,
        "invalid_json",
        "El cuerpo de la solicitud no contiene JSON válido.",
        400,
      ),
    };
  }
}

function validateSimulatePayload(body: unknown, requestId: string) {
  if (!isRecord(body)) {
    return {
      ok: false as const,
      response: invalidPayloadResponse(requestId),
    };
  }

  for (const field of Object.keys(body)) {
    if (!ALLOWED_PAYLOAD_FIELDS.has(field)) {
      return {
        ok: false as const,
        response: invalidPayloadResponse(requestId),
      };
    }
  }

  if (!Object.prototype.hasOwnProperty.call(body, "input")) {
    return {
      ok: false as const,
      response: errorResponse(
        requestId,
        "input_required",
        "Describe una situación para poder simular escenarios.",
        400,
      ),
    };
  }

  if (typeof body.input !== "string") {
    return {
      ok: false as const,
      response: invalidPayloadResponse(requestId),
    };
  }

  if (
    Object.prototype.hasOwnProperty.call(body, "lang") &&
    (typeof body.lang !== "string" || body.lang !== "es")
  ) {
    return {
      ok: false as const,
      response: invalidPayloadResponse(requestId),
    };
  }

  return {
    ok: true as const,
    input: body.input.trim(),
  };
}

export async function POST(req: Request) {
  const requestId = createRequestId();
  const rateLimit = checkRateLimit(getRequestSource(req));

  if (rateLimit.limited) {
    return errorResponse(
      requestId,
      "rate_limited",
      `Demasiadas simulaciones en poco tiempo. Inténtalo de nuevo en ${rateLimit.retryAfterSeconds} segundos.`,
      429,
      {
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
    );
  }

  const bodyResult = await readJsonBody(req, requestId);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const payloadResult = validateSimulatePayload(bodyResult.body, requestId);

  if (!payloadResult.ok) {
    return payloadResult.response;
  }

  const input = payloadResult.input;

  if (!input) {
    return errorResponse(
      requestId,
      "input_required",
      "Describe una situación para poder simular escenarios.",
      400,
    );
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return errorResponse(
      requestId,
      "input_too_long",
      "La situación es demasiado larga para una simulación mock.",
      413,
    );
  }

  try {
    const runnerResult = runInternalSimulationPipeline({
      requestId,
      input,
      inputLanguage: "es",
      requestedOutputLanguage: "es",
    });

    if (!runnerResult.response) {
      return simulationFailedResponse(requestId);
    }

    if (
      runnerResult.runtime.marker !== DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER ||
      !runnerResult.runtime.rollbackSafe
    ) {
      return simulationFailedResponse(requestId);
    }

    const response = adaptSimulationResponseV2ToPublicSimulatorEnvelope({
      response: runnerResult.response,
      requestId,
      generatedAt: new Date().toISOString(),
      truthBoundary: SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
    });

    if (!validatePublicSimulationEnvelopeShape(response)) {
      return simulationFailedResponse(requestId);
    }

    return Response.json(response);
  } catch {
    return simulationFailedResponse(requestId);
  }
}
