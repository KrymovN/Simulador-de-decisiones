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
const resultContract = require(join(
  root, "lib", "ai-quality", "canonical-provider-evaluation-result.ts",
));
const campaignEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-campaign-evidence.ts",
));
const failureEvidence = require(join(
  root, "lib", "ai-quality", "canonical-provider-campaign-failure-evidence.ts",
));

const checks = [];
function add(name, passed, detail = null) {
  checks.push({ name, passed: Boolean(passed), detail });
}
const sha = (value) => createHash("sha256").update(value).digest("hex");
const source = fixtures.CANONICAL_OFFLINE_EVALUATION_CASES[1];
const expectedCaseSha =
  "3ceee5f10db0ee4c75e42176ba256b7d6715d7a303a2347447a00419822f3c43";
const expectedLinkage = {
  campaignId: "stage9-terra-comparable-campaign-v1",
  attemptId: "stage9-terra-position-002-S9-CORE-001-EN",
  position: 2,
  caseId: "S9-CORE-001-EN",
  caseVersion: source.case_version,
  caseSha256: expectedCaseSha,
  locale: "en",
  semanticClusterId: "S9-CLUSTER-001",
  baselineCommit: "fd651a4c9336643e45e749b629af12318f2a1c8a",
  configurationFingerprint:
    "ee8c00893a300a8534c597f285ce99ab57b139475c9c88abf5bc9d62efcfe142",
};
const authorization = {
  inputTokens: 5831,
  maxInputTokens: 6000,
  maxOutputTokens: 4000,
  configuredMaxTotalTokens: 10000,
  maximumAuthorizedTotalTokens: 9831,
  theoreticalUncachedCommitmentUsd: 0.059662,
  maximumCommitmentUsd: 0.06,
  tokenPreflightLatencyMs: 1344,
};
const currentUnavailableMetadata = {
  responseId: null,
  returnedModel: null,
  serviceTier: null,
  generationLatencyMs: null,
  usage: {
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    totalTokens: null,
  },
  actualCostUsd: null,
};
const position2Validation = {
  status: "invalid",
  category: "evaluation_result_contract_invalid",
  preMatcherDiagnostic: {
    issues: [{
      stage: "evaluation_result_contract",
      code: "imperative_instruction_forbidden",
      path: "candidate_material.items[0].content",
      candidateIndex: 0,
      annotationCategory: null,
      annotationIndex: null,
      candidateId: "opt_1",
      sourceRef: null,
      receivedIdentifier: null,
      receivedCount: null,
      receivedLength: 33,
      expectedConstraint:
        "candidate content must satisfy the provider-visible evaluation safety rules",
    }],
    truncated: false,
  },
};
function captureInput(validation, operationalMetadata = currentUnavailableMetadata) {
  return {
    campaignId: expectedLinkage.campaignId,
    attemptId: expectedLinkage.attemptId,
    position: expectedLinkage.position,
    sourceCase: source,
    baselineCommit: expectedLinkage.baselineCommit,
    configurationFingerprint: expectedLinkage.configurationFingerprint,
    configuredProvider: "openai",
    configuredModel: "gpt-5.6-terra",
    authorization,
    operationalMetadata,
    validation,
  };
}

add("position-2-frozen-case-linkage",
  source.case_id === expectedLinkage.caseId && source.language === expectedLinkage.locale &&
  source.provenance.semantic_cluster_id === expectedLinkage.semanticClusterId &&
  campaignEvidence.canonicalEvidenceSha256(source) === expectedCaseSha);

const rebuiltPosition2 = failureEvidence.captureCanonicalProviderContractFailureEvidence(
  captureInput(position2Validation),
);
add("position-2-terminal-failure-captured", rebuiltPosition2.status === "captured");

const artifactPath = join(
  root, "docs", "qa", "stage-9", "live-evidence",
  "STAGE_9_TERRA_POSITION_2_PROVIDER_CONTRACT_FAILURE_EVIDENCE.v1.json",
);
const persistedBytes = readFileSync(artifactPath);
const persisted = JSON.parse(persistedBytes);
const persistedValidation = failureEvidence.validateCanonicalProviderCampaignFailureEvidence(
  persisted,
  expectedLinkage,
);
add("position-2-persisted-artifact-valid", persistedValidation.valid,
  persistedValidation.issues.join(", "));
