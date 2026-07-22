import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FINAL_IDS, SELECTED_IDS, artifactHash, baseline, buildAllArtifacts, serialize, sourceHash } from "./generate-stage-9-reinforced-ai-review-batch-3.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const baselineBuffer = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root });
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });
let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { networkRequests += 1; throw new Error("Network access is forbidden by the Batch 3 gate."); };

const baseDir = ["docs", "qa", "review", "ai-reinforced-batches", "batch-3"];
const selection = json(...baseDir, "selection.json");
const blind = json(...baseDir, "blind-packets.json");
const r1 = json(...baseDir, "pass-r1.json");
const r2 = json(...baseDir, "pass-r2.json");
const r3 = json(...baseDir, "pass-r3.json");
const adjudication = json(...baseDir, "adjudication.json");
const dispositions = json(...baseDir, "issue-dispositions.json");
const summary = json(...baseDir, "summary.json");
const progress = json("docs", "qa", "review", "AI_REINFORCED_REVIEW_PROGRESS.json");
const consolidated = json("docs", "qa", "review", "AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json");
const calibration = json("docs", "qa", "review", "AI_REVIEW_CALIBRATION_ASSESSMENT.json");
const finalCalibration = json("docs", "qa", "review", "AI_REVIEW_FINAL_CALIBRATION_ASSESSMENT.json");
const finalAdjudication = json("docs", "qa", "review", "AI_REVIEW_FINAL_CROSS_BATCH_ADJUDICATION.json");
const finalPatterns = json("docs", "qa", "review", "AI_REVIEW_FINAL_PATTERN_ADJUDICATION.json");
const registry = json("docs", "qa", "review", "AI_REVIEW_REMEDIATION_CANDIDATE_REGISTRY.json");
const closure = json("docs", "qa", "review", "AI_REINFORCED_REVIEW_CLOSURE.json");
const patterns = json("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json");
const saturation = json("docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json");
const manifest = JSON.parse(baselineBuffer("docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json").toString("utf8"));
const entries = new Map(manifest.entries.map((entry) => [entry.fixture_id, entry]));

add("exact-canonical-selection", selection.selected_count === 24 && JSON.stringify(selection.fixtures.map((row) => row.fixture_id)) === JSON.stringify(SELECTED_IDS) && JSON.stringify(SELECTED_IDS) === JSON.stringify([
  "S9-CORE-008-ES", "S9-CORE-008-EN", "S9-CORE-008-RU", "S9-CORE-008-ZH",
  "S9-CORE-004-ES", "S9-CORE-004-EN", "S9-CORE-004-RU", "S9-CORE-004-ZH",
  "S9-CORE-020-ES", "S9-CORE-020-EN", "S9-CORE-020-RU", "S9-CORE-020-ZH",
  "S9-CORE-028-ES", "S9-CORE-028-EN", "S9-CORE-028-RU", "S9-CORE-028-ZH",
  "S9-CORE-032-ES", "S9-CORE-032-EN", "S9-CORE-032-RU", "S9-CORE-032-ZH",
  "S9-CORE-016-ES", "S9-CORE-016-EN", "S9-CORE-016-RU", "S9-CORE-016-ZH",
]), "Batch 3 equals the 24-entry canonical pending queue in order.");
add("coverage-arithmetic", progress.reinforced_review.batch_1 === 25 && progress.reinforced_review.batch_2 === 24 && progress.reinforced_review.batch_3 === 24 && progress.reinforced_review.completed === 73 && progress.reinforced_review.remaining === 0 && progress.reinforced_review.total === 73, "25 + 24 + 24 = 73; remaining 0.");
add("queue-unique-disjoint", progress.completed_fixture_ids.length === 73 && new Set(progress.completed_fixture_ids).size === 73 && progress.pending_queue.length === 0 && progress.duplicate_completed_pending_ids.length === 0 && FINAL_IDS.every((id) => !SELECTED_IDS.includes(id)), "No duplicate, overlap, or returned final-queue case.");

