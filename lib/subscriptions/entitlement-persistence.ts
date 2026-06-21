import {
  DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
  SUBSCRIPTION_ACTIVE_STATUSES,
} from "./validation";
import type {
  SubscriptionEntitlement,
  SubscriptionEntitlementSource,
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionUsageLimit,
} from "./contracts";

export const SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_VERSION =
  "4.4-entitlement-persistence-foundation.1" as const;
export const SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_MODE =
  "entitlement_persistence_foundation_only" as const;

export type SubscriptionEntitlementPersistenceVersion =
  typeof SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_VERSION;
export type SubscriptionEntitlementPersistenceMode =
  typeof SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_MODE;

export type SubscriptionEntitlementSnapshotRow = SubscriptionEntitlement & {
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  schemaVersion: 1;
};

export type SubscriptionEntitlementClientTierFields = {
  tier?: SubscriptionTier;
  requestedTier?: SubscriptionTier;
};

export type SubscriptionEntitlementClientOwnerFields = {
  principalId?: string;
  ownerPrincipalId?: string;
  providerReference?: string;
};

export type SubscriptionEntitlementClientBillingFields = {
  customerId?: string;
  billingCustomerId?: string;
  billingProviderReference?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
};

export type SubscriptionEntitlementPersistenceBlockedReason =
  | "entitlement_persistence_disabled"
  | "trusted_owner_missing"
  | "client_tier_input_rejected"
  | "client_owner_input_rejected"
  | "client_billing_input_rejected"
  | "provider_not_configured"
  | "provider_not_server_only"
  | "provider_read_failed"
  | "provider_write_failed"
  | "snapshot_missing"
  | "snapshot_invalid"
  | "snapshot_owner_mismatch"
  | "tier_not_supported"
  | "status_not_supported"
  | "timestamp_invalid"
  | "entitlement_missing"
  | "entitlement_expired";

export type SubscriptionEntitlementPersistenceSafetyEvidence = {
  stage: "4.4";
  entitlementPersistenceOnly: true;
  foundationOnly: true;
  serverOnlyBoundaryRequired: true;
  ownerPrincipalIdOnly: true;
  clientTierInputAccepted: false;
  clientOwnerInputAccepted: false;
  clientCustomerInputAccepted: false;
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
  schemaChanged: false;
  migrationsChanged: false;
  writesRequireInjectedServerProvider: true;
  rollback: "disable_entitlement_persistence_or_remove_subscription_entitlement_exports";
};

export type SubscriptionEntitlementPersistenceProviderResult<TValue> =
  | {
      status: "ready";
      value: TValue;
    }
  | {
      status: "blocked";
      reason: "provider_read_failed" | "provider_write_failed";
      message: string;
    };

export type SubscriptionEntitlementPersistenceProvider = {
  executionBoundary: "server_only";
  listEntitlementSnapshots(input: {
    ownerPrincipalId: string;
    requestedAt: string;
  }): Promise<
    SubscriptionEntitlementPersistenceProviderResult<
      SubscriptionEntitlementSnapshotRow[]
    >
  >;
  upsertEntitlementSnapshot(input: {
    snapshot: SubscriptionEntitlementSnapshotRow;
    requestedAt: string;
  }): Promise<
    SubscriptionEntitlementPersistenceProviderResult<
      SubscriptionEntitlementSnapshotRow
    >
  >;
};

export type SubscriptionEntitlementPersistenceConfig = {
  enabled: boolean;
  provider?: SubscriptionEntitlementPersistenceProvider;
};

export type SubscriptionEntitlementPersistenceBaseInput = {
  trustedOwnerPrincipalId?: string;
  requestedAt: string;
  clientTierFields?: SubscriptionEntitlementClientTierFields;
  clientOwnerFields?: SubscriptionEntitlementClientOwnerFields;
  clientBillingFields?: SubscriptionEntitlementClientBillingFields;
};

export type SubscriptionEntitlementReadInput =
  SubscriptionEntitlementPersistenceBaseInput;

export type SubscriptionEntitlementWriteInput =
  SubscriptionEntitlementPersistenceBaseInput & {
    snapshot?: SubscriptionEntitlementSnapshotRow;
  };

export type SubscriptionEntitlementResolveInput =
  SubscriptionEntitlementPersistenceBaseInput;

export type SubscriptionEntitlementPersistenceAllowedResult<TValue> = {
  status: "allowed";
  execution: "server_provider_contract_only";
  version: SubscriptionEntitlementPersistenceVersion;
  ownerPrincipalId: string;
  value: TValue;
  evidence: SubscriptionEntitlementPersistenceSafetyEvidence;
};

