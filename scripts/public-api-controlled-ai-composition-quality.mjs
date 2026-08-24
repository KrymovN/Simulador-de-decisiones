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
const runtimeModule = require(join(
  root,
  "lib/runtime-integration/controlled-production-ai-runtime-switch.server.ts",
));
const {
  bindControlledProductionAiRuntimeSwitch,
} = runtimeModule;
const {
  DecisionMaterialTransportFailure,
} = require(join(root, "lib/ai-provider/openai-decision-material-adapter.ts"));
const {
  validCandidateDecisionMaterial,
} = require(join(root, "lib/ai-provider/openai-decision-material-adapter-validation.ts"));
const {
  isPublicSimulationApiV2Envelope,
} = require(join(root, "lib/runtime-integration/public-simulation-api-v2-contracts.ts"));

let externalNetworkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalNetworkRequests += 1;
  throw new Error("External network access is forbidden in public composition proof.");
};

const originalFlag = process.env.LEVIO_REAL_AI_DEV_ENABLED;
const originalRuntimeCall = runtimeModule.runControlledProductionAiRuntimeSwitch;
let activeRuntime;
let runtimeCalls = 0;
runtimeModule.runControlledProductionAiRuntimeSwitch = async (request) => {
  runtimeCalls += 1;
  return activeRuntime.execute(request);
};
const { POST } = require(join(root, "app/api/simulate/route.ts"));

const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
const fixedClock = () => "2026-08-24T08:00:00.000Z";
const enabledEnvironment = {
  LEVIO_REAL_AI_DEV_ENABLED: "true",
  LEVIO_AI_PROVIDER: "openai",
  OPENAI_API_KEY: "offline-proof-key",
};
const publicInput =
  "Comparar Plan Norte o Plan Sur para un lanzamiento ficticio con menos de 5000 euros.";
const operationalEvents = [];

function request(source, body = { input: publicInput, lang: "es" }) {
  return new Request("http://localhost/api/simulate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": `public-composition-proof-${source}`,
      "x-forwarded-for": `198.51.100.${source}`,
    },
    body: JSON.stringify(body),
  });
}

async function payload(response) {
  return response.json();
}

function boundRuntime(transport, environment = enabledEnvironment) {
  return bindControlledProductionAiRuntimeSwitch(
    environment,
    () => transport,
    fixedClock,
    { observer: (event) => operationalEvents.push(event) },
  );
}

