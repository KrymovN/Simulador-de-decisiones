export const BROWSER_LOCAL_WHISPER_LANGUAGE = "spanish" as const;
export const BROWSER_LOCAL_WHISPER_SAMPLE_RATE = 16_000;
export const BROWSER_LOCAL_WHISPER_MODEL_ID = "onnx-community/whisper-tiny" as const;
export const BROWSER_LOCAL_WHISPER_MODEL_REVISION =
  "ff4177021cc41f7db950912b73ea4fdf7d01d8e7" as const;
export const BROWSER_LOCAL_WHISPER_DTYPE = "q4" as const;
export const BROWSER_LOCAL_WHISPER_TRANSFORMERS_VERSION = "4.2.0" as const;
export const BROWSER_LOCAL_WHISPER_ONNX_RUNTIME_VERSION =
  "1.26.0-dev.20260416-b7804b056c" as const;
export const BROWSER_LOCAL_WHISPER_ESTIMATED_ASSET_BYTES = 101_000_000;

export type BrowserLocalWhisperBackend = "webgpu" | "wasm";

export type BrowserLocalWhisperFailureReason =
  | "unsupported"
  | "aborted"
  | "resource_unavailable"
  | "model_load_failed"
  | "transcription_failed";

export type BrowserLocalWhisperWorkerRequest =
  | {
      backend: BrowserLocalWhisperBackend;
      dtype: typeof BROWSER_LOCAL_WHISPER_DTYPE;
      model: typeof BROWSER_LOCAL_WHISPER_MODEL_ID;
      requestId: number;
      revision: typeof BROWSER_LOCAL_WHISPER_MODEL_REVISION;
      type: "initialize";
    }
  | {
      audio: ArrayBuffer;
      generation: number;
      language: typeof BROWSER_LOCAL_WHISPER_LANGUAGE;
      sampleRate: typeof BROWSER_LOCAL_WHISPER_SAMPLE_RATE;
      type: "transcribe";
    }
  | { generation: number; type: "abort" }
  | { requestId: number; type: "dispose" };

export type BrowserLocalWhisperWorkerResponse =
  | {
      backend: BrowserLocalWhisperBackend;
      requestId: number;
      type: "initialized";
    }
  | {
      generation: number;
      transcript: string;
      type: "transcribed";
    }
  | {
      generation?: number;
      reason: BrowserLocalWhisperFailureReason;
      requestId?: number;
      type: "failed";
    }
  | { generation: number; type: "aborted" }
  | { requestId: number; type: "disposed" };

export type BrowserLocalWhisperResolvedAssetRequest = {
  normalized: boolean;
  url: string;
};

export function isAllowedWhisperAssetRequest(
  rawUrl: string,
  method: string,
  applicationOrigin: string,
): boolean {
  if (method.toUpperCase() !== "GET") {
    return false;
  }

  let url: URL;
  try {
    url = new URL(rawUrl, applicationOrigin);
  } catch {
    return false;
  }

  if (url.origin === applicationOrigin) {
    return !url.pathname.startsWith("/api/");
  }

  const pinnedModelPrefix =
    `/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/${BROWSER_LOCAL_WHISPER_MODEL_REVISION}/`;
  if (url.origin === "https://huggingface.co") {
    return url.pathname.startsWith(pinnedModelPrefix);
  }

  if (url.origin !== "https://cdn.jsdelivr.net") {
    return false;
  }

  return url.pathname.startsWith(
    `/npm/@huggingface/transformers@${BROWSER_LOCAL_WHISPER_TRANSFORMERS_VERSION}/`,
  ) || url.pathname.startsWith(
    `/npm/onnxruntime-web@${BROWSER_LOCAL_WHISPER_ONNX_RUNTIME_VERSION}/`,
  );
}

export function resolveWhisperAssetRequest(
  rawUrl: string,
  method: string,
  applicationOrigin: string,
): BrowserLocalWhisperResolvedAssetRequest | null {
  if (method.toUpperCase() !== "GET") {
    return null;
  }

  let url: URL;
  try {
    url = new URL(rawUrl, applicationOrigin);
  } catch {
    return null;
  }

  const mutableModelPrefix =
    `/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/main/`;
  if (
    url.origin === "https://huggingface.co" &&
    url.pathname.startsWith(mutableModelPrefix)
  ) {
    const suffix = url.pathname.slice(mutableModelPrefix.length);
    url.pathname =
      `/${BROWSER_LOCAL_WHISPER_MODEL_ID}/resolve/` +
      `${BROWSER_LOCAL_WHISPER_MODEL_REVISION}/${suffix}`;
    return isAllowedWhisperAssetRequest(url.href, method, applicationOrigin)
      ? { normalized: true, url: url.href }
      : null;
  }

  return isAllowedWhisperAssetRequest(url.href, method, applicationOrigin)
    ? { normalized: false, url: url.href }
    : null;
}
