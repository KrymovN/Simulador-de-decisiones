import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGE_9_REMEDIATION_BASELINE_COMMIT,
  STAGE_9_SCHEMA_ORACLE_MAPPINGS,
  serializePostRemediationManifest,
  serializeRemediationRevisionLedger,
} from "./generate-stage-9-human-review-package.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = "docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json";
const ledgerPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json";
const legacyPath = "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json";
const fixturePath = "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts";
const expectedLegacySha = "5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b";
const expectedFixtureSha = "150c99e1184c46af31c92f789c05b07559f2d45a7546072d6822751c58477f7b";
const allowed = new Set([
  "scripts/generate-stage-9-human-review-package.mjs",
  manifestPath,
  ledgerPath,
  "scripts/stage-9-schema-oracle-evidence-projection-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "package.json",
  resultPath,
  "PROJECT_CONTEXT.md",
]);
const read = (path) => readFileSync(join(root, path), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the Stage 9 remediation revision integrity gate.");
};

const manifestText = read(manifestPath);
const ledgerText = read(ledgerPath);
const manifest = JSON.parse(manifestText);
const ledger = JSON.parse(ledgerText);
const result = JSON.parse(read(resultPath));
const expectedRevisionIds = STAGE_9_SCHEMA_ORACLE_MAPPINGS.map((_, index) => `S9-FIX-01-REV-${String(index + 1).padStart(3, "0")}`);

add("generated-artifact-integrity", manifestText === serializePostRemediationManifest()
  && ledgerText === serializeRemediationRevisionLedger(), `manifest=${sha(manifestText)} ledger=${sha(ledgerText)}`);
add("append-only-versioned-ledger", ledger.ledger_version === "stage-9-ai-remediation-revision-ledger.1"
  && ledger.append_only === true
  && ledger.generated_at === null
  && ledger.baseline_commit === STAGE_9_REMEDIATION_BASELINE_COMMIT, ledger.ledger_version);
add("exact-revision-set", ledger.revision_count === 6
  && ledger.revisions.length === 6
  && JSON.stringify(ledger.revisions.map((entry) => entry.revision_id)) === JSON.stringify(expectedRevisionIds)
  && new Set(ledger.revisions.map((entry) => entry.revision_id)).size === 6, expectedRevisionIds.join(", "));
add("mapping-order-integrity", ledger.revisions.every((revision, index) => {
  const mapping = STAGE_9_SCHEMA_ORACLE_MAPPINGS[index];
  return revision.operation === "ADD_VERSIONED_SCHEMA_ORACLE_EVIDENCE"
    && revision.fixture_id === mapping.fixture_id
    && revision.claim_id === mapping.claim_id
    && revision.json_path === mapping.json_path;
}), "Ledger order matches the frozen six fixture/claim mappings.");
add("cross-artifact-hash-chain", ledger.revisions.every((revision, index) => {
  const evidence = manifest.schema_oracle_evidence[index];
  return revision.evidence_fragment_sha256 === evidence.evidence_fragment_sha256
    && revision.source_fixture_sha256 === evidence.provenance.source_fixture_sha256
    && revision.legacy_manifest_sha256 === manifest.source_integrity.legacy_manifest_sha256;
}), "All six ledger revisions point to the exact manifest evidence and immutable source hashes.");
add("immutable-source-hashes", sha(readFileSync(join(root, legacyPath))) === expectedLegacySha
  && sha(readFileSync(join(root, fixturePath))) === expectedFixtureSha
  && ledger.revisions.every((revision) =>
    revision.legacy_manifest_sha256 === expectedLegacySha
    && revision.source_fixture_sha256 === expectedFixtureSha), `legacy=${expectedLegacySha} fixture=${expectedFixtureSha}`);
add("single-commit-contract", ledger.substep_id === "S9-FIX-01"
  && ledger.candidate_id === "Stage 9 Schema-Oracle Evidence Projection Revision"
  && ledger.revisions.every((revision) => revision.implementation_commit_message === "fix(stage-9): expose schema oracle evidence"), "Every revision belongs to the one bounded implementation commit.");

const historicalDiff = gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT, "--", "docs/qa/review", fixturePath);
const runtimeDiff = gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT, "--",
  "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine",
  "lib/runtime-integration", "lib/persistence-runtime");
add("historical-and-fixture-immutability", historicalDiff.length === 0, historicalDiff.join(", ") || "No historical-review or fixture-source diff.");
add("runtime-immutability", runtimeDiff.length === 0, runtimeDiff.join(", ") || "No runtime/UI/API/provider/auth/persistence diff.");

const changed = [...new Set([
  ...gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();
const requiredImplementationPaths = [...allowed].filter((path) => path !== "PROJECT_CONTEXT.md");
add("exact-bounded-diff", changed.every((path) => allowed.has(path))
  && requiredImplementationPaths.every((path) => changed.includes(path)), `Changed: ${changed.join(", ")}`);
add("result-integrity", result.status === "PASS"
  && result.substep_id === ledger.substep_id
  && result.candidate_id === ledger.candidate_id
  && result.schema_oracle_mapping_count === ledger.revision_count
  && result.legacy_manifest_sha256 === expectedLegacySha
  && result.synthetic_fixture_sha256 === expectedFixtureSha
  && result.implementation_commit_message === "fix(stage-9): expose schema oracle evidence", result.status);
add("network-zero", networkRequests === 0
  && manifest.summary.network_request_count === 0
  && result.network_request_count === 0, `${networkRequests} network requests.`);

globalThis.fetch = originalFetch;
for (const check of checks) console[check.pass ? "log" : "error"](`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT substep=S9-FIX-01 revisions=${ledger.revision_count} manifest_sha256=${sha(manifestText)} ledger_sha256=${sha(ledgerText)} historical_diff=${historicalDiff.length} runtime_diff=${runtimeDiff.length} network=${networkRequests}`);
console.log(`${checks.filter((check) => check.pass).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.pass)) process.exitCode = 1;
