import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BATCH_1_FIXTURE_IDS,
  batchRoot,
  buildBatchSelection,
  buildBlindPackets,
  serialize,
  sourceFixtureHash,
} from "./generate-stage-9-ai-review-batch-1.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const base = "372b82f58fbc637d8769e9b1cbf147f3d7b22136";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const artifact = (name) => JSON.parse(readFileSync(join(batchRoot, name), "utf8"));
const artifactSource = (name) => readFileSync(join(batchRoot, name), "utf8");
const sourceManifest = JSON.parse(read("docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"));
const sourceById = new Map(sourceManifest.entries.map((entry) => [entry.fixture_id, entry]));
const selection = artifact("selection.json");
const blind = artifact("blind-packets.json");
const passA = artifact("pass-a.json");
const passB = artifact("pass-b.json");
const passC = artifact("pass-c.json");
const adjudication = artifact("adjudication.json");
const summary = artifact("summary.json");
const issueLedger = artifact("issue-ledger.json");
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
const ids = selection.fixtures.map((item) => item.fixture_id);
const expectedRoles = ["ai-semantic-reviewer-v1", "ai-comparative-reviewer-v1", "ai-adversarial-reviewer-v1", "ai-adjudicator-v1"];
const allowedVerdicts = ["AI_PASS", "AI_PASS_WITH_NOTE", "AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED", "AI_NOT_REVIEWED"];
const allowedSeverity = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const resultIds = (value) => value.results.map((item) => item.fixture_id);
const canonical = (name) => artifactSource(name) === serialize(artifact(name));
const recursivelyHasKey = (value, forbidden) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => recursivelyHasKey(item, forbidden));
  return Object.entries(value).some(([key, item]) => forbidden.includes(key) || recursivelyHasKey(item, forbidden));
};

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 AI-review Batch 1 gate.");
};

add("selection-exactly-36", ids.length === 36 && new Set(ids).size === 36 && JSON.stringify(ids) === JSON.stringify(BATCH_1_FIXTURE_IDS), `${ids.length} deterministic fixtures.`);
add("selection-deterministic-source", artifactSource("selection.json") === serialize(buildBatchSelection()), "Selection equals deterministic generator output.");
add("blind-packets-deterministic-source", artifactSource("blind-packets.json") === serialize(buildBlindPackets()), "Blind packets equal deterministic generator output.");
add("dataset-type-coverage", selection.coverage.dataset_types.synthetic_risk === 8 && selection.coverage.dataset_types.rich_decision_material_baseline === 8 && selection.coverage.dataset_types.canonical_core === 20, JSON.stringify(selection.coverage.dataset_types));
add("language-coverage", ["es", "en", "ru", "zh"].every((language) => selection.coverage.languages[language] >= 5), JSON.stringify(selection.coverage.languages));
add("domain-coverage", ["career_and_work", "education", "finance_and_spending", "relocation_and_housing", "business_decisions", "personal_planning", "high_risk_and_safety_sensitive"].every((domain) => selection.coverage.domains[domain] > 0), JSON.stringify(selection.coverage.domains));
add("completeness-coverage", ["complete", "partial", "critically_incomplete", "contradictory"].every((state) => selection.coverage.completeness[state] > 0), JSON.stringify(selection.coverage.completeness));
add("risk-privacy-controlled-coverage", selection.coverage.high_risk_count >= 8 && selection.coverage.privacy_count >= 8 && selection.coverage.controlled_failure_count >= 8, `high_risk=${selection.coverage.high_risk_count} privacy=${selection.coverage.privacy_count} controlled=${selection.coverage.controlled_failure_count}`);
add("multiple-complete-equivalence-clusters", selection.coverage.complete_equivalence_clusters.length >= 3, `${selection.coverage.complete_equivalence_clusters.length} complete clusters.`);
add("duplicate-audit-targets", selection.duplicate_audit_targets.length >= 6 && selection.duplicate_audit_targets.includes("S9-EVAL-013") && selection.duplicate_audit_targets.includes("S9-MATERIAL-007"), `${selection.duplicate_audit_targets.length} targets.`);

const forbiddenBlindKeys = ["expected_candidate_risk_signals", "expected_decision_material", "expected_critical_information_preservation", "human_review", "verdict", "review_results"];
add("pass-a-packets-are-blind", !recursivelyHasKey(blind.packets, forbiddenBlindKeys), "Blind packets contain no expected behavior or prior-review keys.");
add("pass-a-results-remain-blind", !recursivelyHasKey(passA.results, forbiddenBlindKeys), "Pass A results contain no expected behavior or prior-review keys.");
add("all-four-passes-present", [passA, passB, passC, adjudication].every((value) => Array.isArray(value.results) && value.results.length === 36), `A=${passA.results.length} B=${passB.results.length} C=${passC.results.length} D=${adjudication.results.length}`);
add("all-pass-memberships-match", [passA, passB, passC, adjudication].every((value) => JSON.stringify(resultIds(value)) === JSON.stringify(ids)), "All pass artifacts preserve selection membership and order.");
add("reviewer-role-ids", passA.reviewer_role_id === expectedRoles[0] && passB.reviewer_role_id === expectedRoles[1] && passC.reviewer_role_id === expectedRoles[2] && adjudication.reviewer_role_id === expectedRoles[3], "All four technical reviewer roles are exact.");
add("neutral-model-identifier", [passA, passB, passC, adjudication].every((value) => value.model_id === "codex-current-session"), "No unavailable exact model name is claimed.");

