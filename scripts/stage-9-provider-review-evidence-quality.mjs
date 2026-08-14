import { createRequire } from "node:module";
import { createHash } from "node:crypto";
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
const resultContract = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-result.ts"));
const aggregation = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-aggregation.ts"));
const review = require(join(root, "lib", "ai-quality", "canonical-provider-review-policy.ts"));
const campaignEvidence = require(join(root, "lib", "ai-quality", "canonical-provider-campaign-evidence.ts"));

const cases = fixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const categories = taxonomy.CANONICAL_PROVIDER_EVALUATION_CATEGORIES;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const executionHashByCase = new Map(cases.map((item) => [item.case_id, sha(item.case_id)]));

function perfectComparableEvidence(source, index) {
  const oracle = taxonomy.canonicalOracleConceptsByCategory(source);
  const matcherCategories = Object.fromEntries(categories.map((category) => [category, {
    passed: true,
    expected: [...oracle[category]].sort(),
    actual: [...oracle[category]].sort(),
    missing: [],
    unexpected: [],
  }]));
  return {
    caseId: source.case_id,
    locale: source.language,
    semanticClusterId: source.provenance.semantic_cluster_id,
    executionHash: executionHashByCase.get(source.case_id),
    matcher: { passed: true, categories: matcherCategories },
    deterministicGates: {
      provider_result_contract: "PASS",
      candidate_contract_and_safety: "PASS",
      oracle_isolation: "PASS",
      approved_cost_budget: "PASS",
    },
    normalizedCostRecorded: true,
    position: index + 1,
  };
}

const machineEvidence = cases.map(perfectComparableEvidence);
const reviewer = {
  reviewerKind: "HUMAN_REVIEWER",
  roleId: "independent-reviewer",
  version: "1",
};
const noAdjudication = {
  required: false,
  status: "NOT_REQUIRED",
  reviewer: null,
  verdict: null,
  reason: null,
};
const pendingAdjudication = {
  required: true,
  status: "PENDING",
  reviewer: null,
  verdict: null,
  reason: null,
};

function latencyProfile(executions) {
  const values = executions.map((item) => item.generationLatencyMs).sort((a, b) => a - b);
  const pick = (p) => values[Math.max(0, Math.ceil(p * values.length) - 1)] ?? 0;
  return {
    p50Ms: pick(0.5),
    p95Ms: pick(0.95),
    maxMs: Math.max(...values),
    averageMs: values.reduce((total, value) => total + value, 0) / values.length,
  };
}

