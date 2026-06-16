import type { ReactNode } from "react";

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
  /*
   * Production dashboard protection now lives in app/dashboard/layout.tsx.
   * This component remains only as a compatibility wrapper for existing demo
   * dashboard pages and must not authorize production data.
   */
  return children;
}
