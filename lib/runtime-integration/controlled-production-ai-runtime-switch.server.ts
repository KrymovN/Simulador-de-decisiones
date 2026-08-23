import "server-only";

import type { DecisionEnginePromptContextBridgeRequest } from "../ai-integration/contracts";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  bindProductionDecisionSimulationCompositionRoot,
  type OpenAIDecisionMaterialTransportFactory,
  type ProductionDecisionSimulationCompositionRoot,
} from "../ai-integration/production-decision-simulation-composition-root.server";
import {
  calculateDecisionMaterialCost,
  DecisionMaterialTransportFailure,
  type DecisionMaterialProviderRequest,
  type DecisionMaterialTransport,
  type DecisionMaterialTransportGeneration,
} from "../ai-provider/openai-decision-material-adapter";
import {
  createOpenAIDecisionMaterialTransport,
  readOpenAIEnvironmentConfiguration,
} from "../ai-provider/openai-synthetic-risk-adapter.server";
import type { DecisionContext } from "../decision-engine/types";
import { runSimulationPipeline } from "../decision-engine/pipeline";
import { mapSimulationResponseV2ToUiModel } from
  "../decision-engine/simulation-response-v2-ui-mapping";
import type { ControlledFailure, DecisionInput } from "../decision-engine/types";
import {
  CONTROLLED_SIMULATOR_SWITCH_MODE,
  CONTROLLED_SIMULATOR_SWITCH_VERSION,
  CONTROLLED_PRODUCTION_AI_OPERATIONAL_EVENT_VERSION,
  type ControlledProductionAiOperationalEvent,
  type ControlledProductionAiOperationalObserver,
  type ControlledProductionAiEvidence,
  type ControlledProductionAiFailureCode,
  type ControlledProductionAiFailureResult,
  type ControlledServerRuntimeSelectionResult,
  type ControlledSimulatorSwitchRequest,
} from "./controlled-simulator-runtime-switch-contracts";
import {
  runControlledSimulatorRuntimeSwitch,
  validateControlledSimulatorSwitchRequest,
} from "./controlled-simulator-runtime-switch";

const REQUEST_KEYS = [
  "switchVersion",
  "mode",
  "executionContext",
  "requestId",
  "input",
  "lang",
  "requestedOutputLanguage",
  "userIntent",
  "context",
  "safety",
  "safetyContextComplete",
] as const;

export type ControlledProductionAiRuntimeSwitch = {
  serverOnly: true;
  execute(request: unknown): Promise<ControlledServerRuntimeSelectionResult>;
};

export type ControlledProductionAiRuntimeEnvironment = Readonly<
  Record<string, string | undefined>
>;

export type ControlledProductionAiRuntimeClock = () => string;

export type ControlledProductionAiOperationalOptions = {
  observer?: ControlledProductionAiOperationalObserver;
  now?: () => number;
};

type OperationalExecutionContext = {
  requestId: string;
  rollbackState: ControlledProductionAiOperationalEvent["rollbackState"];
};

export const CONTROLLED_PRODUCTION_AI_PUBLIC_FAILURE_MESSAGE =
  "No se pudo completar la simulación de forma segura." as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactRuntimeRequest(value: unknown): boolean {
  return record(value) && Object.keys(value).every((key) =>
    REQUEST_KEYS.includes(key as never)
  );
}

function safeRequestId(value: unknown): string {
  return record(value) && typeof value.requestId === "string" && value.requestId.trim()
    ? value.requestId
    : "invalid_controlled_switch_request";
}

function boundedOrchestrationId(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,47}$/i.test(value);
}

function operationalRequestId(value: unknown): string {
  const candidate = safeRequestId(value);
  return boundedOrchestrationId(candidate)
    ? candidate
    : "invalid_controlled_switch_request";
}

function normalizedTransportFailure(error: unknown): string {
  return error instanceof DecisionMaterialTransportFailure
    ? error.category
    : "provider_unknown_failure";
}

function safeUsage(generation: DecisionMaterialTransportGeneration):
  ControlledProductionAiOperationalEvent["usage"] | undefined {
  if (generation.status !== "completed") return undefined;
  const { inputTokens, outputTokens, totalTokens } = generation.usage;
  if (
    !Number.isSafeInteger(inputTokens) || inputTokens < 0 ||
    !Number.isSafeInteger(outputTokens) || outputTokens < 0 ||
    !Number.isSafeInteger(totalTokens) || totalTokens !== inputTokens + outputTokens
  ) return undefined;
  return {
    inputTokens,
    outputTokens,
    totalTokens,
    calculatedCostUsd: calculateDecisionMaterialCost(inputTokens, outputTokens),
  };
}

