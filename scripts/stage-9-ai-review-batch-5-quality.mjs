import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BATCH_5_FIXTURE_IDS,
  BATCH_6_EXPECTED_FIXTURE_IDS,
  buildAllArtifacts,
  serialize,
  sourceFixtureHash,
} from "./generate-stage-9-ai-review-batch-5.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "19ad90d9900d8d8903d5a89e61788a945e3cc503";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const artifact = (name) => json("docs", "qa", "review", "ai-batches", "batch-5", name);
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
const saturation = json("docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json");
const sourceManifest = json("docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
const sourceById = new Map(sourceManifest.entries.map((entry) => [entry.fixture_id, entry]));
const priorSelections = [1, 2, 3, 4].map((batch) => json("docs", "qa", "review", "ai-batches", `batch-${batch}`, "selection.json"));
const priorIds = new Set(priorSelections.flatMap((value) => value.fixtures.map((item) => item.fixture_id)));
const ids = selection.fixtures.map((item) => item.fixture_id);
const expectedRoles = ["ai-semantic-reviewer-v1", "ai-comparative-reviewer-v1", "ai-adversarial-reviewer-v1", "ai-adjudicator-v1"];
const allowedVerdicts = ["AI_PASS", "AI_PASS_WITH_NOTE", "AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED", "AI_NOT_REVIEWED"];
const allowedSeverities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const artifactNames = ["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "issue-ledger.json", "reinforced-review-queue.json", "summary.json"];
const canonical = (name) => read("docs", "qa", "review", "ai-batches", "batch-5", name) === serialize(artifact(name));
const recursivelyHasKey = (value, keys) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => recursivelyHasKey(item, keys));
  return Object.entries(value).some(([key, item]) => keys.includes(key) || recursivelyHasKey(item, keys));
};
const setEquals = (left, right) => left.length === right.length && left.every((item) => new Set(right).has(item));

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 AI-review Batch 5 gate.");
};

add("selection-exactly-36", ids.length === 36 && new Set(ids).size === 36 && JSON.stringify(ids) === JSON.stringify(BATCH_5_FIXTURE_IDS), `${ids.length} deterministic fixtures.`);
add("selection-distribution-28-4-4", selection.coverage.dataset_types.canonical_core === 28 && selection.coverage.dataset_types.synthetic_risk === 4 && selection.coverage.dataset_types.rich_decision_material_baseline === 4, JSON.stringify(selection.coverage.dataset_types));
const core = selection.fixtures.filter((item) => item.dataset_type === "canonical_core");
const clusters = new Map();
for (const item of core) clusters.set(item.equivalence_cluster, [...(clusters.get(item.equivalence_cluster) ?? []), item.language]);
add("seven-complete-four-language-clusters", clusters.size === 7 && [...clusters.values()].every((languages) => JSON.stringify([...languages].sort()) === JSON.stringify(["en", "es", "ru", "zh"])), `${clusters.size} complete clusters.`);
add("selection-disjoint-from-batches-1-4", ids.every((id) => !priorIds.has(id)), `${ids.filter((id) => priorIds.has(id)).length} overlaps.`);
add("deficit-matrix-maximal", ["complete", "partial", "contradictory", "critically_incomplete"].every((state) => selection.coverage.completeness[state] > 0) && Object.keys(selection.coverage.domains).filter((domain) => domain !== "adapter_contract_and_safety" && domain !== "decision_material_contract_and_preservation").length === 6 && selection.coverage_deficit_matrix.domain_feasibility.achievable_distinct_domains_in_candidate_pool === 6 && selection.coverage_deficit_matrix.domain_feasibility.absent_candidate_domain === "high_risk_and_safety_sensitive" && selection.coverage.privacy_handling_challenge_count > 0 && selection.coverage.controlled_failure_count > 0, JSON.stringify(selection.coverage));

