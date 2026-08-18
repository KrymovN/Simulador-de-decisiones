import "server-only";

import { canonicalEvidenceSha256 } from "./canonical-provider-campaign-evidence";

export const CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_EVIDENCE_VERSION =
  "canonical-provider-campaign-migration-evidence.1" as const;

export const CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_REASON =
  "EVALUATION_BOUNDARY_CORRECTION" as const;

export type CanonicalProviderCampaignMigrationEvidenceV1 = {
  version: typeof CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_EVIDENCE_VERSION;
  artifactHash: string;
  campaignIdentity: {
    campaignId: string;
    status: "OPEN";
    provider: "openai";
    model: "gpt-5.6-terra";
    configurationFingerprint: string;
    frozenBaselineCommit: string;
    frozenCaseOrderSha256: string;
    frozenCaseCount: number;
    totalPlannedLogicalPositions: number;
  };
  semanticMigration: {
    reason: typeof CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_REASON;
    fromAcceptedProjectionVersion: null;
    toAcceptedProjectionVersion: "canonical-accepted-evaluation-projection.1";
    providerConfigurationChanged: false;
    deterministicEvaluationSemanticsChanged: true;
  };
  retainedComparableExecution: {
    status: "RETAINED_COMPARABLE";
    position: 1;
    caseId: string;
    executionHash: string;
    evidenceV2PhysicalSha256: string;
    blindPacketPhysicalSha256: string;
    humanReviewArtifactHash: string;
    humanReviewPhysicalSha256: string;
    equivalenceProof: {
      acceptedProjectionVersion: "canonical-accepted-evaluation-projection.1";
      historicalValidatedResultSha256: string;
      replayAcceptedResultSha256: string;
      historicalCandidateMaterialSha256: string;
      replayAcceptedCandidateMaterialSha256: string;
      historicalAnnotationsSha256: string;
      replayAcceptedAnnotationsSha256: string;
      historicalMatcherClassification: "SEMANTIC_FAIL";
      replayMatcherClassification: "SEMANTIC_FAIL";
      historicalMatcherSemanticSha256: string;
      replayMatcherSemanticSha256: string;
      observedCandidateCount: number;
      acceptedCandidateCount: number;
      rejectedCandidateCount: number;
      normalizedCandidateCount: number;
      mergedCandidateCount: number;
      silentDropCount: number;
      prunedAnnotationCount: number;
      rewrittenAnnotationCount: number;
      humanReviewReusable: true;
    };
  };
  supersededHistoricalAttempt: {
    status: "HISTORICAL_QUALIFICATION_CONSEQUENCE_SUPERSEDED";
    reason: typeof CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_REASON;
    position: 2;
    caseId: string;
    attemptId: string;
    failureArtifactHash: string;
    failureArtifactPhysicalSha256: string;
    historicalTerminalStatus: "PROVIDER_CONTRACT_HARD_FAIL";
    historicalClassification: "evaluation_result_contract_invalid";
    historicalDiagnosticCode: "imperative_instruction_forbidden";
    historicalProviderAttemptCount: 1;
    historicalGenerationCount: 1;
    currentComparableExecution: false;
    matcherEvidenceCreated: false;
    humanReviewEvidenceCreated: false;
    currentProviderHardGateParticipation:
      "EXCLUDED_BY_VALIDATED_EVALUATION_BOUNDARY_MIGRATION";
    replacementRequirement: "COMPARABLE_REPLACEMENT_REQUIRED";
  };
  coverage: {
    historicalPhysicalProviderGenerations: 2;
    retainedComparableExecutions: 1;
    supersededHistoricalAttempts: 1;
    currentComparableReplacementRequiredPositions: [2];
    untouchedLogicalPositions: { first: 3; last: 160; count: 158 };
    providerOperationsPerformedByMigration: 0;
  };
};

