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
const failureEvidence = require(join(
  root,
  "lib",
  "ai-quality",
  "canonical-provider-campaign-failure-evidence.ts",
));
const campaignEvidence = require(join(
  root,
  "lib",
  "ai-quality",
  "canonical-provider-campaign-evidence.ts",
));

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
const levioGuaranteeEvidence = Object.fromEntries(
  aggregation.CANONICAL_LEVIO_GUARANTEE_IDS.map((guaranteeId) => [guaranteeId, "PASS"]),
);
levioGuaranteeEvidence.minimum_necessary_prompt_context = "LEVIO_IMPLEMENTATION_GAP";
levioGuaranteeEvidence.controlled_failure_product_presentation = "LEVIO_IMPLEMENTATION_GAP";
const result = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  evidence,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence,
  levioGuaranteeEvidence,
);
globalThis.fetch = originalFetch;

const checks = [];
const add = (id, passed, detail = "Check failed.") => checks.push({ id, passed: Boolean(passed), detail });
const metric = (id, scope = "global") => result.metrics.find((item) => item.metricId === id && item.scope === scope);
const multilingual = (id) => result.multilingual.find((item) => item.metricId === id);
function addExpectedMiss(targetEvidence, index, category, predicate = () => true) {
  const categoryMatch = targetEvidence[index].matcher.categories[category];
  const concept = categoryMatch.expected.find((item) =>
    !categoryMatch.missing.includes(item) && predicate(item)
  );
  if (!concept) throw new Error(`No available expected ${category} concept for negative test.`);
  categoryMatch.missing = [...categoryMatch.missing, concept].sort();
  categoryMatch.actual = categoryMatch.actual.filter((item) => item !== concept);
  categoryMatch.passed = false;
  targetEvidence[index].matcher.passed = false;
}

const scenario = metric("scenario.meaningfully_distinct_paths");
add("ceil-threshold", scenario.applicabilityDenominator === 156 && scenario.requiredFinalSuccesses === 149,
  `Expected ceil(.95 * 156) = 149, received ${scenario.requiredFinalSuccesses}.`);
const v2 = metric("outcome.expected_v2_status");
add("one-hundred-percent-threshold", v2.maximumAllowedFinalFailures === 0 && v2.status === "PASS_SO_FAR");
const risk = metric("risk.must_cover_material_recall");
add("recoverable-current-failure", risk.failuresAlreadyAccumulated === 8 && risk.status === "FAIL_SO_FAR_BUT_RECOVERABLE");
const privacyRu = metric("privacy.minimum_necessary_context", "ru");
add("privacy-observed-arithmetic-preserved", privacyRu.failuresAlreadyAccumulated === 1 && privacyRu.status === "QUALIFICATION_IMPOSSIBLE");
add("privacy-provider-product-split", privacyRu.providerQualificationStatus === "REVIEW_REQUIRED" && result.providerQualification.status !== "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" && result.levioProductGuarantee.status === "LEVIO_IMPLEMENTATION_GAP");
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
const hardFailure = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, hardFailureEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, levioGuaranteeEvidence,
);
add("levio-hard-gate-is-product-failure", hardFailure.providerQualification.status === result.providerQualification.status && hardFailure.levioProductGuarantee.status === "PRODUCT_GUARANTEE_FAILED" && hardFailure.hardGates.find((item) => item.gateId === "oracle_isolation").failures === 1);
add("perfect-remainder-counterfactual", risk.maximumAchievableFinalSuccesses === 468 && risk.maximumAchievableFinalRate === 468 / 476);
add("early-stop-error-budget", risk.maximumAllowedFinalFailures === 23 && risk.remainingFailureBudget === 15);
add("v2-alternative-case-semantics", v2.applicabilityDenominator === 160 && v2.evaluatedApplicableDenominator === 8 && v2.successes === 8);
add("oracle-leakage-zero", result.hardGates.find((item) => item.gateId === "oracle_isolation").failures === 0);
const corruptedEvidence = structuredClone(evidence);
corruptedEvidence[0].matcher.categories.risk.expected = ["not_the_frozen_oracle"];
add("corrupted-machine-evidence", aggregation.aggregateCanonicalProviderEvaluationCampaign(cases, corruptedEvidence).providerQualification.status === "SYSTEM_EVIDENCE_INCOMPLETE");
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
add("comparable-only-coverage-semantics-preserved",
  result.coverage.evaluatedComparableCases === 8 &&
  result.coverage.consumedProviderPositions === 8 &&
  result.coverage.terminalProviderFailures === 0 &&
  result.coverage.humanReviewedExecutions === 0);
