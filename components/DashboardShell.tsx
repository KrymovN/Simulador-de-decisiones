"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthRuntime } from "./auth/AuthRuntimeProvider";
import BrandLockup from "./BrandLockup";
import { useDashboardAccount } from "./dashboard/DashboardAccountProvider";
import { clearMockSession } from "./MockAuthGate";

const navigationItems = [
  { href: "/dashboard", label: "Mi espacio" },
  { href: "/dashboard/simulations", label: "Historial" },
  { href: "/dashboard/privacy", label: "Privacidad y datos" },
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
  const { account } = useDashboardAccount();

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
  const shellClassName =
    pathname === "/dashboard" ? "dashboard-shell dashboard-shell--landing" : "dashboard-shell";

  return (
    <main className={shellClassName}>
      <div className="dashboard-shell__frame">
        <aside className="dashboard-sidebar">
          <BrandLockup className="dashboard-brand" markSize="sm" />
          <p>Tu espacio de trabajo, historial y controles de cuenta.</p>
          <Link className="dashboard-workspace-action" href="/dashboard#nueva-simulacion">
            Nueva simulación
          </Link>
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
              <Link href="/">Inicio</Link>
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
            <Link href="/">Inicio</Link>
          </nav>
          <div className="dashboard-sidebar-status">
            <span>Acceso</span>
            <strong>{account.accountState}</strong>
            <small>{account.email}</small>
          </div>
          <button className="ghost-button dashboard-logout-button" onClick={handleLogout} type="button">
            Cerrar sesión
          </button>
        </aside>

        <section className="dashboard-main">
          <header className="dashboard-shell__header">
            <div>
              <p className="eyebrow brand-mark">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
