import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const startingHead = "7bd90eec78282cbfe60a93610d637f4d674d9faa";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const before = (path) => execFileSync(
  "git",
  ["show", `${startingHead}:${path}`],
  { cwd: root, encoding: "utf8" },
);
const checks = [];

function add(id, passed, detail) {
  checks.push({ id, passed: Boolean(passed), detail });
}

const shell = read("components/DashboardShell.tsx");
const css = read("app/styles/dashboard-shell.css");
const legacyCascade = read("app/globals.css");
const layout = read("app/dashboard/layout.tsx");
const authProvider = read("components/auth/AuthRuntimeProvider.tsx");
const homepageAccountLink = read("components/HomepageAccountLink.tsx");
const login = read("app/login/page.tsx");

add(
  "confirmed-mobile-root-cause-is-overridden",
  legacyCascade.includes(".dashboard-sidebar > .ghost-button {\n    display: none;") &&
    css.includes("@media (max-width: 980px)") &&
    css.includes(".dashboard-sidebar > .dashboard-logout-button") &&
    css.includes("display: block;"),
  "The late mobile cascade still hides the only logout action without a final scoped override.",
);
add(
  "desktop-and-mobile-share-one-semantic-logout-button",
  (shell.match(/Cerrar sesión/g) ?? []).length === 1 &&
    shell.includes('className="ghost-button dashboard-logout-button"') &&
    shell.includes('type="button"') &&
    shell.includes("onClick={handleLogout}"),
  "Logout must remain one explicit, keyboard-accessible text button.",
);
add(
  "existing-session-termination-path-is-reused",
  (shell.match(/async function handleLogout/g) ?? []).length === 1 &&
    (shell.match(/await auth\.signOut\(\)/g) ?? []).length === 1 &&
    shell.includes("clearMockSession()") &&
    shell.includes("router.refresh()") &&
    shell.includes('router.replace("/login")') &&
    authProvider.includes("await supabase.auth.signOut()") &&
    authProvider.includes('setState({ identityState: "signed_out" })'),
  "Mobile logout introduced another Auth path or lost existing cleanup and redirect behavior.",
);
add(
  "anonymous-mobile-does-not-render-dashboard-logout",
  layout.includes("requireAuthenticatedDashboardSession") &&
    layout.includes('requireAuthenticatedDashboardSession("/dashboard")') &&
    layout.includes("<DashboardAccountProvider account={account}>") &&
    !homepageAccountLink.includes("Cerrar sesión"),
  "Anonymous users can reach the authenticated DashboardShell logout control.",
);
add(
  "post-logout-homepage-returns-to-login-state",
  homepageAccountLink.includes('identityState === "authenticated"') &&
    homepageAccountLink.includes('? { href: "/dashboard", label: "Mi espacio" }') &&
    homepageAccountLink.includes(': { href: "/login", label: "Iniciar sesión" }') &&
    authProvider.includes('setState({ identityState: "signed_out" })'),
  "Homepage account navigation does not return from Mi espacio to Iniciar sesión after sign-out.",
);
add(
  "another-account-can-start-passwordless-login",
  login.includes('name="email"') &&
    login.includes('autoComplete="email"') &&
    login.includes("supabase.auth.signInWithOtp") &&
    login.includes("email,") &&
    login.includes("shouldCreateUser: false") &&
    !login.includes("previousAccount"),
  "Explicit logout does not return to the existing email-driven account-selection flow.",
);
add(
  "mobile-layout-is-focusable-and-overflow-safe",
  css.includes(".dashboard-sidebar button:focus-visible") &&
    css.includes("outline: 3px solid var(--levio-focus-ring)") &&
    css.includes("min-height: 44px") &&
    css.includes("max-width: 100%;") &&
    css.includes("overflow-x: clip") &&
    css.includes("env(safe-area-inset-right)"),
  "Mobile logout lacks focus, touch-target, safe-area, or overflow protection.",
);
add(
  "auth-and-persistence-contracts-remain-byte-identical",
  [
    "components/auth/AuthRuntimeProvider.tsx",
    "lib/auth/actions.ts",
    "lib/auth/session.ts",
    "lib/auth/guards.ts",
    "lib/auth/supabase/client.ts",
    "lib/auth/supabase/server.ts",
    "lib/auth/supabase/callback.ts",
    "lib/persistence-runtime/simulation-record-persistence.ts",
    "lib/saved-decision-simulations/runtime.ts",
  ].every((path) => read(path) === before(path)),
  "Auth, Supabase, persistence, or saved-simulation runtime contracts changed.",
);
add(
  "mobile-logout-gate-is-registered",
  read("package.json").includes('"quality:mobile-authenticated-logout-access"'),
  "Dedicated mobile logout gate is not registered.",
);

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowed = new Set([
  "app/dashboard/page.tsx",
  "components/DashboardShell.tsx",
  "components/HomepageAccountLink.tsx",
  "components/SavedSimulationsHistorySurface.tsx",
  "app/styles/dashboard-shell.css",
  "scripts/authenticated-simulator-continuity-quality.mjs",
  "scripts/authenticated-workspace-separation-quality.mjs",
  "scripts/dashboard-shell-landing-quality.mjs",
  "scripts/mobile-authenticated-logout-access-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowed.has(path));
add(
  "exact-bounded-write-set",
  unexpected.length === 0,
  `Unexpected changed paths: ${unexpected.join(", ") || "none"}.`,
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
