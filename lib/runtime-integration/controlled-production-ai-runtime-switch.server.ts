import "server-only";

import type { DecisionEnginePromptContextBridgeRequest } from "../ai-integration/contracts";
import {
  bindProductionDecisionSimulationCompositionRoot,
  type OpenAIDecisionMaterialTransportFactory,
  type ProductionDecisionSimulationCompositionRoot,
} from "../ai-integration/production-decision-simulation-composition-root.server";
import {
  createOpenAIDecisionMaterialTransport,
  readOpenAIEnvironmentConfiguration,
} from "../ai-provider/openai-synthetic-risk-adapter.server";
import type { DecisionContext } from "../decision-engine/types";
import {
  CONTROLLED_SIMULATOR_SWITCH_MODE,
  CONTROLLED_SIMULATOR_SWITCH_VERSION,
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
  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    requestId: input.requestId,
    selectedPath: "controlled_failure",
    selectedContract: "none",
    runtimeSource: "production_ai",
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
): ControlledProductionAiRuntimeSwitch {
  const safeEnvironment = readOpenAIEnvironmentConfiguration(environment);
  const compositionRoot: ProductionDecisionSimulationCompositionRoot =
    bindProductionDecisionSimulationCompositionRoot(
      safeEnvironment,
      transportFactory,
    );

  return {
    serverOnly: true,
    async execute(value) {
      if (!exactRuntimeRequest(value)) {
        return runControlledSimulatorRuntimeSwitch(
          { requestId: safeRequestId(value) },
          {},
        );
      }

      const deterministic = runControlledSimulatorRuntimeSwitch(value, {});
      if (deterministic.selectedPath === "controlled_failure") return deterministic;

      if (compositionRoot.binding.status === "blocked") {
        if (compositionRoot.binding.error.code === "runtime_disabled") {
          return deterministic;
        }
        return aiFailure({
          requestId: deterministic.requestId,
          code: "production_ai_configuration_invalid",
          sourceCode: compositionRoot.binding.error.code,
          message: "Production AI server configuration is unavailable.",
          compositionRootUsed: false,
        });
      }

      if (!validateControlledSimulatorSwitchRequest(value)) return deterministic;
      let canonicalBridgeRequest: DecisionEnginePromptContextBridgeRequest | undefined;
      try {
        canonicalBridgeRequest = bridgeRequest(value, clock());
      } catch {
        return aiFailure({
          requestId: value.requestId,
          code: "production_ai_input_invalid",
          sourceCode: "internal_input_construction_failed",
          message: "Canonical internal AI runtime input is invalid.",
          compositionRootUsed: false,
        });
      }
      if (!canonicalBridgeRequest) {
        return aiFailure({
          requestId: value.requestId,
          code: "production_ai_input_invalid",
          sourceCode: value.context ? "orchestration_id_invalid" : "decision_context_missing",
          message: "Canonical internal AI runtime input is invalid.",
          compositionRootUsed: false,
        });
      }

      try {
        const orchestration = await compositionRoot.execute({
          orchestrationId: value.requestId,
          bridgeRequest: canonicalBridgeRequest,
        });
        if (orchestration.status !== "completed") {
          return aiFailure({
            requestId: value.requestId,
            code: "production_ai_execution_failed",
            sourceCode: orchestration.error.sourceCode ?? orchestration.error.code,
            message: "Production AI orchestration failed closed.",
            compositionRootUsed: true,
          });
        }

        return {
          switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
          mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
          requestId: value.requestId,
          selectedPath: "controlled_production_ai_v2",
          selectedContract: "SimulationResponseV2Draft",
          runtimeSource: "production_ai",
          response: orchestration.response,
          fallback: { used: false },
          evidence: aiEvidence(true, true),
        };
      } catch {
        return aiFailure({
          requestId: value.requestId,
          code: "production_ai_execution_failed",
          sourceCode: "controlled_internal_error",
          message: "Production AI orchestration failed closed.",
          compositionRootUsed: true,
        });
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
  );
}

/** Server-only runtime callsite. It is intentionally not connected to API/UI. */
export function runControlledProductionAiRuntimeSwitch(
  request: unknown,
): Promise<ControlledServerRuntimeSelectionResult> {
  return createControlledProductionAiRuntimeSwitch().execute(request);
}
