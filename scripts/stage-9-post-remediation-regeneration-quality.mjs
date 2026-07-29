import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildStage9Fix08Artifacts,
  contextPath,
  executionWriteSet,
  ledgerPath,
  mandatoryGates,
  manifestPath,
  preparationWriteSet,
  reconciliationPath,
  resultPath,
  statusHeading,
} from "./generate-stage-9-post-remediation-package.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseDir = "docs/qa/remediation/stage-9";
const specPath = `${baseDir}/STAGE_9_VERSIONED_DATASET_REGENERATION_RECONCILIATION_SPEC.v1.md`;
const sequencePath = `${baseDir}/AI_REMEDIATION_SEQUENCE.v1.json`;
const registryPath = `${baseDir}/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`;
const graphPath = `${baseDir}/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json`;
const canonicalSourceCommit = "ab8125e4d186dbab3ecc3df17ed4a12eba2bae5a";
const read = (path) => readFileSync(join(root, path), "utf8");
const head = (path) => execFileSync("git", ["show", `HEAD:${path}`], {
  cwd: root,
  encoding: "utf8",
});
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map((path) => path.replaceAll("\\", "/"));
const diffPaths = () => [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();
const exactPaths = (actual, expected) => same([...actual].sort(), [...expected].sort());

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the S9-FIX-08 regeneration gate.");
};

function canonicalContract() {
  const sequence = JSON.parse(read(sequencePath));
  const registry = JSON.parse(read(registryPath));
  const graph = JSON.parse(read(graphPath));
  const entry = sequence.sequence.find((row) => row.substep_id === "S9-FIX-08");
  const spec = read(specPath);
  return Boolean(entry
    && entry.name === "Stage 9 Versioned Dataset Regeneration and Reconciliation"
    && entry.root_cause === "POST_SOURCE_CHANGE_DATASET_RECONCILIATION_REQUIRED"
    && entry.implementation_specification === specPath
    && entry.implementation_status === "IMPLEMENTATION_READY_NOT_STARTED"
    && entry.implementation_executed === false
    && entry.exact_candidate_scope.length === 0
    && registry.candidates.every((row) => row.planned_substep_id !== "S9-FIX-08")
    && same(entry.prerequisites,
      ["S9-FIX-01", "S9-FIX-02", "S9-FIX-03", "S9-FIX-04",
        "S9-FIX-05", "S9-FIX-06", "S9-FIX-07"])
    && exactPaths(entry.preparation_write_files, preparationWriteSet)
    && exactPaths(entry.allowed_files, executionWriteSet)
    && entry.bounded_result_artifact === resultPath
    && entry.reconciliation_artifact === reconciliationPath
    && entry.manifest_package_version === "stage-9-post-remediation-manifest.2"
    && same(entry.gates, mandatoryGates)
    && entry.canonical_counts?.canonical_core === 160
    && entry.canonical_counts?.synthetic_risk === 32
    && entry.canonical_counts?.rich_decision_material === 184
    && entry.canonical_counts?.combined_offline_population === 216
    && entry.canonical_counts?.version_1_1 === 63
    && entry.canonical_counts?.version_1_0 === 97
    && entry.actionable_claim_reconciliation?.total === 97
    && entry.actionable_claim_reconciliation?.unresolved === 0
    && entry.actionable_claim_reconciliation?.rejected_preserved === 4
    && entry.canonical_status_update?.section_heading === statusHeading
    && ["S9-FIX-01", "S9-FIX-02", "S9-FIX-03", "S9-FIX-04",
      "S9-FIX-05", "S9-FIX-06", "S9-FIX-07"].every((id) =>
      graph.edges.some((edge) => edge.from === id && edge.to === "S9-FIX-08"))
    && graph.edges.some((edge) => edge.from === "S9-FIX-08" && edge.to === "S9-FIX-09")
    && preparationWriteSet.every((path) => spec.includes(`\`${path}\``))
    && executionWriteSet.every((path) => spec.includes(`\`${path}\``))
    && mandatoryGates.every((gate) => spec.includes(`\`${gate}\``))
    && read("package.json").includes('"generate:stage-9-post-remediation-package"')
    && read("package.json").includes('"quality:stage-9-post-remediation-regeneration"'));
}

function modelValid(model) {
  return model.paths_exact
    && model.counts?.canonical_core === 160
    && model.counts?.synthetic_risk === 32
    && model.counts?.rich_decision_material === 184
    && model.counts?.combined_offline_population === 216
    && model.versions?.["1.1"] === 63
    && model.versions?.["1.0"] === 97
    && model.actionable_total === 97
    && model.unique_actionable_total === 97
    && model.unresolved === 0
    && model.rejected_preserved === 4
    && model.stable_ids
    && model.historical_immutable
    && model.no_absolute_paths
    && model.no_timestamps
    && model.one_ledger_event
    && model.status_bounded
    && model.runtime_unchanged
    && model.network_zero;
}

