import Link from "next/link";
import type { Metadata } from "next";
import PublicSecondaryShell from "../../components/PublicSecondaryShell";

export const metadata: Metadata = {
  title: "Términos de uso | Levio.es",
  description: "Condiciones de uso del servicio de simulación de decisiones Levio.es.",
};

export default function TermsPage() {
  return (
    <PublicSecondaryShell
      description="Condiciones aplicables al uso de la cuenta, el simulador y las funciones de datos de Levio."
      eyebrow="levio.es / Términos"
      showSecurityNotice
      title="Términos de uso."
      variant="legal"
    >
      <div className="public-secondary__content">
        <h2>Naturaleza del servicio</h2>
        <p>
          Levio es una herramienta de apoyo para estructurar una situación, comparar escenarios, identificar riesgos y
          organizar criterios de decisión. Sus resultados son orientativos y dependen de la información que introduzcas.
        </p>
        <p>
          Las simulaciones no constituyen asesoramiento legal, financiero o médico, una decisión automatizada vinculante
          ni una garantía sobre resultados futuros. Debes contrastar la información y recurrir a profesionales cualificados
          cuando la decisión lo requiera.
        </p>

        <h2>Cuenta y contenido guardado</h2>
        <p>
          Puedes crear una cuenta e iniciar sesión mediante un enlace seguro enviado a tu correo, sin contraseña. Con una
          sesión activa puedes guardar, consultar, reabrir, archivar, exportar y eliminar individualmente simulaciones y
          borradores dentro de los controles disponibles en el producto.
        </p>
        <p>
          Eres responsable de que la información que introduces sea lícita, necesaria para tu uso y no vulnere derechos de
          terceros. No utilices Levio para causar daño, cometer fraude, eludir la ley, acceder a cuentas ajenas o interferir
          con la seguridad y disponibilidad del servicio.
        </p>

        <h2>Decisiones sensibles y uso responsable</h2>
        <p>
          No debes tratar una simulación como sustituto de una evaluación profesional ni como única base para una decisión
          crítica o difícil de revertir. Evita incluir identificadores o datos sensibles que no sean necesarios para
          analizar la situación.
        </p>

        <h2>Disponibilidad y conservación</h2>
        <p>
          Levio puede no estar disponible de forma ininterrumpida y una simulación puede fallar de forma controlada. Las
          simulaciones guardadas permanecen en tu cuenta hasta que las elimines o cambie su ciclo de vida; los borradores
          tienen una caducidad indicada en el producto. Puedes conservar una copia mediante la exportación de cuenta.
        </p>

        <h2>Procesamiento mediante IA</h2>
        <p>
          El proveedor de IA no está activado en la configuración pública validada para esta versión. La existencia de una
          ruta técnica controlada para una activación posterior no significa que ese procesamiento esté activo ahora.
        </p>

        <h2>Confirmación jurídica externa</h2>
        <p>
          Estos términos reflejan las funciones y límites técnicos actuales. La identidad de la parte prestadora, el
          contacto legal, la jurisdicción y cualquier condición jurídica adicional requieren confirmación del titular y
          revisión jurídica externa antes de considerar el texto jurídicamente aprobado.
        </p>
        <div className="public-secondary__actions">
          <Link href="/register">Crear cuenta</Link>
          <Link href="/privacy-policy">Ver política de privacidad</Link>
          <Link href="/">Volver al simulador</Link>
        </div>
      </div>
    </PublicSecondaryShell>
  );
}