add("frozen-structure", result.coverage.totalFrozenCases === 160 && result.coverage.locales === 4 && Object.values(result.coverage.casesPerLocale).every((count) => count === 40) && result.coverage.semanticClusters === 40);
add("frozen-taxonomy-denominators", JSON.stringify(result.frozenTaxonomyDenominators) === JSON.stringify({
  scenario: 480, risk: 476, clarification: 248, recommendation: 320,
  safety: 220, privacy: 240, failure: 240, v2_status: 160,
  traceability: 480, rubric: 640,
}));
add("multilingual-two-clusters", result.multilingual.every((item) => item.evaluatedApplicableDenominator === 2));
add("responsibility-inventory-approved-counts", JSON.stringify(Object.fromEntries(["PROVIDER", "LEVIO", "HYBRID"].map((responsibility) => [responsibility, aggregation.CANONICAL_RESPONSIBILITY_REQUIREMENT_INVENTORY.filter((item) => item.responsibility === responsibility).length]))) === JSON.stringify({ PROVIDER: 8, LEVIO: 15, HYBRID: 22 }));
add("sol-current-provider-status", result.providerQualification.status === "QUALIFICATION_PENDING_REQUIRED_REVIEW");
add("sol-current-product-status", result.levioProductGuarantee.status === "LEVIO_IMPLEMENTATION_GAP");
add("sol-current-overall-status", result.overallStage9.status === "STAGE9_INCOMPLETE" && result.overallStage9.blockers.includes("PROVIDER_QUALIFICATION_PENDING_REVIEW") && result.overallStage9.blockers.includes("LEVIO_IMPLEMENTATION_GAP"));
add("network-operations-zero", networkOperations === 0);
add("operational-evidence-preserved", JSON.stringify(result.operationalEvidence) === JSON.stringify(operationalEvidence));

const levioOnlyMissEvidence = structuredClone(evidence);
addExpectedMiss(levioOnlyMissEvidence, 0, "v2_status");
const levioOnlyMiss = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, levioOnlyMissEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, levioGuaranteeEvidence,
);
add("levio-only-miss-does-not-consume-provider-budget", levioOnlyMiss.metrics.find((item) => item.metricId === "outcome.expected_v2_status" && item.scope === "global").status === "QUALIFICATION_IMPOSSIBLE" && levioOnlyMiss.providerQualification.status === result.providerQualification.status);

const hybridProviderMissEvidence = structuredClone(evidence);
addExpectedMiss(
  hybridProviderMissEvidence,
  0,
  "traceability",
  (concept) => concept === "trace_facts_assumptions_and_gaps",
);
const hybridProviderMiss = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, hybridProviderMissEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, levioGuaranteeEvidence,
);
add("hybrid-provider-side-failure-affects-provider", hybridProviderMiss.providerQualification.status === "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD");
const localeProviderMissEvidence = structuredClone(evidence);
addExpectedMiss(localeProviderMissEvidence, 0, "scenario", (concept) => concept.startsWith("compare_"));
addExpectedMiss(localeProviderMissEvidence, 4, "scenario", (concept) => concept.startsWith("compare_"));
const localeProviderMiss = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, localeProviderMissEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, levioGuaranteeEvidence,
);
add("per-language-provider-threshold-independent", localeProviderMiss.providerQualification.metrics.find((item) => item.metricId === "scenario.meaningfully_distinct_paths" && item.scope === "es").providerQualificationStatus === "QUALIFICATION_IMPOSSIBLE" && localeProviderMiss.providerQualification.metrics.find((item) => item.metricId === "scenario.meaningfully_distinct_paths" && item.scope === "en").providerQualificationStatus !== "QUALIFICATION_IMPOSSIBLE");

