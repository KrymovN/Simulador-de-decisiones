"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import AuthShell from "../../components/AuthShell";
import { createMockSession } from "../../components/MockAuthGate";

const languages = [
  "Español",
  "English",
  "Українська",
  "Русский",
  "العربية",
  "中文",
  "Français",
  "Deutsch",
  "Português",
  "Italiano",
];

export default function RegisterPage() {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMockSession();
    router.push("/dashboard");
  }

  return (
    <AuthShell
      description="Crea una cuenta preparada para historial de simulaciones, idioma preferido, consentimiento informado y control de datos."
      eyebrow="levio.es / Crear cuenta"
      title="Construye tu memoria estratégica privada."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input autoComplete="name" name="name" placeholder="Tu nombre" type="text" />
        </label>
        <label>
          Correo electrónico
          <input autoComplete="email" name="email" placeholder="tu@correo.com" type="email" />
        </label>
        <label>
          Contraseña
          <input autoComplete="new-password" name="password" placeholder="••••••••" type="password" />
        </label>
        <label>
          Repetir contraseña
          <input autoComplete="new-password" name="repeatPassword" placeholder="••••••••" type="password" />
        </label>
        <label>
          Idioma preferido
          <select defaultValue="Español" name="language">
            {languages.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </label>
        <label className="checkbox-row">
          <input required type="checkbox" />
          <span>Acepto la política de privacidad</span>
        </label>
        <label className="checkbox-row">
          <input required type="checkbox" />
          <span>Acepto los términos de uso</span>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" />
          <span>Consiento el análisis personalizado de decisiones</span>
        </label>
        <button type="submit">Crear cuenta</button>
      </form>

      <div className="auth-links">
        <Link href="/login">Ya tengo cuenta</Link>
      </div>
    </AuthShell>
  );
}
