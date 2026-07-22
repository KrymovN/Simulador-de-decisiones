import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "eae42639c26445dd8ee8e437a6f73b31383c9c8b";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const baselineBuffer = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root });
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });
let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the Stage 9 remediation-plan gate.");
};

const baseDir = ["docs", "qa", "remediation", "stage-9"];
const registry = json(...baseDir, "AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json");
const graph = json(...baseDir, "AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json");
const sequence = json(...baseDir, "AI_REMEDIATION_SEQUENCE.v1.json");
const consolidated = json("docs", "qa", "review", "AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json");
const closure = json("docs", "qa", "review", "AI_REINFORCED_REVIEW_CLOSURE.json");
const oldRegistry = json("docs", "qa", "review", "AI_REVIEW_REMEDIATION_CANDIDATE_REGISTRY.json");

const expectedCandidateIds = [
  "S9-REM-SCHEMA-001",
  "S9-REM-EXPECTED-001",
  "S9-REM-EXPECTED-002",
  "S9-REM-EXPECTED-003",
  "S9-REM-GENERATOR-001",
  "S9-REM-CLUSTER-001",
  "S9-REM-FIXTURE-001",
  "S9-REM-FIXTURE-002",
];
const expectedSubstepIds = ["S9-FIX-01", "S9-FIX-02", "S9-FIX-03", "S9-FIX-04", "S9-FIX-05", "S9-FIX-06", "S9-FIX-07", "S9-FIX-08", "S9-FIX-09"];
const firstName = "Stage 9 Schema-Oracle Evidence Projection Revision";

add("baseline", baselineBuffer("package.json").length > 0, `Baseline ${baseline} is readable.`);
add("planning-only", sequence.status === "PLAN_ACCEPTED_IMPLEMENTATION_NOT_STARTED" && sequence.implementation_executed === false && sequence.fixture_remediation === "NONE" && registry.status === "PLANNING_ONLY" && registry.implementation_executed === false && registry.fixture_remediation === "NONE", "Plan and registry explicitly record no implementation or fixture remediation.");
add("versioned-registry", registry.artifact_version === "stage-9-remediation-candidate-registry.2" && registry.supersedes === "docs/qa/review/AI_REVIEW_REMEDIATION_CANDIDATE_REGISTRY.json" && oldRegistry.artifact_version === "stage-9-remediation-candidate-registry.1", "Registry v2 supersedes but does not replace frozen registry v1.");
add("candidate-set", registry.candidate_count === 8 && JSON.stringify(registry.candidates.map((row) => row.candidate_id)) === JSON.stringify(expectedCandidateIds), "All eight candidates are present in stable order.");
add("candidate-analysis-complete", registry.candidates.every((row) => row.root_cause && row.affected_dataset_types.length && row.affected_fixtures.length && Array.isArray(row.affected_clusters) && row.current_source_files.length && row.current_source_symbols.length && row.planned_write_files.length && row.exact_root && Array.isArray(row.dependencies) && row.downstream_dependents.length && typeof row.regeneration_required === "boolean" && typeof row.fixture_hash_update_required === "boolean" && row.fixture_hash_policy && row.required_artifact_updates.length && row.required_regression_gates.length && row.historical_reproducibility_risk && row.historical_risk_control && row.estimated_scope && row.single_commit_feasible === true && row.status === "PLANNED_NOT_STARTED"), "Every candidate has exact roots, scope, symbols, dependencies, regeneration/hash policy, gates, risk, estimate, and one-commit feasibility.");

