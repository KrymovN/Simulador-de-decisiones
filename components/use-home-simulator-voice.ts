"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isVoiceTranscriptionApiResponse } from "../lib/voice-transcription/contracts";
import {
  VOICE_MAX_AUDIO_BYTES,
  VOICE_MAX_RECORDING_MS,
  calculateVoiceAudioLevel,
  classifyMicrophoneError,
  fileExtensionForVoiceMimeType,
  selectVoiceRecordingMimeType,
  type VoiceErrorCode,
  type VoicePhase,
  voiceErrorMessage,
} from "./home-simulator-voice";

type WebkitAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type VoiceSession = {
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  cancelled: boolean;
  chunks: Blob[];
  elapsedTimer: ReturnType<typeof setInterval> | null;
  frame: number | null;
  id: number;
  limitTimer: ReturnType<typeof setTimeout> | null;
  mimeType: string;
  recorder: MediaRecorder;
  source: MediaStreamAudioSourceNode | null;
  stream: MediaStream;
  tooLarge: boolean;
  totalBytes: number;
  transcriptionAbort: AbortController | null;
};

type UseHomeSimulatorVoiceOptions = {
  onMessage(message: string): void;
  onTranscript(transcript: string): void;
};

function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function releaseCapture(session: VoiceSession) {
  if (session.frame !== null) {
    cancelAnimationFrame(session.frame);
    session.frame = null;
  }
  if (session.elapsedTimer !== null) {
    clearInterval(session.elapsedTimer);
    session.elapsedTimer = null;
  }
  if (session.limitTimer !== null) {
    clearTimeout(session.limitTimer);
    session.limitTimer = null;
  }
  session.source?.disconnect();
  session.analyser?.disconnect();
  stopTracks(session.stream);
  if (session.audioContext && session.audioContext.state !== "closed") {
    void session.audioContext.close();
  }
  session.source = null;
  session.analyser = null;
  session.audioContext = null;
}