const privacyFailureEvidence = { ...levioGuaranteeEvidence, final_output_privacy_boundary: "FAIL" };
const privacyProductFailure = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, evidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, privacyFailureEvidence,
);
add("hybrid-levio-failure-does-not-reject-provider", privacyProductFailure.levioProductGuarantee.status === "PRODUCT_GUARANTEE_FAILED" && privacyProductFailure.providerQualification.status === result.providerQualification.status);
add("deterministic-privacy-failure-visible", privacyProductFailure.levioProductGuarantee.guarantees.find((item) => item.guaranteeId === "final_output_privacy_boundary").status === "FAIL");

add("preserve-case-id-levio-owned", aggregation.CANONICAL_RESPONSIBILITY_REQUIREMENT_INVENTORY.some((item) => item.requirementId === "traceability.preserve_case_id" && item.responsibility === "LEVIO"));
add("fail-closed-product-owned", aggregation.CANONICAL_RESPONSIBILITY_REQUIREMENT_INVENTORY.some((item) => item.requirementId === "failure.fail_closed" && item.responsibility === "LEVIO"));
add("affected-taxonomy-concepts-attributed", aggregation.CANONICAL_TAXONOMY_CONCEPT_RESPONSIBILITY["privacy.data_minimization"] === "HYBRID" && aggregation.CANONICAL_TAXONOMY_CONCEPT_RESPONSIBILITY["traceability.preserve_case_id"] === "LEVIO" && aggregation.CANONICAL_TAXONOMY_CONCEPT_RESPONSIBILITY["failure.no_mock_as_real"] === "LEVIO" && aggregation.CANONICAL_TAXONOMY_CONCEPT_RESPONSIBILITY["risk.deadline_pressure"] === "PROVIDER");
const preserveCaseId = result.conceptResponsibilityDiagnostics.find((item) => item.conceptId === "traceability.preserve_case_id");
const dataMinimization = result.conceptResponsibilityDiagnostics.find((item) => item.conceptId === "privacy.data_minimization");
const likelihoodUncertainty = result.conceptResponsibilityDiagnostics.find((item) => item.conceptId === "risk.preserve_likelihood_uncertainty");
add("concept-level-provider-product-observability", preserveCaseId.providerQualifying === false && preserveCaseId.providerObservation.missing === 8 && preserveCaseId.levioGuarantee.find((item) => item.guaranteeId === "stable_identity_preservation").status === "PASS" && dataMinimization.providerObservation.missing === 2 && dataMinimization.levioGuarantee.find((item) => item.guaranteeId === "minimum_necessary_prompt_context").status === "LEVIO_IMPLEMENTATION_GAP" && likelihoodUncertainty.providerQualifying === true && likelihoodUncertainty.providerObservation.missing === 8);
add("whole-case-semantic-fail-diagnostic-only", result.exactMatcherDiagnostics.semanticFail === 8 && result.providerQualification.status !== "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD");
add("exact-matcher-preserved", result.exactMatcherDiagnostics.canonicalOracleMatched === 0 && result.exactMatcherDiagnostics.unexpectedConcepts === 35);

const strictRiskDefinition = [{
  ...aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS.find((item) => item.metricId === "risk.must_cover_material_recall"),
  metricId: "test.provider-risk-noncompensable",
  threshold: { numerator: 100, denominator: 100 },
}];
const strictRisk = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, evidence, strictRiskDefinition, operationalEvidence, levioGuaranteeEvidence,
);
add("genuine-provider-threshold-can-be-impossible", strictRisk.providerQualification.status === "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" && strictRisk.providerQualification.metrics.find((item) => item.scope === "global").failuresAlreadyAccumulated === 8);

