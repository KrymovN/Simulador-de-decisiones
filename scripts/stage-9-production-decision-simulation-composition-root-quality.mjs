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
const compositionRoot = read("lib", "ai-integration", "production-decision-simulation-composition-root.server.ts");
const compositionValidation = read("lib", "ai-integration", "production-decision-simulation-composition-root.validation.ts");
const serverTransport = read("lib", "ai-provider", "openai-synthetic-risk-adapter.server.ts");
const orchestrator = read("lib", "ai-integration", "production-decision-simulation-orchestrator.ts");
const integrationIndex = read("lib", "ai-integration", "index.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden during composition-root validation.");
};

const validation = require(join(root, "lib", "ai-integration", "production-decision-simulation-composition-root.validation.ts"));
const result = await validation.runProductionDecisionSimulationCompositionRootValidation();
const orchestratorRegression = await require(join(root, "lib", "ai-integration", "production-decision-simulation-orchestrator.validation.ts")).runProductionDecisionSimulationOrchestratorValidation();
const providerRegression = await require(join(root, "lib", "ai-provider", "openai-decision-material-adapter-validation.ts")).runStage9OpenAIDecisionMaterialAdapterValidation();
const postProviderRegression = require(join(root, "lib", "decision-engine", "post-provider-boundary-validation.ts")).runPostProviderDecisionEngineBoundaryValidation();
const simulationCompositionRegression = require(join(root, "lib", "decision-engine", "post-provider-simulation-composition-validation.ts")).runPostProviderSimulationCompositionValidation();
const pipelineRegression = require(join(root, "lib", "decision-engine", "simulation-pipeline-runner-validation.ts")).runSimulationPipelineRunnerValidation();
globalThis.fetch = originalFetch;

const checks = result.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issue ?? "Composition-root validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

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
  "lib/ai-integration/index.ts",
  "lib/ai-integration/production-decision-simulation-composition-root.server.ts",
  "lib/ai-integration/production-decision-simulation-composition-root.validation.ts",
  "lib/ai-provider/openai-synthetic-risk-adapter.server.ts",
  "scripts/stage-9-production-decision-simulation-composition-root-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowedWriteSet.has(path));
const clientImports = spawnSync("rg", ["-n", "production-decision-simulation-composition-root", "app", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

add("server-only-composition-root", compositionRoot.startsWith('import "server-only";'), "Composition root must be server-only.");
add("existing-orchestrator-bound", compositionRoot.includes("executeProductionDecisionSimulationFlow(") && compositionRoot.includes('from "./production-decision-simulation-orchestrator"'), "Composition root must bind the existing production orchestrator.");
add("existing-openai-transport-bound", compositionRoot.includes("createOpenAIDecisionMaterialTransport") && serverTransport.includes("createOpenAITransport<DecisionMaterialProviderRequest>"), "Composition root must reuse the existing OpenAI Responses transport.");
add("existing-environment-boundary", compositionRoot.includes("readOpenAIEnvironmentConfiguration()") && serverTransport.includes("process.env.LEVIO_REAL_AI_DEV_ENABLED") && serverTransport.includes("process.env.LEVIO_AI_PROVIDER") && serverTransport.includes("process.env.OPENAI_API_KEY"), "Composition root must use the existing server environment configuration boundary.");
add("credential-stops-at-transport", compositionRoot.includes("transportFactory(resolved.apiKey)") && !orchestrator.includes("OPENAI_API_KEY") && !orchestrator.includes("process.env"), "API key must stop at the server transport factory.");
add("provider-model-not-request-controls", compositionRoot.includes("modelControlledByAdapter: true") && compositionValidation.includes("client_runtime_controls_are_rejected") && !compositionRoot.includes("request.provider") && !compositionRoot.includes("request.model"), "Client request must not control provider or model.");
add("single-existing-provider-abstraction", !compositionRoot.includes("createAIProviderAdapter") && !compositionRoot.includes("createAIProviderRuntimeSelection") && !compositionRoot.includes("createAIProviderBoundary"), "Composition root must not create a parallel provider abstraction.");
add("no-direct-egress", !compositionRoot.includes("fetch(") && !compositionRoot.includes("responses.create(") && !compositionRoot.includes("responses.inputTokens"), "Composition root must delegate all provider operations to the existing transport.");
add("controlled-invalid-environment", compositionRoot.includes("runtime_disabled") && compositionRoot.includes("provider_not_approved") && compositionRoot.includes("credentials_unavailable") && compositionValidation.includes("downstream_stages_skip_after_binding_failure"), "Invalid environment must fail closed through controlled errors.");
add("production-entry-exported", integrationIndex.includes("createProductionDecisionSimulationCompositionRoot"), "The controlled server composition interface must be exported.");
add("validation-helper-not-barrel-exported", !integrationIndex.includes("bindProductionDecisionSimulationCompositionRoot"), "Offline dependency injection must not be exposed through the shared barrel.");
add("no-client-import", clientImports.status === 1 && !clientImports.stdout.trim(), "App and component code must not import the composition root.");
add("public-api-still-mock", route.includes("mockOnly: true") && !route.toLowerCase().includes("openai"), "Public /api/simulate must remain mock-only and provider-free.");
add("ui-still-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai"), "HomeSimulator must remain on the public mock API.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-production-decision-simulation-composition-root"'), "Dedicated composition-root gate must be registered.");
add("external-network-zero", externalNetworkRequests === 0 && result.summary.networkRequests === 0, "Offline validation must execute zero external network requests.");
add("exact-bounded-write-set", unexpected.length === 0, `Unexpected changed paths: ${unexpected.join(", ") || "none"}.`);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}
const positive = result.cases.filter((item) => item.kind === "positive");
const negative = result.cases.filter((item) => item.kind === "negative");
console.log(`POSITIVE ${positive.filter((item) => item.passed).length}/${positive.length} PASS`);
console.log(`NEGATIVE ${negative.filter((item) => item.passed).length}/${negative.length} PASS`);
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
