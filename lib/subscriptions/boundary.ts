import {
  DEFAULT_SUBSCRIPTION_RUNTIME_CONFIG,
  createSubscriptionRuntimeFoundation,
} from "./runtime";
import {
  SUBSCRIPTION_RUNTIME_BOUNDARY_MODE,
  SUBSCRIPTION_RUNTIME_BOUNDARY_VERSION,
  type SubscriptionRuntimeBoundaryBlockedReason,
  type SubscriptionRuntimeBoundaryConfig,
  type SubscriptionRuntimeBoundaryEvaluationInput,
  type SubscriptionRuntimeBoundaryEvaluationResult,
  type SubscriptionRuntimeBoundaryFoundation,
  type SubscriptionRuntimeBoundaryOperation,
  type SubscriptionRuntimeBoundarySafetyEvidence,
  type SubscriptionRuntimeEvaluationResult,
} from "./contracts";

export const SUBSCRIPTION_BOUNDARY_ALLOWED_OPERATIONS: SubscriptionRuntimeBoundaryOperation[] =
  ["subscription_access_evaluation"];

export const DEFAULT_SUBSCRIPTION_RUNTIME_BOUNDARY_CONFIG: SubscriptionRuntimeBoundaryConfig =
  {
    enabled: false,
    allowedOperations: SUBSCRIPTION_BOUNDARY_ALLOWED_OPERATIONS,
    runtime: createSubscriptionRuntimeFoundation(DEFAULT_SUBSCRIPTION_RUNTIME_CONFIG),
  };

export function subscriptionRuntimeBoundarySafetyEvidence(): SubscriptionRuntimeBoundarySafetyEvidence {
  return {
    stage: "4.4C",
    subscriptionOnly: true,
    boundaryOnly: true,
    facadeOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    allowedOperationsExplicit: true,
    moduleIsolationEnforced: true,
    runtimeWritesEnabled: false,
    billingConnected: false,
    paymentsConnected: false,
    stripeConnected: false,
    dbOperationsExecuted: false,
    supabaseConnected: false,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    simulatorIntegrated: false,
    aiIntegrated: false,
    stage44DStarted: false,
    stage5Started: false,
    rollback: "disable_subscription_boundary_or_remove_boundary_exports",
  };
}

function blocked(input: {
  operation?: string;
  reason: SubscriptionRuntimeBoundaryBlockedReason;
  message: string;
  runtimeResult?: SubscriptionRuntimeEvaluationResult;
}): SubscriptionRuntimeBoundaryEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: SUBSCRIPTION_RUNTIME_BOUNDARY_VERSION,
    operation: input.operation,
    reason: input.reason,
    message: input.message,
    runtimeResult: input.runtimeResult,
    evidence: subscriptionRuntimeBoundarySafetyEvidence(),
  };
}

function isSupportedOperation(
  operation: string,
): operation is SubscriptionRuntimeBoundaryOperation {
  return operation === "subscription_access_evaluation";
}

function payloadCount(input: SubscriptionRuntimeBoundaryEvaluationInput): number {
  return [input.access, input.unexpectedPayload].filter(
    (payload) => payload != null,
  ).length;
}

function runtimeEvidenceIsIsolated(
  result: SubscriptionRuntimeEvaluationResult,
): boolean {
  const evidence = result.evidence;

  return evidence.stage === "4.4B" &&
    evidence.subscriptionOnly &&
    evidence.runtimeFoundationOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.contractsFoundationUsed &&
    evidence.runtimeWritesEnabled === false &&
    evidence.billingConnected === false &&
    evidence.paymentsConnected === false &&
    evidence.stripeConnected === false &&
    evidence.dbOperationsExecuted === false &&
    evidence.supabaseConnected === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.simulatorIntegrated === false &&
    evidence.aiIntegrated === false &&
    evidence.stage44CStarted === false &&
    evidence.stage5Started === false;
}

export function evaluateSubscriptionRuntimeBoundary(
  config: SubscriptionRuntimeBoundaryConfig,
  input: SubscriptionRuntimeBoundaryEvaluationInput,
): SubscriptionRuntimeBoundaryEvaluationResult {
  if (!config.enabled) {
    return blocked({
      operation: input.operation,
      reason: "subscription_boundary_disabled",
      message: "Subscription runtime boundary is disabled by default.",
    });
  }

  if (!input.operation) {
    return blocked({
      reason: "operation_missing",
      message: "Subscription runtime boundary requires an explicit operation.",
    });
  }

  if (!isSupportedOperation(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_supported",
      message: "Subscription runtime boundary does not support this operation.",
    });
  }

  if (!config.allowedOperations.includes(input.operation)) {
    return blocked({
      operation: input.operation,
      reason: "operation_not_allowed",
      message: "Subscription runtime boundary operation is not allowed.",
    });
  }

  if (!input.access) {
    return blocked({
      operation: input.operation,
      reason: "payload_missing",
      message: "Subscription access evaluation requires an access payload.",
    });
  }

  if (payloadCount(input) !== 1) {
    return blocked({
      operation: input.operation,
      reason: "payload_mismatch",
      message: "Subscription runtime boundary accepts exactly one payload.",
    });
  }

  const runtimeResult = config.runtime.evaluateAccess(input.access);

  if (!runtimeEvidenceIsIsolated(runtimeResult)) {
    return blocked({
      operation: input.operation,
      reason: "module_isolation_failed",
      message: "Subscription runtime result did not preserve isolation evidence.",
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
    version: SUBSCRIPTION_RUNTIME_BOUNDARY_VERSION,
    operation: input.operation,
    runtimeResult,
    evidence: subscriptionRuntimeBoundarySafetyEvidence(),
  };
}

export function createSubscriptionRuntimeBoundary(
  config: SubscriptionRuntimeBoundaryConfig = DEFAULT_SUBSCRIPTION_RUNTIME_BOUNDARY_CONFIG,
): SubscriptionRuntimeBoundaryFoundation {
  return {
    version: SUBSCRIPTION_RUNTIME_BOUNDARY_VERSION,
    mode: SUBSCRIPTION_RUNTIME_BOUNDARY_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    allowedOperations: config.allowedOperations,
    evaluate: (input) => evaluateSubscriptionRuntimeBoundary(config, input),
  };
}
