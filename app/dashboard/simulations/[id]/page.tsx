import DashboardShell from "../../../../components/DashboardShell";
import { SavedSimulationDetailSurface } from "../../../../components/SavedSimulationsHistorySurface";
import { readSavedSimulationDetailSurface } from "../../../../lib/saved-decision-simulations/product-surface";

export const dynamic = "force-dynamic";

type SimulationDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function SimulationDetailPage({ params }: SimulationDetailPageProps) {
  const state = await readSavedSimulationDetailSurface({ recordId: params.id });
  const title =
    state.status === "loaded" ? state.simulation.title : "Simulación guardada";

  return (
    <DashboardShell
      description="Reabre una simulación persistente de tu cuenta sin convertirla en chat ni respuesta directa."
      eyebrow="levio.es / Simulación guardada"
      title={title}
    >
      <div className="saved-records-surface saved-records-surface--detail">
        <SavedSimulationDetailSurface state={state} />
      </div>
    </DashboardShell>
  );
}