const blindKeys = JSON.stringify(blind.packets);
add("r1-blind", !/primary_verdict|primary_issue|expected_candidate|expected_decision|reinforced_outcome|pattern|final_adjudication/i.test(blindKeys), "R1 blind packet excludes primary, expected-reference, prior reinforced, pattern, and queue conclusions.");
add("r1-frozen", r1.immutable_input_packet.sha256 === artifactHash(blind), "R1 binds the frozen blind packet.");
add("r1-evidence-labels", r1.results.every((row) => ["EXPLICIT_FACT", "SUPPORTED_INFERENCE", "POSSIBLE_INTERPRETATION", "UNSUPPORTED_ASSERTION", "UNKNOWN"].every((label) => Object.hasOwn(row.reconstruction.evidence_classification, label)) && row.reconstruction.alternative_interpretations.length > 0), "R1 v2 labels evidence and records alternatives.");
add("r2-complete-evidence-chains", r2.primary_adjudication_conclusions_available === false && r2.results.every((row) => row.evidence_chains.length > 0 && row.evidence_chains.every((chain) => chain.exact_claim && chain.source_evidence && chain.expected_reference_evidence && chain.reasoning && chain.alternative_interpretation && ["CONFIRMED_DEFECT", "NO_DEFECT", "PARTIAL_DEFECT", "INSUFFICIENT_EVIDENCE"].includes(chain.evidence_verdict))), "Every primary issue has the required exact forensic chain.");
add("r2-binds-r1", r2.immutable_input_packet.some((row) => row.path.endsWith("pass-r1.json") && row.sha256 === artifactHash(r1)), "R2 binds frozen R1.");
add("r3-independent", r3.r2_available === false && !JSON.stringify(r3).includes("evidence_chains") && r3.results.every((row) => row.strongest_confirmation && row.strongest_rejection && row.residual_uncertainty !== undefined), "R3 does not receive R2 and records confirmation, rejection, and uncertainty.");
add("r4-calibration-adjusted", adjudication.methodology_adjustment === "calibration-adjusted-evidence-burden-v1" && adjudication.results.every((row) => row.calibration_impact && row.accepted_evidence.length && row.rejected_evidence.length && row.root_cause_category && row.recommended_remediation_scope), "R4 follows the adjusted evidence burden.");
add("hash-bound-passes", [["pass-r1.json", r1], ["pass-r2.json", r2], ["pass-r3.json", r3]].every(([name, value]) => adjudication.immutable_input_packet.some((row) => row.path.endsWith(name) && row.sha256 === artifactHash(value))), "R4 binds final R1/R2/R3 SHA-256 packets.");
const membership = (rows) => JSON.stringify(rows.map((row) => row.fixture_id)) === JSON.stringify(SELECTED_IDS);
add("all-passes-cover-selection", [blind.packets, r1.results, r2.results, r3.results, adjudication.results].every(membership), "R1-R4 preserve exact selection membership/order.");
add("source-hashes", [blind.packets, r1.results, r2.results, r3.results, adjudication.results].flat().every((row) => row.source_fixture_hash === sourceHash(entries.get(row.fixture_id))), "All 120 pass records bind immutable fixture hashes.");
add("role-context-isolation", [r1, r2, r3, adjudication].every((artifact) => artifact.context_isolation.review_session === "stage-9-reinforced-ai-review-batch-3" && artifact.context_isolation.model_independence === "not_claimed" && artifact.context_isolation.shared_model_confirmation_bias_risk === "APPLICABLE"), "All passes declare role/context isolation and shared-model risk.");

