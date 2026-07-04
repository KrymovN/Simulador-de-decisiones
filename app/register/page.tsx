"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import AuthStateView from "../../components/auth/AuthStateView";
import { useAuthRuntime } from "../../components/auth/AuthRuntimeProvider";
import AuthShell from "../../components/AuthShell";
import { createSupabaseBrowserAuthClient } from "../../lib/auth/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuthRuntime();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError("Auth Runtime no está configurado todavía.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signUpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
          shouldCreateUser: true,
        },
      });

      if (signUpError) {
        setError("No se pudo crear el acceso. Inténtalo de nuevo.");
        return;
      }
    } catch {
      setError("No se pudo conectar con Auth Runtime. Inténtalo de nuevo.");
      return;
    } finally {
      setIsSubmitting(false);
    }

    router.refresh();
    setMessage("Solicitud de acceso registrada por Auth Runtime para esta fase preparada.");
  }

  return (
    <AuthShell
      description="Prepara una vista de acceso para futuras simulaciones, idioma preferido y controles de datos cuando estén disponibles."
      eyebrow="levio.es / Acceso preparado"
      title="Prepara tu acceso de simulación."
    >
      <AuthStateView signedOutLabel="Registro por correo condicionado a Auth Runtime configurado." />
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
          {isSubmitting ? "Enviando enlace" : "Crear acceso seguro"}
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
        <Link href="/login">Ya tengo acceso preparado</Link>
      </div>
    </AuthShell>
  );
}