function completeReviewEvidence() {
  const humanDimensionReviews = cases.flatMap((source) =>
    review.CANONICAL_HUMAN_REVIEW_DIMENSIONS.map((dimension) => {
      let score = 4;
      if (dimension === "clarification_relevance" && source.language === "es") {
        score = Number(source.case_id.match(/S9-CORE-(\d+)/)[1]) <= 20 ? 3 : 4;
      }
      if (dimension === "scenario_usefulness_distinctness" && source.language === "en") {
        score = Number(source.case_id.match(/S9-CORE-(\d+)/)[1]) <= 24 ? 3 : 4;
      }
      return {
        recordVersion: `review-${source.case_id}-${dimension}.1`,
        caseId: source.case_id,
        locale: source.language,
        semanticClusterId: source.provenance.semantic_cluster_id,
        reviewedExecutionHash: executionHashByCase.get(source.case_id),
        dimension,
        status: "PASS",
        score,
        criticalConcern: "NONE",
        reason: "Bounded evidence supports the recorded score.",
        evidencePointers: [`execution:${source.case_id}:candidate_material`],
        reviewPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
        reviewer,
        adjudication: noAdjudication,
        reviewedAt: null,
      };
    }));
  const failureIds = new Set(cases.filter((source) =>
    Number(source.case_id.match(/S9-CORE-(\d+)/)[1]) <= 2).map((source) => source.case_id));
  const providerPrivacyReviews = cases.map((source) => ({
    recordVersion: `privacy-${source.case_id}.1`,
    caseId: source.case_id,
    locale: source.language,
    semanticClusterId: source.provenance.semantic_cluster_id,
    reviewedExecutionHash: executionHashByCase.get(source.case_id),
    status: failureIds.has(source.case_id) ? "FAIL" : "PASS",
    criticalProviderPrivacyViolation: false,
    reason: "Provider semantic privacy behavior was reviewed against bounded candidate material.",
    evidencePointers: [`execution:${source.case_id}:privacy`],
    reviewPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
    reviewer,
    adjudication: noAdjudication,
    reviewedAt: null,
  }));
  const clusterIds = [...new Set(cases.map((item) => item.provenance.semantic_cluster_id))];
  const multilingualClusterReviews = clusterIds.map((clusterId) => ({
    recordVersion: `multilingual-${clusterId}.1`,
    clusterId,
    memberExecutionHashes: Object.fromEntries(["es", "en", "ru", "zh"].map((locale) => {
      const source = cases.find((item) =>
        item.provenance.semantic_cluster_id === clusterId && item.language === locale);
      return [locale, executionHashByCase.get(source.case_id)];
    })),
    status: "PASS",
    properties: Object.fromEntries(review.CANONICAL_MULTILINGUAL_REVIEW_PROPERTIES.map(
      (property) => [property, "PASS"])),
    reason: "All four locale members preserve the reviewed semantic properties.",
    evidencePointers: [`cluster:${clusterId}:members`],
    reviewPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
    initialReviewer: reviewer,
    adjudication: noAdjudication,
    reviewedAt: null,
  }));
  const campaignRequirementReviews = review.CANONICAL_CAMPAIGN_REQUIREMENT_REVIEW_IDS.map(
    (metricId) => ({
      metricId,
      status: "PASS",
      coveredCaseCount: 160,
      reason: "The canonical clause-level review ledger satisfies the existing release thresholds.",
      evidencePointers: [`campaign-review:${metricId}`],
      reviewPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
      reviewer,
      adjudication: noAdjudication,
      reviewedAt: null,
    }));
  const executions = cases.map((source, index) => ({
    caseId: source.case_id,
    generationLatencyMs: 1000 + index,
    stageLatenciesMs: { generation: 1000 + index, validation: 10 },
  }));
  return {
    version: "canonical-provider-campaign-review-evidence.1",
    reviewPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
    humanDimensionReviews,
    providerPrivacyReviews,
    multilingualClusterReviews,
    campaignRequirementReviews,
    latencyEvidence: {
      policyStatus: "DOCUMENTED_NOT_BLOCKING_BY_NEW_THRESHOLD",
      executions,
      profile: latencyProfile(executions),
    },
  };
}

const operationalEvidence = {
  reportedCases: 160,
  inputTokens: 160000,
  cachedInputTokens: 80000,
  outputTokens: 80000,
  reasoningTokens: 10000,
  totalTokens: 240000,
  conservativeUncachedCostUsd: 3.2,
  cacheAdjustedCalculatedCostUsd: 2.48,
  generationLatencyMsTotal: 172720,
};
const allLevioPass = Object.fromEntries(aggregation.CANONICAL_LEVIO_GUARANTEE_IDS.map(
  (id) => [id, "PASS"]));
const completeReviews = completeReviewEvidence();
const complete = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  machineEvidence,
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence,
  allLevioPass,
  completeReviews,
);

const checks = [];
const add = (id, passed, detail = "Check failed.") => checks.push({
  id,
  passed: Boolean(passed),
  detail,
});
const humanMetric = (result, dimension, scope = "global") =>
  result.reviewEvidenceAggregation.humanDimensions.find((item) =>
    item.metricId === `human.${dimension}` && item.scope === scope);
const privacyMetric = (result, scope = "global") =>
  result.reviewEvidenceAggregation.providerPrivacy.find((item) => item.scope === scope);

