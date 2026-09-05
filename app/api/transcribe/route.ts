import {
  createOpenAIVoiceTranscriptionTransport,
  readVoiceTranscriptionEnvironment,
} from "../../../lib/voice-transcription/openai-transcription-adapter.server";
import {
  createVoiceTranscriptionRequestHandler,
  defaultVoiceTranscriptionRateLimiter,
} from "../../../lib/voice-transcription/route-handler";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const environment = readVoiceTranscriptionEnvironment();
  const transport = environment.enabled && environment.ready
    ? createOpenAIVoiceTranscriptionTransport({
        apiKey: environment.apiKey,
        model: environment.model,
      })
    : null;

  return createVoiceTranscriptionRequestHandler({
    rateLimiter: defaultVoiceTranscriptionRateLimiter,
    transport,
  })(req);
}
