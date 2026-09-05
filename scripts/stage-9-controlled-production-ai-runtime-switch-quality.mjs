import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
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
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
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
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const runtime = read("lib", "runtime-integration", "controlled-production-ai-runtime-switch.server.ts");
const runtimeValidation = read("lib", "runtime-integration", "controlled-production-ai-runtime-switch-validation.ts");
const contracts = read("lib", "runtime-integration", "controlled-simulator-runtime-switch-contracts.ts");
const existingSwitch = read("lib", "runtime-integration", "controlled-simulator-runtime-switch.ts");
const compositionRoot = read("lib", "ai-integration", "production-decision-simulation-composition-root.server.ts");
const serverTransport = read("lib", "ai-provider", "openai-synthetic-risk-adapter.server.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden during runtime-switch validation.");
};

const selectionValidation = await require(join(root, "lib", "runtime-integration", "controlled-production-ai-runtime-switch-validation.ts")).runControlledProductionAiRuntimeSwitchValidation();
const existingSwitchRegression = require(join(root, "lib", "runtime-integration", "controlled-simulator-runtime-switch-validation.ts")).runControlledSimulatorSwitchValidation();
const compositionRootRegression = await require(join(root, "lib", "ai-integration", "production-decision-simulation-composition-root.validation.ts")).runProductionDecisionSimulationCompositionRootValidation();
const orchestratorRegression = await require(join(root, "lib", "ai-integration", "production-decision-simulation-orchestrator.validation.ts")).runProductionDecisionSimulationOrchestratorValidation();
const providerRegression = await require(join(root, "lib", "ai-provider", "openai-decision-material-adapter-validation.ts")).runStage9OpenAIDecisionMaterialAdapterValidation();
const postProviderRegression = require(join(root, "lib", "decision-engine", "post-provider-boundary-validation.ts")).runPostProviderDecisionEngineBoundaryValidation();
const simulationCompositionRegression = require(join(root, "lib", "decision-engine", "post-provider-simulation-composition-validation.ts")).runPostProviderSimulationCompositionValidation();
const pipelineRegression = require(join(root, "lib", "decision-engine", "simulation-pipeline-runner-validation.ts")).runSimulationPipelineRunnerValidation();
globalThis.fetch = originalFetch;

const checks = selectionValidation.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issue ?? "Runtime-selection validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

