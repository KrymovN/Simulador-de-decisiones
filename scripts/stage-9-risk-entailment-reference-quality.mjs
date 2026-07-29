import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  executionWriteSet as s9Fix08ExecutionWriteSet,
  preparationWriteSet as s9Fix08PreparationWriteSet,
} from "./generate-stage-9-post-remediation-package.mjs";
import {
  executionWriteSet as s9Fix09ExecutionWriteSet,
  preparationWriteSet as s9Fix09PreparationWriteSet,
} from "./stage-9-post-remediation-corpus-assessment-quality.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
routeS9Fix09Profile();
function routeS9Fix09Profile() {
  const paths = [...new Set([
    ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean),
    ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean),
  ])].sort();
  const samePaths = (expected) => JSON.stringify(paths) === JSON.stringify([...expected].sort());
  if (!samePaths(s9Fix09ExecutionWriteSet) && !samePaths(s9Fix09PreparationWriteSet)) return;
  try {
    const output = execFileSync(process.execPath, [
      join(root, "scripts/stage-9-post-remediation-corpus-assessment-quality.mjs"),
      ...(samePaths(s9Fix09ExecutionWriteSet) ? ["--post-assessment"] : []),
    ], { cwd: root, encoding: "utf8" });
    const contract = JSON.parse(output);
    if (!contract.passed) throw new Error("delegated FIX09 contract failed");
    process.stdout.write(output);
    process.exit(0);
  } catch (error) {
    console.error(`FAIL s9-fix-09-risk-entailment-routing: ${error.message}`);
    process.exit(1);
  }
}
routeS9Fix08Profile();
function routeS9Fix08Profile() {
  const paths = [...new Set([
    ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean),
    ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean),
  ])].sort();
  const samePaths = (expected) => JSON.stringify(paths) === JSON.stringify([...expected].sort());
  if (!samePaths(s9Fix08ExecutionWriteSet) && !samePaths(s9Fix08PreparationWriteSet)) return;
  try {
    const output = execFileSync(process.execPath, [
      join(root, "scripts/stage-9-post-remediation-regeneration-quality.mjs"),
      ...(samePaths(s9Fix08ExecutionWriteSet) ? ["--post-regeneration"] : []),
    ], { cwd: root, encoding: "utf8" });
    const contract = JSON.parse(output);
    if (!contract.passed) throw new Error("delegated FIX08 contract failed");
    process.stdout.write(output);
    process.exit(0);
  } catch (error) {
    console.error(`FAIL s9-fix-08-risk-entailment-routing: ${error.message}`);
    process.exit(1);
  }
}
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const normalizeRepoPath = (path) => path.replaceAll("\\", "/").replace(/^\.\//, "");
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map(normalizeRepoPath);
const exactPathSet = (candidate, expected) =>
  same([...new Set(candidate)].sort(), [...expected].sort())
  && candidate.every((path) =>
    path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));

const SPEC_PATH =
  "docs/qa/remediation/stage-9/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_SPEC.v1.md";
const SEQUENCE_PATH =
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json";
const REGISTRY_PATH =
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json";
const LEDGER_PATH =
  "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const RESULT_PATH =
  "docs/qa/remediation/stage-9/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json";
const PROJECT_CONTEXT_PATH = "PROJECT_CONTEXT.md";
const STATUS_HEADING =
  "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const CORE_SOURCE_PATH = "lib/ai-decision-material/fixtures.ts";
const SYNTHETIC_SOURCE_PATH =
  "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts";
const COMMIT_MESSAGE = "fix(stage-9): align risk references with source";
const SHARED_RULE_ID = "risk_mechanism_requires_source_entailment";

