import Link from "next/link";
import type {
  SavedSimulationDetailSurfaceResult,
  SavedSimulationsHistorySurfaceResult,
} from "../lib/saved-decision-simulations/product-surface";
import { archiveSavedSimulationFromDashboard } from "../lib/saved-decision-simulations/ui-save-action";

type SavedSimulationsHistorySurfaceProps = {
  state: SavedSimulationsHistorySurfaceResult;
};

type SavedSimulationDetailSurfaceProps = {
  state: SavedSimulationDetailSurfaceResult;
};

function StateCard({
  title,
  message,
  actionLabel,
  actionHref,
  alert = false,
}: {
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  alert?: boolean;
}) {
  return (
    <section className="dashboard-card section-frame" role={alert ? "alert" : "status"}>
      <h2>{title}</h2>
      <p>{message}</p>
      <Link className="dashboard-action" href={actionHref}>
        {actionLabel}
      </Link>
    </section>
  );
}

export function SavedSimulationsHistorySurface({
  state,
}: SavedSimulationsHistorySurfaceProps) {
  if (state.status === "auth_required") {
    return (
      <StateCard
        actionHref="/login?next=/dashboard/simulations"
        actionLabel="Iniciar sesión"
        message={state.message}
        title="Acceso necesario."
      />
    );
  }

  if (state.status === "empty") {
    return (
      <StateCard
        actionHref="/#decision-input"
        actionLabel="Crear una simulación"
        message={state.message}
        title="Sin simulaciones guardadas."
      />
    );
  }

  if (state.status === "error") {
    return (
      <StateCard
        actionHref="/dashboard"
        actionLabel="Volver al panel"
        alert
        message={state.message}
        title="Historial no disponible."
      />
    );
  }

  return (
    <section className="simulation-list" aria-label="Historial de simulaciones guardadas">
      {state.simulations.map((simulation) => (
        <article className="simulation-row section-frame" key={simulation.id}>
          <div>
            <span>{simulation.createdLabel}</span>
            <strong>{simulation.title}</strong>
            <small>{simulation.sourceLabel}</small>
          </div>
          <p>{simulation.summary}</p>
          <div className="simulation-signal-grid" aria-label="Señales de la simulación">
            <div className="simulation-signal">
              <span>Estado</span>
              <strong>{simulation.statusLabel}</strong>
            </div>
            <div className="simulation-signal">
              <span>Claridad</span>
              <strong>{simulation.confidenceLabel}</strong>
            </div>
            <div className="simulation-signal">
              <span>Riesgo</span>
              <strong>{simulation.riskLabel}</strong>
            </div>
          </div>
          <div className="row-actions">
            <Link className="row-action-link" href={simulation.href}>
              Abrir simulación
            </Link>
            <form action={archiveSavedSimulationFromDashboard}>
              <input name="recordId" type="hidden" value={simulation.id} />
              <button className="ghost-button" type="submit">
                Archivar
              </button>
            </form>
          </div>
        </article>
      ))}
    </section>
  );
}

export function SavedSimulationDetailSurface({
  state,
}: SavedSimulationDetailSurfaceProps) {
  if (state.status === "auth_required") {
    return (
      <StateCard
        actionHref="/login?next=/dashboard/simulations"
        actionLabel="Iniciar sesión"
        message={state.message}
        title="Acceso necesario."
      />
    );
  }

  if (state.status === "invalid_id" || state.status === "not_found") {
    return (
      <StateCard
        actionHref="/dashboard/simulations"
        actionLabel="Volver al historial"
        message={state.message}
        title="Simulación no disponible."
      />
    );
  }

  if (state.status === "error") {
    return (
      <StateCard
        actionHref="/dashboard/simulations"
        actionLabel="Volver al historial"
        alert
        message={state.message}
        title="No se pudo abrir la simulación."
      />
    );
  }

  const { simulation } = state;

  return (
    <>
      <section className="simulation-detail-hero section-frame">
        <div>
          <p className="eyebrow">Simulación reabierta</p>
          <h2>{simulation.title}</h2>
          <p>{simulation.decisionSummary}</p>
          <div className="detail-tags" aria-label="Metadatos de simulación">
            <span>{simulation.lifecycleLabel}</span>
            <span>{simulation.sourceLabel}</span>
            <span>{simulation.languageLabel}</span>
          </div>
        </div>

        <div className="detail-metrics" aria-label="Señales de simulación guardada">
          <div className="detail-metric">
            <span>Claridad</span>
            <strong>{simulation.confidenceLabel}</strong>
          </div>
          <div className="detail-metric">
            <span>Riesgo</span>
            <strong>{simulation.riskLabel}</strong>
          </div>
          <div className="detail-metric">
            <span>Motor</span>
            <strong>{simulation.engineStatusLabel}</strong>
          </div>
          <div className="detail-metric">
            <span>Datos</span>
            <strong>{simulation.exportLabel}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-card section-frame">
        <p className="eyebrow">Entrada original</p>
        <h2>Decisión guardada.</h2>
        <p>{simulation.userInputSummary}</p>
      </section>

      {simulation.scenarios.length > 0 ? (
        <section className="detail-scenario-grid" aria-label="Escenarios guardados">
          {simulation.scenarios.map((scenario) => (
            <article className="scenario-detail-card section-frame" key={scenario.id}>
              <p>{scenario.label}</p>
              <h2>{scenario.title}</h2>
              <div className="scenario-score">
                <span>{scenario.signal}</span>
              </div>
              <small>{scenario.copy}</small>
            </article>
          ))}
        </section>
      ) : (
        <section className="dashboard-card section-frame" role="status">
          <h2>Escenarios no disponibles.</h2>
          <p>Esta simulación guardada no contiene escenarios estructurados para mostrar en el historial activo.</p>
        </section>
      )}

      {simulation.notices.length > 0 && (
        <section className="dashboard-card section-frame">
          <p className="eyebrow">Avisos del motor</p>
          <h2>Limitaciones guardadas.</h2>
          <div className="compact-list">
            {simulation.notices.map((notice) => (
              <div key={notice}>
                <strong>{notice}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-card section-frame">
        <span>Estado de privacidad</span>
        <strong>Datos de la cuenta autenticada</strong>
        <p>
          Esta vista usa el runtime interno de simulaciones guardadas. Los registros archivados no aparecen en el
          historial activo.
        </p>
        <Link className="dashboard-action" href="/dashboard/simulations">
          Volver al historial
        </Link>
        <form action={archiveSavedSimulationFromDashboard}>
          <input name="recordId" type="hidden" value={simulation.id} />
          <button className="ghost-button" type="submit">
            Archivar simulación
          </button>
        </form>
      </section>
    </>
  );
}