try {
  const observedProviderRequests = [];
  const successTransport = {
    async countInput(providerRequest) {
      observedProviderRequests.push(providerRequest);
      return 1200;
    },
    async generate(providerRequest) {
      observedProviderRequests.push(providerRequest);
      return {
        status: "completed",
        outputText: JSON.stringify(validCandidateDecisionMaterial()),
        usage: { inputTokens: 1200, outputTokens: 700, totalTokens: 1900 },
      };
    },
  };
  activeRuntime = boundRuntime(successTransport);
  process.env.LEVIO_REAL_AI_DEV_ENABLED = "true";
  const successResponse = await POST(request(81));
  const success = await payload(successResponse);

  add(
    "success-http-status-truthful",
    successResponse.status === 200,
    `HTTP ${successResponse.status}; events ${JSON.stringify(operationalEvents)}`,
  );
  add(
    "success-public-v2-envelope-valid",
    isPublicSimulationApiV2Envelope(success) && success.status === "completed",
    "Expected completed simulate-api-v2 envelope.",
  );
  add(
    "success-runtime-source-truthful",
    success.runtimeSource === "production_ai" && success.responseMode === "production_v2" &&
      success.meta?.mockOnly === false,
    "Production path must never be labelled mock.",
  );
  add(
    "success-canonical-v2-and-ui-model",
    success.data?.contractVersion === "2.0" && success.data?.requestId === success.requestId &&
      success.uiModel?.renderState !== "controlled_failure" &&
      success.uiModel?.mappingVersion === "1.0",
    "Canonical V2 data and mapped UI model are required.",
  );
  add(
    "success-no-mock-fallback",
    success.contractVersion !== "simulate-api-v1-mock" &&
      !JSON.stringify(success).includes('"mockOnly":true'),
    "Production success must not contain a mock substitute.",
  );

  const providerInputs = observedProviderRequests.map((item) => JSON.parse(item.input));
  const canonicalProviderKeys = [
    "allowed_refs",
    "capability",
    "classification",
    "constraints",
    "context_fingerprint",
    "contract_version",
    "criteria",
    "decision_question",
    "objective",
    "options",
    "policy",
  ];
  const providerPayload = JSON.stringify(providerInputs);
  add(
    "provider-receives-only-canonical-minimum-context",
    observedProviderRequests.length === 2 && providerInputs.every((item) =>
      JSON.stringify(Object.keys(item).sort()) === JSON.stringify(canonicalProviderKeys)
    ),
    "Provider-facing input must be the canonical filtered Prompt Context projection.",
  );
  add(
    "provider-payload-excludes-raw-context-and-state",
    !providerPayload.includes("rawInput") &&
      !providerPayload.includes("decisionContext") &&
      !providerPayload.includes("DecisionContext") &&
      !providerPayload.includes("inputId") &&
      !providerPayload.includes("submittedAt") &&
      !providerPayload.includes(success.requestId) &&
      !providerPayload.includes("account") &&
      !providerPayload.includes("draft") &&
      !providerPayload.includes("traceability") &&
      !providerPayload.includes("evidenceRefs"),
    "Raw/full context, state, operational IDs/timestamps, and internal evidence must stay server-side.",
  );

  const failureTransport = {
    async countInput() {
      throw new DecisionMaterialTransportFailure("provider_unavailable");
    },
    async generate() {
      throw new Error("Generation must not run after preflight transport failure.");
    },
  };
  activeRuntime = boundRuntime(failureTransport);
  const failureResponse = await POST(request(82));
  const failure = await payload(failureResponse);
  const serializedFailure = JSON.stringify(failure);

  add("failure-http-status-truthful", failureResponse.status === 502, `HTTP ${failureResponse.status}`);
  add(
    "failure-public-v2-envelope-valid",
    isPublicSimulationApiV2Envelope(failure) && failure.status === "failed" &&
      failure.data === null && failure.uiModel?.renderState === "controlled_failure",
    "Expected controlled V2 failure envelope and UI model.",
  );
  add(
    "failure-no-mock-substitution",
    failure.runtimeSource === "production_ai" && failure.meta?.mockOnly === false &&
      !serializedFailure.includes("simulate-api-v1-mock"),
    "Production failure must stay production failure without a mock substitute.",
  );
  add(
    "failure-internal-diagnostics-and-candidate-excluded",
    !serializedFailure.includes("provider_unavailable") &&
      !serializedFailure.includes("sourceCode") &&
      !serializedFailure.includes("candidateMaterial") &&
      !serializedFailure.includes("offline-proof-key"),
    "Internal diagnostics, provider candidates, and credentials must not reach the public envelope.",
  );

  let missingConfigTransportCalls = 0;
  activeRuntime = boundRuntime({
    async countInput() {
      missingConfigTransportCalls += 1;
      throw new Error("Transport must not run with missing credentials.");
    },
    async generate() {
      missingConfigTransportCalls += 1;
      throw new Error("Transport must not run with missing credentials.");
    },
  }, {
    LEVIO_REAL_AI_DEV_ENABLED: "true",
    LEVIO_AI_PROVIDER: "openai",
  });
  const missingConfigResponse = await POST(request(83));
  const missingConfig = await payload(missingConfigResponse);
  add(
    "missing-production-config-fails-closed",
    missingConfigResponse.status === 502 && missingConfig.status === "failed" &&
      missingConfig.uiModel?.renderState === "controlled_failure" &&
      missingConfigTransportCalls === 0,
    "Missing credentials must fail closed before transport execution.",
  );

  const callsBeforeDisabled = runtimeCalls;
  process.env.LEVIO_REAL_AI_DEV_ENABLED = "false";
  const defaultResponse = await POST(request(84));
  const defaultResult = await payload(defaultResponse);
  add(
    "disabled-default-remains-deterministic",
    defaultResponse.status === 200 &&
      defaultResult.contractVersion === "simulate-api-v1-mock" &&
      defaultResult.meta?.mockOnly === true && runtimeCalls === callsBeforeDisabled,
    "Disabled default must keep the exact deterministic preview and execute no production runtime.",
  );

  const homeSource = readFileSync(join(root, "components/HomeSimulator.tsx"), "utf8");
  const routeSource = readFileSync(join(root, "app/api/simulate/route.ts"), "utf8");
  add(
    "home-consumes-v2-ui-mapping",
    homeSource.includes("isPublicSimulationApiV2Envelope") &&
      homeSource.includes("productionResult.uiModel.sections.scenarios.items.map") &&
      homeSource.includes('renderState: "controlled_failure"'),
    "HomeSimulator must validate and render V2 success/failure mapping.",
  );
  add(
    "route-has-no-direct-provider-egress",
    routeSource.includes("runControlledProductionAiRuntimeSwitch") &&
      !routeSource.includes('from "openai"') &&
      !routeSource.includes("responses.create(") &&
      !routeSource.includes("fetch("),
    "Route must delegate to the protected runtime and never call provider directly.",
  );
  add(
    "public-client-cannot-select-runtime",
    routeSource.includes('new Set(["input", "lang"])') &&
      !homeSource.includes("LEVIO_REAL_AI_DEV_ENABLED") &&
      !homeSource.includes("process.env"),
    "Runtime selection must remain server-owned.",
  );
  add(
    "external-provider-api-token-operations-zero",
    externalNetworkRequests === 0,
    `Observed external network operations: ${externalNetworkRequests}.`,
  );
} finally {
  runtimeModule.runControlledProductionAiRuntimeSwitch = originalRuntimeCall;
  globalThis.fetch = originalFetch;
  if (originalFlag === undefined) delete process.env.LEVIO_REAL_AI_DEV_ENABLED;
  else process.env.LEVIO_REAL_AI_DEV_ENABLED = originalFlag;
}

for (const check of checks) {
  console[check.passed ? "log" : "error"](
    `${check.passed ? "PASS" : "FAIL"} ${check.id}${check.passed ? "" : ` - ${check.detail}`}`,
  );
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
