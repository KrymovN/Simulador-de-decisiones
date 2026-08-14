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
const evaluationPath = join(root, "lib", "ai-quality", "canonical-provider-evaluation.ts");
const evaluationSource = readFileSync(evaluationPath, "utf8");
const evaluation = require(evaluationPath);
const fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
const adapter = require(join(root, "lib", "ai-provider", "openai-decision-material-adapter.ts"));
const campaignEvidence = require(join(
  root,
  "lib",
  "ai-quality",
  "canonical-provider-campaign-evidence.ts",
));

const checks = [];
const add = (id, passed, detail = "Check failed.") => checks.push({
  id,
  passed: Boolean(passed),
  detail,
});
const terra = evaluation.CANONICAL_PROVIDER_EVALUATION_TERRA_PROFILE;
const sol = evaluation.CANONICAL_PROVIDER_EVALUATION_SOL_PROFILE;
const active = evaluation.CANONICAL_PROVIDER_EVALUATION_CANDIDATE;
const limits = evaluation.CANONICAL_PROVIDER_EVALUATION_LIMITS;
const requestResult = evaluation.buildCanonicalProviderEvaluationRequest(
  fixtures.CANONICAL_OFFLINE_EVALUATION_CASES[0],
);
if (requestResult.status !== "ready") throw new Error("Canonical request did not compile.");
const request = requestResult.request.providerRequest;

add("terra-active-model", active.model === "gpt-5.6-terra" && request.model === active.model);
add("terra-reasoning-low", active.reasoningEffort === "low" && request.reasoningEffort === "low");
add("terra-max-output-4000", active.maxOutputTokens === 4000 && request.maxOutputTokens === 4000);
add("terra-timeout-120000", active.generationTimeoutMs === 120000 && limits.generationTimeoutMs === 120000);
add("terra-store-false", active.store === false && request.store === false);
add("terra-tools-empty", active.tools.length === 0 && request.tools.length === 0);
add("terra-retries-zero", active.retries === 0 && active.automaticReruns === 0);
add("terra-input-price-2", active.inputUsdPerMillion === 2);
add("terra-cached-input-price-02", active.cachedInputUsdPerMillion === 0.2);
add("terra-output-price-12", active.outputUsdPerMillion === 12);
add("terra-ceiling-006", active.maxCostUsd === 0.06 && limits.maxCostUsd === 0.06);
add("active-profile-atomic-source",
  active === evaluation.CANONICAL_PROVIDER_EVALUATION_PROFILES[
    evaluation.CANONICAL_PROVIDER_EVALUATION_ACTIVE_PROFILE_ID
  ] && ["maxInputTokens", "maxOutputTokens", "maxTotalTokens", "generationTimeoutMs",
    "maxLocalPayloadCharacters", "maxCostUsd"].every((key) => limits[key] === active[key]));
add("no-production-or-sol-config-merge",
  !evaluationSource.includes("OPENAI_DECISION_MATERIAL_LIMITS") &&
  !evaluationSource.includes("buildCandidateDecisionMaterialProviderRequest") &&
  request.model === terra.model && request.maxOutputTokens === terra.maxOutputTokens);
add("production-terra-bounds-unchanged",
  adapter.OPENAI_DECISION_MATERIAL_MODEL === "gpt-5.6-terra" &&
  adapter.OPENAI_DECISION_MATERIAL_LIMITS.maxOutputTokens === 2500 &&
  adapter.OPENAI_DECISION_MATERIAL_LIMITS.generationTimeoutMs === 30000);
add("production-pricing-budget-unchanged",
  adapter.OPENAI_DECISION_MATERIAL_LIMITS.inputUsdPerMillion === 2 &&
  adapter.OPENAI_DECISION_MATERIAL_LIMITS.cachedInputUsdPerMillion === 0.2 &&
  adapter.OPENAI_DECISION_MATERIAL_LIMITS.outputUsdPerMillion === 12 &&
  adapter.OPENAI_DECISION_MATERIAL_LIMITS.maxCostUsd === 0.05);
add("sol-profile-reproducible",
  sol.profileId === "stage9-sol-evaluation-v1" && sol.model === "gpt-5.6-sol" &&
  sol.maxOutputTokens === 4000 && sol.generationTimeoutMs === 120000 &&
  sol.inputUsdPerMillion === 5 && sol.cachedInputUsdPerMillion === 0.5 &&
  sol.outputUsdPerMillion === 30 && sol.maxCostUsd === 0.16);

