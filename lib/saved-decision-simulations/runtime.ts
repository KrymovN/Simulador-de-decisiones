import {
  initializePersistenceRuntimeWiring,
  readSimulationRecordPersistenceConfig,
  saveSimulationRecordFromSimulationResponse,
  type PersistenceRuntimeWiring,
  type SimulationRecordStatus,
  type SimulationRecordRow,
  type SupabaseSimulationRecordArchiveProvider,
  type SupabaseSimulationRecordDeleteProvider,
  type SupabaseSimulationRecordReadProvider,
} from "../persistence-runtime";
import {
  DECISION_SIMULATION_DOMAIN_MODEL_VERSION,
  SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
  type DecisionSimulationDomainModel,
  type DecisionSimulationLifecycleState,
  type DecisionSimulationPersistenceMapping,
  type SavedDecisionSimulationArchiveInput,
  type SavedDecisionSimulationArchiveResult,
  type SavedDecisionSimulationDeleteInput,
  type SavedDecisionSimulationDeleteResult,
  type SavedDecisionSimulationListInput,
  type SavedDecisionSimulationListResult,
  type SavedDecisionSimulationLoadInput,
  type SavedDecisionSimulationLoadResult,
  type SavedDecisionSimulationReopenInput,
  type SavedDecisionSimulationReopenResult,
  type SavedDecisionSimulationSaveInput,
  type SavedDecisionSimulationSaveResult,
  type SavedDecisionSimulationsBlockedReason,
  type SavedDecisionSimulationsBlockedResult,
  type SavedDecisionSimulationsRuntimeConfig,
  type SavedDecisionSimulationsRuntimeEvidence,
} from "./contracts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const CLIENT_OWNER_FIELD_KEYS = [
  "principalId",
  "principal_id",
  "ownerPrincipalId",
  "owner_principal_id",
  "ownerPrincipalType",
  "owner_principal_type",
  "providerReference",
  "provider_reference",
] as const;

const PERSISTENCE_MAPPING: DecisionSimulationPersistenceMapping = {
  storedNow: [
    "identity",
    "ownership",
    "simulationInput.userInputSnapshot",
    "simulationInput.language",
    "simulationInput.title",
    "simulationInput.userNote",
    "simulationInput.clarificationSnapshot",
    "decisionContext.snapshotWhenAvailable",
    "generatedScenarios.fromDeterministicOutputSnapshot",
    "decisionEngineOutput",
    "aiMetadata.deterministicPreviewEvidence",
    "runtimeMetadata",
    "auditMetadata.parentRevisionExportReferences",
    "lifecycleMetadata",
    "futureVersioning",
  ],
  deferred: [
    "draftRuntimeIntegration",
    "historyEventAppendForReopenArchiveRestoreDelete",
    "revisionCreationRuntime",
    "exportDeleteUserFlows",
    "realAiProviderProvenance",
    "dashboardProductSurfaceIntegration",
  ],
  computedRuntime: [
    "lifecycleMetadata.state",
    "simulationInput.sourceSurface",
    "decisionContext.stored",
    "generatedScenarios.stored",
    "aiMetadata.aiProviderUsed",
    "aiMetadata.rawProviderMaterialStored",
    "dashboardDisplayTitleFallback",
    "activeListVisibility",
  ],
  prohibitedClientFields: [...CLIENT_OWNER_FIELD_KEYS],
};

type ConfigEnv = Record<string, string | undefined>;

function isEnabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function evidence(): SavedDecisionSimulationsRuntimeEvidence {
  return {
    stage: "block-a-a2",
    runtimeCapability: "decision_simulation_persistence_runtime_mapping",
    productCapability: "saved_decision_simulations",
    serverRuntimeBoundaryOnly: true,
    usesAuthRuntime: true,
    usesPersistenceRuntime: true,
    usesDecisionSimulationEngineArtifact: true,
    domainModelMapped: true,
    saveSupported: true,
    loadSupported: true,
    listSupported: true,
    reopenSupported: true,
    archiveSupported: true,
    ownerScopedReadsOnly: true,
    ownerScopedWritesOnly: true,
    clientOwnerInputAccepted: false,
    schemaChanged: false,
    migrationsChanged: false,
    uiChanged: false,
    apiRouteChanged: false,
    publicContractChanged: false,
    architectureInvariantChanged: false,
    productionReleaseOpened: false,
    commercialLaunchOpened: false,
    realAiIntegrated: false,
    billingIntegrated: false,
    analyticsIntegrated: false,
    trackingIntegrated: false,
    roadmapChanged: false,
    rollback: "remove_saved_decision_simulations_runtime_exports",
  };
}

