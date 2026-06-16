"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthRuntime } from "./auth/AuthRuntimeProvider";
import { clearMockSession } from "./MockAuthGate";
import LevioMark from "./LevioMark";

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
  const auth = useAuthRuntime();

  async function handleLogout() {
    await auth.signOut();
    clearMockSession();
    router.refresh();
    router.replace("/login");
  }

  function isActiveRoute(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const activeItem = navigationItems.find((item) => isActiveRoute(item.href)) ?? navigationItems[0];

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar section-frame">
        <Link className="dashboard-brand brand-lockup" href="/">
          <LevioMark size="sm" />
          <span>levio.es</span>
        </Link>
        <p>Área personal del motor de simulación de decisiones.</p>
        <details className="dashboard-nav-menu">
          <summary>
            <span>Vista actual</span>
            <strong>{activeItem.label}</strong>
          </summary>
          <nav aria-label="Navegación compacta del área personal">
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
        </details>
        <nav aria-label="Navegación del área personal" className="dashboard-sidebar-nav">
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
          <strong>{auth.identityState === "authenticated" ? "Autenticada" : "No iniciada"}</strong>
          <small>{auth.email ?? "Supabase Auth foundation"}</small>
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