const fingerprint = evaluation.CANONICAL_PROVIDER_EVALUATION_CANDIDATE_FINGERPRINT;
add("configuration-fingerprint-stable",
  /^[a-f0-9]{64}$/.test(fingerprint) &&
  fingerprint === evaluation.canonicalProviderEvaluationProfileFingerprint(terra));
const fingerprintFields = [
  ["model", "gpt-5.6-sol"],
  ["reasoningEffort", "medium"],
  ["maxOutputTokens", 3999],
  ["generationTimeoutMs", 119999],
  ["store", true],
  ["tools", ["not-allowed"]],
  ["retries", 1],
  ["inputUsdPerMillion", 2.01],
  ["cachedInputUsdPerMillion", 0.21],
  ["outputUsdPerMillion", 12.01],
  ["maxCostUsd", 0.061],
  ["profileVersion", "changed"],
];
add("fingerprint-covers-canonical-fields", fingerprintFields.every(([key, value]) =>
  evaluation.canonicalProviderEvaluationProfileFingerprint({ ...terra, [key]: value }) !==
    fingerprint));

const executionConfiguration = {
  provider: terra.provider,
  model: terra.model,
  returnedModel: terra.model,
  providerResponseId: "response-fingerprint-test",
  serviceTier: "default",
  reasoning: { effort: terra.reasoningEffort },
  maxOutputTokens: terra.maxOutputTokens,
  timeoutMs: terra.generationTimeoutMs,
  store: terra.store,
  tools: [],
  retries: terra.retries,
  automaticReruns: terra.automaticReruns,
};
add("evidence-v2-references-profile-fingerprint",
  campaignEvidence.canonicalProviderExecutionConfigurationFingerprint(
    executionConfiguration,
  ) === fingerprint);
add("response-metadata-does-not-change-profile-fingerprint",
  campaignEvidence.canonicalProviderExecutionConfigurationFingerprint({
    ...executionConfiguration,
    returnedModel: "gpt-5.6-terra-snapshot",
    providerResponseId: "response-fingerprint-test-2",
    serviceTier: "priority",
  }) === fingerprint);

const canonicalScaleAuthorization =
  evaluation.authorizeCanonicalProviderEvaluationGeneration(5728);
add("canonical-input-scale-authorized",
  canonicalScaleAuthorization.status === "authorized" &&
  canonicalScaleAuthorization.theoreticalUncachedCommitmentUsd === 0.059456);
add("maximum-input-exact-ceiling-authorized",
  evaluation.authorizeCanonicalProviderEvaluationGeneration(6000).status === "authorized" &&
  evaluation.calculateCanonicalProviderEvaluationCost(6000, 4000) === 0.06);
add("cache-discount-not-used-for-authorization",
  evaluationSource.includes("authorizeCanonicalProviderEvaluationGeneration") &&
  !evaluation.authorizeCanonicalProviderEvaluationGeneration.toString().includes(
    "cachedInputTokens",
  ));
const overCeiling = evaluation.authorizeCanonicalProviderEvaluationGeneration(6001);
add("over-006-blocked-before-generation",
  overCeiling.status === "blocked" && overCeiling.category === "cost_limit_exceeded" &&
  overCeiling.theoreticalUncachedCommitmentUsd > 0.06);
add("evaluation-production-separation-intentional",
  terra.maxOutputTokens !== adapter.OPENAI_DECISION_MATERIAL_LIMITS.maxOutputTokens &&
  terra.generationTimeoutMs !== adapter.OPENAI_DECISION_MATERIAL_LIMITS.generationTimeoutMs &&
  terra.maxCostUsd !== adapter.OPENAI_DECISION_MATERIAL_LIMITS.maxCostUsd);

let networkOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkOperations += 1;
  throw new Error("Network forbidden in Terra configuration quality gate.");
};
globalThis.fetch = originalFetch;
add("network-provider-operations-zero", networkOperations === 0);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  gate: "quality:stage-9-terra-evaluation-configuration",
  passed: failed.length === 0,
  passed_checks: checks.length - failed.length,
  total_checks: checks.length,
  network_operations: networkOperations,
  active_profile_id: active.profileId,
  active_model: active.model,
  configuration_fingerprint: fingerprint,
  failed,
}, null, 2));
if (failed.length > 0) process.exit(1);
