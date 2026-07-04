import Link from "next/link";
import type { Metadata } from "next";
import AuthShell from "../../components/AuthShell";

export const metadata: Metadata = {
  title: "Política de privacidad provisional",
  description: "Borrador provisional de privacidad para Levio.es en modo de preparación.",
};

export default function PrivacyPolicyPage() {
  return (
    <AuthShell
      description="Borrador provisional para que puedas revisar el estado actual de privacidad antes de crear acceso."
      eyebrow="levio.es / Privacidad provisional"
      title="Política de privacidad provisional."
    >
      <div className="legal-draft">
        <p>
          Levio.es está en fase de preparación y prueba. Esta página no es una política legal final ni declara
          preparación completa para producción.
        </p>
        <p>
          En el estado actual, el simulador público usa respuestas mock y las simulaciones guardadas desde la página
          principal se almacenan localmente en este navegador. El acceso al dashboard requiere autenticación cuando el
          runtime de auth esté configurado.
        </p>
        <p>
          Antes de procesar datos personales reales en producción, Levio.es deberá completar su documentación legal,
          controles de consentimiento, derechos de datos y políticas operativas.
        </p>
        <div className="auth-links">
          <Link href="/register">Volver al acceso preparado</Link>
          <Link href="/">Volver al simulador</Link>
        </div>
      </div>
    </AuthShell>
  );
}