const OWNED_CLUSTERS = [
  "S9-CLUSTER-002",
  "S9-CLUSTER-014",
  "S9-CLUSTER-016",
  "S9-CLUSTER-019",
  "S9-CLUSTER-024",
];
const OWNED_CORE_IDS = OWNED_CLUSTERS.flatMap((clusterId) => {
  const number = clusterId.slice(-3);
  return ["ES", "EN", "RU", "ZH"].map((language) =>
    `S9-CORE-${number}-${language}`);
});
const OWNED_FIXTURE_IDS = ["S9-EVAL-002", ...OWNED_CORE_IDS];
const IMPLEMENTATION_SOURCE_SYMBOLS = [
  "SCENARIO_BLUEPRINTS",
  "CANONICAL_OFFLINE_EVALUATION_CASES",
  "SYNTHETIC_RISK_EVALUATION_FIXTURES",
];
const SOURCE_OF_TRUTH_FIELDS = [
  "user_situation",
  "known_facts",
  "known_assumptions",
  "critical_gaps",
  "important_gaps",
  "input.decision_summary",
  "input.objective",
  "input.known_facts",
  "input.known_uncertainties",
];
const MUTABLE_REFERENCE_FIELDS = [
  "expected_risk_behavior",
  "candidate.output.risks",
];
const PREPARATION_WRITE_SET = [
  SPEC_PATH,
  SEQUENCE_PATH,
  REGISTRY_PATH,
  "scripts/stage-9-risk-entailment-reference-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "package.json",
];
const FUTURE_IMPLEMENTATION_WRITE_SET = [
  CORE_SOURCE_PATH,
  SYNTHETIC_SOURCE_PATH,
  LEDGER_PATH,
  RESULT_PATH,
  PROJECT_CONTEXT_PATH,
];
const MANDATORY_GATES = [
  "quality:stage-9-risk-entailment-reference",
  "quality:stage-9-synthetic-risk-evaluation",
  "quality:stage-9-offline-dataset-coverage",
  "quality:stage-9-remediation-revision-integrity",
];
const PROTECTED_PATHS = [
  "docs/qa/review",
  "docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json",
  "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json",
  "app",
  "components",
  "supabase",
  "lib/ai-provider",
  "lib/prompt-context",
  "lib/decision-engine",
  "lib/runtime-integration",
  "lib/persistence-runtime",
];

const EXPECTED_LEDGER_EVENT = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-04",
  remediation_entry_ids: ["S9-REM-EXPECTED-003"],
  shared_rule_id: SHARED_RULE_ID,
  result_artifact_path: RESULT_PATH,
  generated_at: null,
  implementation_commit_message: COMMIT_MESSAGE,
};
const EXPECTED_RESULT_SCHEMA = {
  artifact_version: "stage-9-invented-risk-mechanism-reference-result.1",
  status: "PASS",
  substep_id: "S9-FIX-04",
  candidate_id: "S9-REM-EXPECTED-003",
  implementation_commit_message: COMMIT_MESSAGE,
  owned_fixture_count: 21,
  owned_cluster_count: 5,
  mandatory_gates: MANDATORY_GATES,
  network_provider_execution_count: 0,
  stage_9_status: "In Progress",
  release_readiness: "NOT_DECLARED",
  runtime_boundaries: "CLOSED",
};

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the S9-FIX-04 gate.");
};

const sequence = json(SEQUENCE_PATH);
const registry = json(REGISTRY_PATH);
const substep = sequence.sequence.find((row) => row.substep_id === "S9-FIX-04");
const candidate = registry.candidates.find((row) =>
  row.candidate_id === "S9-REM-EXPECTED-003");
const specText = read(SPEC_PATH);
const packageJson = json("package.json");
const changedPaths = [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();

const originalLoad = Module._load;
Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(output.outputText, filename);
};

let currentCoreModule;
let currentSyntheticModule;
try {
  currentCoreModule = require(join(root, CORE_SOURCE_PATH));
  currentSyntheticModule = require(join(root, SYNTHETIC_SOURCE_PATH));
} finally {
  Module._load = originalLoad;
}

const currentCoreCases = currentCoreModule.CANONICAL_OFFLINE_EVALUATION_CASES;
const currentSyntheticCases =
  currentSyntheticModule.SYNTHETIC_RISK_EVALUATION_FIXTURES;

function compileBaselineModule(path) {
  const filename = join(root, path);
  const source = execFileSync("git", ["show", `HEAD:${path}`], {
    cwd: root,
    encoding: "utf8",
  });
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const baselineModule = new Module(`${filename}.s9-fix-04-baseline`);
  baselineModule.filename = filename;
  baselineModule.paths = Module._nodeModulePaths(dirname(filename));
  const previousLoad = Module._load;
  Module._load = function loadInternal(request, parent, isMain) {
    if (request === "server-only") return {};
    return previousLoad.call(this, request, parent, isMain);
  };
  try {
    baselineModule._compile(output.outputText, filename);
  } finally {
    Module._load = previousLoad;
  }
  return baselineModule.exports;
}

