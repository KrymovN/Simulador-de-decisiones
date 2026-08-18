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
const campaignEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-campaign-evidence.ts",
));
const aggregation = require(join(
  root, "lib", "ai-quality", "canonical-provider-evaluation-aggregation.ts",
));
const review = require(join(
  root, "lib", "ai-quality", "canonical-provider-review-policy.ts",
));
const humanReviewEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-human-review-evidence.ts",
));
const migrationEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-campaign-migration-evidence.ts",
));

const live = join(root, "docs", "qa", "stage-9", "live-evidence");
const load = (name) => {
  const buffer = readFileSync(join(live, name));
  return { buffer, value: JSON.parse(buffer.toString("utf8")) };
};
const sha = (value) => createHash("sha256").update(value).digest("hex");
const replacement = load("STAGE_9_TERRA_POSITION_2_REPLACEMENT_EVIDENCE.v2.json");
const blind = load("STAGE_9_TERRA_POSITION_2_REPLACEMENT_BLIND_REVIEW_PACKET.v1.json");
const migration = load("STAGE_9_TERRA_ACCEPTED_PROJECTION_MIGRATION_EVIDENCE.v1.json");
const historicalFailure = load(
  "STAGE_9_TERRA_POSITION_2_PROVIDER_CONTRACT_FAILURE_EVIDENCE.v1.json",
);
const position1Human = load("STAGE_9_TERRA_POSITION_1_HUMAN_REVIEW_EVIDENCE.v1.json");
const cases = fixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const byId = new Map(cases.map((item) => [item.case_id, item]));
const categories = taxonomy.CANONICAL_PROVIDER_EVALUATION_CATEGORIES;

function comparableFromExecution(record) {
  const source = byId.get(record.caseId);
  const expected = taxonomy.canonicalOracleConceptsByCategory(source);
  return {
    caseId: record.caseId,
    locale: record.locale,
    semanticClusterId: record.semanticClusterId,
    executionHash: record.executionHash,
    matcher: {
      passed: record.automatedEvidence.matcherPassed,
      categories: Object.fromEntries(categories.map((category) => [category, {
        ...structuredClone(record.automatedEvidence.matcher[category]),
        expected: [...expected[category]].sort(),
      }])),
    },
    deterministicGates: {
      provider_result_contract:
        record.automatedEvidence.hardGates.provider_result_contract,
      candidate_contract_and_safety:
        record.automatedEvidence.hardGates.candidate_contract_and_safety,
      oracle_isolation: record.automatedEvidence.hardGates.oracle_isolation,
      approved_cost_budget: record.automatedEvidence.hardGates.approved_cost_budget,
    },
    normalizedCostRecorded: true,
  };
}

