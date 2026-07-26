import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixturePath = "lib/ai-decision-material/fixtures.ts";
const gatePath = "scripts/stage-9-systemic-contradiction-reference-quality.mjs";
const packagePath = "package.json";
const ledgerPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json";
const s9Fix01ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json";
const legacyManifestPath = "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json";
const baselineCommit = "262fd3f44d6e78957a0a47719570219553dfea42";
const sharedRule = "source_entailment_requires_two_mutually_incompatible_claims";
const expectedClarification = ["ask_critical_gap", "withhold_normal_recommendation"];
const previousClarification = ["reconcile_contradiction", "preserve_both_claims", "withhold_normal_recommendation"];
const ownedClaims = [
  "B1-ISSUE-033", "B1-ISSUE-034", "B1-ISSUE-022", "B1-ISSUE-024",
  "B1-ISSUE-019", "B1-ISSUE-021", "B1-ISSUE-025", "B1-ISSUE-027",
  "B1-ISSUE-028", "B1-ISSUE-030",
  "B6-ISSUE-017", "B6-ISSUE-018", "B6-ISSUE-015", "B6-ISSUE-016",
  "B6-ISSUE-019", "B6-ISSUE-020",
  "B3-ISSUE-011", "B3-ISSUE-012", "B3-ISSUE-013", "B3-ISSUE-014",
  "B4-ISSUE-002", "B4-ISSUE-003", "B4-ISSUE-004", "B4-ISSUE-005",
  "B4-ISSUE-007", "B4-ISSUE-008", "B4-ISSUE-009",
  "B5-ISSUE-013", "B5-ISSUE-014", "B5-ISSUE-015", "B5-ISSUE-016",
  "B5-ISSUE-017", "B5-ISSUE-018", "B5-ISSUE-019", "B5-ISSUE-020",
  "B6-ISSUE-007", "B6-ISSUE-009", "B6-ISSUE-011", "B6-ISSUE-013",
];
const ownedClusters = [
  "S9-CLUSTER-004",
  "S9-CLUSTER-008",
  "S9-CLUSTER-016",
  "S9-CLUSTER-020",
  "S9-CLUSTER-024",
  "S9-CLUSTER-028",
  "S9-CLUSTER-032",
  "S9-CLUSTER-036",
];
const languages = ["es", "en", "ru", "zh"];
const allowedFinalPaths = [
  "PROJECT_CONTEXT.md",
  ledgerPath,
  resultPath,
  fixturePath,
  packagePath,
  gatePath,
].sort();
const requiredGatePaths = allowedFinalPaths.filter((path) => path !== "PROJECT_CONTEXT.md");
const runtimePaths = [
  "app",
  "components",
  "supabase",
  "lib/ai-provider",
  "lib/prompt-context",
  "lib/decision-engine",
  "lib/runtime-integration",
  "lib/persistence-runtime",
];
const expectedLedgerEvent = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-02",
  remediation_entry_ids: ["S9-REM-EXPECTED-001", "S9-REM-CLUSTER-001"],
  shared_rule_id: sharedRule,
  result_artifact_path: resultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): correct contradiction references",
};
const expectedHashes = {
  legacy_manifest_sha256: "5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b",
  historical_review_tree_sha256: "349521be56cc51051bb651d4e42522c5b423fb401fbec0f61752838be87365da",
  s9_fix_01_result_sha256: "e4edca1b4263c78bca83974f4e7c6bc741279036554ad6b649bdaec82a3598f5",
  s9_fix_01_ledger_boundary_sha256: "4c896eadf51ebcb206b48c99da0e562fdf3d59c8f387235efc3585bd97e0486f",
  coverage_validator_sha256: "e04c80c02980d27d31abfde34a2b3af08979bca354df2ba4beb95016dbf2cb8a",
  revision_integrity_validator_sha256: "a1bf6012da12956155f9ea3fdf2077ebe9f976bcffa437342e037776f1b9bc91",
  runtime_tree_sha256: "1e0480a05866d06b48baab00f4de61fc9e502d2a1d0bd9429bf9289c531ecc06",
};

