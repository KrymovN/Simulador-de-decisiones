"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import AuthShell from "../../components/AuthShell";
import { createMockSession } from "../../components/MockAuthGate";

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchParams = new URLSearchParams(window.location.search);
    const nextPath = searchParams.get("next") || "/dashboard";

    createMockSession();
    router.push(nextPath);
  }

  return (
    <AuthShell
      description="Accede al espacio privado donde tus simulaciones, decisiones y preferencias futuras estarán protegidas."
      eyebrow="levio.es / Acceso seguro"
      title="Entra en tu zona personal de decisiones."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input autoComplete="email" name="email" placeholder="tu@correo.com" type="email" />
        </label>
        <label>
          Contraseña
          <input autoComplete="current-password" name="password" placeholder="••••••••" type="password" />
        </label>
        <button type="submit">Entrar</button>
      </form>

      <div className="auth-links">
        <Link href="/register">Crear cuenta</Link>
        <Link href="/forgot-password">He olvidado mi contraseña</Link>
      </div>
    </AuthShell>
  );
}
