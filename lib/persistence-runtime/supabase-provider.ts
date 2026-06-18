import { createClient } from "@supabase/supabase-js";
import type {
  LevioPrincipalRow,
  PersistenceProviderAdapter,
  PersistenceProviderSubjectType,
  SimulationRecordRow,
} from "./contracts";

export const SUPABASE_PERSISTENCE_PROVIDER_VERSION =
  "4.2G-supabase-provider.1" as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRINCIPAL_SELECT = [
  "principal_id",
  "principal_type",
  "principal_status",
  "provider_name",
  "provider_reference",
  "provider_reference_status",
  "provider_subject_type",
  "provider_email_snapshot",
  "provider_email_verified",
  "created_at",
  "updated_at",
  "verified_at",
  "disabled_at",
  "deleted_at",
  "deletion_requested_at",
  "last_authenticated_at",
  "last_provider_sync_at",
  "deletion_state",
  "retention_rule",
  "recovery_state",
  "locale_preference",
  "metadata_version",
  "legal_hold_reason",
  "schema_version",
].join(",");

export type SupabasePersistenceProviderConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

export type SupabasePersistenceProviderConfigDisabledReason =
  | "provider_disabled"
  | "provider_config_missing"
  | "provider_config_invalid"
  | "server_boundary_required";

export type SupabasePersistenceProviderConfigResult =
  | {
      status: "enabled";
      provider: "supabase";
      config: SupabasePersistenceProviderConfig;
    }
  | {
      status: "disabled";
      provider: "supabase";
      reason: SupabasePersistenceProviderConfigDisabledReason;
      message: string;
    };

export type SupabasePersistenceProviderEvidence = {
  stage: "4.2G";
  supabaseSdkIntegrated: true;
  serverOnlyBoundaryRequired: true;
  serviceRoleRequired: true;
  principalResolutionOnly: true;
  simulationCrudEnabled: false;
  draftOperationsEnabled: false;
  historyOperationsEnabled: false;
  uiIntegrated: false;
  apiRouteIntegrated: false;
  authIntegrated: false;
  simulatorIntegrated: false;
  runtimeWired: false;
  schemaChanged: false;
  migrationsChanged: false;
  stage42HStarted: false;
  stage43Started: false;
  stage44Started: false;
  rollback: "remove_supabase_persistence_provider_exports";
};

export type SupabaseQueryError = {
  message?: string;
  code?: string;
};

export type SupabaseQueryResponse = {
  data: unknown;
  error: SupabaseQueryError | null;
};

export type SupabaseSimulationRecordInsertPayload = {
  owner_principal_id: string;
  owner_principal_type: "registered_user";
  record_status: "active";
  source_type: "explicit_save";
  title: string | null;
  user_note: string | null;
  user_input_snapshot: Record<string, unknown>;
  deterministic_output_snapshot: Record<string, unknown>;
  metadata: Record<string, unknown>;
  safety_flags: Record<string, unknown>;
  clarification_snapshot: Record<string, unknown> | null;
  decision_model_snapshot: Record<string, unknown> | null;
  confidence_summary: Record<string, unknown> | null;
  simulation_response_version: string;
  decision_contract_version: string;
  language: string;
  safety_classification: string;
  recommendation_state: string;
  content_sensitivity: string;
  deletion_state: "active";
  retention_rule: string;
  export_eligible: boolean;
  schema_version: number;
};

export type SupabasePrincipalQuery = {
  eq(column: string, value: string): SupabasePrincipalQuery;
  maybeSingle(): Promise<SupabaseQueryResponse>;
};

export type SupabaseSimulationRecordMutation = {
  select(columns: string): {
    single(): Promise<SupabaseQueryResponse>;
  };
};

export type SupabasePrincipalResolutionClient = {
  from(table: "levio_principals"): {
    select(columns: string): SupabasePrincipalQuery;
  };
};

export type SupabaseSimulationRecordMutationClient = {
  from(table: "simulation_records"): {
    insert(payload: SupabaseSimulationRecordInsertPayload): SupabaseSimulationRecordMutation;
  };
};

export type SupabaseSimulationRecordSaveProvider = PersistenceProviderAdapter & {
  saveSimulationRecord(payload: SupabaseSimulationRecordInsertPayload): Promise<SimulationRecordRow | null>;
};

export type SupabasePersistenceConnectivityValidationResult = {
  status: "passed" | "blocked";
  version: typeof SUPABASE_PERSISTENCE_PROVIDER_VERSION;
  reason?: "probe_not_enabled" | "provider_reference_missing" | "principal_not_resolved";
  principalId?: string;
  evidence: SupabasePersistenceProviderEvidence;
};

type ConfigEnv = Record<string, string | undefined>;

function isEnabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function isServerRuntime(): boolean {
  return typeof window === "undefined";
}

function disabled(
  reason: SupabasePersistenceProviderConfigDisabledReason,
  message: string,
): SupabasePersistenceProviderConfigResult {
  return {
    status: "disabled",
    provider: "supabase",
    reason,
    message,
  };
}

function evidence(): SupabasePersistenceProviderEvidence {
  return {
    stage: "4.2G",
    supabaseSdkIntegrated: true,
    serverOnlyBoundaryRequired: true,
    serviceRoleRequired: true,
    principalResolutionOnly: true,
    simulationCrudEnabled: false,
    draftOperationsEnabled: false,
    historyOperationsEnabled: false,
    uiIntegrated: false,
    apiRouteIntegrated: false,
    authIntegrated: false,
    simulatorIntegrated: false,
    runtimeWired: false,
    schemaChanged: false,
    migrationsChanged: false,
    stage42HStarted: false,
    stage43Started: false,
    stage44Started: false,
    rollback: "remove_supabase_persistence_provider_exports",
  };
}

function normalizeProviderReference(value: string): string | undefined {
  const trimmed = value.trim();
  const withoutProviderPrefix = trimmed.startsWith("supabase:")
    ? trimmed.slice("supabase:".length)
    : trimmed;

  return UUID_PATTERN.test(withoutProviderPrefix) ? withoutProviderPrefix : undefined;
}

function nullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isPrincipalRow(value: unknown): value is LevioPrincipalRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.principal_id === "string" &&
    row.principal_type === "registered_user" &&
    typeof row.principal_status === "string" &&
    row.provider_name === "supabase" &&
    typeof row.provider_reference === "string" &&
    typeof row.provider_reference_status === "string" &&
    row.provider_subject_type === "user" &&
    nullableString(row.provider_email_snapshot) &&
    typeof row.provider_email_verified === "boolean" &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    nullableString(row.verified_at) &&
    nullableString(row.disabled_at) &&
    nullableString(row.deleted_at) &&
    nullableString(row.deletion_requested_at) &&
    nullableString(row.last_authenticated_at) &&
    nullableString(row.last_provider_sync_at) &&
    typeof row.deletion_state === "string" &&
    typeof row.retention_rule === "string" &&
    nullableString(row.recovery_state) &&
    nullableString(row.locale_preference) &&
    (typeof row.metadata_version === "number" || row.metadata_version === null) &&
    nullableString(row.legal_hold_reason) &&
    typeof row.schema_version === "number"
  );
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSimulationRecordRow(value: unknown): value is SimulationRecordRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.record_id === "string" &&
    typeof row.owner_principal_id === "string" &&
    row.owner_principal_type === "registered_user" &&
    typeof row.record_status === "string" &&
    typeof row.source_type === "string" &&
    nullableString(row.title) &&
    nullableString(row.user_note) &&
    isJsonObject(row.user_input_snapshot) &&
    isJsonObject(row.deterministic_output_snapshot) &&
    isJsonObject(row.metadata) &&
    isJsonObject(row.safety_flags) &&
    (isJsonObject(row.clarification_snapshot) || row.clarification_snapshot === null) &&
    (isJsonObject(row.decision_model_snapshot) || row.decision_model_snapshot === null) &&
    (isJsonObject(row.confidence_summary) || row.confidence_summary === null) &&
    typeof row.simulation_response_version === "string" &&
    typeof row.decision_contract_version === "string" &&
    typeof row.language === "string" &&
    typeof row.safety_classification === "string" &&
    typeof row.recommendation_state === "string" &&
    typeof row.content_sensitivity === "string" &&
    (typeof row.originating_draft_id === "string" || row.originating_draft_id === null) &&
    (typeof row.parent_record_id === "string" || row.parent_record_id === null) &&
    (typeof row.revision_label === "string" || row.revision_label === null) &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    nullableString(row.archived_at) &&
    nullableString(row.deleted_at) &&
    nullableString(row.last_exported_at) &&
    typeof row.deletion_state === "string" &&
    typeof row.retention_rule === "string" &&
    typeof row.export_eligible === "boolean" &&
    nullableString(row.legal_hold_reason) &&
    typeof row.schema_version === "number"
  );
}

export function supabasePersistenceProviderEvidence(): SupabasePersistenceProviderEvidence {
  return evidence();
}

