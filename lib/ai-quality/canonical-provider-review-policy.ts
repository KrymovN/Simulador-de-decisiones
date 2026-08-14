import "server-only";

import type { CanonicalOfflineEvaluationCase } from
  "../ai-decision-material/fixtures";
import type { CanonicalProviderEvaluationResultV1 } from
  "./canonical-provider-evaluation-result";

export const STAGE_9_PROVIDER_REVIEW_POLICY_VERSION =
  "stage-9-provider-review-policy.1" as const;

export const STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY = {
  id: "stage-9-provider-review-evidence-retention",
  version: "1",
  maximumDaysAfterCampaignClosure: 30,
  storageClass: "evaluation-only",
  fixtureClassification: "synthetic_non_personal",
} as const;

export const CANONICAL_HUMAN_REVIEW_DIMENSIONS = [
  "clarification_relevance",
  "scenario_usefulness_distinctness",
  "risk_discipline",
  "recommendation_strategic_usefulness",
] as const;

export type CanonicalHumanReviewDimension =
  (typeof CANONICAL_HUMAN_REVIEW_DIMENSIONS)[number];

export const CANONICAL_PROVIDER_REVIEWABILITY_DIMENSIONS = [
  ...CANONICAL_HUMAN_REVIEW_DIMENSIONS,
  "provider_privacy_semantic_quality",
] as const;

export type CanonicalProviderReviewabilityDimension =
  (typeof CANONICAL_PROVIDER_REVIEWABILITY_DIMENSIONS)[number];

export type CanonicalProviderHumanReviewabilityInput = {
  executionHash: string;
  caseId: string;
  caseVersion: string;
  caseSha256: string;
  validatedResult: CanonicalProviderEvaluationResultV1;
  sourceCase: Pick<
    CanonicalOfflineEvaluationCase,
    "case_id" | "case_version" | "user_situation" | "user_intent"
  >;
  sourceCaseSha256: string;
};

export type CanonicalProviderHumanReviewabilityProjection = Record<
  CanonicalProviderReviewabilityDimension,
  { applicable: boolean; reviewable: boolean }
>;

const REVIEWABILITY_HASH = /^[a-f0-9]{64}$/;

/**
 * Projects whether retained provider evidence is sufficient for human review.
 * It does not score, judge, match, or qualify the provider result.
 */
export function projectCanonicalProviderHumanReviewability(
  input: CanonicalProviderHumanReviewabilityInput,
): CanonicalProviderHumanReviewabilityProjection {
  const sourceLinked = REVIEWABILITY_HASH.test(input.executionHash) &&
    REVIEWABILITY_HASH.test(input.caseSha256) &&
    input.caseSha256 === input.sourceCaseSha256 &&
    input.caseId === input.sourceCase.case_id &&
    input.caseVersion === input.sourceCase.case_version &&
    input.sourceCase.user_situation.trim().length > 0 &&
    input.sourceCase.user_intent.trim().length > 0;
  const items = input.validatedResult.candidate_material?.items ?? [];
  const candidateMaterialPresent = items.length > 0;
  const itemTypes = new Set(items.map((item) => item.item_type));
  const annotations = input.validatedResult.evaluation_annotations;
  const projection = (contentPresent: boolean) => ({
    applicable: true,
    reviewable: sourceLinked && contentPresent,
  });

  return {
    clarification_relevance: projection(candidateMaterialPresent),
    scenario_usefulness_distinctness: projection(
      itemTypes.has("option") &&
      (itemTypes.has("short_term_consequence") || itemTypes.has("long_term_consequence")) &&
      annotations.scenario.length > 0,
    ),
    risk_discipline: projection(
      itemTypes.has("risk_signal") && annotations.risk.length > 0,
    ),
    recommendation_strategic_usefulness: projection(
      candidateMaterialPresent && annotations.recommendation.length > 0,
    ),
    provider_privacy_semantic_quality: projection(candidateMaterialPresent),
  };
}

export const CANONICAL_HUMAN_REVIEW_THRESHOLDS = {
  clarification_relevance: { numerator: 35, denominator: 10 },
  scenario_usefulness_distinctness: { numerator: 34, denominator: 10 },
  risk_discipline: { numerator: 35, denominator: 10 },
  recommendation_strategic_usefulness: { numerator: 34, denominator: 10 },
} as const satisfies Record<CanonicalHumanReviewDimension, {
  numerator: number;
  denominator: number;
}>;

