import type { LevioSessionContext } from "../auth/types";
import { createPersistenceRuntimeFoundation } from "./foundation";
import type { PersistenceProviderAdapter } from "./contracts";
import {
  createNoopPersistenceProviderAdapter,
  createPersistenceProviderAdapter,
  persistenceProviderAdapterEvidence,
  validatePersistenceProviderAdapter,
  type PersistenceProviderAdapterBlockedReason,
  type PersistenceProviderAdapterFactoryResult,
  type PersistenceProviderAdapterValidationCaseResult,
  type PersistenceProviderAdapterValidationResult,
} from "./provider-adapter";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: "stage4_1b_registered:9f1e5a40-0a5f-4f76-8c9c-111111111111",
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_2f_validation_session",
  sessionStatus: "active",
  assuranceLevel: "authenticated",
  riskFlags: [],
};

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function expectBlockedFactory(
  result: PersistenceProviderAdapterFactoryResult,
  reason: PersistenceProviderAdapterBlockedReason,
): string[] {
  return result.status === "blocked" && result.reason === reason
    ? []
    : [`Expected blocked provider adapter result with reason ${String(reason)}.`];
}

function expectProviderEvidence(): string[] {
  const evidence = persistenceProviderAdapterEvidence();

  return evidence.stage === "4.2F" &&
    evidence.providerAbstractionOnly &&
    evidence.providerContractValidated &&
    evidence.noopProviderOnly &&
    evidence.serverOnlyBoundaryRequired &&
    evidence.supabaseSdkImported === false &&
    evidence.dbOperationExecuted === false &&
    evidence.sqlExecuted === false &&
    evidence.userOperationExecuted === false &&
    evidence.uiIntegrated === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.authIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.stage42GStarted === false &&
    evidence.stage43Started === false &&
    evidence.stage44Started === false
    ? []
    : ["Stage 4.2F provider adapter evidence changed."];
}

function cases(): ValidationCase[] {
  return [
    {
      id: "factory_returns_noop_adapter",
      title: "Factory returns a no-op provider adapter",
      expectedBehavior: "Expose a provider contract without enabling real persistence operations.",
      run: () => {
        const result = createPersistenceProviderAdapter();

        return [
          ...issueUnless(result.status === "available", "Expected provider adapter to be available."),
          ...issueUnless(
            result.status === "available" && validatePersistenceProviderAdapter(result.adapter),
            "Expected available factory result to include a valid provider adapter.",
          ),
          ...issueUnless(
            result.writesEnabled === false && result.realOperationsEnabled === false,
            "Provider adapter foundation must keep writes and real operations disabled.",
          ),
          ...expectProviderEvidence(),
        ];
      },
    },
    {
      id: "noop_resolver_returns_null",
      title: "No-op resolver does not resolve a principal",
      expectedBehavior: "Fail closed without touching a database or Supabase SDK.",
      run: async () => {
        const adapter = createNoopPersistenceProviderAdapter();
        const principal = await adapter.resolvePrincipalByProviderReference({
          providerReference,
          providerSubjectType: "user",
        });

        return [
          ...issueUnless(principal === null, "Expected no-op adapter to return null principal."),
          ...expectProviderEvidence(),
        ];
      },
    },
    {
      id: "disabled_factory_blocks",
      title: "Disabled factory input blocks adapter creation",
      expectedBehavior: "Fail closed when the adapter layer is explicitly disabled.",
      run: () =>
        expectBlockedFactory(
          createPersistenceProviderAdapter({ enabled: false }),
          "provider_disabled",
        ),
    },
    {
      id: "unsupported_provider_blocks",
      title: "Unsupported provider is rejected",
      expectedBehavior: "Accept only the Stage 4.2F Supabase provider contract.",
      run: () =>
        expectBlockedFactory(
          createPersistenceProviderAdapter({ providerId: "other_provider" }),
          "provider_not_supported",
        ),
    },
    {
      id: "unsupported_adapter_kind_blocks",
      title: "Unsupported adapter kind is rejected",
      expectedBehavior: "Expose only the no-op foundation adapter in this stage.",
      run: () =>
        expectBlockedFactory(
          createPersistenceProviderAdapter({ adapterKind: "real_provider" }),
          "adapter_kind_not_supported",
        ),
    },
    {
      id: "client_boundary_adapter_rejected",
      title: "Client-boundary adapter is rejected",
      expectedBehavior: "Require the provider adapter to remain server-only.",
      run: () => {
        const adapter = {
          providerId: "supabase",
          executionBoundary: "client",
          async resolvePrincipalByProviderReference() {
            return null;
          },
        };

        return issueUnless(
          validatePersistenceProviderAdapter(adapter) === false,
          "Expected client-boundary adapter to be invalid.",
        );
      },
    },
    {
      id: "foundation_accepts_adapter_boundary_without_resolution",
      title: "Foundation can receive adapter boundary without resolving data",
      expectedBehavior: "Bridge to Stage 4.2E preflight while still blocking without principal resolution.",
      run: () => {
        const result = createPersistenceProviderAdapter();

        if (result.status !== "available") {
          return ["Expected provider adapter factory to return an available no-op adapter."];
        }

        const foundation = createPersistenceRuntimeFoundation(result.adapter);
        const preflight = foundation.preflight({
          operation: "read_simulation_record",
          authContext: authenticatedContext,
        });

        return [
          ...issueUnless(
            foundation.providerAdapterConfigured === true,
            "Expected foundation to report configured provider adapter.",
          ),
          ...issueUnless(
            preflight.status === "blocked" && preflight.reason === "resolved_principal_missing",
            "Expected foundation to block when no principal was resolved.",
          ),
          ...issueUnless(
            foundation.writesEnabled === false,
            "Provider adapter boundary must not enable foundation writes.",
          ),
        ];
      },
    },
    {
      id: "real_adapter_shape_not_required",
      title: "Real provider adapter is not required",
      expectedBehavior: "Keep Stage 4.2F independent from Supabase SDK and database execution.",
      run: () => {
        const adapter: PersistenceProviderAdapter = createNoopPersistenceProviderAdapter();

        return [
          ...issueUnless(
            validatePersistenceProviderAdapter(adapter),
            "Expected no-op adapter to satisfy the provider contract.",
          ),
          ...expectProviderEvidence(),
        ];
      },
    },
  ];
}

export async function runPersistenceProviderAdapterFoundationValidation(): Promise<PersistenceProviderAdapterValidationResult> {
  const results: PersistenceProviderAdapterValidationCaseResult[] = [];

  for (const validationCase of cases()) {
    try {
      const issues = await validationCase.run();

      results.push({
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      });
    } catch {
      results.push({
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        passed: false,
        failed: true,
        issues: [
          "Persistence provider adapter foundation validation case threw an uncaught exception.",
        ],
      });
    }
  }

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
