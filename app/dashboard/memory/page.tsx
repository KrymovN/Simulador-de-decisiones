import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import { memoryScopes, memorySettings, rememberedPatterns } from "../../../lib/personalArea";

const memoryActions = [
  {
    title: "Ver lo recordado",
    copy: "Mostrar patrones, preferencias y señales usadas por futuras simulaciones.",
  },
  {
    title: "Pausar memoria",
    copy: "Detener personalización sin eliminar historial ni simulaciones guardadas.",
  },
  {
    title: "Eliminar memoria",
    copy: "Borrar patrones personalizados cuando exista backend y trazabilidad real.",
  },
];

export default function MemoryPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Controla qué puede recordar el motor, qué queda fuera y cómo se usará en futuras simulaciones."
        eyebrow="levio.es / Memoria personalizada"
        title="Memoria de decisiones."
      >
        <section className="memory-hero section-frame">
          <div className="memory-core" aria-hidden="true">
            <span></span>
          </div>
          <div>
            <p className="eyebrow">Personalización bajo control</p>
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
            <p className="eyebrow">Ámbitos de memoria</p>
            <h2>Qué puede usar el motor.</h2>
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
            <h2>Patrones detectados.</h2>
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
              <button type="button">Preparar acción</button>
            </article>
          ))}
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
