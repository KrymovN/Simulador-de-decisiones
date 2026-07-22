import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BATCH_6_FIXTURE_IDS, buildAllArtifacts, canonicalSource, serialize, sourceFixtureHash } from "./generate-stage-9-ai-review-batch-6.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "058a124678e84c49e35e559be59ebc1ce2eccdf6";
const batchDir = join(root, "docs", "qa", "review", "ai-batches", "batch-6");
const artifactNames = ["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "issue-ledger.json", "reinforced-review-queue.json", "summary.json"];
const roles = ["ai-semantic-reviewer-v1", "ai-comparative-reviewer-v1", "ai-adversarial-reviewer-v1", "ai-adjudicator-v1"];
const verdicts = ["AI_PASS", "AI_PASS_WITH_NOTE", "AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED", "AI_NOT_REVIEWED"];
const severities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const checks = [];
let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { networkRequests += 1; throw new Error("Network forbidden in Batch 6 quality gate"); };

function add(id, passed, detail) { checks.push({ id, passed: Boolean(passed), detail }); }
function read(...parts) { return readFileSync(join(root, ...parts), "utf8"); }
function json(...parts) { return JSON.parse(read(...parts)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function setEquals(a, b) { return a.length === b.length && new Set(a).size === new Set(b).size && a.every((item) => new Set(b).has(item)); }
function recursivelyHasKey(value, forbidden) { if (Array.isArray(value)) return value.some((item) => recursivelyHasKey(item, forbidden)); if (!value || typeof value !== "object") return false; return Object.entries(value).some(([key, child]) => forbidden.includes(key) || recursivelyHasKey(child, forbidden)); }
function canonical(text) { return text.endsWith("\n") && text === serialize(JSON.parse(text)); }

const selection = json("docs", "qa", "review", "ai-batches", "batch-6", "selection.json");
const blind = json("docs", "qa", "review", "ai-batches", "batch-6", "blind-packets.json");
const passA = json("docs", "qa", "review", "ai-batches", "batch-6", "pass-a.json");
const passB = json("docs", "qa", "review", "ai-batches", "batch-6", "pass-b.json");
const passC = json("docs", "qa", "review", "ai-batches", "batch-6", "pass-c.json");
const adjudication = json("docs", "qa", "review", "ai-batches", "batch-6", "adjudication.json");
const ledger = json("docs", "qa", "review", "ai-batches", "batch-6", "issue-ledger.json");
const queue = json("docs", "qa", "review", "ai-batches", "batch-6", "reinforced-review-queue.json");
const summary = json("docs", "qa", "review", "ai-batches", "batch-6", "summary.json");
const progress = json("docs", "qa", "review", "AI_REVIEW_PROGRESS.json");
const patterns = json("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json");
const saturation = json("docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json");
const closure = json("docs", "qa", "review", "AI_REVIEW_PRIMARY_CLOSURE.json");
const manifest = json("docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
const sourceById = new Map(manifest.entries.map((entry) => [entry.fixture_id, entry]));
const ids = selection.fixtures.map((item) => item.fixture_id);
const priorSelections = [1, 2, 3, 4, 5].map((batch) => json("docs", "qa", "review", "ai-batches", `batch-${batch}`, "selection.json"));
const priorIds = priorSelections.flatMap((item) => item.fixtures.map((fixture) => fixture.fixture_id));

add("exact-36-selection", ids.length === 36 && JSON.stringify(ids) === JSON.stringify(BATCH_6_FIXTURE_IDS), "Selection is the exact ordered owner-approved remainder.");
add("selection-unique", new Set(ids).size === 36, "All selected fixture IDs are unique.");
add("selection-disjoint-batches-1-5", ids.every((id) => !priorIds.includes(id)), "No Batch 6 ID appears in Batches 1-5.");
add("dataset-type-distribution", selection.coverage.dataset_types.canonical_core === 28 && selection.coverage.dataset_types.synthetic_risk === 7 && selection.coverage.dataset_types.rich_decision_material_baseline === 1, JSON.stringify(selection.coverage.dataset_types));
add("complete-clusters-exact", JSON.stringify(selection.complete_clusters) === JSON.stringify(["S9-CLUSTER-007", "S9-CLUSTER-016", "S9-CLUSTER-022", "S9-CLUSTER-030"]), "Four complete clusters are exact.");
const counterpartIds = Object.values(selection.partial_cluster_counterparts).map((item) => item.fixture_id);
add("partial-counterparts-exact", setEquals(counterpartIds, ["S9-CORE-029-ES", "S9-CORE-033-RU", "S9-CORE-036-ZH", "S9-CORE-037-EN"]), counterpartIds.join(", "));
const reviewed = new Set([...priorIds, ...ids]);
const remaining = manifest.entries.map((entry) => entry.fixture_id).filter((id) => !reviewed.has(id));
add("source-derived-remaining-zero", remaining.length === 0 && reviewed.size === 216, `${reviewed.size}/216 reviewed; ${remaining.length} remain.`);
add("selection-declares-zero-remaining", selection.prior_reviewed_count === 180 && selection.remaining_after_batch === 0, "Selection records 180 prior and zero remaining.");

const forbiddenBlind = ["expected_candidate_risk_signals", "expected_decision_material", "expected_critical_information_preservation", "human_review", "counterpart", "verdict", "pattern_registry", "pass_b", "pass_c", "adjudication"];
add("pass-a-packet-blindness", !recursivelyHasKey(blind.packets, forbiddenBlind), "Blind packets exclude expectations, counterparts, prior findings, and later passes.");
add("pass-a-result-blindness", !recursivelyHasKey(passA.results, forbiddenBlind), "Pass A results retain the blind boundary.");
const reconstructionKeys = ["decision_under_review", "confirmed_facts", "constraints", "unknowns", "contradictions", "risks", "urgency", "reversibility", "third_party_dependencies", "privacy_concerns", "forbidden_conclusions", "required_clarification_or_controlled_failure_behavior", "required_controlled_failure_behavior"];
add("pass-a-reconstruction-contract", passA.results.every((item) => reconstructionKeys.every((key) => Object.hasOwn(item.blind_reconstruction, key))), "All blind reconstructions contain the required semantic dimensions.");
add("pass-a-frozen-hash", passA.immutable_input_packet.sha256 === sha(serialize(blind)), "Pass A binds blind-packets SHA-256.");
add("pass-b-frozen-a", passB.immutable_input_packet.some((item) => item.path.endsWith("pass-a.json") && item.sha256 === sha(serialize(passA))) && passB.frozen_semantic_input.includes("byte-for-byte"), "Pass B binds immutable Pass A.");
const passCText = read("docs", "qa", "review", "ai-batches", "batch-6", "pass-c.json");
add("pass-c-independent", !/pass-a|pass-b|pass_a|pass_b/i.test(passCText) && passC.independence_invariant.includes("no Pass A or Pass B"), "Pass C contains no Pass A/B dependency.");
add("pass-d-frozen-inputs", [["pass-a.json", passA], ["pass-b.json", passB], ["pass-c.json", passC]].every(([name, value]) => adjudication.immutable_input_packet.some((item) => item.path.endsWith(name) && item.sha256 === sha(serialize(value)))), "Pass D binds frozen A/B/C hashes.");

const allPasses = [passA, passB, passC, adjudication];
add("all-four-passes-cover-36", allPasses.every((pass) => pass.results.length === 36 && JSON.stringify(pass.results.map((item) => item.fixture_id)) === JSON.stringify(ids)), "A/B/C/D each cover the exact selection in order.");
add("role-ids-exact", allPasses.every((pass, index) => pass.reviewer_role_id === roles[index]), "All technical reviewer role IDs are exact.");
add("context-isolation-exact", allPasses.every((pass, index) => pass.context_isolation.review_session === "stage-9-ai-review-batch-6" && pass.context_isolation.reviewer_role_id === roles[index] && pass.context_isolation.model_id === "codex-current-session" && pass.context_isolation.independence_type === "role-and-context-isolated" && pass.context_isolation.model_independence === "not_claimed"), "All passes use role/context isolation without model-independence claims.");
add("no-human-identity-claims", allPasses.every((pass) => !Object.hasOwn(pass, "human_reviewer") && !Object.hasOwn(pass, "human_reviewer_identity")), "No human identity field exists.");

const passResults = allPasses.flatMap((pass) => pass.results);
add("source-hashes-exact", passResults.every((item) => sourceById.has(item.fixture_id) && item.source_fixture_hash === sourceFixtureHash(sourceById.get(item.fixture_id))), "All 144 pass records bind current source hashes.");
add("selection-source-hashes-exact", selection.fixtures.every((item) => item.source_fixture_hash === sourceFixtureHash(sourceById.get(item.fixture_id))), "All selection hashes match canonical sources.");
const baselineManifest = execFileSync("git", ["show", `${baseline}:docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json`], { cwd: root });
add("source-manifest-byte-identical", sha(readFileSync(join(root, "docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"))) === sha(baselineManifest), "Manifest matches the approved baseline SHA-256.");

const counterpartExpected = new Map([["S9-CORE-029-ES", ["AI_PASS_WITH_NOTE", "LOW"]], ["S9-CORE-033-RU", ["AI_FAIL_MINOR", "MEDIUM"]], ["S9-CORE-036-ZH", ["AI_FAIL_MAJOR", "HIGH"]], ["S9-CORE-037-EN", ["AI_DISPUTED", "HIGH"]]]);
const priorAdjudications = [1, 2, 3, 4, 5].flatMap((batch) => json("docs", "qa", "review", "ai-batches", `batch-${batch}`, "adjudication.json").results);
add("counterpart-verdicts-immutable", [...counterpartExpected].every(([id, [verdict, severity]]) => { const item = priorAdjudications.find((entry) => entry.fixture_id === id); return item?.consolidated_verdict === verdict && item?.severity === severity; }), "All four source counterparts retain prior verdict and severity.");
add("counterpart-use-equivalence-only", passC.cluster_completeness.length === 4 && passC.cluster_completeness.every((item) => item.prior_verdict_unchanged && item.completeness === "FOUR_LOCALES_ACCOUNTED_FOR") && passA.results.every((item) => !counterpartIds.includes(item.fixture_id)), "Counterparts appear only as immutable Pass C equivalence anchors.");

add("adjudication-contract", adjudication.results.every((item) => verdicts.includes(item.consolidated_verdict) && item.consolidated_verdict !== "AI_NOT_REVIEWED" && severities.includes(item.severity) && item.confidence >= 0 && item.confidence <= 1 && item.rationale && item.evidence_references.length && Array.isArray(item.accepted_observations) && Array.isArray(item.rejected_observations) && Array.isArray(item.unresolved_observations) && item.remediation_recommendation && JSON.stringify(item.reviewer_role_ids) === JSON.stringify(roles)), "Every final record has verdict, severity, confidence, rationale, evidence, observations, remediation, and roles.");
add("adjudication-dispositions", adjudication.results.every((item) => item.adjudication_notes.length && item.adjudication_notes.every((note) => ["ACCEPTED", "REJECTED", "UNRESOLVED"].includes(note.disposition) && note.reason)), "Every adjudicated observation has a reasoned disposition.");
const requiresReinforcement = (item) => ["AI_FAIL_MAJOR", "AI_DISPUTED"].includes(item.consolidated_verdict) || ["HIGH", "CRITICAL"].includes(item.severity) || item.confidence < 0.75 || item.disagreement_flags.silent_loss || item.disagreement_flags.privacy || item.disagreement_flags.controlled_failure || item.disagreement_flags.multilingual_equivalence || item.disagreement_flags.unsupported_high_risk_ground_truth;
const expectedQueue = adjudication.results.filter(requiresReinforcement).map((item) => item.fixture_id);
add("reinforced-rule-exact", adjudication.results.every((item) => item.reinforced_review_required === requiresReinforcement(item) && (!item.reinforced_review_required || item.reinforced_review_reasons.length)), `${expectedQueue.length} Batch 6 cases require reinforcement.`);
add("batch-queue-complete", queue.status === "PENDING_NOT_EXECUTED" && queue.case_count === expectedQueue.length && JSON.stringify(queue.cases.map((item) => item.fixture_id)) === JSON.stringify(expectedQueue) && queue.cases.every((item) => item.reasons.length && item.batch_provenance === "stage-9-ai-review-batch-6-of-6"), "Batch queue preserves exact reasons and provenance.");
add("aggregate-queue-complete-unique", progress.cumulative_reinforced_review_queue.length === 73 && new Set(progress.cumulative_reinforced_review_queue.map((item) => item.fixture_id)).size === 73 && progress.cumulative_reinforced_review_queue.every((item) => item.reasons?.length && item.status === "PENDING_NOT_EXECUTED"), "Aggregate queue has 73 unique reasoned entries from Batches 1-6.");

const verdictCounts = Object.fromEntries(verdicts.map((value) => [value, adjudication.results.filter((item) => item.consolidated_verdict === value).length]));
const severityCounts = Object.fromEntries(severities.map((value) => [value, adjudication.results.filter((item) => item.severity === value).length]));
add("summary-exact", JSON.stringify(summary.verdict_counts) === JSON.stringify(verdictCounts) && JSON.stringify(summary.severity_counts) === JSON.stringify(severityCounts) && summary.reviewed_fixture_count === 36 && summary.remaining_fixture_count === 0 && summary.issue_count === ledger.issues.length, `verdicts=${JSON.stringify(verdictCounts)} severity=${JSON.stringify(severityCounts)}`);
add("issue-ledger-complete", ledger.issues.length === adjudication.results.reduce((count, item) => count + item.issue_codes.length, 0) && ledger.issues.every((item) => ids.includes(item.fixture_id) && item.issue_code && item.description && item.evidence_references.length && item.remediation_requirement), `${ledger.issues.length} issue observations.`);

const requiredPatterns = ["unsupported contradiction ground truth", "unsupported high-risk ground truth", "unsupported nonexistent option", "unsafe clarification/refusal path", "localization or gender drift", "invented cost, deadline or irreversibility", "reference behavior not supported by input", "privacy expectation disagreement", "controlled-failure disagreement"];
add("pattern-registry-final", patterns.patterns.length === 9 && requiredPatterns.every((name) => patterns.patterns.some((item) => item.pattern === name && item.batch_6_assessment && Number.isInteger(item.cumulative_occurrence_count) && item.generator_or_template_linkage && item.likely_root_cause && item.recommended_remediation_scope && ["NOT_CONFIRMED", "ISOLATED", "RECURRING", "CONFIRMED_SYSTEMIC_REMEDIATION_REQUIRED", "SYSTEMIC_BLOCKER"].includes(item.status) && item.final_reinforced_adjudication)), "All nine final patterns contain Batch 6, cumulative evidence, and final reinforced adjudication.");
add("pattern-no-systemic-blocker", patterns.aggregate_status === "POTENTIALLY_SYSTEMIC_WITHOUT_SYSTEMIC_BLOCKER" && patterns.systemic_blocker === false && !patterns.patterns.some((item) => item.status === "SYSTEMIC_BLOCKER"), "No class-wide unusability defect is established.");
add("saturation-final", saturation.primary_review_coverage === "216/216" && saturation.remaining_primary_review_required === 0 && saturation.patterns.length === 9 && saturation.patterns.every((item) => item.remediation_candidates.fixture_level && item.remediation_candidates.cluster_level && item.remediation_candidates.generator_or_template_level && item.remediation_candidates.schema_level && item.remediation_candidates.methodology_or_reference_level && item.fixture_remediation_executed === false), "Final saturation separates all five remediation scopes.");

add("aggregate-216-of-216", progress.primary_review.total_reviewed === 216 && progress.primary_review.remaining === 0 && progress.primary_review.dataset_total === 216 && progress.primary_review.batch_6 === 36 && progress.batch_progress.length === 6 && progress.unreviewed_fixture_ids.length === 0, "Aggregate primary review is 216/216 with zero remaining.");
add("aggregate-counts-exact", progress.cumulative_verdict_counts.AI_PASS === 93 && progress.cumulative_verdict_counts.AI_PASS_WITH_NOTE === 31 && progress.cumulative_verdict_counts.AI_FAIL_MINOR === 27 && progress.cumulative_verdict_counts.AI_FAIL_MAJOR === 60 && progress.cumulative_verdict_counts.AI_DISPUTED === 5 && progress.cumulative_severity_counts.NONE === 93 && progress.cumulative_severity_counts.LOW === 30 && progress.cumulative_severity_counts.MEDIUM === 29 && progress.cumulative_severity_counts.HIGH === 64 && progress.cumulative_severity_counts.CRITICAL === 0 && progress.cumulative_open_issues === 113 && progress.cumulative_disputed_issues === 9, "Cumulative verdict, severity, and issue counts are exact.");
const distributedUnresolvedIssues = Object.values(closure.unresolved_issue_distribution.dataset_types).reduce((total, count) => total + count, 0);
add("primary-closure-artifact", closure.primary_review_coverage.reviewed === 216 && closure.primary_review_coverage.remaining === 0 && closure.primary_review_closure_verdict === "PRIMARY_AI_REVIEW_COMPLETE_REINFORCED_REVIEW_REQUIRED" && closure.reinforced_review === "PENDING_NOT_EXECUTED" && closure.cumulative_reinforced_review_queue_count === 73 && Object.keys(closure.unresolved_issue_distribution).length === 5 && distributedUnresolvedIssues === closure.cumulative_open_issues + closure.cumulative_disputed_issues, "Primary closure contains coverage, cumulative statistics, exact unresolved-issue distributions, queue, systemic assessment, and verdict.");
add("closure-boundaries", closure.stage_status === "In Progress" && closure.release_readiness === "NOT_DECLARED" && closure.runtime_boundaries === "CLOSED" && Object.values(closure.forbidden_claims).every((value) => value === false), "Closure explicitly rejects release, production, Stage completion, human, and model-independent claims.");
add("next-candidate-bounded", summary.next_planning_candidate === "Stage 9 Reinforced AI Review and Cross-Batch Adjudication" && closure.next_allowed_planning_candidate === summary.next_planning_candidate, "Only the reinforced-review planning candidate is recorded.");

const generated = buildAllArtifacts();
const generatedFiles = { "selection.json": generated.selection, "blind-packets.json": generated.blind, "pass-a.json": generated.passA, "pass-b.json": generated.passB, "pass-c.json": generated.passC, "adjudication.json": generated.adjudication, "issue-ledger.json": generated.ledger, "reinforced-review-queue.json": generated.queue, "summary.json": generated.summary };
add("deterministic-serialization", artifactNames.every((name) => canonical(read("docs", "qa", "review", "ai-batches", "batch-6", name))) && canonical(read("docs", "qa", "review", "AI_REVIEW_PROGRESS.json")) && canonical(read("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json")) && canonical(read("docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json")) && canonical(read("docs", "qa", "review", "AI_REVIEW_PRIMARY_CLOSURE.json")), "All generated JSON uses canonical serialization.");
add("deterministic-regeneration", Object.entries(generatedFiles).every(([name, value]) => read("docs", "qa", "review", "ai-batches", "batch-6", name) === serialize(value)) && read("docs", "qa", "review", "AI_REVIEW_PROGRESS.json") === serialize(generated.progress) && read("docs", "qa", "review", "AI_REVIEW_PRIMARY_CLOSURE.json") === serialize(generated.closure), "Historical Batch 6 artifacts regenerate byte-identically; later reinforced aggregate state is append-only.");

const priorPaths = [1, 2, 3, 4, 5].flatMap((batch) => readdirSync(join(root, "docs", "qa", "review", "ai-batches", `batch-${batch}`)).filter((name) => name.endsWith(".json")).map((name) => `docs/qa/review/ai-batches/batch-${batch}/${name}`));
add("batches-1-5-byte-identical", priorPaths.every((path) => sha(readFileSync(join(root, path))) === sha(execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root }))), `All ${priorPaths.length} prior JSON artifacts match baseline SHA-256.`);
const fixtureDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime"], { cwd: root, encoding: "utf8" }).trim();
add("fixture-sources-unchanged", fixtureDiff === "", fixtureDiff || "Fixture sources unchanged.");
add("runtime-ui-api-unchanged", runtimeDiff === "", runtimeDiff || "Runtime/UI/API sources unchanged.");
add("mock-only-api-boundary", read("app", "api", "simulate", "route.ts").includes("mockOnly: true"), "/api/simulate remains mockOnly=true.");
add("network-zero", networkRequests === 0 && summary.network_request_count === 0 && progress.network_request_count === 0, `${networkRequests} network requests.`);
add("quality-script-registered", read("package.json").includes('"quality:stage-9-ai-review-batch-6": "node scripts/stage-9-ai-review-batch-6-quality.mjs"'), "Batch 6 gate is registered.");

const canonicalState = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((name) => read(name).slice(0, 8500)).join("\n");
add("canonical-state-primary-closure", canonicalState.includes("216 of 216") && canonicalState.includes("remaining primary review is 0") && canonicalState.includes("PRIMARY_AI_REVIEW_COMPLETE_REINFORCED_REVIEW_REQUIRED"), "Canonical state records primary closure only.");
add("canonical-stage-boundary", canonicalState.includes("Stage 9 remains **In Progress**") && canonicalState.includes("release readiness is not declared") && canonicalState.includes("reinforced review was not executed") && canonicalState.includes("runtime boundaries remain closed"), "Canonical state preserves Stage, release, review, and runtime boundaries.");

const allowed = new Set([
  "PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md", "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/review/AI_REVIEW_PROGRESS.json", "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json", "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json", "docs/qa/review/AI_REVIEW_PRIMARY_CLOSURE.json",
  ...artifactNames.map((name) => `docs/qa/review/ai-batches/batch-6/${name}`), "package.json", "scripts/generate-stage-9-ai-review-batch-6.mjs", "scripts/stage-9-ai-review-batch-6-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/stage-9-human-review-readiness-quality.mjs", "scripts/stage-9-ai-review-batch-1-quality.mjs", "scripts/stage-9-ai-review-batch-2-quality.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs", "scripts/stage-9-ai-review-batch-5-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
]);
for (const path of ["docs/qa/review/AI_REVIEW_CALIBRATION_ASSESSMENT.json", ...["selection.json", "blind-packets.json", "pass-r1.json", "pass-r2.json", "pass-r3.json", "adjudication.json", "issue-dispositions.json", "final-adjudication-queue.json", "summary.json"].map((name) => `docs/qa/review/ai-reinforced-batches/batch-2/${name}`), "scripts/generate-stage-9-reinforced-ai-review-batch-2.mjs", "scripts/stage-9-reinforced-ai-review-batch-2-quality.mjs"]) allowed.add(path);
for (const path of ["docs/qa/review/AI_REINFORCED_REVIEW_CLOSURE.json", "docs/qa/review/AI_REVIEW_FINAL_CALIBRATION_ASSESSMENT.json", "docs/qa/review/AI_REVIEW_FINAL_CROSS_BATCH_ADJUDICATION.json", "docs/qa/review/AI_REVIEW_FINAL_PATTERN_ADJUDICATION.json", "docs/qa/review/AI_REVIEW_REMEDIATION_CANDIDATE_REGISTRY.json", ...["selection.json", "blind-packets.json", "pass-r1.json", "pass-r2.json", "pass-r3.json", "adjudication.json", "issue-dispositions.json", "summary.json"].map((name) => `docs/qa/review/ai-reinforced-batches/batch-3/${name}`), "scripts/generate-stage-9-reinforced-ai-review-batch-3.mjs", "scripts/stage-9-reinforced-ai-review-batch-3-quality.mjs"]) allowed.add(path);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])].sort();
add("bounded-review-only-diff", diff.every((path) => allowed.has(path) || path.startsWith("docs/qa/review/ai-reinforced-batches/batch-1/") || ["docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md", "docs/qa/review/AI_REINFORCED_REVIEW_PROGRESS.json", "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json", "scripts/generate-stage-9-reinforced-ai-review-batch-1.mjs", "scripts/stage-9-reinforced-ai-review-batch-1-quality.mjs"].includes(path)), `Unexpected files: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

globalThis.fetch = originalFetch;
for (const check of checks) console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT selected=${ids.length} verdicts=${JSON.stringify(verdictCounts)} severities=${JSON.stringify(severityCounts)} issues=${ledger.issues.length} reinforced_batch=${queue.case_count} reinforced_cumulative=${progress.cumulative_reinforced_review_queue.length} primary_reviewed=216 remaining=0 network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