export function writeControlledProductionAiOperationalEvent(
  event: ControlledProductionAiOperationalEvent,
): void {
  console.info("[levio:production-ai-runtime]", JSON.stringify(event));
}

function aiEvidence(
  compositionRootUsed: boolean,
  decisionEngineAuthorityPreserved: boolean,
): ControlledProductionAiEvidence {
  return {
    serverOnly: true,
    denyByDefault: true,
    existingControlledSwitchUsed: true,
    productionCompositionRootUsed: compositionRootUsed,
    decisionEngineAuthorityPreserved,
    clientRuntimeSelectionAllowed: false,
    providerControlledByServer: true,
    modelControlledByAdapter: true,
    credentialsExposed: false,
    directProviderToSimulatorAllowed: false,
    publicApiContractChanged: false,
    publicUiChanged: false,
    persistenceUsed: false,
  };
}

function aiFailure(input: {
  requestId: string;
  code: ControlledProductionAiFailureCode;
  message: string;
  sourceCode?: string;
  compositionRootUsed: boolean;
}): ControlledProductionAiFailureResult {
  const publicFailure: ControlledFailure = {
    code: "internal_error",
    message: CONTROLLED_PRODUCTION_AI_PUBLIC_FAILURE_MESSAGE,
    retryable: false,
  };
  const response = runSimulationPipeline({ requestId: input.requestId } as DecisionInput);
  response.responseId = `response_failed_${input.requestId}`;
  response.requestId = input.requestId;
  response.generatedAt = "not_recorded";
  response.status = "failed";
  response.analysis = undefined;
  response.recommendation = undefined;
  response.failure = publicFailure;
  response.controlledFailures = [publicFailure];
  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    requestId: input.requestId,
    selectedPath: "controlled_failure",
    selectedContract: "SimulationResponseV2UiModel",
    runtimeSource: "production_ai",
    uiModel: mapSimulationResponseV2ToUiModel(response),
    failure: {
      code: input.code,
      message: input.message,
      retryable: false,
      ...(input.sourceCode ? { sourceCode: input.sourceCode } : {}),
    },
    fallback: { used: false },
    evidence: aiEvidence(input.compositionRootUsed, false),
  };
}

function bridgeRequest(
  request: ControlledSimulatorSwitchRequest,
  submittedAt: string,
): DecisionEnginePromptContextBridgeRequest | undefined {
  if (!request.context || !boundedOrchestrationId(request.requestId)) return undefined;
  return {
    bridgeId: request.requestId,
    submittedAt,
    locale: request.lang,
    decisionContext: request.context as DecisionContext,
    ...(request.safety ? { safety: request.safety } : {}),
  };
}

/**
 * Offline binding seam. Runtime selection remains server-controlled: the
 * execution request cannot carry environment, provider, model, key, switch,
 * transport, or reasoning controls.
 */