const selectedIssueIds = new Set();
for (let batch = 1; batch <= 6; batch += 1) for (const issue of JSON.parse(baselineBuffer(`docs/qa/review/ai-batches/batch-${batch}/issue-ledger.json`)).issues) if (SELECTED_IDS.includes(issue.fixture_id)) selectedIssueIds.add(issue.issue_id);
add("all-primary-claims-disposed", selectedIssueIds.size === 28 && dispositions.disposition_count === 28 && new Set(dispositions.dispositions.map((row) => row.primary_issue_id)).size === 28 && dispositions.dispositions.every((row) => selectedIssueIds.has(row.primary_issue_id)), "All 28 Batch 3 primary issue claims receive one append-only disposition.");
add("batch-3-exact-results", JSON.stringify(summary.reinforced_outcome_counts) === JSON.stringify({ REINFORCED_PASS: 0, REINFORCED_PASS_WITH_NOTE: 0, DEFECT_CONFIRMED_MINOR: 0, DEFECT_CONFIRMED_MAJOR: 24, PRIMARY_FINDING_REJECTED: 0, REMAINS_DISPUTED: 0, ESCALATED_CRITICAL: 0 }) && JSON.stringify(dispositions.counts) === JSON.stringify({ CONFIRMED: 27, REJECTED: 0, PARTIALLY_CONFIRMED: 1, REMAINS_DISPUTED: 0 }), "Batch 3 outcomes and issue dispositions are exact.");
add("calibration-adjustment-changed-outcome", dispositions.dispositions.some((row) => row.fixture_id === "S9-CORE-020-ES" && row.current_disposition === "PARTIALLY_CONFIRMED") && r3.results.find((row) => row.fixture_id === "S9-CORE-020-ES").counterargument_result === "PARTIALLY_REFUTES_PRIMARY_CLAIM", "R3 prevents automatic confirmation of the combined localization claim.");

add("final-adjudication-complete", finalAdjudication.queue_count === 8 && finalAdjudication.processed_count === 8 && finalAdjudication.remaining_count === 0 && JSON.stringify(finalAdjudication.results.map((row) => row.fixture_id)) === JSON.stringify(FINAL_IDS) && finalAdjudication.results.every((row) => row.exact_evidence_chain.length === 4 && row.accepted_interpretation && row.rejected_interpretation && row.unresolved_uncertainty && row.root_cause && row.remediation_scope && row.affected_fixtures.length && row.affected_cluster && row.final_issue_dispositions.length && row.reinforced_conclusion_automatically_confirmed === false), "All eight cases receive independent cross-batch adjudication.");
add("final-outcomes-exact", JSON.stringify(finalAdjudication.outcome_counts) === JSON.stringify({ FINAL_DEFECT_CONFIRMED_MAJOR: 0, FINAL_DEFECT_CONFIRMED_MINOR: 3, FINAL_PRIMARY_FINDING_REJECTED: 1, FINAL_PARTIALLY_CONFIRMED: 4, FINAL_UNRESOLVED: 0, FINAL_ESCALATED_CRITICAL: 0 }) && finalAdjudication.unresolved_final_cases.length === 0, "Final outcomes resolve the queue without critical or unresolved cases.");
add("final-queue-empty", progress.final_adjudication_queue.length === 0 && progress.final_adjudication.processed === 8 && progress.final_adjudication.remaining === 0, "No final queue entry remains unprocessed.");

