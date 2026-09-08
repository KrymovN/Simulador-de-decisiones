"use client";

import {
  BROWSER_LOCAL_WHISPER_DTYPE,
  BROWSER_LOCAL_WHISPER_LANGUAGE,
  BROWSER_LOCAL_WHISPER_MODEL_ID,
  BROWSER_LOCAL_WHISPER_MODEL_REVISION,
  BROWSER_LOCAL_WHISPER_SAMPLE_RATE,
  type BrowserLocalWhisperBackend,
  type BrowserLocalWhisperFailureReason,
  type BrowserLocalWhisperWorkerRequest,
  type BrowserLocalWhisperWorkerResponse,
} from "./browser-local-whisper.protocol";

export type BrowserLocalWhisperState =
  | "unsupported"
  | "initializing"
  | "ready"
  | "transcribing"
  | "aborted"
  | "resource_unavailable"
  | "model_load_failed"
  | "transcription_failed";

export type BrowserLocalWhisperCapability = {
  backend: BrowserLocalWhisperBackend | null;
  localOnly: true;
  state: "ready" | "unsupported";
};

export type BrowserLocalWhisperInitializationResult =
  | { backend: BrowserLocalWhisperBackend; state: "ready" }
  | {
      backend: BrowserLocalWhisperBackend | null;
      reason: BrowserLocalWhisperFailureReason;
      state: "failed";
    };

export type BrowserLocalWhisperSessionResult =
  | {
      language: typeof BROWSER_LOCAL_WHISPER_LANGUAGE;
      status: "completed";
      transcript: string;
    }
  | {
      language: typeof BROWSER_LOCAL_WHISPER_LANGUAGE;
      reason: BrowserLocalWhisperFailureReason;
      status: "failed";
      transcript: null;
    };

export type BrowserLocalWhisperSession = {
  abort(): void;
  start(): Promise<BrowserLocalWhisperSessionResult>;
};

export type BrowserLocalWhisperSessionCreation =
  | { session: BrowserLocalWhisperSession; status: "ready" }
  | {
      reason: BrowserLocalWhisperFailureReason;
      session: null;
      status: "failed";
    };

export type BrowserLocalWhisperWorker = {
  onerror: ((event: unknown) => void) | null;
  onmessage: ((event: MessageEvent<BrowserLocalWhisperWorkerResponse>) => void) | null;
  postMessage(message: BrowserLocalWhisperWorkerRequest, transfer?: Transferable[]): void;
  terminate(): void;
};

export type BrowserLocalWhisperDecodedAudio = {
  getChannelData(channel: number): Float32Array;
  length: number;
  numberOfChannels: number;
  sampleRate: number;
};

export type BrowserLocalWhisperAudioContext = {
  close(): Promise<void>;
  decodeAudioData(audioData: ArrayBuffer): Promise<BrowserLocalWhisperDecodedAudio>;
};

export type BrowserLocalWhisperEnvironment = {
  createAudioContext: (() => BrowserLocalWhisperAudioContext) | null;
  createWorker: (() => BrowserLocalWhisperWorker) | null;
  hasWebAssembly: boolean;
  hasWebGpu: boolean;
};

export type BrowserLocalWhisperAdapter = {
  checkCapability(): BrowserLocalWhisperCapability;
  createSession(audio: Blob): BrowserLocalWhisperSessionCreation;
  dispose(): Promise<void>;
  getState(): BrowserLocalWhisperState;
  initialize(): Promise<BrowserLocalWhisperInitializationResult>;
};

function failedSession(
  reason: BrowserLocalWhisperFailureReason,
): BrowserLocalWhisperSessionResult {
  return {
    language: BROWSER_LOCAL_WHISPER_LANGUAGE,
    reason,
    status: "failed",
    transcript: null,
  };
}

function selectBackend(
  environment: BrowserLocalWhisperEnvironment,
): BrowserLocalWhisperBackend | null {
  if (!environment.createWorker || !environment.createAudioContext) {
    return null;
  }
  if (environment.hasWebGpu) {
    return "webgpu";
  }
  return environment.hasWebAssembly ? "wasm" : null;
}

