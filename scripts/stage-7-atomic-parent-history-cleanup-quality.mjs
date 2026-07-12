import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (...parts) => readFileSync(join(process.cwd(), ...parts), "utf8");
const sql = read("supabase", "migrations", "008_atomic_saved_simulation_history_cleanup.sql");
const provider = read("lib", "persistence-runtime", "supabase-provider.ts");
const runtime = read("lib", "saved-decision-simulations", "runtime.ts");
const action = read("lib", "saved-decision-simulations", "ui-save-action.ts");
const exportSurface = read("lib", "user-data-controls", "account-data-export-surface.ts");
const retentionSurface = read("lib", "user-data-controls", "account-data-retention-surface.ts");
const deletionSurface = read("lib", "user-data-controls", "account-data-deletion-surface.ts");
const packageJson = read("package.json");
const checks = [];
const check = (id, condition, issue) => checks.push({ id, passed: Boolean(condition), issue });

check("migration-ordering", readdirSync(join(process.cwd(), "supabase", "migrations")).filter((name) => /^008_/.test(name)).length === 1, "Exactly one version 008 migration is allowed.");
check("single-purpose-function", (sql.match(/create or replace function/g) ?? []).length === 1 && sql.includes("levio_delete_saved_simulation_with_history"), "Migration must contain one bounded function.");
check("transactional-plpgsql-no-dynamic-sql", sql.includes("language plpgsql") && !/\bexecute\s+(format|\$|'|\")/i.test(sql), "Function must use one PostgreSQL transaction without dynamic SQL.");
check("parent-row-lock", sql.includes("for update;"), "Parent must be locked before mutation.");
check("owner-and-parent-scope", sql.includes("r.record_id = p_record_id") && sql.includes("r.owner_principal_id = p_owner_principal_id") && sql.includes("h.record_id = p_record_id") && sql.includes("h.owner_principal_id = p_owner_principal_id"), "Parent and history must be object+owner scoped.");
check("active-parent-guards", sql.includes("v_parent.record_status <> 'active'") && sql.includes("v_parent.deletion_state <> 'active'"), "Only an active parent may be deleted.");
check("parent-legal-hold-guard", sql.includes("v_parent.legal_hold_reason is not null") && sql.includes("r.legal_hold_reason is null"), "Legal hold must be checked before and during parent mutation.");
check("protected-history-blocks", sql.includes("h.deletion_state in ('restricted', 'retained_legal_exception')") && sql.includes("h.legal_hold_reason is not null"), "Protected history must block the atomic operation.");
check("history-content-cleared", sql.includes("event_summary = null") && sql.includes("event_payload = '{}'::jsonb") && sql.includes("outcome_snapshot = null") && sql.includes("user_visible = false"), "User-visible history content must be cleared.");
check("history-terminal-lifecycle", sql.includes("deletion_state = 'deleted'") && sql.includes("export_eligible = false") && sql.includes("deleted_at = v_deleted_at"), "History must leave active/exportable lifecycle.");
check("unrelated-history-preserved", sql.includes("h.record_id = p_record_id") && sql.includes("h.owner_principal_id = p_owner_principal_id") && sql.includes("h.user_visible = true") && sql.includes("h.deletion_state = 'active'"), "History cleanup predicates must preserve unrelated rows.");
check("parent-content-cleared", sql.includes("title = null") && sql.includes("user_input_snapshot = '{}'::jsonb") && sql.includes("deterministic_output_snapshot = '{}'::jsonb") && sql.includes("confidence_summary = null"), "Parent content must use terminal content-clearing semantics.");
check("failure-rolls-back", sql.includes("raise exception 'saved simulation lifecycle changed during atomic deletion'"), "Unexpected parent mutation failure must raise and roll back history cleanup.");
check("idempotent-safe-absence", sql.includes("v_parent.record_status = 'deleted'") && sql.includes("'outcome', 'already_absent'"), "Repeated and absent calls must share controlled absence.");
check("restricted-controlled-outcome", sql.includes("'outcome', 'restricted'"), "Restricted states must have a controlled outcome.");
check("security-definer-fixed-path", sql.includes("security definer") && sql.includes("set search_path = pg_catalog, public"), "SECURITY DEFINER must use a fixed safe search path.");
check("least-privilege-grants", sql.includes("from public") && sql.includes("from anon") && sql.includes("from authenticated") && sql.includes("to service_role"), "Only the server service role may execute the RPC.");
check("no-hard-delete-or-cascade", !sql.match(/delete\s+from/i) && !sql.match(/on\s+delete\s+cascade/i), "No physical delete or cascade is allowed.");
check("provider-rpc-only", provider.includes('savedSimulationDeletionRpcClient.rpc(') && provider.includes('"levio_delete_saved_simulation_with_history"') && !provider.slice(provider.indexOf("async deleteSimulationRecord"), provider.indexOf("async saveSimulationHistoryEntry")).includes('.from("simulation_records")'), "Provider deletion must use only the atomic RPC.");
check("canonical-owner-from-preflight", runtime.includes('operation: "resolve_principal"') && runtime.includes("p_owner_principal_id") === false && runtime.includes("ownerPrincipalId: preflight.principalId"), "Runtime must derive owner from server preflight.");
check("client-owner-rejected", runtime.includes("hasClientOwnerInput(input)") && !action.includes("ownerPrincipalId"), "Client owner authority must be rejected.");
check("rpc-outcomes-fail-closed", provider.includes('outcome === "already_absent"') && provider.includes('outcome === "restricted"') && provider.includes('outcome !== "deleted"') && runtime.includes('deletion.status === "failed"'), "RPC outcomes must normalize without fallback success.");
check("export-excludes-cleaned-history", exportSurface.includes("listSimulationHistoryEntries") && provider.includes('.eq("user_visible", true)') && provider.includes('.eq("deletion_state", "active")'), "Export reads must exclude terminal non-visible history.");
check("planning-excludes-cleaned-history", retentionSurface.includes("listSimulationHistoryEntriesForRetention") && deletionSurface.includes("listSimulationHistoryEntriesForDeletion") && provider.includes('.eq("deletion_state", "active")'), "Retention/deletion planning must exclude terminal history.");
check("no-independent-history-surface", !action.includes("historyEntryId") && !sql.includes("p_history_entry_id"), "No independent history deletion operation may be created.");
check("gate-registered", packageJson.includes('"quality:stage-7-atomic-parent-history-cleanup"'), "Specialized gate must be registered.");

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.issue}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
