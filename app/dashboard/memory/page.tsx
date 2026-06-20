import DashboardShell from "../../../components/DashboardShell";
import MockFeedbackButton from "../../../components/MockFeedbackButton";
import MockAuthGate from "../../../components/MockAuthGate";
import { memoryScopes, memorySettings, rememberedPatterns } from "../../../lib/personalArea";

const memoryActions = [
  {
    title: "Qué podría recordar Levio",
    copy: "Mostrar ejemplos de patrones, preferencias y señales para futuras simulaciones.",
  },
  {
    title: "Preparar pausa futura",
    copy: "Definir cómo se pausaría la personalización cuando la memoria esté activa.",
  },
  {
    title: "Preparar limpieza futura",
    copy: "Definir cómo se borrarían patrones preparados cuando exista backend y trazabilidad real.",
  },
];

export default function MemoryPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Prepara qué podría recordar el motor, qué quedaría fuera y cómo se usaría en futuras simulaciones."
        eyebrow="levio.es / Memoria futura"
        title="Memoria futura de decisiones."
      >
        <section className="memory-hero section-frame">
          <div className="memory-core" aria-hidden="true">
            <span></span>
          </div>
          <div>
            <p className="eyebrow">Personalización preparada</p>
            <h2>{memorySettings.mode}</h2>
            <p>
              La memoria no es un chat ni una conversación guardada. Es una capa futura de contexto estratégico que debe
              ser transparente, reversible y vinculada a consentimiento explícito.
            </p>
          </div>
          <div className="memory-state-panel">
            <span>Estado</span>
            <strong>{memorySettings.state}</strong>
            <p>{memorySettings.consent}</p>
            <small>Actualizado: {memorySettings.lastUpdated}</small>
          </div>
        </section>

        <section className="memory-layout">
          <article className="dashboard-card section-frame">
            <p className="eyebrow">Ámbitos de memoria futura</p>
            <h2>Qué podría usar el motor.</h2>
            <div className="memory-scope-list">
              {memoryScopes.map((scope) => (
                <label className="memory-scope" key={scope.label}>
                  <input checked={scope.active} readOnly type="checkbox" />
                  <span>
                    <strong>{scope.label}</strong>
                    <small>{scope.state}</small>
                    <p>{scope.copy}</p>
                  </span>
                </label>
              ))}
            </div>
          </article>

          <article className="dashboard-card section-frame">
            <p className="eyebrow">Transparencia</p>
            <h2>Patrones de ejemplo.</h2>
            <div className="remembered-patterns">
              {rememberedPatterns.map((pattern) => (
                <div key={pattern.title}>
                  <span>{pattern.source}</span>
                  <strong>{pattern.title}</strong>
                  <p>{pattern.copy}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="memory-actions">
          {memoryActions.map((action) => (
            <article className="dashboard-card section-frame" key={action.title}>
              <h3>{action.title}</h3>
              <p>{action.copy}</p>
              <MockFeedbackButton
                label={action.title === "Preparar limpieza futura" ? "Preparar limpieza" : "Preparar acción"}
                feedback={
                  action.title === "Preparar limpieza futura"
                    ? "Limpieza de memoria preparada en modo demo."
                    : "Preferencia de memoria actualizada en demo."
                }
              />
            </article>
          ))}
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
