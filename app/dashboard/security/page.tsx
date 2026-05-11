import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import SecurityPanel from "../../../components/SecurityPanel";

export default function SecurityPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Controla contraseña, sesiones activas y el futuro estado de protección avanzada de la cuenta."
        eyebrow="levio.es / Seguridad"
        title="Seguridad de la cuenta."
      >
        <section className="dashboard-two-column">
          <article className="dashboard-card section-frame">
            <h2>Cambiar contraseña</h2>
            <form className="profile-form">
              <label>
                Contraseña actual
                <input placeholder="••••••••" type="password" />
              </label>
              <label>
                Nueva contraseña
                <input placeholder="••••••••" type="password" />
              </label>
              <button type="button">Actualizar contraseña</button>
            </form>
          </article>

          <article className="dashboard-card section-frame">
            <h2>Autenticación en dos pasos</h2>
            <p>Preparado para activar verificación adicional cuando exista auth provider productivo.</p>
            <button type="button">Preparar 2FA</button>
          </article>
        </section>
        <SecurityPanel />
      </DashboardShell>
    </MockAuthGate>
  );
}
