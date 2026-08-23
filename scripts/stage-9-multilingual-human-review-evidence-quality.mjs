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
const human = require(join(
  root,
  "lib",
  "ai-quality",
  "canonical-provider-human-review-evidence.ts",
));
const campaign = require(join(
  root,
  "lib",
  "ai-quality",
  "canonical-provider-campaign-evidence.ts",
));
const read = (name) => readFileSync(join(live, name));
const load = (name) => JSON.parse(read(name).toString("utf8"));
const physicalSha = (name) => createHash("sha256").update(read(name)).digest("hex");

const executionHash =
  "2af02a72f0c8a9a1c7fe5aaaa5abad33e67d8e8de51b877484af769d3afab401";
const linkage = {
  caseId: "S9-CORE-001-EN",
  locale: "en",
  semanticClusterId: "S9-CLUSTER-001",
  executionHash,
};
const verbatimSubmission = {
  identity: {
    caseId: linkage.caseId,
    locale: linkage.locale,
    semanticClusterId: linkage.semanticClusterId,
    reviewedExecutionHash: executionHash,
  },
  reviewPolicyVersion: "stage-9-provider-review-policy.1",
  reviewer: {
    reviewerKind: "HUMAN_REVIEWER",
    roleId: "independent-reviewer",
    version: "1",
    personalIdentityStored: false,
  },
  dimensionReviews: {
    clarification_relevance: {
      score: 3,
      commentParagraphs: [
        "Points 3 to 7, once read and digested made complete sense concerning the scenario, points 1 & 2 comprehension was a lot more difficult, the wording contextually to the intention of the point initially did not communicate well comparatively to an alternate approach to its wording.",
      ],
    },
    scenario_usefulness_distinctness: {
      score: 4,
      commentParagraphs: [
        "The scenario was fine, complete, once comprehended no issues.",
      ],
    },
    risk_discipline: {
      score: 4,
      commentParagraphs: [
        "The scenario included sufficient risk analysis discernment. The overall points had a high level of comprehension risk for non native English speakers.",
      ],
    },
    recommendation_strategic_usefulness: {
      score: 3,
      commentParagraphs: [
        "Points had good information concerning the scenario, same feedback as question 1.",
      ],
    },
  },
  privacyReview: {
    unnecessaryPersonalInformation: {
      answer: "NO",
      commentParagraphs: ["No information was personally involved with the scenario"],
    },
    sensitivePrivateInformation: {
      answer: "NO",
      commentParagraphs: ["The questions structure is non discrepant"],
    },
    dataMinimization: {
      answer: "YES",
      commentParagraphs: [
        "Pure logic initially replaying the scenario in my head but based of the reviewer (person larping as discerner or people doing this survey) results could change to emotional based on the experiences of the deciding factors.",
      ],
    },
    criticalPrivacyProblem: { answer: "NO", commentParagraphs: ["No"] },
    globalAssessment: {
      answer: "ADEQUATE",
      commentParagraphs: [
        "Non descriptive, generic tactical wording, no personal information involved",
      ],
    },
  },
  generalAssessment: {
    usefulForRealPerson: {
      answer: "YES",
      commentParagraphs: [
        "Taking the theoretical application of the question and mentally replacing the factors with a potential personal scenario could be useful for their decisions.",
      ],
    },
    mainImprovement: "Rewording and restructuring or Point 1 and Point 2",
    otherImportantUnrepresentedProblem: {
      answer: "NO",
      commentParagraphs: [],
    },
  },
  independenceConfirmation: "YES",
  reviewLanguage: "en",
};
const sourceProvenance = {
  submissionId: "6631532634015686286",
  submissionTimestamp: "2026-08-21 16:27:43",
  reviewerEnteredDate: "2026-08-22",
  reviewLanguage: "en",
  sourceSystem: "Jotform",
  sourceFormId: null,
  sourceFormVersion: null,
  nativeSpeakerConfirmation: "YES",
  personalIdentityStored: false,
  verbatimSubmissionSha256: campaign.canonicalEvidenceSha256(verbatimSubmission),
};
const currentArtifact = human.buildCanonicalProviderHumanReviewEvidenceV2(
  sourceProvenance,
  verbatimSubmission,
);