const actionable = consolidated.dispositions.filter((row) => ["CONFIRMED", "PARTIALLY_CONFIRMED"].includes(row.final_current_disposition));
const actionableIds = actionable.map((row) => row.primary_issue_id).sort();
const ownedIds = registry.candidates.flatMap((row) => row.owned_issue_ids).sort();
add("actionable-arithmetic", actionable.length === 97 && registry.actionable_claim_count === 97 && new Set(actionableIds).size === 97, "88 confirmed plus 9 partial equals 97 unique actionable claims.");
add("unique-claim-ownership", ownedIds.length === 97 && new Set(ownedIds).size === 97 && JSON.stringify(ownedIds) === JSON.stringify(actionableIds), "Every actionable claim has exactly one owning candidate and none is lost or duplicated.");
const issueById = new Map(actionable.map((row) => [row.primary_issue_id, row]));
add("fixture-scope-contains-owned-claims", registry.candidates.every((candidate) => candidate.owned_issue_ids.every((id) => candidate.affected_fixtures.includes(issueById.get(id)?.fixture_id))), "Every owned claim fixture is inside its candidate's exact affected-fixture scope.");
add("v1-omission-remediated", ["B3-ISSUE-015", "B3-ISSUE-016", "B3-ISSUE-017", "B3-ISSUE-018", "B3-ISSUE-001"].every((id) => registry.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-003").owned_issue_ids.includes(id)), "Registry v2 restores the five actionable claims omitted from v1 candidate scope.");

add("sequence-exact", sequence.sequence.length === 9 && JSON.stringify(sequence.sequence.map((row) => row.substep_id)) === JSON.stringify(expectedSubstepIds) && sequence.sequence.every((row, index) => row.order === index + 1 && row.one_commit === true), "Nine bounded substeps are ordered and each has exactly one commit boundary.");
add("substep-contracts", sequence.sequence.every((row) => row.name && row.purpose && row.root_cause && Array.isArray(row.exact_candidate_scope) && Array.isArray(row.prerequisites) && row.source_artifacts.length && row.allowed_files.length && row.allowed_changes.length && row.forbidden_changes.length && row.expected_artifacts.length && row.gates.length && row.failure_criteria.length && row.completion_criteria.length && row.rollback_strategy && row.historical_artifact_impact && row.commit_message && Array.isArray(row.next_dependent_substeps)), "Every substep defines purpose, root cause, candidate scope, prerequisites, exact files, allowed/forbidden changes, artifacts, gates, failure/completion, rollback, commit message, next dependency, and historical impact.");
add("substep-commit-messages-unique", new Set(sequence.sequence.map((row) => row.commit_message)).size === 9 && sequence.sequence.every((row) => /^(fix|test|docs)\(stage-9\): /.test(row.commit_message)), "All nine one-commit messages are explicit, scoped, and unique.");
const candidateAssignments = sequence.sequence.flatMap((row) => row.exact_candidate_scope).sort();
add("candidate-assignment", candidateAssignments.length === 8 && new Set(candidateAssignments).size === 8 && JSON.stringify(candidateAssignments) === JSON.stringify([...expectedCandidateIds].sort()), "Every candidate is assigned to exactly one substep; integration and assessment own no candidate.");
add("single-first-candidate", sequence.selected_first_substep === "S9-FIX-01" && sequence.selected_first_substep_name === firstName && graph.selected_first_node === "S9-FIX-01" && sequence.sequence.filter((row) => row.substep_id === sequence.selected_first_substep).length === 1, `Exactly one first candidate is selected: ${firstName}.`);
add("first-is-bounded", JSON.stringify(sequence.sequence[0].exact_candidate_scope) === JSON.stringify(["S9-REM-SCHEMA-001"]) && sequence.sequence[0].forbidden_changes.some((value) => value.includes("Runtime schema")) && sequence.sequence[0].completion_criteria.some((value) => value.includes("six fixtures")), "First substep is limited to the six-fixture evidence projection and excludes runtime schema changes.");

const graphNodeIds = graph.nodes.map((row) => row.id);
const graphPosition = new Map(graph.topological_order.map((id, index) => [id, index]));
add("graph-node-set", graph.graph_type === "directed_acyclic_graph" && JSON.stringify(graphNodeIds) === JSON.stringify(expectedSubstepIds) && JSON.stringify(graph.topological_order) === JSON.stringify(expectedSubstepIds), "Dependency graph contains the exact nine nodes and declared topological order.");
add("graph-acyclic", graph.edges.every((edge) => graphNodeIds.includes(edge.from) && graphNodeIds.includes(edge.to) && graphPosition.get(edge.from) < graphPosition.get(edge.to) && edge.reason), "Every dependency edge is valid, reasoned, and forward in the topological order.");
add("regeneration-after-sources", ["S9-FIX-01", "S9-FIX-02", "S9-FIX-03", "S9-FIX-04", "S9-FIX-05", "S9-FIX-06", "S9-FIX-07"].every((id) => graph.edges.some((edge) => edge.from === id && edge.to === "S9-FIX-08")) && graph.edges.some((edge) => edge.from === "S9-FIX-08" && edge.to === "S9-FIX-09"), "All source/methodology fixes precede one regeneration, which precedes one full-corpus assessment.");
add("consolidation-justified", JSON.stringify(graph.consolidation.candidate_ids) === JSON.stringify(["S9-REM-EXPECTED-001", "S9-REM-CLUSTER-001"]) && graph.consolidation.substep_id === "S9-FIX-02" && graph.consolidation.justification.includes("zero independent CLUSTER_LOCALIZATION roots"), "Only the contradiction/cluster pair is consolidated, with final-evidence justification.");

const planText = read(...baseDir, "LEVIO_STAGE_9_REMEDIATION_SEQUENCING_PLAN.v1.md");
const specText = read(...baseDir, "STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_SPEC.v1.md");
const strategyText = read(...baseDir, "STAGE_9_POST_REMEDIATION_VALIDATION_STRATEGY.v1.md");
add("versioning-mechanism", planText.includes("case_version` from `1.0` to `1.1`") && planText.includes("AI_REMEDIATION_REVISION_LEDGER.json") && planText.includes("LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json") && planText.includes("append-only"), "Plan defines repository-compatible canonical and non-versioned fixture history.");
add("first-spec-complete", ["Purpose and exact defect", "Exact fixture and claim scope", "Allowed implementation", "Forbidden implementation", "Exact files", "Required tests and gate contract"].every((heading) => specText.includes(heading)) && ["S9-EVAL-006", "S9-EVAL-007", "S9-EVAL-009", "S9-EVAL-010", "S9-EVAL-011", "S9-EVAL-012"].every((id) => specText.includes(id)), "First implementation-ready spec has exact six-fixture scope, files, symbols, constraints, and tests.");
add("validation-strategy", strategyText.includes("full 216-fixture corpus assessment runs once") && strategyText.includes("only in S9-FIX-09") && strategyText.includes("97 actionable claims") && strategyText.includes("Targeted regression matrix"), "Validation strategy defines targeted regression after each fix and one final full-corpus assessment.");
add("release-boundary", sequence.release_boundary.stage_9_status_after_this_plan === "In Progress" && sequence.release_boundary.release_readiness_after_this_plan === "NOT_DECLARED" && sequence.release_boundary.runtime_integration === "CLOSED" && sequence.release_boundary.api_simulate_mock_only === true && sequence.release_boundary.next_release_candidate_separate === true && graph.release_candidate_is_graph_node === false, "Release readiness and runtime opening remain a separate future planning candidate.");

const historicalJsonPaths = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".json")) historicalJsonPaths.push(relative(root, path));
  }
};
walk(join(root, "docs", "qa", "review"));
add("historical-artifacts-byte-identical", historicalJsonPaths.every((path) => sha(readFileSync(join(root, path))) === sha(baselineBuffer(path))), `All ${historicalJsonPaths.length} tracked review JSON artifacts match baseline SHA-256.`);
add("legacy-manifest-byte-identical", sha(readFileSync(join(root, "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json"))) === sha(baselineBuffer("docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json")), "Legacy 216-entry manifest is byte-identical to the baseline.");
add("closure-preserved", closure.closure_verdict === "REINFORCED_AI_REVIEW_COMPLETE_REMEDIATION_REQUIRED" && closure.fixture_remediation === "NONE" && closure.stage_status === "In Progress" && closure.release_readiness === "NOT_DECLARED", "Final review closure remains unchanged and requires future remediation.");

const fixtureDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", "scripts/generate-stage-9-human-review-package.mjs"], { cwd: root, encoding: "utf8" }).trim();
const runtimeDiff = execFileSync("git", ["diff", "--name-only", baseline, "--", "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime"], { cwd: root, encoding: "utf8" }).trim();
add("remediation-sources-unchanged", fixtureDiff === "", fixtureDiff || "Schema/generator/fixture/expected-reference sources and legacy manifest are unchanged.");
add("runtime-ui-api-unchanged", runtimeDiff === "", runtimeDiff || "Runtime/UI/API/provider/persistence boundaries are unchanged.");
add("mock-only", read("app", "api", "simulate", "route.ts").includes("mockOnly: true"), "/api/simulate remains mockOnly=true.");

const canonicalFiles = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"];
const canonical = canonicalFiles.map((name) => read(name).slice(0, 5000)).join("\n");
const normalizeWhitespace = (value) => value.replace(/\s+/g, " ");
add("canonical-state", canonicalFiles.every((name) => normalizeWhitespace(read(name)).includes(firstName)) && canonical.includes("216/216") && canonical.includes("73/73") && canonical.includes("Stage 9 remains **In Progress**") && canonical.includes("release readiness is not declared") && canonical.includes("mockOnly=true"), "Canonical docs record the accepted sequence, exact first candidate, and closed boundaries.");
add("no-prohibited-completion-claim", !/RELEASE_READY|PRODUCTION_READY|STAGE_9_COMPLETE|HUMAN_REVIEW_COMPLETE|MODEL_INDEPENDENT_REVIEW_COMPLETE|human-reviewed|model-independent review complete/i.test(canonical), "Canonical current state makes no prohibited completion or independence claim.");
add("package-script", read("package.json").includes('"quality:stage-9-remediation-plan": "node scripts/stage-9-remediation-plan-quality.mjs"'), "Dedicated gate is registered.");

