import { createRequire } from "node:module";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");

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

const allowedWriteSet = [
  "lib/ai-integration/decision-engine-prompt-context-bridge.ts",
  "lib/ai-integration/decision-engine-prompt-context-bridge.validation.ts",
  "lib/ai-integration/contracts.ts",
  "lib/ai-integration/index.ts",
  "scripts/stage-9-decision-engine-prompt-context-bridge-quality.mjs",
  "package.json",
];

const bridgePath = join(root, "lib/ai-integration/decision-engine-prompt-context-bridge.ts");
const validationPath = join(root, "lib/ai-integration/decision-engine-prompt-context-bridge.validation.ts");
const bridge = read("lib", "ai-integration", "decision-engine-prompt-context-bridge.ts");
const validationSource = read("lib", "ai-integration", "decision-engine-prompt-context-bridge.validation.ts");
const contracts = read("lib", "ai-integration", "contracts.ts");
const index = read("lib", "ai-integration", "index.ts");
const packageJson = read("package.json");
const route = read("app", "api", "simulate", "route.ts");
const authorization = read("docs", "qa", "stage-9", "STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_AUTHORIZATION_DECISION.v1.md");
const canonicalState = ["PROJECT_CONTEXT.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md"]
  .map((path) => read(path))
  .join("\n");

const validation = require(validationPath).runDecisionEnginePromptContextBridgeValidation();
const checks = validation.cases.map((item) => ({
  id: `${item.kind}-${item.caseId}`,
  passed: item.passed,
  detail: item.issues.join(" ") || "Bridge validation passed.",
}));
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

function imports(source, fileName) {
  const ast = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  return ast.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.moduleSpecifier.text);
}

const bridgeImports = imports(bridge, bridgePath);
const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const unexpectedChanges = [...new Set(changed)].filter((path) => !allowedWriteSet.includes(path));
const clientSearch = spawnSync("rg", ["-n", "decision-engine-prompt-context-bridge", "app", "components"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const clientUsage = clientSearch.stdout.trim();

add("bridge-files-exist", existsSync(bridgePath) && existsSync(validationPath), "Bridge and validation files must exist.");
add("server-only-isolation", bridge.startsWith('import "server-only";'), "Bridge must start with the server-only marker.");
add("decision-engine-contract-used", bridgeImports.includes("../decision-engine/types"), "Bridge must import the existing Decision Engine contract.");
add("prompt-context-runtime-used", bridgeImports.includes("../prompt-context/runtime") && bridge.includes("createPromptContextRuntime"), "Bridge must use the existing Prompt Context runtime.");
add("prompt-context-boundary-used", bridgeImports.includes("../prompt-context/boundary") && bridge.includes("createPromptContextBoundary"), "Bridge must use the existing Prompt Context boundary.");
add("no-parallel-prompt-builder", !bridge.includes("function buildPromptContext") && bridge.includes("promptContextBoundary.evaluate"), "Bridge must map into the existing Prompt Context boundary instead of creating a parallel builder.");
add("no-provider-dependencies", !bridgeImports.some((path) => path.includes("ai-provider") || path === "openai") && !/OPENAI_|api\.openai|from ["']openai["']/.test(bridge), "Bridge must not import or configure a provider/model.");
add("no-key-or-env-access", !/process\.env|OPENAI_API_KEY|apiKey\s*=|credential\s*=/.test(bridge), "Bridge must not access keys or environment configuration.");
add("no-fetch-or-network", !/\bfetch\s*\(|https?:\/\//.test(bridge), "Bridge must not execute network operations.");
add("no-client-imports", clientSearch.status === 1 && clientUsage === "", "App and component files must not import the server-only bridge.");
add("no-persistence-or-ui-dependencies", !bridgeImports.some((path) => /persistence|supabase|components|app\//.test(path)), "Bridge must not depend on persistence, Supabase, UI, or routes.");
add("contracts-defined", contracts.includes("DecisionEnginePromptContextBridgeRequest") && contracts.includes("DecisionEnginePromptContextBridgeResult"), "Bridge input/output contracts must be registered.");
add("exports-registered", index.includes('export * from "./decision-engine-prompt-context-bridge"') && index.includes('export * from "./decision-engine-prompt-context-bridge.validation"'), "Bridge exports must be registered.");
add("quality-script-registered", packageJson.includes('"quality:stage-9-decision-engine-prompt-context-bridge"'), "Dedicated quality script must be registered.");
add("public-route-unchanged-mock", route.includes("mockOnly: true") && !route.toLowerCase().includes("openai"), "Public route must remain mock-only and provider-free.");
add("authorization-unconsumed", authorization.includes("`UNCONSUMED`"), "Prepared live authorization must remain unconsumed.");
add("stage-and-release-unchanged", canonicalState.includes("Stage 9 remains **In Progress**") && canonicalState.includes("NOT_DECLARED"), "Stage 9 and release readiness must remain unchanged.");
add("no-s9-fix-10", !bridge.includes("S9-FIX-10") && !validationSource.includes("S9-FIX-10"), "Bridge scope must not create S9-FIX-10.");
add("exact-write-set", unexpectedChanges.length === 0, `Unexpected changed paths: ${unexpectedChanges.join(", ") || "none"}.`);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}

const positive = validation.cases.filter((item) => item.kind === "positive");
const negative = validation.cases.filter((item) => item.kind === "negative");
console.log(`POSITIVE ${positive.filter((item) => item.passed).length}/${positive.length} PASS`);
console.log(`NEGATIVE ${negative.filter((item) => item.passed).length}/${negative.length} PASS`);
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
