import { mapSimulationResponseV2ToUiModel } from "../decision-engine/simulation-response-v2-ui-mapping";
import {
  SIMULATOR_SANDBOX_RUNTIME_MODE,
  SIMULATOR_SANDBOX_VERSION,
  type SimulatorSandboxRequest,
  type SimulatorSandboxResult,
} from "../decision-engine/simulator-integration-sandbox-contracts";
import { runSimulatorIntegrationSandbox } from "../decision-engine/simulator-integration-sandbox";
import { buildMockSimulation } from "../simulationEngine";
import {
  CONTROLLED_SIMULATOR_SWITCH_MODE,
  CONTROLLED_SIMULATOR_SWITCH_VERSION,
  type ControlledSimulatorFallbackReason,
  type ControlledSimulatorFailureCode,
  type ControlledSimulatorSwitchEvidence,
  type ControlledSimulatorSwitchFeatureFlags,
  type ControlledSimulatorSwitchRequest,
  type ControlledSimulatorSwitchResult,
} from "./controlled-simulator-runtime-switch-contracts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeRequestId(value: unknown): string {
  return isRecord(value) && isNonEmptyString(value.requestId)
    ? value.requestId
    : "invalid_controlled_switch_request";
}

function safeInput(value: unknown): string | undefined {
  return isRecord(value) && isNonEmptyString(value.input)
    ? value.input.trim()
    : undefined;
}

function evidence(
  sandboxUsedForV2: boolean,
  uiMappingUsedForV2: boolean,
): ControlledSimulatorSwitchEvidence {
  return {
    denyByDefault: true,
    explicitInternalDevGateRequired: true,
    publicUserEligible: false,
    publicApiContractChanged: false,
    publicUiChanged: false,
    v1V2EnvelopeMixed: false,
    sandboxUsedForV2,
    uiMappingUsedForV2,
    persistenceUsed: false,
    externalProviderUsed: false,
    memoryUsed: false,
    authUsed: false,
    subscriptionUsed: false,
  };
}

export function validateControlledSimulatorSwitchRequest(
  value: unknown,
): value is ControlledSimulatorSwitchRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.switchVersion === CONTROLLED_SIMULATOR_SWITCH_VERSION &&
    value.mode === CONTROLLED_SIMULATOR_SWITCH_MODE &&
    value.executionContext === "internal_dev" &&
    isNonEmptyString(value.requestId) &&
    isNonEmptyString(value.input) &&
    value.lang === "es" &&
    (value.requestedOutputLanguage === undefined ||
      isNonEmptyString(value.requestedOutputLanguage)) &&
    (value.userIntent === undefined ||
      value.userIntent === "explore" ||
      value.userIntent === "compare" ||
      value.userIntent === "recommend" ||
      value.userIntent === "review") &&
    (value.context === undefined || isRecord(value.context)) &&
    (value.safety === undefined || isRecord(value.safety)) &&
    (value.safetyContextComplete === undefined ||
      typeof value.safetyContextComplete === "boolean")
  );
}

export function controlledSimulatorSwitchEnabled(
  flags: unknown,
): flags is ControlledSimulatorSwitchFeatureFlags {
  return (
    isRecord(flags) &&
    flags.controlledInternalDevV2 === true &&
    flags.simulatorSandboxV2 === true
  );
}

function fallbackEnabled(flags: unknown): boolean {
  return isRecord(flags) && flags.fallbackToPublicMockV1 !== false;
}

function v1Result(
  requestId: string,
  input: string,
  reason: ControlledSimulatorFallbackReason,
  used: boolean,
  sourceStatus?: SimulatorSandboxResult["status"],
  sandboxUsed = false,
): ControlledSimulatorSwitchResult {
  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    requestId,
    selectedPath: "public_mock_v1",
    selectedContract: "SimulationResponse",
    response: buildMockSimulation(input),
    fallback: {
      used,
      reason,
      sourceStatus,
    },
    evidence: evidence(sandboxUsed, false),
  };
}

