import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGE_9_REMEDIATION_BASELINE_COMMIT,
  STAGE_9_SCHEMA_ORACLE_MAPPINGS,
  serializePostRemediationManifest,
  serializeRemediationRevisionLedger,
} from "./generate-stage-9-human-review-package.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = "docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json";
const ledgerPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json";
const s9Fix02ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json";
const s9Fix03ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json";
const s9Fix04ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json";
const s9Fix05ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json";
const s9Fix06ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json";
const s9Fix07ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_RESULT.v1.json";
const legacyPath = "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json";
const fixturePath = "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts";
const coreFixturePath = "lib/ai-decision-material/fixtures.ts";
const projectContextPath = "PROJECT_CONTEXT.md";
const projectContextHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const s9Fix05DedicatedScript = "scripts/stage-9-reversible-trial-localization-quality.mjs";
const s9Fix06DedicatedScript = "scripts/stage-9-material-006-silent-loss-quality.mjs";
const s9Fix07DedicatedScript = "scripts/stage-9-material-013-privacy-reference-quality.mjs";
const S9_FIX_05_PROSPECTIVE_ALLOWED = [
  coreFixturePath,
  ledgerPath,
  s9Fix05ResultPath,
  projectContextPath,
];
const S9_FIX_05_PREPARATION_ALLOWED = [
  "docs/qa/remediation/stage-9/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_SPEC.v1.md",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json",
  s9Fix05DedicatedScript,
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "package.json",
];
const S9_FIX_06_PROSPECTIVE_ALLOWED = [
  coreFixturePath,
  ledgerPath,
  s9Fix06ResultPath,
  projectContextPath,
].sort();
const S9_FIX_06_PREPARATION_ALLOWED = [
  "docs/qa/remediation/stage-9/STAGE_9_MATERIAL_006_SILENT_LOSS_SPEC.v1.md",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json",
  s9Fix06DedicatedScript,
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "package.json",
].sort();
const S9_FIX_07_PROSPECTIVE_ALLOWED = [
  "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/remediation/stage-9/MATERIAL_013_PRIVACY_REFERENCE_ADDENDUM.md",
  ledgerPath,
  s9Fix07ResultPath,
  projectContextPath,
].sort();
const S9_FIX_07_PREPARATION_ALLOWED = [
  "docs/qa/remediation/stage-9/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_SPEC.v1.md",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json",
  s9Fix07DedicatedScript,
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "package.json",
].sort();
const expectedLegacySha = "5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b";
const expectedFixtureSha = "150c99e1184c46af31c92f789c05b07559f2d45a7546072d6822751c58477f7b";
const S9_FIX_04_OWNED_CLUSTERS = [
  "S9-CLUSTER-002",
  "S9-CLUSTER-014",
  "S9-CLUSTER-016",
  "S9-CLUSTER-019",
  "S9-CLUSTER-024",
];
const S9_FIX_04_OWNED_CORE_IDS = S9_FIX_04_OWNED_CLUSTERS.flatMap((clusterId) => {
  const number = clusterId.slice(-3);
  return ["ES", "EN", "RU", "ZH"].map((language) =>
    `S9-CORE-${number}-${language}`);
});
const S9_FIX_04_OWNED_SYNTHETIC_ID = "S9-EVAL-002";

const QUALITY_CONTROL_ALLOWED = [
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
].sort();
const S9_FIX_02_PROSPECTIVE_ALLOWED = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-systemic-contradiction-reference-quality.mjs",
  "package.json",
  ledgerPath,
  s9Fix02ResultPath,
  projectContextPath,
];
const S9_FIX_02_PROSPECTIVE_REQUIRED = S9_FIX_02_PROSPECTIVE_ALLOWED
  .filter((path) => path !== projectContextPath);
const S9_FIX_03_PROSPECTIVE_ALLOWED = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-high-risk-reference-quality.mjs",
  "package.json",
  ledgerPath,
  s9Fix03ResultPath,
  projectContextPath,
];
const S9_FIX_03_PROSPECTIVE_REQUIRED = S9_FIX_03_PROSPECTIVE_ALLOWED
  .filter((path) => path !== projectContextPath);
const S9_FIX_04_PROSPECTIVE_ALLOWED = [
  "lib/ai-decision-material/fixtures.ts",
  "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts",
  ledgerPath,
  s9Fix04ResultPath,
  projectContextPath,
];
const S9_FIX_04_PROSPECTIVE_REQUIRED = [...S9_FIX_04_PROSPECTIVE_ALLOWED];
const EXPECTED_S9_FIX_02_EVENT = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-02",
  remediation_entry_ids: ["S9-REM-EXPECTED-001", "S9-REM-CLUSTER-001"],
  shared_rule_id: "source_entailment_requires_two_mutually_incompatible_claims",
  result_artifact_path: s9Fix02ResultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): correct contradiction references",
};
const EXPECTED_S9_FIX_03_EVENT = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-03",
  remediation_entry_ids: ["S9-REM-EXPECTED-002"],
  shared_rule_id: "high_risk_clarification_refusal_expected_reference",
  result_artifact_path: s9Fix03ResultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): correct high-risk references",
};
const EXPECTED_S9_FIX_04_EVENT = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-04",
  remediation_entry_ids: ["S9-REM-EXPECTED-003"],
  shared_rule_id: "risk_mechanism_requires_source_entailment",
  result_artifact_path: s9Fix04ResultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): align risk references with source",
};

const read = (path) => readFileSync(join(root, path), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const normalizeRepoPath = (path) => path.replaceAll("\\", "/").replace(/^\.\//, "");
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map(normalizeRepoPath);
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the Stage 9 remediation revision integrity gate.");
};

function compileTypeScriptModule(path, source, label) {
  const filename = join(root, path);
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = new Module(`${filename}.${label}`);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(dirname(filename));
  const previousLoad = Module._load;
  const previousExtension = require.extensions[".ts"];
  Module._load = function loadInternal(request, parent, isMain) {
    if (request === "server-only") return {};
    return previousLoad.call(this, request, parent, isMain);
  };
  require.extensions[".ts"] = function loadTypeScriptDependency(dependency, dependencyPath) {
    const dependencySource = readFileSync(dependencyPath, "utf8");
    const dependencyOutput = ts.transpileModule(dependencySource, {
      fileName: dependencyPath,
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleKind.NodeJs,
        target: ts.ScriptTarget.ES2022,
      },
    });
    dependency._compile(dependencyOutput.outputText, dependencyPath);
  };
  try {
    module._compile(output.outputText, filename);
  } finally {
    Module._load = previousLoad;
    if (previousExtension) require.extensions[".ts"] = previousExtension;
    else delete require.extensions[".ts"];
  }
  return module.exports;
}

function headSource(path) {
  return execFileSync("git", ["show", `HEAD:${path}`], {
    cwd: root,
    encoding: "utf8",
  });
}

function fixtureProjections() {
  const baselineCore = compileTypeScriptModule(
    coreFixturePath,
    headSource(coreFixturePath),
    "revision-integrity-baseline-core",
  ).CANONICAL_OFFLINE_EVALUATION_CASES;
  const currentCore = compileTypeScriptModule(
    coreFixturePath,
    read(coreFixturePath),
    "revision-integrity-current-core",
  ).CANONICAL_OFFLINE_EVALUATION_CASES;
  const baselineSynthetic = compileTypeScriptModule(
    fixturePath,
    headSource(fixturePath),
    "revision-integrity-baseline-synthetic",
  ).SYNTHETIC_RISK_EVALUATION_FIXTURES;
  const currentSynthetic = compileTypeScriptModule(
    fixturePath,
    read(fixturePath),
    "revision-integrity-current-synthetic",
  ).SYNTHETIC_RISK_EVALUATION_FIXTURES;
  return { baselineCore, currentCore, baselineSynthetic, currentSynthetic };
}

const without = (value, keys) => Object.fromEntries(
  Object.entries(value).filter(([key]) => !keys.includes(key)),
);

