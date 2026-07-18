import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import PrivacyPanel from "../../../components/PrivacyPanel";

export default function PrivacyPage({ searchParams }: { searchParams: { draftDeletion?: string } }) {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Prepara consentimiento, memoria futura, portabilidad, supresión y límites del tratamiento para etapas productivas."
        eyebrow="levio.es / Centro de privacidad"
        title="Privacidad y controles preparados."
      >
        <div className="privacy-controls-surface">
          {searchParams.draftDeletion === "completed" && (
            <section className="dashboard-card privacy-controls-state privacy-controls-state--success" role="status">
              <h2>El borrador ya no está disponible.</h2>
              <p>Su contenido activo se ha eliminado o ya no estaba disponible. No se ha modificado ninguna otra simulación ni la cuenta.</p>
            </section>
          )}
          <section className="dashboard-grid privacy-controls-summary">
            <article className="dashboard-card privacy-controls-card">
              <span>Datos personales</span>
              <strong>Perfil mínimo</strong>
            </article>
            <article className="dashboard-card privacy-controls-card">
              <span>Consentimiento preparado</span>
              <strong>Pendiente de activación productiva</strong>
            </article>
            <article className="dashboard-card privacy-controls-card">
              <span>Memoria futura</span>
              <strong>Preparada</strong>
            </article>
          </section>
          <PrivacyPanel />
        </div>
      </DashboardShell>
    </MockAuthGate>
  );
}
