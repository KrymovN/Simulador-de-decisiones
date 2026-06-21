import type {
  SubscriptionCapability,
  SubscriptionEntitlement,
  SubscriptionUsageSnapshot,
} from "./contracts";
import {
  createSubscriptionEntitlementEnforcementFoundation,
  type SubscriptionEntitlementClientCapabilityFields,
  type SubscriptionEntitlementEnforcementResult,
} from "./entitlement-enforcement";
import type {
  SubscriptionEntitlementClientBillingFields,
  SubscriptionEntitlementClientOwnerFields,
  SubscriptionEntitlementClientTierFields,
  SubscriptionEntitlementPersistenceBlockedReason,
  SubscriptionEntitlementPersistenceFoundation,
  SubscriptionEntitlementSnapshotRow,
} from "./entitlement-persistence";

export const SUBSCRIPTION_RUNTIME_INTEGRATION_VERSION =
  "4.4-runtime-integration-foundation.1" as const;
export const SUBSCRIPTION_RUNTIME_INTEGRATION_MODE =
  "subscription_runtime_integration_foundation_only" as const;

export type SubscriptionRuntimeIntegrationVersion =
  typeof SUBSCRIPTION_RUNTIME_INTEGRATION_VERSION;
export type SubscriptionRuntimeIntegrationMode =
  typeof SUBSCRIPTION_RUNTIME_INTEGRATION_MODE;

export type SubscriptionRuntimeIntegrationBlockedReason =
  | "runtime_integration_disabled"
  | "trusted_owner_missing"
  | "capability_missing"
  | "client_tier_input_rejected"
  | "client_owner_input_rejected"
  | "client_capability_input_rejected"
  | "client_billing_input_rejected"
  | "entitlement_persistence_unavailable"
  | "entitlement_resolution_blocked"
  | "entitlement_write_blocked"
  | "entitlement_enforcement_blocked";

export type SubscriptionRuntimeIntegrationSafetyEvidence = {
  stage: "4.4";
  runtimeIntegrationOnly: true;
  foundationOnly: true;
  serverOnlyFacade: true;
  failClosedByDefault: true;
  usesEntitlementPersistenceFoundation: true;
  usesEntitlementEnforcementFoundation: true;
  freePremiumProfessionalCapabilityModel: true;
  decisionSimulationCapabilitiesOnly: true;
  clientTierInputAccepted: false;
  clientOwnerInputAccepted: false;
  clientCapabilityInputAccepted: false;
  clientBillingInputAccepted: false;
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
  rollback: "disable_subscription_runtime_integration_or_remove_integration_exports";
};

export type SubscriptionRuntimeIntegrationConfig = {
  enabled: boolean;
  entitlementPersistence?: SubscriptionEntitlementPersistenceFoundation;
};

export type SubscriptionRuntimeIntegrationBaseInput = {
  trustedOwnerPrincipalId?: string;
  requestedAt: string;
  clientTierFields?: SubscriptionEntitlementClientTierFields;
  clientOwnerFields?: SubscriptionEntitlementClientOwnerFields;
  clientCapabilityFields?: SubscriptionEntitlementClientCapabilityFields;
  clientBillingFields?: SubscriptionEntitlementClientBillingFields;
};

export type SubscriptionRuntimeResolveEntitlementInput =
  SubscriptionRuntimeIntegrationBaseInput;

export type SubscriptionRuntimeWriteEntitlementInput =
  SubscriptionRuntimeIntegrationBaseInput & {
    snapshot?: SubscriptionEntitlementSnapshotRow;
  };

export type SubscriptionRuntimeEnforceCapabilityInput =
  SubscriptionRuntimeIntegrationBaseInput & {
    requestedCapability?: SubscriptionCapability;
    usage?: SubscriptionUsageSnapshot[];
  };

export type SubscriptionRuntimeIntegrationAllowedResult<TValue> = {
  status: "allowed";
  execution: "server_only_preflight";
  version: SubscriptionRuntimeIntegrationVersion;
  ownerPrincipalId: string;
  value: TValue;
  evidence: SubscriptionRuntimeIntegrationSafetyEvidence;
};

export type SubscriptionRuntimeIntegrationBlockedResult = {
  status: "blocked";
  execution: "none";
  version: SubscriptionRuntimeIntegrationVersion;
  reason: SubscriptionRuntimeIntegrationBlockedReason;
  message: string;
  persistenceReason?: SubscriptionEntitlementPersistenceBlockedReason;
  enforcementReason?: string;
  evidence: SubscriptionRuntimeIntegrationSafetyEvidence;
};