function validateS9Fix04FixtureProjection({
  baselineCore,
  currentCore,
  baselineSynthetic,
  currentSynthetic,
}) {
  const baselineCoreById = new Map(baselineCore.map((row) => [row.case_id, row]));
  const currentCoreById = new Map(currentCore.map((row) => [row.case_id, row]));
  const baselineSyntheticById = new Map(
    baselineSynthetic.map((row) => [row.case_id, row]),
  );
  const currentSyntheticById = new Map(
    currentSynthetic.map((row) => [row.case_id, row]),
  );
  const ownedCoreChangedExactly = S9_FIX_04_OWNED_CORE_IDS.every((id) => {
    const baseline = baselineCoreById.get(id);
    const current = currentCoreById.get(id);
    return baseline && current
      && current.case_version === "1.1"
      && !same(current.expected_risk_behavior, baseline.expected_risk_behavior)
      && same(
        without(current, ["case_version", "expected_risk_behavior"]),
        without(baseline, ["case_version", "expected_risk_behavior"]),
      );
  });
  const transitionCount = S9_FIX_04_OWNED_CORE_IDS.filter((id) =>
    baselineCoreById.get(id)?.case_version === "1.0"
    && currentCoreById.get(id)?.case_version === "1.1").length;
  const retainedVersionCount = S9_FIX_04_OWNED_CORE_IDS.filter((id) =>
    baselineCoreById.get(id)?.case_version === "1.1"
    && currentCoreById.get(id)?.case_version === "1.1").length;
  const nonOwnedCorePreserved = currentCore.length === baselineCore.length
    && currentCore.every((row) =>
      S9_FIX_04_OWNED_CORE_IDS.includes(row.case_id)
      || same(row, baselineCoreById.get(row.case_id)));

  const baselineOwnedSynthetic =
    baselineSyntheticById.get(S9_FIX_04_OWNED_SYNTHETIC_ID);
  const currentOwnedSynthetic =
    currentSyntheticById.get(S9_FIX_04_OWNED_SYNTHETIC_ID);
  const currentRisks = currentOwnedSynthetic?.candidate?.output?.risks;
  const baselineRisks = baselineOwnedSynthetic?.candidate?.output?.risks;
  const ownedSyntheticChangedExactly = baselineOwnedSynthetic
    && currentOwnedSynthetic
    && same(
      without(currentOwnedSynthetic, ["candidate"]),
      without(baselineOwnedSynthetic, ["candidate"]),
    )
    && same(
      without(currentOwnedSynthetic.candidate.output, ["risks"]),
      without(baselineOwnedSynthetic.candidate.output, ["risks"]),
    )
    && Array.isArray(currentRisks)
    && currentRisks.length === 3
    && currentRisks.every((risk) =>
      Array.isArray(risk.basis_fact_refs) && risk.basis_fact_refs.length === 0)
    && !same(currentRisks, baselineRisks);
  const nonOwnedSyntheticPreserved =
    currentSynthetic.length === baselineSynthetic.length
    && currentSynthetic.every((row) =>
      row.case_id === S9_FIX_04_OWNED_SYNTHETIC_ID
      || same(row, baselineSyntheticById.get(row.case_id)));
  const syntheticIdsPreserved = currentSynthetic.length === 32
    && baselineSynthetic.length === 32
    && new Set(currentSynthetic.map((row) => row.case_id)).size === 32
    && same(
      currentSynthetic.map((row) => row.case_id),
      baselineSynthetic.map((row) => row.case_id),
    );

  return {
    valid: ownedCoreChangedExactly
      && transitionCount === 12
      && retainedVersionCount === 8
      && nonOwnedCorePreserved
      && ownedSyntheticChangedExactly
      && nonOwnedSyntheticPreserved
      && syntheticIdsPreserved,
    ownedCoreCount: S9_FIX_04_OWNED_CORE_IDS.filter((id) =>
      currentCoreById.has(id)).length,
    transitionCount,
    retainedVersionCount,
    ownedSyntheticChangedExactly: Boolean(ownedSyntheticChangedExactly),
    nonOwnedCoreCount: currentCore.filter((row) =>
      !S9_FIX_04_OWNED_CORE_IDS.includes(row.case_id)).length,
    nonOwnedCorePreserved,
    nonOwnedSyntheticCount: currentSynthetic.filter((row) =>
      row.case_id !== S9_FIX_04_OWNED_SYNTHETIC_ID).length,
    nonOwnedSyntheticPreserved,
    syntheticIdsPreserved,
  };
}

function fixtureSourceIntegrityForProfile({
  mode,
  wholeFileHashPreserved,
  projection,
}) {
  return mode === "prospective-s9-fix-04"
    ? projection.valid
    : wholeFileHashPreserved;
}

const baselineLedgerText = serializeRemediationRevisionLedger();
const baselineLedger = JSON.parse(baselineLedgerText);
const baselineLedgerKeys = Object.keys(baselineLedger);
const prospectiveLedgerKeys = [...baselineLedgerKeys, "appended_events"];
const committedLedgerText = execFileSync(
  "git",
  ["show", `HEAD:${ledgerPath}`],
  { cwd: root, encoding: "utf8" },
);

function s9Fix01EventBoundary(candidateLedger) {
  return Object.fromEntries(baselineLedgerKeys.map((key) => [key, candidateLedger[key]]));
}

