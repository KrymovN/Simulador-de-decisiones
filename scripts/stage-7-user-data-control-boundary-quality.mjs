import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();

function readProjectFile(...segments) {
  return readFileSync(join(rootDir, ...segments), "utf8");
}

const surfaces = ["export", "deletion", "retention"].map((control) => ({
  control,
  surface: readProjectFile(
    "lib",
    "user-data-controls",
    `account-data-${control}-surface.ts`,
  ),
  route: readProjectFile(
    "app",
    "dashboard",
    "privacy",
    control,
    "route.ts",
  ),
}));
const dashboardLayout = readProjectFile("app", "dashboard", "layout.tsx");
const dashboardGuard = readProjectFile("lib", "auth", "guards.ts");
const productSurface = readProjectFile(
  "lib",
  "saved-decision-simulations",
  "product-surface.ts",
);
const savedSimulationRuntime = readProjectFile(
  "lib",
  "saved-decision-simulations",
  "runtime.ts",
);
const packageJson = readProjectFile("package.json");

const checks = [];

function assertCheck(caseId, condition, issue) {
  checks.push({ caseId, passed: Boolean(condition), issue });
}

for (const { control, surface, route } of surfaces) {
  assertCheck(
    `stage-7-${control}-route-remains-protected-dashboard-only`,
    route.includes('export const dynamic = "force-dynamic"') &&
      dashboardLayout.includes("requireAuthenticatedDashboardSession") &&
      dashboardGuard.includes("readServerAuthSession") &&
      dashboardGuard.includes("redirect(buildLoginRedirectPath"),
    `${control} must remain below the authenticated dashboard layout guard.`,
  );

  assertCheck(
    `stage-7-${control}-rejects-client-owner-authority`,
    !route.includes("ownerPrincipalId") &&
      !route.includes("principalId") &&
      !route.includes("providerReference") &&
      !route.includes("searchParams") &&
      !surface.includes("clientOwner") &&
      !surface.includes("client_owner"),
    `${control} must not accept client-controlled owner authority.`,
  );

  assertCheck(
    `stage-7-${control}-route-delegates-without-provider-access`,
    route.includes(`readAccountData${control[0].toUpperCase()}${control.slice(1)}Surface`) &&
      !route.includes("process.env") &&
      !route.includes("createClient") &&
      !route.includes("createSupabase"),
    `${control} route must delegate to its server surface without direct provider or env access.`,
  );

  assertCheck(
    `stage-7-${control}-fails-closed-on-auth-or-read-state`,
    surface.includes('reason: "auth_required" | "read_failed"') &&
      surface.includes('status: "blocked"'),
    `${control} surface must expose controlled auth/read failure states.`,
  );

  assertCheck(
    `stage-7-${control}-does-not-open-destructive-account-lifecycle`,
    !route.includes("DELETE") &&
      !route.includes("POST") &&
      !route.includes("PATCH") &&
      !route.includes("PUT") &&
      !surface.includes("deleteAccount(") &&
      !surface.includes("hardDelete(") &&
      !surface.includes("retentionJob.run"),
    `${control} must remain read-only and must not open account deletion or retention execution.`,
  );
}

assertCheck(
  "stage-7-owner-resolution-remains-server-side-and-canonical",
  productSurface.includes("readServerAuthSession") &&
    savedSimulationRuntime.includes("resolvePrincipalForOperation") &&
    savedSimulationRuntime.includes("ownerPrincipalId: principal.principalId") &&
    savedSimulationRuntime.includes("recordsAreOwnerScoped"),
  "Saved simulation controls must resolve the authenticated canonical owner through server runtime.",
);

assertCheck(
  "stage-7-control-set-stays-owner-scoped",
  surfaces.every(({ surface }) =>
    surface.includes("owner_scoped_saved_simulation_history"),
  ),
  "Export, deletion planning, and retention status must describe the same owner-scoped saved-simulation boundary.",
);

assertCheck(
  "stage-7-export-history-remains-read-only-and-owner-scoped",
  surfaces[0].surface.includes('operation: "list_simulation_history"') &&
    surfaces[0].surface.includes("listSimulationHistoryEntries") &&
    surfaces[0].surface.includes("row.owner_principal_id !== preflight.principalId") &&
    !surfaces[0].surface.includes("saveSimulationHistoryEntry(") &&
    !surfaces[0].surface.includes("append_simulation_history_entry"),
  "Simulation history export must use owner-scoped read preflight without enabling history mutations.",
);

assertCheck(
  "stage-7-user-data-control-boundary-gate-registered",
  packageJson.includes('"quality:stage-7-user-data-control-boundary"'),
  "Package scripts must register the Stage 7 cross-surface boundary gate.",
);

for (const check of checks) {
  if (check.passed) {
    console.log(`PASS ${check.caseId}`);
  } else {
    console.error(`FAIL ${check.caseId}`);
    console.error(`  ${check.issue}`);
  }
}

const passed = checks.filter((check) => check.passed).length;
console.log(`${passed}/${checks.length} checks passed.`);

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1;
}
