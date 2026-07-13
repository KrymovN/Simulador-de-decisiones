import Link from "next/link";
import LevioMark from "../components/LevioMark";

export default function NotFound() {
  return (
    <main className="auth-shell not-found-shell">
      <section className="auth-visual section-frame">
        <Link className="auth-brand brand-lockup" href="/" aria-label="levio.es">
          <LevioMark size="md" />
          <span>levio.es</span>
        </Link>
        <p className="eyebrow brand-mark">levio.es / Ruta no encontrada</p>
        <h1>Esta ruta no existe.</h1>
        <p>El enlace puede estar incompleto o pertenecer a una función que todavía no está disponible.</p>
      </section>
      <section className="auth-card section-frame">
        <div className="legal-draft">
          <h2>Continúa desde una superficie disponible.</h2>
          <p>Vuelve al inicio o abre directamente el simulador demostrativo.</p>
          <div className="auth-links">
            <Link href="/">Volver al inicio</Link>
            <Link href="/#decision-input">Abrir simulador</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
