import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PENDING_PRIORITY, SELECTED_IDS, baseline, buildAllArtifacts, serialize, sourceHash } from "./generate-stage-9-reinforced-ai-review-batch-2.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseDir = ["docs", "qa", "review", "ai-reinforced-batches", "batch-2"];
const names = ["selection.json", "blind-packets.json", "pass-r1.json", "pass-r2.json", "pass-r3.json", "adjudication.json", "issue-dispositions.json", "final-adjudication-queue.json", "summary.json"];
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const baselineBuffer = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root });
const artifactHash = (value) => sha(serialize(value));
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });
let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { networkRequests += 1; throw new Error("Network forbidden in reinforced review gate"); };

const selection = json(...baseDir, "selection.json");
const blind = json(...baseDir, "blind-packets.json");
const r1 = json(...baseDir, "pass-r1.json");
const r2 = json(...baseDir, "pass-r2.json");
const r3 = json(...baseDir, "pass-r3.json");
const adjudication = json(...baseDir, "adjudication.json");
const dispositions = json(...baseDir, "issue-dispositions.json");
const finalQueue = json(...baseDir, "final-adjudication-queue.json");
const summary = json(...baseDir, "summary.json");
const progress = json("docs", "qa", "review", "AI_REINFORCED_REVIEW_PROGRESS.json");
const consolidated = json("docs", "qa", "review", "AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json");
const calibration = json("docs", "qa", "review", "AI_REVIEW_CALIBRATION_ASSESSMENT.json");
const priorProgress = JSON.parse(execFileSync("git", ["show", `${baseline}:docs/qa/review/AI_REINFORCED_REVIEW_PROGRESS.json`], { cwd: root, encoding: "utf8" }));
const manifest = json("docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
const entries = new Map(manifest.entries.map((entry) => [entry.fixture_id, entry]));
const selectedSet = new Set(SELECTED_IDS);
const pendingBefore = new Set(priorProgress.pending_queue.map((item) => item.fixture_id));

add("exact-24-unique-selection", SELECTED_IDS.length === 24 && selectedSet.size === 24 && JSON.stringify(selection.fixtures.map((item) => item.fixture_id)) === JSON.stringify(SELECTED_IDS), "Exactly 24 unique fixtures in deterministic order.");
add("selection-from-remaining-48", priorProgress.pending_queue.length === 48 && SELECTED_IDS.every((id) => pendingBefore.has(id)), "Every selection ID belongs to the frozen 48-case pending queue.");
add("no-batch-1-overlap", SELECTED_IDS.every((id) => !priorProgress.completed_fixture_ids.includes(id)), "No Reinforced Batch 1 completed ID is selected.");
add("batch-1-final-queue-excluded", priorProgress.final_adjudication_queue.every((item) => !selectedSet.has(item.fixture_id)), "Batch 1 final-adjudication cases remain separate.");
add("priority-and-calibration-deterministic", JSON.stringify(SELECTED_IDS) === JSON.stringify([...PENDING_PRIORITY.filter((item) => item.safety_sensitive).map((item) => item.fixture_id), "S9-EVAL-006", "S9-MATERIAL-006", "S9-EVAL-002", "S9-EVAL-011", "S9-EVAL-012", "S9-CORE-002-EN", "S9-CORE-002-ES", "S9-CORE-002-RU", "S9-CORE-002-ZH", "S9-CORE-019-EN", "S9-CORE-019-ES", "S9-CORE-019-RU", "S9-CORE-019-ZH", "S9-CORE-010-EN", "S9-CORE-010-ES", "S9-CORE-010-RU", "S9-CORE-010-ZH"]), "Safety priority plus fixed calibration reservations regenerates exactly.");
add("calibration-coverage", selection.coverage.dataset_types.canonical_core === 19 && selection.coverage.dataset_types.synthetic_risk === 4 && selection.coverage.dataset_types.rich_decision_material_baseline === 1 && selection.coverage.calibration_non_major === 4 && selection.coverage.multilingual_clusters.length >= 5, JSON.stringify(selection.coverage));

const collectKeys = (value) => value && typeof value === "object" ? Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]) : [];
const blindKeys = collectKeys(blind.packets);
add("r1-blind", !blindKeys.some((key) => /primary_verdict|primary_issue|expected_behavior|risk_signals|preservation_expectations|pattern_registry|reinforced_review_reason|batch_1.*conclusion/i.test(key)), "R1 excludes primary, expected, pattern, queue, and Batch 1 conclusions.");
add("r1-frozen-packet", r1.immutable_input_packet.sha256 === artifactHash(blind), "R1 binds the frozen blind packet.");
add("r2-no-premature-primary-conclusions", r2.primary_adjudication_conclusions_available === false && r2.invalidation_rule.includes("invalidates R2"), "R2 completes evidence analysis without primary conclusions and declares invalidation semantics.");
add("r2-binds-r1", r2.immutable_input_packet.some((item) => item.path.endsWith("pass-r1.json") && item.sha256 === artifactHash(r1)), "R2 binds frozen R1.");
add("r3-independent-r2", r3.r2_available === false && !JSON.stringify(r3.results).includes("forensic_findings"), "R3 contains no R2 conclusions.");
add("r4-after-r1-r3", [["pass-r1.json", r1], ["pass-r2.json", r2], ["pass-r3.json", r3]].every(([name, value]) => adjudication.immutable_input_packet.some((item) => item.path.endsWith(name) && item.sha256 === artifactHash(value))), "R4 binds final R1/R2/R3 artifacts.");
const exactMembership = (rows) => JSON.stringify(rows.map((item) => item.fixture_id)) === JSON.stringify(SELECTED_IDS);
add("all-passes-cover-selection", [blind.packets, r1.results, r2.results, r3.results, adjudication.results].every(exactMembership), "R1-R4 preserve selection membership and order.");
add("source-hashes", [blind.packets, r1.results, r2.results, r3.results, adjudication.results].flat().every((item) => item.source_fixture_hash === sourceHash(entries.get(item.fixture_id))), "All 120 pass records bind current fixture hashes.");
add("role-and-context-isolation", [r1, r2, r3, adjudication].every((artifact) => artifact.context_isolation.review_session === "stage-9-reinforced-ai-review-batch-2" && artifact.context_isolation.independence_type === "new-context-and-role-isolated" && artifact.context_isolation.model_independence === "not_claimed" && artifact.context_isolation.model_id === "codex-current-session"), "All passes declare exact context isolation.");

