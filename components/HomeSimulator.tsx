"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { saveCompletedSimulationFromUi } from "../lib/saved-decision-simulations/ui-save-action";
import type { SimulationResponse } from "../lib/simulationEngine";
import {
  IDLE_PROCESSING_STATE,
  PROCESSING_STAGE_TITLES,
  PROCESSING_TIMING,
  cancelProcessingRun,
  createProcessingRunController,
  emitProcessingTrace,
  followTargetInsideMobileSafeCorridor,
  releaseProcessingRun,
  waitForMobileViewportStability,
  waitForProcessingDelay,
  waitForProcessingFrame,
  type ProcessingRunController,
  type ProcessingState,
} from "./home-simulator-processing";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: {
    transcript: string;
  };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const defaultInput =
  "Aceptar una oferta, lanzar un producto, cambiar de país, invertir en una nueva dirección...";
const MAX_SIMULATION_INPUT_LENGTH = 1200;
const SIMULATE_API_CONTRACT_VERSION = "simulate-api-v1-mock";

type SimulationErrorState = {
  title: string;
  message: string;
  requestId?: string;
  retryAfterSeconds?: number;
};

type SimulationPreviewState = {
  contractVersion: typeof SIMULATE_API_CONTRACT_VERSION;
  requestId: string;
  mockOnly: true;
  apiReady: true;
};

type SimulationRequestOutcome =
  | {
      status: "completed";
      simulation: SimulationResponse;
      preview: SimulationPreviewState;
    }
  | {
      status: "failed";
      title: string;
      message: string;
      requestId?: string;
      retryAfterSeconds?: number;
    };

type SaveSimulationState = Awaited<ReturnType<typeof saveCompletedSimulationFromUi>>;

type SimulateApiError = {
  code: string;
  message: string;
};

type SimulateApiMeta = {
  lang: "es";
  safeRender: true;
  mockOnly: true;
  apiReady: true;
  maxInputLength: number;
  maxBodyLength: number;
  generatedAt: string;
  retryAfterSeconds?: number;
};

type SimulateApiResponse =
  | {
      contractVersion: typeof SIMULATE_API_CONTRACT_VERSION;
      requestId: string;
      status: "completed";
      data: SimulationResponse;
      error: null;
      meta: SimulateApiMeta;
    }
  | {
      contractVersion: typeof SIMULATE_API_CONTRACT_VERSION;
      requestId: string;
      status: "failed";
      data: null;
      error: SimulateApiError;
      meta: SimulateApiMeta;
    };

class SimulateApiFailure extends Error {
  code?: string;
  requestId?: string;
  retryAfterSeconds?: number;

