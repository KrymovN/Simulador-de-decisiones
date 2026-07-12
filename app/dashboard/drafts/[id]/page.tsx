import DashboardShell from "../../../../components/DashboardShell";
import SimulationDraftResumeSurface from "../../../../components/SimulationDraftResumeSurface";
import { readSimulationDraftResumeSurface } from "../../../../lib/user-data-controls/simulation-draft-resume-surface";

export const dynamic = "force-dynamic";

export default async function DraftResumePage({ params, searchParams }: { params: { id: string }; searchParams: { save?: string } }) {
  const state = await readSimulationDraftResumeSurface({ draftId: params.id });
  return <DashboardShell eyebrow="levio.es / Borrador" title="Continuar borrador" description="Edita un único borrador de tu cuenta dentro de su ciclo de retención.">
    <SimulationDraftResumeSurface state={state} saveStatus={searchParams.save} />
  </DashboardShell>;
}
