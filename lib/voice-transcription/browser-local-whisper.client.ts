"use client";

import {
  createBrowserLocalWhisperAdapter as createCoreAdapter,
  type BrowserLocalWhisperAdapter,
  type BrowserLocalWhisperAudioContext,
  type BrowserLocalWhisperEnvironment,
  type BrowserLocalWhisperWorker,
} from "./browser-local-whisper-core.client";

type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function createBrowserEnvironment(): BrowserLocalWhisperEnvironment {
  if (typeof window === "undefined") {
    return {
      createAudioContext: null,
      createWorker: null,
      hasWebAssembly: false,
      hasWebGpu: false,
    };
  }

  const AudioContextConstructor = window.AudioContext ??
    (window as AudioContextWindow).webkitAudioContext ??
    null;
  return {
    createAudioContext: AudioContextConstructor
      ? () => new AudioContextConstructor() as BrowserLocalWhisperAudioContext
      : null,
    createWorker: typeof Worker === "function"
      ? () => new Worker(
          new URL("./browser-local-whisper.worker.ts", import.meta.url),
          { name: "levio-browser-local-whisper", type: "module" },
        ) as BrowserLocalWhisperWorker
      : null,
    hasWebAssembly: typeof WebAssembly === "object",
    hasWebGpu: "gpu" in navigator && Boolean(navigator.gpu),
  };
}

export function createBrowserLocalWhisperAdapter(): BrowserLocalWhisperAdapter {
  return createCoreAdapter(createBrowserEnvironment());
}

export type {
  BrowserLocalWhisperAdapter,
  BrowserLocalWhisperCapability,
  BrowserLocalWhisperInitializationResult,
  BrowserLocalWhisperSession,
  BrowserLocalWhisperSessionCreation,
  BrowserLocalWhisperSessionResult,
  BrowserLocalWhisperState,
} from "./browser-local-whisper-core.client";