function contractValid() {
  const entries = [substep, candidate];
  return entries.every(Boolean)
    && same(substep.exact_candidate_scope, ["S9-REM-EXPECTED-003"])
    && same(candidate.affected_fixtures, OWNED_FIXTURE_IDS)
    && same(entries[0].owned_fixture_ids, OWNED_FIXTURE_IDS)
    && same(entries[1].owned_fixture_ids, OWNED_FIXTURE_IDS)
    && entries.every((row) =>
      row.implementation_specification === SPEC_PATH
      && row.implementation_status === "IMPLEMENTATION_READY_NOT_STARTED"
      && row.implementation_executed === false
      && row.owned_fixture_count === 21
      && same(row.owned_cluster_ids, OWNED_CLUSTERS)
      && row.owned_cluster_count === 5
      && same(row.implementation_source_symbols, IMPLEMENTATION_SOURCE_SYMBOLS)
      && same(row.source_of_truth_fields, SOURCE_OF_TRUTH_FIELDS)
      && same(row.mutable_reference_fields, MUTABLE_REFERENCE_FIELDS)
      && same(row.preparation_write_files, PREPARATION_WRITE_SET)
      && same(row.allowed_files ?? row.planned_write_files,
        FUTURE_IMPLEMENTATION_WRITE_SET)
      && same(row.gates ?? row.required_regression_gates, MANDATORY_GATES)
      && row.bounded_result_artifact === RESULT_PATH
      && row.canonical_status_update?.file_path === PROJECT_CONTEXT_PATH
      && row.canonical_status_update?.section_heading === STATUS_HEADING
      && row.shared_rule_id === SHARED_RULE_ID
      && same(row.future_ledger_append_event, EXPECTED_LEDGER_EVENT)
      && same(row.future_result_artifact_schema, EXPECTED_RESULT_SCHEMA)
      && row.case_version_profile?.eligible_case_count === 20
      && row.case_version_profile?.newly_versioned_case_count === 12
      && row.case_version_profile?.already_version_1_1_case_count === 8)
    && substep.commit_message === COMMIT_MESSAGE
    && candidate.implementation_commit_message === COMMIT_MESSAGE
    && packageJson.scripts?.["quality:stage-9-risk-entailment-reference"]
      === "node scripts/stage-9-risk-entailment-reference-quality.mjs"
    && specText.includes("exactly 21 fixtures")
    && specText.includes("Required implementation commit count: exactly one")
    && PREPARATION_WRITE_SET.every((path) => specText.includes(`\`${path}\``))
    && FUTURE_IMPLEMENTATION_WRITE_SET.every((path) =>
      specText.includes(`\`${path}\``))
    && MANDATORY_GATES.every((gate) => specText.includes(`\`${gate}\``))
    && OWNED_FIXTURE_IDS.every((id) => specText.includes(`\`${id}\``));
}

function sourceOwnershipValid() {
  const coreIds = currentCoreCases
    .filter((row) => OWNED_CORE_IDS.includes(row.case_id))
    .map((row) => row.case_id);
  const syntheticIds = currentSyntheticCases
    .filter((row) => row.case_id === "S9-EVAL-002")
    .map((row) => row.case_id);
  return same(coreIds, OWNED_CORE_IDS)
    && same(syntheticIds, ["S9-EVAL-002"])
    && new Set(OWNED_FIXTURE_IDS).size === 21;
}

function projectContextSectionOnlyChanged(baselineText, candidateText) {
  const outsideSection = (text) => {
    const start = text.indexOf(STATUS_HEADING);
    if (start < 0) return null;
    const next = text.indexOf("\n## ", start + STATUS_HEADING.length);
    return `${text.slice(0, start)}${STATUS_HEADING}${next < 0 ? "" : text.slice(next)}`;
  };
  return outsideSection(baselineText) !== null
    && outsideSection(baselineText) === outsideSection(candidateText);
}