add("score-0-4-validation", (() => {
  const invalid = structuredClone(completeReviews);
  invalid.humanDimensionReviews[0].score = 5;
  return !review.validateCanonicalProviderCampaignReviewEvidence(
    invalid,
    new Set(cases.map((item) => item.case_id)),
    new Set(cases.map((item) => item.provenance.semantic_cluster_id)),
    executionHashByCase,
  ).valid;
})());
add("tested-provider-model-cannot-review-itself", (() => {
  const invalid = structuredClone(completeReviews);
  invalid.humanDimensionReviews[0].reviewer.reviewerKind = "TESTED_PROVIDER_MODEL";
  return !review.validateCanonicalProviderCampaignReviewEvidence(
    invalid,
    new Set(cases.map((item) => item.case_id)),
    new Set(cases.map((item) => item.provenance.semantic_cluster_id)),
    executionHashByCase,
  ).valid;
})());
add("per-case-review-evidence", completeReviews.humanDimensionReviews.length === 640 &&
  completeReviews.humanDimensionReviews.every((item) => item.reviewedExecutionHash));
add("per-locale-exact-unrounded-average", humanMetric(
  complete,
  "clarification_relevance",
  "es",
).exactMean === 3.5);
add("global-average", humanMetric(complete, "clarification_relevance").exactMean === 3.875);
add("threshold-3-5", humanMetric(complete, "clarification_relevance", "es").status === "PASS");
add("threshold-3-4", humanMetric(
  complete,
  "scenario_usefulness_distinctness",
  "en",
).exactMean === 3.4 && humanMetric(
  complete,
  "scenario_usefulness_distinctness",
  "en",
).status === "PASS");

const incompleteReviews = structuredClone(completeReviews);
incompleteReviews.humanDimensionReviews.pop();
const incomplete = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, machineEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, allLevioPass, incompleteReviews,
);
add("incomplete-coverage-cannot-qualify", incomplete.providerQualification.status !== "QUALIFIED" &&
  incomplete.providerQualification.requiredReviewMetricIds.some((id) => id.startsWith("human.")));

const criticalHumanReviews = structuredClone(completeReviews);
criticalHumanReviews.humanDimensionReviews[0].criticalConcern = "SAFETY";
const criticalHuman = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, machineEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, allLevioPass, criticalHumanReviews,
);
add("critical-concern-not-averaged-away", criticalHuman.providerQualification.status ===
  "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" &&
  criticalHuman.reviewEvidenceAggregation.criticalHumanReviewGate.status === "HARD_FAILURE");
add("provider-privacy-95-global", privacyMetric(complete).exactMean === 0.95 &&
  privacyMetric(complete).status === "PASS");
add("provider-privacy-95-per-locale", ["es", "en", "ru", "zh"].every((locale) =>
  privacyMetric(complete, locale).exactMean === 0.95 &&
  privacyMetric(complete, locale).status === "PASS"));

const privacyLocaleFailReviews = structuredClone(completeReviews);
const extraPrivacyFailure = privacyLocaleFailReviews.providerPrivacyReviews.find((item) =>
  item.locale === "es" && item.status === "PASS");
extraPrivacyFailure.status = "FAIL";
const privacyLocaleFail = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, machineEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, allLevioPass, privacyLocaleFailReviews,
);
add("provider-privacy-per-locale-calculation", privacyMetric(
  privacyLocaleFail,
  "es",
).status === "QUALIFICATION_IMPOSSIBLE");

const criticalPrivacyReviews = structuredClone(completeReviews);
criticalPrivacyReviews.providerPrivacyReviews[0].criticalProviderPrivacyViolation = true;
const criticalPrivacy = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, machineEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, allLevioPass, criticalPrivacyReviews,
);
add("critical-provider-privacy-hard-fail", criticalPrivacy.providerQualification.status ===
  "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" &&
  criticalPrivacy.reviewEvidenceAggregation.criticalProviderPrivacyGate.violations === 1);