const providerContractFailureEvidence = structuredClone(evidence);
providerContractFailureEvidence[0].deterministicGates.provider_result_contract = "FAIL";
const providerContractFailure = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, providerContractFailureEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, levioGuaranteeEvidence,
);
add("canonical-provider-contract-violation-rejects-provider", providerContractFailure.providerQualification.status === "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" && providerContractFailure.providerQualification.hardGates.find((item) => item.gateId === "provider_result_contract").failures === 1);

const persistedTerminalFailure = JSON.parse(readFileSync(join(
  root,
  "docs",
  "qa",
  "stage-9",
  "live-evidence",
  "STAGE_9_TERRA_POSITION_2_PROVIDER_CONTRACT_FAILURE_EVIDENCE.v1.json",
), "utf8"));
const terminalFailureLinkage = {
  campaignId: "stage9-terra-comparable-campaign-v1",
  attemptId: "stage9-terra-position-002-S9-CORE-001-EN",
  position: 2,
  caseId: "S9-CORE-001-EN",
  caseVersion: "1.0",
  caseSha256: "3ceee5f10db0ee4c75e42176ba256b7d6715d7a303a2347447a00419822f3c43",
  locale: "en",
  semanticClusterId: "S9-CLUSTER-001",
  baselineCommit: "fd651a4c9336643e45e749b629af12318f2a1c8a",
  configurationFingerprint:
    "ee8c00893a300a8534c597f285ce99ab57b139475c9c88abf5bc9d62efcfe142",
};
const terminalFailureInput = [{
  kind: "TERMINAL_PROVIDER_FAILURE",
  artifact: persistedTerminalFailure,
  expectedLinkage: terminalFailureLinkage,
}];
const comparableWithoutTerminalCase = evidence.filter((item) =>
  item.caseId !== terminalFailureLinkage.caseId);
const comparableOnlyControl = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  comparableWithoutTerminalCase,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuaranteeEvidence,
);
const mixedTerminalCampaign = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  comparableWithoutTerminalCase,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuaranteeEvidence,
  null,
  terminalFailureInput,
);
const mixedContractGate = mixedTerminalCampaign.providerQualification.hardGates.find(
  (item) => item.gateId === "provider_result_contract",
);
add("validated-terminal-contract-failure-enters-provider-hard-gate",
  failureEvidence.validateCanonicalProviderCampaignFailureEvidence(
    persistedTerminalFailure,
    terminalFailureLinkage,
  ).valid && mixedContractGate.evaluated === 8 && mixedContractGate.failures === 1 &&
  mixedContractGate.status === "QUALIFICATION_IMPOSSIBLE");
add("terminal-failure-consumed-versus-comparable-coverage",
  mixedTerminalCampaign.coverage.consumedProviderPositions === 8 &&
  mixedTerminalCampaign.coverage.evaluatedComparableCases === 7 &&
  mixedTerminalCampaign.coverage.terminalProviderFailures === 1);
add("terminal-failure-responsibility-is-provider",
  mixedTerminalCampaign.terminalProviderFailureEvidence.responsibility === "PROVIDER" &&
  mixedTerminalCampaign.terminalProviderFailureEvidence.hardGateId ===
    "provider_result_contract" &&
  JSON.stringify(mixedTerminalCampaign.terminalProviderFailureEvidence.caseIds) ===
    JSON.stringify(["S9-CORE-001-EN"]) &&
  JSON.stringify(mixedTerminalCampaign.terminalProviderFailureEvidence.artifactHashes) ===
    JSON.stringify([
      "ea0f53062d283a582f4d285a3d8d8e5e823ee8a5612e029958753a56e48d19b6",
    ]));