export const CANONICAL_RUBRIC_COMPONENT_MAPPING = {
  "rubric.semantic_fidelity": [
    "clarification_relevance",
    "scenario_usefulness_distinctness",
    "risk_discipline",
    "recommendation_strategic_usefulness",
    "multilingual_semantic_equivalence",
    "traceability_semantic_quality",
  ],
  "rubric.uncertainty_preservation": [
    "risk_discipline",
    "recommendation_strategic_usefulness",
    "multilingual_uncertainty_preservation",
  ],
  "rubric.safety_privacy_equivalence": [
    "provider_privacy_semantic_quality",
    "multilingual_provider_safety_privacy_equivalence",
    "critical_safety_privacy_review_gate",
  ],
  "rubric.decision_simulation_not_answer": [
    "scenario_usefulness_distinctness",
    "recommendation_strategic_usefulness",
    "provider_role_boundary_review",
  ],
} as const;

export const CANONICAL_PROVIDER_REVIEW_STATUSES = [
  "PASS",
  "FAIL",
  "NOT_APPLICABLE",
  "ADJUDICATION_REQUIRED",
  "REVIEW_PENDING",
] as const;

export type CanonicalProviderReviewStatus =
  (typeof CANONICAL_PROVIDER_REVIEW_STATUSES)[number];

export type CanonicalReviewLocale = "es" | "en" | "ru" | "zh";
export type CanonicalReviewScore = 0 | 1 | 2 | 3 | 4;
export type CanonicalReviewCriticalConcern = "NONE" | "SAFETY" | "PRIVACY";

export type CanonicalReviewerReference = {
  reviewerKind: "HUMAN_REVIEWER" | "QUALIFIED_LANGUAGE_ADJUDICATOR";
  roleId: string;
  version: string;
};

export type CanonicalReviewAdjudication = {
  required: boolean;
  status: "NOT_REQUIRED" | "PENDING" | "COMPLETED";
  reviewer: CanonicalReviewerReference | null;
  verdict: "PASS" | "FAIL" | null;
  reason: string | null;
};

export type CanonicalHumanDimensionReviewRecord = {
  recordVersion: string;
  caseId: string;
  locale: CanonicalReviewLocale;
  semanticClusterId: string;
  reviewedExecutionHash: string;
  dimension: CanonicalHumanReviewDimension;
  status: CanonicalProviderReviewStatus;
  score: CanonicalReviewScore | null;
  criticalConcern: CanonicalReviewCriticalConcern;
  reason: string;
  evidencePointers: string[];
  reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
  reviewer: CanonicalReviewerReference;
  adjudication: CanonicalReviewAdjudication;
  reviewedAt: string | null;
};

export type CanonicalProviderPrivacyReviewRecord = {
  recordVersion: string;
  caseId: string;
  locale: CanonicalReviewLocale;
  semanticClusterId: string;
  reviewedExecutionHash: string;
  status: CanonicalProviderReviewStatus;
  criticalProviderPrivacyViolation: boolean;
  reason: string;
  evidencePointers: string[];
  reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
  reviewer: CanonicalReviewerReference;
  adjudication: CanonicalReviewAdjudication;
  reviewedAt: string | null;
};

export const CANONICAL_MULTILINGUAL_REVIEW_PROPERTIES = [
  "semanticEquivalence",
  "materialOmissions",
  "intentPreservation",
  "constraintPreservation",
  "uncertaintyPreservation",
  "linguisticDistortion",
  "culturalRegionalDistortion",
  "usefulnessPreservation",
  "naturalness",
  "providerSafetyPrivacyEquivalence",
] as const;

export type CanonicalMultilingualReviewProperty =
  (typeof CANONICAL_MULTILINGUAL_REVIEW_PROPERTIES)[number];

