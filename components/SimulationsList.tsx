"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MockSimulation } from "../lib/mockSimulations";
import { LOCAL_SIMULATIONS_KEY } from "../lib/simulationEngine";

type SimulationsListProps = {
  initialSimulations: MockSimulation[];
};

function loadLocalSimulations() {
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

export default function SimulationsList({ initialSimulations }: SimulationsListProps) {
  const [localSimulations, setLocalSimulations] = useState<MockSimulation[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setLocalSimulations(loadLocalSimulations());
  }, []);

  const simulations = useMemo(() => {
    const merged = [...localSimulations, ...initialSimulations];
    const unique = merged.filter(
      (simulation, index, list) => list.findIndex((item) => item.id === simulation.id) === index,
    );

    return unique.filter((simulation) => !hiddenIds.includes(simulation.id));
  }, [hiddenIds, initialSimulations, localSimulations]);

  function deleteSimulation(id: string) {
    const nextLocal = localSimulations.filter((simulation) => simulation.id !== id);
    setLocalSimulations(nextLocal);
    setHiddenIds((current) => [...current, id]);
    window.localStorage.setItem(LOCAL_SIMULATIONS_KEY, JSON.stringify(nextLocal));
    setFeedback("Simulación retirada de esta vista demo.");
  }

  return (
    <>
      {feedback && (
        <div className="mock-feedback" role="status">
          {feedback}
        </div>
      )}
      <section className="simulation-list">
        {simulations.map((simulation) => (
          <article className="simulation-row section-frame" key={simulation.id}>
            <div>
              <span>{simulation.date}</span>
              <strong>{simulation.decision}</strong>
              <small>{simulation.category}</small>
            </div>
            <p>{simulation.result}</p>
            <div className="simulation-signal-grid" aria-label="Señales de la simulación">
              <div className="simulation-signal">
                <span>Riesgo</span>
                <strong>{simulation.signals.risk}%</strong>
              </div>
              <div className="simulation-signal">
                <span>Ventaja</span>
                <strong>{simulation.signals.advantage}%</strong>
              </div>
              <div className="simulation-signal">
                <span>Latencia</span>
                <strong>{simulation.signals.latency}</strong>
              </div>
            </div>
            <div className="row-actions">
              <Link className="row-action-link" href={`/dashboard/simulations/${simulation.id}`}>
                Ver detalle
              </Link>
              <button className="ghost-button" onClick={() => deleteSimulation(simulation.id)} type="button">
                Retirar de vista local
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
