import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const checks = [];

function pathFromRoot(...parts) {
  return join(rootDir, ...parts);
}

function read(...parts) {
  return readFileSync(pathFromRoot(...parts), "utf8");
}

function pass(name) {
  checks.push({ name, passed: true });
  console.log(`PASS ${name}`);
}

function fail(name, message) {
  checks.push({ name, passed: false, message });
  console.error(`FAIL ${name}`);
  console.error(`  ${message}`);
}

function assertCheck(name, condition, message) {
  if (condition) {
    pass(name);
  } else {
    fail(name, message);
  }
}

const dashboardLayout = read("app", "dashboard", "layout.tsx");
const dashboardAccountRuntime = read("lib", "auth", "dashboard-account.ts");
const dashboardAccountProvider = read("components", "dashboard", "DashboardAccountProvider.tsx");
const dashboardProfileAccountState = read("components", "dashboard", "DashboardProfileAccountState.tsx");
const dashboardShell = read("components", "DashboardShell.tsx");
const profilePage = read("app", "dashboard", "profile", "page.tsx");
const securityPanel = read("components", "SecurityPanel.tsx");
const authRuntimeProvider = read("components", "auth", "AuthRuntimeProvider.tsx");
const packageJson = read("package.json");

const dashboardAccountSources = [
  dashboardLayout,
  dashboardAccountRuntime,
  dashboardAccountProvider,
  dashboardProfileAccountState,
  dashboardShell,
  profilePage,
  securityPanel,
];

assertCheck(
  "dashboard layout is the only authenticated account boundary",
  dashboardLayout.includes("requireAuthenticatedDashboardSession") &&
    dashboardLayout.includes("buildDashboardAccountState(session)") &&
    dashboardLayout.includes("<DashboardAccountProvider account={account}>") &&
    dashboardLayout.includes('export const dynamic = "force-dynamic"') &&
    !dashboardLayout.includes("createSupabase") &&
    !dashboardLayout.includes("readServerAuthSession"),
  "Expected dashboard layout to use the existing guard, build account state once, and avoid direct Supabase/session duplication.",
);

assertCheck(
  "dashboard account runtime is derived from normalized session only",
  dashboardAccountRuntime.includes("LevioSessionContext") &&
    dashboardAccountRuntime.includes("DashboardAccountState") &&
    dashboardAccountRuntime.includes("session.principal.email") &&
    dashboardAccountRuntime.includes('accountState: "Sesión validada"') &&
    !dashboardAccountRuntime.includes("@supabase/") &&
    !dashboardAccountRuntime.includes("providerReference") &&
    !dashboardAccountRuntime.includes("sessionId") &&
    !dashboardAccountRuntime.includes("principalId"),
  "Expected dashboard account state to derive from normalized Levio session and omit provider/internal identifiers.",
);

assertCheck(
  "dashboard provider exposes account state without Supabase access",
  dashboardAccountProvider.startsWith('"use client";') &&
    dashboardAccountProvider.includes("createContext") &&
    dashboardAccountProvider.includes("useDashboardAccount") &&
    dashboardAccountProvider.includes("DashboardAccountState") &&
    !dashboardAccountProvider.includes("@supabase/") &&
    !dashboardAccountProvider.includes("createSupabase") &&
    !dashboardAccountProvider.includes("useAuthRuntime"),
  "Expected dashboard account provider to be a client context over layout-provided account state only.",
);

assertCheck(
  "dashboard shell displays account runtime state without browser-auth account lookup",
  dashboardShell.includes("useDashboardAccount") &&
    dashboardShell.includes("account.accountState") &&
    dashboardShell.includes("account.email") &&
    dashboardShell.includes("await auth.signOut()") &&
    !dashboardShell.includes("auth.email") &&
    !dashboardShell.includes("auth.identityState") &&
    !dashboardShell.includes("Supabase Auth foundation"),
  "Expected shell display to use dashboard account runtime while preserving existing logout cleanup.",
);

assertCheck(
  "profile page is connected to real dashboard account state",
  profilePage.includes("DashboardProfileAccountState") &&
    profilePage.includes("accountSignals") &&
    profilePage.includes("activityLog") &&
    !profilePage.includes("userProfile") &&
    dashboardProfileAccountState.includes("useDashboardAccount") &&
    dashboardProfileAccountState.includes("account.displayName") &&
    dashboardProfileAccountState.includes("account.email") &&
    !dashboardProfileAccountState.includes("Campo de contraseña futura") &&
    dashboardProfileAccountState.includes("Pendiente de perfil real") &&
    dashboardProfileAccountState.includes("Edición no disponible") &&
    dashboardProfileAccountState.includes("modo de solo lectura"),
  "Expected profile account-facing fields to use dashboard account runtime while keeping unavailable profile editing honest and read-only.",
);

assertCheck(
  "security surface uses validated session state without opening new auth flows",
  securityPanel.startsWith('"use client";') &&
    securityPanel.includes("useDashboardAccount") &&
    securityPanel.includes("Sesión actual validada") &&
    securityPanel.includes("gestión avanzada siguen preparados") &&
    !securityPanel.includes("createSupabase") &&
    !securityPanel.includes("resetPassword") &&
    !securityPanel.includes("signIn"),
  "Expected security surface to use dashboard account state and keep advanced auth controls deferred.",
);

assertCheck(
  "dashboard account UI avoids provider internals and direct Supabase dependencies",
  !dashboardAccountSources.some(
    (source) =>
      source.includes("@supabase/") ||
      source.includes("createSupabaseBrowserAuthClient") ||
      source.includes("createSupabaseServerClient") ||
      source.includes("getUser()") ||
      source.includes("getSession()") ||
      source.includes("providerReference") ||
      source.includes("sessionId") ||
      source.includes("principalId") ||
      source.includes("auth.users"),
  ),
  "Expected dashboard account UI/runtime to avoid direct Supabase calls and provider/internal identifiers.",
);

assertCheck(
  "existing browser auth runtime remains available for logout cleanup",
  authRuntimeProvider.includes("supabase.auth.signOut()") &&
    authRuntimeProvider.includes("onAuthStateChange") &&
    authRuntimeProvider.includes('setState({ identityState: "signed_out" })'),
  "Expected existing B4 browser auth runtime behavior to remain available for logout/session cleanup.",
);

assertCheck(
  "Block B dashboard account state quality gate is registered",
  packageJson.includes('"quality:block-b-dashboard-account-state": "node scripts/block-b-dashboard-account-state-quality.mjs"'),
  "Expected package.json to expose the Block B dashboard account state quality gate.",
);

const failed = checks.filter((check) => !check.passed);

console.log(`\nBlock B dashboard account state quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
