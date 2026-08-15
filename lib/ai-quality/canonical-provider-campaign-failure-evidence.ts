import "server-only";

import type { CanonicalOfflineEvaluationCase } from
  "../ai-decision-material/fixtures";
import { CANONICAL_PROVIDER_EVALUATION_INPUT_VERSION } from
  "../ai-decision-material/canonical-provider-evaluation-input";
import { canonicalEvidenceSha256 } from "./canonical-provider-campaign-evidence";
import {
  CANONICAL_PROVIDER_EVALUATION_AGGREGATION_VERSION,
} from "./canonical-provider-evaluation-aggregation";
import {
  CANONICAL_PROVIDER_EVALUATION_BOUNDARY_VERSION,
} from "./canonical-provider-evaluation";
import {
  CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
  type CanonicalProviderEvaluationResultValidation,
} from "./canonical-provider-evaluation-result";
import {
  CANONICAL_PROVIDER_EVALUATION_TASK_PROFILE_VERSION,
  CANONICAL_PROVIDER_EVALUATION_TAXONOMY_VERSION,
} from "./canonical-provider-evaluation-taxonomy";
import { STAGE_9_PROVIDER_REVIEW_POLICY_VERSION } from
  "./canonical-provider-review-policy";

export const CANONICAL_PROVIDER_CAMPAIGN_FAILURE_EVIDENCE_VERSION =
  "canonical-provider-campaign-failure-evidence.1" as const;

export type CanonicalProviderCampaignFailureOperationalMetadataV1 = {
  responseId: string | null;
  returnedModel: string | null;
  serviceTier: string | null;
  generationLatencyMs: number | null;
  usage: {
    inputTokens: number | null;
    cachedInputTokens: number | null;
    outputTokens: number | null;
    reasoningTokens: number | null;
    totalTokens: number | null;
  };
  actualCostUsd: number | null;
};

export type CanonicalProviderCampaignFailureEvidenceV1 = {
  version: typeof CANONICAL_PROVIDER_CAMPAIGN_FAILURE_EVIDENCE_VERSION;
  artifactHash: string;
  identity: {
    campaignId: string;
    attemptId: string;
    position: number;
    caseId: string;
    caseVersion: string;
    caseSha256: string;
    locale: "es" | "en" | "ru" | "zh";
    semanticClusterId: string;
  };
  frozenConfiguration: {
    baselineCommit: string;
    configurationFingerprint: string;
    reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
    inputContractVersion: typeof CANONICAL_PROVIDER_EVALUATION_INPUT_VERSION;
    resultContractVersion: typeof CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION;
    taxonomyVersion: typeof CANONICAL_PROVIDER_EVALUATION_TAXONOMY_VERSION;
    taskProfileVersion: typeof CANONICAL_PROVIDER_EVALUATION_TASK_PROFILE_VERSION;
    boundaryVersion: typeof CANONICAL_PROVIDER_EVALUATION_BOUNDARY_VERSION;
    aggregationVersion: typeof CANONICAL_PROVIDER_EVALUATION_AGGREGATION_VERSION;
  };
  authorization: {
    inputTokens: number;
    maxInputTokens: number;
    maxOutputTokens: number;
    configuredMaxTotalTokens: number;
    maximumAuthorizedTotalTokens: number;
    theoreticalUncachedCommitmentUsd: number;
    maximumCommitmentUsd: number;
    tokenPreflightLatencyMs: number;
    status: "PASS";
  };
  provider: {
    configuredProvider: string;
    configuredModel: string;
    responseId: string | null;
    returnedModel: string | null;
    serviceTier: string | null;
  };
  execution: {
    generationAttempted: true;
    generationCount: 1;
    retries: 0;
    reruns: 0;
    operationalProviderResponseReceived: true;
    terminalStatus: "PROVIDER_CONTRACT_HARD_FAIL";
    classification: "evaluation_result_contract_invalid";
    generationLatencyMs: number | null;
    usage: CanonicalProviderCampaignFailureOperationalMetadataV1["usage"];
    actualCostUsd: number | null;
    unavailableFields: string[];
  };
  contractFailureDiagnostic: {
    stage: "evaluation_result_contract";
    code: string;
    path: string;
    candidateId: string | null;
    receivedLength: number | null;
    truncated: boolean;
  };
  downstreamState: {
    matcherExecuted: false;
    evidenceV2Created: false;
    blindPacketCreated: false;
    humanReviewStatus: "NOT_REACHED";
    comparableValidatedResult: false;
  };
  privacyCaptureAttestation: {
    fixtureClassification: "synthetic_non_personal";
    evaluationOnly: true;
    secretScan: "PASS";
    personalDataPolicyScan: "PASS";
    chainOfThoughtAbsent: true;
    rawHttpRequestPersisted: false;
    rawHttpResponsePersisted: false;
    rawProviderPayloadPersisted: false;
    rawPromptPersisted: false;
    rejectedProviderOutputPersisted: false;
    hiddenOraclePersisted: false;
  };
};