export type SubscriptionRuntimeResolveEntitlementResult =
  | SubscriptionRuntimeIntegrationAllowedResult<SubscriptionEntitlement>
  | SubscriptionRuntimeIntegrationBlockedResult;

export type SubscriptionRuntimeWriteEntitlementResult =
  | SubscriptionRuntimeIntegrationAllowedResult<SubscriptionEntitlementSnapshotRow>
  | SubscriptionRuntimeIntegrationBlockedResult;

export type SubscriptionRuntimeEnforceCapabilityResult =
  | SubscriptionRuntimeIntegrationAllowedResult<
      Extract<SubscriptionEntitlementEnforcementResult, { status: "allowed" }>
    >
  | SubscriptionRuntimeIntegrationBlockedResult;

export type SubscriptionRuntimeIntegrationFoundation = {
  version: SubscriptionRuntimeIntegrationVersion;
  mode: SubscriptionRuntimeIntegrationMode;
  enabled: boolean;
  executionBoundary: "server_only";
  writesEnabled: "server_provider_contract_only";
  evidence: SubscriptionRuntimeIntegrationSafetyEvidence;
  resolveEntitlement(input: SubscriptionRuntimeResolveEntitlementInput): Promise<SubscriptionRuntimeResolveEntitlementResult>;
  writeEntitlementSnapshot(input: SubscriptionRuntimeWriteEntitlementInput): Promise<SubscriptionRuntimeWriteEntitlementResult>;
  enforceCapability(input: SubscriptionRuntimeEnforceCapabilityInput): Promise<SubscriptionRuntimeEnforceCapabilityResult>;
};

export function subscriptionRuntimeIntegrationSafetyEvidence(): SubscriptionRuntimeIntegrationSafetyEvidence {
  return {
    stage: "4.4",
    runtimeIntegrationOnly: true,
    foundationOnly: true,
    serverOnlyFacade: true,
    failClosedByDefault: true,
    usesEntitlementPersistenceFoundation: true,
    usesEntitlementEnforcementFoundation: true,
    freePremiumProfessionalCapabilityModel: true,
    decisionSimulationCapabilitiesOnly: true,
    clientTierInputAccepted: false,
    clientOwnerInputAccepted: false,
    clientCapabilityInputAccepted: false,
    clientBillingInputAccepted: false,
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
    rollback: "disable_subscription_runtime_integration_or_remove_integration_exports",
  };
}

function blocked(input: {
  reason: SubscriptionRuntimeIntegrationBlockedReason;
  message: string;
  persistenceReason?: SubscriptionEntitlementPersistenceBlockedReason;
  enforcementReason?: string;
}): SubscriptionRuntimeIntegrationBlockedResult {
  return {
    status: "blocked",
    execution: "none",
    version: SUBSCRIPTION_RUNTIME_INTEGRATION_VERSION,
    reason: input.reason,
    message: input.message,
    persistenceReason: input.persistenceReason,
    enforcementReason: input.enforcementReason,
    evidence: subscriptionRuntimeIntegrationSafetyEvidence(),
  };
}

function allowed<TValue>(
  ownerPrincipalId: string,
  value: TValue,
): SubscriptionRuntimeIntegrationAllowedResult<TValue> {
  return {
    status: "allowed",
    execution: "server_only_preflight",
    version: SUBSCRIPTION_RUNTIME_INTEGRATION_VERSION,
    ownerPrincipalId,
    value,
    evidence: subscriptionRuntimeIntegrationSafetyEvidence(),
  };
}

function hasClientTierInput(input: SubscriptionRuntimeIntegrationBaseInput): boolean {
  return Boolean(input.clientTierFields?.tier || input.clientTierFields?.requestedTier);
}

function hasClientOwnerInput(input: SubscriptionRuntimeIntegrationBaseInput): boolean {
  return Boolean(
    input.clientOwnerFields?.principalId ||
      input.clientOwnerFields?.ownerPrincipalId ||
      input.clientOwnerFields?.providerReference,
  );
}

function hasClientCapabilityInput(input: SubscriptionRuntimeIntegrationBaseInput): boolean {
  return Boolean(
    input.clientCapabilityFields?.capability ||
      input.clientCapabilityFields?.requestedCapability,
  );
}

function hasClientBillingInput(input: SubscriptionRuntimeIntegrationBaseInput): boolean {
  return Boolean(
    input.clientBillingFields?.customerId ||
      input.clientBillingFields?.billingCustomerId ||
      input.clientBillingFields?.billingProviderReference ||
      input.clientBillingFields?.stripeCustomerId ||
      input.clientBillingFields?.subscriptionId,
  );
}

