import {
  INTERNAL_RUNTIME_ADAPTER_VERSION,
  type InternalRuntimeAdapterRequest,
  type InternalRuntimeAdapterResult,
} from "./internal-runtime-adapter-contracts";
import { runInternalRuntimeAdapter } from "./internal-runtime-adapter";
import {
  SIMULATOR_SANDBOX_RUNTIME_MODE,
  SIMULATOR_SANDBOX_VERSION,
  type SimulatorSandboxFeatureFlags,
  type SimulatorSandboxRequest,
  type SimulatorSandboxResult,
  type SimulatorSandboxRuntimeMode,
} from "./simulator-integration-sandbox-contracts";

const DECISION_INTENTS = ["explore", "compare", "recommend", "review"] as const;

const SANDBOX_ISOLATION_EVIDENCE: SimulatorSandboxResult["operational"] = {
  publicRuntimeTouched: false,
  publicApiTouched: false,
  persistenceUsed: false,
  externalProviderUsed: false,
  memoryUsed: false,
  authUsed: false,
  subscriptionUsed: false,
  rawContentLogged: false,
  sandboxOnly: true,
  publicRouteExposed: false,
  publicNavigationExposed: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeRequestId(value: unknown): string {
  return isRecord(value) && isNonEmptyString(value.requestId)
    ? value.requestId
    : "invalid_simulator_sandbox_request";
}

function sandboxResult(
  requestId: string,
  enabled: boolean,
  status: SimulatorSandboxResult["status"],
  errors: string[],
  adapter?: InternalRuntimeAdapterResult,
): SimulatorSandboxResult {
  return {
    sandboxVersion: SIMULATOR_SANDBOX_VERSION,
    mode: SIMULATOR_SANDBOX_RUNTIME_MODE,
    requestId,
    enabled,
    status,
    response: adapter?.response,
    adapter,
    sandboxValidation: {
      valid: errors.length === 0,
      errors,
    },
    operational: { ...SANDBOX_ISOLATION_EVIDENCE },
  };
}

export function validateSimulatorSandboxMode(
  value: unknown,
): value is SimulatorSandboxRuntimeMode {
  return value === SIMULATOR_SANDBOX_RUNTIME_MODE;
}

export function validateSimulatorSandboxFeatureFlags(
  value: unknown,
): value is SimulatorSandboxFeatureFlags {
  return isRecord(value) && value.simulatorSandboxV2 === true;
}

export function validateSimulatorSandboxRequestShape(
  value: unknown,
): value is SimulatorSandboxRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.sandboxVersion === SIMULATOR_SANDBOX_VERSION &&
    validateSimulatorSandboxMode(value.mode) &&
    isNonEmptyString(value.requestId) &&
    typeof value.input === "string" &&
    isNonEmptyString(value.lang) &&
    (value.requestedOutputLanguage === undefined ||
      isNonEmptyString(value.requestedOutputLanguage)) &&
    (value.userIntent === undefined ||
      (typeof value.userIntent === "string" &&
        DECISION_INTENTS.includes(value.userIntent as (typeof DECISION_INTENTS)[number]))) &&
    (value.context === undefined || isRecord(value.context)) &&
    (value.safety === undefined || isRecord(value.safety)) &&
    (value.safetyContextComplete === undefined ||
      typeof value.safetyContextComplete === "boolean")
  );
}

export function buildSandboxAdapterRequest(
  request: SimulatorSandboxRequest,
): InternalRuntimeAdapterRequest {
  return {
    adapterVersion: INTERNAL_RUNTIME_ADAPTER_VERSION,
    requestId: request.requestId,
    originalText: request.input,
    inputLanguage: request.lang,
    requestedOutputLanguage: request.requestedOutputLanguage ?? request.lang,
    userIntent: request.userIntent ?? "recommend",
    context: request.context,
    safety: request.safety,
    safetyContextComplete: request.safetyContextComplete,
  };
}

/**
 * Executes the deterministic brain through the controlled adapter only when
 * the internal simulator sandbox feature flag is explicitly enabled.
 */
export function runSimulatorIntegrationSandbox(
  request: unknown,
  featureFlags: unknown,
): SimulatorSandboxResult {
  const requestId = safeRequestId(request);
  const errors: string[] = [];

  if (!validateSimulatorSandboxFeatureFlags(featureFlags)) {
    errors.push("Simulator V2 sandbox feature flag is disabled.");
  }

  if (!validateSimulatorSandboxRequestShape(request)) {
    errors.push("Simulator sandbox request shape validation failed.");
  }

  if (errors.length > 0) {
    return sandboxResult(
      requestId,
      false,
      validateSimulatorSandboxFeatureFlags(featureFlags) ? "rejected" : "disabled",
      errors,
    );
  }

  const adapter = runInternalRuntimeAdapter(
    buildSandboxAdapterRequest(request as SimulatorSandboxRequest),
  );

  return sandboxResult(requestId, true, adapter.status, [], adapter);
}

export function simulatorSandboxIsolationEvidence(): SimulatorSandboxResult["operational"] {
  return { ...SANDBOX_ISOLATION_EVIDENCE };
}
