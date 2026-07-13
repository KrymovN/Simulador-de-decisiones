import type { CSSProperties } from "react";
import Link from "next/link";
import DashboardShell from "../../components/DashboardShell";
import MockAuthGate from "../../components/MockAuthGate";
import UnavailableAction from "../../components/UnavailableAction";
import { mockSimulations } from "../../lib/mockSimulations";
import { memorySettings, savedDecisions } from "../../lib/personalArea";

const summaryCards = [
  { label: "Simulaciones locales", value: "12", detail: "3 listas para revisar" },
  { label: "Decisiones activas", value: String(savedDecisions.length), detail: "2 con señales sensibles" },
  { label: "Idioma preparado", value: "Español", detail: "Base i18n futura" },
  { label: "Memoria futura", value: memorySettings.state, detail: "Consentimiento preparado" },
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
        description="Vista preparada para revisar simulaciones locales, decisiones de ejemplo y futura evolución estratégica."
        eyebrow="levio.es / Vista preparada"
        title="Panel de simulación preparado."
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
            <p className="eyebrow">Estado del entorno preparado</p>
            <h2 id="engine-state-title">La vista de simulación está preparada para revisar decisiones de ejemplo.</h2>
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
            <UnavailableAction
              className="button-link"
              label="Ejemplo no reabrible"
              explanation="Esta tarjeta es demostrativa y no corresponde a una simulación guardada."
            />
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
                  <UnavailableAction
                    label="Mapa demo no reabrible"
                    explanation="Este ejemplo no corresponde a una simulación guardada de la cuenta."
                  />
                </div>
              ))}
            </div>
            <Link className="dashboard-action" href="/dashboard/simulations">
              Ver historial local
            </Link>
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

        <section className="dashboard-two-column">
          <article className="dashboard-card section-frame">
            <h2>Decisiones preparadas</h2>
            <div className="compact-list">
              {savedDecisions.slice(0, 3).map((decision) => (
                <div key={decision.id}>
                  <strong>{decision.title}</strong>
                  <span>{decision.nextAction}</span>
                </div>
              ))}
            </div>
            <Link className="dashboard-action" href="/dashboard/decisions">
              Revisar decisiones
            </Link>
          </article>

          <article className="dashboard-card section-frame">
            <h2>Memoria futura</h2>
            <p>
              {memorySettings.mode}. La memoria podrá pausarse, revisarse o eliminarse cuando exista backend productivo.
            </p>
            <div className="memory-status-strip">
              <span>{memorySettings.consent}</span>
              <strong>{memorySettings.lastUpdated}</strong>
            </div>
            <Link className="dashboard-action" href="/dashboard/memory">
              Ver memoria futura
            </Link>
          </article>
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
