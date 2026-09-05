import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "95c97b94ec824e8e6d5d6c746b155df92e9ce0bf";
const read = (path) => readFileSync(join(rootDir, path), "utf8");
const before = (path) =>
  execFileSync("git", ["show", `${baseline}:${path}`], {
    cwd: rootDir,
    encoding: "utf8",
  });

const login = read("app/login/page.tsx");
const register = read("app/register/page.tsx");
const callback = read("lib/auth/supabase/callback.ts");
const dashboardLayout = read("app/dashboard/layout.tsx");
const dashboard = read("app/dashboard/page.tsx");
const shell = read("components/DashboardShell.tsx");
const home = read("app/page.tsx");
const homepageAccountLink = read("components/HomepageAccountLink.tsx");
const simulator = read("components/HomeSimulator.tsx");
const savedSurface = read("components/SavedSimulationsHistorySurface.tsx");
const saveAction = read("lib/saved-decision-simulations/ui-save-action.ts");
const session = read("lib/auth/session.ts");
const authRuntime = read("components/auth/AuthRuntimeProvider.tsx");
const checks = [];
const providerOperations = 0;

function check(id, condition, detail) {
  checks.push({ id, passed: Boolean(condition), detail });
}

check(
  "A successful auth defaults to /dashboard",
  login.includes('useState("/dashboard")') &&
    login.includes('sanitizeRedirectPath(searchParams.get("next"), "/dashboard")') &&
    register.includes('router.replace("/dashboard")') &&
    register.includes('prepareEmailOtpAuthRedirect({ nextPath: "/dashboard" })') &&
    callback.includes('sanitizeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard")'),
  "Login, registration, or callback lost the canonical workspace destination.",
);

check(
  "B authenticated Nueva simulacion stays in workspace",
  shell.includes('href="/dashboard#nueva-simulacion"') &&
    !`${dashboard}\n${shell}\n${savedSurface}`.includes('/#simulador') &&
    !`${dashboard}\n${shell}\n${savedSurface}`.includes('/#decision-input'),
  "An authenticated simulator entry point still targets the public homepage.",
);

check(
  "C workspace renders the shared simulator independently",
  dashboard.includes('import HomeSimulator from "../../components/HomeSimulator"') &&
    dashboard.includes('id="nueva-simulacion"') &&
    (dashboard.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1,
  "The authenticated workspace does not own one shared simulator mount.",
);

check(
  "D workspace excludes homepage presentation orchestration",
  !/(?:HomepageAssemblyController|HomepageNavigation|data-home-assembly|minimal-home__|reference-header)/.test(
    `${dashboard}\n${shell}`,
  ),
  "A marketing-only component or reveal hook leaked into the workspace.",
);

check(
  "E homepage remains independently accessible",
  home === before("app/page.tsx") &&
    shell.includes('<Link href="/">Inicio</Link>') &&
    homepageAccountLink.includes('? { href: "/dashboard", label: "Mi espacio" }'),
  "Public homepage access or its independent composition changed.",
);

check(
  "F owner-scoped saved simulation workflow is preserved",
  saveAction === before("lib/saved-decision-simulations/ui-save-action.ts") &&
    simulator.includes("saveCompletedSimulationFromUi({ simulation })") &&
    simulator.includes("saveState.historyHref") &&
    simulator.includes("saveState.detailHref") &&
    savedSurface.includes("archiveSavedSimulationFromDashboard") &&
    savedSurface.includes("deleteSavedSimulationFromDashboard") &&
    savedSurface.includes('actionHref="/dashboard#nueva-simulacion"'),
  "Save, history, reopen, archive, delete, or the empty-state workspace route changed unexpectedly.",
);

check(
  "G refresh and session continuity are preserved",
  dashboardLayout.includes('export const dynamic = "force-dynamic"') &&
    dashboardLayout.includes('requireAuthenticatedDashboardSession("/dashboard")') &&
    session === before("lib/auth/session.ts") &&
    authRuntime === before("components/auth/AuthRuntimeProvider.tsx"),
  "The authenticated layout guard or existing session restoration code changed.",
);

check(
  "H logout is preserved",
  shell.includes("await auth.signOut()") &&
    shell.includes("clearMockSession()") &&
    shell.includes("router.refresh()") &&
    shell.includes('router.replace("/login")'),
  "The existing logout sequence changed.",
);

check(
  "I public preview remains intact with one shared implementation",
  (home.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1 &&
    (dashboard.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1 &&
    simulator.includes("useHomeSimulatorVoice") &&
    simulator.includes("appendVoiceTranscript(currentInput, transcript") &&
    !dashboard.includes("function HomeSimulator") &&
    !home.includes("function HomeSimulator"),
  "The public preview or single functional simulator implementation drifted.",
);

check(
  "J validation performs zero provider operations",
  providerOperations === 0 &&
    !/(?:api\.openai\.com|\/v1\/responses|LEVIO_REAL_AI)/.test(`${dashboard}\n${shell}`),
  "Workspace separation introduced or performed a provider operation.",
);

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.log(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nAuthenticated workspace separation gate: ${checks.length - failed.length}/${checks.length} passed.`);
console.log(`LEVIO_PROVIDER_OPERATION_EVIDENCE ${JSON.stringify({ inputTokenCount: 0, generation: 0, total: 0 })}`);
if (failed.length > 0) process.exitCode = 1;
