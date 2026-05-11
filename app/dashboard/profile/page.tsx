import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import { accountSignals, activityLog, futureLanguages, userProfile } from "../../../lib/personalArea";

export default function ProfilePage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Gestiona identidad, idioma preferido y configuración regional para futuras simulaciones personalizadas."
        eyebrow="levio.es / Perfil"
        title="Perfil del usuario."
      >
        <section className="profile-overview section-frame">
          <div className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">
              <span></span>
            </div>
            <div>
              <p className="eyebrow">Identidad privada</p>
              <h2>{userProfile.name}</h2>
              <p>{userProfile.email}</p>
            </div>
          </div>
          <div className="profile-state-grid">
            <div>
              <span>Idioma</span>
              <strong>{userProfile.language}</strong>
            </div>
            <div>
              <span>Privacidad</span>
              <strong>{userProfile.privacyLevel}</strong>
            </div>
            <div>
              <span>Modo</span>
              <strong>{userProfile.strategicMode}</strong>
            </div>
          </div>
        </section>

        <section className="profile-layout">
          <article className="dashboard-card section-frame">
            <h2>Datos de cuenta</h2>
            <form className="profile-form">
              <label>
                Nombre
                <input defaultValue={userProfile.name} type="text" />
              </label>
              <label>
                Correo electrónico
                <input defaultValue={userProfile.email} type="email" />
              </label>
              <label>
                Idioma preferido
                <select defaultValue={userProfile.language}>
                  {futureLanguages.map((language) => (
                    <option key={language}>{language}</option>
                  ))}
                </select>
              </label>
              <label>
                País / región
                <input defaultValue={userProfile.country} type="text" />
              </label>
              <label>
                Zona horaria
                <input defaultValue={userProfile.timezone} type="text" />
              </label>
              <label>
                Cambiar contraseña
                <input placeholder="Nueva contraseña" type="password" />
              </label>
              <button type="button">Guardar cambios</button>
            </form>
          </article>

          <aside className="profile-side">
            <section className="dashboard-card section-frame">
              <h2>Preparación del perfil</h2>
              <div className="profile-signal-list">
                {accountSignals.map((signal) => (
                  <div key={signal.label}>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                    <p>{signal.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-card section-frame">
              <h2>Actividad reciente</h2>
              <div className="detail-timeline">
                {activityLog.map((event) => (
                  <div key={`${event.date}-${event.title}`}>
                    <span>{event.date}</span>
                    <strong>{event.title}</strong>
                    <p>{event.copy}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