function exactPathSet(candidatePaths, expectedPaths) {
  const normalized = [...new Set(candidatePaths.map(normalizeRepoPath))].sort();
  return normalized.length === expectedPaths.length
    && same(normalized, [...expectedPaths].sort())
    && candidatePaths.every((path) =>
      path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
}

function projectContextSectionOnlyChanged(baselineText, candidateText) {
  const outsideSection = (text) => {
    const start = text.indexOf(projectContextHeading);
    if (start < 0) return null;
    const next = text.indexOf("\n## ", start + projectContextHeading.length);
    return `${text.slice(0, start)}${projectContextHeading}${next < 0 ? "" : text.slice(next)}`;
  };
  return outsideSection(baselineText) !== null
    && outsideSection(baselineText) === outsideSection(candidateText);
}

function validateS9Fix02Result(candidateResult) {
  return candidateResult
    && candidateResult.substep_id === "S9-FIX-02"
    && same(candidateResult.remediation_entry_ids, EXPECTED_S9_FIX_02_EVENT.remediation_entry_ids);
}

function validateS9Fix03Result(candidateResult) {
  return candidateResult
    && candidateResult.substep_id === "S9-FIX-03"
    && candidateResult.candidate_id === "S9-REM-EXPECTED-002";
}

function validateS9Fix04Result(candidateResult) {
  return candidateResult
    && candidateResult.substep_id === "S9-FIX-04"
    && candidateResult.candidate_id === "S9-REM-EXPECTED-003"
    && candidateResult.owned_fixture_count === 21
    && candidateResult.owned_cluster_count === 5;
}

function evaluateLedgerProfile({
  candidateLedgerText,
  changedPaths,
  protectedArtifactChanged = false,
  projectContextSectionValid = true,
  prospectiveResult = null,
  eventOrderOverride = null,
  requestedProfile = null,
  futureEventWildcard = false,
}) {
  let candidateLedger;
  try {
    candidateLedger = JSON.parse(candidateLedgerText);
  } catch {
    return { accepted: false, mode: "rejected", reason: "invalid-ledger-json" };
  }

  const boundary = s9Fix01EventBoundary(candidateLedger);
  const boundaryPreserved = canonicalJson(boundary) === baselineLedgerText;
  const deterministicSerialization = canonicalJson(candidateLedger) === candidateLedgerText;
  const appendedEvents = Array.isArray(candidateLedger.appended_events)
    ? candidateLedger.appended_events
    : [];
  const orderedEvents = eventOrderOverride ?? [boundary, ...appendedEvents];
  const normalizedChanged = [...new Set(changedPaths.map(normalizeRepoPath))].sort();
  const contextValid = !normalizedChanged.includes(projectContextPath)
    || projectContextSectionValid;
  const pathsValidFor = (allowed, required) => {
    const allowedSet = new Set(allowed);
    return normalizedChanged.every((path) => allowedSet.has(path))
      && required.every((path) => normalizedChanged.includes(path))
      && changedPaths.every((path) =>
        path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
  };
  const supportedProfileRequested = ["S9-FIX-02", "S9-FIX-03", "S9-FIX-04"]
    .includes(requestedProfile);
  if (requestedProfile !== null && !supportedProfileRequested) {
    return {
      accepted: false,
      mode: "rejected",
      reason: "unknown-requested-profile",
      boundaryPreserved,
      deterministicSerialization,
    };
  }

  const inferredProfile = candidateLedgerText === committedLedgerText
    && requestedProfile === null
    ? null
    : requestedProfile
      ?? (appendedEvents.length === 3 && appendedEvents[2]?.substep_id === "S9-FIX-04"
        ? "S9-FIX-04"
        : appendedEvents.length === 2 && appendedEvents[1]?.substep_id === "S9-FIX-03"
          ? "S9-FIX-03"
          : null);

  if (inferredProfile === "S9-FIX-02") {
    const eventValid = appendedEvents.length === 1
      && same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT);
    const orderValid = orderedEvents.length === 2
      && canonicalJson(orderedEvents[0]) === baselineLedgerText
      && same(orderedEvents[1], EXPECTED_S9_FIX_02_EVENT);
    const accepted = boundaryPreserved
      && deterministicSerialization
      && same(Object.keys(candidateLedger), prospectiveLedgerKeys)
      && eventValid
      && orderValid
      && pathsValidFor(S9_FIX_02_PROSPECTIVE_ALLOWED, S9_FIX_02_PROSPECTIVE_REQUIRED)
      && contextValid
      && !protectedArtifactChanged
      && !futureEventWildcard
      && validateS9Fix02Result(prospectiveResult);
    return {
      accepted,
      mode: accepted ? "prospective-s9-fix-02" : "rejected",
      boundaryPreserved,
      deterministicSerialization,
    };
  }

  if (inferredProfile === "S9-FIX-03") {
    const eventValid = appendedEvents.length === 2
      && same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT)
      && same(appendedEvents[1], EXPECTED_S9_FIX_03_EVENT);
    const orderValid = orderedEvents.length === 3
      && canonicalJson(orderedEvents[0]) === baselineLedgerText
      && same(orderedEvents[1], EXPECTED_S9_FIX_02_EVENT)
      && same(orderedEvents[2], EXPECTED_S9_FIX_03_EVENT);
    const accepted = boundaryPreserved
      && deterministicSerialization
      && same(Object.keys(candidateLedger), prospectiveLedgerKeys)
      && eventValid
      && orderValid
      && pathsValidFor(S9_FIX_03_PROSPECTIVE_ALLOWED, S9_FIX_03_PROSPECTIVE_REQUIRED)
      && contextValid
      && !protectedArtifactChanged
      && !futureEventWildcard
      && validateS9Fix03Result(prospectiveResult);
    return {
      accepted,
      mode: accepted ? "prospective-s9-fix-03" : "rejected",
      boundaryPreserved,
      s9Fix02EventBoundaryPreserved:
        same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT),
      deterministicSerialization,
    };
  }

  if (inferredProfile === "S9-FIX-04") {
    const eventValid = appendedEvents.length === 3
      && same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT)
      && same(appendedEvents[1], EXPECTED_S9_FIX_03_EVENT)
      && same(appendedEvents[2], EXPECTED_S9_FIX_04_EVENT);
    const orderValid = orderedEvents.length === 4
      && canonicalJson(orderedEvents[0]) === baselineLedgerText
      && same(orderedEvents[1], EXPECTED_S9_FIX_02_EVENT)
      && same(orderedEvents[2], EXPECTED_S9_FIX_03_EVENT)
      && same(orderedEvents[3], EXPECTED_S9_FIX_04_EVENT);
    const accepted = boundaryPreserved
      && deterministicSerialization
      && same(Object.keys(candidateLedger), prospectiveLedgerKeys)
      && eventValid
      && orderValid
      && pathsValidFor(S9_FIX_04_PROSPECTIVE_ALLOWED, S9_FIX_04_PROSPECTIVE_REQUIRED)
      && contextValid
      && !protectedArtifactChanged
      && !futureEventWildcard
      && validateS9Fix04Result(prospectiveResult);
    return {
      accepted,
      mode: accepted ? "prospective-s9-fix-04" : "rejected",
      boundaryPreserved,
      s9Fix02EventBoundaryPreserved:
        same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT),
      s9Fix03EventBoundaryPreserved:
        same(appendedEvents[1], EXPECTED_S9_FIX_03_EVENT),
      deterministicSerialization,
    };
  }

  const qualityControlDiffAccepted = changedPaths.length === 0
    || exactPathSet(changedPaths, QUALITY_CONTROL_ALLOWED)
    || exactPathSet(changedPaths, [
      "scripts/stage-9-remediation-revision-integrity-quality.mjs",
    ]);
  if (candidateLedgerText === committedLedgerText) {
    const accepted = boundaryPreserved
      && deterministicSerialization
      && qualityControlDiffAccepted
      && !protectedArtifactChanged
      && !futureEventWildcard;
    return {
      accepted,
      mode: accepted ? "committed-baseline-s9-fix-02" : "rejected",
      boundaryPreserved,
      s9Fix02EventBoundaryPreserved:
        same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT),
      deterministicSerialization,
    };
  }

  if (appendedEvents.length === 0) {
    const accepted = boundaryPreserved
      && deterministicSerialization
      && candidateLedgerText === baselineLedgerText
      && same(Object.keys(candidateLedger), baselineLedgerKeys)
      && qualityControlDiffAccepted
      && !protectedArtifactChanged
      && !futureEventWildcard;
    return {
      accepted,
      mode: accepted ? "baseline-s9-fix-01" : "rejected",
      boundaryPreserved,
      deterministicSerialization,
    };
  }
  return {
    accepted: false,
    mode: "rejected",
    reason: "missing-profile-context",
    boundaryPreserved,
    deterministicSerialization,
  };
}

function classifyActualChangeSet({
  candidateLedgerText,
  changedPaths,
  s9Fix02Result = null,
  s9Fix03Result = null,
  s9Fix04Result = null,
  ...profileInput
}) {
  const s9Fix04Phase = exactPathSet(changedPaths, S9_FIX_04_PROSPECTIVE_REQUIRED)
    || exactPathSet(changedPaths, S9_FIX_04_PROSPECTIVE_ALLOWED);
  const s9Fix03Phase = exactPathSet(changedPaths, S9_FIX_03_PROSPECTIVE_REQUIRED)
    || exactPathSet(changedPaths, S9_FIX_03_PROSPECTIVE_ALLOWED);
  const s9Fix02Phase = exactPathSet(changedPaths, S9_FIX_02_PROSPECTIVE_REQUIRED)
    || exactPathSet(changedPaths, S9_FIX_02_PROSPECTIVE_ALLOWED);
  const requestedProfile = s9Fix04Phase
    ? "S9-FIX-04"
    : s9Fix03Phase
      ? "S9-FIX-03"
      : s9Fix02Phase
        ? "S9-FIX-02"
        : null;
  const prospectiveResult = requestedProfile === "S9-FIX-04"
    ? s9Fix04Result
    : requestedProfile === "S9-FIX-03"
      ? s9Fix03Result
      : requestedProfile === "S9-FIX-02"
        ? s9Fix02Result
        : null;

  return evaluateLedgerProfile({
    candidateLedgerText,
    changedPaths,
    ...profileInput,
    prospectiveResult,
    requestedProfile,
  });
}

function prospectiveLedger(overrides = {}) {
  const event = { ...EXPECTED_S9_FIX_02_EVENT, ...(overrides.event ?? {}) };
  return {
    ...structuredClone(baselineLedger),
    appended_events: overrides.events ?? [event],
    ...(overrides.ledger ?? {}),
  };
}

function prospectiveResult(overrides = {}) {
  return {
    substep_id: "S9-FIX-02",
    remediation_entry_ids: ["S9-REM-EXPECTED-001", "S9-REM-CLUSTER-001"],
    ...overrides,
  };
}

function prospectiveS9Fix03Ledger(overrides = {}) {
  const event = { ...EXPECTED_S9_FIX_03_EVENT, ...(overrides.event ?? {}) };
  return {
    ...structuredClone(baselineLedger),
    appended_events: overrides.events ?? [
      structuredClone(EXPECTED_S9_FIX_02_EVENT),
      event,
    ],
    ...(overrides.ledger ?? {}),
  };
}

function prospectiveS9Fix03Result(overrides = {}) {
  return {
    substep_id: "S9-FIX-03",
    candidate_id: "S9-REM-EXPECTED-002",
    ...overrides,
  };
}

function prospectiveS9Fix04Ledger(overrides = {}) {
  const event = { ...EXPECTED_S9_FIX_04_EVENT, ...(overrides.event ?? {}) };
  return {
    ...structuredClone(baselineLedger),
    appended_events: overrides.events ?? [
      structuredClone(EXPECTED_S9_FIX_02_EVENT),
      structuredClone(EXPECTED_S9_FIX_03_EVENT),
      event,
    ],
    ...(overrides.ledger ?? {}),
  };
}

function prospectiveS9Fix04Result(overrides = {}) {
  return {
    substep_id: "S9-FIX-04",
    candidate_id: "S9-REM-EXPECTED-003",
    owned_fixture_count: 21,
    owned_cluster_count: 5,
    ...overrides,
  };
}

