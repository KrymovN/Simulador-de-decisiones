import type { LevioAuthRuntimeContext } from "../auth/types";
import type {
  SimulationHistoryEntryRow,
  SimulationHistoryEventSource,
  SimulationHistoryEventType,
  SimulationRecordRow,
} from "./contracts";
import {
  initializePersistenceRuntimeWiring,
  type PersistenceRuntimeWiring,
} from "./runtime-wiring";
import type {
  SupabaseSimulationHistoryEntryInsertPayload,
  SupabaseSimulationHistoryEntrySaveProvider,
} from "./supabase-provider";

export const SIMULATION_HISTORY_PERSISTENCE_VERSION =
  "4.2J-simulation-history-persistence.1" as const;

export type SimulationHistoryPersistenceBlockedReason =
  | "persistence_disabled"
  | "runtime_not_ready"
  | "auth_context_not_authenticated"
  | "provider_history_save_not_supported"
  | "principal_preflight_blocked"
  | "history_payload_invalid"
  | "history_entry_save_failed";

export type SimulationHistoryPersistenceEvidence = {
  stage: "4.2J";
  simulationHistoryOnly: true;
  appendOnly: true;
  controlledRolloutRequired: true;
  runtimeWiringUsed: true;
  providerResolutionUsed: true;
  simulationRecordWriteChanged: false;
  draftsRuntimeStarted: false;
  dashboardIntegrated: false;
  uiChanged: false;
  apiRouteChanged: false;
  authRuntimeChanged: false;
  schemaChanged: false;
  migrationsChanged: false;
  stage42KStarted: false;
  stage43Started: false;
  stage44Started: false;
  rollback: "disable_simulation_history_persistence_or_remove_service_exports";
};

export type SimulationHistoryPersistenceConfig = {
  enabled: boolean;
};

export type SimulationHistoryParentRecord = Pick<
  SimulationRecordRow,
  "record_id" | "owner_principal_id" | "owner_principal_type"
>;

export type SimulationHistorySaveInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  simulationRecord: SimulationHistoryParentRecord;
  eventType: SimulationHistoryEventType;
  eventSource?: SimulationHistoryEventSource;
  eventSummary?: string;
  eventPayload?: Record<string, unknown>;
  userVisible?: boolean;
  eventTimestamp?: string;
  runtime?: PersistenceRuntimeWiring;
  saveProvider?: SupabaseSimulationHistoryEntrySaveProvider;
  config?: SimulationHistoryPersistenceConfig;
};

export type SimulationHistorySaveResult =
  | {
      status: "saved";
      version: typeof SIMULATION_HISTORY_PERSISTENCE_VERSION;
      historyEntry: SimulationHistoryEntryRow;
      principalId: string;
      evidence: SimulationHistoryPersistenceEvidence;
    }
  | {
      status: "blocked";
      version: typeof SIMULATION_HISTORY_PERSISTENCE_VERSION;
      reason: SimulationHistoryPersistenceBlockedReason;
      message: string;
      evidence: SimulationHistoryPersistenceEvidence;
    };

type ConfigEnv = Record<string, string | undefined>;

const ALLOWED_EVENT_TYPES: SimulationHistoryEventType[] = [
  "created",
  "updated",
  "archived",
  "restored",
  "deleted",
  "export_requested",
  "export_completed",
  "revision_created",
  "outcome_added",
  "claim_completed",
];

const ALLOWED_EVENT_SOURCES: SimulationHistoryEventSource[] = [
  "server",
  "owner_action",
  "system_lifecycle",
  "import_flow",
  "export_flow",
];

function isEnabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function evidence(): SimulationHistoryPersistenceEvidence {
  return {
    stage: "4.2J",
    simulationHistoryOnly: true,
    appendOnly: true,
    controlledRolloutRequired: true,
    runtimeWiringUsed: true,
    providerResolutionUsed: true,
    simulationRecordWriteChanged: false,
    draftsRuntimeStarted: false,
    dashboardIntegrated: false,
    uiChanged: false,
    apiRouteChanged: false,
    authRuntimeChanged: false,
    schemaChanged: false,
    migrationsChanged: false,
    stage42KStarted: false,
    stage43Started: false,
    stage44Started: false,
    rollback: "disable_simulation_history_persistence_or_remove_service_exports",
  };
}

