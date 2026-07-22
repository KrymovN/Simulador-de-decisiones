import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BATCH_2_FIXTURE_IDS,
  batchRoot,
  buildBatchSelection,
  buildBlindPackets,
  serialize,
  sourceFixtureHash,
} from "./generate-stage-9-ai-review-batch-2.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const base = "f3aad669d6ba56ad1088479345ba9255bc1419e5";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const artifact = (name) => json("docs", "qa", "review", "ai-batches", "batch-2", name);
const artifactSource = (name) => readFileSync(join(batchRoot, name), "utf8");
const sha256 = (source) => createHash("sha256").update(source).digest("hex");
const sourceManifest = json("docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
const sourceById = new Map(sourceManifest.entries.map((entry) => [entry.fixture_id, entry]));
const batch1Selection = json("docs", "qa", "review", "ai-batches", "batch-1", "selection.json");
const batch1Summary = json("docs", "qa", "review", "ai-batches", "batch-1", "summary.json");
const batch1Ledger = json("docs", "qa", "review", "ai-batches", "batch-1", "issue-ledger.json");
const selection = artifact("selection.json");
const blind = artifact("blind-packets.json");
const passA = artifact("pass-a.json");
const passB = artifact("pass-b.json");
const passC = artifact("pass-c.json");
const adjudication = artifact("adjudication.json");
const summary = artifact("summary.json");
const issueLedger = artifact("issue-ledger.json");
const reinforcedQueue = artifact("reinforced-review-queue.json");
const progress = json("docs", "qa", "review", "AI_REVIEW_PROGRESS.json");
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
const ids = selection.fixtures.map((item) => item.fixture_id);
const batch1Ids = new Set(batch1Selection.fixtures.map((item) => item.fixture_id));
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
const contextIsolated = (value, role) => value.context_isolation?.review_session === "stage-9-ai-review-batch-2" &&
  value.context_isolation?.reviewer_role_id === role && value.context_isolation?.model_id === "codex-current-session" &&
  value.context_isolation?.independence_type === "role-and-context-isolated" && value.context_isolation?.model_independence === "not_claimed";

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 AI-review Batch 2 gate.");
};

add("selection-exactly-36", ids.length === 36 && new Set(ids).size === 36 && JSON.stringify(ids) === JSON.stringify(BATCH_2_FIXTURE_IDS), `${ids.length} deterministic fixtures.`);
add("selection-distribution-28-5-3", selection.coverage.dataset_types.canonical_core === 28 && selection.coverage.dataset_types.synthetic_risk === 5 && selection.coverage.dataset_types.rich_decision_material_baseline === 3, JSON.stringify(selection.coverage.dataset_types));
const core = selection.fixtures.filter((item) => item.dataset_type === "canonical_core");
const coreClusters = new Map();
for (const item of core) coreClusters.set(item.equivalence_cluster, [...(coreClusters.get(item.equivalence_cluster) ?? []), item.language]);
add("seven-complete-four-language-clusters", coreClusters.size === 7 && [...coreClusters.values()].every((languages) => JSON.stringify([...languages].sort()) === JSON.stringify(["en", "es", "ru", "zh"])), `${coreClusters.size} complete clusters.`);
add("selection-disjoint-from-batch-1", ids.every((id) => !batch1Ids.has(id)), `${ids.filter((id) => batch1Ids.has(id)).length} overlaps.`);
add("excluded-clusters-absent", ["003", "010", "013", "024", "029", "033", "036", "037"].every((id) => !core.some((item) => item.equivalence_cluster === `S9-CLUSTER-${id}`)), "All prior-used clusters are excluded.");
add("deficit-matrix-coverage", ["career_and_work", "education", "finance_and_spending", "relocation_and_housing", "business_decisions", "personal_planning", "high_risk_and_safety_sensitive"].every((domain) => selection.coverage.domains[domain] === 4) && ["complete", "partial", "critically_incomplete", "contradictory"].every((state) => selection.coverage.completeness[state] > 0) && selection.coverage.high_risk_count >= 16 && selection.coverage.privacy_count >= 8 && selection.coverage.controlled_failure_count >= 8, JSON.stringify(selection.coverage));
add("selection-deterministic-source", artifactSource("selection.json") === serialize(buildBatchSelection()), "Selection equals deterministic generator output.");
add("blind-packets-deterministic-source", artifactSource("blind-packets.json") === serialize(buildBlindPackets()), "Blind packets equal deterministic generator output.");

