import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
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
const inputSource = read("lib", "ai-decision-material", "canonical-provider-evaluation-input.ts");
const boundarySource = read("lib", "ai-quality", "canonical-provider-evaluation.ts");
const validationSource = read("lib", "ai-quality", "canonical-provider-evaluation-validation.ts");
const adapterSource = read("lib", "ai-provider", "openai-decision-material-adapter.ts");
const routeSource = read("app", "api", "simulate", "route.ts");

function filesUnder(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...filesUnder(path));
    else if (/\.(?:ts|tsx)$/.test(entry)) files.push(path);
  }
  return files;
}

const checks = [];
const add = (id, passed, detail = "Check failed.") => checks.push({ id, passed: Boolean(passed), detail });

let networkOperations = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkOperations += 1;
  throw new Error("Network access is forbidden in the canonical provider evaluation boundary gate.");
};
const fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
const evaluation = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation.ts"));
const validation = require(join(root, "lib", "ai-quality", "canonical-provider-evaluation-validation.ts"));
const result = await validation.runCanonicalProviderEvaluationBoundaryValidation();
globalThis.fetch = originalFetch;

for (const item of result.cases) add(`validation-${item.caseId}`, item.passed, item.issue);
add("validation-suite-pass", result.passed, "Evaluation boundary validation suite must pass.");
add("network-operations-zero", networkOperations === 0 && result.networkOperations === 0, `${networkOperations} network operations observed.`);
add("frozen-core-size-unchanged", fixtures.CANONICAL_OFFLINE_EVALUATION_CASES.length === 160, "Frozen canonical core must remain 160 cases.");
add("all-frozen-cases-compile", fixtures.CANONICAL_OFFLINE_EVALUATION_CASES.every((item) => evaluation.buildCanonicalProviderEvaluationRequest(item).status === "ready"), "Every frozen core case must compile without production semantics.");
add("server-only-boundary", inputSource.startsWith('import "server-only";') && boundarySource.startsWith('import "server-only";'), "Evaluation input and boundary must be server-only.");
add("no-decision-context-or-prompt-context", !/DecisionContext|PromptContext|decision-context|prompt-context/.test(inputSource + boundarySource), "Evaluation boundary must not create production DecisionContext or PromptContext.");
add("no-openai-sdk-or-env", !/from\s+["']openai["']|OPENAI_API_KEY|process\.env|createOpenAIDecisionMaterialTransport/.test(inputSource + boundarySource + validationSource), "Evaluation boundary must not access SDK, credentials, env, or live transport.");
add("shared-provider-request-contract", boundarySource.includes("buildCandidateDecisionMaterialProviderRequest") && adapterSource.includes("buildCandidateDecisionMaterialProviderRequest"), "Provider schema/request controls must be reused from the existing adapter.");
add("oracle-exclusion-explicit", inputSource.includes("CANONICAL_PROVIDER_EVALUATION_ORACLE_KEYS") && boundarySource.includes("requestContainsOracle"), "Oracle exclusion must be explicit and executable.");
add("fake-only-transport", boundarySource.includes('kind: "deterministic_fake_provider"') && !boundarySource.includes("DecisionMaterialTransportFailure"), "Current execution boundary must accept only the bounded fake transport contract.");
add("public-route-remains-mock-only", routeSource.includes("mockOnly: true") && !routeSource.toLowerCase().includes("openai"), "Public API must remain mock-only and OpenAI-free.");

const publicSources = [
  ...filesUnder(join(root, "app")),
  ...filesUnder(join(root, "components")),
  ...filesUnder(join(root, "lib", "runtime-integration")),
  ...filesUnder(join(root, "lib", "ai-integration")),
];
const leakedImports = publicSources.filter((path) => {
  const source = readFileSync(path, "utf8");
  return source.includes("canonical-provider-evaluation") || source.includes("canonical-provider-evaluation-input");
}).map((path) => relative(root, path));
add("no-production-or-public-callsite", leakedImports.length === 0, `Unexpected callsites: ${leakedImports.join(", ")}`);

const failed = checks.filter((item) => !item.passed);
const report = {
  gate: "quality:stage-9-canonical-provider-evaluation-boundary",
  passed: failed.length === 0,
  passed_checks: checks.length - failed.length,
  total_checks: checks.length,
  network_operations: networkOperations,
  frozen_core_cases: fixtures.CANONICAL_OFFLINE_EVALUATION_CASES.length,
  failed,
};
console.log(JSON.stringify(report, null, 2));
if (failed.length > 0) process.exit(1);
