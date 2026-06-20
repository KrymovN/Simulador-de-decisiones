import { createClient } from "@supabase/supabase-js";
import type {
  SimulationDraftRow,
  SimulationHistoryEntryRow,
  SimulationRecordRow,
} from "../persistence-runtime";
import type {
  UserDataControlsPersistenceReadProvider,
  UserDataControlsPersistenceReadProviderResult,
} from "./persistence-read-adapter";

export const USER_DATA_CONTROLS_PRODUCTION_READ_PROVIDER_VERSION =
  "4.3X-production-read-provider-foundation.1" as const;
export const USER_DATA_CONTROLS_PRODUCTION_READ_PROVIDER_MODE =
  "production_read_provider_foundation_only" as const;

const MAX_READ_ROWS = 500;

const SIMULATION_RECORD_SELECT = [
  "record_id",
  "owner_principal_id",
  "owner_principal_type",
  "record_status",
  "source_type",
  "simulation_response_version",
  "decision_contract_version",
  "language",
  "safety_classification",
  "recommendation_state",
  "content_sensitivity",
  "originating_draft_id",
  "parent_record_id",
  "revision_label",
  "created_at",
  "updated_at",
  "archived_at",
  "deleted_at",
  "last_exported_at",
  "deletion_state",
  "retention_rule",
  "export_eligible",
  "legal_hold_reason",
  "schema_version",
].join(",");

const SIMULATION_DRAFT_SELECT = [
  "draft_id",
  "owner_principal_id",
  "owner_principal_type",
  "draft_status",
  "language",
  "autosave_enabled",
  "originating_surface",
  "converted_record_id",
  "created_at",
  "updated_at",
  "last_autosaved_at",
  "expires_at",
  "discarded_at",
  "deleted_at",
  "deletion_state",
  "retention_rule",
  "export_eligible",
  "legal_hold_reason",
  "schema_version",
].join(",");

const SIMULATION_HISTORY_SELECT = [
  "history_entry_id",
  "owner_principal_id",
  "owner_principal_type",
  "record_id",
  "event_type",
  "event_timestamp",
  "event_source",
  "user_visible",
  "event_summary",
  "before_reference",
  "after_reference",
  "revision_reference",
  "claim_transaction_reference",
  "export_reference",
  "created_at",
  "updated_at",
  "deletion_state",
  "retention_rule",
  "export_eligible",
  "deleted_at",
  "legal_hold_reason",
  "schema_version",
].join(",");

export type UserDataControlsProductionReadProviderVersion =
  typeof USER_DATA_CONTROLS_PRODUCTION_READ_PROVIDER_VERSION;
export type UserDataControlsProductionReadProviderMode =
  typeof USER_DATA_CONTROLS_PRODUCTION_READ_PROVIDER_MODE;

export type UserDataControlsProductionReadProviderConfig = {
  enabled: boolean;
  supabaseUrl?: string;
  serviceRoleKey?: string;
  client?: UserDataControlsProductionReadClient;
};

export type UserDataControlsProductionReadProviderConfigDisabledReason =
  | "provider_disabled"
  | "provider_config_missing"
  | "provider_config_invalid"
  | "server_boundary_required";

export type UserDataControlsProductionReadProviderConfigResult =
  | {
      status: "enabled";
      provider: "supabase";
      config: Required<
        Pick<UserDataControlsProductionReadProviderConfig, "enabled" | "supabaseUrl" | "serviceRoleKey">
      >;
    }
  | {
      status: "disabled";
      provider: "supabase";
      reason: UserDataControlsProductionReadProviderConfigDisabledReason;
      message: string;
    };

