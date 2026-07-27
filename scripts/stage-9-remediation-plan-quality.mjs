import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "6b04c405a2a8aaba9e9c3e164413a9d954ee04af";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
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
const contradictionSpecText = read(...baseDir, "STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_SPEC.v1.md");
const highRiskSpecText = read(...baseDir, "STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_SPEC.v1.md");
const strategyText = read(...baseDir, "STAGE_9_POST_REMEDIATION_VALIDATION_STRATEGY.v1.md");
add("versioning-mechanism", planText.includes("case_version` from `1.0` to `1.1`") && planText.includes("AI_REMEDIATION_REVISION_LEDGER.json") && planText.includes("LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json") && planText.includes("append-only"), "Plan defines repository-compatible canonical and non-versioned fixture history.");
add("implementation-specs-complete", ["Purpose and exact defect", "Exact fixture and claim scope", "Allowed implementation", "Forbidden implementation", "Exact files", "Required tests and gate contract"].every((heading) => specText.includes(heading)) && ["S9-EVAL-006", "S9-EVAL-007", "S9-EVAL-009", "S9-EVAL-010", "S9-EVAL-011", "S9-EVAL-012"].every((id) => specText.includes(id)) && ["Purpose", "Exact ownership", "Dependency and order", "Exact implementation source", "Exact future implementation write allowlist", "Mandatory gates", "Acceptance criteria", "Prohibited scope", "Commit message and atomicity"].every((heading) => contradictionSpecText.includes(heading)), "The first and second implementation-ready specs have exact ownership, files, symbols, constraints, and tests.");
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

const fixtureDiff = execFileSync("git", ["diff", "--name-only", "HEAD", "--", "lib/ai-quality", "lib/ai-decision-material", "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", "scripts/generate-stage-9-human-review-package.mjs"], { cwd: root, encoding: "utf8" }).trim();
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
const normalizeRepoPath = (path) => path.replaceAll("\\", "/").replace(/^\.\//, "");
const changed = execFileSync("git", ["diff", "--name-only", "-z", "HEAD"], { cwd: root, encoding: "utf8" })
  .split("\0").filter(Boolean).map(normalizeRepoPath);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0").filter(Boolean).map(normalizeRepoPath);
const diff = [...new Set([...changed, ...untracked])].sort();
const repositoryPathCollectionValid = [...changed, ...untracked].every((path) =>
  path && !path.startsWith("/") && path === normalizeRepoPath(path) && !path.startsWith(".git/"));
const exactPlanningDiff = diff.length === allowed.size && diff.every((path) => allowed.has(path));
const qualityControlProfileAllowed = [
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
].sort();
const s9Fix02ImplementationAllowlist = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-systemic-contradiction-reference-quality.mjs",
  "package.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json",
  "PROJECT_CONTEXT.md",
];
const s9Fix02ResultArtifact = "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json";
const s9Fix03ImplementationAllowlist = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-high-risk-reference-quality.mjs",
  "package.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json",
  "PROJECT_CONTEXT.md",
];
const s9Fix03ResultArtifact = "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json";
const s9Fix02StatusHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const revisionIntegrityScriptPath = join(
  root,
  "scripts",
  "stage-9-remediation-revision-integrity-quality.mjs",
);

function runRevisionIntegritySelfTest() {
  const result = spawnSync(
    process.execPath,
    [revisionIntegrityScriptPath, "--self-test-json"],
    { cwd: root, encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error.message ?? result.error) : null,
  };
}

function parseSelfTestContract(run) {
  if (run.error || run.status !== 0 || run.stderr !== "") return null;
  try {
    return JSON.parse(run.stdout);
  } catch {
    return null;
  }
}

function validSelfTestContract(contract) {
  return contract?.profile === "S9-FIX-02_AND_S9-FIX-03_PROSPECTIVE_APPEND_ONLY"
    && contract.positive_profile?.passed === true
    && contract.committed_baseline?.passed === true
    && contract.prospective_profiles?.["S9-FIX-02"]?.passed === true
    && contract.prospective_profiles?.["S9-FIX-03"]?.passed === true
    && contract.routing_regressions?.total === 5
    && contract.routing_regressions?.passed === 5
    && Array.isArray(contract.routing_regressions?.failed)
    && contract.routing_regressions.failed.length === 0
    && contract.negative_cases?.total === 28
    && contract.negative_cases?.passed === 28
    && Array.isArray(contract.negative_cases?.failed)
    && contract.negative_cases.failed.length === 0
    && same(contract.closed_profile?.supported_substeps, ["S9-FIX-02", "S9-FIX-03"])
    && contract.closed_profile?.future_event_wildcard === false
    && same(contract.closed_profile?.implementation_allowlist, s9Fix02ImplementationAllowlist)
    && contract.closed_profile?.result_artifact_path === s9Fix02ResultArtifact
    && contract.closed_profile?.project_context_section === s9Fix02StatusHeading
    && same(
      contract.closed_profile?.prospective_profiles?.["S9-FIX-02"]?.implementation_allowlist,
      s9Fix02ImplementationAllowlist,
    )
    && contract.closed_profile?.prospective_profiles?.["S9-FIX-02"]?.result_artifact_path
      === s9Fix02ResultArtifact
    && same(
      contract.closed_profile?.prospective_profiles?.["S9-FIX-03"]?.implementation_allowlist,
      s9Fix03ImplementationAllowlist,
    )
    && contract.closed_profile?.prospective_profiles?.["S9-FIX-03"]?.result_artifact_path
      === s9Fix03ResultArtifact
    && contract.baseline_invariants?.s9_fix_01_event_boundary_preserved === true
    && contract.baseline_invariants?.s9_fix_02_event_boundary_preserved === true
    && contract.baseline_invariants?.revision_count === 6
    && contract.baseline_invariants?.mapping_order_preserved === true
    && contract.baseline_invariants?.hash_chain_preserved === true
    && contract.baseline_invariants?.result_integrity_preserved === true
    && contract.deterministic === true
    && contract.network_request_count === 0;
}

