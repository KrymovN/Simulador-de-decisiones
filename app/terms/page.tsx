import Link from "next/link";
import type { Metadata } from "next";
import PublicSecondaryShell from "../../components/PublicSecondaryShell";

export const metadata: Metadata = {
  title: "Términos de uso provisionales",
  description: "Borrador provisional de términos para Levio.es en modo de preparación.",
};

export default function TermsPage() {
  return (
    <PublicSecondaryShell
      description="Borrador provisional para que puedas revisar el estado actual del servicio antes de crear acceso."
      eyebrow="levio.es / Términos provisionales"
      showSecurityNotice
      title="Términos de uso provisionales."
      variant="legal"
    >
      <div className="public-secondary__content">
        <p>
          Levio.es está en fase de preparación y prueba. Estos términos son un borrador provisional y no sustituyen a
          unos términos legales completos para producción.
        </p>
        <p>
          Las simulaciones actuales sirven como apoyo exploratorio para mapear escenarios, riesgos y consecuencias. No
          constituyen asesoramiento legal, financiero, médico ni una decisión automatizada vinculante.
        </p>
        <p>
          El servicio no debe utilizarse todavía para introducir datos sensibles, decisiones críticas irreversibles o
          información que requiera garantías legales finales.
        </p>
        <div className="public-secondary__actions">
          <Link href="/register">Volver al acceso preparado</Link>
          <Link href="/">Volver al simulador</Link>
        </div>
      </div>
    </PublicSecondaryShell>
  );
}
