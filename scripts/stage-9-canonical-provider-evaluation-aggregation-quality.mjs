import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};
require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
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

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
const taxonomy = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-taxonomy.ts"));
const aggregation = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-aggregation.ts"));

const cases = fixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const byId = new Map(cases.map((item) => [item.case_id, item]));
const categories = taxonomy.CANONICAL_PROVIDER_EVALUATION_CATEGORIES;

const missingByCase = {
  "S9-CORE-001-ES": {
    scenario: ["do_not_invent_facts", "include_no_action_or_information_first_path"],
    risk: ["preserve_likelihood_uncertainty"], recommendation: ["conditional_recommendation_allowed"],
    failure: ["fail_closed"], traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
  "S9-CORE-001-EN": {
    scenario: ["do_not_invent_facts", "include_no_action_or_information_first_path"],
    risk: ["preserve_likelihood_uncertainty"], failure: ["fail_closed"],
    traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
  "S9-CORE-001-RU": {
    scenario: ["do_not_invent_facts", "include_no_action_or_information_first_path"],
    risk: ["preserve_likelihood_uncertainty"], failure: ["fail_closed"],
    traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
  "S9-CORE-001-ZH": {
    scenario: ["do_not_invent_facts", "include_no_action_or_information_first_path"],
    risk: ["preserve_likelihood_uncertainty"], recommendation: ["conditional_recommendation_allowed"],
    failure: ["fail_closed"], traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
  "S9-CORE-002-ES": {
    scenario: ["do_not_invent_facts"], risk: ["preserve_likelihood_uncertainty"],
    failure: ["controlled_failure_required", "human_readable_reason", "no_mock_as_real"],
    traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
  "S9-CORE-002-EN": {
    scenario: ["do_not_invent_facts"], risk: ["preserve_likelihood_uncertainty"],
    failure: ["controlled_failure_required", "human_readable_reason", "no_mock_as_real"],
    traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
  "S9-CORE-002-RU": {
    risk: ["preserve_likelihood_uncertainty"], privacy: ["data_minimization"],
    failure: ["controlled_failure_required", "human_readable_reason", "no_mock_as_real"],
    traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
  "S9-CORE-002-ZH": {
    risk: ["preserve_likelihood_uncertainty"], privacy: ["data_minimization"],
    failure: ["controlled_failure_required", "human_readable_reason", "no_mock_as_real"],
    traceability: ["preserve_case_id"], rubric: ["safety_privacy_equivalence"],
  },
};

const unexpectedByCase = {
  "S9-CORE-001-ES": { risk: ["deadline_pressure", "opportunity_cost"], privacy: ["no_identifiers"] },
  "S9-CORE-001-EN": { risk: ["deadline_pressure", "opportunity_cost"], privacy: ["no_identifiers"] },
  "S9-CORE-001-RU": { risk: ["deadline_pressure", "opportunity_cost"], privacy: ["no_identifiers"] },
  "S9-CORE-001-ZH": { risk: ["deadline_pressure", "opportunity_cost"], privacy: ["no_identifiers"] },
  "S9-CORE-002-ES": { scenario: ["include_information_first_path"], clarification: ["withhold_normal_recommendation"], privacy: ["no_identifiers"], risk: ["delay_cost", "reversibility_loss"] },
  "S9-CORE-002-EN": { scenario: ["include_information_first_path"], clarification: ["withhold_normal_recommendation"], privacy: ["no_identifiers", "broad_category_only"], risk: ["opportunity_cost", "reversibility_loss"] },
  "S9-CORE-002-RU": { scenario: ["include_information_first_path"], clarification: ["withhold_normal_recommendation"], privacy: ["no_identifiers", "broad_category_only"], risk: ["delay_cost", "lock_in"] },
  "S9-CORE-002-ZH": { scenario: ["include_information_first_path"], clarification: ["withhold_normal_recommendation"], privacy: ["no_identifiers", "broad_category_only"], risk: ["delay_cost", "sunk_cost_bias"] },
};

function comparableEvidence(caseId) {
  const source = byId.get(caseId);
  if (!source) throw new Error(`Missing frozen case ${caseId}.`);
  const oracle = taxonomy.canonicalOracleConceptsByCategory(source);
  const categoryResults = Object.fromEntries(categories.map((category) => {
    const expected = [...oracle[category]].sort();
    const missing = [...(missingByCase[caseId]?.[category] ?? [])].sort();
    const unexpected = [...(unexpectedByCase[caseId]?.[category] ?? [])].sort();
    const actual = [
      ...expected.filter((concept) => !missing.includes(concept)),
      ...unexpected,
    ].sort();
    return [category, {
      passed: category === "v2_status"
        ? missing.length === 0 && unexpected.length === 0 && actual.length === 1
        : missing.length === 0 && unexpected.length === 0,
      expected, actual, missing, unexpected,
    }];
  }));
  return {
    caseId,
    locale: source.language,
    semanticClusterId: source.provenance.semantic_cluster_id,
    matcher: {
      passed: categories.every((category) => categoryResults[category].passed),
      categories: categoryResults,
    },
    deterministicGates: {
      provider_result_contract: "PASS",
      candidate_contract_and_safety: "PASS",
      oracle_isolation: "PASS",
      approved_cost_budget: "PASS",
    },
    normalizedCostRecorded: true,
  };
}

const evidence = Object.keys(missingByCase).map(comparableEvidence);
let networkOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkOperations += 1;
  throw new Error("Network access is forbidden in the canonical aggregation gate.");
};
const operationalEvidence = {
  reportedCases: 8,
  inputTokens: 46689,
  cachedInputTokens: 32410,
  outputTokens: 20541,
  reasoningTokens: 2185,
  totalTokens: 67230,
  conservativeUncachedCostUsd: 0.849675,
  cacheAdjustedCalculatedCostUsd: 0.70383,
  generationLatencyMsTotal: null,
};
const result = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  evidence,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence,
);
globalThis.fetch = originalFetch;

const checks = [];
const add = (id, passed, detail = "Check failed.") => checks.push({ id, passed: Boolean(passed), detail });
const metric = (id, scope = "global") => result.metrics.find((item) => item.metricId === id && item.scope === scope);
const multilingual = (id) => result.multilingual.find((item) => item.metricId === id);

const scenario = metric("scenario.meaningfully_distinct_paths");
add("ceil-threshold", scenario.applicabilityDenominator === 156 && scenario.requiredFinalSuccesses === 149,
  `Expected ceil(.95 * 156) = 149, received ${scenario.requiredFinalSuccesses}.`);
const v2 = metric("outcome.expected_v2_status");
add("one-hundred-percent-threshold", v2.maximumAllowedFinalFailures === 0 && v2.status === "PASS_SO_FAR");
const risk = metric("risk.must_cover_material_recall");
add("recoverable-current-failure", risk.failuresAlreadyAccumulated === 8 && risk.status === "FAIL_SO_FAR_BUT_RECOVERABLE");
const privacyRu = metric("privacy.minimum_necessary_context", "ru");
add("mathematically-impossible", privacyRu.failuresAlreadyAccumulated === 1 && privacyRu.status === "QUALIFICATION_IMPOSSIBLE");
add("per-locale-independent-failure", metric("privacy.minimum_necessary_context", "es").status !== "QUALIFICATION_IMPOSSIBLE" && privacyRu.status === "QUALIFICATION_IMPOSSIBLE");
add("unexpected-diagnostic-only", risk.unexpected === 0 && result.taxonomyDiagnostics.risk.unexpected === 16);
const precisionDefinition = [{
  ...aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS.find((item) => item.metricId === "risk.must_cover_material_recall"),
  metricId: "test.risk_precision_evidence", unexpectedConcepts: "participates_in_precision",
  failureEvidence: "unexpected_concept",
}];
const precisionResult = aggregation.aggregateCanonicalProviderEvaluationCampaign(cases, evidence, precisionDefinition);
add("unexpected-explicit-precision", precisionResult.metrics[0].unexpected === 16 && precisionResult.metrics[0].failuresAlreadyAccumulated === 16);
add("human-review-required", result.reviewRequired.some((item) => item.metricId === "human.dimension_scores" && item.reviewClassification === "HUMAN_REVIEW_PENDING"));
add("multilingual-review-required", result.reviewRequired.some((item) => item.metricId === "multilingual.remaining_properties" && item.reviewClassification === "MULTILINGUAL_REVIEW_REQUIRED"));
const hardFailureEvidence = structuredClone(evidence);
hardFailureEvidence[0].deterministicGates.oracle_isolation = "FAIL";
const hardFailure = aggregation.aggregateCanonicalProviderEvaluationCampaign(cases, hardFailureEvidence);
add("hard-gate-impossible", hardFailure.feasibility === "QUALIFICATION_IMPOSSIBLE_BY_EXISTING_THRESHOLD" && hardFailure.hardGates.find((item) => item.gateId === "oracle_isolation").failures === 1);
add("perfect-remainder-counterfactual", risk.maximumAchievableFinalSuccesses === 468 && risk.maximumAchievableFinalRate === 468 / 476);
add("early-stop-error-budget", risk.maximumAllowedFinalFailures === 23 && risk.remainingFailureBudget === 15);
add("v2-alternative-case-semantics", v2.applicabilityDenominator === 160 && v2.evaluatedApplicableDenominator === 8 && v2.successes === 8);
add("oracle-leakage-zero", result.hardGates.find((item) => item.gateId === "oracle_isolation").failures === 0);
const corruptedEvidence = structuredClone(evidence);
corruptedEvidence[0].matcher.categories.risk.expected = ["not_the_frozen_oracle"];
add("corrupted-machine-evidence", aggregation.aggregateCanonicalProviderEvaluationCampaign(cases, corruptedEvidence).feasibility === "SYSTEM_EVIDENCE_INCOMPLETE");
add("existing-counts-reproduced", JSON.stringify(result.taxonomyDiagnostics) === JSON.stringify({
  scenario: { expected: 24, success: 14, missing: 10, unexpected: 4 },
  risk: { expected: 20, success: 12, missing: 8, unexpected: 16 },
  clarification: { expected: 8, success: 8, missing: 0, unexpected: 4 },
  recommendation: { expected: 16, success: 14, missing: 2, unexpected: 0 },
  safety: { expected: 8, success: 8, missing: 0, unexpected: 0 },
  privacy: { expected: 8, success: 6, missing: 2, unexpected: 11 },
  failure: { expected: 16, success: 0, missing: 16, unexpected: 0 },
  v2_status: { expected: 8, success: 8, missing: 0, unexpected: 0 },
  traceability: { expected: 24, success: 16, missing: 8, unexpected: 0 },
  rubric: { expected: 32, success: 24, missing: 8, unexpected: 0 },
}));
add("frozen-structure", result.coverage.totalFrozenCases === 160 && result.coverage.locales === 4 && Object.values(result.coverage.casesPerLocale).every((count) => count === 40) && result.coverage.semanticClusters === 40);
add("frozen-taxonomy-denominators", JSON.stringify(result.frozenTaxonomyDenominators) === JSON.stringify({
  scenario: 480, risk: 476, clarification: 248, recommendation: 320,
  safety: 220, privacy: 240, failure: 240, v2_status: 160,
  traceability: 480, rubric: 640,
}));
add("multilingual-two-clusters", result.multilingual.every((item) => item.evaluatedApplicableDenominator === 2));
add("current-feasibility", result.feasibility === "QUALIFICATION_IMPOSSIBLE_BY_EXISTING_THRESHOLD");
add("network-operations-zero", networkOperations === 0);
add("operational-evidence-preserved", JSON.stringify(result.operationalEvidence) === JSON.stringify(operationalEvidence));

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  gate: "quality:stage-9-canonical-provider-evaluation-aggregation",
  passed: failed.length === 0,
  passed_checks: checks.length - failed.length,
  total_checks: checks.length,
  network_operations: networkOperations,
  result,
  failed,
}, null, 2));
if (failed.length > 0) process.exit(1);