function downmixAndResample(
  decoded: BrowserLocalWhisperDecodedAudio,
): Float32Array {
  if (
    !Number.isFinite(decoded.sampleRate) ||
    decoded.sampleRate <= 0 ||
    !Number.isInteger(decoded.numberOfChannels) ||
    decoded.numberOfChannels <= 0 ||
    !Number.isInteger(decoded.length) ||
    decoded.length <= 0
  ) {
    throw new Error("Invalid decoded audio metadata.");
  }

  const mono = new Float32Array(decoded.length);
  for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
    const samples = decoded.getChannelData(channel);
    if (samples.length < decoded.length) {
      mono.fill(0);
      throw new Error("Invalid decoded audio channel.");
    }
    for (let index = 0; index < decoded.length; index += 1) {
      mono[index] += samples[index] / decoded.numberOfChannels;
    }
  }

  if (decoded.sampleRate === BROWSER_LOCAL_WHISPER_SAMPLE_RATE) {
    return mono;
  }

  const outputLength = Math.max(
    1,
    Math.round(
      decoded.length * BROWSER_LOCAL_WHISPER_SAMPLE_RATE / decoded.sampleRate,
    ),
  );
  const resampled = new Float32Array(outputLength);
  const sourceStep = decoded.sampleRate / BROWSER_LOCAL_WHISPER_SAMPLE_RATE;
  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = Math.min(index * sourceStep, mono.length - 1);
    const left = Math.floor(sourcePosition);
    const right = Math.min(left + 1, mono.length - 1);
    const fraction = sourcePosition - left;
    resampled[index] = mono[left] + (mono[right] - mono[left]) * fraction;
  }
  mono.fill(0);
  return resampled;
}

export async function preprocessBrowserLocalWhisperAudio(
  audio: Blob,
  createAudioContext: () => BrowserLocalWhisperAudioContext,
): Promise<Float32Array> {
  if (audio.size <= 0 || (audio.type && !audio.type.startsWith("audio/"))) {
    throw new Error("Invalid audio Blob.");
  }

  const context = createAudioContext();
  let encodedBytes: Uint8Array | null = null;
  try {
    encodedBytes = new Uint8Array(await audio.arrayBuffer());
    const decodeBuffer = encodedBytes.slice().buffer as ArrayBuffer;
    const decoded = await context.decodeAudioData(decodeBuffer);
    return downmixAndResample(decoded);
  } finally {
    encodedBytes?.fill(0);
    await context.close().catch(() => undefined);
  }
}

