import {
  DEFAULT_AI_PROVIDER_ADAPTER_RUNTIME_CONFIG,
  createAiProviderAdapterRuntimeFoundation,
} from "./runtime";
import {
  AI_PROVIDER_ADAPTER_BOUNDARY_MODE,
  AI_PROVIDER_ADAPTER_BOUNDARY_VERSION,
  type AiProviderAdapterBoundaryBlockedReason,
  type AiProviderAdapterBoundaryConfig,
  type AiProviderAdapterBoundaryEvaluationInput,
  type AiProviderAdapterBoundaryEvaluationResult,
  type AiProviderAdapterBoundaryFoundation,
  type AiProviderAdapterBoundaryOperation,
  type AiProviderAdapterBoundarySafetyEvidence,
  type AiProviderAdapterRuntimeEvaluationResult,
} from "./contracts";

export const AI_PROVIDER_BOUNDARY_ALLOWED_OPERATIONS: AiProviderAdapterBoundaryOperation[] =
  ["ai_provider_runtime_preflight"];

export const DEFAULT_AI_PROVIDER_ADAPTER_BOUNDARY_CONFIG: AiProviderAdapterBoundaryConfig =
  {
    enabled: false,
    allowedOperations: AI_PROVIDER_BOUNDARY_ALLOWED_OPERATIONS,
    runtime: createAiProviderAdapterRuntimeFoundation(
      DEFAULT_AI_PROVIDER_ADAPTER_RUNTIME_CONFIG,
    ),
  };

export function aiProviderAdapterBoundarySafetyEvidence(): AiProviderAdapterBoundarySafetyEvidence {
  return {
    stage: "5.1C",
    aiProviderOnly: true,
    boundaryOnly: true,
    facadeOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    allowedOperationsExplicit: true,
    payloadIsolationEnforced: true,
    runtimeIsolationEnforced: true,
    modelCallExecuted: false,
    openAiSdkConnected: false,
    apiKeysRead: false,
    envVariablesRead: false,
    apiRouteIntegrated: false,
    simulatorIntegrated: false,
    decisionEngineRuntimeConnected: false,
    promptContextLayerConnected: false,
    databaseConnected: false,
    supabaseConnected: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    subscriptionsRuntimeConnected: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    stage51DStarted: false,
    stage52Started: false,
    stage53Started: false,
    rollback: "disable_ai_provider_adapter_boundary_or_remove_boundary_exports",
  };
}

function blocked(input: {
  operation?: string;
  reason: AiProviderAdapterBoundaryBlockedReason;
  message: string;
  runtimeResult?: AiProviderAdapterRuntimeEvaluationResult;
}): AiProviderAdapterBoundaryEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    operation: input.operation,
    reason: input.reason,
    message: input.message,
    runtimeResult: input.runtimeResult,
    evidence: aiProviderAdapterBoundarySafetyEvidence(),
  };
}

function isSupportedOperation(
  operation: string,
): operation is AiProviderAdapterBoundaryOperation {
  return operation === "ai_provider_runtime_preflight";
}

function payloadCount(input: AiProviderAdapterBoundaryEvaluationInput): number {
  return [input.runtime, input.unexpectedPayload].filter(
    (payload) => payload != null,
  ).length;
}

function runtimeEvidenceIsIsolated(
  result: AiProviderAdapterRuntimeEvaluationResult,
): boolean {
  const evidence = result.evidence;

  return evidence.stage === "5.1B" &&
    evidence.aiProviderOnly &&
    evidence.runtimeFoundationOnly &&
    evidence.contractsFoundationUsed &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.apiKeysRead === false &&
    evidence.envVariablesRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.promptContextLayerConnected === false &&
    evidence.databaseConnected === false &&
    evidence.supabaseConnected === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.subscriptionsRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.stage51CStarted === false &&
    evidence.stage52Started === false &&
    evidence.stage53Started === false;
}

export function evaluateAiProviderAdapterBoundary(
  config: AiProviderAdapterBoundaryConfig,
  input: AiProviderAdapterBoundaryEvaluationInput,
): AiProviderAdapterBoundaryEvaluationResult {
  if (!config.enabled) {
    return blocked({
      operation: input.operation,
      reason: "ai_provider_boundary_disabled",
      message: "AI provider adapter boundary is disabled by default.",
    });
  }

  if (!input.operation) {
    return blocked({
      reason: "operation_missing",
      message: "AI provider adapter boundary requires an explicit operation.",
    });
  }

  if (!isSupportedOperation(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_supported",
      message: "AI provider adapter boundary does not support this operation.",
    });
  }

  if (!config.allowedOperations.includes(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_allowed",
      message: "AI provider adapter boundary operation is not allowed.",
    });
  }

  if (!input.runtime) {
    return blocked({
      operation: input.operation,
      reason: "payload_missing",
      message: "AI provider runtime preflight requires a runtime payload.",
    });
  }

  if (payloadCount(input) !== 1) {
    return blocked({
      operation: input.operation,
      reason: "payload_mismatch",
      message: "AI provider adapter boundary accepts exactly one payload.",
    });
  }

  const runtimeResult = config.runtime.evaluate(input.runtime);

  if (!runtimeEvidenceIsIsolated(runtimeResult)) {
    return blocked({
      operation: input.operation,
      reason: "runtime_isolation_failed",
      message: "AI provider runtime result did not preserve isolation evidence.",
      runtimeResult,
    });
  }

  if (runtimeResult.status === "blocked") {
    return blocked({
      operation: input.operation,
      reason: runtimeResult.reason,
      message: runtimeResult.message,
      runtimeResult,
    });
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    version: AI_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    operation: input.operation,
    runtimeResult,
    evidence: aiProviderAdapterBoundarySafetyEvidence(),
  };
}

export function createAiProviderAdapterBoundary(
  config: AiProviderAdapterBoundaryConfig = DEFAULT_AI_PROVIDER_ADAPTER_BOUNDARY_CONFIG,
): AiProviderAdapterBoundaryFoundation {
  return {
    version: AI_PROVIDER_ADAPTER_BOUNDARY_VERSION,
    mode: AI_PROVIDER_ADAPTER_BOUNDARY_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    allowedOperations: config.allowedOperations,
    evaluate: (input) => evaluateAiProviderAdapterBoundary(config, input),
  };
}