export type UserDataControlsProductionReadProviderEvidence = {
  stage: "4.3X";
  productionReadProviderFoundationOnly: true;
  serverOnlyBoundaryRequired: true;
  serviceRoleRequired: true;
  ownerScopedReadsOnly: true;
  canonicalPrincipalRequired: true;
  clientOwnerInputAccepted: false;
  minimalPlanningColumnsOnly: true;
  mapsDecisionSimulationArtifactsOnly: true;
  rawSimulationPayloadRead: false;
  conversationHistoryRead: false;
  chatLogsRead: false;
  runtimeWritesEnabled: false;
  databaseWritesExecuted: false;
  exportFilesCreated: false;
  exportStorageConnected: false;
  deletionExecuted: false;
  hardDeleteExecuted: false;
  routeEnablementChanged: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  simulatorIntegrated: false;
  openAiIntegrated: false;
  billingIntegrated: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  productBehaviorChanged: false;
  rollback: "disable_LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED_or_remove_stage_4_3x_provider_exports";
};

export type UserDataControlsProductionReadProvider = UserDataControlsPersistenceReadProvider & {
  version: UserDataControlsProductionReadProviderVersion;
  mode: UserDataControlsProductionReadProviderMode;
  enabled: boolean;
  writesEnabled: false;
  evidence: UserDataControlsProductionReadProviderEvidence;
};

export type UserDataControlsProductionReadQueryResponse = {
  data: unknown;
  error: { message?: string; code?: string } | null;
};

export type UserDataControlsProductionReadQuery = {
  eq(column: string, value: string | boolean): UserDataControlsProductionReadQuery;
  order(column: string, options: { ascending: boolean }): UserDataControlsProductionReadQuery;
  limit(count: number): Promise<UserDataControlsProductionReadQueryResponse>;
};

export type UserDataControlsProductionReadClient = {
  from(
    table: "simulation_records" | "simulation_drafts" | "simulation_history_entries",
  ): {
    select(columns: string): UserDataControlsProductionReadQuery;
  };
};

type ConfigEnv = Record<string, string | undefined>;
type MinimalRecordRow = Pick<
  SimulationRecordRow,
  | "record_id"
  | "owner_principal_id"
  | "owner_principal_type"
  | "record_status"
  | "source_type"
  | "simulation_response_version"
  | "decision_contract_version"
  | "language"
  | "safety_classification"
  | "recommendation_state"
  | "content_sensitivity"
  | "originating_draft_id"
  | "parent_record_id"
  | "revision_label"
  | "created_at"
  | "updated_at"
  | "archived_at"
  | "deleted_at"
  | "last_exported_at"
  | "deletion_state"
  | "retention_rule"
  | "export_eligible"
  | "legal_hold_reason"
  | "schema_version"
>;
type MinimalDraftRow = Pick<
  SimulationDraftRow,
  | "draft_id"
  | "owner_principal_id"
  | "owner_principal_type"
  | "draft_status"
  | "language"
  | "autosave_enabled"
  | "originating_surface"
  | "converted_record_id"
  | "created_at"
  | "updated_at"
  | "last_autosaved_at"
  | "expires_at"
  | "discarded_at"
  | "deleted_at"
  | "deletion_state"
  | "retention_rule"
  | "export_eligible"
  | "legal_hold_reason"
  | "schema_version"
>;
type MinimalHistoryRow = Pick<
  SimulationHistoryEntryRow,
  | "history_entry_id"
  | "owner_principal_id"
  | "owner_principal_type"
  | "record_id"
  | "event_type"
  | "event_timestamp"
  | "event_source"
  | "user_visible"
  | "event_summary"
  | "before_reference"
  | "after_reference"
  | "revision_reference"
  | "claim_transaction_reference"
  | "export_reference"
  | "created_at"
  | "updated_at"
  | "deletion_state"
  | "retention_rule"
  | "export_eligible"
  | "deleted_at"
  | "legal_hold_reason"
  | "schema_version"
>;

function isEnabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function isServerRuntime(): boolean {
  return typeof window === "undefined";
}

