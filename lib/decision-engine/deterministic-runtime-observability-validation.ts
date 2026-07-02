import type { SimulationResponseV2Draft } from "./contracts";
import {
  adaptSimulationResponseV2ToPublicSimulatorEnvelope,
  SIMULATE_API_CONTRACT_VERSION,
  SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
  validatePublicSimulationEnvelopeShape,
  type PublicSimulationEnvelope,
} from "./simulation-response-public-adapter";
import {
  DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER,
  runInternalSimulationPipeline,
  simulationRuntimeOutcomeForResponseStatus,
} from "./simulation-pipeline-runner";

export type DeterministicRuntimeObservabilityValidationCaseResult = {
  name: string;
  passed: boolean;
  message?: string;
};

export type DeterministicRuntimeObservabilityValidationResult = {
  passed: boolean;
  cases: DeterministicRuntimeObservabilityValidationCaseResult[];
};

function assertCase(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runCase(
  name: string,
  check: () => void,
): DeterministicRuntimeObservabilityValidationCaseResult {
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

function requireResponse(input: string, requestId: string): SimulationResponseV2Draft {
  const result = runInternalSimulationPipeline({
    requestId,
    input,
    inputLanguage: "es",
    requestedOutputLanguage: "es",
  });

  assertCase(result.runtime.marker === DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER, "Missing deterministic runtime marker.");
  assertCase(result.runtime.rollbackSafe, "Runtime metadata must be rollback safe.");
  assertCase(Boolean(result.response), "Expected SimulationResponseV2Draft.");

  return result.response as SimulationResponseV2Draft;
}

function adapt(response: SimulationResponseV2Draft): PublicSimulationEnvelope {
  return adaptSimulationResponseV2ToPublicSimulatorEnvelope({
    response,
    requestId: response.requestId,
    generatedAt: response.generatedAt,
    truthBoundary: SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
  });
}

function assertPublicContract(envelope: PublicSimulationEnvelope): void {
  assertCase(envelope.contractVersion === SIMULATE_API_CONTRACT_VERSION, "Public contractVersion changed.");
  assertCase(envelope.meta.mockOnly === true, "mockOnly must remain true.");
  assertCase(envelope.meta.safeRender === true, "safeRender must remain true.");
  assertCase(envelope.meta.apiReady === true, "apiReady must remain true.");
  assertCase(validatePublicSimulationEnvelopeShape(envelope), "Envelope failed public shape validation.");
}

function assertNoInternalLeakage(envelope: PublicSimulationEnvelope): void {
  const serialized = JSON.stringify(envelope);
  const forbidden = [
    "traceability",
    "controlledFailures",
    "runnerVersion",
    "builderVersion",
    "providerSdkUsed",
    "apiKeyRead",
    "environmentRead",
    "responseMapping",
    "orchestratorTrace",
  ];

  for (const marker of forbidden) {
    assertCase(!serialized.includes(marker), `Public envelope leaked internal marker ${marker}.`);
  }
}

function assertFailClosedNoArtifacts(envelope: PublicSimulationEnvelope, code: NonNullable<PublicSimulationEnvelope["error"]>["code"]): void {
  assertCase(envelope.status === "failed", "Expected failed public envelope.");
  assertCase(envelope.data === null, "Failed public envelope must keep data:null.");
  assertCase(envelope.error?.code === code, `Expected error code ${code}.`);
  assertCase(!("simulation" in envelope), "Envelope must not expose simulation at top level.");
  assertCase(!("traceability" in envelope), "Envelope must not expose internal traceability.");
}

export function runDeterministicRuntimeObservabilityValidation(): DeterministicRuntimeObservabilityValidationResult {
  const cases = [
    runCase("success runtime marker and public contract stay stable", () => {
      const response = requireResponse(
        "Lanzar una oferta premium para clientes existentes esta semana sin aumentar presupuesto",
        "observability_case_success",
      );
      const envelope = adapt(response);
      assertCase(simulationRuntimeOutcomeForResponseStatus(response.status) === "success", "Expected success runtime outcome.");
      assertCase(envelope.status === "completed", "Expected completed public envelope.");
      assertPublicContract(envelope);
      assertNoInternalLeakage(envelope);
    }),

    runCase("refused outcome fails closed without public artifacts", () => {
      const response = requireResponse("Estoy pensando en matarme", "observability_case_refused");
      const envelope = adapt(response);
      assertCase(simulationRuntimeOutcomeForResponseStatus(response.status) === "refused", "Expected refused runtime outcome.");
      assertFailClosedNoArtifacts(envelope, "REFUSED");
      assertPublicContract(envelope);
      assertNoInternalLeakage(envelope);
    }),

    runCase("clarification outcome fails closed without public artifacts", () => {
      const response = requireResponse("Explorar una decision de salud esta semana", "observability_case_clarification");
      const envelope = adapt(response);
      assertCase(
        simulationRuntimeOutcomeForResponseStatus(response.status) === "clarification",
        "Expected clarification runtime outcome.",
      );
      assertFailClosedNoArtifacts(envelope, "CLARIFICATION_REQUIRED");
      assertPublicContract(envelope);
      assertNoInternalLeakage(envelope);
    }),

    runCase("cannot_recommend outcome fails closed without public artifacts", () => {
      const response = requireResponse("Decidir si cambio mi tratamiento medico", "observability_case_cannot_recommend");
      const envelope = adapt(response);
      assertCase(
        simulationRuntimeOutcomeForResponseStatus(response.status) === "cannot_recommend",
        "Expected cannot_recommend runtime outcome.",
      );
      assertFailClosedNoArtifacts(envelope, "CANNOT_RECOMMEND");
      assertPublicContract(envelope);
      assertNoInternalLeakage(envelope);
    }),

    runCase("failed status maps to rollback simulation_failed semantics", () => {
      assertCase(
        simulationRuntimeOutcomeForResponseStatus("failed") === "simulation_failed",
        "Expected failed status to map to simulation_failed.",
      );
    }),

    runCase("wrong adapter truth boundary fails closed", () => {
      const response = requireResponse("Comparar aceptar una oferta laboral o seguir en mi empresa", "observability_case_wrong_boundary");
      const envelope = adaptSimulationResponseV2ToPublicSimulatorEnvelope({
        response,
        requestId: response.requestId,
        generatedAt: response.generatedAt,
        truthBoundary: "legacy_mock" as typeof SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
      });
      assertFailClosedNoArtifacts(envelope, "SIMULATION_FAILED");
      assertPublicContract(envelope);
      assertNoInternalLeakage(envelope);
    }),
  ];

  return {
    passed: cases.every((item) => item.passed),
    cases,
  };
}
