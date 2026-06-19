import {
  SUBSCRIPTION_CONTRACTS_FOUNDATION_MODE,
  SUBSCRIPTION_CONTRACTS_FOUNDATION_VERSION,
  type SubscriptionCapability,
  type SubscriptionCapabilityEvaluationInput,
  type SubscriptionCapabilityEvaluationResult,
  type SubscriptionContractsBlockedReason,
  type SubscriptionContractsConfig,
  type SubscriptionContractsFoundation,
  type SubscriptionContractsSafetyEvidence,
  type SubscriptionContractsValidationCaseResult,
  type SubscriptionContractsValidationResult,
  type SubscriptionEntitlement,
  type SubscriptionStatus,
  type SubscriptionTierDefinition,
  type SubscriptionUsageLimit,
  type SubscriptionUsageMetric,
  type SubscriptionUsageSnapshot,
} from "./contracts";

export const SUBSCRIPTION_ACTIVE_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
];

export const DEFAULT_FREE_USAGE_LIMITS: SubscriptionUsageLimit[] = [
  {
    metric: "decision_simulations_per_month",
    limit: 10,
    period: "monthly",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
  {
    metric: "saved_simulations_total",
    limit: 0,
    period: "lifetime",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
];

export const DEFAULT_PREMIUM_USAGE_LIMITS: SubscriptionUsageLimit[] = [
  {
    metric: "decision_simulations_per_month",
    limit: 250,
    period: "monthly",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
  {
    metric: "saved_simulations_total",
    limit: 500,
    period: "lifetime",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
  {
    metric: "history_entries_total",
    limit: 1000,
    period: "lifetime",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
];

export const DEFAULT_PROFESSIONAL_USAGE_LIMITS: SubscriptionUsageLimit[] = [
  {
    metric: "decision_simulations_per_month",
    limit: 2000,
    period: "monthly",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
  {
    metric: "saved_simulations_total",
    limit: 5000,
    period: "lifetime",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
  {
    metric: "history_entries_total",
    limit: 10000,
    period: "lifetime",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
  {
    metric: "decision_archives_total",
    limit: 1000,
    period: "lifetime",
    enforcement: "foundation_preflight_only",
    overageBehavior: "block",
  },
];

export const DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS: SubscriptionTierDefinition[] = [
  {
    tier: "FREE",
    capabilities: ["decision_simulation_basic"],
    usageLimits: DEFAULT_FREE_USAGE_LIMITS,
  },
  {
    tier: "PREMIUM",
    capabilities: [
      "decision_simulation_basic",
      "decision_simulation_extended",
      "saved_simulation_library",
      "simulation_history",
    ],
    usageLimits: DEFAULT_PREMIUM_USAGE_LIMITS,
  },
  {
    tier: "PROFESSIONAL",
    capabilities: [
      "decision_simulation_basic",
      "decision_simulation_extended",
      "saved_simulation_library",
      "simulation_history",
      "advanced_tradeoff_modeling",
      "professional_decision_archive",
    ],
    usageLimits: DEFAULT_PROFESSIONAL_USAGE_LIMITS,
  },
];

export const DEFAULT_SUBSCRIPTION_CONTRACTS_CONFIG: SubscriptionContractsConfig = {
  enabled: false,
  tiers: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
  allowedStatuses: SUBSCRIPTION_ACTIVE_STATUSES,
};

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => SubscriptionCapabilityEvaluationResult;
  assertions: ((
    result: SubscriptionCapabilityEvaluationResult,
  ) => string | undefined)[];
};

const now = "2026-06-19T12:00:00.000Z";
const ownerPrincipalId = "stage_4_4a_subscription_principal";

export function subscriptionContractsSafetyEvidence(): SubscriptionContractsSafetyEvidence {
  return {
    stage: "4.4A",
    subscriptionOnly: true,
    contractsOnly: true,
    foundationOnly: true,
    failClosedByDefault: true,
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
    stage44BStarted: false,
    stage5Started: false,
    rollback: "disable_subscription_contracts_or_remove_subscriptions_exports",
  };
}

function blocked(
  capability: SubscriptionCapability,
  reason: SubscriptionContractsBlockedReason,
  message: string,
): SubscriptionCapabilityEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: SUBSCRIPTION_CONTRACTS_FOUNDATION_VERSION,
    capability,
    reason,
    message,
    evidence: subscriptionContractsSafetyEvidence(),
  };
}

function isTimestampValid(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }

  return Number.isFinite(Date.parse(value));
}

function hasClientOwnerFields(input: SubscriptionCapabilityEvaluationInput): boolean {
  const fields = input.clientOwnerFields;

  if (!fields) {
    return false;
  }

  return Boolean(
    fields.principalId || fields.ownerPrincipalId || fields.providerReference,
  );
}

function findTier(
  config: SubscriptionContractsConfig,
  entitlement: SubscriptionEntitlement,
): SubscriptionTierDefinition | undefined {
  return config.tiers.find((tier) => tier.tier === entitlement.tier);
}

function usageMetricForCapability(
  capability: SubscriptionCapability,
): SubscriptionUsageMetric | undefined {
  if (
    capability === "decision_simulation_basic" ||
    capability === "decision_simulation_extended" ||
    capability === "advanced_tradeoff_modeling"
  ) {
    return "decision_simulations_per_month";
  }

  if (capability === "saved_simulation_library") {
    return "saved_simulations_total";
  }

  if (capability === "simulation_history") {
    return "history_entries_total";
  }

  if (capability === "professional_decision_archive") {
    return "decision_archives_total";
  }

  return undefined;
}

function usageLimitExceeded(input: {
  capability: SubscriptionCapability;
  entitlement: SubscriptionEntitlement;
  usage: SubscriptionUsageSnapshot[];
}): SubscriptionContractsBlockedReason | undefined {
  const metric = usageMetricForCapability(input.capability);

  if (!metric) {
    return undefined;
  }

  const limit = input.entitlement.usageLimits.find(
    (candidate) => candidate.metric === metric,
  );

  if (!limit) {
    return "usage_limit_missing";
  }

  const usage = input.usage.find(
    (candidate) =>
      candidate.metric === metric && candidate.period === limit.period,
  );

  if (!usage) {
    return undefined;
  }

  return usage.used >= limit.limit ? "usage_limit_exceeded" : undefined;
}

export function evaluateSubscriptionCapability(
  config: SubscriptionContractsConfig,
  input: SubscriptionCapabilityEvaluationInput,
): SubscriptionCapabilityEvaluationResult {
  if (!config.enabled) {
    return blocked(
      input.requestedCapability,
      "subscription_contracts_disabled",
      "Subscription contracts foundation is disabled by default.",
    );
  }

  if (input.clientTierOverride) {
    return blocked(
      input.requestedCapability,
      "client_tier_override_rejected",
      "Client-supplied tier overrides are rejected.",
    );
  }

  if (hasClientOwnerFields(input)) {
    return blocked(
      input.requestedCapability,
      "client_owner_input_rejected",
      "Client-supplied owner fields are rejected.",
    );
  }

  const entitlement = input.entitlement;

  if (!entitlement) {
    return blocked(
      input.requestedCapability,
      "entitlement_missing",
      "A trusted entitlement snapshot is required.",
    );
  }

  if (
    !isTimestampValid(input.now) ||
    !isTimestampValid(entitlement.effectiveAt) ||
    !isTimestampValid(entitlement.expiresAt)
  ) {
    return blocked(
      input.requestedCapability,
      "timestamp_invalid",
      "Subscription entitlement timestamps must be valid.",
    );
  }

  const tier = findTier(config, entitlement);

  if (!tier) {
    return blocked(
      input.requestedCapability,
      "tier_not_supported",
      "Subscription tier is not supported by this foundation config.",
    );
  }

  if (!config.allowedStatuses.includes(entitlement.status)) {
    return blocked(
      input.requestedCapability,
      "status_not_allowed",
      "Subscription status is not eligible for entitlement access.",
    );
  }

  if (
    input.now &&
    entitlement.expiresAt &&
    Date.parse(entitlement.expiresAt) <= Date.parse(input.now)
  ) {
    return blocked(
      input.requestedCapability,
      "entitlement_expired",
      "Subscription entitlement has expired.",
    );
  }

  if (!tier.capabilities.includes(input.requestedCapability)) {
    return blocked(
      input.requestedCapability,
      "capability_not_supported_by_tier",
      "Requested capability is not supported by the entitlement tier.",
    );
  }

  if (!entitlement.capabilities.includes(input.requestedCapability)) {
    return blocked(
      input.requestedCapability,
      "capability_missing_from_entitlement",
      "Trusted entitlement snapshot does not include the requested capability.",
    );
  }

  const usageReason = usageLimitExceeded({
    capability: input.requestedCapability,
    entitlement,
    usage: input.usage ?? [],
  });

  if (usageReason) {
    return blocked(
      input.requestedCapability,
      usageReason,
      usageReason === "usage_limit_missing"
        ? "Trusted entitlement snapshot is missing the required usage limit."
        : "Subscription usage limit has been reached.",
    );
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    version: SUBSCRIPTION_CONTRACTS_FOUNDATION_VERSION,
    tier: entitlement.tier,
    capability: input.requestedCapability,
    entitlementId: entitlement.entitlementId,
    evidence: subscriptionContractsSafetyEvidence(),
  };
}

export function createSubscriptionContractsFoundation(
  config: SubscriptionContractsConfig = DEFAULT_SUBSCRIPTION_CONTRACTS_CONFIG,
): SubscriptionContractsFoundation {
  return {
    version: SUBSCRIPTION_CONTRACTS_FOUNDATION_VERSION,
    mode: SUBSCRIPTION_CONTRACTS_FOUNDATION_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    tiers: config.tiers,
    evaluateCapability: (input) => evaluateSubscriptionCapability(config, input),
  };
}

function entitlement(
  overrides: Partial<SubscriptionEntitlement> = {},
): SubscriptionEntitlement {
  return {
    entitlementId: "stage_4_4a_entitlement",
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

function enabledFoundation() {
  return createSubscriptionContractsFoundation({
    ...DEFAULT_SUBSCRIPTION_CONTRACTS_CONFIG,
    enabled: true,
  });
}

function expectBlocked(reason: SubscriptionContractsBlockedReason) {
  return (
    result: SubscriptionCapabilityEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: SubscriptionCapabilityEvaluationResult,
): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only result.";
}

function expectIsolation(
  result: SubscriptionCapabilityEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "4.4A" &&
    evidence.subscriptionOnly &&
    evidence.contractsOnly &&
    evidence.foundationOnly &&
    evidence.failClosedByDefault &&
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
    evidence.stage44BStarted === false &&
    evidence.stage5Started === false
    ? undefined
    : "Subscription contracts isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_foundation_blocks",
      title: "Disabled subscription contracts block by default",
      expectedBehavior: "Fail closed before any entitlement decision is allowed.",
      run: () =>
        createSubscriptionContractsFoundation().evaluateCapability({
          entitlement: entitlement(),
          requestedCapability: "decision_simulation_basic",
        }),
      assertions: [
        expectBlocked("subscription_contracts_disabled"),
        expectIsolation,
      ],
    },
    {
      id: "missing_entitlement_blocks",
      title: "Missing entitlement blocks",
      expectedBehavior: "Require a trusted entitlement snapshot.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: null,
          requestedCapability: "decision_simulation_basic",
        }),
      assertions: [expectBlocked("entitlement_missing"), expectIsolation],
    },
    {
      id: "client_tier_override_blocks",
      title: "Client tier override blocks",
      expectedBehavior: "Reject caller-supplied tier overrides.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement(),
          requestedCapability: "decision_simulation_basic",
          clientTierOverride: "PROFESSIONAL",
        }),
      assertions: [
        expectBlocked("client_tier_override_rejected"),
        expectIsolation,
      ],
    },
    {
      id: "client_owner_fields_block",
      title: "Client owner fields block",
      expectedBehavior: "Reject caller-supplied owner fields.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement(),
          requestedCapability: "decision_simulation_basic",
          clientOwnerFields: {
            ownerPrincipalId,
          },
        }),
      assertions: [
        expectBlocked("client_owner_input_rejected"),
        expectIsolation,
      ],
    },
    {
      id: "past_due_status_blocks",
      title: "Past-due status blocks",
      expectedBehavior: "Only active or trialing statuses are eligible.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement({ status: "past_due" }),
          requestedCapability: "decision_simulation_basic",
        }),
      assertions: [expectBlocked("status_not_allowed"), expectIsolation],
    },
    {
      id: "expired_entitlement_blocks",
      title: "Expired entitlement blocks",
      expectedBehavior: "Expired entitlement snapshots fail closed.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement({ expiresAt: "2026-01-01T00:00:00.000Z" }),
          requestedCapability: "decision_simulation_basic",
          now,
        }),
      assertions: [expectBlocked("entitlement_expired"), expectIsolation],
    },
    {
      id: "free_tier_advanced_capability_blocks",
      title: "Free tier advanced capability blocks",
      expectedBehavior: "Tier definitions control available capabilities.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement({
            tier: "FREE",
            capabilities: ["decision_simulation_basic"],
            usageLimits: DEFAULT_FREE_USAGE_LIMITS,
          }),
          requestedCapability: "decision_simulation_extended",
        }),
      assertions: [
        expectBlocked("capability_not_supported_by_tier"),
        expectIsolation,
      ],
    },
    {
      id: "missing_entitlement_capability_blocks",
      title: "Missing entitlement capability blocks",
      expectedBehavior:
        "Trusted entitlement capability list must include the requested capability.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement({ capabilities: ["decision_simulation_basic"] }),
          requestedCapability: "decision_simulation_extended",
        }),
      assertions: [
        expectBlocked("capability_missing_from_entitlement"),
        expectIsolation,
      ],
    },
    {
      id: "missing_usage_limit_blocks",
      title: "Missing usage limit blocks",
      expectedBehavior: "A required usage metric must have an entitlement limit.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement({ usageLimits: [] }),
          requestedCapability: "decision_simulation_basic",
        }),
      assertions: [expectBlocked("usage_limit_missing"), expectIsolation],
    },
    {
      id: "usage_limit_exceeded_blocks",
      title: "Usage limit exceeded blocks",
      expectedBehavior: "Usage at or above the limit fails closed.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement(),
          requestedCapability: "decision_simulation_basic",
          usage: [
            {
              metric: "decision_simulations_per_month",
              used: 250,
              period: "monthly",
            },
          ],
        }),
      assertions: [expectBlocked("usage_limit_exceeded"), expectIsolation],
    },
    {
      id: "premium_capability_allows_preflight",
      title: "Premium capability allows preflight",
      expectedBehavior: "Eligible entitlement produces preflight-only allow result.",
      run: () =>
        enabledFoundation().evaluateCapability({
          entitlement: entitlement(),
          requestedCapability: "decision_simulation_extended",
          usage: [
            {
              metric: "decision_simulations_per_month",
              used: 42,
              period: "monthly",
            },
          ],
          now,
        }),
      assertions: [expectAllowed, expectIsolation],
    },
  ];
}

function runCase(input: ValidationCase): SubscriptionContractsValidationCaseResult {
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

export function runSubscriptionContractsFoundationValidation(): SubscriptionContractsValidationResult {
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