export type SubscriptionEntitlementPersistenceBlockedResult = {
  status: "blocked";
  execution: "none";
  version: SubscriptionEntitlementPersistenceVersion;
  reason: SubscriptionEntitlementPersistenceBlockedReason;
  message: string;
  evidence: SubscriptionEntitlementPersistenceSafetyEvidence;
};

export type SubscriptionEntitlementReadResult =
  | SubscriptionEntitlementPersistenceAllowedResult<
      SubscriptionEntitlementSnapshotRow[]
    >
  | SubscriptionEntitlementPersistenceBlockedResult;

export type SubscriptionEntitlementWriteResult =
  | SubscriptionEntitlementPersistenceAllowedResult<
      SubscriptionEntitlementSnapshotRow
    >
  | SubscriptionEntitlementPersistenceBlockedResult;

export type SubscriptionEntitlementResolveResult =
  | SubscriptionEntitlementPersistenceAllowedResult<SubscriptionEntitlement>
  | SubscriptionEntitlementPersistenceBlockedResult;

export type SubscriptionEntitlementPersistenceFoundation = {
  version: SubscriptionEntitlementPersistenceVersion;
  mode: SubscriptionEntitlementPersistenceMode;
  enabled: boolean;
  writesEnabled: "server_provider_contract_only";
  evidence: SubscriptionEntitlementPersistenceSafetyEvidence;
  readSnapshots(input: SubscriptionEntitlementReadInput): Promise<SubscriptionEntitlementReadResult>;
  writeSnapshot(input: SubscriptionEntitlementWriteInput): Promise<SubscriptionEntitlementWriteResult>;
  resolveEntitlement(input: SubscriptionEntitlementResolveInput): Promise<SubscriptionEntitlementResolveResult>;
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  FREE: 0,
  PREMIUM: 1,
  PROFESSIONAL: 2,
};

const SUPPORTED_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
  "paused",
  "canceled",
  "expired",
  "unknown",
];

const SUPPORTED_SOURCES: SubscriptionEntitlementSource[] = [
  "static_foundation_snapshot",
  "trusted_runtime_snapshot",
];

export function subscriptionEntitlementPersistenceSafetyEvidence(): SubscriptionEntitlementPersistenceSafetyEvidence {
  return {
    stage: "4.4",
    entitlementPersistenceOnly: true,
    foundationOnly: true,
    serverOnlyBoundaryRequired: true,
    ownerPrincipalIdOnly: true,
    clientTierInputAccepted: false,
    clientOwnerInputAccepted: false,
    clientCustomerInputAccepted: false,
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
    schemaChanged: false,
    migrationsChanged: false,
    writesRequireInjectedServerProvider: true,
    rollback: "disable_entitlement_persistence_or_remove_subscription_entitlement_exports",
  };
}

function blocked(
  reason: SubscriptionEntitlementPersistenceBlockedReason,
  message: string,
): SubscriptionEntitlementPersistenceBlockedResult {
  return {
    status: "blocked",
    execution: "none",
    version: SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_VERSION,
    reason,
    message,
    evidence: subscriptionEntitlementPersistenceSafetyEvidence(),
  };
}

function allowed<TValue>(
  ownerPrincipalId: string,
  value: TValue,
): SubscriptionEntitlementPersistenceAllowedResult<TValue> {
  return {
    status: "allowed",
    execution: "server_provider_contract_only",
    version: SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_VERSION,
    ownerPrincipalId,
    value,
    evidence: subscriptionEntitlementPersistenceSafetyEvidence(),
  };
}

function hasClientTierInput(input: SubscriptionEntitlementPersistenceBaseInput): boolean {
  return Boolean(input.clientTierFields?.tier || input.clientTierFields?.requestedTier);
}

function hasClientOwnerInput(input: SubscriptionEntitlementPersistenceBaseInput): boolean {
  const fields = input.clientOwnerFields;

  return Boolean(fields?.principalId || fields?.ownerPrincipalId || fields?.providerReference);
}

function hasClientBillingInput(input: SubscriptionEntitlementPersistenceBaseInput): boolean {
  const fields = input.clientBillingFields;

  return Boolean(
    fields?.customerId ||
      fields?.billingCustomerId ||
      fields?.billingProviderReference ||
      fields?.stripeCustomerId ||
      fields?.subscriptionId,
  );
}

function isTimestampValid(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  return Number.isFinite(Date.parse(value));
}

