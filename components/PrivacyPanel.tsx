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
    title: "Preparar exportación futura",
    copy: "Definir un futuro archivo con perfil, simulaciones, decisiones preparadas y consentimiento preparado.",
  },
  {
    title: "Solicitud futura de eliminación",
    copy: "Preparar la supresión de cuenta y datos asociados cuando exista backend productivo.",
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
            <MockFeedbackButton label="Solicitar" feedback="Solicitud registrada en modo demo." />
          </article>
        ))}
      </section>
    </div>
  );
}