const p1Missing = {
  scenario: ["do_not_invent_facts", "include_no_action_or_information_first_path"],
  risk: ["preserve_likelihood_uncertainty"],
  recommendation: ["conditional_recommendation_allowed"],
  failure: ["fail_closed"],
  traceability: ["preserve_case_id"],
  rubric: ["safety_privacy_equivalence"],
};
const p1Unexpected = {
  risk: ["deadline_pressure", "opportunity_cost"],
  privacy: ["no_identifiers"],
};
function position1Comparable() {
  const source = byId.get("S9-CORE-001-ES");
  const oracle = taxonomy.canonicalOracleConceptsByCategory(source);
  const matcherCategories = Object.fromEntries(categories.map((category) => {
    const expected = [...oracle[category]].sort();
    const missing = [...(p1Missing[category] ?? [])].sort();
    const unexpected = [...(p1Unexpected[category] ?? [])].sort();
    const actual = [...expected.filter((item) => !missing.includes(item)), ...unexpected].sort();
    return [category, {
      passed: category === "v2_status"
        ? missing.length === 0 && unexpected.length === 0 && actual.length === 1
        : missing.length === 0 && unexpected.length === 0,
      expected, actual, missing, unexpected,
    }];
  }));
  return {
    caseId: source.case_id,
    locale: source.language,
    semanticClusterId: source.provenance.semantic_cluster_id,
    executionHash:
      "4bcc5d6371415286e7a2cba707d24529bf7d2ae9f562ae01d418e7bb0e2336b6",
    matcher: {
      passed: false,
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

const record = replacement.value.executions[0];
const position2Comparable = comparableFromExecution(record);
const reviewEvidence =
  humanReviewEvidence.canonicalProviderCampaignReviewEvidenceFromHumanArtifact(
    position1Human.value,
  );
const levioGuarantees = Object.fromEntries(
  aggregation.CANONICAL_LEVIO_GUARANTEE_IDS.map((id) => [id, "PASS"]),
);
levioGuarantees.minimum_necessary_prompt_context = "LEVIO_IMPLEMENTATION_GAP";
levioGuarantees.controlled_failure_product_presentation = "LEVIO_IMPLEMENTATION_GAP";
const failureInput = [{
  kind: "TERMINAL_PROVIDER_FAILURE",
  artifact: historicalFailure.value,
  expectedLinkage: {
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
  },
}];
const aggregationStarted = performance.now();
const result = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  [position1Comparable(), position2Comparable],
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuarantees,
  reviewEvidence,
  failureInput,
  { kind: "CAMPAIGN_SEMANTICS_MIGRATION", artifact: migration.value },
);
const aggregationLatencyMs = Math.round(performance.now() - aggregationStarted);
const invalidMigrationSource = structuredClone(migration.value);
invalidMigrationSource.retainedComparableExecution.equivalenceProof
  .replayAcceptedResultSha256 = sha("invalid-replacement-migration");
delete invalidMigrationSource.version;
delete invalidMigrationSource.artifactHash;
const invalidMigration = migrationEvidence.buildCanonicalProviderCampaignMigrationEvidence(
  invalidMigrationSource,
);
const invalidMigrationResult = aggregation.aggregateCanonicalProviderEvaluationCampaign(
  cases,
  [position1Comparable(), position2Comparable],
  aggregation.CANONICAL_AUTOMATED_METRIC_MAPPINGS,
  null,
  levioGuarantees,
  reviewEvidence,
  failureInput,
  { kind: "CAMPAIGN_SEMANTICS_MIGRATION", artifact: invalidMigration },
);
const rebuiltBlind = campaignEvidence.buildCanonicalProviderBlindReviewPacket(record);
const source = byId.get(record.caseId);
const reviewability = review.projectCanonicalProviderHumanReviewability({
  executionHash: record.executionHash,
  caseId: record.caseId,
  caseVersion: record.caseVersion,
  caseSha256: record.caseSha256,
  validatedResult: record.validatedResult,
  sourceCase: source,
  sourceCaseSha256: campaignEvidence.canonicalEvidenceSha256(source),
});
const projection = record.acceptedProjection;
const ledger = projection.acceptance?.ledger ?? [];
const dispositions = Object.fromEntries(
  [...new Set(ledger.map((item) => item.disposition))].map((disposition) => [
    disposition,
    ledger.filter((item) => item.disposition === disposition).length,
  ]),
);
const checks = [];
const add = (id, passed, detail = "Check failed.") =>
  checks.push({ id, passed: Boolean(passed), detail });
const validation = campaignEvidence.validateCanonicalProviderCampaignEvidenceV2(
  replacement.value,
  cases,
);
add("replacement-evidence-valid", validation.valid, validation.issues.join(", "));
add("replacement-identity-exact",
  record.position === 2 && record.caseId === "S9-CORE-001-EN" &&
  record.locale === "en" && record.semanticClusterId === "S9-CLUSTER-001" &&
  record.configurationFingerprint ===
    "ee8c00893a300a8534c597f285ce99ab57b139475c9c88abf5bc9d62efcfe142");
add("accepted-projection-bound",
  replacement.value.versionManifest.acceptedProjectionVersion ===
    "canonical-accepted-evaluation-projection.1" &&
  projection.version === "canonical-accepted-evaluation-projection.1");
add("complete-acceptance-ledger-no-silent-loss",
  projection.sourceResult.observedCandidateCount === 7 && ledger.length === 7 &&
  projection.acceptance.observed_candidate_count === 7 &&
  projection.acceptance.silent_drop_count === 0 && dispositions.accepted === 7);
add("annotation-projection-zero-loss",
  projection.annotationProjection.prunedAnnotationCount === 0 &&
  projection.annotationProjection.rewrittenAnnotationCount === 0 &&
  projection.annotationProjection.removedCandidateReferenceCount === 0 &&
  projection.annotationProjection.removedSourceReferenceCount === 0);
add("matcher-runs-on-accepted-result",
  record.automatedEvidence.matcherPassed === false &&
  record.automatedEvidence.hardGates.provider_result_contract === "PASS" &&
  record.automatedEvidence.hardGates.candidate_contract_and_safety === "PASS");
add("blind-packet-exact-and-sanitized",
  JSON.stringify(blind.value) === JSON.stringify(rebuiltBlind) &&
  blind.value.executionHash === record.executionHash &&
  blind.value.oracleIncluded === false && blind.value.matcherIncluded === false &&
  !Object.hasOwn(blind.value, "acceptedProjection") &&
  !/(?:rawPrompt|rawProvider|hiddenOracle|chainOfThought)/i.test(
    JSON.stringify(blind.value),
  ));
add("all-review-dimensions-reviewable",
  Object.values(reviewability).every((item) => item.applicable && item.reviewable));
add("migration-and-history-remain-valid",
  migrationEvidence.validateCanonicalProviderCampaignMigrationEvidence(
    migration.value,
  ).valid && historicalFailure.value.artifactHash ===
    "ea0f53062d283a582f4d285a3d8d8e5e823ee8a5612e029958753a56e48d19b6");
add("replacement-resolves-logical-position-without-double-counting",
  result.evidenceIssues.length === 0 && result.coverage.consumedProviderPositions === 2 &&
  result.coverage.historicalProviderGenerations === 3 &&
  result.coverage.evaluatedComparableCases === 2 &&
  result.coverage.supersededHistoricalAttempts === 1 &&
  result.coverage.currentComparableReplacementRequiredPositions.length === 0);
add("historical-failure-excluded-only-from-current-gate",
  result.coverage.terminalProviderFailures === 0 &&
  result.coverage.historicalTerminalProviderFailures === 1 &&
  result.terminalProviderFailureEvidence.historicalCaseIds[0] === "S9-CORE-001-EN" &&
  result.terminalProviderFailureEvidence.supersededCaseIds[0] === "S9-CORE-001-EN" &&
  result.providerQualification.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ).failures === 0);
add("invalid-migration-cannot-suppress-historical-hard-gate",
  invalidMigrationResult.overallStage9.status === "SYSTEM_EVIDENCE_INCOMPLETE" &&
  invalidMigrationResult.providerQualification.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ).failures === 1);