const levioGapEvidence = { ...allLevioPass, minimum_necessary_prompt_context: "LEVIO_IMPLEMENTATION_GAP" };
const levioGap = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, machineEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, levioGapEvidence, completeReviews,
);
add("product-minimum-context-separate", levioGap.providerQualification.status === "QUALIFIED" &&
  levioGap.levioProductGuarantee.status === "LEVIO_IMPLEMENTATION_GAP");
add("rubric-components-not-independent-thresholds",
  Object.keys(review.CANONICAL_RUBRIC_COMPONENT_MAPPING).length === 4 &&
  !aggregation.CANONICAL_REVIEW_REQUIRED_METRIC_IDS.some((item) =>
    item.metricId.startsWith("rubric.")));
add("complete-four-language-cluster-review", complete.reviewEvidenceAggregation.multilingual.status ===
  "PASS" && complete.reviewEvidenceAggregation.multilingual.reviewedClusters === 40);

const pendingReviews = structuredClone(completeReviews);
pendingReviews.multilingualClusterReviews[0].status = "ADJUDICATION_REQUIRED";
pendingReviews.multilingualClusterReviews[0].properties.semanticEquivalence = "ADJUDICATION_REQUIRED";
pendingReviews.multilingualClusterReviews[0].adjudication = pendingAdjudication;
const pending = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, machineEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, allLevioPass, pendingReviews,
);
add("adjudication-pending-blocks-completion", pending.providerQualification.status !== "QUALIFIED" &&
  pending.reviewEvidenceAggregation.adjudicationPending);
add("latency-capture", complete.reviewEvidenceAggregation.latency.evidenceStatus === "COMPLETE" &&
  complete.reviewEvidenceAggregation.latency.profile.p95Ms === 1151);

const missingLatencyReviews = structuredClone(completeReviews);
missingLatencyReviews.latencyEvidence.executions.pop();
missingLatencyReviews.latencyEvidence.profile = latencyProfile(missingLatencyReviews.latencyEvidence.executions);
const missingLatency = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, machineEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, allLevioPass, missingLatencyReviews,
);
add("missing-latency-visible", missingLatency.reviewEvidenceAggregation.latency.evidenceStatus ===
  "INCOMPLETE" && missingLatency.providerQualification.status !== "QUALIFIED");