const allowed = new Set([
  ...canonicalFiles,
  "package.json",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-ai-review-batch-1-quality.mjs",
  "scripts/stage-9-ai-review-batch-2-quality.mjs",
  "scripts/stage-9-ai-review-batch-3-quality.mjs",
  "scripts/stage-9-ai-review-batch-4-quality.mjs",
  "scripts/stage-9-ai-review-batch-5-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/visual-migration-closure-quality.mjs",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json",
  "docs/qa/remediation/stage-9/LEVIO_STAGE_9_REMEDIATION_SEQUENCING_PLAN.v1.md",
  "docs/qa/remediation/stage-9/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_SPEC.v1.md",
  "docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_VALIDATION_STRATEGY.v1.md",
]);
const changed = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...changed, ...untracked])];
const exactPlanningDiff = diff.length === allowed.size && diff.every((path) => allowed.has(path));
add("bounded-diff", diff.length === 0 || exactPlanningDiff, `Unexpected: ${diff.filter((path) => !allowed.has(path)).join(", ") || "none"}; missing: ${diff.length === 0 ? "none (clean committed tree)" : [...allowed].filter((path) => !diff.includes(path)).join(", ") || "none"}.`);
add("network-zero", networkRequests === 0, `${networkRequests} network requests.`);

globalThis.fetch = originalFetch;
for (const check of checks) console[check.pass ? "log" : "error"](`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT plan=accepted candidates=8 actionable_claims=97 candidate_ownership=97/97 substeps=9 first=${JSON.stringify(firstName)} implementation=none fixture_remediation=NONE historical_artifacts=unchanged stage=In_Progress release=NOT_DECLARED mockOnly=true network=${networkRequests}`);
console.log(`${checks.filter((item) => item.pass).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.pass)) process.exitCode = 1;
