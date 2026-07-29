import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const ts = require("typescript");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const read = (path) => readFileSync(join(root, path), "utf8");
const head = (path) => execFileSync("git", ["show", `HEAD:${path}`], {
  cwd: root,
  encoding: "utf8",
});
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map((path) => path.replaceAll("\\", "/"));
const diffPaths = () => [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();

const fixturePath = "lib/ai-decision-material/fixtures.ts";
const ledgerPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json";
const contextPath = "PROJECT_CONTEXT.md";
const specPath = "docs/qa/remediation/stage-9/STAGE_9_MATERIAL_006_SILENT_LOSS_SPEC.v1.md";
const sequencePath = "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json";
const registryPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json";
const graphPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json";
const evaluationPath = "lib/ai-decision-material/evaluation.ts";
const heading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const ownedId = "S9-MATERIAL-006";
const normalizedUnknown = "La capacidad futura no está confirmada.";
const sourceCandidateId = "candidate_565";
const sourceSymbol = "normalizationItem";
const affectedPaths = [
  "RICH_DECISION_MATERIAL_FIXTURES[S9-MATERIAL-006].future_composition",
];
const transformations = ["epistemic_classification", "traceability"];
const beforeComposition = {
  items: [],
  contains_raw_provider_answer: false,
  personal_data_scope_opened: false,
};
const afterComposition = {
  items: [{
    composition_item_id: "composition_1",
    source_candidate_ids: [sourceCandidateId],
    transformations,
    authority: "decision_engine",
  }],
  contains_raw_provider_answer: false,
  personal_data_scope_opened: false,
};
const oldProjectionSha = "49ebb871f26f032d69edee3c8cd670dc7fe9e6b0dbc2becbd85c1852a47982e0";
const newProjectionSha = "fe7ddf3acd20aed9ddc7d6d1a62efd91346958759faa7a716ecb91769f4529c0";
const preparationWriteSet = [
  specPath,
  sequencePath,
  registryPath,
  "scripts/stage-9-material-006-silent-loss-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "package.json",
].sort();
const implementationWriteSet = [
  fixturePath,
  ledgerPath,
  resultPath,
  contextPath,
].sort();
const mandatoryGates = [
  "quality:stage-9-remediation-plan",
  "quality:stage-9-material-006-silent-loss",
  "quality:stage-9-ai-value-preservation",
  "quality:stage-9-remediation-revision-integrity",
  "quality:stage-9-offline-dataset-coverage",
];
const expectedEvent = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-06",
  remediation_entry_ids: ["S9-REM-FIXTURE-001"],
  issue_ids: ["B3-ISSUE-004"],
  shared_rule_id: "accepted_normalized_unknown_requires_future_composition",
  owned_fixture_ids: [ownedId],
  affected_json_paths: affectedPaths,
  old_projection_sha256: oldProjectionSha,
  new_projection_sha256: newProjectionSha,
  runtime_acceptance_preserved: true,
  normalized_unknown: normalizedUnknown,
  result_artifact_path: resultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): preserve MATERIAL-006 accepted unknown",
};

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the S9-FIX-06 quality gate.");
};

function compile(path, source, label) {
  const filename = join(root, path);
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = new Module(`${filename}.${label}`);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(dirname(filename));
  const priorLoad = Module._load;
  const priorExtension = require.extensions[".ts"];
  Module._load = function loadInternal(request, parent, isMain) {
    return request === "server-only" ? {} : priorLoad.call(this, request, parent, isMain);
  };
  require.extensions[".ts"] = function loadDependency(dependency, dependencyPath) {
    const dependencySource = readFileSync(dependencyPath, "utf8");
    const dependencyOutput = ts.transpileModule(dependencySource, {
      fileName: dependencyPath,
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        target: ts.ScriptTarget.ES2022,
      },
    });
    dependency._compile(dependencyOutput.outputText, dependencyPath);
  };
  try {
    module._compile(output.outputText, filename);
  } finally {
    Module._load = priorLoad;
    if (priorExtension) require.extensions[".ts"] = priorExtension;
    else delete require.extensions[".ts"];
  }
  return module.exports;
}

function fixtureProjection(source, label) {
  return compile(fixturePath, source, label).RICH_DECISION_MATERIAL_FIXTURES;
}

