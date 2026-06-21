import type {
  LevioPrincipalRow,
  SimulationDraftRow,
  SimulationHistoryEntryRow,
  SimulationRecordRow,
} from "../persistence-runtime";
import type {
  DeletionAccountState,
  DeletionLifecycleState,
  DeletionParentSnapshot,
  DeletionResourceSnapshot,
  DeletionScope,
  ExportDataCategory,
  ExportRequestScope,
  ExportResourceSnapshot,
} from "./contracts";
import type {
  UserDataControlsArtifactSourceBlockedReason,
  UserDataControlsCanonicalPrincipal,
  UserDataControlsDeletionArtifactSourceResult,
  UserDataControlsExportArtifactSourceResult,
  UserDataControlsOwnerScopedArtifactSource,
} from "./server-workflow";

export const USER_DATA_CONTROLS_PERSISTENCE_READ_ADAPTER_VERSION =
  "4.3-persistence-read-adapter-foundation.1" as const;
export const USER_DATA_CONTROLS_PERSISTENCE_READ_ADAPTER_MODE =
  "persistence_read_adapter_foundation_only" as const;

export type UserDataControlsPersistenceReadAdapterVersion =
  typeof USER_DATA_CONTROLS_PERSISTENCE_READ_ADAPTER_VERSION;
export type UserDataControlsPersistenceReadAdapterMode =
  typeof USER_DATA_CONTROLS_PERSISTENCE_READ_ADAPTER_MODE;

export type UserDataControlsPersistenceReadPurpose =
  | "export"
  | "deletion"
  | "deletion_parent_context";

export type UserDataControlsPersistenceReadProviderBlockedReason =
  | "provider_read_failed"
  | "provider_owner_scope_failed"
  | "provider_scope_not_supported";

export type UserDataControlsPersistenceReadProviderResult<TRow> =
  | {
      status: "ready";
      rows: TRow[];
    }
  | {
      status: "blocked";
      reason: UserDataControlsPersistenceReadProviderBlockedReason;
      message: string;
    };

export type UserDataControlsPersistenceReadProvider = {
  executionBoundary: "server_only";
  listSimulationRecords(input: {
    ownerPrincipalId: string;
    purpose: UserDataControlsPersistenceReadPurpose;
    requestedAt: string;
  }): Promise<UserDataControlsPersistenceReadProviderResult<SimulationRecordRow>>;
  listSimulationDrafts(input: {
    ownerPrincipalId: string;
    purpose: UserDataControlsPersistenceReadPurpose;
    requestedAt: string;
  }): Promise<UserDataControlsPersistenceReadProviderResult<SimulationDraftRow>>;
  listSimulationHistoryEntries(input: {
    ownerPrincipalId: string;
    purpose: UserDataControlsPersistenceReadPurpose;
    requestedAt: string;
  }): Promise<UserDataControlsPersistenceReadProviderResult<SimulationHistoryEntryRow>>;
};

export type UserDataControlsPersistenceReadAdapterSafetyEvidence = {
  stage: "4.3";
  persistenceReadAdapterOnly: true;
  foundationOnly: true;
  serverOnlyBoundaryRequired: true;
  canonicalPrincipalRequired: true;
  ownerScopedReadsOnly: true;
  clientOwnerInputAccepted: false;
  mapsDecisionSimulationArtifactsOnly: true;
  conversationHistoryCreated: false;
  chatLogsCreated: false;
  runtimeWritesEnabled: false;
  databaseWritesExecuted: false;
  exportFilesCreated: false;
  exportStorageConnected: false;
  deletionExecuted: false;
  hardDeleteExecuted: false;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  simulatorIntegrated: false;
  openAiIntegrated: false;
  billingIntegrated: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  productBehaviorChanged: false;
  rollback: "disable_persistence_read_adapter_or_remove_stage_4_3_exports";
};

export type UserDataControlsPersistenceReadAdapterConfig = {
  enabled: boolean;
  readProvider?: UserDataControlsPersistenceReadProvider;
};

export type UserDataControlsPersistenceReadAdapter = UserDataControlsOwnerScopedArtifactSource & {
  version: UserDataControlsPersistenceReadAdapterVersion;
  mode: UserDataControlsPersistenceReadAdapterMode;
  enabled: boolean;
  writesEnabled: false;
  evidence: UserDataControlsPersistenceReadAdapterSafetyEvidence;
};

