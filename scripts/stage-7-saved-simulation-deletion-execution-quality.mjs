import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (...segments) => readFileSync(join(process.cwd(), ...segments), "utf8");
const runtime = read("lib", "saved-decision-simulations", "runtime.ts");
const provider = read("lib", "persistence-runtime", "supabase-provider.ts");
const surface = read("lib", "saved-decision-simulations", "product-surface.ts");
const action = read("lib", "saved-decision-simulations", "ui-save-action.ts");
const component = read("components", "SavedSimulationsHistorySurface.tsx");
const recordsSchema = read("supabase", "migrations", "002_create_simulation_records.sql");
const relationsSchema = read("supabase", "migrations", "005_indexes_and_constraints.sql");
const packageJson = read("package.json");
const checks = [];

function check(caseId, passed, issue) {
  checks.push({ caseId, passed: Boolean(passed), issue });
}

check(
  "stage-7-saved-simulation-delete-requires-auth-and-canonical-principal",
  runtime.includes("deleteDecisionSimulation") &&
    runtime.includes('input.authContext?.identityState !== "authenticated"') &&
    runtime.includes('operation: "resolve_principal"') &&
    runtime.includes("ownerPrincipalId: preflight.principalId"),
  "Deletion must require authentication and resolve the canonical principal server-side.",
);
check(
  "stage-7-saved-simulation-delete-rejects-client-owner-authority",
  runtime.includes("hasClientOwnerInput(input)") &&
    runtime.includes('"client_owner_input_rejected"') &&
    !action.includes("ownerPrincipalId") &&
    !action.includes("principalId"),
  "Deletion must reject client-supplied owner authority.",
);
check(
  "stage-7-saved-simulation-delete-is-owner-scoped-and-active-only",
  provider.includes('async deleteSimulationRecord(input)') &&
    provider.includes('.eq("record_id", input.recordId)') &&
    provider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') &&
    provider.includes('.eq("owner_principal_type", "registered_user")') &&
    provider.includes('.eq("record_status", "active")') &&
    provider.includes('.eq("deletion_state", "active")'),
  "Provider update must target only the active saved simulation owned by the canonical principal.",
);
check(
  "stage-7-saved-simulation-delete-uses-approved-lifecycle-transition",
  provider.includes('record_status: "deleted"') &&
    provider.includes('deletion_state: "deleted"') &&
    provider.includes("user_input_snapshot: {}") &&
    provider.includes("deterministic_output_snapshot: {}") &&
    provider.includes("clarification_snapshot: null") &&
    provider.includes("decision_model_snapshot: null") &&
    provider.includes("deleted_at: input.deletedAt") &&
    provider.includes("export_eligible: false") &&
    recordsSchema.includes("'deleted'") &&
    recordsSchema.includes("deleted_at timestamptz"),
  "Deletion must erase saved-simulation content and use existing terminal lifecycle fields without a schema change.",
);
check(
  "stage-7-saved-simulation-delete-is-idempotent-without-owner-leakage",
  provider.includes('return { status: "not_found" }') &&
    runtime.includes('status: "already_absent"') &&
    surface.includes('status: "deleted" | "already_absent"'),
  "Missing, cross-owner, or repeated active-record deletion must share a safe non-disclosing result.",
);
check(
  "stage-7-saved-simulation-delete-fails-closed-on-provider-failure",
  provider.includes('return { status: "failed" }') &&
    runtime.includes('deletion.status === "failed"') &&
    runtime.includes('"record_delete_failed"'),
  "Persistence failures must remain distinguishable from absence and fail closed.",
);
check(
  "stage-7-saved-simulation-delete-validates-malformed-identifiers",
  runtime.includes("normalizeRecordId(input.recordId)") &&
    runtime.includes('blocked("record_id_invalid"'),
  "Malformed record identifiers must fail before persistence execution.",
);
check(
  "stage-7-saved-simulation-delete-does-not-delete-drafts-history-or-account",
  !provider.includes('.from("simulation_drafts").delete') &&
    !provider.includes('.from("simulation_history_entries").delete') &&
    !provider.includes('.from("levio_principals").delete') &&
    component.includes("no elimina borradores, historial técnico ni la cuenta"),
  "The execution surface must not delete drafts, history, principals, or imply account deletion.",
);
check(
  "stage-7-saved-simulation-delete-has-no-hard-delete-or-cascade",
  !provider.includes('.from("simulation_records").delete') &&
    recordsSchema.includes("on delete restrict") &&
    relationsSchema.includes("simulation_history_parent_owner_match_fk") &&
    relationsSchema.includes("on delete restrict"),
  "The bounded substep must not physically delete or cascade into related records.",
);
check(
  "stage-7-saved-simulation-delete-does-not-open-consent-or-retention-writes",
  !provider.includes('.from("consent') &&
    !provider.includes("retentionJob") &&
    !action.includes("consent") &&
    !action.includes("retention"),
  "Deletion execution must remain isolated from consent and retention writes.",
);
check(
  "stage-7-saved-simulation-delete-is-server-action-only",
  action.includes('"use server"') &&
    action.includes("deleteSavedSimulationSurface") &&
    action.includes('formData.get("recordId")') &&
    component.includes("deleteSavedSimulationFromDashboard"),
  "The usable dashboard surface must delegate through the existing server action/product boundary.",
);
check(
  "stage-7-saved-simulation-delete-gate-is-registered",
  packageJson.includes('"quality:stage-7-saved-simulation-deletion-execution"'),
  "Package scripts must register the dedicated deletion execution gate.",
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.caseId}`);
  if (!item.passed) console.error(`  ${item.issue}`);
}

console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