function qualityControlProfileSemantics({
  candidateDiff,
  selfTestRuns,
  collectionValid = true,
  canonicalContractsChanged = false,
}) {
  const normalizedCandidateDiff = [...new Set(candidateDiff.map(normalizeRepoPath))].sort();
  const exactDiff = collectionValid
    && same(normalizedCandidateDiff, qualityControlProfileAllowed)
    && candidateDiff.every((path) =>
      path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
  const parsedContracts = selfTestRuns.map(parseSelfTestContract);
  const selfTestValid = parsedContracts.length === 2
    && parsedContracts.every(validSelfTestContract)
    && selfTestRuns[0].stdout === selfTestRuns[1].stdout;
  return exactDiff && selfTestValid && !canonicalContractsChanged;
}

const selfTestRuns = [
  runRevisionIntegritySelfTest(),
  runRevisionIntegritySelfTest(),
];
const actualSelfTestContract = parseSelfTestContract(selfTestRuns[0]);
const fixtureSelfTestContract = structuredClone(actualSelfTestContract ?? {
  profile: "S9-FIX-02_AND_S9-FIX-03_PROSPECTIVE_APPEND_ONLY",
  positive_profile: { passed: true },
  committed_baseline: { passed: true },
  prospective_profiles: {
    "S9-FIX-02": { passed: true },
    "S9-FIX-03": { passed: true },
  },
  routing_regressions: { total: 5, passed: 5, failed: [] },
  negative_cases: { total: 28, passed: 28, failed: [] },
  closed_profile: {
    supported_substeps: ["S9-FIX-02", "S9-FIX-03"],
    future_event_wildcard: false,
    implementation_allowlist: s9Fix02ImplementationAllowlist,
    result_artifact_path: s9Fix02ResultArtifact,
    project_context_section: s9Fix02StatusHeading,
    prospective_profiles: {
      "S9-FIX-02": {
        implementation_allowlist: s9Fix02ImplementationAllowlist,
        result_artifact_path: s9Fix02ResultArtifact,
      },
      "S9-FIX-03": {
        implementation_allowlist: s9Fix03ImplementationAllowlist,
        result_artifact_path: s9Fix03ResultArtifact,
      },
    },
  },
  baseline_invariants: {
    s9_fix_01_event_boundary_preserved: true,
    s9_fix_02_event_boundary_preserved: true,
    revision_count: 6,
    mapping_order_preserved: true,
    hash_chain_preserved: true,
    result_integrity_preserved: true,
  },
  deterministic: true,
  network_request_count: 0,
});
const selfTestRun = (contract = fixtureSelfTestContract, status = 0) => ({
  status,
  stdout: `${JSON.stringify(contract, null, 2)}\n`,
  stderr: "",
  error: null,
});
const mutateSelfTest = (mutator) => {
  const copy = structuredClone(fixtureSelfTestContract);
  mutator(copy);
  return copy;
};
const planningProfileNegativeResults = [
  ["missing-revision-integrity-script", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed.filter((path) =>
      path !== "scripts/stage-9-remediation-revision-integrity-quality.mjs"),
    selfTestRuns: [selfTestRun(), selfTestRun()],
  })],
  ["missing-planning-gate", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed.filter((path) =>
      path !== "scripts/stage-9-remediation-plan-quality.mjs"),
    selfTestRuns: [selfTestRun(), selfTestRun()],
  })],
  ["third-tracked-file", qualityControlProfileSemantics({
    candidateDiff: [...qualityControlProfileAllowed, "third-tracked.file"],
    selfTestRuns: [selfTestRun(), selfTestRun()],
  })],
  ["unrelated-untracked-file", qualityControlProfileSemantics({
    candidateDiff: [...qualityControlProfileAllowed, "unrelated-untracked.file"],
    selfTestRuns: [selfTestRun(), selfTestRun()],
  })],
  ["malformed-self-test-json", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [
      { status: 0, stdout: "{malformed", stderr: "", error: null },
      selfTestRun(),
    ],
  })],
  ["self-test-nonzero-exit", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(fixtureSelfTestContract, 1), selfTestRun()],
  })],
  ["positive-profile-false", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.positive_profile.passed = false;
    })), selfTestRun()],
  })],
  ["negative-total-not-twenty-eight", [
    27,
    29,
  ].every((total) => !qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.negative_cases.total = total;
    })), selfTestRun()],
  }))],
  ["negative-passed-less-than-twenty-eight", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.negative_cases.passed = 27;
    })), selfTestRun()],
  })],
  ["failed-list-not-empty", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.negative_cases.failed = ["forced-failure"];
    })), selfTestRun()],
  })],
  ["future-event-wildcard", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.closed_profile.future_event_wildcard = true;
    })), selfTestRun()],
  })],
  ["canonical-contract-change", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(), selfTestRun()],
    canonicalContractsChanged: true,
  })],
  ["missing-s9-fix-03", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.closed_profile.supported_substeps = ["S9-FIX-02"];
      delete value.closed_profile.prospective_profiles["S9-FIX-03"];
    })), selfTestRun()],
  })],
  ["committed-baseline-false", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.committed_baseline.passed = false;
    })), selfTestRun()],
  })],
  ["s9-fix-02-prospective-false", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.prospective_profiles["S9-FIX-02"].passed = false;
    })), selfTestRun()],
  })],
  ["s9-fix-03-prospective-false", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.prospective_profiles["S9-FIX-03"].passed = false;
    })), selfTestRun()],
  })],
  ["routing-regression-failed", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.routing_regressions.passed = 4;
      value.routing_regressions.failed = ["forced-routing-failure"];
    })), selfTestRun()],
  })],
  ["s9-fix-03-allowlist-weakened", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.closed_profile.prospective_profiles["S9-FIX-03"].implementation_allowlist.push("wildcard.file");
    })), selfTestRun()],
  })],
  ["s9-fix-03-result-path-weakened", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.closed_profile.prospective_profiles["S9-FIX-03"].result_artifact_path =
        s9Fix02ResultArtifact;
    })), selfTestRun()],
  })],
  ["s9-fix-02-boundary-weakened", qualityControlProfileSemantics({
    candidateDiff: qualityControlProfileAllowed,
    selfTestRuns: [selfTestRun(mutateSelfTest((value) => {
      value.baseline_invariants.s9_fix_02_event_boundary_preserved = false;
    })), selfTestRun()],
  })],
];
const planningProfileNegativeChecksPass =
  planningProfileNegativeResults.length === 20
  && planningProfileNegativeResults.every(([id, accepted]) =>
    id === "negative-total-not-twenty-eight" ? accepted === true : accepted === false);
const exactQualityControlProfile = qualityControlProfileSemantics({
  candidateDiff: diff,
  selfTestRuns,
  collectionValid: repositoryPathCollectionValid,
}) && planningProfileNegativeChecksPass;
const coverageQualityControlAllowed = [
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
].sort();
const coverageScriptPath = join(
  root,
  "scripts",
  "stage-9-offline-dataset-coverage-quality.mjs",
);
const expectedVersionedClusters = [
  "S9-CLUSTER-004",
  "S9-CLUSTER-008",
  "S9-CLUSTER-016",
  "S9-CLUSTER-020",
  "S9-CLUSTER-024",
  "S9-CLUSTER-028",
  "S9-CLUSTER-032",
  "S9-CLUSTER-036",
];
const expectedS9Fix03VersionedCases = [
  "S9-CORE-012-ES",
  "S9-CORE-012-EN",
  "S9-CORE-012-RU",
  "S9-CORE-012-ZH",
  "S9-CORE-036-ZH",
  "S9-CORE-037-ES",
  "S9-CORE-037-EN",
  "S9-CORE-037-RU",
  "S9-CORE-037-ZH",
  "S9-CORE-038-ES",
  "S9-CORE-038-EN",
  "S9-CORE-038-RU",
  "S9-CORE-038-ZH",
  "S9-CORE-040-ES",
  "S9-CORE-040-EN",
  "S9-CORE-040-RU",
  "S9-CORE-040-ZH",
];
const expectedS9Fix03VersionedClusters = [
  "S9-CLUSTER-012",
  "S9-CLUSTER-036",
  "S9-CLUSTER-037",
  "S9-CLUSTER-038",
  "S9-CLUSTER-040",
];

function runCoverageCaseVersionSelfTest() {
  const result = spawnSync(
    process.execPath,
    [coverageScriptPath, "--case-version-self-test-json"],
    { cwd: root, encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error.message ?? result.error) : null,
  };
}

function parseCoverageSelfTest(run) {
  if (run.error || run.status !== 0 || run.stderr !== "") return null;
  try {
    return JSON.parse(run.stdout);
  } catch {
    return null;
  }
}