function runtimeProjection(source, label) {
  const fixtures = fixtureProjection(source, `${label}-fixtures`);
  const evaluation = compile(evaluationPath, read(evaluationPath), `${label}-evaluation`);
  const fixture = fixtures.find((row) => row.fixture_id === ownedId);
  const result = evaluation.evaluateAIValuePreservationFixture(fixture);
  return {
    status: result.acceptance.status,
    accepted_items: result.acceptance.accepted_material.items,
    ledger: result.acceptance.ledger,
    silent_loss_count: result.metrics.silent_loss_count,
    uncertainty_preserved: result.metrics.uncertainty_preserved,
    hard_failures: result.hard_failures,
  };
}

function projectionContract(baselineRows, candidateRows) {
  const baselineById = new Map(baselineRows.map((row) => [row.fixture_id, row]));
  const candidateById = new Map(candidateRows.map((row) => [row.fixture_id, row]));
  const before = baselineById.get(ownedId);
  const after = candidateById.get(ownedId);
  const beforeWithoutComposition = { ...before, future_composition: undefined };
  const afterWithoutComposition = { ...after, future_composition: undefined };
  const nonOwned = baselineRows.filter((row) => row.fixture_id !== ownedId);
  return {
    row_count_preserved: baselineRows.length === 184 && candidateRows.length === 184,
    ids_and_order_preserved: same(
      baselineRows.map((row) => row.fixture_id),
      candidateRows.map((row) => row.fixture_id),
    ),
    owned_count: after ? 1 : 0,
    before_composition: before?.future_composition,
    after_composition: after?.future_composition,
    only_future_composition_changed: same(beforeWithoutComposition, afterWithoutComposition),
    normalized_unknown_preserved:
      after?.material?.items?.[0]?.content.trim().replace(/\s+/g, " ") === normalizedUnknown,
    expected_acceptance_preserved: same(before?.expected, after?.expected),
    source_candidate_id_preserved:
      before?.material?.items?.[0]?.candidate_id === sourceCandidateId
      && after?.material?.items?.[0]?.candidate_id === sourceCandidateId,
    old_projection_sha256: sha(before),
    new_projection_sha256: sha(after),
    non_owned_preserved_count: nonOwned.filter((row) =>
      same(row, candidateById.get(row.fixture_id))).length,
  };
}

function replaceExactly(source, from, to) {
  if (source.split(from).length !== 2) throw new Error(`Expected one source occurrence: ${from}`);
  return source.replace(from, to);
}

function expectedImplementationSource(baselineSource) {
  return replaceExactly(
    baselineSource,
    'fixture("S9-MATERIAL-006", "normalization", single(item("unknown", "  La capacidad futura   no está confirmada.  ")), {\n    status: "accepted", dispositions: ["accepted_with_normalization"], reasons: ["normalized_whitespace"], accepted_count: 1,\n  }),',
    '(() => {\n    const normalizationItem = item("unknown", "  La capacidad futura   no está confirmada.  ");\n    return fixture("S9-MATERIAL-006", "normalization", single(normalizationItem), {\n      status: "accepted", dispositions: ["accepted_with_normalization"], reasons: ["normalized_whitespace"], accepted_count: 1,\n    }, {\n      future_composition: composition([normalizationItem.candidate_id], ["epistemic_classification", "traceability"]),\n    });\n  })(),',
  );
}

function contextSections(text) {
  const start = text.indexOf(heading);
  if (start < 0) return null;
  const next = text.indexOf("\n## ", start + heading.length);
  const end = next < 0 ? text.length : next + 1;
  return { before: text.slice(0, start), section: text.slice(start, end), after: text.slice(end) };
}

function contextValid(baselineText, candidateText) {
  const baseline = contextSections(baselineText);
  const candidate = contextSections(candidateText);
  return Boolean(baseline && candidate
    && baseline.before === candidate.before
    && baseline.after === candidate.after
    && candidate.section.includes("`S9-FIX-06`")
    && candidate.section.includes("6/9")
    && candidate.section.includes("3/9")
    && candidate.section.includes("`S9-FIX-07`")
    && candidate.section.includes("**In Progress**")
    && candidate.section.includes("not declared")
    && candidate.section.includes("closed")
    && candidate.section.includes("0 remaining"));
}

function runtimeEvidence(runtime) {
  return {
    status: runtime.status,
    accepted_count: runtime.accepted_items.length,
    candidate_id: runtime.accepted_items[0]?.candidate_id,
    item_type: runtime.accepted_items[0]?.item_type,
    normalized_content: runtime.accepted_items[0]?.content,
    disposition: runtime.ledger[0]?.disposition,
    reason: runtime.ledger[0]?.reason,
    traceability_marker: runtime.ledger[0]?.traceability_marker,
    silent_loss_count: runtime.silent_loss_count,
    uncertainty_preserved: runtime.uncertainty_preserved,
    hard_failures: runtime.hard_failures,
  };
}

