import {
  DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER,
  runInternalSimulationPipeline,
  simulationRuntimeOutcomeForResponseStatus,
  simulationPipelineRunnerIsolationEvidence,
  type SimulationPipelineRunnerResult,
} from "./simulation-pipeline-runner";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";

export type SimulationPipelineRunnerValidationCaseResult = {
  name: string;
  passed: boolean;
  message?: string;
};

export type SimulationPipelineRunnerValidationResult = {
  passed: boolean;
  cases: SimulationPipelineRunnerValidationCaseResult[];
};

function assertCase(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function completed(result: SimulationPipelineRunnerResult): asserts result is SimulationPipelineRunnerResult & {
  status: "completed";
  response: NonNullable<SimulationPipelineRunnerResult["response"]>;
} {
  assertCase(result.status === "completed", `Expected completed runner status, received ${result.status}.`);
  assertCase(Boolean(result.response), "Expected SimulationResponseV2Draft.");
  assertCase(validateSimulationResponseV2DraftShape(result.response), "Expected valid SimulationResponseV2Draft shape.");
}

function runCase(name: string, check: () => void): SimulationPipelineRunnerValidationCaseResult {
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

function hasPublicMockEnvelope(value: unknown): boolean {
  const candidate = value as { meta?: unknown; data?: unknown };
  return Boolean(candidate?.meta) || Boolean(candidate?.data);
}

export function runSimulationPipelineRunnerValidation(): SimulationPipelineRunnerValidationResult {
  const cases = [
    runCase("normal input completes with SimulationResponseV2Draft", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_normal",
        input: "Lanzar una oferta premium para clientes existentes esta semana",
        inputLanguage: "es",
        requestedOutputLanguage: "es",
      });
      completed(result);
      assertCase(result.builder.status === "built", "Expected built builder metadata.");
      assertCase(result.runtime.marker === DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER, "Expected deterministic runtime marker.");
      assertCase(result.runtime.outcome === "success", "Expected success runtime outcome.");
      assertCase(result.runtime.rollbackSafe, "Expected rollback-safe runtime metadata.");
      assertCase(result.response.contractVersion === "2.0", "Expected SimulationResponse V2 contract.");
      assertCase(result.pipelineStatus !== "failed", "Expected non-failed pipeline status.");
    }),

    runCase("empty input rejected before pipeline", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_empty",
        input: "   ",
        inputLanguage: "es",
      });
      assertCase(result.status === "rejected", "Expected rejected runner status.");
      assertCase(result.runtime.outcome === "simulation_failed", "Expected simulation_failed runtime outcome.");
      assertCase(result.runtime.source === "builder", "Expected builder source metadata.");
      assertCase(result.error?.code === "builder_rejected", "Expected builder_rejected error.");
      assertCase(!result.response, "Rejected input must not include a pipeline response.");
      assertCase(
        !result.trace.some((entry) => entry.stage === "simulation_pipeline"),
        "Rejected input must not reach the simulation pipeline.",
      );
    }),

    runCase("comparative input completes", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_compare",
        input: "Comparar aceptar la oferta laboral o seguir en mi empresa actual esta semana",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.response.decision.decisionTypes.includes("comparative"), "Expected comparative decision type.");
      assertCase(result.response.decision.optionSummaries.length >= 2, "Expected comparative options.");
    }),

    runCase("finance input with missing budget preserves uncertainty", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_finance_missing_budget",
        input: "Comprar un coche usado este mes",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.builder.missingFields.includes("budget"), "Expected missing budget metadata.");
      assertCase(result.response.notices.length > 0, "Expected uncertainty or limited-context notices.");
    }),

    runCase("explicit budget appears in builder evidence and pipeline result remains valid", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_explicit_budget",
        input: "Comprar un coche usado con presupuesto de 8000 euros este mes",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.evidence.some((item) => item.claim.includes("8000")), "Expected explicit budget evidence.");
      assertCase(validateSimulationResponseV2DraftShape(result.response), "Expected valid pipeline response.");
    }),

    runCase("health and legal input does not bypass safety boundary", () => {
      const health = runInternalSimulationPipeline({
        requestId: "runner_case_health",
        input: "Decidir si cambio mi tratamiento medico",
        inputLanguage: "es",
      });
      const legal = runInternalSimulationPipeline({
        requestId: "runner_case_legal",
        input: "Revisar una demanda con mi abogado",
        inputLanguage: "es",
      });
      completed(health);
      completed(legal);
      assertCase(health.builder.safetyDomain === "medical", "Expected medical safety domain.");
      assertCase(legal.builder.safetyDomain === "legal", "Expected legal safety domain.");
      assertCase(health.response.safety.level !== "standard", "Expected elevated or restricted health safety.");
      assertCase(legal.response.safety.level !== "standard", "Expected elevated or restricted legal safety.");
    }),

    runCase("refuse input does not produce unsafe normal completion", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_refuse",
        input: "Estoy pensando en matarme",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.runtime.outcome === "refused", "Expected refused runtime outcome.");
      assertCase(result.response.status === "refused", "Expected refused pipeline status.");
      assertCase(result.response.safety.level === "refuse", "Expected refuse safety level.");
      assertCase(!result.response.recommendation, "Refused response must not include recommendation.");
      assertCase(!result.response.analysis, "Refused response must not include analysis.");
    }),

    runCase("clarification outcome is observable and carries no normal artifacts", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_clarification",
        input: "Explorar una decision de salud esta semana",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.response.status === "clarification_required", "Expected clarification_required status.");
      assertCase(result.runtime.outcome === "clarification", "Expected clarification runtime outcome.");
      assertCase(!result.response.recommendation, "Clarification response must not include recommendation.");
      assertCase(!result.response.analysis, "Clarification response must not include analysis.");
    }),

    runCase("cannot_recommend outcome is observable and carries no normal recommendation", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_cannot_recommend",
        input: "Decidir si cambio mi tratamiento medico",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.response.status === "cannot_recommend", "Expected cannot_recommend status.");
      assertCase(result.runtime.outcome === "cannot_recommend", "Expected cannot_recommend runtime outcome.");
      assertCase(!result.response.recommendation, "cannot_recommend response must not include normal recommendation.");
    }),

    runCase("failed internal status maps to simulation_failed outcome", () => {
      assertCase(
        simulationRuntimeOutcomeForResponseStatus("failed") === "simulation_failed",
        "Expected failed status to map to simulation_failed.",
      );
    }),

    runCase("runner isolation evidence forbids external runtime dependencies", () => {
      const isolation = simulationPipelineRunnerIsolationEvidence();
      assertCase(isolation.deterministicOnly, "Expected deterministicOnly.");
      assertCase(isolation.builderUsed, "Expected builder usage.");
      assertCase(isolation.pipelineUsed, "Expected pipeline usage.");
      assertCase(!isolation.publicApiAdapterUsed, "Expected no public API adapter.");
      assertCase(!isolation.publicMockEnvelopeCreated, "Expected no public mock envelope.");
      assertCase(!isolation.modelCallsExecuted, "Expected no model calls.");
      assertCase(!isolation.providerSdkUsed, "Expected no provider SDK.");
      assertCase(!isolation.environmentRead, "Expected no environment reads.");
      assertCase(!isolation.apiKeyRead, "Expected no API key reads.");
      assertCase(!isolation.persistenceUsed, "Expected no persistence.");
      assertCase(!isolation.authUsed, "Expected no auth.");
      assertCase(!isolation.billingUsed, "Expected no billing.");
    }),

    runCase("runner does not create public mock contract", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_no_public_mock",
        input: "Explorar lanzar un producto nuevo esta semana",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.response.contractVersion === "2.0", "Expected internal SimulationResponse V2 contract.");
      assertCase(!hasPublicMockEnvelope(result.response), "Runner must not create public mock envelope fields.");
    }),

    runCase("pipeline result includes traceability evidence and simulation draft shape", () => {
      const result = runInternalSimulationPipeline({
        requestId: "runner_case_traceability",
        input: "Lanzar una oferta premium para clientes existentes esta semana sin aumentar presupuesto",
        inputLanguage: "es",
      });
      completed(result);
      assertCase(result.evidence.length > 0, "Expected runner evidence.");
      assertCase(result.response.traceability.evidence.length > 0, "Expected response traceability evidence.");
      assertCase(result.response.traceability.responseMapping.length > 0, "Expected response mapping trace.");
      assertCase(result.trace.some((entry) => entry.stage === "response_validation"), "Expected runner validation trace.");
    }),
  ];

  return {
    passed: cases.every((item) => item.passed),
    cases,
  };
}
