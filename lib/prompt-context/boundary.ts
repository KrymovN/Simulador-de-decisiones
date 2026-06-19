import {
  DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG,
  createPromptContextRuntimeFoundation,
} from "./runtime";
import {
  PROMPT_CONTEXT_BOUNDARY_MODE,
  PROMPT_CONTEXT_BOUNDARY_VERSION,
  type PromptContextBoundaryBlockedReason,
  type PromptContextBoundaryConfig,
  type PromptContextBoundaryEvaluationInput,
  type PromptContextBoundaryEvaluationResult,
  type PromptContextBoundaryFoundation,
  type PromptContextBoundaryOperation,
  type PromptContextBoundarySafetyEvidence,
  type PromptContextRuntimeEvaluationResult,
} from "./contracts";

export const PROMPT_CONTEXT_BOUNDARY_ALLOWED_OPERATIONS: PromptContextBoundaryOperation[] =
  ["prompt_context_runtime_preflight"];

export const DEFAULT_PROMPT_CONTEXT_BOUNDARY_CONFIG: PromptContextBoundaryConfig =
  {
    enabled: false,
    allowedOperations: PROMPT_CONTEXT_BOUNDARY_ALLOWED_OPERATIONS,
    runtime: createPromptContextRuntimeFoundation(
      DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG,
    ),
  };

export function promptContextBoundarySafetyEvidence(): PromptContextBoundarySafetyEvidence {
  return {
    stage: "5.2C",
    promptContextOnly: true,
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
    aiProviderRuntimeConnected: false,
    databaseConnected: false,
    supabaseConnected: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    subscriptionsRuntimeConnected: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    stage52DStarted: false,
    stage53Started: false,
    rollback: "disable_prompt_context_boundary_or_remove_boundary_exports",
  };
}

function blocked(input: {
  operation?: string;
  reason: PromptContextBoundaryBlockedReason;
  message: string;
  runtimeResult?: PromptContextRuntimeEvaluationResult;
}): PromptContextBoundaryEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    operation: input.operation,
    reason: input.reason,
    message: input.message,
    runtimeResult: input.runtimeResult,
    evidence: promptContextBoundarySafetyEvidence(),
  };
}

function isSupportedOperation(
  operation: string,
): operation is PromptContextBoundaryOperation {
  return operation === "prompt_context_runtime_preflight";
}

function payloadCount(input: PromptContextBoundaryEvaluationInput): number {
  return [input.runtime, input.unexpectedPayload].filter(
    (payload) => payload != null,
  ).length;
}

function runtimeEvidenceIsIsolated(
  result: PromptContextRuntimeEvaluationResult,
): boolean {
  const evidence = result.evidence;

  return evidence.stage === "5.2B" &&
    evidence.promptContextOnly &&
    evidence.runtimeFoundationOnly &&
    evidence.contractsFoundationUsed &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.contextPacketAssemblyPreflightOnly &&
    evidence.forbiddenPromptPatternsChecked &&
    evidence.contextBudgetEvaluated &&
    evidence.contextSafetyGuardEvaluated &&
    evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.apiKeysRead === false &&
    evidence.envVariablesRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.aiProviderRuntimeConnected === false &&
    evidence.databaseConnected === false &&
    evidence.supabaseConnected === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.subscriptionsRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.stage52CStarted === false &&
    evidence.stage53Started === false;
}

export function evaluatePromptContextBoundary(
  config: PromptContextBoundaryConfig,
  input: PromptContextBoundaryEvaluationInput,
): PromptContextBoundaryEvaluationResult {
  if (!config.enabled) {
    return blocked({
      operation: input.operation,
      reason: "prompt_context_boundary_disabled",
      message: "Prompt/context runtime boundary is disabled by default.",
    });
  }

  if (!input.operation) {
    return blocked({
      reason: "operation_missing",
      message: "Prompt/context runtime boundary requires an explicit operation.",
    });
  }

  if (!isSupportedOperation(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_supported",
      message: "Prompt/context runtime boundary does not support this operation.",
    });
  }

  if (!config.allowedOperations.includes(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_allowed",
      message: "Prompt/context runtime boundary operation is not allowed.",
    });
  }

  if (!input.runtime) {
    return blocked({
      operation: input.operation,
      reason: "payload_missing",
      message: "Prompt/context runtime preflight requires a runtime payload.",
    });
  }

  if (payloadCount(input) !== 1) {
    return blocked({
      operation: input.operation,
      reason: "payload_mismatch",
      message: "Prompt/context runtime boundary accepts exactly one payload.",
    });
  }

  const runtimeResult = config.runtime.evaluate(input.runtime);

  if (!runtimeEvidenceIsIsolated(runtimeResult)) {
    return blocked({
      operation: input.operation,
      reason: "runtime_isolation_failed",
      message:
        "Prompt/context runtime result did not preserve isolation evidence.",
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
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    operation: input.operation,
    runtimeResult,
    evidence: promptContextBoundarySafetyEvidence(),
  };
}

export function createPromptContextBoundary(
  config: PromptContextBoundaryConfig = DEFAULT_PROMPT_CONTEXT_BOUNDARY_CONFIG,
): PromptContextBoundaryFoundation {
  return {
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    mode: PROMPT_CONTEXT_BOUNDARY_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    allowedOperations: config.allowedOperations,
    evaluate: (input) => evaluatePromptContextBoundary(config, input),
  };
}
