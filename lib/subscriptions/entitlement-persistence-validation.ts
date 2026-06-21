import {
  DEFAULT_FREE_USAGE_LIMITS,
  DEFAULT_PREMIUM_USAGE_LIMITS,
  DEFAULT_PROFESSIONAL_USAGE_LIMITS,
  DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
} from "./validation";
import {
  createSubscriptionEntitlementPersistenceFoundation,
  subscriptionEntitlementPersistenceSafetyEvidence,
  type SubscriptionEntitlementPersistenceProvider,
  type SubscriptionEntitlementResolveResult,
  type SubscriptionEntitlementSnapshotRow,
  type SubscriptionEntitlementWriteResult,
} from "./entitlement-persistence";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]>;
};

export type SubscriptionEntitlementPersistenceValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SubscriptionEntitlementPersistenceValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SubscriptionEntitlementPersistenceValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const ownerPrincipalId = "stage_4_4_entitlement_owner";
const otherOwnerPrincipalId = "stage_4_4_other_owner";
const requestedAt = "2026-06-21T12:00:00.000Z";

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function snapshot(
  overrides: Partial<SubscriptionEntitlementSnapshotRow> = {},
): SubscriptionEntitlementSnapshotRow {
  return {
    entitlementId: "stage_4_4_entitlement_snapshot",
    ownerPrincipalId,
    tier: "PREMIUM",
    status: "active",
    capabilities: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS[1].capabilities,
    usageLimits: DEFAULT_PREMIUM_USAGE_LIMITS,
    source: "trusted_runtime_snapshot",
    effectiveAt: "2026-06-21T00:00:00.000Z",
    expiresAt: "2026-12-21T00:00:00.000Z",
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    schemaVersion: 1,
    ...overrides,
  };
}

function createProvider(input: {
  rows?: SubscriptionEntitlementSnapshotRow[];
  writeResult?: SubscriptionEntitlementSnapshotRow;
  executionBoundary?: "server_only" | "client";
  readBlocked?: boolean;
  writeBlocked?: boolean;
  calls?: { read: number; write: number };
} = {}): SubscriptionEntitlementPersistenceProvider {
  const calls = input.calls;

  return {
    executionBoundary: input.executionBoundary === "client" ? "client" as "server_only" : "server_only",
    async listEntitlementSnapshots() {
      if (calls) {
        calls.read += 1;
      }

      if (input.readBlocked) {
        return {
          status: "blocked",
          reason: "provider_read_failed",
          message: "Provider read failed in validation.",
        };
      }

      return {
        status: "ready",
        value: input.rows ?? [snapshot()],
      };
    },
    async upsertEntitlementSnapshot({ snapshot: nextSnapshot }) {
      if (calls) {
        calls.write += 1;
      }

      if (input.writeBlocked) {
        return {
          status: "blocked",
          reason: "provider_write_failed",
          message: "Provider write failed in validation.",
        };
      }

      return {
        status: "ready",
        value: input.writeResult ?? nextSnapshot,
      };
    },
  };
}

function expectIsolationEvidence(): string[] {
  const evidence = subscriptionEntitlementPersistenceSafetyEvidence();

  return evidence.stage === "4.4" &&
    evidence.entitlementPersistenceOnly &&
    evidence.foundationOnly &&
    evidence.serverOnlyBoundaryRequired &&
    evidence.ownerPrincipalIdOnly &&
    evidence.clientTierInputAccepted === false &&
    evidence.clientOwnerInputAccepted === false &&
    evidence.clientCustomerInputAccepted === false &&
    evidence.billingProviderConnected === false &&
    evidence.stripeConnected === false &&
    evidence.checkoutConnected === false &&
    evidence.webhooksConnected === false &&
    evidence.pricingEngineConnected === false &&
    evidence.paymentUiConnected === false &&
    evidence.subscriptionUiConnected === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.openAiIntegrated === false &&
    evidence.productBehaviorChanged === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.writesRequireInjectedServerProvider
    ? []
    : ["Subscription entitlement persistence safety evidence changed."];
}

