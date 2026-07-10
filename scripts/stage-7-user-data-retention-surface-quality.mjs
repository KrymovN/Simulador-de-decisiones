import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();

function readProjectFile(...segments) {
  return readFileSync(join(rootDir, ...segments), "utf8");
}

const checks = [];

function assertCheck(caseId, condition, issue) {
  checks.push({
    caseId,
    passed: Boolean(condition),
    issue,
  });
}

const retentionSurface = readProjectFile(
  "lib",
  "user-data-controls",
  "account-data-retention-surface.ts",
);
const retentionRoute = readProjectFile("app", "dashboard", "privacy", "retention", "route.ts");
const privacyPanel = readProjectFile("components", "PrivacyPanel.tsx");
const packageJson = readProjectFile("package.json");

assertCheck(
  "stage-7-retention-surface-versioned",
  retentionSurface.includes("stage-7-account-data-retention-surface.3") &&
    retentionSurface.includes("levio-account-data-retention-plan-json"),
  "Stage 7 retention surface must expose a stable version and JSON plan format.",
);

assertCheck(
  "stage-7-retention-uses-server-auth-and-owner-scoped-simulations",
  retentionSurface.includes("readServerAuthSession") &&
    retentionSurface.includes("listDecisionSimulations") &&
    retentionSurface.includes("simulation.ownership.ownerPrincipalId") &&
    retentionSurface.includes("owner_scoped_saved_simulation_history"),
  "Retention surface must use server auth and the existing owner-scoped saved simulation runtime.",
);

assertCheck(
  "stage-7-retention-uses-preflight-retention-foundation",
  retentionSurface.includes("createRetentionRuntimeFoundation") &&
    retentionSurface.includes("DEFAULT_RETENTION_RUNTIME_POLICIES") &&
    retentionSurface.includes("retention_foundation_preflight") &&
    retentionSurface.includes("runtime.evaluate"),
  "Retention surface must evaluate retention through the approved preflight foundation.",
);

assertCheck(
  "stage-7-retention-is-planning-status-only",
  retentionSurface.includes('retention: "planning_status_only_no_enforcement"') &&
    retentionSurface.includes('retentionEnforcement: "not_started"') &&
    retentionSurface.includes('retentionJobs: "not_started"') &&
    retentionSurface.includes('deletionExecution: "not_executed"') &&
    retentionSurface.includes('hardDelete: "not_executed"') &&
    retentionSurface.includes('databaseWrites: "not_executed"'),
  "Retention surface must not enforce retention, start jobs, execute deletion, hard delete, or write data.",
);

assertCheck(
  "stage-7-retention-includes-owner-scoped-drafts-and-history",
  retentionSurface.includes(
    'simulationDrafts: "owner_scoped_simulation_drafts"',
  ) &&
    retentionSurface.includes('operation: "list_simulation_drafts"') &&
    retentionSurface.includes("listSimulationDraftsForRetention") &&
    retentionSurface.includes("row.owner_principal_id !== preflight.principalId") &&
    !retentionSurface.includes("row.export_eligible !== true") &&
    retentionSurface.includes(
      'simulationHistory: "owner_scoped_simulation_history_entries"',
    ) &&
    retentionSurface.includes('operation: "list_simulation_history"') &&
    retentionSurface.includes("listSimulationHistoryEntriesForRetention") &&
    retentionSurface.includes("parentRecord: parent ? toParentSnapshot(parent) : undefined") &&
    retentionSurface.includes('resourceCategory: "simulation_history_entry"') &&
    retentionSurface.includes('accountDeletion: "not_included"'),
  "Retention surface must include owner-scoped drafts and history without adding account deletion orchestration.",
);

assertCheck(
  "stage-7-retention-route-has-no-client-owner-input",
  !retentionRoute.includes("ownerPrincipalId") &&
    !retentionRoute.includes("clientOwner") &&
    !retentionRoute.includes("searchParams") &&
    !retentionRoute.includes("request:") &&
    !retentionRoute.includes("Request"),
  "Retention route must not accept owner identifiers or client-controlled owner input.",
);

assertCheck(
  "stage-7-retention-route-is-dashboard-json-download",
  retentionRoute.includes('export const dynamic = "force-dynamic"') &&
    retentionRoute.includes("readAccountDataRetentionSurface") &&
    retentionRoute.includes("Content-Disposition") &&
    retentionRoute.includes("Cache-Control") &&
    retentionRoute.includes("no-store"),
  "Dashboard retention route must be dynamic, no-store, and return the retention plan as a download.",
);

assertCheck(
  "stage-7-retention-route-does-not-read-env-or-supabase-directly",
  !retentionRoute.includes("process.env") &&
    !retentionRoute.includes("createSupabase") &&
    !retentionRoute.includes("createClient"),
  "Dashboard retention route must use the product surface instead of direct env or Supabase access.",
);

assertCheck(
  "stage-7-retention-privacy-panel-exposes-status-not-enforcement",
  privacyPanel.includes("/dashboard/privacy/retention") &&
    privacyPanel.includes("Descargar estado") &&
    privacyPanel.includes("sin iniciar trabajos automáticos") &&
    privacyPanel.includes("MockFeedbackButton"),
  "Privacy panel must expose retention status without turning future privacy controls into enforcement flows.",
);

assertCheck(
  "stage-7-retention-quality-script-registered",
  packageJson.includes('"quality:stage-7-user-data-retention-surface"'),
  "Package scripts must register the Stage 7 retention surface quality gate.",
);

for (const check of checks) {
  if (check.passed) {
    console.log(`PASS ${check.caseId}`);
  } else {
    console.error(`FAIL ${check.caseId}`);
    console.error(`  ${check.issue}`);
  }
}

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1;
}