add("position-2-artifact-rebuild-exact", rebuiltPosition2.status === "captured" &&
  rebuiltPosition2.artifact.artifactHash === persisted.artifactHash &&
  campaignEvidence.canonicalEvidenceSha256(rebuiltPosition2.artifact) ===
    campaignEvidence.canonicalEvidenceSha256(persisted));
add("position-2-unavailable-metadata-not-fabricated",
  persisted.provider.responseId === null && persisted.provider.returnedModel === null &&
  persisted.provider.serviceTier === null && persisted.execution.generationLatencyMs === null &&
  Object.values(persisted.execution.usage).every((value) => value === null) &&
  persisted.execution.actualCostUsd === null && persisted.execution.unavailableFields.length === 10);
add("position-2-downstream-not-reached",
  persisted.downstreamState.matcherExecuted === false &&
  persisted.downstreamState.evidenceV2Created === false &&
  persisted.downstreamState.blindPacketCreated === false &&
  persisted.downstreamState.humanReviewStatus === "NOT_REACHED" &&
  persisted.downstreamState.comparableValidatedResult === false);
add("position-2-bounded-diagnostic-only",
  JSON.stringify(persisted.contractFailureDiagnostic) === JSON.stringify({
    stage: "evaluation_result_contract",
    code: "imperative_instruction_forbidden",
    path: "candidate_material.items[0].content",
    candidateId: "opt_1",
    receivedLength: 33,
    truncated: false,
  }));
const serializedPersisted = JSON.stringify(persisted);
add("position-2-rejected-output-absent",
  !/[\"](?:candidate_material|validatedResult|outputText|rawProviderResponse|rawResponse)[\"]/.test(
    serializedPersisted,
  ) && persisted.privacyCaptureAttestation.rejectedProviderOutputPersisted === false);

function candidateItem(content) {
  return {
    candidate_id: "future_opt_1",
    item_type: "option",
    content,
    provenance: { source: "provider_candidate", source_ref: "case_situation" },
    confidence: "unknown",
    evidence: "provider_inference",
    option_refs: [],
    scenario_refs: [],
    criterion_refs: [],
    authority: "candidate_only",
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
  };
}
const emptyAnnotations = Object.fromEntries(
  taxonomy.CANONICAL_PROVIDER_EVALUATION_CATEGORIES.map((category) => [category, []]),
);
const futureInvalidResult = {
  evaluation_contract_version: resultContract.CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
  candidate_material: {
    capability: "candidate_decision_material_v1",
    contract_version: "1.0",
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items: [candidateItem("Choose this option immediately.")],
  },
  evaluation_annotations: emptyAnnotations,
  outcome: { kind: "candidate_material", v2_status: "SIMULATED" },
};
const compiled = require(join(
  root, "lib", "ai-decision-material", "canonical-provider-evaluation-input.ts",
)).compileCanonicalProviderEvaluationInput(source);
const futureInvalidValidation = resultContract.validateCanonicalProviderEvaluationResult(
  futureInvalidResult,
  compiled.input,
);
const futureMetadata = {
  responseId: "resp_future_contract_failure_001",
  returnedModel: "gpt-5.6-terra-2026-08-01",
  serviceTier: "default",
  generationLatencyMs: 4321,
  usage: {
    inputTokens: 5831,
    cachedInputTokens: 1200,
    outputTokens: 240,
    reasoningTokens: 80,
    totalTokens: 6071,
  },
  actualCostUsd: 0.01234,
};
let matcherOperations = 0;
let blindPacketOperations = 0;
let futureFailure;
if (futureInvalidValidation.status === "invalid") {
  futureFailure = failureEvidence.captureCanonicalProviderContractFailureEvidence(
    captureInput(futureInvalidValidation, futureMetadata),
  );
} else {
  matcherOperations += 1;
  blindPacketOperations += 1;
}
add("future-contract-invalid-routes-to-failure-evidence",
  futureInvalidValidation.status === "invalid" && futureFailure?.status === "captured");
add("future-contract-failure-stops-before-matcher-and-blind-packet",
  matcherOperations === 0 && blindPacketOperations === 0 &&
  futureFailure?.artifact.downstreamState.matcherExecuted === false &&
  futureFailure?.artifact.downstreamState.blindPacketCreated === false);