function expectBlocked(
  result: SubscriptionEntitlementResolveResult | SubscriptionEntitlementWriteResult,
  reason: string,
): string[] {
  return issueUnless(
    result.status === "blocked" && result.reason === reason,
    `Expected blocked result with reason ${reason}.`,
  );
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_by_default_blocks",
      title: "Entitlement persistence is disabled by default",
      expectedBehavior: "Foundation fails closed and does not call provider.",
      run: async () => {
        const calls = { read: 0, write: 0 };
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: false,
          provider: createProvider({ calls }),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return [
          ...expectBlocked(result, "entitlement_persistence_disabled"),
          ...issueUnless(calls.read === 0 && calls.write === 0, "Disabled foundation must not call provider."),
          ...expectIsolationEvidence(),
        ];
      },
    },
    {
      id: "missing_trusted_owner_blocks",
      title: "Missing trusted owner blocks",
      expectedBehavior: "Foundation does not infer owner from request data.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider(),
        }).resolveEntitlement({ requestedAt });

        return expectBlocked(result, "trusted_owner_missing");
      },
    },
    {
      id: "client_tier_blocks",
      title: "Client-supplied tier blocks",
      expectedBehavior: "Client tier input never authorizes entitlement.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider(),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          clientTierFields: { tier: "PROFESSIONAL" },
        });

        return expectBlocked(result, "client_tier_input_rejected");
      },
    },
    {
      id: "client_owner_blocks",
      title: "Client-supplied owner blocks",
      expectedBehavior: "Client owner input never authorizes entitlement.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider(),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          clientOwnerFields: { ownerPrincipalId },
        });

        return expectBlocked(result, "client_owner_input_rejected");
      },
    },
    {
      id: "client_billing_blocks",
      title: "Client-supplied billing identifiers block",
      expectedBehavior: "Customer, billing, Stripe, and subscription IDs are rejected.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider(),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          clientBillingFields: { stripeCustomerId: "cus_client_supplied" },
        });

        return expectBlocked(result, "client_billing_input_rejected");
      },
    },
    {
      id: "provider_missing_blocks",
      title: "Missing provider blocks",
      expectedBehavior: "Foundation requires an injected server-only provider.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return expectBlocked(result, "provider_not_configured");
      },
    },
    {
      id: "provider_server_boundary_blocks",
      title: "Non-server provider blocks",
      expectedBehavior: "Provider contract must be server-only.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider({ executionBoundary: "client" }),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return expectBlocked(result, "provider_not_server_only");
      },
    },
    {
      id: "write_free_snapshot_allows",
      title: "FREE entitlement snapshot writes through server provider",
      expectedBehavior: "A valid owner-scoped FREE snapshot can be written through the contract.",
      run: async () => {
        const freeSnapshot = snapshot({
          entitlementId: "stage_4_4_free_entitlement",
          tier: "FREE",
          capabilities: ["decision_simulation_basic"],
          usageLimits: DEFAULT_FREE_USAGE_LIMITS,
        });
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider(),
        }).writeSnapshot({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          snapshot: freeSnapshot,
        });

        return [
          ...issueUnless(
            result.status === "allowed" && result.value.tier === "FREE",
            "Expected FREE snapshot write to be allowed.",
          ),
        ];
      },
    },
    {
      id: "highest_owner_snapshot_resolves",
      title: "Highest owner-scoped entitlement resolves",
      expectedBehavior: "Resolver chooses the highest active trusted tier for the owner.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider({
            rows: [
              snapshot({
                entitlementId: "stage_4_4_free_entitlement",
                tier: "FREE",
                capabilities: ["decision_simulation_basic"],
                usageLimits: DEFAULT_FREE_USAGE_LIMITS,
              }),
              snapshot({
                entitlementId: "stage_4_4_professional_entitlement",
                tier: "PROFESSIONAL",
                capabilities: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS[2].capabilities,
                usageLimits: DEFAULT_PROFESSIONAL_USAGE_LIMITS,
              }),
            ],
          }),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return issueUnless(
          result.status === "allowed" && result.value.tier === "PROFESSIONAL",
          "Expected PROFESSIONAL entitlement to resolve.",
        );
      },
    },
    {
      id: "wrong_owner_snapshot_blocks",
      title: "Wrong-owner snapshot blocks",
      expectedBehavior: "Cross-owner snapshots fail closed.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider({
            rows: [snapshot({ ownerPrincipalId: otherOwnerPrincipalId })],
          }),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return expectBlocked(result, "snapshot_owner_mismatch");
      },
    },
    {
      id: "malformed_snapshot_blocks",
      title: "Malformed snapshot blocks",
      expectedBehavior: "Malformed snapshots are not ignored or repaired.",
      run: async () => {
        const malformed = {
          ...snapshot(),
          capabilities: ["professional_decision_archive" as const],
        };
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider({ rows: [malformed] }),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return expectBlocked(result, "snapshot_invalid");
      },
    },
    {
      id: "expired_snapshot_blocks",
      title: "Expired snapshot blocks resolution",
      expectedBehavior: "Expired entitlement snapshots do not resolve access.",
      run: async () => {
        const result = await createSubscriptionEntitlementPersistenceFoundation({
          enabled: true,
          provider: createProvider({
            rows: [snapshot({ expiresAt: "2026-01-01T00:00:00.000Z" })],
          }),
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return expectBlocked(result, "entitlement_missing");
      },
    },
  ];
}

export async function runSubscriptionEntitlementPersistenceValidation(): Promise<SubscriptionEntitlementPersistenceValidationResult> {
  const results = await Promise.all(
    cases().map(async (validationCase) => {
      const issues = await validationCase.run();

      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      };
    }),
  );

  const passed = results.filter((result) => result.passed).length;

  return {
    passed: passed === results.length,
    failed: passed !== results.length,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
    },
  };
}
