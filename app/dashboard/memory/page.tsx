import DashboardShell from "../../../components/DashboardShell";
import UnavailableAction from "../../../components/UnavailableAction";
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
        <div className="workspace-surface workspace-surface--memory">
        <section className="workspace-memory-overview">
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
          <article className="dashboard-card">
            <p className="eyebrow">Ámbitos de memoria futura</p>
            <h2>Qué podría usar el motor.</h2>
            <div className="memory-scope-list">
              {memoryScopes.map((scope) => (
                <label className="memory-scope" key={scope.label}>
                  <input checked={scope.active} disabled type="checkbox" />
                  <span>
                    <strong>{scope.label}</strong>
                    <small>{scope.state}</small>
                    <p>{scope.copy}</p>
                  </span>
                </label>
              ))}
            </div>
          </article>

          <article className="dashboard-card">
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
            <article className="dashboard-card" key={action.title}>
              <h3>{action.title}</h3>
              <p>{action.copy}</p>
              <UnavailableAction
                label="Acción no disponible"
                explanation="La memoria todavía no está activa; esta acción no modifica ningún dato en esta versión."
              />
            </article>
          ))}
        </section>
        </div>
      </DashboardShell>
    </MockAuthGate>
  );
}
