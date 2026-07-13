"use client";

import UnavailableAction from "../UnavailableAction";
import { useDashboardAccount } from "./DashboardAccountProvider";

type DashboardProfileAccountStateProps = {
  accountSignals: Array<{
    label: string;
    value: string;
    copy: string;
  }>;
  activityLog: Array<{
    date: string;
    title: string;
    copy: string;
  }>;
  futureLanguages: string[];
};

export default function DashboardProfileAccountState({
  accountSignals,
  activityLog,
  futureLanguages,
}: DashboardProfileAccountStateProps) {
  const { account } = useDashboardAccount();

  return (
    <>
      <section className="profile-overview section-frame">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">
            <span></span>
          </div>
          <div>
            <p className="eyebrow">Identidad validada</p>
            <h2>{account.displayName}</h2>
            <p>{account.email}</p>
          </div>
        </div>
        <div className="profile-state-grid">
          <div>
            <span>Acceso</span>
            <strong>{account.accountState}</strong>
          </div>
          <div>
            <span>Sesión</span>
            <strong>{account.sessionStatus === "active" ? "Activa" : "Revisar"}</strong>
          </div>
          <div>
            <span>Privacidad</span>
            <strong>Preparada</strong>
          </div>
        </div>
      </section>

      <section className="profile-layout">
        <article className="dashboard-card section-frame">
          <h2>Datos preparados de acceso</h2>
          <div className="profile-form">
            <label>
              Nombre visible
              <input defaultValue={account.displayName} disabled type="text" />
            </label>
            <label>
              Correo electrónico
              <input defaultValue={account.email} readOnly type="email" />
            </label>
            <label>
              Idioma preferido
              <select defaultValue="Español" disabled>
                {futureLanguages.map((language) => (
                  <option key={language}>{language}</option>
                ))}
              </select>
            </label>
            <label>
              País / región
              <input defaultValue="Pendiente de perfil real" disabled type="text" />
            </label>
            <label>
              Zona horaria
              <input defaultValue="Pendiente de perfil real" disabled type="text" />
            </label>
            <UnavailableAction
              label="Edición no disponible"
              explanation="El perfil se muestra en modo de solo lectura y no admite cambios en esta versión."
            />
          </div>
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
    </>
  );
}
