import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BATCH_3_FIXTURE_IDS,
  buildAllArtifacts,
  serialize,
  sourceFixtureHash,
} from "./generate-stage-9-ai-review-batch-3.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "70bacba4919aef2df057db4b43a70df4ea9f978e";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const artifact = (name) => json("docs", "qa", "review", "ai-batches", "batch-3", name);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

const selection = artifact("selection.json");
const blind = artifact("blind-packets.json");
const passA = artifact("pass-a.json");
const passB = artifact("pass-b.json");
const passC = artifact("pass-c.json");
const adjudication = artifact("adjudication.json");
const ledger = artifact("issue-ledger.json");
const queue = artifact("reinforced-review-queue.json");
const summary = artifact("summary.json");
const progress = json("docs", "qa", "review", "AI_REVIEW_PROGRESS.json");
const patterns = json("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json");
const sourceManifest = json("docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
const sourceById = new Map(sourceManifest.entries.map((entry) => [entry.fixture_id, entry]));
const priorSelections = [1, 2].map((batch) => json("docs", "qa", "review", "ai-batches", `batch-${batch}`, "selection.json"));
const priorIds = new Set(priorSelections.flatMap((value) => value.fixtures.map((item) => item.fixture_id)));
const ids = selection.fixtures.map((item) => item.fixture_id);
const expectedRoles = ["ai-semantic-reviewer-v1", "ai-comparative-reviewer-v1", "ai-adversarial-reviewer-v1", "ai-adjudicator-v1"];
const allowedVerdicts = ["AI_PASS", "AI_PASS_WITH_NOTE", "AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED", "AI_NOT_REVIEWED"];
const allowedSeverities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const artifactNames = ["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "issue-ledger.json", "reinforced-review-queue.json", "summary.json"];
const canonical = (name) => read("docs", "qa", "review", "ai-batches", "batch-3", name) === serialize(artifact(name));
const recursivelyHasKey = (value, keys) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => recursivelyHasKey(item, keys));
  return Object.entries(value).some(([key, item]) => keys.includes(key) || recursivelyHasKey(item, keys));
};

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 AI-review Batch 3 gate.");
};

add("selection-exactly-36", ids.length === 36 && new Set(ids).size === 36 && JSON.stringify(ids) === JSON.stringify(BATCH_3_FIXTURE_IDS), `${ids.length} deterministic fixtures.`);
add("selection-distribution-28-4-4", selection.coverage.dataset_types.canonical_core === 28 && selection.coverage.dataset_types.synthetic_risk === 4 && selection.coverage.dataset_types.rich_decision_material_baseline === 4, JSON.stringify(selection.coverage.dataset_types));
const core = selection.fixtures.filter((item) => item.dataset_type === "canonical_core");
const clusters = new Map();
for (const item of core) clusters.set(item.equivalence_cluster, [...(clusters.get(item.equivalence_cluster) ?? []), item.language]);
add("seven-complete-four-language-clusters", clusters.size === 7 && [...clusters.values()].every((languages) => JSON.stringify([...languages].sort()) === JSON.stringify(["en", "es", "ru", "zh"])), `${clusters.size} complete clusters.`);
add("selection-disjoint-from-batches-1-2", ids.every((id) => !priorIds.has(id)), `${ids.filter((id) => priorIds.has(id)).length} overlaps.`);
const excluded = ["003", "005", "010", "012", "013", "015", "021", "024", "026", "029", "031", "033", "036", "037", "038"];
add("all-prior-clusters-excluded", excluded.every((cluster) => !core.some((item) => item.equivalence_cluster === `S9-CLUSTER-${cluster}`)), "All 15 prior-used clusters are absent.");
add("deficit-matrix-complete", selection.coverage_deficit_matrix?.targeted_dimensions?.length === 9 && ["complete", "partial", "contradictory", "critically_incomplete"].every((state) => selection.coverage.completeness[state] > 0) && ["career_and_work", "education", "finance_and_spending", "relocation_and_housing", "business_decisions", "personal_planning", "high_risk_and_safety_sensitive"].every((domain) => selection.coverage.domains[domain] === 4), JSON.stringify(selection.coverage.completeness));

