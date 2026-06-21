import {
  DEFAULT_FREE_USAGE_LIMITS,
  DEFAULT_PREMIUM_USAGE_LIMITS,
  DEFAULT_PROFESSIONAL_USAGE_LIMITS,
  DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS,
} from "./validation";
import {
  createSubscriptionEntitlementPersistenceFoundation,
  type SubscriptionEntitlementPersistenceProvider,
  type SubscriptionEntitlementSnapshotRow,
} from "./entitlement-persistence";
import {
  createSubscriptionRuntimeIntegrationFoundation,
  subscriptionRuntimeIntegrationSafetyEvidence,
} from "./runtime-integration";
import type { SubscriptionCapability } from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]>;
};

export type SubscriptionRuntimeIntegrationValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SubscriptionRuntimeIntegrationValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SubscriptionRuntimeIntegrationValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const ownerPrincipalId = "stage_4_4_runtime_integration_owner";
const requestedAt = "2026-06-21T12:00:00.000Z";

type IntegrationResult =
  Awaited<ReturnType<ReturnType<typeof createSubscriptionRuntimeIntegrationFoundation>["resolveEntitlement"]>> |
  Awaited<ReturnType<ReturnType<typeof createSubscriptionRuntimeIntegrationFoundation>["writeEntitlementSnapshot"]>> |
  Awaited<ReturnType<ReturnType<typeof createSubscriptionRuntimeIntegrationFoundation>["enforceCapability"]>>;

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function snapshot(
  overrides: Partial<SubscriptionEntitlementSnapshotRow> = {},
): SubscriptionEntitlementSnapshotRow {
  return {
    entitlementId: "stage_4_4_runtime_integration_snapshot",
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
  calls?: { read: number; write: number };
} = {}): SubscriptionEntitlementPersistenceProvider {
  const calls = input.calls;

  return {
    executionBoundary: "server_only",
    async listEntitlementSnapshots() {
      if (calls) {
        calls.read += 1;
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

      return {
        status: "ready",
        value: input.writeResult ?? nextSnapshot,
      };
    },
  };
}

function createIntegration(input: {
  rows?: SubscriptionEntitlementSnapshotRow[];
  writeResult?: SubscriptionEntitlementSnapshotRow;
  enabled?: boolean;
  calls?: { read: number; write: number };
} = {}) {
  return createSubscriptionRuntimeIntegrationFoundation({
    enabled: input.enabled ?? true,
    entitlementPersistence: createSubscriptionEntitlementPersistenceFoundation({
      enabled: true,
      provider: createProvider({
        rows: input.rows,
        writeResult: input.writeResult,
        calls: input.calls,
      }),
    }),
  });
}

function expectBlocked(result: IntegrationResult, reason: string): string[] {
  return issueUnless(
    result.status === "blocked" && result.reason === reason,
    `Expected blocked result with reason ${reason}.`,
  );
}

function expectIsolationEvidence(): string[] {
  const evidence = subscriptionRuntimeIntegrationSafetyEvidence();

  return evidence.stage === "4.4" &&
    evidence.runtimeIntegrationOnly &&
    evidence.foundationOnly &&
    evidence.serverOnlyFacade &&
    evidence.failClosedByDefault &&
    evidence.usesEntitlementPersistenceFoundation &&
    evidence.usesEntitlementEnforcementFoundation &&
    evidence.freePremiumProfessionalCapabilityModel &&
    evidence.decisionSimulationCapabilitiesOnly &&
    evidence.clientTierInputAccepted === false &&
    evidence.clientOwnerInputAccepted === false &&
    evidence.clientCapabilityInputAccepted === false &&
    evidence.clientBillingInputAccepted === false &&
    evidence.billingProviderConnected === false &&
    evidence.stripeConnected === false &&
    evidence.checkoutConnected === false &&
    evidence.webhooksConnected === false &&
    evidence.pricingEngineConnected === false &&
    evidence.paymentUiConnected === false &&
    evidence.subscriptionUiConnected === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.openAiIntegrated === false &&
    evidence.productBehaviorChanged === false
    ? []
    : ["Subscription runtime integration safety evidence changed."];
}

async function enforce(input: {
  capability?: SubscriptionCapability;
  rows?: SubscriptionEntitlementSnapshotRow[];
}) {
  return createIntegration({ rows: input.rows }).enforceCapability({
    trustedOwnerPrincipalId: ownerPrincipalId,
    requestedCapability: input.capability ?? "decision_simulation_extended",
    requestedAt,
  });
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_by_default_blocks",
      title: "Runtime integration is disabled by default",
      expectedBehavior: "Facade fails closed and does not call entitlement provider.",
      run: async () => {
        const calls = { read: 0, write: 0 };
        const result = await createIntegration({ enabled: false, calls }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return [
          ...expectBlocked(result, "runtime_integration_disabled"),
          ...issueUnless(calls.read === 0 && calls.write === 0, "Disabled integration must not call provider."),
          ...expectIsolationEvidence(),
        ];
      },
    },
    {
      id: "missing_owner_blocks",
      title: "Missing trusted owner blocks",
      expectedBehavior: "Facade does not infer owner.",
      run: async () => {
        const result = await createIntegration().resolveEntitlement({ requestedAt });
        return expectBlocked(result, "trusted_owner_missing");
      },
    },
    {
      id: "client_tier_blocks",
      title: "Client tier input blocks",
      expectedBehavior: "Client tier fields are rejected before runtime resolution.",
      run: async () => {
        const result = await createIntegration().resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          clientTierFields: { requestedTier: "PROFESSIONAL" },
        });
        return expectBlocked(result, "client_tier_input_rejected");
      },
    },
    {
      id: "client_owner_blocks",
      title: "Client owner input blocks",
      expectedBehavior: "Client owner fields are rejected before runtime resolution.",
      run: async () => {
        const result = await createIntegration().resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          clientOwnerFields: { ownerPrincipalId },
        });
        return expectBlocked(result, "client_owner_input_rejected");
      },
    },
    {
      id: "client_capability_blocks",
      title: "Client capability input blocks",
      expectedBehavior: "Client capability fields are rejected before enforcement.",
      run: async () => {
        const result = await createIntegration().enforceCapability({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedCapability: "decision_simulation_basic",
          requestedAt,
          clientCapabilityFields: { capability: "professional_decision_archive" },
        });
        return expectBlocked(result, "client_capability_input_rejected");
      },
    },
    {
      id: "client_billing_blocks",
      title: "Client billing input blocks",
      expectedBehavior: "Client billing/customer fields are rejected.",
      run: async () => {
        const result = await createIntegration().resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          clientBillingFields: { stripeCustomerId: "cus_client" },
        });
        return expectBlocked(result, "client_billing_input_rejected");
      },
    },
    {
      id: "missing_persistence_blocks",
      title: "Missing entitlement persistence blocks",
      expectedBehavior: "Facade fails closed when persistence foundation is absent.",
      run: async () => {
        const result = await createSubscriptionRuntimeIntegrationFoundation({
          enabled: true,
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });
        return expectBlocked(result, "entitlement_persistence_unavailable");
      },
    },
    {
      id: "resolve_entitlement_allows",
      title: "Resolve entitlement allows",
      expectedBehavior: "Facade resolves trusted entitlement snapshot through persistence.",
      run: async () => {
        const result = await createIntegration().resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return issueUnless(
          result.status === "allowed" && result.value.tier === "PREMIUM",
          "Expected PREMIUM entitlement to resolve.",
        );
      },
    },
    {
      id: "write_snapshot_allows",
      title: "Write entitlement snapshot allows",
      expectedBehavior: "Facade writes a trusted server-selected snapshot through persistence foundation.",
      run: async () => {
        const professional = snapshot({
          tier: "PROFESSIONAL",
          capabilities: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS[2].capabilities,
          usageLimits: DEFAULT_PROFESSIONAL_USAGE_LIMITS,
        });
        const result = await createIntegration().writeEntitlementSnapshot({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
          snapshot: professional,
        });

        return issueUnless(
          result.status === "allowed" && result.value.tier === "PROFESSIONAL",
          "Expected PROFESSIONAL entitlement snapshot write to be allowed.",
        );
      },
    },
    {
      id: "free_basic_enforces",
      title: "FREE basic simulation enforces",
      expectedBehavior: "Facade allows basic decision simulation for FREE tier.",
      run: async () => {
        const result = await enforce({
          capability: "decision_simulation_basic",
          rows: [
            snapshot({
              tier: "FREE",
              capabilities: ["decision_simulation_basic"],
              usageLimits: DEFAULT_FREE_USAGE_LIMITS,
            }),
          ],
        });

        return issueUnless(
          result.status === "allowed" &&
            result.value.runtimeResult.resolvedTier === "FREE",
          "Expected FREE basic capability to be allowed.",
        );
      },
    },
    {
      id: "free_extended_blocks",
      title: "FREE extended simulation blocks",
      expectedBehavior: "Facade propagates enforcement block for unsupported FREE capability.",
      run: async () => {
        const result = await enforce({
          capability: "decision_simulation_extended",
          rows: [
            snapshot({
              tier: "FREE",
              capabilities: ["decision_simulation_basic"],
              usageLimits: DEFAULT_FREE_USAGE_LIMITS,
            }),
          ],
        });

        return [
          ...expectBlocked(result, "entitlement_enforcement_blocked"),
          ...issueUnless(
            result.status === "blocked" &&
              result.enforcementReason === "subscription_runtime_blocked",
            "Expected enforcement runtime block to propagate.",
          ),
        ];
      },
    },
    {
      id: "professional_archive_enforces",
      title: "PROFESSIONAL archive enforces",
      expectedBehavior: "Facade allows professional archive for PROFESSIONAL tier.",
      run: async () => {
        const result = await enforce({
          capability: "professional_decision_archive",
          rows: [
            snapshot({
              tier: "PROFESSIONAL",
              capabilities: DEFAULT_SUBSCRIPTION_TIER_DEFINITIONS[2].capabilities,
              usageLimits: DEFAULT_PROFESSIONAL_USAGE_LIMITS,
            }),
          ],
        });

        return issueUnless(
          result.status === "allowed" &&
            result.value.runtimeResult.resolvedTier === "PROFESSIONAL",
          "Expected PROFESSIONAL archive capability to be allowed.",
        );
      },
    },
    {
      id: "expired_entitlement_blocks",
      title: "Expired entitlement blocks",
      expectedBehavior: "Facade fails closed when persistence cannot resolve an active entitlement.",
      run: async () => {
        const result = await createIntegration({
          rows: [snapshot({ expiresAt: "2026-01-01T00:00:00.000Z" })],
        }).resolveEntitlement({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return [
          ...expectBlocked(result, "entitlement_resolution_blocked"),
          ...issueUnless(
            result.status === "blocked" &&
              result.persistenceReason === "entitlement_missing",
            "Expected entitlement_missing persistence reason to propagate.",
          ),
        ];
      },
    },
  ];
}

export async function runSubscriptionRuntimeIntegrationValidation(): Promise<SubscriptionRuntimeIntegrationValidationResult> {
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
