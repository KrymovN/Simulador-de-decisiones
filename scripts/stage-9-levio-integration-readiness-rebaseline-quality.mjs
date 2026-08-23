import { createHash } from "node:crypto";
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
const live = join(root, "docs", "qa", "stage-9", "live-evidence");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const load = (name) => {
  const buffer = readFileSync(join(live, name));
  return { buffer, value: JSON.parse(buffer.toString("utf8")) };
};
const sourceSha = (path) => sha(readFileSync(join(root, path)));

const fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
const taxonomy = require(join(
  root, "lib", "ai-quality", "canonical-provider-evaluation-taxonomy.ts",
));
const campaignEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-campaign-evidence.ts",
));
const aggregation = require(join(
  root, "lib", "ai-quality", "canonical-provider-evaluation-aggregation.ts",
));
const human = require(join(
  root, "lib", "ai-quality", "canonical-provider-human-review-evidence.ts",
));
const readiness = require(join(
  root, "lib", "ai-quality", "canonical-levio-integration-readiness.ts",
));

const replacement = load("STAGE_9_TERRA_POSITION_2_REPLACEMENT_EVIDENCE.v2.json");
const position3 = load("STAGE_9_TERRA_POSITION_3_EVIDENCE.v2.json");
const position4 = load("STAGE_9_TERRA_POSITION_4_EVIDENCE.v2.json");
const position4Blind = load("STAGE_9_TERRA_POSITION_4_BLIND_REVIEW_PACKET.v1.json");
const migration = load("STAGE_9_TERRA_ACCEPTED_PROJECTION_MIGRATION_EVIDENCE.v1.json");
const historicalFailure = load(
  "STAGE_9_TERRA_POSITION_2_PROVIDER_CONTRACT_FAILURE_EVIDENCE.v1.json",
);
const position1Human = load("STAGE_9_TERRA_POSITION_1_HUMAN_REVIEW_EVIDENCE.v1.json");
const position2Human = load("STAGE_9_TERRA_POSITION_2_HUMAN_REVIEW_EVIDENCE.v2.json");
const position3Human = load("STAGE_9_TERRA_POSITION_3_HUMAN_REVIEW_EVIDENCE.v2.json");
const cases = fixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const byId = new Map(cases.map((item) => [item.case_id, item]));
const categories = taxonomy.CANONICAL_PROVIDER_EVALUATION_CATEGORIES;

function comparableFromExecution(record) {
  const source = byId.get(record.caseId);
  const expected = taxonomy.canonicalOracleConceptsByCategory(source);
  return {
    caseId: record.caseId,
    locale: record.locale,
    semanticClusterId: record.semanticClusterId,
    executionHash: record.executionHash,
    matcher: {
      passed: record.automatedEvidence.matcherPassed,
      categories: Object.fromEntries(categories.map((category) => [category, {
        ...structuredClone(record.automatedEvidence.matcher[category]),
        expected: [...expected[category]].sort(),
      }])),
    },
    deterministicGates: {
      provider_result_contract:
        record.automatedEvidence.hardGates.provider_result_contract,
      candidate_contract_and_safety:
        record.automatedEvidence.hardGates.candidate_contract_and_safety,
      oracle_isolation: record.automatedEvidence.hardGates.oracle_isolation,
      approved_cost_budget: record.automatedEvidence.hardGates.approved_cost_budget,
    },
    normalizedCostRecorded: true,
  };
}

const position1Missing = {
  scenario: ["do_not_invent_facts", "include_no_action_or_information_first_path"],
  risk: ["preserve_likelihood_uncertainty"],
  recommendation: ["conditional_recommendation_allowed"],
  failure: ["fail_closed"],
  traceability: ["preserve_case_id"],
  rubric: ["safety_privacy_equivalence"],
};
const position1Unexpected = {
  risk: ["deadline_pressure", "opportunity_cost"],
  privacy: ["no_identifiers"],
};

function position1Comparable() {
  const source = byId.get("S9-CORE-001-ES");
  const oracle = taxonomy.canonicalOracleConceptsByCategory(source);
  const matcherCategories = Object.fromEntries(categories.map((category) => {
    const expected = [...oracle[category]].sort();
    const missing = [...(position1Missing[category] ?? [])].sort();
    const unexpected = [...(position1Unexpected[category] ?? [])].sort();
    const actual = [
      ...expected.filter((item) => !missing.includes(item)),
      ...unexpected,
    ].sort();
    return [category, {
      passed: category === "v2_status"
        ? missing.length === 0 && unexpected.length === 0 && actual.length === 1
        : missing.length === 0 && unexpected.length === 0,
      expected,
      actual,
      missing,
      unexpected,
    }];
  }));
  return {
    caseId: source.case_id,
    locale: source.language,
    semanticClusterId: source.provenance.semantic_cluster_id,
    executionHash:
      "4bcc5d6371415286e7a2cba707d24529bf7d2ae9f562ae01d418e7bb0e2336b6",
    matcher: { passed: false, categories: matcherCategories },
    deterministicGates: {
      provider_result_contract: "PASS",
      candidate_contract_and_safety: "PASS",
      oracle_isolation: "PASS",
      approved_cost_budget: "PASS",
    },
    normalizedCostRecorded: true,
  };
}