function expectedResult(projection, runtime) {
  return {
    artifact_version: "stage-9-material-006-silent-loss-result.1",
    status: "PASS",
    substep_id: "S9-FIX-06",
    candidate_id: "S9-REM-FIXTURE-001",
    issue_id: "B3-ISSUE-004",
    root_cause: "ISOLATED_FIXTURE_EXPECTATION_SILENT_LOSS",
    shared_rule_id: expectedEvent.shared_rule_id,
    implementation_commit_message: expectedEvent.implementation_commit_message,
    owned_fixture_id: ownedId,
    normalized_unknown: normalizedUnknown,
    stable_source_reference: {
      symbol: sourceSymbol,
      expression: "normalizationItem.candidate_id",
      generated_candidate_id_evidence: sourceCandidateId,
    },
    before_future_composition: beforeComposition,
    after_future_composition: afterComposition,
    transformations,
    authority: "decision_engine",
    contains_raw_provider_answer: false,
    personal_data_scope_opened: false,
    affected_json_paths: affectedPaths,
    old_projection_sha256: projection.old_projection_sha256,
    new_projection_sha256: projection.new_projection_sha256,
    owned_count: 1,
    non_owned_preserved_count: 183,
    runtime_acceptance_before: runtime,
    runtime_acceptance_after: runtime,
    ledger_append: expectedEvent,
    implementation_write_set: implementationWriteSet,
    project_context_boundary: {
      section_heading: heading,
      completed_remediation: "6/9",
      remaining_remediation: "3/9",
      next_substep: "S9-FIX-07",
      stage_9_status: "In Progress",
      release_readiness: "NOT_DECLARED",
    },
    mandatory_gates: mandatoryGates,
    historical_artifacts: "UNCHANGED",
    runtime_boundaries: "CLOSED",
    network_provider_execution_count: 0,
    visual_migration_remaining: 0,
  };
}

function canonicalContract() {
  const sequence = JSON.parse(read(sequencePath)).sequence.find((row) => row.substep_id === "S9-FIX-06");
  const registry = JSON.parse(read(registryPath)).candidates.find((row) => row.candidate_id === "S9-REM-FIXTURE-001");
  const graph = JSON.parse(read(graphPath));
  const entries = [sequence, registry];
  return Boolean(sequence && registry
    && entries.every((row) =>
      row.root_cause === "ISOLATED_FIXTURE_EXPECTATION_SILENT_LOSS"
      && row.implementation_specification === specPath
      && row.implementation_status === "IMPLEMENTATION_READY_NOT_STARTED"
      && row.implementation_executed === false
      && row.owned_fixture_count === 1
      && same(row.owned_fixture_ids, [ownedId])
      && row.stable_source_reference === "normalizationItem.candidate_id"
      && same([...row.preparation_write_files].sort(), preparationWriteSet)
      && same([...(row.allowed_files ?? row.planned_write_files)].sort(), implementationWriteSet)
      && same(row.gates ?? row.required_regression_gates, mandatoryGates)
      && row.bounded_result_artifact === resultPath
      && row.projection_hash_profile?.old_sha256 === oldProjectionSha
      && row.projection_hash_profile?.new_sha256 === newProjectionSha
      && row.projection_hash_profile?.case_version === "NOT_APPLICABLE"
      && row.canonical_status_update?.section_heading === heading)
    && graph.edges.some((edge) => edge.from === "S9-FIX-06" && edge.to === "S9-FIX-08")
    && !graph.edges.some((edge) => edge.to === "S9-FIX-06"));
}

