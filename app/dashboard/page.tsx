import Link from "next/link";
import DashboardShell from "../../components/DashboardShell";
import HomeSimulator from "../../components/HomeSimulator";
import { SavedSimulationsHistorySurface } from "../../components/SavedSimulationsHistorySurface";
import { readSavedSimulationsHistorySurface } from "../../lib/saved-decision-simulations/product-surface";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const historyState = await readSavedSimulationsHistorySurface({ limit: 3 });
  const hasSavedSimulations = historyState.status === "ready";

  return (
    <DashboardShell
      description="Inicia una simulación, revisa tu historial guardado y gestiona los datos de tu cuenta."
      eyebrow="levio.es / Mi espacio"
      title="Mi espacio."
    >
      <section
        aria-labelledby="workspace-simulator-title"
        className="dashboard-workspace-simulator"
        id="nueva-simulacion"
      >
        <div className="dashboard-workspace-simulator__intro">
          <p className="eyebrow">Nueva simulación</p>
          <h2 id="workspace-simulator-title">Simula una decisión desde tu espacio.</h2>
          <p>El resultado permanecerá aquí para que puedas revisarlo y guardarlo en tu historial.</p>
        </div>
        <HomeSimulator />
      </section>

      <section aria-label="Historial y cuenta" className="dashboard-two-column">
        <article className="dashboard-card">
          <p className="eyebrow">Historial</p>
          <h2>{hasSavedSimulations ? "Revisa tus simulaciones guardadas." : "Aún no tienes simulaciones guardadas."}</h2>
          <p>
            {hasSavedSimulations
              ? "Abre una simulación anterior o gestiona los resultados vinculados a tu cuenta."
              : "Cuando guardes tu primera simulación, aparecerá aquí vinculada a tu cuenta."}
          </p>
          <Link className="dashboard-action" href="/dashboard/simulations">
            Abrir historial
          </Link>
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
