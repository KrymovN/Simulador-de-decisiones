import type { LevioAuthRuntimeContext } from "../auth/types";

export const CONSENT_RUNTIME_FOUNDATION_VERSION =
  "4.3B-consent-runtime-foundation.1" as const;
export const CONSENT_RUNTIME_FOUNDATION_MODE = "consent_foundation_only" as const;
export const RETENTION_RUNTIME_FOUNDATION_VERSION =
  "4.3C-retention-runtime-foundation.1" as const;
export const RETENTION_RUNTIME_FOUNDATION_MODE = "retention_foundation_only" as const;
export const EXPORT_RUNTIME_FOUNDATION_VERSION =
  "4.3D-export-runtime-foundation.1" as const;
export const EXPORT_RUNTIME_FOUNDATION_MODE = "export_foundation_only" as const;
export const DELETION_RUNTIME_FOUNDATION_VERSION =
  "4.3E-deletion-runtime-foundation.1" as const;
export const DELETION_RUNTIME_FOUNDATION_MODE = "deletion_foundation_only" as const;

export type ConsentRuntimeFoundationVersion =
  typeof CONSENT_RUNTIME_FOUNDATION_VERSION;
export type ConsentRuntimeFoundationMode =
  typeof CONSENT_RUNTIME_FOUNDATION_MODE;
export type RetentionRuntimeFoundationVersion =
  typeof RETENTION_RUNTIME_FOUNDATION_VERSION;
export type RetentionRuntimeFoundationMode =
  typeof RETENTION_RUNTIME_FOUNDATION_MODE;
export type ExportRuntimeFoundationVersion =
  typeof EXPORT_RUNTIME_FOUNDATION_VERSION;
export type ExportRuntimeFoundationMode =
  typeof EXPORT_RUNTIME_FOUNDATION_MODE;
export type DeletionRuntimeFoundationVersion =
  typeof DELETION_RUNTIME_FOUNDATION_VERSION;
export type DeletionRuntimeFoundationMode =
  typeof DELETION_RUNTIME_FOUNDATION_MODE;

export type ConsentOwnerPrincipalType = "registered_user";

export type ConsentPurpose =
  | "saved_simulation_persistence"
  | "sensitive_decision_history"
  | "cross_decision_reuse"
  | "memory_promotion"
  | "analytics_reuse"
  | "ai_training_reuse"
  | "workspace_sharing";

export type ConsentDataCategory =
  | "levio_principal_metadata"
  | "simulation_records"
  | "simulation_drafts"
  | "simulation_history_entries"
  | "sensitive_decision_context"
  | "cross_decision_patterns";

export type ConsentRequirement =
  | "consent_not_required"
  | "consent_required"
  | "out_of_scope";

export type ConsentStatus = "granted" | "withdrawn" | "expired";

export type ConsentCaptureContext =
  | "owner_action"
  | "runtime_policy"
  | "account_control";

export type ConsentPurposePolicy = {
  purpose: ConsentPurpose;
  requirement: ConsentRequirement;
  policyVersion: string;
  dataCategories: ConsentDataCategory[];
};

export type ConsentRecord = {
  consentId: string;
  ownerPrincipalId: string;
  ownerPrincipalType: ConsentOwnerPrincipalType;
  purpose: ConsentPurpose;
  dataCategories: ConsentDataCategory[];
  status: ConsentStatus;
  policyVersion: string;
  grantedAt?: string;
  withdrawnAt?: string;
  expiresAt?: string;
  captureContext: ConsentCaptureContext;
};

export type ConsentRuntimeConfig = {
  enabled: boolean;
  policies: ConsentPurposePolicy[];
};

export type ConsentRuntimeBlockedReason =
  | "consent_runtime_disabled"
  | "auth_context_missing"
  | "auth_context_not_authenticated"
  | "session_not_active"
  | "principal_type_not_supported"
  | "client_owner_input_rejected"
  | "owner_mismatch"
  | "purpose_not_supported"
  | "purpose_out_of_scope"
  | "consent_required_missing"
  | "consent_record_owner_mismatch"
  | "consent_record_purpose_mismatch"
  | "consent_record_policy_mismatch"
  | "consent_record_not_granted"
  | "consent_record_expired";

