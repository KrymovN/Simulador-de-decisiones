import DashboardShell from "../../components/DashboardShell";
import MockAuthGate from "../../components/MockAuthGate";

const summaryCards = [
  { label: "Simulaciones guardadas", value: "12" },
  { label: "Decisiones activas", value: "4" },
  { label: "Idioma activo", value: "Español" },
  { label: "Memoria personalizada", value: "Pausable" },
];

const latestSimulations = [
  "Lanzamiento de producto premium",
  "Cambio de país y continuidad laboral",
  "Inversión en nueva línea estratégica",
];

export default function DashboardPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Tu historial de decisiones, tus simulaciones y tu evolución estratégica en un solo lugar."
        eyebrow="levio.es / Área personal"
        title="Panel privado de simulación."
      >
        <section className="dashboard-grid">
          {summaryCards.map((card) => (
            <article className="dashboard-card section-frame" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <section className="dashboard-two-column">
          <article className="dashboard-card section-frame">
            <h2>Últimas simulaciones</h2>
            <div className="compact-list">
              {latestSimulations.map((item) => (
                <div key={item}>
                  <strong>{item}</strong>
                  <span>Resultado estratégico preparado para revisión</span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card section-frame">
            <h2>Acceso rápido</h2>
            <p>Inicia una nueva simulación desde el motor principal y guarda el resultado en tu área personal.</p>
            <a className="dashboard-action" href="/#decision-input">
              Nueva simulación
            </a>
          </article>
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
