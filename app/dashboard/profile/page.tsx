import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";

const languages = [
  "Español",
  "English",
  "Українська",
  "Русский",
  "العربية",
  "中文",
  "Français",
  "Deutsch",
  "Português",
  "Italiano",
];

export default function ProfilePage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Gestiona identidad, idioma preferido y configuración regional para futuras simulaciones personalizadas."
        eyebrow="levio.es / Perfil"
        title="Perfil del usuario."
      >
        <section className="dashboard-card section-frame">
          <form className="profile-form">
            <label>
              Nombre
              <input defaultValue="Usuario levio.es" type="text" />
            </label>
            <label>
              Correo electrónico
              <input defaultValue="usuario@levio.es" type="email" />
            </label>
            <label>
              Idioma preferido
              <select defaultValue="Español">
                {languages.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
            <label>
              País / región
              <input placeholder="España" type="text" />
            </label>
            <label>
              Zona horaria
              <input defaultValue="Europe/Madrid" type="text" />
            </label>
            <label>
              Cambiar contraseña
              <input placeholder="Nueva contraseña" type="password" />
            </label>
            <button type="button">Guardar cambios</button>
          </form>
        </section>
      </DashboardShell>
    </MockAuthGate>
  );
}
