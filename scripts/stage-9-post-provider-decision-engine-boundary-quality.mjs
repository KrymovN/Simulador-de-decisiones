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
const boundary = read("lib", "decision-engine", "post-provider-boundary.ts");
const validationSource = read("lib", "decision-engine", "post-provider-boundary-validation.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden during post-provider boundary validation.");
};
const validation = require(join(root, "lib", "decision-engine", "post-provider-boundary-validation.ts"));
const result = validation.runPostProviderDecisionEngineBoundaryValidation();

const checks = result.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issue ?? "Post-provider validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

const decisionContextRegression = require(join(root, "lib", "decision-engine", "context-builder-validation.ts")).runDecisionContextBuilderValidation();
const simulationPipelineRegression = require(join(root, "lib", "decision-engine", "simulation-pipeline-runner-validation.ts")).runSimulationPipelineRunnerValidation();
const promptRegression = require(join(root, "lib", "prompt-context", "runtime-qa-regression.ts")).runPromptContextStage52Regression();
const bridgeRegression = require(join(root, "lib", "ai-integration", "decision-engine-prompt-context-bridge.validation.ts")).runDecisionEnginePromptContextBridgeValidation();
const providerAdapterRegression = await require(join(root, "lib", "ai-provider", "openai-decision-material-adapter-validation.ts")).runStage9OpenAIDecisionMaterialAdapterValidation();
globalThis.fetch = originalFetch;
add("existing-decision-context-pass", decisionContextRegression.passed, "Existing Decision Context and Decision Engine validation must remain valid.");
add("existing-simulation-pipeline-pass", simulationPipelineRegression.passed, "Existing deterministic simulation pipeline must remain valid.");
add("existing-prompt-context-pass", promptRegression.passed && !promptRegression.failed, "Existing Prompt Context contracts must remain valid.");
add("existing-decision-prompt-bridge-pass", bridgeRegression.passed && !bridgeRegression.failed, "Existing Decision Engine to Prompt Context bridge must remain valid.");
add("existing-provider-adapter-pass", providerAdapterRegression.passed && !providerAdapterRegression.failed && providerAdapterRegression.summary.networkRequests === 0, "Existing production Provider Adapter validation must remain valid and offline.");

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowedWriteSet = new Set([
  "lib/ai-decision-material/acceptance.ts",
  "lib/decision-engine/index.ts",
  "lib/decision-engine/post-provider-boundary.ts",
  "lib/decision-engine/post-provider-boundary-validation.ts",
  "scripts/stage-9-post-provider-decision-engine-boundary-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowedWriteSet.has(path));
const clientImports = spawnSync("rg", ["-n", "post-provider-boundary", "app", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

add("server-only-boundary", boundary.startsWith('import "server-only";'), "Boundary must be server-only.");
add("canonical-candidate-contract", boundary.includes('from "../ai-decision-material/acceptance"') && boundary.includes("inspectCandidateDecisionMaterialContract"), "Boundary must reuse candidate_decision_material_v1 validation.");
add("canonical-acceptance-ledger", boundary.includes("acceptCandidateDecisionMaterial") && boundary.includes("silent_drop_count"), "Boundary must reuse canonical acceptance and enforce a complete semantic ledger.");
add("original-decision-context-rebound", boundary.includes("bridgeDecisionEngineToPromptContext") && boundary.includes("originalDecisionContextMatched"), "Boundary must re-establish the original Decision Context.");
add("decision-engine-authority", boundary.includes('authority: "decision_engine"') && boundary.includes("finalRecommendationProduced: false"), "Controlled material must remain under Decision Engine authority.");
add("provider-metadata-excluded", boundary.includes("providerMetadataIncluded: false") && !boundary.includes("OPENAI_DECISION_MATERIAL_MODEL"), "Provider-specific metadata must not enter controlled material.");
add("no-runtime-execution", !boundary.includes("fetch(") && !boundary.includes("process.env") && !boundary.includes("supabase") && boundary.includes("networkExecutionCount: 0"), "Boundary must perform no network, credential, or persistence work.");
add("negative-authority-cases", validationSource.includes("direct_best_option_claim_fails_closed") && validationSource.includes("unsupported_provider_option_is_rejected"), "Validation must cover provider authority violations.");
add("no-client-import", clientImports.status === 1 && !clientImports.stdout.trim(), "App and component code must not import the server-only boundary.");
add("public-api-still-mock", route.includes("mockOnly: true") && !route.toLowerCase().includes("openai"), "Public /api/simulate must remain mock-only and provider-free.");
add("ui-still-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai"), "HomeSimulator must remain on the public mock API.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-post-provider-decision-engine-boundary"'), "Dedicated quality gate must be registered.");
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
