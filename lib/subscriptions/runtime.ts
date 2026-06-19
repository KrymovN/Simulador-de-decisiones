import {
  DEFAULT_SUBSCRIPTION_CONTRACTS_CONFIG,
  DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
  createSubscriptionContractsFoundation,
} from "./validation";
import {
  SUBSCRIPTION_RUNTIME_FOUNDATION_MODE,
  SUBSCRIPTION_RUNTIME_FOUNDATION_VERSION,
  type SubscriptionEntitlement,
  type SubscriptionRuntimeBlockedDecision,
  type SubscriptionRuntimeBlockedReason,
  type SubscriptionRuntimeConfig,
  type SubscriptionRuntimeEvaluationInput,
  type SubscriptionRuntimeEvaluationResult,
  type SubscriptionRuntimeFoundation,
  type SubscriptionRuntimeSafetyEvidence,
  type SubscriptionTier,
  type SubscriptionTierResolution,
} from "./contracts";

const TIER_RANK: Record<SubscriptionTier, number> = {
  FREE: 0,
  PREMIUM: 1,
  PROFESSIONAL: 2,
};

export const DEFAULT_SUBSCRIPTION_RUNTIME_CONFIG: SubscriptionRuntimeConfig = {
  enabled: false,
  contractsConfig: {
    ...DEFAULT_SUBSCRIPTION_CONTRACTS_CONFIG,
    enabled: true,
    tiers: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
  },
};

export function subscriptionRuntimeSafetyEvidence(): SubscriptionRuntimeSafetyEvidence {
  return {
    stage: "4.4B",
    subscriptionOnly: true,
    runtimeFoundationOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    contractsFoundationUsed: true,
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
    stage44CStarted: false,
    stage5Started: false,
    rollback: "disable_subscription_runtime_or_remove_runtime_exports",
  };
}

function blocked(input: {
  requestedCapability: SubscriptionRuntimeEvaluationInput["requestedCapability"];
  reason: SubscriptionRuntimeBlockedReason;
  message: string;
  tierResolution?: SubscriptionTierResolution;
  contractsResult?: SubscriptionRuntimeBlockedDecision["contractsResult"];
}): SubscriptionRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: SUBSCRIPTION_RUNTIME_FOUNDATION_VERSION,
    requestedCapability: input.requestedCapability,
    reason: input.reason,
    message: input.message,
    tierResolution: input.tierResolution,
    contractsResult: input.contractsResult,
    evidence: subscriptionRuntimeSafetyEvidence(),
  };
}

function timestampScore(value: string): number {
  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function compareEntitlements(
  left: SubscriptionEntitlement,
  right: SubscriptionEntitlement,
): number {
  const tierDiff = TIER_RANK[right.tier] - TIER_RANK[left.tier];

  if (tierDiff !== 0) {
    return tierDiff;
  }

  const dateDiff =
    timestampScore(right.effectiveAt) - timestampScore(left.effectiveAt);

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return left.entitlementId.localeCompare(right.entitlementId);
}

function resolveTrustedEntitlement(
  input: SubscriptionRuntimeEvaluationInput,
): SubscriptionEntitlement | undefined {
  return [...input.entitlements].sort(compareEntitlements)[0];
}

function resolveTier(
  entitlement: SubscriptionEntitlement,
): SubscriptionTierResolution {
  return {
    status: "resolved",
    tier: entitlement.tier,
    entitlementId: entitlement.entitlementId,
    source: "highest_trusted_entitlement",
  };
}

function hasOwnerMismatch(input: SubscriptionRuntimeEvaluationInput): boolean {
  return input.entitlements.some(
    (entitlement) =>
      entitlement.ownerPrincipalId !== input.trustedOwnerPrincipalId,
  );
}

export function evaluateSubscriptionRuntimeAccess(
  config: SubscriptionRuntimeConfig,
  input: SubscriptionRuntimeEvaluationInput,
): SubscriptionRuntimeEvaluationResult {
  if (!config.enabled) {
    return blocked({
      requestedCapability: input.requestedCapability,
      reason: "subscription_runtime_disabled",
      message: "Subscription runtime foundation is disabled by default.",
    });
  }

  if (!input.trustedOwnerPrincipalId) {
    return blocked({
      requestedCapability: input.requestedCapability,
      reason: "trusted_owner_missing",
      message:
        "Subscription runtime requires a trusted owner principal id from a caller-controlled boundary.",
    });
  }

  if (input.entitlements.length === 0) {
    return blocked({
      requestedCapability: input.requestedCapability,
      reason: "entitlement_missing",
      message: "No trusted subscription entitlement snapshots were supplied.",
    });
  }

  if (hasOwnerMismatch(input)) {
    return blocked({
      requestedCapability: input.requestedCapability,
      reason: "owner_mismatch",
      message:
        "Every entitlement snapshot must belong to the trusted owner principal.",
    });
  }

  const entitlement = resolveTrustedEntitlement(input);

  if (!entitlement) {
    return blocked({
      requestedCapability: input.requestedCapability,
      reason: "entitlement_resolution_failed",
      message: "Unable to resolve a trusted subscription entitlement.",
    });
  }

  const tierResolution = resolveTier(entitlement);
  const contractsResult = createSubscriptionContractsFoundation(
    config.contractsConfig,
  ).evaluateCapability({
    entitlement,
    requestedCapability: input.requestedCapability,
    usage: input.usage,
    now: input.now,
    clientTierOverride: input.clientTierOverride,
    clientOwnerFields: input.clientOwnerFields,
  });

  if (contractsResult.status === "blocked") {
    return blocked({
      requestedCapability: input.requestedCapability,
      reason: contractsResult.reason,
      message: contractsResult.message,
      tierResolution,
      contractsResult,
    });
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    version: SUBSCRIPTION_RUNTIME_FOUNDATION_VERSION,
    requestedCapability: input.requestedCapability,
    resolvedTier: contractsResult.tier,
    entitlementId: contractsResult.entitlementId,
    tierResolution,
    contractsResult,
    evidence: subscriptionRuntimeSafetyEvidence(),
  };
}

export function createSubscriptionRuntimeFoundation(
  config: SubscriptionRuntimeConfig = DEFAULT_SUBSCRIPTION_RUNTIME_CONFIG,
): SubscriptionRuntimeFoundation {
  return {
    version: SUBSCRIPTION_RUNTIME_FOUNDATION_VERSION,
    mode: SUBSCRIPTION_RUNTIME_FOUNDATION_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    evaluateAccess: (input) => evaluateSubscriptionRuntimeAccess(config, input),
  };
}
