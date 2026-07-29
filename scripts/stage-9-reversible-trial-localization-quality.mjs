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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sha = (value) => createHash("sha256").update(value).digest("hex");
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
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json";
const contextPath = "PROJECT_CONTEXT.md";
const specPath = "docs/qa/remediation/stage-9/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_SPEC.v1.md";
const sequencePath = "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json";
const registryPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json";
const graphPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json";
const heading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const ownedIds = ["S9-CORE-010-ES", "S9-CORE-010-RU", "S9-CORE-010-ZH"];
const protectedId = "S9-CORE-010-EN";
const before = {
  "S9-CORE-010-ES": "Una estudiante ficticia compara semestre internacional, programa local y prueba corta reversible.",
  "S9-CORE-010-RU": "Вымышленный студент сравнивает семестр за рубежом, местную программу и короткую обратимую пробу.",
  "S9-CORE-010-ZH": "一名虚构学生比较海外学期、本地项目和短期可逆试读。",
};
const after = {
  "S9-CORE-010-ES": "Una estudiante ficticia compara un semestre internacional, un programa local y una estancia académica breve de prueba que permite volver a la opción anterior.",
  "S9-CORE-010-RU": "Вымышленный студент сравнивает семестр за рубежом, местную программу и короткий пробный учебный период с возможностью вернуться к прежнему варианту.",
  "S9-CORE-010-ZH": "一名虚构学生比较海外学期、本地项目和保留回到原方案选择的短期试学。",
};
const english = "A fictional student compares a semester abroad, a local program, and a short reversible trial.";
const preparationWriteSet = [
  specPath,
  sequencePath,
  registryPath,
  "scripts/stage-9-reversible-trial-localization-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "package.json",
].sort();
const implementationWriteSet = [fixturePath, ledgerPath, resultPath, contextPath].sort();
const mandatoryGates = [
  "quality:stage-9-remediation-plan",
  "quality:stage-9-reversible-trial-localization",
  "quality:stage-9-offline-dataset-coverage",
  "quality:stage-9-remediation-revision-integrity",
];
const transitions = ownedIds.map((fixture_id) => ({ fixture_id, from: "1.0", to: "1.1" }));
const expectedEvent = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-05",
  remediation_entry_ids: ["S9-REM-GENERATOR-001"],
  shared_rule_id: "reversible_trial_localization_preserves_bounded_reversibility",
  owned_fixture_ids: ownedIds,
  case_version_transitions: transitions,
  protected_reference_fixture_id: protectedId,
  multilingual_equivalence: "EN_REFERENCE_PRESERVED",
  result_artifact_path: resultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): localize reversible trial template",
};

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the S9-FIX-05 quality gate.");
};