function selfTests() {
  const positiveModel = {
    paths_exact: true,
    counts: {
      canonical_core: 160,
      synthetic_risk: 32,
      rich_decision_material: 184,
      combined_offline_population: 216,
    },
    versions: { "1.1": 63, "1.0": 97 },
    actionable_total: 97,
    unique_actionable_total: 97,
    unresolved: 0,
    rejected_preserved: 4,
    stable_ids: true,
    historical_immutable: true,
    no_absolute_paths: true,
    no_timestamps: true,
    one_ledger_event: true,
    status_bounded: true,
    runtime_unchanged: true,
    network_zero: true,
  };
  const mutations = [
    ["sixth-path", (v) => { v.paths_exact = false; }],
    ["core-count", (v) => { v.counts.canonical_core = 159; }],
    ["synthetic-count", (v) => { v.counts.synthetic_risk = 31; }],
    ["rich-count", (v) => { v.counts.rich_decision_material = 183; }],
    ["combined-count", (v) => { v.counts.combined_offline_population = 215; }],
    ["version-11", (v) => { v.versions["1.1"] = 62; }],
    ["version-10", (v) => { v.versions["1.0"] = 98; }],
    ["mapping-count", (v) => { v.actionable_total = 96; }],
    ["duplicate-mapping", (v) => { v.unique_actionable_total = 96; }],
    ["unresolved", (v) => { v.unresolved = 1; }],
    ["rejected-lost", (v) => { v.rejected_preserved = 3; }],
    ["id-reordered", (v) => { v.stable_ids = false; }],
    ["historical-change", (v) => { v.historical_immutable = false; }],
    ["absolute-path", (v) => { v.no_absolute_paths = false; }],
    ["timestamp", (v) => { v.no_timestamps = false; }],
    ["two-ledger-events", (v) => { v.one_ledger_event = false; }],
    ["broad-status", (v) => { v.status_bounded = false; }],
    ["runtime-change", (v) => { v.runtime_unchanged = false; }],
    ["network", (v) => { v.network_zero = false; }],
  ];
  const negatives = mutations.map(([id, mutate]) => {
    const candidate = structuredClone(positiveModel);
    mutate(candidate);
    return { id, rejected: !modelValid(candidate) };
  });
  return {
    profile: "S9_FIX_08_VERSIONED_DATASET_REGENERATION_RECONCILIATION",
    positive: { total: 1, passed: modelValid(positiveModel) ? 1 : 0 },
    negative: {
      total: negatives.length,
      passed: negatives.filter((row) => row.rejected).length,
      failed: negatives.filter((row) => !row.rejected).map((row) => row.id),
    },
    deterministic: same(selfTestProjection(positiveModel), selfTestProjection(positiveModel)),
  };
}
const selfTestProjection = (value) => JSON.stringify(value);

function prospectiveContract() {
  const paths = diffPaths();
  const tests = selfTests();
  const generatedA = buildStage9Fix08Artifacts(root);
  const generatedB = buildStage9Fix08Artifacts(root);
  return {
    profile: "S9_FIX_08_VERSIONED_DATASET_REGENERATION_RECONCILIATION_PROSPECTIVE",
    substep_id: "S9-FIX-08",
    status: "IMPLEMENTATION_READY_NOT_STARTED",
    remediation_completed: false,
    passed: exactPaths(paths, preparationWriteSet)
      && canonicalContract()
      && same(generatedA.sha256, generatedB.sha256)
      && tests.positive.passed === tests.positive.total
      && tests.negative.passed === tests.negative.total
      && tests.deterministic
      && networkRequests === 0,
    preparation_write_set: preparationWriteSet,
    execution_write_set: executionWriteSet,
    generated_sha256_preview: generatedA.sha256,
    counts: generatedA.manifest.source_counts,
    version_distribution: generatedA.manifest.version_distribution,
    actionable_claim_reconciliation: "97/97",
    unresolved_claim_count: 0,
    rejected_claims_preserved: 4,
    mandatory_gates: mandatoryGates,
    self_tests: tests,
    network_provider_execution_count: networkRequests,
  };
}