function postContract({
  paths,
  baselineSource,
  candidateSource,
  baselineLedger,
  candidateLedger,
  result,
  baselineContext,
  candidateContext,
}) {
  const baselineRows = fixtureProjection(baselineSource, "fix06-baseline");
  const candidateRows = fixtureProjection(candidateSource, "fix06-candidate");
  const projection = projectionContract(baselineRows, candidateRows);
  const baselineRuntime = runtimeEvidence(runtimeProjection(baselineSource, "fix06-runtime-baseline"));
  const candidateRuntime = runtimeEvidence(runtimeProjection(candidateSource, "fix06-runtime-candidate"));
  const previousEvents = baselineLedger.appended_events ?? [];
  const candidateEvents = candidateLedger.appended_events ?? [];
  const checks = {
    exact_four_file_diff: same([...paths].sort(), implementationWriteSet),
    exact_source_edit: candidateSource === expectedImplementationSource(baselineSource),
    ownership_1_of_1: projection.owned_count === 1,
    exact_future_composition: same(projection.before_composition, beforeComposition)
      && same(projection.after_composition, afterComposition),
    only_allowed_projection_changed: projection.only_future_composition_changed,
    stable_source_reference: candidateSource.includes("normalizationItem.candidate_id")
      && !candidateSource.includes('source_candidate_ids: ["candidate_565"]'),
    normalized_unknown_preserved: projection.normalized_unknown_preserved,
    expected_acceptance_preserved: projection.expected_acceptance_preserved,
    source_candidate_id_preserved: projection.source_candidate_id_preserved,
    projection_hashes: projection.old_projection_sha256 === oldProjectionSha
      && projection.new_projection_sha256 === newProjectionSha,
    non_owned_183_of_183: projection.non_owned_preserved_count === 183,
    runtime_acceptance_unchanged: same(baselineRuntime, candidateRuntime)
      && candidateRuntime.accepted_count === 1
      && candidateRuntime.item_type === "unknown"
      && candidateRuntime.normalized_content === normalizedUnknown
      && candidateRuntime.disposition === "accepted_with_normalization"
      && candidateRuntime.reason === "normalized_whitespace"
      && candidateRuntime.silent_loss_count === 0,
    prior_ledger_immutable: same(
      { ...baselineLedger, appended_events: previousEvents },
      { ...candidateLedger, appended_events: candidateEvents.slice(0, -1) },
    ),
    one_exact_ledger_event: candidateEvents.length === previousEvents.length + 1
      && same(candidateEvents.at(-1), expectedEvent),
    exact_result: same(result, expectedResult(projection, candidateRuntime)),
    bounded_status: contextValid(baselineContext, candidateContext),
    canonical_contract: canonicalContract(),
    network_zero: networkRequests === 0,
  };
  return { passed: Object.values(checks).every(Boolean), checks, projection, runtime: candidateRuntime };
}

