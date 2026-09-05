import {
  VOICE_MAX_AUDIO_BYTES,
  VOICE_MAX_RECORDING_MS,
} from "../lib/voice-transcription/contracts";

export { VOICE_MAX_AUDIO_BYTES, VOICE_MAX_RECORDING_MS };

export type VoicePhase =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "stopping"
  | "transcribing"
  | "completed"
  | "error";

export type VoiceErrorCode =
  | "MIC_PERMISSION_DENIED"
  | "MIC_NOT_AVAILABLE"
  | "RECORDING_UNSUPPORTED"
  | "RECORDING_FAILED"
  | "EMPTY_RECORDING"
  | "TRANSCRIPTION_FAILED";

export const VOICE_MIME_TYPE_PREFERENCES = [
  "audio/webm;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm",
  "audio/ogg;codecs=opus",
] as const;

export function selectVoiceRecordingMimeType(
  isTypeSupported: (mimeType: string) => boolean,
) {
  for (const mimeType of VOICE_MIME_TYPE_PREFERENCES) {
    try {
      if (isTypeSupported(mimeType)) {
        return mimeType;
      }
    } catch {
      // Let the browser choose its native recording type.
    }
  }
  return "";
}

export function appendVoiceTranscript(currentInput: string, transcript: string, maxLength: number) {
  const normalizedTranscript = transcript.trim();
  if (!normalizedTranscript) {
    return currentInput;
  }

  return `${currentInput.trimEnd()}${currentInput.trim() ? " " : ""}${normalizedTranscript}`.slice(
    0,
    maxLength,
  );
}

export function calculateVoiceAudioLevel(samples: Uint8Array) {
  if (samples.length === 0) {
    return 0;
  }

  let sumOfSquares = 0;
  for (const sample of samples) {
    const normalized = (sample - 128) / 128;
    sumOfSquares += normalized * normalized;
  }

  return Math.min(1, Math.sqrt(sumOfSquares / samples.length) * 2.4);
}

export function formatVoiceRecordingTime(elapsedSeconds: number) {
  const boundedSeconds = Math.max(0, Math.floor(elapsedSeconds));
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function classifyMicrophoneError(error: unknown): VoiceErrorCode {
  const name = error instanceof DOMException
    ? error.name
    : typeof error === "object" && error !== null && "name" in error
      ? String((error as { name?: unknown }).name ?? "")
      : "";

  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
    return "MIC_PERMISSION_DENIED";
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    name === "OverconstrainedError"
  ) {
    return "MIC_NOT_AVAILABLE";
  }
  return "RECORDING_FAILED";
}

export function voiceErrorMessage(code: VoiceErrorCode) {
  switch (code) {
    case "MIC_PERMISSION_DENIED":
      return "No podemos acceder al micrófono. Revisa los permisos del navegador.";
    case "MIC_NOT_AVAILABLE":
      return "No encontramos un micrófono disponible. Puedes seguir escribiendo.";
    case "RECORDING_UNSUPPORTED":
      return "La grabación por voz no está disponible en este navegador.";
    case "EMPTY_RECORDING":
      return "No hemos podido detectar voz en la grabación.";
    case "TRANSCRIPTION_FAILED":
      return "No hemos podido transcribir la grabación. Puedes seguir escribiendo.";
    default:
      return "No se pudo completar la grabación. Puedes seguir escribiendo.";
  }
}

export function fileExtensionForVoiceMimeType(mimeType: string) {
  const mediaType = mimeType.split(";")[0]?.trim().toLowerCase();
  switch (mediaType) {
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a";
    case "audio/mpeg":
      return "mp3";
    case "audio/ogg":
      return "ogg";
    case "audio/wav":
      return "wav";
    default:
      return "webm";
  }
}
