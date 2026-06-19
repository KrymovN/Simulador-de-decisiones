import {
  DEFAULT_PREMIUM_USAGE_LIMITS,
  DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
} from "./validation";
import { createSubscriptionRuntimeFoundation } from "./runtime";
import { createSubscriptionRuntimeBoundary } from "./boundary";
import type {
  SubscriptionEntitlement,
  SubscriptionRuntimeBoundaryBlockedReason,
  SubscriptionRuntimeBoundaryEvaluationResult,
  SubscriptionRuntimeBoundaryValidationCaseResult,
  SubscriptionRuntimeBoundaryValidationResult,
  SubscriptionRuntimeEvaluationInput,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => SubscriptionRuntimeBoundaryEvaluationResult;
  assertions: ((
    result: SubscriptionRuntimeBoundaryEvaluationResult,
  ) => string | undefined)[];
};

const ownerPrincipalId = "stage_4_4c_subscription_owner";
const now = "2026-06-19T12:00:00.000Z";

function runtimeEnabled() {
  return createSubscriptionRuntimeFoundation({
    enabled: true,
    contractsConfig: {
      enabled: true,
      tiers: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
      allowedStatuses: ["active", "trialing"],
    },
  });
}

function boundaryEnabled() {
  return createSubscriptionRuntimeBoundary({
    enabled: true,
    allowedOperations: ["subscription_access_evaluation"],
    runtime: runtimeEnabled(),
  });
}

function entitlement(
  overrides: Partial<SubscriptionEntitlement> = {},
): SubscriptionEntitlement {
  return {
    entitlementId: "stage_4_4c_premium_entitlement",
    ownerPrincipalId,
    tier: "PREMIUM",
    status: "active",
    capabilities: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS[1].capabilities,
    usageLimits: DEFAULT_PREMIUM_USAGE_LIMITS,
    source: "trusted_runtime_snapshot",
    effectiveAt: "2026-06-19T00:00:00.000Z",
    expiresAt: "2026-12-19T00:00:00.000Z",
    ...overrides,
  };
}

function access(
  overrides: Partial<SubscriptionRuntimeEvaluationInput> = {},
): SubscriptionRuntimeEvaluationInput {
  return {
    trustedOwnerPrincipalId: ownerPrincipalId,
    entitlements: [entitlement()],
    requestedCapability: "decision_simulation_extended",
    usage: [
      {
        metric: "decision_simulations_per_month",
        used: 12,
        period: "monthly",
      },
    ],
    now,
    ...overrides,
  };
}

function expectBlocked(reason: SubscriptionRuntimeBoundaryBlockedReason) {
  return (
    result: SubscriptionRuntimeBoundaryEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked boundary result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: SubscriptionRuntimeBoundaryEvaluationResult,
): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only boundary result.";
}

function expectRuntimeResult(
  result: SubscriptionRuntimeBoundaryEvaluationResult,
): string | undefined {
  return result.runtimeResult &&
    result.runtimeResult.evidence.stage === "4.4B" &&
    result.runtimeResult.evidence.runtimeWritesEnabled === false &&
    result.runtimeResult.evidence.billingConnected === false &&
    result.runtimeResult.evidence.paymentsConnected === false &&
    result.runtimeResult.evidence.stripeConnected === false &&
    result.runtimeResult.evidence.dbOperationsExecuted === false &&
    result.runtimeResult.evidence.supabaseConnected === false &&
    result.runtimeResult.evidence.apiRouteIntegrated === false &&
    result.runtimeResult.evidence.uiIntegrated === false &&
    result.runtimeResult.evidence.dashboardIntegrated === false &&
    result.runtimeResult.evidence.authRuntimeConnected === false &&
    result.runtimeResult.evidence.persistenceRuntimeConnected === false &&
    result.runtimeResult.evidence.simulatorIntegrated === false &&
    result.runtimeResult.evidence.aiIntegrated === false
    ? undefined
    : "Expected isolated Stage 4.4B runtime result.";
}