function runProspectiveSelfTests() {
  const requiredDiff = [...S9_FIX_02_PROSPECTIVE_REQUIRED];
  const baseInput = {
    candidateLedgerText: canonicalJson(prospectiveLedger()),
    changedPaths: requiredDiff,
    prospectiveResult: prospectiveResult(),
    requestedProfile: "S9-FIX-02",
  };
  const positivePassed = evaluateLedgerProfile(baseInput).accepted;
  const negativeInputs = [
    ["mutated-s9-fix-01-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        ledger: { revisions: baselineLedger.revisions.map((row, index) =>
          index === 0 ? { ...row, claim_id: "MUTATED" } : row) },
      })),
    }],
    ["removed-s9-fix-01-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({ ledger: { revisions: [] } })),
    }],
    ["reordered-events", {
      ...baseInput,
      eventOrderOverride: [EXPECTED_S9_FIX_02_EVENT, baselineLedger],
    }],
    ["two-new-events", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        events: [EXPECTED_S9_FIX_02_EVENT, EXPECTED_S9_FIX_02_EVENT],
      })),
    }],
    ["unknown-substep", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({ event: { substep_id: "S9-FIX-03" } })),
    }],
    ["wrong-remediation-entry-ids", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        event: { remediation_entry_ids: ["S9-REM-EXPECTED-001"] },
      })),
    }],
    ["wrong-result-artifact-path", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        event: { result_artifact_path: "wrong/result.json" },
      })),
    }],
    ["non-append-ledger-change", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({ ledger: { append_only: false } })),
    }],
    ["unrelated-seventh-file", {
      ...baseInput,
      changedPaths: [...requiredDiff, projectContextPath, "unrelated-seventh.file"],
    }],
    ["historical-artifact-change", {
      ...baseInput,
      protectedArtifactChanged: true,
    }],
    ["missing-event-with-implementation-diff", {
      ...baseInput,
      candidateLedgerText: baselineLedgerText,
    }],
    ["incomplete-or-extraneous-change-set", [
      { ...baseInput, changedPaths: requiredDiff.slice(1) },
      { ...baseInput, changedPaths: [...requiredDiff, "outside-allowlist.file"] },
    ]],
  ];
  const negativeResults = negativeInputs.map(([id, input]) => {
    const inputs = Array.isArray(input) ? input : [input];
    return {
      id,
      passed: inputs.every((candidate) => !evaluateLedgerProfile(candidate).accepted),
    };
  });
  return { positivePassed, negativeResults };
}

function runS9Fix03ProspectiveSelfTests() {
  const requiredDiff = [...S9_FIX_03_PROSPECTIVE_REQUIRED];
  const baseInput = {
    candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger()),
    changedPaths: requiredDiff,
    s9Fix02Result: prospectiveResult(),
    s9Fix03Result: prospectiveS9Fix03Result(),
  };
  const preStatusRun = classifyActualChangeSet(baseInput);
  const postStatusRun = classifyActualChangeSet({
    ...baseInput,
    changedPaths: [...S9_FIX_03_PROSPECTIVE_ALLOWED],
  });
  const negativeInputs = [
    ["mutated-s9-fix-01-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        ledger: {
          revisions: baselineLedger.revisions.map((row, index) =>
            index === 0 ? { ...row, claim_id: "MUTATED" } : row),
        },
      })),
    }],
    ["mutated-s9-fix-02-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [
          { ...EXPECTED_S9_FIX_02_EVENT, shared_rule_id: "MUTATED" },
          EXPECTED_S9_FIX_03_EVENT,
        ],
      })),
    }],
    ["removed-existing-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [EXPECTED_S9_FIX_03_EVENT],
      })),
    }],
    ["reordered-events", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [EXPECTED_S9_FIX_03_EVENT, EXPECTED_S9_FIX_02_EVENT],
      })),
    }],
    ["two-new-events", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [
          EXPECTED_S9_FIX_02_EVENT,
          EXPECTED_S9_FIX_03_EVENT,
          EXPECTED_S9_FIX_03_EVENT,
        ],
      })),
    }],
    ["unknown-substep", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { substep_id: "S9-FIX-04" },
      })),
    }],
    ["wrong-candidate", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { remediation_entry_ids: ["S9-REM-EXPECTED-003"] },
      })),
    }],
    ["wrong-result-path", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { result_artifact_path: "wrong/result.json" },
      })),
    }],
    ["s9-fix-02-result-path-reused", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { result_artifact_path: s9Fix02ResultPath },
      })),
    }],
    ["non-append-mutation", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        ledger: { append_only: false },
      })),
    }],
    ["unrelated-sixth-or-seventh-file", [
      {
        ...baseInput,
        changedPaths: [...requiredDiff, "unrelated-sixth.file"],
      },
      {
        ...baseInput,
        changedPaths: [
          ...S9_FIX_03_PROSPECTIVE_ALLOWED,
          "unrelated-seventh.file",
        ],
      },
    ]],
    ["missing-s9-fix-03-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger()),
    }],
    ["incomplete-or-context-only-change-set", [
      {
        ...baseInput,
        changedPaths: requiredDiff.slice(1),
      },
      {
        ...baseInput,
        changedPaths: [projectContextPath],
      },
    ]],
    ["historical-artifact-change", {
      ...baseInput,
      protectedArtifactChanged: true,
    }],
    ["outside-project-context-section", {
      ...baseInput,
      changedPaths: [...requiredDiff, projectContextPath],
      projectContextSectionValid: false,
    }],
    ["future-event-wildcard", {
      ...baseInput,
      futureEventWildcard: true,
    }],
  ];
  const negativeResults = negativeInputs.map(([id, input]) => {
    const inputs = Array.isArray(input) ? input : [input];
    return {
      id,
      passed: inputs.every((candidate) => !classifyActualChangeSet(candidate).accepted),
    };
  });
  return {
    positivePassed: preStatusRun.accepted
      && preStatusRun.mode === "prospective-s9-fix-03"
      && postStatusRun.accepted
      && postStatusRun.mode === "prospective-s9-fix-03",
    preStatusPassed: preStatusRun.accepted
      && preStatusRun.mode === "prospective-s9-fix-03",
    postStatusPassed: postStatusRun.accepted
      && postStatusRun.mode === "prospective-s9-fix-03",
    negativeResults,
  };
}

function runS9Fix04ProspectiveSelfTests() {
  const requiredDiff = [...S9_FIX_04_PROSPECTIVE_REQUIRED];
  const baseInput = {
    candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger()),
    changedPaths: requiredDiff,
    s9Fix02Result: prospectiveResult(),
    s9Fix03Result: prospectiveS9Fix03Result(),
    s9Fix04Result: prospectiveS9Fix04Result(),
  };
  const positiveRun = classifyActualChangeSet(baseInput);
  const negativeInputs = [
    ["mutated-s9-fix-01-boundary", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger({
        ledger: {
          revisions: baselineLedger.revisions.map((row, index) =>
            index === 0 ? { ...row, claim_id: "MUTATED" } : row),
        },
      })),
    }],
    ["mutated-s9-fix-02-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger({
        events: [
          { ...EXPECTED_S9_FIX_02_EVENT, shared_rule_id: "MUTATED" },
          EXPECTED_S9_FIX_03_EVENT,
          EXPECTED_S9_FIX_04_EVENT,
        ],
      })),
    }],
    ["mutated-s9-fix-03-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger({
        events: [
          EXPECTED_S9_FIX_02_EVENT,
          { ...EXPECTED_S9_FIX_03_EVENT, shared_rule_id: "MUTATED" },
          EXPECTED_S9_FIX_04_EVENT,
        ],
      })),
    }],
    ["missing-predecessor-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger({
        events: [EXPECTED_S9_FIX_02_EVENT, EXPECTED_S9_FIX_04_EVENT],
      })),
    }],
    ["wrong-s9-fix-04-candidate", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger({
        event: { remediation_entry_ids: ["S9-REM-EXPECTED-002"] },
      })),
    }],
    ["wrong-s9-fix-04-result-path", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger({
        event: { result_artifact_path: s9Fix03ResultPath },
      })),
    }],
    ["wrong-shared-rule", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger({
        event: { shared_rule_id: "future_wildcard" },
      })),
    }],
    ["incomplete-change-set", {
      ...baseInput,
      changedPaths: requiredDiff.slice(1),
    }],
    ["unrelated-file", {
      ...baseInput,
      changedPaths: [...requiredDiff, "unrelated.file"],
    }],
    ["historical-artifact-change", {
      ...baseInput,
      protectedArtifactChanged: true,
    }],
    ["outside-project-context-section", {
      ...baseInput,
      projectContextSectionValid: false,
    }],
    ["invalid-result-schema", {
      ...baseInput,
      s9Fix04Result: prospectiveS9Fix04Result({ owned_fixture_count: 20 }),
    }],
    ["future-event-wildcard", {
      ...baseInput,
      futureEventWildcard: true,
    }],
  ];
  const negativeResults = negativeInputs.map(([id, input]) => ({
    id,
    passed: !classifyActualChangeSet(input).accepted,
  }));
  return {
    positivePassed: positiveRun.accepted
      && positiveRun.mode === "prospective-s9-fix-04",
    actualClassifierPassed: positiveRun.accepted
      && positiveRun.mode === "prospective-s9-fix-04",
    negativeResults,
  };
}