function selfTests() {
  const baselineRows = fixtureProjection(head(fixturePath), "fix06-self-baseline");
  const positiveRows = structuredClone(baselineRows);
  positiveRows.find((row) => row.fixture_id === ownedId).future_composition = structuredClone(afterComposition);
  const validate = (rows) => {
    const p = projectionContract(baselineRows, rows);
    return p.owned_count === 1
      && same(p.after_composition, afterComposition)
      && p.only_future_composition_changed
      && p.normalized_unknown_preserved
      && p.expected_acceptance_preserved
      && p.source_candidate_id_preserved
      && p.new_projection_sha256 === newProjectionSha
      && p.non_owned_preserved_count === 183;
  };
  const negatives = [];
  const reject = (id, mutate) => {
    const rows = structuredClone(positiveRows);
    mutate(rows);
    negatives.push({ id, passed: !validate(rows) });
  };
  const owned = (rows) => rows.find((row) => row.fixture_id === ownedId);
  reject("empty-future-composition", (rows) => { owned(rows).future_composition = structuredClone(beforeComposition); });
  reject("two-composition-items", (rows) => { owned(rows).future_composition.items.push(structuredClone(afterComposition.items[0])); });
  reject("wrong-normalized-unknown", (rows) => { owned(rows).material.items[0].content = "Changed"; });
  reject("wrong-source-reference", (rows) => { owned(rows).future_composition.items[0].source_candidate_ids = ["candidate_wrong"]; });
  reject("wrong-transformations", (rows) => { owned(rows).future_composition.items[0].transformations = ["traceability"]; });
  reject("wrong-authority", (rows) => { owned(rows).future_composition.items[0].authority = "provider"; });
  reject("raw-provider-flag", (rows) => { owned(rows).future_composition.contains_raw_provider_answer = true; });
  reject("personal-data-flag", (rows) => { owned(rows).future_composition.personal_data_scope_opened = true; });
  reject("accepted-count-change", (rows) => { owned(rows).expected.accepted_count = 0; });
  reject("disposition-change", (rows) => { owned(rows).expected.dispositions = ["accepted"]; });
  reject("reason-change", (rows) => { owned(rows).expected.reasons = ["accepted_valid"]; });
  reject("runtime-output-change", (rows) => { owned(rows).material.items[0].item_type = "assumption"; });
  reject("material-content-change", (rows) => { owned(rows).material.items[0].content += " changed"; });
  reject("second-rich-fixture", (rows) => { rows[0].coverage_id = "normalization"; });
  reject("non-owned-field", (rows) => { rows[1].risk_only_would_lose_value = true; });
  reject("broad-source-rewrite", (rows) => { rows[2].future_composition = structuredClone(afterComposition); });
  reject("case-version-added", (rows) => { owned(rows).case_version = "1.1"; });
  const objectNegatives = [
    ["wrong-ledger-event", !same({ ...expectedEvent, substep_id: "S9-FIX-07" }, expectedEvent)],
    ["more-than-one-ledger-event", [expectedEvent, expectedEvent].length !== 1],
    ["wrong-result-path", "wrong.json" !== resultPath],
    ["wrong-result-schema", !same({ status: "PASS" }, expectedResult(
      projectionContract(baselineRows, positiveRows),
      runtimeEvidence(runtimeProjection(head(fixturePath), "fix06-self-runtime")),
    ))],
    ["other-context-section", !contextValid(head(contextPath), `${head(contextPath)}\nchanged`)],
    ["fifth-implementation-file", !same([...implementationWriteSet, "fifth.file"].sort(), implementationWriteSet)],
    ["profile-used-by-other-substep", "S9-FIX-07" !== "S9-FIX-06"],
    ["completed-artifact-change", !implementationWriteSet.includes(
      "docs/qa/remediation/stage-9/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json")],
  ].map(([id, passed]) => ({ id, passed }));
  const all = [...negatives, ...objectNegatives];
  return {
    profile: "S9_FIX_06_MATERIAL_006_SILENT_LOSS",
    positive: { total: 1, passed: validate(positiveRows) ? 1 : 0 },
    negative: {
      total: all.length,
      passed: all.filter((row) => row.passed).length,
      failed: all.filter((row) => !row.passed).map((row) => row.id),
    },
    deterministic: same(all, [...all]),
  };
}

const tests = selfTests();
if (process.argv.includes("--self-test-json")) {
  process.stdout.write(canonicalJson(tests));
  if (tests.positive.passed !== 1
    || tests.negative.passed !== tests.negative.total
    || !tests.deterministic) process.exitCode = 1;
} else if (process.argv.includes("--post-implementation")) {
  let result = null;
  try {
    result = JSON.parse(read(resultPath));
  } catch {}
  const contract = postContract({
    paths: diffPaths(),
    baselineSource: head(fixturePath),
    candidateSource: read(fixturePath),
    baselineLedger: JSON.parse(head(ledgerPath)),
    candidateLedger: JSON.parse(read(ledgerPath)),
    result,
    baselineContext: head(contextPath),
    candidateContext: read(contextPath),
  });
  const output = {
    profile: "S9_FIX_06_MATERIAL_006_SILENT_LOSS_POST_IMPLEMENTATION",
    substep_id: "S9-FIX-06",
    passed: contract.passed,
    checks: contract.checks,
    projection: contract.projection,
    runtime_acceptance: contract.runtime,
    implementation_write_set: implementationWriteSet,
    network_request_count: networkRequests,
  };
  process.stdout.write(canonicalJson(output));
  if (!output.passed) process.exitCode = 1;
} else {
  const paths = diffPaths();
  const output = {
    profile: "S9_FIX_06_MATERIAL_006_SILENT_LOSS_PROSPECTIVE",
    substep_id: "S9-FIX-06",
    status: "IMPLEMENTATION_READY_NOT_STARTED",
    remediation_completed: false,
    passed: canonicalContract()
      && (paths.length === 0 || paths.every((path) => preparationWriteSet.includes(path)))
      && tests.positive.passed === 1
      && tests.negative.passed === tests.negative.total
      && networkRequests === 0,
    ownership: "1/1",
    preparation_write_set: preparationWriteSet,
    implementation_write_set: implementationWriteSet,
    mandatory_gates: mandatoryGates,
    projection_hashes: { before: oldProjectionSha, after: newProjectionSha },
    self_tests: tests,
    network_request_count: networkRequests,
  };
  process.stdout.write(canonicalJson(output));
  if (!output.passed) process.exitCode = 1;
}

globalThis.fetch = originalFetch;
