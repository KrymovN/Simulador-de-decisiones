export const SUBSCRIPTION_CONTRACTS_FOUNDATION_VERSION =
  "4.4A-subscription-contracts-foundation.1" as const;
export const SUBSCRIPTION_CONTRACTS_FOUNDATION_MODE =
  "subscription_contracts_foundation_only" as const;
export const SUBSCRIPTION_RUNTIME_FOUNDATION_VERSION =
  "4.4B-subscription-runtime-foundation.1" as const;
export const SUBSCRIPTION_RUNTIME_FOUNDATION_MODE =
  "subscription_runtime_foundation_only" as const;
export const SUBSCRIPTION_RUNTIME_BOUNDARY_VERSION =
  "4.4C-subscription-runtime-boundary.1" as const;
export const SUBSCRIPTION_RUNTIME_BOUNDARY_MODE =
  "subscription_runtime_boundary_only" as const;

export type SubscriptionContractsFoundationVersion =
  typeof SUBSCRIPTION_CONTRACTS_FOUNDATION_VERSION;
export type SubscriptionContractsFoundationMode =
  typeof SUBSCRIPTION_CONTRACTS_FOUNDATION_MODE;
export type SubscriptionRuntimeFoundationVersion =
  typeof SUBSCRIPTION_RUNTIME_FOUNDATION_VERSION;
export type SubscriptionRuntimeFoundationMode =
  typeof SUBSCRIPTION_RUNTIME_FOUNDATION_MODE;
export type SubscriptionRuntimeBoundaryVersion =
  typeof SUBSCRIPTION_RUNTIME_BOUNDARY_VERSION;
export type SubscriptionRuntimeBoundaryMode =
  typeof SUBSCRIPTION_RUNTIME_BOUNDARY_MODE;

export type SubscriptionTier = "FREE" | "PREMIUM" | "PROFESSIONAL";

export type SubscriptionCapability =
  | "decision_simulation_basic"
  | "decision_simulation_extended"
  | "saved_simulation_library"
  | "simulation_history"
  | "advanced_tradeoff_modeling"
  | "professional_decision_archive";

export type SubscriptionUsageMetric =
  | "decision_simulations_per_month"
  | "saved_simulations_total"
  | "history_entries_total"
  | "decision_archives_total";

export type SubscriptionUsagePeriod = "monthly" | "lifetime";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired"
  | "unknown";

export type SubscriptionUsageLimit = {
  metric: SubscriptionUsageMetric;
  limit: number;
  period: SubscriptionUsagePeriod;
  enforcement: "foundation_preflight_only";
  overageBehavior: "block";
};

export type SubscriptionUsageSnapshot = {
  metric: SubscriptionUsageMetric;
  used: number;
  period: SubscriptionUsagePeriod;
  periodStartedAt?: string;
  periodEndsAt?: string;
};

export type SubscriptionTierDefinition = {
  tier: SubscriptionTier;
  capabilities: SubscriptionCapability[];
  usageLimits: SubscriptionUsageLimit[];
};

export type SubscriptionEntitlementSource =
  | "static_foundation_snapshot"
  | "trusted_runtime_snapshot";

export type SubscriptionEntitlement = {
  entitlementId: string;
  ownerPrincipalId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  capabilities: SubscriptionCapability[];
  usageLimits: SubscriptionUsageLimit[];
  source: SubscriptionEntitlementSource;
  effectiveAt: string;
  expiresAt?: string;
};

export type SubscriptionContractsConfig = {
  enabled: boolean;
  tiers: SubscriptionTierDefinition[];
  allowedStatuses: SubscriptionStatus[];
};

export type SubscriptionContractsBlockedReason =
  | "subscription_contracts_disabled"
  | "entitlement_missing"
  | "client_tier_override_rejected"
  | "client_owner_input_rejected"
  | "tier_not_supported"
  | "status_not_allowed"
  | "entitlement_expired"
  | "capability_not_supported_by_tier"
  | "capability_missing_from_entitlement"
  | "usage_limit_missing"
  | "usage_limit_exceeded"
  | "timestamp_invalid";

