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
  createSubscriptionEntitlementEnforcementFoundation,
  subscriptionEntitlementEnforcementSafetyEvidence,
  type SubscriptionEntitlementEnforcementResult,
} from "./entitlement-enforcement";
import type { SubscriptionCapability } from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]>;
};

export type SubscriptionEntitlementEnforcementValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SubscriptionEntitlementEnforcementValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SubscriptionEntitlementEnforcementValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const ownerPrincipalId = "stage_4_4_enforcement_owner";
const requestedAt = "2026-06-21T12:00:00.000Z";

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function snapshot(
  overrides: Partial<SubscriptionEntitlementSnapshotRow> = {},
): SubscriptionEntitlementSnapshotRow {
  return {
    entitlementId: "stage_4_4_enforcement_snapshot",
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

function createProvider(rows: SubscriptionEntitlementSnapshotRow[]): SubscriptionEntitlementPersistenceProvider {
  return {
    executionBoundary: "server_only",
    async listEntitlementSnapshots() {
      return {
        status: "ready",
        value: rows,
      };
    },
    async upsertEntitlementSnapshot({ snapshot: nextSnapshot }) {
      return {
        status: "ready",
        value: nextSnapshot,
      };
    },
  };
}

function createPersistence(rows: SubscriptionEntitlementSnapshotRow[]) {
  return createSubscriptionEntitlementPersistenceFoundation({
    enabled: true,
    provider: createProvider(rows),
  });
}

function createEnforcement(rows: SubscriptionEntitlementSnapshotRow[]) {
  return createSubscriptionEntitlementEnforcementFoundation({
    enabled: true,
    entitlementPersistence: createPersistence(rows),
  });
}

function enforce(input: {
  rows?: SubscriptionEntitlementSnapshotRow[];
  capability?: SubscriptionCapability;
}) {
  return createEnforcement(input.rows ?? [snapshot()]).enforce({
    trustedOwnerPrincipalId: ownerPrincipalId,
    requestedCapability: input.capability ?? "decision_simulation_extended",
    requestedAt,
  });
}

function expectBlocked(
  result: SubscriptionEntitlementEnforcementResult,
  reason: string,
): string[] {
  return issueUnless(
    result.status === "blocked" && result.reason === reason,
    `Expected blocked result with reason ${reason}.`,
  );
}

function expectIsolationEvidence(): string[] {
  const evidence = subscriptionEntitlementEnforcementSafetyEvidence();

  return evidence.stage === "4.4" &&
    evidence.entitlementEnforcementOnly &&
    evidence.foundationOnly &&
    evidence.serverOnlyBoundaryRequired &&
    evidence.decisionSimulationCapabilitiesOnly &&
    evidence.failClosedByDefault &&
    evidence.usesEntitlementPersistenceFoundation &&
    evidence.usesSubscriptionRuntimeFoundation &&
    evidence.clientTierInputAccepted === false &&
    evidence.clientCapabilityInputAccepted === false &&
    evidence.clientOwnerInputAccepted === false &&
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
    : ["Subscription entitlement enforcement safety evidence changed."];
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_by_default_blocks",
      title: "Entitlement enforcement is disabled by default",
      expectedBehavior: "Foundation fails closed when not explicitly enabled.",
      run: async () => {
        const result = await createSubscriptionEntitlementEnforcementFoundation({
          enabled: false,
          entitlementPersistence: createPersistence([snapshot()]),
        }).enforce({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedCapability: "decision_simulation_basic",
          requestedAt,
        });

        return [
          ...expectBlocked(result, "entitlement_enforcement_disabled"),
          ...expectIsolationEvidence(),
        ];
      },
    },
    {
      id: "missing_owner_blocks",
      title: "Missing trusted owner blocks",
      expectedBehavior: "Foundation does not infer ownership from request data.",
      run: async () => {
        const result = await createEnforcement([snapshot()]).enforce({
          requestedCapability: "decision_simulation_basic",
          requestedAt,
        });

        return expectBlocked(result, "trusted_owner_missing");
      },
    },
    {
      id: "missing_capability_blocks",
      title: "Missing capability blocks",
      expectedBehavior: "Capability must be server-selected before enforcement.",
      run: async () => {
        const result = await createEnforcement([snapshot()]).enforce({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedAt,
        });

        return expectBlocked(result, "capability_missing");
      },
    },
    {
      id: "client_tier_blocks",
      title: "Client tier input blocks",
      expectedBehavior: "Client-supplied tier fields are rejected.",
      run: async () => {
        const result = await createEnforcement([snapshot()]).enforce({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedCapability: "decision_simulation_basic",
          requestedAt,
          clientTierFields: { tier: "PROFESSIONAL" },
        });

        return expectBlocked(result, "client_tier_input_rejected");
      },
    },
    {
      id: "client_capability_blocks",
      title: "Client capability input blocks",
      expectedBehavior: "Client-supplied capability fields are rejected.",
      run: async () => {
        const result = await createEnforcement([snapshot()]).enforce({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedCapability: "decision_simulation_basic",
          requestedAt,
          clientCapabilityFields: { requestedCapability: "professional_decision_archive" },
        });

        return expectBlocked(result, "client_capability_input_rejected");
      },
    },
    {
      id: "client_owner_blocks",
      title: "Client owner input blocks",
      expectedBehavior: "Client-supplied owner fields are rejected.",
      run: async () => {
        const result = await createEnforcement([snapshot()]).enforce({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedCapability: "decision_simulation_basic",
          requestedAt,
          clientOwnerFields: { ownerPrincipalId },
        });

        return expectBlocked(result, "client_owner_input_rejected");
      },
    },
    {
      id: "missing_persistence_blocks",
      title: "Missing entitlement persistence blocks",
      expectedBehavior: "Enforcement requires entitlement persistence foundation.",
      run: async () => {
        const result = await createSubscriptionEntitlementEnforcementFoundation({
          enabled: true,
        }).enforce({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedCapability: "decision_simulation_basic",
          requestedAt,
        });

        return expectBlocked(result, "entitlement_persistence_unavailable");
      },
    },
    {
      id: "free_basic_allows",
      title: "FREE basic simulation allows",
      expectedBehavior: "FREE entitlement allows basic decision simulation preflight.",
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
            result.runtimeResult.resolvedTier === "FREE",
          "Expected FREE basic capability to be allowed.",
        );
      },
    },
    {
      id: "free_extended_blocks",
      title: "FREE extended simulation blocks",
      expectedBehavior: "FREE entitlement does not allow extended decision simulation.",
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
          ...expectBlocked(result, "subscription_runtime_blocked"),
          ...issueUnless(
            result.status === "blocked" &&
              result.runtimeResult?.status === "blocked" &&
              result.runtimeResult.reason === "capability_not_supported_by_tier",
            "Expected runtime to block unsupported FREE capability.",
          ),
        ];
      },
    },
    {
      id: "premium_history_allows",
      title: "PREMIUM simulation history allows",
      expectedBehavior: "PREMIUM entitlement allows simulation history capability.",
      run: async () => {
        const result = await enforce({ capability: "simulation_history" });

        return issueUnless(
          result.status === "allowed" &&
            result.runtimeResult.resolvedTier === "PREMIUM",
          "Expected PREMIUM history capability to be allowed.",
        );
      },
    },
    {
      id: "professional_archive_allows",
      title: "PROFESSIONAL archive allows",
      expectedBehavior: "PROFESSIONAL entitlement allows professional archive capability.",
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
            result.runtimeResult.resolvedTier === "PROFESSIONAL",
          "Expected PROFESSIONAL archive capability to be allowed.",
        );
      },
    },
    {
      id: "persistence_resolution_blocks",
      title: "Persistence resolution block propagates",
      expectedBehavior: "Expired or missing entitlement snapshots fail closed.",
      run: async () => {
        const result = await enforce({
          rows: [snapshot({ expiresAt: "2026-01-01T00:00:00.000Z" })],
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
    {
      id: "usage_limit_blocks",
      title: "Usage limit blocks",
      expectedBehavior: "Selected entitlement usage limit fails closed at limit.",
      run: async () => {
        const result = await createEnforcement([snapshot()]).enforce({
          trustedOwnerPrincipalId: ownerPrincipalId,
          requestedCapability: "decision_simulation_extended",
          requestedAt,
          usage: [
            {
              metric: "decision_simulations_per_month",
              used: 250,
              period: "monthly",
            },
          ],
        });

        return [
          ...expectBlocked(result, "subscription_runtime_blocked"),
          ...issueUnless(
            result.status === "blocked" &&
              result.runtimeResult?.status === "blocked" &&
              result.runtimeResult.reason === "usage_limit_exceeded",
            "Expected runtime usage limit to block.",
          ),
        ];
      },
    },
  ];
}

export async function runSubscriptionEntitlementEnforcementValidation(): Promise<SubscriptionEntitlementEnforcementValidationResult> {
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
