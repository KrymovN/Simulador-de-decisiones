import "server-only";

import { createHash } from "node:crypto";
import {
  acceptCandidateDecisionMaterial,
  inspectCandidateDecisionMaterialContract,
} from "../ai-decision-material/acceptance";
import {
  compileCanonicalProviderEvaluationInput,
  extractCanonicalProviderEvaluationOracle,
} from "../ai-decision-material/canonical-provider-evaluation-input";
import type { CanonicalOfflineEvaluationCase } from
  "../ai-decision-material/fixtures";
import {
  inspectCanonicalProviderCandidateGrounding,
  matchCanonicalProviderEvaluationOracle,
  validateCanonicalProviderEvaluationResult,
  type CanonicalProviderEvaluationOracleMatch,
  type CanonicalProviderEvaluationResultV1,
} from "./canonical-provider-evaluation-result";
import {
  STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
  STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY,
  validateCanonicalProviderCampaignReviewEvidence,
  type CanonicalProviderCampaignReviewEvidence,
  type CanonicalReviewLocale,
} from "./canonical-provider-review-policy";

export const CANONICAL_PROVIDER_CAMPAIGN_EVIDENCE_VERSION =
  "canonical-provider-campaign-evidence.2" as const;

export type CanonicalCampaignExecutionHash = string;

export type CanonicalProviderExecutionConfiguration = {
  provider: string;
  model: string;
  returnedModel: string | null;
  providerResponseId: string | null;
  serviceTier: string | null;
  reasoning: { effort: "low" };
  maxOutputTokens: number;
  timeoutMs: number;
  store: false;
  tools: [];
  retries: 0;
  automaticReruns: 0;
};

export type CanonicalProviderExecutionOperationalEvidence = {
  status: "COMPLETED";
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  conservativeUncachedCostUsd: number;
  cacheAdjustedCalculatedCostUsd: number;
  generationLatencyMs: number;
  stageLatenciesMs: Record<string, number>;
  sanitizedErrorMetadata: null;
};

export type CanonicalProviderExecutionFailureEvidence = {
  status: "TIMEOUT" | "INCOMPLETE" | "PROVIDER_ERROR";
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
  generationLatencyMs: number;
  stageLatenciesMs: Record<string, number>;
  sanitizedErrorMetadata: {
    category: string;
    httpStatus: number | null;
    type: string | null;
    code: string | null;
    param: string | null;
    message: string | null;
  };
};

export type CanonicalBoundedMatcherCategoryEvidence = {
  passed: boolean;
  actual: string[];
  missing: string[];
  unexpected: string[];
};

export type CanonicalProviderCampaignExecutionRecordV2 = {
  executionHash: CanonicalCampaignExecutionHash;
  campaignId: string;
  executionId: string;
  position: number;
  caseId: string;
  caseVersion: string;
  caseSha256: string;
  locale: CanonicalReviewLocale;
  semanticClusterId: string;
  providerConfiguration: CanonicalProviderExecutionConfiguration;
  configurationFingerprint: string;
  validatedResult: CanonicalProviderEvaluationResultV1;
  automatedEvidence: {
    resultContract: "PASS";
    candidateContract: "PASS" | "NOT_APPLICABLE";
    candidateSafety: "PASS" | "NOT_APPLICABLE";
    annotationValidation: "PASS";
    annotationGrounding: "PASS";
    candidateGrounding: "PASS" | "NOT_APPLICABLE";
    candidateAcceptance: "PASS" | "CONTROLLED_FAILURE" | "NOT_APPLICABLE";
    matcherPassed: boolean;
    matcher: Record<string, CanonicalBoundedMatcherCategoryEvidence>;
    hardGates: {
      provider_result_contract: "PASS";
      candidate_contract_and_safety: "PASS";
      oracle_isolation: "PASS";
      approved_cost_budget: "PASS";
      critical_provider_privacy_violation: "REVIEW_PENDING";
    };
  };
  operationalEvidence: CanonicalProviderExecutionOperationalEvidence;
  privacyCaptureAttestation: {
    fixtureClassification: "synthetic_non_personal";
    evaluationOnly: true;
    resultValidated: true;
    secretScan: "PASS";
    personalDataPolicyScan: "PASS";
    chainOfThoughtAbsent: true;
    rawEnvelopePersisted: false;
    rawPromptPersisted: false;
    hiddenOraclePersistedInProviderResult: false;
  };
};

