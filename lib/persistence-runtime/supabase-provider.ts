import { createClient } from "@supabase/supabase-js";
import type {
  LevioPrincipalRow,
  PersistenceProviderAdapter,
  PersistenceProviderSubjectType,
  SimulationDraftRow,
  SimulationHistoryEntryRow,
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

export type SupabaseSimulationHistoryEntryInsertPayload = {
  owner_principal_id: string;
  owner_principal_type: "registered_user";
  record_id: string;
  event_type: SimulationHistoryEntryRow["event_type"];
  event_timestamp: string;
  event_source: SimulationHistoryEntryRow["event_source"];
  user_visible: boolean;
  event_summary: string | null;
  event_payload: Record<string, unknown>;
  before_reference: string | null;
  after_reference: string | null;
  revision_reference: string | null;
  outcome_snapshot: Record<string, unknown> | null;
  claim_transaction_reference: string | null;
  export_reference: string | null;
  deletion_state: "active";
  retention_rule: string;
  export_eligible: boolean;
  schema_version: number;
};

export type SupabaseSimulationDraftInsertPayload = {
  owner_principal_id: string;
  owner_principal_type: "registered_user";
  draft_status: "active";
  draft_payload: Record<string, unknown>;
  draft_text_snapshot: string | null;
  clarification_answers_snapshot: Record<string, unknown> | null;
  structured_context_snapshot: Record<string, unknown> | null;
  language: string;
  autosave_enabled: boolean;
  originating_surface: string | null;
  expires_at: string;
  deletion_state: "active";
  retention_rule: string;
  export_eligible: boolean;
  schema_version: number;
};

export type SupabaseSimulationDraftUpdatePayload = {
  draft_status?: "active" | "saved";
  draft_payload?: Record<string, unknown>;
  draft_text_snapshot?: string | null;
  clarification_answers_snapshot?: Record<string, unknown> | null;
  structured_context_snapshot?: Record<string, unknown> | null;
  language?: string;
  autosave_enabled?: boolean;
  last_autosaved_at?: string | null;
  expires_at?: string;
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

export type SupabaseSimulationHistoryEntryMutation = {
  select(columns: string): {
    single(): Promise<SupabaseQueryResponse>;
  };
};

export type SupabaseSimulationDraftMutation = {
  eq(column: string, value: string): SupabaseSimulationDraftMutation;
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

export type SupabaseSimulationRecordReadQuery = {
  eq(column: string, value: string): SupabaseSimulationRecordReadQuery;
  order(
    column: string,
    options: {
      ascending: boolean;
    },
  ): SupabaseSimulationRecordReadQuery;
  limit(count: number): Promise<SupabaseQueryResponse>;
  maybeSingle(): Promise<SupabaseQueryResponse>;
};

export type SupabaseSimulationRecordReadClient = {
  from(table: "simulation_records"): {
    select(columns: string): SupabaseSimulationRecordReadQuery;
  };
};

export type SupabaseSimulationHistoryEntryMutationClient = {
  from(table: "simulation_history_entries"): {
    insert(
      payload: SupabaseSimulationHistoryEntryInsertPayload,
    ): SupabaseSimulationHistoryEntryMutation;
  };
};

export type SupabaseSimulationDraftMutationClient = {
  from(table: "simulation_drafts"): {
    insert(payload: SupabaseSimulationDraftInsertPayload): SupabaseSimulationDraftMutation;
    update(payload: SupabaseSimulationDraftUpdatePayload): SupabaseSimulationDraftMutation;
  };
};

export type SupabaseSimulationRecordSaveProvider = PersistenceProviderAdapter & {
  saveSimulationRecord(payload: SupabaseSimulationRecordInsertPayload): Promise<SimulationRecordRow | null>;
};

export type SupabaseSimulationRecordReadProvider = PersistenceProviderAdapter & {
  readSimulationRecord(input: {
    recordId: string;
    ownerPrincipalId: string;
  }): Promise<SimulationRecordRow | null>;
  listSimulationRecords(input: {
    ownerPrincipalId: string;
    limit: number;
  }): Promise<SimulationRecordRow[]>;
};

export type SupabaseSimulationHistoryEntrySaveProvider = PersistenceProviderAdapter & {
  saveSimulationHistoryEntry(
    payload: SupabaseSimulationHistoryEntryInsertPayload,
  ): Promise<SimulationHistoryEntryRow | null>;
};

export type SupabaseSimulationDraftSaveProvider = PersistenceProviderAdapter & {
  saveSimulationDraft(payload: SupabaseSimulationDraftInsertPayload): Promise<SimulationDraftRow | null>;
  updateSimulationDraft(input: {
    draftId: string;
    ownerPrincipalId: string;
    payload: SupabaseSimulationDraftUpdatePayload;
  }): Promise<SimulationDraftRow | null>;
};

export type SupabasePersistenceRuntimeProvider =
  SupabaseSimulationRecordSaveProvider &
    SupabaseSimulationRecordReadProvider &
    SupabaseSimulationHistoryEntrySaveProvider &
    SupabaseSimulationDraftSaveProvider;

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

function isSimulationHistoryEntryRow(value: unknown): value is SimulationHistoryEntryRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.history_entry_id === "string" &&
    typeof row.owner_principal_id === "string" &&
    row.owner_principal_type === "registered_user" &&
    typeof row.record_id === "string" &&
    typeof row.event_type === "string" &&
    typeof row.event_timestamp === "string" &&
    typeof row.event_source === "string" &&
    typeof row.user_visible === "boolean" &&
    nullableString(row.event_summary) &&
    isJsonObject(row.event_payload) &&
    nullableString(row.before_reference) &&
    nullableString(row.after_reference) &&
    nullableString(row.revision_reference) &&
    (isJsonObject(row.outcome_snapshot) || row.outcome_snapshot === null) &&
    nullableString(row.claim_transaction_reference) &&
    nullableString(row.export_reference) &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    typeof row.deletion_state === "string" &&
    typeof row.retention_rule === "string" &&
    typeof row.export_eligible === "boolean" &&
    nullableString(row.deleted_at) &&
    nullableString(row.legal_hold_reason) &&
    typeof row.schema_version === "number"
  );
}

function isSimulationDraftRow(value: unknown): value is SimulationDraftRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.draft_id === "string" &&
    typeof row.owner_principal_id === "string" &&
    row.owner_principal_type === "registered_user" &&
    typeof row.draft_status === "string" &&
    isJsonObject(row.draft_payload) &&
    nullableString(row.draft_text_snapshot) &&
    (isJsonObject(row.clarification_answers_snapshot) ||
      row.clarification_answers_snapshot === null) &&
    (isJsonObject(row.structured_context_snapshot) ||
      row.structured_context_snapshot === null) &&
    typeof row.language === "string" &&
    typeof row.autosave_enabled === "boolean" &&
    nullableString(row.originating_surface) &&
    nullableString(row.converted_record_id) &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    nullableString(row.last_autosaved_at) &&
    typeof row.expires_at === "string" &&
    nullableString(row.discarded_at) &&
    nullableString(row.deleted_at) &&
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
  recordReadClient?: SupabaseSimulationRecordReadClient;
  historyMutationClient?: SupabaseSimulationHistoryEntryMutationClient;
  draftMutationClient?: SupabaseSimulationDraftMutationClient;
}): SupabasePersistenceRuntimeProvider {
  const client = input.client ?? createSupabasePersistenceProviderClient(input.config);
  const mutationClient =
    input.mutationClient ??
    (client as unknown as SupabaseSimulationRecordMutationClient);
  const recordReadClient =
    input.recordReadClient ??
    (client as unknown as SupabaseSimulationRecordReadClient);
  const historyMutationClient =
    input.historyMutationClient ??
    (client as unknown as SupabaseSimulationHistoryEntryMutationClient);
  const draftMutationClient =
    input.draftMutationClient ??
    (client as unknown as SupabaseSimulationDraftMutationClient);

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
    async readSimulationRecord(input) {
      if (!isServerRuntime()) {
        return null;
      }

      const response = await recordReadClient
        .from("simulation_records")
        .select("*")
        .eq("record_id", input.recordId)
        .eq("owner_principal_id", input.ownerPrincipalId)
        .eq("owner_principal_type", "registered_user")
        .eq("record_status", "active")
        .eq("deletion_state", "active")
        .maybeSingle();

      if (response.error || !isSimulationRecordRow(response.data)) {
        return null;
      }

      return response.data;
    },
    async listSimulationRecords(input) {
      if (!isServerRuntime()) {
        return [];
      }

      const response = await recordReadClient
        .from("simulation_records")
        .select("*")
        .eq("owner_principal_id", input.ownerPrincipalId)
        .eq("owner_principal_type", "registered_user")
        .eq("record_status", "active")
        .eq("deletion_state", "active")
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (
        response.error ||
        !Array.isArray(response.data) ||
        !response.data.every(isSimulationRecordRow)
      ) {
        return [];
      }

      return response.data;
    },
    async saveSimulationHistoryEntry(
      payload: SupabaseSimulationHistoryEntryInsertPayload,
    ): Promise<SimulationHistoryEntryRow | null> {
      if (!isServerRuntime()) {
        return null;
      }

      const response = await historyMutationClient
        .from("simulation_history_entries")
        .insert(payload)
        .select("*")
        .single();

      if (response.error || !isSimulationHistoryEntryRow(response.data)) {
        return null;
      }

      return response.data;
    },
    async saveSimulationDraft(
      payload: SupabaseSimulationDraftInsertPayload,
    ): Promise<SimulationDraftRow | null> {
      if (!isServerRuntime()) {
        return null;
      }

      const response = await draftMutationClient
        .from("simulation_drafts")
        .insert(payload)
        .select("*")
        .single();

      if (response.error || !isSimulationDraftRow(response.data)) {
        return null;
      }

      return response.data;
    },
    async updateSimulationDraft(input) {
      if (!isServerRuntime()) {
        return null;
      }

      const response = await draftMutationClient
        .from("simulation_drafts")
        .update(input.payload)
        .eq("draft_id", input.draftId)
        .eq("owner_principal_id", input.ownerPrincipalId)
        .select("*")
        .single();

      if (response.error || !isSimulationDraftRow(response.data)) {
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