export type CaptureCanonicalProviderContractFailureInput = {
  campaignId: string;
  attemptId: string;
  position: number;
  sourceCase: CanonicalOfflineEvaluationCase;
  baselineCommit: string;
  configurationFingerprint: string;
  configuredProvider: string;
  configuredModel: string;
  authorization: Omit<
    CanonicalProviderCampaignFailureEvidenceV1["authorization"],
    "status"
  >;
  operationalMetadata: CanonicalProviderCampaignFailureOperationalMetadataV1;
  validation: Extract<
    CanonicalProviderEvaluationResultValidation,
    { status: "invalid" }
  >;
};

export type CanonicalProviderCampaignFailureExpectedLinkage = {
  campaignId: string;
  attemptId: string;
  position: number;
  caseId: string;
  caseVersion: string;
  caseSha256: string;
  locale: "es" | "en" | "ru" | "zh";
  semanticClusterId: string;
  baselineCommit: string;
  configurationFingerprint: string;
};

const HASH = /^[a-f0-9]{64}$/;
const GIT_OBJECT_ID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/;
const SAFE_TEXT = /^[A-Za-z0-9][A-Za-z0-9_.:/\[\]-]{0,199}$/;
const FORBIDDEN_KEYS = new Set([
  "apikey",
  "authorizationheader",
  "authtoken",
  "chainofthought",
  "expectedoracle",
  "hiddenoracle",
  "hiddenreasoning",
  "rawhttprequest",
  "rawhttpresponse",
  "rawprompt",
  "rawproviderpayload",
  "rawproviderrequest",
  "rawproviderresponse",
  "rawresponse",
  "reasoningtext",
  "rejectedoutput",
  "rejectedprovideroutput",
  "sessiontoken",
]);
const FORBIDDEN_CONTENT = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /\bBearer\s+\S+/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\bchain[- ]of[- ]thought\b/i,
  /\bhidden reasoning\b/i,
] as const;
const METADATA_PATHS = [
  "provider.responseId",
  "provider.returnedModel",
  "provider.serviceTier",
  "execution.generationLatencyMs",
  "execution.usage.inputTokens",
  "execution.usage.cachedInputTokens",
  "execution.usage.outputTokens",
  "execution.usage.reasoningTokens",
  "execution.usage.totalTokens",
  "execution.actualCostUsd",
] as const;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) =>
    key === expected[index]);
}

function forbiddenPersistenceIssues(value: unknown): string[] {
  const issues: string[] = [];
  const visit = (item: unknown, path: string): void => {
    if (typeof item === "string") {
      if (FORBIDDEN_CONTENT.some((pattern) => pattern.test(item))) {
        issues.push(`failure_evidence_forbidden_content:${path}`);
      }
      return;
    }
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }
    if (!record(item)) return;
    for (const [key, child] of Object.entries(item)) {
      const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (FORBIDDEN_KEYS.has(normalized)) {
        issues.push(`failure_evidence_forbidden_field:${path}.${key}`);
      } else {
        visit(child, `${path}.${key}`);
      }
    }
  };
  visit(value, "evidence");
  return issues;
}

function nonNegativeIntegerOrNull(value: unknown): boolean {
  return value === null || (Number.isInteger(value) && Number(value) >= 0);
}