function disabled(
  reason: UserDataControlsProductionReadProviderConfigDisabledReason,
  message: string,
): UserDataControlsProductionReadProviderConfigResult {
  return {
    status: "disabled",
    provider: "supabase",
    reason,
    message,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

function arrayData(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function ownerPrincipalIdUsable(value: string): boolean {
  return value.trim().length > 0;
}

function rowsOwnedByPrincipal(
  principalId: string,
  rows: Array<{ owner_principal_id: string; owner_principal_type: string }>,
): boolean {
  return rows.every(
    (row) =>
      row.owner_principal_id === principalId &&
      row.owner_principal_type === "registered_user",
  );
}

function queryResponseBlockedMessage(message: string): string {
  return message.trim() || "Production read provider failed to read owner-scoped rows.";
}

function isMinimalRecordRow(value: unknown): value is MinimalRecordRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.record_id === "string" &&
    typeof value.owner_principal_id === "string" &&
    value.owner_principal_type === "registered_user" &&
    typeof value.record_status === "string" &&
    typeof value.source_type === "string" &&
    typeof value.simulation_response_version === "string" &&
    typeof value.decision_contract_version === "string" &&
    typeof value.language === "string" &&
    typeof value.safety_classification === "string" &&
    typeof value.recommendation_state === "string" &&
    typeof value.content_sensitivity === "string" &&
    nullableString(value.originating_draft_id) &&
    nullableString(value.parent_record_id) &&
    nullableString(value.revision_label) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string" &&
    nullableString(value.archived_at) &&
    nullableString(value.deleted_at) &&
    nullableString(value.last_exported_at) &&
    typeof value.deletion_state === "string" &&
    typeof value.retention_rule === "string" &&
    typeof value.export_eligible === "boolean" &&
    nullableString(value.legal_hold_reason) &&
    typeof value.schema_version === "number"
  );
}

function isMinimalDraftRow(value: unknown): value is MinimalDraftRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.draft_id === "string" &&
    typeof value.owner_principal_id === "string" &&
    value.owner_principal_type === "registered_user" &&
    typeof value.draft_status === "string" &&
    typeof value.language === "string" &&
    typeof value.autosave_enabled === "boolean" &&
    nullableString(value.originating_surface) &&
    nullableString(value.converted_record_id) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string" &&
    nullableString(value.last_autosaved_at) &&
    typeof value.expires_at === "string" &&
    nullableString(value.discarded_at) &&
    nullableString(value.deleted_at) &&
    typeof value.deletion_state === "string" &&
    typeof value.retention_rule === "string" &&
    typeof value.export_eligible === "boolean" &&
    nullableString(value.legal_hold_reason) &&
    typeof value.schema_version === "number"
  );
}

function isMinimalHistoryRow(value: unknown): value is MinimalHistoryRow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.history_entry_id === "string" &&
    typeof value.owner_principal_id === "string" &&
    value.owner_principal_type === "registered_user" &&
    typeof value.record_id === "string" &&
    typeof value.event_type === "string" &&
    typeof value.event_timestamp === "string" &&
    typeof value.event_source === "string" &&
    typeof value.user_visible === "boolean" &&
    nullableString(value.event_summary) &&
    nullableString(value.before_reference) &&
    nullableString(value.after_reference) &&
    nullableString(value.revision_reference) &&
    nullableString(value.claim_transaction_reference) &&
    nullableString(value.export_reference) &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string" &&
    typeof value.deletion_state === "string" &&
    typeof value.retention_rule === "string" &&
    typeof value.export_eligible === "boolean" &&
    nullableString(value.deleted_at) &&
    nullableString(value.legal_hold_reason) &&
    typeof value.schema_version === "number"
  );
}

function toSimulationRecordRow(row: MinimalRecordRow): SimulationRecordRow {
  return {
    ...row,
    title: null,
    user_note: null,
    user_input_snapshot: {},
    deterministic_output_snapshot: {},
    metadata: {},
    safety_flags: {},
    clarification_snapshot: null,
    decision_model_snapshot: null,
    confidence_summary: null,
  };
}

