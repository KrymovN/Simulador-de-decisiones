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
      score: 1,
      commentParagraphs: ["not clear"],
    },
    scenario_usefulness_distinctness: {
      score: 2,
      commentParagraphs: ["very similar"],
    },
    risk_discipline: {
      score: 1,
      commentParagraphs: ["Risk averse"],
    },
    recommendation_strategic_usefulness: {
      score: 3,
      commentParagraphs: ["more information is good"],
    },
  },
  privacyReview: {
    unnecessaryPersonalInformation: { answer: "NO", commentParagraphs: [] },
    sensitivePrivateInformation: { answer: "NO", commentParagraphs: [] },
    dataMinimization: { answer: "YES", commentParagraphs: [] },
    criticalPrivacyProblem: { answer: "NO", commentParagraphs: [] },
    globalAssessment: {
      answer: "CANNOT DETERMINE",
      commentParagraphs: ["unclear"],
    },
  },
  generalAssessment: {
    usefulForRealPerson: {
      answer: "NO",
      commentParagraphs: ["information contradicts"],
    },
    mainImprovement: "more clarity",
    otherImportantUnrepresentedProblem: {
      answer: "NO",
      commentParagraphs: [],
    },
  },
  independenceConfirmation: "YES",
  reviewLanguage: "en",
};
const sourceProvenance = {
  submissionId: "6631276013018277627",
  submissionTimestamp: "2026-08-21 09:20:01",
  reviewerEnteredDate: "2026-08-21",
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
  human.normalizeCanonicalLocalizedHumanBinaryAnswer("es", "NO") === "NEGATIVE");

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
const expectedMissing = [
  "unnecessaryPersonalInformation",
  "sensitivePrivateInformation",
  "dataMinimization",
  "criticalPrivacyProblem",
].map((field) => `human_review_privacy_comment_missing:${field}`).sort();
add("position2-remains-review-required-only-for-missing-comments",
  currentValidation.valid === false && currentValidation.status === "REVIEW_REQUIRED" &&
  JSON.stringify([...currentValidation.issues].sort()) === JSON.stringify(expectedMissing) &&
  persistedCurrent.normalizedReview === null &&
  !currentValidation.issues.some((issue) => issue.includes("binary_token")));
add("position2-provenance-is-retained-outside-semantic-payload",
  persistedCurrent.sourceProvenance.submissionId === "6631276013018277627" &&
  persistedCurrent.sourceProvenance.submissionTimestamp === "2026-08-21 09:20:01" &&
  persistedCurrent.sourceProvenance.reviewerEnteredDate === "2026-08-21" &&
  persistedCurrent.sourceProvenance.nativeSpeakerConfirmation === "YES" &&
  !Object.hasOwn(persistedCurrent.verbatimSubmission, "submissionId"));

let incompleteAggregationRejected = false;
try {
  human.canonicalProviderCampaignReviewEvidenceFromHumanArtifactV2(persistedCurrent);
} catch (error) {
  incompleteAggregationRejected = error instanceof Error &&
    error.message === "human_review_v2_not_complete";
}
add("incomplete-review-cannot-enter-campaign-aggregation", incompleteAggregationRejected);

const syntheticSupplement = human.buildCanonicalProviderHumanReviewSupplement({
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
const syntheticComplete = human.buildCanonicalProviderHumanReviewEvidenceV2(
  sourceProvenance,
  verbatimSubmission,
  [syntheticSupplement],
);
const syntheticValidation = human.validateCanonicalProviderHumanReviewEvidenceV2(
  syntheticComplete,
  linkage,
);
add("test-only-complete-supplement-is-structurally-valid",
  syntheticValidation.valid && syntheticValidation.status === "COMPLETE" &&
  syntheticComplete.normalizedReview !== null &&
  syntheticComplete.normalizedReview.providerPrivacyReviews[0].evidencePointers.includes(
    `supplement:${syntheticSupplement.artifactHash}`,
  ));
add("completed-test-artifact-preserves-original-scores-and-answers",
  JSON.stringify(syntheticComplete.verbatimSubmission.dimensionReviews) ===
    JSON.stringify(verbatimSubmission.dimensionReviews) &&
  syntheticComplete.verbatimSubmission.privacyReview.dataMinimization.answer === "YES" &&
  syntheticComplete.verbatimSubmission.independenceConfirmation === "YES" &&
  syntheticComplete.verbatimSubmission.privacyReview.globalAssessment.answer ===
    "CANNOT DETERMINE");
add("diagnostic-record-statuses-preserve-frozen-semantics",
  syntheticComplete.normalizedReview.humanDimensionReviews.map((record) => record.status)
    .join(",") === "FAIL,FAIL,FAIL,PASS" &&
  syntheticComplete.normalizedReview.providerPrivacyReviews[0].status === "FAIL" &&
  syntheticComplete.normalizedReview.providerPrivacyReviews[0]
    .criticalProviderPrivacyViolation === false);

function supplementMutationRejected(mutator) {
  const mutated = structuredClone(syntheticSupplement);
  mutator(mutated);
  const combined = human.buildCanonicalProviderHumanReviewEvidenceV2(
    sourceProvenance,
    verbatimSubmission,
    [mutated],
  );
  return combined.completionStatus === "INVALID" &&
    combined.remainingIssues.some((issue) =>
      issue.startsWith("human_review_supplement_"));
}
add("supplement-cannot-alter-scores",
  supplementMutationRejected((supplement) => { supplement.score = 4; }));
add("supplement-cannot-alter-original-binary-answers",
  supplementMutationRejected((supplement) => {
    supplement.commentSupplements[0].answer = "YES";
  }));
add("supplement-cannot-alter-overall-privacy-assessment",
  supplementMutationRejected((supplement) => {
    supplement.globalAssessment = "ADECUADO";
  }));
add("supplement-cannot-alter-independence-confirmation",
  supplementMutationRejected((supplement) => {
    supplement.independenceConfirmation = "NO";
  }));
add("position2-provider-evidence-and-blind-packet-remain-immutable",
  physicalSha("STAGE_9_TERRA_POSITION_2_REPLACEMENT_EVIDENCE.v2.json") ===
    "57b1adaeb23e4fc7f4f5a68856a90846a42e9692301c634bb2f96b864d62ddfa" &&
  physicalSha("STAGE_9_TERRA_POSITION_2_REPLACEMENT_BLIND_REVIEW_PACKET.v1.json") ===
    "54b745b515e96ade85f6c8d448dd05078fef54e4c3aaac82c82420cae5042d5e");
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
  diagnosticOnly: {
    perRecordStatuses: ["FAIL", "FAIL", "FAIL", "PASS"],
    recommendationScore: 3,
    recommendationCampaignThreshold: { numerator: 34, denominator: 10 },
    privacyWouldPassIfComplete: false,
  },
  checks,
}, null, 2)}\n`);
if (failed.length > 0) process.exitCode = 1;
