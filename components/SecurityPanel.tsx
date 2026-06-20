import MockFeedbackButton from "./MockFeedbackButton";

const sessions = [
  {
    device: "MacBook Air",
    location: "Madrid, España",
    state: "Sesión actual",
  },
  {
    device: "iPhone",
    location: "Dispositivo de ejemplo",
    state: "Sin sincronización activa",
  },
];

export default function SecurityPanel() {
  return (
    <div className="security-layout">
      <section className="dashboard-card section-frame">
        <p className="eyebrow">Protección preparada</p>
        <h2>Seguridad lista para futura autenticación real.</h2>
        <div className="security-score" aria-label="Estado de protección de cuenta">
          <span></span>
          <strong>Protección preparada</strong>
          <p>Contraseña, sesión actual y futura autenticación en dos pasos.</p>
        </div>
      </section>

      <section className="dashboard-card section-frame">
        <h3>Sesión actual y ejemplo</h3>
        <div className="session-list">
          {sessions.map((session) => (
            <div key={session.device}>
              <strong>{session.device}</strong>
              <span>{session.location}</span>
              <small>{session.state}</small>
            </div>
          ))}
        </div>
        <MockFeedbackButton label="Preparar gestión de sesiones" feedback="Gestión de sesiones preparada en demo." />
      </section>
    </div>
  );
}