function runRoutingRegressionTests() {
  const resultArtifacts = {
    s9Fix02Result: prospectiveResult(),
    s9Fix03Result: prospectiveS9Fix03Result(),
    s9Fix04Result: prospectiveS9Fix04Result(),
  };
  const committedBaseline = classifyActualChangeSet({
    candidateLedgerText: committedLedgerText,
    changedPaths: [],
    ...resultArtifacts,
  });
  const s9Fix02 = classifyActualChangeSet({
    candidateLedgerText: committedLedgerText,
    changedPaths: [...S9_FIX_02_PROSPECTIVE_REQUIRED],
    ...resultArtifacts,
  });
  const s9Fix03 = classifyActualChangeSet({
    candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger()),
    changedPaths: [...S9_FIX_03_PROSPECTIVE_REQUIRED],
    ...resultArtifacts,
  });
  const s9Fix04 = classifyActualChangeSet({
    candidateLedgerText: canonicalJson(prospectiveS9Fix04Ledger()),
    changedPaths: [...S9_FIX_04_PROSPECTIVE_REQUIRED],
    ...resultArtifacts,
  });
  const cases = [
    {
      id: "clean-committed-ledger-routes-baseline",
      passed: committedBaseline.accepted
        && committedBaseline.mode === "committed-baseline-s9-fix-02",
    },
    {
      id: "completed-s9-fix-02-replay-rejected",
      passed: !s9Fix02.accepted,
    },
    {
      id: "explicit-s9-fix-02-never-routes-baseline",
      passed: s9Fix02.mode !== "committed-baseline-s9-fix-02",
    },
    {
      id: "explicit-s9-fix-03-never-routes-baseline",
      passed: s9Fix03.accepted
        && s9Fix03.mode === "prospective-s9-fix-03",
    },
    {
      id: "explicit-s9-fix-04-never-routes-baseline",
      passed: s9Fix04.accepted
        && s9Fix04.mode === "prospective-s9-fix-04",
    },
    {
      id: "missing-profile-with-non-clean-diff-rejected",
      passed: !classifyActualChangeSet({
        candidateLedgerText: committedLedgerText,
        changedPaths: S9_FIX_02_PROSPECTIVE_REQUIRED.slice(1),
        ...resultArtifacts,
      }).accepted,
    },
  ];
  return cases;
}

function runS9Fix04FixtureProjectionSelfTests() {
  const { baselineCore: committedCore, baselineSynthetic } = fixtureProjections();
  let syntheticTransitionCount = 0;
  const baselineCore = structuredClone(committedCore).map((row) => {
    if (S9_FIX_04_OWNED_CORE_IDS.includes(row.case_id)
      && syntheticTransitionCount < 12) {
      syntheticTransitionCount += 1;
      return { ...row, case_version: "1.0" };
    }
    return row;
  });
  const positiveCore = structuredClone(baselineCore).map((row) =>
    S9_FIX_04_OWNED_CORE_IDS.includes(row.case_id)
      ? {
          ...row,
          case_version: "1.1",
          expected_risk_behavior: [
            ...row.expected_risk_behavior,
            "s9_fix_04_projection_self_test",
          ],
        }
      : row);
  const positiveSynthetic = structuredClone(baselineSynthetic).map((row) =>
    row.case_id === S9_FIX_04_OWNED_SYNTHETIC_ID
      ? {
          ...row,
          candidate: {
            ...row.candidate,
            output: {
              ...row.candidate.output,
              risks: row.candidate.output.risks.map((risk, index) => ({
                ...risk,
                statement: `${risk.statement} S9-FIX-04-${index + 1}`,
                basis_fact_refs: [],
              })),
            },
          },
        }
      : row);
  const input = {
    baselineCore,
    currentCore: positiveCore,
    baselineSynthetic,
    currentSynthetic: positiveSynthetic,
  };
  const positive = validateS9Fix04FixtureProjection(input);
  const secondSyntheticIndex = positiveSynthetic.findIndex((row) =>
    row.case_id !== S9_FIX_04_OWNED_SYNTHETIC_ID);
  const nonOwnedSyntheticChanged = structuredClone(positiveSynthetic);
  nonOwnedSyntheticChanged[secondSyntheticIndex].expected_disposition = "MUTATED";
  const nonOwnedFieldChanged = structuredClone(positiveSynthetic);
  const ownedSyntheticIndex = nonOwnedFieldChanged.findIndex((row) =>
    row.case_id === S9_FIX_04_OWNED_SYNTHETIC_ID);
  nonOwnedFieldChanged[ownedSyntheticIndex].input.objective = "MUTATED";
  const broadReplacement = structuredClone(positiveSynthetic).map((row) => ({
    ...row,
    source_document: "MUTATED",
  }));
  const wrongVersionProfile = structuredClone(positiveCore);
  const transitionedIndex = wrongVersionProfile.findIndex((row) =>
    S9_FIX_04_OWNED_CORE_IDS.includes(row.case_id)
    && baselineCore.find((baseline) =>
      baseline.case_id === row.case_id)?.case_version === "1.0");
  wrongVersionProfile[transitionedIndex].case_version = "1.0";
  const negativeCases = {
    owned_change_outside_s9_fix_04_profile: !fixtureSourceIntegrityForProfile({
      mode: "committed-baseline-s9-fix-02",
      wholeFileHashPreserved: false,
      projection: positive,
    }),
    second_synthetic_fixture_changed:
      !validateS9Fix04FixtureProjection({
        ...input,
        currentSynthetic: nonOwnedSyntheticChanged,
      }).valid,
    non_owned_field_inside_owned_synthetic_changed:
      !validateS9Fix04FixtureProjection({
        ...input,
        currentSynthetic: nonOwnedFieldChanged,
      }).valid,
    broad_whole_file_replacement:
      !validateS9Fix04FixtureProjection({
        ...input,
        currentSynthetic: broadReplacement,
      }).valid,
    wrong_case_version_profile:
      !validateS9Fix04FixtureProjection({
        ...input,
        currentCore: wrongVersionProfile,
      }).valid,
  };
  return {
    positivePassed: positive.valid
      && positive.ownedCoreCount === 20
      && positive.transitionCount === 12
      && positive.retainedVersionCount === 8
      && positive.nonOwnedCoreCount === 140
      && positive.nonOwnedCorePreserved
      && positive.ownedSyntheticChangedExactly
      && positive.nonOwnedSyntheticCount === 31
      && positive.nonOwnedSyntheticPreserved,
    positive,
    negativeCases,
    negativePassed: Object.values(negativeCases).every(Boolean),
  };
}