function toSimulationDraftRow(row: MinimalDraftRow): SimulationDraftRow {
  return {
    ...row,
    draft_payload: {},
    draft_text_snapshot: null,
    clarification_answers_snapshot: null,
    structured_context_snapshot: null,
  };
}

function toSimulationHistoryEntryRow(row: MinimalHistoryRow): SimulationHistoryEntryRow {
  return {
    ...row,
    event_payload: {},
    outcome_snapshot: null,
  };
}

export function userDataControlsProductionReadProviderSafetyEvidence(): UserDataControlsProductionReadProviderEvidence {
  return {
    stage: "4.3X",
    productionReadProviderFoundationOnly: true,
    serverOnlyBoundaryRequired: true,
    serviceRoleRequired: true,
    ownerScopedReadsOnly: true,
    canonicalPrincipalRequired: true,
    clientOwnerInputAccepted: false,
    minimalPlanningColumnsOnly: true,
    mapsDecisionSimulationArtifactsOnly: true,
    rawSimulationPayloadRead: false,
    conversationHistoryRead: false,
    chatLogsRead: false,
    runtimeWritesEnabled: false,
    databaseWritesExecuted: false,
    exportFilesCreated: false,
    exportStorageConnected: false,
    deletionExecuted: false,
    hardDeleteExecuted: false,
    routeEnablementChanged: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    simulatorIntegrated: false,
    openAiIntegrated: false,
    billingIntegrated: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    productBehaviorChanged: false,
    rollback:
      "disable_LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED_or_remove_stage_4_3x_provider_exports",
  };
}

export function validateUserDataControlsProductionReadProviderConfig(
  config: Required<
    Pick<UserDataControlsProductionReadProviderConfig, "enabled" | "supabaseUrl" | "serviceRoleKey">
  >,
): UserDataControlsProductionReadProviderConfigResult {
  if (!isServerRuntime()) {
    return disabled(
      "server_boundary_required",
      "User Data Controls production read provider may only run on the server.",
    );
  }

  if (!config.enabled) {
    return disabled(
      "provider_disabled",
      "User Data Controls production read provider is disabled by controlled rollout configuration.",
    );
  }

  if (!config.supabaseUrl || !config.serviceRoleKey) {
    return disabled(
      "provider_config_missing",
      "User Data Controls production read provider requires a URL and server-only service role key.",
    );
  }

  try {
    new URL(config.supabaseUrl);
  } catch {
    return disabled(
      "provider_config_invalid",
      "User Data Controls production read provider URL is invalid.",
    );
  }

  return {
    status: "enabled",
    provider: "supabase",
    config,
  };
}

export function readUserDataControlsProductionReadProviderConfig(
  env: ConfigEnv = process.env,
): UserDataControlsProductionReadProviderConfigResult {
  const enabled = isEnabledFlag(env.LEVIO_USER_DATA_CONTROLS_READ_PROVIDER_ENABLED);
  const supabaseUrl = env.LEVIO_PERSISTENCE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey =
    env.LEVIO_PERSISTENCE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";

  return validateUserDataControlsProductionReadProviderConfig({
    enabled,
    supabaseUrl,
    serviceRoleKey,
  });
}

export function createUserDataControlsProductionReadClient(input: {
  supabaseUrl: string;
  serviceRoleKey: string;
}): UserDataControlsProductionReadClient {
  return createClient(input.supabaseUrl, input.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Levio-Runtime": USER_DATA_CONTROLS_PRODUCTION_READ_PROVIDER_VERSION,
      },
    },
  }) as unknown as UserDataControlsProductionReadClient;
}

function blockedRows<TRow>(
  reason: "provider_read_failed" | "provider_owner_scope_failed" | "provider_scope_not_supported",
  message: string,
): UserDataControlsPersistenceReadProviderResult<TRow> {
  return {
    status: "blocked",
    reason,
    message,
  };
}