function validCoverageSelfTest(contract) {
  return contract?.profile === "S9_FIX_02_AND_S9_FIX_03_CASE_VERSION_VALIDATION"
    && same(contract.supported_versions, ["1.0", "1.1"])
    && contract.version_1_1_scopes?.["S9-FIX-02"]?.eligible_case_count === 32
    && same(
      contract.version_1_1_scopes?.["S9-FIX-02"]?.eligible_cluster_ids,
      expectedVersionedClusters,
    )
    && contract.version_1_1_scopes?.["S9-FIX-03"]?.eligible_case_count === 17
    && same(
      contract.version_1_1_scopes?.["S9-FIX-03"]?.eligible_case_ids,
      expectedS9Fix03VersionedCases,
    )
    && same(
      contract.version_1_1_scopes?.["S9-FIX-03"]?.eligible_cluster_ids,
      expectedS9Fix03VersionedClusters,
    )
    && contract.committed_baseline?.passed === true
    && contract.committed_baseline?.case_count === 160
    && contract.prospective_profiles?.["S9-FIX-02"]?.passed === true
    && contract.prospective_profiles?.["S9-FIX-02"]?.eligible_case_count === 32
    && contract.prospective_profiles?.["S9-FIX-03"]?.passed === true
    && contract.prospective_profiles?.["S9-FIX-03"]?.eligible_case_count === 17
    && contract.prospective_profiles?.["S9-FIX-03"]?.newly_versioned_case_count === 16
    && contract.mixed_approved_versions?.passed === true
    && contract.mixed_approved_versions?.eligible_case_count === 48
    && contract.positive_cases?.total === 10
    && contract.positive_cases?.passed === 10
    && Array.isArray(contract.positive_cases?.failed)
    && contract.positive_cases.failed.length === 0
    && contract.negative_cases?.total === 14
    && contract.negative_cases?.passed === 14
    && Array.isArray(contract.negative_cases?.failed)
    && contract.negative_cases.failed.length === 0
    && contract.coverage_invariants_preserved === true
    && contract.arbitrary_version_wildcard === false
    && contract.deterministic === true
    && contract.network_request_count === 0;
}

function coverageQualityControlProfileSemantics({
  candidateDiff,
  candidateSelfTestRuns,
  collectionValid = true,
  canonicalContractsChanged = false,
}) {
  const normalizedCandidateDiff = [...new Set(candidateDiff.map(normalizeRepoPath))].sort();
  const exactDiff = collectionValid
    && same(normalizedCandidateDiff, coverageQualityControlAllowed)
    && candidateDiff.every((path) =>
      path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
  const parsedContracts = candidateSelfTestRuns.map(parseCoverageSelfTest);
  const selfTestValid = parsedContracts.length === 2
    && parsedContracts.every(validCoverageSelfTest)
    && candidateSelfTestRuns[0].stdout === candidateSelfTestRuns[1].stdout;
  return exactDiff && selfTestValid && !canonicalContractsChanged;
}

const coverageSelfTestRuns = [
  runCoverageCaseVersionSelfTest(),
  runCoverageCaseVersionSelfTest(),
];
const actualCoverageSelfTestContract = parseCoverageSelfTest(coverageSelfTestRuns[0]);
const fixtureCoverageSelfTestContract = structuredClone(actualCoverageSelfTestContract ?? {
  profile: "S9_FIX_02_AND_S9_FIX_03_CASE_VERSION_VALIDATION",
  supported_versions: ["1.0", "1.1"],
  version_1_1_scopes: {
    "S9-FIX-02": {
      eligible_case_count: 32,
      eligible_cluster_ids: expectedVersionedClusters,
    },
    "S9-FIX-03": {
      eligible_case_count: 17,
      eligible_case_ids: expectedS9Fix03VersionedCases,
      eligible_cluster_ids: expectedS9Fix03VersionedClusters,
    },
  },
  committed_baseline: { passed: true, case_count: 160 },
  prospective_profiles: {
    "S9-FIX-02": { passed: true, eligible_case_count: 32 },
    "S9-FIX-03": { passed: true, eligible_case_count: 17, newly_versioned_case_count: 16 },
  },
  mixed_approved_versions: { passed: true, eligible_case_count: 48 },
  positive_cases: { total: 10, passed: 10, failed: [] },
  negative_cases: { total: 14, passed: 14, failed: [] },
  coverage_invariants_preserved: true,
  arbitrary_version_wildcard: false,
  deterministic: true,
  network_request_count: 0,
});
const coverageSelfTestRun = (contract = fixtureCoverageSelfTestContract, status = 0) => ({
  status,
  stdout: `${JSON.stringify(contract, null, 2)}\n`,
  stderr: "",
  error: null,
});
const coverageSelfTestPair = (contract = fixtureCoverageSelfTestContract, status = 0) => [
  coverageSelfTestRun(contract, status),
  coverageSelfTestRun(contract, status),
];
const mutateCoverageSelfTest = (mutator) => {
  const copy = structuredClone(fixtureCoverageSelfTestContract);
  mutator(copy);
  return copy;
};
const coveragePlanningNegativeResults = [
  ["missing-coverage-script", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed.filter((path) =>
      path !== "scripts/stage-9-offline-dataset-coverage-quality.mjs"),
    candidateSelfTestRuns: coverageSelfTestPair(),
  })],
  ["missing-planning-gate", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed.filter((path) =>
      path !== "scripts/stage-9-remediation-plan-quality.mjs"),
    candidateSelfTestRuns: coverageSelfTestPair(),
  })],
  ["unrelated-file", !coverageQualityControlProfileSemantics({
    candidateDiff: [...coverageQualityControlAllowed, "unrelated.file"],
    candidateSelfTestRuns: coverageSelfTestPair(),
  })],
  ["fixtures-change", !coverageQualityControlProfileSemantics({
    candidateDiff: [...coverageQualityControlAllowed, "lib/ai-decision-material/fixtures.ts"],
    candidateSelfTestRuns: coverageSelfTestPair(),
  })],
  ["package-change", !coverageQualityControlProfileSemantics({
    candidateDiff: [...coverageQualityControlAllowed, "package.json"],
    candidateSelfTestRuns: coverageSelfTestPair(),
  })],
  ["canonical-contract-change", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(),
    canonicalContractsChanged: true,
  })],
  ["arbitrary-version-wildcard", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(mutateCoverageSelfTest((value) => {
      value.arbitrary_version_wildcard = true;
    })),
  })],
  ["version-1.0-support-removed", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(mutateCoverageSelfTest((value) => {
      value.supported_versions = ["1.1"];
    })),
  })],
  ["version-1.1-support-missing", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(mutateCoverageSelfTest((value) => {
      value.supported_versions = ["1.0"];
    })),
  })],
  ["negative-version-tests-missing", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(mutateCoverageSelfTest((value) => {
      value.negative_cases.total = 13;
      value.negative_cases.passed = 13;
    })),
  })],
  ["s9-fix-03-versioned-scope-weakened", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(mutateCoverageSelfTest((value) => {
      value.version_1_1_scopes["S9-FIX-03"].eligible_case_ids.pop();
      value.version_1_1_scopes["S9-FIX-03"].eligible_case_count = 16;
    })),
  })],
  ["unrelated-versioned-row-accepted", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(mutateCoverageSelfTest((value) => {
      value.mixed_approved_versions.eligible_case_count = 49;
    })),
  })],
  ["coverage-invariants-changed", !coverageQualityControlProfileSemantics({
    candidateDiff: coverageQualityControlAllowed,
    candidateSelfTestRuns: coverageSelfTestPair(mutateCoverageSelfTest((value) => {
      value.coverage_invariants_preserved = false;
    })),
  })],
  ["malformed-or-nonzero-self-test", [
    !coverageQualityControlProfileSemantics({
      candidateDiff: coverageQualityControlAllowed,
      candidateSelfTestRuns: [
        { status: 0, stdout: "{malformed", stderr: "", error: null },
        { status: 0, stdout: "{malformed", stderr: "", error: null },
      ],
    }),
    !coverageQualityControlProfileSemantics({
      candidateDiff: coverageQualityControlAllowed,
      candidateSelfTestRuns: coverageSelfTestPair(fixtureCoverageSelfTestContract, 1),
    }),
  ].every(Boolean)],
];
const coveragePlanningNegativeChecksPass =
  coveragePlanningNegativeResults.length === 14
  && coveragePlanningNegativeResults.every(([, rejected]) => rejected);
