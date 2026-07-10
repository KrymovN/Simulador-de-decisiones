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
const persistenceProvider = readProjectFile(
  "lib",
  "persistence-runtime",
  "supabase-provider.ts",
);
const privacyPanel = readProjectFile("components", "PrivacyPanel.tsx");
const packageJson = readProjectFile("package.json");

assertCheck(
  "block-c-c1-export-surface-versioned",
  exportSurface.includes("stage-7-account-data-export-surface.2") &&
    exportSurface.includes("levio-account-data-export-json"),
  "Account data export surface must expose the current Stage 7 export version and JSON format.",
);

assertCheck(
  "block-c-c1-export-uses-owner-scoped-saved-simulations",
  exportSurface.includes("readSavedSimulationsHistorySurface") &&
    exportSurface.includes("owner_scoped_saved_simulation_history"),
  "Account data export must reuse the existing owner-scoped saved simulations product surface.",
);

assertCheck(
  "stage-7-export-includes-owner-scoped-eligible-drafts",
  exportSurface.includes(
    'simulationDrafts: "owner_scoped_eligible_simulation_drafts"',
  ) &&
    exportSurface.includes("readServerAuthSession") &&
    exportSurface.includes('operation: "list_simulation_drafts"') &&
    exportSurface.includes("row.owner_principal_id !== preflight.principalId") &&
    exportSurface.includes("draftPayload: row.draft_payload") &&
    exportSurface.includes("draftText: row.draft_text_snapshot") &&
    persistenceProvider.includes("async listSimulationDrafts(input)") &&
    persistenceProvider.includes('.from("simulation_drafts")') &&
    persistenceProvider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') &&
    persistenceProvider.includes('.eq("owner_principal_type", "registered_user")') &&
    persistenceProvider.includes('.eq("export_eligible", true)') &&
    persistenceProvider.includes('.eq("deletion_state", "active")') &&
    exportSurface.includes('simulationHistory: "not_included_in_c1"') &&
    exportSurface.includes('deletion: "not_executed"'),
  "Stage 7 export must include only eligible owner-scoped drafts and must not open history or deletion execution.",
);

assertCheck(
  "block-c-c1-export-has-no-client-owner-input",
  !exportSurface.includes("clientOwner") &&
    !exportRoute.includes("ownerPrincipalId") &&
    !exportRoute.includes("clientOwner"),
  "Stage 7 export must not accept owner identifiers from client-controlled input.",
);

assertCheck(
  "stage-7-export-draft-output-excludes-owner-and-provider-authority",
  !exportSurface.includes("ownerPrincipalId: row.owner_principal_id") &&
    !exportSurface.includes("providerReference:") &&
    !exportSurface.includes("legalHoldReason:") &&
    exportSurface.includes("exportEligible: true"),
  "Draft export output must remain provider-independent and must not expose owner authority or legal-hold internals.",
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