function operationalMetadataIssues(
  value: CanonicalProviderCampaignFailureOperationalMetadataV1,
): string[] {
  const issues: string[] = [];
  if (!record(value) || !exactKeys(value, [
    "responseId", "returnedModel", "serviceTier", "generationLatencyMs", "usage",
    "actualCostUsd",
  ])) return ["failure_operational_metadata_contract_invalid"];
  if (value.responseId !== null && !ID.test(value.responseId)) {
    issues.push("failure_response_id_invalid");
  }
  if ([value.returnedModel, value.serviceTier].some((item) =>
    item !== null && (typeof item !== "string" || !SAFE_TEXT.test(item)))) {
    issues.push("failure_provider_identity_invalid");
  }
  if (!nonNegativeIntegerOrNull(value.generationLatencyMs) ||
    !record(value.usage) || !exactKeys(value.usage, [
      "inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens",
    ]) || Object.values(value.usage).some((item) => !nonNegativeIntegerOrNull(item))) {
    issues.push("failure_usage_or_latency_invalid");
  } else {
    const usage = value.usage;
    if (usage.cachedInputTokens !== null && usage.inputTokens !== null &&
      usage.cachedInputTokens > usage.inputTokens) issues.push("failure_usage_inconsistent");
    if (usage.reasoningTokens !== null && usage.outputTokens !== null &&
      usage.reasoningTokens > usage.outputTokens) issues.push("failure_usage_inconsistent");
    if (usage.totalTokens !== null && usage.inputTokens !== null &&
      usage.outputTokens !== null &&
      usage.totalTokens !== usage.inputTokens + usage.outputTokens) {
      issues.push("failure_usage_inconsistent");
    }
  }
  if (value.actualCostUsd !== null &&
    (!Number.isFinite(value.actualCostUsd) || value.actualCostUsd < 0)) {
    issues.push("failure_actual_cost_invalid");
  }
  return issues;
}

function unavailableFields(
  value: CanonicalProviderCampaignFailureOperationalMetadataV1,
): string[] {
  const values = [
    value.responseId,
    value.returnedModel,
    value.serviceTier,
    value.generationLatencyMs,
    value.usage.inputTokens,
    value.usage.cachedInputTokens,
    value.usage.outputTokens,
    value.usage.reasoningTokens,
    value.usage.totalTokens,
    value.actualCostUsd,
  ];
  return METADATA_PATHS.filter((_, index) => values[index] === null);
}

function authorizationValid(
  value: CanonicalProviderCampaignFailureEvidenceV1["authorization"],
): boolean {
  return record(value) && exactKeys(value, [
    "inputTokens", "maxInputTokens", "maxOutputTokens", "configuredMaxTotalTokens",
    "maximumAuthorizedTotalTokens", "theoreticalUncachedCommitmentUsd",
    "maximumCommitmentUsd", "tokenPreflightLatencyMs", "status",
  ]) && value.status === "PASS" && [
    value.inputTokens,
    value.maxInputTokens,
    value.maxOutputTokens,
    value.configuredMaxTotalTokens,
    value.maximumAuthorizedTotalTokens,
    value.tokenPreflightLatencyMs,
  ].every((item) => Number.isInteger(item) && item >= 0) &&
    value.inputTokens <= value.maxInputTokens &&
    value.maximumAuthorizedTotalTokens === value.inputTokens + value.maxOutputTokens &&
    value.maximumAuthorizedTotalTokens <= value.configuredMaxTotalTokens &&
    Number.isFinite(value.theoreticalUncachedCommitmentUsd) &&
    value.theoreticalUncachedCommitmentUsd >= 0 &&
    Number.isFinite(value.maximumCommitmentUsd) && value.maximumCommitmentUsd >= 0 &&
    value.theoreticalUncachedCommitmentUsd <= value.maximumCommitmentUsd;
}

