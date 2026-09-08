import { env, pipeline } from "@huggingface/transformers";

import {
  BROWSER_LOCAL_WHISPER_DTYPE,
  BROWSER_LOCAL_WHISPER_LANGUAGE,
  BROWSER_LOCAL_WHISPER_MODEL_ID,
  BROWSER_LOCAL_WHISPER_MODEL_REVISION,
  BROWSER_LOCAL_WHISPER_SAMPLE_RATE,
  isAllowedWhisperAssetRequest,
  type BrowserLocalWhisperBackend,
  type BrowserLocalWhisperWorkerRequest,
  type BrowserLocalWhisperWorkerResponse,
} from "./browser-local-whisper.protocol";

type WorkerScope = {
  location: Location;
  onmessage: ((event: MessageEvent<BrowserLocalWhisperWorkerRequest>) => void) | null;
  postMessage(message: BrowserLocalWhisperWorkerResponse): void;
};

type LocalTranscriber = {
  (audio: Float32Array, options: {
    language: typeof BROWSER_LOCAL_WHISPER_LANGUAGE;
    task: "transcribe";
  }): Promise<{ text?: unknown }>;
  dispose(): Promise<void>;
};

const workerScope = self as unknown as WorkerScope;
const runtimeEnvironment = env as typeof env & { fetch: typeof fetch };
const browserFetch = fetch.bind(self);
runtimeEnvironment.allowLocalModels = false;
runtimeEnvironment.allowRemoteModels = true;
runtimeEnvironment.useBrowserCache = true;
runtimeEnvironment.fetch = async (input, init) => {
  const request = input instanceof Request ? input : new Request(input, init);
  if (!isAllowedWhisperAssetRequest(
    request.url,
    request.method,
    workerScope.location.origin,
  )) {
    throw new Error("Non-static runtime request rejected.");
  }
  return browserFetch(request);
};

let transcriber: LocalTranscriber | null = null;
let backend: BrowserLocalWhisperBackend | null = null;
let activeGeneration: number | null = null;
let activeAudio: Float32Array | null = null;
let inferenceQueue = Promise.resolve();

function respond(message: BrowserLocalWhisperWorkerResponse) {
  workerScope.postMessage(message);
}

async function initialize(
  request: Extract<BrowserLocalWhisperWorkerRequest, { type: "initialize" }>,
) {
  if (
    request.model !== BROWSER_LOCAL_WHISPER_MODEL_ID ||
    request.revision !== BROWSER_LOCAL_WHISPER_MODEL_REVISION ||
    request.dtype !== BROWSER_LOCAL_WHISPER_DTYPE
  ) {
    respond({
      reason: "resource_unavailable",
      requestId: request.requestId,
      type: "failed",
    });
    return;
  }

  try {
    transcriber = await pipeline(
      "automatic-speech-recognition",
      BROWSER_LOCAL_WHISPER_MODEL_ID,
      {
        device: request.backend,
        dtype: BROWSER_LOCAL_WHISPER_DTYPE,
        revision: BROWSER_LOCAL_WHISPER_MODEL_REVISION,
      },
    ) as unknown as LocalTranscriber;
    backend = request.backend;
    respond({ backend, requestId: request.requestId, type: "initialized" });
  } catch {
    transcriber = null;
    backend = null;
    respond({
      reason: "model_load_failed",
      requestId: request.requestId,
      type: "failed",
    });
  }
}

async function transcribe(
  request: Extract<BrowserLocalWhisperWorkerRequest, { type: "transcribe" }>,
) {
  if (
    !transcriber ||
    !backend ||
    request.language !== BROWSER_LOCAL_WHISPER_LANGUAGE ||
    request.sampleRate !== BROWSER_LOCAL_WHISPER_SAMPLE_RATE
  ) {
    respond({
      generation: request.generation,
      reason: "resource_unavailable",
      type: "failed",
    });
    return;
  }

  const audio = new Float32Array(request.audio);
  activeGeneration = request.generation;
  activeAudio = audio;
  try {
    const output = await transcriber(audio, {
      language: BROWSER_LOCAL_WHISPER_LANGUAGE,
      task: "transcribe",
    });
    if (activeGeneration !== request.generation) {
      return;
    }
    const transcript = typeof output?.text === "string" ? output.text.trim() : "";
    if (!transcript) {
      respond({
        generation: request.generation,
        reason: "transcription_failed",
        type: "failed",
      });
      return;
    }
    respond({ generation: request.generation, transcript, type: "transcribed" });
  } catch {
    if (activeGeneration === request.generation) {
      respond({
        generation: request.generation,
        reason: "transcription_failed",
        type: "failed",
      });
    }
  } finally {
    audio.fill(0);
    if (activeGeneration === request.generation) {
      activeGeneration = null;
      activeAudio = null;
    }
  }
}

async function dispose(requestId: number) {
  activeGeneration = null;
  activeAudio?.fill(0);
  activeAudio = null;
  try {
    await transcriber?.dispose();
  } catch {
    // Terminating the worker remains the final deterministic cleanup boundary.
  }
  transcriber = null;
  backend = null;
  respond({ requestId, type: "disposed" });
}

workerScope.onmessage = (event) => {
  const request = event.data;
  switch (request.type) {
    case "initialize":
      void initialize(request);
      break;
    case "transcribe":
      inferenceQueue = inferenceQueue.then(() => transcribe(request));
      break;
    case "abort":
      if (activeGeneration === request.generation) {
        activeGeneration = null;
        activeAudio?.fill(0);
        activeAudio = null;
      }
      respond({ generation: request.generation, type: "aborted" });
      break;
    case "dispose":
      void dispose(request.requestId);
      break;
  }
};
