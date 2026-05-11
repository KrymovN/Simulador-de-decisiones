"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearMockSession } from "./MockAuthGate";

const navigationItems = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/decisions", label: "Decisiones" },
  { href: "/dashboard/simulations", label: "Simulaciones" },
  { href: "/dashboard/memory", label: "Memoria" },
  { href: "/dashboard/profile", label: "Perfil" },
  { href: "/dashboard/privacy", label: "Privacidad" },
  { href: "/dashboard/security", label: "Seguridad" },
];

type DashboardShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function DashboardShell({
  eyebrow,
  title,
  description,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearMockSession();
    router.replace("/login");
  }

  function isActiveRoute(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar section-frame">
        <Link className="dashboard-brand" href="/">
          levio.es
        </Link>
        <p>Área personal del motor de simulación de decisiones.</p>
        <nav aria-label="Navegación del área personal">
          {navigationItems.map((item) => (
            <Link
              aria-current={isActiveRoute(item.href) ? "page" : undefined}
              className={isActiveRoute(item.href) ? "active" : ""}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="dashboard-sidebar-status">
          <span>Sesión</span>
          <strong>Demo segura</strong>
          <small>Auth productivo pendiente</small>
        </div>
        <button className="ghost-button" onClick={handleLogout} type="button">
          Cerrar sesión
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header section-frame">
          <div>
            <p className="eyebrow brand-mark">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="privacy-state">
            <span>Nivel de privacidad</span>
            <strong>Alto</strong>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