const forbiddenBlindKeys = ["expected_candidate_risk_signals", "expected_decision_material", "expected_critical_information_preservation", "human_review", "verdict", "review_results"];
add("pass-a-packets-are-blind", !recursivelyHasKey(blind.packets, forbiddenBlindKeys), "Blind packets contain no expected behavior or prior-review keys.");
add("pass-a-results-remain-blind", !recursivelyHasKey(passA.results, forbiddenBlindKeys), "Pass A results contain no expected behavior or prior-review keys.");
const aRequired = ["decision_under_review", "material_facts", "constraints", "uncertainties", "contradictions", "risks", "temporal_constraints", "irreversibility", "third_party_dependencies", "privacy_concerns", "forbidden_conclusions", "required_controlled_failure_behavior"];
add("pass-a-required-reconstruction", passA.results.every((item) => aRequired.every((key) => Object.hasOwn(item.blind_reconstruction, key))), "Every Pass A result contains the Batch 2 semantic fields.");
add("pass-c-independent", !/pass-a|pass-b|pass_a|pass_b|PASS_A|PASS_B/.test(artifactSource("pass-c.json")), "Pass C contains no Pass A/B reference.");
add("all-four-passes-present", [passA, passB, passC, adjudication].every((value) => Array.isArray(value.results) && value.results.length === 36), `A=${passA.results.length} B=${passB.results.length} C=${passC.results.length} D=${adjudication.results.length}`);
add("all-pass-memberships-match", [passA, passB, passC, adjudication].every((value) => JSON.stringify(resultIds(value)) === JSON.stringify(ids)), "All pass artifacts preserve selection membership and order.");
add("reviewer-role-ids", passA.reviewer_role_id === expectedRoles[0] && passB.reviewer_role_id === expectedRoles[1] && passC.reviewer_role_id === expectedRoles[2] && adjudication.reviewer_role_id === expectedRoles[3], "All four technical role IDs are exact.");
add("context-isolation-metadata", [passA, passB, passC, adjudication].every((value, index) => contextIsolated(value, expectedRoles[index])), "All passes declare role/context isolation and no model independence.");
add("neutral-model-identifier", [passA, passB, passC, adjudication].every((value) => value.model_id === "codex-current-session"), "Only the neutral available model identifier is used.");
add("immutable-input-packet-provenance", [passA, passB, passC, adjudication].every((value) => value.immutable_input_packet && JSON.stringify(value.immutable_input_packet).includes("sha256")), "Every pass records immutable input packet hashes.");

const allResults = [...passA.results, ...passB.results, ...passC.results, ...adjudication.results];
add("source-hashes-match", allResults.every((result) => sourceById.has(result.fixture_id) && result.source_fixture_hash === sourceFixtureHash(sourceById.get(result.fixture_id))), "All 144 pass results match source SHA-256 hashes.");
const artifactNames = ["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"];
add("review-artifacts-canonical-json", artifactNames.every(canonical) && read("docs", "qa", "review", "AI_REVIEW_PROGRESS.json") === serialize(progress), "All Batch 2 and aggregate artifacts use canonical JSON serialization.");
add("no-human-identity-claims", !/human reviewer|human-reviewed|human_review_status|reviewer_identity/i.test(artifactNames.slice(2).map(artifactSource).join("\n")), "AI artifacts contain no human identity or human-reviewed claim.");
add("model-independence-not-claimed", !/model[-_ ]independent|different models|independent models/i.test(artifactNames.map(artifactSource).join("\n")) && [passA, passB, passC, adjudication].every((value) => value.context_isolation.model_independence === "not_claimed"), "No unsupported model-independence assertion.");

