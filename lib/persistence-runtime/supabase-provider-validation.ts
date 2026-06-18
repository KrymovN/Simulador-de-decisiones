import { createPersistenceRuntimeFoundation } from "./foundation";
import {
  createPersistenceProviderAdapter,
  type PersistenceProviderAdapterBlockedReason,
  type PersistenceProviderAdapterFactoryResult,
} from "./provider-adapter";
import type { LevioPrincipalRow } from "./contracts";
import {
  createSupabasePersistenceProviderAdapter,
  readSupabasePersistenceProviderConfig,
  supabasePersistenceProviderEvidence,
  validateSupabasePersistenceProviderConnectivity,
  validateSupabasePersistenceProviderConfig,
  type SupabasePrincipalQuery,
  type SupabasePrincipalResolutionClient,
  type SupabaseQueryResponse,
} from "./supabase-provider";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

type MockClientCalls = {
  table?: string;
  columns?: string;
  filters: string[];
};

export type SupabasePersistenceProviderValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SupabasePersistenceProviderValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SupabasePersistenceProviderValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";

const config = {
  supabaseUrl: "https://stage-42g-validation.supabase.co",
  serviceRoleKey: "stage_4_2g_validation_service_role_key",
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

function expectBlockedFactory(
  result: PersistenceProviderAdapterFactoryResult,
  reason: PersistenceProviderAdapterBlockedReason,
): string[] {
  return result.status === "blocked" && result.reason === reason
    ? []
    : [`Expected blocked provider adapter result with reason ${String(reason)}.`];
}

function expectSupabaseEvidence(): string[] {
  const evidence = supabasePersistenceProviderEvidence();

  return evidence.stage === "4.2G" &&
    evidence.supabaseSdkIntegrated &&
    evidence.serverOnlyBoundaryRequired &&
    evidence.serviceRoleRequired &&
    evidence.principalResolutionOnly &&
    evidence.simulationCrudEnabled === false &&
    evidence.draftOperationsEnabled === false &&
    evidence.historyOperationsEnabled === false &&
    evidence.uiIntegrated === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.authIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.runtimeWired === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.stage42HStarted === false &&
    evidence.stage43Started === false &&
    evidence.stage44Started === false
    ? []
    : ["Stage 4.2G Supabase provider evidence changed."];
}

function createMockClient(
  response: SupabaseQueryResponse,
  calls: MockClientCalls,
): SupabasePrincipalResolutionClient {
  const query: SupabasePrincipalQuery = {
    eq(column: string, value: string) {
      calls.filters.push(`${column}:${value}`);
      return query;
    },
    async maybeSingle() {
      return response;
    },
  };

  return {
    from(table: "levio_principals") {
      calls.table = table;

      return {
        select(columns: string) {
          calls.columns = columns;
          return query;
        },
      };
    },
  };
}

function cases(): ValidationCase[] {
  return [
    {
      id: "env_config_disabled_by_default",
      title: "Environment config is disabled by default",
      expectedBehavior: "Do not create a Supabase provider unless explicitly enabled.",
      run: () => {
        const result = readSupabasePersistenceProviderConfig({});

        return [
          ...issueUnless(
            result.status === "disabled" && result.reason === "provider_disabled",
            "Expected missing enable flag to disable Supabase provider.",
          ),
          ...expectSupabaseEvidence(),
        ];
      },
    },
    {
      id: "config_requires_service_role_key",
      title: "Config requires server-only service role key",
      expectedBehavior: "Fail closed when server-only provider credentials are missing.",
      run: () => {
        const result = readSupabasePersistenceProviderConfig({
          LEVIO_PERSISTENCE_SUPABASE_PROVIDER_ENABLED: "true",
          LEVIO_PERSISTENCE_SUPABASE_URL: config.supabaseUrl,
        });

        return issueUnless(
          result.status === "disabled" && result.reason === "provider_config_missing",
          "Expected missing service role key to block provider config.",
        );
      },
    },
    {
      id: "config_rejects_invalid_url",
      title: "Config rejects invalid URL",
      expectedBehavior: "Fail closed on malformed Supabase provider URL.",
      run: () => {
        const result = validateSupabasePersistenceProviderConfig({
          supabaseUrl: "not-a-url",
          serviceRoleKey: config.serviceRoleKey,
        });

        return issueUnless(
          result.status === "disabled" && result.reason === "provider_config_invalid",
          "Expected invalid Supabase URL to block provider config.",
        );
      },
    },
    {
      id: "factory_returns_supabase_adapter_with_explicit_config",
      title: "Factory returns Supabase adapter with explicit config",
      expectedBehavior: "Expose real provider adapter without enabling persistence CRUD.",
      run: () => {
        const calls: MockClientCalls = { filters: [] };
        const result = createPersistenceProviderAdapter({
          adapterKind: "supabase",
          supabaseConfig: config,
          supabaseClient: createMockClient({ data: resolvedPrincipal, error: null }, calls),
        });

        return [
          ...issueUnless(result.status === "available", "Expected Supabase provider adapter."),
          ...issueUnless(
            result.status === "available" && result.principalResolutionEnabled,
            "Expected principal resolution to be enabled for Supabase adapter.",
          ),
          ...issueUnless(
            result.writesEnabled === false && result.realOperationsEnabled === false,
            "Supabase provider adapter must not enable persistence CRUD operations.",
          ),
        ];
      },
    },
    {
      id: "factory_blocks_supabase_without_config",
      title: "Factory blocks Supabase adapter without config",
      expectedBehavior: "Fail closed when explicit config or enabled env is absent.",
      run: () =>
        expectBlockedFactory(
          createPersistenceProviderAdapter({ adapterKind: "supabase" }),
          "provider_disabled",
        ),
    },
    {
      id: "resolver_reads_principal_only",
      title: "Resolver reads principal mapping only",
      expectedBehavior: "Query only levio_principals and return the stable Levio principal.",
      run: async () => {
        const calls: MockClientCalls = { filters: [] };
        const adapter = createSupabasePersistenceProviderAdapter({
          config,
          client: createMockClient({ data: resolvedPrincipal, error: null }, calls),
        });
        const principal = await adapter.resolvePrincipalByProviderReference({
          providerReference: `supabase:${providerReference}`,
          providerSubjectType: "user",
        });

        return [
          ...issueUnless(principal?.principal_id === principalId, "Expected resolved principal."),
          ...issueUnless(calls.table === "levio_principals", "Expected levio_principals lookup only."),
          ...issueUnless(
            calls.filters.includes(`provider_reference:${providerReference}`),
            "Expected provider_reference filter.",
          ),
          ...issueUnless(
            calls.filters.includes("deletion_state:active"),
            "Expected active deletion_state filter.",
          ),
          ...expectSupabaseEvidence(),
        ];
      },
    },
    {
      id: "resolver_rejects_invalid_provider_reference",
      title: "Resolver rejects invalid provider reference",
      expectedBehavior: "Fail closed before any provider query.",
      run: async () => {
        const calls: MockClientCalls = { filters: [] };
        const adapter = createSupabasePersistenceProviderAdapter({
          config,
          client: createMockClient({ data: resolvedPrincipal, error: null }, calls),
        });
        const principal = await adapter.resolvePrincipalByProviderReference({
          providerReference: "not-a-uuid",
          providerSubjectType: "user",
        });

        return [
          ...issueUnless(principal === null, "Expected invalid provider reference to return null."),
          ...issueUnless(calls.table === undefined, "Invalid provider reference must not query Supabase."),
        ];
      },
    },
    {
      id: "resolver_returns_null_on_query_error",
      title: "Resolver returns null on query error",
      expectedBehavior: "Fail closed when Supabase principal lookup errors.",
      run: async () => {
        const calls: MockClientCalls = { filters: [] };
        const adapter = createSupabasePersistenceProviderAdapter({
          config,
          client: createMockClient(
            { data: null, error: { message: "validation query failed" } },
            calls,
          ),
        });
        const principal = await adapter.resolvePrincipalByProviderReference({
          providerReference,
          providerSubjectType: "user",
        });

        return issueUnless(principal === null, "Expected query error to return null principal.");
      },
    },
    {
      id: "connectivity_validation_skips_without_probe",
      title: "Connectivity validation is explicit",
      expectedBehavior: "Do not contact Supabase unless a probe is explicitly requested.",
      run: async () => {
        const calls: MockClientCalls = { filters: [] };
        const adapter = createSupabasePersistenceProviderAdapter({
          config,
          client: createMockClient({ data: resolvedPrincipal, error: null }, calls),
        });
        const result = await validateSupabasePersistenceProviderConnectivity({ adapter });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "probe_not_enabled",
            "Expected connectivity validation to block without explicit probe.",
          ),
          ...issueUnless(calls.table === undefined, "Skipped connectivity validation must not query."),
        ];
      },
    },
    {
      id: "foundation_bridge_remains_preflight_only",
      title: "Foundation bridge remains preflight-only",
      expectedBehavior: "Supabase principal resolution can feed preflight without enabling writes.",
      run: async () => {
        const calls: MockClientCalls = { filters: [] };
        const adapter = createSupabasePersistenceProviderAdapter({
          config,
          client: createMockClient({ data: resolvedPrincipal, error: null }, calls),
        });
        const principal = await adapter.resolvePrincipalByProviderReference({
          providerReference,
          providerSubjectType: "user",
        });
        const foundation = createPersistenceRuntimeFoundation(adapter);
        const result = foundation.preflight({
          operation: "list_simulation_records",
          authContext: {
            identityState: "authenticated",
            principal: {
              principalId: `stage4_1b_registered:${providerReference}`,
              principalType: "registered_user",
              providerReference: `supabase:${providerReference}`,
            },
            sessionId: "stage_4_2g_validation_session",
            sessionStatus: "active",
            assuranceLevel: "authenticated",
            riskFlags: [],
          },
          resolvedPrincipal: principal,
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected owner preflight to pass."),
          ...issueUnless(
            result.execution === "preflight_only",
            "Expected foundation to remain preflight-only.",
          ),
          ...issueUnless(foundation.writesEnabled === false, "Foundation writes must remain disabled."),
        ];
      },
    },
  ];
}

export async function runSupabasePersistenceProviderValidation(): Promise<SupabasePersistenceProviderValidationResult> {
  const results: SupabasePersistenceProviderValidationCaseResult[] = [];

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
        issues: ["Supabase persistence provider validation case threw an uncaught exception."],
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
