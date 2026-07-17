import type { ReactNode } from "react";
import BrandLockup from "./BrandLockup";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-visual section-frame">
        <BrandLockup
          className="auth-brand"
          mark={<span className="brand-logo brand-logo-mini" aria-hidden="true"></span>}
        />
        <div className="auth-core" aria-hidden="true">
          <span className="brand-logo brand-logo-auth"></span>
        </div>
        <p className="eyebrow brand-mark">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="security-note">
          <strong>Aviso de seguridad</strong>
          <span>
            Esta zona usa una arquitectura temporal de acceso para demostración.
            La autenticación final debe conectarse a un proveedor seguro antes
            de procesar datos personales reales.
          </span>
        </div>
      </section>
      <section className="auth-card section-frame">{children}</section>
    </main>
  );
}