export function captureCanonicalProviderContractFailureEvidence(
  input: CaptureCanonicalProviderContractFailureInput,
): { status: "captured"; artifact: CanonicalProviderCampaignFailureEvidenceV1 } |
  { status: "rejected"; issues: string[] } {
  const issues = forbiddenPersistenceIssues(input);
  if (!ID.test(input.campaignId) || !ID.test(input.attemptId) ||
    !Number.isInteger(input.position) || input.position < 1 ||
    input.sourceCase.provenance.kind !== "purpose_written_synthetic" ||
    !GIT_OBJECT_ID.test(input.baselineCommit) ||
    !HASH.test(input.configurationFingerprint) ||
    typeof input.configuredProvider !== "string" ||
    input.configuredProvider.trim().length === 0 || input.configuredProvider.length > 120 ||
    typeof input.configuredModel !== "string" || input.configuredModel.trim().length === 0 ||
    input.configuredModel.length > 160) {
    issues.push("failure_capture_identity_or_configuration_invalid");
  }
  const authorization = { ...input.authorization, status: "PASS" as const };
  if (!authorizationValid(authorization)) issues.push("failure_authorization_invalid");
  issues.push(...operationalMetadataIssues(input.operationalMetadata));
  const diagnostic = input.validation.preMatcherDiagnostic;
  if (input.validation.status !== "invalid" ||
    input.validation.category !== "evaluation_result_contract_invalid" ||
    diagnostic === undefined || diagnostic.issues.length !== 1 ||
    diagnostic.issues[0].stage !== "evaluation_result_contract") {
    issues.push("failure_contract_diagnostic_invalid");
  }
  if (issues.length > 0 || diagnostic === undefined) {
    return { status: "rejected", issues: [...new Set(issues)] };
  }
  const diagnosticIssue = diagnostic.issues[0];
  const metadata = structuredClone(input.operationalMetadata);
  const withoutHash = {
    version: CANONICAL_PROVIDER_CAMPAIGN_FAILURE_EVIDENCE_VERSION,
    identity: {
      campaignId: input.campaignId,
      attemptId: input.attemptId,
      position: input.position,
      caseId: input.sourceCase.case_id,
      caseVersion: input.sourceCase.case_version,
      caseSha256: canonicalEvidenceSha256(input.sourceCase),
      locale: input.sourceCase.language,
      semanticClusterId: input.sourceCase.provenance.semantic_cluster_id,
    },
    frozenConfiguration: {
      baselineCommit: input.baselineCommit,
      configurationFingerprint: input.configurationFingerprint,
      reviewPolicyVersion: STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
      inputContractVersion: CANONICAL_PROVIDER_EVALUATION_INPUT_VERSION,
      resultContractVersion: CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
      taxonomyVersion: CANONICAL_PROVIDER_EVALUATION_TAXONOMY_VERSION,
      taskProfileVersion: CANONICAL_PROVIDER_EVALUATION_TASK_PROFILE_VERSION,
      boundaryVersion: CANONICAL_PROVIDER_EVALUATION_BOUNDARY_VERSION,
      aggregationVersion: CANONICAL_PROVIDER_EVALUATION_AGGREGATION_VERSION,
    },
    authorization,
    provider: {
      configuredProvider: input.configuredProvider,
      configuredModel: input.configuredModel,
      responseId: metadata.responseId,
      returnedModel: metadata.returnedModel,
      serviceTier: metadata.serviceTier,
    },
    execution: {
      generationAttempted: true as const,
      generationCount: 1 as const,
      retries: 0 as const,
      reruns: 0 as const,
      operationalProviderResponseReceived: true as const,
      terminalStatus: "PROVIDER_CONTRACT_HARD_FAIL" as const,
      classification: "evaluation_result_contract_invalid" as const,
      generationLatencyMs: metadata.generationLatencyMs,
      usage: metadata.usage,
      actualCostUsd: metadata.actualCostUsd,
      unavailableFields: unavailableFields(metadata),
    },
    contractFailureDiagnostic: {
      stage: "evaluation_result_contract" as const,
      code: diagnosticIssue.code,
      path: diagnosticIssue.path,
      candidateId: diagnosticIssue.candidateId,
      receivedLength: diagnosticIssue.receivedLength,
      truncated: diagnostic.truncated,
    },
    downstreamState: {
      matcherExecuted: false as const,
      evidenceV2Created: false as const,
      blindPacketCreated: false as const,
      humanReviewStatus: "NOT_REACHED" as const,
      comparableValidatedResult: false as const,
    },
    privacyCaptureAttestation: {
      fixtureClassification: "synthetic_non_personal" as const,
      evaluationOnly: true as const,
      secretScan: "PASS" as const,
      personalDataPolicyScan: "PASS" as const,
      chainOfThoughtAbsent: true as const,
      rawHttpRequestPersisted: false as const,
      rawHttpResponsePersisted: false as const,
      rawProviderPayloadPersisted: false as const,
      rawPromptPersisted: false as const,
      rejectedProviderOutputPersisted: false as const,
      hiddenOraclePersisted: false as const,
    },
  };
  const artifact: CanonicalProviderCampaignFailureEvidenceV1 = {
    ...withoutHash,
    artifactHash: canonicalEvidenceSha256(withoutHash),
  };
  const expected = {
    ...artifact.identity,
    baselineCommit: artifact.frozenConfiguration.baselineCommit,
    configurationFingerprint: artifact.frozenConfiguration.configurationFingerprint,
  };
  const validation = validateCanonicalProviderCampaignFailureEvidence(artifact, expected);
  return validation.valid ? { status: "captured", artifact }
    : { status: "rejected", issues: validation.issues };
}