function tierDefinition(tier: SubscriptionTier) {
  return DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS.find(
    (candidate) => candidate.tier === tier,
  );
}

function usageLimitSupportedByTier(
  limit: SubscriptionUsageLimit,
  definition: NonNullable<ReturnType<typeof tierDefinition>>,
): boolean {
  return definition.usageLimits.some(
    (candidate) =>
      candidate.metric === limit.metric &&
      candidate.period === limit.period &&
      candidate.enforcement === limit.enforcement &&
      candidate.overageBehavior === limit.overageBehavior,
  );
}

function snapshotValidity(input: {
  snapshot: SubscriptionEntitlementSnapshotRow | undefined;
  trustedOwnerPrincipalId: string;
  requestedAt: string;
}): SubscriptionEntitlementPersistenceBlockedReason | undefined {
  const { snapshot } = input;

  if (!snapshot) {
    return "snapshot_missing";
  }

  if (
    !snapshot.entitlementId ||
    !snapshot.ownerPrincipalId ||
    snapshot.schemaVersion !== 1 ||
    !Array.isArray(snapshot.capabilities) ||
    !Array.isArray(snapshot.usageLimits)
  ) {
    return "snapshot_invalid";
  }

  if (snapshot.ownerPrincipalId !== input.trustedOwnerPrincipalId) {
    return "snapshot_owner_mismatch";
  }

  const definition = tierDefinition(snapshot.tier);

  if (!definition) {
    return "tier_not_supported";
  }

  if (!SUPPORTED_STATUSES.includes(snapshot.status)) {
    return "status_not_supported";
  }

  if (!SUPPORTED_SOURCES.includes(snapshot.source)) {
    return "snapshot_invalid";
  }

  if (
    !isTimestampValid(input.requestedAt) ||
    !isTimestampValid(snapshot.effectiveAt) ||
    !isTimestampValid(snapshot.expiresAt) ||
    !isTimestampValid(snapshot.createdAt) ||
    !isTimestampValid(snapshot.updatedAt) ||
    !isTimestampValid(snapshot.revokedAt)
  ) {
    return "timestamp_invalid";
  }

  if (
    snapshot.capabilities.some(
      (capability) => !definition.capabilities.includes(capability),
    )
  ) {
    return "snapshot_invalid";
  }

  if (snapshot.usageLimits.some((limit) => !usageLimitSupportedByTier(limit, definition))) {
    return "snapshot_invalid";
  }

  return undefined;
}

function preflight(
  config: SubscriptionEntitlementPersistenceConfig,
  input: SubscriptionEntitlementPersistenceBaseInput,
): SubscriptionEntitlementPersistenceBlockedResult | string {
  if (!config.enabled) {
    return blocked(
      "entitlement_persistence_disabled",
      "Subscription entitlement persistence foundation is disabled by default.",
    );
  }

  if (!input.trustedOwnerPrincipalId) {
    return blocked(
      "trusted_owner_missing",
      "Subscription entitlement persistence requires a trusted Levio principal id.",
    );
  }

  if (hasClientTierInput(input)) {
    return blocked(
      "client_tier_input_rejected",
      "Client-supplied subscription tier fields are rejected.",
    );
  }

  if (hasClientOwnerInput(input)) {
    return blocked(
      "client_owner_input_rejected",
      "Client-supplied owner or provider fields are rejected.",
    );
  }

  if (hasClientBillingInput(input)) {
    return blocked(
      "client_billing_input_rejected",
      "Client-supplied customer or billing identifiers are rejected.",
    );
  }

  if (!config.provider) {
    return blocked(
      "provider_not_configured",
      "No server-only entitlement persistence provider is configured.",
    );
  }

  if (config.provider.executionBoundary !== "server_only") {
    return blocked(
      "provider_not_server_only",
      "Entitlement persistence provider must be server-only.",
    );
  }

  return input.trustedOwnerPrincipalId;
}

function providerBlocked(
  reason: "provider_read_failed" | "provider_write_failed",
  message: string,
): SubscriptionEntitlementPersistenceBlockedResult {
  return blocked(reason, message);
}

function sortEntitlements(
  left: SubscriptionEntitlementSnapshotRow,
  right: SubscriptionEntitlementSnapshotRow,
): number {
  const tierDiff = TIER_RANK[right.tier] - TIER_RANK[left.tier];

  if (tierDiff !== 0) {
    return tierDiff;
  }

  return Date.parse(right.effectiveAt) - Date.parse(left.effectiveAt);
}

