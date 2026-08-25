"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import AuthStateView from "../../components/auth/AuthStateView";
import { useAuthRuntime } from "../../components/auth/AuthRuntimeProvider";
import AuthShell from "../../components/AuthShell";
import { prepareEmailOtpAuthRedirect } from "../../lib/auth/actions";
import { createSupabaseBrowserAuthClient } from "../../lib/auth/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuthRuntime();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccessHelp, setShowAccessHelp] = useState(false);

  useEffect(() => {
    if (auth.identityState === "authenticated") {
      router.replace("/dashboard");
    }
  }, [auth.identityState, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();

    if (!email) {
      setError("Introduce un correo electrónico válido.");
      return;
    }

    const supabase = createSupabaseBrowserAuthClient();

    if (!supabase) {
      setError("El sistema de acceso no está configurado todavía.");
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectResult = await prepareEmailOtpAuthRedirect({ nextPath: "/dashboard" });

      if (redirectResult.status !== "ready") {
        setError("El destino de acceso no está configurado todavía.");
        return;
      }

      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectResult.emailRedirectTo,
          shouldCreateUser: true,
        },
      });

      if (signUpError) {
        setError("No se pudo crear el acceso. Inténtalo de nuevo.");
        return;
      }
    } catch {
      setError("No se pudo conectar con el sistema de acceso. Inténtalo de nuevo.");
      return;
    } finally {
      setIsSubmitting(false);
    }

    router.refresh();
    setMessage("Revisa tu correo. Te hemos enviado un enlace para confirmar tu cuenta.");
  }

  return (
    <AuthShell
      description="Introduce tu correo para recibir un enlace de confirmación. No necesitas contraseña."
      eyebrow="levio.es / Cuenta"
      title="Crea tu cuenta de Levio."
    >
      <AuthStateView />
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input autoComplete="email" name="email" placeholder="tu@correo.com" required type="email" />
        </label>
        <label className="checkbox-row">
          <input required type="checkbox" />
          <span>
            Acepto la{" "}
            <Link href="/privacy-policy">
              política de privacidad
            </Link>
          </span>
        </label>
        <label className="checkbox-row">
          <input required type="checkbox" />
          <span>
            Acepto los{" "}
            <Link href="/terms">
              términos de uso
            </Link>
          </span>
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Enviando enlace..." : "Crear cuenta"}
        </button>
      </form>

      <div className="auth-secondary-actions">
        <Link className="auth-secondary-action" href="/login">
          Iniciar sesión
        </Link>
        <button
          aria-controls="register-access-help"
          aria-expanded={showAccessHelp}
          className="auth-secondary-action"
          onClick={() => setShowAccessHelp((isVisible) => !isVisible)}
          type="button"
        >
          ¿Problemas para acceder?
        </button>
      </div>

      {showAccessHelp && (
        <div className="auth-help-panel" id="register-access-help" role="status">
          Levio no utiliza contraseña. Introduce tu correo y te enviaremos un enlace seguro de un solo uso. Si no
          llega, revisa spam o correo no deseado y comprueba que el correo introducido sea correcto.
        </div>
      )}

      {message && (
        <div className="mock-feedback" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="mock-feedback" role="alert">
          {error}
        </div>
      )}
    </AuthShell>
  );
}
