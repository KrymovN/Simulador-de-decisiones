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

export const CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_V2_VERSION =
  "canonical-provider-human-review-evidence.2" as const;

export const CANONICAL_PROVIDER_HUMAN_REVIEW_SUPPLEMENT_VERSION =
  "canonical-provider-human-review-supplement.1" as const;

export const CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS = [
  "unnecessaryPersonalInformation",
  "sensitivePrivateInformation",
  "dataMinimization",
  "criticalPrivacyProblem",
] as const;

export type CanonicalHumanBinarySemantic = "AFFIRMATIVE" | "NEGATIVE";
export type CanonicalLocalizedHumanBinaryAnswer = "SÍ" | "YES" | "NO" | "ДА" | "НЕТ";
export type CanonicalProviderHumanReviewPrivacyCommentField =
  (typeof CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS)[number];

type CanonicalLocalizedAnswerWithComments = {
  answer: CanonicalLocalizedHumanBinaryAnswer;
  commentParagraphs: string[];
};

export type CanonicalProviderHumanReviewSubmissionV2 = Omit<
  CanonicalProviderHumanReviewSubmissionV1,
  "privacyReview" | "generalAssessment" | "independenceConfirmation"
> & {
  privacyReview: {
    unnecessaryPersonalInformation: CanonicalLocalizedAnswerWithComments;
    sensitivePrivateInformation: CanonicalLocalizedAnswerWithComments;
    dataMinimization: CanonicalLocalizedAnswerWithComments;
    criticalPrivacyProblem: CanonicalLocalizedAnswerWithComments;
    globalAssessment: {
      answer: string;
      commentParagraphs: string[];
    };
  };
  generalAssessment: {
    usefulForRealPerson: CanonicalLocalizedAnswerWithComments;
    mainImprovement: string;
    otherImportantUnrepresentedProblem: CanonicalLocalizedAnswerWithComments;
  };
  independenceConfirmation: CanonicalLocalizedHumanBinaryAnswer;
};

export type CanonicalProviderHumanReviewSourceProvenanceV2 = {
  submissionId: string;
  submissionTimestamp: string | null;
  reviewerEnteredDate: string | null;
  reviewLanguage: CanonicalReviewLocale;
  sourceSystem: string;
  sourceFormId: string | null;
  sourceFormVersion: string | null;
  nativeSpeakerConfirmation: string | null;
  personalIdentityStored: false;
  verbatimSubmissionSha256: string;
};

export type CanonicalProviderHumanReviewSupplementV1 = {
  version: typeof CANONICAL_PROVIDER_HUMAN_REVIEW_SUPPLEMENT_VERSION;
  artifactHash: string;
  supplementId: string;
  originalSubmissionId: string;
  reviewedExecutionHash: string;
  submissionTimestamp: string | null;
  sourceSystem: string;
  reviewer: {
    reviewerKind: "HUMAN_REVIEWER";
    roleId: "independent-reviewer";
    version: "1";
    personalIdentityStored: false;
  };
  commentSupplements: Array<{
    field: CanonicalProviderHumanReviewPrivacyCommentField;
    commentParagraphs: string[];
  }>;
};

export type CanonicalProviderHumanReviewNormalizedSemanticsV2 = {
  privacyReview: Record<
    CanonicalProviderHumanReviewPrivacyCommentField,
    CanonicalHumanBinarySemantic
  >;
  generalAssessment: {
    usefulForRealPerson: CanonicalHumanBinarySemantic;
    otherImportantUnrepresentedProblem: CanonicalHumanBinarySemantic;
  };
  independenceConfirmation: CanonicalHumanBinarySemantic;
};

export type CanonicalProviderHumanReviewEvidenceV2 = {
  version: typeof CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_V2_VERSION;
  artifactHash: string;
  sourceProvenance: CanonicalProviderHumanReviewSourceProvenanceV2;
  verbatimSubmission: CanonicalProviderHumanReviewSubmissionV2;
  supplements: CanonicalProviderHumanReviewSupplementV1[];
  completionStatus: "COMPLETE" | "REVIEW_REQUIRED" | "INVALID";
  remainingIssues: string[];
  normalizedSemantics: CanonicalProviderHumanReviewNormalizedSemanticsV2 | null;
  normalizedReview: CanonicalProviderHumanReviewEvidenceV1["normalizedReview"] | null;
};