function prospectiveContract() {
  const protectedDiff = gitLines("diff", "--name-only", "HEAD", "--",
    ...PROTECTED_PATHS);
  const fixtureDiff = gitLines("diff", "--name-only", "HEAD", "--",
    CORE_SOURCE_PATH, SYNTHETIC_SOURCE_PATH);
  const ledgerStatusResultDiff = gitLines("diff", "--name-only", "HEAD", "--",
    LEDGER_PATH, PROJECT_CONTEXT_PATH, RESULT_PATH);
  const preparationDiffAccepted = changedPaths.length === 0
    || exactPathSet(changedPaths, PREPARATION_WRITE_SET);
  const checks = {
    contract_exact: contractValid(),
    ownership_21_of_21: sourceOwnershipValid(),
    preparation_diff_exact: preparationDiffAccepted,
    fixtures_unchanged: fixtureDiff.length === 0,
    ledger_status_result_unchanged: ledgerStatusResultDiff.length === 0,
    protected_paths_unchanged: protectedDiff.length === 0,
    implementation_not_executed:
      substep.implementation_executed === false
      && candidate.implementation_executed === false
      && !changedPaths.includes(RESULT_PATH),
    network_provider_zero: networkRequests === 0,
  };
  return {
    profile: "S9_FIX_04_RISK_ENTAILMENT_PROSPECTIVE",
    mode: changedPaths.length === 0 ? "committed-preflight" : "preparation-diff",
    substep_id: "S9-FIX-04",
    candidate_id: "S9-REM-EXPECTED-003",
    owned_fixture_count: OWNED_FIXTURE_IDS.length,
    owned_fixture_ids: OWNED_FIXTURE_IDS,
    preparation_write_set: PREPARATION_WRITE_SET,
    future_implementation_write_set: FUTURE_IMPLEMENTATION_WRITE_SET,
    result_artifact_path: RESULT_PATH,
    status_heading: STATUS_HEADING,
    checks,
    passed: Object.values(checks).every(Boolean),
    network_provider_execution_count: networkRequests,
  };
}

const without = (value, keys) => Object.fromEntries(
  Object.entries(value).filter(([key]) => !keys.includes(key)),
);
const normalizeToken = (value) => value.normalize("NFKC")
  .toLocaleLowerCase("und").replace(/[^\p{L}\p{N}_]+/gu, "_");

function coreRiskEntailed(row) {
  const retained = new Set({
    "S9-CLUSTER-014": ["total_cost"],
    "S9-CLUSTER-016": ["rate_exposure"],
    "S9-CLUSTER-019": ["reversibility_loss"],
    "S9-CLUSTER-024": ["permit_delay"],
  }[row.provenance.semantic_cluster_id] ?? []);
  const sourceTokens = [
    ...row.known_facts,
    ...row.known_assumptions,
    ...row.critical_gaps,
    ...row.important_gaps,
  ].map(normalizeToken);
  return row.expected_risk_behavior.every((risk) =>
    risk === "preserve_likelihood_uncertainty"
    || retained.has(risk)
    || sourceTokens.some((token) =>
      normalizeToken(risk) === token
      || normalizeToken(risk) === `${token}_uncertainty`));
}