const exactCoverageQualityControlProfile = coverageQualityControlProfileSemantics({
  candidateDiff: diff,
  candidateSelfTestRuns: coverageSelfTestRuns,
  collectionValid: repositoryPathCollectionValid,
}) && coveragePlanningNegativeChecksPass;
const aiValueQualityControlAllowed = [
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
].sort();
const aiValueScriptPath = join(root, "scripts", "stage-9-ai-value-preservation-quality.mjs");
const expectedAiValueProspectivePaths = [
  "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json",
  "lib/ai-decision-material/fixtures.ts",
  "package.json",
  "scripts/stage-9-high-risk-reference-quality.mjs",
].sort();
const expectedAiValueStatusHeading =
  "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";

function runAiValueSelfTest() {
  const result = spawnSync(
    process.execPath,
    [aiValueScriptPath, "--s9-fix-03-profile-self-test-json"],
    { cwd: root, encoding: "utf8" },
  );
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error.message ?? result.error) : null,
  };
}

function parseAiValueSelfTest(run) {
  if (run.error || run.status !== 0 || run.stderr !== "") return null;
  try {
    return JSON.parse(run.stdout);
  } catch {
    return null;
  }
}

function validAiValueSelfTest(contract) {
  return contract?.profile === "S9_FIX_03_AI_VALUE_PRESERVATION"
    && contract.baseline_commit === "4f3a780819633cb60bc97de1de748286d92ff139"
    && contract.committed_baseline?.passed === true
    && contract.prospective_profile?.substep_id === "S9-FIX-03"
    && contract.prospective_profile?.passed === true
    && same(contract.prospective_profile?.required_paths, expectedAiValueProspectivePaths)
    && contract.prospective_profile?.optional_status_path === "PROJECT_CONTEXT.md"
    && contract.prospective_profile?.allowed_status_heading === expectedAiValueStatusHeading
    && contract.semantic_checks?.total === 35
    && contract.semantic_checks?.passed === 35
    && contract.semantic_checks?.all_passed === true
    && contract.diff_checks?.git_diff_bounded === true
    && contract.diff_checks?.no_production_diff === true
    && contract.diff_checks?.historical_boundary === true
    && contract.negative_cases?.total === 10
    && contract.negative_cases?.passed === 10
    && Array.isArray(contract.negative_cases?.failed)
    && contract.negative_cases.failed.length === 0
    && contract.future_wildcard === false
    && contract.network_provider_count === 0
    && contract.deterministic === true;
}

function aiValueQualityControlProfileSemantics({
  candidateDiff,
  candidateSelfTestRuns,
  collectionValid = true,
}) {
  const normalizedCandidateDiff = [...new Set(candidateDiff.map(normalizeRepoPath))].sort();
  const exactDiff = collectionValid
    && same(normalizedCandidateDiff, aiValueQualityControlAllowed)
    && candidateDiff.every((path) =>
      path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
  const contracts = candidateSelfTestRuns.map(parseAiValueSelfTest);
  return exactDiff
    && contracts.length === 2
    && contracts.every(validAiValueSelfTest)
    && candidateSelfTestRuns[0].stdout === candidateSelfTestRuns[1].stdout;
}

const aiValueSelfTestRuns = [runAiValueSelfTest(), runAiValueSelfTest()];
const actualAiValueSelfTestContract = parseAiValueSelfTest(aiValueSelfTestRuns[0]);
const fixtureAiValueSelfTestContract = structuredClone(actualAiValueSelfTestContract ?? {
  profile: "S9_FIX_03_AI_VALUE_PRESERVATION",
  baseline_commit: "4f3a780819633cb60bc97de1de748286d92ff139",
  committed_baseline: { passed: true },
  prospective_profile: {
    substep_id: "S9-FIX-03",
    passed: true,
    required_paths: expectedAiValueProspectivePaths,
    optional_status_path: "PROJECT_CONTEXT.md",
    allowed_status_heading: expectedAiValueStatusHeading,
  },
  semantic_checks: { total: 35, passed: 35, all_passed: true },
  diff_checks: {
    git_diff_bounded: true,
    no_production_diff: true,
    historical_boundary: true,
  },
  negative_cases: { total: 10, passed: 10, failed: [] },
  future_wildcard: false,
  network_provider_count: 0,
  deterministic: true,
});
const aiValueSelfTestRun = (contract = fixtureAiValueSelfTestContract, status = 0) => ({
  status,
  stdout: `${JSON.stringify(contract, null, 2)}\n`,
  stderr: "",
  error: null,
});
const aiValueSelfTestPair = (contract = fixtureAiValueSelfTestContract, status = 0) => [
  aiValueSelfTestRun(contract, status),
  aiValueSelfTestRun(contract, status),
];
const mutateAiValueSelfTest = (mutator) => {
  const copy = structuredClone(fixtureAiValueSelfTestContract);
  mutator(copy);
  return copy;
};
const aiValuePlanningNegativeResults = [
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed.slice(1),
    candidateSelfTestRuns: aiValueSelfTestPair(),
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed.slice(0, 1),
    candidateSelfTestRuns: aiValueSelfTestPair(),
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: [...aiValueQualityControlAllowed, "third.file"],
    candidateSelfTestRuns: aiValueSelfTestPair(),
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed,
    candidateSelfTestRuns: [
      { status: 0, stdout: "{malformed", stderr: "", error: null },
      aiValueSelfTestRun(),
    ],
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed,
    candidateSelfTestRuns: aiValueSelfTestPair(fixtureAiValueSelfTestContract, 1),
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed,
    candidateSelfTestRuns: aiValueSelfTestPair(mutateAiValueSelfTest((value) => {
      value.prospective_profile.passed = false;
    })),
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed,
    candidateSelfTestRuns: aiValueSelfTestPair(mutateAiValueSelfTest((value) => {
      value.diff_checks.historical_boundary = false;
    })),
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed,
    candidateSelfTestRuns: aiValueSelfTestPair(mutateAiValueSelfTest((value) => {
      value.future_wildcard = true;
    })),
  }),
  !aiValueQualityControlProfileSemantics({
    candidateDiff: aiValueQualityControlAllowed,
    candidateSelfTestRuns: aiValueSelfTestPair(mutateAiValueSelfTest((value) => {
      value.semantic_checks.passed = 34;
      value.semantic_checks.all_passed = false;
    })),
  }),
].every(Boolean);
const exactAiValueQualityControlProfile = aiValueQualityControlProfileSemantics({
  candidateDiff: diff,
  candidateSelfTestRuns: aiValueSelfTestRuns,
  collectionValid: repositoryPathCollectionValid,
}) && aiValuePlanningNegativeResults;
const contractAlignmentAllowed = [
  "scripts/stage-9-remediation-plan-quality.mjs",
  "docs/qa/remediation/stage-9/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_SPEC.v1.md",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json",
];
const exactContractAlignmentDiff = diff.length === contractAlignmentAllowed.length
  && contractAlignmentAllowed.every((path) => diff.includes(path));
