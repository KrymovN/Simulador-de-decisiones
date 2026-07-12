import Link from "next/link";
import type { SimulationDraftResumeState } from "../lib/user-data-controls/simulation-draft-resume-surface";
import { saveSimulationDraftResumeAction } from "../lib/user-data-controls/simulation-draft-resume-action";

export default function SimulationDraftResumeSurface({ state, saveStatus }: { state: SimulationDraftResumeState; saveStatus?: string }) {
  if ("message" in state) {
    return <section className="dashboard-card section-frame" role="status"><h2>Borrador no disponible.</h2><p>{state.message}</p><Link className="dashboard-action" href="/dashboard/privacy">Volver a privacidad</Link></section>;
  }
  const expiration = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(state.expiresAt));
  return <>
    <section className="dashboard-card section-frame" role={state.status === "warning_window" ? "alert" : "status"}>
      <p className="eyebrow">Estado del borrador</p><h2>{state.status === "warning_window" ? "El borrador caducará pronto." : "Borrador activo."}</h2>
      <p>Fecha de eliminación: <strong>{expiration}</strong>.</p>
      {state.status === "warning_window" && <p>Un cambio real guardado ampliará el plazo 30 días. Abrirlo o guardar el mismo contenido no lo ampliará.</p>}
    </section>
    {saveStatus && <section className="dashboard-card section-frame" role="status"><p>{saveStatus === "saved" ? "Cambios guardados. La fecha de eliminación se ha actualizado." : saveStatus === "unchanged" ? "No había cambios de contenido; la fecha no se ha modificado." : "No se pudieron guardar los cambios."}</p></section>}
    <form action={saveSimulationDraftResumeAction} className="dashboard-card section-frame">
      <input name="draftId" type="hidden" value={state.draftId} />
      <label htmlFor="draftText"><strong>Contenido del borrador</strong></label>
      <textarea defaultValue={state.draftText} id="draftText" name="draftText" rows={12} required />
      <button className="dashboard-action" type="submit">Guardar cambios</button>
    </form>
  </>;
}
