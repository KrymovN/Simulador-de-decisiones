import { buildMockSimulation } from "../../../lib/simulationEngine";

const MAX_BODY_LENGTH = 8192;
const MAX_INPUT_LENGTH = 1200;

type SimulateErrorCode =
  | "invalid_content_type"
  | "body_too_large"
  | "invalid_json"
  | "input_required"
  | "input_too_long";

function errorResponse(code: SimulateErrorCode, message: string, status: number) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
      meta: {
        safeRender: true,
        mockOnly: true,
      },
    },
    { status },
  );
}

async function readJsonBody(req: Request) {
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    return {
      ok: false as const,
      response: errorResponse(
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
        "invalid_json",
        "El cuerpo de la solicitud no contiene JSON válido.",
        400,
      ),
    };
  }
}

export async function POST(req: Request) {
  const bodyResult = await readJsonBody(req);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const body = bodyResult.body as { input?: unknown };
  const input = typeof body.input === "string" ? body.input.trim() : "";

  if (!input) {
    return errorResponse(
      "input_required",
      "Describe una situación para poder simular escenarios.",
      400,
    );
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return errorResponse(
      "input_too_long",
      "La situación es demasiado larga para una simulación mock.",
      413,
    );
  }

  const response = buildMockSimulation(input);

  return Response.json({
    ...response,
    meta: {
      lang: "es",
      safeRender: true,
      mockOnly: true,
      apiReady: true,
      note: "Respuesta mock en español. Sustituir buildMockSimulation por un proveedor real cuando el MVP pase a backend.",
    },
  });
}
