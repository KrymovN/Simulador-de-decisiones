"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { createMockSession } from "./MockAuthGate";
import type { MockSimulation } from "../lib/mockSimulations";
import {
  buildMockSimulation,
  LOCAL_SIMULATIONS_KEY,
  type SimulationResponse,
} from "../lib/simulationEngine";

const defaultInput =
  "Aceptar una oferta, lanzar un producto, cambiar de país, invertir en una nueva dirección...";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readSavedSimulations() {
  const raw = window.localStorage.getItem(LOCAL_SIMULATIONS_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as MockSimulation[];
  } catch {
    return [];
  }
}

export default function HomeSimulator() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [activeStage, setActiveStage] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [message, setMessage] = useState("");
  const thinkingPanelRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const stages = useMemo(
    () => result?.thinkingStages ?? buildMockSimulation("simulación inicial").thinkingStages,
    [result],
  );

  async function requestSimulation(situation: string) {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: situation, lang: "es" }),
    });

    if (!response.ok) {
      throw new Error("No se pudo completar la simulación mock.");
    }

    return (await response.json()) as SimulationResponse;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const situation = input.trim();

    if (!situation) {
      setMessage("Describe una situación concreta para iniciar el análisis.");
      return;
    }

    setMessage("");
    setResult(null);
    setActiveStage(-1);
    setIsRunning(true);

    const simulationPromise = requestSimulation(situation).catch(() => buildMockSimulation(situation));

    for (let index = 0; index < stages.length; index += 1) {
      setActiveStage(index);
      await wait(index === 0 ? 520 : 760);
    }

    const simulation = await simulationPromise;
    setResult(simulation);
    setIsRunning(false);
    setMessage("Simulación completada. Escenarios listos para revisar.");
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  useEffect(() => {
    if (!isRunning || activeStage < 0) {
      return;
    }

    const currentStage = thinkingPanelRef.current?.querySelector<HTMLElement>(".thinking-step.is-current");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    currentStage?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [activeStage, isRunning]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    outputRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [result]);

  function handleSave() {
    if (!result) {
      return;
    }

    const saved = readSavedSimulations();
    const next = [result.simulation, ...saved.filter((simulation) => simulation.id !== result.simulation.id)].slice(0, 12);
    window.localStorage.setItem(LOCAL_SIMULATIONS_KEY, JSON.stringify(next));
    setMessage("Simulación guardada localmente en este navegador.");
  }

  function handleDemoSession() {
    createMockSession();
    router.push("/dashboard/simulations");
  }

  return (
    <section className="decision-console" aria-label="Simulador inicial de decisión">
      <form onSubmit={handleSubmit}>
        <label htmlFor="decision-input">Describe la situación que quieres simular</label>
        <div className="input-row">
          <textarea
            id="decision-input"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={defaultInput}
            value={input}
          />
          <button disabled={isRunning} type="submit">
            {isRunning ? "Analizando..." : "Simular decisión"}
          </button>
        </div>
      </form>

      <div className={`console-status ${isRunning ? "is-live" : ""}`} aria-live="polite">
        <span></span>
        <p>{message || "Levio.es está listo para analizar escenarios, riesgos y consecuencias."}</p>
      </div>

      {(isRunning || result) && (
        <div className="thinking-panel" aria-label="Etapas de pensamiento del motor" ref={thinkingPanelRef}>
          {stages.map((stage, index) => (
            <article
              className={`thinking-step ${index <= activeStage || result ? "is-active" : ""} ${
                index === activeStage && isRunning ? "is-current" : ""
              }`}
              key={stage.title}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{stage.title}</strong>
                <p>{stage.detail}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {result && (
        <div className="simulation-output" ref={outputRef}>
          <div className="simulation-output-header">
            <div>
              <p className="eyebrow">Mapa de escenarios</p>
              <h2>{result.simulation.result}</h2>
            </div>
            <div className="output-confidence">
              <span>Confianza mock</span>
              <strong>{result.simulation.signals.confidence}%</strong>
            </div>
          </div>

          <div className="home-scenario-grid">
            {result.simulation.scenarios.map((scenario) => (
              <article className={`home-scenario-card tone-${scenario.riskLevel === "Alto" ? "risk" : scenario.riskLevel === "Medio" ? "amber" : "opportunity"}`} key={scenario.title}>
                <span>{scenario.label}</span>
                <h3>{scenario.title}</h3>
                <dl>
                  <div>
                    <dt>Probabilidad</dt>
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
            <span>Conclusión estratégica final</span>
            <strong>{result.simulation.strategicConclusion}</strong>
            <p>{result.simulation.detailCopy}</p>
          </article>

          <div className="simulator-cta-row" aria-label="Acciones posteriores a la simulación">
            <button onClick={handleSave} type="button">
              Guardar simulación
            </button>
            <Link className="secondary-button" href="/dashboard/simulations">
              Ver en Mi espacio
            </Link>
            <button className="ghost-button" onClick={handleDemoSession} type="button">
              Crear sesión demo
            </button>
            <Link className="text-link" href="/register">
              Crear cuenta
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
