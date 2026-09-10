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

export function getBrowserSpeechRecognitionConstructor(
  browserWindow: object,
) {
  const speechRecognitionWindow = browserWindow as SpeechRecognitionWindow;
  return speechRecognitionWindow.SpeechRecognition ??
    speechRecognitionWindow.webkitSpeechRecognition ??
    null;
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
