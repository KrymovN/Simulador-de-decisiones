import "server-only";

import { canonicalEvidenceSha256 } from "./canonical-provider-campaign-evidence";
import {
  CANONICAL_HUMAN_REVIEW_DIMENSIONS,
  STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
  validateCanonicalProviderCampaignReviewEvidence,
  type CanonicalHumanDimensionReviewRecord,
  type CanonicalHumanReviewDimension,
  type CanonicalProviderCampaignReviewEvidence,
  type CanonicalProviderPrivacyReviewRecord,
  type CanonicalReviewLocale,
  type CanonicalReviewScore,
} from "./canonical-provider-review-policy";

export const CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_VERSION =
  "canonical-provider-human-review-evidence.1" as const;

export type CanonicalHumanBinaryAnswer = "SÍ" | "NO";

export type CanonicalProviderHumanReviewSubmissionV1 = {
  identity: {
    caseId: string;
    locale: CanonicalReviewLocale;
    semanticClusterId: string;
    reviewedExecutionHash: string;
  };
  reviewPolicyVersion: typeof STAGE_9_PROVIDER_REVIEW_POLICY_VERSION;
  reviewer: {
    reviewerKind: "HUMAN_REVIEWER";
    roleId: "independent-reviewer";
    version: "1";
    personalIdentityStored: false;
  };
  dimensionReviews: Record<CanonicalHumanReviewDimension, {
    score: CanonicalReviewScore;
    commentParagraphs: string[];
  }>;
  privacyReview: {
    unnecessaryPersonalInformation: {
      answer: CanonicalHumanBinaryAnswer;
      commentParagraphs: string[];
    };
    sensitivePrivateInformation: {
      answer: CanonicalHumanBinaryAnswer;
      commentParagraphs: string[];
    };
    dataMinimization: {
      answer: CanonicalHumanBinaryAnswer;
      commentParagraphs: string[];
    };
    criticalPrivacyProblem: {
      answer: CanonicalHumanBinaryAnswer;
      commentParagraphs: string[];
    };
    globalAssessment: {
      answer: string;
      commentParagraphs: string[];
    };
  };
  generalAssessment: {
    usefulForRealPerson: {
      answer: CanonicalHumanBinaryAnswer;
      commentParagraphs: string[];
    };
    mainImprovement: string;
    otherImportantUnrepresentedProblem: {
      answer: CanonicalHumanBinaryAnswer;
      commentParagraphs: string[];
    };
  };
  independenceConfirmation: CanonicalHumanBinaryAnswer;
  reviewLanguage: CanonicalReviewLocale;
};

export type CanonicalProviderHumanReviewEvidenceV1 = {
  version: typeof CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_VERSION;
  artifactHash: string;
  verbatimSubmission: CanonicalProviderHumanReviewSubmissionV1;
  normalizedReview: {
    humanDimensionReviews: CanonicalHumanDimensionReviewRecord[];
    providerPrivacyReviews: CanonicalProviderPrivacyReviewRecord[];
  };
};

export type CanonicalProviderHumanReviewExpectedLinkage = {
  caseId: string;
  locale: CanonicalReviewLocale;
  semanticClusterId: string;
  executionHash: string;
};

const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/;
const FORBIDDEN_KEYS = new Set([
  "email",
  "hiddenoracle",
  "matcher",
  "name",
  "oracle",
  "revieweremail",
  "reviewername",
]);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) =>
    key === expected[index]);
}

function paragraphsValid(value: unknown, allowEmpty = false): value is string[] {
  return Array.isArray(value) && value.length <= 16 &&
    (allowEmpty || value.length > 0) && value.every((paragraph) =>
      typeof paragraph === "string" && paragraph.trim().length > 0 &&
      paragraph.length <= 5_000);
}

function answerWithCommentsValid(value: unknown, allowEmptyComments = false): boolean {
  return record(value) && exactKeys(value, ["answer", "commentParagraphs"]) &&
    (value.answer === "SÍ" || value.answer === "NO") &&
    paragraphsValid(value.commentParagraphs, allowEmptyComments);
}

