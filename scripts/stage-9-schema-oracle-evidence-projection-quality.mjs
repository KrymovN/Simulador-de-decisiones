import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGE_9_REMEDIATION_BASELINE_COMMIT,
  STAGE_9_SCHEMA_ORACLE_MAPPINGS,
  buildHumanReviewManifest,
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
const json = (path) => JSON.parse(read(path));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const baselineBuffer = (path) => execFileSync("git", ["show", `${STAGE_9_REMEDIATION_BASELINE_COMMIT}:${path}`], { cwd: root });
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the Stage 9 schema-oracle evidence projection gate.");
};

const manifestText = read(manifestPath);
const ledgerText = read(ledgerPath);
const manifest = JSON.parse(manifestText);
const result = json(resultPath);
const generatedManifestA = serializePostRemediationManifest();
const generatedManifestB = serializePostRemediationManifest();
const generatedLedgerA = serializeRemediationRevisionLedger();
const generatedLedgerB = serializeRemediationRevisionLedger();

add("baseline-readable", baselineBuffer("package.json").length > 0 && manifest.baseline_commit === STAGE_9_REMEDIATION_BASELINE_COMMIT, `Baseline ${STAGE_9_REMEDIATION_BASELINE_COMMIT}.`);
add("versioned-sibling-package", manifest.package_version === "stage-9-post-remediation-manifest.1" && manifest.substep_id === "S9-FIX-01" && manifest.generated_at === null, manifest.package_version);
add("controlled-double-generation", generatedManifestA === generatedManifestB && generatedLedgerA === generatedLedgerB, "Two independent in-process generations are byte-identical.");
add("committed-generated-manifest", manifestText === generatedManifestA, `SHA-256 ${sha(manifestText)}.`);
add("committed-generated-ledger", ledgerText === generatedLedgerA, `SHA-256 ${sha(ledgerText)}.`);

const evidence = manifest.schema_oracle_evidence;
const expectedPairs = STAGE_9_SCHEMA_ORACLE_MAPPINGS.map(({ fixture_id, claim_id }) => `${fixture_id}:${claim_id}`);
const actualPairs = evidence.map(({ fixture_id, claim_id }) => `${fixture_id}:${claim_id}`);
add("exact-six-mappings", evidence.length === 6 && new Set(actualPairs).size === 6 && JSON.stringify(actualPairs) === JSON.stringify(expectedPairs), actualPairs.join(", "));
add("exact-paths-and-values", evidence.every((entry, index) => {
  const expected = STAGE_9_SCHEMA_ORACLE_MAPPINGS[index];
  const leaf = expected.json_path.split(".").at(-1).replace(/\[0\]$/, "");
  return entry.json_path === expected.json_path
    && JSON.stringify(entry.invalid_value) === JSON.stringify(expected.invalid_value)
    && JSON.stringify(entry.evidence_fragment[leaf]) === JSON.stringify(expected.invalid_value);
}), "Every projection exposes the exact invalid payload value at its declared source path.");
add("exact-source-fragments", evidence.every((entry) =>
  entry.evidence_fragment
  && entry.evidence_fragment_sha256 === sha(JSON.stringify(entry.evidence_fragment))
  && entry.provenance.source_fixture_path === fixturePath
  && entry.provenance.source_fixture_sha256 === expectedFixtureSha
  && entry.provenance.projection_rule.includes("no schema-oracle inference")), "Every evidence fragment is canonical, hashed, and source-provenanced.");

const byFixture = new Map(evidence.map((entry) => [entry.fixture_id, entry]));
add("unknown-field-comparison", JSON.stringify(byFixture.get("S9-EVAL-006").comparison_set) === JSON.stringify({
  candidate_container_keys: ["capability", "generation_status", "raw_response", "risks"],
  source_valid_container_keys: ["capability", "generation_status", "risks"],
}), "Top-level candidate keys expose raw_response against the valid source container.");
add("unknown-nested-comparison", byFixture.get("S9-EVAL-007").comparison_set.candidate_risk_keys.includes("advice")
  && !byFixture.get("S9-EVAL-007").comparison_set.source_valid_risk_keys.includes("advice"), "Nested candidate/source key sets expose advice exactly.");