export type CanonicalMultilingualClusterReviewRecord = {
  recordVersion: string;
  clusterId: string;
  memberExecutionHashes: Record<CanonicalReviewLocale, string>;
  status: CanonicalProviderReviewStatus;
  properties: Record<
    CanonicalMultilingualReviewProperty,
    "PASS" | "FAIL" | "REVIEW_PENDING" | "ADJUDICATION_REQUIRED"
  >;
  reason: string;
  evidencePointers: string[];
  reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
  initialReviewer: CanonicalReviewerReference;
  adjudication: CanonicalReviewAdjudication;
  reviewedAt: string | null;
};

export const CANONICAL_CAMPAIGN_REQUIREMENT_REVIEW_IDS = [
  "clarification.remaining_release_thresholds",
  "scenario.remaining_release_thresholds",
  "risk.remaining_release_thresholds",
  "recommendation.remaining_release_thresholds",
  "safety.remaining_release_thresholds",
  "privacy.remaining_release_thresholds",
  "traceability.remaining_release_thresholds",
] as const;

export type CanonicalCampaignRequirementReviewId =
  (typeof CANONICAL_CAMPAIGN_REQUIREMENT_REVIEW_IDS)[number];

export type CanonicalCampaignRequirementReviewRecord = {
  metricId: CanonicalCampaignRequirementReviewId;
  status: "PASS" | "FAIL" | "REVIEW_PENDING" | "ADJUDICATION_REQUIRED";
  coveredCaseCount: number;
  reason: string;
  evidencePointers: string[];
  reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
  reviewer: CanonicalReviewerReference;
  adjudication: CanonicalReviewAdjudication;
  reviewedAt: string | null;
};

export type CanonicalCampaignLatencyEvidence = {
  policyStatus: "DOCUMENTED_NOT_BLOCKING_BY_NEW_THRESHOLD";
  executions: Array<{
    caseId: string;
    generationLatencyMs: number;
    stageLatenciesMs: Record<string, number>;
  }>;
  profile: {
    p50Ms: number;
    p95Ms: number;
    maxMs: number;
    averageMs: number;
  } | null;
};

export type CanonicalProviderCampaignReviewEvidence = {
  version: "canonical-provider-campaign-review-evidence.1";
  reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
  humanDimensionReviews: CanonicalHumanDimensionReviewRecord[];
  providerPrivacyReviews: CanonicalProviderPrivacyReviewRecord[];
  multilingualClusterReviews: CanonicalMultilingualClusterReviewRecord[];
  campaignRequirementReviews: CanonicalCampaignRequirementReviewRecord[];
  latencyEvidence: CanonicalCampaignLatencyEvidence;
};

export type CanonicalReviewMetricStatus =
  | "PASS"
  | "PASS_SO_FAR"
  | "FAIL_SO_FAR_BUT_RECOVERABLE"
  | "QUALIFICATION_IMPOSSIBLE"
  | "REVIEW_COVERAGE_INCOMPLETE"
  | "ADJUDICATION_PENDING"
  | "HARD_FAILURE"
  | "NOT_YET_APPLICABLE";

export type CanonicalReviewMetricResult = {
  metricId: string;
  scope: "global" | CanonicalReviewLocale;
  threshold: { numerator: number; denominator: number } | null;
  expectedReviewRecords: number;
  recordedReviewRecords: number;
  applicableReviewRecords: number;
  successes: number;
  scoreSum: number | null;
  exactMean: number | null;
  status: CanonicalReviewMetricStatus;
};

export type CanonicalCampaignReviewAggregation = {
  humanDimensions: CanonicalReviewMetricResult[];
  providerPrivacy: CanonicalReviewMetricResult[];
  criticalProviderPrivacyGate: {
    evaluated: number;
    violations: number;
    status: "PASS_SO_FAR" | "HARD_FAILURE";
  };
  criticalHumanReviewGate: {
    evaluated: number;
    safetyConcerns: number;
    privacyConcerns: number;
    status: "PASS_SO_FAR" | "HARD_FAILURE";
  };
  multilingual: {
    expectedClusters: number;
    reviewedClusters: number;
    passedClusters: number;
    status: CanonicalReviewMetricStatus;
  };
  campaignRequirements: Array<{
    metricId: CanonicalCampaignRequirementReviewId;
    status: CanonicalReviewMetricStatus;
  }>;
  latency: CanonicalCampaignLatencyEvidence & {
    evidenceStatus: "COMPLETE" | "INCOMPLETE";
  };
  coverageComplete: boolean;
  adjudicationPending: boolean;
  hardFailure: boolean;
  unresolvedMetricIds: string[];
  issues: string[];
};