function forbiddenContentIssues(value: unknown): string[] {
  const issues: string[] = [];
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (!record(item)) return;
    for (const [key, child] of Object.entries(item)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase().replaceAll("_", ""))) {
        issues.push(`human_review_forbidden_field:${key}`);
      }
      visit(child);
    }
  };
  visit(value);
  const serialized = JSON.stringify(value);
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(serialized)) {
    issues.push("human_review_reviewer_pii_detected");
  }
  if (/\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+\S+)\b/i.test(serialized)) {
    issues.push("human_review_secret_detected");
  }
  return issues;
}

function submissionIssues(value: unknown): string[] {
  const issues: string[] = [];
  if (!record(value) || !exactKeys(value, [
    "identity",
    "reviewPolicyVersion",
    "reviewer",
    "dimensionReviews",
    "privacyReview",
    "generalAssessment",
    "independenceConfirmation",
    "reviewLanguage",
  ])) return ["human_review_submission_contract_invalid"];

  const identity = value.identity;
  if (!record(identity) || !exactKeys(identity, [
    "caseId", "locale", "semanticClusterId", "reviewedExecutionHash",
  ]) || !ID.test(String(identity.caseId)) ||
    !["es", "en", "ru", "zh"].includes(String(identity.locale)) ||
    !ID.test(String(identity.semanticClusterId)) ||
    !HASH.test(String(identity.reviewedExecutionHash))) {
    issues.push("human_review_submission_identity_invalid");
  }
  if (value.reviewPolicyVersion !== STAGE_9_PROVIDER_REVIEW_POLICY_VERSION) {
    issues.push("human_review_policy_version_invalid");
  }
  const reviewer = value.reviewer;
  if (!record(reviewer) || !exactKeys(reviewer, [
    "reviewerKind", "roleId", "version", "personalIdentityStored",
  ]) || reviewer.reviewerKind !== "HUMAN_REVIEWER" ||
    reviewer.roleId !== "independent-reviewer" || reviewer.version !== "1" ||
    reviewer.personalIdentityStored !== false) {
    issues.push("human_review_reviewer_provenance_invalid");
  }
  const dimensions = value.dimensionReviews;
  if (!record(dimensions) || !exactKeys(dimensions, CANONICAL_HUMAN_REVIEW_DIMENSIONS)) {
    issues.push("human_review_dimensions_invalid");
  } else {
    for (const dimension of CANONICAL_HUMAN_REVIEW_DIMENSIONS) {
      const item = dimensions[dimension];
      if (!record(item) || !exactKeys(item, ["score", "commentParagraphs"]) ||
        !Number.isInteger(item.score) || Number(item.score) < 0 || Number(item.score) > 4 ||
        !paragraphsValid(item.commentParagraphs)) {
        issues.push(`human_review_dimension_invalid:${dimension}`);
      }
    }
  }
  const privacy = value.privacyReview;
  if (!record(privacy) || !exactKeys(privacy, [
    "unnecessaryPersonalInformation",
    "sensitivePrivateInformation",
    "dataMinimization",
    "criticalPrivacyProblem",
    "globalAssessment",
  ])) {
    issues.push("human_review_privacy_invalid");
  } else {
    for (const key of [
      "unnecessaryPersonalInformation",
      "sensitivePrivateInformation",
      "dataMinimization",
      "criticalPrivacyProblem",
    ]) {
      if (!answerWithCommentsValid(privacy[key])) {
        issues.push(`human_review_privacy_answer_invalid:${key}`);
      }
    }
    const globalAssessment = privacy.globalAssessment;
    if (!record(globalAssessment) || !exactKeys(globalAssessment, [
      "answer", "commentParagraphs",
    ]) || typeof globalAssessment.answer !== "string" ||
      globalAssessment.answer.trim().length === 0 || globalAssessment.answer.length > 120 ||
      !paragraphsValid(globalAssessment.commentParagraphs)) {
      issues.push("human_review_global_privacy_assessment_invalid");
    }
  }
  const general = value.generalAssessment;
  if (!record(general) || !exactKeys(general, [
    "usefulForRealPerson", "mainImprovement", "otherImportantUnrepresentedProblem",
  ]) || !answerWithCommentsValid(general.usefulForRealPerson) ||
    typeof general.mainImprovement !== "string" ||
    general.mainImprovement.trim().length === 0 || general.mainImprovement.length > 600 ||
    !answerWithCommentsValid(general.otherImportantUnrepresentedProblem, true)) {
    issues.push("human_review_general_assessment_invalid");
  }
  const identityLocale = record(identity) ? identity.locale : null;
  if (value.independenceConfirmation !== "SÍ" ||
    value.reviewLanguage !== identityLocale) {
    issues.push("human_review_attestation_invalid");
  }
  return issues;
}

