"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  BROWSER_SPEECH_RECOGNITION_LANGUAGE,
  buildSpeechRecognitionTranscript,
  classifySpeechRecognitionError,
  collectSpeechRecognitionResults,
  createSpeechRecognitionTranscriptState,
  getBrowserSpeechRecognitionConstructor,
  isMacSafariBrowser,
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
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  audioLevel: number;
  audioSource: MediaStreamAudioSourceNode | null;
  cancelled: boolean;
  elapsedTimer: ReturnType<typeof setInterval> | null;
  failed: boolean;
  finalizationTimer: ReturnType<typeof setTimeout> | null;
  id: number;
  limitTimer: ReturnType<typeof setTimeout> | null;
  recognition: BrowserSpeechRecognition;
  receivedResult: boolean;
  safariMacInterimSnapshot: boolean;
  stopRequested: boolean;
  tailGraceTimer: ReturnType<typeof setTimeout> | null;
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

function clearSessionTimers(session: VoiceSession) {
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
  recognition.onstart = null;
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
      setWaveformLevels([...EMPTY_WAVEFORM_LEVELS]);
    }
  }, []);

  const setFailure = useCallback((code: VoiceErrorCode, session?: VoiceSession | null) => {
    const activeSession = session ?? sessionRef.current;
    if (activeSession) {
      activeSession.failed = true;
      releaseSession(activeSession);
      try {
        activeSession.recognition.abort();
      } catch {
        // The browser may already have ended the recognition session.
      }
      activeSession.transcriptState.finalFragments.clear();
      activeSession.transcriptState.latestInterim = null;
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

    const transcript = session.safariMacInterimSnapshot
      ? buildSpeechRecognitionTranscript(session.transcriptState, true, true)
      : joinFinalSpeechRecognitionResults(session.transcriptState.finalFragments);
    const receivedResult = session.receivedResult;
    releaseSession(session);
    session.transcriptState.finalFragments.clear();
    session.transcriptState.latestInterim = null;

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
    setPhase("stopping");
    onMessageRef.current("Finalizando el dictado…");

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
    releaseSession(session);
    try {
      session.recognition.abort();
    } catch {
      // The browser may already have ended the recognition session.
    }
    session.transcriptState.finalFragments.clear();
    session.transcriptState.latestInterim = null;

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
      analyser: null,
      audioContext: null,
      audioLevel: 0,
      audioSource: null,
      cancelled: false,
      elapsedTimer: null,
      failed: false,
      finalizationTimer: null,
      id: ++nextSessionIdRef.current,
      limitTimer: null,
      recognition,
      receivedResult: false,
      safariMacInterimSnapshot: isMacSafariBrowser(window.navigator),
      stopRequested: false,
      tailGraceTimer: null,
      transcriptState: createSpeechRecognitionTranscriptState(),
      visualFrame: null,
      visualStream: null,
      waveformHistory: [...EMPTY_WAVEFORM_LEVELS],
      waveformSampleAt: 0,
    };
    sessionRef.current = session;

    recognition.lang = BROWSER_SPEECH_RECOGNITION_LANGUAGE;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!mountedRef.current || sessionRef.current?.id !== session.id) {
        return;
      }
      const startedAt = Date.now();
      session.elapsedTimer = setInterval(() => {
        setElapsedSeconds(Math.min(120, (Date.now() - startedAt) / 1000));
      }, 250);
      session.limitTimer = setTimeout(() => {
        if (sessionRef.current?.id === session.id) {
          stop();
        }
      }, VOICE_MAX_RECORDING_MS);
      setPhase("recording");
      onMessageRef.current("");
    };
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      if (session.cancelled || session.failed || sessionRef.current?.id !== session.id) {
        return;
      }
      session.receivedResult = true;
      collectSpeechRecognitionResults(event, session.transcriptState);
    };
    recognition.onerror = (event) => {
      if (session.cancelled && event.error === "aborted") {
        return;
      }
      const failureCode = event.error === "aborted" && !session.receivedResult
        ? "RECOGNITION_NO_RESULT"
        : classifySpeechRecognitionError(event.error);
      setFailure(failureCode, session);
    };
    recognition.onend = () => {
      completeSession(session);
    };

    try {
      void startVisualAudio(session);
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
      releaseSession(session);
      try {
        session.recognition.abort();
      } catch {
        // The browser may already have ended the recognition session.
      }
      session.transcriptState.finalFragments.clear();
      session.transcriptState.latestInterim = null;
    };
  }, [releaseSession]);

  return {
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
