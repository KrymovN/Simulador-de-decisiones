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
      <div className="auth-shell__inner">
        <section className="auth-visual">
          <BrandLockup
            className="auth-brand"
            markSize="sm"
            nameClassName="auth-brand__name"
          />
          <div className="auth-visual__copy">
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
          </div>
        </section>
        <section className="auth-card">{children}</section>
      </div>
    </main>
  );
}
