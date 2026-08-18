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
const fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
const taxonomy = require(join(
  root, "lib", "ai-quality", "canonical-provider-evaluation-taxonomy.ts",
));
const aggregation = require(join(
  root, "lib", "ai-quality", "canonical-provider-evaluation-aggregation.ts",
));
const campaignEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-campaign-evidence.ts",
));
const migrationEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-campaign-migration-evidence.ts",
));
const humanReviewEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-human-review-evidence.ts",
));

const liveEvidence = join(root, "docs", "qa", "stage-9", "live-evidence");
const migrationPath = join(
  liveEvidence,
  "STAGE_9_TERRA_ACCEPTED_PROJECTION_MIGRATION_EVIDENCE.v1.json",
);
const humanPath = join(
  liveEvidence,
  "STAGE_9_TERRA_POSITION_1_HUMAN_REVIEW_EVIDENCE.v1.json",
);
const failurePath = join(
  liveEvidence,
  "STAGE_9_TERRA_POSITION_2_PROVIDER_CONTRACT_FAILURE_EVIDENCE.v1.json",
);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const migrationArtifact = JSON.parse(readFileSync(migrationPath, "utf8"));
const humanArtifactBuffer = readFileSync(humanPath);
const humanArtifact = JSON.parse(humanArtifactBuffer.toString("utf8"));
const failureArtifactBuffer = readFileSync(failurePath);
const failureArtifact = JSON.parse(failureArtifactBuffer.toString("utf8"));
const cases = fixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const caseById = new Map(cases.map((item) => [item.case_id, item]));
const categories = taxonomy.CANONICAL_PROVIDER_EVALUATION_CATEGORIES;

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

function position1ComparableEvidence() {
  const source = caseById.get("S9-CORE-001-ES");
  const oracle = taxonomy.canonicalOracleConceptsByCategory(source);
  const matcherCategories = Object.fromEntries(categories.map((category) => {
    const expected = [...oracle[category]].sort();
    const missing = [...(position1Missing[category] ?? [])].sort();
    const unexpected = [...(position1Unexpected[category] ?? [])].sort();
    const actual = [
      ...expected.filter((concept) => !missing.includes(concept)),
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
    matcher: {
      passed: categories.every((category) => matcherCategories[category].passed),
      categories: matcherCategories,
    },
    deterministicGates: {
      provider_result_contract: "PASS",
      candidate_contract_and_safety: "PASS",
      oracle_isolation: "PASS",
      approved_cost_budget: "PASS",
    },
    normalizedCostRecorded: true,
  };
}

const position1Evidence = position1ComparableEvidence();
const matcherSemanticMaterial = Object.fromEntries(categories.map((category) => {
  const { expected: _expected, ...semantic } = position1Evidence.matcher.categories[category];
  return [category, semantic];
}));
const terminalFailureLinkage = {
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
};
const terminalFailureInput = [{
  kind: "TERMINAL_PROVIDER_FAILURE",
  artifact: failureArtifact,
  expectedLinkage: terminalFailureLinkage,
}];
const reviewEvidence =
  humanReviewEvidence.canonicalProviderCampaignReviewEvidenceFromHumanArtifact(
    humanArtifact,
  );
const levioGuarantees = Object.fromEntries(
  aggregation.CANONICAL_LEVIO_GUARANTEE_IDS.map((id) => [id, "PASS"]),
);
levioGuarantees.minimum_necessary_prompt_context = "LEVIO_IMPLEMENTATION_GAP";
levioGuarantees.controlled_failure_product_presentation = "LEVIO_IMPLEMENTATION_GAP";

let networkOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkOperations += 1;
  throw new Error("Network operations are forbidden in the Terra migration quality gate.");
};

const withoutMigration = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  [position1Evidence],
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuarantees,
  reviewEvidence,
  terminalFailureInput,
);
const withMigration = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  [position1Evidence],
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuarantees,
  reviewEvidence,
  terminalFailureInput,
  { kind: "CAMPAIGN_SEMANTICS_MIGRATION", artifact: migrationArtifact },
);

function rehashMigration(value) {
  const clone = structuredClone(value);
  delete clone.version;
  delete clone.artifactHash;
  return migrationEvidence.buildCanonicalProviderCampaignMigrationEvidence(clone);
}

const invalidMigrationArtifact = structuredClone(migrationArtifact);
invalidMigrationArtifact.retainedComparableExecution.equivalenceProof
  .replayAcceptedResultSha256 = sha("invalid-replay-result");