export type SubscriptionContractsSafetyEvidence = {
  stage: "4.4A";
  subscriptionOnly: true;
  contractsOnly: true;
  foundationOnly: true;
  failClosedByDefault: true;
  runtimeWritesEnabled: false;
  billingConnected: false;
  paymentsConnected: false;
  stripeConnected: false;
  dbOperationsExecuted: false;
  supabaseConnected: false;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  simulatorIntegrated: false;
  aiIntegrated: false;
  stage44BStarted: false;
  stage5Started: false;
  rollback: "disable_subscription_contracts_or_remove_subscriptions_exports";
};

export type SubscriptionCapabilityEvaluationInput = {
  entitlement?: SubscriptionEntitlement | null;
  requestedCapability: SubscriptionCapability;
  usage?: SubscriptionUsageSnapshot[];
  now?: string;
  clientTierOverride?: SubscriptionTier;
  clientOwnerFields?: {
    principalId?: string;
    ownerPrincipalId?: string;
    providerReference?: string;
  };
};

export type SubscriptionCapabilityAllowedEvaluation = {
  status: "allowed";
  execution: "preflight_only";
  version: SubscriptionContractsFoundationVersion;
  tier: SubscriptionTier;
  capability: SubscriptionCapability;
  entitlementId: string;
  evidence: SubscriptionContractsSafetyEvidence;
};

export type SubscriptionCapabilityBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: SubscriptionContractsFoundationVersion;
  capability: SubscriptionCapability;
  reason: SubscriptionContractsBlockedReason;
  message: string;
  evidence: SubscriptionContractsSafetyEvidence;
};

export type SubscriptionCapabilityEvaluationResult =
  | SubscriptionCapabilityAllowedEvaluation
  | SubscriptionCapabilityBlockedEvaluation;

export type SubscriptionContractsFoundation = {
  version: SubscriptionContractsFoundationVersion;
  mode: SubscriptionContractsFoundationMode;
  enabled: boolean;
  writesEnabled: false;
  tiers: SubscriptionTierDefinition[];
  evaluateCapability(
    input: SubscriptionCapabilityEvaluationInput,
  ): SubscriptionCapabilityEvaluationResult;
};

export type SubscriptionContractsValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: SubscriptionCapabilityEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SubscriptionContractsValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SubscriptionContractsValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type SubscriptionTierResolution = {
  status: "resolved";
  tier: SubscriptionTier;
  entitlementId: string;
  source: "highest_trusted_entitlement";
};

export type SubscriptionRuntimeConfig = {
  enabled: boolean;
  contractsConfig: SubscriptionContractsConfig;
};

export type SubscriptionRuntimeBlockedReason =
  | SubscriptionContractsBlockedReason
  | "subscription_runtime_disabled"
  | "trusted_owner_missing"
  | "owner_mismatch"
  | "entitlement_resolution_failed";

export type SubscriptionRuntimeSafetyEvidence = {
  stage: "4.4B";
  subscriptionOnly: true;
  runtimeFoundationOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  contractsFoundationUsed: true;
  runtimeWritesEnabled: false;
  billingConnected: false;
  paymentsConnected: false;
  stripeConnected: false;
  dbOperationsExecuted: false;
  supabaseConnected: false;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  simulatorIntegrated: false;
  aiIntegrated: false;
  stage44CStarted: false;
  stage5Started: false;
  rollback: "disable_subscription_runtime_or_remove_runtime_exports";
};

export type SubscriptionRuntimeEvaluationInput = {
  trustedOwnerPrincipalId?: string;
  entitlements: SubscriptionEntitlement[];
  requestedCapability: SubscriptionCapability;
  usage?: SubscriptionUsageSnapshot[];
  now?: string;
  clientTierOverride?: SubscriptionTier;
  clientOwnerFields?: {
    principalId?: string;
    ownerPrincipalId?: string;
    providerReference?: string;
  };
};

export type SubscriptionRuntimeAllowedDecision = {
  status: "allowed";
  execution: "preflight_only";
  version: SubscriptionRuntimeFoundationVersion;
  requestedCapability: SubscriptionCapability;
  resolvedTier: SubscriptionTier;
  entitlementId: string;
  tierResolution: SubscriptionTierResolution;
  contractsResult: SubscriptionCapabilityAllowedEvaluation;
  evidence: SubscriptionRuntimeSafetyEvidence;
};