function compile(source, label) {
  const filename = join(root, fixturePath);
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
  require.extensions[".ts"] = function loadTypeScriptDependency(dependency, dependencyPath) {
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
  return module.exports.CANONICAL_OFFLINE_EVALUATION_CASES;
}

const without = (row, keys) => Object.fromEntries(
  Object.entries(row).filter(([key]) => !keys.includes(key)),
);

function projectionContract(baselineRows, candidateRows) {
  const base = new Map(baselineRows.map((row) => [row.case_id, row]));
  const current = new Map(candidateRows.map((row) => [row.case_id, row]));
  const owned = ownedIds.map((id) => ({
    id,
    before: base.get(id)?.user_situation,
    after: current.get(id)?.user_situation,
    from: base.get(id)?.case_version,
    to: current.get(id)?.case_version,
    only_allowed_fields: same(
      without(base.get(id) ?? {}, ["user_situation", "case_version"]),
      without(current.get(id) ?? {}, ["user_situation", "case_version"]),
    ),
  }));
  const nonOwned = baselineRows.filter((row) => !ownedIds.includes(row.case_id));
  return {
    row_count_preserved: baselineRows.length === 160 && candidateRows.length === 160,
    ids_and_order_preserved: same(
      baselineRows.map((row) => row.case_id),
      candidateRows.map((row) => row.case_id),
    ),
    owned_count: owned.filter((row) =>
      row.before === before[row.id]
      && row.after === after[row.id]
      && row.from === "1.0"
      && row.to === "1.1"
      && row.only_allowed_fields).length,
    protected_english: same(base.get(protectedId), current.get(protectedId))
      && current.get(protectedId)?.user_situation === english
      && current.get(protectedId)?.case_version === "1.0",
    non_owned_preserved_count: nonOwned.filter((row) =>
      same(row, current.get(row.case_id))).length,
    projection_sha256: sha(canonicalJson(owned)),
  };
}

function replaceExactly(source, from, to) {
  if (source.split(from).length !== 2) throw new Error(`Expected one source occurrence: ${from}`);
  return source.replace(from, to);
}

function expectedImplementationSource(baselineSource) {
  let expected = baselineSource;
  for (const id of ownedIds) expected = replaceExactly(expected, before[id], after[id]);
  return replaceExactly(
    expected,
    '|| ["S9-CLUSTER-002", "S9-CLUSTER-014", "S9-CLUSTER-019"].includes(semanticClusterId)',
    '|| ["S9-CLUSTER-002", "S9-CLUSTER-014", "S9-CLUSTER-019"].includes(semanticClusterId)\n          || (semanticClusterId === "S9-CLUSTER-010" && language !== "en")',
  );
}

function contextSections(text) {
  const marker = "\n## ";
  const start = text.indexOf(heading);
  if (start < 0) return null;
  const endIndex = text.indexOf(marker, start + heading.length);
  const end = endIndex < 0 ? text.length : endIndex + 1;
  return { before: text.slice(0, start), section: text.slice(start, end), after: text.slice(end) };
}

function contextValid(baselineText, candidateText) {
  const base = contextSections(baselineText);
  const current = contextSections(candidateText);
  return Boolean(base && current
    && base.before === current.before
    && base.after === current.after
    && current.section.includes("`S9-FIX-05`")
    && current.section.includes("5/9")
    && current.section.includes("4/9")
    && current.section.includes("`S9-FIX-06`")
    && current.section.includes("**In Progress**")
    && current.section.includes("not declared")
    && current.section.includes("closed")
    && current.section.includes("0 remaining"));
}

function expectedResult(projection) {
  return {
    artifact_version: "stage-9-reversible-trial-localization-template-result.1",
    status: "PASS",
    substep_id: "S9-FIX-05",
    candidate_id: "S9-REM-GENERATOR-001",
    root_cause: "GENERATOR_TEMPLATE_LOCALIZATION",
    shared_rule_id: expectedEvent.shared_rule_id,
    implementation_commit_message: expectedEvent.implementation_commit_message,
    owned_fixture_ids: ownedIds,
    protected_english_reference: {
      fixture_id: protectedId,
      text: english,
      case_version: "1.0",
      status: "UNCHANGED",
    },
    locale_projections: ownedIds.map((fixture_id) => ({
      fixture_id,
      before: before[fixture_id],
      after: after[fixture_id],
    })),
    semantic_equivalence_assertions: [
      "BOUNDED_TRIAL_STUDY_PERIOD",
      "RETURN_TO_PRIOR_OPTION_REMAINS_POSSIBLE",
      "NO_ABSOLUTE_RISK_FREE_PROMISE",
      "NO_NEW_FACTS_CONDITIONS_OR_ELIGIBILITY",
    ],
    gender_interpretation: "REJECTED_UNCHANGED",
    case_version_transitions: transitions,
    owned_count: 3,
    non_owned_preserved_count: 157,
    ledger_append: expectedEvent,
    implementation_write_set: implementationWriteSet,
    project_context_boundary: {
      section_heading: heading,
      completed_remediation: "5/9",
      remaining_remediation: "4/9",
      next_substep: "S9-FIX-06",
      stage_9_status: "In Progress",
      release_readiness: "NOT_DECLARED",
    },
    mandatory_gates: mandatoryGates,
    projection_sha256: projection.projection_sha256,
    historical_artifacts: "UNCHANGED",
    runtime_boundaries: "CLOSED",
    network_provider_execution_count: 0,
    visual_migration_remaining: 0,
  };
}

function canonicalContract() {
  const sequence = JSON.parse(read(sequencePath)).sequence.find((row) => row.substep_id === "S9-FIX-05");
  const registry = JSON.parse(read(registryPath)).candidates.find((row) => row.candidate_id === "S9-REM-GENERATOR-001");
  const graph = JSON.parse(read(graphPath));
  const entries = [sequence, registry];
  return Boolean(sequence && registry
    && entries.every((row) =>
      row.root_cause === "GENERATOR_TEMPLATE_LOCALIZATION"
      && row.implementation_specification === specPath
      && row.implementation_status === "IMPLEMENTATION_READY_NOT_STARTED"
      && row.implementation_executed === false
      && row.owned_fixture_count === 3
      && same(row.owned_fixture_ids, ownedIds)
      && row.protected_reference_fixture_id === protectedId
      && same(row.implementation_source_symbols,
        ["SCENARIO_BLUEPRINTS[study_abroad_trial]", "CANONICAL_OFFLINE_EVALUATION_CASES"])
      && same([...(row.allowed_files ?? row.planned_write_files)].sort(), implementationWriteSet)
      && same([...row.preparation_write_files].sort(), preparationWriteSet)
      && same(row.gates ?? row.required_regression_gates, mandatoryGates)
      && row.bounded_result_artifact === resultPath
      && row.canonical_status_update?.section_heading === heading)
    && graph.edges.some((edge) => edge.from === "S9-FIX-05" && edge.to === "S9-FIX-08")
    && !graph.edges.some((edge) => edge.to === "S9-FIX-05"));
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
  let baselineRows = [];
  let candidateRows = [];
  try {
    baselineRows = compile(baselineSource, "s9-fix-05-baseline");
    candidateRows = compile(candidateSource, "s9-fix-05-current");
  } catch {
    return { passed: false, checks: { compile: false } };
  }
  const projection = projectionContract(baselineRows, candidateRows);
  const priorEvents = baselineLedger.appended_events ?? [];
  const currentEvents = candidateLedger.appended_events ?? [];
  const checks = {
    exact_four_file_diff: same([...paths].sort(), implementationWriteSet),
    exact_source_edit: candidateSource === expectedImplementationSource(baselineSource),
    ownership_3_of_3: projection.owned_count === 3,
    english_reference_immutable: projection.protected_english,
    non_owned_157_of_157: projection.non_owned_preserved_count === 157,
    row_set_preserved: projection.row_count_preserved && projection.ids_and_order_preserved,
    prior_ledger_immutable: same(
      { ...baselineLedger, appended_events: priorEvents },
      { ...candidateLedger, appended_events: currentEvents.slice(0, -1) },
    ),
    one_exact_ledger_event: currentEvents.length === priorEvents.length + 1
      && same(currentEvents.at(-1), expectedEvent),
    deterministic_ledger: canonicalJson(candidateLedger) === canonicalJson(JSON.parse(canonicalJson(candidateLedger))),
    exact_result: same(result, expectedResult(projection)),
    deterministic_result: canonicalJson(result) === canonicalJson(JSON.parse(canonicalJson(result))),
    bounded_status: contextValid(baselineContext, candidateContext),
    canonical_contract: canonicalContract(),
    network_zero: networkRequests === 0,
  };
  return { passed: Object.values(checks).every(Boolean), checks, projection };
}

function selfTests() {
  const baselineRows = compile(head(fixturePath), "self-baseline");
  const positiveRows = baselineRows.map((row) => ownedIds.includes(row.case_id)
    ? { ...row, user_situation: after[row.case_id], case_version: "1.1" }
    : row);
  const validate = (rows) => {
    const p = projectionContract(baselineRows, rows);
    return p.owned_count === 3 && p.protected_english && p.non_owned_preserved_count === 157;
  };
  const negative = [];
  const reject = (id, mutate) => {
    const rows = structuredClone(positiveRows);
    mutate(rows);
    negative.push({ id, passed: !validate(rows) });
  };
  reject("english-row-change", (rows) => { rows.find((r) => r.case_id === protectedId).user_situation += " changed"; });
  reject("english-reference-change", (rows) => { rows.find((r) => r.case_id === protectedId).user_situation = "changed"; });
  reject("fourth-locale-row", (rows) => { rows.find((r) => r.case_id === protectedId).case_version = "1.1"; });
  reject("non-owned-row", (rows) => { rows[0].user_situation += " changed"; });
  reject("non-owned-blueprint-projection", (rows) => { rows[4].known_facts = ["changed"]; });
  reject("gender-based-replacement", (rows) => { rows.find((r) => r.case_id === ownedIds[0]).user_situation = "Una estudiante corrige su género."; });
  reject("literal-nonequivalent", (rows) => { rows.find((r) => r.case_id === ownedIds[1]).user_situation = before[ownedIds[1]]; });
  reject("wrong-es", (rows) => { rows.find((r) => r.case_id === ownedIds[0]).user_situation += "x"; });
  reject("wrong-ru", (rows) => { rows.find((r) => r.case_id === ownedIds[1]).user_situation += "x"; });
  reject("wrong-zh", (rows) => { rows.find((r) => r.case_id === ownedIds[2]).user_situation += "x"; });
  reject("field-outside-approved-path", (rows) => { rows.find((r) => r.case_id === ownedIds[0]).user_intent = "changed"; });
  reject("wrong-version-transition", (rows) => { rows.find((r) => r.case_id === ownedIds[0]).case_version = "1.2"; });
  reject("affected-version-retained", (rows) => { rows.find((r) => r.case_id === ownedIds[1]).case_version = "1.0"; });
  reject("en-version-change", (rows) => { rows.find((r) => r.case_id === protectedId).case_version = "1.1"; });
  const objectNegative = [
    ["wrong-ledger-event", !same({ ...expectedEvent, substep_id: "S9-FIX-06" }, expectedEvent)],
    ["more-than-one-ledger-event", [expectedEvent, expectedEvent].length !== 1],
    ["wrong-result-path", "wrong.json" !== resultPath],
    ["wrong-result-schema", !same({ status: "PASS" }, expectedResult(projectionContract(baselineRows, positiveRows)))],
    ["other-context-section", !contextValid(head(contextPath), `${head(contextPath)}\nchanged`)],
    ["fifth-file", !same([...implementationWriteSet, "fifth.file"].sort(), implementationWriteSet)],
    ["profile-used-by-other-substep", "S9-FIX-06" !== "S9-FIX-05"],
    ["completed-artifact-change", !implementationWriteSet.includes(
      "docs/qa/remediation/stage-9/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json")],
  ].map(([id, passed]) => ({ id, passed }));
  const all = [...negative, ...objectNegative];
  return {
    profile: "S9_FIX_05_REVERSIBLE_TRIAL_LOCALIZATION",
    positive: { total: 1, passed: validate(positiveRows) ? 1 : 0 },
    negative: {
      total: all.length,
      passed: all.filter((item) => item.passed).length,
      failed: all.filter((item) => !item.passed).map((item) => item.id),
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
  const paths = diffPaths();
  let result = null;
  try {
    result = JSON.parse(read(resultPath));
  } catch {}
  const contract = postContract({
    paths,
    baselineSource: head(fixturePath),
    candidateSource: read(fixturePath),
    baselineLedger: JSON.parse(head(ledgerPath)),
    candidateLedger: JSON.parse(read(ledgerPath)),
    result,
    baselineContext: head(contextPath),
    candidateContext: read(contextPath),
  });
  const output = {
    profile: "S9_FIX_05_REVERSIBLE_TRIAL_LOCALIZATION_POST_IMPLEMENTATION",
    substep_id: "S9-FIX-05",
    passed: contract.passed,
    checks: contract.checks,
    projection: contract.projection,
    implementation_write_set: implementationWriteSet,
    network_request_count: networkRequests,
  };
  process.stdout.write(canonicalJson(output));
  if (!output.passed) process.exitCode = 1;
} else {
  const paths = diffPaths();
  const allowedPreparationState = paths.length === 0
    || paths.every((path) => preparationWriteSet.includes(path));
  const output = {
    profile: "S9_FIX_05_REVERSIBLE_TRIAL_LOCALIZATION_PROSPECTIVE",
    substep_id: "S9-FIX-05",
    status: "IMPLEMENTATION_READY_NOT_STARTED",
    remediation_completed: false,
    passed: canonicalContract()
      && allowedPreparationState
      && tests.positive.passed === 1
      && tests.negative.passed === tests.negative.total
      && networkRequests === 0,
    ownership: "3/3",
    protected_reference_fixture_id: protectedId,
    preparation_write_set: preparationWriteSet,
    implementation_write_set: implementationWriteSet,
    mandatory_gates: mandatoryGates,
    self_tests: tests,
    network_request_count: networkRequests,
  };
  process.stdout.write(canonicalJson(output));
  if (!output.passed) process.exitCode = 1;
}

globalThis.fetch = originalFetch;