function blocked(
  reason: SimulationHistoryPersistenceBlockedReason,
  message: string,
): SimulationHistorySaveResult {
  return {
    status: "blocked",
    version: SIMULATION_HISTORY_PERSISTENCE_VERSION,
    reason,
    message,
    evidence: evidence(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSummary(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.length > 240 ? `${trimmed.slice(0, 237).trim()}...` : trimmed;
}

function supportsSimulationHistoryEntrySaveProvider(
  value: unknown,
): value is SupabaseSimulationHistoryEntrySaveProvider {
  return isRecord(value) && typeof value.saveSimulationHistoryEntry === "function";
}

export function readSimulationHistoryPersistenceConfig(
  env: ConfigEnv = process.env,
): SimulationHistoryPersistenceConfig {
  return {
    enabled: isEnabledFlag(env.LEVIO_SIMULATION_HISTORY_PERSISTENCE_ENABLED),
  };
}

export function simulationHistoryPersistenceEvidence(): SimulationHistoryPersistenceEvidence {
  return evidence();
}

export function buildSimulationHistoryEntryInsertPayload(input: {
  simulationRecord: SimulationHistoryParentRecord;
  ownerPrincipalId: string;
  eventType: SimulationHistoryEventType;
  eventSource?: SimulationHistoryEventSource;
  eventSummary?: string;
  eventPayload?: Record<string, unknown>;
  userVisible?: boolean;
  eventTimestamp?: string;
}): SupabaseSimulationHistoryEntryInsertPayload | null {
  const eventSource = input.eventSource ?? "server";

  if (
    !input.simulationRecord.record_id ||
    !input.simulationRecord.owner_principal_id ||
    input.simulationRecord.owner_principal_type !== "registered_user" ||
    input.simulationRecord.owner_principal_id !== input.ownerPrincipalId ||
    !ALLOWED_EVENT_TYPES.includes(input.eventType) ||
    !ALLOWED_EVENT_SOURCES.includes(eventSource)
  ) {
    return null;
  }

  return {
    owner_principal_id: input.ownerPrincipalId,
    owner_principal_type: "registered_user",
    record_id: input.simulationRecord.record_id,
    event_type: input.eventType,
    event_timestamp: input.eventTimestamp ?? new Date().toISOString(),
    event_source: eventSource,
    user_visible: input.userVisible ?? true,
    event_summary: normalizeSummary(input.eventSummary),
    event_payload: input.eventPayload ?? {},
    before_reference: null,
    after_reference: null,
    revision_reference: null,
    outcome_snapshot: null,
    claim_transaction_reference: null,
    export_reference: null,
    deletion_state: "active",
    retention_rule: "parent_simulation_lifecycle",
    export_eligible: true,
    schema_version: 1,
  };
}

export async function saveSimulationHistoryEntry(
  input: SimulationHistorySaveInput,
): Promise<SimulationHistorySaveResult> {
  const config = input.config ?? readSimulationHistoryPersistenceConfig();

  if (!config.enabled) {
    return blocked(
      "persistence_disabled",
      "Simulation history persistence is disabled by controlled rollout configuration.",
    );
  }

  if (input.authContext?.identityState !== "authenticated") {
    return blocked(
      "auth_context_not_authenticated",
      "Simulation history persistence requires an authenticated auth context.",
    );
  }

  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();

  if (runtime.status !== "ready") {
    return blocked("runtime_not_ready", "Persistence runtime wiring is not ready.");
  }

  const saveProvider = input.saveProvider ?? runtime.providerAdapter;

  if (!supportsSimulationHistoryEntrySaveProvider(saveProvider)) {
    return blocked(
      "provider_history_save_not_supported",
      "Configured persistence provider does not support simulation history entry saves.",
    );
  }

  const preflight = await runtime.preflight({
    operation: "resolve_principal",
    authContext: input.authContext,
    resourceOwnerPrincipalId: input.simulationRecord.owner_principal_id,
  });

  if (preflight.status === "blocked") {
    return blocked("principal_preflight_blocked", preflight.message);
  }

  const payload = buildSimulationHistoryEntryInsertPayload({
    simulationRecord: input.simulationRecord,
    ownerPrincipalId: preflight.principalId,
    eventType: input.eventType,
    eventSource: input.eventSource,
    eventSummary: input.eventSummary,
    eventPayload: input.eventPayload,
    userVisible: input.userVisible,
    eventTimestamp: input.eventTimestamp,
  });

  if (!payload) {
    return blocked(
      "history_payload_invalid",
      "Simulation history input cannot be mapped to a simulation_history_entries payload.",
    );
  }

  const historyEntry = await saveProvider.saveSimulationHistoryEntry(payload);

  if (!historyEntry) {
    return blocked(
      "history_entry_save_failed",
      "Simulation history provider failed to save the history entry.",
    );
  }

  return {
    status: "saved",
    version: SIMULATION_HISTORY_PERSISTENCE_VERSION,
    historyEntry,
    principalId: preflight.principalId,
    evidence: evidence(),
  };
}
