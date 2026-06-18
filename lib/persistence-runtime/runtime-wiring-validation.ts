import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, PersistenceProviderAdapter } from "./contracts";
import {
  initializePersistenceRuntimeWiring,
  type PersistenceRuntimeWiring,
} from "./runtime-wiring";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

export type PersistenceRuntimeWiringValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type PersistenceRuntimeWiringValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PersistenceRuntimeWiringValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_2h_validation_session",
  sessionStatus: "active",
  assuranceLevel: "authenticated",
  riskFlags: [],
};

const signedOutContext: LevioAuthRuntimeContext = {
  identityState: "signed_out",
  error: {
    code: "session_missing",
    message: "No validation session.",
  },
};

const resolvedPrincipal: LevioPrincipalRow = {
  principal_id: principalId,
  principal_type: "registered_user",
  principal_status: "active",
  provider_name: "supabase",
  provider_reference: providerReference,
  provider_reference_status: "active",
  provider_subject_type: "user",
  provider_email_snapshot: null,
  provider_email_verified: false,
  created_at: "2026-06-18T00:00:00.000Z",
  updated_at: "2026-06-18T00:00:00.000Z",
  verified_at: null,
  disabled_at: null,
  deleted_at: null,
  deletion_requested_at: null,
  last_authenticated_at: null,
  last_provider_sync_at: null,
  deletion_state: "active",
  retention_rule: "account_lifecycle",
  recovery_state: null,
  locale_preference: null,
  metadata_version: null,
  legal_hold_reason: null,
  schema_version: 1,
};

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function createResolvingAdapter(calls: { count: number }): PersistenceProviderAdapter {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference() {
      calls.count += 1;
      return resolvedPrincipal;
    },
  };
}

function expectWiringEvidence(runtime: PersistenceRuntimeWiring): string[] {
  const evidence = runtime.evidence;

  return evidence.stage === "4.2H" &&
    evidence.foundationComposed &&
    evidence.dependencyInjectionSupported &&
    evidence.runtimeInitializationOnly &&
    evidence.principalResolutionOnly &&
    evidence.preflightOnly &&
    evidence.writesEnabled === false &&
    evidence.simulationCrudEnabled === false &&
    evidence.draftOperationsEnabled === false &&
    evidence.historyOperationsEnabled === false &&
    evidence.uiIntegrated === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.authIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.stage42IStarted === false &&
    evidence.stage43Started === false &&
    evidence.stage44Started === false
    ? []
    : ["Stage 4.2H runtime wiring evidence changed."];
}

function cases(): ValidationCase[] {
  return [
    {
      id: "default_wiring_blocks_without_provider_config",
      title: "Default wiring blocks without provider config",
      expectedBehavior: "Initialize fail-closed when Supabase provider env is not enabled.",
      run: () => {
        const runtime = initializePersistenceRuntimeWiring();

        return [
          ...issueUnless(runtime.status === "blocked", "Expected default runtime wiring to block."),
          ...issueUnless(
            runtime.providerAdapterConfigured === false,
            "Expected no provider adapter when provider config is absent.",
          ),
          ...expectWiringEvidence(runtime),
        ];
      },
    },
    {
      id: "dependency_injection_composes_runtime",
      title: "Dependency injection composes runtime",
      expectedBehavior: "Accept an injected provider adapter without reading external runtime state.",
      run: () => {
        const calls = { count: 0 };
        const runtime = initializePersistenceRuntimeWiring({
          providerAdapter: createResolvingAdapter(calls),
        });

        return [
          ...issueUnless(runtime.status === "ready", "Expected injected runtime wiring to be ready."),
          ...issueUnless(
            runtime.foundation.providerAdapterConfigured === true,
            "Expected foundation to receive provider adapter.",
          ),
          ...issueUnless(runtime.writesEnabled === false, "Runtime wiring must keep writes disabled."),
          ...expectWiringEvidence(runtime),
        ];
      },
    },
    {
      id: "resolve_principal_uses_provider_adapter",
      title: "Resolve principal uses provider adapter",
      expectedBehavior: "Resolve a principal through the wired provider adapter only.",
      run: async () => {
        const calls = { count: 0 };
        const runtime = initializePersistenceRuntimeWiring({
          providerAdapter: createResolvingAdapter(calls),
        });
        const result = await runtime.resolvePrincipal({
          providerReference,
          providerSubjectType: "user",
        });

        return [
          ...issueUnless(result.status === "resolved", "Expected principal resolution to succeed."),
          ...issueUnless(calls.count === 1, "Expected provider adapter to be called once."),
        ];
      },
    },
    {
      id: "preflight_resolves_principal_for_authenticated_context",
      title: "Preflight resolves principal for authenticated context",
      expectedBehavior: "Wire provider resolution into foundation preflight without enabling operations.",
      run: async () => {
        const calls = { count: 0 };
        const runtime = initializePersistenceRuntimeWiring({
          providerAdapter: createResolvingAdapter(calls),
        });
        const result = await runtime.preflight({
          operation: "resolve_principal",
          authContext: authenticatedContext,
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected resolve_principal preflight to pass."),
          ...issueUnless(
            result.execution === "preflight_only",
            "Expected runtime wiring to remain preflight-only.",
          ),
          ...issueUnless(calls.count === 1, "Expected provider resolution during preflight."),
        ];
      },
    },
    {
      id: "signed_out_preflight_does_not_resolve_provider",
      title: "Signed-out preflight does not resolve provider",
      expectedBehavior: "Do not call provider resolution when auth context is not authenticated.",
      run: async () => {
        const calls = { count: 0 };
        const runtime = initializePersistenceRuntimeWiring({
          providerAdapter: createResolvingAdapter(calls),
        });
        const result = await runtime.preflight({
          operation: "resolve_principal",
          authContext: signedOutContext,
        });

        return [
          ...issueUnless(result.status === "blocked", "Expected signed-out preflight to block."),
          ...issueUnless(calls.count === 0, "Signed-out context must not call provider adapter."),
        ];
      },
    },
    {
      id: "mutating_preflight_remains_blocked",
      title: "Mutating preflight remains blocked",
      expectedBehavior: "Runtime wiring must not enable writes or simulation CRUD.",
      run: async () => {
        const calls = { count: 0 };
        const runtime = initializePersistenceRuntimeWiring({
          providerAdapter: createResolvingAdapter(calls),
        });
        const result = await runtime.preflight({
          operation: "create_simulation_record",
          authContext: authenticatedContext,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "foundation_only_write_disabled",
            "Expected mutating operation to remain blocked by foundation.",
          ),
          ...issueUnless(calls.count === 1, "Expected principal resolution before write denial."),
        ];
      },
    },
  ];
}

export async function runPersistenceRuntimeWiringValidation(): Promise<PersistenceRuntimeWiringValidationResult> {
  const results: PersistenceRuntimeWiringValidationCaseResult[] = [];

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
        issues: ["Persistence runtime wiring validation case threw an uncaught exception."],
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
