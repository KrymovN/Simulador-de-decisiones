import {
  checkSupabaseOperationalHealth,
  handleSupabaseOperationalHealthRequest,
  SUPABASE_OPERATIONAL_HEALTH_VERSION,
  type SupabaseOperationalHealthClient,
  type SupabaseOperationalHealthResult,
} from "./supabase-operational-health";

type ValidationCase = {
  id: string;
  passed: boolean;
  detail: string;
};

export type SupabaseOperationalHealthValidationResult = {
  passed: boolean;
  cases: ValidationCase[];
  summary: {
    passed: number;
    total: number;
    databaseWrites: 0;
    userDataMutations: 0;
    providerOperations: 0;
  };
};

const ENABLED_CONFIG = {
  status: "enabled" as const,
  provider: "supabase" as const,
  config: {
    supabaseUrl: "https://example.supabase.co",
    serviceRoleKey: "server-only-test-key",
  },
};

const HEALTHY_RESULT: SupabaseOperationalHealthResult = {
  status: "healthy",
  version: SUPABASE_OPERATIONAL_HEALTH_VERSION,
  databaseReachable: true,
  dataReturned: false,
  writesPerformed: 0,
};

async function responseBody(response: Response): Promise<Record<string, unknown>> {
  return JSON.parse(await response.text()) as Record<string, unknown>;
}