export function bindControlledProductionAiRuntimeSwitch(
  environment: ControlledProductionAiRuntimeEnvironment,
  transportFactory: OpenAIDecisionMaterialTransportFactory,
  clock: ControlledProductionAiRuntimeClock,
  operational: ControlledProductionAiOperationalOptions = {},
): ControlledProductionAiRuntimeSwitch {
  const now = operational.now ?? Date.now;
  const executionStorage = new AsyncLocalStorage<OperationalExecutionContext>();
  const rollbackState: ControlledProductionAiOperationalEvent["rollbackState"] =
    environment.LEVIO_REAL_AI_DEV_ENABLED === "true" ? "available" : "active";
  const occurredAt = () => {
    try {
      return clock();
    } catch {
      return "1970-01-01T00:00:00.000Z";
    }
  };
  const emit = (
    event: Omit<
      ControlledProductionAiOperationalEvent,
      "eventVersion" | "occurredAt" | "sensitiveDataIncluded"
    >,
  ) => {
    if (!operational.observer) return;
    try {
      operational.observer({
        eventVersion: CONTROLLED_PRODUCTION_AI_OPERATIONAL_EVENT_VERSION,
        occurredAt: occurredAt(),
        ...event,
        sensitiveDataIncluded: false,
      });
    } catch {
      // Operational evidence must never alter controlled runtime behaviour.
    }
  };
  const observedTransportFactory: OpenAIDecisionMaterialTransportFactory = (apiKey) => {
    const transport = transportFactory(apiKey);
    const observedTransport: DecisionMaterialTransport = {
      async countInput(
        request: DecisionMaterialProviderRequest,
        timeoutMs: number,
      ): Promise<number> {
        const startedAt = now();
        try {
          const inputTokens = await transport.countInput(request, timeoutMs);
          const context = executionStorage.getStore();
          if (context) {
            emit({
              event: "provider_operation_completed",
              requestId: context.requestId,
              runtimePath: "production_ai",
              status: "completed",
              latencyMs: Math.max(0, now() - startedAt),
              providerOperation: "input_token_count",
              usage: Number.isSafeInteger(inputTokens) && inputTokens >= 0
                ? {
                    inputTokens,
                    outputTokens: 0,
                    totalTokens: inputTokens,
                    calculatedCostUsd: calculateDecisionMaterialCost(inputTokens, 0),
                  }
                : undefined,
              fallbackState: "not_used",
              rollbackState: context.rollbackState,
            });
          }
          return inputTokens;
        } catch (error) {
          const context = executionStorage.getStore();
          if (context) {
            emit({
              event: "provider_operation_failed",
              requestId: context.requestId,
              runtimePath: "production_ai",
              status: "failed",
              latencyMs: Math.max(0, now() - startedAt),
              providerOperation: "input_token_count",
              failureCategory: normalizedTransportFailure(error),
              fallbackState: "fail_closed",
              rollbackState: context.rollbackState,
            });
          }
          throw error;
        }
      },
      async generate(
        request: DecisionMaterialProviderRequest,
        timeoutMs: number,
      ): Promise<DecisionMaterialTransportGeneration> {
        const startedAt = now();
        try {
          const generation = await transport.generate(request, timeoutMs);
          const context = executionStorage.getStore();
          if (context) {
            const failureCategory = generation.status === "refused"
              ? "provider_refused"
              : generation.status === "incomplete"
                ? "provider_incomplete"
                : undefined;
            emit({
              event: failureCategory
                ? "provider_operation_failed"
                : "provider_operation_completed",
              requestId: context.requestId,
              runtimePath: "production_ai",
              status: failureCategory ? "failed" : "completed",
              latencyMs: Math.max(0, now() - startedAt),
              providerOperation: "generation",
              ...(safeUsage(generation) ? { usage: safeUsage(generation) } : {}),
              ...(failureCategory ? { failureCategory } : {}),
              fallbackState: failureCategory ? "fail_closed" : "not_used",
              rollbackState: context.rollbackState,
            });
          }
          return generation;
        } catch (error) {
          const context = executionStorage.getStore();
          if (context) {
            emit({
              event: "provider_operation_failed",
              requestId: context.requestId,
              runtimePath: "production_ai",
              status: "failed",
              latencyMs: Math.max(0, now() - startedAt),
              providerOperation: "generation",
              failureCategory: normalizedTransportFailure(error),
              fallbackState: "fail_closed",
              rollbackState: context.rollbackState,
            });
          }
          throw error;
        }
      },
    };
    return observedTransport;
  };
  const safeEnvironment = readOpenAIEnvironmentConfiguration(environment);
  const compositionRoot: ProductionDecisionSimulationCompositionRoot =
    bindProductionDecisionSimulationCompositionRoot(
      safeEnvironment,
      observedTransportFactory,
    );

  return {
    serverOnly: true,
    async execute(value) {
      const executionStartedAt = now();
      const requestId = operationalRequestId(value);
      if (!exactRuntimeRequest(value)) {
        const invalid = runControlledSimulatorRuntimeSwitch(
          { requestId: safeRequestId(value) },
          {},
        );
        emit({
          event: "runtime_selected",
          requestId,
          runtimePath: "controlled_failure",
          status: "failed",
          latencyMs: Math.max(0, now() - executionStartedAt),
          failureCategory: "invalid_switch_request",
          fallbackState: "fail_closed",
          rollbackState,
        });
        return invalid;
      }

      const deterministic = runControlledSimulatorRuntimeSwitch(value, {});
      if (deterministic.selectedPath === "controlled_failure") {
        emit({
          event: "runtime_selected",
          requestId,
          runtimePath: "controlled_failure",
          status: "failed",
          latencyMs: Math.max(0, now() - executionStartedAt),
          failureCategory: deterministic.failure.code,
          fallbackState: "fail_closed",
          rollbackState,
        });
        return deterministic;
      }

      if (compositionRoot.binding.status === "blocked") {
        if (compositionRoot.binding.error.code === "runtime_disabled") {
          emit({
            event: "runtime_selected",
            requestId,
            runtimePath: "deterministic_mock",
            status: "selected",
            latencyMs: Math.max(0, now() - executionStartedAt),
            fallbackState: "not_used",
            rollbackState: "active",
          });
          return deterministic;
        }
        const failure = aiFailure({
          requestId: deterministic.requestId,
          code: "production_ai_configuration_invalid",
          sourceCode: compositionRoot.binding.error.code,
          message: "Production AI server configuration is unavailable.",
          compositionRootUsed: false,
        });
        emit({
          event: "runtime_selected",
          requestId,
          runtimePath: "controlled_failure",
          status: "failed",
          latencyMs: Math.max(0, now() - executionStartedAt),
          failureCategory: compositionRoot.binding.error.code,
          fallbackState: "fail_closed",
          rollbackState,
        });
        return failure;
      }

      if (!validateControlledSimulatorSwitchRequest(value)) return deterministic;
      let canonicalBridgeRequest: DecisionEnginePromptContextBridgeRequest | undefined;
      try {
        canonicalBridgeRequest = bridgeRequest(value, clock());
      } catch {
        const failure = aiFailure({
          requestId: value.requestId,
          code: "production_ai_input_invalid",
          sourceCode: "internal_input_construction_failed",
          message: "Canonical internal AI runtime input is invalid.",
          compositionRootUsed: false,
        });
        emit({
          event: "runtime_selected",
          requestId,
          runtimePath: "controlled_failure",
          status: "failed",
          latencyMs: Math.max(0, now() - executionStartedAt),
          failureCategory: "internal_input_construction_failed",
          fallbackState: "fail_closed",
          rollbackState,
        });
        return failure;
      }
      if (!canonicalBridgeRequest) {
        const sourceCode = value.context
          ? "orchestration_id_invalid"
          : "decision_context_missing";
        const failure = aiFailure({
          requestId: value.requestId,
          code: "production_ai_input_invalid",
          sourceCode,
          message: "Canonical internal AI runtime input is invalid.",
          compositionRootUsed: false,
        });
        emit({
          event: "runtime_selected",
          requestId,
          runtimePath: "controlled_failure",
          status: "failed",
          latencyMs: Math.max(0, now() - executionStartedAt),
          failureCategory: sourceCode,
          fallbackState: "fail_closed",
          rollbackState,
        });
        return failure;
      }

      emit({
        event: "runtime_selected",
        requestId,
        runtimePath: "production_ai",
        status: "selected",
        latencyMs: Math.max(0, now() - executionStartedAt),
        fallbackState: "not_used",
        rollbackState,
      });
      emit({
        event: "orchestration_started",
        requestId,
        runtimePath: "production_ai",
        status: "started",
        latencyMs: 0,
        fallbackState: "not_used",
        rollbackState,
      });
      try {
        const orchestration = await executionStorage.run(
          { requestId, rollbackState },
          () => compositionRoot.execute({
            orchestrationId: value.requestId,
            bridgeRequest: canonicalBridgeRequest,
          }),
        );
        if (orchestration.status !== "completed") {
          const sourceCode = orchestration.error.sourceCode ?? orchestration.error.code;
          const failure = aiFailure({
            requestId: value.requestId,
            code: "production_ai_execution_failed",
            sourceCode,
            message: "Production AI orchestration failed closed.",
            compositionRootUsed: true,
          });
          emit({
            event: "orchestration_failed",
            requestId,
            runtimePath: "production_ai",
            status: "failed",
            latencyMs: Math.max(0, now() - executionStartedAt),
            failureCategory: sourceCode,
            fallbackState: "fail_closed",
            rollbackState,
          });
          return failure;
        }

        const completed = {
          switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
          mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
          requestId: value.requestId,
          selectedPath: "controlled_production_ai_v2",
          selectedContract: "SimulationResponseV2Draft",
          runtimeSource: "production_ai",
          response: orchestration.response,
          fallback: { used: false },
          evidence: aiEvidence(true, true),
        } as const;
        emit({
          event: "orchestration_completed",
          requestId,
          runtimePath: "production_ai",
          status: "completed",
          latencyMs: Math.max(0, now() - executionStartedAt),
          fallbackState: "not_used",
          rollbackState,
        });
        return completed;
      } catch {
        const failure = aiFailure({
          requestId: value.requestId,
          code: "production_ai_execution_failed",
          sourceCode: "controlled_internal_error",
          message: "Production AI orchestration failed closed.",
          compositionRootUsed: true,
        });
        emit({
          event: "orchestration_failed",
          requestId,
          runtimePath: "production_ai",
          status: "failed",
          latencyMs: Math.max(0, now() - executionStartedAt),
          failureCategory: "controlled_internal_error",
          fallbackState: "fail_closed",
          rollbackState,
        });
        return failure;
      }
    },
  };
}

export function createControlledProductionAiRuntimeSwitch():
  ControlledProductionAiRuntimeSwitch {
  return bindControlledProductionAiRuntimeSwitch(
    process.env,
    createOpenAIDecisionMaterialTransport,
    () => new Date().toISOString(),
    {
      observer: writeControlledProductionAiOperationalEvent,
      now: Date.now,
    },
  );
}

/** Server-only runtime callsite. It is intentionally not connected to API/UI. */
export function runControlledProductionAiRuntimeSwitch(
  request: unknown,
): Promise<ControlledServerRuntimeSelectionResult> {
  return createControlledProductionAiRuntimeSwitch().execute(request);
}
