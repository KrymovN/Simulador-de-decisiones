"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import AuthShell from "../../components/AuthShell";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Te enviaremos instrucciones si el correo existe en el sistema.");
  }

  return (
    <AuthShell
      description="Recuperación preparada para el futuro proveedor de autenticación. En este MVP no se envían correos reales."
      eyebrow="levio.es / Recuperar acceso"
      title="Recupera tu entrada al espacio estratégico."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input autoComplete="email" name="email" placeholder="tu@correo.com" type="email" />
        </label>
        <button type="submit">Enviar instrucciones</button>
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