const noAdjudication = {
  required: false as const,
  status: "NOT_REQUIRED" as const,
  reviewer: null,
  verdict: null,
  reason: null,
};

export function normalizeCanonicalProviderHumanReview(
  submission: CanonicalProviderHumanReviewSubmissionV1,
): CanonicalProviderHumanReviewEvidenceV1["normalizedReview"] {
  const identity = submission.identity;
  const reviewer = {
    reviewerKind: submission.reviewer.reviewerKind,
    roleId: submission.reviewer.roleId,
    version: submission.reviewer.version,
  };
  const humanDimensionReviews = CANONICAL_HUMAN_REVIEW_DIMENSIONS.map((dimension) => {
    const source = submission.dimensionReviews[dimension];
    return {
      recordVersion: "canonical-human-dimension-review-record.1",
      caseId: identity.caseId,
      locale: identity.locale,
      semanticClusterId: identity.semanticClusterId,
      reviewedExecutionHash: identity.reviewedExecutionHash,
      dimension,
      status: source.score >= 3 ? "PASS" as const : "FAIL" as const,
      score: source.score,
      criticalConcern: "NONE" as const,
      reason: source.commentParagraphs.join("\n"),
      evidencePointers: [
        `verbatimSubmission.dimensionReviews.${dimension}`,
        `execution:${identity.reviewedExecutionHash}`,
      ],
      reviewPolicyVersion: submission.reviewPolicyVersion,
      reviewer,
      adjudication: noAdjudication,
      reviewedAt: null,
    };
  });
  const privacy = submission.privacyReview;
  const privacyPass = privacy.unnecessaryPersonalInformation.answer === "NO" &&
    privacy.sensitivePrivateInformation.answer === "NO" &&
    privacy.dataMinimization.answer === "SÍ" &&
    privacy.criticalPrivacyProblem.answer === "NO" &&
    privacy.globalAssessment.answer === "ADECUADO";
  const providerPrivacyReviews: CanonicalProviderPrivacyReviewRecord[] = [{
    recordVersion: "canonical-provider-privacy-review-record.1",
    caseId: identity.caseId,
    locale: identity.locale,
    semanticClusterId: identity.semanticClusterId,
    reviewedExecutionHash: identity.reviewedExecutionHash,
    status: privacyPass ? "PASS" : "FAIL",
    criticalProviderPrivacyViolation: privacy.criticalPrivacyProblem.answer === "SÍ",
    reason: privacy.globalAssessment.commentParagraphs.join("\n"),
    evidencePointers: [
      "verbatimSubmission.privacyReview",
      `execution:${identity.reviewedExecutionHash}`,
    ],
    reviewPolicyVersion: submission.reviewPolicyVersion,
    reviewer,
    adjudication: noAdjudication,
    reviewedAt: null,
  }];
  return { humanDimensionReviews, providerPrivacyReviews };
}