export function validateSupabasePersistenceProviderConfig(
  config: SupabasePersistenceProviderConfig,
): SupabasePersistenceProviderConfigResult {
  if (!isServerRuntime()) {
    return disabled(
      "server_boundary_required",
      "Supabase persistence provider may only be configured on the server.",
    );
  }

  if (!config.supabaseUrl || !config.serviceRoleKey) {
    return disabled(
      "provider_config_missing",
      "Supabase persistence provider configuration is missing.",
    );
  }

  try {
    new URL(config.supabaseUrl);
  } catch {
    return disabled(
      "provider_config_invalid",
      "Supabase persistence provider URL is invalid.",
    );
  }

  return {
    status: "enabled",
    provider: "supabase",
    config,
  };
}

export function readSupabasePersistenceProviderConfig(
  env: ConfigEnv = process.env,
): SupabasePersistenceProviderConfigResult {
  if (!isServerRuntime()) {
    return disabled(
      "server_boundary_required",
      "Supabase persistence provider is server-only.",
    );
  }

  if (!isEnabledFlag(env.LEVIO_PERSISTENCE_SUPABASE_PROVIDER_ENABLED)) {
    return disabled(
      "provider_disabled",
      "Supabase persistence provider is disabled by default.",
    );
  }

  const supabaseUrl = env.LEVIO_PERSISTENCE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    env.LEVIO_PERSISTENCE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return disabled(
      "provider_config_missing",
      "Supabase persistence provider requires a URL and server-only service role key.",
    );
  }

  return validateSupabasePersistenceProviderConfig({
    supabaseUrl,
    serviceRoleKey,
  });
}

export function createSupabasePersistenceProviderClient(
  config: SupabasePersistenceProviderConfig,
): SupabasePrincipalResolutionClient {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Levio-Runtime": SUPABASE_PERSISTENCE_PROVIDER_VERSION,
      },
    },
  }) as unknown as SupabasePrincipalResolutionClient;
}

export function createSupabasePersistenceProviderAdapter(input: {
  config: SupabasePersistenceProviderConfig;
  client?: SupabasePrincipalResolutionClient;
  mutationClient?: SupabaseSimulationRecordMutationClient;
}): SupabaseSimulationRecordSaveProvider {
  const client = input.client ?? createSupabasePersistenceProviderClient(input.config);
  const mutationClient =
    input.mutationClient ??
    (client as unknown as SupabaseSimulationRecordMutationClient);

  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference(resolveInput: {
      providerReference: string;
      providerSubjectType: PersistenceProviderSubjectType;
    }): Promise<LevioPrincipalRow | null> {
      if (!isServerRuntime() || resolveInput.providerSubjectType !== "user") {
        return null;
      }

      const providerReference = normalizeProviderReference(resolveInput.providerReference);

      if (!providerReference) {
        return null;
      }

      const response = await client
        .from("levio_principals")
        .select(PRINCIPAL_SELECT)
        .eq("provider_name", "supabase")
        .eq("provider_reference", providerReference)
        .eq("provider_subject_type", resolveInput.providerSubjectType)
        .eq("provider_reference_status", "active")
        .eq("principal_type", "registered_user")
        .eq("principal_status", "active")
        .eq("deletion_state", "active")
        .maybeSingle();

      if (response.error || !isPrincipalRow(response.data)) {
        return null;
      }

      return response.data;
    },
    async saveSimulationRecord(
      payload: SupabaseSimulationRecordInsertPayload,
    ): Promise<SimulationRecordRow | null> {
      if (!isServerRuntime()) {
        return null;
      }

      const response = await mutationClient
        .from("simulation_records")
        .insert(payload)
        .select("*")
        .single();

      if (response.error || !isSimulationRecordRow(response.data)) {
        return null;
      }

      return response.data;
    },
  };
}

export async function validateSupabasePersistenceProviderConnectivity(input: {
  adapter: PersistenceProviderAdapter;
  providerReference?: string;
  executeProbe?: boolean;
}): Promise<SupabasePersistenceConnectivityValidationResult> {
  if (input.executeProbe !== true) {
    return {
      status: "blocked",
      version: SUPABASE_PERSISTENCE_PROVIDER_VERSION,
      reason: "probe_not_enabled",
      evidence: evidence(),
    };
  }

  if (!input.providerReference) {
    return {
      status: "blocked",
      version: SUPABASE_PERSISTENCE_PROVIDER_VERSION,
      reason: "provider_reference_missing",
      evidence: evidence(),
    };
  }

  const principal = await input.adapter.resolvePrincipalByProviderReference({
    providerReference: input.providerReference,
    providerSubjectType: "user",
  });

  if (!principal) {
    return {
      status: "blocked",
      version: SUPABASE_PERSISTENCE_PROVIDER_VERSION,
      reason: "principal_not_resolved",
      evidence: evidence(),
    };
  }

  return {
    status: "passed",
    version: SUPABASE_PERSISTENCE_PROVIDER_VERSION,
    principalId: principal.principal_id,
    evidence: evidence(),
  };
}