const ruLinkage = {
  caseId: "S9-CORE-001-RU",
  locale: "ru",
  semanticClusterId: "S9-CLUSTER-001",
  executionHash:
    "f843ae060ab89fe944996ab34e116b2118f96e72f56b348950203953be491e88",
};
const ruSubmission = structuredClone(verbatimSubmission);
ruSubmission.identity = {
  caseId: ruLinkage.caseId,
  locale: ruLinkage.locale,
  semanticClusterId: ruLinkage.semanticClusterId,
  reviewedExecutionHash: ruLinkage.executionHash,
};
ruSubmission.privacyReview.unnecessaryPersonalInformation.answer = "НЕТ";
ruSubmission.privacyReview.sensitivePrivateInformation.answer = "НЕТ";
ruSubmission.privacyReview.dataMinimization.answer = "ДА";
ruSubmission.privacyReview.criticalPrivacyProblem.answer = "НЕТ";
ruSubmission.privacyReview.globalAssessment.answer = "ADECUADO";
ruSubmission.generalAssessment.usefulForRealPerson.answer = "ДА";
ruSubmission.generalAssessment.otherImportantUnrepresentedProblem.answer = "НЕТ";
ruSubmission.independenceConfirmation = "ДА";
ruSubmission.reviewLanguage = "ru";
const buildTestRuArtifact = (submission) =>
  human.buildCanonicalProviderHumanReviewEvidenceV2({
    submissionId: "TEST-RU-HUMAN-REVIEW-001",
    submissionTimestamp: null,
    reviewerEnteredDate: null,
    reviewLanguage: "ru",
    sourceSystem: "TEST-ONLY",
    sourceFormId: null,
    sourceFormVersion: null,
    nativeSpeakerConfirmation: null,
    personalIdentityStored: false,
    verbatimSubmissionSha256: campaign.canonicalEvidenceSha256(submission),
  }, submission);
const completeRuTestArtifact = buildTestRuArtifact(ruSubmission);

if (process.argv.includes("--emit-artifact")) {
  process.stdout.write(`${JSON.stringify(currentArtifact, null, 2)}\n`);
  process.exit(0);
}

const checks = [];
function add(id, passed, detail = "") {
  checks.push({ id, passed, detail: passed ? "" : detail || "Check failed." });
}

const position1 = load("STAGE_9_TERRA_POSITION_1_HUMAN_REVIEW_EVIDENCE.v1.json");
const position1Validation = human.validateCanonicalProviderHumanReviewEvidence(
  position1,
  {
    caseId: "S9-CORE-001-ES",
    locale: "es",
    semanticClusterId: "S9-CLUSTER-001",
    executionHash:
      "4bcc5d6371415286e7a2cba707d24529bf7d2ae9f562ae01d418e7bb0e2336b6",
  },
);
add("spanish-v1-position1-remains-valid-and-immutable",
  position1Validation.valid &&
  physicalSha("STAGE_9_TERRA_POSITION_1_HUMAN_REVIEW_EVIDENCE.v1.json") ===
    "0306e7bca7813fea79cfb1292442a74b06159c3d68b988d30a365e2d6436a150");

const persistedCurrent = load(
  "STAGE_9_TERRA_POSITION_2_HUMAN_REVIEW_EVIDENCE.v2.json",
);
const position3Evidence = load("STAGE_9_TERRA_POSITION_3_EVIDENCE.v2.json");
const position3BlindPacket = load(
  "STAGE_9_TERRA_POSITION_3_BLIND_REVIEW_PACKET.v1.json",
);
add("english-raw-yes-no-round-trips-losslessly",
  JSON.stringify(currentArtifact.verbatimSubmission) === JSON.stringify(verbatimSubmission) &&
  JSON.stringify(persistedCurrent.verbatimSubmission) === JSON.stringify(verbatimSubmission));
add("raw-source-canonical-bytes-remain-exact",
  currentArtifact.sourceProvenance.verbatimSubmissionSha256 ===
    campaign.canonicalEvidenceSha256(verbatimSubmission) &&
  persistedCurrent.sourceProvenance.verbatimSubmissionSha256 ===
    campaign.canonicalEvidenceSha256(persistedCurrent.verbatimSubmission));
