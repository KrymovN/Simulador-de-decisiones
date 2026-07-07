import type { LevioAuthRuntimeContext } from "../auth/types";

export const PERSISTENCE_RUNTIME_FOUNDATION_VERSION = "4.2E-foundation.1" as const;
export const PERSISTENCE_RUNTIME_FOUNDATION_MODE = "foundation_only" as const;

export type PersistenceRuntimeFoundationVersion =
  typeof PERSISTENCE_RUNTIME_FOUNDATION_VERSION;
export type PersistenceRuntimeFoundationMode = typeof PERSISTENCE_RUNTIME_FOUNDATION_MODE;

export type PersistenceProviderId = "supabase";
export type PersistenceProviderSubjectType = "user";
export type PersistencePrincipalType = "registered_user";
export type PersistenceOwnerPrincipalType = "registered_user";

export type PersistencePrincipalStatus =
  | "active"
  | "disabled"
  | "restricted"
  | "deletion_requested"
  | "deleted";

export type PersistenceProviderReferenceStatus =
  | "active"
  | "revoked"
  | "replaced"
  | "recovery_pending";

export type PersistenceDeletionState =
  | "active"
  | "deletion_requested"
  | "restricted"
  | "deleted"
  | "anonymized"
  | "retained_legal_exception";

export type SimulationRecordStatus =
  | "active"
  | "archived"
  | "restricted"
  | "deletion_pending"
  | "deleted";

export type SimulationRecordSourceType =
  | "explicit_save"
  | "approved_account_save"
  | "registered_user_import";

export type SimulationDraftStatus =
  | "active"
  | "saved"
  | "converted"
  | "discarded"
  | "expired"
  | "restricted"
  | "deleted";

export type SimulationHistoryEventType =
  | "created"
  | "updated"
  | "archived"
  | "restored"
  | "deleted"
  | "export_requested"
  | "export_completed"
  | "revision_created"
  | "outcome_added"
  | "claim_completed";

export type SimulationHistoryEventSource =
  | "server"
  | "owner_action"
  | "system_lifecycle"
  | "import_flow"
  | "export_flow";

export type JsonObject = Record<string, unknown>;

export type LevioPrincipalRow = {
  principal_id: string;
  principal_type: PersistencePrincipalType;
  principal_status: PersistencePrincipalStatus;
  provider_name: PersistenceProviderId;
  provider_reference: string;
  provider_reference_status: PersistenceProviderReferenceStatus;
  provider_subject_type: PersistenceProviderSubjectType;
  provider_email_snapshot: string | null;
  provider_email_verified: boolean;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  disabled_at: string | null;
  deleted_at: string | null;
  deletion_requested_at: string | null;
  last_authenticated_at: string | null;
  last_provider_sync_at: string | null;
  deletion_state: PersistenceDeletionState;
  retention_rule: string;
  recovery_state: string | null;
  locale_preference: string | null;
  metadata_version: number | null;
  legal_hold_reason: string | null;
  schema_version: number;
};

export type SimulationRecordRow = {
  record_id: string;
  owner_principal_id: string;
  owner_principal_type: PersistenceOwnerPrincipalType;
  record_status: SimulationRecordStatus;
  source_type: SimulationRecordSourceType;
  title: string | null;
  user_note: string | null;
  user_input_snapshot: JsonObject;
  deterministic_output_snapshot: JsonObject;
  metadata: JsonObject;
  safety_flags: JsonObject;
  clarification_snapshot: JsonObject | null;
  decision_model_snapshot: JsonObject | null;
  confidence_summary: JsonObject | null;
  simulation_response_version: string;
  decision_contract_version: string;
  language: string;
  safety_classification: string;
  recommendation_state: string;
  content_sensitivity: string;
  originating_draft_id: string | null;
  parent_record_id: string | null;
  revision_label: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  last_exported_at: string | null;
  deletion_state: PersistenceDeletionState;
  retention_rule: string;
  export_eligible: boolean;
  legal_hold_reason: string | null;
  schema_version: number;
};

export type SimulationDraftRow = {
  draft_id: string;
  owner_principal_id: string;
  owner_principal_type: PersistenceOwnerPrincipalType;
  draft_status: SimulationDraftStatus;
  draft_payload: JsonObject;
  draft_text_snapshot: string | null;
  clarification_answers_snapshot: JsonObject | null;
  structured_context_snapshot: JsonObject | null;
  language: string;
  autosave_enabled: boolean;
  originating_surface: string | null;
  converted_record_id: string | null;
  created_at: string;
  updated_at: string;
  last_autosaved_at: string | null;
  expires_at: string;
  discarded_at: string | null;
  deleted_at: string | null;
  deletion_state: PersistenceDeletionState;
  retention_rule: string;
  export_eligible: boolean;
  legal_hold_reason: string | null;
  schema_version: number;
};

