"use client";

export const NATIVE_LOCAL_STT_LANGUAGE = "es-ES" as const;
export const NATIVE_LOCAL_STT_NO_RESULT_TIMEOUT_MS = 15_000;

export type NativeLocalSttCapabilityState =
  | "unsupported"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available"
  | "error";

export type NativeLocalSttFailureReason =
  | "unsupported"
  | "language_pack_unavailable"
  | "language_pack_install_failed"
  | "permission_denied"
  | "microphone_unavailable"
  | "aborted"
  | "recognition_timeout"
  | "recognition_failed";

export type NativeLocalSttCapability = {
  language: typeof NATIVE_LOCAL_STT_LANGUAGE;
  localOnly: true;
  reason: NativeLocalSttFailureReason | null;
  state: NativeLocalSttCapabilityState;
};

export type NativeLocalSttSessionResult =
  | {
      language: typeof NATIVE_LOCAL_STT_LANGUAGE;
      status: "completed";
      transcript: string;
    }
  | {
      language: typeof NATIVE_LOCAL_STT_LANGUAGE;
      reason: NativeLocalSttFailureReason;
      status: "failed";
      transcript: null;
    };

type NativeAvailability =
  | "unsupported"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

type NativeSpeechRecognitionOptions = {
  langs: [typeof NATIVE_LOCAL_STT_LANGUAGE];
  processLocally: true;
  quality?: "dictation";
};

type NativeSpeechRecognitionAlternative = {
  transcript?: unknown;
};

type NativeSpeechRecognitionResult = {
  0?: NativeSpeechRecognitionAlternative;
  isFinal?: unknown;
};

type NativeSpeechRecognitionResultList = {
  [index: number]: NativeSpeechRecognitionResult | undefined;
  length: number;
};

type NativeSpeechRecognitionResultEvent = {
  resultIndex?: unknown;
  results?: NativeSpeechRecognitionResultList;
};

type NativeSpeechRecognitionErrorEvent = {
  error?: unknown;
};

export type NativeSpeechRecognition = {
  abort(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: NativeSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: NativeSpeechRecognitionResultEvent) => void) | null;
  processLocally: boolean;
  start(): void;
};

export type NativeSpeechRecognitionConstructor = {
  new(): NativeSpeechRecognition;
  available(options: NativeSpeechRecognitionOptions): Promise<unknown>;
  install(options: NativeSpeechRecognitionOptions): Promise<boolean>;
  prototype: object;
};

export type NativeLocalSttEnvironment = {
  recognition: NativeSpeechRecognitionConstructor | null;
  supportsDictationQuality: boolean;
};

export type NativeLocalSttSession = {
  abort(): void;
  start(): Promise<NativeLocalSttSessionResult>;
};

export type NativeLocalSttSessionCreation =
  | { session: NativeLocalSttSession; status: "ready" }
  | { reason: NativeLocalSttFailureReason; session: null; status: "failed" };

export type NativeLocalSttAdapter = {
  checkAvailability(): Promise<NativeLocalSttCapability>;
  createSession(): NativeLocalSttSessionCreation;
  installLanguagePack(): Promise<NativeLocalSttCapability>;
};

type SpeechRecognitionWindow = Window & typeof globalThis & {
  SpeechRecognition?: NativeSpeechRecognitionConstructor;
};

function capability(
  state: NativeLocalSttCapabilityState,
  reason: NativeLocalSttFailureReason | null = null,
): NativeLocalSttCapability {
  return {
    language: NATIVE_LOCAL_STT_LANGUAGE,
    localOnly: true,
    reason,
    state,
  };
}

function failedSession(reason: NativeLocalSttFailureReason): NativeLocalSttSessionResult {
  return {
    language: NATIVE_LOCAL_STT_LANGUAGE,
    reason,
    status: "failed",
    transcript: null,
  };
}

function isLocalRecognitionConstructor(
  value: NativeSpeechRecognitionConstructor | null,
): value is NativeSpeechRecognitionConstructor {
  return Boolean(
    value &&
      typeof value === "function" &&
      "processLocally" in value.prototype &&
      typeof value.available === "function" &&
      typeof value.install === "function",
  );
}