export type CanonicalProviderCampaignFailureRecordV2 = {
  executionHash: CanonicalCampaignExecutionHash;
  campaignId: string;
  executionId: string;
  position: number;
  caseId: string;
  caseVersion: string;
  caseSha256: string;
  locale: CanonicalReviewLocale;
  semanticClusterId: string;
  providerConfiguration: CanonicalProviderExecutionConfiguration;
  configurationFingerprint: string;
  validatedResult: null;
  automatedEvidence: {
    resultContract: "NOT_REACHED";
    candidateContract: "NOT_REACHED";
    candidateSafety: "NOT_REACHED";
    annotationValidation: "NOT_REACHED";
    annotationGrounding: "NOT_REACHED";
    candidateGrounding: "NOT_REACHED";
    candidateAcceptance: "NOT_REACHED";
    matcherPassed: null;
    matcher: null;
    hardGates: {
      provider_result_contract: "NOT_REACHED";
      candidate_contract_and_safety: "NOT_REACHED";
      oracle_isolation: "PASS";
      approved_cost_budget: "PASS";
      critical_provider_privacy_violation: "NOT_REACHED";
    };
  };
  operationalEvidence: CanonicalProviderExecutionFailureEvidence;
  privacyCaptureAttestation: {
    fixtureClassification: "synthetic_non_personal";
    evaluationOnly: true;
    resultValidated: false;
    secretScan: "PASS";
    personalDataPolicyScan: "PASS";
    chainOfThoughtAbsent: true;
    rawEnvelopePersisted: false;
    rawPromptPersisted: false;
    hiddenOraclePersistedInProviderResult: false;
  };
};

export type CanonicalProviderCampaignEvidenceV2 = {
  version: typeof CANONICAL_PROVIDER_CAMPAIGN_EVIDENCE_VERSION;
  campaign: {
    campaignId: string;
    status: "OPEN" | "CLOSED";
    closedAt: string | null;
    retentionPolicyId: typeof STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY.id;
    retentionPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY.version;
    maximumContentDeletionDeadline: string | null;
    contentRetentionStatus: "ACTIVE";
    storageClass: "evaluation-only";
    accessClass: "review-authorized-least-privilege";
  };
  frozenConfiguration: {
    baselineCommit: string;
    caseOrderSha256: string;
    caseCount: number;
    configurationFingerprint: string;
  };
  versionManifest: {
    reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
    inputContractVersion: string;
    resultContractVersion: string;
    taxonomyVersion: string;
    taskProfileVersion: string;
    boundaryVersion: string;
    aggregationVersion: string;
    providerInstructionsSha256: string;
    providerSchemaSha256: string;
  };
  executions: Array<
    CanonicalProviderCampaignExecutionRecordV2 | CanonicalProviderCampaignFailureRecordV2
  >;
  reviewRecords: CanonicalProviderCampaignReviewEvidence;
  campaignAggregation: {
    aggregationVersion: string;
    sourceExecutionHashes: string[];
    generatedAt: string | null;
  };
};

export type CanonicalProviderBlindReviewPacketV1 = {
  version: "canonical-provider-blind-review-packet.1";
  executionHash: string;
  caseId: string;
  locale: CanonicalReviewLocale;
  semanticClusterId: string;
  validatedResult: CanonicalProviderEvaluationResultV1;
  reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
  oracleIncluded: false;
  matcherIncluded: false;
};

