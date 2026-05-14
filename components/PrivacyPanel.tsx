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
    title: "Exportar mis datos",
    copy: "Preparar un archivo con perfil, simulaciones, decisiones guardadas y consentimiento activo.",
  },
  {
    title: "Eliminar mi cuenta",
    copy: "Solicitar la supresión completa de la cuenta y datos asociados cuando exista backend productivo.",
  },
  {
    title: "Borrar historial de simulaciones",
    copy: "Eliminar simulaciones anteriores sin borrar el perfil de usuario.",
  },
  {
    title: "Retirar consentimiento",
    copy: "Desactivar el análisis personalizado de decisiones y cualquier memoria asociada.",
  },
  {
    title: "Desactivar memoria personalizada",
    copy: "Pausar la memoria de IA para que futuras simulaciones no usen patrones históricos del usuario.",
  },
];

export default function PrivacyPanel() {
  return (
    <div className="privacy-layout">
      <section className="dashboard-card section-frame">
        <p className="eyebrow">Derechos del usuario</p>
        <h2>Control explícito sobre datos personales.</h2>
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
            <MockFeedbackButton label="Solicitar" feedback="Solicitud registrada en modo demo." />
          </article>
        ))}
      </section>
    </div>
  );
}
