"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import AuthStateView from "../../components/auth/AuthStateView";
import { useAuthRuntime } from "../../components/auth/AuthRuntimeProvider";
import AuthShell from "../../components/AuthShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const auth = useAuthRuntime();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (auth.identityState === "authenticated") {
      router.replace("/dashboard");
    }
  }, [auth.identityState, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("El acceso productivo usa enlace seguro por correo. El restablecimiento de contraseña no está activado.");
  }

  return (
    <AuthShell
      description="Recuperación preparada para el futuro proveedor de autenticación. En este MVP no se envían correos reales."
      eyebrow="levio.es / Recuperar acceso"
      title="Recupera tu entrada al espacio estratégico."
    >
      <AuthStateView signedOutLabel="Password reset no está activado para esta fase." />
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input autoComplete="email" name="email" placeholder="tu@correo.com" type="email" />
        </label>
        <button type="submit">Ver estado de recuperación</button>
      </form>

      {message && (
        <div className="mock-feedback" role="status">
          {message}
        </div>
      )}

      <div className="auth-links">
        <Link href="/login">Volver a entrar</Link>
        <Link href="/register">Crear cuenta</Link>
      </div>
    </AuthShell>
  );
}