export type CaptureCanonicalProviderExecutionInput = {
  campaignId: string;
  executionId: string;
  position: number;
  sourceCase: CanonicalOfflineEvaluationCase;
  providerConfiguration: CanonicalProviderExecutionConfiguration;
  result: CanonicalProviderEvaluationResultV1;
  operationalEvidence: CanonicalProviderExecutionOperationalEvidence;
  approvedCostBudgetPassed: boolean;
};

export type CaptureCanonicalProviderFailureInput = {
  campaignId: string;
  executionId: string;
  position: number;
  sourceCase: CanonicalOfflineEvaluationCase;
  providerConfiguration: CanonicalProviderExecutionConfiguration;
  operationalEvidence: CanonicalProviderExecutionFailureEvidence;
  approvedCostBudgetPassed: boolean;
};

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_OBJECT_ID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

const FORBIDDEN_PERSISTED_FIELD_NAMES = new Set([
  "rawhttpenvelope",
  "rawproviderenvelope",
  "rawproviderrequest",
  "rawproviderresponse",
  "rawresponse",
  "unvalidatedrawresponse",
  "unvalidatedrawpayload",
  "headers",
  "requestheaders",
  "apikey",
  "authorization",
  "authtoken",
  "sessionid",
  "sessiontoken",
  "chainofthought",
  "hiddenreasoning",
  "reasoningtext",
  "rawprompt",
  "rawinstructions",
  "hiddenoracle",
  "expectedoracle",
]);