const DEFAULT_ACCOUNT_STATE: DeletionAccountState = {
  activeSubscription: false,
  subscriptionStatus: "none",
};

export function userDataControlsPersistenceReadAdapterSafetyEvidence(): UserDataControlsPersistenceReadAdapterSafetyEvidence {
  return {
    stage: "4.3",
    persistenceReadAdapterOnly: true,
    foundationOnly: true,
    serverOnlyBoundaryRequired: true,
    canonicalPrincipalRequired: true,
    ownerScopedReadsOnly: true,
    clientOwnerInputAccepted: false,
    mapsDecisionSimulationArtifactsOnly: true,
    conversationHistoryCreated: false,
    chatLogsCreated: false,
    runtimeWritesEnabled: false,
    databaseWritesExecuted: false,
    exportFilesCreated: false,
    exportStorageConnected: false,
    deletionExecuted: false,
    hardDeleteExecuted: false,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    simulatorIntegrated: false,
    openAiIntegrated: false,
    billingIntegrated: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    productBehaviorChanged: false,
    rollback: "disable_persistence_read_adapter_or_remove_stage_4_3_exports",
  };
}

function sourceBlocked(
  reason: UserDataControlsArtifactSourceBlockedReason,
  message: string,
): Exclude<UserDataControlsExportArtifactSourceResult, { status: "ready" }> {
  return {
    status: "blocked",
    reason,
    message,
  };
}

function deletionSourceBlocked(
  reason: UserDataControlsArtifactSourceBlockedReason,
  message: string,
): Exclude<UserDataControlsDeletionArtifactSourceResult, { status: "ready" }> {
  return {
    status: "blocked",
    reason,
    message,
  };
}

function isValidTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function exportScopeEmpty(scope: ExportRequestScope): boolean {
  return !(
    scope.includePrincipalMetadata ||
    scope.includeSavedSimulations ||
    scope.includeSimulationDrafts ||
    scope.includeSimulationHistory
  );
}

function deletionScopeEmpty(scope: DeletionScope): boolean {
  return !(
    scope.includePrincipalRecord ||
    scope.includeSavedSimulations ||
    scope.includeSimulationDrafts ||
    scope.includeSimulationHistory
  );
}

function principalIsUsable(principal: UserDataControlsCanonicalPrincipal): boolean {
  return (
    principal.principalType === "registered_user" &&
    principal.row.principal_id === principal.principalId &&
    principal.row.principal_type === "registered_user" &&
    principal.row.principal_status === "active" &&
    principal.row.provider_reference_status === "active" &&
    principal.row.deletion_state === "active"
  );
}

function rowsOwnedByPrincipal(
  principalId: string,
  rows: Array<SimulationRecordRow | SimulationDraftRow | SimulationHistoryEntryRow>,
): boolean {
  return rows.every(
    (row) =>
      row.owner_principal_id === principalId &&
      row.owner_principal_type === "registered_user",
  );
}

function recordLifecycleState(row: SimulationRecordRow): ExportResourceSnapshot["lifecycleState"] {
  return row.record_status;
}

function deletionLifecycleStateFromRecord(row: SimulationRecordRow): DeletionLifecycleState {
  return row.record_status;
}

function deletionLifecycleStateFromDraft(row: SimulationDraftRow): DeletionLifecycleState {
  return row.draft_status;
}

function deletionLifecycleStateFromPrincipal(row: LevioPrincipalRow): DeletionLifecycleState {
  if (row.deletion_state !== "active") {
    return row.deletion_state;
  }

  if (row.principal_status === "disabled") {
    return "restricted";
  }

  return row.principal_status;
}

function deletionLifecycleStateFromHistory(
  row: SimulationHistoryEntryRow,
): DeletionLifecycleState {
  return row.deletion_state;
}

function principalExportSnapshot(
  principal: UserDataControlsCanonicalPrincipal,
): ExportResourceSnapshot {
  return {
    resourceId: principal.principalId,
    resourceCategory: "levio_principal_metadata",
    ownerPrincipalId: principal.principalId,
    ownerPrincipalType: "registered_user",
    exportEligible: true,
    deletionState: principal.row.deletion_state,
    lifecycleState: deletionLifecycleStateFromPrincipal(principal.row),
    dataCategories: ["principal_profile", "lifecycle_metadata"],
    createdAt: principal.row.created_at,
    updatedAt: principal.row.updated_at,
    deletedAt: principal.row.deleted_at,
    retentionRule: principal.row.retention_rule,
    schemaVersion: principal.row.schema_version,
  };
}