const exactContractAlignmentSemantics = exactContractAlignmentDiff && (() => {
  const headJson = (path) => JSON.parse(execFileSync("git", ["show", `HEAD:${path}`], { cwd: root, encoding: "utf8" }));
  const headSequence = headJson("docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json");
  const headRegistry = headJson("docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json");
  const currentSubstep = sequence.sequence.find((row) => row.substep_id === "S9-FIX-01");
  const currentCandidate = registry.candidates.find((row) => row.candidate_id === "S9-REM-SCHEMA-001");
  const headSubstep = headSequence.sequence.find((row) => row.substep_id === "S9-FIX-01");
  const headCandidate = headRegistry.candidates.find((row) => row.candidate_id === "S9-REM-SCHEMA-001");
  const futureWritePaths = [
    "scripts/generate-stage-9-human-review-package.mjs",
    "docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json",
    "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json",
    "scripts/stage-9-schema-oracle-evidence-projection-quality.mjs",
    "scripts/stage-9-remediation-revision-integrity-quality.mjs",
    "package.json",
    "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json",
    "PROJECT_CONTEXT.md",
  ];
  const mandatoryGates = [
    "quality:stage-9-schema-oracle-evidence-projection",
    "quality:stage-9-synthetic-risk-evaluation",
    "quality:stage-9-human-review-readiness",
    "quality:stage-9-remediation-revision-integrity",
  ];
  const resultArtifact = "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json";
  const statusHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  return same(currentSubstep.exact_candidate_scope, headSubstep.exact_candidate_scope)
    && currentCandidate.candidate_id === headCandidate.candidate_id
    && same(currentCandidate.affected_fixtures, headCandidate.affected_fixtures)
    && same(currentCandidate.owned_issue_ids, headCandidate.owned_issue_ids)
    && same(currentSubstep.prerequisites, headSubstep.prerequisites)
    && same(currentCandidate.dependencies, headCandidate.dependencies)
    && same(sequence.sequence.map((row) => [row.order, row.substep_id]), headSequence.sequence.map((row) => [row.order, row.substep_id]))
    && same(currentSubstep.allowed_files, futureWritePaths)
    && same(currentCandidate.planned_write_files, futureWritePaths)
    && same(currentSubstep.gates, mandatoryGates)
    && same(currentCandidate.required_regression_gates, mandatoryGates)
    && currentSubstep.bounded_result_artifact === resultArtifact
    && currentCandidate.bounded_result_artifact === resultArtifact
    && currentSubstep.canonical_status_update?.file_path === "PROJECT_CONTEXT.md"
    && currentCandidate.canonical_status_update?.file_path === "PROJECT_CONTEXT.md"
    && currentSubstep.canonical_status_update?.section_heading === statusHeading
    && currentCandidate.canonical_status_update?.section_heading === statusHeading
    && futureWritePaths.every((path) => specText.includes(`\`${path}\``))
    && mandatoryGates.every((gate) => specText.includes(`\`${gate}\``))
    && specText.includes(`\`${statusHeading}\``);
})();
const fixtureContractAlignmentAllowed = [
  "scripts/stage-9-remediation-plan-quality.mjs",
  "docs/qa/remediation/stage-9/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_SPEC.v1.md",
];
const exactFixtureContractAlignmentDiff = diff.length === fixtureContractAlignmentAllowed.length
  && fixtureContractAlignmentAllowed.every((path) => diff.includes(path));
const exactFixtureContractAlignmentSemantics = exactFixtureContractAlignmentDiff && (() => {
  const currentSubstep = sequence.sequence.find((row) => row.substep_id === "S9-FIX-01");
  const currentCandidate = registry.candidates.find((row) => row.candidate_id === "S9-REM-SCHEMA-001");
  const fixtureClaimRows = [
    "| `S9-EVAL-006` | `B5-ISSUE-001` | exact unknown-field path and value |",
    "| `S9-EVAL-007` | `B6-ISSUE-027` | nested unknown field at `candidate.output.risks[0].advice` with exact invalid value `\"none\"` |",
    "| `S9-EVAL-009` | `B6-ISSUE-029` | invalid severity at `candidate.output.risks[0].severity_hint` with exact invalid value `\"critical\"` |",
    "| `S9-EVAL-010` | `B6-ISSUE-030` | invalid likelihood at `candidate.output.risks[0].likelihood_hint` with exact invalid value `\"certain\"` |",
    "| `S9-EVAL-011` | `B2-ISSUE-001` | nonexistent affected-option reference and candidate option IDs |",
    "| `S9-EVAL-012` | `B3-ISSUE-002` | nonexistent affected-fact reference and candidate/source fact IDs |",
  ];
  const expectedFixtures = ["S9-EVAL-006", "S9-EVAL-007", "S9-EVAL-009", "S9-EVAL-010", "S9-EVAL-011", "S9-EVAL-012"];
  const expectedClaims = ["B6-ISSUE-027", "B6-ISSUE-029", "B6-ISSUE-030", "B5-ISSUE-001", "B2-ISSUE-001", "B3-ISSUE-002"];
  const mandatoryGates = [
    "quality:stage-9-schema-oracle-evidence-projection",
    "quality:stage-9-synthetic-risk-evaluation",
    "quality:stage-9-human-review-readiness",
    "quality:stage-9-remediation-revision-integrity",
  ];
  const futureWritePaths = [
    "scripts/generate-stage-9-human-review-package.mjs",
    "docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json",
    "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json",
    "scripts/stage-9-schema-oracle-evidence-projection-quality.mjs",
    "scripts/stage-9-remediation-revision-integrity-quality.mjs",
    "package.json",
    "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json",
    "PROJECT_CONTEXT.md",
  ];
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  return specText.includes("Candidate: `S9-REM-SCHEMA-001`")
    && fixtureClaimRows.every((row) => specText.includes(row))
    && same(currentSubstep.exact_candidate_scope, ["S9-REM-SCHEMA-001"])
    && currentCandidate.candidate_id === "S9-REM-SCHEMA-001"
    && same(currentCandidate.affected_fixtures, expectedFixtures)
    && same(currentCandidate.owned_issue_ids, expectedClaims)
    && same(currentSubstep.prerequisites, [])
    && same(currentCandidate.dependencies, [])
    && same(sequence.sequence.map((row) => [row.order, row.substep_id]), expectedSubstepIds.map((id, index) => [index + 1, id]))
    && same(currentSubstep.gates, mandatoryGates)
    && same(currentCandidate.required_regression_gates, mandatoryGates)
    && same(currentSubstep.allowed_files, futureWritePaths)
    && same(currentCandidate.planned_write_files, futureWritePaths)
    && currentSubstep.bounded_result_artifact === "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json"
    && currentCandidate.bounded_result_artifact === currentSubstep.bounded_result_artifact
    && currentSubstep.canonical_status_update?.file_path === "PROJECT_CONTEXT.md"
    && currentCandidate.canonical_status_update?.file_path === "PROJECT_CONTEXT.md"
    && currentSubstep.canonical_status_update?.section_heading === "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026"
    && currentCandidate.canonical_status_update?.section_heading === currentSubstep.canonical_status_update.section_heading;
})();
const contradictionContractAlignmentAllowed = [
  "scripts/stage-9-remediation-plan-quality.mjs",
  "docs/qa/remediation/stage-9/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_SPEC.v1.md",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json",
].sort();
const contradictionFutureWritePaths = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-systemic-contradiction-reference-quality.mjs",
  "package.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json",
  "PROJECT_CONTEXT.md",
];
const contradictionMandatoryGates = [
  "quality:stage-9-systemic-contradiction-reference",
  "quality:stage-9-offline-dataset-coverage",
  "quality:stage-9-remediation-revision-integrity",
];
const contradictionSpecPath = "docs/qa/remediation/stage-9/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_SPEC.v1.md";
const contradictionResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json";
const contradictionStatusHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const contradictionCommitMessage = "fix(stage-9): correct contradiction references";
const rejectedGenderInterpretation = "Grammatical gender is non-material unless actor, modality, negation, urgency, or risk changes.";
const headSequenceForContradiction = JSON.parse(execFileSync("git", ["show", "HEAD:docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json"], { cwd: root, encoding: "utf8" }));
const headRegistryForContradiction = JSON.parse(execFileSync("git", ["show", "HEAD:docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json"], { cwd: root, encoding: "utf8" }));