export function createBrowserLocalWhisperAdapter(
  environment: BrowserLocalWhisperEnvironment,
): BrowserLocalWhisperAdapter {
  let state: BrowserLocalWhisperState = selectBackend(environment)
    ? "resource_unavailable"
    : "unsupported";
  let worker: BrowserLocalWhisperWorker | null = null;
  let backend: BrowserLocalWhisperBackend | null = null;
  let initialized = false;
  let disposed = false;
  let requestSequence = 0;
  let generationSequence = 0;
  let initializationPromise: Promise<BrowserLocalWhisperInitializationResult> | null = null;
  let initializationResolver:
    | ((result: BrowserLocalWhisperInitializationResult) => void)
    | null = null;
  let initializationRequestId: number | null = null;
  let disposeResolver: (() => void) | null = null;
  let disposeRequestId: number | null = null;
  let activeSession: {
    generation: number;
    settle(result: BrowserLocalWhisperSessionResult): void;
  } | null = null;

  const settleInitialization = (result: BrowserLocalWhisperInitializationResult) => {
    initializationResolver?.(result);
    initializationResolver = null;
    initializationRequestId = null;
  };

  const handleWorkerMessage = (event: MessageEvent<BrowserLocalWhisperWorkerResponse>) => {
    const message = event.data;
    if (
      message.type === "initialized" &&
      message.requestId === initializationRequestId
    ) {
      initialized = true;
      backend = message.backend;
      state = "ready";
      settleInitialization({ backend: message.backend, state: "ready" });
      return;
    }
    if (
      message.type === "failed" &&
      message.requestId === initializationRequestId
    ) {
      const reason = message.reason === "resource_unavailable"
        ? "resource_unavailable"
        : "model_load_failed";
      state = reason;
      settleInitialization({ backend, reason, state: "failed" });
      return;
    }
    if (message.type === "disposed" && message.requestId === disposeRequestId) {
      disposeResolver?.();
      disposeResolver = null;
      disposeRequestId = null;
      return;
    }
    if (
      (message.type === "transcribed" || message.type === "failed") &&
      typeof message.generation === "number" &&
      message.generation === activeSession?.generation
    ) {
      if (message.type === "transcribed") {
        const transcript = message.transcript.trim();
        activeSession.settle(
          transcript
            ? {
                language: BROWSER_LOCAL_WHISPER_LANGUAGE,
                status: "completed",
                transcript,
              }
            : failedSession("transcription_failed"),
        );
      } else {
        activeSession.settle(failedSession(message.reason));
      }
    }
  };

  const handleWorkerError = () => {
    if (initializationResolver) {
      state = "model_load_failed";
      settleInitialization({
        backend,
        reason: "model_load_failed",
        state: "failed",
      });
    }
    activeSession?.settle(failedSession("transcription_failed"));
  };

  const checkCapability = (): BrowserLocalWhisperCapability => {
    const selected = disposed ? null : selectBackend(environment);
    return {
      backend: selected,
      localOnly: true,
      state: selected ? "ready" : "unsupported",
    };
  };

  const initialize = () => {
    if (initialized && backend) {
      return Promise.resolve({ backend, state: "ready" as const });
    }
    if (initializationPromise) {
      return initializationPromise;
    }
    backend = selectBackend(environment);
    if (disposed || !backend || !environment.createWorker) {
      state = "unsupported";
      return Promise.resolve({
        backend: null,
        reason: "unsupported" as const,
        state: "failed" as const,
      });
    }

    state = "initializing";
    try {
      worker = environment.createWorker();
      worker.onmessage = handleWorkerMessage;
      worker.onerror = handleWorkerError;
    } catch {
      state = "resource_unavailable";
      return Promise.resolve({
        backend,
        reason: "resource_unavailable" as const,
        state: "failed" as const,
      });
    }

    initializationRequestId = ++requestSequence;
    initializationPromise = new Promise((resolve) => {
      initializationResolver = resolve;
    });
    try {
      worker.postMessage({
        backend: backend!,
        dtype: BROWSER_LOCAL_WHISPER_DTYPE,
        model: BROWSER_LOCAL_WHISPER_MODEL_ID,
        requestId: initializationRequestId!,
        revision: BROWSER_LOCAL_WHISPER_MODEL_REVISION,
        type: "initialize",
      });
    } catch {
      state = "resource_unavailable";
      settleInitialization({
        backend,
        reason: "resource_unavailable",
        state: "failed",
      });
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
      worker = null;
    }
    return initializationPromise;
  };

  const createSession = (audio: Blob): BrowserLocalWhisperSessionCreation => {
    if (
      disposed ||
      !initialized ||
      !worker ||
      !environment.createAudioContext
    ) {
      return {
        reason: "resource_unavailable",
        session: null,
        status: "failed",
      };
    }
    if (activeSession) {
      return {
        reason: "resource_unavailable",
        session: null,
        status: "failed",
      };
    }

    const generation = ++generationSequence;
    let started = false;
    let settled = false;
    let resolveResult!: (result: BrowserLocalWhisperSessionResult) => void;
    const resultPromise = new Promise<BrowserLocalWhisperSessionResult>((resolve) => {
      resolveResult = resolve;
    });
    const settle = (result: BrowserLocalWhisperSessionResult) => {
      if (settled) {
        return;
      }
      settled = true;
      if (activeSession?.generation === generation) {
        activeSession = null;
      }
      state = result.status === "completed"
        ? "ready"
        : result.reason;
      resolveResult(result);
    };
    activeSession = { generation, settle };

    const session: BrowserLocalWhisperSession = {
      abort() {
        if (settled) {
          return;
        }
        worker?.postMessage({ generation, type: "abort" });
        settle(failedSession("aborted"));
      },
      async start() {
        if (started) {
          return resultPromise;
        }
        started = true;
        if (settled) {
          return resultPromise;
        }
        state = "transcribing";
        let samples: Float32Array | null = null;
        try {
          samples = await preprocessBrowserLocalWhisperAudio(
            audio,
            environment.createAudioContext!,
          );
          if (settled || activeSession?.generation !== generation) {
            samples.fill(0);
            return resultPromise;
          }
          const audioBuffer = samples.buffer as ArrayBuffer;
          worker?.postMessage(
            {
              audio: audioBuffer,
              generation,
              language: BROWSER_LOCAL_WHISPER_LANGUAGE,
              sampleRate: BROWSER_LOCAL_WHISPER_SAMPLE_RATE,
              type: "transcribe",
            },
            [audioBuffer],
          );
          samples = null;
        } catch {
          samples?.fill(0);
          settle(failedSession("resource_unavailable"));
        }
        return resultPromise;
      },
    };

    return { session, status: "ready" };
  };

  const dispose = async () => {
    if (disposed) {
      return;
    }
    disposed = true;
    activeSession?.settle(failedSession("aborted"));
    initialized = false;
    if (initializationResolver) {
      settleInitialization({
        backend,
        reason: "resource_unavailable",
        state: "failed",
      });
    }
    initializationPromise = null;
    if (worker) {
      let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
      try {
        disposeRequestId = ++requestSequence;
        const disposedByWorker = new Promise<void>((resolve) => {
          disposeResolver = resolve;
        });
        worker.postMessage({ requestId: disposeRequestId, type: "dispose" });
        const cleanupDeadline = new Promise<void>((resolve) => {
          cleanupTimer = setTimeout(resolve, 500);
        });
        await Promise.race([
          disposedByWorker,
          cleanupDeadline,
        ]);
      } catch {
        // Worker termination below remains the deterministic cleanup boundary.
      } finally {
        if (cleanupTimer !== null) {
          clearTimeout(cleanupTimer);
        }
        disposeResolver = null;
        disposeRequestId = null;
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
        worker = null;
      }
    }
    state = "resource_unavailable";
  };

  return {
    checkCapability,
    createSession,
    dispose,
    getState: () => state,
    initialize,
  };
}