const primaryIssueIds = new Set();
for (let batch = 1; batch <= 6; batch += 1) for (const issue of json("docs", "qa", "review", "ai-batches", `batch-${batch}`, "issue-ledger.json").issues) if (selectedSet.has(issue.fixture_id)) primaryIssueIds.add(issue.issue_id);
add("all-primary-issues-disposed", dispositions.disposition_count === 30 && dispositions.dispositions.length === primaryIssueIds.size && dispositions.dispositions.every((item) => primaryIssueIds.has(item.primary_issue_id)) && new Set(dispositions.dispositions.map((item) => item.primary_issue_id)).size === primaryIssueIds.size, "All 30 primary issue claims receive one append-only disposition.");
add("adjudication-contract", adjudication.results.every((item) => item.confidence >= 0 && item.confidence <= 1 && item.rationale && item.accepted_evidence && item.rejected_evidence && item.unresolved_evidence && item.confirmed_issue_codes && item.rejected_issue_codes && item.root_cause_category && item.recommended_remediation_scope && item.primary_verdict_disposition), "Every R4 result has complete evidence, root cause, scope, and primary disposition.");
add("batch-2-exact-counts", JSON.stringify(summary.reinforced_outcome_counts) === JSON.stringify({ REINFORCED_PASS: 0, REINFORCED_PASS_WITH_NOTE: 0, DEFECT_CONFIRMED_MINOR: 3, DEFECT_CONFIRMED_MAJOR: 20, PRIMARY_FINDING_REJECTED: 1, REMAINS_DISPUTED: 0, ESCALATED_CRITICAL: 0 }) && JSON.stringify(dispositions.counts) === JSON.stringify({ CONFIRMED: 26, REJECTED: 4, PARTIALLY_CONFIRMED: 0, REMAINS_DISPUTED: 0 }), "Batch 2 outcomes and issue dispositions are exact.");
add("root-cause-and-scope-complete", Object.values(summary.root_cause_distribution).reduce((a, b) => a + b, 0) === 24 && Object.values(summary.remediation_scope_distribution).reduce((a, b) => a + b, 0) === 24, "Root-cause and remediation distributions cover all 24 cases.");