export type ConsentRuntimeSafetyEvidence = {
  stage: "4.3B";
  consentOnly: true;
  foundationOnly: true;
  failClosedByDefault: true;
  runtimeWritesEnabled: false;
  dbOperationsExecuted: false;
  exportRuntimeStarted: false;
  deletionRuntimeStarted: false;
  retentionRuntimeStarted: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  apiRouteIntegrated: false;
  authRuntimeChanged: false;
  simulatorIntegrated: false;
  persistenceSchemaChanged: false;
  migrationsChanged: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  aiIntegrated: false;
  stage43CStarted: false;
  stage44Started: false;
  rollback: "disable_consent_runtime_or_remove_user_data_controls_exports";
};

export type ConsentRuntimeEvaluationInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  purpose: ConsentPurpose;
  ownerPrincipalId?: string;
  consentRecord?: ConsentRecord | null;
  now?: string;
  clientOwnerFields?: {
    principalId?: string;
    ownerPrincipalId?: string;
    ownerPrincipalType?: string;
    providerReference?: string;
  };
};

export type ConsentRuntimeAllowedEvaluation = {
  status: "allowed";
  execution: "preflight_only";
  version: ConsentRuntimeFoundationVersion;
  purpose: ConsentPurpose;
  requirement: Exclude<ConsentRequirement, "out_of_scope">;
  principalId: string;
  policyVersion: string;
  consentId?: string;
  evidence: ConsentRuntimeSafetyEvidence;
};

export type ConsentRuntimeBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: ConsentRuntimeFoundationVersion;
  purpose: ConsentPurpose;
  reason: ConsentRuntimeBlockedReason;
  message: string;
  evidence: ConsentRuntimeSafetyEvidence;
};

export type ConsentRuntimeEvaluationResult =
  | ConsentRuntimeAllowedEvaluation
  | ConsentRuntimeBlockedEvaluation;

export type ConsentRuntimeFoundation = {
  version: ConsentRuntimeFoundationVersion;
  mode: ConsentRuntimeFoundationMode;
  enabled: boolean;
  writesEnabled: false;
  supportedPurposes: ConsentPurpose[];
  evaluate(input: ConsentRuntimeEvaluationInput): ConsentRuntimeEvaluationResult;
};

export type ConsentRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: ConsentRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type ConsentRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: ConsentRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type RetentionOwnerPrincipalType = "registered_user";

export type RetentionResourceCategory =
  | "saved_simulation"
  | "simulation_draft"
  | "simulation_history_entry";

export type RetentionLifecycleState =
  | "active"
  | "archived"
  | "deletion_requested"
  | "deletion_pending"
  | "restricted"
  | "deleted"
  | "anonymized"
  | "retained_legal_exception"
  | "expired"
  | "discarded"
  | "converted"
  | "saved";

export type RetentionRule =
  | "saved_simulation_lifecycle"
  | "draft_short_lifecycle"
  | "parent_simulation_lifecycle";

export type RetentionPolicyAction =
  | "retain"
  | "deletion_planning_eligible"
  | "restriction_review_eligible";

export type RetentionPolicy = {
  rule: RetentionRule;
  resourceCategory: RetentionResourceCategory;
  policyVersion: string;
  defaultAction: RetentionPolicyAction;
  requiresExpiration: boolean;
  requiresParentRecord: boolean;
  foundationOnly: true;
};

export type RetentionResourceSnapshot = {
  resourceId: string;
  resourceCategory: RetentionResourceCategory;
  ownerPrincipalId: string;
  ownerPrincipalType: RetentionOwnerPrincipalType;
  lifecycleState: RetentionLifecycleState;
  deletionState:
    | "active"
    | "deletion_requested"
    | "restricted"
    | "deleted"
    | "anonymized"
    | "retained_legal_exception";
  retentionRule: RetentionRule | string;
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
  expiresAt?: string | null;
  legalHoldReason?: string | null;
  exportEligible?: boolean;
};