const position1Review = human.canonicalProviderCampaignReviewEvidenceFromHumanArtifact(
  position1Human.value,
);
const position2Review = human.canonicalProviderCampaignReviewEvidenceFromHumanArtifactV2(
  position2Human.value,
);
const position3Review = human.canonicalProviderCampaignReviewEvidenceFromHumanArtifactV2(
  position3Human.value,
);
const reviewEvidence = {
  ...position1Review,
  humanDimensionReviews: [
    ...position1Review.humanDimensionReviews,
    ...position2Review.humanDimensionReviews,
    ...position3Review.humanDimensionReviews,
  ],
  providerPrivacyReviews: [
    ...position1Review.providerPrivacyReviews,
    ...position2Review.providerPrivacyReviews,
    ...position3Review.providerPrivacyReviews,
  ],
};
const levioGuarantees = Object.fromEntries(
  aggregation.CANONICAL_LEVIO_GUARANTEE_IDS.map((id) => [id, "PASS"]),
);
levioGuarantees.minimum_necessary_prompt_context = "LEVIO_IMPLEMENTATION_GAP";
levioGuarantees.controlled_failure_product_presentation = "LEVIO_IMPLEMENTATION_GAP";
const failureInput = [{
  kind: "TERMINAL_PROVIDER_FAILURE",
  artifact: historicalFailure.value,
  expectedLinkage: {
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
  },
}];
const comparables = [
  position1Comparable(),
  comparableFromExecution(replacement.value.executions[0]),
  comparableFromExecution(position3.value.executions[0]),
  comparableFromExecution(position4.value.executions[0]),
];
const historicalAggregation = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  comparables,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuarantees,
  reviewEvidence,
  failureInput,
  { kind: "CAMPAIGN_SEMANTICS_MIGRATION", artifact: migration.value },
);
const position4ReviewCount =
  position4.value.reviewRecords.humanDimensionReviews.length +
  position4.value.reviewRecords.providerPrivacyReviews.length;
const position4HistoricalStatus = position4ReviewCount === 0
  ? "REVIEW_REQUIRED" : "FAIL";
const projection = readiness.projectCanonicalLevioIntegrationReadiness(
  historicalAggregation,
  position4HistoricalStatus,
);

const immutableEvidenceHashes = {
  "STAGE_9_TERRA_POSITION_1_HUMAN_REVIEW_EVIDENCE.v1.json":
    "0306e7bca7813fea79cfb1292442a74b06159c3d68b988d30a365e2d6436a150",
  "STAGE_9_TERRA_POSITION_2_PROVIDER_CONTRACT_FAILURE_EVIDENCE.v1.json":
    "7032e4ca290e8f364145699d60c197f83c5b32cd937d2ebbe69a0a36d2053d5e",
  "STAGE_9_TERRA_POSITION_2_REPLACEMENT_BLIND_REVIEW_PACKET.v1.json":
    "54b745b515e96ade85f6c8d448dd05078fef54e4c3aaac82c82420cae5042d5e",
  "STAGE_9_TERRA_POSITION_2_REPLACEMENT_EVIDENCE.v2.json":
    "57b1adaeb23e4fc7f4f5a68856a90846a42e9692301c634bb2f96b864d62ddfa",
  "STAGE_9_TERRA_POSITION_2_HUMAN_REVIEW_EVIDENCE.v2.json":
    "696f1d2dfe498b60563851ecd43fe64a3b3b2deef196bdfd7849dbf3e8911926",
  "STAGE_9_TERRA_POSITION_3_BLIND_REVIEW_PACKET.v1.json":
    "38d8caee2e1d452ce8a0c9d6680404ded6aa85519131b5a76d2d4cc53ab67061",
  "STAGE_9_TERRA_POSITION_3_EVIDENCE.v2.json":
    "4ced64a0a5183b75ed71d317c5ec375587da4b6c7e8fcf63d18883cba5148534",
  "STAGE_9_TERRA_POSITION_3_HUMAN_REVIEW_EVIDENCE.v2.json":
    "f7170c5e1c578609178056671d0d29250a9cf7cf531c532405235b0a8c729a60",
  "STAGE_9_TERRA_POSITION_3_HUMAN_REVIEW_PRESENTATION.v1.json":
    "c05a5d148b9873c6405076627a8aaed66832596e63cdf635495b7e523cd3b048",
  "STAGE_9_TERRA_POSITION_4_BLIND_REVIEW_PACKET.v1.json":
    "fedbd248ec73da92c6f92fbb304410a4a5d8b6c686db60f70e2bf3de7555b33c",
  "STAGE_9_TERRA_POSITION_4_EVIDENCE.v2.json":
    "25fd65e6252958fa39a072c392a00c496120e4e1d65b28ca13ebc9b2925c7308",
  "STAGE_9_TERRA_ACCEPTED_PROJECTION_MIGRATION_EVIDENCE.v1.json":
    "f2f5085fdf8b3b49602409bb145d4c155725df2703c7bd2855d4249ab5365f19",
};
const immutableSourceHashes = {
  "lib/ai-quality/canonical-provider-evaluation-aggregation.ts":
    "8b4c26586dfcc74232dec3c00727352fff669a227a567bb8662212df49ba9d8f",
  "lib/ai-quality/canonical-provider-evaluation-taxonomy.ts":
    "75d551c194326b51e05a706dae2cf88b002bb8d2b67b82e776e3a27c799004d1",
  "lib/ai-quality/canonical-provider-evaluation-result.ts":
    "fd7bc1befeb2813fe1e2e9700a0b31f674b1af2b867d03be8485a6a810af72b2",
  "lib/ai-quality/canonical-provider-evaluation-validation.ts":
    "ecd250264eec531e0e5d82a68f01ae5020d9acab99a1c063cd7ccd9cb410ee4e",
  "lib/ai-quality/canonical-provider-campaign-evidence.ts":
    "df02aa78248530a9a993780eb9daece0bc62da30809ba2e10777c610b10af82c",
  "lib/ai-quality/canonical-provider-review-policy.ts":
    "e639915a4f48f16816993c64e724c4583c93d994d7eac067bb196570711420cf",
};

