import Link from "next/link";
import type { Metadata } from "next";
import PublicSecondaryShell from "../../components/PublicSecondaryShell";

export const metadata: Metadata = {
  title: "Política de privacidad provisional",
  description: "Borrador provisional de privacidad para Levio.es en modo de preparación.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicSecondaryShell
      description="Borrador provisional para que puedas revisar el estado actual de privacidad antes de crear acceso."
      eyebrow="levio.es / Privacidad provisional"
      showSecurityNotice
      title="Política de privacidad provisional."
      variant="legal"
    >
      <div className="public-secondary__content">
        <p>
          Levio.es está en fase de preparación y prueba. Esta página no es una política legal final ni declara
          preparación completa para producción.
        </p>
        <p>
          En el estado actual, el simulador público usa respuestas de ejemplo y las simulaciones guardadas desde la página
          principal se almacenan localmente en este navegador. El acceso al dashboard requiere autenticación cuando el
          sistema de acceso esté configurado.
        </p>
        <p>
          Antes de procesar datos personales reales en producción, Levio.es deberá completar su documentación legal,
          controles de consentimiento, derechos de datos y políticas operativas.
        </p>
        <div className="public-secondary__actions">
          <Link href="/register">Volver al acceso preparado</Link>
          <Link href="/">Volver al simulador</Link>
        </div>
      </div>
    </PublicSecondaryShell>
  );
}