export function validateCanonicalProviderCampaignFailureEvidence(
  value: CanonicalProviderCampaignFailureEvidenceV1,
  expected: CanonicalProviderCampaignFailureExpectedLinkage,
): { valid: boolean; issues: string[] } {
  const issues = forbiddenPersistenceIssues(value);
  if (!record(value) || !exactKeys(value, [
    "version", "artifactHash", "identity", "frozenConfiguration", "authorization",
    "provider", "execution", "contractFailureDiagnostic", "downstreamState",
    "privacyCaptureAttestation",
  ]) || value.version !== CANONICAL_PROVIDER_CAMPAIGN_FAILURE_EVIDENCE_VERSION) {
    return { valid: false, issues: [...issues, "failure_artifact_contract_invalid"] };
  }
  const { artifactHash, ...withoutHash } = value;
  if (!HASH.test(artifactHash) || artifactHash !== canonicalEvidenceSha256(withoutHash)) {
    issues.push("failure_artifact_hash_invalid");
  }
  const identity = value.identity;
  if (!record(identity) || !exactKeys(identity, [
    "campaignId", "attemptId", "position", "caseId", "caseVersion", "caseSha256",
    "locale", "semanticClusterId",
  ]) || !ID.test(identity.campaignId) || !ID.test(identity.attemptId) ||
    !Number.isInteger(identity.position) || identity.position < 1 ||
    !ID.test(identity.caseId) || !ID.test(identity.semanticClusterId) ||
    typeof identity.caseVersion !== "string" || identity.caseVersion.length === 0 ||
    !HASH.test(identity.caseSha256) || !["es", "en", "ru", "zh"].includes(identity.locale)) {
    issues.push("failure_identity_invalid");
  }
  if (identity.campaignId !== expected.campaignId || identity.attemptId !== expected.attemptId ||
    identity.position !== expected.position || identity.caseId !== expected.caseId ||
    identity.caseVersion !== expected.caseVersion || identity.caseSha256 !== expected.caseSha256 ||
    identity.locale !== expected.locale || identity.semanticClusterId !== expected.semanticClusterId) {
    issues.push("failure_attempt_linkage_invalid");
  }
  const frozen = value.frozenConfiguration;
  if (!record(frozen) || !exactKeys(frozen, [
    "baselineCommit", "configurationFingerprint", "reviewPolicyVersion",
    "inputContractVersion", "resultContractVersion", "taxonomyVersion",
    "taskProfileVersion", "boundaryVersion", "aggregationVersion",
  ]) || frozen.baselineCommit !== expected.baselineCommit ||
    frozen.configurationFingerprint !== expected.configurationFingerprint ||
    !GIT_OBJECT_ID.test(frozen.baselineCommit) || !HASH.test(frozen.configurationFingerprint) ||
    frozen.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION ||
    frozen.inputContractVersion !== CANONICAL_PROVIDER_EVALUATION_INPUT_VERSION ||
    frozen.resultContractVersion !== CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION ||
    frozen.taxonomyVersion !== CANONICAL_PROVIDER_EVALUATION_TAXONOMY_VERSION ||
    frozen.taskProfileVersion !== CANONICAL_PROVIDER_EVALUATION_TASK_PROFILE_VERSION ||
    frozen.boundaryVersion !== CANONICAL_PROVIDER_EVALUATION_BOUNDARY_VERSION ||
    frozen.aggregationVersion !== CANONICAL_PROVIDER_EVALUATION_AGGREGATION_VERSION) {
    issues.push("failure_frozen_configuration_invalid");
  }
  if (!authorizationValid(value.authorization)) issues.push("failure_authorization_invalid");
  const provider = value.provider;
  if (!record(provider) || !exactKeys(provider, [
    "configuredProvider", "configuredModel", "responseId", "returnedModel", "serviceTier",
  ]) || typeof provider.configuredProvider !== "string" ||
    provider.configuredProvider.trim().length === 0 ||
    typeof provider.configuredModel !== "string" || provider.configuredModel.trim().length === 0) {
    issues.push("failure_provider_identity_invalid");
  }
  const execution = value.execution;
  const metadata = record(provider) && record(execution) ? {
    responseId: provider.responseId,
    returnedModel: provider.returnedModel,
    serviceTier: provider.serviceTier,
    generationLatencyMs: execution.generationLatencyMs,
    usage: execution.usage,
    actualCostUsd: execution.actualCostUsd,
  } as CanonicalProviderCampaignFailureOperationalMetadataV1 : null;
  if (!record(execution) || !exactKeys(execution, [
    "generationAttempted", "generationCount", "retries", "reruns",
    "operationalProviderResponseReceived", "terminalStatus", "classification",
    "generationLatencyMs", "usage", "actualCostUsd", "unavailableFields",
  ]) || execution.generationAttempted !== true || execution.generationCount !== 1 ||
    execution.retries !== 0 || execution.reruns !== 0 ||
    execution.operationalProviderResponseReceived !== true ||
    execution.terminalStatus !== "PROVIDER_CONTRACT_HARD_FAIL" ||
    execution.classification !== "evaluation_result_contract_invalid" || metadata === null) {
    issues.push("failure_execution_state_invalid");
  } else {
    issues.push(...operationalMetadataIssues(metadata));
    if (!Array.isArray(execution.unavailableFields) ||
      canonicalEvidenceSha256(execution.unavailableFields) !==
        canonicalEvidenceSha256(unavailableFields(metadata))) {
      issues.push("failure_unavailable_metadata_invalid");
    }
  }
  const diagnostic = value.contractFailureDiagnostic;
  if (!record(diagnostic) || !exactKeys(diagnostic, [
    "stage", "code", "path", "candidateId", "receivedLength", "truncated",
  ]) || diagnostic.stage !== "evaluation_result_contract" ||
    typeof diagnostic.code !== "string" || !SAFE_TEXT.test(diagnostic.code) ||
    typeof diagnostic.path !== "string" || !SAFE_TEXT.test(diagnostic.path) ||
    (diagnostic.candidateId !== null && !ID.test(diagnostic.candidateId)) ||
    !nonNegativeIntegerOrNull(diagnostic.receivedLength) ||
    typeof diagnostic.truncated !== "boolean") {
    issues.push("failure_contract_diagnostic_invalid");
  }
  const downstream = value.downstreamState;
  if (!record(downstream) || !exactKeys(downstream, [
    "matcherExecuted", "evidenceV2Created", "blindPacketCreated", "humanReviewStatus",
    "comparableValidatedResult",
  ]) || downstream.matcherExecuted !== false || downstream.evidenceV2Created !== false ||
    downstream.blindPacketCreated !== false || downstream.humanReviewStatus !== "NOT_REACHED" ||
    downstream.comparableValidatedResult !== false) {
    issues.push("failure_downstream_state_invalid");
  }
  const privacy = value.privacyCaptureAttestation;
  if (!record(privacy) || !exactKeys(privacy, [
    "fixtureClassification", "evaluationOnly", "secretScan", "personalDataPolicyScan",
    "chainOfThoughtAbsent", "rawHttpRequestPersisted", "rawHttpResponsePersisted",
    "rawProviderPayloadPersisted", "rawPromptPersisted", "rejectedProviderOutputPersisted",
    "hiddenOraclePersisted",
  ]) || privacy.fixtureClassification !== "synthetic_non_personal" ||
    privacy.evaluationOnly !== true || privacy.secretScan !== "PASS" ||
    privacy.personalDataPolicyScan !== "PASS" || privacy.chainOfThoughtAbsent !== true ||
    privacy.rawHttpRequestPersisted !== false || privacy.rawHttpResponsePersisted !== false ||
    privacy.rawProviderPayloadPersisted !== false || privacy.rawPromptPersisted !== false ||
    privacy.rejectedProviderOutputPersisted !== false || privacy.hiddenOraclePersisted !== false) {
    issues.push("failure_privacy_attestation_invalid");
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}