async function readRows(input: {
  client: UserDataControlsProductionReadClient;
  table: "simulation_records" | "simulation_drafts" | "simulation_history_entries";
  columns: string;
  ownerPrincipalId: string;
  historyOnly?: boolean;
}): Promise<UserDataControlsProductionReadQueryResponse> {
  let query = input.client
    .from(input.table)
    .select(input.columns)
    .eq("owner_principal_id", input.ownerPrincipalId)
    .eq("owner_principal_type", "registered_user");

  if (input.historyOnly) {
    query = query.eq("user_visible", true);
  }

  return query.order("created_at", { ascending: true }).limit(MAX_READ_ROWS);
}

export function createUserDataControlsProductionReadProvider(
  config: UserDataControlsProductionReadProviderConfig,
): UserDataControlsProductionReadProvider {
  const configResult = !config.enabled
    ? disabled(
        "provider_disabled",
        "User Data Controls production read provider is disabled by controlled rollout configuration.",
      )
    : config.client
    ? ({
        status: "enabled",
        provider: "supabase",
        config: {
          enabled: config.enabled,
          supabaseUrl: config.supabaseUrl ?? "https://injected-client.supabase.co",
          serviceRoleKey: config.serviceRoleKey ?? "injected-service-role",
        },
      } as const)
    : validateUserDataControlsProductionReadProviderConfig({
        enabled: config.enabled,
        supabaseUrl: config.supabaseUrl ?? "",
        serviceRoleKey: config.serviceRoleKey ?? "",
      });
  const client =
    configResult.status === "enabled"
      ? config.client ??
        createUserDataControlsProductionReadClient({
          supabaseUrl: configResult.config.supabaseUrl,
          serviceRoleKey: configResult.config.serviceRoleKey,
        })
      : undefined;

  function providerDisabledMessage(): string {
    return configResult.status === "disabled"
      ? configResult.message
      : "User Data Controls production read provider is not ready.";
  }

  async function listSimulationRecords(input: {
    ownerPrincipalId: string;
    requestedAt: string;
  }) {
    if (!client || configResult.status !== "enabled") {
      return blockedRows<SimulationRecordRow>("provider_scope_not_supported", providerDisabledMessage());
    }

    if (!ownerPrincipalIdUsable(input.ownerPrincipalId)) {
      return blockedRows<SimulationRecordRow>(
        "provider_scope_not_supported",
        "Production read provider requires a canonical owner principal id.",
      );
    }

    const response = await readRows({
      client,
      table: "simulation_records",
      columns: SIMULATION_RECORD_SELECT,
      ownerPrincipalId: input.ownerPrincipalId,
    });

    if (response.error) {
      return blockedRows<SimulationRecordRow>(
        "provider_read_failed",
        queryResponseBlockedMessage(response.error.message ?? ""),
      );
    }

    const rows = arrayData(response.data);

    if (!rows || !rows.every(isMinimalRecordRow)) {
      return blockedRows<SimulationRecordRow>(
        "provider_read_failed",
        "Production read provider received malformed simulation_records rows.",
      );
    }

    if (!rowsOwnedByPrincipal(input.ownerPrincipalId, rows)) {
      return blockedRows<SimulationRecordRow>(
        "provider_owner_scope_failed",
        "Production read provider returned simulation_records outside the canonical owner scope.",
      );
    }

    return {
      status: "ready" as const,
      rows: rows.map(toSimulationRecordRow),
    };
  }

  async function listSimulationDrafts(input: {
    ownerPrincipalId: string;
    requestedAt: string;
  }) {
    if (!client || configResult.status !== "enabled") {
      return blockedRows<SimulationDraftRow>("provider_scope_not_supported", providerDisabledMessage());
    }

    if (!ownerPrincipalIdUsable(input.ownerPrincipalId)) {
      return blockedRows<SimulationDraftRow>(
        "provider_scope_not_supported",
        "Production read provider requires a canonical owner principal id.",
      );
    }

    const response = await readRows({
      client,
      table: "simulation_drafts",
      columns: SIMULATION_DRAFT_SELECT,
      ownerPrincipalId: input.ownerPrincipalId,
    });

    if (response.error) {
      return blockedRows<SimulationDraftRow>(
        "provider_read_failed",
        queryResponseBlockedMessage(response.error.message ?? ""),
      );
    }

    const rows = arrayData(response.data);

    if (!rows || !rows.every(isMinimalDraftRow)) {
      return blockedRows<SimulationDraftRow>(
        "provider_read_failed",
        "Production read provider received malformed simulation_drafts rows.",
      );
    }

    if (!rowsOwnedByPrincipal(input.ownerPrincipalId, rows)) {
      return blockedRows<SimulationDraftRow>(
        "provider_owner_scope_failed",
        "Production read provider returned simulation_drafts outside the canonical owner scope.",
      );
    }

    return {
      status: "ready" as const,
      rows: rows.map(toSimulationDraftRow),
    };
  }

  async function listSimulationHistoryEntries(input: {
    ownerPrincipalId: string;
    requestedAt: string;
  }) {
    if (!client || configResult.status !== "enabled") {
      return blockedRows<SimulationHistoryEntryRow>(
        "provider_scope_not_supported",
        providerDisabledMessage(),
      );
    }

    if (!ownerPrincipalIdUsable(input.ownerPrincipalId)) {
      return blockedRows<SimulationHistoryEntryRow>(
        "provider_scope_not_supported",
        "Production read provider requires a canonical owner principal id.",
      );
    }

    const response = await readRows({
      client,
      table: "simulation_history_entries",
      columns: SIMULATION_HISTORY_SELECT,
      ownerPrincipalId: input.ownerPrincipalId,
      historyOnly: true,
    });

    if (response.error) {
      return blockedRows<SimulationHistoryEntryRow>(
        "provider_read_failed",
        queryResponseBlockedMessage(response.error.message ?? ""),
      );
    }

    const rows = arrayData(response.data);

    if (!rows || !rows.every(isMinimalHistoryRow)) {
      return blockedRows<SimulationHistoryEntryRow>(
        "provider_read_failed",
        "Production read provider received malformed simulation_history_entries rows.",
      );
    }

    if (!rowsOwnedByPrincipal(input.ownerPrincipalId, rows)) {
      return blockedRows<SimulationHistoryEntryRow>(
        "provider_owner_scope_failed",
        "Production read provider returned simulation_history_entries outside the canonical owner scope.",
      );
    }

    return {
      status: "ready" as const,
      rows: rows.map(toSimulationHistoryEntryRow),
    };
  }

  return {
    version: USER_DATA_CONTROLS_PRODUCTION_READ_PROVIDER_VERSION,
    mode: USER_DATA_CONTROLS_PRODUCTION_READ_PROVIDER_MODE,
    enabled: configResult.status === "enabled",
    writesEnabled: false,
    executionBoundary: "server_only",
    evidence: userDataControlsProductionReadProviderSafetyEvidence(),
    listSimulationRecords,
    listSimulationDrafts,
    listSimulationHistoryEntries,
  };
}

export function createUserDataControlsProductionReadProviderFromEnv(
  env: ConfigEnv = process.env,
): UserDataControlsProductionReadProvider {
  const configResult = readUserDataControlsProductionReadProviderConfig(env);

  if (configResult.status === "disabled") {
    return createUserDataControlsProductionReadProvider({
      enabled: false,
    });
  }

  return createUserDataControlsProductionReadProvider({
    enabled: true,
    supabaseUrl: configResult.config.supabaseUrl,
    serviceRoleKey: configResult.config.serviceRoleKey,
  });
}
