import type { ReactNode } from "react";
import BrandLockup from "./BrandLockup";

type PublicSecondaryShellProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  showSecurityNotice?: boolean;
  title: string;
  variant: "legal" | "system";
};

export default function PublicSecondaryShell({
  children,
  description,
  eyebrow,
  showSecurityNotice = false,
  title,
  variant,
}: PublicSecondaryShellProps) {
  return (
    <main
      className={`public-secondary public-secondary--${variant}`}
      data-public-secondary-surface={variant}
    >
      <div className="public-secondary__inner">
        <header className="public-secondary__overview">
          <BrandLockup
            ariaLabel="levio.es"
            markSize="md"
            nameClassName="public-secondary__brand-name"
            priority
          />
          <div className="public-secondary__heading">
            <p className="public-secondary__eyebrow">{eyebrow}</p>
            <h1 id="public-secondary-title">{title}</h1>
            <p className="public-secondary__description">{description}</p>
          </div>
          {showSecurityNotice ? (
            <aside className="public-secondary__notice">
              <strong>Aviso de seguridad</strong>
              <span>
                Esta zona usa una arquitectura temporal de acceso para demostración.
                La autenticación final debe conectarse a un proveedor seguro antes
                de procesar datos personales reales.
              </span>
            </aside>
          ) : null}
        </header>
        <section
          aria-labelledby="public-secondary-title"
          className="public-secondary__panel"
        >
          {children}
        </section>
      </div>
    </main>
  );
}
