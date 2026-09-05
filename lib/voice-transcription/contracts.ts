export const VOICE_TRANSCRIPTION_CONTRACT_VERSION = "voice-transcription-api-v1";
export const VOICE_MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const VOICE_MAX_RECORDING_MS = 120_000;
export const VOICE_TRANSCRIPTION_TIMEOUT_MS = 25_000;

export const VOICE_ALLOWED_AUDIO_MEDIA_TYPES = new Set([
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
]);

export type VoiceTranscriptionErrorCode =
  | "invalid_method"
  | "invalid_content_type"
  | "body_too_large"
  | "malformed_multipart"
  | "invalid_payload"
  | "audio_required"
  | "empty_audio"
  | "unsupported_audio_type"
  | "rate_limited"
  | "transcription_unavailable"
  | "empty_transcript"
  | "transcription_failed";

export type VoiceTranscriptionTransportInput = {
  audio: File;
  language: "es";
  mimeType: string;
  signal: AbortSignal;
  timeoutMs: number;
};

export type VoiceTranscriptionTransport = {
  transcribe(input: VoiceTranscriptionTransportInput): Promise<{ transcript: string }>;
};

export type VoiceTranscriptionApiResponse =
  | {
      contractVersion: typeof VOICE_TRANSCRIPTION_CONTRACT_VERSION;
      requestId: string;
      status: "completed";
      data: {
        language: "es";
        transcript: string;
      };
      error: null;
      meta: {
        maxAudioBytes: number;
        maxRecordingMs: number;
        safeRender: true;
      };
    }
  | {
      contractVersion: typeof VOICE_TRANSCRIPTION_CONTRACT_VERSION;
      requestId: string;
      status: "failed";
      data: null;
      error: {
        code: VoiceTranscriptionErrorCode;
        message: string;
      };
      meta: {
        maxAudioBytes: number;
        maxRecordingMs: number;
        retryAfterSeconds?: number;
        safeRender: true;
      };
    };

export function isVoiceTranscriptionApiResponse(
  value: unknown,
): value is VoiceTranscriptionApiResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const response = value as Record<string, unknown>;
  if (
    response.contractVersion !== VOICE_TRANSCRIPTION_CONTRACT_VERSION ||
    typeof response.requestId !== "string" ||
    !/^[A-Za-z0-9-]{8,128}$/.test(response.requestId) ||
    (response.status !== "completed" && response.status !== "failed") ||
    typeof response.meta !== "object" ||
    response.meta === null
  ) {
    return false;
  }

  const meta = response.meta as Record<string, unknown>;
  if (
    meta.safeRender !== true ||
    meta.maxAudioBytes !== VOICE_MAX_AUDIO_BYTES ||
    meta.maxRecordingMs !== VOICE_MAX_RECORDING_MS
  ) {
    return false;
  }

  if (response.status === "completed") {
    if (response.error !== null || typeof response.data !== "object" || response.data === null) {
      return false;
    }
    const data = response.data as Record<string, unknown>;
    return data.language === "es" && typeof data.transcript === "string";
  }

  if (response.data !== null || typeof response.error !== "object" || response.error === null) {
    return false;
  }
  const error = response.error as Record<string, unknown>;
  return typeof error.code === "string" && typeof error.message === "string";
}