export function canonicalProviderCampaignReviewEvidenceFromHumanArtifact(
  value: CanonicalProviderHumanReviewEvidenceV1,
  latencyEvidence: CanonicalProviderCampaignReviewEvidence["latencyEvidence"] = {
    policyStatus: "DOCUMENTED_NOT_BLOCKING_BY_NEW_THRESHOLD",
    executions: [],
    profile: null,
  },
): CanonicalProviderCampaignReviewEvidence {
  return {
    version: "canonical-provider-campaign-review-evidence.1",
    reviewPolicyVersion: STAGE_9_PROVIDER_REVIEW_POLICY_VERSION,
    humanDimensionReviews: structuredClone(value.normalizedReview.humanDimensionReviews),
    providerPrivacyReviews: structuredClone(value.normalizedReview.providerPrivacyReviews),
    multilingualClusterReviews: [],
    campaignRequirementReviews: [],
    latencyEvidence: structuredClone(latencyEvidence),
  };
}

export function buildCanonicalProviderHumanReviewEvidence(
  verbatimSubmission: CanonicalProviderHumanReviewSubmissionV1,
): CanonicalProviderHumanReviewEvidenceV1 {
  const withoutHash = {
    version: CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_VERSION,
    verbatimSubmission: structuredClone(verbatimSubmission),
    normalizedReview: normalizeCanonicalProviderHumanReview(verbatimSubmission),
  };
  return {
    ...withoutHash,
    artifactHash: canonicalEvidenceSha256(withoutHash),
  };
}

export function validateCanonicalProviderHumanReviewEvidence(
  value: CanonicalProviderHumanReviewEvidenceV1,
  expected: CanonicalProviderHumanReviewExpectedLinkage,
  existingArtifactHashes: ReadonlySet<string> = new Set(),
): { valid: boolean; issues: string[] } {
  const issues = forbiddenContentIssues(value);
  if (!record(value) || !exactKeys(value, [
    "version", "artifactHash", "verbatimSubmission", "normalizedReview",
  ]) || value.version !== CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_VERSION) {
    issues.push("human_review_artifact_contract_invalid");
    return { valid: false, issues };
  }
  issues.push(...submissionIssues(value.verbatimSubmission));
  if (!HASH.test(value.artifactHash)) issues.push("human_review_artifact_hash_invalid");
  const { artifactHash, ...withoutHash } = value;
  if (artifactHash !== canonicalEvidenceSha256(withoutHash)) {
    issues.push("human_review_artifact_hash_mismatch");
  }
  if (existingArtifactHashes.has(artifactHash)) {
    issues.push(`duplicate_human_review_artifact:${artifactHash}`);
  }
  const identity = value.verbatimSubmission?.identity;
  if (identity?.caseId !== expected.caseId || identity?.locale !== expected.locale ||
    identity?.semanticClusterId !== expected.semanticClusterId ||
    identity?.reviewedExecutionHash !== expected.executionHash) {
    issues.push("human_review_execution_linkage_invalid");
  }
  if (submissionIssues(value.verbatimSubmission).length === 0) {
    const expectedNormalized = normalizeCanonicalProviderHumanReview(value.verbatimSubmission);
    if (canonicalEvidenceSha256(value.normalizedReview) !==
      canonicalEvidenceSha256(expectedNormalized)) {
      issues.push("human_review_source_normalization_mismatch");
    }
  }
  const normalized = canonicalProviderCampaignReviewEvidenceFromHumanArtifact(value);
  const normalizedValidation = validateCanonicalProviderCampaignReviewEvidence(
    normalized,
    new Set([expected.caseId]),
    new Set([expected.semanticClusterId]),
    new Map([[expected.caseId, expected.executionHash]]),
    new Map([[expected.caseId, {
      locale: expected.locale,
      semanticClusterId: expected.semanticClusterId,
    }]]),
  );
  issues.push(...normalizedValidation.issues.map((issue) =>
    `normalized_review:${issue}`));
  return { valid: issues.length === 0, issues };
}