function availabilityOptions(supportsDictationQuality: boolean): NativeSpeechRecognitionOptions {
  return {
    langs: [NATIVE_LOCAL_STT_LANGUAGE],
    processLocally: true,
    ...(supportsDictationQuality ? { quality: "dictation" as const } : {}),
  };
}

function normalizeAvailability(value: unknown): NativeAvailability | null {
  switch (value) {
    case "unsupported":
    case "unavailable":
    case "downloadable":
    case "downloading":
    case "available":
      return value;
    default:
      return null;
  }
}

function capabilityForAvailability(value: NativeAvailability): NativeLocalSttCapability {
  if (value === "unsupported") {
    return capability("unsupported", "unsupported");
  }
  if (value === "unavailable") {
    return capability("unavailable", "language_pack_unavailable");
  }
  return capability(value);
}

function normalizeRecognitionFailure(value: unknown): NativeLocalSttFailureReason {
  const code = typeof value === "string"
    ? value
    : value instanceof DOMException
      ? value.name
      : typeof value === "object" && value !== null && "name" in value
        ? String((value as { name?: unknown }).name ?? "")
        : "";

  switch (code) {
    case "aborted":
    case "AbortError":
      return "aborted";
    case "not-allowed":
    case "service-not-allowed":
    case "NotAllowedError":
    case "SecurityError":
      return "permission_denied";
    case "audio-capture":
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "microphone_unavailable";
    case "language-not-supported":
    case "language-unavailable":
      return "language_pack_unavailable";
    default:
      return "recognition_failed";
  }
}

export function getBrowserNativeLocalSttEnvironment(): NativeLocalSttEnvironment {
  if (typeof window === "undefined") {
    return { recognition: null, supportsDictationQuality: false };
  }

  const recognition = (window as SpeechRecognitionWindow).SpeechRecognition ?? null;
  return {
    recognition,
    // SpeechRecognitionOptions is a Web IDL dictionary, so older engines silently
    // ignore unknown `quality` members. Keep this false until a browser exposes a
    // reliable runtime signal or a reviewed integration supplies explicit evidence.
    supportsDictationQuality: false,
  };
}

