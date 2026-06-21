import {
  DEFAULT_SUBSCRIPTION_CONTRACTS_CONFIG,
  DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
} from "./validation";
import { createSubscriptionRuntimeFoundation } from "./runtime";
import type {
  SubscriptionCapability,
  SubscriptionRuntimeEvaluationResult,
  SubscriptionUsageSnapshot,
} from "./contracts";
import type {
  SubscriptionEntitlementPersistenceFoundation,
  SubscriptionEntitlementPersistenceBlockedReason,
  SubscriptionEntitlementClientOwnerFields,
  SubscriptionEntitlementClientTierFields,
} from "./entitlement-persistence";

export const SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_VERSION =
  "4.4-entitlement-enforcement-foundation.1" as const;
export const SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_MODE =
  "entitlement_enforcement_foundation_only" as const;

export type SubscriptionEntitlementEnforcementVersion =
  typeof SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_VERSION;
export type SubscriptionEntitlementEnforcementMode =
  typeof SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_MODE;

export type SubscriptionEntitlementClientCapabilityFields = {
  capability?: SubscriptionCapability;
  requestedCapability?: SubscriptionCapability;
};

export type SubscriptionEntitlementEnforcementBlockedReason =
  | "entitlement_enforcement_disabled"
  | "trusted_owner_missing"
  | "capability_missing"
  | "capability_not_decision_simulation_safe"
  | "client_tier_input_rejected"
  | "client_capability_input_rejected"
  | "client_owner_input_rejected"
  | "entitlement_persistence_unavailable"
  | "entitlement_resolution_blocked"
  | "subscription_runtime_blocked";

export type SubscriptionEntitlementEnforcementSafetyEvidence = {
  stage: "4.4";
  entitlementEnforcementOnly: true;
  foundationOnly: true;
  serverOnlyBoundaryRequired: true;
  decisionSimulationCapabilitiesOnly: true;
  failClosedByDefault: true;
  usesEntitlementPersistenceFoundation: true;
  usesSubscriptionRuntimeFoundation: true;
  clientTierInputAccepted: false;
  clientCapabilityInputAccepted: false;
  clientOwnerInputAccepted: false;
  billingProviderConnected: false;
  stripeConnected: false;
  checkoutConnected: false;
  webhooksConnected: false;
  pricingEngineConnected: false;
  paymentUiConnected: false;
  subscriptionUiConnected: false;
  apiRouteIntegrated: false;
  openAiIntegrated: false;
  productBehaviorChanged: false;
  rollback: "disable_entitlement_enforcement_or_remove_subscription_enforcement_exports";
};

export type SubscriptionEntitlementEnforcementConfig = {
  enabled: boolean;
  entitlementPersistence?: SubscriptionEntitlementPersistenceFoundation;
};

export type SubscriptionEntitlementEnforcementInput = {
  trustedOwnerPrincipalId?: string;
  requestedCapability?: SubscriptionCapability;
  requestedAt: string;
  usage?: SubscriptionUsageSnapshot[];
  clientTierFields?: SubscriptionEntitlementClientTierFields;
  clientCapabilityFields?: SubscriptionEntitlementClientCapabilityFields;
  clientOwnerFields?: SubscriptionEntitlementClientOwnerFields;
};

export type SubscriptionEntitlementEnforcementAllowedResult = {
  status: "allowed";
  execution: "preflight_only";
  version: SubscriptionEntitlementEnforcementVersion;
  ownerPrincipalId: string;
  capability: SubscriptionCapability;
  runtimeResult: Extract<SubscriptionRuntimeEvaluationResult, { status: "allowed" }>;
  evidence: SubscriptionEntitlementEnforcementSafetyEvidence;
};

export type SubscriptionEntitlementEnforcementBlockedResult = {
  status: "blocked";
  execution: "none";
  version: SubscriptionEntitlementEnforcementVersion;
  reason: SubscriptionEntitlementEnforcementBlockedReason;
  message: string;
  persistenceReason?: SubscriptionEntitlementPersistenceBlockedReason;
  runtimeResult?: SubscriptionRuntimeEvaluationResult;
  evidence: SubscriptionEntitlementEnforcementSafetyEvidence;
};

export type SubscriptionEntitlementEnforcementResult =
  | SubscriptionEntitlementEnforcementAllowedResult
  | SubscriptionEntitlementEnforcementBlockedResult;

export type SubscriptionEntitlementEnforcementFoundation = {
  version: SubscriptionEntitlementEnforcementVersion;
  mode: SubscriptionEntitlementEnforcementMode;
  enabled: boolean;
  writesEnabled: false;
  evidence: SubscriptionEntitlementEnforcementSafetyEvidence;
  enforce(input: SubscriptionEntitlementEnforcementInput): Promise<SubscriptionEntitlementEnforcementResult>;
};

const DECISION_SIMULATION_SAFE_CAPABILITIES: SubscriptionCapability[] = [
  "decision_simulation_basic",
  "decision_simulation_extended",
  "saved_simulation_library",
  "simulation_history",
  "advanced_tradeoff_modeling",
  "professional_decision_archive",
];

