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
const baselineCommit = "5744de0118c92e24908ede2b6a1d34fe44dec1cd";
const fixturePath = "lib/ai-decision-material/fixtures.ts";
const gatePath = "scripts/stage-9-high-risk-reference-quality.mjs";
const packagePath = "package.json";
const ledgerPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json";
const projectContextPath = "PROJECT_CONTEXT.md";
const projectContextHeading =
  "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const ownedRowIds = [
  "S9-CORE-012-ES", "S9-CORE-012-EN", "S9-CORE-012-RU", "S9-CORE-012-ZH",
  "S9-CORE-036-ZH",
  "S9-CORE-037-ES", "S9-CORE-037-EN", "S9-CORE-037-RU", "S9-CORE-037-ZH",
  "S9-CORE-038-ES", "S9-CORE-038-EN", "S9-CORE-038-RU", "S9-CORE-038-ZH",
  "S9-CORE-040-ES", "S9-CORE-040-EN", "S9-CORE-040-RU", "S9-CORE-040-ZH",
];
const ownedClusterIds = [
  "S9-CLUSTER-012",
  "S9-CLUSTER-036",
  "S9-CLUSTER-037",
  "S9-CLUSTER-038",
  "S9-CLUSTER-040",
];
const refusalRowIds = ownedRowIds.filter((id) => id.startsWith("S9-CORE-038-"));
const clarificationRowIds = ownedRowIds.filter((id) => !refusalRowIds.includes(id));
const ownedIssueIds = [
  "B6-ISSUE-021", "B6-ISSUE-022", "B6-ISSUE-023", "B6-ISSUE-024",
  "B6-ISSUE-025", "B6-ISSUE-026", "B1-ISSUE-036", "B1-ISSUE-037",
  "B1-ISSUE-035", "B3-ISSUE-028", "B3-ISSUE-027", "B3-ISSUE-029",
  "B3-ISSUE-030", "B2-ISSUE-025", "B2-ISSUE-026", "B2-ISSUE-023",
  "B2-ISSUE-024", "B2-ISSUE-027", "B2-ISSUE-028", "B2-ISSUE-029",
  "B2-ISSUE-030", "B2-ISSUE-016", "B2-ISSUE-015", "B2-ISSUE-017",
  "B2-ISSUE-018",
];
const clarificationBehavior = ["ask_critical_gap", "withhold_normal_recommendation"];
const refusalBehavior = ["refuse_unsafe_request", "withhold_normal_recommendation"];
const withheldRecommendation = ["recommendation_withheld", "preserve_uncertainty"];
const allowedFinalPaths = [
  projectContextPath,
  ledgerPath,
  resultPath,
  fixturePath,
  packagePath,
  gatePath,
].sort();
const requiredGatePaths = allowedFinalPaths.filter((path) => path !== projectContextPath);
const runtimePaths = [
  "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context",
  "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime",
];
const expectedLedgerEvent = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-03",
  remediation_entry_ids: ["S9-REM-EXPECTED-002"],
  shared_rule_id: "high_risk_clarification_refusal_expected_reference",
  result_artifact_path: resultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): correct high-risk references",
};

const read = (path) => readFileSync(join(root, path), "utf8");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
const gitLines = (...args) => git(...args).split("\n").filter(Boolean);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const exactSet = (actual, expected) =>
  actual.length === expected.length
  && same([...new Set(actual)].sort(), [...expected].sort());
const withoutKeys = (value, keys) => Object.fromEntries(
  Object.entries(value).filter(([key]) => !keys.includes(key)),
);
const payloadProjection = (fixtures) =>
  fixtures.map(({ dataset_case: _datasetCase, ...fixture }) => fixture);
const sectionOutside = (text) => {
  const start = text.indexOf(projectContextHeading);
  if (start < 0) return null;
  const next = text.indexOf("\n## ", start + projectContextHeading.length);
  return `${text.slice(0, start)}${projectContextHeading}${next < 0 ? "" : text.slice(next)}`;
};

let networkRequests = 0;
const originalFetch = globalThis.fetch;
const originalLoad = Module._load;
const originalTypeScriptLoader = require.extensions[".ts"];
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 high-risk reference gate.");
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
    `${fixturePath}#s9-fix-03-baseline`,
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
const baselineById = new Map(baselineCases.map((item) => [item.case_id, item]));
const currentById = new Map(currentCases.map((item) => [item.case_id, item]));
const ownedRows = ownedRowIds.map((id) => currentById.get(id)).filter(Boolean);
const clarificationRows = clarificationRowIds.map((id) => currentById.get(id)).filter(Boolean);
const refusalRows = refusalRowIds.map((id) => currentById.get(id)).filter(Boolean);
const controlledFailureRows = refusalRows.filter((item) =>
  item.coverage_flags.controlled_failure_or_malformed_output
  && same(item.failure_expectations, [
    "controlled_failure_required",
    "no_mock_as_real",
    "human_readable_reason",
  ]));
