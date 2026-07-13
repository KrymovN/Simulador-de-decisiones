"use client";

import UnavailableAction from "./UnavailableAction";
import { useDashboardAccount } from "./dashboard/DashboardAccountProvider";

export default function SecurityPanel() {
  const { account } = useDashboardAccount();
  const sessions = [
    {
      device: account.email,
      location: "Cuenta autenticada",
      state: account.sessionStatus === "active" ? "Sesión actual validada" : "Revisar sesión",
    },
    {
      device: "Gestión futura",
      location: "Dispositivo de ejemplo",
      state: "Sin sincronización activa",
    },
  ];

  return (
    <div className="security-layout">
      <section className="dashboard-card section-frame">
        <p className="eyebrow">Protección en preparación</p>
        <h2>Seguridad conectada a la sesión validada.</h2>
        <div className="security-score" aria-label="Estado de protección futura">
          <span></span>
          <strong>{account.accountState}</strong>
          <p>Controles de acceso reales para la sesión actual; 2FA y gestión avanzada siguen preparados.</p>
        </div>
      </section>

      <section className="dashboard-card section-frame">
        <h3>Sesión actual</h3>
        <div className="session-list">
          {sessions.map((session) => (
            <div key={session.device}>
              <strong>{session.device}</strong>
              <span>{session.location}</span>
              <small>{session.state}</small>
            </div>
          ))}
        </div>
        <UnavailableAction
          label="Gestión no disponible"
          explanation="La gestión avanzada de sesiones todavía no está activa en esta versión."
        />
      </section>
    </div>
  );
}