export type SimulationHistoryEntryRow = {
  history_entry_id: string;
  owner_principal_id: string;
  owner_principal_type: PersistenceOwnerPrincipalType;
  record_id: string;
  event_type: SimulationHistoryEventType;
  event_timestamp: string;
  event_source: SimulationHistoryEventSource;
  user_visible: boolean;
  event_summary: string | null;
  event_payload: JsonObject;
  before_reference: string | null;
  after_reference: string | null;
  revision_reference: string | null;
  outcome_snapshot: JsonObject | null;
  claim_transaction_reference: string | null;
  export_reference: string | null;
  created_at: string;
  updated_at: string;
  deletion_state: PersistenceDeletionState;
  retention_rule: string;
  export_eligible: boolean;
  deleted_at: string | null;
  legal_hold_reason: string | null;
  schema_version: number;
};

export type PersistenceProviderAdapter = {
  providerId: PersistenceProviderId;
  executionBoundary: "server_only";
  resolvePrincipalByProviderReference(input: {
    providerReference: string;
    providerSubjectType: PersistenceProviderSubjectType;
  }): Promise<LevioPrincipalRow | null>;
  resolveOrProvisionPrincipalByProviderReference?(input: {
    providerReference: string;
    providerSubjectType: PersistenceProviderSubjectType;
    email?: string;
    emailVerified?: boolean;
    authenticatedAt?: string;
  }): Promise<LevioPrincipalRow | null>;
};

export type PersistenceRuntimeOperation =
  | "resolve_principal"
  | "list_simulation_records"
  | "read_simulation_record"
  | "create_simulation_record"
  | "update_simulation_record"
  | "archive_simulation_record"
  | "delete_simulation_record"
  | "list_simulation_drafts"
  | "read_simulation_draft"
  | "create_simulation_draft"
  | "update_simulation_draft"
  | "delete_simulation_draft"
  | "list_simulation_history"
  | "append_simulation_history_entry";

export type PersistenceRuntimeBlockedReason =
  | "auth_context_missing"
  | "auth_context_not_authenticated"
  | "session_not_active"
  | "principal_type_not_supported"
  | "provider_not_supported"
  | "provider_reference_invalid"
  | "client_owner_input_rejected"
  | "resolved_principal_missing"
  | "resolved_principal_not_active"
  | "owner_mismatch"
  | "foundation_only_write_disabled"
  | "provider_adapter_not_configured";

export type PersistenceRuntimePreflightInput = {
  operation: PersistenceRuntimeOperation;
  authContext: LevioAuthRuntimeContext | null | undefined;
  resourceOwnerPrincipalId?: string;
  resolvedPrincipal?: LevioPrincipalRow | null;
  clientOwnerFields?: {
    principalId?: string;
    ownerPrincipalId?: string;
    ownerPrincipalType?: string;
    providerReference?: string;
  };
};

export type PersistenceRuntimeSafetyEvidence = {
  foundationOnly: true;
  providerIsolated: true;
  serverOnlyBoundaryRequired: true;
  authRuntimeReadByFoundation: false;
  supabaseClientCreated: false;
  sqlExecuted: false;
  userOperationExecuted: false;
  uiIntegrated: false;
  simulatorIntegrated: false;
  aiIntegrated: false;
  memoryIntegrated: false;
  subscriptionsIntegrated: false;
  stage43Started: false;
  stage44Started: false;
  rollback: "remove_persistence_runtime_foundation_exports";
};

export type PersistenceRuntimeAllowedPreflight = {
  status: "allowed";
  execution: "preflight_only";
  operation: PersistenceRuntimeOperation;
  principalId: string;
  provider: PersistenceProviderId;
  providerReference: string;
  evidence: PersistenceRuntimeSafetyEvidence;
};

export type PersistenceRuntimeBlockedPreflight = {
  status: "blocked";
  execution: "none";
  operation: PersistenceRuntimeOperation;
  reason: PersistenceRuntimeBlockedReason;
  message: string;
  evidence: PersistenceRuntimeSafetyEvidence;
};

export type PersistenceRuntimePreflightResult =
  | PersistenceRuntimeAllowedPreflight
  | PersistenceRuntimeBlockedPreflight;

export type PersistenceRuntimeFoundation = {
  version: PersistenceRuntimeFoundationVersion;
  mode: PersistenceRuntimeFoundationMode;
  providerAdapterConfigured: boolean;
  writesEnabled: false;
  preflight(input: PersistenceRuntimePreflightInput): PersistenceRuntimePreflightResult;
};

export type PersistenceRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: PersistenceRuntimePreflightResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type PersistenceRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PersistenceRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