const forbiddenBlindKeys = ["expected_candidate_risk_signals", "expected_decision_material", "expected_critical_information_preservation", "human_review", "verdict", "review_results", "issue_ledger", "adjudication"];
add("pass-a-packets-blind", !recursivelyHasKey(blind.packets, forbiddenBlindKeys), "Blind packets contain no expected behavior or review results.");
add("pass-a-results-blind", !recursivelyHasKey(passA.results, forbiddenBlindKeys), "Semantic reconstructions contain no expected behavior keys.");
const reconstructionKeys = ["decision_under_review", "material_facts", "constraints", "uncertainties", "contradictions", "risks", "temporal_constraints", "irreversibility", "third_party_dependencies", "privacy_concerns", "forbidden_conclusions", "required_clarification_or_controlled_failure_behavior", "required_controlled_failure_behavior"];
add("pass-a-reconstruction-complete", passA.results.every((item) => reconstructionKeys.every((key) => Object.hasOwn(item.blind_reconstruction, key))), "Every blind result contains all semantic dimensions.");
add("pass-b-does-not-mutate-a", passB.frozen_semantic_input?.includes("byte-for-byte") && passB.immutable_input_packet.some((item) => item.path.endsWith("pass-a.json") && item.sha256 === sha256(serialize(passA))), "Comparative pass binds the frozen semantic artifact hash.");
const passCSource = read("docs", "qa", "review", "ai-batches", "batch-3", "pass-c.json");
add("pass-c-independent", !/pass-a|pass-b|pass_a|pass_b/i.test(passCSource) && passC.independence_invariant?.includes("no other reviewer output"), "Adversarial pass has source/cluster inputs only.");

const resultIds = (value) => value.results.map((item) => item.fixture_id);
add("all-four-passes-present", [passA, passB, passC, adjudication].every((value) => value.results.length === 36), `A=${passA.results.length} B=${passB.results.length} C=${passC.results.length} D=${adjudication.results.length}`);
add("all-pass-memberships-match", [passA, passB, passC, adjudication].every((value) => JSON.stringify(resultIds(value)) === JSON.stringify(ids)), "All pass memberships preserve selection order.");
add("reviewer-role-ids", passA.reviewer_role_id === expectedRoles[0] && passB.reviewer_role_id === expectedRoles[1] && passC.reviewer_role_id === expectedRoles[2] && adjudication.reviewer_role_id === expectedRoles[3], "All technical role IDs are exact.");
const isolated = (value, role) => value.context_isolation?.review_session === "stage-9-ai-review-batch-3" && value.context_isolation?.reviewer_role_id === role && value.context_isolation?.model_id === "codex-current-session" && value.context_isolation?.independence_type === "role-and-context-isolated" && value.context_isolation?.model_independence === "not_claimed";
add("context-isolation-metadata", [passA, passB, passC, adjudication].every((value, index) => isolated(value, expectedRoles[index])), "All passes use role/context isolation without a model-independence claim.");
add("no-human-identity-claims", !/human reviewer|human-reviewed|reviewer_identity/i.test(artifactNames.map((name) => read("docs", "qa", "review", "ai-batches", "batch-3", name)).join("\n")), "No human identity or human-reviewed claim appears.");
add("model-independence-not-claimed", !/model[-_ ]independent|different models|independent models/i.test(artifactNames.map((name) => read("docs", "qa", "review", "ai-batches", "batch-3", name)).join("\n")), "No unsupported model-independence claim appears.");

const allResults = [...passA.results, ...passB.results, ...passC.results, ...adjudication.results];
add("source-hashes-match", allResults.every((result) => sourceById.has(result.fixture_id) && result.source_fixture_hash === sourceFixtureHash(sourceById.get(result.fixture_id))), "All 144 pass records match their source hashes.");
add("source-manifest-hash", sha256(read("docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json")) === "5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b", "Source manifest remains byte-identical.");