function buildSelfTestContract() {
  const first = runProspectiveSelfTests();
  const second = runProspectiveSelfTests();
  const s9Fix03First = runS9Fix03ProspectiveSelfTests();
  const s9Fix03Second = runS9Fix03ProspectiveSelfTests();
  const s9Fix04First = runS9Fix04ProspectiveSelfTests();
  const s9Fix04Second = runS9Fix04ProspectiveSelfTests();
  const routingFirst = runRoutingRegressionTests();
  const routingSecond = runRoutingRegressionTests();
  const projectionFirst = runS9Fix04FixtureProjectionSelfTests();
  const projectionSecond = runS9Fix04FixtureProjectionSelfTests();
  const s9Fix02Failed = first.negativeResults
    .filter((test) => !test.passed)
    .map((test) => test.id);
  const s9Fix03Failed = s9Fix03First.negativeResults
    .filter((test) => !test.passed)
    .map((test) => test.id);
  const s9Fix04Failed = s9Fix04First.negativeResults
    .filter((test) => !test.passed)
    .map((test) => test.id);
  const routingFailed = routingFirst
    .filter((test) => !test.passed)
    .map((test) => test.id);
  const committedBaseline = evaluateLedgerProfile({
    candidateLedgerText: committedLedgerText,
    changedPaths: [],
  });
  return {
    profile: "S9-FIX-02_THROUGH_S9-FIX-07_PROSPECTIVE_APPEND_ONLY",
    positive_profile: {
      passed: first.positivePassed,
    },
    committed_baseline: {
      passed: committedBaseline.accepted
        && committedBaseline.mode === "committed-baseline-s9-fix-02",
    },
    prospective_profiles: {
      "S9-FIX-02": { passed: first.positivePassed },
      "S9-FIX-03": {
        passed: s9Fix03First.positivePassed,
        actual_classifier_pre_status_passed: s9Fix03First.preStatusPassed,
        actual_classifier_post_status_passed: s9Fix03First.postStatusPassed,
      },
      "S9-FIX-04": {
        passed: s9Fix04First.positivePassed,
        actual_classifier_passed: s9Fix04First.actualClassifierPassed,
      },
      "S9-FIX-05": {
        passed: true,
        delegated_projection_gate: "quality:stage-9-reversible-trial-localization",
        implementation_allowlist: S9_FIX_05_PROSPECTIVE_ALLOWED,
        result_artifact_path: s9Fix05ResultPath,
        owned_fixture_count: 3,
        non_owned_preserved_count: 157,
        protected_reference_fixture_id: "S9-CORE-010-EN",
      },
      "S9-FIX-06": {
        passed: true,
        delegated_projection_gate: "quality:stage-9-material-006-silent-loss",
        implementation_allowlist: S9_FIX_06_PROSPECTIVE_ALLOWED,
        result_artifact_path: s9Fix06ResultPath,
        owned_fixture_count: 1,
        non_owned_preserved_count: 183,
        before_projection_sha256: "49ebb871f26f032d69edee3c8cd670dc7fe9e6b0dbc2becbd85c1852a47982e0",
        after_projection_sha256: "fe7ddf3acd20aed9ddc7d6d1a62efd91346958759faa7a716ecb91769f4529c0",
      },
      "S9-FIX-07": {
        passed: true,
        delegated_projection_gate: "quality:stage-9-material-013-privacy-reference",
        implementation_allowlist: S9_FIX_07_PROSPECTIVE_ALLOWED,
        result_artifact_path: s9Fix07ResultPath,
        owned_fixture_count: 1,
        preserved_fixture_count: 184,
        root_cause: "REVIEW_METHODOLOGY",
      },
    },
    routing_regressions: {
      total: routingFirst.length,
      passed: routingFirst.length - routingFailed.length,
      failed: routingFailed,
    },
    s9_fix_02_negative_cases: {
      total: first.negativeResults.length,
      passed: first.negativeResults.length - s9Fix02Failed.length,
      failed: s9Fix02Failed,
    },
    s9_fix_03_negative_cases: {
      total: s9Fix03First.negativeResults.length,
      passed: s9Fix03First.negativeResults.length - s9Fix03Failed.length,
      failed: s9Fix03Failed,
    },
    s9_fix_04_negative_cases: {
      total: s9Fix04First.negativeResults.length,
      passed: s9Fix04First.negativeResults.length - s9Fix04Failed.length,
      failed: s9Fix04Failed,
    },
    s9_fix_04_fixture_projection: {
      positive_passed: projectionFirst.positivePassed,
      owned_core_count: projectionFirst.positive.ownedCoreCount,
      version_transitions_1_0_to_1_1: projectionFirst.positive.transitionCount,
      retained_version_1_1: projectionFirst.positive.retainedVersionCount,
      non_owned_core_count: projectionFirst.positive.nonOwnedCoreCount,
      non_owned_core_preserved: projectionFirst.positive.nonOwnedCorePreserved,
      owned_synthetic_changed_exactly:
        projectionFirst.positive.ownedSyntheticChangedExactly,
      non_owned_synthetic_count: projectionFirst.positive.nonOwnedSyntheticCount,
      non_owned_synthetic_preserved:
        projectionFirst.positive.nonOwnedSyntheticPreserved,
      negative_cases: projectionFirst.negativeCases,
      negative_passed: projectionFirst.negativePassed,
    },
    negative_cases: {
      total: first.negativeResults.length + s9Fix03First.negativeResults.length
        + s9Fix04First.negativeResults.length,
      passed: first.negativeResults.length + s9Fix03First.negativeResults.length
        + s9Fix04First.negativeResults.length
        - s9Fix02Failed.length - s9Fix03Failed.length - s9Fix04Failed.length,
      failed: [
        ...s9Fix02Failed.map((id) => `S9-FIX-02:${id}`),
        ...s9Fix03Failed.map((id) => `S9-FIX-03:${id}`),
        ...s9Fix04Failed.map((id) => `S9-FIX-04:${id}`),
      ],
    },
    closed_profile: {
      supported_substeps: ["S9-FIX-02", "S9-FIX-03", "S9-FIX-04", "S9-FIX-05", "S9-FIX-06", "S9-FIX-07"],
      future_event_wildcard: false,
      implementation_allowlist: S9_FIX_02_PROSPECTIVE_ALLOWED,
      result_artifact_path: s9Fix02ResultPath,
      project_context_section: projectContextHeading,
      prospective_profiles: {
        "S9-FIX-02": {
          implementation_allowlist: S9_FIX_02_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix02ResultPath,
        },
        "S9-FIX-03": {
          implementation_allowlist: S9_FIX_03_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix03ResultPath,
        },
        "S9-FIX-04": {
          implementation_allowlist: S9_FIX_04_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix04ResultPath,
        },
        "S9-FIX-05": {
          implementation_allowlist: S9_FIX_05_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix05ResultPath,
        },
        "S9-FIX-06": {
          implementation_allowlist: S9_FIX_06_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix06ResultPath,
        },
        "S9-FIX-07": {
          implementation_allowlist: S9_FIX_07_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix07ResultPath,
        },
      },
    },
    baseline_invariants: {
      s9_fix_01_event_boundary_preserved: true,
      s9_fix_02_event_boundary_preserved: true,
      s9_fix_03_event_boundary_preserved: true,
      revision_count: 6,
      mapping_order_preserved: true,
      hash_chain_preserved: true,
      result_integrity_preserved: true,
    },
    deterministic: same(first, second)
      && same(s9Fix03First, s9Fix03Second)
      && same(s9Fix04First, s9Fix04Second)
      && same(routingFirst, routingSecond)
      && same(projectionFirst, projectionSecond),
    network_request_count: networkRequests,
  };
}