export type RetentionParentSnapshot = {
  recordId: string;
  ownerPrincipalId: string;
  ownerPrincipalType: RetentionOwnerPrincipalType;
  lifecycleState: RetentionLifecycleState;
  deletionState: RetentionResourceSnapshot["deletionState"];
  retentionRule: RetentionRule | string;
};

export type RetentionRuntimeConfig = {
  enabled: boolean;
  policies: RetentionPolicy[];
};

export type RetentionRuntimeBlockedReason =
  | "retention_runtime_disabled"
  | "auth_context_missing"
  | "auth_context_not_authenticated"
  | "session_not_active"
  | "principal_type_not_supported"
  | "client_owner_input_rejected"
  | "owner_mismatch"
  | "resource_snapshot_missing"
  | "resource_owner_mismatch"
  | "resource_type_not_supported"
  | "retention_policy_missing"
  | "retention_rule_mismatch"
  | "timestamp_invalid"
  | "expiration_required_missing"
  | "parent_context_required"
  | "parent_owner_mismatch"
  | "parent_retention_rule_unsupported";

export type RetentionDecision =
  | "retain"
  | "retain_until_expiration"
  | "retain_legal_exception"
  | "retain_until_parent_lifecycle_changes"
  | "eligible_for_deletion_planning"
  | "eligible_for_restriction_review"
  | "already_terminal";

export type RetentionRuntimeSafetyEvidence = {
  stage: "4.3C";
  retentionOnly: true;
  foundationOnly: true;
  failClosedByDefault: true;
  runtimeWritesEnabled: false;
  dbOperationsExecuted: false;
  retentionJobsStarted: false;
  exportRuntimeStarted: false;
  deletionRuntimeStarted: false;
  consentRuntimeChanged: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  apiRouteIntegrated: false;
  authRuntimeChanged: false;
  simulatorIntegrated: false;
  persistenceSchemaChanged: false;
  migrationsChanged: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  aiIntegrated: false;
  stage43DStarted: false;
  stage44Started: false;
  stage5Started: false;
  rollback: "disable_retention_runtime_or_remove_retention_foundation_exports";
};

export type RetentionRuntimeEvaluationInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  ownerPrincipalId?: string;
  resource?: RetentionResourceSnapshot | null;
  parentRecord?: RetentionParentSnapshot | null;
  now?: string;
  clientOwnerFields?: {
    principalId?: string;
    ownerPrincipalId?: string;
    ownerPrincipalType?: string;
    providerReference?: string;
  };
};

export type RetentionRuntimeAllowedEvaluation = {
  status: "allowed";
  execution: "preflight_only";
  version: RetentionRuntimeFoundationVersion;
  resourceId: string;
  resourceCategory: RetentionResourceCategory;
  retentionRule: RetentionRule;
  decision: RetentionDecision;
  lifecycleAction: "none" | "deletion_planning" | "restriction_review";
  eligibleForDeletionDecision: boolean;
  principalId: string;
  policyVersion: string;
  evidence: RetentionRuntimeSafetyEvidence;
};

export type RetentionRuntimeBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: RetentionRuntimeFoundationVersion;
  reason: RetentionRuntimeBlockedReason;
  message: string;
  evidence: RetentionRuntimeSafetyEvidence;
};

export type RetentionRuntimeEvaluationResult =
  | RetentionRuntimeAllowedEvaluation
  | RetentionRuntimeBlockedEvaluation;

export type RetentionRuntimeFoundation = {
  version: RetentionRuntimeFoundationVersion;
  mode: RetentionRuntimeFoundationMode;
  enabled: boolean;
  writesEnabled: false;
  supportedRules: RetentionRule[];
  evaluate(
    input: RetentionRuntimeEvaluationInput,
  ): RetentionRuntimeEvaluationResult;
};

export type RetentionRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: RetentionRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type RetentionRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: RetentionRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type ExportOwnerPrincipalType = "registered_user";

export type ExportResourceCategory =
  | "levio_principal_metadata"
  | "saved_simulation"
  | "simulation_draft"
  | "simulation_history_entry";