const V2_PRIVACY_COMMENT_ISSUE =
  "human_review_privacy_comment_missing" as const;

function localizedBinarySemantic(
  locale: CanonicalReviewLocale,
  token: unknown,
): CanonicalHumanBinarySemantic | null {
  if (token === "NO" && (locale === "es" || locale === "en")) return "NEGATIVE";
  if (locale === "es" && token === "SÍ") return "AFFIRMATIVE";
  if (locale === "en" && token === "YES") return "AFFIRMATIVE";
  if (locale === "ru" && token === "ДА") return "AFFIRMATIVE";
  if (locale === "ru" && token === "НЕТ") return "NEGATIVE";
  return null;
}

export function normalizeCanonicalLocalizedHumanBinaryAnswer(
  locale: CanonicalReviewLocale,
  token: string,
): CanonicalHumanBinarySemantic | null {
  return localizedBinarySemantic(locale, token);
}

function v2AnswerShapeValid(
  value: unknown,
  allowEmptyComments: boolean,
): value is { answer: string; commentParagraphs: string[] } {
  return record(value) && exactKeys(value, ["answer", "commentParagraphs"]) &&
    typeof value.answer === "string" &&
    paragraphsValid(value.commentParagraphs, allowEmptyComments);
}

function v2SourceProvenanceIssues(
  value: unknown,
  submission: CanonicalProviderHumanReviewSubmissionV2,
): string[] {
  if (!record(value) || !exactKeys(value, [
    "submissionId",
    "submissionTimestamp",
    "reviewerEnteredDate",
    "reviewLanguage",
    "sourceSystem",
    "sourceFormId",
    "sourceFormVersion",
    "nativeSpeakerConfirmation",
    "personalIdentityStored",
    "verbatimSubmissionSha256",
  ])) return ["human_review_source_provenance_invalid"];
  const nullableText = (item: unknown, maximum = 240): boolean =>
    item === null || (typeof item === "string" && item.trim().length > 0 &&
      item.length <= maximum);
  const valid = ID.test(String(value.submissionId)) &&
    nullableText(value.submissionTimestamp) &&
    nullableText(value.reviewerEnteredDate) &&
    value.reviewLanguage === submission.reviewLanguage &&
    typeof value.sourceSystem === "string" && value.sourceSystem.trim().length > 0 &&
    value.sourceSystem.length <= 120 && nullableText(value.sourceFormId, 160) &&
    nullableText(value.sourceFormVersion, 160) &&
    nullableText(value.nativeSpeakerConfirmation, 120) &&
    value.personalIdentityStored === false &&
    value.verbatimSubmissionSha256 === canonicalEvidenceSha256(submission);
  return valid ? [] : ["human_review_source_provenance_invalid"];
}

