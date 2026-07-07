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

const authTypes = read("lib", "auth", "types.ts");
const authMessages = read("lib", "auth", "messages.ts");
const authCallback = read("lib", "auth", "supabase", "callback.ts");
const callbackRoute = read("app", "auth", "callback", "route.ts");
const loginPage = read("app", "login", "page.tsx");
const registerPage = read("app", "register", "page.tsx");
const forgotPasswordPage = read("app", "forgot-password", "page.tsx");
const authActions = read("lib", "auth", "actions.ts");
const authConfig = read("lib", "auth", "config.ts");
const packageJson = read("package.json");

const authSurfaceSources = [
  authTypes,
  authMessages,
  authCallback,
  callbackRoute,
  loginPage,
  registerPage,
  forgotPasswordPage,
  authActions,
  authConfig,
];

assertCheck(
  "email callback states are modeled explicitly",
  ["callback_missing_code", "callback_invalid", "callback_expired", "callback_cancelled", "callback_exchange_failed"].every(
    (code) => authTypes.includes(`"${code}"`),
  ),
  "Expected auth error types to include missing, invalid, expired, cancelled, and exchange-failed callback states.",
);

assertCheck(
  "email callback states have controlled user-facing messages",
  authMessages.includes("callback_invalid") &&
    authMessages.includes("callback_expired") &&
    authMessages.includes("callback_cancelled") &&
    authMessages.includes("Solicita uno nuevo") &&
    !authMessages.includes("error_description") &&
    !authMessages.includes("Supabase"),
  "Expected callback state messages to be product-safe and avoid provider internals.",
);

assertCheck(
  "callback route remains server-side and fail-closed",
  callbackRoute.includes("handleSupabaseAuthCallback") &&
    authCallback.includes("exchangeCodeForSession") &&
    authCallback.includes("authErrorRedirect") &&
    authCallback.includes("callback_missing_code") &&
    authCallback.includes("callback_exchange_failed") &&
    authCallback.includes('sanitizeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard")') &&
    !authCallback.includes("window."),
  "Expected callback processing to stay server-side, sanitize next, and redirect to controlled login errors.",
);

assertCheck(
  "provider and exchange failures are classified without leaking provider payloads",
  authCallback.includes("classifyCallbackFailure") &&
    authCallback.includes("providerError") &&
    authCallback.includes("providerErrorCode") &&
    authCallback.includes("providerErrorDescription") &&
    authCallback.includes("callback_invalid") &&
    authCallback.includes("callback_expired") &&
    authCallback.includes("callback_cancelled") &&
    authCallback.includes("error.message") &&
    !authCallback.includes("error_description=") &&
    !authCallback.includes("providerErrorDescription}`"),
  "Expected callback to normalize provider/exchange errors into controlled states and avoid reflecting raw provider descriptions.",
);

assertCheck(
  "login and registration initiate email pending states through approved boundary",
  loginPage.includes("prepareEmailOtpAuthRedirect") &&
    registerPage.includes("prepareEmailOtpAuthRedirect") &&
    loginPage.includes("emailRedirectTo: redirectResult.emailRedirectTo") &&
    registerPage.includes("emailRedirectTo: redirectResult.emailRedirectTo") &&
    loginPage.includes("recibirás un enlace de acceso") &&
    registerPage.includes("recibirás un enlace de confirmación o acceso") &&
    !loginPage.includes("window.location.origin") &&
    !registerPage.includes("window.location.origin"),
  "Expected login/register to use the approved auth redirect action and show controlled pending email messages.",
);

assertCheck(
  "password recovery remains explicitly inactive",
  forgotPasswordPage.includes("Recuperación preparada") &&
    forgotPasswordPage.includes("no se envían correos reales") &&
    forgotPasswordPage.includes("recuperación productiva todavía no está activada") &&
    !forgotPasswordPage.includes("resetPasswordForEmail") &&
    !forgotPasswordPage.includes("emailRedirectTo") &&
    !forgotPasswordPage.includes("createSupabaseBrowserAuthClient"),
  "Expected password recovery to remain controlled inactive until the policy is approved.",
);

assertCheck(
  "auth redirects remain allowlisted and dashboard-only",
  authConfig.includes("buildAuthRedirectUrl") &&
    authConfig.includes("redirectOriginAllowed") &&
    authConfig.includes('pathname !== "/auth/callback"') &&
    authConfig.includes('redirectUrl.searchParams.set("next", sanitizeRedirectPath(nextPath, "/dashboard"))') &&
    authActions.includes("buildAuthRedirectUrl") &&
    authActions.includes("sanitizeRedirectPath"),
  "Expected email auth redirects to use approved callback origin and dashboard-only next paths.",
);

assertCheck(
  "service-role secrets and owner fields stay out of email auth surfaces",
  !authSurfaceSources.some(
    (source) =>
      source.includes("SERVICE_ROLE") ||
      source.includes("service_role") ||
      source.includes("owner_principal_id") ||
      source.includes("ownerPrincipalId"),
  ),
  "Expected email auth surfaces to avoid service-role keys and client-supplied owner fields.",
);

assertCheck(
  "Block B email flow quality gate is registered",
  packageJson.includes('"quality:block-b-email-flow": "node scripts/block-b-email-flow-quality.mjs"'),
  "Expected package.json to expose the Block B email flow quality gate.",
);

const failed = checks.filter((check) => !check.passed);

console.log(`\nBlock B email flow quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