add("final-verdict-contract", adjudication.results.every((item) => allowedVerdicts.includes(item.consolidated_verdict) && item.consolidated_verdict !== "AI_NOT_REVIEWED" && allowedSeverity.includes(item.severity) && typeof item.confidence === "number" && item.confidence >= 0 && item.confidence <= 1 && item.rationale?.trim() && item.evidence_references?.length > 0 && Array.isArray(item.issue_codes) && item.remediation_requirement?.trim() && JSON.stringify(item.reviewer_role_ids) === JSON.stringify(expectedRoles) && item.prompt_version === "stage-9-ai-review-adjudication.2"), "Every adjudicated verdict has rationale, confidence, evidence, roles, issues, and remediation.");
add("adjudication-observation-dispositions", adjudication.results.every((item) => item.adjudication_notes?.length > 0 && item.adjudication_notes.every((note) => ["ACCEPTED", "REJECTED", "UNRESOLVED"].includes(note.disposition) && note.reason)), "Accepted, rejected, and unresolved observations are evidence-based.");
add("non-multilingual-equivalence-not-applicable", passC.results.filter((item) => sourceById.get(item.fixture_id).equivalence_cluster === null).every((item) => item.equivalence_status === "NOT_APPLICABLE"), "Non-cluster cases do not synthesize equivalence judgments.");

const requiresReinforcement = (item) => ["AI_FAIL_MAJOR", "AI_DISPUTED"].includes(item.consolidated_verdict) || ["HIGH", "CRITICAL"].includes(item.severity) || item.confidence < 0.75 || item.disagreement_flags.silent_loss || item.disagreement_flags.privacy || item.disagreement_flags.controlled_failure || item.disagreement_flags.multilingual_equivalence || item.disagreement_flags.unsupported_high_risk_ground_truth;
const expectedQueue = adjudication.results.filter(requiresReinforcement).map((item) => item.fixture_id);
add("reinforced-review-rule", adjudication.results.every((item) => item.reinforced_review_required === requiresReinforcement(item) && (!item.reinforced_review_required || item.reinforced_review_reasons.length > 0)), `${expectedQueue.length} required cases.`);
add("reinforced-review-queue-complete", reinforcedQueue.batch_id === "stage-9-ai-review-batch-2-of-6" && reinforcedQueue.status === "PENDING_NOT_EXECUTED" && JSON.stringify(reinforcedQueue.cases.map((item) => item.fixture_id)) === JSON.stringify(expectedQueue) && reinforcedQueue.cases.every((item) => item.batch_provenance === "stage-9-ai-review-batch-2-of-6" && item.reasons.length > 0), `${reinforcedQueue.cases.length} queued cases with provenance.`);

