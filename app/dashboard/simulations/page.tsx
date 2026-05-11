import Link from "next/link";
import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import { mockSimulations } from "../../../lib/mockSimulations";

export default function SimulationsPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Consulta decisiones analizadas, resultados estratégicos y acciones de gestión sobre cada simulación."
        eyebrow="levio.es / Historial"
        title="Historial de simulaciones."
      >
        <section className="simulation-list">
          {mockSimulations.map((simulation) => (
            <article className="simulation-row section-frame" key={simulation.decision}>
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
                <button className="ghost-button" type="button">
                  Eliminar simulación
                </button>
              </div>
            </article>
          ))}
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