function contradictionContractSemantics(candidateSequence, candidateRegistry, candidateSpecText, candidateDiff, collectionValid = true) {
  const substep = candidateSequence.sequence.find((row) => row.substep_id === "S9-FIX-02");
  const expectedCandidate = candidateRegistry.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-001");
  const clusterCandidate = candidateRegistry.candidates.find((row) => row.candidate_id === "S9-REM-CLUSTER-001");
  const headSubstep = headSequenceForContradiction.sequence.find((row) => row.substep_id === "S9-FIX-02");
  const headExpectedCandidate = headRegistryForContradiction.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-001");
  const headClusterCandidate = headRegistryForContradiction.candidates.find((row) => row.candidate_id === "S9-REM-CLUSTER-001");
  if (!substep || !expectedCandidate || !clusterCandidate) return false;

  const normalizedCandidateDiff = [...new Set(candidateDiff.map(normalizeRepoPath))].sort();
  const exactDiff = collectionValid
    && same(normalizedCandidateDiff, contradictionContractAlignmentAllowed)
    && candidateDiff.every((path) => path === normalizeRepoPath(path) && !path.startsWith("/"));
  const alignedEntries = [substep, expectedCandidate, clusterCandidate];
  const ownershipPreserved = same(expectedCandidate.owned_issue_ids, headExpectedCandidate.owned_issue_ids)
    && same(clusterCandidate.owned_issue_ids, headClusterCandidate.owned_issue_ids)
    && same(expectedCandidate.affected_clusters, headExpectedCandidate.affected_clusters)
    && same(clusterCandidate.affected_clusters, headClusterCandidate.affected_clusters)
    && same(candidateRegistry.candidates.map((row) => row.candidate_id), headRegistryForContradiction.candidates.map((row) => row.candidate_id));
  const dependenciesAndOrderPreserved = same(substep.prerequisites, headSubstep.prerequisites)
    && same(expectedCandidate.dependencies, headExpectedCandidate.dependencies)
    && same(clusterCandidate.dependencies, headClusterCandidate.dependencies)
    && same(candidateSequence.sequence.map((row) => [row.order, row.substep_id]), headSequenceForContradiction.sequence.map((row) => [row.order, row.substep_id]));
  const exactSharedScope = alignedEntries.every((row) =>
    same(row.shared_rule_owned_claim_ids, headExpectedCandidate.owned_issue_ids)
    && row.shared_rule_owned_claim_count === 39
    && row.consolidated_partial_case_count === 1
    && row.consolidated_partial_case?.claim_id === headClusterCandidate.owned_issue_ids[0]
    && row.consolidated_partial_case?.fixture_id === "S9-CORE-020-ES"
    && row.consolidated_partial_case?.final_disposition === "PARTIALLY_CONFIRMED"
    && same(row.shared_rule_owned_clusters, headExpectedCandidate.affected_clusters)
    && row.shared_rule_owned_cluster_count === 8
    && row.excluded_rejected_interpretation?.interpretation === rejectedGenderInterpretation
    && row.excluded_rejected_interpretation?.remediation_eligible === false);
  const exactContract = alignedEntries.every((row) =>
    row.implementation_specification === contradictionSpecPath
    && row.implementation_executed === false
    && same(row.allowed_files ?? row.planned_write_files, contradictionFutureWritePaths)
    && same(row.gates ?? row.required_regression_gates, contradictionMandatoryGates)
    && (row.gates ?? row.required_regression_gates).includes("quality:stage-9-remediation-revision-integrity")
    && row.bounded_result_artifact === contradictionResultPath
    && row.canonical_status_update?.file_path === "PROJECT_CONTEXT.md"
    && row.canonical_status_update?.section_heading === contradictionStatusHeading)
    && substep.commit_message === contradictionCommitMessage
    && expectedCandidate.implementation_commit_message === contradictionCommitMessage
    && clusterCandidate.implementation_commit_message === contradictionCommitMessage
    && substep.completed_predecessor_evidence?.substep_id === "S9-FIX-01"
    && substep.completed_predecessor_evidence?.commit === "6b04c405a2a8aaba9e9c3e164413a9d954ee04af"
    && substep.implementation_source_file === "lib/ai-decision-material/fixtures.ts"
    && expectedCandidate.implementation_source_file === substep.implementation_source_file
    && clusterCandidate.implementation_source_file === substep.implementation_source_file
    && same(expectedCandidate.implementation_source_symbols, substep.implementation_source_symbols)
    && same(clusterCandidate.implementation_source_symbols, substep.implementation_source_symbols)
    && expectedCandidate.status === "PLANNED_NOT_STARTED"
    && clusterCandidate.status === "PLANNED_NOT_STARTED";
  const normalizedSpec = normalizeWhitespace(candidateSpecText);
  const exactSpec = normalizedSpec.includes("Candidates: `S9-REM-EXPECTED-001`, `S9-REM-CLUSTER-001`")
    && normalizedSpec.includes("exactly 39 confirmed claims")
    && normalizedSpec.includes("exactly one consolidated partial case")
    && normalizedSpec.includes("exactly eight clusters")
    && headExpectedCandidate.owned_issue_ids.every((id) => normalizedSpec.includes(`\`${id}\``))
    && headExpectedCandidate.affected_clusters.every((id) => normalizedSpec.includes(`\`${id}\``))
    && normalizedSpec.includes("`B4-ISSUE-006`")
    && normalizedSpec.includes("`S9-CORE-020-ES`")
    && normalizedSpec.includes(rejectedGenderInterpretation)
    && contradictionFutureWritePaths.every((path) => normalizedSpec.includes(`\`${path}\``))
    && contradictionMandatoryGates.every((gate) => normalizedSpec.includes(`\`${gate}\``))
    && normalizedSpec.includes(`\`${contradictionStatusHeading}\``)
    && normalizedSpec.includes(`\`${contradictionCommitMessage}\``);
  return exactDiff && ownershipPreserved && dependenciesAndOrderPreserved && exactSharedScope && exactContract && exactSpec;
}

const mutate = (value, mutator) => {
  const copy = structuredClone(value);
  mutator(copy);
  return copy;
};
const negativeContradictionProfileCasesRejected = [
  ...contradictionContractAlignmentAllowed.map((missingPath) =>
    contradictionContractSemantics(sequence, registry, contradictionSpecText, contradictionContractAlignmentAllowed.filter((path) => path !== missingPath))),
  contradictionContractSemantics(sequence, registry, contradictionSpecText, [...contradictionContractAlignmentAllowed, "FIFTH_TRACKED_FILE"]),
  contradictionContractSemantics(sequence, registry, contradictionSpecText, [...contradictionContractAlignmentAllowed, "unrelated-untracked.file"]),
  contradictionContractSemantics(sequence, registry, contradictionSpecText, [...contradictionContractAlignmentAllowed, "ignored-unrelated.file"]),
  contradictionContractSemantics(sequence, registry, contradictionSpecText, contradictionContractAlignmentAllowed.map((path, index) => index === 0 ? `/absolute/${path}` : path)),
  contradictionContractSemantics(sequence, mutate(registry, (value) => {
    value.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-001").required_regression_gates.reverse();
  }), contradictionSpecText, contradictionContractAlignmentAllowed),
  contradictionContractSemantics(sequence, mutate(registry, (value) => {
    value.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-001").owned_issue_ids.push("OWNERSHIP-DRIFT");
  }), contradictionSpecText, contradictionContractAlignmentAllowed),
  contradictionContractSemantics(mutate(sequence, (value) => {
    value.sequence.find((row) => row.substep_id === "S9-FIX-02").excluded_rejected_interpretation.remediation_eligible = true;
  }), registry, contradictionSpecText, contradictionContractAlignmentAllowed),
  contradictionContractSemantics(mutate(sequence, (value) => {
    value.sequence.find((row) => row.substep_id === "S9-FIX-02").prerequisites.push("S9-FIX-01");
  }), registry, contradictionSpecText, contradictionContractAlignmentAllowed),
  contradictionContractSemantics(mutate(sequence, (value) => {
    [value.sequence[1].order, value.sequence[2].order] = [value.sequence[2].order, value.sequence[1].order];
  }), registry, contradictionSpecText, contradictionContractAlignmentAllowed),
].every((accepted) => accepted === false);
const exactContradictionContractAlignmentSemantics =
  untracked.includes(contradictionSpecPath)
  && contradictionContractSemantics(sequence, registry, contradictionSpecText, diff, repositoryPathCollectionValid)
  && negativeContradictionProfileCasesRejected;