add("consolidated-ledger", consolidated.reinforced_batch_1_disposition_count === 43 && consolidated.reinforced_batch_2_disposition_count === 30 && consolidated.reinforced_batch_3_disposition_count === 28 && consolidated.cumulative_reinforced_disposition_count === 101 && consolidated.dispositions.length === 101 && JSON.stringify(consolidated.cumulative_counts) === JSON.stringify({ CONFIRMED: 88, REJECTED: 4, PARTIALLY_CONFIRMED: 9, REMAINS_DISPUTED: 0 }), "Consolidated append-only ledger covers 101 claims and applies final overrides without deleting observations.");
add("calibration-arithmetic", JSON.stringify(calibration.final_issue_dispositions) === JSON.stringify({ CONFIRMED: 88, REJECTED: 4, PARTIALLY_CONFIRMED: 9, REMAINS_DISPUTED: 0 }) && calibration.primary_major_confirmation_rate.numerator === 60 && calibration.primary_major_confirmation_rate.denominator === 60 && calibration.false_positive_rate.numerator === 4 && calibration.false_positive_rate.denominator === 101 && calibration.dispute_rate.numerator === 0 && serialize(calibration) === serialize(finalCalibration), "Final calibration arithmetic is exact and the dedicated artifact matches.");
add("calibration-bounded", calibration.calibration_verdict === "AI_REVIEW_CALIBRATION_ACCEPTABLE_WITH_LIMITATIONS" && calibration.shared_model_confirmation_bias.probability === "MATERIAL" && calibration.shared_model_confirmation_bias.model_independence === "not_claimed" && calibration.internal_qa_only_not_release_verdict === true && calibration.methodology_infallibility_claimed === false, "Calibration retains shared-model and non-release limitations.");
add("final-patterns", finalPatterns.patterns.length === 9 && finalPatterns.patterns.every((row) => ["NOT_CONFIRMED", "ISOLATED", "RECURRING", "CONFIRMED_SYSTEMIC_REMEDIATION_REQUIRED", "SYSTEMIC_BLOCKER"].includes(row.current_qa_status) && row.primary_occurrences >= 0 && row.reinforced_reviewed_occurrences >= row.confirmed + row.rejected + row.partial + row.unresolved && row.root_cause_distribution && row.evidence_quality && row.recommended_remediation_scope) && finalPatterns.systemic_blocker_count === 0, "Nine final patterns reconcile to reinforced evidence without unsupported blocker claims.");
add("pattern-aggregates", patterns.reinforced_review_status === "73/73_COMPLETE" && saturation.reinforced_review_progress.completed === 73 && saturation.reinforced_review_progress.remaining === 0 && saturation.patterns.every((row) => row.final_reinforced_adjudication && row.fixture_remediation_executed === false), "Pattern registry and saturation include final evidence.");
add("remediation-registry", registry.status === "PLANNING_ONLY" && registry.implementation_executed === false && registry.fixture_remediation === "NONE" && registry.candidate_count === registry.candidates.length && registry.candidates.every((row) => row.candidate_id && row.root_cause && row.affected_fixtures.length && row.affected_clusters !== undefined && row.severity && row.confirmed_evidence && row.remediation_scope && Array.isArray(row.dependencies) && Number.isInteger(row.proposed_bounded_implementation_order) && row.regression_gates.length && row.status === "PLANNED_NOT_STARTED"), "Registry is complete and contains no executed changes.");
add("closure", closure.closure_verdict === "REINFORCED_AI_REVIEW_COMPLETE_REMEDIATION_REQUIRED" && closure.reinforced_review === "73/73" && closure.reinforced_remaining === 0 && closure.final_adjudication === "8/8" && closure.unresolved_final_cases.length === 0 && closure.fixture_remediation === "NONE" && closure.stage_status === "In Progress" && closure.release_readiness === "NOT_DECLARED", "Closure is bounded to review completion and remediation planning.");

const generated = buildAllArtifacts();
const batchFiles = { "selection.json": generated.selection, "blind-packets.json": generated.blind, "pass-r1.json": generated.r1, "pass-r2.json": generated.r2, "pass-r3.json": generated.r3, "adjudication.json": generated.adjudication, "issue-dispositions.json": generated.dispositions, "summary.json": generated.summary };
const rootFiles = { "AI_REINFORCED_REVIEW_PROGRESS.json": generated.progress, "AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json": generated.consolidated, "AI_REVIEW_CALIBRATION_ASSESSMENT.json": generated.calibration, "AI_REVIEW_FINAL_CALIBRATION_ASSESSMENT.json": generated.calibration, "AI_REVIEW_FINAL_CROSS_BATCH_ADJUDICATION.json": generated.finalAdjudication, "AI_REVIEW_FINAL_PATTERN_ADJUDICATION.json": generated.finalPatterns, "AI_REVIEW_REMEDIATION_CANDIDATE_REGISTRY.json": generated.registry, "AI_REINFORCED_REVIEW_CLOSURE.json": generated.closure, "AI_REVIEW_CROSS_BATCH_PATTERNS.json": generated.patterns, "AI_REVIEW_PATTERN_SATURATION.json": generated.saturation };
add("deterministic-regeneration", Object.entries(batchFiles).every(([name, value]) => read(...baseDir, name) === serialize(value)) && Object.entries(rootFiles).every(([name, value]) => read("docs", "qa", "review", name) === serialize(value)), "All Batch 3, final, and aggregate artifacts regenerate byte-identically.");

