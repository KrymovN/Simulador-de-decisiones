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

const deletionSurface = readProjectFile(
  "lib",
  "user-data-controls",
  "account-data-deletion-surface.ts",
);
const deletionRoute = readProjectFile("app", "dashboard", "privacy", "deletion", "route.ts");
const persistenceProvider = readProjectFile(
  "lib",
  "persistence-runtime",
  "supabase-provider.ts",
);
const privacyPanel = readProjectFile("components", "PrivacyPanel.tsx");
const packageJson = readProjectFile("package.json");

assertCheck(
  "block-c-c2-deletion-surface-versioned",
  deletionSurface.includes("stage-7-account-data-deletion-surface.3") &&
    deletionSurface.includes("levio-account-data-deletion-plan-json"),
  "Account data deletion surface must expose a stable Block C C2 deletion plan version and JSON format.",
);

assertCheck(
  "block-c-c2-deletion-uses-owner-scoped-saved-simulations",
  deletionSurface.includes("readSavedSimulationsHistorySurface") &&
    deletionSurface.includes("owner_scoped_saved_simulation_history"),
  "C2 deletion planning must reuse the existing owner-scoped saved simulations product surface.",
);

assertCheck(
  "block-c-c2-deletion-is-planning-only",
  deletionSurface.includes('deletion: "planning_only_no_execution"') &&
    deletionSurface.includes('deletionExecution: "not_executed"') &&
    deletionSurface.includes('hardDelete: "not_executed"') &&
    deletionSurface.includes('databaseWrites: "not_executed"') &&
    deletionSurface.includes('retentionJobs: "not_started"'),
  "C2 deletion planning must not execute deletion, hard delete, database writes, or retention jobs.",
);

assertCheck(
  "block-c-c2-deletion-stays-within-substep",
  deletionSurface.includes(
    'simulationHistory: "owner_scoped_simulation_history_entries"',
  ) && deletionSurface.includes('accountDeletion: "not_included_in_c2"'),
  "Stage 7 deletion planning must describe history planning without opening account deletion.",
);

assertCheck(
  "stage-7-deletion-plan-includes-owner-scoped-eligible-drafts",
  deletionSurface.includes(
    'simulationDrafts: "owner_scoped_eligible_simulation_drafts"',
  ) &&
    deletionSurface.includes("readServerAuthSession") &&
    deletionSurface.includes('operation: "list_simulation_drafts"') &&
    deletionSurface.includes("row.owner_principal_id !== preflight.principalId") &&
    deletionSurface.includes("simulationDraftDeletionPlan") &&
    deletionSurface.includes('execution: "not_executed"') &&
    deletionSurface.includes("listSimulationDraftsForDeletion") &&
    persistenceProvider.includes("async listSimulationDraftsForDeletion(input)") &&
    persistenceProvider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') &&
    persistenceProvider.includes('.eq("owner_principal_type", "registered_user")') &&
    persistenceProvider.includes('.eq("deletion_state", "active")'),
  "Deletion planning must include active drafts for the server-resolved owner without depending on export eligibility or executing deletion.",
);

assertCheck(
  "stage-7-deletion-plan-keeps-export-and-deletion-eligibility-separate",
  deletionSurface.includes("listSimulationDraftsForDeletion") &&
    !deletionSurface.includes("row.export_eligible") &&
    persistenceProvider.includes("async listSimulationDraftsForDeletion(input)") &&
    persistenceProvider.includes("async listSimulationDrafts(input)"),
  "Draft deletion planning must use a distinct provider read and must not collapse export eligibility into deletion eligibility.",
);

assertCheck(
  "stage-7-deletion-plan-includes-owner-scoped-history",
  deletionSurface.includes('operation: "list_simulation_history"') &&
    deletionSurface.includes("listSimulationHistoryEntriesForDeletion") &&
    deletionSurface.includes("row.owner_principal_id !== preflight.principalId") &&
    deletionSurface.includes("simulationHistoryDeletionPlan") &&
    deletionSurface.includes('execution: "not_executed"') &&
    persistenceProvider.includes(
      "async listSimulationHistoryEntriesForDeletion(input)",
    ) &&
    persistenceProvider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') &&
    persistenceProvider.includes('.eq("owner_principal_type", "registered_user")') &&
    persistenceProvider.includes('.eq("deletion_state", "active")'),
  "Deletion planning must include active simulation history entries for the server-resolved owner without executing deletion.",
);

assertCheck(
  "stage-7-history-deletion-plan-separates-export-eligibility",
  deletionSurface.includes("listSimulationHistoryEntriesForDeletion") &&
    persistenceProvider.includes("async listSimulationHistoryEntries(input)") &&
    persistenceProvider.includes(
      "async listSimulationHistoryEntriesForDeletion(input)",
    ) &&
    !deletionSurface.includes("row.export_eligible") &&
    !deletionSurface.includes("row.user_visible"),
  "History deletion planning must use a distinct provider read and must not collapse export visibility into deletion eligibility.",
);

assertCheck(
  "block-c-c2-deletion-has-no-client-owner-input",
  !deletionSurface.includes("clientOwner") &&
    !deletionSurface.includes("ownerPrincipalId: row.owner_principal_id") &&
    !deletionRoute.includes("ownerPrincipalId") &&
    !deletionRoute.includes("clientOwner"),
  "C2 deletion planning must not accept owner identifiers from client-controlled input.",
);

assertCheck(
  "block-c-c2-route-is-dashboard-json-download",
  deletionRoute.includes('export const dynamic = "force-dynamic"') &&
    deletionRoute.includes("readAccountDataDeletionSurface") &&
    deletionRoute.includes("Content-Disposition") &&
    deletionRoute.includes("Cache-Control") &&
    deletionRoute.includes("no-store"),
  "Dashboard deletion planning route must be dynamic, no-store, and return the deletion plan as a download.",
);

assertCheck(
  "block-c-c2-route-does-not-read-env-or-supabase-directly",
  !deletionRoute.includes("process.env") &&
    !deletionRoute.includes("createSupabase") &&
    !deletionRoute.includes("createClient"),
  "Dashboard deletion planning route must use the product surface instead of direct env or Supabase access.",
);

assertCheck(
  "block-c-c2-privacy-panel-exposes-plan-not-execution",
  privacyPanel.includes("/dashboard/privacy/deletion") &&
    privacyPanel.includes("Descargar plan") &&
    privacyPanel.includes("sin ejecutar la eliminación") &&
    privacyPanel.includes("UnavailableAction") &&
    privacyPanel.includes("Pausa no disponible") &&
    privacyPanel.includes("no se ha registrado ninguna solicitud"),
  "Privacy panel must expose deletion planning without turning future privacy controls into execution flows.",
);

assertCheck(
  "block-c-c2-quality-script-registered",
  packageJson.includes('"quality:block-c-user-data-deletion-surface"'),
  "Package scripts must register the Block C C2 quality gate.",
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