const highRiskContractAlignmentAllowed = [
  "scripts/stage-9-remediation-plan-quality.mjs",
  "docs/qa/remediation/stage-9/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_SPEC.v1.md",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json",
].sort();
const highRiskSpecPath = "docs/qa/remediation/stage-9/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_SPEC.v1.md";
const highRiskRows = [
  "S9-CORE-012-ES",
  "S9-CORE-012-EN",
  "S9-CORE-012-RU",
  "S9-CORE-012-ZH",
  "S9-CORE-036-ZH",
  "S9-CORE-037-ES",
  "S9-CORE-037-EN",
  "S9-CORE-037-RU",
  "S9-CORE-037-ZH",
  "S9-CORE-038-ES",
  "S9-CORE-038-EN",
  "S9-CORE-038-RU",
  "S9-CORE-038-ZH",
  "S9-CORE-040-ES",
  "S9-CORE-040-EN",
  "S9-CORE-040-RU",
  "S9-CORE-040-ZH",
];
const highRiskClusters = [
  "S9-CLUSTER-012",
  "S9-CLUSTER-036",
  "S9-CLUSTER-037",
  "S9-CLUSTER-038",
  "S9-CLUSTER-040",
];
const highRiskLocaleGroups = [
  { cluster_id: "S9-CLUSTER-012", row_ids: ["S9-CORE-012-ES", "S9-CORE-012-EN", "S9-CORE-012-RU", "S9-CORE-012-ZH"] },
  { cluster_id: "S9-CLUSTER-036", row_ids: ["S9-CORE-036-ZH"] },
  { cluster_id: "S9-CLUSTER-037", row_ids: ["S9-CORE-037-ES", "S9-CORE-037-EN", "S9-CORE-037-RU", "S9-CORE-037-ZH"] },
  { cluster_id: "S9-CLUSTER-038", row_ids: ["S9-CORE-038-ES", "S9-CORE-038-EN", "S9-CORE-038-RU", "S9-CORE-038-ZH"] },
  { cluster_id: "S9-CLUSTER-040", row_ids: ["S9-CORE-040-ES", "S9-CORE-040-EN", "S9-CORE-040-RU", "S9-CORE-040-ZH"] },
];
const highRiskClarificationCases = highRiskRows.filter((id) => !id.startsWith("S9-CORE-038-"));
const highRiskRefusalCases = [
  "S9-CORE-038-ES",
  "S9-CORE-038-EN",
  "S9-CORE-038-RU",
  "S9-CORE-038-ZH",
];
const highRiskSourceSymbols = [
  "SCENARIO_BLUEPRINTS",
  "completenessClarification",
  "completenessRecommendation",
  "CANONICAL_OFFLINE_EVALUATION_CASES",
];
const highRiskFutureWritePaths = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-high-risk-reference-quality.mjs",
  "package.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json",
  "PROJECT_CONTEXT.md",
];
const highRiskMandatoryGates = [
  "quality:stage-9-high-risk-reference",
  "quality:stage-9-offline-dataset-coverage",
  "quality:stage-9-ai-value-preservation",
  "quality:stage-9-remediation-revision-integrity",
];
const highRiskResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json";
const highRiskStatusHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const highRiskCommitMessage = "fix(stage-9): correct high-risk references";
const highRiskControlledFailureOwner = "quality:stage-9-offline-dataset-coverage";
const headSequenceForHighRisk = JSON.parse(execFileSync("git", ["show", "HEAD:docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json"], { cwd: root, encoding: "utf8" }));
const headRegistryForHighRisk = JSON.parse(execFileSync("git", ["show", "HEAD:docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json"], { cwd: root, encoding: "utf8" }));

