import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import SimulationsList from "../../../components/SimulationsList";
import { mockSimulations } from "../../../lib/mockSimulations";

export default function SimulationsPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Revisa simulaciones locales y ejemplos preparados con mapas de opciones, riesgos y consecuencias."
        eyebrow="levio.es / Simulaciones locales"
        title="Simulaciones locales."
      >
        <SimulationsList initialSimulations={mockSimulations} />
      </DashboardShell>
    </MockAuthGate>
  );
}
