import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));

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

const evaluationPath = join(root, "lib", "ai-quality", "synthetic-risk-evaluation.ts");
const fixturesPath = join(root, "lib", "ai-quality", "synthetic-risk-evaluation-fixtures.ts");
const evaluationSource = readFileSync(evaluationPath, "utf8");
const fixtureSource = readFileSync(fixturesPath, "utf8");
const { evaluateSyntheticRiskCase, runSyntheticRiskEvaluation, SYNTHETIC_RISK_COVERAGE_IDS } = require(evaluationPath);
const { SYNTHETIC_RISK_EVALUATION_FIXTURES } = require(fixturesPath);

const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 offline evaluation gate.");
};

let first;
let second;
try {
  first = runSyntheticRiskEvaluation(SYNTHETIC_RISK_EVALUATION_FIXTURES, () => 0);
  second = runSyntheticRiskEvaluation(SYNTHETIC_RISK_EVALUATION_FIXTURES, () => 0);
} finally {
  globalThis.fetch = originalFetch;
}

add("minimum-28-fixtures", first.total_cases >= 28, `${first.total_cases} fixtures executed.`);
add("all-required-categories-covered", first.covered_categories === SYNTHETIC_RISK_COVERAGE_IDS.length && first.coverage_percent === 100, `${first.covered_categories}/${SYNTHETIC_RISK_COVERAGE_IDS.length} categories covered.`);
add("zero-false-accepts", first.false_accepts === 0, `${first.false_accepts} false accepts.`);
add("zero-false-rejects", first.false_rejects === 0, `${first.false_rejects} false rejects.`);
add("zero-category-mismatches", first.category_mismatches === 0, `${first.category_mismatches} category mismatches.`);
add("all-case-contracts-pass", first.results.every((item) => item.hard_gates.case_contract === "passed"), "Every fixture must satisfy the strict evaluation-case contract.");
add("all-hard-gates-exercised", Object.values(first.hard_gate_coverage).every((gate) => gate.applicable > 0), "Every hard gate must be exercised by the fixture catalog.");
const unknownCategoryCase = structuredClone(SYNTHETIC_RISK_EVALUATION_FIXTURES[0]);
unknownCategoryCase.expected.failure_categories = ["unknown_evaluation_category"];
const unknownCategoryResult = evaluateSyntheticRiskCase(unknownCategoryCase, () => 0);
add("unknown-evaluation-category-fails-closed", !unknownCategoryResult.passed && unknownCategoryResult.hard_gates.case_contract === "failed", "Unknown evaluation categories must fail the strict case contract.");
add("deterministic-repeat", JSON.stringify(first) === JSON.stringify(second), "Repeated execution must produce byte-equivalent JSON.");
add("zero-network-requests", networkRequests === 0 && first.network_requests === 0, `${networkRequests} runtime network requests.`);
add("no-server-sdk-import", !evaluationSource.includes(".server") && !fixtureSource.includes(".server") && !evaluationSource.includes('from "openai"') && !fixtureSource.includes('from "openai"'), "The offline harness must not import the server SDK adapter or OpenAI SDK.");
add("no-environment-or-credentials", !evaluationSource.includes("process.env") && !fixtureSource.includes("process.env") && !/api[_-]?key/i.test(fixtureSource), "The harness must not read environment variables or contain credentials.");
add("no-public-runtime-bridge", !evaluationSource.includes("app/api") && !fixtureSource.includes("app/api") && !evaluationSource.includes("prompt-context") && !evaluationSource.includes("decision-engine"), "Public runtime, Prompt Context, and Decision Engine bridges must remain closed.");
add("aggregate-pass", first.passed, "Aggregate evaluation verdict must pass.");

for (const check of checks) {
  console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
}
console.log(`REPORT cases=${first.total_cases} accepted_as_expected=${first.accepted_as_expected} rejected_as_expected=${first.rejected_as_expected} false_accepts=${first.false_accepts} false_rejects=${first.false_rejects} category_mismatches=${first.category_mismatches} coverage=${first.covered_categories}/${first.required_categories} network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