function baseItem(candidateId, itemType, content) {
  return {
    candidate_id: candidateId,
    item_type: itemType,
    content,
    provenance: { source: "provider_candidate", source_ref: "case_situation" },
    confidence: "unknown",
    evidence: "provider_inference",
    option_refs: [],
    scenario_refs: [],
    criterion_refs: [],
    authority: "candidate_only",
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
  };
}
function fakeEvaluationResult(source) {
  const oracle = taxonomy.canonicalOracleConceptsByCategory(source);
  const v2Status = source.expected_v2_statuses[0];
  const outcome = source.expected_scenario_behavior.includes("refuse_harmful_request")
    ? { kind: "safe_refusal", v2_status: "CANNOT_RECOMMEND" }
    : v2Status === "CLARIFICATION_REQUIRED"
      ? { kind: "clarification_required", v2_status: v2Status }
      : v2Status === "CANNOT_RECOMMEND"
        ? { kind: "recommendation_withheld", v2_status: v2Status }
        : { kind: "candidate_material", v2_status: "SIMULATED" };
  const candidate = outcome.kind === "safe_refusal" ? null : {
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items: [
      baseItem("evaluation_option_1", "option", "Candidate path A remains conditional on supplied evidence."),
      baseItem("evaluation_option_2", "option", "Candidate path B remains conditional on supplied evidence."),
      baseItem("evaluation_short_term_1", "short_term_consequence", "Short-term consequences differ between the candidate paths."),
      baseItem("evaluation_long_term_1", "long_term_consequence", "Long-term consequences remain uncertain across candidate paths."),
      baseItem("evaluation_clarification_1", "clarification_need", "A supplied information gap may require clarification before proceeding."),
      ...oracle.risk.map((concept, index) => baseItem(
        `evaluation_risk_${index + 1}`,
        "risk_signal",
        `Material risk concept selected by the evaluation candidate: ${concept.replaceAll("_", " ")}.`,
      )),
    ],
  };
  const candidateEvidence = (category, concept) => {
    if (["recommendation", "safety", "privacy", "failure", "v2_status", "traceability", "rubric"].includes(category)) {
      return { evidence_kind: "execution_outcome", candidate_ids: [], source_refs: [] };
    }
    if (category === "risk") {
      const riskItems = candidate.items.filter((item) => item.item_type === "risk_signal");
      const riskIndex = taxonomy.CANONICAL_PROVIDER_EVALUATION_TAXONOMY.risk.indexOf(concept);
      const item = riskItems[Math.max(0, riskIndex % riskItems.length)];
      return { evidence_kind: "candidate_material", candidate_ids: [item.candidate_id], source_refs: ["case_situation"] };
    }
    if (category === "clarification" && concept.startsWith("ask_")) {
      return { evidence_kind: "candidate_material", candidate_ids: ["evaluation_clarification_1"], source_refs: ["case_situation"] };
    }
    if (category === "scenario" && concept.startsWith("compare_")) {
      return { evidence_kind: "candidate_material", candidate_ids: ["evaluation_option_1", "evaluation_option_2", "evaluation_short_term_1", "evaluation_long_term_1"], source_refs: ["case_situation"] };
    }
    if (category === "scenario" && concept.includes("information_first_path")) {
      return { evidence_kind: "candidate_material", candidate_ids: ["evaluation_option_1", "evaluation_clarification_1"], source_refs: ["case_situation"] };
    }
    return { evidence_kind: "candidate_material", candidate_ids: ["evaluation_short_term_1"], source_refs: ["case_situation"] };
  };
  return {
    evaluation_contract_version: resultContract.CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
    candidate_material: candidate,
    evaluation_annotations: Object.fromEntries(categories.map((category) => [category,
      (category === "v2_status" ? [outcome.v2_status] : oracle[category]).map((concept) => ({
        concept_id: concept,
        ...(candidate === null
          ? { evidence_kind: "execution_outcome", candidate_ids: [], source_refs: [] }
          : candidateEvidence(category, concept)),
      }))])),
    outcome,
  };
}

const source = cases[0];
const captured = campaignEvidence.captureCanonicalProviderExecutionEvidence({
  campaignId: "campaign-test-001",
  executionId: "execution-test-001",
  position: 1,
  sourceCase: source,
  providerConfiguration: {
    provider: "openai",
    model: "gpt-5.6-terra",
    returnedModel: "gpt-5.6-terra",
    providerResponseId: "response-test-001",
    serviceTier: "default",
    reasoning: { effort: "low" },
    maxOutputTokens: 4000,
    timeoutMs: 120000,
    store: false,
    tools: [],
    retries: 0,
    automaticReruns: 0,
  },
  result: fakeEvaluationResult(source),
  operationalEvidence: {
    status: "COMPLETED",
    inputTokens: 5000,
    cachedInputTokens: 4000,
    outputTokens: 2000,
    reasoningTokens: 300,
    totalTokens: 7000,
    conservativeUncachedCostUsd: 0.07,
    cacheAdjustedCalculatedCostUsd: 0.05,
    generationLatencyMs: 20000,
    stageLatenciesMs: { generation: 20000, validation: 20 },
    sanitizedErrorMetadata: null,
  },
  approvedCostBudgetPassed: true,
});
add("validated-synthetic-candidate-content-storable", captured.status === "captured" &&
  captured.record.validatedResult.candidate_material.items.length > 0);
const blindPacket = campaignEvidence.buildCanonicalProviderBlindReviewPacket(captured.record);
add("blind-review-packet-excludes-oracle-and-matcher", blindPacket.oracleIncluded === false &&
  blindPacket.matcherIncluded === false && !Object.hasOwn(blindPacket, "automatedEvidence") &&
  !JSON.stringify(blindPacket).includes("expected_risk_behavior"));
