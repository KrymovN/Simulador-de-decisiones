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

const loginPage = read("app", "login", "page.tsx");
const registerPage = read("app", "register", "page.tsx");
const forgotPasswordPage = read("app", "forgot-password", "page.tsx");
const authActions = read("lib", "auth", "actions.ts");
const authConfig = read("lib", "auth", "config.ts");
const authRedirects = read("lib", "auth", "redirects.ts");
const authCallback = read("lib", "auth", "supabase", "callback.ts");
const callbackRoute = read("app", "auth", "callback", "route.ts");
const browserClient = read("lib", "auth", "supabase", "client.ts");
const serverClient = read("lib", "auth", "supabase", "server.ts");
const dashboardShell = read("components", "DashboardShell.tsx");
const packageJson = read("package.json");

assertCheck(
  "login/register do not build emailRedirectTo from uncontrolled client origin",
  !loginPage.includes("window.location.origin") &&
    !registerPage.includes("window.location.origin") &&
    loginPage.includes("prepareEmailOtpAuthRedirect") &&
    registerPage.includes("prepareEmailOtpAuthRedirect") &&
    loginPage.includes("emailRedirectTo: redirectResult.emailRedirectTo") &&
    registerPage.includes("emailRedirectTo: redirectResult.emailRedirectTo"),
  "Expected login/register to use the server auth action redirect and avoid window.location.origin for emailRedirectTo.",
);

assertCheck(
  "auth action boundary is server-only and uses approved redirect helper",
  authActions.startsWith('"use server";') &&
    authActions.includes("prepareEmailOtpAuthRedirect") &&
    authActions.includes("readAuthRuntimeConfig") &&
    authActions.includes("buildAuthRedirectUrl") &&
    authActions.includes('sanitizeRedirectPath(input.nextPath ?? "/dashboard", "/dashboard")') &&
    !authActions.includes("@supabase/") &&
    !authActions.includes("SERVICE_ROLE") &&
    !authActions.includes("ownerPrincipal") &&
    !authActions.includes("principalId") &&
    !authActions.includes("providerReference"),
  "Expected auth action boundary to be server-only, use config/helper redirects, and avoid Supabase/provider/owner internals.",
);

assertCheck(
  "auth redirect helper uses approved config origin and callback route",
  authConfig.includes("buildAuthRedirectUrl") &&
    authConfig.includes('config.status === "disabled"') &&
    authConfig.includes("redirectOriginAllowed") &&
    authConfig.includes('pathname !== "/auth/callback"') &&
    authConfig.includes('new URL(pathname, appOrigin)') &&
    authConfig.includes('redirectUrl.searchParams.set("next", sanitizeRedirectPath(nextPath, "/dashboard"))') &&
    authConfig.includes("LEVIO_AUTH_REDIRECT_ALLOWLIST") &&
    authConfig.includes("LEVIO_APP_URL"),
  "Expected buildAuthRedirectUrl to use server config, approved origin checks, /auth/callback, and sanitized dashboard next paths.",
);

assertCheck(
  "post-auth destinations remain dashboard-only",
  authRedirects.includes('const AUTH_ENTRY_PATHS = new Set(["/login", "/register", "/forgot-password", "/auth/callback"])') &&
    authRedirects.includes('parsed.pathname.startsWith("/api")') &&
    authRedirects.includes('!parsed.pathname.startsWith("/dashboard")') &&
    authRedirects.includes("buildLoginRedirectPath"),
  "Expected redirect sanitizer to reject auth/API/non-dashboard destinations.",
);

assertCheck(
  "callback route is server-side and fail-closed",
  callbackRoute.includes("handleSupabaseAuthCallback") &&
    authCallback.includes("exchangeCodeForSession") &&
    authCallback.includes("providerError") &&
    authCallback.includes("callback_missing_code") &&
    authCallback.includes("callback_exchange_failed") &&
    authCallback.includes('sanitizeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard")') &&
    !authCallback.includes("window."),
  "Expected callback route to exchange codes server-side and fail closed for provider/missing/exchange errors.",
);

assertCheck(
  "password recovery remains controlled inactive",
  forgotPasswordPage.includes("Recuperación preparada") &&
    forgotPasswordPage.includes("no se envían correos reales") &&
    forgotPasswordPage.includes("recuperación productiva todavía no está activada") &&
    !forgotPasswordPage.includes("createSupabaseBrowserAuthClient") &&
    !forgotPasswordPage.includes("resetPasswordForEmail"),
  "Expected forgot-password page to remain a controlled inactive surface with no production recovery action.",
);

assertCheck(
  "logout keeps Supabase client sign-out and legacy marker cleanup",
  browserClient.includes("createSupabaseBrowserAuthClient") &&
    dashboardShell.includes("await auth.signOut()") &&
    dashboardShell.includes("clearMockSession()") &&
    dashboardShell.includes('router.replace("/login")'),
  "Expected logout to clear Supabase client state and the legacy mock marker before returning to login.",
);

assertCheck(
  "service-role secrets do not enter auth client surfaces",
  ![
    loginPage,
    registerPage,
    forgotPasswordPage,
    authActions,
    browserClient,
    serverClient,
    authCallback,
  ].some((source) => source.includes("SERVICE_ROLE") || source.includes("service_role")),
  "Expected auth UI/client/callback surfaces to avoid service-role secret references.",
);

assertCheck(
  "Block B auth action quality gate is registered",
  packageJson.includes('"quality:block-b-auth-action-boundary": "node scripts/block-b-auth-action-boundary-quality.mjs"'),
  "Expected package.json to expose the Block B auth action boundary quality gate.",
);

const failed = checks.filter((check) => !check.passed);

console.log(
  `\nBlock B auth action boundary quality gate: ${
    checks.length - failed.length
  }/${checks.length} passed.`,
);

if (failed.length > 0) {
  process.exitCode = 1;
}
