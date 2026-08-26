import Link from "next/link";

const privacyRights = [
  {
    title: "Acceso y portabilidad",
    copy: "Puedes descargar una copia de los datos asociados a tu cuenta.",
  },
  {
    title: "Supresión",
    copy: "Puedes eliminar individualmente las simulaciones que hayas guardado.",
  },
];

export default function PrivacyPanel() {
  return (
    <div className="privacy-layout">
      <section className="dashboard-card privacy-controls-card privacy-controls-rights">
        <p className="eyebrow">Tus derechos</p>
        <h2>Opciones disponibles en Levio.</h2>
        <p>Estas opciones corresponden a funciones activas de tu cuenta.</p>
        <div className="rights-grid">
          {privacyRights.map((right) => (
            <div className="privacy-right" key={right.title}>
              <strong>{right.title}</strong>
              <span>{right.copy}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="privacy-actions">
        <article className="dashboard-card privacy-controls-card">
          <h3>Exportar datos de la cuenta</h3>
          <p>Descarga una copia de los datos asociados a tu cuenta en formato JSON.</p>
          <a className="button-link" href="/dashboard/privacy/export">
            Descargar JSON
          </a>
        </article>

        <article className="dashboard-card privacy-controls-card">
          <h3>Gestionar simulaciones guardadas</h3>
          <p>Revisa tus simulaciones y elimina de forma individual las que ya no quieras conservar.</p>
          <Link className="button-link" href="/dashboard/simulations">
            Abrir simulaciones
          </Link>
        </article>

        <article className="dashboard-card privacy-controls-card">
          <h3>Conservación de datos</h3>
          <p>
            Las simulaciones guardadas se conservan mientras permanezcan en tu cuenta o hasta que las elimines.
            Los borradores tienen una fecha de caducidad configurada; esa fecha determina cuándo pueden eliminarse.
          </p>
        </article>
      </section>
    </div>
  );
}
