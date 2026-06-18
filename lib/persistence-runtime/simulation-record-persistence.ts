import type { LevioAuthRuntimeContext } from "../auth/types";
import type { SimulationResponse } from "../simulationEngine";
import type { SimulationRecordRow } from "./contracts";
import {
  initializePersistenceRuntimeWiring,
  type PersistenceRuntimeWiring,
} from "./runtime-wiring";
import type {
  SupabaseSimulationRecordInsertPayload,
  SupabaseSimulationRecordSaveProvider,
} from "./supabase-provider";

export const SIMULATION_RECORD_PERSISTENCE_VERSION =
  "4.2I-simulation-record-persistence.1" as const;

export type SimulationRecordPersistenceBlockedReason =
  | "persistence_disabled"
  | "runtime_not_ready"
  | "auth_context_not_authenticated"
  | "provider_save_not_supported"
  | "principal_preflight_blocked"
  | "simulation_payload_invalid"
  | "simulation_record_save_failed";

export type SimulationRecordPersistenceEvidence = {
  stage: "4.2I";
  simulationRecordsOnly: true;
  explicitSaveOnly: true;
  controlledRolloutRequired: true;
  runtimeWiringUsed: true;
  providerResolutionUsed: true;
  historyRuntimeStarted: false;
  draftsRuntimeStarted: false;
  dashboardIntegrated: false;
  uiChanged: false;
  apiRouteChanged: false;
  authRuntimeChanged: false;
  simulatorRuntimeChanged: false;
  schemaChanged: false;
  migrationsChanged: false;
  stage42JStarted: false;
  stage42KStarted: false;
  stage43Started: false;
  stage44Started: false;
  rollback: "disable_simulation_record_persistence_or_remove_service_exports";
};

export type SimulationRecordPersistenceConfig = {
  enabled: boolean;
};

export type SimulationRecordSaveInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  simulation: SimulationResponse;
  title?: string;
  userNote?: string;
  runtime?: PersistenceRuntimeWiring;
  saveProvider?: SupabaseSimulationRecordSaveProvider;
  config?: SimulationRecordPersistenceConfig;
};

export type SimulationRecordSaveResult =
  | {
      status: "saved";
      version: typeof SIMULATION_RECORD_PERSISTENCE_VERSION;
      record: SimulationRecordRow;
      principalId: string;
      evidence: SimulationRecordPersistenceEvidence;
    }
  | {
      status: "blocked";
      version: typeof SIMULATION_RECORD_PERSISTENCE_VERSION;
      reason: SimulationRecordPersistenceBlockedReason;
      message: string;
      evidence: SimulationRecordPersistenceEvidence;
    };

type ConfigEnv = Record<string, string | undefined>;

function isEnabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function evidence(): SimulationRecordPersistenceEvidence {
  return {
    stage: "4.2I",
    simulationRecordsOnly: true,
    explicitSaveOnly: true,
    controlledRolloutRequired: true,
    runtimeWiringUsed: true,
    providerResolutionUsed: true,
    historyRuntimeStarted: false,
    draftsRuntimeStarted: false,
    dashboardIntegrated: false,
    uiChanged: false,
    apiRouteChanged: false,
    authRuntimeChanged: false,
    simulatorRuntimeChanged: false,
    schemaChanged: false,
    migrationsChanged: false,
    stage42JStarted: false,
    stage42KStarted: false,
    stage43Started: false,
    stage44Started: false,
    rollback: "disable_simulation_record_persistence_or_remove_service_exports",
  };
}

