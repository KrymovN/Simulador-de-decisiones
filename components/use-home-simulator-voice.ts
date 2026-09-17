"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  BROWSER_SPEECH_RECOGNITION_LANGUAGE,
  buildSpeechRecognitionTranscript,
  classifySpeechRecognitionError,
  collectSpeechRecognitionResults,
  createSpeechRecognitionTranscriptState,
  getBrowserSpeechRecognitionConstructor,
  isAndroidChromiumBrowser,
  isMacSafariBrowser,
  joinAndroidChromiumFinalSpeechRecognitionResults,
  joinFinalSpeechRecognitionResults,
  type BrowserSpeechRecognition,
  type BrowserSpeechRecognitionEvent,
  type SpeechRecognitionTranscriptState,
} from "./browser-speech-recognition";
import {
  advanceVoiceWaveformHistory,
  calculateVoiceAudioLevel,
  createVoiceWaveformLevels,
  VOICE_MAX_RECORDING_MS,
  type VoiceErrorCode,
  type VoicePhase,
  voiceErrorMessage,
} from "./home-simulator-voice";

type VoiceSession = {
  androidChromiumCumulativeResults: boolean;
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  audioLevel: number;
  audioSource: MediaStreamAudioSourceNode | null;
  cancelled: boolean;
  completedSegments: string[];
  continuationTimer: ReturnType<typeof setTimeout> | null;
  elapsedTimer: ReturnType<typeof setInterval> | null;
  failed: boolean;
  finalizationTimer: ReturnType<typeof setTimeout> | null;
  id: number;
  limitTimer: ReturnType<typeof setTimeout> | null;
  recognition: BrowserSpeechRecognition;
  receivedResult: boolean;
  safariMacInterimSnapshot: boolean;
  segmentEnded: boolean;
  segmentGeneration: number;
  startedAt: number | null;
  stopRequested: boolean;
  tailGraceTimer: ReturnType<typeof setTimeout> | null;
  terminalReason: "manual" | "limit" | "cancel" | "error" | "cleanup" | null;
  transcriptState: SpeechRecognitionTranscriptState;
  visualFrame: number | null;
  visualStream: MediaStream | null;
  waveformHistory: number[];
  waveformSampleAt: number;
};

type UseHomeSimulatorVoiceOptions = {
  onMessage(message: string): void;
  onTranscript(transcript: string): void;
};

type AndroidVoiceActivity = "inactive" | "listening" | "speechActive" | "betweenSegments";

function clearSessionTimers(session: VoiceSession) {
  if (session.continuationTimer !== null) {
    clearTimeout(session.continuationTimer);
    session.continuationTimer = null;
  }
  if (session.elapsedTimer !== null) {
    clearInterval(session.elapsedTimer);
    session.elapsedTimer = null;
  }
  if (session.limitTimer !== null) {
    clearTimeout(session.limitTimer);
    session.limitTimer = null;
  }
  if (session.finalizationTimer !== null) {
    clearTimeout(session.finalizationTimer);
    session.finalizationTimer = null;
  }
  if (session.tailGraceTimer !== null) {
    clearTimeout(session.tailGraceTimer);
    session.tailGraceTimer = null;
  }
}

function detachRecognitionHandlers(recognition: BrowserSpeechRecognition) {
  recognition.onaudioend = null;
  recognition.onaudiostart = null;
  recognition.onstart = null;
  recognition.onsoundend = null;
  recognition.onsoundstart = null;
  recognition.onspeechend = null;
  recognition.onspeechstart = null;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;
}

const EMPTY_WAVEFORM_LEVELS = createVoiceWaveformLevels(0);
const VOICE_RECOGNITION_FINALIZATION_MS = 1200;
const VOICE_RECOGNITION_SAFARI_MAC_TAIL_GRACE_MS = 700;
const VOICE_WAVEFORM_SAMPLE_INTERVAL_MS = 45;

function cleanupVisualAudio(session: VoiceSession) {
  if (session.visualFrame !== null) {
    cancelAnimationFrame(session.visualFrame);
    session.visualFrame = null;
  }
  session.audioSource?.disconnect();
  session.audioSource = null;
  session.analyser?.disconnect();
  session.analyser = null;
  session.visualStream?.getTracks().forEach((track) => track.stop());
  session.visualStream = null;
  if (session.audioContext) {
    void session.audioContext.close().catch(() => undefined);
    session.audioContext = null;
  }
  session.audioLevel = 0;
  session.waveformHistory = [...EMPTY_WAVEFORM_LEVELS];
  session.waveformSampleAt = 0;
}

