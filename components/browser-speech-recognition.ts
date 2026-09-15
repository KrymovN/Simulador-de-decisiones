import type { VoiceErrorCode } from "./home-simulator-voice";

export const BROWSER_SPEECH_RECOGNITION_LANGUAGE = "es-ES" as const;

export type BrowserSpeechRecognitionAlternative = {
  confidence: number;
  transcript: string;
};

export type BrowserSpeechRecognitionResult = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionAlternative;
};

export type BrowserSpeechRecognitionResultList = {
  readonly length: number;
  readonly [index: number]: BrowserSpeechRecognitionResult;
};

export type BrowserSpeechRecognitionEvent = Event & {
  readonly resultIndex: number;
  readonly results: BrowserSpeechRecognitionResultList;
};

export type BrowserSpeechRecognitionErrorEvent = Event & {
  readonly error: string;
};

export type BrowserSpeechRecognition = {
  abort(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: ((event: Event) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
};

export type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionWindow = {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

type BrowserNavigatorIdentity = {
  userAgent?: string;
};

export type SpeechRecognitionTranscriptState = {
  finalFragments: Map<number, string>;
  latestInterim: {
    index: number;
    transcript: string;
  } | null;
};

export function isIPhoneSafariBrowser(
  browserNavigator: BrowserNavigatorIdentity,
) {
  const userAgent = browserNavigator.userAgent ?? "";
  return /\biPhone\b/i.test(userAgent) &&
    /AppleWebKit/i.test(userAgent) &&
    /Version\/[\d.]+/i.test(userAgent) &&
    /Mobile\/[\w]+/i.test(userAgent) &&
    /Safari\/[\d.]+/i.test(userAgent) &&
    !/(?:CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA)\//i.test(userAgent);
}

export function isMacSafariBrowser(
  browserNavigator: BrowserNavigatorIdentity,
) {
  const userAgent = browserNavigator.userAgent ?? "";
  return /\bMacintosh\b/i.test(userAgent) &&
    /AppleWebKit/i.test(userAgent) &&
    /Version\/[\d.]+/i.test(userAgent) &&
    /Safari\/[\d.]+/i.test(userAgent) &&
    !/Mobile\/[\w]+/i.test(userAgent) &&
    !/(?:Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS)\//i.test(userAgent);
}

export function getBrowserSpeechRecognitionConstructor(
  browserWindow: object,
) {
  const speechRecognitionWindow = browserWindow as SpeechRecognitionWindow;
  return speechRecognitionWindow.SpeechRecognition ??
    speechRecognitionWindow.webkitSpeechRecognition ??
    null;
}

export function createSpeechRecognitionTranscriptState(): SpeechRecognitionTranscriptState {
  return {
    finalFragments: new Map(),
    latestInterim: null,
  };
}

export function collectSpeechRecognitionResults(
  event: BrowserSpeechRecognitionEvent,
  state: SpeechRecognitionTranscriptState,
) {
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result?.[0]?.transcript.trim() ?? "";
    if (result?.isFinal) {
      if (transcript) {
        state.finalFragments.set(index, transcript);
      }
      if (state.latestInterim?.index === index) {
        state.latestInterim = null;
      }
      continue;
    }

    if (transcript) {
      state.latestInterim = { index, transcript };
    }
  }
}

function normalizedTranscriptToken(token: string) {
  return token.toLocaleLowerCase("es").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function mergeSpeechRecognitionTranscripts(fragments: string[]) {
  let mergedWords: string[] = [];

  for (const fragment of fragments) {
    const fragmentWords = fragment.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
    if (fragmentWords.length === 0) {
      continue;
    }
    if (mergedWords.length === 0) {
      mergedWords = fragmentWords;
      continue;
    }

    let overlap = Math.min(mergedWords.length, fragmentWords.length);
    for (; overlap > 0; overlap -= 1) {
      const existingSuffix = mergedWords.slice(-overlap).map(normalizedTranscriptToken);
      const incomingPrefix = fragmentWords.slice(0, overlap).map(normalizedTranscriptToken);
      if (existingSuffix.every((token, index) => token === incomingPrefix[index])) {
        break;
      }
    }
    mergedWords.push(...fragmentWords.slice(overlap));
  }

  return mergedWords.join(" ");
}

export function buildSpeechRecognitionTranscript(
  state: SpeechRecognitionTranscriptState,
  includeLatestInterim: boolean,
  latestInterimReplacesSameSlot = false,
) {
  const transcriptSlots = [...state.finalFragments.entries()];
  if (includeLatestInterim && state.latestInterim) {
    const interimIndex = state.latestInterim.index;
    const existingSlotIndex = transcriptSlots.findIndex(([index]) => index === interimIndex);
    if (existingSlotIndex === -1) {
      transcriptSlots.push([interimIndex, state.latestInterim.transcript]);
    } else if (latestInterimReplacesSameSlot) {
      transcriptSlots[existingSlotIndex] = [interimIndex, state.latestInterim.transcript];
    }
  }

  const fragments = transcriptSlots
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, transcript]) => transcript);
  return mergeSpeechRecognitionTranscripts(fragments);
}

export function collectFinalSpeechRecognitionResults(
  event: BrowserSpeechRecognitionEvent,
  finalResults: Map<number, string>,
) {
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    if (!result?.isFinal) {
      continue;
    }

    const transcript = result[0]?.transcript.trim() ?? "";
    if (transcript) {
      finalResults.set(index, transcript);
    }
  }
}

export function joinFinalSpeechRecognitionResults(finalResults: Map<number, string>) {
  const seen = new Set<string>();
  return [...finalResults.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, transcript]) => transcript.trim())
    .filter((transcript) => {
      if (!transcript || seen.has(transcript)) {
        return false;
      }
      seen.add(transcript);
      return true;
    })
    .join(" ");
}

export function classifySpeechRecognitionError(error: string): VoiceErrorCode {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "MIC_PERMISSION_DENIED";
    case "audio-capture":
      return "MIC_NOT_AVAILABLE";
    case "no-speech":
      return "NO_SPEECH";
    case "aborted":
      return "RECOGNITION_ABORTED";
    default:
      return "RECOGNITION_FAILED";
  }
}
