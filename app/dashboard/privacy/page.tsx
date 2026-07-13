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
        {searchParams.draftDeletion === "completed" && (
          <section className="dashboard-card section-frame" role="status">
            <h2>El borrador ya no está disponible.</h2>
            <p>Su contenido activo se ha eliminado o ya no estaba disponible. No se ha modificado ninguna otra simulación ni la cuenta.</p>
          </section>
        )}
        <section className="dashboard-grid">
          <article className="dashboard-card section-frame">
            <span>Datos personales</span>
            <strong>Perfil mínimo</strong>
          </article>
          <article className="dashboard-card section-frame">
            <span>Consentimiento preparado</span>
            <strong>Pendiente de activación productiva</strong>
          </article>
          <article className="dashboard-card section-frame">
            <span>Memoria futura</span>
            <strong>Preparada</strong>
          </article>
        </section>
        <PrivacyPanel />
      </DashboardShell>
    </MockAuthGate>
  );
}