function failureResult(
  requestId: string,
  code: ControlledSimulatorFailureCode,
  message: string,
  sourceStatus?: SimulatorSandboxResult["status"],
): ControlledSimulatorSwitchResult {
  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    requestId,
    selectedPath: "controlled_failure",
    selectedContract: "none",
    failure: {
      code,
      message,
      retryable: code !== "invalid_switch_request",
      sourceStatus,
    },
    fallback: { used: false },
    evidence: evidence(sourceStatus !== undefined, false),
  };
}

function buildSandboxRequest(
  request: ControlledSimulatorSwitchRequest,
): SimulatorSandboxRequest {
  return {
    sandboxVersion: SIMULATOR_SANDBOX_VERSION,
    mode: SIMULATOR_SANDBOX_RUNTIME_MODE,
    requestId: request.requestId,
    input: request.input,
    lang: request.lang,
    requestedOutputLanguage: request.requestedOutputLanguage ?? request.lang,
    userIntent: request.userIntent ?? "recommend",
    context: request.context,
    safety: request.safety,
    safetyContextComplete: request.safetyContextComplete,
  };
}

/**
 * Selects the existing V1 mock path by default and allows V2 only for an
 * explicitly gated internal-dev request. V1 and V2 are never mixed.
 */
export function runControlledSimulatorRuntimeSwitch(
  request: unknown,
  featureFlags: unknown,
): ControlledSimulatorSwitchResult {
  const requestId = safeRequestId(request);
  const input = safeInput(request);

  if (!input || !validateControlledSimulatorSwitchRequest(request)) {
    return failureResult(
      requestId,
      "invalid_switch_request",
      "Controlled simulator switch request validation failed.",
    );
  }

  if (!controlledSimulatorSwitchEnabled(featureFlags)) {
    const reason: ControlledSimulatorFallbackReason =
      isRecord(featureFlags) && featureFlags.controlledInternalDevV2 === true
        ? "sandbox_gate_disabled"
        : "controlled_gate_disabled";
    return v1Result(requestId, input, reason, false);
  }

  let sandbox: SimulatorSandboxResult;

  try {
    sandbox = runSimulatorIntegrationSandbox(
      buildSandboxRequest(request),
      { simulatorSandboxV2: true },
    );
  } catch {
    return fallbackEnabled(featureFlags)
      ? v1Result(requestId, input, "sandbox_rejected", true, undefined, true)
      : failureResult(requestId, "sandbox_execution_failed", "Sandbox execution failed.");
  }

  if (!sandbox.enabled || !sandbox.response) {
    return fallbackEnabled(featureFlags)
      ? v1Result(requestId, input, "sandbox_rejected", true, sandbox.status, true)
      : failureResult(
          requestId,
          "sandbox_execution_failed",
          "Sandbox did not produce a V2 response.",
          sandbox.status,
        );
  }

  if (sandbox.response.status === "failed") {
    return fallbackEnabled(featureFlags)
      ? v1Result(requestId, input, "deterministic_failed", true, sandbox.status, true)
      : failureResult(
          requestId,
          "deterministic_execution_failed",
          sandbox.response.failure?.message ?? "Deterministic runtime returned controlled failure.",
          sandbox.status,
        );
  }

  const uiModel = mapSimulationResponseV2ToUiModel(sandbox.response);

  if (uiModel.renderState === "controlled_failure" || uiModel.mappingErrors.length > 0) {
    return fallbackEnabled(featureFlags)
      ? v1Result(requestId, input, "ui_mapping_failed", true, sandbox.status, true)
      : failureResult(
          requestId,
          "ui_mapping_failed",
          uiModel.mappingErrors[0] ?? "V2 UI mapping returned controlled failure.",
          sandbox.status,
        );
  }

  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    requestId,
    selectedPath: "controlled_internal_v2",
    selectedContract: "SimulationResponseV2Draft",
    response: sandbox.response,
    uiModel,
    sandbox,
    fallback: { used: false },
    evidence: evidence(true, true),
  };
}
