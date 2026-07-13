import DashboardShell from "../../../components/DashboardShell";
import UnavailableAction from "../../../components/UnavailableAction";
import MockAuthGate from "../../../components/MockAuthGate";
import SecurityPanel from "../../../components/SecurityPanel";

export default function SecurityPage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Prepara controles de acceso, sesión de ejemplo y futura protección avanzada cuando exista auth productivo."
        eyebrow="levio.es / Seguridad"
        title="Seguridad preparada."
      >
        <section className="dashboard-two-column">
          <article className="dashboard-card section-frame">
            <h2>Preparar cambio de contraseña</h2>
            <div className="profile-form">
              <label>
                Contraseña de ejemplo
                <input disabled placeholder="No disponible" type="password" />
              </label>
              <label>
                Contraseña futura
                <input disabled placeholder="No disponible" type="password" />
              </label>
              <UnavailableAction
                label="Cambio no disponible"
                explanation="El cambio de contraseña no está activo en esta versión."
              />
            </div>
          </article>

          <article className="dashboard-card section-frame">
            <h2>Autenticación en dos pasos</h2>
            <p>Preparado para activar verificación adicional cuando exista auth provider productivo.</p>
            <UnavailableAction
              label="2FA no disponible"
              explanation="La autenticación en dos pasos todavía no está activa en esta versión."
            />
          </article>
        </section>
        <SecurityPanel />
      </DashboardShell>
    </MockAuthGate>
  );
}
