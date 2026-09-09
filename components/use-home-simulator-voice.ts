"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  BROWSER_SPEECH_RECOGNITION_LANGUAGE,
  classifySpeechRecognitionError,
  collectFinalSpeechRecognitionResults,
  getBrowserSpeechRecognitionConstructor,
  joinFinalSpeechRecognitionResults,
  type BrowserSpeechRecognition,
  type BrowserSpeechRecognitionEvent,
} from "./browser-speech-recognition";
import {
  VOICE_MAX_RECORDING_MS,
  type VoiceErrorCode,
  type VoicePhase,
  voiceErrorMessage,
} from "./home-simulator-voice";

type VoiceSession = {
  cancelled: boolean;
  elapsedTimer: ReturnType<typeof setInterval> | null;
  failed: boolean;
  finalResults: Map<number, string>;
  id: number;
  limitTimer: ReturnType<typeof setTimeout> | null;
  recognition: BrowserSpeechRecognition;
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
}

function detachRecognitionHandlers(recognition: BrowserSpeechRecognition) {
  recognition.onstart = null;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;
}

export function useHomeSimulatorVoice(options: UseHomeSimulatorVoiceOptions) {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionRef = useRef<VoiceSession | null>(null);
  const nextSessionIdRef = useRef(0);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(options.onMessage);
  const onTranscriptRef = useRef(options.onTranscript);

  onMessageRef.current = options.onMessage;
  onTranscriptRef.current = options.onTranscript;

  const releaseSession = useCallback((session: VoiceSession) => {
    clearSessionTimers(session);
    detachRecognitionHandlers(session.recognition);
    if (sessionRef.current?.id === session.id) {
      sessionRef.current = null;
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
      activeSession.finalResults.clear();
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

    const transcript = joinFinalSpeechRecognitionResults(session.finalResults);
    releaseSession(session);
    session.finalResults.clear();

    if (!transcript) {
      setFailure("NO_SPEECH");
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
    if (!session || session.cancelled || session.failed) {
      return;
    }

    clearSessionTimers(session);
    setPhase("stopping");
    onMessageRef.current("Finalizando el dictado…");
    try {
      session.recognition.stop();
    } catch {
      setFailure("RECOGNITION_FAILED", session);
    }
  }, [setFailure]);

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
    session.finalResults.clear();

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
      cancelled: false,
      elapsedTimer: null,
      failed: false,
      finalResults: new Map(),
      id: ++nextSessionIdRef.current,
      limitTimer: null,
      recognition,
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
      collectFinalSpeechRecognitionResults(event, session.finalResults);
    };
    recognition.onerror = (event) => {
      if (session.cancelled && event.error === "aborted") {
        return;
      }
      setFailure(classifySpeechRecognitionError(event.error), session);
    };
    recognition.onend = () => {
      completeSession(session);
    };

    try {
      recognition.start();
    } catch {
      setFailure("RECOGNITION_FAILED", session);
    }
  }, [completeSession, setFailure, stop]);

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
      session.finalResults.clear();
    };
  }, [releaseSession]);

  return {
    audioLevel: 0,
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
  };
}