add("enum-comparisons", JSON.stringify(byFixture.get("S9-EVAL-009").comparison_set) === JSON.stringify({
  candidate_values: ["critical", "medium"],
  source_valid_values: ["high", "medium"],
}) && JSON.stringify(byFixture.get("S9-EVAL-010").comparison_set) === JSON.stringify({
  candidate_values: ["certain", "unknown"],
  source_valid_values: ["medium", "unknown"],
}), "Invalid enum values are preserved beside source-observed valid values.");
add("grounding-comparisons", JSON.stringify(byFixture.get("S9-EVAL-011").comparison_set) === JSON.stringify({
  candidate_references: ["option_9"],
  available_source_option_ids: ["option_1", "option_2"],
}) && JSON.stringify(byFixture.get("S9-EVAL-012").comparison_set) === JSON.stringify({
  candidate_references: ["fact_9"],
  available_source_fact_ids: ["fact_1", "fact_2"],
}), "Invalid references are preserved beside exact source-derived reference sets.");

const legacyBuffer = readFileSync(join(root, legacyPath));
const fixtureBuffer = readFileSync(join(root, fixturePath));
add("legacy-manifest-preserved", sha(legacyBuffer) === expectedLegacySha
  && sha(baselineBuffer(legacyPath)) === expectedLegacySha
  && buildHumanReviewManifest().entries.length === 216
  && manifest.source_integrity.legacy_manifest_entry_count === 216, `${expectedLegacySha}; 216 entries.`);
add("fixture-source-preserved", sha(fixtureBuffer) === expectedFixtureSha
  && sha(baselineBuffer(fixturePath)) === expectedFixtureSha
  && manifest.source_integrity.synthetic_fixture_sha256 === expectedFixtureSha, expectedFixtureSha);

const historicalPaths = [];
const walk = (directory) => {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else historicalPaths.push(relative(root, path));
  }
};
walk(join(root, "docs", "qa", "review"));
add("historical-review-artifacts-preserved", historicalPaths.every((path) =>
  sha(readFileSync(join(root, path))) === sha(baselineBuffer(path))), `${historicalPaths.length} review artifacts match baseline.`);

const runtimeDiff = gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT, "--",
  "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine",
  "lib/runtime-integration", "lib/persistence-runtime");
add("runtime-boundaries-unchanged", runtimeDiff.length === 0, runtimeDiff.join(", ") || "No runtime/UI/API/provider/auth/persistence diff.");
add("api-simulate-mock-only", read("app/api/simulate/route.ts").includes("mockOnly: true"), "/api/simulate remains mockOnly=true.");

const changed = [...new Set([
  ...gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();
const requiredImplementationPaths = [...allowed].filter((path) => path !== "PROJECT_CONTEXT.md");
add("exact-bounded-diff", changed.every((path) => allowed.has(path))
  && requiredImplementationPaths.every((path) => changed.includes(path)), `Changed: ${changed.join(", ")}`);
add("package-entries", read("package.json").includes('"quality:stage-9-schema-oracle-evidence-projection": "node scripts/stage-9-schema-oracle-evidence-projection-quality.mjs"')
  && read("package.json").includes('"quality:stage-9-remediation-revision-integrity": "node scripts/stage-9-remediation-revision-integrity-quality.mjs"'), "Exactly the two bounded quality commands are registered.");
add("result-contract", result.substep_id === "S9-FIX-01"
  && result.status === "PASS"
  && result.schema_oracle_mapping_count === 6
  && result.baseline_commit === STAGE_9_REMEDIATION_BASELINE_COMMIT
  && result.network_request_count === 0
  && result.stage_9_status === "In Progress"
  && result.release_readiness === "NOT_DECLARED"
  && result.runtime_integration === "CLOSED", result.status);
const mandatoryGates = [
  "quality:stage-9-schema-oracle-evidence-projection",
  "quality:stage-9-synthetic-risk-evaluation",
  "quality:stage-9-human-review-readiness",
  "quality:stage-9-remediation-revision-integrity",
];
add("mandatory-gate-result-set", JSON.stringify(Object.keys(result.mandatory_gates)) === JSON.stringify(mandatoryGates)
  && mandatoryGates.every((gate) => result.mandatory_gates[gate] === "PASS"), mandatoryGates.join(", "));
add("network-zero", networkRequests === 0 && manifest.summary.network_request_count === 0, `${networkRequests} network requests.`);

globalThis.fetch = originalFetch;
for (const check of checks) console[check.pass ? "log" : "error"](`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT substep=S9-FIX-01 mappings=${evidence.length} legacy_sha256=${sha(legacyBuffer)} fixture_sha256=${sha(fixtureBuffer)} historical=${historicalPaths.length} runtime_diff=${runtimeDiff.length} network=${networkRequests}`);
console.log(`${checks.filter((check) => check.pass).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.pass)) process.exitCode = 1;