add("localized-semantic-mapping-is-deterministic",
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("en", "YES") === "AFFIRMATIVE" &&
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("en", "NO") === "NEGATIVE" &&
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("es", "SÍ") === "AFFIRMATIVE" &&
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("es", "NO") === "NEGATIVE" &&
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("ru", "ДА") === "AFFIRMATIVE" &&
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("ru", "НЕТ") === "NEGATIVE");
add("ru-binary-literals-are-exact-and-locale-specific",
  ["Да", "да", "Нет", "нет", "YES", "NO", "SÍ", "PARTLY", " ДА", "НЕТ ",
    true, false, 1, 0].every((token) =>
    human.normalizeCanonicalLocalizedHumanBinaryAnswer("ru", token) === null) &&
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("es", "ДА") === null &&
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("en", "НЕТ") === null);
add("partly-remains-unsupported-for-every-review-locale",
  ["es", "en", "ru", "zh"].every((locale) =>
    human.normalizeCanonicalLocalizedHumanBinaryAnswer(locale, "PARTLY") === null));
add("zh-binary-normalization-remains-undefined",
  ["SÍ", "YES", "NO", "ДА", "НЕТ"].every((token) =>
    human.normalizeCanonicalLocalizedHumanBinaryAnswer("zh", token) === null));

const completeRuTestValidation = human.validateCanonicalProviderHumanReviewEvidenceV2(
  completeRuTestArtifact,
  ruLinkage,
);
add("ru-position3-human-review-v2-is-structurally-completable-test-only",
  completeRuTestValidation.valid === true &&
  completeRuTestValidation.status === "COMPLETE" &&
  completeRuTestArtifact.completionStatus === "COMPLETE" &&
  completeRuTestArtifact.normalizedReview?.providerPrivacyReviews[0]?.status === "PASS" &&
  completeRuTestArtifact.normalizedReview?.providerPrivacyReviews[0]
    ?.criticalProviderPrivacyViolation === false &&
  completeRuTestArtifact.normalizedSemantics?.independenceConfirmation === "AFFIRMATIVE" &&
  completeRuTestArtifact.normalizedSemantics?.privacyReview
    .unnecessaryPersonalInformation === "NEGATIVE" &&
  completeRuTestArtifact.normalizedSemantics?.privacyReview
    .sensitivePrivateInformation === "NEGATIVE" &&
  completeRuTestArtifact.normalizedSemantics?.privacyReview.dataMinimization ===
    "AFFIRMATIVE" &&
  completeRuTestArtifact.normalizedSemantics?.privacyReview.criticalPrivacyProblem ===
    "NEGATIVE" &&
  completeRuTestArtifact.normalizedSemantics?.generalAssessment.usefulForRealPerson ===
    "AFFIRMATIVE" &&
  completeRuTestArtifact.normalizedSemantics?.generalAssessment
    .otherImportantUnrepresentedProblem === "NEGATIVE");

const scoreStatuses = [0, 1, 2, 3, 4].map((score) => {
  const submission = structuredClone(ruSubmission);
  submission.dimensionReviews.clarification_relevance.score = score;
  return buildTestRuArtifact(submission).normalizedReview?.humanDimensionReviews.find(
    (record) => record.dimension === "clarification_relevance",
  )?.status;
});
add("score-status-normalization-remains-frozen",
  scoreStatuses.join(",") === "FAIL,FAIL,FAIL,PASS,PASS");

const nonAdecuadoRuSubmission = structuredClone(ruSubmission);
nonAdecuadoRuSubmission.privacyReview.globalAssessment.answer = "НЕАДЕКВАТНО";
const nonAdecuadoRuArtifact = buildTestRuArtifact(nonAdecuadoRuSubmission);
add("non-adecuado-global-privacy-assessment-remains-fail",
  nonAdecuadoRuArtifact.completionStatus === "COMPLETE" &&
  nonAdecuadoRuArtifact.normalizedReview?.providerPrivacyReviews[0]?.status === "FAIL" &&
  nonAdecuadoRuArtifact.normalizedReview?.providerPrivacyReviews[0]
    ?.criticalProviderPrivacyViolation === false);