add("batch-3-feasibility", progress.reinforced_review.completed === 73 && progress.reinforced_review.remaining === 0 && progress.pending_queue.length === 0 && progress.reinforced_review.batch_3 === 24, "The feasible 24-fixture Batch 3 is now complete; 73/73 reviewed.");
add("queue-disjointness", progress.completed_fixture_ids.length === 73 && new Set(progress.completed_fixture_ids).size === 73 && progress.pending_queue.length === 0 && progress.duplicate_completed_pending_ids.length === 0, "Completed and pending queues remain unique and disjoint.");
add("final-adjudication-queue", finalQueue.preserved_batch_1_count === 4 && finalQueue.batch_2_addition_count === 4 && finalQueue.case_count === 8 && progress.final_adjudication.processed === 8 && progress.final_adjudication.remaining === 0 && finalQueue.cases.every((item) => progress.final_adjudication.fixture_ids.includes(item.fixture_id)), "The eight historical final-queue cases are preserved and processed.");

const c = calibration.procedure_comparison.v1_batches_1_and_2;
add("calibration-arithmetic", Object.values(c).reduce((a, b) => a + b, 0) === 73 && c.CONFIRMED === 61 && c.REJECTED === 4 && c.REMAINS_DISPUTED === 8 && calibration.primary_major_confirmation_rate.numerator === 60 && calibration.primary_major_confirmation_rate.denominator === 60 && calibration.false_positive_rate.numerator === 4 && calibration.false_positive_rate.denominator === 101, "Final calibration preserves exact Batches 1-2 evidence and extends corpus arithmetic.");
add("calibration-verdict-bounded", calibration.calibration_verdict === "AI_REVIEW_CALIBRATION_ACCEPTABLE_WITH_LIMITATIONS" && calibration.internal_qa_only_not_release_verdict === true && calibration.shared_model_confirmation_bias.model_independence === "not_claimed" && calibration.methodology_infallibility_claimed === false, "Calibration remains internal QA and records shared-model confirmation-bias risk.");
add("consolidated-ledger", consolidated.cumulative_reinforced_disposition_count === 101 && consolidated.dispositions.length === 101 && consolidated.reinforced_batch_1_disposition_count === 43 && consolidated.reinforced_batch_2_disposition_count === 30 && consolidated.reinforced_batch_3_disposition_count === 28, "Consolidated append-only ledger preserves Batches 1-2 and adds Batch 3/final overlays.");

