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
const composition = read("lib", "decision-engine", "post-provider-simulation-composition.ts");
const validationSource = read("lib", "decision-engine", "post-provider-simulation-composition-validation.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden during Simulator composition validation.");
};

const validation = require(join(root, "lib", "decision-engine", "post-provider-simulation-composition-validation.ts"));
const result = validation.runPostProviderSimulationCompositionValidation();
const postProviderRegression = require(join(root, "lib", "decision-engine", "post-provider-boundary-validation.ts")).runPostProviderDecisionEngineBoundaryValidation();
const simulationPipelineRegression = require(join(root, "lib", "decision-engine", "simulation-pipeline-runner-validation.ts")).runSimulationPipelineRunnerValidation();
const providerAdapterRegression = await require(join(root, "lib", "ai-provider", "openai-decision-material-adapter-validation.ts")).runStage9OpenAIDecisionMaterialAdapterValidation();
globalThis.fetch = originalFetch;

const checks = result.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issue ?? "Simulator composition validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
add("existing-post-provider-boundary-pass", postProviderRegression.passed && !postProviderRegression.failed, "Existing post-provider Decision Engine boundary must remain valid.");
add("existing-simulation-pipeline-pass", simulationPipelineRegression.passed, "Existing deterministic Simulation Pipeline must remain valid.");
add("existing-provider-adapter-pass", providerAdapterRegression.passed && !providerAdapterRegression.failed && providerAdapterRegression.summary.networkRequests === 0, "Existing Provider Adapter must remain valid and offline.");

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowedWriteSet = new Set([
  "lib/decision-engine/index.ts",
  "lib/decision-engine/post-provider-boundary.ts",
  "lib/decision-engine/post-provider-boundary-validation.ts",
  "lib/decision-engine/post-provider-simulation-composition.ts",
  "lib/decision-engine/post-provider-simulation-composition-validation.ts",
  "scripts/stage-9-post-provider-simulation-composition-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowedWriteSet.has(path));
const clientImports = spawnSync("rg", ["-n", "post-provider-simulation-composition", "app", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

add("server-only-composition", composition.startsWith('import "server-only";'), "Composition must be server-only.");
add("post-provider-result-required", composition.includes("POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION") && composition.includes("compatibleControlledResult"), "Composition must accept only the existing post-provider Decision Engine result.");
add("existing-response-contract-used", composition.includes("SimulationResponseV2Draft") && composition.includes("validateSimulationResponseV2DraftShape"), "Composition must return the existing SimulationResponseV2Draft contract.");
add("existing-pipeline-used", composition.includes("runSimulationPipeline"), "Composition must preserve deterministic Simulation Pipeline semantics.");
add("decision-engine-authority-preserved", composition.includes("decisionEngineAuthorityPreserved") && validationSource.includes("provider_authority_tampering_fails_closed"), "Decision Engine must remain semantic authority.");
add("direct-provider-path-rejected", validationSource.includes("raw_candidate_material_cannot_bypass_decision_engine") && composition.includes("directProviderInputAccepted: false"), "Direct Provider to Simulator input must fail closed.");
add("no-runtime-execution", !composition.includes("fetch(") && !composition.includes("process.env") && !composition.includes("supabase") && composition.includes("networkExecutionCount: 0"), "Composition must perform no provider, credential, network, or persistence work.");
add("no-client-import", clientImports.status === 1 && !clientImports.stdout.trim(), "App and component code must not import the server-only composition.");
add("public-api-still-mock", route.includes("mockOnly: true") && !route.toLowerCase().includes("openai"), "Public /api/simulate must remain mock-only and provider-free.");
add("ui-still-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai"), "HomeSimulator must remain on the public mock API.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-post-provider-simulation-composition"'), "Dedicated quality gate must be registered.");
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
