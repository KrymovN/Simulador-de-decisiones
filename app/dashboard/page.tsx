import Link from "next/link";
import DashboardShell from "../../components/DashboardShell";
import { SavedSimulationsHistorySurface } from "../../components/SavedSimulationsHistorySurface";
import { readSavedSimulationsHistorySurface } from "../../lib/saved-decision-simulations/product-surface";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const historyState = await readSavedSimulationsHistorySurface({ limit: 3 });
  const hasSavedSimulations = historyState.status === "ready";

  return (
    <DashboardShell
      description="Inicia una simulación, revisa tu historial guardado y gestiona los datos de tu cuenta."
      eyebrow="levio.es / Tu cuenta"
      title="Tu espacio de decisiones."
    >
      <section aria-label="Acciones principales" className="dashboard-two-column">
        <article className="dashboard-card">
          <p className="eyebrow">Simulaciones</p>
          <h2>{hasSavedSimulations ? "Empieza una nueva simulación." : "Aún no tienes simulaciones guardadas."}</h2>
          <p>
            {hasSavedSimulations
              ? "Describe otra decisión para generar una nueva simulación y guardarla en tu cuenta."
              : "Cuando guardes tu primera simulación, aparecerá aquí vinculada a tu cuenta."}
          </p>
          <a className="dashboard-action" href="/#decision-input">
            Nueva simulación
          </a>
        </article>

        <article className="dashboard-card">
          <p className="eyebrow">Cuenta</p>
          <h2>Tus datos, bajo tu control.</h2>
          <p>Consulta los controles existentes de privacidad, exportación, retención y eliminación de datos.</p>
          <Link className="dashboard-action" href="/dashboard/privacy">
            Abrir privacidad y datos
          </Link>
        </article>
      </section>

      {historyState.status !== "empty" && (
        <section aria-labelledby="dashboard-history-title" className="dashboard-card">
          <p className="eyebrow">Historial guardado</p>
          <h2 id="dashboard-history-title">Tus simulaciones recientes.</h2>
          <SavedSimulationsHistorySurface state={historyState} />
          {historyState.status === "ready" && (
            <Link className="dashboard-action" href="/dashboard/simulations">
              Ver todo el historial
            </Link>
          )}
        </section>
      )}
    </DashboardShell>
  );
}