export function useHomeSimulatorVoice(options: UseHomeSimulatorVoiceOptions) {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionRef = useRef<VoiceSession | null>(null);
  const startingRef = useRef(false);
  const nextSessionIdRef = useRef(0);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(options.onMessage);
  const onTranscriptRef = useRef(options.onTranscript);

  onMessageRef.current = options.onMessage;
  onTranscriptRef.current = options.onTranscript;

  const setFailure = useCallback((code: VoiceErrorCode, session?: VoiceSession | null) => {
    startingRef.current = false;
    const activeSession = session ?? sessionRef.current;
    if (activeSession) {
      activeSession.cancelled = true;
      activeSession.transcriptionAbort?.abort();
      releaseCapture(activeSession);
      activeSession.chunks = [];
      if (activeSession.recorder.state !== "inactive") {
        activeSession.recorder.ondataavailable = null;
        activeSession.recorder.onerror = null;
        activeSession.recorder.onstop = null;
        try {
          activeSession.recorder.stop();
        } catch {
          // Capture resources have already been released.
        }
      }
      if (sessionRef.current?.id === activeSession.id) {
        sessionRef.current = null;
      }
    }

    if (mountedRef.current) {
      setAudioLevel(0);
      setErrorCode(code);
      setPhase("error");
      onMessageRef.current(voiceErrorMessage(code));
    }
  }, []);

  const transcribe = useCallback(async (session: VoiceSession, audio: Blob) => {
    if (!mountedRef.current || session.cancelled || sessionRef.current?.id !== session.id) {
      return;
    }

    setPhase("transcribing");
    onMessageRef.current("Transcribiendo…");
    const abortController = new AbortController();
    session.transcriptionAbort = abortController;
    const formData = new FormData();
    const filename = `grabacion.${fileExtensionForVoiceMimeType(audio.type || session.mimeType)}`;
    formData.append("audio", audio, filename);

    try {
      const response = await fetch("/api/transcribe", {
        body: formData,
        method: "POST",
        signal: abortController.signal,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!isVoiceTranscriptionApiResponse(payload)) {
        throw new Error("invalid_transcription_response");
      }
      if (payload.status === "failed") {
        if (payload.error.code === "empty_audio" || payload.error.code === "empty_transcript") {
          setFailure("EMPTY_RECORDING", session);
          return;
        }
        throw new Error(payload.error.code);
      }

      const transcript = payload.data.transcript.trim();
      if (!transcript) {
        setFailure("EMPTY_RECORDING", session);
        return;
      }

      if (!mountedRef.current || session.cancelled || sessionRef.current?.id !== session.id) {
        return;
      }
      onTranscriptRef.current(transcript);
      session.chunks = [];
      sessionRef.current = null;
      setErrorCode(null);
      setPhase("completed");
      onMessageRef.current("Dictado añadido. Revisa el texto antes de simular.");
    } catch (error) {
      if (abortController.signal.aborted && (!mountedRef.current || session.cancelled)) {
        return;
      }
      setFailure("TRANSCRIPTION_FAILED", session);
    }
  }, [setFailure]);

  const finalizeRecording = useCallback(async (session: VoiceSession) => {
    releaseCapture(session);
    setAudioLevel(0);

    if (session.cancelled) {
      session.chunks = [];
      if (sessionRef.current?.id === session.id) {
        sessionRef.current = null;
      }
      if (mountedRef.current) {
        setErrorCode(null);
        setElapsedSeconds(0);
        setPhase("idle");
        onMessageRef.current("Grabación cancelada. El texto existente se mantiene.");
      }
      return;
    }

    if (session.tooLarge) {
      setFailure("RECORDING_FAILED", session);
      return;
    }

    const mimeType = session.recorder.mimeType || session.mimeType;
    const audio = new Blob(session.chunks, { type: mimeType });
    session.chunks = [];

    if (audio.size === 0) {
      setFailure("EMPTY_RECORDING", session);
      return;
    }
    if (audio.size > VOICE_MAX_AUDIO_BYTES) {
      setFailure("RECORDING_FAILED", session);
      return;
    }

    await transcribe(session, audio);
  }, [setFailure, transcribe]);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.recorder.state === "inactive") {
      return;
    }

    setPhase("stopping");
    onMessageRef.current("Deteniendo la grabación…");
    try {
      session.recorder.stop();
    } catch {
      setFailure("RECORDING_FAILED", session);
    }
  }, [setFailure]);

  const cancel = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    session.cancelled = true;
    session.transcriptionAbort?.abort();

    if (session.recorder.state === "inactive") {
      releaseCapture(session);
      session.chunks = [];
      sessionRef.current = null;
      setAudioLevel(0);
      setElapsedSeconds(0);
      setErrorCode(null);
      setPhase("idle");
      onMessageRef.current("Grabación cancelada. El texto existente se mantiene.");
      return;
    }

    setPhase("stopping");
    onMessageRef.current("Cancelando la grabación…");
    try {
      session.recorder.stop();
    } catch {
      releaseCapture(session);
      session.chunks = [];
      sessionRef.current = null;
      setPhase("idle");
    }
  }, []);

  const start = useCallback(async () => {
    if (sessionRef.current || startingRef.current) {
      return;
    }

    startingRef.current = true;

    setErrorCode(null);
    setAudioLevel(0);
    setElapsedSeconds(0);
    setPhase("requesting_permission");
    onMessageRef.current("Solicitando acceso al micrófono…");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setFailure("RECORDING_UNSUPPORTED");
      return;
    }

    const AudioContextConstructor = window.AudioContext ??
      (window as WebkitAudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) {
      setFailure("RECORDING_UNSUPPORTED");
      return;
    }

    const sessionId = ++nextSessionIdRef.current;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (error) {
      setFailure(classifyMicrophoneError(error));
      return;
    }

    if (!mountedRef.current || sessionRef.current) {
      stopTracks(stream);
      return;
    }

    let recorder: MediaRecorder;
    const selectedMimeType = typeof MediaRecorder.isTypeSupported === "function"
      ? selectVoiceRecordingMimeType(MediaRecorder.isTypeSupported.bind(MediaRecorder))
      : "";
    try {
      recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);
    } catch {
      stopTracks(stream);
      setFailure("RECORDING_UNSUPPORTED");
      return;
    }

    const session: VoiceSession = {
      analyser: null,
      audioContext: null,
      cancelled: false,
      chunks: [],
      elapsedTimer: null,
      frame: null,
      id: sessionId,
      limitTimer: null,
      mimeType: recorder.mimeType || selectedMimeType,
      recorder,
      source: null,
      stream,
      tooLarge: false,
      totalBytes: 0,
      transcriptionAbort: null,
    };
    sessionRef.current = session;
    startingRef.current = false;

    try {
      const audioContext = new AudioContextConstructor();
      session.audioContext = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      if (!mountedRef.current || sessionRef.current?.id !== session.id) {
        releaseCapture(session);
        return;
      }
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);
      session.source = source;
      session.analyser = analyser;

      const samples = new Uint8Array(analyser.fftSize);
      const updateAudioLevel = () => {
        if (
          !mountedRef.current ||
          session.cancelled ||
          sessionRef.current?.id !== session.id ||
          session.recorder.state === "inactive"
        ) {
          return;
        }
        analyser.getByteTimeDomainData(samples);
        setAudioLevel(calculateVoiceAudioLevel(samples));
        session.frame = requestAnimationFrame(updateAudioLevel);
      };

      recorder.ondataavailable = (event) => {
        if (session.cancelled || event.data.size === 0) {
          return;
        }
        session.totalBytes += event.data.size;
        if (session.totalBytes > VOICE_MAX_AUDIO_BYTES) {
          session.tooLarge = true;
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
          return;
        }
        session.chunks.push(event.data);
      };
      recorder.onerror = () => setFailure("RECORDING_FAILED", session);
      recorder.onstop = () => {
        void finalizeRecording(session);
      };

      recorder.start(250);
      const startedAt = Date.now();
      session.elapsedTimer = setInterval(() => {
        setElapsedSeconds(Math.min(120, (Date.now() - startedAt) / 1000));
      }, 250);
      session.limitTimer = setTimeout(() => {
        if (sessionRef.current?.id === session.id && recorder.state !== "inactive") {
          setPhase("stopping");
          onMessageRef.current("Límite de grabación alcanzado. Preparando la transcripción…");
          recorder.stop();
        }
      }, VOICE_MAX_RECORDING_MS);
      session.frame = requestAnimationFrame(updateAudioLevel);
      setPhase("recording");
      onMessageRef.current("Grabando… Pulsa Detener cuando termines.");
    } catch {
      setFailure("RECORDING_FAILED", session);
    }
  }, [finalizeRecording, setFailure]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      startingRef.current = false;
      const session = sessionRef.current;
      sessionRef.current = null;
      if (!session) {
        return;
      }
      session.cancelled = true;
      session.transcriptionAbort?.abort();
      session.recorder.ondataavailable = null;
      session.recorder.onerror = null;
      session.recorder.onstop = null;
      if (session.recorder.state !== "inactive") {
        try {
          session.recorder.stop();
        } catch {
          // Capture resources are released below regardless.
        }
      }
      releaseCapture(session);
      session.chunks = [];
    };
  }, []);

  return {
    audioLevel,
    cancel,
    elapsedSeconds,
    errorCode,
    isBusy:
      phase === "requesting_permission" ||
      phase === "recording" ||
      phase === "stopping" ||
      phase === "transcribing",
    phase,
    start,
    stop,
  };
}