export function subscriptionEntitlementEnforcementSafetyEvidence(): SubscriptionEntitlementEnforcementSafetyEvidence {
  return {
    stage: "4.4",
    entitlementEnforcementOnly: true,
    foundationOnly: true,
    serverOnlyBoundaryRequired: true,
    decisionSimulationCapabilitiesOnly: true,
    failClosedByDefault: true,
    usesEntitlementPersistenceFoundation: true,
    usesSubscriptionRuntimeFoundation: true,
    clientTierInputAccepted: false,
    clientCapabilityInputAccepted: false,
    clientOwnerInputAccepted: false,
    billingProviderConnected: false,
    stripeConnected: false,
    checkoutConnected: false,
    webhooksConnected: false,
    pricingEngineConnected: false,
    paymentUiConnected: false,
    subscriptionUiConnected: false,
    apiRouteIntegrated: false,
    openAiIntegrated: false,
    productBehaviorChanged: false,
    rollback: "disable_entitlement_enforcement_or_remove_subscription_enforcement_exports",
  };
}

function blocked(input: {
  reason: SubscriptionEntitlementEnforcementBlockedReason;
  message: string;
  persistenceReason?: SubscriptionEntitlementPersistenceBlockedReason;
  runtimeResult?: SubscriptionRuntimeEvaluationResult;
}): SubscriptionEntitlementEnforcementBlockedResult {
  return {
    status: "blocked",
    execution: "none",
    version: SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_VERSION,
    reason: input.reason,
    message: input.message,
    persistenceReason: input.persistenceReason,
    runtimeResult: input.runtimeResult,
    evidence: subscriptionEntitlementEnforcementSafetyEvidence(),
  };
}

function hasClientTierInput(input: SubscriptionEntitlementEnforcementInput): boolean {
  return Boolean(input.clientTierFields?.tier || input.clientTierFields?.requestedTier);
}

function hasClientCapabilityInput(input: SubscriptionEntitlementEnforcementInput): boolean {
  return Boolean(
    input.clientCapabilityFields?.capability ||
      input.clientCapabilityFields?.requestedCapability,
  );
}

function hasClientOwnerInput(input: SubscriptionEntitlementEnforcementInput): boolean {
  return Boolean(
    input.clientOwnerFields?.principalId ||
      input.clientOwnerFields?.ownerPrincipalId ||
      input.clientOwnerFields?.providerReference,
  );
}

function isDecisionSimulationCapability(
  capability: SubscriptionCapability,
): boolean {
  return DECISION_SIMULATION_SAFE_CAPABILITIES.includes(capability);
}

export function createSubscriptionEntitlementEnforcementFoundation(
  config: SubscriptionEntitlementEnforcementConfig = { enabled: false },
): SubscriptionEntitlementEnforcementFoundation {
  async function enforce(
    input: SubscriptionEntitlementEnforcementInput,
  ): Promise<SubscriptionEntitlementEnforcementResult> {
    if (!config.enabled) {
      return blocked({
        reason: "entitlement_enforcement_disabled",
        message: "Subscription entitlement enforcement foundation is disabled by default.",
      });
    }

    if (!input.trustedOwnerPrincipalId) {
      return blocked({
        reason: "trusted_owner_missing",
        message: "Subscription entitlement enforcement requires a trusted Levio principal id.",
      });
    }

    if (!input.requestedCapability) {
      return blocked({
        reason: "capability_missing",
        message: "Subscription entitlement enforcement requires a server-selected capability.",
      });
    }

    if (!isDecisionSimulationCapability(input.requestedCapability)) {
      return blocked({
        reason: "capability_not_decision_simulation_safe",
        message: "Subscription entitlement enforcement only supports Decision Simulation Engine capabilities.",
      });
    }

    if (hasClientTierInput(input)) {
      return blocked({
        reason: "client_tier_input_rejected",
        message: "Client-supplied subscription tier fields are rejected.",
      });
    }

    if (hasClientCapabilityInput(input)) {
      return blocked({
        reason: "client_capability_input_rejected",
        message: "Client-supplied capability fields are rejected.",
      });
    }

    if (hasClientOwnerInput(input)) {
      return blocked({
        reason: "client_owner_input_rejected",
        message: "Client-supplied owner or provider fields are rejected.",
      });
    }

    if (!config.entitlementPersistence) {
      return blocked({
        reason: "entitlement_persistence_unavailable",
        message: "Subscription entitlement enforcement requires entitlement persistence foundation.",
      });
    }

    const entitlementResult = await config.entitlementPersistence.resolveEntitlement({
      trustedOwnerPrincipalId: input.trustedOwnerPrincipalId,
      requestedAt: input.requestedAt,
    });

    if (entitlementResult.status === "blocked") {
      return blocked({
        reason: "entitlement_resolution_blocked",
        persistenceReason: entitlementResult.reason,
        message: entitlementResult.message,
      });
    }

    const runtimeResult = createSubscriptionRuntimeFoundation({
      enabled: true,
      contractsConfig: {
        ...DEFAULT_SUBSCRIPTION_CONTRACTS_CONFIG,
        enabled: true,
        tiers: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
      },
    }).evaluateAccess({
      trustedOwnerPrincipalId: input.trustedOwnerPrincipalId,
      entitlements: [entitlementResult.value],
      requestedCapability: input.requestedCapability,
      usage: input.usage,
      now: input.requestedAt,
    });

    if (runtimeResult.status === "blocked") {
      return blocked({
        reason: "subscription_runtime_blocked",
        message: runtimeResult.message,
        runtimeResult,
      });
    }

    return {
      status: "allowed",
      execution: "preflight_only",
      version: SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_VERSION,
      ownerPrincipalId: input.trustedOwnerPrincipalId,
      capability: input.requestedCapability,
      runtimeResult,
      evidence: subscriptionEntitlementEnforcementSafetyEvidence(),
    };
  }

  return {
    version: SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_VERSION,
    mode: SUBSCRIPTION_ENTITLEMENT_ENFORCEMENT_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    evidence: subscriptionEntitlementEnforcementSafetyEvidence(),
    enforce,
  };
}