function blocked(
  reason: SimulationRecordPersistenceBlockedReason,
  message: string,
): SimulationRecordSaveResult {
  return {
    status: "blocked",
    version: SIMULATION_RECORD_PERSISTENCE_VERSION,
    reason,
    message,
    evidence: evidence(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function truncateTitle(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.length > 140 ? `${trimmed.slice(0, 137).trim()}...` : trimmed;
}

function normalizeUserNote(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function supportsSimulationRecordSaveProvider(
  value: unknown,
): value is SupabaseSimulationRecordSaveProvider {
  return isRecord(value) && typeof value.saveSimulationRecord === "function";
}

export function readSimulationRecordPersistenceConfig(
  env: ConfigEnv = process.env,
): SimulationRecordPersistenceConfig {
  return {
    enabled: isEnabledFlag(env.LEVIO_SIMULATION_RECORD_PERSISTENCE_ENABLED),
  };
}

export function simulationRecordPersistenceEvidence(): SimulationRecordPersistenceEvidence {
  return evidence();
}

export function buildSimulationRecordInsertPayload(input: {
  simulation: SimulationResponse;
  ownerPrincipalId: string;
  title?: string;
  userNote?: string;
}): SupabaseSimulationRecordInsertPayload | null {
  const { simulation } = input;

  if (
    !simulation ||
    simulation.lang !== "es" ||
    !simulation.input ||
    !simulation.generatedAt ||
    !isRecord(simulation.simulation)
  ) {
    return null;
  }

  const title = truncateTitle(input.title ?? simulation.simulation.decision);

  return {
    owner_principal_id: input.ownerPrincipalId,
    owner_principal_type: "registered_user",
    record_status: "active",
    source_type: "explicit_save",
    title,
    user_note: normalizeUserNote(input.userNote),
    user_input_snapshot: {
      input: simulation.input,
      language: simulation.lang,
      generatedAt: simulation.generatedAt,
      source: "levio_simulator",
    },
    deterministic_output_snapshot: {
      simulation: simulation.simulation,
      thinkingStages: simulation.thinkingStages,
    },
    metadata: {
      source: "simulator",
      simulationId: simulation.simulation.id,
      category: simulation.simulation.category,
      generatedAt: simulation.generatedAt,
      persistenceVersion: SIMULATION_RECORD_PERSISTENCE_VERSION,
    },
    safety_flags: {
      mockOnly: true,
      memoryCreated: false,
      aiProviderUsed: false,
    },
    clarification_snapshot: null,
    decision_model_snapshot: null,
    confidence_summary: {
      confidence: simulation.simulation.signals.confidence,
      risk: simulation.simulation.signals.risk,
      advantage: simulation.simulation.signals.advantage,
    },
    simulation_response_version: "simulation_response_v1_mock",
    decision_contract_version: "stage_4_2i_simulator_persistence_v1",
    language: simulation.lang,
    safety_classification: "standard_user_decision_content",
    recommendation_state: "mock_recommendation_available",
    content_sensitivity: "user_decision_content",
    deletion_state: "active",
    retention_rule: "saved_simulation_lifecycle",
    export_eligible: true,
    schema_version: 1,
  };
}

export async function saveSimulationRecordFromSimulationResponse(
  input: SimulationRecordSaveInput,
): Promise<SimulationRecordSaveResult> {
  const config = input.config ?? readSimulationRecordPersistenceConfig();

  if (!config.enabled) {
    return blocked(
      "persistence_disabled",
      "Simulation record persistence is disabled by controlled rollout configuration.",
    );
  }

  if (input.authContext?.identityState !== "authenticated") {
    return blocked(
      "auth_context_not_authenticated",
      "Simulation record persistence requires an authenticated auth context.",
    );
  }

  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();

  if (runtime.status !== "ready") {
    return blocked("runtime_not_ready", "Persistence runtime wiring is not ready.");
  }

  const saveProvider = input.saveProvider ?? runtime.providerAdapter;

  if (!supportsSimulationRecordSaveProvider(saveProvider)) {
    return blocked(
      "provider_save_not_supported",
      "Configured persistence provider does not support simulation record saves.",
    );
  }

  const preflight = await runtime.preflight({
    operation: "resolve_principal",
    authContext: input.authContext,
  });

  if (preflight.status === "blocked") {
    return blocked("principal_preflight_blocked", preflight.message);
  }

  const payload = buildSimulationRecordInsertPayload({
    simulation: input.simulation,
    ownerPrincipalId: preflight.principalId,
    title: input.title,
    userNote: input.userNote,
  });

  if (!payload) {
    return blocked(
      "simulation_payload_invalid",
      "Simulation response cannot be mapped to a simulation_records payload.",
    );
  }

  const record = await saveProvider.saveSimulationRecord(payload);

  if (!record) {
    return blocked(
      "simulation_record_save_failed",
      "Simulation record provider failed to save the record.",
    );
  }

  return {
    status: "saved",
    version: SIMULATION_RECORD_PERSISTENCE_VERSION,
    record,
    principalId: preflight.principalId,
    evidence: evidence(),
  };
}
