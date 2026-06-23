import { buildMockSimulation } from "../../../lib/simulationEngine";

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
  | "input_required"
  | "input_too_long"
  | "rate_limited";

type RateLimitBucket = {
  count: number;
  windowStartedAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

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

  if (!contentType.includes("application/json")) {
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

  const body = bodyResult.body as { input?: unknown };
  const input = typeof body.input === "string" ? body.input.trim() : "";

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

  const response = buildMockSimulation(input);

  return Response.json({
    contractVersion: SIMULATE_API_CONTRACT_VERSION,
    requestId,
    status: "completed",
    data: response,
    error: null,
    meta: meta(),
  });
}