export function createNativeLocalSttAdapter(
  environment: NativeLocalSttEnvironment = getBrowserNativeLocalSttEnvironment(),
): NativeLocalSttAdapter {
  const Recognition = environment.recognition;
  let lastCapability = isLocalRecognitionConstructor(Recognition)
    ? capability("unavailable", "language_pack_unavailable")
    : capability("unsupported", "unsupported");
  let sessionGeneration = 0;
  let activeSessionGeneration: number | null = null;

  const checkAvailability = async () => {
    if (!isLocalRecognitionConstructor(Recognition)) {
      lastCapability = capability("unsupported", "unsupported");
      return lastCapability;
    }

    try {
      const nativeState = normalizeAvailability(
        await Recognition.available(availabilityOptions(environment.supportsDictationQuality)),
      );
      lastCapability = nativeState
        ? capabilityForAvailability(nativeState)
        : capability("error", "recognition_failed");
    } catch {
      lastCapability = capability("error", "recognition_failed");
    }
    return lastCapability;
  };

  const installLanguagePack = async () => {
    const currentCapability = await checkAvailability();
    if (currentCapability.state !== "downloadable") {
      return currentCapability;
    }
    if (!isLocalRecognitionConstructor(Recognition)) {
      lastCapability = capability("unsupported", "unsupported");
      return lastCapability;
    }

    try {
      const installed = await Recognition.install(
        availabilityOptions(environment.supportsDictationQuality),
      );
      if (!installed) {
        lastCapability = capability("error", "language_pack_install_failed");
        return lastCapability;
      }
      return checkAvailability();
    } catch {
      lastCapability = capability("error", "language_pack_install_failed");
      return lastCapability;
    }
  };

  const createSession = (): NativeLocalSttSessionCreation => {
    if (!isLocalRecognitionConstructor(Recognition)) {
      return { reason: "unsupported", session: null, status: "failed" };
    }
    if (lastCapability.state !== "available") {
      return {
        reason: lastCapability.reason ?? "language_pack_unavailable",
        session: null,
        status: "failed",
      };
    }
    if (activeSessionGeneration !== null) {
      return { reason: "recognition_failed", session: null, status: "failed" };
    }

    let recognition: NativeSpeechRecognition;
    try {
      recognition = new Recognition();
      recognition.lang = NATIVE_LOCAL_STT_LANGUAGE;
      recognition.processLocally = true;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
    } catch {
      return { reason: "recognition_failed", session: null, status: "failed" };
    }
    const generation = ++sessionGeneration;
    activeSessionGeneration = generation;
    let started = false;
    let settled = false;
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
    const finalTranscripts: string[] = [];
    let resolveResult!: (result: NativeLocalSttSessionResult) => void;
    const resultPromise = new Promise<NativeLocalSttSessionResult>((resolve) => {
      resolveResult = resolve;
    });

    const isCurrent = () => generation === sessionGeneration;
    const clearWatchdog = () => {
      if (watchdogTimer === null) {
        return;
      }
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    };
    const settle = (result: NativeLocalSttSessionResult) => {
      if (settled) {
        return;
      }
      settled = true;
      clearWatchdog();
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      if (isCurrent()) {
        sessionGeneration += 1;
      }
      if (activeSessionGeneration === generation) {
        activeSessionGeneration = null;
      }
      resolveResult(result);
    };

    recognition.onresult = (event) => {
      if (!isCurrent() || settled || !event.results) {
        return;
      }
      const startIndex = Number.isInteger(event.resultIndex)
        ? Number(event.resultIndex)
        : 0;
      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result || result.isFinal !== true) {
          continue;
        }
        const transcript = typeof result[0]?.transcript === "string"
          ? result[0].transcript.trim()
          : "";
        if (transcript) {
          finalTranscripts.push(transcript);
        }
      }
      const transcript = finalTranscripts.join(" ").trim();
      if (transcript) {
        settle({
          language: NATIVE_LOCAL_STT_LANGUAGE,
          status: "completed",
          transcript,
        });
      }
    };

    recognition.onerror = (event) => {
      if (!isCurrent() || settled) {
        return;
      }
      settle(failedSession(normalizeRecognitionFailure(event.error)));
    };

    recognition.onend = () => {
      if (!isCurrent() || settled) {
        return;
      }
      const transcript = finalTranscripts.join(" ").trim();
      settle(
        transcript
          ? {
              language: NATIVE_LOCAL_STT_LANGUAGE,
              status: "completed",
              transcript,
            }
          : failedSession("recognition_failed"),
      );
    };

    const session: NativeLocalSttSession = {
      abort() {
        if (settled) {
          return;
        }
        if (isCurrent()) {
          sessionGeneration += 1;
        }
        try {
          recognition.abort();
        } catch {
          // The session still settles with the bounded aborted result below.
        }
        settle(failedSession("aborted"));
      },
      start() {
        if (started) {
          return resultPromise;
        }
        started = true;
        if (settled) {
          return resultPromise;
        }
        try {
          recognition.start();
        } catch (error) {
          settle(failedSession(normalizeRecognitionFailure(error)));
        }
        if (!settled) {
          watchdogTimer = setTimeout(() => {
            if (!isCurrent() || settled) {
              return;
            }
            sessionGeneration += 1;
            try {
              recognition.abort();
            } catch {
              // The timeout still settles with the bounded local failure below.
            }
            settle(failedSession("recognition_timeout"));
          }, NATIVE_LOCAL_STT_NO_RESULT_TIMEOUT_MS);
        }
        return resultPromise;
      },
    };

    return { session, status: "ready" };
  };

  return {
    checkAvailability,
    createSession,
    installLanguagePack,
  };
}