const checks = [];
const add = (id, passed, detail = "") => checks.push({ id, passed, detail });
add("historical-position-1-4-evidence-unchanged",
  Object.entries(immutableEvidenceHashes).every(([name, expected]) =>
    sha(readFileSync(join(live, name))) === expected));
add("historical-frozen-sources-and-arithmetic-unchanged",
  aggregation.CANONICAL_PROVIDER_EVALUATION_AGGREGATION_VERSION ===
    "canonical-provider-evaluation-aggregation.3" &&
  Object.entries(immutableSourceHashes).every(([path, expected]) =>
    sourceSha(path) === expected));
add("historical-provider-qualification-remains-impossible",
  historicalAggregation.providerQualification.status ===
    "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD");
const impossibleMetric = historicalAggregation.providerQualification.metrics.find((item) =>
  item.metricId === "multilingual.critical_gap_behavior" && item.scope === "global");
add("provider-threshold-arithmetic-remains-exact",
  impossibleMetric?.threshold.numerator === 100 &&
  impossibleMetric.threshold.denominator === 100 &&
  impossibleMetric.applicabilityDenominator === 40 &&
  impossibleMetric.evaluatedApplicableDenominator === 1 &&
  impossibleMetric.successes === 0 && impossibleMetric.failuresAlreadyAccumulated === 1 &&
  impossibleMetric.remainingFailureBudget === -1 &&
  impossibleMetric.maximumAchievableFinalSuccesses === 39 &&
  impossibleMetric.status === "QUALIFICATION_IMPOSSIBLE");
add("provider-impossibility-retained-as-nonblocking-diagnostic",
  projection.providerEvaluation.historicalQualification ===
    "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" &&
  projection.providerEvaluation.retainedAsDiagnostic === true &&
  projection.providerEvaluation.productBlocking === false);
const allLevioPassAggregation = structuredClone(historicalAggregation);
allLevioPassAggregation.levioProductGuarantee.status = "PASS_SO_FAR";
for (const guarantee of allLevioPassAggregation.levioProductGuarantee.guarantees) {
  guarantee.status = "PASS";
}
const providerImpossibleOnly = readiness.projectCanonicalLevioIntegrationReadiness(
  allLevioPassAggregation,
  "REVIEW_REQUIRED",
);
add("provider-result-alone-does-not-block-levio-readiness",
  providerImpossibleOnly.providerEvaluation.historicalQualification ===
    "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" &&
  providerImpossibleOnly.levioIntegrationReadiness.status === "STAGE9_QUALIFIED" &&
  providerImpossibleOnly.levioIntegrationReadiness.ready === true);
add("position4-review-required-remains-historical",
  position4ReviewCount === 0 &&
  projection.position4HumanReview.historicalStatus === "REVIEW_REQUIRED" &&
  projection.position4HumanReview.retainedAsHistoricalEvidence === true);
