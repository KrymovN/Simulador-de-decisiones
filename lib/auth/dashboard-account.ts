import type { LevioSessionContext } from "./types";

export type DashboardAccountState = {
  status: "authenticated";
  displayName: string;
  email: string;
  accountState: "Sesión validada";
  sessionStatus: Extract<LevioSessionContext["sessionStatus"], "active">;
  assuranceLevel: LevioSessionContext["assuranceLevel"];
  authTime?: string;
  expiresAt?: string;
};

function displayNameFromEmail(email: string | undefined) {
  if (!email) {
    return "Cuenta Levio";
  }

  const [name] = email.split("@");
  const normalizedName = name.trim();

  return normalizedName.length > 0 ? normalizedName : "Cuenta Levio";
}

export function buildDashboardAccountState(session: LevioSessionContext): DashboardAccountState {
  const email = session.principal.email ?? "Cuenta autenticada";

  return {
    status: "authenticated",
    displayName: displayNameFromEmail(session.principal.email),
    email,
    accountState: "Sesión validada",
    sessionStatus: "active",
    assuranceLevel: session.assuranceLevel,
    authTime: session.authTime,
    expiresAt: session.expiresAt,
  };
}
