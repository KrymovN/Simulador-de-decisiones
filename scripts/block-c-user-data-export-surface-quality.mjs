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

const exportSurface = readProjectFile(
  "lib",
  "user-data-controls",
  "account-data-export-surface.ts",
);
const exportRoute = readProjectFile("app", "dashboard", "privacy", "export", "route.ts");
const privacyPanel = readProjectFile("components", "PrivacyPanel.tsx");
const packageJson = readProjectFile("package.json");

assertCheck(
  "block-c-c1-export-surface-versioned",
  exportSurface.includes("block-c-c1-account-data-export-surface.1") &&
    exportSurface.includes("levio-account-data-export-json"),
  "Account data export surface must expose a stable Block C C1 export version and JSON format.",
);

assertCheck(
  "block-c-c1-export-uses-owner-scoped-saved-simulations",
  exportSurface.includes("readSavedSimulationsHistorySurface") &&
    exportSurface.includes("owner_scoped_saved_simulation_history"),
  "Account data export must reuse the existing owner-scoped saved simulations product surface.",
);

assertCheck(
  "block-c-c1-export-stays-within-first-substep",
  exportSurface.includes('simulationDrafts: "not_included_in_c1"') &&
    exportSurface.includes('simulationHistory: "not_included_in_c1"') &&
    exportSurface.includes('deletion: "not_executed"'),
  "C1 export must not implement drafts, history expansion, or deletion execution.",
);

assertCheck(
  "block-c-c1-export-has-no-client-owner-input",
  !exportSurface.includes("ownerPrincipalId") &&
    !exportSurface.includes("clientOwner") &&
    !exportRoute.includes("ownerPrincipalId") &&
    !exportRoute.includes("clientOwner"),
  "C1 export must not accept owner identifiers from client-controlled input.",
);

assertCheck(
  "block-c-c1-route-is-dashboard-json-download",
  exportRoute.includes('export const dynamic = "force-dynamic"') &&
    exportRoute.includes("readAccountDataExportSurface") &&
    exportRoute.includes("Content-Disposition") &&
    exportRoute.includes("Cache-Control") &&
    exportRoute.includes("no-store"),
  "Dashboard export route must be dynamic, no-store, and return the account export document as a download.",
);

assertCheck(
  "block-c-c1-route-does-not-read-env-or-supabase-directly",
  !exportRoute.includes("process.env") &&
    !exportRoute.includes("createSupabase") &&
    !exportRoute.includes("createClient"),
  "Dashboard export route must use the product surface instead of direct env or Supabase access.",
);

assertCheck(
  "block-c-c1-privacy-panel-exposes-export-without-deletion-execution",
  privacyPanel.includes("/dashboard/privacy/export") &&
    privacyPanel.includes("Descargar JSON") &&
    privacyPanel.includes("/dashboard/privacy/deletion") &&
    privacyPanel.includes("Descargar plan") &&
    privacyPanel.includes("MockFeedbackButton"),
  "Privacy panel must expose the export download while keeping deletion execution out of C1.",
);

assertCheck(
  "block-c-c1-quality-script-registered",
  packageJson.includes('"quality:block-c-user-data-export-surface"'),
  "Package scripts must register the Block C C1 quality gate.",
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