function activeAt(
  snapshot: SubscriptionEntitlementSnapshotRow,
  requestedAt: string,
): boolean {
  if (!SUBSCRIPTION_ACTIVE_STATUSES.includes(snapshot.status)) {
    return false;
  }

  if (snapshot.expiresAt && Date.parse(snapshot.expiresAt) <= Date.parse(requestedAt)) {
    return false;
  }

  if (snapshot.revokedAt && Date.parse(snapshot.revokedAt) <= Date.parse(requestedAt)) {
    return false;
  }

  return true;
}

function toEntitlement(snapshot: SubscriptionEntitlementSnapshotRow): SubscriptionEntitlement {
  return {
    entitlementId: snapshot.entitlementId,
    ownerPrincipalId: snapshot.ownerPrincipalId,
    tier: snapshot.tier,
    status: snapshot.status,
    capabilities: snapshot.capabilities,
    usageLimits: snapshot.usageLimits,
    source: snapshot.source,
    effectiveAt: snapshot.effectiveAt,
    expiresAt: snapshot.expiresAt,
  };
}

export function createSubscriptionEntitlementPersistenceFoundation(
  config: SubscriptionEntitlementPersistenceConfig = { enabled: false },
): SubscriptionEntitlementPersistenceFoundation {
  async function readSnapshots(
    input: SubscriptionEntitlementReadInput,
  ): Promise<SubscriptionEntitlementReadResult> {
    const preflightResult = preflight(config, input);

    if (typeof preflightResult !== "string") {
      return preflightResult;
    }

    const providerResult = await config.provider!.listEntitlementSnapshots({
      ownerPrincipalId: preflightResult,
      requestedAt: input.requestedAt,
    });

    if (providerResult.status === "blocked") {
      return providerBlocked(providerResult.reason, providerResult.message);
    }

    const invalidReason = providerResult.value
      .map((snapshot) =>
        snapshotValidity({
          snapshot,
          trustedOwnerPrincipalId: preflightResult,
          requestedAt: input.requestedAt,
        }),
      )
      .find((reason): reason is SubscriptionEntitlementPersistenceBlockedReason =>
        Boolean(reason),
      );

    if (invalidReason) {
      return blocked(
        invalidReason,
        "Entitlement provider returned an invalid or cross-owner snapshot.",
      );
    }

    return allowed(preflightResult, providerResult.value);
  }

  async function writeSnapshot(
    input: SubscriptionEntitlementWriteInput,
  ): Promise<SubscriptionEntitlementWriteResult> {
    const preflightResult = preflight(config, input);

    if (typeof preflightResult !== "string") {
      return preflightResult;
    }

    const invalidReason = snapshotValidity({
      snapshot: input.snapshot,
      trustedOwnerPrincipalId: preflightResult,
      requestedAt: input.requestedAt,
    });

    if (invalidReason) {
      return blocked(invalidReason, "Entitlement snapshot failed validation.");
    }

    const providerResult = await config.provider!.upsertEntitlementSnapshot({
      snapshot: input.snapshot!,
      requestedAt: input.requestedAt,
    });

    if (providerResult.status === "blocked") {
      return providerBlocked(providerResult.reason, providerResult.message);
    }

    const providerInvalidReason = snapshotValidity({
      snapshot: providerResult.value,
      trustedOwnerPrincipalId: preflightResult,
      requestedAt: input.requestedAt,
    });

    if (providerInvalidReason) {
      return blocked(
        providerInvalidReason,
        "Entitlement provider persisted an invalid or cross-owner snapshot.",
      );
    }

    return allowed(preflightResult, providerResult.value);
  }

  async function resolveEntitlement(
    input: SubscriptionEntitlementResolveInput,
  ): Promise<SubscriptionEntitlementResolveResult> {
    const readResult = await readSnapshots(input);

    if (readResult.status === "blocked") {
      return readResult;
    }

    const activeSnapshots = readResult.value
      .filter((snapshot) => activeAt(snapshot, input.requestedAt))
      .sort(sortEntitlements);

    const selected = activeSnapshots[0];

    if (!selected) {
      return blocked(
        "entitlement_missing",
        "No active trusted subscription entitlement snapshot is available.",
      );
    }

    return allowed(readResult.ownerPrincipalId, toEntitlement(selected));
  }

  return {
    version: SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_VERSION,
    mode: SUBSCRIPTION_ENTITLEMENT_PERSISTENCE_MODE,
    enabled: config.enabled,
    writesEnabled: "server_provider_contract_only",
    evidence: subscriptionEntitlementPersistenceSafetyEvidence(),
    readSnapshots,
    writeSnapshot,
    resolveEntitlement,
  };
}