export type CanonicalProviderCampaignMigrationEvidenceInput = {
  kind: "CAMPAIGN_SEMANTICS_MIGRATION";
  artifact: CanonicalProviderCampaignMigrationEvidenceV1;
};

export type BuildCanonicalProviderCampaignMigrationEvidenceInput = Omit<
  CanonicalProviderCampaignMigrationEvidenceV1,
  "version" | "artifactHash"
>;

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_OBJECT_ID = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/;
const FORBIDDEN_KEYS = /^(?:raw(?:http|prompt|provider|request|response)|rejected(?:output|provideroutput)|chainofthought|hiddenoracle|hiddenreasoning)$/i;

function forbiddenPersistenceIssues(value: unknown): string[] {
  const issues: string[] = [];
  const visit = (item: unknown, path: string): void => {
    if (Array.isArray(item)) {
      item.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    if (item === null || typeof item !== "object") return;
    for (const [key, entry] of Object.entries(item as Record<string, unknown>)) {
      const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (FORBIDDEN_KEYS.test(normalized)) issues.push(`forbidden_field:${path}.${key}`);
      else visit(entry, `${path}.${key}`);
    }
  };
  visit(value, "migration");
  return issues;
}

export function buildCanonicalProviderCampaignMigrationEvidence(
  input: BuildCanonicalProviderCampaignMigrationEvidenceInput,
): CanonicalProviderCampaignMigrationEvidenceV1 {
  const withoutHash = {
    version: CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_EVIDENCE_VERSION,
    ...structuredClone(input),
  };
  return {
    ...withoutHash,
    artifactHash: canonicalEvidenceSha256(withoutHash),
  };
}

export function validateCanonicalProviderCampaignMigrationEvidence(
  value: CanonicalProviderCampaignMigrationEvidenceV1,
): { valid: boolean; issues: string[] } {
  const issues = forbiddenPersistenceIssues(value);
  if (value === null || typeof value !== "object") {
    return { valid: false, issues: ["migration_evidence_not_object"] };
  }
  const { artifactHash, ...withoutHash } = value;
  if (value.version !== CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_EVIDENCE_VERSION ||
    !SHA256.test(artifactHash) || artifactHash !== canonicalEvidenceSha256(withoutHash)) {
    issues.push("migration_artifact_hash_invalid");
  }
  const campaign = value.campaignIdentity;
  if (!ID.test(campaign.campaignId) || campaign.status !== "OPEN" ||
    campaign.provider !== "openai" || campaign.model !== "gpt-5.6-terra" ||
    !SHA256.test(campaign.configurationFingerprint) ||
    !GIT_OBJECT_ID.test(campaign.frozenBaselineCommit) ||
    !SHA256.test(campaign.frozenCaseOrderSha256) || campaign.frozenCaseCount !== 160 ||
    campaign.totalPlannedLogicalPositions !== 160) {
    issues.push("migration_campaign_identity_invalid");
  }
  const semantics = value.semanticMigration;
  if (semantics.reason !== CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_REASON ||
    semantics.fromAcceptedProjectionVersion !== null ||
    semantics.toAcceptedProjectionVersion !==
      "canonical-accepted-evaluation-projection.1" ||
    semantics.providerConfigurationChanged !== false ||
    semantics.deterministicEvaluationSemanticsChanged !== true) {
    issues.push("migration_semantic_transition_invalid");
  }
  const retained = value.retainedComparableExecution;
  const proof = retained.equivalenceProof;
  const replayHashes = [
    proof.historicalValidatedResultSha256,
    proof.replayAcceptedResultSha256,
    proof.historicalCandidateMaterialSha256,
    proof.replayAcceptedCandidateMaterialSha256,
    proof.historicalAnnotationsSha256,
    proof.replayAcceptedAnnotationsSha256,
    proof.historicalMatcherSemanticSha256,
    proof.replayMatcherSemanticSha256,
  ];
  if (retained.status !== "RETAINED_COMPARABLE" || retained.position !== 1 ||
    !ID.test(retained.caseId) || !SHA256.test(retained.executionHash) ||
    !SHA256.test(retained.evidenceV2PhysicalSha256) ||
    !SHA256.test(retained.blindPacketPhysicalSha256) ||
    !SHA256.test(retained.humanReviewArtifactHash) ||
    !SHA256.test(retained.humanReviewPhysicalSha256) ||
    replayHashes.some((hash) => !SHA256.test(hash)) ||
    proof.acceptedProjectionVersion !== "canonical-accepted-evaluation-projection.1" ||
    proof.historicalValidatedResultSha256 !== proof.replayAcceptedResultSha256 ||
    proof.historicalCandidateMaterialSha256 !==
      proof.replayAcceptedCandidateMaterialSha256 ||
    proof.historicalAnnotationsSha256 !== proof.replayAcceptedAnnotationsSha256 ||
    proof.historicalMatcherClassification !== "SEMANTIC_FAIL" ||
    proof.replayMatcherClassification !== proof.historicalMatcherClassification ||
    proof.historicalMatcherSemanticSha256 !== proof.replayMatcherSemanticSha256 ||
    proof.observedCandidateCount !== 8 || proof.acceptedCandidateCount !== 8 ||
    proof.rejectedCandidateCount !== 0 || proof.normalizedCandidateCount !== 0 ||
    proof.mergedCandidateCount !== 0 || proof.silentDropCount !== 0 ||
    proof.prunedAnnotationCount !== 0 || proof.rewrittenAnnotationCount !== 0 ||
    proof.humanReviewReusable !== true) {
    issues.push("retained_execution_equivalence_proof_invalid");
  }
  const superseded = value.supersededHistoricalAttempt;
  if (superseded.status !==
      "HISTORICAL_QUALIFICATION_CONSEQUENCE_SUPERSEDED" ||
    superseded.reason !== CANONICAL_PROVIDER_CAMPAIGN_MIGRATION_REASON ||
    superseded.position !== 2 || !ID.test(superseded.caseId) ||
    !ID.test(superseded.attemptId) || !SHA256.test(superseded.failureArtifactHash) ||
    !SHA256.test(superseded.failureArtifactPhysicalSha256) ||
    superseded.historicalTerminalStatus !== "PROVIDER_CONTRACT_HARD_FAIL" ||
    superseded.historicalClassification !== "evaluation_result_contract_invalid" ||
    superseded.historicalDiagnosticCode !== "imperative_instruction_forbidden" ||
    superseded.historicalProviderAttemptCount !== 1 ||
    superseded.historicalGenerationCount !== 1 ||
    superseded.currentComparableExecution !== false ||
    superseded.matcherEvidenceCreated !== false ||
    superseded.humanReviewEvidenceCreated !== false ||
    superseded.currentProviderHardGateParticipation !==
      "EXCLUDED_BY_VALIDATED_EVALUATION_BOUNDARY_MIGRATION" ||
    superseded.replacementRequirement !== "COMPARABLE_REPLACEMENT_REQUIRED") {
    issues.push("superseded_historical_attempt_invalid");
  }
  const coverage = value.coverage;
  if (coverage.historicalPhysicalProviderGenerations !== 2 ||
    coverage.retainedComparableExecutions !== 1 ||
    coverage.supersededHistoricalAttempts !== 1 ||
    coverage.currentComparableReplacementRequiredPositions.length !== 1 ||
    coverage.currentComparableReplacementRequiredPositions[0] !== 2 ||
    coverage.untouchedLogicalPositions.first !== 3 ||
    coverage.untouchedLogicalPositions.last !== 160 ||
    coverage.untouchedLogicalPositions.count !== 158 ||
    coverage.providerOperationsPerformedByMigration !== 0) {
    issues.push("migration_coverage_invalid");
  }
  if (retained.caseId === superseded.caseId) {
    issues.push("migration_positions_not_distinct");
  }
  return { valid: issues.length === 0, issues };
}
