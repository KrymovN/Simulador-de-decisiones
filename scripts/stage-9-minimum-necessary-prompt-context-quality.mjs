import { execFileSync } from "node:child_process";
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
const baseline = "ba429d40c8d7ccb9038b9344bf2e8a221bd30ee2";
const proofModule = require(join(
  root,
  "lib/ai-integration/minimum-necessary-prompt-context-proof.ts",
));
const proof = proofModule.runMinimumNecessaryPromptContextProof();
const evidence = JSON.parse(readFileSync(join(
  root,
  "docs/qa/stage-9/STAGE_9_MINIMUM_NECESSARY_PROMPT_CONTEXT_CLOSURE_EVIDENCE.v1.json",
), "utf8"));

const implementationPaths = [
  "lib/ai-integration/decision-engine-prompt-context-bridge.ts",
  "lib/prompt-context/contracts.ts",
  "lib/prompt-context/validation.ts",
  "lib/prompt-context/runtime.ts",
  "lib/prompt-context/boundary.ts",
  "lib/ai-provider/openai-decision-material-adapter.ts",
  "lib/ai-integration/production-decision-simulation-orchestrator.ts",
  "lib/ai-integration/production-decision-simulation-composition-root.server.ts",
];
const productionDiff = execFileSync(
  "git",
  ["diff", "--name-only", baseline, "--", ...implementationPaths],
  { cwd: root, encoding: "utf8" },
).trim();

const checks = [...proof.checks];
const add = (checkId, passed) => checks.push({ checkId, passed: Boolean(passed) });
add("canonical-proof-version-and-root-cause",
  proof.version === "stage-9-minimum-necessary-prompt-context-proof.1" &&
  proof.guaranteeId === "minimum_necessary_prompt_context" &&
  proof.rootCause === "PROOF_MISSING" && proof.status === "PASS");
add("versioned-closure-evidence-is-exact",
  evidence.evidenceId ===
    "stage-9-minimum-necessary-prompt-context-closure-evidence.1" &&
  evidence.baselineCommit === baseline &&
  evidence.guaranteeId === proof.guaranteeId &&
  evidence.canonicalObligation === proof.canonicalObligation &&
  evidence.rootCause === proof.rootCause &&
  evidence.proofVersion === proof.version && evidence.status === proof.status);
add("production-prompt-context-path-is-unchanged-from-baseline",
  productionDiff === "" && evidence.productionImplementationChanged === false);
add("controlled-failure-remediation-remains-out-of-scope",
  evidence.controlledFailureProductPresentationChanged === false);
add("no-live-provider-api-or-human-review-operations",
  proof.summary.providerOperations === 0 && proof.summary.apiOperations === 0 &&
  proof.summary.humanReviewOperations === 0 &&
  evidence.providerOperations === 0 && evidence.apiOperations === 0 &&
  evidence.humanReviewOperations === 0);
add("historical-provider-and-position5-boundaries-retained",
  evidence.historicalProviderEvidenceChanged === false &&
  evidence.providerQualificationReassessed === false &&
  evidence.position5OrLaterAuthorized === false);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  gate: "stage-9-minimum-necessary-prompt-context",
  status: failed.length === 0 ? "PASS" : "FAIL",
  rootCause: proof.rootCause,
  guarantee: {
    guaranteeId: proof.guaranteeId,
    status: proof.status,
    canonicalObligation: proof.canonicalObligation,
  },
  providerOperations: proof.summary.providerOperations,
  apiOperations: proof.summary.apiOperations,
  humanReviewOperations: proof.summary.humanReviewOperations,
  productionDiff: productionDiff || null,
  checks,
}, null, 2));
if (failed.length > 0) process.exitCode = 1;
