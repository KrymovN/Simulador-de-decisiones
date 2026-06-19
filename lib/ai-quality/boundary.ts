import {
  DEFAULT_AI_QUALITY_RUNTIME_CONFIG,
  createAiQualityRuntimeFoundation,
} from "./runtime";
import {
  AI_QUALITY_BOUNDARY_MODE,
  AI_QUALITY_BOUNDARY_VERSION,
  type AiQualityBoundaryBlockedReason,
  type AiQualityBoundaryConfig,
  type AiQualityBoundaryEvaluationInput,
  type AiQualityBoundaryEvaluationResult,
  type AiQualityBoundaryFoundation,
  type AiQualityBoundaryOperation,
  type AiQualityBoundarySafetyEvidence,
  type AiQualityRuntimeEvaluationResult,
} from "./contracts";

export const AI_QUALITY_BOUNDARY_ALLOWED_OPERATIONS: AiQualityBoundaryOperation[] = [
  "ai_quality_runtime_preflight",
];

export const DEFAULT_AI_QUALITY_BOUNDARY_CONFIG: AiQualityBoundaryConfig = {
  enabled: false,
  allowedOperations: AI_QUALITY_BOUNDARY_ALLOWED_OPERATIONS,
  runtime: createAiQualityRuntimeFoundation({
    ...DEFAULT_AI_QUALITY_RUNTIME_CONFIG,
    enabled: true,
  }),
};

export function aiQualityBoundarySafetyEvidence(): AiQualityBoundarySafetyEvidence {
  return {
    stage: "5.3C",
    aiQualityOnly: true,
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
    promptContextRuntimeConnected: false,
    databaseConnected: false,
    supabaseConnected: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    subscriptionsRuntimeConnected: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    stage53DStarted: false,
    rollback: "disable_ai_quality_boundary_or_remove_boundary_exports",
  };
}

function blocked(input: {
  operation?: AiQualityBoundaryOperation | string;
  reason: AiQualityBoundaryBlockedReason;
  message: string;
  runtimeResult?: AiQualityRuntimeEvaluationResult;
}): AiQualityBoundaryEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_QUALITY_BOUNDARY_VERSION,
    operation: input.operation,
    reason: input.reason,
    message: input.message,
    runtimeResult: input.runtimeResult,
    evidence: aiQualityBoundarySafetyEvidence(),
  };
}

function isSupportedOperation(
  operation: string,
): operation is AiQualityBoundaryOperation {
  return AI_QUALITY_BOUNDARY_ALLOWED_OPERATIONS.includes(
    operation as AiQualityBoundaryOperation,
  );
}

function payloadCount(input: AiQualityBoundaryEvaluationInput): number {
  return [input.runtime, input.unexpectedPayload].filter(
    (payload) => payload !== undefined && payload !== null,
  ).length;
}

function runtimeEvidenceIsIsolated(
  result: AiQualityRuntimeEvaluationResult,
): boolean {
  const evidence = result.evidence;

  return evidence.stage === "5.3B" &&
    evidence.aiQualityOnly &&
    evidence.runtimeFoundationOnly &&
    evidence.contractsFoundationUsed &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.qualityGateEvaluated &&
    evidence.costBudgetEvaluated &&
    evidence.safetyGateEvaluated &&
    evidence.releaseGateEvaluated &&
    evidence.severityAggregated &&
    evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.apiKeysRead === false &&
    evidence.envVariablesRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.aiProviderRuntimeConnected === false &&
    evidence.promptContextRuntimeConnected === false &&
    evidence.databaseConnected === false &&
    evidence.supabaseConnected === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.subscriptionsRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.stage53CStarted === false;
}

export function evaluateAiQualityBoundary(
  config: AiQualityBoundaryConfig,
  input: AiQualityBoundaryEvaluationInput,
): AiQualityBoundaryEvaluationResult {
  if (!config.enabled) {
    return blocked({
      operation: input.operation,
      reason: "ai_quality_boundary_disabled",
      message: "AI quality/cost/safety boundary is disabled by default.",
    });
  }

  if (!input.operation) {
    return blocked({
      reason: "operation_missing",
      message: "AI quality/cost/safety boundary requires an explicit operation.",
    });
  }

  if (!isSupportedOperation(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_supported",
      message: "AI quality/cost/safety boundary operation is not supported.",
    });
  }

  if (!config.allowedOperations.includes(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_allowed",
      message: "AI quality/cost/safety boundary operation is not allowed.",
    });
  }

  if (payloadCount(input) === 0) {
    return blocked({
      operation: input.operation,
      reason: "payload_missing",
      message: "AI quality/cost/safety boundary requires runtime payload.",
    });
  }

  if (payloadCount(input) !== 1 || input.unexpectedPayload != null) {
    return blocked({
      operation: input.operation,
      reason: "payload_mismatch",
      message:
        "AI quality/cost/safety boundary accepts only isolated runtime payload.",
    });
  }

  const runtimeResult = config.runtime.evaluate(input.runtime ?? {});

  if (!runtimeEvidenceIsIsolated(runtimeResult)) {
    return blocked({
      operation: input.operation,
      reason: "runtime_isolation_failed",
      message:
        "AI quality/cost/safety runtime result did not preserve isolation evidence.",
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
    execution: "boundary_preflight_only",
    version: AI_QUALITY_BOUNDARY_VERSION,
    operation: input.operation,
    runtimeResult,
    evidence: aiQualityBoundarySafetyEvidence(),
  };
}

export function createAiQualityBoundary(
  config: AiQualityBoundaryConfig = DEFAULT_AI_QUALITY_BOUNDARY_CONFIG,
): AiQualityBoundaryFoundation {
  return {
    version: AI_QUALITY_BOUNDARY_VERSION,
    mode: AI_QUALITY_BOUNDARY_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    allowedOperations: config.allowedOperations,
    evaluate: (input) => evaluateAiQualityBoundary(config, input),
  };
}