export async function runSupabaseOperationalHealthValidation(): Promise<SupabaseOperationalHealthValidationResult> {
  const cases: ValidationCase[] = [];
  const add = (id: string, passed: boolean, detail: string) => {
    cases.push({ id, passed, detail });
  };

  let checkCalls = 0;
  const missingAuth = await handleSupabaseOperationalHealthRequest({
    request: new Request("https://levio.es/api/operations/supabase-health"),
    cronSecret: "test-cron-secret",
    check: async () => {
      checkCalls += 1;
      return HEALTHY_RESULT;
    },
  });
  add(
    "missing-authorization-fails-closed",
    missingAuth.status === 401 &&
      checkCalls === 0 &&
      JSON.stringify(await responseBody(missingAuth)) === JSON.stringify({ ok: false }),
    "A request without scheduler authorization must return 401 before any database query.",
  );

  const invalidAuth = await handleSupabaseOperationalHealthRequest({
    request: new Request("https://levio.es/api/operations/supabase-health", {
      headers: { authorization: "Bearer wrong-secret" },
    }),
    cronSecret: "test-cron-secret",
    check: async () => {
      checkCalls += 1;
      return HEALTHY_RESULT;
    },
  });
  add(
    "invalid-authorization-fails-closed",
    invalidAuth.status === 401 && checkCalls === 0,
    "A request with an invalid scheduler secret must return 401 before any database query.",
  );

  const missingConfiguredSecret = await handleSupabaseOperationalHealthRequest({
    request: new Request("https://levio.es/api/operations/supabase-health", {
      headers: { authorization: "Bearer any-value" },
    }),
    cronSecret: undefined,
    check: async () => {
      checkCalls += 1;
      return HEALTHY_RESULT;
    },
  });
  add(
    "missing-server-secret-fails-closed",
    missingConfiguredSecret.status === 401 && checkCalls === 0,
    "A missing server-side CRON_SECRET must disable privileged execution.",
  );

  const weakConfiguredSecret = await handleSupabaseOperationalHealthRequest({
    request: new Request("https://levio.es/api/operations/supabase-health", {
      headers: { authorization: "Bearer short" },
    }),
    cronSecret: "short",
    check: async () => {
      checkCalls += 1;
      return HEALTHY_RESULT;
    },
  });
  add(
    "weak-server-secret-fails-closed",
    weakConfiguredSecret.status === 401 && checkCalls === 0,
    "A CRON_SECRET shorter than the platform recommendation must not authorize execution.",
  );

  const healthyResponse = await handleSupabaseOperationalHealthRequest({
    request: new Request("https://levio.es/api/operations/supabase-health", {
      headers: { authorization: "Bearer test-cron-secret" },
    }),
    cronSecret: "test-cron-secret",
    check: async () => HEALTHY_RESULT,
  });
  const healthyBody = await responseBody(healthyResponse);
  add(
    "healthy-response-is-minimal",
    healthyResponse.status === 200 &&
      healthyResponse.headers.get("cache-control") === "no-store" &&
      JSON.stringify(healthyBody) === JSON.stringify({ ok: true }),
    "A successful query must return only a non-cacheable health boolean.",
  );

  const unhealthyResponse = await handleSupabaseOperationalHealthRequest({
    request: new Request("https://levio.es/api/operations/supabase-health", {
      headers: { authorization: "Bearer test-cron-secret" },
    }),
    cronSecret: "test-cron-secret",
    check: async () => ({
      status: "unhealthy",
      version: SUPABASE_OPERATIONAL_HEALTH_VERSION,
      reason: "query_failed",
      databaseReachable: false,
      dataReturned: false,
      writesPerformed: 0,
    }),
  });
  add(
    "database-failure-is-minimal-and-unhealthy",
    unhealthyResponse.status === 503 &&
      JSON.stringify(await responseBody(unhealthyResponse)) ===
        JSON.stringify({ ok: false }),
    "An unavailable database must return 503 without error or user-data details.",
  );

  const thrownResponse = await handleSupabaseOperationalHealthRequest({
    request: new Request("https://levio.es/api/operations/supabase-health", {
      headers: { authorization: "Bearer test-cron-secret" },
    }),
    cronSecret: "test-cron-secret",
    check: async () => {
      throw new Error("synthetic connection failure");
    },
  });
  add(
    "unexpected-failure-fails-closed",
    thrownResponse.status === 503 &&
      JSON.stringify(await responseBody(thrownResponse)) ===
        JSON.stringify({ ok: false }),
    "Unexpected failures must return a minimal 503 response.",
  );

  let selectedTable: string | undefined;
  let selectedColumns: string | undefined;
  let selectedOptions: Record<string, unknown> | undefined;
  const readOnlyClient: SupabaseOperationalHealthClient = {
    from(table) {
      selectedTable = table;
      return {
        async select(columns, options) {
          selectedColumns = columns;
          selectedOptions = options;
          return { data: null, error: null, count: 0 };
        },
      };
    },
  };
  const readOnlyResult = await checkSupabaseOperationalHealth({
    configResult: ENABLED_CONFIG,
    client: readOnlyClient,
  });
  add(
    "read-only-database-query",
    readOnlyResult.status === "healthy" &&
      selectedTable === "levio_principals" &&
      selectedColumns === "principal_id" &&
      selectedOptions?.count === "exact" &&
      selectedOptions?.head === true &&
      readOnlyResult.dataReturned === false &&
      readOnlyResult.writesPerformed === 0,
    "The health operation must execute a HEAD/count SELECT and return no rows.",
  );

  const queryFailure = await checkSupabaseOperationalHealth({
    configResult: ENABLED_CONFIG,
    client: {
      from() {
        return {
          async select() {
            return { data: null, error: { code: "08006" } };
          },
        };
      },
    },
  });
  add(
    "query-error-is-unhealthy",
    queryFailure.status === "unhealthy" &&
      queryFailure.reason === "query_failed" &&
      queryFailure.writesPerformed === 0,
    "A Supabase query error must not be accepted as healthy or trigger a fallback write.",
  );

  const providerUnavailable = await checkSupabaseOperationalHealth({
    configResult: {
      status: "disabled",
      provider: "supabase",
      reason: "provider_disabled",
      message: "disabled for validation",
    },
  });
  add(
    "disabled-provider-is-unhealthy",
    providerUnavailable.status === "unhealthy" &&
      providerUnavailable.reason === "provider_unavailable" &&
      providerUnavailable.writesPerformed === 0,
    "Missing or disabled persistence configuration must fail closed.",
  );

  return {
    passed: cases.every((item) => item.passed),
    cases,
    summary: {
      passed: cases.filter((item) => item.passed).length,
      total: cases.length,
      databaseWrites: 0,
      userDataMutations: 0,
      providerOperations: 0,
    },
  };
}