function recordExportSnapshot(row: SimulationRecordRow): ExportResourceSnapshot {
  const dataCategories: ExportDataCategory[] = [
    "simulation_record",
    "decision_provenance",
    "lifecycle_metadata",
  ];

  return {
    resourceId: row.record_id,
    resourceCategory: "saved_simulation",
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    exportEligible: row.export_eligible,
    deletionState: row.deletion_state,
    lifecycleState: recordLifecycleState(row),
    dataCategories,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
    retentionRule: row.retention_rule,
    schemaVersion: row.schema_version,
  };
}

function draftExportSnapshot(row: SimulationDraftRow): ExportResourceSnapshot {
  return {
    resourceId: row.draft_id,
    resourceCategory: "simulation_draft",
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    exportEligible: row.export_eligible,
    deletionState: row.deletion_state,
    lifecycleState: row.draft_status,
    dataCategories: ["simulation_draft", "lifecycle_metadata"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    expiresAt: row.expires_at,
    retentionRule: row.retention_rule,
    schemaVersion: row.schema_version,
  };
}

function historyExportSnapshot(row: SimulationHistoryEntryRow): ExportResourceSnapshot {
  return {
    resourceId: row.history_entry_id,
    resourceCategory: "simulation_history_entry",
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    exportEligible: row.export_eligible,
    deletionState: row.deletion_state,
    lifecycleState: deletionLifecycleStateFromHistory(row),
    dataCategories: ["simulation_history", "lifecycle_metadata"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    retentionRule: row.retention_rule,
    schemaVersion: row.schema_version,
  };
}

function principalDeletionSnapshot(
  principal: UserDataControlsCanonicalPrincipal,
): DeletionResourceSnapshot {
  return {
    resourceId: principal.principalId,
    resourceCategory: "levio_principal",
    ownerPrincipalId: principal.principalId,
    ownerPrincipalType: "registered_user",
    lifecycleState: deletionLifecycleStateFromPrincipal(principal.row),
    deletionState: principal.row.deletion_state,
    retentionRule: principal.row.retention_rule,
    createdAt: principal.row.created_at,
    updatedAt: principal.row.updated_at,
    deletedAt: principal.row.deleted_at,
    legalHoldReason: principal.row.legal_hold_reason,
  };
}

function recordDeletionSnapshot(row: SimulationRecordRow): DeletionResourceSnapshot {
  return {
    resourceId: row.record_id,
    resourceCategory: "saved_simulation",
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    lifecycleState: deletionLifecycleStateFromRecord(row),
    deletionState: row.deletion_state,
    retentionRule: row.retention_rule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    legalHoldReason: row.legal_hold_reason,
  };
}

function draftDeletionSnapshot(row: SimulationDraftRow): DeletionResourceSnapshot {
  return {
    resourceId: row.draft_id,
    resourceCategory: "simulation_draft",
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    lifecycleState: deletionLifecycleStateFromDraft(row),
    deletionState: row.deletion_state,
    retentionRule: row.retention_rule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    expiresAt: row.expires_at,
    legalHoldReason: row.legal_hold_reason,
  };
}

function historyDeletionSnapshot(row: SimulationHistoryEntryRow): DeletionResourceSnapshot {
  return {
    resourceId: row.history_entry_id,
    resourceCategory: "simulation_history_entry",
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    lifecycleState: deletionLifecycleStateFromHistory(row),
    deletionState: row.deletion_state,
    retentionRule: row.retention_rule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    legalHoldReason: row.legal_hold_reason,
    parentRecordId: row.record_id,
  };
}

function parentSnapshot(row: SimulationRecordRow): DeletionParentSnapshot {
  return {
    recordId: row.record_id,
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    lifecycleState: deletionLifecycleStateFromRecord(row),
    deletionState: row.deletion_state,
  };
}

async function readRows<TRow>(input: {
  read: () => Promise<UserDataControlsPersistenceReadProviderResult<TRow>>;
}): Promise<UserDataControlsPersistenceReadProviderResult<TRow>> {
  try {
    return await input.read();
  } catch {
    return {
      status: "blocked",
      reason: "provider_read_failed",
      message: "Persistence read provider threw during owner-scoped read.",
    };
  }
}

function providerBlockedMessage(
  result: Exclude<UserDataControlsPersistenceReadProviderResult<unknown>, { status: "ready" }>,
): string {
  return `${result.message} (${result.reason})`;
}

export function createUserDataControlsPersistenceReadAdapter(
  config: UserDataControlsPersistenceReadAdapterConfig,
): UserDataControlsPersistenceReadAdapter {
  const evidence = userDataControlsPersistenceReadAdapterSafetyEvidence();

  return {
    version: USER_DATA_CONTROLS_PERSISTENCE_READ_ADAPTER_VERSION,
    mode: USER_DATA_CONTROLS_PERSISTENCE_READ_ADAPTER_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    executionBoundary: "server_only",
    evidence,
    async listExportResources(input): Promise<UserDataControlsExportArtifactSourceResult> {
      if (!config.enabled) {
        return sourceBlocked(
          "source_unavailable",
          "Persistence read adapter is disabled by rollout configuration.",
        );
      }

      if (!config.readProvider) {
        return sourceBlocked(
          "source_unavailable",
          "Persistence read adapter requires an injected server-only read provider.",
        );
      }

      if (config.readProvider.executionBoundary !== "server_only") {
        return sourceBlocked(
          "source_unavailable",
          "Persistence read provider must use a server-only execution boundary.",
        );
      }

      if (!principalIsUsable(input.principal)) {
        return sourceBlocked(
          "source_not_owner_scoped",
          "Persistence read adapter requires an active canonical registered-user principal.",
        );
      }

      if (!isValidTimestamp(input.requestedAt) || exportScopeEmpty(input.scope)) {
        return sourceBlocked(
          "source_scope_not_supported",
          "Persistence read adapter requires a valid timestamp and non-empty export scope.",
        );
      }

      const resources: ExportResourceSnapshot[] = [];

      if (input.scope.includePrincipalMetadata) {
        resources.push(principalExportSnapshot(input.principal));
      }

      if (input.scope.includeSavedSimulations) {
        const records = await readRows({
          read: () =>
            config.readProvider!.listSimulationRecords({
              ownerPrincipalId: input.principal.principalId,
              purpose: "export",
              requestedAt: input.requestedAt,
            }),
        });

        if (records.status === "blocked") {
          return sourceBlocked("source_read_failed", providerBlockedMessage(records));
        }

        if (!rowsOwnedByPrincipal(input.principal.principalId, records.rows)) {
          return sourceBlocked(
            "source_not_owner_scoped",
            "Persistence read provider returned simulation records outside the resolved owner scope.",
          );
        }

        resources.push(...records.rows.map(recordExportSnapshot));
      }

      if (input.scope.includeSimulationDrafts) {
        const drafts = await readRows({
          read: () =>
            config.readProvider!.listSimulationDrafts({
              ownerPrincipalId: input.principal.principalId,
              purpose: "export",
              requestedAt: input.requestedAt,
            }),
        });

        if (drafts.status === "blocked") {
          return sourceBlocked("source_read_failed", providerBlockedMessage(drafts));
        }

        if (!rowsOwnedByPrincipal(input.principal.principalId, drafts.rows)) {
          return sourceBlocked(
            "source_not_owner_scoped",
            "Persistence read provider returned simulation drafts outside the resolved owner scope.",
          );
        }

        resources.push(...drafts.rows.map(draftExportSnapshot));
      }

      if (input.scope.includeSimulationHistory) {
        const history = await readRows({
          read: () =>
            config.readProvider!.listSimulationHistoryEntries({
              ownerPrincipalId: input.principal.principalId,
              purpose: "export",
              requestedAt: input.requestedAt,
            }),
        });

        if (history.status === "blocked") {
          return sourceBlocked("source_read_failed", providerBlockedMessage(history));
        }

        if (!rowsOwnedByPrincipal(input.principal.principalId, history.rows)) {
          return sourceBlocked(
            "source_not_owner_scoped",
            "Persistence read provider returned simulation history outside the resolved owner scope.",
          );
        }

        resources.push(...history.rows.map(historyExportSnapshot));
      }

      return {
        status: "ready",
        resources,
      };
    },
    async listDeletionResources(input): Promise<UserDataControlsDeletionArtifactSourceResult> {
      if (!config.enabled) {
        return deletionSourceBlocked(
          "source_unavailable",
          "Persistence read adapter is disabled by rollout configuration.",
        );
      }

      if (!config.readProvider) {
        return deletionSourceBlocked(
          "source_unavailable",
          "Persistence read adapter requires an injected server-only read provider.",
        );
      }

      if (config.readProvider.executionBoundary !== "server_only") {
        return deletionSourceBlocked(
          "source_unavailable",
          "Persistence read provider must use a server-only execution boundary.",
        );
      }

      if (!principalIsUsable(input.principal)) {
        return deletionSourceBlocked(
          "source_not_owner_scoped",
          "Persistence read adapter requires an active canonical registered-user principal.",
        );
      }

      if (!isValidTimestamp(input.requestedAt) || deletionScopeEmpty(input.scope)) {
        return deletionSourceBlocked(
          "source_scope_not_supported",
          "Persistence read adapter requires a valid timestamp and non-empty deletion scope.",
        );
      }

      const resources: DeletionResourceSnapshot[] = [];
      let parentRecords: DeletionParentSnapshot[] = [];

      if (input.scope.includePrincipalRecord) {
        resources.push(principalDeletionSnapshot(input.principal));
      }

      const recordsNeeded =
        input.scope.includeSavedSimulations || input.scope.includeSimulationHistory;
      let records: SimulationRecordRow[] = [];

      if (recordsNeeded) {
        const recordRead = await readRows({
          read: () =>
            config.readProvider!.listSimulationRecords({
              ownerPrincipalId: input.principal.principalId,
              purpose: input.scope.includeSavedSimulations
                ? "deletion"
                : "deletion_parent_context",
              requestedAt: input.requestedAt,
            }),
        });

        if (recordRead.status === "blocked") {
          return deletionSourceBlocked("source_read_failed", providerBlockedMessage(recordRead));
        }

        if (!rowsOwnedByPrincipal(input.principal.principalId, recordRead.rows)) {
          return deletionSourceBlocked(
            "source_not_owner_scoped",
            "Persistence read provider returned simulation records outside the resolved owner scope.",
          );
        }

        records = recordRead.rows;
        parentRecords = records.map(parentSnapshot);

        if (input.scope.includeSavedSimulations) {
          resources.push(...records.map(recordDeletionSnapshot));
        }
      }

      if (input.scope.includeSimulationDrafts) {
        const drafts = await readRows({
          read: () =>
            config.readProvider!.listSimulationDrafts({
              ownerPrincipalId: input.principal.principalId,
              purpose: "deletion",
              requestedAt: input.requestedAt,
            }),
        });

        if (drafts.status === "blocked") {
          return deletionSourceBlocked("source_read_failed", providerBlockedMessage(drafts));
        }

        if (!rowsOwnedByPrincipal(input.principal.principalId, drafts.rows)) {
          return deletionSourceBlocked(
            "source_not_owner_scoped",
            "Persistence read provider returned simulation drafts outside the resolved owner scope.",
          );
        }

        resources.push(...drafts.rows.map(draftDeletionSnapshot));
      }

      if (input.scope.includeSimulationHistory) {
        const history = await readRows({
          read: () =>
            config.readProvider!.listSimulationHistoryEntries({
              ownerPrincipalId: input.principal.principalId,
              purpose: "deletion",
              requestedAt: input.requestedAt,
            }),
        });

        if (history.status === "blocked") {
          return deletionSourceBlocked("source_read_failed", providerBlockedMessage(history));
        }

        if (!rowsOwnedByPrincipal(input.principal.principalId, history.rows)) {
          return deletionSourceBlocked(
            "source_not_owner_scoped",
            "Persistence read provider returned simulation history outside the resolved owner scope.",
          );
        }

        const parentRecordIds = new Set(records.map((row) => row.record_id));
        const missingParentContext = history.rows.some(
          (row) => !parentRecordIds.has(row.record_id),
        );

        if (missingParentContext) {
          return deletionSourceBlocked(
            "source_not_owner_scoped",
            "Persistence read adapter requires owner-scoped parent simulation context for history deletion planning.",
          );
        }

        resources.push(...history.rows.map(historyDeletionSnapshot));
      }

      return {
        status: "ready",
        resources,
        parentRecords,
        accountState: DEFAULT_ACCOUNT_STATE,
      };
    },
  };
}