add("adjudication-contract", adjudication.results.every((item) => allowedVerdicts.includes(item.consolidated_verdict) && item.consolidated_verdict !== "AI_NOT_REVIEWED" && allowedSeverities.includes(item.severity) && item.confidence >= 0 && item.confidence <= 1 && item.rationale?.trim() && item.evidence_references?.length && Array.isArray(item.issue_codes) && item.remediation_requirement?.trim() && item.accepted_observations?.length && Array.isArray(item.rejected_observations) && Array.isArray(item.unresolved_observations) && JSON.stringify(item.reviewer_role_ids) === JSON.stringify(expectedRoles)), "Every final verdict has severity, confidence, rationale, evidence, observations, roles, issues, and remediation.");
add("adjudication-observation-dispositions", adjudication.results.every((item) => item.adjudication_notes?.length && item.adjudication_notes.every((note) => ["ACCEPTED", "REJECTED", "UNRESOLVED"].includes(note.disposition) && note.reason)), "Every adjudicated observation has a supported disposition.");
add("core-equivalence-reviewed-as-clusters", passC.results.filter((item) => sourceById.get(item.fixture_id).equivalence_cluster).every((item) => item.equivalence_status.startsWith("EQUIVALENT")) && passC.results.filter((item) => !sourceById.get(item.fixture_id).equivalence_cluster).every((item) => item.equivalence_status === "NOT_APPLICABLE"), "Cluster and non-cluster equivalence states are explicit.");

const requiresReinforcement = (item) => ["AI_FAIL_MAJOR", "AI_DISPUTED"].includes(item.consolidated_verdict) || ["HIGH", "CRITICAL"].includes(item.severity) || item.confidence < 0.75 || item.disagreement_flags.silent_loss || item.disagreement_flags.privacy || item.disagreement_flags.controlled_failure || item.disagreement_flags.multilingual_equivalence || item.disagreement_flags.unsupported_high_risk_ground_truth;
const expectedQueue = adjudication.results.filter(requiresReinforcement).map((item) => item.fixture_id);
add("reinforced-rule", adjudication.results.every((item) => item.reinforced_review_required === requiresReinforcement(item) && (!item.reinforced_review_required || item.reinforced_review_reasons.length)), `${expectedQueue.length} required cases.`);
add("reinforced-queue-complete", queue.status === "PENDING_NOT_EXECUTED" && queue.case_count === expectedQueue.length && JSON.stringify(queue.cases.map((item) => item.fixture_id)) === JSON.stringify(expectedQueue) && queue.cases.every((item) => item.batch_provenance === "stage-9-ai-review-batch-3-of-6"), `${queue.case_count} queued cases with provenance.`);

const verdictCounts = Object.fromEntries(allowedVerdicts.map((value) => [value, adjudication.results.filter((item) => item.consolidated_verdict === value).length]));
const severityCounts = Object.fromEntries(allowedSeverities.map((value) => [value, adjudication.results.filter((item) => item.severity === value).length]));
add("summary-matches-adjudication", JSON.stringify(summary.verdict_counts) === JSON.stringify(verdictCounts) && JSON.stringify(summary.severity_counts) === JSON.stringify(severityCounts) && summary.reviewed_fixture_count === 36 && summary.remaining_fixture_count === 108 && summary.reinforced_review_count === expectedQueue.length, "Batch summary matches final adjudication.");
add("issue-ledger-complete", ledger.issues.length === 30 && ledger.issues.every((issue) => ids.includes(issue.fixture_id) && issue.issue_code && issue.description && issue.evidence_references.length && issue.remediation_requirement), `${ledger.issues.length} ledger observations.`);

const requiredPatternNames = ["unsupported contradiction ground truth", "unsupported high-risk ground truth", "unsupported nonexistent option", "unsafe clarification/refusal path", "localization or gender drift", "privacy expectation disagreement", "controlled-failure disagreement", "invented cost, deadline or irreversibility", "reference behavior not supported by input"];
add("pattern-registry-complete", requiredPatternNames.every((name) => patterns.patterns.some((item) => item.pattern === name)) && patterns.patterns.every((item) => item.issue_code && item.affected_batches.length && Array.isArray(item.affected_fixture_ids) && Array.isArray(item.distinct_clusters) && item.distinct_domains.length && item.distinct_dataset_types.length && Object.keys(item.severity_distribution).length && item.evidence.length && ["ISOLATED", "RECURRING", "POTENTIALLY_SYSTEMIC", "SYSTEMIC_BLOCKER"].includes(item.status)), `${patterns.patterns.length} required patterns.`);
const mustEscalate = (item) => item.distinct_clusters.length >= 3 || (item.distinct_domains.length >= 2 && (item.severity_distribution.HIGH ?? 0) > 0) || item.distinct_dataset_types.length >= 2;
add("pattern-escalation-correct", patterns.patterns.every((item) => !mustEscalate(item) || ["POTENTIALLY_SYSTEMIC", "SYSTEMIC_BLOCKER"].includes(item.status)) && patterns.aggregate_status === "POTENTIALLY_SYSTEMIC_WITHOUT_SYSTEMIC_BLOCKER" && patterns.systemic_blocker === false, "All escalation thresholds are applied without an unsupported blocker claim.");