function blocked(
  reason: SavedDecisionSimulationsBlockedReason,
  message: string,
): SavedDecisionSimulationsBlockedResult {
  return {
    status: "blocked",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    reason,
    message,
    evidence: evidence(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasClientOwnerFields(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return CLIENT_OWNER_FIELD_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(value, key),
  );
}

function hasNestedClientOwnerFields(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => hasNestedClientOwnerFields(item, seen));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(([key, nestedValue]) =>
    CLIENT_OWNER_FIELD_KEYS.includes(
      key as (typeof CLIENT_OWNER_FIELD_KEYS)[number],
    ) || hasNestedClientOwnerFields(nestedValue, seen),
  );
}

function hasClientOwnerInput(
  input: unknown,
  nestedClientValues: unknown[] = [],
): boolean {
  return hasClientOwnerFields(input) ||
    nestedClientValues.some((value) => hasNestedClientOwnerFields(value));
}

function normalizeRecordId(value: string): string | null {
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) ? trimmed : null;
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.max(1, Math.min(MAX_LIST_LIMIT, Math.floor(value)));
}

function supportsSimulationRecordReadProvider(
  value: unknown,
): value is SupabaseSimulationRecordReadProvider {
  return (
    isRecord(value) &&
    typeof value.readSimulationRecord === "function" &&
    typeof value.listSimulationRecords === "function"
  );
}

function supportsSimulationRecordArchiveProvider(
  value: unknown,
): value is SupabaseSimulationRecordArchiveProvider {
  return isRecord(value) && typeof value.archiveSimulationRecord === "function";
}

function supportsSimulationRecordDeleteProvider(
  value: unknown,
): value is SupabaseSimulationRecordDeleteProvider {
  return isRecord(value) && typeof value.deleteSimulationRecord === "function";
}

function jsonObjectFromUnknown(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return { items: value };
  }

  return null;
}

