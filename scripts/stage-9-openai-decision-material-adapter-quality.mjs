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
const adapter = read("lib", "ai-provider", "openai-decision-material-adapter.ts");
const validationSource = read("lib", "ai-provider", "openai-decision-material-adapter-validation.ts");
const acceptance = read("lib", "ai-decision-material", "acceptance.ts");
const providerIndex = read("lib", "ai-provider", "index.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden during adapter validation.");
};
const validation = require(join(root, "lib", "ai-provider", "openai-decision-material-adapter-validation.ts"));
const result = await validation.runStage9OpenAIDecisionMaterialAdapterValidation();
globalThis.fetch = originalFetch;

const checks = result.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issue ?? "Adapter validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

const providerRegression = require(join(root, "lib", "ai-provider", "runtime-qa-regression.ts")).runAIProviderStage51Regression();
const promptRegression = require(join(root, "lib", "prompt-context", "runtime-qa-regression.ts")).runPromptContextStage52Regression();
const bridgeRegression = require(join(root, "lib", "ai-integration", "decision-engine-prompt-context-bridge.validation.ts")).runDecisionEnginePromptContextBridgeValidation();
add("existing-provider-abstraction-pass", providerRegression.passed && !providerRegression.failed, "Existing provider abstraction must remain valid.");
add("existing-prompt-context-pass", promptRegression.passed && !promptRegression.failed, "Existing Prompt Context contracts/runtime/boundary must remain valid.");
add("existing-decision-prompt-bridge-pass", bridgeRegression.passed && !bridgeRegression.failed, "Existing Decision Engine to Prompt Context bridge must remain valid.");

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowedWriteSet = new Set([
  "lib/ai-decision-material/acceptance.ts",
  "lib/ai-provider/openai-decision-material-adapter.ts",
  "lib/ai-provider/openai-decision-material-adapter-validation.ts",
  "scripts/stage-9-openai-decision-material-adapter-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowedWriteSet.has(path));
const clientImports = spawnSync("rg", ["-n", "openai-decision-material-adapter", "app", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});

add("server-only-boundary", adapter.startsWith('import "server-only";'), "Production-oriented adapter must be server-only.");
add("canonical-prompt-context-used", adapter.includes('from "../prompt-context/validation"') && adapter.includes("validateOutput(input)"), "Adapter must validate the existing Prompt Context output contract.");
add("existing-provider-abstraction-used", adapter.includes("createAIProviderAdapter") && adapter.includes("createAIProviderRuntimeSelection") && adapter.includes("createAIProviderBoundary"), "Adapter must pass through the existing provider abstraction.");
add("canonical-material-contract-used", adapter.includes('from "../ai-decision-material/contracts"') && adapter.includes("candidateDecisionMaterialHasValidContract"), "Adapter must use candidate_decision_material_v1 and its canonical validator.");
add("strict-output-schema", adapter.includes('schemaName: "levio_candidate_decision_material_v1"') && adapter.includes("additionalProperties: false") && adapter.includes("strict: true"), "Provider request must require strict Structured Outputs.");
add("fixed-provider-model", adapter.includes('OPENAI_DECISION_MATERIAL_PROVIDER = "openai"') && adapter.includes('OPENAI_DECISION_MATERIAL_MODEL = "gpt-5.6-terra"'), "Provider and model must be internal fixed configuration.");
add("no-client-runtime-override", adapter.includes("hasForbiddenRuntimeField") && validationSource.includes("client-provider-model-key-rejected"), "Client provider/model/key controls must fail closed.");
add("controlled-schema-safety-grounding", adapter.includes("provider_schema_invalid") && adapter.includes("provider_safety_invalid") && adapter.includes("provider_grounding_invalid"), "Provider output must pass schema, safety, and reference grounding validation.");
add("bounded-cost-and-operations", adapter.includes("maxProviderRequests: 2") && adapter.includes("maxCostUsd: 0.05") && adapter.includes("calculateDecisionMaterialCost"), "Cost and provider-operation budgets must be explicit.");
add("no-new-credential-egress-executor", !adapter.includes("process.env") && !adapter.includes('from "openai"') && !adapter.includes("fetch("), "This substep must not add credential reads, SDK execution, or direct egress.");
add("transport-seam-only", adapter.includes("DecisionMaterialTransport") && adapter.includes("config.transport.countInput") && adapter.includes("config.transport.generate"), "Provider operations must remain behind the injected server-only transport seam.");
add("no-barrel-export", !providerIndex.includes("openai-decision-material-adapter"), "Live-capable adapter code must not be exported through the shared provider barrel.");
add("no-client-import", clientImports.status === 1 && !clientImports.stdout.trim(), "App and component code must not import the adapter.");
add("public-api-still-mock", route.includes("mockOnly: true") && !route.toLowerCase().includes("openai"), "Public /api/simulate must remain mock-only and provider-free.");
add("ui-still-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai"), "HomeSimulator must remain on the public mock API.");
add("no-persistence-or-post-provider-composition", !adapter.includes("persistence-runtime") && !adapter.includes("supabase") && !adapter.includes("acceptCandidateDecisionMaterial("), "Adapter must not persist or perform post-provider Decision Engine composition.");
add("canonical-contract-validator-added", acceptance.includes("candidateDecisionMaterialHasValidContract") && acceptance.includes("inspectCandidateDecisionMaterialContract"), "Canonical material must expose strict contract/safety inspection without composition.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-openai-decision-material-adapter"'), "Dedicated quality gate must be registered.");
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
