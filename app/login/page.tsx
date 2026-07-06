"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import AuthStateView from "../../components/auth/AuthStateView";
import { useAuthRuntime } from "../../components/auth/AuthRuntimeProvider";
import AuthShell from "../../components/AuthShell";
import { prepareEmailOtpAuthRedirect } from "../../lib/auth/actions";
import { getAuthErrorMessage } from "../../lib/auth/messages";
import { sanitizeRedirectPath } from "../../lib/auth/redirects";
import { createSupabaseBrowserAuthClient } from "../../lib/auth/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuthRuntime();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [queryError, setQueryError] = useState("");
  const [hasParsedSearch, setHasParsedSearch] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    setNextPath(sanitizeRedirectPath(searchParams.get("next"), "/dashboard"));
    setQueryError(getAuthErrorMessage(searchParams.get("auth_error") || searchParams.get("reason")));
    setHasParsedSearch(true);
  }, []);

  useEffect(() => {
    if (hasParsedSearch && auth.identityState === "authenticated") {
      router.replace(nextPath);
    }
  }, [auth.identityState, hasParsedSearch, nextPath, router]);

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
      const redirectResult = await prepareEmailOtpAuthRedirect({ nextPath });

      if (redirectResult.status !== "ready") {
        setError("El destino de acceso no está configurado todavía.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectResult.emailRedirectTo,
        },
      });

      if (signInError) {
        setError("No se pudo iniciar la sesión. Inténtalo de nuevo.");
        return;
      }
    } catch {
      setError("No se pudo conectar con el sistema de acceso. Inténtalo de nuevo.");
      return;
    } finally {
      setIsSubmitting(false);
    }

    router.refresh();
    setMessage("Solicitud de enlace registrada para esta fase preparada.");
  }

  return (
    <AuthShell
      description="Revisa el estado del acceso preparado para simulaciones locales y futuras preferencias de decisión."
      eyebrow="levio.es / Acceso preparado"
      title="Acceso preparado al entorno de simulación."
    >
      <AuthStateView signedOutLabel="Acceso por correo condicionado a la configuración del sistema de acceso." />
      {queryError && !error && (
        <div className="mock-feedback" role="alert">
          {queryError}
        </div>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input autoComplete="email" name="email" placeholder="tu@correo.com" required type="email" />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Preparando enlace" : "Preparar enlace de acceso"}
        </button>
      </form>

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

      <div className="auth-links">
        <Link href="/register">Preparar acceso</Link>
        <Link href="/forgot-password">Ver recuperación preparada</Link>
      </div>
    </AuthShell>
  );
}
