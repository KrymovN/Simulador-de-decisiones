import type { CSSProperties } from "react";
import Link from "next/link";
import DashboardShell from "../../components/DashboardShell";
import MockAuthGate from "../../components/MockAuthGate";
import { mockSimulations } from "../../lib/mockSimulations";

const summaryCards = [
  { label: "Simulaciones guardadas", value: "12", detail: "3 listas para revisar" },
  { label: "Decisiones activas", value: "4", detail: "2 con señales sensibles" },
  { label: "Idioma activo", value: "Español", detail: "Base i18n preparada" },
  { label: "Memoria personalizada", value: "Pausable", detail: "Consentimiento configurable" },
];

const engineStages = [
  "Contexto leído",
  "Escenarios abiertos",
  "Riesgos ponderados",
  "Conclusión preparada",
];

const decisionRadar = [
  {
    label: "Mayor oportunidad",
    value: "Oferta premium",
    copy: "Ventaja alta si el lanzamiento se hace por cohortes.",
  },
  {
    label: "Mayor exposición",
    value: "Nueva línea",
    copy: "Riesgo financiero inicial antes de validar demanda.",
  },
  {
    label: "Consecuencia latente",
    value: "Cambio de país",
    copy: "Impacto emocional probable después del tercer mes.",
  },
];

export default function DashboardPage() {
  const featuredSimulation = mockSimulations[0];

  return (
    <MockAuthGate>
      <DashboardShell
        description="Tu historial de decisiones, tus simulaciones y tu evolución estratégica en un solo lugar."
        eyebrow="levio.es / Área personal"
        title="Panel privado de simulación."
      >
        <section className="dashboard-grid">
          {summaryCards.map((card) => (
            <article className="dashboard-card signal-card section-frame" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="dashboard-engine section-frame" aria-labelledby="engine-state-title">
          <div className="engine-status-core" aria-hidden="true">
            <span></span>
          </div>
          <div>
            <p className="eyebrow">Estado del motor privado</p>
            <h2 id="engine-state-title">Tu espacio estratégico está preparado para revisar decisiones.</h2>
            <div className="engine-stage-list" aria-label="Estado actual del motor">
              {engineStages.map((stage, index) => (
                <div className="engine-stage" key={stage}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{stage}</strong>
                </div>
              ))}
            </div>
          </div>
          <article className="active-simulation-panel">
            <span>Simulación prioritaria</span>
            <strong>{featuredSimulation.decision}</strong>
            <p>{featuredSimulation.result}</p>
            <div
              aria-label={`Ventaja estratégica ${featuredSimulation.signals.advantage} por ciento`}
              className="signal-track"
              style={{ "--value": `${featuredSimulation.signals.advantage}%` } as CSSProperties}
            >
              <span></span>
            </div>
            <Link className="button-link" href={`/dashboard/simulations/${featuredSimulation.id}`}>
              Abrir simulación
            </Link>
          </article>
        </section>

        <section className="decision-radar" aria-label="Radar de decisiones personales">
          {decisionRadar.map((item) => (
            <article className="radar-card section-frame" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.copy}</p>
            </article>
          ))}
        </section>

        <section className="dashboard-two-column">
          <article className="dashboard-card section-frame">
            <h2>Últimas simulaciones</h2>
            <div className="compact-list">
              {mockSimulations.map((simulation) => (
                <div key={simulation.id}>
                  <strong>{simulation.decision}</strong>
                  <span>{simulation.result}</span>
                  <Link href={`/dashboard/simulations/${simulation.id}`}>Ver mapa estratégico</Link>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card section-frame">
            <h2>Consecuencias en vigilancia</h2>
            <div className="mini-timeline">
              {featuredSimulation.timeline.map((item) => (
                <div key={item.period}>
                  <span>{item.period}</span>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              ))}
            </div>
            <a className="dashboard-action" href="/#decision-input">
              Nueva simulación
            </a>
          </article>
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