const read = (path) => readFileSync(join(root, path), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
const gitLines = (...args) => git(...args).split("\n").filter(Boolean);
const exactSet = (actual, expected) =>
  actual.length === expected.length
  && same([...new Set(actual)].sort(), [...expected].sort());
const withoutKeys = (value, keys) => Object.fromEntries(
  Object.entries(value).filter(([key]) => !keys.includes(key)),
);
const payloadProjection = (fixtures) =>
  fixtures.map(({ dataset_case: _datasetCase, ...fixture }) => fixture);

let networkRequests = 0;
const originalFetch = globalThis.fetch;
const originalLoad = Module._load;
const originalTypeScriptLoader = require.extensions[".ts"];
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 contradiction-reference gate.");
};
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
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(output.outputText, filename);
};

function loadFixtureSource(source, label) {
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
  const module = new Module(label);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(dirname(filename));
  module._compile(output.outputText, filename);
  return module.exports;
}

let baselineFixtures;
let currentFixtures;
try {
  baselineFixtures = loadFixtureSource(
    git("show", `${baselineCommit}:${fixturePath}`),
    `${fixturePath}#s9-fix-02-baseline`,
  );
  currentFixtures = require(join(root, fixturePath));
} finally {
  globalThis.fetch = originalFetch;
  Module._load = originalLoad;
  if (originalTypeScriptLoader) {
    require.extensions[".ts"] = originalTypeScriptLoader;
  } else {
    delete require.extensions[".ts"];
  }
}

