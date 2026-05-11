import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import PrivacyPanel from "../../../components/PrivacyPanel";

export default function PrivacyPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Gestiona consentimiento, memoria personalizada, portabilidad, supresión y límites del tratamiento."
        eyebrow="levio.es / Centro de privacidad"
        title="Privacidad y control de datos."
      >
        <section className="dashboard-grid">
          <article className="dashboard-card section-frame">
            <span>Datos personales</span>
            <strong>Perfil mínimo</strong>
          </article>
          <article className="dashboard-card section-frame">
            <span>Consentimiento activo</span>
            <strong>Análisis personalizado</strong>
          </article>
          <article className="dashboard-card section-frame">
            <span>Memoria personalizada</span>
            <strong>Configurable</strong>
          </article>
        </section>
        <PrivacyPanel />
      </DashboardShell>
    </MockAuthGate>
  );
}