add("terminal-failure-does-not-create-fake-matcher",
  JSON.stringify(mixedTerminalCampaign.exactMatcherDiagnostics) ===
    JSON.stringify(comparableOnlyControl.exactMatcherDiagnostics) &&
  JSON.stringify(mixedTerminalCampaign.taxonomyDiagnostics) ===
    JSON.stringify(comparableOnlyControl.taxonomyDiagnostics));
add("terminal-failure-uses-existing-qualification-policy",
  mixedTerminalCampaign.providerQualification.status ===
    "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" &&
  mixedTerminalCampaign.overallStage9.status === "STAGE9_BLOCKED" &&
  mixedTerminalCampaign.overallStage9.blockers.includes(
    "PROVIDER_QUALIFICATION_IMPOSSIBLE",
  ));
const invalidTerminalFailure = structuredClone(persistedTerminalFailure);
invalidTerminalFailure.artifactHash = "0".repeat(64);
const rejectedTerminalCampaign = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  comparableWithoutTerminalCase,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuaranteeEvidence,
  null,
  [{
    kind: "TERMINAL_PROVIDER_FAILURE",
    artifact: invalidTerminalFailure,
    expectedLinkage: terminalFailureLinkage,
  }],
);
add("invalid-terminal-failure-rejected-before-qualification",
  rejectedTerminalCampaign.coverage.terminalProviderFailures === 0 &&
  rejectedTerminalCampaign.terminalProviderFailureEvidence.caseIds.length === 0 &&
  rejectedTerminalCampaign.hardGates.find(
    (item) => item.gateId === "provider_result_contract",
  ).failures === 0 &&
  rejectedTerminalCampaign.providerQualification.status === "SYSTEM_EVIDENCE_INCOMPLETE" &&
  rejectedTerminalCampaign.evidenceIssues.some((issue) =>
    issue.startsWith("terminal_failure_invalid:")));
const wrongLinkageTerminalCampaign = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  comparableWithoutTerminalCase,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuaranteeEvidence,
  null,
  [{
    kind: "TERMINAL_PROVIDER_FAILURE",
    artifact: persistedTerminalFailure,
    expectedLinkage: { ...terminalFailureLinkage, position: 3 },
  }],
);
add("terminal-failure-linkage-rejected-before-qualification",
  wrongLinkageTerminalCampaign.coverage.terminalProviderFailures === 0 &&
  wrongLinkageTerminalCampaign.hardGates.find(
    (item) => item.gateId === "provider_result_contract",
  ).failures === 0 && wrongLinkageTerminalCampaign.evidenceIssues.some((issue) =>
    issue.includes("failure_attempt_linkage_invalid")));
const invalidContractTerminalFailure = structuredClone(persistedTerminalFailure);
invalidContractTerminalFailure.execution.generationCount = 2;
const { artifactHash: ignoredArtifactHash, ...invalidContractWithoutHash } =
  invalidContractTerminalFailure;
invalidContractTerminalFailure.artifactHash = campaignEvidence.canonicalEvidenceSha256(
  invalidContractWithoutHash,
);
const invalidContractTerminalCampaign =
  aggregation.aggregateCanonicalProviderEvaluationCampaign(
    cases,
    comparableWithoutTerminalCase,
    aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
    null,
    levioGuaranteeEvidence,
    null,
    [{
      kind: "TERMINAL_PROVIDER_FAILURE",
      artifact: invalidContractTerminalFailure,
      expectedLinkage: terminalFailureLinkage,
    }],
  );
add("terminal-failure-contract-rejected-before-qualification",
  invalidContractTerminalCampaign.coverage.terminalProviderFailures === 0 &&
  invalidContractTerminalCampaign.hardGates.find(
    (item) => item.gateId === "provider_result_contract",
  ).failures === 0 && invalidContractTerminalCampaign.evidenceIssues.some((issue) =>
    issue.includes("failure_execution_state_invalid")));
add("oracle-leakage-remains-zero", result.hardGates.find((item) => item.gateId === "oracle_isolation").failures === 0 && result.levioProductGuarantee.guarantees.find((item) => item.guaranteeId === "oracle_isolation").status === "PASS");

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