const historicalPaths = [
  ...[1, 2, 3, 4, 5, 6].flatMap((batch) => readdirSync(join(root, "docs", "qa", "review", "ai-batches", `batch-${batch}`)).filter((name) => name.endsWith(".json")).map((name) => `docs/qa/review/ai-batches/batch-${batch}/${name}`)),
  ...[1, 2].flatMap((batch) => readdirSync(join(root, "docs", "qa", "review", "ai-reinforced-batches", `batch-${batch}`)).filter((name) => name.endsWith(".json")).map((name) => `docs/qa/review/ai-reinforced-batches/batch-${batch}/${name}`)),
];
add("previous-artifacts-byte-identical", historicalPaths.every((path) => sha(readFileSync(join(root, path))) === sha(baselineBuffer(path))), `All ${historicalPaths.length} primary and Reinforced Batch 1-2 artifacts match baseline SHA-256.`);
const fixturePaths = ["lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"];
const fixtureDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", ...fixturePaths], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime"], { cwd: root, encoding: "utf8" }).trim();
add("fixtures-unchanged", fixtureDiff === "", fixtureDiff || "Fixture sources and manifest unchanged.");
add("runtime-ui-api-unchanged", runtimeDiff === "", runtimeDiff || "Runtime/UI/API unchanged.");
add("mock-only", read("app", "api", "simulate", "route.ts").includes("mockOnly: true"), "/api/simulate remains mockOnly=true.");
const canonical = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((name) => read(name)).join("\n");
add("canonical-state", canonical.includes("73/73") && canonical.includes("reinforced remaining: `0`") && canonical.includes("AI_REVIEW_CALIBRATION_ACCEPTABLE_WITH_LIMITATIONS") && canonical.includes("REINFORCED_AI_REVIEW_COMPLETE_REMEDIATION_REQUIRED") && canonical.includes("Stage 9 remains **In Progress**") && canonical.includes("release readiness is not declared") && canonical.includes("runtime boundaries remain closed"), "Canonical state records final reinforced closure without Stage 9/release closure.");
const currentCanonical = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((name) => read(name).slice(0, 2500)).join("\n");
const prohibited = [serialize(finalAdjudication), serialize(calibration), serialize(closure), currentCanonical].join("\n");
add("no-prohibited-claims", !/RELEASE_READY|PRODUCTION_READY|STAGE_9_COMPLETE|HUMAN_REVIEW_COMPLETE|MODEL_INDEPENDENT_REVIEW_COMPLETE|human-reviewed|model-independent review complete/i.test(prohibited), "No release, production, Stage 9, human, or model-independent completion claim.");
add("network-zero", networkRequests === 0 && summary.network_request_count === 0, `${networkRequests} network requests.`);
add("package-script", read("package.json").includes('"quality:stage-9-reinforced-ai-review-batch-3": "node scripts/stage-9-reinforced-ai-review-batch-3-quality.mjs"'), "Dedicated gate is registered.");

const allowed = new Set([
  "PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md", "package.json",
  "docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md",
  ...Object.keys(rootFiles).map((name) => `docs/qa/review/${name}`),
  ...Object.keys(batchFiles).map((name) => `docs/qa/review/ai-reinforced-batches/batch-3/${name}`),
  "scripts/generate-stage-9-reinforced-ai-review-batch-3.mjs", "scripts/stage-9-reinforced-ai-review-batch-3-quality.mjs",
  "scripts/stage-9-reinforced-ai-review-batch-1-quality.mjs", "scripts/stage-9-reinforced-ai-review-batch-2-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-ai-review-batch-1-quality.mjs", "scripts/stage-9-ai-review-batch-2-quality.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs", "scripts/stage-9-ai-review-batch-5-quality.mjs", "scripts/stage-9-ai-review-batch-6-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
]);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])];
add("bounded-diff", diff.every((path) => allowed.has(path)), `Unexpected: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

globalThis.fetch = originalFetch;
for (const check of checks) console[check.pass ? "log" : "error"](`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT selected=24 completed=73 remaining=0 batch_outcomes=${JSON.stringify(summary.reinforced_outcome_counts)} batch_dispositions=${JSON.stringify(dispositions.counts)} final_outcomes=${JSON.stringify(finalAdjudication.outcome_counts)} final_dispositions=${JSON.stringify(calibration.final_issue_dispositions)} calibration=${calibration.calibration_verdict} closure=${closure.closure_verdict} critical=0 network=${networkRequests}`);
console.log(`${checks.filter((item) => item.pass).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.pass)) process.exitCode = 1;
