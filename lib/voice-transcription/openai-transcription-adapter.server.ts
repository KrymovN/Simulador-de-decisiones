import "server-only";

import OpenAI from "openai";

import type {
  VoiceTranscriptionTransport,
  VoiceTranscriptionTransportInput,
} from "./contracts";

export const OPENAI_VOICE_TRANSCRIPTION_PROVIDER = "openai";
export const DEFAULT_OPENAI_VOICE_TRANSCRIPTION_MODEL = "gpt-transcribe";

function extensionForMediaType(mimeType: string) {
  switch (mimeType) {
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

export function readVoiceTranscriptionEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const enabled = environment.LEVIO_VOICE_TRANSCRIPTION_ENABLED;
  if (enabled !== "true") {
    return { enabled: false as const };
  }

  const provider = environment.LEVIO_VOICE_TRANSCRIPTION_PROVIDER;
  if (provider !== OPENAI_VOICE_TRANSCRIPTION_PROVIDER) {
    return { enabled: true as const, ready: false as const };
  }

  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { enabled: true as const, ready: false as const };
  }

  return {
    enabled: true as const,
    ready: true as const,
    apiKey,
    model:
      environment.LEVIO_VOICE_TRANSCRIPTION_MODEL?.trim() ||
      DEFAULT_OPENAI_VOICE_TRANSCRIPTION_MODEL,
  };
}

export function createOpenAIVoiceTranscriptionTransport(options: {
  apiKey: string;
  model: string;
}): VoiceTranscriptionTransport {
  const client = new OpenAI({
    apiKey: options.apiKey,
    maxRetries: 0,
  });

  return {
    async transcribe(input: VoiceTranscriptionTransportInput) {
      const providerFile = new File(
        [input.audio],
        `levio-voice.${extensionForMediaType(input.mimeType)}`,
        { type: input.mimeType },
      );
      const response = await client.audio.transcriptions.create(
        {
          file: providerFile,
          language: input.language,
          model: options.model,
          response_format: "json",
        },
        {
          signal: input.signal,
          timeout: input.timeoutMs,
        },
      );

      return { transcript: response.text };
    },
  };
}