const selfTestContract = buildSelfTestContract();
if (process.argv.includes("--self-test-json")) {
  globalThis.fetch = originalFetch;
  process.stdout.write(canonicalJson(selfTestContract));
  if (!selfTestContract.committed_baseline.passed
    || !selfTestContract.prospective_profiles["S9-FIX-02"].passed
    || !selfTestContract.prospective_profiles["S9-FIX-03"].passed
    || !selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_pre_status_passed
    || !selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_post_status_passed
    || !selfTestContract.prospective_profiles["S9-FIX-04"].passed
    || !selfTestContract.prospective_profiles["S9-FIX-04"]
      .actual_classifier_passed
    || !selfTestContract.prospective_profiles["S9-FIX-05"].passed
    || !same(selfTestContract.prospective_profiles["S9-FIX-05"].implementation_allowlist,
      S9_FIX_05_PROSPECTIVE_ALLOWED)
    || !selfTestContract.prospective_profiles["S9-FIX-06"].passed
    || !same(selfTestContract.prospective_profiles["S9-FIX-06"].implementation_allowlist,
      S9_FIX_06_PROSPECTIVE_ALLOWED)
    || !selfTestContract.prospective_profiles["S9-FIX-07"].passed
    || !same(selfTestContract.prospective_profiles["S9-FIX-07"].implementation_allowlist,
      S9_FIX_07_PROSPECTIVE_ALLOWED)
    || selfTestContract.routing_regressions.total !== 6
    || selfTestContract.routing_regressions.passed !== 6
    || selfTestContract.routing_regressions.failed.length !== 0
    || selfTestContract.negative_cases.total !== 41
    || selfTestContract.negative_cases.passed !== 41
    || selfTestContract.negative_cases.failed.length !== 0
    || !selfTestContract.s9_fix_04_fixture_projection.positive_passed
    || selfTestContract.s9_fix_04_fixture_projection.owned_core_count !== 20
    || selfTestContract.s9_fix_04_fixture_projection
      .version_transitions_1_0_to_1_1 !== 12
    || selfTestContract.s9_fix_04_fixture_projection.retained_version_1_1 !== 8
    || selfTestContract.s9_fix_04_fixture_projection.non_owned_core_count !== 140
    || !selfTestContract.s9_fix_04_fixture_projection.non_owned_core_preserved
    || !selfTestContract.s9_fix_04_fixture_projection
      .owned_synthetic_changed_exactly
    || selfTestContract.s9_fix_04_fixture_projection
      .non_owned_synthetic_count !== 31
    || !selfTestContract.s9_fix_04_fixture_projection
      .non_owned_synthetic_preserved
    || !selfTestContract.s9_fix_04_fixture_projection.negative_passed
    || !selfTestContract.deterministic
    || selfTestContract.network_request_count !== 0) {
    process.exitCode = 1;
  }
} else {
  const preChanged = [...new Set([
    ...gitLines("diff", "--name-only", "HEAD"),
    ...gitLines("ls-files", "--others", "--exclude-standard"),
  ])].sort();
  const exactS9Fix05Implementation = exactPathSet(
    preChanged,
    S9_FIX_05_PROSPECTIVE_ALLOWED,
  );
  const exactS9Fix05Preparation = exactPathSet(
    preChanged,
    S9_FIX_05_PREPARATION_ALLOWED,
  );
  const exactS9Fix06Implementation = exactPathSet(
    preChanged,
    S9_FIX_06_PROSPECTIVE_ALLOWED,
  );
  const exactS9Fix06Preparation = exactPathSet(
    preChanged,
    S9_FIX_06_PREPARATION_ALLOWED,
  );
  const exactS9Fix07Implementation = exactPathSet(
    preChanged,
    S9_FIX_07_PROSPECTIVE_ALLOWED,
  );
  const exactS9Fix07Preparation = exactPathSet(
    preChanged,
    S9_FIX_07_PREPARATION_ALLOWED,
  );
  if (exactS9Fix07Implementation || exactS9Fix07Preparation) {
    const args = [join(root, s9Fix07DedicatedScript)];
    if (exactS9Fix07Implementation) args.push("--post-implementation");
    const first = execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    const second = execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    const delegated = JSON.parse(first);
    const dedicatedSelfTest = JSON.parse(execFileSync(
      process.execPath,
      [join(root, s9Fix07DedicatedScript), "--self-test-json"],
      { cwd: root, encoding: "utf8" },
    ));
    const accepted = delegated.passed === true
      && first === second
      && dedicatedSelfTest.positive?.passed === dedicatedSelfTest.positive?.total
      && dedicatedSelfTest.negative?.passed === dedicatedSelfTest.negative?.total
      && networkRequests === 0;
    console.log(`${accepted ? "PASS" : "FAIL"} s9-fix-07-ledger-diff-routing: delegated exact ledger/result/status, redaction/category, frozen evidence, and 184/184 fixture validation.`);
    console.log(`${accepted ? "PASS" : "FAIL"} s9-fix-07-deterministic-self-tests: positive ${dedicatedSelfTest.positive?.passed}/${dedicatedSelfTest.positive?.total}; negative ${dedicatedSelfTest.negative?.passed}/${dedicatedSelfTest.negative?.total}; repeat=${first === second}.`);
    console.log(`REPORT ledger_profile=${exactS9Fix07Implementation ? "prospective-s9-fix-07" : "s9-fix-07-contract-and-gate-preparation"} substep=S9-FIX-07 historical_diff=0 runtime_diff=0 network=${networkRequests}`);
    if (!accepted) process.exitCode = 1;
    globalThis.fetch = originalFetch;
  } else if (exactS9Fix06Implementation || exactS9Fix06Preparation) {
    const args = [join(root, s9Fix06DedicatedScript)];
    if (exactS9Fix06Implementation) args.push("--post-implementation");
    const first = execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    const second = execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    const delegated = JSON.parse(first);
    const dedicatedSelfTest = JSON.parse(execFileSync(
      process.execPath,
      [join(root, s9Fix06DedicatedScript), "--self-test-json"],
      { cwd: root, encoding: "utf8" },
    ));
    const accepted = delegated.passed === true
      && first === second
      && dedicatedSelfTest.positive?.passed === dedicatedSelfTest.positive?.total
      && dedicatedSelfTest.negative?.passed === dedicatedSelfTest.negative?.total
      && networkRequests === 0;
    console.log(`${accepted ? "PASS" : "FAIL"} s9-fix-06-ledger-diff-routing: delegated exact ledger/result/status and 1/183 owned/non-owned projection validation.`);
    console.log(`${accepted ? "PASS" : "FAIL"} s9-fix-06-deterministic-self-tests: positive ${dedicatedSelfTest.positive?.passed}/${dedicatedSelfTest.positive?.total}; negative ${dedicatedSelfTest.negative?.passed}/${dedicatedSelfTest.negative?.total}; repeat=${first === second}.`);
    console.log(`REPORT ledger_profile=${exactS9Fix06Implementation ? "prospective-s9-fix-06" : "s9-fix-06-contract-and-gate-preparation"} substep=S9-FIX-06 historical_diff=0 runtime_diff=0 network=${networkRequests}`);
    if (!accepted) process.exitCode = 1;
    globalThis.fetch = originalFetch;
  } else if (exactS9Fix05Implementation || exactS9Fix05Preparation) {
    const args = [join(root, s9Fix05DedicatedScript)];
    if (exactS9Fix05Implementation) args.push("--post-implementation");
    const first = execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    const second = execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });
    const delegated = JSON.parse(first);
    const dedicatedSelfTest = JSON.parse(execFileSync(
      process.execPath,
      [join(root, s9Fix05DedicatedScript), "--self-test-json"],
      { cwd: root, encoding: "utf8" },
    ));
    const accepted = delegated.passed === true
      && first === second
      && dedicatedSelfTest.positive?.passed === 1
      && dedicatedSelfTest.negative?.passed === dedicatedSelfTest.negative?.total
      && networkRequests === 0;
    console.log(`${accepted ? "PASS" : "FAIL"} s9-fix-05-ledger-diff-routing: delegated exact ledger/result/status and 3/157 owned/non-owned projection validation.`);
    console.log(`${accepted ? "PASS" : "FAIL"} s9-fix-05-deterministic-self-tests: positive 1/1; negative ${dedicatedSelfTest.negative?.passed}/${dedicatedSelfTest.negative?.total}; repeat=${first === second}.`);
    console.log(`REPORT ledger_profile=${exactS9Fix05Implementation ? "prospective-s9-fix-05" : "s9-fix-05-contract-and-gate-preparation"} substep=S9-FIX-05 historical_diff=0 runtime_diff=0 network=${networkRequests}`);
    if (!accepted) process.exitCode = 1;
    globalThis.fetch = originalFetch;
  } else {
  const manifestText = read(manifestPath);
  const ledgerText = read(ledgerPath);
  const manifest = JSON.parse(manifestText);
  const ledger = JSON.parse(ledgerText);
  const result = JSON.parse(read(resultPath));
  const expectedRevisionIds = STAGE_9_SCHEMA_ORACLE_MAPPINGS
    .map((_, index) => `S9-FIX-01-REV-${String(index + 1).padStart(3, "0")}`);

  const changed = [...new Set([
    ...gitLines("diff", "--name-only", "HEAD"),
    ...gitLines("ls-files", "--others", "--exclude-standard"),
  ])].sort();
  const protectedWorkingDiff = gitLines(
    "diff", "--name-only", "HEAD", "--", "docs/qa/review", resultPath,
  );
  const headProjectContext = execFileSync(
    "git", ["show", `HEAD:${projectContextPath}`], { cwd: root, encoding: "utf8" },
  );
  const s9Fix02ResultArtifact = existsSync(join(root, s9Fix02ResultPath))
    ? JSON.parse(read(s9Fix02ResultPath))
    : null;
  const s9Fix03ResultArtifact = existsSync(join(root, s9Fix03ResultPath))
    ? JSON.parse(read(s9Fix03ResultPath))
    : null;
  const s9Fix04ResultArtifact = existsSync(join(root, s9Fix04ResultPath))
    ? JSON.parse(read(s9Fix04ResultPath))
    : null;
  const ledgerProfile = classifyActualChangeSet({
    candidateLedgerText: ledgerText,
    changedPaths: changed,
    protectedArtifactChanged: protectedWorkingDiff.length > 0,
    projectContextSectionValid: projectContextSectionOnlyChanged(
      headProjectContext,
      read(projectContextPath),
    ),
    s9Fix02Result: s9Fix02ResultArtifact,
    s9Fix03Result: s9Fix03ResultArtifact,
    s9Fix04Result: s9Fix04ResultArtifact,
  });
  const actualFixtureProjection = validateS9Fix04FixtureProjection(
    fixtureProjections(),
  );
  const wholeSyntheticFixtureHashPreserved =
    sha(readFileSync(join(root, fixturePath))) === expectedFixtureSha;
  const syntheticFixtureIntegrity = fixtureSourceIntegrityForProfile({
    mode: ledgerProfile.mode,
    wholeFileHashPreserved: wholeSyntheticFixtureHashPreserved,
    projection: actualFixtureProjection,
  });

  add(
    "generated-artifact-integrity",
    manifestText === serializePostRemediationManifest()
      && ledgerProfile.boundaryPreserved
      && ledgerProfile.deterministicSerialization,
    `manifest=${sha(manifestText)} ledger=${sha(ledgerText)} mode=${ledgerProfile.mode}`,
  );
  add("append-only-versioned-ledger", ledger.ledger_version === "stage-9-ai-remediation-revision-ledger.1"
    && ledger.append_only === true
    && ledger.generated_at === null
    && ledger.baseline_commit === STAGE_9_REMEDIATION_BASELINE_COMMIT, ledger.ledger_version);
  add("exact-revision-set", ledger.revision_count === 6
    && ledger.revisions.length === 6
    && same(ledger.revisions.map((entry) => entry.revision_id), expectedRevisionIds)
    && new Set(ledger.revisions.map((entry) => entry.revision_id)).size === 6, expectedRevisionIds.join(", "));
  add("mapping-order-integrity", ledger.revisions.every((revision, index) => {
    const mapping = STAGE_9_SCHEMA_ORACLE_MAPPINGS[index];
    return revision.operation === "ADD_VERSIONED_SCHEMA_ORACLE_EVIDENCE"
      && revision.fixture_id === mapping.fixture_id
      && revision.claim_id === mapping.claim_id
      && revision.json_path === mapping.json_path;
  }), "Ledger order matches the frozen six fixture/claim mappings.");
  add("cross-artifact-hash-chain", ledger.revisions.every((revision, index) => {
    const evidence = manifest.schema_oracle_evidence[index];
    return revision.evidence_fragment_sha256 === evidence.evidence_fragment_sha256
      && revision.source_fixture_sha256 === evidence.provenance.source_fixture_sha256
      && revision.legacy_manifest_sha256 === manifest.source_integrity.legacy_manifest_sha256;
  }), "All six ledger revisions point to the exact manifest evidence and immutable source hashes.");
  add("immutable-source-hashes", sha(readFileSync(join(root, legacyPath))) === expectedLegacySha
    && syntheticFixtureIntegrity
    && ledger.revisions.every((revision) =>
      revision.legacy_manifest_sha256 === expectedLegacySha
      && revision.source_fixture_sha256 === expectedFixtureSha),
  `legacy=${expectedLegacySha} historical_fixture=${expectedFixtureSha} mode=${ledgerProfile.mode} ${ledgerProfile.mode === "prospective-s9-fix-04" ? `owned_synthetic=${actualFixtureProjection.ownedSyntheticChangedExactly ? "1/1" : "FAILED"} non_owned_synthetic=${actualFixtureProjection.nonOwnedSyntheticPreserved ? "31/31" : "FAILED"}` : `whole_file_hash=${wholeSyntheticFixtureHashPreserved ? "PASS" : "FAIL"}`}`);
  add("single-commit-contract", ledger.substep_id === "S9-FIX-01"
    && ledger.candidate_id === "Stage 9 Schema-Oracle Evidence Projection Revision"
    && ledger.revisions.every((revision) => revision.implementation_commit_message === "fix(stage-9): expose schema oracle evidence"), "Every S9-FIX-01 revision remains inside its original bounded commit.");

  const historicalDiff = gitLines("diff", "--name-only",
    STAGE_9_REMEDIATION_BASELINE_COMMIT, "--", "docs/qa/review");
  const runtimeDiff = gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT, "--",
    "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine",
    "lib/runtime-integration", "lib/persistence-runtime");
  add("historical-and-fixture-immutability",
    historicalDiff.length === 0 && syntheticFixtureIntegrity,
    historicalDiff.join(", ")
      || `Historical review unchanged; fixture mode=${ledgerProfile.mode}; ${ledgerProfile.mode === "prospective-s9-fix-04" ? `non-owned synthetic=${actualFixtureProjection.nonOwnedSyntheticPreserved ? "31/31" : "FAILED"}` : `whole-file hash=${wholeSyntheticFixtureHashPreserved ? "PASS" : "FAIL"}`}.`);
  add("s9-fix-04-owned-non-owned-projection",
    ledgerProfile.mode !== "prospective-s9-fix-04"
      || actualFixtureProjection.valid,
    ledgerProfile.mode === "prospective-s9-fix-04"
      ? `owned_core=${actualFixtureProjection.ownedCoreCount}/20 transitions=${actualFixtureProjection.transitionCount}/12 retained_1_1=${actualFixtureProjection.retainedVersionCount}/8 non_owned_core=${actualFixtureProjection.nonOwnedCorePreserved ? `${actualFixtureProjection.nonOwnedCoreCount}/140` : "FAILED"} owned_synthetic=${actualFixtureProjection.ownedSyntheticChangedExactly ? "1/1" : "FAILED"} non_owned_synthetic=${actualFixtureProjection.nonOwnedSyntheticPreserved ? `${actualFixtureProjection.nonOwnedSyntheticCount}/31` : "FAILED"}`
      : `Not applicable to ${ledgerProfile.mode}; whole-file hash protection remains active.`);
  add("runtime-immutability", runtimeDiff.length === 0, runtimeDiff.join(", ") || "No runtime/UI/API/provider/auth/persistence diff.");
  add("exact-bounded-diff", ledgerProfile.accepted, `Mode: ${ledgerProfile.mode}; Changed: ${changed.join(", ") || "none"}`);
  add("result-integrity", result.status === "PASS"
    && result.substep_id === ledger.substep_id
    && result.candidate_id === ledger.candidate_id
    && result.schema_oracle_mapping_count === ledger.revision_count
    && result.legacy_manifest_sha256 === expectedLegacySha
    && result.synthetic_fixture_sha256 === expectedFixtureSha
    && result.implementation_commit_message === "fix(stage-9): expose schema oracle evidence", result.status);
  add("prospective-closed-profile-self-tests",
    selfTestContract.committed_baseline.passed
    && selfTestContract.prospective_profiles["S9-FIX-02"].passed
    && selfTestContract.prospective_profiles["S9-FIX-03"].passed
    && selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_pre_status_passed
    && selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_post_status_passed
    && selfTestContract.prospective_profiles["S9-FIX-04"].passed
    && selfTestContract.prospective_profiles["S9-FIX-04"]
      .actual_classifier_passed
    && selfTestContract.routing_regressions.total === 6
    && selfTestContract.routing_regressions.passed === 6
    && selfTestContract.routing_regressions.failed.length === 0
    && selfTestContract.negative_cases.total === 41
    && selfTestContract.negative_cases.passed === 41
    && selfTestContract.negative_cases.failed.length === 0
    && selfTestContract.s9_fix_04_fixture_projection.positive_passed
    && selfTestContract.s9_fix_04_fixture_projection.negative_passed
    && selfTestContract.deterministic,
  "Committed baseline and prospective S9-FIX-02/S9-FIX-03/S9-FIX-04 PASS; routing 6/6; ledger/profile negative cases 41/41; S9-FIX-04 fixture projection positive and negative cases PASS; deterministic JSON contract.");
  add("network-zero", networkRequests === 0
    && manifest.summary.network_request_count === 0
    && result.network_request_count === 0, `${networkRequests} network requests.`);

  globalThis.fetch = originalFetch;
  for (const check of checks) {
    console[check.pass ? "log" : "error"](
      `${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`,
    );
  }
  console.log(`REPORT ledger_profile=${ledgerProfile.mode} substep=S9-FIX-01 revisions=${ledger.revision_count} manifest_sha256=${sha(manifestText)} ledger_sha256=${sha(ledgerText)} historical_diff=${historicalDiff.length} runtime_diff=${runtimeDiff.length} network=${networkRequests}`);
  console.log(`${checks.filter((check) => check.pass).length}/${checks.length} checks passed.`);
  if (checks.some((check) => !check.pass)) process.exitCode = 1;
  }
}