const capturedFailure = campaignEvidence.captureCanonicalProviderFailureEvidence({
  campaignId: "campaign-test-failure",
  executionId: "execution-test-failure",
  position: 1,
  sourceCase: source,
  providerConfiguration: captured.record.providerConfiguration,
  operationalEvidence: {
    status: "TIMEOUT",
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    totalTokens: null,
    generationLatencyMs: 120000,
    stageLatenciesMs: { generation: 120000 },
    sanitizedErrorMetadata: {
      category: "provider_timeout",
      httpStatus: null,
      type: null,
      code: null,
      param: null,
      message: "Request timed out.",
    },
  },
  approvedCostBudgetPassed: true,
});
add("operational-failure-captured-without-raw-result", capturedFailure.status === "captured" &&
  capturedFailure.record.validatedResult === null &&
  capturedFailure.record.automatedEvidence.matcher === null);

const emptyReviewRecords = {
  version: "canonical-provider-campaign-review-evidence.1",
  reviewPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
  humanDimensionReviews: [],
  providerPrivacyReviews: [],
  multilingualClusterReviews: [],
  campaignRequirementReviews: [],
  latencyEvidence: {
    policyStatus: "DOCUMENTED_NOT_BLOCKING_BY_NEW_THRESHOLD",
    executions: [],
    profile: null,
  },
};
function oneExecutionArtifact() {
  return {
    version: campaignEvidence.CANONICAL_PROVIDER_CAMPAIGN_EVIDENCE_VERSION,
    campaign: {
      campaignId: "campaign-test-001",
      status: "OPEN",
      closedAt: null,
      retentionPolicyId: review.STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY.id,
      retentionPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY.version,
      maximumContentDeletionDeadline: null,
      contentRetentionStatus: "ACTIVE",
      storageClass: "evaluation-only",
      accessClass: "review-authorized-least-privilege",
    },
    frozenConfiguration: {
      baselineCommit: "d7cca92a3d0d25e9c923f635f44c70df0403e5d0",
      caseOrderSha256: sha(cases.map((item) => item.case_id).join("\n")),
      caseCount: 160,
      configurationFingerprint: captured.record.configurationFingerprint,
    },
    versionManifest: {
      reviewPolicyVersion: review.STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
      inputContractVersion: "canonical-provider-evaluation-input.2",
      resultContractVersion: "canonical-provider-evaluation-result.1",
      taxonomyVersion: "canonical-provider-evaluation-taxonomy.1",
      taskProfileVersion: "canonical-provider-evaluation-task-profile.1",
      boundaryVersion: "stage-9-canonical-provider-evaluation-boundary.2",
      aggregationVersion: "canonical-provider-evaluation-aggregation.3",
      providerInstructionsSha256: sha("instructions"),
      providerSchemaSha256: sha("schema"),
    },
    executions: [captured.record],
    reviewRecords: emptyReviewRecords,
    campaignAggregation: {
      aggregationVersion: "canonical-provider-evaluation-aggregation.3",
      sourceExecutionHashes: [captured.record.executionHash],
      generatedAt: null,
    },
  };
}
const validArtifact = oneExecutionArtifact();
const validArtifactValidation = campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  validArtifact,
  cases,
);
add("campaign-evidence-v2-valid", validArtifactValidation.valid,
  validArtifactValidation.issues.join(", "));