function postImplementationContract() {
  const baselineCore =
    compileBaselineModule(CORE_SOURCE_PATH).CANONICAL_OFFLINE_EVALUATION_CASES;
  const baselineSynthetic =
    compileBaselineModule(SYNTHETIC_SOURCE_PATH).SYNTHETIC_RISK_EVALUATION_FIXTURES;
  const currentCoreById = new Map(currentCoreCases.map((row) => [row.case_id, row]));
  const baselineCoreById = new Map(baselineCore.map((row) => [row.case_id, row]));
  const currentSyntheticById =
    new Map(currentSyntheticCases.map((row) => [row.case_id, row]));
  const baselineSyntheticById =
    new Map(baselineSynthetic.map((row) => [row.case_id, row]));
  const ownedCore = OWNED_CORE_IDS.map((id) => currentCoreById.get(id));
  const ownedSynthetic = currentSyntheticById.get("S9-EVAL-002");
  const baselineOwnedSynthetic = baselineSyntheticById.get("S9-EVAL-002");
  const forbidden = new Set([
    "location_dependency",
    "retention_risk",
    "rate_reset",
    "mobility_loss",
    "double_housing_cost",
    "nonrefundable_cost",
  ]);
  const syntheticRisks = ownedSynthetic?.candidate?.output?.risks ?? [];
  const syntheticText = normalizeToken(syntheticRisks.flatMap((risk) =>
    [risk.statement, risk.mechanism, risk.uncertainty_note]).join(" "));
  const ledger = json(LEDGER_PATH);
  const result = json(RESULT_PATH);
  const headContext = execFileSync("git", ["show", `HEAD:${PROJECT_CONTEXT_PATH}`],
    { cwd: root, encoding: "utf8" });
  const protectedDiff = gitLines("diff", "--name-only", "HEAD", "--",
    ...PROTECTED_PATHS);
  const nonOwnedCorePreserved = currentCoreCases.every((row) =>
    OWNED_CORE_IDS.includes(row.case_id)
    || same(row, baselineCoreById.get(row.case_id)));
  const nonOwnedSyntheticPreserved = currentSyntheticCases.every((row) =>
    row.case_id === "S9-EVAL-002"
    || same(row, baselineSyntheticById.get(row.case_id)));
  const ownedCoreBoundary = ownedCore.every((row) => {
    const baselineRow = baselineCoreById.get(row.case_id);
    return same(
      without(row, ["case_version", "expected_risk_behavior"]),
      without(baselineRow, ["case_version", "expected_risk_behavior"]),
    ) && row.case_version === "1.1"
      && !same(row.expected_risk_behavior, baselineRow.expected_risk_behavior)
      && !row.expected_risk_behavior.some((risk) => forbidden.has(risk))
      && coreRiskEntailed(row);
  });
  const syntheticBoundary = same(
    without(ownedSynthetic, ["candidate"]),
    without(baselineOwnedSynthetic, ["candidate"]),
  ) && same(
    without(ownedSynthetic.candidate.output, ["risks"]),
    without(baselineOwnedSynthetic.candidate.output, ["risks"]),
  ) && syntheticRisks.length === 3
    && syntheticRisks.every((risk) =>
      Array.isArray(risk.basis_fact_refs) && risk.basis_fact_refs.length === 0)
    && ["demanda", "capacidad", "coste"].every((token) =>
      syntheticText.includes(token));
  const appendedEvents = ledger.appended_events ?? [];
  const ledgerBoundary = appendedEvents.length === 3
    && same(appendedEvents[2], EXPECTED_LEDGER_EVENT);
  const resultSchema = result.status === "PASS"
    && result.artifact_version
      === "stage-9-invented-risk-mechanism-reference-result.1"
    && result.substep_id === "S9-FIX-04"
    && result.candidate_id === "S9-REM-EXPECTED-003"
    && result.owned_fixture_count === 21
    && result.owned_cluster_count === 5
    && result.implementation_commit_message === COMMIT_MESSAGE
    && same(Object.keys(result.mandatory_gates ?? {}), MANDATORY_GATES)
    && Object.values(result.mandatory_gates ?? {}).every((status) =>
      status === "PASS")
    && result.network_provider_execution_count === 0
    && result.stage_9_status === "In Progress"
    && result.release_readiness === "NOT_DECLARED"
    && result.runtime_boundaries === "CLOSED";
  const checks = {
    exact_future_diff: exactPathSet(changedPaths, FUTURE_IMPLEMENTATION_WRITE_SET),
    ownership_21_of_21: sourceOwnershipValid(),
    owned_core_source_entailment: ownedCoreBoundary,
    owned_synthetic_source_entailment: syntheticBoundary,
    unrelated_core_preserved: nonOwnedCorePreserved,
    unrelated_synthetic_preserved: nonOwnedSyntheticPreserved,
    ledger_append_profile: ledgerBoundary,
    result_schema: resultSchema,
    status_section_only: projectContextSectionOnlyChanged(
      headContext,
      read(PROJECT_CONTEXT_PATH),
    ),
    protected_paths_unchanged: protectedDiff.length === 0,
    network_provider_zero: networkRequests === 0,
  };
  return {
    profile: "S9_FIX_04_RISK_ENTAILMENT_POST_IMPLEMENTATION",
    substep_id: "S9-FIX-04",
    owned_fixture_count: 21,
    checks,
    passed: Object.values(checks).every(Boolean),
    network_provider_execution_count: networkRequests,
  };
}

const postMode = process.argv.includes("--post-implementation");
const jsonMode = process.argv.includes("--prospective-json");
const contract = postMode ? postImplementationContract() : prospectiveContract();
globalThis.fetch = originalFetch;

if (jsonMode) {
  process.stdout.write(canonicalJson(contract));
} else {
  for (const [id, passed] of Object.entries(contract.checks)) {
    console[passed ? "log" : "error"](`${passed ? "PASS" : "FAIL"} ${id}`);
  }
  console.log(`REPORT profile=${contract.profile} ownership=${contract.owned_fixture_count}/21 implementation=${postMode ? "candidate" : "not_executed"} network=${contract.network_provider_execution_count}`);
  console.log(`${Object.values(contract.checks).filter(Boolean).length}/${Object.keys(contract.checks).length} checks passed.`);
}
if (!contract.passed) process.exitCode = 1;
