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
const orchestrator = read("lib", "ai-integration", "production-decision-simulation-orchestrator.ts");
const validationSource = read("lib", "ai-integration", "production-decision-simulation-orchestrator.validation.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden during orchestrator validation.");
};

const validation = require(join(root, "lib", "ai-integration", "production-decision-simulation-orchestrator.validation.ts"));
const result = await validation.runProductionDecisionSimulationOrchestratorValidation();
const bridgeRegression = require(join(root, "lib", "ai-integration", "decision-engine-prompt-context-bridge.validation.ts")).runDecisionEnginePromptContextBridgeValidation();
const providerRegression = await require(join(root, "lib", "ai-provider", "openai-decision-material-adapter-validation.ts")).runStage9OpenAIDecisionMaterialAdapterValidation();
const postProviderRegression = require(join(root, "lib", "decision-engine", "post-provider-boundary-validation.ts")).runPostProviderDecisionEngineBoundaryValidation();
const simulationCompositionRegression = require(join(root, "lib", "decision-engine", "post-provider-simulation-composition-validation.ts")).runPostProviderSimulationCompositionValidation();
const pipelineRegression = require(join(root, "lib", "decision-engine", "simulation-pipeline-runner-validation.ts")).runSimulationPipelineRunnerValidation();
globalThis.fetch = originalFetch;

const checks = result.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issue ?? "Orchestrator validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
add("existing-decision-prompt-bridge-pass", bridgeRegression.passed && !bridgeRegression.failed, "Decision Engine to Prompt Context bridge must remain valid.");
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
  "lib/ai-integration/production-decision-simulation-orchestrator.ts",
  "lib/ai-integration/production-decision-simulation-orchestrator.validation.ts",
  "lib/decision-engine/post-provider-boundary-validation.ts",
  "scripts/stage-9-production-decision-simulation-orchestrator-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowedWriteSet.has(path));
const clientImports = spawnSync("rg", ["-n", "production-decision-simulation-orchestrator", "app", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const bridgeIndex = orchestrator.indexOf("bridgeDecisionEngineToPromptContext(");
const providerIndex = orchestrator.indexOf("executeCandidateDecisionMaterial(");
const postProviderIndex = orchestrator.indexOf("composePostProviderDecisionMaterial(");
const simulationIndex = orchestrator.indexOf("composePostProviderSimulationResponse(");

add("server-only-orchestrator", orchestrator.startsWith('import "server-only";'), "Orchestrator must be server-only.");
add("existing-boundaries-only", [bridgeIndex, providerIndex, postProviderIndex, simulationIndex].every((index) => index >= 0), "Orchestrator must use every existing boundary.");
add("canonical-order-structural", bridgeIndex < providerIndex && providerIndex < postProviderIndex && postProviderIndex < simulationIndex, "Boundary calls must be structurally ordered Decision Engine → Prompt Context → Provider → Decision Engine → Simulator.");
add("transport-injected", orchestrator.includes("DecisionMaterialAdapterExecutionConfig") && orchestrator.includes("dependencies.transport") === false && validationSource.includes("mockTransport"), "Provider transport must remain injected through the existing adapter config.");
add("no-direct-network-or-env", !orchestrator.includes("fetch(") && !orchestrator.includes("process.env") && !orchestrator.includes("OPENAI_API_KEY") && !orchestrator.includes('from "openai"'), "Orchestrator must not read env, credentials, SDK, or network directly.");
add("fail-closed-step-order", orchestrator.includes("skippedAfter") && orchestrator.includes("post_provider_decision_engine_failed") && orchestrator.includes("simulation_composition_failed"), "Every boundary failure must stop and skip downstream execution.");
add("no-provider-bypass", orchestrator.includes("postProvider.status !== \"composed\"") && orchestrator.includes("composePostProviderSimulationResponse(postProvider)"), "Simulator composition must only receive post-provider Decision Engine output.");
add("no-raw-provider-result", orchestrator.includes("rawProviderMaterialReturned: false") && !orchestrator.includes("candidateMaterial: value"), "Raw provider material must not be returned or accepted from caller input.");
add("no-client-import", clientImports.status === 1 && !clientImports.stdout.trim(), "App and component code must not import the server-only orchestrator.");
add("public-api-still-mock", route.includes("mockOnly: true") && !route.toLowerCase().includes("openai"), "Public /api/simulate must remain mock-only and provider-free.");
add("ui-still-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai"), "HomeSimulator must remain on the public mock API.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-production-decision-simulation-orchestrator"'), "Dedicated orchestrator gate must be registered.");
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