add("human-review-count-unchanged",
  result.coverage.humanReviewedExecutions === 1 &&
  result.coverage.humanReviewedExecutionsByLocale.es === 1 &&
  result.coverage.humanReviewedExecutionsByLocale.en === 0);
add("qualification-remains-incomplete",
  result.providerQualification.status === "QUALIFICATION_PENDING_REQUIRED_REVIEW" &&
  result.levioProductGuarantee.status === "LEVIO_IMPLEMENTATION_GAP" &&
  result.overallStage9.status === "STAGE9_INCOMPLETE");
add("historical-artifact-physical-hashes-unchanged",
  sha(position1Human.buffer) ===
    "0306e7bca7813fea79cfb1292442a74b06159c3d68b988d30a365e2d6436a150" &&
  sha(historicalFailure.buffer) ===
    "7032e4ca290e8f364145699d60c197f83c5b32cd937d2ebbe69a0a36d2053d5e" &&
  sha(migration.buffer) ===
    "f2f5085fdf8b3b49602409bb145d4c155725df2703c7bd2855d4249ab5365f19");

const failed = checks.filter((check) => !check.passed);
console.log(JSON.stringify({
  gate: "stage-9-terra-position2-replacement",
  status: failed.length === 0 ? "PASS" : "FAIL",
  providerOperations: 0,
  evidencePhysicalSha256: sha(replacement.buffer),
  blindPacketPhysicalSha256: sha(blind.buffer),
  executionHash: record.executionHash,
  acceptance: {
    observed: projection.sourceResult.observedCandidateCount,
    dispositions,
    rejectedReasons: ledger.filter((item) => item.disposition.startsWith("rejected"))
      .map((item) => item.reason),
    silentDropCount: projection.acceptance.silent_drop_count,
    annotationProjection: projection.annotationProjection,
  },
  matcher: {
    passed: record.automatedEvidence.matcherPassed,
    classification: record.automatedEvidence.matcherPassed ? "MATCH" : "SEMANTIC_FAIL",
    categories: record.automatedEvidence.matcher,
  },
  reviewability,
  aggregationLatencyMs,
  coverage: result.coverage,
  providerResultContractGate: result.providerQualification.hardGates.find(
    (gate) => gate.gateId === "provider_result_contract",
  ),
  providerQualification: result.providerQualification.status,
  levioProductGuarantee: result.levioProductGuarantee.status,
  overallStage9: result.overallStage9,
  providerPrivacy: result.reviewEvidenceAggregation?.providerPrivacy ?? null,
  multilingualReview: result.reviewEvidenceAggregation?.multilingual ?? null,
  checks,
}, null, 2));
if (failed.length > 0) process.exitCode = 1;
