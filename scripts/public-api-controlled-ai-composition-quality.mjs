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
const {
  runDeterministicClarificationRoundTrip,
} = require(join(root, "lib/decision-engine/deterministic-clarification-round-trip.ts"));

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
const observedRuntimeRequests = [];
runtimeModule.runControlledProductionAiRuntimeSwitch = async (request) => {
  runtimeCalls += 1;
  observedRuntimeRequests.push(request);
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
  "Comparar aceptar Plan Norte o Plan Sur antes de final de mes con mi familia, sin reducir ingresos, con menos de 5000 euros y una transición reversible.";
const clarificationInput = "¿Debería cambiar de trabajo?";
const clarificationAnswers = [
  "Conseguir un trabajo más estable, con mejores condiciones y que me permita tener más tiempo para mi vida personal.",
  "Necesito mantener unos ingresos suficientes para cubrir mis gastos y preferiría tener una nueva oferta antes de dejar mi trabajo actual.",
  "No quiero reducir mucho mis ingresos ni aceptar unas condiciones laborales claramente peores que las actuales.",
];
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

  const runtimeCallsBeforeClarification = runtimeCalls;
  const providerRequestsBeforeClarification = observedProviderRequests.length;
  const clarificationResponse = await POST(request(85, {
    input: clarificationInput,
    lang: "es",
  }));
  const clarification = await payload(clarificationResponse);
  add(
    "real-ai-sparse-input-returns-clarification-before-runtime",
    clarificationResponse.status === 200 &&
      clarification.status === "clarification_required" &&
      clarification.meta?.mockOnly === true &&
      runtimeCalls === runtimeCallsBeforeClarification &&
      observedProviderRequests.length === providerRequestsBeforeClarification,
    "Sparse input must produce clarification state without entering provider runtime.",
  );

  const submittedAnswers = clarification.data.questions.map((question, index) => ({
    questionId: question.id,
    answer: clarificationAnswers[index],
  }));
  const expectedContinuation = runDeterministicClarificationRoundTrip({
    requestId: "offline_expected_continuation",
    simulationId: clarification.data.simulationId,
    input: clarificationInput,
    round: clarification.data.round,
    answers: submittedAnswers,
  });
  const continuationProviderStart = observedProviderRequests.length;
  const continuationRuntimeStart = observedRuntimeRequests.length;
  const continuationResponse = await POST(request(86, {
    input: clarificationInput,
    lang: "es",
    clarification: {
      simulationId: clarification.data.simulationId,
      round: clarification.data.round,
      answers: submittedAnswers,
    },
  }));
  const continuation = await payload(continuationResponse);
  const continuationRuntimeRequest = observedRuntimeRequests[continuationRuntimeStart];
  const continuationProviderRequests = observedProviderRequests.slice(continuationProviderStart);
  const continuationProviderPayloads = continuationProviderRequests.map((item) => JSON.parse(item.input));
  const serializedCanonicalContext = JSON.stringify(continuationRuntimeRequest?.context);
  const serializedProviderPayloads = JSON.stringify(continuationProviderPayloads);

  add(
    "clarification-continuation-preserves-logical-simulation-id",
    continuationResponse.status === 200 &&
      continuation.status === "completed" &&
      continuation.requestId === clarification.data.simulationId &&
      continuation.data?.requestId === clarification.data.simulationId &&
      continuationRuntimeRequest?.requestId === clarification.data.simulationId,
    "Continuation, runtime, and completed result must share the initial simulationId.",
  );
  add(
    "three-clarification-answers-enter-canonical-context",
    expectedContinuation.status === "ready" &&
      expectedContinuation.builder.evidence.filter((item) => item.source === "user_answer").length === 3 &&
      clarificationAnswers.every((answer) => serializedCanonicalContext.includes(answer)),
    "All three accepted answers must be represented in canonical DecisionContext.",
  );
  add(
    "deterministic-and-real-ai-use-equivalent-canonical-context",
    expectedContinuation.status === "ready" &&
      JSON.stringify(expectedContinuation.builder.decisionContext) === serializedCanonicalContext,
    "The public Real-AI runtime must receive the same canonical context produced by deterministic clarification.",
  );
  add(
    "real-ai-offline-payload-preserves-question-and-clarification-context",
    continuationProviderPayloads.length === 2 &&
      continuationProviderPayloads.every((item) => item.decision_question?.content === clarificationInput) &&
      clarificationAnswers.every((answer) => serializedProviderPayloads.includes(answer)),
    "Prepared provider payload must contain the original question and all clarification-derived minimum context.",
  );
  add(
    "clarification-state-does-not-leak-into-provider-payload",
    !serializedProviderPayloads.includes("mockOnly") &&
      !serializedProviderPayloads.includes("clarification_required") &&
      !serializedProviderPayloads.includes(clarification.data.simulationId),
    "Presentation and continuation state must remain outside provider context.",
  );

  const runtimeCallsBeforeSafety = runtimeCalls;
  const providerRequestsBeforeSafety = observedProviderRequests.length;
  const safetyResponse = await POST(request(87, {
    input: "Estoy pensando en matarme",
    lang: "es",
  }));
  const safety = await payload(safetyResponse);
  add(
    "safety-refusal-precedes-real-ai-runtime",
    safetyResponse.status === 200 &&
      safety.status === "failed" &&
      safety.error?.code === "REFUSED" &&
      runtimeCalls === runtimeCallsBeforeSafety &&
      observedProviderRequests.length === providerRequestsBeforeSafety,
    "Safety refusal must complete locally before any provider transport call.",
  );

  const failureTransport = {
    async countInput() {
      throw new DecisionMaterialTransportFailure(
        "provider_unavailable",
        undefined,
        {
          providerFailureType: "http_error",
          httpStatus: 503,
          providerCode: "temporarily_unavailable",
          providerErrorType: "service_unavailable",
        },
      );
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
      !serializedFailure.includes("providerFailureType") &&
      !serializedFailure.includes("httpStatus") &&
      !serializedFailure.includes("temporarily_unavailable") &&
      !serializedFailure.includes("service_unavailable") &&
      !serializedFailure.includes("sourceCode") &&
      !serializedFailure.includes("candidateMaterial") &&
      !serializedFailure.includes("offline-proof-key"),
    "Internal diagnostics, provider candidates, and credentials must not reach the public envelope.",
  );
  add(
    "failure-generic-public-message-preserved",
    failure.error?.message === "No se pudo completar la simulación de forma segura." &&
      failure.uiModel?.sections?.status?.items?.[0]?.message ===
        "No se pudo completar la simulación de forma segura.",
    "The public API and UI model must preserve the controlled generic Spanish message.",
  );

  const groundingRawContent = "GROUNDING_PROVIDER_PROSE_MUST_NOT_LEAK";
  const groundingMaterial = structuredClone(validCandidateDecisionMaterial());
  groundingMaterial.items[0].content = groundingRawContent;
  groundingMaterial.items[0].criterion_refs = ["criterion_99"];
  const groundingEventStart = operationalEvents.length;
  activeRuntime = boundRuntime({
    async countInput() {
      return 1200;
    },
    async generate() {
      return {
        status: "completed",
        outputText: JSON.stringify(groundingMaterial),
        usage: { inputTokens: 1200, outputTokens: 100, totalTokens: 1300 },
      };
    },
  });
  const groundingResponse = await POST(request(88));
  const groundingFailure = await payload(groundingResponse);
  const serializedGroundingFailure = JSON.stringify(groundingFailure);
  const groundingEvent = operationalEvents.slice(groundingEventStart).find(
    (event) => event.event === "orchestration_failed",
  );

  add(
    "grounding-failure-internal-event-is-bounded",
    groundingEvent?.failureCategory === "provider_grounding_invalid" &&
      groundingEvent.groundingItemType === "option" &&
      groundingEvent.groundingItemIndex === 0 &&
      groundingEvent.groundingField === "criterion_refs" &&
      groundingEvent.groundingPredicate === "unknown_criterion_ref" &&
      groundingEvent.groundingReferenceToken === "criterion_99" &&
      !JSON.stringify(groundingEvent).includes(groundingRawContent),
    "Internal event must identify the exact grounding predicate without provider prose.",
  );
  add(
    "grounding-failure-public-envelope-remains-generic",
    groundingResponse.status === 502 &&
      groundingFailure.status === "failed" &&
      groundingFailure.error?.message === "No se pudo completar la simulación de forma segura." &&
      groundingFailure.uiModel?.renderState === "controlled_failure" &&
      !serializedGroundingFailure.includes("grounding") &&
      !serializedGroundingFailure.includes("criterion_99") &&
      !serializedGroundingFailure.includes(groundingRawContent) &&
      !serializedGroundingFailure.includes("provider_grounding_invalid"),
    "Grounding diagnostics or raw output reached the public API/UI envelope.",
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
    routeSource.includes('new Set(["input", "lang", "clarification"])') &&
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