const feasibility = selection.final_batch_feasibility;
add("final-batch-feasibility-shape", feasibility.total_remaining === 36 && feasibility.full_cluster_fixture_count === 16 && feasibility.full_clusters.length === 4 && feasibility.partial_cluster_fixture_count === 12 && feasibility.synthetic_risk_fixture_count === 7 && feasibility.rich_baseline_fixture_count === 1 && JSON.stringify(feasibility.fixture_ids) === JSON.stringify(BATCH_6_EXPECTED_FIXTURE_IDS), `${feasibility.total_remaining} exact remaining fixtures.`);
const reviewedIds = new Set([...priorIds, ...ids]);
const actualRemaining = sourceManifest.entries.map((entry) => entry.fixture_id).filter((id) => !reviewedIds.has(id));
add("final-batch-feasibility-from-source", setEquals(actualRemaining, BATCH_6_EXPECTED_FIXTURE_IDS) && actualRemaining.length === 36, `${actualRemaining.length} source-derived remaining fixtures.`);
const remainingCore = BATCH_6_EXPECTED_FIXTURE_IDS.filter((id) => id.startsWith("S9-CORE-"));
const partialExpected = { "029": ["EN", "RU", "ZH"], "033": ["ES", "EN", "ZH"], "036": ["ES", "EN", "RU"], "037": ["ES", "RU", "ZH"] };
add("final-batch-partial-clusters-exact", Object.entries(partialExpected).every(([cluster, languages]) => JSON.stringify(remainingCore.filter((id) => id.startsWith(`S9-CORE-${cluster}-`)).map((id) => id.slice(-2))) === JSON.stringify(languages)), "Clusters 029/033/036/037 retain exactly three required locales each.");

const forbiddenBlindKeys = ["expected_candidate_risk_signals", "expected_decision_material", "expected_critical_information_preservation", "human_review", "verdict", "review_results", "pattern_registry", "issue_ledger", "adjudication"];
add("pass-a-packets-blind", !recursivelyHasKey(blind.packets, forbiddenBlindKeys), "Blind packets contain no expected behavior, prior findings, registry, or review outputs.");
add("pass-a-results-blind", !recursivelyHasKey(passA.results, forbiddenBlindKeys), "Pass A results contain no forbidden expected-behavior keys.");
const reconstructionKeys = ["decision_under_review", "material_facts", "constraints", "uncertainties", "contradictions", "risks", "temporal_constraints", "irreversibility", "third_party_dependencies", "privacy_concerns", "forbidden_conclusions", "required_clarification_or_controlled_failure_behavior", "required_controlled_failure_behavior"];
add("pass-a-reconstruction-complete", passA.results.every((item) => reconstructionKeys.every((key) => Object.hasOwn(item.blind_reconstruction, key))), "Every blind result contains all semantic dimensions.");
add("pass-a-packet-hash", passA.immutable_input_packet.sha256 === sha256(serialize(blind)), "Pass A binds the frozen blind packet hash.");
add("pass-b-frozen-inputs", passB.frozen_semantic_input.includes("byte-for-byte") && passB.immutable_input_packet.some((item) => item.path.endsWith("pass-a.json") && item.sha256 === sha256(serialize(passA))) && passB.immutable_input_packet.some((item) => item.path.endsWith("selection.json") && item.sha256 === sha256(serialize(selection))), "Pass B binds selection and frozen Pass A hashes.");
const passCSource = read("docs", "qa", "review", "ai-batches", "batch-5", "pass-c.json");
add("pass-c-independent", !/pass-a|pass-b|pass_a|pass_b/i.test(passCSource) && passC.independence_invariant.includes("no other reviewer output") && passC.immutable_input_packet.some((item) => item.path.endsWith("selection.json") && item.sha256 === sha256(serialize(selection))), "Pass C has source/cluster inputs only and binds their packet hashes.");
add("adjudication-input-hashes", [["pass-a.json", passA], ["pass-b.json", passB], ["pass-c.json", passC]].every(([path, value]) => adjudication.immutable_input_packet.some((item) => item.path.endsWith(path) && item.sha256 === sha256(serialize(value)))), "Pass D binds frozen A/B/C hashes.");

const resultIds = (value) => value.results.map((item) => item.fixture_id);
add("all-four-passes-present", [passA, passB, passC, adjudication].every((value) => value.results.length === 36), `A=${passA.results.length} B=${passB.results.length} C=${passC.results.length} D=${adjudication.results.length}`);
add("all-pass-memberships-match", [passA, passB, passC, adjudication].every((value) => JSON.stringify(resultIds(value)) === JSON.stringify(ids)), "All pass memberships preserve selection order.");
add("reviewer-role-ids", passA.reviewer_role_id === expectedRoles[0] && passB.reviewer_role_id === expectedRoles[1] && passC.reviewer_role_id === expectedRoles[2] && adjudication.reviewer_role_id === expectedRoles[3], "All technical role IDs are exact.");
const isolated = (value, role) => value.context_isolation?.review_session === "stage-9-ai-review-batch-5" && value.context_isolation?.reviewer_role_id === role && value.context_isolation?.model_id === "codex-current-session" && value.context_isolation?.independence_type === "role-and-context-isolated" && value.context_isolation?.model_independence === "not_claimed";
add("context-isolation-metadata", [passA, passB, passC, adjudication].every((value, index) => isolated(value, expectedRoles[index])), "All passes use role/context isolation without model-independence claims.");
const artifactText = artifactNames.map((name) => read("docs", "qa", "review", "ai-batches", "batch-5", name)).join("\n");
add("no-human-identity-claims", !/human reviewer|human-reviewed|reviewer_identity/i.test(artifactText), "No human identity or human-reviewed claim appears.");
add("model-independence-not-claimed", !/model[-_ ]independent|different models|independent models/i.test(artifactText), "No unsupported model-independence claim appears.");

