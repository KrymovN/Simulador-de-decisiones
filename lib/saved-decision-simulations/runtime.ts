import {
  initializePersistenceRuntimeWiring,
  readSimulationRecordPersistenceConfig,
  saveSimulationRecordFromSimulationResponse,
  type PersistenceRuntimeWiring,
  type SimulationRecordRow,
  type SupabaseSimulationRecordReadProvider,
} from "../persistence-runtime";
import {
  SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
  type SavedDecisionSimulationListInput,
  type SavedDecisionSimulationListResult,
  type SavedDecisionSimulationLoadInput,
  type SavedDecisionSimulationLoadResult,
  type SavedDecisionSimulationSaveInput,
  type SavedDecisionSimulationSaveResult,
  type SavedDecisionSimulationsBlockedReason,
  type SavedDecisionSimulationsBlockedResult,
  type SavedDecisionSimulationsRuntimeConfig,
  type SavedDecisionSimulationsRuntimeEvidence,
} from "./contracts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;

type ConfigEnv = Record<string, string | undefined>;

function isEnabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function evidence(): SavedDecisionSimulationsRuntimeEvidence {
  return {
    stage: "15-product-implementation",
    productCapability: "saved_decision_simulations",
    serverRuntimeBoundaryOnly: true,
    usesAuthRuntime: true,
    usesPersistenceRuntime: true,
    usesDecisionSimulationEngineArtifact: true,
    saveSupported: true,
    loadSupported: true,
    listSupported: true,
    ownerScopedReadsOnly: true,
    clientOwnerInputAccepted: false,
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

function recordIsOwnerScoped(record: SimulationRecordRow, principalId: string): boolean {
  return (
    record.owner_principal_id === principalId &&
    record.owner_principal_type === "registered_user" &&
    record.record_status === "active" &&
    record.deletion_state === "active"
  );
}

function recordsAreOwnerScoped(records: SimulationRecordRow[], principalId: string): boolean {
  return records.every((record) => recordIsOwnerScoped(record, principalId));
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

  return {
    status: "saved",
    version: SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION,
    record: result.record,
    principalId: result.principalId,
    evidence: evidence(),
  };
}

export async function loadDecisionSimulation(
  input: SavedDecisionSimulationLoadInput,
): Promise<SavedDecisionSimulationLoadResult> {
  const config = resolveConfig(input.config);

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
    principalId: principal.principalId,
    evidence: evidence(),
  };
}

export async function listDecisionSimulations(
  input: SavedDecisionSimulationListInput,
): Promise<SavedDecisionSimulationListResult> {
  const config = resolveConfig(input.config);

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
    principalId: principal.principalId,
    evidence: evidence(),
  };
}
