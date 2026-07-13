import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));

require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(output.outputText, filename);
};

const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const execution = read("lib", "user-data-controls", "simulation-draft-deletion-execution.ts");
const validation = require(join(root, "lib", "user-data-controls", "simulation-draft-deletion-execution-validation.ts"));
const action = read("lib", "user-data-controls", "simulation-draft-deletion-action.ts");
const saveAction = read("lib", "user-data-controls", "simulation-draft-resume-action.ts");
const component = read("components", "SimulationDraftResumeSurface.tsx");
const page = read("app", "dashboard", "drafts", "[id]", "page.tsx");
const privacyPage = read("app", "dashboard", "privacy", "page.tsx");
const provider = read("lib", "persistence-runtime", "supabase-provider.ts");
const exportSurface = read("lib", "user-data-controls", "account-data-export-surface.ts");
const packageJson = read("package.json");
const checks = [];
const check = (id, condition, issue) => checks.push({ id, passed: Boolean(condition), issue });

const result = await validation.runSimulationDraftDeletionExecutionValidation();
check("draft-deletion-runtime-validation", result.passed && !result.failed, "Runtime validation must pass.");
for (const item of result.cases) {
  check(`draft-deletion-${item.caseId}`, item.passed, item.issues.join(" ") || "Validation case failed.");
}

check("user-triggered-action-uses-existing-runtime", action.includes("deleteOwnedSimulationDraft({ draftId })"), "Server action must delegate to the existing deletion runtime.");
check("explicit-irreversible-confirmation", component.includes('name="confirmDeletion"') && component.includes("confirm_irreversible_draft_deletion") && component.includes("irreversible") && action.includes("confirmation_required"), "Deletion must require explicit irreversible confirmation in UI and server action.");
check("delete-form-is-separate-from-edit-form", (component.match(/<form action=/g) ?? []).length === 2 && component.includes("saveSimulationDraftResumeAction") && component.includes("deleteSimulationDraftFromDashboard") && !saveAction.includes("deleteOwnedSimulationDraft"), "Edit/save must not trigger deletion.");
check("no-client-owner-authority", !action.includes('formData.get("owner') && !action.includes('formData.get("principal') && !component.includes('name="owner') && !component.includes('name="principal'), "Browser form must not supply owner authority.");
check("protected-single-draft-surface", page.includes('dynamic = "force-dynamic"') && page.includes("params.id") && !page.includes("ownerPrincipalId"), "Deletion must remain on the authenticated single-draft surface without client owner input.");
check("provider-object-owner-lifecycle-guards", provider.includes("async deleteSimulationDraft(input)") && provider.includes('.eq("draft_id", input.draftId)') && provider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') && provider.includes('.eq("draft_status", "active")') && provider.includes('.eq("deletion_state", "active")') && provider.includes('.is("legal_hold_reason", null)') && provider.includes('.gt("expires_at", input.deletedAt)'), "Direct mutation must repeat object, owner, lifecycle, legal-hold, and expiry guards.");
check("restricted-and-legal-hold-blocked", execution.includes("isRestrictedDraft(read.draft)") && execution.includes('"delete_restricted"') && execution.includes("legal_hold_reason"), "Restricted and legal-hold drafts must not delete.");
check("expired-draft-reuses-retention", execution.includes("evaluateSimulationDraftRetentionState") && execution.includes("enforceExpiredSimulationDraftRetention") && execution.includes('retention.state === "expired"'), "Expired drafts must keep existing retention semantics.");
check("terminal-content-clearing-shared", provider.includes("buildSimulationDraftTerminalDeletePayload(input.deletedAt)") && provider.split("buildSimulationDraftTerminalDeletePayload(input.deletedAt)").length - 1 === 2, "Direct and retention deletion must share terminal content clearing.");
check("export-excludes-terminal-draft", exportSurface.includes("listSimulationDrafts") && provider.includes('.eq("export_eligible", true)') && provider.includes('.eq("deletion_state", "active")'), "Deleted draft content must leave active export.");
check("controlled-safe-redirect", action.includes('redirect("/dashboard/privacy?draftDeletion=completed")') && privacyPage.includes('draftDeletion === "completed"') && privacyPage.includes("ya no está disponible") && !privacyPage.includes("draftId"), "Success must redirect to a safe destination without internal identifiers.");
check("failure-does-not-report-success", action.includes("catch") && action.includes("?delete=error") && component.includes("Su contenido permanece sin cambios") && execution.includes("afterRace") && execution.includes("El borrador cambió antes de completar la eliminación"), "Unexpected failures and lifecycle races must fail closed without false success.");
check("no-bulk-account-history-or-job-scope", !action.includes("draftIds") && !action.includes("deleteAccount") && !action.includes("historyEntryId") && !action.includes("scheduler") && !action.includes("job"), "Action must remain one-draft only with excluded scopes untouched.");
check("gate-registered", packageJson.includes('"quality:stage-7-user-triggered-draft-deletion-surface"'), "The specialized gate must be registered.");

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.issue}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