  constructor(
    message: string,
    options?: { code?: string; requestId?: string; retryAfterSeconds?: number },
  ) {
    super(message);
    this.name = "SimulateApiFailure";
    this.code = options?.code;
    this.requestId = options?.requestId;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function preserveReachedRevealState(origin: HTMLElement | null) {
  const siteShell = origin?.closest<HTMLElement>(".site-shell");

  if (!siteShell) {
    return;
  }

  const revealThreshold = window.innerHeight * 0.85;

  siteShell.querySelectorAll<HTMLElement>("section").forEach((section) => {
    if (section.getBoundingClientRect().top <= revealThreshold) {
      section.classList.add("reveal-state-preserved");
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSimulateApiResponse(value: unknown): value is SimulateApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.contractVersion !== SIMULATE_API_CONTRACT_VERSION ||
    typeof value.requestId !== "string" ||
    !isRecord(value.meta) ||
    value.meta.lang !== "es" ||
    value.meta.safeRender !== true ||
    value.meta.mockOnly !== true ||
    value.meta.apiReady !== true ||
    typeof value.meta.maxInputLength !== "number" ||
    typeof value.meta.maxBodyLength !== "number" ||
    typeof value.meta.generatedAt !== "string"
  ) {
    return false;
  }

  if (value.status === "failed") {
    return value.data === null &&
      isRecord(value.error) &&
      typeof value.error.code === "string" &&
      typeof value.error.message === "string";
  }

  return value.status === "completed" &&
    value.error === null &&
    isRecord(value.data) &&
    isRecord(value.data.simulation) &&
    Array.isArray(value.data.thinkingStages);
}

type ProcessingStepVisualState = "pending" | "active" | "completing" | "completed";

function processingStepVisualState(
  index: number,
  processingState: ProcessingState,
  hasResult: boolean,
): ProcessingStepVisualState {
  if (hasResult || processingState.phase === "result-reveal" || processingState.phase === "complete") {
    return "completed";
  }

  if (processingState.phase === "step-active" && processingState.stepIndex === index) {
    return "active";
  }

  if (processingState.phase === "step-completing" && processingState.stepIndex === index) {
    return "completing";
  }

  if (index < processingState.stepIndex) {
    return "completed";
  }

  return "pending";
}

function processingStepAccessibleState(state: ProcessingStepVisualState) {
  if (state === "active") {
    return "en curso";
  }
  if (state === "completing" || state === "completed") {
    return "completada";
  }
  return "pendiente";
}

export default function HomeSimulator() {
  const [input, setInput] = useState("");
  const [processingState, setProcessingState] = useState<ProcessingState>(IDLE_PROCESSING_STATE);
  const [isRunning, setIsRunning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [previewState, setPreviewState] = useState<SimulationPreviewState | null>(null);
  const [errorState, setErrorState] = useState<SimulationErrorState | null>(null);
  const [saveState, setSaveState] = useState<SaveSimulationState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const consoleRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const thinkingPanelRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const processingRunRef = useRef<ProcessingRunController | null>(null);
  const processingRunIdRef = useRef(0);

  const stages = useMemo(
    () =>
      result?.thinkingStages ?? [
        {
          title: "Comprendiendo la situación",
          detail: "Separando objetivo, presión externa, urgencia y coste de no decidir.",
        },
        {
          title: "Detectando variables críticas",
          detail: "Identificando energía disponible, dinero, relaciones, timing y reversibilidad.",
        },
        {
          title: "Simulando escenarios",
          detail: "Abriendo rutas probables con oportunidad, tensión acumulada y alternativas.",
        },
        {
          title: "Evaluando riesgos y beneficios",
          detail: "Comparando exposición, ventaja potencial, latencia y consecuencias secundarias.",
        },
        {
          title: "Preparando marco de decisión",
          detail: "Construyendo un mapa de opciones sin presentar una certeza falsa.",
        },
      ],
    [result],
  );

  async function requestSimulation(situation: string, signal: AbortSignal) {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: situation, lang: "es" }),
      signal,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);

      if (isSimulateApiResponse(payload) && payload.status === "failed") {
        throw new SimulateApiFailure(payload.error.message, {
          code: payload.error.code,
          requestId: payload.requestId,
          retryAfterSeconds: payload.meta.retryAfterSeconds,
        });
      }

      throw new Error("El simulador público devolvió un fallo sin contrato válido.");
    }

    const payload = await response.json();

    if (!isSimulateApiResponse(payload)) {
      throw new Error("El simulador público devolvió una respuesta fuera de contrato.");
    }

    if (payload.status === "failed") {
      throw new SimulateApiFailure(payload.error.message, {
        code: payload.error.code,
        requestId: payload.requestId,
        retryAfterSeconds: payload.meta.retryAfterSeconds,
      });
    }

    return payload;
  }

  async function runProcessingSequence(
    controller: ProcessingRunController,
    simulationPromise: Promise<SimulationRequestOutcome>,
  ) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const activeDwell = reducedMotion
      ? PROCESSING_TIMING.reducedActiveDwell
      : PROCESSING_TIMING.activeDwell;
    const completingHandoff = reducedMotion
      ? PROCESSING_TIMING.reducedCompletingHandoff
      : PROCESSING_TIMING.completingHandoff;
    const nextStepGap = reducedMotion
      ? PROCESSING_TIMING.reducedNextStepGap
      : PROCESSING_TIMING.nextStepGap;

    if (!(await waitForProcessingFrame(controller)) || !(await waitForProcessingFrame(controller))) {
      return;
    }
    emitProcessingTrace("processing-container-ready");

    if (!(await waitForMobileViewportStability(controller))) {
      return;
    }

    const firstStep = thinkingPanelRef.current?.querySelector<HTMLElement>('[data-processing-step="1"]') ?? null;
    await followTargetInsideMobileSafeCorridor(
      controller,
      firstStep,
      thinkingPanelRef.current,
      "preparation",
    );

    if (controller.cancelled) {
      return;
    }

    for (let index = 0; index < PROCESSING_STAGE_TITLES.length; index += 1) {
      if (index > 0) {
        const nextStep = thinkingPanelRef.current?.querySelector<HTMLElement>(
          `[data-processing-step="${index + 1}"]`,
        ) ?? null;
        await followTargetInsideMobileSafeCorridor(
          controller,
          nextStep,
          thinkingPanelRef.current,
          "step",
        );

        if (!(await waitForProcessingDelay(controller, nextStepGap))) {
          return;
        }
      }

      if (!(await waitForProcessingFrame(controller))) {
        return;
      }

      setProcessingState({ phase: "step-active", stepIndex: index, resultVisible: false });
      emitProcessingTrace("step-active-start", { step: index + 1 });

      if (!(await waitForProcessingDelay(controller, activeDwell))) {
        return;
      }

      setProcessingState({ phase: "step-completing", stepIndex: index, resultVisible: false });
      emitProcessingTrace("step-completed-start", { step: index + 1 });

      if (!(await waitForProcessingDelay(controller, completingHandoff))) {
        return;
      }
    }

    if (!(await waitForProcessingDelay(controller, PROCESSING_TIMING.finalResultGap))) {
      return;
    }

    const simulationResult = await simulationPromise;

    if (controller.cancelled) {
      return;
    }

    if (simulationResult.status === "completed") {
      setResult(simulationResult.simulation);
      setPreviewState(simulationResult.preview);
      setMessage("Simulación demo completada. Escenarios orientativos listos para revisar.");
      setProcessingState({
        phase: "result-reveal",
        stepIndex: PROCESSING_STAGE_TITLES.length - 1,
        resultVisible: false,
      });
      emitProcessingTrace("result-reveal-start");

      if (!(await waitForProcessingFrame(controller)) || !(await waitForProcessingFrame(controller))) {
        return;
      }

      const resultHeading = outputRef.current?.querySelector<HTMLElement>(".simulation-output-header") ?? null;
      await followTargetInsideMobileSafeCorridor(controller, resultHeading, outputRef.current, "result");

      if (controller.cancelled) {
        return;
      }

      setProcessingState({
        phase: "result-reveal",
        stepIndex: PROCESSING_STAGE_TITLES.length - 1,
        resultVisible: true,
      });

      if (!reducedMotion && !(await waitForProcessingDelay(controller, PROCESSING_TIMING.resultReveal))) {
        return;
      }
    } else {
      setResult(null);
      setPreviewState(null);
      setErrorState({
        title: simulationResult.title,
        message: simulationResult.message,
        requestId: simulationResult.requestId,
        retryAfterSeconds: simulationResult.retryAfterSeconds,
      });
      setMessage("Simulación detenida. No se generó un resultado local de sustitución.");
    }

    setProcessingState({
      phase: "complete",
      stepIndex: PROCESSING_STAGE_TITLES.length - 1,
      resultVisible: true,
    });
    setIsRunning(false);
    emitProcessingTrace("processing-complete");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const situation = input.trim();

    if (!situation) {
      setMessage("Describe una situación concreta para iniciar la simulación.");
      setErrorState(null);
      setPreviewState(null);
      setSaveState(null);
      return;
    }

    if (situation.length > MAX_SIMULATION_INPUT_LENGTH) {
      setResult(null);
      setPreviewState(null);
      setSaveState(null);
      setErrorState({
        title: "Simulación no ejecutada",
        message: `La situación supera el límite de ${MAX_SIMULATION_INPUT_LENGTH} caracteres del simulador público.`,
      });
      setMessage("Reduce el texto antes de simular.");
      return;
    }

    if (processingRunRef.current) {
      return;
    }

    preserveReachedRevealState(consoleRef.current);
    textareaRef.current?.blur();
    setMessage("");
    setResult(null);
    setPreviewState(null);
    setSaveState(null);
    setErrorState(null);
    setProcessingState({ phase: "preparing", stepIndex: -1, resultVisible: false });
    setIsRunning(true);

    const controller = createProcessingRunController(++processingRunIdRef.current);
    processingRunRef.current = controller;
    emitProcessingTrace("processing-preparing");

    const simulationPromise: Promise<SimulationRequestOutcome> = requestSimulation(
      situation,
      controller.abortController.signal,
    ).then(
      (payload) => ({
        status: "completed" as const,
        simulation: payload.data,
        preview: {
          contractVersion: payload.contractVersion,
          requestId: payload.requestId,
          mockOnly: payload.meta.mockOnly,
          apiReady: payload.meta.apiReady,
        },
      }),
      (error: unknown) => {
        const simulateError = error instanceof SimulateApiFailure ? error : null;

        return {
          status: "failed" as const,
          title:
            simulateError?.code === "rate_limited"
              ? "Límite temporal alcanzado"
              : "Simulación no ejecutada",
          message:
            error instanceof Error
              ? error.message
              : "El simulador público devolvió un fallo controlado.",
          requestId: simulateError?.requestId,
          retryAfterSeconds: simulateError?.retryAfterSeconds,
        };
      },
    );

    void runProcessingSequence(controller, simulationPromise).finally(() => {
      if (processingRunRef.current === controller) {
        processingRunRef.current = null;
      }
      releaseProcessingRun(controller);
    });
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handleVoiceToggle() {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setMessage("El dictado por voz no está disponible en este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        setInput((currentInput) =>
          `${currentInput.trimEnd()}${currentInput.trim() ? " " : ""}${transcript}`.slice(
            0,
            MAX_SIMULATION_INPUT_LENGTH,
          ),
        );
        setMessage("Dictado añadido. Revisa el texto antes de simular.");
        setErrorState(null);
      }
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMessage("No se pudo acceder al micrófono. Revisa el permiso del navegador.");
      } else {
        setMessage("No se pudo completar el dictado por voz. Puedes seguir escribiendo.");
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setMessage("Escuchando... Pulsa el micrófono para detener el dictado.");
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setMessage("No se pudo iniciar el dictado por voz. Puedes seguir escribiendo.");
    }
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      cancelProcessingRun(processingRunRef.current);
      processingRunRef.current = null;
    };
  }, []);

  async function handleSave() {
    if (!result) {
      return;
    }

    setIsSaving(true);
    setSaveState(null);

    try {
      const saved = await saveCompletedSimulationFromUi({ simulation: result });
      setSaveState(saved);

      if (saved.status === "saved") {
        setMessage("Simulación guardada en tu historial de cuenta.");
      } else if (saved.status === "auth_required") {
        setMessage("Inicia sesión para guardar esta simulación en tu historial.");
      } else {
        setMessage("No se pudo guardar la simulación. El resultado sigue disponible en esta pantalla.");
      }
    } catch {
      setSaveState({
        status: "error",
        version: "block-a-a3-saved-simulations-history-product-surface.1",
        reason: "record_save_blocked",
        message: "No se pudo guardar la simulación de forma controlada.",
      });
      setMessage("No se pudo guardar la simulación. El resultado sigue disponible en esta pantalla.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="decision-console"
      aria-label="Simulador inicial de decisión"
      ref={consoleRef}
    >
      <form onSubmit={handleSubmit}>
        <div className="simulator-field-heading">
          <label htmlFor="decision-input">Describe la situación que quieres simular</label>
          <span aria-live="polite">{input.length} / {MAX_SIMULATION_INPUT_LENGTH}</span>
        </div>
        <div className="input-row simulator-composition">
          <div className="decision-input-shell">
            <textarea
              id="decision-input"
              ref={textareaRef}
              onChange={(event) => {
                setInput(event.target.value);
                setErrorState(null);
                setPreviewState(null);
                setSaveState(null);
              }}
              onKeyDown={handleTextareaKeyDown}
              maxLength={MAX_SIMULATION_INPUT_LENGTH}
              placeholder={defaultInput}
              value={input}
            />
          </div>
        </div>
        <div className="simulator-criteria">
          <strong>Criterios principales</strong>
          <ul aria-label="Criterios principales">
            <li>Resultado</li>
            <li>Riesgo</li>
            <li>Tiempo</li>
            <li>Recursos</li>
          </ul>
        </div>
        <div className="simulator-action-cluster">
          <button
            aria-label={isListening ? "Detener dictado por voz" : "Dictar situación"}
            aria-pressed={isListening}
            className={`voice-input-button ${isListening ? "is-listening" : ""}`}
            onClick={handleVoiceToggle}
            title={isListening ? "Detener dictado" : "Dictar situación"}
            type="button"
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
              <path d="M12 15.25a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v5.25a4 4 0 0 0 4 4Z" />
              <path d="M5.75 10.75v.5a6.25 6.25 0 0 0 12.5 0v-.5M12 17.5V21M9.25 21h5.5" />
            </svg>
          </button>
          <button
            aria-label="Simular decisión"
            className="primary-simulation-control"
            disabled={isRunning}
            type="submit"
          >
            <span>{isRunning ? "Simulando escenarios" : "Simular escenarios"}</span>
          </button>
        </div>
      </form>

      <div
        className={`console-status ${isRunning ? "is-live" : ""} ${errorState ? "is-error" : ""}`}
        aria-live={errorState ? "assertive" : "polite"}
        role={errorState ? "alert" : "status"}
      >
        <span></span>
        <p>
          {message || `Vista previa determinista · Respuestas de ejemplo · Máx. ${MAX_SIMULATION_INPUT_LENGTH} caracteres`}
        </p>
      </div>

      {(isRunning || result) && (
        <div
          className="thinking-panel"
          aria-label="Etapas de simulación del motor"
          data-active-step={processingState.phase === "step-active" ? processingState.stepIndex + 1 : 0}
          data-processing-phase={processingState.phase}
          ref={thinkingPanelRef}
          role="list"
        >
          <p className="processing-live-status" aria-live="polite" aria-atomic="true">
            {processingState.phase === "step-active"
              ? `Etapa ${processingState.stepIndex + 1} de ${PROCESSING_STAGE_TITLES.length}: ${PROCESSING_STAGE_TITLES[processingState.stepIndex]}`
              : processingState.phase === "result-reveal"
                ? "Etapas completadas. Preparando el resultado."
                : ""}
          </p>
          {stages.map((stage, index) => {
            const visualState = processingStepVisualState(index, processingState, Boolean(result));

            return (
              <article
                aria-current={visualState === "active" ? "step" : undefined}
                className={`thinking-step is-${visualState}`}
                data-processing-step={index + 1}
                data-step-state={visualState}
                key={stage.title}
                role="listitem"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{stage.title}</strong>
                  <p>{stage.detail}</p>
                  <span className="processing-step-accessible-state">
                    Estado: {processingStepAccessibleState(visualState)}.
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {errorState && (
        <article className="simulation-error-panel">
          <span>Fallo controlado</span>
          <strong>{errorState.title}</strong>
          <p>{errorState.message}</p>
          {typeof errorState.retryAfterSeconds === "number" && (
            <small>Reintento disponible en {errorState.retryAfterSeconds} s.</small>
          )}
          {errorState.requestId && <small>Referencia: {errorState.requestId}</small>}
          <small>No se ha generado una simulación local de sustitución.</small>
        </article>
      )}

      {result && (
        <div
          className={`simulation-output ${
            processingState.phase === "result-reveal" && !processingState.resultVisible
              ? "is-result-pending"
              : "is-result-visible"
          }`}
          ref={outputRef}
        >
          <div className="simulation-output-header">
            <div>
              <p className="eyebrow">Mapa de escenarios demo</p>
              <h2>{result.simulation.result}</h2>
            </div>
            <div className="output-confidence">
              <span>Claridad orientativa</span>
              <strong>{result.simulation.signals.confidence}%</strong>
            </div>
          </div>

          <article className="strategic-conclusion">
            <span>Preview controlado</span>
            <strong>Simulación demostrativa con respuestas de ejemplo.</strong>
            <p>
              Este mapa usa la versión pública {previewState?.contractVersion ?? SIMULATE_API_CONTRACT_VERSION} con respuestas de ejemplo. Sirve para
              explorar escenarios, riesgos y consecuencias sin presentarse como predicción lista para producción.
              {previewState?.requestId ? ` Referencia: ${previewState.requestId}.` : ""}
            </p>
          </article>

          <div className="home-scenario-grid">
            {result.simulation.scenarios.map((scenario) => (
              <article className={`home-scenario-card tone-${scenario.riskLevel === "Alto" ? "risk" : scenario.riskLevel === "Medio" ? "amber" : "opportunity"}`} key={`${scenario.label}-${scenario.title}`}>
                <span>{scenario.label}</span>
                <h3>{scenario.title}</h3>
                <dl>
                  <div>
                    <dt>Probabilidad orientativa</dt>
                    <dd>{scenario.probability}</dd>
                  </div>
                  <div>
                    <dt>Nivel de riesgo</dt>
                    <dd>{scenario.riskLevel}</dd>
                  </div>
                  <div>
                    <dt>Beneficio potencial</dt>
                    <dd>{scenario.potentialBenefit}</dd>
                  </div>
                </dl>
                <div className="scenario-notes">
                  <strong>Consecuencias</strong>
                  {scenario.consequences?.map((item) => <p key={item}>{item}</p>)}
                </div>
                <div className="scenario-notes warning-notes">
                  <strong>Advertencias</strong>
                  {scenario.warnings?.map((item) => <p key={item}>{item}</p>)}
                </div>
                <small>{scenario.recommendation}</small>
              </article>
            ))}
          </div>

          <article className="strategic-conclusion">
            <span>Marco de decisión</span>
            <strong>{result.simulation.strategicConclusion}</strong>
            <p>{result.simulation.detailCopy}</p>
          </article>

          <div className="simulator-cta-row" aria-label="Acciones posteriores a la simulación">
            <button
              disabled={isSaving || saveState?.status === "saved"}
              onClick={handleSave}
              type="button"
            >
              {isSaving
                ? "Guardando..."
                : saveState?.status === "saved"
                  ? "Simulación guardada"
                  : "Guardar simulación"}
            </button>
            {saveState?.status === "saved" ? (
              <Link className="secondary-button" href={saveState.historyHref}>
                Ver historial
              </Link>
            ) : (
              <Link
                className="secondary-button"
                href={
                  saveState?.status === "auth_required"
                    ? saveState.loginHref
                    : "/login?next=%2Fdashboard%2Fsimulations"
                }
              >
                Revisar acceso preparado
              </Link>
            )}
            <Link className="text-link" href="/register">
              Preparar acceso
            </Link>
          </div>

          {saveState && (
            <p
              className={`save-flow-state ${saveState.status === "error" ? "is-error" : ""}`}
              role={saveState.status === "error" ? "alert" : "status"}
            >
              {saveState.message}
              {saveState.status === "saved" ? (
                <>
                  {" "}
                  <Link href={saveState.detailHref}>Abrir simulación guardada</Link>
                </>
              ) : null}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