function highRiskContractSemantics(candidateSequence, candidateRegistry, candidateSpecText, candidateDiff, collectionValid = true) {
  const substep = candidateSequence.sequence.find((row) => row.substep_id === "S9-FIX-03");
  const candidate = candidateRegistry.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-002");
  const headSubstep = headSequenceForHighRisk.sequence.find((row) => row.substep_id === "S9-FIX-03");
  const headCandidate = headRegistryForHighRisk.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-002");
  if (!substep || !candidate || !headSubstep || !headCandidate) return false;

  const normalizedCandidateDiff = [...new Set(candidateDiff.map(normalizeRepoPath))].sort();
  const exactDiff = collectionValid
    && same(normalizedCandidateDiff, highRiskContractAlignmentAllowed)
    && candidateDiff.every((path) =>
      path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
  const entries = [substep, candidate];
  const identityAndGraphPreserved =
    same(candidateRegistry.candidates.map((row) => row.candidate_id), headRegistryForHighRisk.candidates.map((row) => row.candidate_id))
    && same(substep.exact_candidate_scope, headSubstep.exact_candidate_scope)
    && same(candidate.dependencies, headCandidate.dependencies)
    && same(substep.prerequisites, headSubstep.prerequisites)
    && same(candidateSequence.sequence.map((row) => [row.order, row.substep_id]), headSequenceForHighRisk.sequence.map((row) => [row.order, row.substep_id]));
  const ownershipPreserved =
    same(candidate.affected_fixtures, headCandidate.affected_fixtures)
    && same(candidate.affected_clusters, headCandidate.affected_clusters)
    && same(candidate.owned_issue_ids, headCandidate.owned_issue_ids)
    && entries.every((row) =>
      same(row.owned_locale_rows, highRiskRows)
      && row.owned_locale_row_count === 17
      && same(row.owned_safety_clusters, highRiskClusters)
      && row.owned_safety_cluster_count === 5
      && same(row.locale_equivalence_groups, highRiskLocaleGroups)
      && same(row.clarification_cases, highRiskClarificationCases)
      && same(row.refusal_cases, highRiskRefusalCases)
      && same(row.controlled_failure_cases, highRiskRefusalCases));
  const exactContract = entries.every((row) =>
    row.implementation_specification === highRiskSpecPath
    && row.implementation_executed === false
    && same(row.allowed_files ?? row.planned_write_files, highRiskFutureWritePaths)
    && same(row.gates ?? row.required_regression_gates, highRiskMandatoryGates)
    && row.controlled_failure_owner_gate === highRiskControlledFailureOwner
    && row.bounded_result_artifact === highRiskResultPath
    && row.canonical_status_update?.file_path === "PROJECT_CONTEXT.md"
    && row.canonical_status_update?.section_heading === highRiskStatusHeading
    && row.implementation_source_file === "lib/ai-decision-material/fixtures.ts"
    && same(row.implementation_source_symbols, highRiskSourceSymbols))
    && substep.implementation_status === "PLANNED_NOT_STARTED"
    && candidate.status === "PLANNED_NOT_STARTED"
    && substep.commit_message === highRiskCommitMessage
    && candidate.implementation_commit_message === highRiskCommitMessage
    && substep.completed_predecessor_evidence?.some((row) =>
      row.substep_id === "S9-FIX-01" && row.status === "COMPLETED")
    && substep.completed_predecessor_evidence?.some((row) =>
      row.substep_id === "S9-FIX-02"
      && row.status === "COMPLETED"
      && row.commit === "18c8d6bffa422c46f4439b6b93c1076fc98a375c");
  const normalizedSpec = normalizeWhitespace(candidateSpecText);
  const exactSpec =
    normalizedSpec.includes("Candidate: `S9-REM-EXPECTED-002`")
    && normalizedSpec.includes("Status: `PLANNED_NOT_STARTED`")
    && normalizedSpec.includes("Implementation executed: `false`")
    && normalizedSpec.includes("exactly 17 locale rows")
    && normalizedSpec.includes("exactly five safety clusters")
    && highRiskRows.every((id) => normalizedSpec.includes(`\`${id}\``))
    && highRiskClusters.every((id) => normalizedSpec.includes(`\`${id}\``))
    && highRiskFutureWritePaths.every((path) => normalizedSpec.includes(`\`${path}\``))
    && highRiskMandatoryGates.every((gate) => normalizedSpec.includes(`\`${gate}\``))
    && highRiskSourceSymbols.every((symbol) => normalizedSpec.includes(`\`${symbol}\``))
    && normalizedSpec.includes(`\`${highRiskStatusHeading}\``)
    && normalizedSpec.includes(`\`${highRiskCommitMessage}\``)
    && normalizedSpec.includes("controlled-failure coverage assertion")
    && normalizedSpec.includes("`S9-FIX-04` is outside this contract");
  return exactDiff && identityAndGraphPreserved && ownershipPreserved && exactContract && exactSpec;
}

const negativeHighRiskProfileCasesRejected = [
  ...highRiskContractAlignmentAllowed.map((missingPath) =>
    highRiskContractSemantics(sequence, registry, highRiskSpecText, highRiskContractAlignmentAllowed.filter((path) => path !== missingPath))),
  highRiskContractSemantics(sequence, registry, highRiskSpecText, [...highRiskContractAlignmentAllowed, "fifth-unrelated.file"]),
  highRiskContractSemantics(mutate(sequence, (value) => {
    value.sequence.find((row) => row.substep_id === "S9-FIX-03").owned_locale_row_count = 16;
  }), registry, highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(sequence, mutate(registry, (value) => {
    value.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-002").owned_safety_cluster_count = 4;
  }), highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(sequence, mutate(registry, (value) => {
    value.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-002").required_regression_gates.reverse();
  }), highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(mutate(sequence, (value) => {
    delete value.sequence.find((row) => row.substep_id === "S9-FIX-03").controlled_failure_owner_gate;
  }), registry, highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(sequence, mutate(registry, (value) => {
    value.candidates.find((row) => row.candidate_id === "S9-REM-EXPECTED-002").planned_write_files.pop();
  }), highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(mutate(sequence, (value) => {
    const row = value.sequence.find((item) => item.substep_id === "S9-FIX-03");
    row.bounded_result_artifact = "bounded result artifact";
    row.canonical_status_update = { file_path: "canonical Stage 9 status documents" };
  }), registry, highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(mutate(sequence, (value) => {
    value.sequence.find((row) => row.substep_id === "S9-FIX-03").prerequisites = [];
  }), registry, highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(mutate(sequence, (value) => {
    const row = value.sequence.find((item) => item.substep_id === "S9-FIX-03");
    row.implementation_status = "IMPLEMENTED";
    row.implementation_executed = true;
  }), registry, highRiskSpecText, highRiskContractAlignmentAllowed),
  highRiskContractSemantics(mutate(sequence, (value) => {
    value.sequence.find((row) => row.substep_id === "S9-FIX-03").exact_candidate_scope.push("S9-REM-EXPECTED-003");
  }), registry, highRiskSpecText, highRiskContractAlignmentAllowed),
].every((accepted) => accepted === false);
const exactHighRiskContractAlignmentSemantics =
  untracked.includes(highRiskSpecPath)
  && highRiskContractSemantics(sequence, registry, highRiskSpecText, diff, repositoryPathCollectionValid)
  && negativeHighRiskProfileCasesRejected;
const boundedDiffProfile = diff.length === 0
  ? "clean-tree"
  : exactCoverageQualityControlProfile
    ? "offline-dataset-case-version-quality-control"
    : exactAiValueQualityControlProfile
      ? "ai-value-preservation-quality-control"
      : exactQualityControlProfile
        ? "remediation-revision-integrity-quality-control"
      : exactPlanningDiff
        ? "full-planning"
        : exactContractAlignmentSemantics
          ? "schema-oracle-remediation-contract-alignment"
          : exactFixtureContractAlignmentSemantics
            ? "schema-oracle-fixture-contract-alignment"
          : exactContradictionContractAlignmentSemantics
              ? "systemic-contradiction-remediation-contract-alignment"
              : exactHighRiskContractAlignmentSemantics
                ? "high-risk-clarification-refusal-remediation-contract-alignment"
              : "rejected";
add(
  "bounded-diff",
  boundedDiffProfile !== "rejected",
  boundedDiffProfile === "rejected"
    ? `Profile rejected. Repository paths: ${diff.join(", ")}; tracked: ${changed.join(", ")}; untracked: ${untracked.join(", ")}; normalized=${repositoryPathCollectionValid}; coverage-quality semantic=${coverageQualityControlProfileSemantics({ candidateDiff: diff, candidateSelfTestRuns: coverageSelfTestRuns, collectionValid: repositoryPathCollectionValid })}; coverage-machine-self-test=${validCoverageSelfTest(actualCoverageSelfTestContract)}; ai-value-quality semantic=${aiValueQualityControlProfileSemantics({ candidateDiff: diff, candidateSelfTestRuns: aiValueSelfTestRuns, collectionValid: repositoryPathCollectionValid })}; ai-value-machine-self-test=${validAiValueSelfTest(actualAiValueSelfTestContract)}; revision-quality semantic=${qualityControlProfileSemantics({ candidateDiff: diff, selfTestRuns, collectionValid: repositoryPathCollectionValid })}; revision-machine-self-test=${validSelfTestContract(actualSelfTestContract)}; revision-planning-negative-cases=${planningProfileNegativeChecksPass}; contradiction-contract semantic=${contradictionContractSemantics(sequence, registry, contradictionSpecText, diff, repositoryPathCollectionValid)}; contradiction negative-cases=${negativeContradictionProfileCasesRejected}.`
    : `Profile ${boundedDiffProfile} accepted.${boundedDiffProfile === "offline-dataset-case-version-quality-control" ? ` Exact two-file coverage-validator diff: ${diff.join(", ")}. Machine-readable case-version self-test PASS; planning-profile negative checks 14/14.` : boundedDiffProfile === "ai-value-preservation-quality-control" ? ` Exact two-file AI value-preservation diff: ${diff.join(", ")}. Machine-readable S9-FIX-03 profile PASS; planning negative cases rejected.` : boundedDiffProfile === "remediation-revision-integrity-quality-control" ? ` Exact two-file quality-control diff: ${diff.join(", ")}. Machine-readable self-test PASS; planning-profile negative checks 20/20.` : boundedDiffProfile === "systemic-contradiction-remediation-contract-alignment" ? ` Repository-backed classifier included tracked and untracked paths: ${diff.join(", ")}. All negative cases rejected.` : boundedDiffProfile === "high-risk-clarification-refusal-remediation-contract-alignment" ? ` Exact four-file S9-FIX-03 contract diff: ${diff.join(", ")}. Planning-profile negative checks 14/14.` : ""}`,
);
add("network-zero", networkRequests === 0, `${networkRequests} network requests.`);

globalThis.fetch = originalFetch;
for (const check of checks) console[check.pass ? "log" : "error"](`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT plan=accepted candidates=8 actionable_claims=97 candidate_ownership=97/97 substeps=9 first=${JSON.stringify(firstName)} implementation=none fixture_remediation=NONE historical_artifacts=unchanged stage=In_Progress release=NOT_DECLARED mockOnly=true network=${networkRequests}`);
console.log(`${checks.filter((item) => item.pass).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.pass)) process.exitCode = 1;