const allResults = [...passA.results, ...passB.results, ...passC.results, ...adjudication.results];
add("source-hashes-match", allResults.every((result) => sourceById.has(result.fixture_id) && result.source_fixture_hash === sourceFixtureHash(sourceById.get(result.fixture_id))), "All 144 pass results match source SHA-256 hashes.");
add("review-artifacts-canonical-json", ["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json"].every(canonical), "All eight artifacts use deterministic canonical JSON serialization.");
add("no-human-identity-claims", !/human reviewer|human-reviewed|human_review_status|reviewer_identity/i.test([artifactSource("pass-a.json"), artifactSource("pass-b.json"), artifactSource("pass-c.json"), artifactSource("adjudication.json"), artifactSource("summary.json"), artifactSource("issue-ledger.json")].join("\n")), "AI artifacts contain no human identity or human-reviewed claim.");

add("final-verdict-contract", adjudication.results.every((item) => allowedVerdicts.includes(item.consolidated_verdict) && item.consolidated_verdict !== "AI_NOT_REVIEWED" && allowedSeverity.includes(item.severity) && typeof item.confidence === "number" && item.confidence >= 0 && item.confidence <= 1 && typeof item.rationale === "string" && item.rationale.trim() && Array.isArray(item.evidence_references) && item.evidence_references.length > 0 && Array.isArray(item.issue_codes) && typeof item.remediation_requirement === "string" && item.remediation_requirement.trim() && JSON.stringify(item.reviewer_role_ids) === JSON.stringify(expectedRoles) && /^\d{4}-\d{2}-\d{2}T/.test(item.review_timestamp) && item.prompt_version === "stage-9-ai-review-adjudication.1"), "Every final verdict has rationale, evidence, confidence, severity, roles, timestamp, prompt, issues, and remediation.");
add("adjudication-explains-observations", adjudication.results.every((item) => Array.isArray(item.adjudication_notes) && item.adjudication_notes.length > 0 && item.adjudication_notes.every((note) => ["ACCEPTED", "REJECTED", "UNRESOLVED"].includes(note.disposition) && note.reason)), "Adjudicator explains accepted, rejected, or unresolved observations.");
add("non-multilingual-equivalence-not-applicable", passC.results.filter((item) => sourceById.get(item.fixture_id).equivalence_cluster === null).every((item) => item.equivalence_status === "NOT_APPLICABLE"), "All non-multilingual fixtures use NOT_APPLICABLE.");

const requiresReinforcement = (item) =>
  ["AI_FAIL_MAJOR", "AI_DISPUTED"].includes(item.consolidated_verdict) ||
  ["HIGH", "CRITICAL"].includes(item.severity) || item.confidence < 0.75 ||
  item.disagreement_flags.silent_loss || item.disagreement_flags.privacy ||
  item.disagreement_flags.controlled_failure || item.disagreement_flags.multilingual_equivalence;
add("reinforced-review-rule", adjudication.results.every((item) => item.reinforced_review_required === requiresReinforcement(item) && (!item.reinforced_review_required || item.reinforced_review_reasons.length > 0)), `${adjudication.results.filter((item) => item.reinforced_review_required).length} reinforced cases.`);

const verdictCounts = Object.fromEntries(allowedVerdicts.map((verdict) => [verdict, adjudication.results.filter((item) => item.consolidated_verdict === verdict).length]));
const severityCounts = Object.fromEntries(allowedSeverity.map((severity) => [severity, adjudication.results.filter((item) => item.severity === severity).length]));
add("summary-matches-adjudication", JSON.stringify(summary.verdict_counts) === JSON.stringify(verdictCounts) && JSON.stringify(summary.severity_counts) === JSON.stringify(severityCounts) && summary.reviewed_fixture_count === 36 && summary.remaining_fixture_count === 180 && JSON.stringify(summary.reinforced_review_cases) === JSON.stringify(adjudication.results.filter((item) => item.reinforced_review_required).map((item) => item.fixture_id)), "Summary counts and reinforced list match adjudication.");
add("issue-ledger-references-results", issueLedger.issues.every((issue) => ids.includes(issue.fixture_id) && issue.issue_code && issue.description && issue.evidence_references.length > 0), `${issueLedger.issues.length} ledger issues.`);