const verdictCounts = Object.fromEntries(allowedVerdicts.map((verdict) => [verdict, adjudication.results.filter((item) => item.consolidated_verdict === verdict).length]));
const severityCounts = Object.fromEntries(allowedSeverity.map((severity) => [severity, adjudication.results.filter((item) => item.severity === severity).length]));
add("summary-matches-adjudication", JSON.stringify(summary.verdict_counts) === JSON.stringify(verdictCounts) && JSON.stringify(summary.severity_counts) === JSON.stringify(severityCounts) && summary.reviewed_fixture_count === 36 && summary.remaining_fixture_count === 144 && JSON.stringify(summary.reinforced_review_cases) === JSON.stringify(expectedQueue), "Batch 2 summary matches adjudication.");
add("issue-ledger-references-results", issueLedger.issues.every((issue) => ids.includes(issue.fixture_id) && issue.issue_code && issue.description && issue.evidence_references.length > 0), `${issueLedger.issues.length} Batch 2 ledger issues.`);
const addCounts = (left, right, keys) => Object.fromEntries(keys.map((key) => [key, (left[key] ?? 0) + (right[key] ?? 0)]));
const cumulativeVerdicts = addCounts(batch1Summary.verdict_counts, summary.verdict_counts, allowedVerdicts);
const cumulativeSeverities = addCounts(batch1Summary.severity_counts, summary.severity_counts, allowedSeverity);
const cumulativeOpen = batch1Ledger.issues.filter((item) => item.status === "OPEN").length + issueLedger.issues.filter((item) => item.status === "OPEN").length;
const cumulativeDisputed = batch1Ledger.issues.filter((item) => item.status === "DISPUTED").length + issueLedger.issues.filter((item) => item.status === "DISPUTED").length;
const recordedBatch2 = progress.batch_progress.find((item) => item.batch_id === "stage-9-ai-review-batch-2-of-6");
add("aggregate-progress-exact", progress.primary_review.batch_1 === 36 && progress.primary_review.batch_2 === 36 && progress.primary_review.batch_3 === 36 && progress.primary_review.batch_4 === 36 && progress.primary_review.batch_5 === 36 && progress.primary_review.batch_6 === 36 && progress.primary_review.total_reviewed === 216 && progress.primary_review.remaining === 0 && JSON.stringify(recordedBatch2?.verdict_counts) === JSON.stringify(summary.verdict_counts) && JSON.stringify(recordedBatch2?.severity_counts) === JSON.stringify(summary.severity_counts) && progress.fixture_remediation === "NONE", "Aggregate progress preserves the exact Batch 2 record inside the 216/216 primary-review closure.");
add("aggregate-queue-provenance", progress.cumulative_reinforced_review_queue.filter((item) => item.batch_provenance === "stage-9-ai-review-batch-1-of-6").length === batch1Summary.reinforced_review_count && progress.cumulative_reinforced_review_queue.filter((item) => item.batch_provenance === "stage-9-ai-review-batch-2-of-6").length === reinforcedQueue.cases.length && progress.cumulative_reinforced_review_queue.length === 73, `${progress.cumulative_reinforced_review_queue.length} cumulative reinforced cases with preserved Batch 1-2 provenance.`);