const generated = buildAllArtifacts();
const expectedFiles = { "selection.json": generated.selection, "blind-packets.json": generated.blind, "pass-r1.json": generated.r1, "pass-r2.json": generated.r2, "pass-r3.json": generated.r3, "adjudication.json": generated.adjudication, "issue-dispositions.json": generated.dispositions, "final-adjudication-queue.json": generated.finalQueue, "summary.json": generated.summary };
add("deterministic-regeneration", Object.entries(expectedFiles).every(([name, value]) => read(...baseDir, name) === serialize(value)), "Historical Batch 2 files regenerate byte-identically; later aggregate updates are append-only.");
const historicalPaths = [...[1, 2, 3, 4, 5, 6].flatMap((batch) => readdirSync(join(root, "docs", "qa", "review", "ai-batches", `batch-${batch}`)).filter((name) => name.endsWith(".json")).map((name) => `docs/qa/review/ai-batches/batch-${batch}/${name}`)), ...readdirSync(join(root, "docs", "qa", "review", "ai-reinforced-batches", "batch-1")).filter((name) => name.endsWith(".json")).map((name) => `docs/qa/review/ai-reinforced-batches/batch-1/${name}`)];
add("previous-artifacts-byte-identical", historicalPaths.every((path) => sha(readFileSync(join(root, path))) === sha(baselineBuffer(path))), `All ${historicalPaths.length} primary and Reinforced Batch 1 artifacts match baseline SHA-256.`);
const fixtureDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime"], { cwd: root, encoding: "utf8" }).trim();
add("fixtures-unchanged", fixtureDiff === "", fixtureDiff || "Fixture sources unchanged.");
add("runtime-ui-api-unchanged", runtimeDiff === "", runtimeDiff || "Runtime/UI/API unchanged.");
add("mock-only", read("app", "api", "simulate", "route.ts").includes("mockOnly: true"), "/api/simulate remains mockOnly=true.");
const canonical = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((name) => read(name).slice(0, 10000)).join("\n");
add("canonical-state", canonical.includes("49/73") && canonical.includes("24") && canonical.includes("PRIMARY_REVIEW_CALIBRATION_NEEDS_ADJUSTMENT") && canonical.includes("Stage 9 remains **In Progress**") && canonical.includes("release readiness is not declared") && canonical.includes("runtime boundaries remain closed"), "Canonical state records bounded Batch 2 progress.");
add("no-human-or-model-independent-claim", !/human-reviewed|model-independent review complete/i.test([JSON.stringify(selection), JSON.stringify(adjudication), JSON.stringify(calibration)].join("\n")), "No human or model-independent review claim.");
add("network-zero", networkRequests === 0 && summary.network_request_count === 0, `${networkRequests} network requests.`);
add("package-script", read("package.json").includes('"quality:stage-9-reinforced-ai-review-batch-2": "node scripts/stage-9-reinforced-ai-review-batch-2-quality.mjs"'), "Dedicated gate is registered.");

const allowed = new Set(["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md", "docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md", "docs/qa/review/AI_REINFORCED_REVIEW_PROGRESS.json", "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json", "docs/qa/review/AI_REVIEW_CALIBRATION_ASSESSMENT.json", "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json", "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json", ...names.map((name) => `docs/qa/review/ai-reinforced-batches/batch-2/${name}`), "package.json", "scripts/generate-stage-9-reinforced-ai-review-batch-2.mjs", "scripts/stage-9-reinforced-ai-review-batch-2-quality.mjs", "scripts/stage-9-reinforced-ai-review-batch-1-quality.mjs", "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/stage-9-human-review-readiness-quality.mjs", "scripts/stage-9-ai-review-batch-1-quality.mjs", "scripts/stage-9-ai-review-batch-2-quality.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs", "scripts/stage-9-ai-review-batch-5-quality.mjs", "scripts/stage-9-ai-review-batch-6-quality.mjs", "scripts/visual-migration-closure-quality.mjs"]);
for (const path of ["docs/qa/review/AI_REINFORCED_REVIEW_CLOSURE.json", "docs/qa/review/AI_REVIEW_FINAL_CALIBRATION_ASSESSMENT.json", "docs/qa/review/AI_REVIEW_FINAL_CROSS_BATCH_ADJUDICATION.json", "docs/qa/review/AI_REVIEW_FINAL_PATTERN_ADJUDICATION.json", "docs/qa/review/AI_REVIEW_REMEDIATION_CANDIDATE_REGISTRY.json", ...["selection.json", "blind-packets.json", "pass-r1.json", "pass-r2.json", "pass-r3.json", "adjudication.json", "issue-dispositions.json", "summary.json"].map((name) => `docs/qa/review/ai-reinforced-batches/batch-3/${name}`), "scripts/generate-stage-9-reinforced-ai-review-batch-3.mjs", "scripts/stage-9-reinforced-ai-review-batch-3-quality.mjs"]) allowed.add(path);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])];
add("bounded-diff", diff.every((path) => allowed.has(path)), `Unexpected: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

globalThis.fetch = originalFetch;
for (const check of checks) console[check.pass ? "log" : "error"](`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT selected=24 historical_completed=49 current_completed=73 current_remaining=0 outcomes=${JSON.stringify(summary.reinforced_outcome_counts)} dispositions=${JSON.stringify(dispositions.counts)} final_dispositions=${JSON.stringify(calibration.final_issue_dispositions)} final_queue=${finalQueue.case_count} calibration=${calibration.calibration_verdict} critical=${summary.critical_count} network=${networkRequests}`);
console.log(`${checks.filter((item) => item.pass).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.pass)) process.exitCode = 1;