function v2SubmissionIssues(
  value: unknown,
): { issues: string[]; semantics: CanonicalProviderHumanReviewNormalizedSemanticsV2 | null } {
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
  ])) return { issues: ["human_review_submission_contract_invalid"], semantics: null };

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

  const locale = typeof value.reviewLanguage === "string"
    ? value.reviewLanguage as CanonicalReviewLocale : "en";
  const privacySemantics = {} as Record<
    CanonicalProviderHumanReviewPrivacyCommentField,
    CanonicalHumanBinarySemantic
  >;
  const privacy = value.privacyReview;
  if (!record(privacy) || !exactKeys(privacy, [
    ...CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS,
    "globalAssessment",
  ])) {
    issues.push("human_review_privacy_invalid");
  } else {
    for (const field of CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS) {
      const answer = privacy[field];
      if (!v2AnswerShapeValid(answer, true)) {
        issues.push(`human_review_privacy_answer_invalid:${field}`);
        continue;
      }
      const semantic = localizedBinarySemantic(locale, answer.answer);
      if (semantic === null) {
        issues.push(`human_review_binary_token_unsupported:privacyReview.${field}`);
      } else {
        privacySemantics[field] = semantic;
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
  let usefulSemantic: CanonicalHumanBinarySemantic | null = null;
  let otherProblemSemantic: CanonicalHumanBinarySemantic | null = null;
  if (!record(general) || !exactKeys(general, [
    "usefulForRealPerson", "mainImprovement", "otherImportantUnrepresentedProblem",
  ]) || !v2AnswerShapeValid(general.usefulForRealPerson, false) ||
    typeof general.mainImprovement !== "string" ||
    general.mainImprovement.trim().length === 0 || general.mainImprovement.length > 600 ||
    !v2AnswerShapeValid(general.otherImportantUnrepresentedProblem, true)) {
    issues.push("human_review_general_assessment_invalid");
  } else {
    usefulSemantic = localizedBinarySemantic(locale, general.usefulForRealPerson.answer);
    otherProblemSemantic = localizedBinarySemantic(
      locale,
      general.otherImportantUnrepresentedProblem.answer,
    );
    if (usefulSemantic === null) {
      issues.push("human_review_binary_token_unsupported:generalAssessment.usefulForRealPerson");
    }
    if (otherProblemSemantic === null) {
      issues.push(
        "human_review_binary_token_unsupported:generalAssessment.otherImportantUnrepresentedProblem",
      );
    }
  }

  const independenceSemantic = localizedBinarySemantic(
    locale,
    value.independenceConfirmation,
  );
  const identityLocale = record(identity) ? identity.locale : null;
  if (independenceSemantic === null) {
    issues.push("human_review_binary_token_unsupported:independenceConfirmation");
  } else if (independenceSemantic !== "AFFIRMATIVE" || value.reviewLanguage !== identityLocale) {
    issues.push("human_review_attestation_invalid");
  }
  const semanticsComplete =
    Object.keys(privacySemantics).length ===
      CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS.length &&
    usefulSemantic !== null && otherProblemSemantic !== null && independenceSemantic !== null;
  return {
    issues,
    semantics: semanticsComplete ? {
      privacyReview: privacySemantics,
      generalAssessment: {
        usefulForRealPerson: usefulSemantic,
        otherImportantUnrepresentedProblem: otherProblemSemantic,
      },
      independenceConfirmation: independenceSemantic,
    } : null,
  };
}

function supplementWithoutHash(
  value: Omit<CanonicalProviderHumanReviewSupplementV1, "version" | "artifactHash">,
) {
  return {
    version: CANONICAL_PROVIDER_HUMAN_REVIEW_SUPPLEMENT_VERSION,
    supplementId: value.supplementId,
    originalSubmissionId: value.originalSubmissionId,
    reviewedExecutionHash: value.reviewedExecutionHash,
    submissionTimestamp: value.submissionTimestamp,
    sourceSystem: value.sourceSystem,
    reviewer: structuredClone(value.reviewer),
    commentSupplements: structuredClone(value.commentSupplements),
  };
}

export function buildCanonicalProviderHumanReviewSupplement(
  value: Omit<CanonicalProviderHumanReviewSupplementV1, "version" | "artifactHash">,
): CanonicalProviderHumanReviewSupplementV1 {
  const withoutHash = supplementWithoutHash(value);
  return {
    ...withoutHash,
    artifactHash: canonicalEvidenceSha256(withoutHash),
  };
}

function supplementIssues(
  value: unknown,
  provenance: CanonicalProviderHumanReviewSourceProvenanceV2,
  submission: CanonicalProviderHumanReviewSubmissionV2,
): string[] {
  if (!record(value) || !exactKeys(value, [
    "version",
    "artifactHash",
    "supplementId",
    "originalSubmissionId",
    "reviewedExecutionHash",
    "submissionTimestamp",
    "sourceSystem",
    "reviewer",
    "commentSupplements",
  ]) || value.version !== CANONICAL_PROVIDER_HUMAN_REVIEW_SUPPLEMENT_VERSION) {
    return ["human_review_supplement_contract_invalid"];
  }
  const issues: string[] = [];
  const reviewer = value.reviewer;
  if (!ID.test(String(value.supplementId)) ||
    value.originalSubmissionId !== provenance.submissionId ||
    value.reviewedExecutionHash !== submission.identity.reviewedExecutionHash ||
    !(value.submissionTimestamp === null ||
      (typeof value.submissionTimestamp === "string" &&
        value.submissionTimestamp.trim().length > 0 && value.submissionTimestamp.length <= 240)) ||
    typeof value.sourceSystem !== "string" || value.sourceSystem.trim().length === 0 ||
    value.sourceSystem.length > 120 || !record(reviewer) || !exactKeys(reviewer, [
      "reviewerKind", "roleId", "version", "personalIdentityStored",
    ]) || reviewer.reviewerKind !== "HUMAN_REVIEWER" ||
    reviewer.roleId !== "independent-reviewer" || reviewer.version !== "1" ||
    reviewer.personalIdentityStored !== false) {
    issues.push("human_review_supplement_provenance_invalid");
  }
  if (!Array.isArray(value.commentSupplements) || value.commentSupplements.length === 0 ||
    value.commentSupplements.length >
      CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS.length) {
    issues.push("human_review_supplement_fields_invalid");
  } else {
    const seen = new Set<string>();
    for (const item of value.commentSupplements) {
      if (!record(item) || !exactKeys(item, ["field", "commentParagraphs"]) ||
        !CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS.includes(
          item.field as CanonicalProviderHumanReviewPrivacyCommentField,
        ) || seen.has(String(item.field)) || !paragraphsValid(item.commentParagraphs)) {
        issues.push("human_review_supplement_fields_invalid");
        continue;
      }
      seen.add(String(item.field));
      const field = item.field as CanonicalProviderHumanReviewPrivacyCommentField;
      if (submission.privacyReview[field].commentParagraphs.length > 0) {
        issues.push(`human_review_supplement_not_missing:${field}`);
      }
    }
  }
  const { artifactHash, ...withoutHash } = value;
  if (!HASH.test(String(artifactHash)) ||
    artifactHash !== canonicalEvidenceSha256(withoutHash)) {
    issues.push("human_review_supplement_hash_invalid");
  }
  return issues;
}

function normalizedReviewFromV2(
  submission: CanonicalProviderHumanReviewSubmissionV2,
  semantics: CanonicalProviderHumanReviewNormalizedSemanticsV2,
): CanonicalProviderHumanReviewEvidenceV1["normalizedReview"] {
  const canonicalToken = (semantic: CanonicalHumanBinarySemantic): CanonicalHumanBinaryAnswer =>
    semantic === "AFFIRMATIVE" ? "SÍ" : "NO";
  return normalizeCanonicalProviderHumanReview({
    ...structuredClone(submission),
    privacyReview: {
      ...structuredClone(submission.privacyReview),
      unnecessaryPersonalInformation: {
        ...structuredClone(submission.privacyReview.unnecessaryPersonalInformation),
        answer: canonicalToken(semantics.privacyReview.unnecessaryPersonalInformation),
      },
      sensitivePrivateInformation: {
        ...structuredClone(submission.privacyReview.sensitivePrivateInformation),
        answer: canonicalToken(semantics.privacyReview.sensitivePrivateInformation),
      },
      dataMinimization: {
        ...structuredClone(submission.privacyReview.dataMinimization),
        answer: canonicalToken(semantics.privacyReview.dataMinimization),
      },
      criticalPrivacyProblem: {
        ...structuredClone(submission.privacyReview.criticalPrivacyProblem),
        answer: canonicalToken(semantics.privacyReview.criticalPrivacyProblem),
      },
    },
    generalAssessment: {
      ...structuredClone(submission.generalAssessment),
      usefulForRealPerson: {
        ...structuredClone(submission.generalAssessment.usefulForRealPerson),
        answer: canonicalToken(semantics.generalAssessment.usefulForRealPerson),
      },
      otherImportantUnrepresentedProblem: {
        ...structuredClone(submission.generalAssessment.otherImportantUnrepresentedProblem),
        answer: canonicalToken(
          semantics.generalAssessment.otherImportantUnrepresentedProblem,
        ),
      },
    },
    independenceConfirmation: canonicalToken(semantics.independenceConfirmation),
  });
}

function deriveV2Evidence(
  sourceProvenance: CanonicalProviderHumanReviewSourceProvenanceV2,
  verbatimSubmission: CanonicalProviderHumanReviewSubmissionV2,
  supplements: CanonicalProviderHumanReviewSupplementV1[],
) {
  const issues = [
    ...forbiddenContentIssues({ sourceProvenance, verbatimSubmission, supplements }),
    ...v2SourceProvenanceIssues(sourceProvenance, verbatimSubmission),
  ];
  const submissionValidation = v2SubmissionIssues(verbatimSubmission);
  issues.push(...submissionValidation.issues);
  const effectiveSubmission = structuredClone(verbatimSubmission);
  const suppliedFields = new Set<CanonicalProviderHumanReviewPrivacyCommentField>();
  for (const supplement of supplements) {
    const currentIssues = supplementIssues(supplement, sourceProvenance, verbatimSubmission);
    issues.push(...currentIssues);
    if (currentIssues.length > 0) continue;
    for (const item of supplement.commentSupplements) {
      if (suppliedFields.has(item.field)) {
        issues.push(`human_review_supplement_duplicate_field:${item.field}`);
        continue;
      }
      suppliedFields.add(item.field);
      effectiveSubmission.privacyReview[item.field].commentParagraphs =
        structuredClone(item.commentParagraphs);
    }
  }
  const missingComments = CANONICAL_PROVIDER_HUMAN_REVIEW_PRIVACY_COMMENT_FIELDS.filter(
    (field) => effectiveSubmission.privacyReview[field].commentParagraphs.length === 0,
  );
  const fatalIssues = issues.filter((issue) =>
    !issue.startsWith(`${V2_PRIVACY_COMMENT_ISSUE}:`));
  const remainingIssues = [
    ...fatalIssues,
    ...missingComments.map((field) => `${V2_PRIVACY_COMMENT_ISSUE}:${field}`),
  ];
  const completionStatus = fatalIssues.length > 0
    ? "INVALID" as const
    : missingComments.length > 0
      ? "REVIEW_REQUIRED" as const
      : "COMPLETE" as const;
  const normalizedReview = completionStatus === "COMPLETE" &&
    submissionValidation.semantics !== null
    ? normalizedReviewFromV2(effectiveSubmission, submissionValidation.semantics)
    : null;
  if (normalizedReview !== null) {
    for (const record of normalizedReview.providerPrivacyReviews) {
      record.evidencePointers = [
        "verbatimSubmission.privacyReview",
        `source-submission:${sourceProvenance.submissionId}`,
        ...supplements.map((supplement) => `supplement:${supplement.artifactHash}`),
        `execution:${verbatimSubmission.identity.reviewedExecutionHash}`,
      ];
    }
  }
  return {
    sourceProvenance: structuredClone(sourceProvenance),
    verbatimSubmission: structuredClone(verbatimSubmission),
    supplements: structuredClone(supplements),
    completionStatus,
    remainingIssues,
    normalizedSemantics: submissionValidation.semantics,
    normalizedReview,
  };
}

export function buildCanonicalProviderHumanReviewEvidenceV2(
  sourceProvenance: CanonicalProviderHumanReviewSourceProvenanceV2,
  verbatimSubmission: CanonicalProviderHumanReviewSubmissionV2,
  supplements: CanonicalProviderHumanReviewSupplementV1[] = [],
): CanonicalProviderHumanReviewEvidenceV2 {
  const derived = deriveV2Evidence(sourceProvenance, verbatimSubmission, supplements);
  const withoutHash = {
    version: CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_V2_VERSION,
    ...derived,
  };
  return {
    ...withoutHash,
    artifactHash: canonicalEvidenceSha256(withoutHash),
  };
}

export function validateCanonicalProviderHumanReviewEvidenceV2(
  value: CanonicalProviderHumanReviewEvidenceV2,
  expected: CanonicalProviderHumanReviewExpectedLinkage,
  existingArtifactHashes: ReadonlySet<string> = new Set(),
): {
  valid: boolean;
  status: CanonicalProviderHumanReviewEvidenceV2["completionStatus"];
  issues: string[];
} {
  if (!record(value) || !exactKeys(value, [
    "version",
    "artifactHash",
    "sourceProvenance",
    "verbatimSubmission",
    "supplements",
    "completionStatus",
    "remainingIssues",
    "normalizedSemantics",
    "normalizedReview",
  ]) || value.version !== CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_V2_VERSION) {
    return {
      valid: false,
      status: "INVALID",
      issues: ["human_review_artifact_contract_invalid"],
    };
  }
  const rebuilt = buildCanonicalProviderHumanReviewEvidenceV2(
    value.sourceProvenance,
    value.verbatimSubmission,
    value.supplements,
  );
  const issues = [...rebuilt.remainingIssues];
  if (!HASH.test(value.artifactHash) || value.artifactHash !== rebuilt.artifactHash) {
    issues.push("human_review_artifact_hash_mismatch");
  }
  if (existingArtifactHashes.has(value.artifactHash)) {
    issues.push(`duplicate_human_review_artifact:${value.artifactHash}`);
  }
  if (canonicalEvidenceSha256({
    completionStatus: value.completionStatus,
    remainingIssues: value.remainingIssues,
    normalizedSemantics: value.normalizedSemantics,
    normalizedReview: value.normalizedReview,
  }) !== canonicalEvidenceSha256({
    completionStatus: rebuilt.completionStatus,
    remainingIssues: rebuilt.remainingIssues,
    normalizedSemantics: rebuilt.normalizedSemantics,
    normalizedReview: rebuilt.normalizedReview,
  })) {
    issues.push("human_review_source_normalization_mismatch");
  }
  const identity = value.verbatimSubmission.identity;
  if (identity.caseId !== expected.caseId || identity.locale !== expected.locale ||
    identity.semanticClusterId !== expected.semanticClusterId ||
    identity.reviewedExecutionHash !== expected.executionHash) {
    issues.push("human_review_execution_linkage_invalid");
  }
  if (rebuilt.completionStatus === "COMPLETE" && rebuilt.normalizedReview !== null) {
    const normalized = canonicalProviderCampaignReviewEvidenceFromHumanArtifact({
      version: CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_VERSION,
      artifactHash: canonicalEvidenceSha256({
        version: CANONICAL_PROVIDER_HUMAN_REVIEW_EVIDENCE_VERSION,
        verbatimSubmission: value.verbatimSubmission,
        normalizedReview: rebuilt.normalizedReview,
      }),
      verbatimSubmission: value.verbatimSubmission as CanonicalProviderHumanReviewSubmissionV1,
      normalizedReview: rebuilt.normalizedReview,
    });
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
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: rebuilt.completionStatus === "COMPLETE" && uniqueIssues.length === 0,
    status: uniqueIssues.some((issue) =>
      !issue.startsWith(`${V2_PRIVACY_COMMENT_ISSUE}:`))
      ? "INVALID"
      : rebuilt.completionStatus,
    issues: uniqueIssues,
  };
}

export function canonicalProviderCampaignReviewEvidenceFromHumanArtifactV2(
  value: CanonicalProviderHumanReviewEvidenceV2,
  latencyEvidence: CanonicalProviderCampaignReviewEvidence["latencyEvidence"] = {
    policyStatus: "DOCUMENTED_NOT_BLOCKING_BY_NEW_THRESHOLD",
    executions: [],
    profile: null,
  },
): CanonicalProviderCampaignReviewEvidence {
  if (value.completionStatus !== "COMPLETE" || value.normalizedReview === null) {
    throw new Error("human_review_v2_not_complete");
  }
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
