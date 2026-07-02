import type { SimulationResponseV2Draft } from "./contracts";
import {
  adaptSimulationResponseV2ToPublicSimulatorEnvelope,
  SIMULATE_API_CONTRACT_VERSION,
  SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
  simulationResponsePublicAdapterIsolationEvidence,
  validatePublicSimulationEnvelopeShape,
  type PublicSimulationEnvelope,
} from "./simulation-response-public-adapter";
import { runInternalSimulationPipeline } from "./simulation-pipeline-runner";

export type SimulationResponsePublicAdapterValidationCaseResult = {
  name: string;
  passed: boolean;
  message?: string;
};

export type SimulationResponsePublicAdapterValidationResult = {
  passed: boolean;
  cases: SimulationResponsePublicAdapterValidationCaseResult[];
};

function assertCase(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runCase(name: string, check: () => void): SimulationResponsePublicAdapterValidationCaseResult {
  try {
    check();
    return { name, passed: true };
  } catch (error) {
    return {
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function requireV2(input: string, requestId: string): SimulationResponseV2Draft {
  const result = runInternalSimulationPipeline({
    requestId,
    input,
    inputLanguage: "es",
    requestedOutputLanguage: "es",
  });

  assertCase(result.status === "completed", `Expected runner completion, received ${result.status}.`);
  assertCase(Boolean(result.response), "Expected SimulationResponseV2Draft from runner.");

  return result.response as SimulationResponseV2Draft;
}

function cloneV2(response: SimulationResponseV2Draft): SimulationResponseV2Draft {
  return JSON.parse(JSON.stringify(response)) as SimulationResponseV2Draft;
}

function adapt(response: SimulationResponseV2Draft): PublicSimulationEnvelope {
  return adaptSimulationResponseV2ToPublicSimulatorEnvelope({
    response,
    requestId: response.requestId,
    generatedAt: response.generatedAt,
    truthBoundary: SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
  });
}

function normalResponse(): SimulationResponseV2Draft {
  return requireV2(
    "Lanzar una oferta premium para clientes existentes esta semana sin aumentar presupuesto",
    "adapter_case_normal",
  );
}

function homeSimulatorAcceptsEnvelope(envelope: PublicSimulationEnvelope): boolean {
  if (
    envelope.contractVersion !== SIMULATE_API_CONTRACT_VERSION ||
    typeof envelope.requestId !== "string" ||
    envelope.meta.lang !== "es" ||
    envelope.meta.safeRender !== true ||
    envelope.meta.mockOnly !== true ||
    envelope.meta.apiReady !== true ||
    typeof envelope.meta.maxInputLength !== "number" ||
    typeof envelope.meta.maxBodyLength !== "number" ||
    typeof envelope.meta.generatedAt !== "string"
  ) {
    return false;
  }

  if (envelope.status === "failed") {
    return envelope.data === null &&
      envelope.error !== null &&
      typeof envelope.error.code === "string" &&
      typeof envelope.error.message === "string";
  }

  return envelope.error === null &&
    envelope.data !== null &&
    Array.isArray(envelope.data.thinkingStages) &&
    typeof envelope.data.input === "string" &&
    envelope.data.lang === "es" &&
    typeof envelope.data.generatedAt === "string" &&
    typeof envelope.data.simulation === "object" &&
    Array.isArray(envelope.data.simulation.scenarios) &&
    Array.isArray(envelope.data.simulation.impacts) &&
    Array.isArray(envelope.data.simulation.timeline);
}

function failedV2(status: SimulationResponseV2Draft["status"], codeMessage: string): SimulationResponseV2Draft {
  const response = cloneV2(normalResponse());
  response.status = status;
  response.analysis = undefined;
  response.recommendation = undefined;

  if (status === "failed") {
    response.failure = {
      code: "validation_failure",
      message: codeMessage,
      retryable: false,
    };
    response.controlledFailures = [response.failure];
  }

  if (status === "cannot_recommend") {
    response.safety = {
      level: "restricted",
      domain: "medical",
      recommendationAllowed: false,
      message: codeMessage,
      suggestedSupport: ["Qualified professional review may be required."],
      prohibitedOutputs: ["Do not provide prescriptive advice."],
    };
  }

  if (status === "refused") {
    response.safety = {
      level: "refuse",
      domain: "self_harm",
      recommendationAllowed: false,
      message: codeMessage,
      suggestedSupport: ["Immediate local support may be required."],
      prohibitedOutputs: ["Do not provide harmful instructions."],
    };
  }

  if (status === "clarification_required") {
    response.safety = {
      ...response.safety,
      recommendationAllowed: false,
    };
    response.clarification = {
      action: "ask",
      reason: codeMessage,
      canProceedWithoutAnswers: false,
      questions: [
        {
          id: "adapter_validation_question",
          text: "What missing context should be clarified?",
          answerType: "free_text",
          required: true,
          resolvesGapIds: ["adapter_validation_gap"],
          whyItMatters: "The adapter must not pretend a full simulation is available.",
        },
      ],
    };
  }

  return response;
}

export function runSimulationResponsePublicAdapterValidation(): SimulationResponsePublicAdapterValidationResult {
  const cases = [
    runCase("normal V2 maps to completed public envelope", () => {
      const envelope = adapt(normalResponse());
      assertCase(envelope.status === "completed", "Expected completed public envelope.");
      assertCase(validatePublicSimulationEnvelopeShape(envelope), "Expected valid public envelope shape.");
      assertCase(envelope.data.simulation.scenarios.length > 0, "Expected public scenarios.");
    }),

    runCase("limited V2 maps to completed public envelope", () => {
      const response = cloneV2(normalResponse());
      response.status = "limited_analysis";
      const envelope = adapt(response);
      assertCase(envelope.status === "completed", "Expected completed public envelope for limited analysis.");
      assertCase(envelope.data.simulation.result.includes("limitada"), "Expected limited analysis truth copy.");
    }),

    runCase("contractVersion remains simulate-api-v1-mock", () => {
      const envelope = adapt(normalResponse());
      assertCase(envelope.contractVersion === "simulate-api-v1-mock", "Unexpected contractVersion.");
    }),

    runCase("meta mockOnly safeRender apiReady remain true", () => {
      const envelope = adapt(normalResponse());
      assertCase(envelope.meta.mockOnly === true, "mockOnly must remain true.");
      assertCase(envelope.meta.safeRender === true, "safeRender must remain true.");
      assertCase(envelope.meta.apiReady === true, "apiReady must remain true.");
    }),

    runCase("refused maps fail-closed with data null and no recommendation", () => {
      const envelope = adapt(failedV2("refused", "The deterministic safety boundary requires refusal."));
      assertCase(envelope.status === "failed", "Expected failed public envelope.");
      assertCase(envelope.data === null, "Refused output must not include data.");
      assertCase(envelope.error?.code === "REFUSED", "Expected REFUSED error code.");
    }),

    runCase("cannot_recommend maps fail-closed with data null and no recommendation", () => {
      const envelope = adapt(failedV2("cannot_recommend", "The deterministic safety boundary blocks recommendation."));
      assertCase(envelope.status === "failed", "Expected failed public envelope.");
      assertCase(envelope.data === null, "cannot_recommend output must not include data.");
      assertCase(envelope.error?.code === "CANNOT_RECOMMEND", "Expected CANNOT_RECOMMEND error code.");
    }),

    runCase("clarification_required does not pretend full analysis", () => {
      const envelope = adapt(failedV2("clarification_required", "Clarification is required."));
      assertCase(envelope.status === "failed", "Expected fail-closed clarification envelope.");
      assertCase(envelope.data === null, "clarification_required must not include data.");
      assertCase(envelope.error?.code === "CLARIFICATION_REQUIRED", "Expected CLARIFICATION_REQUIRED error code.");
    }),

    runCase("failed maps to public failed envelope", () => {
      const envelope = adapt(failedV2("failed", "Controlled validation failure."));
      assertCase(envelope.status === "failed", "Expected failed public envelope.");
      assertCase(envelope.data === null, "Failed output must not include data.");
      assertCase(envelope.error?.code === "SIMULATION_FAILED", "Expected SIMULATION_FAILED error code.");
    }),

    runCase("output satisfies HomeSimulator envelope expectations", () => {
      const completedEnvelope = adapt(normalResponse());
      const refusedEnvelope = adapt(failedV2("refused", "The deterministic safety boundary requires refusal."));
      assertCase(homeSimulatorAcceptsEnvelope(completedEnvelope), "HomeSimulator would reject completed envelope.");
      assertCase(homeSimulatorAcceptsEnvelope(refusedEnvelope), "HomeSimulator would reject failed envelope.");
    }),

    runCase("adapter isolation evidence forbids external runtime dependencies", () => {
      const isolation = simulationResponsePublicAdapterIsolationEvidence();
      assertCase(isolation.deterministicOnly, "Expected deterministicOnly.");
      assertCase(!isolation.modelCallsExecuted, "Expected no model calls.");
      assertCase(!isolation.providerSdkUsed, "Expected no provider SDK.");
      assertCase(!isolation.environmentRead, "Expected no environment reads.");
      assertCase(!isolation.apiKeyRead, "Expected no API key reads.");
      assertCase(!isolation.fetchUsed, "Expected no fetch.");
      assertCase(!isolation.persistenceUsed, "Expected no persistence.");
      assertCase(!isolation.authUsed, "Expected no auth.");
      assertCase(!isolation.billingUsed, "Expected no billing.");
    }),

    runCase("adapter output stays compatible with public simulator quality invariants", () => {
      const envelope = adapt(normalResponse());
      assertCase(envelope.contractVersion === "simulate-api-v1-mock", "Unexpected contractVersion.");
      assertCase(envelope.status === "completed", "Expected completed status.");
      assertCase(Array.isArray(envelope.data.simulation.scenarios), "Expected scenarios array.");
      assertCase(Array.isArray(envelope.data.simulation.impacts), "Expected impacts array.");
      assertCase(Array.isArray(envelope.data.simulation.timeline), "Expected timeline array.");
    }),

    runCase("adapter output preserves public home truth-boundary copy", () => {
      const envelope = adapt(normalResponse());
      assertCase(envelope.status === "completed", "Expected completed envelope.");
      assertCase(envelope.data.simulation.detailCopy.includes("Real AI"), "Expected Real AI deferred copy.");
      assertCase(envelope.data.simulation.status.includes("Preview"), "Expected preview status copy.");
      assertCase(envelope.data.simulation.privacy.includes("Preview"), "Expected preview privacy copy.");
    }),

    runCase("adapter does not import public runtime modules", () => {
      const isolation = simulationResponsePublicAdapterIsolationEvidence();
      assertCase(!isolation.publicRouteWiringUsed, "Adapter must not wire public API route.");
      assertCase(!isolation.homeSimulatorImported, "Adapter must not import HomeSimulator.");
      assertCase(!isolation.simulationEngineImported, "Adapter must not import simulationEngine.");
      assertCase(!isolation.mockSimulationsImported, "Adapter must not import mockSimulations.");
      assertCase(!isolation.builderUsed, "Adapter must not call Builder.");
      assertCase(!isolation.pipelineRunnerUsed, "Adapter must not call Pipeline Runner.");
    }),
  ];

  return {
    passed: cases.every((item) => item.passed),
    cases,
  };
}