function expectIsolation(
  result: SubscriptionRuntimeBoundaryEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "4.4C" &&
    evidence.subscriptionOnly &&
    evidence.boundaryOnly &&
    evidence.facadeOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.allowedOperationsExplicit &&
    evidence.moduleIsolationEnforced &&
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
    evidence.stage44DStarted === false &&
    evidence.stage5Started === false
    ? undefined
    : "Subscription boundary isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_boundary_blocks",
      title: "Disabled boundary blocks",
      expectedBehavior: "Boundary fails closed by default.",
      run: () =>
        createSubscriptionRuntimeBoundary().evaluate({
          operation: "subscription_access_evaluation",
          access: access(),
        }),
      assertions: [
        expectBlocked("subscription_boundary_disabled"),
        expectIsolation,
      ],
    },
    {
      id: "missing_operation_blocks",
      title: "Missing operation blocks",
      expectedBehavior: "Boundary requires an explicit operation.",
      run: () =>
        boundaryEnabled().evaluate({
          access: access(),
        }),
      assertions: [expectBlocked("operation_missing"), expectIsolation],
    },
    {
      id: "unsupported_operation_blocks",
      title: "Unsupported operation blocks",
      expectedBehavior: "Boundary rejects unknown operation names.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "billing_checkout",
          access: access(),
        }),
      assertions: [expectBlocked("operation_not_supported"), expectIsolation],
    },
    {
      id: "disallowed_operation_blocks",
      title: "Disallowed operation blocks",
      expectedBehavior: "Boundary rejects supported operations not present in config.",
      run: () =>
        createSubscriptionRuntimeBoundary({
          enabled: true,
          allowedOperations: [],
          runtime: runtimeEnabled(),
        }).evaluate({
          operation: "subscription_access_evaluation",
          access: access(),
        }),
      assertions: [expectBlocked("operation_not_allowed"), expectIsolation],
    },
    {
      id: "missing_payload_blocks",
      title: "Missing payload blocks",
      expectedBehavior: "Boundary requires a subscription access payload.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "subscription_access_evaluation",
        }),
      assertions: [expectBlocked("payload_missing"), expectIsolation],
    },
    {
      id: "payload_mismatch_blocks",
      title: "Payload mismatch blocks",
      expectedBehavior: "Boundary accepts exactly one payload for the operation.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "subscription_access_evaluation",
          access: access(),
          unexpectedPayload: {
            billingSessionId: "forbidden",
          },
        }),
      assertions: [expectBlocked("payload_mismatch"), expectIsolation],
    },
    {
      id: "runtime_block_propagates",
      title: "Runtime blocked result propagates",
      expectedBehavior:
        "Boundary preserves fail-closed runtime denial and does not override it.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "subscription_access_evaluation",
          access: access({
            entitlements: [
              entitlement({
                ownerPrincipalId: "another_principal",
              }),
            ],
          }),
        }),
      assertions: [
        expectBlocked("owner_mismatch"),
        expectRuntimeResult,
        expectIsolation,
      ],
    },
    {
      id: "allowed_runtime_result_passes",
      title: "Allowed runtime result passes",
      expectedBehavior:
        "Boundary returns allowed preflight result when runtime allows access.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "subscription_access_evaluation",
          access: access(),
        }),
      assertions: [expectAllowed, expectRuntimeResult, expectIsolation],
    },
  ];
}

function runCase(
  input: ValidationCase,
): SubscriptionRuntimeBoundaryValidationCaseResult {
  const result = input.run();
  const issues = input.assertions
    .map((assertion) => assertion(result))
    .filter((issue): issue is string => Boolean(issue));

  return {
    caseId: input.id,
    title: input.title,
    expectedBehavior: input.expectedBehavior,
    actualStatus: result.status,
    passed: issues.length === 0,
    failed: issues.length > 0,
    issues,
  };
}

export function runSubscriptionRuntimeBoundaryValidation(): SubscriptionRuntimeBoundaryValidationResult {
  const results = cases().map(runCase);
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}