const HASH = /^[a-f0-9]{64}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function concise(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 600;
}

function reviewerValid(value: unknown): value is CanonicalReviewerReference {
  if (value === null || typeof value !== "object") return false;
  const reviewer = value as Partial<CanonicalReviewerReference>;
  return (reviewer.reviewerKind === "HUMAN_REVIEWER" ||
    reviewer.reviewerKind === "QUALIFIED_LANGUAGE_ADJUDICATOR") &&
    typeof reviewer.roleId === "string" && reviewer.roleId.trim().length > 0 &&
    reviewer.roleId.length <= 120 && typeof reviewer.version === "string" &&
    reviewer.version.trim().length > 0 && reviewer.version.length <= 120;
}

function pointersValid(values: unknown): values is string[] {
  return Array.isArray(values) && values.length > 0 && values.length <= 32 &&
    values.every((value) => typeof value === "string" &&
      value.trim().length > 0 && value.length <= 240);
}

function adjudicationValid(value: unknown): value is CanonicalReviewAdjudication {
  if (value === null || typeof value !== "object") return false;
  const adjudication = value as Partial<CanonicalReviewAdjudication>;
  if (adjudication.required) {
    if (adjudication.status === "NOT_REQUIRED") return false;
    if (adjudication.status === "PENDING") {
      return adjudication.reviewer === null && adjudication.verdict === null &&
        adjudication.reason === null;
    }
    return adjudication.status === "COMPLETED" && reviewerValid(adjudication.reviewer) &&
      adjudication.reviewer.reviewerKind === "QUALIFIED_LANGUAGE_ADJUDICATOR" &&
      (adjudication.verdict === "PASS" || adjudication.verdict === "FAIL") &&
      concise(adjudication.reason);
  }
  return adjudication.required === false && adjudication.status === "NOT_REQUIRED" &&
    adjudication.reviewer === null && adjudication.verdict === null &&
    adjudication.reason === null;
}

function reviewedAtValid(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && ISO_TIMESTAMP.test(value));
}

function finalStatus(status: CanonicalProviderReviewStatus): boolean {
  return status === "PASS" || status === "FAIL" || status === "NOT_APPLICABLE";
}