const baselineCases = baselineFixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const currentCases = currentFixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const baselinePayloads = payloadProjection(baselineFixtures.RICH_DECISION_MATERIAL_FIXTURES);
const currentPayloads = payloadProjection(currentFixtures.RICH_DECISION_MATERIAL_FIXTURES);
const changedPaths = [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();
const smokeSnapshot = {
  fixture_case_count: currentCases.length,
  fixture_case_ids: currentCases.map((item) => item.case_id),
  candidate_payloads: currentPayloads,
};
const smokeSnapshotRepeat = {
  fixture_case_count: currentFixtures.CANONICAL_OFFLINE_EVALUATION_CASES.length,
  fixture_case_ids: currentFixtures.CANONICAL_OFFLINE_EVALUATION_CASES.map((item) => item.case_id),
  candidate_payloads: payloadProjection(currentFixtures.RICH_DECISION_MATERIAL_FIXTURES),
};
const baselineSmokeContract = {
  profile: "S9_FIX_02_BASELINE_FIXTURE_LOADER",
  fixture_module_loaded: Boolean(currentFixtures),
  baseline_case_count: currentCases.length,
  owned_claim_identifiers: {
    total: ownedClaims.length,
    unique: new Set(ownedClaims).size,
    available: ownedClaims.length === 39 && new Set(ownedClaims).size === 39,
  },
  candidate_payloads: {
    available: currentPayloads.length > 0,
    count: currentPayloads.length,
  },
  loader_strategy: "typescript-require-extension",
  baseline_source_loaded: baselineCases.length === 160,
  loader_deterministic: canonicalJson(smokeSnapshot) === canonicalJson(smokeSnapshotRepeat),
  repository_fixture_data_unchanged:
    gitLines("diff", "--name-only", "HEAD", "--", fixturePath).length === 0,
  provisional_changed_paths: changedPaths,
  provisional_gate_only: changedPaths.length === 1 && changedPaths[0] === gatePath,
  network_request_count: networkRequests,
};

if (process.argv.includes("--baseline-load-self-test-json")) {
  process.stdout.write(canonicalJson(baselineSmokeContract));
  if (!baselineSmokeContract.fixture_module_loaded
    || baselineSmokeContract.baseline_case_count !== 160
    || !baselineSmokeContract.owned_claim_identifiers.available
    || !baselineSmokeContract.candidate_payloads.available
    || !baselineSmokeContract.baseline_source_loaded
    || !baselineSmokeContract.loader_deterministic
    || !baselineSmokeContract.repository_fixture_data_unchanged
    || !baselineSmokeContract.provisional_gate_only
    || baselineSmokeContract.network_request_count !== 0) {
    process.exitCode = 1;
  }
} else {
  const checks = [];
  const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
  const baselineById = new Map(baselineCases.map((item) => [item.case_id, item]));
  const currentById = new Map(currentCases.map((item) => [item.case_id, item]));
  const ownedRows = currentCases.filter((item) =>
    ownedClusters.includes(item.provenance.semantic_cluster_id));
  const nonOwnedRows = currentCases.filter((item) =>
    !ownedClusters.includes(item.provenance.semantic_cluster_id));
  const ledgerText = read(ledgerPath);
  const ledger = JSON.parse(ledgerText);
  const resultText = read(resultPath);
  const result = JSON.parse(resultText);
  const baselineLedgerText = git("show", `${baselineCommit}:${ledgerPath}`);
  const ledgerBoundary = Object.fromEntries(
    Object.entries(ledger).filter(([key]) => key !== "appended_events"),
  );
  const reviewTree = gitLines("ls-tree", "-r", baselineCommit, "--", "docs/qa/review");
  const reviewJsonTree = reviewTree.filter((line) => line.endsWith(".json"));
  const runtimeTree = git("ls-tree", "-r", baselineCommit, "--", ...runtimePaths);
  const packageJson = JSON.parse(read(packagePath));
  const historicalDiff = gitLines("diff", "--name-only", "HEAD", "--", "docs/qa/review");
  const runtimeDiff = gitLines("diff", "--name-only", "HEAD", "--", ...runtimePaths);
  const protectedValidatorDiff = gitLines(
    "diff",
    "--name-only",
    "HEAD",
    "--",
    "scripts/stage-9-offline-dataset-coverage-quality.mjs",
    "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  );

  add(
    "owned-claims-exact",
    ownedClaims.length === 39
      && new Set(ownedClaims).size === 39
      && same(result.owned_claim_ids, ownedClaims),
    `${ownedClaims.length}/39 claims; duplicates=${ownedClaims.length - new Set(ownedClaims).size}.`,
  );
  add(
    "consolidated-partial-case",
    same(result.consolidated_partial_case, {
      claim_id: "B4-ISSUE-006",
      fixture_id: "S9-CORE-020-ES",
      final_disposition: "PARTIALLY_CONFIRMED",
      accepted_component: "unsupported contradiction reference",
    })
      && ownedRows.some((item) => item.case_id === "S9-CORE-020-ES"),
    "B4-ISSUE-006 / S9-CORE-020-ES remains PARTIALLY_CONFIRMED.",
  );
  add(
    "owned-clusters-exact",
    ownedClusters.length === 8
      && new Set(ownedClusters).size === 8
      && same(result.owned_cluster_ids, ownedClusters)
      && ownedClusters.every((clusterId) =>
        languages.every((language) => ownedRows.some((item) =>
          item.provenance.semantic_cluster_id === clusterId && item.language === language))),
    `${ownedClusters.length}/8 clusters with four locale rows each.`,
  );
  add(
    "shared-rule",
    currentFixtures.SYSTEMIC_CONTRADICTION_REFERENCE_RULE === sharedRule
      && result.shared_rule_id === sharedRule,
    sharedRule,
  );
  add(
    "versioned-reference-rows",
    ownedRows.length === 32
      && ownedRows.every((item) => item.case_version === "1.1")
      && currentCases.filter((item) => item.case_version === "1.1").length === 32
      && ownedRows.every((item) => baselineById.get(item.case_id)?.case_version === "1.0"),
    `${ownedRows.length}/32 owned rows are version 1.1.`,
  );
  add(
    "source-entailment-reference",
    ownedRows.every((item) =>
      same(item.expected_clarification_behavior, expectedClarification)
      && same(baselineById.get(item.case_id)?.expected_clarification_behavior, previousClarification)),
    "Owned rows no longer assert a contradiction without two incompatible source claims.",
  );
  add(
    "no-invented-evidence",
    ownedRows.every((item) => same(
      withoutKeys(item, ["case_version", "expected_clarification_behavior"]),
      withoutKeys(baselineById.get(item.case_id), ["case_version", "expected_clarification_behavior"]),
    )),
    "Only case_version and expected_clarification_behavior changed in owned rows.",
  );
  add(
    "gender-interpretation-excluded",
    result.excluded_interpretation?.remediation_eligible === false
      && result.excluded_interpretation?.disposition === "REJECTED"
      && same(
        currentById.get("S9-CORE-020-ES")?.user_situation,
        baselineById.get("S9-CORE-020-ES")?.user_situation,
      ),
    "Rejected grammatical-gender interpretation remains excluded.",
  );
  add(
    "unrelated-references-unchanged",
    nonOwnedRows.length === 128
      && nonOwnedRows.every((item) => same(item, baselineById.get(item.case_id))),
    `${nonOwnedRows.length}/128 non-owned rows are unchanged.`,
  );
  add(
    "fixture-identities-preserved",
    same(currentCases.map((item) => item.case_id), baselineCases.map((item) => item.case_id))
      && currentCases.length === baselineCases.length,
    `${currentCases.length} canonical IDs preserved.`,
  );
  add(
    "candidate-payloads-unchanged",
    same(currentPayloads, baselinePayloads),
    "All candidate material payloads remain byte-semantically equivalent.",
  );
  add(
    "append-only-ledger-event",
    canonicalJson(ledgerBoundary) === baselineLedgerText
      && Array.isArray(ledger.appended_events)
      && ledger.appended_events.length === 1
      && same(ledger.appended_events[0], expectedLedgerEvent)
      && ledgerText === canonicalJson(ledger),
    "S9-FIX-01 boundary preserved; one canonical S9-FIX-02 event appended.",
  );
  add(
    "bounded-result-integrity",
    result.artifact_version === "stage-9-systemic-contradiction-reference-result.1"
      && result.generated_at === null
      && result.status === "PASS"
      && result.baseline_commit === baselineCommit
      && result.substep_id === "S9-FIX-02"
      && same(result.remediation_entry_ids, expectedLedgerEvent.remediation_entry_ids)
      && result.owned_claim_count === 39
      && result.owned_cluster_count === 8
      && result.version_1_1_row_count === 32
      && same(result.changed_paths, allowedFinalPaths)
      && result.network_provider_execution_count === 0
      && result.stage_9_status === "In Progress"
      && result.remaining_remediation_substeps === 7
      && result.release_readiness === "NOT_DECLARED",
    result.status,
  );
  const resultSerializationA = canonicalJson(result);
  const resultSerializationB = canonicalJson(structuredClone(result));
  const ledgerSerializationA = canonicalJson(ledger);
  const ledgerSerializationB = canonicalJson(structuredClone(ledger));
  add(
    "deterministic-serialization",
    resultText === resultSerializationA
      && resultSerializationA === resultSerializationB
      && ledgerText === ledgerSerializationA
      && ledgerSerializationA === ledgerSerializationB,
    "Ledger and result serialize byte-identically from identical input.",
  );
  add(
    "historical-and-s9-fix-01-immutability",
    sha(read(legacyManifestPath)) === expectedHashes.legacy_manifest_sha256
      && reviewJsonTree.length === 92
      && sha(`${reviewJsonTree.join("\n")}\n`) === expectedHashes.historical_review_tree_sha256
      && historicalDiff.length === 0
      && sha(read(s9Fix01ResultPath)) === expectedHashes.s9_fix_01_result_sha256
      && sha(baselineLedgerText) === expectedHashes.s9_fix_01_ledger_boundary_sha256,
    `legacy=${expectedHashes.legacy_manifest_sha256}; historical_json=${reviewJsonTree.length}; diff=${historicalDiff.length}.`,
  );
  add(
    "validators-and-runtime-immutable",
    sha(read("scripts/stage-9-offline-dataset-coverage-quality.mjs"))
        === expectedHashes.coverage_validator_sha256
      && sha(read("scripts/stage-9-remediation-revision-integrity-quality.mjs"))
        === expectedHashes.revision_integrity_validator_sha256
      && protectedValidatorDiff.length === 0
      && sha(runtimeTree) === expectedHashes.runtime_tree_sha256
      && runtimeDiff.length === 0,
    `validator_diff=${protectedValidatorDiff.length}; runtime_diff=${runtimeDiff.length}.`,
  );
  add(
    "dedicated-package-command",
    packageJson.scripts?.["quality:stage-9-systemic-contradiction-reference"]
      === "node scripts/stage-9-systemic-contradiction-reference-quality.mjs",
    packageJson.scripts?.["quality:stage-9-systemic-contradiction-reference"] ?? "missing",
  );
  add(
    "exact-bounded-diff",
    exactSet(changedPaths, requiredGatePaths),
    changedPaths.join(", "),
  );
  add(
    "network-provider-zero",
    networkRequests === 0 && result.network_provider_execution_count === 0,
    `${networkRequests} network/provider executions.`,
  );

  for (const check of checks) {
    console[check.passed ? "log" : "error"](
      `${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`,
    );
  }
  console.log(
    `REPORT claims=${ownedClaims.length}/39 partial=PARTIALLY_CONFIRMED`
    + ` clusters=${ownedClusters.length}/8 version_1_1=${ownedRows.length}`
    + ` unrelated=${nonOwnedRows.length} historical=${reviewJsonTree.length}`
    + ` runtime_diff=${runtimeDiff.length} network=${networkRequests}`,
  );
  console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
  if (checks.some((check) => !check.passed)) process.exitCode = 1;
}