add("future-safe-operational-metadata-preserved",
  futureFailure?.status === "captured" &&
  JSON.stringify(futureFailure.artifact.provider) === JSON.stringify({
    configuredProvider: "openai",
    configuredModel: "gpt-5.6-terra",
    responseId: futureMetadata.responseId,
    returnedModel: futureMetadata.returnedModel,
    serviceTier: futureMetadata.serviceTier,
  }) && futureFailure.artifact.execution.generationLatencyMs === 4321 &&
  JSON.stringify(futureFailure.artifact.execution.usage) === JSON.stringify(futureMetadata.usage) &&
  futureFailure.artifact.execution.actualCostUsd === futureMetadata.actualCostUsd &&
  futureFailure.artifact.execution.unavailableFields.length === 0);
add("capture-input-with-raw-provider-response-rejected",
  failureEvidence.captureCanonicalProviderContractFailureEvidence({
    ...captureInput(futureInvalidValidation, futureMetadata),
    rawProviderResponse: futureInvalidResult,
  }).status === "rejected");

const validResult = {
  evaluation_contract_version: resultContract.CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
  candidate_material: null,
  evaluation_annotations: emptyAnnotations,
  outcome: { kind: "controlled_failure", v2_status: "CANNOT_RECOMMEND" },
};
const validValidation = resultContract.validateCanonicalProviderEvaluationResult(
  validResult,
  compiled.input,
);
const wrongFailurePath = failureEvidence.captureCanonicalProviderContractFailureEvidence(
  captureInput(validValidation, futureMetadata),
);
const validExecution = campaignEvidence.captureCanonicalProviderExecutionEvidence({
  campaignId: "campaign-valid-result-regression",
  executionId: "execution-valid-result-regression",
  position: 1,
  sourceCase: source,
  providerConfiguration: {
    provider: "openai",
    model: "gpt-5.6-terra",
    returnedModel: futureMetadata.returnedModel,
    providerResponseId: futureMetadata.responseId,
    serviceTier: futureMetadata.serviceTier,
    reasoning: { effort: "low" },
    maxOutputTokens: 4000,
    timeoutMs: 120000,
    store: false,
    tools: [],
    retries: 0,
    automaticReruns: 0,
  },
  result: validResult,
  operationalEvidence: {
    status: "COMPLETED",
    inputTokens: 5831,
    cachedInputTokens: 1200,
    outputTokens: 240,
    reasoningTokens: 80,
    totalTokens: 6071,
    conservativeUncachedCostUsd: 0.014542,
    cacheAdjustedCalculatedCostUsd: 0.012142,
    generationLatencyMs: 4321,
    stageLatenciesMs: { generation: 4321, validation: 1 },
    sanitizedErrorMetadata: null,
  },
  approvedCostBudgetPassed: true,
});
const validBlindPacket = validExecution.status === "captured"
  ? campaignEvidence.buildCanonicalProviderBlindReviewPacket(validExecution.record)
  : null;
add("valid-result-remains-evidence-v2-path",
  validValidation.status === "valid" && wrongFailurePath.status === "rejected" &&
  validExecution.status === "captured" && validExecution.record.validatedResult !== null &&
  validBlindPacket?.version === "canonical-provider-blind-review-packet.1");

const position1HumanReviewPath = join(
  root, "docs", "qa", "stage-9", "live-evidence",
  "STAGE_9_TERRA_POSITION_1_HUMAN_REVIEW_EVIDENCE.v1.json",
);
add("position-1-human-review-physical-sha-unchanged",
  sha(readFileSync(position1HumanReviewPath)) ===
    "0306e7bca7813fea79cfb1292442a74b06159c3d68b988d30a365e2d6436a150");

let providerOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  providerOperations += 1;
  throw new Error("Provider operations forbidden in failure evidence quality gate.");
};
globalThis.fetch = originalFetch;
add("provider-operations-zero", providerOperations === 0);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  gate: "quality:stage-9-provider-contract-failure-evidence",
  passed: failed.length === 0,
  passed_checks: checks.length - failed.length,
  total_checks: checks.length,
  provider_operations: providerOperations,
  position_2_artifact_hash: persisted.artifactHash,
  position_2_physical_sha256: sha(persistedBytes),
  failed,
}, null, 2));
if (failed.length > 0) process.exit(1);
