import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardShell from "../../../../components/DashboardShell";
import MockAuthGate from "../../../../components/MockAuthGate";
import { getMockSimulation, mockSimulations } from "../../../../lib/mockSimulations";

export function generateStaticParams() {
  return mockSimulations.map((simulation) => ({
    id: simulation.id,
  }));
}

type SimulationDetailPageProps = {
  params: {
    id: string;
  };
};

export default function SimulationDetailPage({ params }: SimulationDetailPageProps) {
  const simulation = getMockSimulation(params.id);

  if (!simulation) {
    notFound();
  }

  return (
    <MockAuthGate>
      <DashboardShell
        description="Mapa privado de escenarios, riesgos, consecuencias retrasadas y ruta estratégica recomendada."
        eyebrow={`levio.es / ${simulation.category}`}
        title={simulation.decision}
      >
        <section className="simulation-detail-hero section-frame">
          <div>
            <p className="eyebrow">Conclusión estratégica</p>
            <h2>{simulation.strategicConclusion}</h2>
            <p>{simulation.detailCopy}</p>
            <div className="detail-tags" aria-label="Etiquetas estratégicas">
              {simulation.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="detail-metrics" aria-label="Métricas de simulación">
            <div className="detail-metric">
              <span>Riesgo</span>
              <strong>{simulation.signals.risk}%</strong>
            </div>
            <div className="detail-metric">
              <span>Ventaja</span>
              <strong>{simulation.signals.advantage}%</strong>
            </div>
            <div className="detail-metric">
              <span>Latencia</span>
              <strong>{simulation.signals.latency}</strong>
            </div>
            <div className="detail-metric">
              <span>Confianza</span>
              <strong>{simulation.signals.confidence}%</strong>
            </div>
          </div>
        </section>

        <section className="detail-scenario-grid" aria-label="Escenarios principales">
          {simulation.scenarios.map((scenario) => (
            <article className="scenario-detail-card section-frame" key={scenario.label}>
              <p>{scenario.label}</p>
              <h2>{scenario.title}</h2>
              <div className="scenario-score">
                <span>{scenario.signal}</span>
                <strong>{scenario.score}</strong>
              </div>
              <small>{scenario.copy}</small>
            </article>
          ))}
        </section>

        <section className="simulation-detail-layout">
          <article className="dashboard-card section-frame">
            <p className="eyebrow">Impacto previsto</p>
            <h2>Cómo transforma la decisión.</h2>
            <div className="impact-list">
              {simulation.impacts.map((impact) => (
                <div
                  className="impact-row"
                  key={impact.label}
                  style={{ "--value": `${impact.value}%` } as CSSProperties}
                >
                  <div>
                    <strong>{impact.label}</strong>
                    <span>{impact.value}%</span>
                  </div>
                  <div className="impact-bar" aria-hidden="true">
                    <span></span>
                  </div>
                  <p>{impact.copy}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card section-frame">
            <p className="eyebrow">Consecuencias retrasadas</p>
            <h2>Línea temporal estratégica.</h2>
            <div className="detail-timeline">
              {simulation.timeline.map((item) => (
                <div key={item.period}>
                  <span>{item.period}</span>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-card section-frame">
          <span>Estado de privacidad</span>
          <strong>{simulation.privacy}</strong>
          <p>
            Esta vista usa datos demo. En producción, cada simulación debe pertenecer al usuario autenticado y respetar
            consentimiento, exportación y supresión de datos.
          </p>
          <Link className="dashboard-action" href="/dashboard/simulations">
            Volver al historial
          </Link>
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
