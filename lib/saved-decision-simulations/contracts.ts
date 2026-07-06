import type { LevioAuthRuntimeContext } from "../auth/types";
import type {
  PersistenceRuntimeWiring,
  SimulationRecordPersistenceConfig,
  SimulationRecordRow,
  SupabaseSimulationRecordReadProvider,
  SupabaseSimulationRecordSaveProvider,
} from "../persistence-runtime";
import type { SimulationResponse } from "../simulationEngine";

export const SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION =
  "15-saved-decision-simulations-runtime-foundation.1" as const;

export type SavedDecisionSimulationsRuntimeVersion =
  typeof SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION;

export type SavedDecisionSimulationsRuntimeConfig = {
  enabled: boolean;
  simulationRecordPersistence: SimulationRecordPersistenceConfig;
};

export type SavedDecisionSimulationsRuntimeEvidence = {
  stage: "15-product-implementation";
  productCapability: "saved_decision_simulations";
  serverRuntimeBoundaryOnly: true;
  usesAuthRuntime: true;
  usesPersistenceRuntime: true;
  usesDecisionSimulationEngineArtifact: true;
  saveSupported: true;
  loadSupported: true;
  listSupported: true;
  ownerScopedReadsOnly: true;
  clientOwnerInputAccepted: false;
  uiChanged: false;
  apiRouteChanged: false;
  publicContractChanged: false;
  architectureInvariantChanged: false;
  productionReleaseOpened: false;
  commercialLaunchOpened: false;
  realAiIntegrated: false;
  billingIntegrated: false;
  analyticsIntegrated: false;
  trackingIntegrated: false;
  roadmapChanged: false;
  rollback: "remove_saved_decision_simulations_runtime_exports";
};

export type SavedDecisionSimulationsBlockedReason =
  | "runtime_disabled"
  | "auth_context_not_authenticated"
  | "persistence_runtime_not_ready"
  | "provider_read_not_supported"
  | "principal_preflight_blocked"
  | "record_id_invalid"
  | "record_not_found"
  | "record_owner_scope_failed"
  | "record_save_blocked";

export type SavedDecisionSimulationSaveInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  simulation: SimulationResponse;
  title?: string;
  userNote?: string;
  runtime?: PersistenceRuntimeWiring;
  saveProvider?: SupabaseSimulationRecordSaveProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SavedDecisionSimulationLoadInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  recordId: string;
  runtime?: PersistenceRuntimeWiring;
  readProvider?: SupabaseSimulationRecordReadProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SavedDecisionSimulationListInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  limit?: number;
  runtime?: PersistenceRuntimeWiring;
  readProvider?: SupabaseSimulationRecordReadProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SavedDecisionSimulationSaveResult =
  | {
      status: "saved";
      version: SavedDecisionSimulationsRuntimeVersion;
      record: SimulationRecordRow;
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationLoadResult =
  | {
      status: "loaded";
      version: SavedDecisionSimulationsRuntimeVersion;
      record: SimulationRecordRow;
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationListResult =
  | {
      status: "listed";
      version: SavedDecisionSimulationsRuntimeVersion;
      records: SimulationRecordRow[];
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationsBlockedResult = {
  status: "blocked";
  version: SavedDecisionSimulationsRuntimeVersion;
  reason: SavedDecisionSimulationsBlockedReason;
  message: string;
  evidence: SavedDecisionSimulationsRuntimeEvidence;
};