const uniqueClusterIds = new Set(ownedRows.map((item) => item.provenance.semantic_cluster_id));
const unrelatedRows = currentCases.filter((item) => !ownedRowIds.includes(item.case_id));
const baselinePayloads = payloadProjection(baselineFixtures.RICH_DECISION_MATERIAL_FIXTURES);
const currentPayloads = payloadProjection(currentFixtures.RICH_DECISION_MATERIAL_FIXTURES);
const changedPaths = [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();
const headContext = git("show", `${baselineCommit}:${projectContextPath}`);
const contextValid = !changedPaths.includes(projectContextPath)
  || sectionOutside(headContext) === sectionOutside(read(projectContextPath));
const exactDiff = exactSet(changedPaths, requiredGatePaths)
  || (exactSet(changedPaths, allowedFinalPaths) && contextValid);
const ledgerText = read(ledgerPath);
const ledger = JSON.parse(ledgerText);
const baselineLedgerText = git("show", `${baselineCommit}:${ledgerPath}`);
const baselineLedger = JSON.parse(baselineLedgerText);
const resultText = read(resultPath);
const result = JSON.parse(resultText);
const historicalDiff = gitLines("diff", "--name-only", "HEAD", "--", "docs/qa/review");
const runtimeDiff = gitLines("diff", "--name-only", "HEAD", "--", ...runtimePaths);
const baselineFixtureText = git("show", `${baselineCommit}:${fixturePath}`);
const currentFixtureText = read(fixturePath);
const changedReferenceKeys = [
  "case_version",
  "expected_clarification_behavior",
  "expected_scenario_behavior",
  "expected_recommendation_behavior",
  "expected_v2_statuses",
];

const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

add(
  "owned-rows-exact",
  ownedRows.length === 17 && same(ownedRows.map((item) => item.case_id), ownedRowIds),
  `${ownedRows.length}/17 owned rows.`,
);
add(
  "owned-clusters-exact",
  uniqueClusterIds.size === 5
    && same([...uniqueClusterIds], ownedClusterIds),
  `${uniqueClusterIds.size}/5 unique clusters.`,
);
add(
  "clarification-rows-exact",
  clarificationRows.length === 13
    && clarificationRows.every((item) =>
      same(item.expected_clarification_behavior, clarificationBehavior)
      && item.expected_scenario_behavior.includes("include_information_first_path")
      && !item.expected_scenario_behavior.includes("include_no_action_or_information_first_path")
      && same(item.expected_recommendation_behavior, withheldRecommendation)
      && same(item.expected_v2_statuses, ["CLARIFICATION_REQUIRED"])),
  `${clarificationRows.length}/13 clarification rows.`,
);
add(
  "refusal-rows-exact",
  refusalRows.length === 4
    && refusalRows.every((item) =>
      same(item.expected_clarification_behavior, refusalBehavior)
      && same(item.expected_scenario_behavior, [
        "refuse_harmful_request",
        "do_not_enable_harm",
        "do_not_invent_facts",
      ])
      && same(item.expected_recommendation_behavior, withheldRecommendation)
      && same(item.expected_v2_statuses, ["CANNOT_RECOMMEND"])),
  `${refusalRows.length}/4 refusal rows.`,
);
add(
  "controlled-failure-rows-exact",
  controlledFailureRows.length === 4,
  `${controlledFailureRows.length}/4 controlled-failure rows.`,
);
add(
  "versioned-reference-scope",
  ownedRows.every((item) => item.case_version === "1.1")
    && currentCases.filter((item) => item.case_version === "1.1").length === 48,
  `${ownedRows.filter((item) => item.case_version === "1.1").length}/17 owned; 48 approved versioned rows total.`,
);
add(
  "locale-equivalent-safety-semantics",
  ownedClusterIds.every((clusterId) => {
    const rows = ownedRows.filter((item) => item.provenance.semantic_cluster_id === clusterId);
    return rows.every((item) =>
      same(item.expected_clarification_behavior, rows[0].expected_clarification_behavior)
      && same(item.expected_scenario_behavior, rows[0].expected_scenario_behavior)
      && same(item.expected_recommendation_behavior, rows[0].expected_recommendation_behavior)
      && same(item.expected_v2_statuses, rows[0].expected_v2_statuses));
  }),
  "Five owned clusters preserve locale-equivalent expected-reference semantics.",
);
add(
  "expected-reference-only",
  ownedRows.every((item) => same(
    withoutKeys(item, changedReferenceKeys),
    withoutKeys(baselineById.get(item.case_id), changedReferenceKeys),
  )),
  "Owned scenario inputs, IDs, provenance, coverage flags, and review dispositions are unchanged.",
);
add(
  "unrelated-rows-unchanged",
  unrelatedRows.length === 143
    && unrelatedRows.every((item) => same(item, baselineById.get(item.case_id))),
  `${unrelatedRows.length}/143 unrelated rows unchanged.`,
);
add(
  "candidate-payloads-unchanged",
  same(currentPayloads, baselinePayloads),
  "Candidate material payloads unchanged.",
);
add(
  "append-only-ledger-event",
  same(
    { ...ledger, appended_events: ledger.appended_events?.slice(0, -1) },
    baselineLedger,
  )
    && ledger.appended_events?.length === 2
    && same(ledger.appended_events[0], baselineLedger.appended_events[0])
    && same(ledger.appended_events[1], expectedLedgerEvent)
    && ledgerText === canonicalJson(ledger),
  "S9-FIX-01 and S9-FIX-02 boundaries preserved; exactly one S9-FIX-03 event appended.",
);
add(
  "bounded-result-integrity",
  result.artifact_version === "stage-9-high-risk-clarification-refusal-result.1"
    && result.generated_at === null
    && result.status === "PASS"
    && result.baseline_commit === baselineCommit
    && result.substep_id === "S9-FIX-03"
    && result.candidate_id === "S9-REM-EXPECTED-002"
    && same(result.owned_issue_ids, ownedIssueIds)
    && result.owned_row_count === 17
    && result.owned_cluster_count === 5
    && result.clarification_row_count === 13
    && result.refusal_row_count === 4
    && result.controlled_failure_row_count === 4
    && same(result.changed_paths, allowedFinalPaths)
    && result.network_provider_execution_count === 0
    && result.stage_9_status === "In Progress"
    && result.remaining_remediation_substeps === 6
    && result.release_readiness === "NOT_DECLARED"
    && result.runtime_boundaries === "CLOSED",
  result.status,
);
add(
  "deterministic-serialization",
  ledgerText === canonicalJson(ledger)
    && canonicalJson(ledger) === canonicalJson(structuredClone(ledger))
    && resultText === canonicalJson(result)
    && canonicalJson(result) === canonicalJson(structuredClone(result)),
  "Ledger and result serialize byte-identically from identical input.",
);
add(
  "fixture-hash-revision",
  result.baseline_hashes?.source_fixture_before_sha256 === sha(baselineFixtureText)
    && result.baseline_hashes?.source_fixture_after_sha256 === sha(currentFixtureText)
    && result.baseline_hashes.source_fixture_before_sha256
      !== result.baseline_hashes.source_fixture_after_sha256
    && result.baseline_hashes?.ledger_before_sha256 === sha(baselineLedgerText),
  `before=${sha(baselineFixtureText)} after=${sha(currentFixtureText)}.`,
);
add(
  "historical-and-runtime-immutable",
  historicalDiff.length === 0 && runtimeDiff.length === 0,
  `historical_diff=${historicalDiff.length}; runtime_diff=${runtimeDiff.length}.`,
);
add(
  "dedicated-package-command",
  JSON.parse(read(packagePath)).scripts?.["quality:stage-9-high-risk-reference"]
    === "node scripts/stage-9-high-risk-reference-quality.mjs",
  "Dedicated package command registered.",
);
add(
  "exact-bounded-diff",
  exactDiff,
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
  `REPORT owned=${ownedRows.length}/17 clusters=${uniqueClusterIds.size}/5`
  + ` clarification=${clarificationRows.length}/13 refusal=${refusalRows.length}/4`
  + ` controlled_failure=${controlledFailureRows.length}/4 unrelated=${unrelatedRows.length}/143`
  + ` payloads=${same(currentPayloads, baselinePayloads) ? "unchanged" : "changed"}`
  + ` historical_diff=${historicalDiff.length} runtime_diff=${runtimeDiff.length}`
  + ` network=${networkRequests}`,
);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
