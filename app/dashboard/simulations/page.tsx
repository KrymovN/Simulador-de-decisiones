import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import SimulationsList from "../../../components/SimulationsList";
import { mockSimulations } from "../../../lib/mockSimulations";

export default function SimulationsPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Consulta decisiones analizadas, resultados estratégicos y acciones de gestión sobre cada simulación."
        eyebrow="levio.es / Historial"
        title="Historial de simulaciones."
      >
        <SimulationsList initialSimulations={mockSimulations} />
      </DashboardShell>
    </MockAuthGate>
  );
}