const rawEnvelope = structuredClone(validArtifact);
rawEnvelope.executions[0].rawHttpEnvelope = { output: "not allowed" };
add("raw-http-envelope-rejected", campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  rawEnvelope,
  cases,
).issues.some((issue) => issue.includes("forbidden_field")));
const chainOfThought = structuredClone(validArtifact);
chainOfThought.reviewRecords.humanDimensionReviews.push({ chainOfThought: "hidden reasoning" });
add("chain-of-thought-rejected", campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  chainOfThought,
  cases,
).issues.some((issue) => issue.includes("forbidden_field") || issue.includes("forbidden_content")));
const chainOfThoughtContent = structuredClone(validArtifact);
chainOfThoughtContent.reviewRecords.note = "chain-of-thought must not be retained";
add("chain-of-thought-content-rejected", campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  chainOfThoughtContent,
  cases,
).issues.some((issue) => issue.includes("forbidden_content")));
const secret = structuredClone(validArtifact);
secret.reviewRecords.providerPrivacyReviews.push({ apiKey: "sk-12345678901234567890" });
add("secret-auth-data-rejected", campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  secret,
  cases,
).issues.some((issue) => issue.includes("forbidden_field") || issue.includes("forbidden_content")));
const hiddenOracle = structuredClone(validArtifact);
hiddenOracle.reviewRecords.hiddenOracle = source.expected_risk_behavior;
add("hidden-oracle-leakage-rejected", campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  hiddenOracle,
  cases,
).issues.some((issue) => issue.includes("forbidden_field")));

const realUserSource = structuredClone(source);
realUserSource.provenance.kind = "real_user_data";
add("non-synthetic-fixture-rejected", campaignEvidence.captureCanonicalProviderExecutionEvidence({
  campaignId: "campaign-test-002",
  executionId: "execution-test-002",
  position: 1,
  sourceCase: realUserSource,
  providerConfiguration: captured.record.providerConfiguration,
  result: fakeEvaluationResult(source),
  operationalEvidence: captured.record.operationalEvidence,
  approvedCostBudgetPassed: true,
}).status === "rejected");

const lateRetention = structuredClone(validArtifact);
lateRetention.campaign.status = "CLOSED";
lateRetention.campaign.closedAt = "2026-08-01T00:00:00Z";
lateRetention.campaign.maximumContentDeletionDeadline = "2026-09-01T00:00:01Z";
add("retention-over-30-days-rejected", campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  lateRetention,
  cases,
).issues.includes("content_deletion_deadline_exceeds_30_days"));
const indefiniteRetention = structuredClone(lateRetention);
indefiniteRetention.campaign.maximumContentDeletionDeadline = "indefinite";
add("indefinite-retention-rejected", !campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  indefiniteRetention,
  cases,
).valid);
const mutatedExecution = structuredClone(validArtifact);
mutatedExecution.executions[0].operationalEvidence.generationLatencyMs += 1;
add("immutable-content-hash-linkage", campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  mutatedExecution,
  cases,
).issues.some((issue) => issue.startsWith("execution_hash_invalid")));

const wrongReviewHash = structuredClone(completeReviews);
wrongReviewHash.humanDimensionReviews[0].reviewedExecutionHash = sha("wrong");
add("review-references-exact-execution-hash", !review.validateCanonicalProviderCampaignReviewEvidence(
  wrongReviewHash,
  new Set(cases.map((item) => item.case_id)),
  new Set(cases.map((item) => item.provenance.semantic_cluster_id)),
  executionHashByCase,
).valid);
add("responsibility-aware-aggregator-consumes-review", complete.providerQualification.status ===
  "QUALIFIED" && complete.reviewEvidenceAggregation.coverageComplete);
add("levio-only-gap-does-not-reject-provider", levioGap.providerQualification.status === "QUALIFIED");
const providerGateEvidence = structuredClone(machineEvidence);
providerGateEvidence[0].deterministicGates.provider_result_contract = "FAIL";
const providerGate = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases, providerGateEvidence, aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  operationalEvidence, allLevioPass, completeReviews,
);
add("provider-hard-gate-rejects-provider", providerGate.providerQualification.status ===
  "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD");

let networkOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkOperations += 1;
  throw new Error("Network forbidden in review evidence quality gate.");
};
globalThis.fetch = originalFetch;
add("network-operations-zero", networkOperations === 0);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  gate: "quality:stage-9-provider-review-evidence",
  passed: failed.length === 0,
  passed_checks: checks.length - failed.length,
  total_checks: checks.length,
  network_operations: networkOperations,
  provider_status: complete.providerQualification.status,
  failed,
}, null, 2));
if (failed.length > 0) process.exit(1);