export type ExportDataCategory =
  | "principal_profile"
  | "simulation_record"
  | "simulation_draft"
  | "simulation_history"
  | "decision_provenance"
  | "lifecycle_metadata";

export type ExportForbiddenDataCategory =
  | "provider_secret"
  | "auth_token"
  | "internal_security_signal"
  | "service_role_data"
  | "other_user_record"
  | "workspace_record"
  | "billing_record"
  | "ai_prompt"
  | "raw_ai_response"
  | "embedding"
  | "vector"
  | "memory_data";

export type ExportPackageFormat = "manifest_only";

export type ExportRequestScope = {
  includePrincipalMetadata: boolean;
  includeSavedSimulations: boolean;
  includeSimulationDrafts: boolean;
  includeSimulationHistory: boolean;
};

export type ExportEligibilityState =
  | "eligible"
  | "ineligible_deleted"
  | "ineligible_restricted"
  | "ineligible_expired"
  | "ineligible_legal_exception"
  | "ineligible_scope_excluded";

export type ExportResourceSnapshot = {
  resourceId: string;
  resourceCategory: ExportResourceCategory;
  ownerPrincipalId: string;
  ownerPrincipalType: ExportOwnerPrincipalType;
  exportEligible: boolean;
  deletionState:
    | "active"
    | "deletion_requested"
    | "restricted"
    | "deleted"
    | "anonymized"
    | "retained_legal_exception";
  lifecycleState:
    | "active"
    | "archived"
    | "saved"
    | "converted"
    | "deletion_requested"
    | "deletion_pending"
    | "restricted"
    | "deleted"
    | "anonymized"
    | "retained_legal_exception"
    | "expired"
    | "discarded";
  dataCategories: ExportDataCategory[];
  forbiddenDataCategories?: ExportForbiddenDataCategory[];
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
  expiresAt?: string | null;
  retentionRule?: string;
  schemaVersion?: number;
};

export type ExportPackageEntry = {
  resourceId: string;
  resourceCategory: ExportResourceCategory;
  dataCategories: ExportDataCategory[];
  eligibility: Extract<ExportEligibilityState, "eligible">;
};

export type ExportPackagePlan = {
  packageFormat: ExportPackageFormat;
  generation: "not_started";
  fileCreated: false;
  storageWrite: false;
  databaseRead: false;
  includes: ExportPackageEntry[];
  excluded: {
    resourceId: string;
    resourceCategory: ExportResourceCategory;
    eligibility: Exclude<ExportEligibilityState, "eligible">;
    reason: string;
  }[];
  forbiddenCategoriesExcluded: ExportForbiddenDataCategory[];
};

export type ExportRuntimeConfig = {
  enabled: boolean;
  allowedDataCategories: ExportDataCategory[];
  forbiddenDataCategories: ExportForbiddenDataCategory[];
};

export type ExportRuntimeBlockedReason =
  | "export_runtime_disabled"
  | "auth_context_missing"
  | "auth_context_not_authenticated"
  | "session_not_active"
  | "principal_type_not_supported"
  | "client_owner_input_rejected"
  | "owner_mismatch"
  | "export_request_missing"
  | "export_scope_empty"
  | "resource_owner_mismatch"
  | "resource_category_not_supported"
  | "resource_forbidden_data_present"
  | "resource_data_category_not_allowed"
  | "timestamp_invalid"
  | "no_exportable_resources";

export type ExportRuntimeSafetyEvidence = {
  stage: "4.3D";
  exportOnly: true;
  foundationOnly: true;
  failClosedByDefault: true;
  runtimeWritesEnabled: false;
  fileCreated: false;
  archiveCreated: false;
  jsonCreated: false;
  csvCreated: false;
  storageConnected: false;
  dbOperationsExecuted: false;
  supabaseConnected: false;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  cronJobsStarted: false;
  deletionRuntimeStarted: false;
  retentionRuntimeChanged: false;
  consentRuntimeChanged: false;
  authRuntimeChanged: false;
  simulatorIntegrated: false;
  persistenceSchemaChanged: false;
  migrationsChanged: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  aiIntegrated: false;
  stage43EStarted: false;
  stage44Started: false;
  stage5Started: false;
  rollback: "disable_export_runtime_or_remove_export_foundation_exports";
};

export type ExportRuntimeEvaluationInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  ownerPrincipalId?: string;
  request?: {
    requestId: string;
    ownerPrincipalId?: string;
    scope: ExportRequestScope;
    requestedAt: string;
    packageFormat: ExportPackageFormat;
  } | null;
  resources: ExportResourceSnapshot[];
  clientOwnerFields?: {
    principalId?: string;
    ownerPrincipalId?: string;
    ownerPrincipalType?: string;
    providerReference?: string;
  };
};

export type ExportRuntimeAllowedEvaluation = {
  status: "allowed";
  execution: "preflight_only";
  version: ExportRuntimeFoundationVersion;
  requestId: string;
  principalId: string;
  scope: ExportRequestScope;
  packagePlan: ExportPackagePlan;
  evidence: ExportRuntimeSafetyEvidence;
};

export type ExportRuntimeBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: ExportRuntimeFoundationVersion;
  reason: ExportRuntimeBlockedReason;
  message: string;
  evidence: ExportRuntimeSafetyEvidence;
};

export type ExportRuntimeEvaluationResult =
  | ExportRuntimeAllowedEvaluation
  | ExportRuntimeBlockedEvaluation;

export type ExportRuntimeFoundation = {
  version: ExportRuntimeFoundationVersion;
  mode: ExportRuntimeFoundationMode;
  enabled: boolean;
  writesEnabled: false;
  packageFormat: ExportPackageFormat;
  evaluate(input: ExportRuntimeEvaluationInput): ExportRuntimeEvaluationResult;
};

export type ExportRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: ExportRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type ExportRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: ExportRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type DeletionOwnerPrincipalType = "registered_user";

export type DeletionResourceCategory =
  | "levio_principal"
  | "saved_simulation"
  | "simulation_draft"
  | "simulation_history_entry";

export type DeletionRequestKind =
  | "resource_deletion_planning"
  | "account_deletion_planning";

export type DeletionLifecycleState =
  | "active"
  | "archived"
  | "saved"
  | "converted"
  | "expired"
  | "discarded"
  | "deletion_requested"
  | "deletion_pending"
  | "restricted"
  | "deleted"
  | "anonymized"
  | "retained_legal_exception";

export type DeletionState =
  | "active"
  | "deletion_requested"
  | "restricted"
  | "deleted"
  | "anonymized"
  | "retained_legal_exception";

export type DeletionScope = {
  includePrincipalRecord: boolean;
  includeSavedSimulations: boolean;
  includeSimulationDrafts: boolean;
  includeSimulationHistory: boolean;
};

export type DeletionEligibilityState =
  | "eligible_for_lifecycle_request"
  | "eligible_for_restriction_review"
  | "already_terminal"
  | "blocked_legal_hold"
  | "blocked_active_subscription"
  | "blocked_scope_excluded"
  | "blocked_parent_context_missing"
  | "blocked_parent_owner_mismatch";

export type DeletionPlanAction =
  | "mark_deletion_requested"
  | "mark_restricted"
  | "retain_legal_exception"
  | "retain_active_subscription"
  | "no_action_terminal"
  | "no_action_scope_excluded";

export type DeletionResourceSnapshot = {
  resourceId: string;
  resourceCategory: DeletionResourceCategory;
  ownerPrincipalId: string;
  ownerPrincipalType: DeletionOwnerPrincipalType;
  lifecycleState: DeletionLifecycleState;
  deletionState: DeletionState;
  retentionRule: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  expiresAt?: string | null;
  legalHoldReason?: string | null;
  parentRecordId?: string | null;
};

export type DeletionParentSnapshot = {
  recordId: string;
  ownerPrincipalId: string;
  ownerPrincipalType: DeletionOwnerPrincipalType;
  lifecycleState: DeletionLifecycleState;
  deletionState: DeletionState;
};