add("existing-controlled-switch-pass", existingSwitchRegression.passed && !existingSwitchRegression.failed, "Existing controlled deterministic switch must remain valid.");
add("existing-composition-root-pass", compositionRootRegression.passed && !compositionRootRegression.failed && compositionRootRegression.summary.networkRequests === 0, "Production composition root must remain valid and offline.");
add("existing-orchestrator-pass", orchestratorRegression.passed && !orchestratorRegression.failed && orchestratorRegression.summary.networkRequests === 0, "Production orchestrator must remain valid and offline.");
add("existing-provider-adapter-pass", providerRegression.passed && !providerRegression.failed && providerRegression.summary.networkRequests === 0, "Provider Adapter must remain valid and offline.");
add("existing-post-provider-boundary-pass", postProviderRegression.passed && !postProviderRegression.failed, "Post-provider Decision Engine boundary must remain valid.");
add("existing-simulation-composition-pass", simulationCompositionRegression.passed && !simulationCompositionRegression.failed, "Simulator composition must remain valid.");
add("existing-simulation-pipeline-pass", pipelineRegression.passed, "Simulation Pipeline must remain valid.");

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowedWriteSet = new Set([
  "lib/ai-provider/openai-decision-material-adapter.ts",
  "lib/ai-provider/openai-decision-material-adapter-validation.ts",
  "lib/ai-provider/openai-synthetic-risk-adapter.ts",
  "lib/ai-provider/openai-synthetic-risk-adapter.server.ts",
  "lib/ai-provider/provider-failure-observability.ts",
  "lib/ai-integration/production-decision-simulation-orchestrator.ts",
  "lib/runtime-integration/controlled-production-ai-runtime-switch.server.ts",
  "lib/runtime-integration/controlled-production-ai-runtime-switch-validation.ts",
  "lib/runtime-integration/controlled-simulator-runtime-switch-contracts.ts",
  "lib/runtime-integration/public-simulation-api-v2-adapter.server.ts",
  "lib/runtime-integration/public-simulation-api-v2-contracts.ts",
  "app/api/simulate/route.ts",
  "components/HomeSimulator.tsx",
  "scripts/public-api-controlled-ai-composition-quality.mjs",
  "scripts/stage-9-openai-synthetic-risk-adapter-quality.mjs",
  "scripts/public-home-simulator-api-integration-quality.mjs",
  "scripts/stage-9-controlled-failure-product-presentation-quality.mjs",
  "scripts/stage-9-controlled-production-ai-runtime-switch-quality.mjs",
  "scripts/stage-9-openai-decision-material-adapter-quality.mjs",
  "scripts/stage-9-production-decision-simulation-orchestrator-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowedWriteSet.has(path));
const clientImports = spawnSync("rg", ["-n", "controlled-production-ai-runtime-switch", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

const deterministicIndex = runtime.indexOf("runControlledSimulatorRuntimeSwitch(value, {})");
const compositionIndex = runtime.indexOf("compositionRoot.execute({");
add("server-only-runtime-callsite", runtime.startsWith('import "server-only";') && runtime.includes("runControlledProductionAiRuntimeSwitch"), "Production runtime callsite must be server-only and exported.");
add("existing-switch-controls-selection", deterministicIndex >= 0 && compositionIndex > deterministicIndex && runtime.includes("return deterministic"), "Existing controlled switch must own validation/default selection before AI execution.");
add("existing-composition-root-used", runtime.includes("bindProductionDecisionSimulationCompositionRoot") && runtime.includes("ProductionDecisionSimulationCompositionRoot"), "Runtime selection must use the existing production composition root.");
add("default-deny-before-credential", serverTransport.includes('if (enabled !== "true")') && serverTransport.indexOf('if (enabled !== "true")') < serverTransport.indexOf("environment.OPENAI_API_KEY"), "Disabled environment must return before credential access.");
add("existing-server-environment-used", runtime.includes("process.env") && runtime.includes("readOpenAIEnvironmentConfiguration"), "Runtime callsite must use existing server environment configuration.");
add("no-client-runtime-selection", runtime.includes("exactRuntimeRequest") && runtimeValidation.includes("client_cannot_activate_or_configure_ai_runtime") && contracts.includes("clientRuntimeSelectionAllowed: false"), "Client input must not select or configure AI runtime.");
add("canonical-bridge-only", runtime.includes("DecisionEnginePromptContextBridgeRequest") && runtime.includes("bridgeRequest: canonicalBridgeRequest") && !runtime.includes("rawPrompt"), "AI runtime must pass only a canonical Decision Engine bridge request.");
add("decision-engine-authority", contracts.includes("decisionEngineAuthorityPreserved") && contracts.includes("directProviderToSimulatorAllowed: false"), "Runtime result must preserve post-provider Decision Engine authority.");
add("controlled-no-hidden-ai-fallback", runtime.includes('code: "production_ai_execution_failed"') && runtime.includes("fallback: { used: false }") && !runtime.includes("fallbackToPublicMockV1"), "AI configuration/execution failures must not silently fall back.");
add("operational-contract-is-controlled", contracts.includes("ControlledProductionAiOperationalEvent") && contracts.includes('fallbackState: "not_used" | "fail_closed"') && contracts.includes('rollbackState: "active" | "available"') && contracts.includes("sensitiveDataIncluded: false"), "Operational evidence must use a controlled safe contract.");
add("runtime-lifecycle-observed", runtime.includes('event: "runtime_selected"') && runtime.includes('event: "orchestration_started"') && runtime.includes('event: "orchestration_completed"') && runtime.includes('event: "orchestration_failed"'), "Runtime selection and orchestration lifecycle must be observable.");
add("provider-operations-observed", runtime.includes('providerOperation: "input_token_count"') && runtime.includes('providerOperation: "generation"') && runtime.includes("calculateDecisionMaterialCost"), "Provider status, token usage, latency, and cost must be normalized operationally.");
add("operational-observer-is-non-authoritative", runtime.includes("Operational evidence must never alter controlled runtime behaviour") && runtimeValidation.includes("operational_sink_failure_does_not_change_runtime_result"), "Operational sink failures must not change runtime authority or results.");
add("operational-content-exclusion-tested", runtimeValidation.includes("operational_evidence_excludes_sensitive_and_raw_content") && runtimeValidation.includes("offline-runtime-key") && runtimeValidation.includes("outputText"), "Operational evidence must exclude credentials and raw request/response content.");
add("existing-switch-controls-rollback", runtime.includes('environment.LEVIO_REAL_AI_DEV_ENABLED === "true"') && runtime.includes('rollbackState: "active"') && runtimeValidation.includes("server_switch_rollback_restores_mock_without_credentials_or_provider"), "Rollback must use the existing server switch and restore deterministic execution without provider access.");
add("no-new-runtime-flag-framework", !runtime.includes("FEATURE_FLAG") && !runtime.includes("ROLLBACK_ENABLED") && !runtime.includes("AI_RUNTIME_ROLLBACK"), "Operational safety must not introduce another feature-flag framework.");
add("no-parallel-provider-abstraction", !runtime.includes("createAIProviderAdapter") && !runtime.includes("createAIProviderRuntimeSelection") && !runtime.includes("createAIProviderBoundary"), "Runtime callsite must not create another provider abstraction.");
add("no-direct-provider-egress", !runtime.includes("fetch(") && !runtime.includes("responses.create(") && !runtime.includes('from "openai"'), "Runtime switch must delegate provider work to the existing composition root/transport.");
add("existing-switch-source-unchanged", !changed.includes("lib/runtime-integration/controlled-simulator-runtime-switch.ts"), "Existing deterministic switch implementation must not be rewritten.");
add("composition-root-source-unchanged", !changed.includes("lib/ai-integration/production-decision-simulation-composition-root.server.ts"), "Existing production composition root must not be rewritten for runtime selection.");
add("no-client-import", clientImports.status === 1 && !clientImports.stdout.trim(), "Client components must not import the server runtime callsite.");
add("public-api-controlled-and-default-deny", route.includes("runControlledProductionAiRuntimeSwitch") && route.includes('LEVIO_REAL_AI_DEV_ENABLED === "true"') && route.includes("runInternalSimulationPipeline") && !route.toLowerCase().includes('from "openai"') && !route.includes("responses.create("), "Public /api/simulate must use the protected runtime only behind the existing explicit server gate and retain deterministic default execution.");
add("ui-still-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai") && !home.includes("controlled-production-ai-runtime-switch") && !home.includes("process.env"), "HomeSimulator must consume only truthful public API envelopes without runtime controls.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-controlled-production-ai-runtime-switch"'), "Dedicated runtime-selection gate must be registered.");
add("external-network-zero", externalNetworkRequests === 0 && selectionValidation.summary.networkRequests === 0, "Offline validation must execute zero external network requests.");
add("exact-bounded-write-set", unexpected.length === 0, `Unexpected changed paths: ${unexpected.join(", ") || "none"}.`);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}
const positive = selectionValidation.cases.filter((item) => item.kind === "positive");
const negative = selectionValidation.cases.filter((item) => item.kind === "negative");
console.log(`POSITIVE ${positive.filter((item) => item.passed).length}/${positive.length} PASS`);
console.log(`NEGATIVE ${negative.filter((item) => item.passed).length}/${negative.length} PASS`);
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
