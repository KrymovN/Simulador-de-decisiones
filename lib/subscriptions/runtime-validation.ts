import {
  DEFAULT_FREE_USAGE_LIMITS,
  DEFAULT_PREMIUM_USAGE_LIMITS,
  DEFAULT_PROFESSIONAL_USAGE_LIMITS,
  DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
} from "./validation";
import { createSubscriptionRuntimeFoundation } from "./runtime";
import type {
  SubscriptionCapability,
  SubscriptionEntitlement,
  SubscriptionRuntimeBlockedReason,
  SubscriptionRuntimeEvaluationResult,
  SubscriptionRuntimeValidationCaseResult,
  SubscriptionRuntimeValidationResult,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => SubscriptionRuntimeEvaluationResult;
  assertions: ((
    result: SubscriptionRuntimeEvaluationResult,
  ) => string | undefined)[];
};

const ownerPrincipalId = "stage_4_4b_subscription_owner";
const now = "2026-06-19T12:00:00.000Z";

function enabledRuntime() {
  return createSubscriptionRuntimeFoundation({
    enabled: true,
    contractsConfig: {
      enabled: true,
      tiers: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
      allowedStatuses: ["active", "trialing"],
    },
  });
}

function entitlement(
  overrides: Partial<SubscriptionEntitlement> = {},
): SubscriptionEntitlement {
  return {
    entitlementId: "stage_4_4b_premium_entitlement",
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

function request(input: {
  entitlements?: SubscriptionEntitlement[];
  capability?: SubscriptionCapability;
  trustedOwnerPrincipalId?: string;
  used?: number;
}) {
  return {
    trustedOwnerPrincipalId: input.trustedOwnerPrincipalId ?? ownerPrincipalId,
    entitlements: input.entitlements ?? [entitlement()],
    requestedCapability: input.capability ?? "decision_simulation_extended",
    usage:
      input.used == null
        ? undefined
        : [
            {
              metric: "decision_simulations_per_month" as const,
              used: input.used,
              period: "monthly" as const,
            },
          ],
    now,
  };
}

function expectBlocked(reason: SubscriptionRuntimeBlockedReason) {
  return (result: SubscriptionRuntimeEvaluationResult): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: SubscriptionRuntimeEvaluationResult,
): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only subscription runtime result.";
}

function expectResolvedTier(tier: "FREE" | "PREMIUM" | "PROFESSIONAL") {
  return (result: SubscriptionRuntimeEvaluationResult): string | undefined =>
    result.tierResolution?.tier === tier
      ? undefined
      : `Expected resolved tier ${tier}.`;
}

function expectIsolation(
  result: SubscriptionRuntimeEvaluationResult,
): string | undefined {
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
    evidence.stage5Started === false
    ? undefined
    : "Subscription runtime isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Disabled subscription runtime blocks",
      expectedBehavior: "Runtime foundation fails closed by default.",
      run: () =>
        createSubscriptionRuntimeFoundation().evaluateAccess(request({})),
      assertions: [
        expectBlocked("subscription_runtime_disabled"),
        expectIsolation,
      ],
    },
    {
      id: "trusted_owner_missing_blocks",
      title: "Missing trusted owner blocks",
      expectedBehavior: "Runtime does not infer ownership from client context.",
      run: () =>
        enabledRuntime().evaluateAccess({
          ...request({}),
          trustedOwnerPrincipalId: undefined,
        }),
      assertions: [expectBlocked("trusted_owner_missing"), expectIsolation],
    },
    {
      id: "missing_entitlements_blocks",
      title: "Missing entitlements block",
      expectedBehavior: "Runtime requires trusted entitlement snapshots.",
      run: () =>
        enabledRuntime().evaluateAccess(request({ entitlements: [] })),
      assertions: [expectBlocked("entitlement_missing"), expectIsolation],
    },
    {
      id: "owner_mismatch_blocks",
      title: "Owner mismatch blocks",
      expectedBehavior: "Runtime rejects cross-owner entitlement snapshots.",
      run: () =>
        enabledRuntime().evaluateAccess(
          request({
            entitlements: [
              entitlement({ ownerPrincipalId: "another_principal" }),
            ],
          }),
        ),
      assertions: [expectBlocked("owner_mismatch"), expectIsolation],
    },
    {
      id: "highest_tier_resolves",
      title: "Highest trusted tier resolves",
      expectedBehavior: "Runtime deterministically resolves the highest trusted tier.",
      run: () =>
        enabledRuntime().evaluateAccess(
          request({
            entitlements: [
              entitlement({
                entitlementId: "stage_4_4b_free_entitlement",
                tier: "FREE",
                capabilities: ["decision_simulation_basic"],
                usageLimits: DEFAULT_FREE_USAGE_LIMITS,
              }),
              entitlement({
                entitlementId: "stage_4_4b_professional_entitlement",
                tier: "PROFESSIONAL",
                capabilities: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS[2].capabilities,
                usageLimits: DEFAULT_PROFESSIONAL_USAGE_LIMITS,
              }),
            ],
            capability: "professional_decision_archive",
          }),
        ),
      assertions: [expectAllowed, expectResolvedTier("PROFESSIONAL"), expectIsolation],
    },
    {
      id: "free_tier_capability_blocks",
      title: "Free tier capability blocks",
      expectedBehavior: "Capability access is denied when tier does not support it.",
      run: () =>
        enabledRuntime().evaluateAccess(
          request({
            entitlements: [
              entitlement({
                tier: "FREE",
                capabilities: ["decision_simulation_basic"],
                usageLimits: DEFAULT_FREE_USAGE_LIMITS,
              }),
            ],
            capability: "decision_simulation_extended",
          }),
        ),
      assertions: [
        expectBlocked("capability_not_supported_by_tier"),
        expectResolvedTier("FREE"),
        expectIsolation,
      ],
    },
    {
      id: "usage_limit_blocks",
      title: "Usage limit blocks",
      expectedBehavior: "Usage at the selected entitlement limit fails closed.",
      run: () => enabledRuntime().evaluateAccess(request({ used: 250 })),
      assertions: [
        expectBlocked("usage_limit_exceeded"),
        expectResolvedTier("PREMIUM"),
        expectIsolation,
      ],
    },
    {
      id: "active_premium_allows_preflight",
      title: "Active premium allows preflight",
      expectedBehavior: "Eligible entitlement produces preflight-only allow result.",
      run: () => enabledRuntime().evaluateAccess(request({ used: 12 })),
      assertions: [expectAllowed, expectResolvedTier("PREMIUM"), expectIsolation],
    },
  ];
}

function runCase(input: ValidationCase): SubscriptionRuntimeValidationCaseResult {
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

export function runSubscriptionRuntimeFoundationValidation(): SubscriptionRuntimeValidationResult {
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