function stringFromRecord(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function booleanFromRecord(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function sourceSurfaceFromRecord(record: SimulationRecordRow): string {
  const userInputSource = stringFromRecord(record.user_input_snapshot, "source");
  const metadataSource = stringFromRecord(record.metadata, "source");

  return userInputSource ?? metadataSource ?? "saved_decision_simulation_runtime";
}

function lifecycleStateFromRecord(
  record: SimulationRecordRow,
  override?: DecisionSimulationLifecycleState,
): DecisionSimulationLifecycleState {
  if (override) {
    return override;
  }

  if (record.record_status === "archived") {
    return "archived";
  }

  if (record.record_status === "restricted" || record.deletion_state === "restricted") {
    return "restricted";
  }

  if (record.record_status === "deletion_pending" || record.deletion_state === "deletion_requested") {
    return "deletion_requested";
  }

  if (
    record.record_status === "deleted" ||
    record.deletion_state === "deleted" ||
    record.deletion_state === "anonymized" ||
    record.deletion_state === "retained_legal_exception"
  ) {
    return "deleted";
  }

  return "saved";
}

function outputStatusFromRecord(record: SimulationRecordRow): string {
  const status = stringFromRecord(record.deterministic_output_snapshot, "status");
  return status ?? record.recommendation_state;
}

function decisionContextSnapshot(record: SimulationRecordRow): Record<string, unknown> | null {
  if (record.decision_model_snapshot) {
    return record.decision_model_snapshot;
  }

  return jsonObjectFromUnknown(record.deterministic_output_snapshot.decision);
}

function generatedScenariosSnapshot(record: SimulationRecordRow): Record<string, unknown> | null {
  const analysis = jsonObjectFromUnknown(record.deterministic_output_snapshot.analysis);

  if (analysis) {
    return jsonObjectFromUnknown(analysis.scenarios);
  }

  const simulation = jsonObjectFromUnknown(record.deterministic_output_snapshot.simulation);

  if (simulation) {
    return jsonObjectFromUnknown(simulation.scenarios);
  }

  return null;
}

function runtimeTruthBoundary(record: SimulationRecordRow): "deterministic_preview" | "future_real_ai_path" {
  const aiProviderUsed = booleanFromRecord(record.safety_flags, "aiProviderUsed") ?? false;
  return aiProviderUsed ? "future_real_ai_path" : "deterministic_preview";
}

function recordIsOwnerScoped(record: SimulationRecordRow, principalId: string): boolean {
  return (
    record.owner_principal_id === principalId &&
    record.owner_principal_type === "registered_user" &&
    record.record_status === "active" &&
    record.deletion_state === "active"
  );
}

function archivedRecordIsOwnerScoped(record: SimulationRecordRow, principalId: string): boolean {
  return (
    record.owner_principal_id === principalId &&
    record.owner_principal_type === "registered_user" &&
    record.record_status === "archived" &&
    record.archived_at !== null &&
    record.deletion_state === "active"
  );
}

function deletedRecordIsOwnerScoped(record: SimulationRecordRow, principalId: string): boolean {
  return (
    record.owner_principal_id === principalId &&
    record.owner_principal_type === "registered_user" &&
    record.record_status === "deleted" &&
    record.deletion_state === "deleted" &&
    record.deleted_at !== null &&
    record.export_eligible === false
  );
}

function recordsAreOwnerScoped(records: SimulationRecordRow[], principalId: string): boolean {
  return records.every((record) => recordIsOwnerScoped(record, principalId));
}

export function decisionSimulationPersistenceMapping(): DecisionSimulationPersistenceMapping {
  return PERSISTENCE_MAPPING;
}

export function mapSimulationRecordToDecisionSimulation(
  record: SimulationRecordRow,
  options: {
    lifecycleState?: DecisionSimulationLifecycleState;
    ownerVerifiedAt?: string;
  } = {},
): DecisionSimulationDomainModel {
  const decisionContext = decisionContextSnapshot(record);
  const generatedScenarios = generatedScenariosSnapshot(record);
  const ownerVerifiedAt = options.ownerVerifiedAt ?? record.updated_at;

  return {
    identity: {
      simulationId: record.record_id,
      schemaVersion: record.schema_version,
      domainModelVersion: DECISION_SIMULATION_DOMAIN_MODEL_VERSION,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    },
    ownership: {
      ownerPrincipalId: record.owner_principal_id,
      ownerPrincipalType: record.owner_principal_type,
      ownershipSource: "resolved_server_principal",
      ownerVerifiedAt,
    },
    simulationInput: {
      userInputSnapshot: record.user_input_snapshot,
      language: record.language,
      sourceSurface: sourceSurfaceFromRecord(record),
      submittedAt: record.created_at,
      title: record.title,
      userNote: record.user_note,
      originatingDraftId: record.originating_draft_id,
      clarificationSnapshot: record.clarification_snapshot,
    },
    decisionContext: {
      stored: decisionContext !== null,
      snapshot: decisionContext,
      deferred: decisionContext === null,
    },
    generatedScenarios: {
      stored: generatedScenarios !== null,
      snapshot: generatedScenarios,
      deferred: generatedScenarios === null,
    },
    decisionEngineOutput: {
      status: outputStatusFromRecord(record),
      recommendationState: record.recommendation_state,
      simulationResponseVersion: record.simulation_response_version,
      decisionContractVersion: record.decision_contract_version,
      deterministicOutputSnapshot: record.deterministic_output_snapshot,
      confidenceSummary: record.confidence_summary,
    },
    aiMetadata: {
      aiProviderUsed: booleanFromRecord(record.safety_flags, "aiProviderUsed") ?? false,
      realAiExecution: "deferred",
      rawProviderMaterialStored: false,
    },
    runtimeMetadata: {
      runtimeTruthBoundary: runtimeTruthBoundary(record),
      sourceType: record.source_type,
      safetyClassification: record.safety_classification,
      contentSensitivity: record.content_sensitivity,
      metadata: record.metadata,
      safetyFlags: record.safety_flags,
    },
    auditMetadata: {
      parentRecordId: record.parent_record_id,
      revisionLabel: record.revision_label,
      lastExportedAt: record.last_exported_at,
    },
    lifecycleMetadata: {
      state: lifecycleStateFromRecord(record, options.lifecycleState),
      recordStatus: record.record_status as SimulationRecordStatus,
      deletionState: record.deletion_state,
      archivedAt: record.archived_at,
      deletedAt: record.deleted_at,
      retentionRule: record.retention_rule,
      exportEligible: record.export_eligible,
      legalHoldReason: record.legal_hold_reason,
    },
    futureVersioning: {
      schemaVersion: record.schema_version,
      domainModelVersion: DECISION_SIMULATION_DOMAIN_MODEL_VERSION,
      parentRecordId: record.parent_record_id,
      revisionLabel: record.revision_label,
    },
    persistenceMapping: PERSISTENCE_MAPPING,
  };
}

function resolveConfig(
  config: SavedDecisionSimulationsRuntimeConfig | undefined,
): SavedDecisionSimulationsRuntimeConfig {
  return config ?? readSavedDecisionSimulationsRuntimeConfig();
}

function runtimeFromInput(runtime: PersistenceRuntimeWiring | undefined): PersistenceRuntimeWiring {
  return runtime ?? initializePersistenceRuntimeWiring();
}

async function resolvePrincipalForOperation(input: {
  runtime: PersistenceRuntimeWiring;
  authContext: SavedDecisionSimulationLoadInput["authContext"];
  operation: "read_simulation_record" | "list_simulation_records";
}): Promise<
  | {
      status: "ready";
      principalId: string;
    }
  | SavedDecisionSimulationsBlockedResult
> {
  if (input.authContext?.identityState !== "authenticated") {
    return blocked(
      "auth_context_not_authenticated",
      "Saved decision simulations require an authenticated registered-user context.",
    );
  }

  if (input.runtime.status !== "ready") {
    return blocked(
      "persistence_runtime_not_ready",
      "Persistence runtime wiring is not ready for saved decision simulations.",
    );
  }

  const preflight = await input.runtime.preflight({
    operation: input.operation,
    authContext: input.authContext,
  });

  if (preflight.status === "blocked") {
    return blocked("principal_preflight_blocked", preflight.message);
  }

  return {
    status: "ready",
    principalId: preflight.principalId,
  };
}

export function readSavedDecisionSimulationsRuntimeConfig(
  env: ConfigEnv = process.env,
): SavedDecisionSimulationsRuntimeConfig {
  return {
    enabled: isEnabledFlag(env.LEVIO_SAVED_DECISION_SIMULATIONS_RUNTIME_ENABLED),
    simulationRecordPersistence: readSimulationRecordPersistenceConfig(env),
  };
}

export function savedDecisionSimulationsRuntimeEvidence(): SavedDecisionSimulationsRuntimeEvidence {
  return evidence();
}

export async function saveDecisionSimulation(
  input: SavedDecisionSimulationSaveInput,
): Promise<SavedDecisionSimulationSaveResult> {
  const config = resolveConfig(input.config);

  if (hasClientOwnerInput(input, [input.simulation])) {
    return blocked(
      "client_owner_input_rejected",
      "Saved decision simulations do not accept client-supplied owner fields.",
    );
  }

  if (!config.enabled) {
    return blocked(
      "runtime_disabled",
      "Saved decision simulations runtime is disabled by controlled rollout configuration.",
    );
  }

  const result = await saveSimulationRecordFromSimulationResponse({
    authContext: input.authContext,
    simulation: input.simulation,
    title: input.title,
    userNote: input.userNote,
    runtime: input.runtime,
    saveProvider: input.saveProvider,
    config: config.simulationRecordPersistence,
  });

  if (result.status === "blocked") {
    return blocked("record_save_blocked", result.message);
  }

  if (!recordIsOwnerScoped(result.record, result.principalId)) {
    return blocked(
      "record_owner_scope_failed",
      "Saved decision simulation record is outside the resolved owner scope.",
    );
  }

  return {
    status: "saved",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    record: result.record,
    simulation: mapSimulationRecordToDecisionSimulation(result.record),
    principalId: result.principalId,
    evidence: evidence(),
  };
}

export async function loadDecisionSimulation(
  input: SavedDecisionSimulationLoadInput,
): Promise<SavedDecisionSimulationLoadResult> {
  const config = resolveConfig(input.config);

  if (hasClientOwnerInput(input)) {
    return blocked(
      "client_owner_input_rejected",
      "Saved decision simulations do not accept client-supplied owner fields.",
    );
  }

  if (!config.enabled) {
    return blocked(
      "runtime_disabled",
      "Saved decision simulations runtime is disabled by controlled rollout configuration.",
    );
  }

  const recordId = normalizeRecordId(input.recordId);

  if (!recordId) {
    return blocked("record_id_invalid", "Saved decision simulation record id is invalid.");
  }

  const runtime = runtimeFromInput(input.runtime);
  const readProvider = input.readProvider ?? (runtime.status === "ready" ? runtime.providerAdapter : undefined);

  if (!supportsSimulationRecordReadProvider(readProvider)) {
    return blocked(
      "provider_read_not_supported",
      "Configured persistence provider does not support saved decision simulation reads.",
    );
  }

  const principal = await resolvePrincipalForOperation({
    runtime,
    authContext: input.authContext,
    operation: "read_simulation_record",
  });

  if (principal.status !== "ready") {
    return principal;
  }

  const record = await readProvider.readSimulationRecord({
    recordId,
    ownerPrincipalId: principal.principalId,
  });

  if (!record) {
    return blocked("record_not_found", "Saved decision simulation record was not found.");
  }

  if (!recordIsOwnerScoped(record, principal.principalId)) {
    return blocked(
      "record_owner_scope_failed",
      "Saved decision simulation record is outside the authenticated owner scope.",
    );
  }

  return {
    status: "loaded",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    record,
    simulation: mapSimulationRecordToDecisionSimulation(record),
    principalId: principal.principalId,
    evidence: evidence(),
  };
}

export async function listDecisionSimulations(
  input: SavedDecisionSimulationListInput,
): Promise<SavedDecisionSimulationListResult> {
  const config = resolveConfig(input.config);

  if (hasClientOwnerInput(input)) {
    return blocked(
      "client_owner_input_rejected",
      "Saved decision simulations do not accept client-supplied owner fields.",
    );
  }

  if (!config.enabled) {
    return blocked(
      "runtime_disabled",
      "Saved decision simulations runtime is disabled by controlled rollout configuration.",
    );
  }

  const runtime = runtimeFromInput(input.runtime);
  const readProvider = input.readProvider ?? (runtime.status === "ready" ? runtime.providerAdapter : undefined);

  if (!supportsSimulationRecordReadProvider(readProvider)) {
    return blocked(
      "provider_read_not_supported",
      "Configured persistence provider does not support saved decision simulation reads.",
    );
  }

  const principal = await resolvePrincipalForOperation({
    runtime,
    authContext: input.authContext,
    operation: "list_simulation_records",
  });

  if (principal.status !== "ready") {
    return principal;
  }

  const records = await readProvider.listSimulationRecords({
    ownerPrincipalId: principal.principalId,
    limit: normalizeLimit(input.limit),
  });

  if (!recordsAreOwnerScoped(records, principal.principalId)) {
    return blocked(
      "record_owner_scope_failed",
      "Saved decision simulation records include data outside the authenticated owner scope.",
    );
  }

  return {
    status: "listed",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    records,
    simulations: records.map((record) => mapSimulationRecordToDecisionSimulation(record)),
    principalId: principal.principalId,
    evidence: evidence(),
  };
}

export async function reopenDecisionSimulation(
  input: SavedDecisionSimulationReopenInput,
): Promise<SavedDecisionSimulationReopenResult> {
  const loaded = await loadDecisionSimulation(input);

  if (loaded.status === "blocked") {
    return loaded;
  }

  return {
    status: "reopened",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    record: loaded.record,
    simulation: mapSimulationRecordToDecisionSimulation(loaded.record, {
      lifecycleState: "reopened",
    }),
    principalId: loaded.principalId,
    evidence: evidence(),
  };
}

export async function archiveDecisionSimulation(
  input: SavedDecisionSimulationArchiveInput,
): Promise<SavedDecisionSimulationArchiveResult> {
  const config = resolveConfig(input.config);

  if (hasClientOwnerInput(input)) {
    return blocked(
      "client_owner_input_rejected",
      "Saved decision simulations do not accept client-supplied owner fields.",
    );
  }

  if (!config.enabled) {
    return blocked(
      "runtime_disabled",
      "Saved decision simulations runtime is disabled by controlled rollout configuration.",
    );
  }

  const recordId = normalizeRecordId(input.recordId);

  if (!recordId) {
    return blocked("record_id_invalid", "Saved decision simulation record id is invalid.");
  }

  const runtime = runtimeFromInput(input.runtime);
  const archiveProvider =
    input.archiveProvider ?? (runtime.status === "ready" ? runtime.providerAdapter : undefined);

  if (!supportsSimulationRecordArchiveProvider(archiveProvider)) {
    return blocked(
      "provider_archive_not_supported",
      "Configured persistence provider does not support saved decision simulation archive.",
    );
  }

  if (input.authContext?.identityState !== "authenticated") {
    return blocked(
      "auth_context_not_authenticated",
      "Saved decision simulations require an authenticated registered-user context.",
    );
  }

  if (runtime.status !== "ready") {
    return blocked(
      "persistence_runtime_not_ready",
      "Persistence runtime wiring is not ready for saved decision simulations.",
    );
  }

  const preflight = await runtime.preflight({
    operation: "resolve_principal",
    authContext: input.authContext,
  });

  if (preflight.status === "blocked") {
    return blocked("principal_preflight_blocked", preflight.message);
  }

  const archivedAt = input.archivedAt ?? new Date().toISOString();
  const record = await archiveProvider.archiveSimulationRecord({
    recordId,
    ownerPrincipalId: preflight.principalId,
    archivedAt,
  });

  if (!record) {
    return blocked("record_not_found", "Saved decision simulation record was not found.");
  }

  if (!archivedRecordIsOwnerScoped(record, preflight.principalId)) {
    return blocked(
      "record_archive_failed",
      "Saved decision simulation archive result did not remain inside the owner scope.",
    );
  }

  return {
    status: "archived",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    record,
    simulation: mapSimulationRecordToDecisionSimulation(record, {
      lifecycleState: "archived",
      ownerVerifiedAt: archivedAt,
    }),
    principalId: preflight.principalId,
    evidence: evidence(),
  };
}

export async function deleteDecisionSimulation(
  input: SavedDecisionSimulationDeleteInput,
): Promise<SavedDecisionSimulationDeleteResult> {
  const config = resolveConfig(input.config);

  if (hasClientOwnerInput(input)) {
    return blocked(
      "client_owner_input_rejected",
      "Saved decision simulations do not accept client-supplied owner fields.",
    );
  }

  if (!config.enabled) {
    return blocked(
      "runtime_disabled",
      "Saved decision simulations runtime is disabled by controlled rollout configuration.",
    );
  }

  const recordId = normalizeRecordId(input.recordId);

  if (!recordId) {
    return blocked("record_id_invalid", "Saved decision simulation record id is invalid.");
  }

  const runtime = runtimeFromInput(input.runtime);
  const deleteProvider =
    input.deleteProvider ?? (runtime.status === "ready" ? runtime.providerAdapter : undefined);

  if (!supportsSimulationRecordDeleteProvider(deleteProvider)) {
    return blocked(
      "provider_delete_not_supported",
      "Configured persistence provider does not support saved decision simulation deletion.",
    );
  }

  if (input.authContext?.identityState !== "authenticated") {
    return blocked(
      "auth_context_not_authenticated",
      "Saved decision simulations require an authenticated registered-user context.",
    );
  }

  if (runtime.status !== "ready") {
    return blocked(
      "persistence_runtime_not_ready",
      "Persistence runtime wiring is not ready for saved decision simulations.",
    );
  }

  const preflight = await runtime.preflight({
    operation: "resolve_principal",
    authContext: input.authContext,
  });

  if (preflight.status === "blocked") {
    return blocked("principal_preflight_blocked", preflight.message);
  }

  const deletedAt = input.deletedAt ?? new Date().toISOString();
  const deletion = await deleteProvider.deleteSimulationRecord({
    recordId,
    ownerPrincipalId: preflight.principalId,
    deletedAt,
  });

  if (deletion.status === "failed") {
    return blocked(
      "record_delete_failed",
      "Saved decision simulation deletion failed inside the persistence boundary.",
    );
  }

  if (deletion.status === "restricted") {
    return blocked(
      "record_delete_restricted",
      "Saved decision simulation deletion is blocked by its protected lifecycle.",
    );
  }

  if (deletion.status === "not_found") {
    return {
      status: "already_absent",
      version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
      principalId: preflight.principalId,
      evidence: evidence(),
    };
  }

  if (!deletedRecordIsOwnerScoped(deletion.record, preflight.principalId)) {
    return blocked(
      "record_delete_failed",
      "Saved decision simulation deletion result did not remain inside the owner scope.",
    );
  }

  return {
    status: "deleted",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    record: deletion.record,
    principalId: preflight.principalId,
    evidence: evidence(),
  };
}
