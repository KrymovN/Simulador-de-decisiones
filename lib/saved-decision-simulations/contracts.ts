import type { LevioAuthRuntimeContext } from "../auth/types";
import type {
  JsonObject,
  PersistenceRuntimeWiring,
  SimulationRecordPersistenceConfig,
  SimulationRecordRow,
  SimulationRecordStatus,
  SupabaseSimulationRecordArchiveProvider,
  SupabaseSimulationRecordDeleteProvider,
  SupabaseSimulationRecordReadProvider,
  SupabaseSimulationRecordSaveProvider,
} from "../persistence-runtime";
import type { SimulationResponse } from "../simulationEngine";

export const SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION =
  "block-a-a2-decision-simulation-persistence-runtime-mapping.1" as const;

export const DECISION_SIMULATION_DOMAIN_MODEL_VERSION =
  "block-a-a1-decision-simulation-domain-model.1" as const;

export type SavedDecisionSimulationsRuntimeVersion =
  typeof SAVED_DECISION_SIMULATIONS_RUNTIME_VERSION;

export type SavedDecisionSimulationsRuntimeConfig = {
  enabled: boolean;
  simulationRecordPersistence: SimulationRecordPersistenceConfig;
};

export type SavedDecisionSimulationsRuntimeEvidence = {
  stage: "block-a-a2";
  productCapability: "saved_decision_simulations";
  runtimeCapability: "decision_simulation_persistence_runtime_mapping";
  serverRuntimeBoundaryOnly: true;
  usesAuthRuntime: true;
  usesPersistenceRuntime: true;
  usesDecisionSimulationEngineArtifact: true;
  domainModelMapped: true;
  saveSupported: true;
  loadSupported: true;
  listSupported: true;
  reopenSupported: true;
  archiveSupported: true;
  ownerScopedReadsOnly: true;
  ownerScopedWritesOnly: true;
  clientOwnerInputAccepted: false;
  schemaChanged: false;
  migrationsChanged: false;
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
  | "provider_archive_not_supported"
  | "provider_delete_not_supported"
  | "principal_preflight_blocked"
  | "client_owner_input_rejected"
  | "record_id_invalid"
  | "record_not_found"
  | "record_owner_scope_failed"
  | "record_archive_failed"
  | "record_delete_failed"
  | "record_delete_restricted"
  | "record_save_blocked";

export type DecisionSimulationLifecycleState =
  | "saved"
  | "reopened"
  | "archived"
  | "deletion_requested"
  | "deleted"
  | "restricted";

export type DecisionSimulationPersistenceMapping = {
  storedNow: string[];
  deferred: string[];
  computedRuntime: string[];
  prohibitedClientFields: string[];
};

export type DecisionSimulationDomainModel = {
  identity: {
    simulationId: string;
    schemaVersion: number;
    domainModelVersion: typeof DECISION_SIMULATION_DOMAIN_MODEL_VERSION;
    createdAt: string;
    updatedAt: string;
  };
  ownership: {
    ownerPrincipalId: string;
    ownerPrincipalType: "registered_user";
    ownershipSource: "resolved_server_principal";
    ownerVerifiedAt: string;
  };
  simulationInput: {
    userInputSnapshot: JsonObject;
    language: string;
    sourceSurface: string;
    submittedAt: string;
    title: string | null;
    userNote: string | null;
    originatingDraftId: string | null;
    clarificationSnapshot: JsonObject | null;
  };
  decisionContext: {
    stored: boolean;
    snapshot: JsonObject | null;
    deferred: boolean;
  };
  generatedScenarios: {
    stored: boolean;
    snapshot: JsonObject | null;
    deferred: boolean;
  };
  decisionEngineOutput: {
    status: string;
    recommendationState: string;
    simulationResponseVersion: string;
    decisionContractVersion: string;
    deterministicOutputSnapshot: JsonObject;
    confidenceSummary: JsonObject | null;
  };
  aiMetadata: {
    aiProviderUsed: boolean;
    realAiExecution: "deferred";
    rawProviderMaterialStored: false;
  };
  runtimeMetadata: {
    runtimeTruthBoundary: "deterministic_preview" | "future_real_ai_path";
    sourceType: "explicit_save" | "approved_account_save" | "registered_user_import";
    safetyClassification: string;
    contentSensitivity: string;
    metadata: JsonObject;
    safetyFlags: JsonObject;
  };
  auditMetadata: {
    parentRecordId: string | null;
    revisionLabel: string | null;
    lastExportedAt: string | null;
  };
  lifecycleMetadata: {
    state: DecisionSimulationLifecycleState;
    recordStatus: SimulationRecordStatus;
    deletionState: SimulationRecordRow["deletion_state"];
    archivedAt: string | null;
    deletedAt: string | null;
    retentionRule: string;
    exportEligible: boolean;
    legalHoldReason: string | null;
  };
  futureVersioning: {
    schemaVersion: number;
    domainModelVersion: typeof DECISION_SIMULATION_DOMAIN_MODEL_VERSION;
    parentRecordId: string | null;
    revisionLabel: string | null;
  };
  persistenceMapping: DecisionSimulationPersistenceMapping;
};

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

export type SavedDecisionSimulationReopenInput = SavedDecisionSimulationLoadInput;

export type SavedDecisionSimulationArchiveInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  recordId: string;
  archivedAt?: string;
  runtime?: PersistenceRuntimeWiring;
  archiveProvider?: SupabaseSimulationRecordArchiveProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SavedDecisionSimulationDeleteInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  recordId: string;
  deletedAt?: string;
  runtime?: PersistenceRuntimeWiring;
  deleteProvider?: SupabaseSimulationRecordDeleteProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SavedDecisionSimulationSaveResult =
  | {
      status: "saved";
      version: SavedDecisionSimulationsRuntimeVersion;
      record: SimulationRecordRow;
      simulation: DecisionSimulationDomainModel;
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationLoadResult =
  | {
      status: "loaded";
      version: SavedDecisionSimulationsRuntimeVersion;
      record: SimulationRecordRow;
      simulation: DecisionSimulationDomainModel;
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationListResult =
  | {
      status: "listed";
      version: SavedDecisionSimulationsRuntimeVersion;
      records: SimulationRecordRow[];
      simulations: DecisionSimulationDomainModel[];
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationReopenResult =
  | {
      status: "reopened";
      version: SavedDecisionSimulationsRuntimeVersion;
      record: SimulationRecordRow;
      simulation: DecisionSimulationDomainModel;
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationArchiveResult =
  | {
      status: "archived";
      version: SavedDecisionSimulationsRuntimeVersion;
      record: SimulationRecordRow;
      simulation: DecisionSimulationDomainModel;
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | SavedDecisionSimulationsBlockedResult;

export type SavedDecisionSimulationDeleteResult =
  | {
      status: "deleted";
      version: SavedDecisionSimulationsRuntimeVersion;
      record: SimulationRecordRow;
      principalId: string;
      evidence: SavedDecisionSimulationsRuntimeEvidence;
    }
  | {
      status: "already_absent";
      version: SavedDecisionSimulationsRuntimeVersion;
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
