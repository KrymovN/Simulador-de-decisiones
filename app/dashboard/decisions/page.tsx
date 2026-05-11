import type { CSSProperties } from "react";
import Link from "next/link";
import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import { savedDecisions } from "../../../lib/personalArea";

const decisionStats = [
  {
    label: "Guardadas",
    value: String(savedDecisions.length),
    copy: "Decisiones con seguimiento activo.",
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
        description="Organiza decisiones guardadas, próximos pasos, revisiones y exposición antes de actuar."
        eyebrow="levio.es / Decisiones"
        title="Decisiones guardadas."
      >
        <section className="decision-command section-frame">
          <div>
            <p className="eyebrow">Centro de seguimiento</p>
            <h2>Convierte cada simulación importante en una decisión observada.</h2>
            <p>
              Este espacio prepara la futura capa de decisiones guardadas: estado, prioridad, revisión, exposición y
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

        <section className="saved-decision-grid" aria-label="Decisiones guardadas">
          {savedDecisions.map((decision) => (
            <article className="saved-decision-card section-frame" key={decision.id}>
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
                <Link className="button-link" href={`/dashboard/simulations/${decision.linkedSimulationId}`}>
                  Abrir mapa
                </Link>
                <button className="ghost-button" type="button">
                  Marcar revisión
                </button>
              </div>
            </article>
          ))}
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
