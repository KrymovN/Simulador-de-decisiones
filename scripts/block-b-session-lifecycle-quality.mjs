import { existsSync, readdirSync, readFileSync } from "node:fs";
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

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listFiles(absolutePath);
    }

    return absolutePath;
  });
}

const dashboardDir = pathFromRoot("app", "dashboard");
const dashboardFiles = listFiles(dashboardDir).filter((file) => file.endsWith(".tsx"));
const middlewareExists = ["middleware.ts", "middleware.tsx", "middleware.js", "middleware.mjs"].some((file) =>
  existsSync(pathFromRoot(file)),
);

const authProvider = read("components", "auth", "AuthRuntimeProvider.tsx");
const authStateView = read("components", "auth", "AuthStateView.tsx");
const dashboardLayout = read("app", "dashboard", "layout.tsx");
const dashboardShell = read("components", "DashboardShell.tsx");
const guards = read("lib", "auth", "guards.ts");
const sessionRuntime = read("lib", "auth", "session.ts");
const identity = read("lib", "auth", "identity.ts");
const redirects = read("lib", "auth", "redirects.ts");
const callback = read("lib", "auth", "supabase", "callback.ts");
const mockAuthGate = read("components", "MockAuthGate.tsx");
const authTypes = read("lib", "auth", "types.ts");
const authMessages = read("lib", "auth", "messages.ts");
const packageJson = read("package.json");

assertCheck(
  "dashboard routes are covered by force-dynamic layout auth guard",
  !middlewareExists &&
    dashboardLayout.includes('export const dynamic = "force-dynamic"') &&
    dashboardLayout.includes("requireAuthenticatedDashboardSession") &&
    dashboardLayout.includes('requireAuthenticatedDashboardSession("/dashboard")') &&
    dashboardFiles.some((file) => file.endsWith("page.tsx")),
  "Expected dashboard descendants to be protected by the dynamic dashboard layout and no middleware to be required for the current route shape.",
);

assertCheck(
  "protected-route guard redirects unauthenticated sessions to controlled login path",
  guards.includes("readServerAuthSession") &&
    guards.includes('context.identityState === "authenticated"') &&
    guards.includes("buildLoginRedirectPath(reason, nextPath)") &&
    redirects.includes("sanitizeRedirectPath") &&
    redirects.includes('!parsed.pathname.startsWith("/dashboard")') &&
    redirects.includes('parsed.pathname.startsWith("/api")'),
  "Expected protected routes to validate server session and redirect only to sanitized dashboard login next paths.",
);

assertCheck(
  "server session validation detects missing invalid expired and revoked sessions",
  sessionRuntime.includes("supabase.auth.getSession()") &&
    sessionRuntime.includes("supabase.auth.getUser()") &&
    sessionRuntime.includes("classifySessionFailure") &&
    sessionRuntime.includes("session_missing") &&
    sessionRuntime.includes("session_invalid") &&
    sessionRuntime.includes("session_expired") &&
    sessionRuntime.includes("session_revoked") &&
    identity.includes("readSessionStatus") &&
    identity.includes("session.expires_at * 1000 <= Date.now()"),
  "Expected server auth to validate session cookies against Supabase user state and normalize missing/invalid/expired/revoked states.",
);

assertCheck(
  "browser session runtime refreshes on provider state changes without trusting localStorage",
  authProvider.includes("supabase.auth.getUser()") &&
    authProvider.includes("refreshSession") &&
    authProvider.includes("onAuthStateChange") &&
    authProvider.includes("subscription.unsubscribe()") &&
    !authProvider.includes("localStorage") &&
    !authProvider.includes("getSession()"),
  "Expected browser runtime to refresh from Supabase getUser/onAuthStateChange and avoid localStorage as auth proof.",
);

assertCheck(
  "client session errors are controlled and not rendered from provider internals",
  authProvider.includes('error: "session_invalid"') &&
    !authProvider.includes("error.message") &&
    authStateView.includes("No se pudo verificar la sesión") &&
    !authStateView.includes("{auth.error}") &&
    !authStateView.includes("error.message"),
  "Expected client auth errors to use controlled state instead of rendering provider error messages.",
);

assertCheck(
  "logout is idempotent and clears Supabase plus legacy mock state",
  authProvider.includes("supabase.auth.signOut()") &&
    authProvider.includes('setState({ identityState: "signed_out" })') &&
    authProvider.includes("catch") &&
    dashboardShell.includes("await auth.signOut()") &&
    dashboardShell.includes("clearMockSession()") &&
    dashboardShell.includes("router.refresh()") &&
    dashboardShell.includes('router.replace("/login")'),
  "Expected logout to tolerate repeated sign-out, clear mock state, refresh, and redirect to login.",
);

assertCheck(
  "callback replay and redirect abuse remain fail-closed",
  callback.includes("exchangeCodeForSession") &&
    callback.includes("classifyCallbackFailure(error.message)") &&
    callback.includes("callback_invalid") &&
    callback.includes("callback_expired") &&
    callback.includes('sanitizeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard")') &&
    redirects.includes("value.startsWith(\"//\")") &&
    redirects.includes("AUTH_ENTRY_PATHS") &&
    redirects.includes("buildLoginRedirectPath"),
  "Expected replay/expired callback failures and redirect abuse to stay controlled and dashboard-only.",
);

assertCheck(
  "legacy mock gate cannot authorize dashboard access",
  mockAuthGate.includes("Production dashboard protection now lives in app/dashboard/layout.tsx") &&
    mockAuthGate.includes("must not authorize production data") &&
    mockAuthGate.includes("return children") &&
    !mockAuthGate.includes("redirect("),
  "Expected MockAuthGate to remain only a compatibility wrapper, not an authorization boundary.",
);

assertCheck(
  "session revoked state is part of the public auth contract",
  authTypes.includes('"session_revoked"') &&
    authMessages.includes("session_revoked") &&
    authMessages.includes("La sesión ya no está activa"),
  "Expected revoked sessions to have a controlled auth code and login message.",
);

assertCheck(
  "Block B session lifecycle quality gate is registered",
  packageJson.includes('"quality:block-b-session-lifecycle": "node scripts/block-b-session-lifecycle-quality.mjs"'),
  "Expected package.json to expose the Block B session lifecycle quality gate.",
);

const failed = checks.filter((check) => !check.passed);

console.log(`\nBlock B session lifecycle quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
