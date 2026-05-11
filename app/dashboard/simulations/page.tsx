import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";

const simulations = [
  {
    date: "11 mayo 2026",
    category: "Negocio",
    decision: "Lanzar una nueva oferta premium",
    result: "Alta oportunidad con riesgo operativo moderado",
  },
  {
    date: "08 mayo 2026",
    category: "Vida",
    decision: "Cambiar de país durante seis meses",
    result: "Impacto emocional alto con ventaja estratégica diferida",
  },
  {
    date: "03 mayo 2026",
    category: "Finanzas",
    decision: "Invertir en una nueva línea de producto",
    result: "Retorno potencial gradual con exposición inicial elevada",
  },
];

export default function SimulationsPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Consulta decisiones analizadas, resultados estratégicos y acciones de gestión sobre cada simulación."
        eyebrow="levio.es / Historial"
        title="Historial de simulaciones."
      >
        <section className="simulation-list">
          {simulations.map((simulation) => (
            <article className="simulation-row section-frame" key={simulation.decision}>
              <div>
                <span>{simulation.date}</span>
                <strong>{simulation.decision}</strong>
                <small>{simulation.category}</small>
              </div>
              <p>{simulation.result}</p>
              <div className="row-actions">
                <button type="button">Ver detalle</button>
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
