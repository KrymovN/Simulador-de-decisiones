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
const baseline = "afa1e12b32544731c440e13af728b2c1e59464a9";
const proofModule = require(join(
  root,
  "lib/runtime-integration/controlled-failure-product-presentation-proof.ts",
));
const proof = await proofModule.runControlledFailureProductPresentationProof();
const evidence = JSON.parse(readFileSync(join(
  root,
  "docs/qa/stage-9/STAGE_9_CONTROLLED_FAILURE_PRODUCT_PRESENTATION_CLOSURE_EVIDENCE.v1.json",
), "utf8"));

const changed = [
  ...execFileSync("git", ["diff", "--name-only", baseline], {
    cwd: root, encoding: "utf8",
  }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: root, encoding: "utf8",
  }).split("\n"),
].filter(Boolean);
const allowed = new Set([
  "docs/qa/stage-9/STAGE_9_CONTROLLED_FAILURE_PRODUCT_PRESENTATION_CLOSURE_EVIDENCE.v1.json",
  "lib/decision-engine/simulation-response-v2-ui-mapping-validation.ts",
  "lib/decision-engine/simulation-response-v2-ui-mapping.ts",
  "lib/runtime-integration/controlled-failure-product-presentation-proof.ts",
  "lib/runtime-integration/controlled-production-ai-runtime-switch-validation.ts",
  "lib/runtime-integration/controlled-production-ai-runtime-switch.server.ts",
  "lib/runtime-integration/controlled-simulator-runtime-switch-contracts.ts",
  "package.json",
  "scripts/stage-9-controlled-failure-product-presentation-quality.mjs",
  "scripts/stage-9-levio-integration-readiness-rebaseline-quality.mjs",
  "scripts/stage-9-minimum-necessary-prompt-context-quality.mjs",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowed.has(path));
const publicSurfaceDiff = execFileSync("git", [
  "diff", "--name-only", baseline, "--",
  "app/api/simulate/route.ts", "components/HomeSimulator.tsx",
], { cwd: root, encoding: "utf8" }).trim();

const checks = [...proof.checks];
const add = (checkId, passed) => checks.push({ checkId, passed: Boolean(passed) });
add("canonical-proof-version-root-cause-and-status",
  proof.version === "stage-9-controlled-failure-product-presentation-proof.1" &&
  proof.guaranteeId === "controlled_failure_product_presentation" &&
  proof.rootCause === "PARTIAL_IMPLEMENTATION_AND_PROOF_GAP" &&
  proof.status === "PASS");
add("versioned-closure-evidence-is-exact",
  evidence.evidenceId ===
    "stage-9-controlled-failure-product-presentation-closure-evidence.1" &&
  evidence.baselineCommit === baseline &&
  evidence.guaranteeId === proof.guaranteeId &&
  evidence.canonicalObligation === proof.canonicalObligation &&
  evidence.rootCause === proof.rootCause &&
  evidence.proofVersion === proof.version && evidence.status === proof.status);
add("bounded-remediation-write-set",
  unexpected.length === 0 && evidence.productionFailurePresentationChanged === true);
add("public-api-ui-copy-and-activation-unchanged",
  publicSurfaceDiff === "" && evidence.publicApiActivated === false &&
  evidence.publicUiCopyChanged === false);
add("no-external-provider-api-or-human-review-operations",
  proof.summary.externalProviderOperations === 0 &&
  proof.summary.apiOperations === 0 && proof.summary.humanReviewOperations === 0 &&
  evidence.externalProviderOperations === 0 && evidence.apiOperations === 0 &&
  evidence.humanReviewOperations === 0);
add("historical-provider-position5-and-minimum-context-boundaries-retained",
  evidence.historicalProviderEvidenceChanged === false &&
  evidence.providerQualificationReassessed === false &&
  evidence.position5OrLaterAuthorized === false &&
  evidence.minimumNecessaryPromptContextStatus === "PASS");

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  gate: "stage-9-controlled-failure-product-presentation",
  status: failed.length === 0 ? "PASS" : "FAIL",
  rootCause: proof.rootCause,
  guarantee: {
    guaranteeId: proof.guaranteeId,
    status: proof.status,
    canonicalObligation: proof.canonicalObligation,
  },
  externalProviderOperations: proof.summary.externalProviderOperations,
  apiOperations: proof.summary.apiOperations,
  humanReviewOperations: proof.summary.humanReviewOperations,
  unexpectedChanges: unexpected,
  checks,
}, null, 2));
if (failed.length > 0) process.exitCode = 1;
