import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));

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

const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const core = read("lib", "ai-provider", "openai-synthetic-risk-adapter.ts");
const server = read("lib", "ai-provider", "openai-synthetic-risk-adapter.server.ts");
const index = read("lib", "ai-provider", "index.ts");
const route = read("app", "api", "simulate", "route.ts");
const home = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");
const validation = require(join(root, "lib", "ai-provider", "openai-synthetic-risk-adapter-validation.ts"));
const result = await validation.runStage9OpenAISyntheticRiskAdapterValidation();
const checks = [...result.cases];
const add = (caseId, passed, issue) => checks.push({ caseId, passed: Boolean(passed), issue });
const providerRegression = require(join(root, "lib", "ai-provider", "runtime-qa-regression.ts")).runAIProviderStage51Regression();
const promptRegression = require(join(root, "lib", "prompt-context", "runtime-qa-regression.ts")).runPromptContextStage52Regression();
const qualityRegression = require(join(root, "lib", "ai-quality", "runtime-qa-regression.ts")).runAiQualityStage53Regression();
const integrationContracts = require(join(root, "lib", "ai-integration", "validation.ts")).runAIIntegrationContractsValidation();
const integrationRuntime = require(join(root, "lib", "ai-integration", "runtime-validation.ts")).runAIIntegrationRuntimeValidation();
const integrationComposition = require(join(root, "lib", "ai-integration", "boundary-composition-validation.ts")).runAIIntegrationBoundaryCompositionValidation();
const integrationDryRun = require(join(root, "lib", "ai-integration", "dry-run-validation.ts")).runAIIntegrationDryRunValidation();

add("existing-ai-provider-regression", providerRegression.passed && !providerRegression.failed, "Existing AI Provider regression must pass.");
add("existing-prompt-context-regression", promptRegression.passed && !promptRegression.failed, "Existing Prompt Context regression must pass.");
add("existing-ai-quality-regression", qualityRegression.passed && !qualityRegression.failed, "Existing AI Quality regression must pass.");
add("existing-ai-integration-regressions", [integrationContracts, integrationRuntime, integrationComposition, integrationDryRun].every((item) => item.passed && !item.failed), "Existing AI Integration regressions must pass.");

add("server-only-marker", server.startsWith('import "server-only";'), "SDK adapter must be marked server-only.");
add("sdk-only-in-server-adapter", server.includes('from "openai"') && !core.includes('from "openai"'), "OpenAI SDK types/imports must stay in the server adapter.");
add("automatic-retries-disabled", server.includes("maxRetries: 0") && (server.match(/maxRetries: 0/g) ?? []).length >= 3, "Client and both requests must disable automatic retries.");
add("no-raw-logging", !core.includes("console.") && !server.includes("console."), "Adapter must not log raw or controlled payloads automatically.");
add("server-adapter-not-barrel-exported", !index.includes("openai-synthetic-risk"), "Live-capable adapter must not be reachable through the shared barrel.");
add("quality-gate-registered", packageJson.includes('"quality:stage-9-openai-synthetic-risk-adapter"'), "Dedicated gate must be registered.");
add("public-route-remains-mock", route.includes("mockOnly: true") && route.includes("SIMULATE_API_CONTRACT_VERSION") && !route.toLowerCase().includes("openai"), "Public route must remain mock-only and OpenAI-free.");
add("home-remains-public-api-only", home.includes('fetch("/api/simulate"') && !home.toLowerCase().includes("openai"), "HomeSimulator must remain on the public mock API.");
const clientSearch = spawnSync("rg", ["-n", "openai-synthetic-risk", "app", "components"], { cwd: root, encoding: "utf8" });
add("no-app-client-import", clientSearch.status === 1 && !clientSearch.stdout.trim(), "App/client code must not import the adapter.");
add("no-persistence-import", !server.includes("persistence") && !core.includes("persistence") && !server.includes("supabase") && !core.includes("supabase"), "Adapter must not persist results or metadata.");
add("no-prompt-context-bridge", !server.includes("prompt-context") && !core.includes("prompt-context"), "Prompt Context bridge must remain unopened.");
add("no-decision-engine-bridge", !server.includes("decision-engine") && !core.includes("decision-engine"), "Decision Engine bridge must remain unopened.");

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.caseId}`);
  if (!item.passed) console.error(`  ${item.issue ?? "Validation failed."}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