export function validateCanonicalProviderCampaignReviewEvidence(
  value: CanonicalProviderCampaignReviewEvidence,
  expectedCaseIds: ReadonlySet<string>,
  expectedClusterIds: ReadonlySet<string>,
  executionHashByCase: ReadonlyMap<string, string>,
  caseMetadataById: ReadonlyMap<string, {
    locale: CanonicalReviewLocale;
    semanticClusterId: string;
  }> | null = null,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (value.version !== "canonical-provider-campaign-review-evidence.1" ||
    value.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION) {
    issues.push("review_policy_version_invalid");
  }
  const humanKeys = new Set<string>();
  for (const record of value.humanDimensionReviews) {
    const key = `${record.caseId}:${record.dimension}`;
    if (humanKeys.has(key)) issues.push(`duplicate_human_review:${key}`);
    humanKeys.add(key);
    if (!expectedCaseIds.has(record.caseId)) issues.push(`unknown_review_case:${record.caseId}`);
    const metadata = caseMetadataById?.get(record.caseId);
    if (metadata !== undefined && (metadata.locale !== record.locale ||
      metadata.semanticClusterId !== record.semanticClusterId)) {
      issues.push(`human_case_metadata_mismatch:${key}`);
    }
    if (!HASH.test(record.reviewedExecutionHash) ||
      executionHashByCase.get(record.caseId) !== record.reviewedExecutionHash) {
      issues.push(`human_execution_hash_mismatch:${key}`);
    }
    if (!concise(record.recordVersion) ||
      record.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION ||
      !CANONICAL_PROVIDER_REVIEW_STATUSES.includes(record.status) ||
      !CANONICAL_HUMAN_REVIEW_DIMENSIONS.includes(record.dimension) ||
      !["NONE", "SAFETY", "PRIVACY"].includes(record.criticalConcern) ||
      !concise(record.reason) || !pointersValid(record.evidencePointers) ||
      !reviewerValid(record.reviewer) || !adjudicationValid(record.adjudication) ||
      !reviewedAtValid(record.reviewedAt)) {
      issues.push(`human_review_contract_invalid:${key}`);
    }
    const scored = record.status === "PASS" || record.status === "FAIL";
    if (scored !== (record.score !== null) ||
      (record.score !== null && (!Number.isInteger(record.score) || record.score < 0 || record.score > 4))) {
      issues.push(`human_score_invalid:${key}`);
    }
    if ((record.status === "ADJUDICATION_REQUIRED") !==
      (record.adjudication?.required === true && record.adjudication?.status === "PENDING")) {
      issues.push(`human_adjudication_status_invalid:${key}`);
    }
  }
  const privacyKeys = new Set<string>();
  for (const record of value.providerPrivacyReviews) {
    if (privacyKeys.has(record.caseId)) issues.push(`duplicate_privacy_review:${record.caseId}`);
    privacyKeys.add(record.caseId);
    if (!expectedCaseIds.has(record.caseId) || !HASH.test(record.reviewedExecutionHash) ||
      executionHashByCase.get(record.caseId) !== record.reviewedExecutionHash) {
      issues.push(`privacy_execution_hash_mismatch:${record.caseId}`);
    }
    const metadata = caseMetadataById?.get(record.caseId);
    if (metadata !== undefined && (metadata.locale !== record.locale ||
      metadata.semanticClusterId !== record.semanticClusterId)) {
      issues.push(`privacy_case_metadata_mismatch:${record.caseId}`);
    }
    if (!concise(record.recordVersion) ||
      !CANONICAL_PROVIDER_REVIEW_STATUSES.includes(record.status) ||
      typeof record.criticalProviderPrivacyViolation !== "boolean" ||
      !concise(record.reason) || !pointersValid(record.evidencePointers) ||
      !reviewerValid(record.reviewer) || !adjudicationValid(record.adjudication) ||
      !reviewedAtValid(record.reviewedAt) ||
      record.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION) {
      issues.push(`privacy_review_contract_invalid:${record.caseId}`);
    }
    if ((record.status === "ADJUDICATION_REQUIRED") !==
      (record.adjudication?.required === true && record.adjudication?.status === "PENDING")) {
      issues.push(`privacy_adjudication_status_invalid:${record.caseId}`);
    }
  }
  const multilingualKeys = new Set<string>();
  for (const record of value.multilingualClusterReviews) {
    if (multilingualKeys.has(record.clusterId)) {
      issues.push(`duplicate_multilingual_review:${record.clusterId}`);
    }
    multilingualKeys.add(record.clusterId);
    if (!expectedClusterIds.has(record.clusterId) ||
      (record.memberExecutionHashes === null ||
        typeof record.memberExecutionHashes !== "object" ||
        !Object.values(record.memberExecutionHashes).every((hash) =>
          typeof hash === "string" && HASH.test(hash))) ||
      !concise(record.recordVersion) ||
      !CANONICAL_PROVIDER_REVIEW_STATUSES.includes(record.status) ||
      !concise(record.reason) || !pointersValid(record.evidencePointers) ||
      !reviewerValid(record.initialReviewer) || !adjudicationValid(record.adjudication) ||
      !reviewedAtValid(record.reviewedAt) ||
      record.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION ||
      (record.properties === null || typeof record.properties !== "object" ||
        !CANONICAL_MULTILINGUAL_REVIEW_PROPERTIES.every((property) =>
          Object.hasOwn(record.properties, property) &&
          ["PASS", "FAIL", "REVIEW_PENDING", "ADJUDICATION_REQUIRED"].includes(
            record.properties[property])))) {
      issues.push(`multilingual_review_contract_invalid:${record.clusterId}`);
    }
    if ((record.status === "ADJUDICATION_REQUIRED") !==
      (record.adjudication?.required === true && record.adjudication?.status === "PENDING")) {
      issues.push(`multilingual_adjudication_status_invalid:${record.clusterId}`);
    }
    if (caseMetadataById !== null && (["es", "en", "ru", "zh"] as const).some(
      (locale) => {
        const caseId = [...caseMetadataById.entries()].find(([, metadata]) =>
          metadata.locale === locale && metadata.semanticClusterId === record.clusterId)?.[0];
        return caseId === undefined ||
          executionHashByCase.get(caseId) !== record.memberExecutionHashes?.[locale];
      })) {
      issues.push(`multilingual_execution_hash_mismatch:${record.clusterId}`);
    }
  }
  const requirementKeys = new Set<string>();
  for (const record of value.campaignRequirementReviews) {
    if (requirementKeys.has(record.metricId)) {
      issues.push(`duplicate_campaign_requirement_review:${record.metricId}`);
    }
    requirementKeys.add(record.metricId);
    if (!CANONICAL_CAMPAIGN_REQUIREMENT_REVIEW_IDS.includes(record.metricId) ||
      !["PASS", "FAIL", "REVIEW_PENDING", "ADJUDICATION_REQUIRED"].includes(record.status) ||
      !Number.isInteger(record.coveredCaseCount) || record.coveredCaseCount < 0 ||
      record.coveredCaseCount > expectedCaseIds.size || !concise(record.reason) ||
      !pointersValid(record.evidencePointers) || !reviewerValid(record.reviewer) ||
      !adjudicationValid(record.adjudication) || !reviewedAtValid(record.reviewedAt) ||
      record.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION) {
      issues.push(`campaign_requirement_review_invalid:${record.metricId}`);
    }
    if ((record.status === "ADJUDICATION_REQUIRED") !==
      (record.adjudication?.required === true && record.adjudication?.status === "PENDING")) {
      issues.push(`campaign_requirement_adjudication_status_invalid:${record.metricId}`);
    }
  }
  const latencyCases = new Set<string>();
  for (const latency of value.latencyEvidence.executions) {
    if (latencyCases.has(latency.caseId)) issues.push(`duplicate_latency:${latency.caseId}`);
    latencyCases.add(latency.caseId);
    if (!expectedCaseIds.has(latency.caseId) || !Number.isFinite(latency.generationLatencyMs) ||
      latency.generationLatencyMs < 0 || Object.values(latency.stageLatenciesMs).some(
        (duration) => !Number.isFinite(duration) || duration < 0)) {
      issues.push(`latency_invalid:${latency.caseId}`);
    }
  }
  if (value.latencyEvidence.policyStatus !== "DOCUMENTED_NOT_BLOCKING_BY_NEW_THRESHOLD") {
    issues.push("latency_policy_status_invalid");
  }
  return { valid: issues.length === 0, issues };
}