add("aggregate-progress-exact", progress.primary_review.batch_1 === 36 && progress.primary_review.batch_2 === 36 && progress.primary_review.batch_3 === 36 && progress.primary_review.total_reviewed === 108 && progress.primary_review.remaining === 108 && progress.cumulative_verdict_counts.AI_FAIL_MAJOR === 29 && progress.cumulative_verdict_counts.AI_DISPUTED === 2 && progress.cumulative_severity_counts.CRITICAL === 0 && progress.cumulative_open_issues === 63 && progress.cumulative_disputed_issues === 3 && progress.cumulative_reinforced_review_queue.length === 39 && progress.fixture_remediation === "NONE", "Aggregate progress records 108 reviewed, 108 remaining, and no remediation.");
add("deterministic-canonical-artifacts", artifactNames.every(canonical) && read("docs", "qa", "review", "AI_REVIEW_PROGRESS.json") === serialize(progress) && read("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json") === serialize(patterns), "All generated artifacts use canonical JSON serialization.");
const generated = buildAllArtifacts();
const expectedFiles = { "selection.json": generated.selection, "blind-packets.json": generated.blind, "pass-a.json": generated.passA, "pass-b.json": generated.passB, "pass-c.json": generated.passC, "adjudication.json": generated.adjudication, "issue-ledger.json": generated.ledger, "reinforced-review-queue.json": generated.queue, "summary.json": generated.summary };
add("deterministic-regeneration", Object.entries(expectedFiles).every(([name, value]) => read("docs", "qa", "review", "ai-batches", "batch-3", name) === serialize(value)) && read("docs", "qa", "review", "AI_REVIEW_PROGRESS.json") === serialize(generated.progress) && read("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json") === serialize(generated.patterns), "Regenerated artifacts are byte-identical.");

const priorHashes = {
  "batch-1/adjudication.json": "2610cbb4e374a39b1c5f93c66359c134d566304534a238a3f45f2067109c5480",
  "batch-1/blind-packets.json": "3619d62825ce02ba582755f54199963c154f3d3a5a77a76006ccbb71455fc415",
  "batch-1/issue-ledger.json": "503e8d78f9b4a8e8856bba9afea0ef0440785488523543000b14f32e2eaeb4fb",
  "batch-1/pass-a.json": "d6870e7dfe0923c8d4e7d40cb877efca751fabd0e15f5d52509876cf3fde07b8",
  "batch-1/pass-b.json": "e1b8dfa236c517c4dcc3b6ec2b7482835c83d06ca145f69099f0ddc2c744b594",
  "batch-1/pass-c.json": "cce3dd63765c9f99874b398e18596e1c567daaa8833f78f784c6320bf085c3bf",
  "batch-1/selection.json": "167bdd0f779e72842ed198a87281ec9389fb0d28d6c4fc1dfbe9aa476d3b7279",
  "batch-1/summary.json": "b2303b4a8f10c17081e7fc04d49d4e1568d1ea4b922c4c33e0bc5f2465a90604",
  "batch-2/adjudication.json": "4181b2f2e7b386ee0d4118841c306db1b9644e6481deea84aee16af4aa21265a",
  "batch-2/blind-packets.json": "049c241fed5978e17f19ce22cbd6b54e4ac0b4ba4532e7f45b1388eec8c1cf80",
  "batch-2/issue-ledger.json": "b36c4ccf38ee515cb03f20d7e8a5c1190eb057fdcd63ebc83cb5700e2e1372b0",
  "batch-2/pass-a.json": "3a7c1ab61aebce78afed27261c1362341ec0a66f5ab1befd6388780e4248644c",
  "batch-2/pass-b.json": "bb1bbeaa3897a60d5e906626fd26df4febf5065920a2a22e1770d287be9e9021",
  "batch-2/pass-c.json": "468fc69ad80a7507e06b0d4a2b99e78f1c37479bcf7a07ce8bc04c63af084aab",
  "batch-2/reinforced-review-queue.json": "f8ecac6d2772451dbddbeb60277214158866b09dd88f6abcac2bdc9e6c455d48",
  "batch-2/selection.json": "e9849f38c816e829c7d3cd834e309d216173d565d71e4f04eae33064bec655ff",
  "batch-2/summary.json": "10aa3165f5ebcfd344c7b60c981ac7b91ed789dae131b729cd5afb2e2774f492",
};
add("batches-1-2-byte-identical", Object.entries(priorHashes).every(([path, expected]) => sha256(read("docs", "qa", "review", "ai-batches", ...path.split("/"))) === expected), "All 17 prior artifacts match baseline SHA-256.");

const fixtureDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine"], { cwd: root, encoding: "utf8" }).trim();
add("fixture-sources-unchanged", fixtureDiff === "", fixtureDiff || "Fixture sources and manifest unchanged.");
add("runtime-ui-api-unchanged", runtimeDiff === "", runtimeDiff || "Runtime, UI, API, persistence, and engine sources unchanged.");
const apiSource = read("app", "api", "simulate", "route.ts");
add("mock-only-api-boundary", apiSource.includes("mockOnly: true"), "/api/simulate remains mockOnly=true.");

const canonicalState = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((name) => read(name).slice(0, 5000)).join("\n");
add("canonical-state-batch-3", canonicalState.includes("Batch 3") && canonicalState.includes("108 of 216") && canonicalState.includes("108 remain") && canonicalState.includes("Stage 9 remains **In Progress**"), "Canonical state records Batch 3 without Stage closure.");
add("release-runtime-closed", canonicalState.includes("release readiness is not declared") && canonicalState.includes("Live OpenAI execution is not opened") && canonicalState.includes("`/api/simulate` remains deterministic with `mockOnly=true`"), "Release and runtime remain closed.");
const blocker = summary.critical_defect_count > 0 || summary.dataset_wide_blocker || patterns.systemic_blocker;
add("critical-systemic-stop-rule", !blocker && summary.next_planning_candidate === "Stage 9 Independent AI Review Batch 4 of 6" && /Stage 9 Independent AI Review\s+Batch 4 of 6/.test(canonicalState), "CRITICAL=0 and SYSTEMIC_BLOCKER=false permit Batch 4 as planning candidate only.");
add("network-zero", networkRequests === 0 && summary.network_request_count === 0 && progress.network_request_count === 0, `${networkRequests} network requests.`);
add("quality-gate-registered", read("package.json").includes('"quality:stage-9-ai-review-batch-3": "node scripts/stage-9-ai-review-batch-3-quality.mjs"'), "Dedicated Batch 3 gate is registered.");

globalThis.fetch = originalFetch;

const allowed = new Set([
  "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_IMPLEMENTATION_PLAN.md", "LEVIO_PROJECT_PROGRESS.md", "PROJECT_CONTEXT.md",
  "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md", "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/review/AI_REVIEW_PROGRESS.json", "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json",
  ...artifactNames.map((name) => `docs/qa/review/ai-batches/batch-3/${name}`),
  "package.json", "scripts/generate-stage-9-ai-review-batch-3.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs",
  "scripts/stage-9-ai-review-batch-1-quality.mjs", "scripts/stage-9-ai-review-batch-2-quality.mjs", "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/stage-9-offline-dataset-coverage-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
]);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])].sort();
add("bounded-review-only-diff", diff.every((path) => allowed.has(path)), `Unexpected files: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

for (const check of checks) console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT selected=${ids.length} types=${JSON.stringify(selection.coverage.dataset_types)} clusters=${clusters.size} overlap=${ids.filter((id) => priorIds.has(id)).length} verdicts=${JSON.stringify(verdictCounts)} severities=${JSON.stringify(severityCounts)} issues=${ledger.issues.length} reinforced=${expectedQueue.length} primary_reviewed=108 remaining=108 network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