export type DeletionAccountState = {
  activeSubscription: boolean;
  subscriptionStatus:
    | "none"
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "unknown";
};

export type DeletionRuntimeConfig = {
  enabled: boolean;
};

export type DeletionRuntimeBlockedReason =
  | "deletion_runtime_disabled"
  | "auth_context_missing"
  | "auth_context_not_authenticated"
  | "session_not_active"
  | "principal_type_not_supported"
  | "client_owner_input_rejected"
  | "owner_mismatch"
  | "deletion_request_missing"
  | "deletion_scope_empty"
  | "request_confirmation_missing"
  | "timestamp_invalid"
  | "resource_snapshot_missing"
  | "resource_owner_mismatch"
  | "resource_category_not_supported"
  | "legal_hold_blocks_deletion"
  | "active_subscription_blocks_account_deletion"
  | "parent_context_required"
  | "parent_owner_mismatch"
  | "no_deletable_resources";

export type DeletionPlanEntry = {
  resourceId: string;
  resourceCategory: DeletionResourceCategory;
  eligibility: DeletionEligibilityState;
  plannedAction: DeletionPlanAction;
  execution: "not_started";
  reason: string;
};

export type DeletionPlan = {
  requestKind: DeletionRequestKind;
  execution: "not_started";
  hardDeleteExecuted: false;
  databaseWrite: false;
  supabaseConnected: false;
  lifecycleOnly: true;
  entries: DeletionPlanEntry[];
  blockers: DeletionPlanEntry[];
};

export type DeletionRuntimeSafetyEvidence = {
  stage: "4.3E";
  deletionOnly: true;
  foundationOnly: true;
  failClosedByDefault: true;
  runtimeWritesEnabled: false;
  hardDeleteExecuted: false;
  dbOperationsExecuted: false;
  supabaseConnected: false;
  migrationsChanged: false;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  cronJobsStarted: false;
  exportRuntimeChanged: false;
  retentionRuntimeChanged: false;
  consentRuntimeChanged: false;
  authRuntimeChanged: false;
  simulatorIntegrated: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  aiIntegrated: false;
  stage43FStarted: false;
  stage44Started: false;
  stage5Started: false;
  rollback: "disable_deletion_runtime_or_remove_deletion_foundation_exports";
};

export type DeletionRuntimeEvaluationInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  ownerPrincipalId?: string;
  request?: {
    requestId: string;
    requestKind: DeletionRequestKind;
    ownerPrincipalId?: string;
    scope: DeletionScope;
    requestedAt: string;
    confirmationAcknowledged: boolean;
  } | null;
  accountState?: DeletionAccountState;
  resources: DeletionResourceSnapshot[];
  parentRecords?: DeletionParentSnapshot[];
  clientOwnerFields?: {
    principalId?: string;
    ownerPrincipalId?: string;
    ownerPrincipalType?: string;
    providerReference?: string;
  };
};

export type DeletionRuntimeAllowedEvaluation = {
  status: "allowed";
  execution: "preflight_only";
  version: DeletionRuntimeFoundationVersion;
  requestId: string;
  principalId: string;
  scope: DeletionScope;
  deletionPlan: DeletionPlan;
  evidence: DeletionRuntimeSafetyEvidence;
};

export type DeletionRuntimeBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: DeletionRuntimeFoundationVersion;
  reason: DeletionRuntimeBlockedReason;
  message: string;
  evidence: DeletionRuntimeSafetyEvidence;
};

export type DeletionRuntimeEvaluationResult =
  | DeletionRuntimeAllowedEvaluation
  | DeletionRuntimeBlockedEvaluation;

export type DeletionRuntimeFoundation = {
  version: DeletionRuntimeFoundationVersion;
  mode: DeletionRuntimeFoundationMode;
  enabled: boolean;
  writesEnabled: false;
  evaluate(
    input: DeletionRuntimeEvaluationInput,
  ): DeletionRuntimeEvaluationResult;
};

export type DeletionRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: DeletionRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type DeletionRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: DeletionRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
