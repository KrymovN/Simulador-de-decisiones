import DashboardShell from "../../../components/DashboardShell";
import MockFeedbackButton from "../../../components/MockFeedbackButton";
import MockAuthGate from "../../../components/MockAuthGate";
import SecurityPanel from "../../../components/SecurityPanel";

export default function SecurityPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Prepara contraseña, sesión actual y futura protección avanzada de la cuenta."
        eyebrow="levio.es / Seguridad"
        title="Seguridad preparada."
      >
        <section className="dashboard-two-column">
          <article className="dashboard-card section-frame">
            <h2>Preparar cambio de contraseña</h2>
            <form className="profile-form">
              <label>
                Contraseña actual
                <input placeholder="••••••••" type="password" />
              </label>
              <label>
                Nueva contraseña
                <input placeholder="••••••••" type="password" />
              </label>
              <MockFeedbackButton label="Actualizar contraseña" feedback="Cambio de seguridad registrado en demo." />
            </form>
          </article>

          <article className="dashboard-card section-frame">
            <h2>Autenticación en dos pasos</h2>
            <p>Preparado para activar verificación adicional cuando exista auth provider productivo.</p>
            <MockFeedbackButton label="Preparar 2FA" feedback="Preferencia 2FA preparada para futura autenticación real." />
          </article>
        </section>
        <SecurityPanel />
      </DashboardShell>
    </MockAuthGate>
  );
}