function preflight(
  config: SubscriptionRuntimeIntegrationConfig,
  input: SubscriptionRuntimeIntegrationBaseInput,
): SubscriptionRuntimeIntegrationBlockedResult | string {
  if (!config.enabled) {
    return blocked({
      reason: "runtime_integration_disabled",
      message: "Subscription runtime integration foundation is disabled by default.",
    });
  }

  if (!input.trustedOwnerPrincipalId) {
    return blocked({
      reason: "trusted_owner_missing",
      message: "Subscription runtime integration requires a trusted Levio principal id.",
    });
  }

  if (hasClientTierInput(input)) {
    return blocked({
      reason: "client_tier_input_rejected",
      message: "Client-supplied subscription tier fields are rejected.",
    });
  }

  if (hasClientOwnerInput(input)) {
    return blocked({
      reason: "client_owner_input_rejected",
      message: "Client-supplied owner or provider fields are rejected.",
    });
  }

  if (hasClientCapabilityInput(input)) {
    return blocked({
      reason: "client_capability_input_rejected",
      message: "Client-supplied capability fields are rejected.",
    });
  }

  if (hasClientBillingInput(input)) {
    return blocked({
      reason: "client_billing_input_rejected",
      message: "Client-supplied customer or billing identifiers are rejected.",
    });
  }

  if (!config.entitlementPersistence) {
    return blocked({
      reason: "entitlement_persistence_unavailable",
      message: "Subscription runtime integration requires entitlement persistence foundation.",
    });
  }

  return input.trustedOwnerPrincipalId;
}

export function createSubscriptionRuntimeIntegrationFoundation(
  config: SubscriptionRuntimeIntegrationConfig = { enabled: false },
): SubscriptionRuntimeIntegrationFoundation {
  async function resolveEntitlement(
    input: SubscriptionRuntimeResolveEntitlementInput,
  ): Promise<SubscriptionRuntimeResolveEntitlementResult> {
    const preflightResult = preflight(config, input);

    if (typeof preflightResult !== "string") {
      return preflightResult;
    }

    const result = await config.entitlementPersistence!.resolveEntitlement({
      trustedOwnerPrincipalId: preflightResult,
      requestedAt: input.requestedAt,
    });

    if (result.status === "blocked") {
      return blocked({
        reason: "entitlement_resolution_blocked",
        persistenceReason: result.reason,
        message: result.message,
      });
    }

    return allowed(preflightResult, result.value);
  }

  async function writeEntitlementSnapshot(
    input: SubscriptionRuntimeWriteEntitlementInput,
  ): Promise<SubscriptionRuntimeWriteEntitlementResult> {
    const preflightResult = preflight(config, input);

    if (typeof preflightResult !== "string") {
      return preflightResult;
    }

    const result = await config.entitlementPersistence!.writeSnapshot({
      trustedOwnerPrincipalId: preflightResult,
      requestedAt: input.requestedAt,
      snapshot: input.snapshot,
    });

    if (result.status === "blocked") {
      return blocked({
        reason: "entitlement_write_blocked",
        persistenceReason: result.reason,
        message: result.message,
      });
    }

    return allowed(preflightResult, result.value);
  }

  async function enforceCapability(
    input: SubscriptionRuntimeEnforceCapabilityInput,
  ): Promise<SubscriptionRuntimeEnforceCapabilityResult> {
    const preflightResult = preflight(config, input);

    if (typeof preflightResult !== "string") {
      return preflightResult;
    }

    if (!input.requestedCapability) {
      return blocked({
        reason: "capability_missing",
        message: "Subscription runtime integration requires a server-selected capability.",
      });
    }

    const result = await createSubscriptionEntitlementEnforcementFoundation({
      enabled: true,
      entitlementPersistence: config.entitlementPersistence,
    }).enforce({
      trustedOwnerPrincipalId: preflightResult,
      requestedCapability: input.requestedCapability,
      requestedAt: input.requestedAt,
      usage: input.usage,
    });

    if (result.status === "blocked") {
      return blocked({
        reason: "entitlement_enforcement_blocked",
        enforcementReason: result.reason,
        message: result.message,
      });
    }

    return allowed(preflightResult, result);
  }

  return {
    version: SUBSCRIPTION_RUNTIME_INTEGRATION_VERSION,
    mode: SUBSCRIPTION_RUNTIME_INTEGRATION_MODE,
    enabled: config.enabled,
    executionBoundary: "server_only",
    writesEnabled: "server_provider_contract_only",
    evidence: subscriptionRuntimeIntegrationSafetyEvidence(),
    resolveEntitlement,
    writeEntitlementSnapshot,
    enforceCapability,
  };
}