const allResults = [...passA.results, ...passB.results, ...passC.results, ...adjudication.results];
add("source-hashes-match", allResults.every((result) => sourceById.has(result.fixture_id) && result.source_fixture_hash === sourceFixtureHash(sourceById.get(result.fixture_id))), "All 144 pass records match their source fixture hashes.");
const baselineManifest = execFileSync("git", ["show", `${baseline}:docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json`], { cwd: root });
add("source-manifest-sha256", sha256(readFileSync(join(root, "docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"))) === sha256(baselineManifest), "Source manifest SHA-256 matches the approved baseline.");

add("adjudication-contract", adjudication.results.every((item) => allowedVerdicts.includes(item.consolidated_verdict) && item.consolidated_verdict !== "AI_NOT_REVIEWED" && allowedSeverities.includes(item.severity) && item.confidence >= 0 && item.confidence <= 1 && item.rationale?.trim() && item.evidence_references?.length && Array.isArray(item.issue_codes) && item.remediation_requirement?.trim() && item.accepted_observations?.length && Array.isArray(item.rejected_observations) && Array.isArray(item.unresolved_observations) && JSON.stringify(item.reviewer_role_ids) === JSON.stringify(expectedRoles)), "Every final verdict has severity, confidence, rationale, evidence, observations, roles, issues, and remediation.");
add("adjudication-observation-dispositions", adjudication.results.every((item) => item.adjudication_notes?.length && item.adjudication_notes.every((note) => ["ACCEPTED", "REJECTED", "UNRESOLVED"].includes(note.disposition) && note.reason)), "Every adjudicated observation has a reasoned disposition.");
add("core-equivalence-reviewed-as-clusters", passC.results.filter((item) => sourceById.get(item.fixture_id).equivalence_cluster).every((item) => item.equivalence_status.startsWith("EQUIVALENT")) && passC.results.filter((item) => !sourceById.get(item.fixture_id).equivalence_cluster).every((item) => item.equivalence_status === "NOT_APPLICABLE"), "Cluster and non-cluster equivalence states are explicit.");

const requiresReinforcement = (item) => ["AI_FAIL_MAJOR", "AI_DISPUTED"].includes(item.consolidated_verdict) || ["HIGH", "CRITICAL"].includes(item.severity) || item.confidence < 0.75 || item.disagreement_flags.silent_loss || item.disagreement_flags.privacy || item.disagreement_flags.controlled_failure || item.disagreement_flags.multilingual_equivalence || item.disagreement_flags.unsupported_high_risk_ground_truth;
const expectedQueue = adjudication.results.filter(requiresReinforcement).map((item) => item.fixture_id);
add("reinforced-rule", adjudication.results.every((item) => item.reinforced_review_required === requiresReinforcement(item) && (!item.reinforced_review_required || item.reinforced_review_reasons.length)), `${expectedQueue.length} required cases.`);
add("reinforced-queue-complete", queue.status === "PENDING_NOT_EXECUTED" && queue.case_count === expectedQueue.length && JSON.stringify(queue.cases.map((item) => item.fixture_id)) === JSON.stringify(expectedQueue) && queue.cases.every((item) => item.batch_provenance === "stage-9-ai-review-batch-5-of-6"), `${queue.case_count} queued cases with provenance.`);

const verdictCounts = Object.fromEntries(allowedVerdicts.map((value) => [value, adjudication.results.filter((item) => item.consolidated_verdict === value).length]));
const severityCounts = Object.fromEntries(allowedSeverities.map((value) => [value, adjudication.results.filter((item) => item.severity === value).length]));
add("summary-matches-adjudication", JSON.stringify(summary.verdict_counts) === JSON.stringify(verdictCounts) && JSON.stringify(summary.severity_counts) === JSON.stringify(severityCounts) && summary.reviewed_fixture_count === 36 && summary.remaining_fixture_count === 36 && summary.reinforced_review_count === expectedQueue.length, "Batch summary matches final adjudication.");
add("issue-ledger-complete", ledger.issues.length === adjudication.results.filter((item) => item.issue_codes.length).length && ledger.issues.every((issue) => ids.includes(issue.fixture_id) && issue.issue_code && issue.description && issue.evidence_references.length && issue.remediation_requirement), `${ledger.issues.length} ledger observations.`);

