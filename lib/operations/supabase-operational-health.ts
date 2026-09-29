import { timingSafeEqual } from "node:crypto";

import {
  createSupabasePersistenceProviderClient,
  readSupabasePersistenceProviderConfig,
  type SupabasePersistenceProviderConfigResult,
  type SupabaseQueryError,
} from "../persistence-runtime/supabase-provider";

export const SUPABASE_OPERATIONAL_HEALTH_VERSION =
  "supabase-operational-health-v1" as const;

type SupabaseHealthQueryResponse = {
  data: unknown;
  error: SupabaseQueryError | null;
  count?: number | null;
};

export type SupabaseOperationalHealthClient = {
  from(table: "levio_principals"): {
    select(
      columns: "principal_id",
      options: {
        count: "exact";
        head: true;
      },
    ): Promise<SupabaseHealthQueryResponse>;
  };
};

export type SupabaseOperationalHealthResult =
  | {
      status: "healthy";
      version: typeof SUPABASE_OPERATIONAL_HEALTH_VERSION;
      databaseReachable: true;
      dataReturned: false;
      writesPerformed: 0;
    }
  | {
      status: "unhealthy";
      version: typeof SUPABASE_OPERATIONAL_HEALTH_VERSION;
      reason: "provider_unavailable" | "query_failed";
      databaseReachable: false;
      dataReturned: false;
      writesPerformed: 0;
    };

type SupabaseOperationalHealthDependencies = {
  configResult?: SupabasePersistenceProviderConfigResult;
  client?: SupabaseOperationalHealthClient;
};

function unhealthy(
  reason: "provider_unavailable" | "query_failed",
): SupabaseOperationalHealthResult {
  return {
    status: "unhealthy",
    version: SUPABASE_OPERATIONAL_HEALTH_VERSION,
    reason,
    databaseReachable: false,
    dataReturned: false,
    writesPerformed: 0,
  };
}

export async function checkSupabaseOperationalHealth(
  dependencies: SupabaseOperationalHealthDependencies = {},
): Promise<SupabaseOperationalHealthResult> {
  const configResult =
    dependencies.configResult ?? readSupabasePersistenceProviderConfig();

  if (configResult.status !== "enabled") {
    return unhealthy("provider_unavailable");
  }

  const client =
    dependencies.client ??
    (createSupabasePersistenceProviderClient(
      configResult.config,
    ) as unknown as SupabaseOperationalHealthClient);

  try {
    const response = await client
      .from("levio_principals")
      .select("principal_id", { count: "exact", head: true });

    if (response.error) {
      return unhealthy("query_failed");
    }

    return {
      status: "healthy",
      version: SUPABASE_OPERATIONAL_HEALTH_VERSION,
      databaseReachable: true,
      dataReturned: false,
      writesPerformed: 0,
    };
  } catch {
    return unhealthy("query_failed");
  }
}

function authorizedByCronSecret(
  authorization: string | null,
  cronSecret: string | undefined,
): boolean {
  if (!authorization || !cronSecret || cronSecret.length < 16) {
    return false;
  }

  const supplied = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${cronSecret}`);

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function statusResponse(ok: boolean, status: 200 | 401 | 503): Response {
  return Response.json(
    { ok },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function handleSupabaseOperationalHealthRequest(input: {
  request: Request;
  cronSecret: string | undefined;
  check?: () => Promise<SupabaseOperationalHealthResult>;
}): Promise<Response> {
  if (
    !authorizedByCronSecret(
      input.request.headers.get("authorization"),
      input.cronSecret,
    )
  ) {
    return statusResponse(false, 401);
  }

  try {
    const result = await (input.check ?? checkSupabaseOperationalHealth)();
    return result.status === "healthy"
      ? statusResponse(true, 200)
      : statusResponse(false, 503);
  } catch {
    return statusResponse(false, 503);
  }
}