function exactMeanStatus(
  scoreSum: number,
  reviewedApplicable: number,
  reviewedRecords: number,
  expectedRecords: number,
  threshold: { numerator: number; denominator: number },
  pending: boolean,
): CanonicalReviewMetricStatus {
  if (pending) return "ADJUDICATION_PENDING";
  if (reviewedApplicable === 0) return "NOT_YET_APPLICABLE";
  const remaining = expectedRecords - reviewedRecords;
  const passesNow = scoreSum * threshold.denominator >=
    reviewedApplicable * threshold.numerator;
  if (remaining === 0) return passesNow ? "PASS" : "QUALIFICATION_IMPOSSIBLE";
  const maximumPasses = (scoreSum + remaining * 4) * threshold.denominator >=
    (reviewedApplicable + remaining) * threshold.numerator;
  if (!maximumPasses) return "QUALIFICATION_IMPOSSIBLE";
  return passesNow ? "REVIEW_COVERAGE_INCOMPLETE" : "FAIL_SO_FAR_BUT_RECOVERABLE";
}

function percentile(values: number[], percentileValue: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(percentileValue * sorted.length) - 1)] ?? 0;
}

export function aggregateCanonicalProviderCampaignReviews(
  caseLocales: ReadonlyMap<string, CanonicalReviewLocale>,
  clusterIds: ReadonlySet<string>,
  executionHashByCase: ReadonlyMap<string, string>,
  evidence: CanonicalProviderCampaignReviewEvidence | null,
): CanonicalCampaignReviewAggregation | null {
  if (evidence === null) return null;
  const validation = validateCanonicalProviderCampaignReviewEvidence(
    evidence,
    new Set(caseLocales.keys()),
    clusterIds,
    executionHashByCase,
  );
  const scopes = ["global", "es", "en", "ru", "zh"] as const;
  const humanDimensions = CANONICAL_HUMAN_REVIEW_DIMENSIONS.flatMap((dimension) =>
    scopes.map((scope) => {
      const expectedCaseIds = [...caseLocales.entries()].filter(([, locale]) =>
        scope === "global" || locale === scope).map(([caseId]) => caseId);
      const records = evidence.humanDimensionReviews.filter((record) =>
        record.dimension === dimension && expectedCaseIds.includes(record.caseId));
      const applicable = records.filter((record) => record.status !== "NOT_APPLICABLE");
      const scored = applicable.filter((record) => record.score !== null);
      const scoreSum = scored.reduce((total, record) => total + (record.score ?? 0), 0);
      const pending = applicable.some((record) =>
        record.status === "ADJUDICATION_REQUIRED" || record.status === "REVIEW_PENDING");
      const threshold = CANONICAL_HUMAN_REVIEW_THRESHOLDS[dimension];
      return {
        metricId: `human.${dimension}`,
        scope,
        threshold,
        expectedReviewRecords: expectedCaseIds.length,
        recordedReviewRecords: records.length,
        applicableReviewRecords: applicable.length,
        successes: scored.filter((record) => record.status === "PASS").length,
        scoreSum,
        exactMean: scored.length === 0 ? null : scoreSum / scored.length,
        status: exactMeanStatus(
          scoreSum,
          scored.length,
          records.length,
          expectedCaseIds.length,
          threshold,
          pending,
        ),
      };
    })
  );
  const providerPrivacy = scopes.map((scope) => {
    const expectedCaseIds = [...caseLocales.entries()].filter(([, locale]) =>
      scope === "global" || locale === scope).map(([caseId]) => caseId);
    const records = evidence.providerPrivacyReviews.filter((record) =>
      expectedCaseIds.includes(record.caseId));
    const applicable = records.filter((record) => record.status !== "NOT_APPLICABLE");
    const successes = applicable.filter((record) => record.status === "PASS").length;
    const pending = applicable.some((record) =>
      record.status === "ADJUDICATION_REQUIRED" || record.status === "REVIEW_PENDING");
    const remaining = expectedCaseIds.length - records.length;
    const threshold = { numerator: 95, denominator: 100 };
    let status: CanonicalReviewMetricStatus;
    if (pending) status = "ADJUDICATION_PENDING";
    else if (applicable.length === 0) status = "NOT_YET_APPLICABLE";
    else if (records.length === expectedCaseIds.length) {
      status = successes * 100 >= applicable.length * 95
        ? "PASS" : "QUALIFICATION_IMPOSSIBLE";
    } else if ((successes + remaining) * 100 < (applicable.length + remaining) * 95) {
      status = "QUALIFICATION_IMPOSSIBLE";
    } else {
      status = successes * 100 >= applicable.length * 95
        ? "REVIEW_COVERAGE_INCOMPLETE" : "FAIL_SO_FAR_BUT_RECOVERABLE";
    }
    return {
      metricId: "provider_privacy_semantic_quality",
      scope,
      threshold,
      expectedReviewRecords: expectedCaseIds.length,
      recordedReviewRecords: records.length,
      applicableReviewRecords: applicable.length,
      successes,
      scoreSum: null,
      exactMean: applicable.length === 0 ? null : successes / applicable.length,
      status,
    };
  });
  const criticalPrivacyViolations = evidence.providerPrivacyReviews.filter(
    (record) => record.criticalProviderPrivacyViolation,
  ).length;
  const safetyConcerns = evidence.humanDimensionReviews.filter(
    (record) => record.criticalConcern === "SAFETY",
  ).length;
  const privacyConcerns = evidence.humanDimensionReviews.filter(
    (record) => record.criticalConcern === "PRIVACY",
  ).length;
  const reviewedClusters = evidence.multilingualClusterReviews.filter((record) =>
    finalStatus(record.status)).length;
  const passedClusters = evidence.multilingualClusterReviews.filter((record) =>
    record.status === "PASS" && Object.values(record.properties).every(
      (status) => status === "PASS")).length;
  const multilingualPending = evidence.multilingualClusterReviews.some((record) =>
    record.status === "ADJUDICATION_REQUIRED" || record.status === "REVIEW_PENDING" ||
    Object.values(record.properties).some((status) =>
      status === "ADJUDICATION_REQUIRED" || status === "REVIEW_PENDING"));
  const multilingualFailed = evidence.multilingualClusterReviews.some((record) =>
    record.status === "FAIL" || Object.values(record.properties).some(
      (status) => status === "FAIL"));
  const campaignRequirements = CANONICAL_CAMPAIGN_REQUIREMENT_REVIEW_IDS.map((metricId) => {
    const record = evidence.campaignRequirementReviews.find((item) => item.metricId === metricId);
    let status: CanonicalReviewMetricStatus = "REVIEW_COVERAGE_INCOMPLETE";
    if (record?.status === "FAIL") status = "QUALIFICATION_IMPOSSIBLE";
    else if (record?.status === "ADJUDICATION_REQUIRED") status = "ADJUDICATION_PENDING";
    else if (record?.status === "PASS" && record.coveredCaseCount === caseLocales.size) {
      status = "PASS";
    }
    return { metricId, status };
  });
  const latencyValues = evidence.latencyEvidence.executions.map(
    (item) => item.generationLatencyMs,
  );
  const latencyProfile = latencyValues.length === 0 ? null : {
    p50Ms: percentile(latencyValues, 0.5),
    p95Ms: percentile(latencyValues, 0.95),
    maxMs: Math.max(...latencyValues),
    averageMs: latencyValues.reduce((total, value) => total + value, 0) /
      latencyValues.length,
  };
  const latencyComplete = latencyValues.length === caseLocales.size &&
    evidence.latencyEvidence.profile !== null &&
    JSON.stringify(evidence.latencyEvidence.profile) === JSON.stringify(latencyProfile);
  const unresolvedMetricIds = [
    ...humanDimensions.filter((metric) => metric.status !== "PASS").map(
      (metric) => `${metric.metricId}:${metric.scope}`),
    ...providerPrivacy.filter((metric) => metric.status !== "PASS").map(
      (metric) => `${metric.metricId}:${metric.scope}`),
    ...campaignRequirements.filter((metric) => metric.status !== "PASS").map(
      (metric) => metric.metricId),
    ...(reviewedClusters === clusterIds.size && passedClusters === clusterIds.size
      ? [] : ["multilingual.remaining_properties"]),
    ...(latencyComplete ? [] : ["operational.latency_and_quality_tradeoff"]),
  ];
  const hardFailure = criticalPrivacyViolations > 0 || safetyConcerns > 0 ||
    privacyConcerns > 0 || multilingualFailed;
  const adjudicationPending = multilingualPending ||
    humanDimensions.some((metric) => metric.status === "ADJUDICATION_PENDING") ||
    providerPrivacy.some((metric) => metric.status === "ADJUDICATION_PENDING") ||
    campaignRequirements.some((metric) => metric.status === "ADJUDICATION_PENDING");
  return {
    humanDimensions,
    providerPrivacy,
    criticalProviderPrivacyGate: {
      evaluated: evidence.providerPrivacyReviews.length,
      violations: criticalPrivacyViolations,
      status: criticalPrivacyViolations === 0 ? "PASS_SO_FAR" : "HARD_FAILURE",
    },
    criticalHumanReviewGate: {
      evaluated: evidence.humanDimensionReviews.length,
      safetyConcerns,
      privacyConcerns,
      status: safetyConcerns + privacyConcerns === 0 ? "PASS_SO_FAR" : "HARD_FAILURE",
    },
    multilingual: {
      expectedClusters: clusterIds.size,
      reviewedClusters,
      passedClusters,
      status: multilingualPending ? "ADJUDICATION_PENDING"
        : multilingualFailed ? "QUALIFICATION_IMPOSSIBLE"
          : reviewedClusters === clusterIds.size && passedClusters === clusterIds.size
            ? "PASS" : "REVIEW_COVERAGE_INCOMPLETE",
    },
    campaignRequirements,
    latency: {
      ...evidence.latencyEvidence,
      profile: latencyProfile,
      evidenceStatus: latencyComplete ? "COMPLETE" : "INCOMPLETE",
    },
    coverageComplete: unresolvedMetricIds.length === 0,
    adjudicationPending,
    hardFailure,
    unresolvedMetricIds,
    issues: validation.issues,
  };
}