const criticalPrivacyRuSubmission = structuredClone(ruSubmission);
criticalPrivacyRuSubmission.privacyReview.criticalPrivacyProblem.answer = "ДА";
const criticalPrivacyRuArtifact = buildTestRuArtifact(criticalPrivacyRuSubmission);
add("affirmative-critical-privacy-remains-non-compensable-failure-input",
  criticalPrivacyRuArtifact.completionStatus === "COMPLETE" &&
  criticalPrivacyRuArtifact.normalizedReview?.providerPrivacyReviews[0]?.status === "FAIL" &&
  criticalPrivacyRuArtifact.normalizedReview?.providerPrivacyReviews[0]
    ?.criticalProviderPrivacyViolation === true);

const unknownToken = structuredClone(verbatimSubmission);
unknownToken.privacyReview.dataMinimization.answer = "UNKNOWN";
const unknownTokenProvenance = {
  ...sourceProvenance,
  verbatimSubmissionSha256: campaign.canonicalEvidenceSha256(unknownToken),
};
const unknownArtifact = human.buildCanonicalProviderHumanReviewEvidenceV2(
  unknownTokenProvenance,
  unknownToken,
);
add("unknown-binary-token-is-rejected",
  unknownArtifact.completionStatus === "INVALID" &&
  unknownArtifact.remainingIssues.includes(
    "human_review_binary_token_unsupported:privacyReview.dataMinimization",
  ));

const currentValidation = human.validateCanonicalProviderHumanReviewEvidenceV2(
  persistedCurrent,
  linkage,
);
add("position2-md-review-is-complete-and-valid",
  currentValidation.valid === true && currentValidation.status === "COMPLETE" &&
  currentValidation.issues.length === 0 &&
  persistedCurrent.normalizedReview !== null &&
  !currentValidation.issues.some((issue) => issue.includes("binary_token")));
add("position2-provenance-is-retained-outside-semantic-payload",
  persistedCurrent.sourceProvenance.submissionId === "6631532634015686286" &&
  persistedCurrent.sourceProvenance.submissionTimestamp === "2026-08-21 16:27:43" &&
  persistedCurrent.sourceProvenance.reviewerEnteredDate === "2026-08-22" &&
  persistedCurrent.sourceProvenance.nativeSpeakerConfirmation === "YES" &&
  !Object.hasOwn(persistedCurrent.verbatimSubmission, "submissionId"));

const position2CampaignReview =
  human.canonicalProviderCampaignReviewEvidenceFromHumanArtifactV2(persistedCurrent);
add("complete-review-enters-campaign-aggregation",
  position2CampaignReview.humanDimensionReviews.length === 4 &&
  position2CampaignReview.providerPrivacyReviews.length === 1);

const duplicateValidation = human.validateCanonicalProviderHumanReviewEvidenceV2(
  persistedCurrent,
  linkage,
  new Set([persistedCurrent.artifactHash]),
);
add("duplicate-human-review-artifact-is-rejected",
  duplicateValidation.valid === false &&
  duplicateValidation.issues.includes(
    `duplicate_human_review_artifact:${persistedCurrent.artifactHash}`,
  ));

const completedReviewSupplement = human.buildCanonicalProviderHumanReviewSupplement({
  supplementId: "TEST-SUPPLEMENT-001",
  originalSubmissionId: sourceProvenance.submissionId,
  reviewedExecutionHash: executionHash,
  submissionTimestamp: "2099-01-01 00:00:00 TEST-ONLY",
  sourceSystem: "TEST-ONLY",
  reviewer: {
    reviewerKind: "HUMAN_REVIEWER",
    roleId: "independent-reviewer",
    version: "1",
    personalIdentityStored: false,
  },
  commentSupplements: [
    { field: "unnecessaryPersonalInformation", commentParagraphs: ["TEST-ONLY A"] },
    { field: "sensitivePrivateInformation", commentParagraphs: ["TEST-ONLY B"] },
    { field: "dataMinimization", commentParagraphs: ["TEST-ONLY C"] },
    { field: "criticalPrivacyProblem", commentParagraphs: ["TEST-ONLY D"] },
  ],
});
const supplementedCompletedReview = human.buildCanonicalProviderHumanReviewEvidenceV2(
  sourceProvenance,
  verbatimSubmission,
  [completedReviewSupplement],
);
add("complete-review-cannot-receive-privacy-comment-supplement",
  supplementedCompletedReview.completionStatus === "INVALID" &&
  supplementedCompletedReview.remainingIssues.filter((issue) =>
    issue.startsWith("human_review_supplement_not_missing:")).length === 4);
