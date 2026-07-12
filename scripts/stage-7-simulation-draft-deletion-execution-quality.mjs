import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (...parts) => readFileSync(join(process.cwd(), ...parts), "utf8");
const execution = read("lib", "user-data-controls", "simulation-draft-deletion-execution.ts");
const provider = read("lib", "persistence-runtime", "supabase-provider.ts");
const draftSchema = read("supabase", "migrations", "003_create_simulation_drafts.sql");
const relations = read("supabase", "migrations", "005_indexes_and_constraints.sql");
const packageJson = read("package.json");
const checks = [];

function check(id, condition, issue) {
  checks.push({ id, passed: Boolean(condition), issue });
}

check("draft-delete-auth-required", execution.includes("readServerAuthSession") && execution.includes('identityState !== "authenticated"'), "Draft deletion must require server-validated authentication.");
check("draft-delete-canonical-owner", execution.includes('operation: "resolve_principal"') && execution.includes("ownerPrincipalId: preflight.principalId"), "Draft deletion must derive the canonical owner server-side.");
check("draft-delete-client-owner-rejected", execution.includes("hasClientOwnerAuthority(input)") && execution.includes("CLIENT_OWNER_KEYS"), "Client owner authority must be rejected.");
check("draft-delete-owner-scoped-active-only", provider.includes('async deleteSimulationDraft(input)') && provider.includes('.eq("draft_id", input.draftId)') && provider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') && provider.includes('.eq("draft_status", "active")') && provider.includes('.eq("deletion_state", "active")'), "Provider mutation must target one active owner-scoped draft.");
check("draft-delete-content-erased", provider.includes('draft_status: "deleted"') && provider.includes('deletion_state: "deleted"') && provider.includes("draft_payload: {}") && provider.includes("draft_text_snapshot: null") && provider.includes("clarification_answers_snapshot: null") && provider.includes("structured_context_snapshot: null") && provider.includes("export_eligible: false"), "Draft content must be cleared through existing lifecycle fields.");
check("draft-delete-shares-terminal-payload", provider.includes("buildSimulationDraftTerminalDeletePayload") && provider.split("buildSimulationDraftTerminalDeletePayload(input.deletedAt)").length - 1 === 2, "Direct deletion and retention deletion must reuse one terminal payload builder.");
check("draft-delete-malformed-id-blocked", execution.includes("UUID_PATTERN.test(input.draftId.trim())") && execution.includes('"invalid_request"'), "Malformed draft identifiers must fail before persistence.");
check("draft-delete-idempotent-safe-absence", provider.includes('return { status: "not_found" }') && execution.includes('status: "already_absent"'), "Missing, cross-owner, inactive, and repeated requests must share a safe absent result.");
check("draft-delete-provider-failure-closed", provider.includes('return { status: "failed" }') && execution.includes('deletion.status === "failed"') && execution.includes('"delete_failed"'), "Persistence failures must fail closed.");
check("draft-delete-no-other-entity-mutation", !execution.includes("deleteSimulationRecord") && !execution.includes("deleteSimulationHistory") && !execution.includes("deleteAccount") && !execution.includes("consent") && !execution.includes("retention"), "Draft deletion must not mutate saved simulations, history, accounts, consent, or retention.");
check("draft-delete-no-hard-delete-or-cascade", !provider.includes('.from("simulation_drafts").delete') && relations.includes("simulation_records_originating_draft_fk") && relations.includes("on delete set null") && draftSchema.includes("deleted_at timestamptz"), "Draft deletion must use lifecycle mutation without physical delete or cascade.");
check("draft-delete-no-new-ui-or-route", !execution.includes("NextResponse") && !execution.includes("revalidatePath") && !execution.includes("redirect("), "No draft UI/route may be invented when no detail/edit surface exists.");
check("draft-delete-gate-registered", packageJson.includes('"quality:stage-7-simulation-draft-deletion-execution"'), "The dedicated draft deletion gate must be registered.");

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.issue}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
