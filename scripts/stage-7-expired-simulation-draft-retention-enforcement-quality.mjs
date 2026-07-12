import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

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

const checks = [];
const read = (...parts) => readFileSync(join(rootDir, ...parts), "utf8");

function check(id, condition, issue) {
  checks.push({ id, passed: Boolean(condition), issue });
}

async function runValidation(relativePath, exportName, prefix) {
  const validation = require(join(rootDir, ...relativePath));
  const result = await validation[exportName]();
  check(`${prefix}-aggregate`, result.passed === true && result.failed === false, `${prefix} validation failed.`);
  for (const item of result.cases) {
    check(`${prefix}-${item.caseId}`, item.passed === true, item.issues?.join(" ") || "Validation case failed.");
  }
}

await runValidation(
  ["lib", "persistence-runtime", "simulation-draft-persistence-validation.ts"],
  "runSimulationDraftPersistenceValidation",
  "draft-persistence",
);
await runValidation(
  ["lib", "user-data-controls", "simulation-draft-retention-enforcement-validation.ts"],
  "runSimulationDraftRetentionEnforcementValidation",
  "draft-retention",
);

const persistence = read("lib", "persistence-runtime", "simulation-draft-persistence.ts");
const provider = read("lib", "persistence-runtime", "supabase-provider.ts");
const enforcement = read("lib", "user-data-controls", "simulation-draft-retention-enforcement.ts");
const route = read("app", "dashboard", "privacy", "retention", "route.ts");
const packageJson = read("package.json");

check(
  "draft-retention-30-day-server-owned-expiry",
  persistence.includes("SIMULATION_DRAFT_RETENTION_DAYS = 30") &&
    persistence.includes("serverConfirmedChangeAt") &&
    !persistence.includes("expiresAt?: string"),
  "Draft expiry must be server-owned and renewed by the approved 30-day policy.",
);
check(
  "draft-retention-content-change-only-renewal",
  persistence.includes("hasConfirmedContentChange") &&
    persistence.includes("draft_payload") &&
    persistence.includes("draft_text_snapshot") &&
    persistence.includes("clarification_answers_snapshot") &&
    persistence.includes("structured_context_snapshot") &&
    persistence.includes("last_autosaved_at") &&
    persistence.includes("payload.expires_at = expiresAt"),
  "Only confirmed content changes may renew expires_at; autosave metadata remains separate.",
);
check(
  "draft-retention-single-owner-read",
  provider.includes("async readSimulationDraft(input)") &&
    provider.includes('.eq("draft_id", input.draftId)') &&
    provider.includes('.eq("owner_principal_id", input.ownerPrincipalId)') &&
    provider.includes('.eq("owner_principal_type", "registered_user")') &&
    provider.includes(".maybeSingle()") &&
    provider.includes('status: "found"') &&
    provider.includes('status: "not_found"') &&
    provider.includes('status: "failed"'),
  "Retention preflight must read one owner-scoped draft and distinguish absence from failure.",
);
check(
  "draft-retention-atomic-provider-guards",
  provider.includes("async deleteExpiredSimulationDraft(input)") &&
    provider.includes('.eq("draft_status", "active")') &&
    provider.includes('.eq("deletion_state", "active")') &&
    provider.includes('.eq("retention_rule", "draft_short_lifecycle")') &&
    provider.includes('.lte("expires_at", input.evaluatedAt)') &&
    provider.includes('.is("legal_hold_reason", null)'),
  "Retention mutation must repeat active, expiry, policy, legal-hold, owner, and one-draft guards atomically.",
);
check(
  "draft-retention-shared-terminal-payload",
  provider.includes("buildSimulationDraftTerminalDeletePayload") &&
    provider.includes("async deleteSimulationDraft(input)") &&
    provider.includes("async deleteExpiredSimulationDraft(input)") &&
    provider.split("buildSimulationDraftTerminalDeletePayload(input.deletedAt)").length - 1 === 2,
  "Direct and retention deletion must share one terminal payload builder.",
);
check(
  "draft-retention-strict-post-contract",
  route.includes("export async function POST(request: Request)") &&
    route.includes('mediaType !== "application/json"') &&
    route.includes("MAX_RETENTION_REQUEST_LENGTH") &&
    route.includes("parseSimulationDraftRetentionRequest(body)") &&
    route.includes("draftId: requestInput.draftId") &&
    !route.includes("ownerPrincipalId") &&
    !route.includes("providerReference"),
  "POST must accept bounded JSON containing only draftId and delegate without client owner authority.",
);
check(
  "draft-retention-get-remains-read-only",
  route.includes("export async function GET()") &&
    route.includes("readAccountDataRetentionSurface") &&
    route.includes("Content-Disposition") &&
    route.includes("Cache-Control") &&
    route.includes("no-store"),
  "GET must remain the existing read-only retention-plan download.",
);
check(
  "draft-retention-no-bulk-job-or-cross-entity-effects",
  !enforcement.includes("listSimulationDrafts") &&
    !enforcement.includes("deleteSimulationRecord") &&
    !enforcement.includes("deleteSimulationHistory") &&
    !enforcement.includes("deleteAccount") &&
    !enforcement.includes("retentionJob") &&
    !enforcement.includes("scheduler") &&
    !enforcement.includes("hardDelete") &&
    !route.includes("process.env") &&
    !route.includes("createClient"),
  "The action must stay per-draft, server-boundary-only, and free of jobs or cross-entity mutations.",
);
check(
  "draft-retention-gate-registered",
  packageJson.includes('"quality:stage-7-expired-simulation-draft-retention-enforcement"'),
  "The dedicated retention enforcement gate must be registered.",
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.issue}`);
}

const passed = checks.filter((item) => item.passed).length;
console.log(`${passed}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