export type SubscriptionRuntimeBlockedDecision = {
  status: "blocked";
  execution: "none";
  version: SubscriptionRuntimeFoundationVersion;
  requestedCapability: SubscriptionCapability;
  reason: SubscriptionRuntimeBlockedReason;
  message: string;
  tierResolution?: SubscriptionTierResolution;
  contractsResult?: SubscriptionCapabilityBlockedEvaluation;
  evidence: SubscriptionRuntimeSafetyEvidence;
};

export type SubscriptionRuntimeEvaluationResult =
  | SubscriptionRuntimeAllowedDecision
  | SubscriptionRuntimeBlockedDecision;

export type SubscriptionRuntimeFoundation = {
  version: SubscriptionRuntimeFoundationVersion;
  mode: SubscriptionRuntimeFoundationMode;
  enabled: boolean;
  writesEnabled: false;
  evaluateAccess(
    input: SubscriptionRuntimeEvaluationInput,
  ): SubscriptionRuntimeEvaluationResult;
};

export type SubscriptionRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: SubscriptionRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SubscriptionRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SubscriptionRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type SubscriptionRuntimeBoundaryOperation =
  "subscription_access_evaluation";

export type SubscriptionRuntimeBoundaryConfig = {
  enabled: boolean;
  allowedOperations: SubscriptionRuntimeBoundaryOperation[];
  runtime: SubscriptionRuntimeFoundation;
};

export type SubscriptionRuntimeBoundaryBlockedReason =
  | SubscriptionRuntimeBlockedReason
  | "subscription_boundary_disabled"
  | "operation_missing"
  | "operation_not_supported"
  | "operation_not_allowed"
  | "payload_missing"
  | "payload_mismatch"
  | "module_isolation_failed";

export type SubscriptionRuntimeBoundarySafetyEvidence = {
  stage: "4.4C";
  subscriptionOnly: true;
  boundaryOnly: true;
  facadeOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  allowedOperationsExplicit: true;
  moduleIsolationEnforced: true;
  runtimeWritesEnabled: false;
  billingConnected: false;
  paymentsConnected: false;
  stripeConnected: false;
  dbOperationsExecuted: false;
  supabaseConnected: false;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  simulatorIntegrated: false;
  aiIntegrated: false;
  stage44DStarted: false;
  stage5Started: false;
  rollback: "disable_subscription_boundary_or_remove_boundary_exports";
};

export type SubscriptionRuntimeBoundaryEvaluationInput = {
  operation?: SubscriptionRuntimeBoundaryOperation | string;
  access?: SubscriptionRuntimeEvaluationInput | null;
  unexpectedPayload?: unknown;
};

export type SubscriptionRuntimeBoundaryAllowedResult = {
  status: "allowed";
  execution: "preflight_only";
  version: SubscriptionRuntimeBoundaryVersion;
  operation: SubscriptionRuntimeBoundaryOperation;
  runtimeResult: SubscriptionRuntimeAllowedDecision;
  evidence: SubscriptionRuntimeBoundarySafetyEvidence;
};

export type SubscriptionRuntimeBoundaryBlockedResult = {
  status: "blocked";
  execution: "none";
  version: SubscriptionRuntimeBoundaryVersion;
  operation?: SubscriptionRuntimeBoundaryOperation | string;
  reason: SubscriptionRuntimeBoundaryBlockedReason;
  message: string;
  runtimeResult?: SubscriptionRuntimeEvaluationResult;
  evidence: SubscriptionRuntimeBoundarySafetyEvidence;
};

export type SubscriptionRuntimeBoundaryEvaluationResult =
  | SubscriptionRuntimeBoundaryAllowedResult
  | SubscriptionRuntimeBoundaryBlockedResult;

export type SubscriptionRuntimeBoundaryFoundation = {
  version: SubscriptionRuntimeBoundaryVersion;
  mode: SubscriptionRuntimeBoundaryMode;
  enabled: boolean;
  writesEnabled: false;
  allowedOperations: SubscriptionRuntimeBoundaryOperation[];
  evaluate(
    input: SubscriptionRuntimeBoundaryEvaluationInput,
  ): SubscriptionRuntimeBoundaryEvaluationResult;
};

export type SubscriptionRuntimeBoundaryValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: SubscriptionRuntimeBoundaryEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SubscriptionRuntimeBoundaryValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SubscriptionRuntimeBoundaryValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