const batch1Hashes = {
  "adjudication.json": "2610cbb4e374a39b1c5f93c66359c134d566304534a238a3f45f2067109c5480",
  "blind-packets.json": "3619d62825ce02ba582755f54199963c154f3d3a5a77a76006ccbb71455fc415",
  "issue-ledger.json": "503e8d78f9b4a8e8856bba9afea0ef0440785488523543000b14f32e2eaeb4fb",
  "pass-a.json": "d6870e7dfe0923c8d4e7d40cb877efca751fabd0e15f5d52509876cf3fde07b8",
  "pass-b.json": "e1b8dfa236c517c4dcc3b6ec2b7482835c83d06ca145f69099f0ddc2c744b594",
  "pass-c.json": "cce3dd63765c9f99874b398e18596e1c567daaa8833f78f784c6320bf085c3bf",
  "selection.json": "167bdd0f779e72842ed198a87281ec9389fb0d28d6c4fc1dfbe9aa476d3b7279",
  "summary.json": "b2303b4a8f10c17081e7fc04d49d4e1568d1ea4b922c4c33e0bc5f2465a90604",
};
add("batch-1-artifacts-byte-identical", Object.entries(batch1Hashes).every(([name, hash]) => sha256(read("docs", "qa", "review", "ai-batches", "batch-1", name)) === hash), "All eight Batch 1 artifacts match baseline SHA-256.");
const fixtureDiff = execFileSync("git", ["diff", "--name-only", base, "--", "lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", base, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine"], { cwd: root, encoding: "utf8" }).trim();
add("source-fixtures-unchanged", fixtureDiff === "", fixtureDiff || "Fixture sources and source manifest unchanged.");
add("runtime-api-ui-unchanged", runtimeDiff === "", runtimeDiff || "Runtime/API/UI sources unchanged.");

const currentCanonical = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((path) => {
  const source = read(path);
  const next = source.indexOf("\n## ", source.indexOf("\n## ") + 4);
  return source.slice(0, next === -1 ? source.length : next);
}).join("\n");
add("canonical-ai-review-state", currentCanonical.includes("Batch 6") && currentCanonical.includes("216 of 216") && currentCanonical.includes("remaining primary review is 0") && currentCanonical.includes("Stage 9 remain") && currentCanonical.includes("In Progress"), "Canonical state records Batch 6 primary closure without closing Stage 9; aggregate progress preserves Batch 2 history.");
add("release-and-runtime-remain-closed", currentCanonical.includes("release readiness is not declared") && currentCanonical.includes("Live OpenAI execution is not opened") && currentCanonical.includes("`/api/simulate` remains deterministic with `mockOnly=true`") && !currentCanonical.includes("release candidate approved"), "Release and runtime boundaries remain closed.");
const blocker = summary.critical_defect_count > 0 || summary.dataset_wide_blocker === true;
add("next-candidate-follows-critical-rule", blocker ? !currentCanonical.includes("Batch 6 of 6") : /Stage 9 Independent AI Review\s+Batch 6 of 6/.test(currentCanonical), blocker ? "Critical/blocker prevents automatic Batch 6 candidacy." : "Batch 6 is the next planning candidate after completed Batch 5.");
add("network-zero", networkRequests === 0 && summary.network_request_count === 0 && progress.network_request_count === 0, `${networkRequests} network requests.`);
add("quality-gate-registered", read("package.json").includes('"quality:stage-9-ai-review-batch-2": "node scripts/stage-9-ai-review-batch-2-quality.mjs"'), "Dedicated Batch 2 gate is registered.");
globalThis.fetch = originalFetch;

const allowed = new Set([
  "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_IMPLEMENTATION_PLAN.md", "LEVIO_PROJECT_PROGRESS.md", "PROJECT_CONTEXT.md",
  "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md", "docs/qa/review/AI_REVIEW_PROGRESS.json",
  ...artifactNames.map((name) => `docs/qa/review/ai-batches/batch-2/${name}`),
  "package.json", "scripts/generate-stage-9-ai-review-batch-2.mjs", "scripts/stage-9-ai-review-batch-2-quality.mjs",
  "scripts/stage-9-ai-review-batch-1-quality.mjs", "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/stage-9-offline-dataset-coverage-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
]);
for (const path of [
  "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md", "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-3/${name}`),
  "scripts/generate-stage-9-ai-review-batch-3.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs",
  "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-4/${name}`),
  "scripts/generate-stage-9-ai-review-batch-4.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-5/${name}`),
  "scripts/generate-stage-9-ai-review-batch-5.mjs", "scripts/stage-9-ai-review-batch-5-quality.mjs",
  "docs/qa/review/AI_REVIEW_PRIMARY_CLOSURE.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-6/${name}`),
  "scripts/generate-stage-9-ai-review-batch-6.mjs", "scripts/stage-9-ai-review-batch-6-quality.mjs",
]) allowed.add(path);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])].sort();
add("bounded-review-only-diff", diff.every((path) => allowed.has(path)), `Unexpected files: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

for (const check of checks) console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT selected=${ids.length} types=${JSON.stringify(selection.coverage.dataset_types)} clusters=${coreClusters.size} overlap=${ids.filter((id) => batch1Ids.has(id)).length} verdicts=${JSON.stringify(verdictCounts)} severities=${JSON.stringify(severityCounts)} reinforced=${expectedQueue.length} primary_reviewed=72 remaining=144 network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
