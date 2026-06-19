import type { LevioAuthRuntimeContext } from "../auth/types";

export const CONSENT_RUNTIME_FOUNDATION_VERSION =
  "4.3B-consent-runtime-foundation.1" as const;
export const CONSENT_RUNTIME_FOUNDATION_MODE = "consent_foundation_only" as const;
export const RETENTION_RUNTIME_FOUNDATION_VERSION =
  "4.3C-retention-runtime-foundation.1" as const;
export const RETENTION_RUNTIME_FOUNDATION_MODE = "retention_foundation_only" as const;

export type ConsentRuntimeFoundationVersion =
  typeof CONSENT_RUNTIME_FOUNDATION_VERSION;
export type ConsentRuntimeFoundationMode =
  typeof CONSENT_RUNTIME_FOUNDATION_MODE;
export type RetentionRuntimeFoundationVersion =
  typeof RETENTION_RUNTIME_FOUNDATION_VERSION;
export type RetentionRuntimeFoundationMode =
  typeof RETENTION_RUNTIME_FOUNDATION_MODE;

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