const requiredPatternNames = ["unsupported contradiction ground truth", "unsupported high-risk ground truth", "unsupported nonexistent option", "unsafe clarification/refusal path", "localization or gender drift", "privacy expectation disagreement", "controlled-failure disagreement", "invented cost, deadline or irreversibility", "reference behavior not supported by input"];
add("pattern-registry-complete", requiredPatternNames.every((name) => patterns.patterns.some((item) => item.pattern === name)) && patterns.patterns.every((item) => item.batch_5_assessment?.accepted_evidence?.length && item.batch_5_assessment?.rejected_hypotheses?.length && Array.isArray(item.batch_5_assessment.confirming_fixture_ids) && Array.isArray(item.batch_5_assessment.counterexample_fixture_ids) && Number.isInteger(item.cumulative_occurrence_count) && item.generator_or_template_linkage?.trim() && item.remediation_scope?.trim()), `${patterns.patterns.length} required patterns with Batch 5 evidence, linkage, and remediation scope.`);
const mustEscalate = (item) => item.distinct_clusters.length >= 3 || (item.distinct_domains.length >= 2 && (item.severity_distribution.HIGH ?? 0) > 0) || item.distinct_dataset_types.length >= 2;
add("pattern-escalation-correct", patterns.patterns.every((item) => !mustEscalate(item) || ["POTENTIALLY_SYSTEMIC", "SYSTEMIC_BLOCKER"].includes(item.status)) && patterns.aggregate_status === "POTENTIALLY_SYSTEMIC_WITHOUT_SYSTEMIC_BLOCKER" && patterns.systemic_blocker === false, "Escalation thresholds are applied without an unsupported blocker claim.");
add("pattern-saturation-assessment", saturation.patterns.length === 9 && requiredPatternNames.every((name) => saturation.patterns.some((item) => item.pattern === name && item.saturation_status && item.generator_or_template_linkage && item.locality_assessment && item.rule_level_remediation_assessment && item.fixture_level_remediation_assessment && item.fixture_remediation_executed === false && Array.isArray(item.confirming_fixture_ids) && Array.isArray(item.counterexample_fixture_ids))) && saturation.aggregate_status === "PATTERNS_SATURATED_WITHOUT_SYSTEMIC_BLOCKER" && saturation.systemic_blocker === false && saturation.remaining_primary_review_required === 36, "All nine challenged patterns have saturation, linkage, locality, and remediation-scope assessments.");

add("aggregate-progress-exact", progress.primary_review.batch_5 === 36 && progress.primary_review.total_reviewed === 180 && progress.primary_review.remaining === 36 && progress.batch_progress.length === 5 && progress.cumulative_verdict_counts.AI_PASS === 78 && progress.cumulative_verdict_counts.AI_PASS_WITH_NOTE === 31 && progress.cumulative_verdict_counts.AI_FAIL_MINOR === 19 && progress.cumulative_verdict_counts.AI_FAIL_MAJOR === 50 && progress.cumulative_verdict_counts.AI_DISPUTED === 2 && progress.cumulative_severity_counts.NONE === 78 && progress.cumulative_severity_counts.LOW === 30 && progress.cumulative_severity_counts.MEDIUM === 21 && progress.cumulative_severity_counts.HIGH === 51 && progress.cumulative_severity_counts.CRITICAL === 0 && progress.cumulative_open_issues === 86 && progress.cumulative_disputed_issues === 3 && progress.cumulative_reinforced_review_queue.length === 60 && progress.fixture_remediation === "NONE" && JSON.stringify(progress.final_batch_fixture_ids) === JSON.stringify(BATCH_6_EXPECTED_FIXTURE_IDS), "Aggregate progress records 180 reviewed, 36 remaining, exact counts, and no remediation.");

