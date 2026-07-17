import type { CSSProperties } from "react";
import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import UnavailableAction from "../../../components/UnavailableAction";
import { savedDecisions } from "../../../lib/personalArea";

const decisionStats = [
  {
    label: "Preparadas",
    value: String(savedDecisions.length),
    copy: "Decisiones en vista demo.",
  },
  {
    label: "Revisión próxima",
    value: "18 mayo",
    copy: "Oferta premium preparada para control.",
  },
  {
    label: "Mayor exposición",
    value: "64%",
    copy: "Nueva línea de producto requiere validación.",
  },
];

export default function DecisionsPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Organiza decisiones preparadas, próximos pasos, revisiones y exposición antes de actuar."
        eyebrow="levio.es / Decisiones"
        title="Decisiones preparadas."
      >
        <div className="workspace-surface workspace-surface--decisions">
        <section className="workspace-command">
          <div>
            <p className="eyebrow">Centro de seguimiento</p>
            <h2>Convierte cada simulación importante en una decisión observada.</h2>
            <p>
              Este espacio prepara la futura capa de decisiones: estado, prioridad, revisión, exposición y
              conexión con simulaciones completas.
            </p>
          </div>
          <div className="decision-stat-grid">
            {decisionStats.map((stat) => (
              <article className="decision-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <p>{stat.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="saved-decision-grid" aria-label="Decisiones preparadas">
          {savedDecisions.map((decision) => (
            <article className="saved-decision-card" key={decision.id}>
              <div className="decision-card-header">
                <span>{decision.category}</span>
                <small>{decision.status}</small>
              </div>
              <h2>{decision.title}</h2>
              <p>{decision.nextAction}</p>

              <div className="decision-bars">
                <div style={{ "--value": `${decision.signals.clarity}%` } as CSSProperties}>
                  <div>
                    <span>Claridad</span>
                    <strong>{decision.signals.clarity}%</strong>
                  </div>
                  <small></small>
                </div>
                <div style={{ "--value": `${decision.signals.exposure}%` } as CSSProperties}>
                  <div>
                    <span>Exposición</span>
                    <strong>{decision.signals.exposure}%</strong>
                  </div>
                  <small></small>
                </div>
              </div>

              <div className="detail-tags" aria-label="Etiquetas de decisión">
                {decision.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="decision-review">
                <span>Próxima revisión</span>
                <strong>{decision.scheduledReview}</strong>
                <small>Riesgo {decision.riskLevel}</small>
              </div>

              <div className="decision-action-row">
                <UnavailableAction
                  className="button-link"
                  label="Mapa demo no reabrible"
                  explanation="Este ejemplo no corresponde a una simulación guardada de la cuenta."
                />
              </div>
            </article>
          ))}
        </section>
        </div>
      </DashboardShell>
    </MockAuthGate>
  );
}
