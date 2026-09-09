import Link from "next/link";
import type { Metadata } from "next";
import PublicSecondaryShell from "../../components/PublicSecondaryShell";

export const metadata: Metadata = {
  title: "Política de privacidad | Levio.es",
  description: "Información sobre los datos de cuenta y simulación tratados por Levio.es.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicSecondaryShell
      description="Cómo trata Levio los datos asociados a tu cuenta, tus borradores y tus simulaciones guardadas."
      eyebrow="levio.es / Privacidad"
      showSecurityNotice
      title="Política de privacidad."
      variant="legal"
    >
      <div className="public-secondary__content">
        <h2>Datos que trata Levio</h2>
        <p>
          Al crear una cuenta, Levio utiliza tu correo electrónico y los datos necesarios para autenticarte y mantener
          una sesión. El acceso se realiza mediante un enlace seguro de un solo uso, sin contraseña, a través de
          Supabase Auth.
        </p>
        <p>
          Cuando utilizas las funciones de cuenta, Levio puede guardar la situación que introduces, títulos y notas,
          borradores, resultados y escenarios de simulación, además del historial y los datos de ciclo de vida necesarios
          para mostrar, reabrir, archivar, exportar o eliminar esos contenidos.
        </p>

        <h2>Entrada de voz y reconocimiento del navegador</h2>
        <p>
          Si utilizas la entrada por voz, tú decides cuándo iniciar, cancelar o finalizar el dictado. La función básica
          utiliza las capacidades de reconocimiento de voz disponibles en tu navegador. La forma en que se procesa ese
          reconocimiento puede depender del navegador, del sistema operativo y de sus proveedores; Levio no afirma que
          el procesamiento se realice siempre de forma local en tu dispositivo.
        </p>
        <p>
          Levio no reenvía ni carga ese audio mediante su infraestructura a OpenAI, a <code>/api/transcribe</code>, a
          Whisper ni a otro proveedor de transcripción de Levio. Después del reconocimiento, Levio recibe del navegador
          el texto resultante y lo añade al campo editable del simulador, donde puedes revisarlo y modificarlo. Solo si
          después realizas la acción correspondiente, ese texto puede participar en el flujo estándar del Decision Engine
          o de IA de Levio, de acuerdo con la configuración aplicable.
        </p>

        <h2>Cuenta, almacenamiento y acceso</h2>
        <p>
          La autenticación y el almacenamiento de cuenta utilizan Supabase. Las lecturas y modificaciones de simulaciones,
          borradores e historial se limitan en el servidor a la cuenta autenticada que es propietaria de esos datos.
        </p>
        <p>
          Levio conserva simulaciones activas y archivadas para que puedas consultar su historial y reabrirlas. Archivar
          una simulación la retira del historial activo, pero no equivale a eliminarla.
        </p>

        <h2>Exportación y controles de datos</h2>
        <p>
          Desde el centro de privacidad puedes descargar un archivo JSON con los datos elegibles de tu cuenta. La
          exportación incluye el contenido completo elegible de entradas y resultados guardados, tanto activos como
          archivados, y puede incluir borradores e historial visibles para tu cuenta. Se excluyen datos eliminados,
          restringidos y detalles técnicos internos que no forman parte de tu contenido.
        </p>
        <p>
          Puedes eliminar individualmente simulaciones guardadas y borradores desde el área personal. La eliminación
          retira su contenido activo y lo excluye de futuras exportaciones. Esta versión no ofrece un control autoservicio
          para eliminar la cuenta completa.
        </p>

        <h2>Conservación</h2>
        <p>
          Las simulaciones guardadas se conservan mientras permanezcan en tu cuenta o hasta que las elimines. Los
          borradores caducan 30 días después de su creación o de la última modificación de contenido confirmada; durante
          los 7 días anteriores a la caducidad, Levio muestra un periodo de aviso. Los datos restringidos pueden quedar
          fuera de la eliminación ordinaria cuando su estado de conservación lo requiera.
        </p>

        <h2>Procesamiento mediante IA</h2>
        <p>
          El procesamiento mediante un proveedor de IA no está activado en la configuración pública validada para esta
          versión. Las solicitudes del simulador público siguen la ruta determinista y no se envían a un proveedor de IA.
          Si este estado cambia, Levio deberá actualizar esta información antes de aplicar el nuevo tratamiento.
        </p>

        <h2>Confirmación jurídica externa</h2>
        <p>
          Este texto refleja el funcionamiento técnico actual del producto. La identidad formal del responsable, su
          dirección, el contacto legal, las bases jurídicas, la jurisdicción y las relaciones contractuales con
          proveedores requieren confirmación del titular y revisión jurídica externa antes de considerar este documento
          jurídicamente aprobado.
        </p>
        <div className="public-secondary__actions">
          <Link href="/register">Crear cuenta</Link>
          <Link href="/terms">Ver términos de uso</Link>
          <Link href="/">Volver al simulador</Link>
        </div>
      </div>
    </PublicSecondaryShell>
  );
}
