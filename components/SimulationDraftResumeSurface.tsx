import Link from "next/link";
import type { SimulationDraftResumeState } from "../lib/user-data-controls/simulation-draft-resume-surface";
import { deleteSimulationDraftFromDashboard } from "../lib/user-data-controls/simulation-draft-deletion-action";
import { saveSimulationDraftResumeAction } from "../lib/user-data-controls/simulation-draft-resume-action";

export default function SimulationDraftResumeSurface({ state, saveStatus, deletionStatus }: { state: SimulationDraftResumeState; saveStatus?: string; deletionStatus?: string }) {
  if ("message" in state) {
    return <section className="dashboard-card saved-records-state" role="status"><h2>Borrador no disponible.</h2><p>{state.message}</p><Link className="dashboard-action" href="/dashboard/privacy">Volver a privacidad</Link></section>;
  }
  const expiration = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(state.expiresAt));
  return <>
    <section className="dashboard-card saved-records-state saved-records-retention" role={state.status === "warning_window" ? "alert" : "status"}>
      <p className="eyebrow">Estado del borrador</p><h2>{state.status === "warning_window" ? "El borrador caducará pronto." : "Borrador activo."}</h2>
      <p>Fecha de eliminación: <strong>{expiration}</strong>.</p>
      {state.status === "warning_window" && <p>Un cambio real guardado ampliará el plazo 30 días. Abrirlo o guardar el mismo contenido no lo ampliará.</p>}
    </section>
    {saveStatus && <section className="dashboard-card saved-records-state" role="status"><p>{saveStatus === "saved" ? "Cambios guardados. La fecha de eliminación se ha actualizado." : saveStatus === "unchanged" ? "No había cambios de contenido; la fecha no se ha modificado." : "No se pudieron guardar los cambios."}</p></section>}
    {deletionStatus && <section className="dashboard-card saved-records-state saved-records-state--error" role="alert"><p>{deletionStatus === "confirmation_required" ? "Confirma que comprendes que la eliminación es irreversible." : deletionStatus === "restricted" ? "Este borrador está restringido y no se puede eliminar." : "No se pudo eliminar el borrador. Su contenido permanece sin cambios."}</p></section>}
    <form action={saveSimulationDraftResumeAction} className="dashboard-card saved-records-card saved-records-form saved-records-form--edit">
      <input name="draftId" type="hidden" value={state.draftId} />
      <label htmlFor="draftText"><strong>Contenido del borrador</strong></label>
      <textarea defaultValue={state.draftText} id="draftText" name="draftText" rows={12} required />
      <button className="dashboard-action" type="submit">Guardar cambios</button>
    </form>
    <form action={deleteSimulationDraftFromDashboard} className="dashboard-card saved-records-card saved-records-form saved-records-form--delete">
      <input name="draftId" type="hidden" value={state.draftId} />
      <p className="eyebrow">Eliminar borrador</p>
      <h2>Esta acción es irreversible.</h2>
      <p>Se eliminará el contenido activo de este borrador y no podrá recuperarse. No se eliminarán otras simulaciones, el historial ni la cuenta.</p>
      <label className="checkbox-row">
        <input name="confirmDeletion" required type="checkbox" value="confirm_irreversible_draft_deletion" />
        <span>Entiendo que el contenido del borrador se eliminará de forma irreversible.</span>
      </label>
      <button className="ghost-button" type="submit">Eliminar borrador</button>
    </form>
  </>;
}
