import MockFeedbackButton from "./MockFeedbackButton";

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
    copy: "Descargar un archivo JSON con el resumen de cuenta y simulaciones guardadas disponibles.",
    href: "/dashboard/privacy/export",
    label: "Descargar JSON",
  },
  {
    title: "Solicitud de eliminación preparada",
    copy: "Descargar un plan JSON con simulaciones guardadas elegibles sin ejecutar la eliminación.",
    href: "/dashboard/privacy/deletion",
    label: "Descargar plan",
  },
  {
    title: "Borrado futuro de historial",
    copy: "Preparar el borrado de simulaciones cuando exista historial productivo.",
  },
  {
    title: "Gestión futura del consentimiento",
    copy: "Preparar cómo se retiraría el análisis personalizado y cualquier contexto futuro asociado.",
  },
  {
    title: "Preparar pausa de memoria futura",
    copy: "Pausar el contexto futuro de simulaciones para que no use patrones históricos del usuario.",
  },
];

export default function PrivacyPanel() {
  return (
    <div className="privacy-layout">
      <section className="dashboard-card section-frame">
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
          <article className="dashboard-card section-frame" key={action.title}>
            <h3>{action.title}</h3>
            <p>{action.copy}</p>
            {"href" in action ? (
              <a className="button-link" href={action.href}>
                {action.label}
              </a>
            ) : (
              <MockFeedbackButton label="Solicitar" feedback="Solicitud registrada en modo demo." />
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