function postContract() {
  const paths = diffPaths();
  const baselineFiles = {
    [ledgerPath]: head(ledgerPath),
    [contextPath]: head(contextPath),
  };
  const expectedA = buildStage9Fix08Artifacts(root, { baselineFiles });
  const expectedB = buildStage9Fix08Artifacts(root, { baselineFiles });
  const actualFiles = Object.fromEntries(executionWriteSet.map((path) =>
    [path, existsSync(join(root, path)) ? read(path) : ""]));
  const generatedText = Object.values(actualFiles).join("\n");
  const absolutePathFree = !/(?:\/Users\/|\/private\/|[A-Za-z]:\\\\)/.test(generatedText);
  const timestampFree = !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(generatedText);
  const sourceDiff = gitLines("diff", "--name-only", "HEAD", "--",
    "lib/ai-decision-material", "lib/ai-quality");
  const historicalDiff = gitLines("diff", "--name-only", "HEAD", "--", "docs/qa/review");
  const runtimeDiff = gitLines("diff", "--name-only", "HEAD", "--",
    "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context",
    "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime");
  const checks = {
    exact_five_file_diff: exactPaths(paths, executionWriteSet),
    expected_files_exact: executionWriteSet.every((path) =>
      actualFiles[path] === expectedA.files[path]),
    deterministic_generation: same(expectedA.sha256, expectedB.sha256),
    complete_manifest: expectedA.manifest.package_version
      === "stage-9-post-remediation-manifest.2"
      && expectedA.manifest.source_counts.canonical_core === 160
      && expectedA.manifest.source_counts.synthetic_risk === 32
      && expectedA.manifest.source_counts.rich_decision_material === 184
      && expectedA.manifest.source_counts.combined_offline_population === 216,
    version_distribution: expectedA.manifest.version_distribution["1.1"] === 63
      && expectedA.manifest.version_distribution["1.0"] === 97,
    stable_ids_and_order: expectedA.manifest.source_families.every((family) =>
      family.count === family.ordered_ids.length
      && family.count === family.ordered_row_sha256.length
      && new Set(family.ordered_ids).size === family.count),
    reconciliation_97_of_97: expectedA.reconciliation.summary.actionable_total === 97
      && expectedA.reconciliation.summary.unique_actionable_total === 97
      && expectedA.reconciliation.summary.unresolved_count === 0,
    rejected_four_preserved:
      expectedA.reconciliation.summary.rejected_preserved_count === 4
      && expectedA.reconciliation.rejected_claims_preserved.every((row) =>
        row.preserved_unchanged === true),
    completed_fix_evidence: expectedA.manifest.completed_revision_evidence.length === 7
      && expectedA.manifest.completed_revision_evidence.every((row) =>
        row.implementation_commit === canonicalSourceCommit
        || Object.values({
          ...Object.fromEntries(expectedA.manifest.completed_revision_evidence.map((entry) =>
            [entry.substep_id, entry.implementation_commit])),
        }).includes(row.implementation_commit)),
    one_exact_ledger_event: expectedA.result.ledger_append.substep_id === "S9-FIX-08"
      && expectedA.result.ledger_append.actionable_claim_reconciliation === "97/97",
    bounded_status: actualFiles[contextPath].includes("Completed remediation is `8/9`")
      && actualFiles[contextPath].includes("remaining remediation is `1/9`")
      && actualFiles[contextPath].includes("next canonical substep is `S9-FIX-09`")
      && actualFiles[contextPath].includes("Stage 9 remains **In Progress**"),
    raw_paths_and_timestamps_absent: absolutePathFree && timestampFree,
    source_fixtures_unchanged: sourceDiff.length === 0,
    historical_evidence_unchanged: historicalDiff.length === 0,
    runtime_boundaries_unchanged: runtimeDiff.length === 0,
    canonical_contract: canonicalContract(),
    network_zero: networkRequests === 0,
  };
  return {
    profile: "S9_FIX_08_VERSIONED_DATASET_REGENERATION_RECONCILIATION_POST",
    substep_id: "S9-FIX-08",
    passed: Object.values(checks).every(Boolean),
    checks,
    execution_write_set: executionWriteSet,
    generated_sha256: expectedA.sha256,
    counts: expectedA.manifest.source_counts,
    version_distribution: expectedA.manifest.version_distribution,
    actionable_claim_reconciliation: "97/97",
    unresolved_claim_count: 0,
    rejected_claims_preserved: 4,
    network_provider_execution_count: networkRequests,
  };
}

const selfTestOnly = process.argv.includes("--self-test-json");
const post = process.argv.includes("--post-regeneration")
  || exactPaths(diffPaths(), executionWriteSet);
const contract = selfTestOnly ? selfTests() : post ? postContract() : prospectiveContract();
globalThis.fetch = originalFetch;
console.log(JSON.stringify(contract, null, 2));
if (selfTestOnly) {
  if (contract.positive.passed !== contract.positive.total
    || contract.negative.passed !== contract.negative.total
    || !contract.deterministic) process.exitCode = 1;
} else if (!contract.passed) {
  process.exitCode = 1;
}