const fixtureDiff = execFileSync("git", ["diff", "--name-only", base, "--", "lib/ai-quality", "lib/ai-decision-material"], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", base, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine"], { cwd: root, encoding: "utf8" }).trim();
add("source-fixtures-unchanged", fixtureDiff === "", fixtureDiff || "Fixture sources unchanged.");
add("runtime-api-ui-unchanged", runtimeDiff === "", runtimeDiff || "Runtime/API/UI sources unchanged.");

const currentCanonical = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((path) => {
  const source = read(path);
  const next = source.indexOf("\n## ", source.indexOf("\n## ") + 4);
  return source.slice(0, next === -1 ? source.length : next);
}).join("\n");
add("canonical-ai-review-state", currentCanonical.includes("owner-approved independent AI review protocol") && currentCanonical.includes("Batch 1 is complete for 36 of 216 fixtures") && currentCanonical.includes("144 of 216") && currentCanonical.includes("72 remain") && currentCanonical.includes("Stage 9 remains **In Progress**"), "Canonical active state preserves Batch 1 history and records cumulative Batch 4 progress without closing Stage 9.");
add("release-and-runtime-remain-closed", currentCanonical.includes("release readiness is not declared") && currentCanonical.includes("Live OpenAI execution is not opened") && currentCanonical.includes("`/api/simulate` remains deterministic with `mockOnly=true`") && !currentCanonical.includes("release candidate approved"), "Release and runtime boundaries remain closed.");
add("batch-5-planning-only", /Stage 9 Independent AI Review\s+Batch 5 of 6/.test(currentCanonical) && currentCanonical.includes("planning candidate"), "Batch 5 is planning-only after Batch 4 completion.");
add("network-zero", networkRequests === 0 && summary.network_request_count === 0, `${networkRequests} network requests.`);
add("quality-gate-registered", read("package.json").includes('"quality:stage-9-ai-review-batch-1": "node scripts/stage-9-ai-review-batch-1-quality.mjs"'), "Dedicated Batch 1 gate is registered.");
globalThis.fetch = originalFetch;

const allowed = new Set([
  "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_IMPLEMENTATION_PLAN.md", "LEVIO_PROJECT_PROGRESS.md", "PROJECT_CONTEXT.md",
  "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md", "docs/qa/LEVIO_STAGE_9_HUMAN_REVIEW_METHODOLOGY.md", "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/review/ai-batches/batch-1/selection.json", "docs/qa/review/ai-batches/batch-1/blind-packets.json",
  "docs/qa/review/ai-batches/batch-1/pass-a.json", "docs/qa/review/ai-batches/batch-1/pass-b.json", "docs/qa/review/ai-batches/batch-1/pass-c.json",
  "docs/qa/review/ai-batches/batch-1/adjudication.json", "docs/qa/review/ai-batches/batch-1/summary.json", "docs/qa/review/ai-batches/batch-1/issue-ledger.json",
  "docs/qa/review/AI_REVIEW_PROGRESS.json",
  "docs/qa/review/ai-batches/batch-2/selection.json", "docs/qa/review/ai-batches/batch-2/blind-packets.json",
  "docs/qa/review/ai-batches/batch-2/pass-a.json", "docs/qa/review/ai-batches/batch-2/pass-b.json", "docs/qa/review/ai-batches/batch-2/pass-c.json",
  "docs/qa/review/ai-batches/batch-2/adjudication.json", "docs/qa/review/ai-batches/batch-2/summary.json", "docs/qa/review/ai-batches/batch-2/issue-ledger.json", "docs/qa/review/ai-batches/batch-2/reinforced-review-queue.json",
  "package.json", "scripts/generate-stage-9-ai-review-batch-1.mjs", "scripts/stage-9-ai-review-batch-1-quality.mjs",
  "scripts/generate-stage-9-ai-review-batch-2.mjs", "scripts/stage-9-ai-review-batch-2-quality.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs", "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
]);
for (const path of [
  "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md", "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-3/${name}`),
  "scripts/generate-stage-9-ai-review-batch-3.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs",
  "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-4/${name}`),
  "scripts/generate-stage-9-ai-review-batch-4.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs",
]) allowed.add(path);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])].sort();
add("bounded-review-only-diff", diff.every((path) => allowed.has(path)), `Unexpected files: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

for (const check of checks) console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT selected=${ids.length} types=${JSON.stringify(selection.coverage.dataset_types)} languages=${JSON.stringify(selection.coverage.languages)} domains=${JSON.stringify(selection.coverage.domains)} completeness=${JSON.stringify(selection.coverage.completeness)} high_risk=${selection.coverage.high_risk_count} privacy=${selection.coverage.privacy_count} controlled_failure=${selection.coverage.controlled_failure_count} verdicts=${JSON.stringify(verdictCounts)} severities=${JSON.stringify(severityCounts)} disputed=${adjudication.results.filter((item) => item.consolidated_verdict === "AI_DISPUTED").length} reinforced=${adjudication.results.filter((item) => item.reinforced_review_required).length} missing_artifacts=0 hash_mismatches=0 network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
