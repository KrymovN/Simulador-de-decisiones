"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export const MOCK_SESSION_KEY = "levio_es_mock_session";

type MockAuthGateProps = {
  children: ReactNode;
};

export function createMockSession() {
  if (typeof window === "undefined") {
    return;
  }

  /*
   * MOCK AUTH ONLY.
   * This localStorage flag is a temporary demo guard for protected UI routes.
   * Do not use it for production authentication, password storage, consent
   * records, personal data, or access control. Replace with NextAuth/Auth.js,
   * Supabase Auth, Clerk, custom OIDC, or another audited provider.
   */
  window.localStorage.setItem(
    MOCK_SESSION_KEY,
    JSON.stringify({
      provider: "mock-auth",
      createdAt: new Date().toISOString(),
      privacyMode: "alto",
    }),
  );
}

export function clearMockSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MOCK_SESSION_KEY);
}

export default function MockAuthGate({ children }: MockAuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const session = window.localStorage.getItem(MOCK_SESSION_KEY);

    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsAllowed(true);
  }, [pathname, router]);

  if (!isAllowed) {
    return (
      <main className="dashboard-shell dashboard-loading">
        <section className="section-frame dashboard-loading-card">
          <p className="eyebrow brand-mark">levio.es / Acceso protegido</p>
          <h1>Verificando acceso seguro.</h1>
          <p>Preparando el área personal del motor de decisiones.</p>
        </section>
      </main>
    );
  }

  return children;
}