const FORBIDDEN_PERSISTED_CONTENT = [
  /\bchain[- ]of[- ]thought\b/i,
  /\bhidden reasoning\b/i,
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /\b(?:api key|provider secret|access token|refresh token|auth token|session token)\s*[:=]/i,
  /\b(?:owner|principal|session|account|user)[_-]?id\s*[:=]\s*[\w-]+/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
] as const;

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalEvidenceSha256(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function forbiddenPersistenceIssues(value: unknown): string[] {
  const issues: string[] = [];
  const visit = (current: unknown, path: string) => {
    if (typeof current === "string") {
      if (FORBIDDEN_PERSISTED_CONTENT.some((pattern) => pattern.test(current))) {
        issues.push(`forbidden_content:${path}`);
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (current === null || typeof current !== "object") return;
    for (const [key, item] of Object.entries(current as Record<string, unknown>)) {
      const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (FORBIDDEN_PERSISTED_FIELD_NAMES.has(normalized)) {
        issues.push(`forbidden_field:${path}.${key}`);
      } else {
        visit(item, `${path}.${key}`);
      }
    }
  };
  visit(value, "evidence");
  return issues;
}

function operationalEvidenceValid(value: CanonicalProviderExecutionOperationalEvidence): boolean {
  const integers = [
    value.inputTokens,
    value.cachedInputTokens,
    value.outputTokens,
    value.reasoningTokens,
    value.totalTokens,
    value.generationLatencyMs,
  ];
  return value.status === "COMPLETED" && integers.every((item) =>
    Number.isInteger(item) && item >= 0) &&
    value.cachedInputTokens <= value.inputTokens &&
    value.reasoningTokens <= value.outputTokens &&
    value.totalTokens === value.inputTokens + value.outputTokens &&
    Number.isFinite(value.conservativeUncachedCostUsd) &&
    value.conservativeUncachedCostUsd >= 0 &&
    Number.isFinite(value.cacheAdjustedCalculatedCostUsd) &&
    value.cacheAdjustedCalculatedCostUsd >= 0 &&
    Object.values(value.stageLatenciesMs).every((item) =>
      Number.isFinite(item) && item >= 0) &&
    value.sanitizedErrorMetadata === null;
}

function providerConfigurationValid(value: CanonicalProviderExecutionConfiguration): boolean {
  return value !== null && typeof value === "object" &&
    typeof value.provider === "string" && value.provider.trim().length > 0 &&
    value.provider.length <= 120 && typeof value.model === "string" &&
    value.model.trim().length > 0 && value.model.length <= 160 &&
    (value.returnedModel === null || (typeof value.returnedModel === "string" &&
      value.returnedModel.trim().length > 0 && value.returnedModel.length <= 160)) &&
    (value.providerResponseId === null || (typeof value.providerResponseId === "string" &&
      ID.test(value.providerResponseId))) &&
    (value.serviceTier === null || (typeof value.serviceTier === "string" &&
      value.serviceTier.trim().length > 0 && value.serviceTier.length <= 120)) &&
    value.reasoning?.effort === "low" && Number.isInteger(value.maxOutputTokens) &&
    value.maxOutputTokens > 0 && Number.isInteger(value.timeoutMs) && value.timeoutMs > 0 &&
    value.store === false && Array.isArray(value.tools) && value.tools.length === 0 &&
    value.retries === 0 && value.automaticReruns === 0;
}

function failureEvidenceValid(value: CanonicalProviderExecutionFailureEvidence): boolean {
  const tokens = [
    value.inputTokens,
    value.cachedInputTokens,
    value.outputTokens,
    value.reasoningTokens,
    value.totalTokens,
  ];
  const allTokensAbsent = tokens.every((item) => item === null);
  const allTokensValid = tokens.every((item) => item !== null &&
    Number.isInteger(item) && item >= 0);
  if (!allTokensAbsent && !allTokensValid) return false;
  if (allTokensValid && (
    (value.cachedInputTokens as number) > (value.inputTokens as number) ||
    (value.reasoningTokens as number) > (value.outputTokens as number) ||
    value.totalTokens !== (value.inputTokens as number) + (value.outputTokens as number)
  )) return false;
  const error = value.sanitizedErrorMetadata;
  return ["TIMEOUT", "INCOMPLETE", "PROVIDER_ERROR"].includes(value.status) &&
    Number.isInteger(value.generationLatencyMs) && value.generationLatencyMs >= 0 &&
    Object.values(value.stageLatenciesMs).every((item) =>
      Number.isFinite(item) && item >= 0) && error !== null &&
    typeof error.category === "string" && error.category.length > 0 &&
    error.category.length <= 120 &&
    (error.httpStatus === null || (Number.isInteger(error.httpStatus) &&
      error.httpStatus >= 100 && error.httpStatus <= 599)) &&
    [error.type, error.code, error.param, error.message].every((item) =>
      item === null || (typeof item === "string" && item.length <= 500));
}

function boundedMatcher(
  matcher: CanonicalProviderEvaluationOracleMatch,
): Record<string, CanonicalBoundedMatcherCategoryEvidence> {
  return Object.fromEntries(Object.entries(matcher.categories).map(([category, result]) => [
    category,
    {
      passed: result.passed,
      actual: [...result.actual],
      missing: [...result.missing],
      unexpected: [...result.unexpected],
    },
  ]));
}

export function captureCanonicalProviderExecutionEvidence(
  input: CaptureCanonicalProviderExecutionInput,
): { status: "captured"; record: CanonicalProviderCampaignExecutionRecordV2 } |
  { status: "rejected"; issues: string[] } {
  const issues: string[] = [];
  if (!ID.test(input.campaignId) || !ID.test(input.executionId) ||
    !Number.isInteger(input.position) || input.position < 1) {
    issues.push("execution_identity_invalid");
  }
  if (input.sourceCase.provenance.kind !== "purpose_written_synthetic") {
    issues.push("fixture_not_synthetic");
  }
  if (!providerConfigurationValid(input.providerConfiguration)) {
    issues.push("provider_configuration_invalid");
  }
  const compiled = compileCanonicalProviderEvaluationInput(input.sourceCase);
  if (compiled.status !== "ready") issues.push("canonical_case_invalid");
  const validated = compiled.status === "ready"
    ? validateCanonicalProviderEvaluationResult(input.result, compiled.input)
    : null;
  if (validated?.status !== "valid") issues.push("provider_result_not_validated");
  const candidate = validated?.status === "valid"
    ? validated.result.candidate_material : null;
  const inspection = candidate === null ? null : inspectCandidateDecisionMaterialContract(candidate);
  if (inspection !== null && (!inspection.schemaValid || !inspection.safetyValid)) {
    issues.push("candidate_contract_or_safety_invalid");
  }
  const grounding = candidate === null || compiled.status !== "ready"
    ? null : inspectCanonicalProviderCandidateGrounding(candidate, compiled.input);
  if (grounding !== null && !grounding.valid) issues.push("candidate_grounding_invalid");
  if (!input.approvedCostBudgetPassed) issues.push("approved_cost_budget_failed");
  if (!operationalEvidenceValid(input.operationalEvidence)) {
    issues.push("operational_evidence_invalid");
  }
  const oracle = extractCanonicalProviderEvaluationOracle(input.sourceCase);
  if (oracle === null || validated?.status !== "valid") issues.push("oracle_unavailable");
  if (issues.length > 0 || compiled.status !== "ready" || validated?.status !== "valid" ||
    oracle === null) return { status: "rejected", issues };
  const matcher = matchCanonicalProviderEvaluationOracle(validated.result, oracle);
  const acceptance = candidate === null ? null : acceptCandidateDecisionMaterial(candidate, {
    allowed_option_refs: [],
    allowed_scenario_refs: [],
    allowed_criterion_refs: [],
    contradictory_candidate_ids: [],
    irrelevant_candidate_ids: [],
  });
  const providerConfiguration = structuredClone(input.providerConfiguration);
  const withoutHash = {
    campaignId: input.campaignId,
    executionId: input.executionId,
    position: input.position,
    caseId: input.sourceCase.case_id,
    caseVersion: input.sourceCase.case_version,
    caseSha256: canonicalEvidenceSha256(input.sourceCase),
    locale: input.sourceCase.language,
    semanticClusterId: input.sourceCase.provenance.semantic_cluster_id,
    providerConfiguration,
    configurationFingerprint: canonicalEvidenceSha256(providerConfiguration),
    validatedResult: structuredClone(validated.result),
    automatedEvidence: {
      resultContract: "PASS" as const,
      candidateContract: candidate === null ? "NOT_APPLICABLE" as const : "PASS" as const,
      candidateSafety: candidate === null ? "NOT_APPLICABLE" as const : "PASS" as const,
      annotationValidation: "PASS" as const,
      annotationGrounding: "PASS" as const,
      candidateGrounding: candidate === null ? "NOT_APPLICABLE" as const : "PASS" as const,
      candidateAcceptance: acceptance === null ? "NOT_APPLICABLE" as const
        : acceptance.status === "accepted" ? "PASS" as const : "CONTROLLED_FAILURE" as const,
      matcherPassed: matcher.passed,
      matcher: boundedMatcher(matcher),
      hardGates: {
        provider_result_contract: "PASS" as const,
        candidate_contract_and_safety: "PASS" as const,
        oracle_isolation: "PASS" as const,
        approved_cost_budget: "PASS" as const,
        critical_provider_privacy_violation: "REVIEW_PENDING" as const,
      },
    },
    operationalEvidence: structuredClone(input.operationalEvidence),
    privacyCaptureAttestation: {
      fixtureClassification: "synthetic_non_personal" as const,
      evaluationOnly: true as const,
      resultValidated: true as const,
      secretScan: "PASS" as const,
      personalDataPolicyScan: "PASS" as const,
      chainOfThoughtAbsent: true as const,
      rawEnvelopePersisted: false as const,
      rawPromptPersisted: false as const,
      hiddenOraclePersistedInProviderResult: false as const,
    },
  };
  const persistenceIssues = forbiddenPersistenceIssues(withoutHash);
  if (persistenceIssues.length > 0) return { status: "rejected", issues: persistenceIssues };
  return {
    status: "captured",
    record: {
      executionHash: canonicalEvidenceSha256(withoutHash),
      ...withoutHash,
    },
  };
}

export function buildCanonicalProviderBlindReviewPacket(
  record: CanonicalProviderCampaignExecutionRecordV2,
): CanonicalProviderBlindReviewPacketV1 {
  return {
    version: "canonical-provider-blind-review-packet.1",
    executionHash: record.executionHash,
    caseId: record.caseId,
    locale: record.locale,
    semanticClusterId: record.semanticClusterId,
    validatedResult: structuredClone(record.validatedResult),
    reviewPolicyVersion: STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
    oracleIncluded: false,
    matcherIncluded: false,
  };
}

export function captureCanonicalProviderFailureEvidence(
  input: CaptureCanonicalProviderFailureInput,
): { status: "captured"; record: CanonicalProviderCampaignFailureRecordV2 } |
  { status: "rejected"; issues: string[] } {
  const issues: string[] = [];
  if (!ID.test(input.campaignId) || !ID.test(input.executionId) ||
    !Number.isInteger(input.position) || input.position < 1) {
    issues.push("execution_identity_invalid");
  }
  if (input.sourceCase.provenance.kind !== "purpose_written_synthetic") {
    issues.push("fixture_not_synthetic");
  }
  if (!providerConfigurationValid(input.providerConfiguration)) {
    issues.push("provider_configuration_invalid");
  }
  if (!input.approvedCostBudgetPassed) issues.push("approved_cost_budget_failed");
  if (!failureEvidenceValid(input.operationalEvidence)) {
    issues.push("operational_failure_evidence_invalid");
  }
  if (issues.length > 0) return { status: "rejected", issues };
  const providerConfiguration = structuredClone(input.providerConfiguration);
  const withoutHash = {
    campaignId: input.campaignId,
    executionId: input.executionId,
    position: input.position,
    caseId: input.sourceCase.case_id,
    caseVersion: input.sourceCase.case_version,
    caseSha256: canonicalEvidenceSha256(input.sourceCase),
    locale: input.sourceCase.language,
    semanticClusterId: input.sourceCase.provenance.semantic_cluster_id,
    providerConfiguration,
    configurationFingerprint: canonicalEvidenceSha256(providerConfiguration),
    validatedResult: null,
    automatedEvidence: {
      resultContract: "NOT_REACHED" as const,
      candidateContract: "NOT_REACHED" as const,
      candidateSafety: "NOT_REACHED" as const,
      annotationValidation: "NOT_REACHED" as const,
      annotationGrounding: "NOT_REACHED" as const,
      candidateGrounding: "NOT_REACHED" as const,
      candidateAcceptance: "NOT_REACHED" as const,
      matcherPassed: null,
      matcher: null,
      hardGates: {
        provider_result_contract: "NOT_REACHED" as const,
        candidate_contract_and_safety: "NOT_REACHED" as const,
        oracle_isolation: "PASS" as const,
        approved_cost_budget: "PASS" as const,
        critical_provider_privacy_violation: "NOT_REACHED" as const,
      },
    },
    operationalEvidence: structuredClone(input.operationalEvidence),
    privacyCaptureAttestation: {
      fixtureClassification: "synthetic_non_personal" as const,
      evaluationOnly: true as const,
      resultValidated: false as const,
      secretScan: "PASS" as const,
      personalDataPolicyScan: "PASS" as const,
      chainOfThoughtAbsent: true as const,
      rawEnvelopePersisted: false as const,
      rawPromptPersisted: false as const,
      hiddenOraclePersistedInProviderResult: false as const,
    },
  };
  const persistenceIssues = forbiddenPersistenceIssues(withoutHash);
  if (persistenceIssues.length > 0) return { status: "rejected", issues: persistenceIssues };
  return {
    status: "captured",
    record: {
      executionHash: canonicalEvidenceSha256(withoutHash),
      ...withoutHash,
    },
  };
}

function retentionIssues(value: CanonicalProviderCampaignEvidenceV2): string[] {
  const issues: string[] = [];
  const campaign = value.campaign;
  if (campaign.retentionPolicyId !== STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY.id ||
    campaign.retentionPolicyVersion !== STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY.version ||
    campaign.storageClass !== "evaluation-only" ||
    campaign.accessClass !== "review-authorized-least-privilege" ||
    campaign.contentRetentionStatus !== "ACTIVE" ||
    (campaign.status !== "OPEN" && campaign.status !== "CLOSED")) {
    issues.push("retention_policy_invalid");
  }
  if (campaign.status === "OPEN") {
    if (campaign.closedAt !== null || campaign.maximumContentDeletionDeadline !== null ||
      campaign.contentRetentionStatus !== "ACTIVE") {
      issues.push("open_campaign_retention_invalid");
    }
    return issues;
  }
  if (campaign.closedAt === null || !ISO_TIMESTAMP.test(campaign.closedAt)) {
    issues.push("campaign_close_date_invalid");
    return issues;
  }
  if (campaign.maximumContentDeletionDeadline === null ||
    !ISO_TIMESTAMP.test(campaign.maximumContentDeletionDeadline)) {
    issues.push("content_deletion_deadline_missing");
    return issues;
  }
  const closed = Date.parse(campaign.closedAt);
  const deadline = Date.parse(campaign.maximumContentDeletionDeadline);
  const maximum = closed +
    STAGE_9_PROVIDER_REVIEW_RETENTION_POLICY.maximumDaysAfterCampaignClosure *
      24 * 60 * 60 * 1000;
  if (!Number.isFinite(deadline) || deadline < closed || deadline > maximum) {
    issues.push("content_deletion_deadline_exceeds_30_days");
  }
  return issues;
}

export function validateCanonicalProviderCampaignEvidenceV2(
  value: CanonicalProviderCampaignEvidenceV2,
  cases: readonly CanonicalOfflineEvaluationCase[],
): { valid: boolean; issues: string[] } {
  const issues = forbiddenPersistenceIssues(value);
  if (value.version !== CANONICAL_PROVIDER_CAMPAIGN_EVIDENCE_VERSION) {
    issues.push("campaign_evidence_version_invalid");
  }
  issues.push(...retentionIssues(value));
  const expectedCaseOrderSha256 = createHash("sha256").update(
    cases.map((item) => item.case_id).join("\n"),
  ).digest("hex");
  if (!ID.test(value.campaign.campaignId) ||
    !GIT_OBJECT_ID.test(value.frozenConfiguration.baselineCommit) ||
    value.frozenConfiguration.caseOrderSha256 !== expectedCaseOrderSha256 ||
    value.frozenConfiguration.caseCount !== cases.length ||
    !SHA256.test(value.frozenConfiguration.configurationFingerprint)) {
    issues.push("campaign_identity_or_frozen_configuration_invalid");
  }
  const manifest = value.versionManifest;
  if (manifest.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION ||
    [manifest.inputContractVersion, manifest.resultContractVersion,
      manifest.taxonomyVersion, manifest.taskProfileVersion,
      manifest.boundaryVersion, manifest.aggregationVersion].some(
      (item) => typeof item !== "string" || item.trim().length === 0 || item.length > 160) ||
    !SHA256.test(manifest.providerInstructionsSha256) ||
    !SHA256.test(manifest.providerSchemaSha256)) {
    issues.push("version_checksum_manifest_invalid");
  }
  if (value.campaignAggregation.aggregationVersion !== manifest.aggregationVersion ||
    (value.campaignAggregation.generatedAt !== null &&
      !ISO_TIMESTAMP.test(value.campaignAggregation.generatedAt))) {
    issues.push("campaign_aggregation_metadata_invalid");
  }
  const caseById = new Map(cases.map((item) => [item.case_id, item]));
  const hashByCase = new Map<string, string>();
  const executionHashes = new Set<string>();
  const executionIds = new Set<string>();
  const positions = new Set<number>();
  const executionCaseIds = new Set<string>();
  for (const execution of value.executions) {
    const source = caseById.get(execution.caseId);
    const { executionHash, ...withoutHash } = execution;
    if (source === undefined || source.provenance.kind !== "purpose_written_synthetic") {
      issues.push(`execution_case_invalid:${execution.caseId}`);
      continue;
    }
    if (!SHA256.test(executionHash) || executionHash !== canonicalEvidenceSha256(withoutHash)) {
      issues.push(`execution_hash_invalid:${execution.caseId}`);
    }
    if (executionHashes.has(executionHash)) issues.push(`execution_hash_duplicate:${executionHash}`);
    executionHashes.add(executionHash);
    if (!ID.test(execution.executionId) || executionIds.has(execution.executionId) ||
      !Number.isInteger(execution.position) || execution.position < 1 ||
      positions.has(execution.position) || executionCaseIds.has(execution.caseId)) {
      issues.push(`execution_identity_duplicate_or_invalid:${execution.caseId}`);
    }
    executionIds.add(execution.executionId);
    positions.add(execution.position);
    executionCaseIds.add(execution.caseId);
    if (execution.validatedResult !== null) hashByCase.set(execution.caseId, executionHash);
    if (execution.campaignId !== value.campaign.campaignId ||
      !providerConfigurationValid(execution.providerConfiguration) ||
      execution.caseSha256 !== canonicalEvidenceSha256(source) ||
      execution.caseVersion !== source.case_version || execution.locale !== source.language ||
      execution.semanticClusterId !== source.provenance.semantic_cluster_id ||
      execution.configurationFingerprint !== canonicalEvidenceSha256(
        execution.providerConfiguration) ||
      execution.configurationFingerprint !==
        value.frozenConfiguration.configurationFingerprint) {
      issues.push(`execution_identity_or_config_invalid:${execution.caseId}`);
    }
    if (execution.validatedResult === null) {
      if (execution.operationalEvidence.status === "COMPLETED" ||
        !failureEvidenceValid(execution.operationalEvidence)) {
        issues.push(`persisted_failure_evidence_invalid:${execution.caseId}`);
      }
    } else {
      const compiled = compileCanonicalProviderEvaluationInput(source);
      const validated = compiled.status === "ready"
        ? validateCanonicalProviderEvaluationResult(execution.validatedResult, compiled.input)
        : null;
      if (validated?.status !== "valid" ||
        execution.operationalEvidence.status !== "COMPLETED" ||
        !operationalEvidenceValid(execution.operationalEvidence)) {
        issues.push(`persisted_execution_not_validated:${execution.caseId}`);
      }
    }
  }
  const aggregationHashes = new Set(value.campaignAggregation.sourceExecutionHashes);
  if (value.campaignAggregation.sourceExecutionHashes.some((hash) =>
    !executionHashes.has(hash) || !SHA256.test(hash)) ||
    aggregationHashes.size !== executionHashes.size ||
    value.campaignAggregation.sourceExecutionHashes.length !== executionHashes.size) {
    issues.push("campaign_aggregation_hash_linkage_invalid");
  }
  const reviewValidation = validateCanonicalProviderCampaignReviewEvidence(
    value.reviewRecords,
    new Set(cases.map((item) => item.case_id)),
    new Set(cases.map((item) => item.provenance.semantic_cluster_id)),
    hashByCase,
    new Map(cases.map((item) => [item.case_id, {
      locale: item.language,
      semanticClusterId: item.provenance.semantic_cluster_id,
    }])),
  );
  issues.push(...reviewValidation.issues);
  return { valid: issues.length === 0, issues };
}
