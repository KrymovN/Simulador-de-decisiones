import Link from "next/link";
import PublicSecondaryShell from "../components/PublicSecondaryShell";

export default function NotFound() {
  return (
    <PublicSecondaryShell
      eyebrow="levio.es / Ruta no encontrada"
      title="Esta ruta no existe."
      description="El enlace puede estar incompleto o pertenecer a una función que todavía no está disponible."
      variant="system"
    >
      <div className="public-secondary__content">
          <h2>Continúa desde una superficie disponible.</h2>
          <p>Vuelve al inicio o abre directamente el simulador demostrativo.</p>
          <div className="public-secondary__actions">
            <Link href="/">Volver al inicio</Link>
            <Link href="/#decision-input">Abrir simulador</Link>
          </div>
      </div>
    </PublicSecondaryShell>
  );
}