const invalidMigration = rehashMigration(invalidMigrationArtifact);
const withInvalidMigration = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  [position1Evidence],
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuarantees,
  reviewEvidence,
  terminalFailureInput,
  { kind: "CAMPAIGN_SEMANTICS_MIGRATION", artifact: invalidMigration },
);
globalThis.fetch = originalFetch;

const emptyReviewRecords = {
  version: "canonical-provider-campaign-review-evidence.1",
  reviewPolicyVersion: "stage-9-provider-review-policy.1",
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
const historicalManifestArtifact = {
  version: campaignEvidence.CANONICAL_PROVIDER_CAMPAIGN_EVIDENCE_VERSION,
  campaign: {
    campaignId: "campaign-manifest-regression",
    status: "OPEN",
    closedAt: null,
    retentionPolicyId: "stage-9-provider-review-evidence-retention",
    retentionPolicyVersion: "1",
    maximumContentDeletionDeadline: null,
    contentRetentionStatus: "ACTIVE",
    storageClass: "evaluation-only",
    accessClass: "review-authorized-least-privilege",
  },
  frozenConfiguration: {
    baselineCommit: "fd651a4c9336643e45e749b629af12318f2a1c8a",
    caseOrderSha256: sha(cases.map((item) => item.case_id).join("\n")),
    caseCount: 160,
    configurationFingerprint:
      "ee8c00893a300a8534c597f285ce99ab57b139475c9c88abf5bc9d62efcfe142",
  },
  versionManifest: {
    reviewPolicyVersion: "stage-9-provider-review-policy.1",
    inputContractVersion: "canonical-provider-evaluation-input.2",
    resultContractVersion: "canonical-provider-evaluation-result.1",
    taxonomyVersion: "canonical-provider-evaluation-taxonomy.1",
    taskProfileVersion: "canonical-provider-evaluation-task-profile.1",
    boundaryVersion: "stage-9-canonical-provider-evaluation-boundary.2",
    aggregationVersion: "canonical-provider-evaluation-aggregation.3",
    providerInstructionsSha256: sha("manifest-regression-instructions"),
    providerSchemaSha256: sha("manifest-regression-schema"),
  },
  executions: [],
  reviewRecords: emptyReviewRecords,
  campaignAggregation: {
    aggregationVersion: "canonical-provider-evaluation-aggregation.3",
    sourceExecutionHashes: [],
    generatedAt: null,
  },
};
const historicalManifestValidation =
  campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
    historicalManifestArtifact,
    cases,
  );
const futureWithoutProjectionVersion = structuredClone(historicalManifestArtifact);
futureWithoutProjectionVersion.executions.push({
  caseId: "S9-CORE-001-ES",
  validatedResult: {},
  acceptedProjection: {},
});
const futureManifestIssues = campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  futureWithoutProjectionVersion,
  cases,
).issues;

const checks = [];
const add = (id, passed, detail = "Check failed.") =>
  checks.push({ id, passed: Boolean(passed), detail });
const migrationValidation =
  migrationEvidence.validateCanonicalProviderCampaignMigrationEvidence(migrationArtifact);
add("migration-artifact-valid", migrationValidation.valid,
  migrationValidation.issues.join(", "));
add("position-1-equivalence-proof-valid",
  migrationValidation.valid && !position1Evidence.matcher.passed &&
  campaignEvidence.canonicalEvidenceSha256(matcherSemanticMaterial) ===
    migrationArtifact.retainedComparableExecution.equivalenceProof
      .historicalMatcherSemanticSha256);
for (const field of [
  "replayAcceptedResultSha256",
  "replayAcceptedCandidateMaterialSha256",
  "replayAcceptedAnnotationsSha256",
  "replayMatcherSemanticSha256",
]) {
  const changed = structuredClone(migrationArtifact);
  changed.retainedComparableExecution.equivalenceProof[field] = sha(`changed:${field}`);
  add(`position-1-${field}-change-invalidates`,
    !migrationEvidence.validateCanonicalProviderCampaignMigrationEvidence(
      rehashMigration(changed),
    ).valid);
}
add("position-1-existing-identities-preserved",
  migrationArtifact.retainedComparableExecution.evidenceV2PhysicalSha256 ===
    "50ff6c6abcae8dc8c02f73a3e443735d001ef0a8e6b02d1163c3850a33931241" &&
  migrationArtifact.retainedComparableExecution.blindPacketPhysicalSha256 ===
    "60a32eec79a6a3f5ab5550c8b98d4b40326bbc086bc2fdb6890a0ab2fe2885a7" &&
  sha(humanArtifactBuffer) ===
    "0306e7bca7813fea79cfb1292442a74b06159c3d68b988d30a365e2d6436a150");