add("deterministic-canonical-artifacts", artifactNames.every(canonical) && read("docs", "qa", "review", "AI_REVIEW_PROGRESS.json") === serialize(progress) && read("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json") === serialize(patterns) && read("docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json") === serialize(saturation), "All generated artifacts use canonical JSON serialization.");
const generated = buildAllArtifacts();
const expectedFiles = { "selection.json": generated.selection, "blind-packets.json": generated.blind, "pass-a.json": generated.passA, "pass-b.json": generated.passB, "pass-c.json": generated.passC, "adjudication.json": generated.adjudication, "issue-ledger.json": generated.ledger, "reinforced-review-queue.json": generated.queue, "summary.json": generated.summary };
add("deterministic-regeneration", Object.entries(expectedFiles).every(([name, value]) => read("docs", "qa", "review", "ai-batches", "batch-5", name) === serialize(value)) && read("docs", "qa", "review", "AI_REVIEW_PROGRESS.json") === serialize(generated.progress) && read("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json") === serialize(generated.patterns) && read("docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json") === serialize(generated.saturation), "Regenerated artifacts are byte-identical.");

const priorArtifactPaths = [1, 2, 3, 4].flatMap((batch) => readdirSync(join(root, "docs", "qa", "review", "ai-batches", `batch-${batch}`)).filter((name) => name.endsWith(".json")).map((name) => `docs/qa/review/ai-batches/batch-${batch}/${name}`));
add("batches-1-4-sha256-byte-identical", priorArtifactPaths.every((path) => sha256(readFileSync(join(root, path))) === sha256(execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root }))), `All ${priorArtifactPaths.length} prior JSON artifacts match baseline SHA-256.`);

const fixtureDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime"], { cwd: root, encoding: "utf8" }).trim();
add("fixture-sources-unchanged", fixtureDiff === "", fixtureDiff || "Fixture sources and manifest unchanged.");
add("runtime-ui-api-unchanged", runtimeDiff === "", runtimeDiff || "Runtime, UI, API, persistence, and engine sources unchanged.");
const apiSource = read("app", "api", "simulate", "route.ts");
add("mock-only-api-boundary", apiSource.includes("mockOnly: true"), "/api/simulate remains mockOnly=true.");

const canonicalState = ["LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((name) => read(name).slice(0, 6500)).join("\n");
add("canonical-state-batch-5", canonicalState.includes("Batch 5") && canonicalState.includes("180 of 216") && canonicalState.includes("36 remain") && canonicalState.includes("Stage 9 remains **In Progress**"), "Canonical state records Batch 5 without Stage closure.");
add("release-runtime-closed", canonicalState.includes("release readiness is not declared") && canonicalState.includes("Live OpenAI execution is not opened") && canonicalState.includes("`/api/simulate` remains deterministic with `mockOnly=true`"), "Release and runtime remain closed.");
const blocker = summary.critical_defect_count > 0 || summary.dataset_wide_blocker || patterns.systemic_blocker;
add("critical-systemic-stop-rule", !blocker && summary.next_planning_candidate === "Stage 9 Independent AI Review Batch 6 of 6" && /Stage 9 Independent AI Review\s+Batch 6 of 6/.test(canonicalState), "CRITICAL=0 and SYSTEMIC_BLOCKER=false permit Batch 6 as planning candidate only.");
add("network-zero", networkRequests === 0 && summary.network_request_count === 0 && progress.network_request_count === 0, `${networkRequests} network requests.`);
add("quality-gate-registered", read("package.json").includes('"quality:stage-9-ai-review-batch-5": "node scripts/stage-9-ai-review-batch-5-quality.mjs"'), "Dedicated Batch 5 gate is registered.");

globalThis.fetch = originalFetch;

const allowed = new Set([
  "PROJECT_CONTEXT.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_IMPLEMENTATION_PLAN.md", "LEVIO_PROJECT_PROGRESS.md",
  "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/review/AI_REVIEW_PROGRESS.json", "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json", "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json",
  ...artifactNames.map((name) => `docs/qa/review/ai-batches/batch-5/${name}`),
  "package.json", "scripts/generate-stage-9-ai-review-batch-5.mjs", "scripts/stage-9-ai-review-batch-5-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-ai-review-batch-1-quality.mjs", "scripts/stage-9-ai-review-batch-2-quality.mjs",
  "scripts/stage-9-ai-review-batch-3-quality.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs",
  "scripts/visual-migration-closure-quality.mjs",
]);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])].sort();
add("bounded-review-only-diff", diff.every((path) => allowed.has(path)), `Unexpected files: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

for (const check of checks) console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT selected=${ids.length} types=${JSON.stringify(selection.coverage.dataset_types)} clusters=${clusters.size} overlap=${ids.filter((id) => priorIds.has(id)).length} verdicts=${JSON.stringify(verdictCounts)} severities=${JSON.stringify(severityCounts)} issues=${ledger.issues.length} reinforced=${expectedQueue.length} primary_reviewed=180 remaining=36 network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