export function useHomeSimulatorVoice(options: UseHomeSimulatorVoiceOptions) {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [androidVoiceActivity, setAndroidVoiceActivity] = useState<AndroidVoiceActivity>("inactive");
  const [androidResultPulse, setAndroidResultPulse] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>([
    ...EMPTY_WAVEFORM_LEVELS,
  ]);
  const sessionRef = useRef<VoiceSession | null>(null);
  const nextSessionIdRef = useRef(0);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(options.onMessage);
  const onTranscriptRef = useRef(options.onTranscript);

  onMessageRef.current = options.onMessage;
  onTranscriptRef.current = options.onTranscript;

  const startVisualAudio = useCallback(async (session: VoiceSession) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      if (!mountedRef.current || sessionRef.current?.id !== session.id) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      session.visualStream = stream;
      const audioContext = new AudioContext();
      session.audioContext = audioContext;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.24;
      source.connect(analyser);
      session.analyser = analyser;
      session.audioSource = source;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      if (!mountedRef.current || sessionRef.current?.id !== session.id) {
        cleanupVisualAudio(session);
        return;
      }

      const samples = new Uint8Array(analyser.fftSize);
      const updateWaveform = (timestamp: number) => {
        if (!mountedRef.current || sessionRef.current?.id !== session.id) {
          cleanupVisualAudio(session);
          return;
        }

        if (
          session.waveformSampleAt === 0 ||
          timestamp - session.waveformSampleAt >= VOICE_WAVEFORM_SAMPLE_INTERVAL_MS
        ) {
          analyser.getByteTimeDomainData(samples);
          const measuredLevel = calculateVoiceAudioLevel(samples);
          const smoothing = measuredLevel > session.audioLevel ? 0.78 : 0.24;
          session.audioLevel += (measuredLevel - session.audioLevel) * smoothing;
          session.waveformHistory = advanceVoiceWaveformHistory(
            session.waveformHistory,
            session.audioLevel,
          );
          session.waveformSampleAt = timestamp;
          setWaveformLevels([...session.waveformHistory]);
        }

        session.visualFrame = requestAnimationFrame(updateWaveform);
      };
      session.visualFrame = requestAnimationFrame(updateWaveform);
    } catch {
      cleanupVisualAudio(session);
      if (mountedRef.current && sessionRef.current?.id === session.id) {
        setWaveformLevels([...EMPTY_WAVEFORM_LEVELS]);
      }
    }
  }, []);

  const releaseSession = useCallback((session: VoiceSession) => {
    clearSessionTimers(session);
    cleanupVisualAudio(session);
    detachRecognitionHandlers(session.recognition);
    if (sessionRef.current?.id === session.id) {
      sessionRef.current = null;
    }
    if (mountedRef.current) {
      setAndroidVoiceActivity("inactive");
      setAndroidResultPulse(0);
      setWaveformLevels([...EMPTY_WAVEFORM_LEVELS]);
    }
  }, []);

  const setFailure = useCallback((code: VoiceErrorCode, session?: VoiceSession | null) => {
    const activeSession = session ?? sessionRef.current;
    if (activeSession) {
      activeSession.failed = true;
      activeSession.terminalReason = "error";
      releaseSession(activeSession);
      try {
        activeSession.recognition.abort();
      } catch {
        // The browser may already have ended the recognition session.
      }
      activeSession.transcriptState.finalFragments.clear();
      activeSession.transcriptState.latestInterim = null;
      activeSession.completedSegments.length = 0;
    }

    if (mountedRef.current) {
      setErrorCode(code);
      setElapsedSeconds(0);
      setPhase("error");
      onMessageRef.current(voiceErrorMessage(code));
    }
  }, [releaseSession]);

  const completeSession = useCallback((session: VoiceSession) => {
    if (
      !mountedRef.current ||
      session.cancelled ||
      session.failed ||
      sessionRef.current?.id !== session.id
    ) {
      return;
    }

    const currentAndroidSegment = session.androidChromiumCumulativeResults && !session.segmentEnded
      ? joinAndroidChromiumFinalSpeechRecognitionResults(
        session.transcriptState.finalFragments,
      )
      : "";
    const transcript = session.safariMacInterimSnapshot
      ? buildSpeechRecognitionTranscript(session.transcriptState, true, true)
      : session.androidChromiumCumulativeResults
        ? [...session.completedSegments, currentAndroidSegment].filter(Boolean).join(" ")
        : joinFinalSpeechRecognitionResults(session.transcriptState.finalFragments);
    const receivedResult = session.receivedResult;
    releaseSession(session);
    session.transcriptState.finalFragments.clear();
    session.transcriptState.latestInterim = null;
    session.completedSegments.length = 0;

    if (!transcript) {
      setFailure(receivedResult ? "NO_SPEECH" : "RECOGNITION_NO_RESULT");
      return;
    }

    onTranscriptRef.current(transcript);
    setErrorCode(null);
    setElapsedSeconds(0);
    setPhase("completed");
    onMessageRef.current("Dictado añadido. Revisa el texto antes de simular.");
  }, [releaseSession, setFailure]);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (
      !session ||
      session.cancelled ||
      session.failed ||
      session.stopRequested
    ) {
      return;
    }

    clearSessionTimers(session);
    session.stopRequested = true;
    session.terminalReason ??= "manual";
    if (session.androidChromiumCumulativeResults) {
      setAndroidVoiceActivity("inactive");
    }
    setPhase("stopping");
    onMessageRef.current("Finalizando el dictado…");

    if (session.androidChromiumCumulativeResults && session.segmentEnded) {
      completeSession(session);
      return;
    }

    const stopRecognition = () => {
      if (
        !mountedRef.current ||
        session.cancelled ||
        session.failed ||
        sessionRef.current?.id !== session.id
      ) {
        return;
      }

      session.tailGraceTimer = null;
      session.finalizationTimer = setTimeout(() => {
        completeSession(session);
        try {
          session.recognition.abort();
        } catch {
          // The bounded terminal cleanup may find recognition already ended.
        }
      }, VOICE_RECOGNITION_FINALIZATION_MS);
      try {
        session.recognition.stop();
      } catch {
        setFailure("RECOGNITION_FAILED", session);
      }
    };

    if (session.safariMacInterimSnapshot) {
      session.tailGraceTimer = setTimeout(
        stopRecognition,
        VOICE_RECOGNITION_SAFARI_MAC_TAIL_GRACE_MS,
      );
      return;
    }

    stopRecognition();
  }, [completeSession, setFailure]);

  const cancel = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    session.cancelled = true;
    session.terminalReason = "cancel";
    releaseSession(session);
    try {
      session.recognition.abort();
    } catch {
      // The browser may already have ended the recognition session.
    }
    session.transcriptState.finalFragments.clear();
    session.transcriptState.latestInterim = null;
    session.completedSegments.length = 0;

    if (mountedRef.current) {
      setElapsedSeconds(0);
      setErrorCode(null);
      setPhase("idle");
      onMessageRef.current("Dictado cancelado. El texto existente se mantiene.");
    }
  }, [releaseSession]);

  const start = useCallback(() => {
    if (sessionRef.current) {
      return;
    }

    setErrorCode(null);
    setElapsedSeconds(0);
    setPhase("requesting_permission");
    onMessageRef.current("Solicitando acceso al micrófono…");

    if (typeof window === "undefined") {
      setFailure("RECOGNITION_UNSUPPORTED");
      return;
    }

    const RecognitionConstructor = getBrowserSpeechRecognitionConstructor(window);
    if (!RecognitionConstructor) {
      setFailure("RECOGNITION_UNSUPPORTED");
      return;
    }

    let recognition: BrowserSpeechRecognition;
    try {
      recognition = new RecognitionConstructor();
    } catch {
      setFailure("RECOGNITION_FAILED");
      return;
    }

    const session: VoiceSession = {
      androidChromiumCumulativeResults: isAndroidChromiumBrowser(window.navigator),
      analyser: null,
      audioContext: null,
      audioLevel: 0,
      audioSource: null,
      cancelled: false,
      completedSegments: [],
      continuationTimer: null,
      elapsedTimer: null,
      failed: false,
      finalizationTimer: null,
      id: ++nextSessionIdRef.current,
      limitTimer: null,
      recognition,
      receivedResult: false,
      safariMacInterimSnapshot: isMacSafariBrowser(window.navigator),
      segmentEnded: false,
      segmentGeneration: 1,
      startedAt: null,
      stopRequested: false,
      tailGraceTimer: null,
      terminalReason: null,
      transcriptState: createSpeechRecognitionTranscriptState(),
      visualFrame: null,
      visualStream: null,
      waveformHistory: [...EMPTY_WAVEFORM_LEVELS],
      waveformSampleAt: 0,
    };
    sessionRef.current = session;

    const configureSegment = (segmentRecognition: BrowserSpeechRecognition, generation: number) => {
      const isCurrentSegment = () => mountedRef.current &&
        sessionRef.current?.id === session.id &&
        session.segmentGeneration === generation &&
        session.recognition === segmentRecognition &&
        !session.cancelled &&
        !session.failed;
      const canUpdateAndroidVisual = () => session.androidChromiumCumulativeResults &&
        isCurrentSegment() &&
        !session.segmentEnded &&
        session.terminalReason === null;
      const setListening = () => {
        if (canUpdateAndroidVisual()) {
          setAndroidVoiceActivity((current) => current === "speechActive" ? current : "listening");
        }
      };

      segmentRecognition.lang = BROWSER_SPEECH_RECOGNITION_LANGUAGE;
      segmentRecognition.continuous = true;
      segmentRecognition.interimResults = true;
      segmentRecognition.maxAlternatives = 1;

      segmentRecognition.onstart = () => {
        if (!isCurrentSegment()) {
          return;
        }
        if (session.startedAt === null) {
          const startedAt = Date.now();
          session.startedAt = startedAt;
          session.elapsedTimer = setInterval(() => {
            setElapsedSeconds(Math.min(120, (Date.now() - startedAt) / 1000));
          }, 250);
          session.limitTimer = setTimeout(() => {
            if (sessionRef.current?.id === session.id && session.terminalReason === null) {
              session.terminalReason = "limit";
              stop();
            }
          }, VOICE_MAX_RECORDING_MS);
        }
        if (!session.stopRequested) {
          setListening();
          setPhase("recording");
          onMessageRef.current("");
        }
      };
      if (session.androidChromiumCumulativeResults) {
        segmentRecognition.onaudiostart = setListening;
        segmentRecognition.onsoundstart = setListening;
        segmentRecognition.onspeechstart = () => {
          if (canUpdateAndroidVisual()) {
            setAndroidVoiceActivity("speechActive");
          }
        };
        segmentRecognition.onspeechend = () => {
          if (canUpdateAndroidVisual()) {
            setAndroidVoiceActivity("listening");
          }
        };
        segmentRecognition.onsoundend = segmentRecognition.onspeechend;
        segmentRecognition.onaudioend = segmentRecognition.onspeechend;
      }
      segmentRecognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
        if (!isCurrentSegment() || session.segmentEnded) {
          return;
        }
        session.receivedResult = true;
        collectSpeechRecognitionResults(event, session.transcriptState);
        if (canUpdateAndroidVisual()) {
          setAndroidResultPulse((pulse) => pulse + 1);
        }
      };
      segmentRecognition.onerror = (event) => {
        if (!isCurrentSegment()) {
          return;
        }
        if (
          session.androidChromiumCumulativeResults &&
          session.stopRequested &&
          (event.error === "no-speech" || event.error === "aborted")
        ) {
          return;
        }
        if (session.cancelled && event.error === "aborted") {
          return;
        }
        const failureCode = event.error === "aborted" && !session.receivedResult
          ? "RECOGNITION_NO_RESULT"
          : classifySpeechRecognitionError(event.error);
        setFailure(failureCode, session);
      };
      segmentRecognition.onend = () => {
        if (!isCurrentSegment() || session.segmentEnded) {
          return;
        }
        if (session.androidChromiumCumulativeResults && session.terminalReason === null) {
          const segmentTranscript = joinAndroidChromiumFinalSpeechRecognitionResults(
            session.transcriptState.finalFragments,
          );
          if (!segmentTranscript) {
            setFailure(session.receivedResult ? "NO_SPEECH" : "RECOGNITION_NO_RESULT", session);
            return;
          }

          session.completedSegments.push(segmentTranscript);
          session.segmentEnded = true;
          setAndroidVoiceActivity("betweenSegments");
          detachRecognitionHandlers(segmentRecognition);
          session.continuationTimer = setTimeout(() => {
            session.continuationTimer = null;
            if (!isCurrentSegment() || session.terminalReason !== null) {
              return;
            }
            try {
              const nextRecognition = new RecognitionConstructor();
              session.recognition = nextRecognition;
              session.segmentGeneration += 1;
              session.segmentEnded = false;
              session.receivedResult = false;
              session.transcriptState = createSpeechRecognitionTranscriptState();
              configureSegment(nextRecognition, session.segmentGeneration);
              nextRecognition.start();
            } catch {
              setFailure("RECOGNITION_FAILED", session);
            }
          }, 0);
          return;
        }
        completeSession(session);
      };
    };

    configureSegment(recognition, session.segmentGeneration);

    try {
      if (!isAndroidChromiumBrowser(window.navigator)) {
        void startVisualAudio(session);
      }
      recognition.start();
    } catch {
      setFailure("RECOGNITION_FAILED", session);
    }
  }, [completeSession, setFailure, startVisualAudio, stop]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      session.cancelled = true;
      session.terminalReason = "cleanup";
      releaseSession(session);
      try {
        session.recognition.abort();
      } catch {
        // The browser may already have ended the recognition session.
      }
      session.transcriptState.finalFragments.clear();
      session.transcriptState.latestInterim = null;
      session.completedSegments.length = 0;
    };
  }, [releaseSession]);

  return {
    androidResultPulse,
    androidVoiceActivity,
    audioLevel: Math.max(...waveformLevels),
    cancel,
    elapsedSeconds,
    errorCode,
    isBusy:
      phase === "requesting_permission" ||
      phase === "recording" ||
      phase === "stopping",
    phase,
    start,
    stop,
    waveformLevels,
  };
}