add("completed-artifact-preserves-original-scores-and-answers",
  JSON.stringify(persistedCurrent.verbatimSubmission.dimensionReviews) ===
    JSON.stringify(verbatimSubmission.dimensionReviews) &&
  persistedCurrent.verbatimSubmission.privacyReview.dataMinimization.answer === "YES" &&
  persistedCurrent.verbatimSubmission.independenceConfirmation === "YES" &&
  persistedCurrent.verbatimSubmission.privacyReview.globalAssessment.answer ===
    "ADEQUATE");
add("normalized-record-statuses-preserve-frozen-semantics",
  persistedCurrent.normalizedReview.humanDimensionReviews.map((record) => record.status)
    .join(",") === "PASS,PASS,PASS,PASS" &&
  persistedCurrent.normalizedReview.providerPrivacyReviews[0].status === "FAIL" &&
  persistedCurrent.normalizedReview.providerPrivacyReviews[0]
    .criticalProviderPrivacyViolation === false);
add("position2-provider-evidence-and-blind-packet-remain-immutable",
  physicalSha("STAGE_9_TERRA_POSITION_2_REPLACEMENT_EVIDENCE.v2.json") ===
    "57b1adaeb23e4fc7f4f5a68856a90846a42e9692301c634bb2f96b864d62ddfa" &&
  physicalSha("STAGE_9_TERRA_POSITION_2_REPLACEMENT_BLIND_REVIEW_PACKET.v1.json") ===
    "54b745b515e96ade85f6c8d448dd05078fef54e4c3aaac82c82420cae5042d5e");
add("position3-evidence-and-blind-packet-remain-immutable-and-unreviewed",
  physicalSha("STAGE_9_TERRA_POSITION_3_EVIDENCE.v2.json") ===
    "95895fae5293a7a6fe0940089bbc27b5414f621fa3f438975b75d13f960237df" &&
  physicalSha("STAGE_9_TERRA_POSITION_3_BLIND_REVIEW_PACKET.v1.json") ===
    "38d8caee2e1d452ce8a0c9d6680404ded6aa85519131b5a76d2d4cc53ab67061" &&
  JSON.stringify(position3BlindPacket) === JSON.stringify(
    campaign.buildCanonicalProviderBlindReviewPacket(position3Evidence.executions[0]),
  ) &&
  position3Evidence.reviewRecords.humanDimensionReviews.length === 0 &&
  position3Evidence.reviewRecords.providerPrivacyReviews.length === 0);
const executableImports = readFileSync(fileURLToPath(import.meta.url), "utf8")
  .split("\n").filter((line) => line.startsWith("import ") || line.includes("require("));
add("no-provider-or-network-operations",
  !executableImports.some((line) =>
    line.toLowerCase().includes("openai") || line.includes("node:http") ||
    line.includes("node:https")));

const failed = checks.filter((check) => !check.passed);
process.stdout.write(`${JSON.stringify({
  gate: "stage-9-multilingual-human-review-evidence",
  status: failed.length === 0 ? "PASS" : "FAIL",
  providerOperations: 0,
  currentPosition2: {
    completionStatus: persistedCurrent.completionStatus,
    remainingIssues: persistedCurrent.remainingIssues,
    normalizedReviewPersisted: persistedCurrent.normalizedReview !== null,
    executionHash,
    submissionId: persistedCurrent.sourceProvenance.submissionId,
  },
  currentPosition3: {
    actualReviewStatus: "REVIEW_REQUIRED",
    testOnlyRuV2StructurallyCompletable: completeRuTestValidation.valid,
    executionHash: ruLinkage.executionHash,
    persistedHumanDimensionReviewCount:
      position3Evidence.reviewRecords.humanDimensionReviews.length,
    persistedPrivacyReviewCount: position3Evidence.reviewRecords.providerPrivacyReviews.length,
  },
  diagnosticOnly: {
    perRecordStatuses: ["PASS", "PASS", "PASS", "PASS"],
    recommendationScore: 3,
    recommendationCampaignThreshold: { numerator: 34, denominator: 10 },
    privacyStatus: "FAIL",
    rawPrivacyAssessment: "ADEQUATE",
    criticalProviderPrivacyViolation: false,
  },
  checks,
}, null, 2)}\n`);
if (failed.length > 0) process.exitCode = 1;