add("position4-review-does-not-block-levio-remediation",
  projection.position4HumanReview.prerequisiteForCurrentLevioRemediation === false &&
  projection.workAuthorization.levioOwnedRemediation === "AUTHORIZED");
add("position5-and-later-provider-execution-stopped",
  projection.providerEvaluation.disposition ===
    "STOPPED_BY_OWNER_REBASELINE_EVIDENCE_RETAINED" &&
  projection.providerEvaluation.furtherProviderPositionsAuthorized === false &&
  projection.workAuthorization.nextProviderPosition ===
    "NOT_AUTHORIZED_OWNER_REBASELINE");
const blockerIds = projection.levioIntegrationReadiness.blockers.map(
  (item) => item.guaranteeId,
).sort();
add("exact-levio-implementation-gaps-remain-blocking",
  projection.levioIntegrationReadiness.status === "STAGE9_INCOMPLETE" &&
  projection.levioIntegrationReadiness.ready === false &&
  JSON.stringify(blockerIds) === JSON.stringify([
    "controlled_failure_product_presentation",
    "minimum_necessary_prompt_context",
  ]) && projection.levioIntegrationReadiness.blockers.every((item) =>
    item.status === "LEVIO_IMPLEMENTATION_GAP"));
const gateById = new Map(readiness.CANONICAL_STAGE9_GATE_DISPOSITIONS.map(
  (item) => [item.gateId, item],
));
add("contract-safety-grounding-privacy-cost-boundaries-remain-blocking",
  [
    "provider_result_contract_validation",
    "candidate_contract_safety_validation",
    "candidate_grounding_validation",
    "oracle_isolation",
    "cost_token_runtime_limits",
  ].every((id) => gateById.get(id)?.category === "LEVIO_INTEGRATION_GATE" &&
    gateById.get(id)?.productBlocking === true) &&
  position4.value.executions[0].automatedEvidence.resultContract === "PASS" &&
  position4.value.executions[0].automatedEvidence.candidateSafety === "PASS" &&
  position4.value.executions[0].automatedEvidence.candidateGrounding === "PASS" &&
  position4.value.executions[0].automatedEvidence.hardGates.oracle_isolation === "PASS" &&
  position4.value.executions[0].automatedEvidence.hardGates.approved_cost_budget === "PASS");
add("provider-quality-gates-are-diagnostic",
  [
    "hidden_matcher",
    "multilingual_semantic_metrics",
    "human_review_provider_quality_scores",
    "provider_privacy_review",
  ].every((id) => gateById.get(id)?.category === "PROVIDER_QUALITY_DIAGNOSTIC" &&
    gateById.get(id)?.productBlocking === false));
add("position4-campaign-and-blind-packet-remain-valid",
  campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
    position4.value,
    cases,
  ).valid && JSON.stringify(position4Blind.value) === JSON.stringify(
    campaignEvidence.buildCanonicalProviderBlindReviewPacket(position4.value.executions[0]),
  ));
const decision = readFileSync(join(
  root,
  "docs/qa/stage-9/STAGE_9_LEVIO_INTEGRATION_READINESS_REBASELINE_DECISION.v1.md",
), "utf8");
add("owner-decision-and-terminal-question-exact",
  projection.decisionId === "stage-9-levio-integration-readiness-rebaseline.1" &&
  projection.terminalQuestion ===
    "Is Levio integration-ready with the selected real provider under the frozen product architecture and safety/privacy/cost boundaries?" &&
  projection.selectedProvider.provider === "openai" &&
  projection.selectedProvider.model === "gpt-5.6-terra" &&
  decision.includes("STOPPED_BY_OWNER_REBASELINE_EVIDENCE_RETAINED") &&
  decision.includes("Position 4 retains its historical `REVIEW_REQUIRED`"));

let providerOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  providerOperations += 1;
  throw new Error("Network forbidden in Stage 9 rebaseline quality gate.");
};
globalThis.fetch = originalFetch;
add("no-provider-api-or-network-operations", providerOperations === 0);

const failed = checks.filter((check) => !check.passed);
console.log(JSON.stringify({
  gate: "stage-9-levio-integration-readiness-rebaseline",
  status: failed.length === 0 ? "PASS" : "FAIL",
  providerOperations,
  historicalAggregation: {
    providerQualification: historicalAggregation.providerQualification.status,
    overallStage9: historicalAggregation.overallStage9,
    impossibleMetric,
  },
  currentProjection: projection,
  immutableEvidenceCount: Object.keys(immutableEvidenceHashes).length,
  immutableFrozenSourceCount: Object.keys(immutableSourceHashes).length,
  checks,
}, null, 2));
if (failed.length > 0) process.exitCode = 1;
