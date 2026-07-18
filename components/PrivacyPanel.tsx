import UnavailableAction from "./UnavailableAction";

const privacyRights = [
  "Derecho de acceso",
  "Derecho de rectificación",
  "Derecho de supresión",
  "Derecho de portabilidad",
  "Derecho de oposición",
  "Limitación del tratamiento",
];

const privacyActions = [
  {
    title: "Exportar datos de la cuenta",
    copy: "Descargar un archivo JSON con el resumen de cuenta, simulaciones guardadas, borradores e historial elegibles.",
    href: "/dashboard/privacy/export",
    label: "Descargar JSON",
  },
  {
    title: "Solicitud de eliminación preparada",
    copy: "Descargar un plan JSON de simulaciones guardadas, borradores e historial sin ejecutar la eliminación.",
    href: "/dashboard/privacy/deletion",
    label: "Descargar plan",
  },
  {
    title: "Estado de retención preparado",
    copy: "Descargar el estado de retención de simulaciones guardadas, borradores e historial sin iniciar trabajos automáticos.",
    href: "/dashboard/privacy/retention",
    label: "Descargar estado",
  },
  {
    title: "Estado del consentimiento",
    copy: "Descargar el estado de las políticas de consentimiento sin registrar, modificar ni retirar consentimiento.",
    href: "/dashboard/privacy/consent",
    label: "Descargar estado",
  },
  {
    title: "Preparar pausa de memoria futura",
    copy: "Pausar el contexto futuro de simulaciones para que no use patrones históricos del usuario.",
    unavailable: "La memoria todavía no está activa en esta versión; no se ha registrado ninguna solicitud.",
  },
];

export default function PrivacyPanel() {
  return (
    <div className="privacy-layout">
      <section className="dashboard-card privacy-controls-card privacy-controls-rights">
        <p className="eyebrow">Derechos del usuario</p>
        <h2>Controles preparados sobre datos personales.</h2>
        <div className="rights-grid">
          {privacyRights.map((right) => (
            <span key={right}>{right}</span>
          ))}
        </div>
      </section>

      <section className="privacy-actions">
        {privacyActions.map((action) => (
          <article className="dashboard-card privacy-controls-card" key={action.title}>
            <h3>{action.title}</h3>
            <p>{action.copy}</p>
            {"href" in action ? (
              <a className="button-link" href={action.href}>
                {action.label}
              </a>
            ) : (
              <UnavailableAction label="Pausa no disponible" explanation={action.unavailable} />
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
