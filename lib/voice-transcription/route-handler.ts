import {
  createPublicApiRateLimiter,
  getPublicRequestSource,
  type PublicApiRateLimiter,
} from "../runtime-integration/public-api-rate-limit";
import {
  VOICE_ALLOWED_AUDIO_MEDIA_TYPES,
  VOICE_MAX_AUDIO_BYTES,
  VOICE_MAX_RECORDING_MS,
  VOICE_TRANSCRIPTION_CONTRACT_VERSION,
  VOICE_TRANSCRIPTION_TIMEOUT_MS,
  type VoiceTranscriptionErrorCode,
  type VoiceTranscriptionTransport,
} from "./contracts";

const VOICE_MAX_MULTIPART_BYTES = VOICE_MAX_AUDIO_BYTES + 64 * 1024;
const VOICE_RATE_LIMIT_WINDOW_MS = 60_000;
const VOICE_RATE_LIMIT_MAX_REQUESTS = 4;
const VOICE_RATE_LIMIT_MAX_BUCKETS = 500;

export const defaultVoiceTranscriptionRateLimiter = createPublicApiRateLimiter({
  maxBuckets: VOICE_RATE_LIMIT_MAX_BUCKETS,
  maxRequests: VOICE_RATE_LIMIT_MAX_REQUESTS,
  windowMs: VOICE_RATE_LIMIT_WINDOW_MS,
});

function metadata(retryAfterSeconds?: number) {
  return {
    maxAudioBytes: VOICE_MAX_AUDIO_BYTES,
    maxRecordingMs: VOICE_MAX_RECORDING_MS,
    safeRender: true as const,
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  };
}

function failureResponse(
  requestId: string,
  code: VoiceTranscriptionErrorCode,
  message: string,
  status: number,
  options?: { headers?: HeadersInit; retryAfterSeconds?: number },
) {
  return Response.json(
    {
      contractVersion: VOICE_TRANSCRIPTION_CONTRACT_VERSION,
      requestId,
      status: "failed",
      data: null,
      error: { code, message },
      meta: metadata(options?.retryAfterSeconds),
    },
    { status, headers: options?.headers },
  );
}

function normalizedMediaType(value: string) {
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

function isAudioFile(value: FormDataEntryValue | null): value is File {
  return value instanceof Blob && typeof (value as File).name === "string";
}

export function createVoiceTranscriptionRequestHandler(options: {
  rateLimiter?: PublicApiRateLimiter;
  transport: VoiceTranscriptionTransport | null;
}) {
  const rateLimiter = options.rateLimiter ?? defaultVoiceTranscriptionRateLimiter;

  return async function handleVoiceTranscriptionRequest(req: Request) {
    const requestId = crypto.randomUUID();

    if (req.method !== "POST") {
      return failureResponse(
        requestId,
        "invalid_method",
        "Este endpoint solo acepta grabaciones mediante POST.",
        405,
        { headers: { Allow: "POST" } },
      );
    }

    const rateLimit = rateLimiter.check(getPublicRequestSource(req));
    if (rateLimit.limited) {
      return failureResponse(
        requestId,
        "rate_limited",
        "Has enviado demasiadas grabaciones en poco tiempo. Inténtalo de nuevo más tarde.",
        429,
        {
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      );
    }

    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("multipart/form-data;")) {
      return failureResponse(
        requestId,
        "invalid_content_type",
        "Envía la grabación como multipart/form-data.",
        415,
      );
    }

    const contentLength = Number(req.headers.get("content-length") ?? Number.NaN);
    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return failureResponse(
        requestId,
        "invalid_payload",
        "No se pudo validar el tamaño de la grabación.",
        400,
      );
    }
    if (contentLength > VOICE_MAX_MULTIPART_BYTES) {
      return failureResponse(
        requestId,
        "body_too_large",
        "La grabación supera el límite permitido.",
        413,
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return failureResponse(
        requestId,
        "malformed_multipart",
        "No se pudo leer la grabación enviada.",
        400,
      );
    }

    if ([...formData.keys()].some((key) => key !== "audio")) {
      return failureResponse(
        requestId,
        "invalid_payload",
        "La solicitud contiene campos no permitidos.",
        400,
      );
    }

    const audioEntries = formData.getAll("audio");
    const audio = audioEntries.length === 1 ? audioEntries[0] : null;
    if (!isAudioFile(audio)) {
      return failureResponse(
        requestId,
        "audio_required",
        "Añade una grabación de audio válida.",
        400,
      );
    }

    if (audio.size === 0) {
      return failureResponse(
        requestId,
        "empty_audio",
        "La grabación está vacía.",
        400,
      );
    }
    if (audio.size > VOICE_MAX_AUDIO_BYTES) {
      return failureResponse(
        requestId,
        "body_too_large",
        "La grabación supera el límite permitido.",
        413,
      );
    }

    const mimeType = normalizedMediaType(audio.type);
    if (!VOICE_ALLOWED_AUDIO_MEDIA_TYPES.has(mimeType)) {
      return failureResponse(
        requestId,
        "unsupported_audio_type",
        "El formato de audio no es compatible.",
        415,
      );
    }

    if (!options.transport) {
      return failureResponse(
        requestId,
        "transcription_unavailable",
        "La transcripción por voz no está disponible temporalmente.",
        503,
      );
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), VOICE_TRANSCRIPTION_TIMEOUT_MS);

    try {
      const result = await options.transport.transcribe({
        audio,
        language: "es",
        mimeType,
        signal: abortController.signal,
        timeoutMs: VOICE_TRANSCRIPTION_TIMEOUT_MS,
      });
      const transcript = result.transcript.trim();

      if (!transcript) {
        return failureResponse(
          requestId,
          "empty_transcript",
          "No hemos podido detectar voz en la grabación.",
          422,
        );
      }

      return Response.json({
        contractVersion: VOICE_TRANSCRIPTION_CONTRACT_VERSION,
        requestId,
        status: "completed",
        data: {
          language: "es",
          transcript,
        },
        error: null,
        meta: metadata(),
      });
    } catch {
      return failureResponse(
        requestId,
        "transcription_failed",
        "No hemos podido transcribir la grabación. Puedes seguir escribiendo.",
        502,
      );
    } finally {
      clearTimeout(timeout);
    }
  };
}
