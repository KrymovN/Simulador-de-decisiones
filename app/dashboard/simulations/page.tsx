import DashboardShell from "../../../components/DashboardShell";
import { SavedSimulationsHistorySurface } from "../../../components/SavedSimulationsHistorySurface";
import { readSavedSimulationsHistorySurface } from "../../../lib/saved-decision-simulations/product-surface";

export const dynamic = "force-dynamic";

export default async function SimulationsPage() {
  const state = await readSavedSimulationsHistorySurface();

  return (
    <DashboardShell
      description="Revisa las simulaciones guardadas de tu cuenta y vuelve a abrir mapas de decisión persistentes."
      eyebrow="levio.es / Historial guardado"
      title="Simulaciones guardadas."
    >
      <div className="saved-records-surface saved-records-surface--list">
        <SavedSimulationsHistorySurface state={state} />
      </div>
    </DashboardShell>
  );
}