add("position-2-original-failure-artifact-immutable",
  sha(failureArtifactBuffer) ===
    "7032e4ca290e8f364145699d60c197f83c5b32cd937d2ebbe69a0a36d2053d5e" &&
  failureArtifact.artifactHash ===
    "ea0f53062d283a582f4d285a3d8d8e5e823ee8a5612e029958753a56e48d19b6");
add("without-migration-historical-hard-failure-unchanged",
  withoutMigration.providerQualification.status ===
    "QUALIFICATION_IMPOSSIBLE_BY_PROVIDER_THRESHOLD" &&
  withoutMigration.providerQualification.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ).failures === 1);
add("valid-migration-suppresses-only-current-hard-gate-consequence",
  withMigration.providerQualification.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ).evaluated === 1 &&
  withMigration.providerQualification.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ).failures === 0 &&
  withMigration.terminalProviderFailureEvidence.caseIds.length === 0 &&
  withMigration.terminalProviderFailureEvidence.historicalCaseIds[0] ===
    "S9-CORE-001-EN" &&
  withMigration.terminalProviderFailureEvidence.supersededCaseIds[0] ===
    "S9-CORE-001-EN");
add("invalid-migration-cannot-suppress-hard-failure",
  withInvalidMigration.evidenceIssues.some((issue) =>
    issue.startsWith("campaign_migration_invalid:")) &&
  withInvalidMigration.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ).failures === 1);
add("historical-attempt-and-generation-count-preserved",
  withMigration.coverage.consumedProviderPositions === 2 &&
  withMigration.coverage.historicalProviderGenerations === 2 &&
  withMigration.coverage.historicalTerminalProviderFailures === 1 &&
  withMigration.coverage.supersededHistoricalAttempts === 1);
add("position-2-creates-no-matcher-or-human-evidence",
  withMigration.coverage.evaluatedComparableCases === 1 &&
  withMigration.coverage.humanReviewedExecutions === 1 &&
  withMigration.exactMatcherDiagnostics.semanticFail === 1 &&
  migrationArtifact.supersededHistoricalAttempt.matcherEvidenceCreated === false &&
  migrationArtifact.supersededHistoricalAttempt.humanReviewEvidenceCreated === false);
add("migrated-provider-qualification-pending-review",
  withMigration.providerQualification.status ===
    "QUALIFICATION_PENDING_REQUIRED_REVIEW");
add("migrated-stage9-incomplete-with-existing-levio-gaps",
  withMigration.levioProductGuarantee.status === "LEVIO_IMPLEMENTATION_GAP" &&
  withMigration.overallStage9.status === "STAGE9_INCOMPLETE" &&
  withMigration.overallStage9.blockers.includes(
    "PROVIDER_QUALIFICATION_PENDING_REVIEW") &&
  withMigration.overallStage9.blockers.includes("LEVIO_IMPLEMENTATION_GAP"));
add("coverage-distinguishes-replacement-and-untouched-positions",
  JSON.stringify(withMigration.coverage.currentComparableReplacementRequiredPositions) ===
    JSON.stringify([2]) &&
  JSON.stringify(withMigration.coverage.untouchedLogicalPositions) ===
    JSON.stringify({ first: 3, last: 160, count: 158 }));
add("historical-manifest-remains-backward-compatible",
  historicalManifestValidation.valid,
  historicalManifestValidation.issues.join(", "));
add("future-accepted-projection-version-is-comparability-bound",
  futureManifestIssues.includes("accepted_projection_comparability_version_missing"));
add("migration-persists-no-rejected-provider-content",
  !/(?:rawProvider|rawPrompt|rejectedOutput|rejectedProviderOutput)/i.test(
    JSON.stringify(migrationArtifact),
  ));
add("provider-and-network-operations-zero",
  networkOperations === 0 &&
  migrationArtifact.coverage.providerOperationsPerformedByMigration === 0);

const failed = checks.filter((check) => !check.passed);
console.log(JSON.stringify({
  gate: "stage-9-terra-campaign-migration",
  status: failed.length === 0 ? "PASS" : "FAIL",
  providerNetworkOperations: networkOperations,
  migrationArtifactHash: migrationArtifact.artifactHash,
  providerResultContractGate: withMigration.providerQualification.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ),
  providerQualification: withMigration.providerQualification.status,
  levioProductGuarantee: withMigration.levioProductGuarantee.status,
  overallStage9: withMigration.overallStage9,
  coverage: withMigration.coverage,
  terminalProviderFailureEvidence: withMigration.terminalProviderFailureEvidence,
  checks,
}, null, 2));
if (failed.length > 0) process.exitCode = 1;
