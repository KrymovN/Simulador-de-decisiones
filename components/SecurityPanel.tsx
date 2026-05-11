const sessions = [
  {
    device: "MacBook Air",
    location: "Madrid, España",
    state: "Sesión actual",
  },
  {
    device: "iPhone",
    location: "Último acceso preparado",
    state: "Futura sincronización",
  },
];

export default function SecurityPanel() {
  return (
    <div className="security-layout">
      <section className="dashboard-card section-frame">
        <p className="eyebrow">Protección de cuenta</p>
        <h2>Seguridad preparada para autenticación real.</h2>
        <div className="security-score" aria-label="Estado de protección de cuenta">
          <span></span>
          <strong>Protección alta</strong>
          <p>Contraseña, sesiones y futura autenticación en dos pasos.</p>
        </div>
      </section>

      <section className="dashboard-card section-frame">
        <h3>Sesiones activas</h3>
        <div className="session-list">
          {sessions.map((session) => (
            <div key={session.device}>
              <strong>{session.device}</strong>
              <span>{session.location}</span>
              <small>{session.state}</small>
            </div>
          ))}
        </div>
        <button type="button">Cerrar sesión en todos los dispositivos</button>
      </section>
    </div>
  );
}
