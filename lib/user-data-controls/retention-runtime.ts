import {
  RETENTION_RUNTIME_FOUNDATION_MODE,
  RETENTION_RUNTIME_FOUNDATION_VERSION,
  type RetentionDecision,
  type RetentionPolicy,
  type RetentionResourceSnapshot,
  type RetentionRule,
  type RetentionRuntimeBlockedReason,
  type RetentionRuntimeConfig,
  type RetentionRuntimeEvaluationInput,
  type RetentionRuntimeEvaluationResult,
  type RetentionRuntimeFoundation,
  type RetentionRuntimeSafetyEvidence,
} from "./contracts";

export const DEFAULT_RETENTION_RUNTIME_POLICIES: RetentionPolicy[] = [
  {
    rule: "saved_simulation_lifecycle",
    resourceCategory: "saved_simulation",
    policyVersion: "stage_4_3c_policy_v1",
    defaultAction: "retain",
    requiresExpiration: false,
    requiresParentRecord: false,
    foundationOnly: true,
  },
  {
    rule: "draft_short_lifecycle",
    resourceCategory: "simulation_draft",
    policyVersion: "stage_4_3c_policy_v1",
    defaultAction: "deletion_planning_eligible",
    requiresExpiration: true,
    requiresParentRecord: false,
    foundationOnly: true,
  },
  {
    rule: "parent_simulation_lifecycle",
    resourceCategory: "simulation_history_entry",
    policyVersion: "stage_4_3c_policy_v1",
    defaultAction: "retain",
    requiresExpiration: false,
    requiresParentRecord: true,
    foundationOnly: true,
  },
];

export function retentionRuntimeSafetyEvidence(): RetentionRuntimeSafetyEvidence {
  return {
    stage: "4.3C",
    retentionOnly: true,
    foundationOnly: true,
    failClosedByDefault: true,
    runtimeWritesEnabled: false,
    dbOperationsExecuted: false,
    retentionJobsStarted: false,
    exportRuntimeStarted: false,
    deletionRuntimeStarted: false,
    consentRuntimeChanged: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    apiRouteIntegrated: false,
    authRuntimeChanged: false,
    simulatorIntegrated: false,
    persistenceSchemaChanged: false,
    migrationsChanged: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    aiIntegrated: false,
    stage43DStarted: false,
    stage44Started: false,
    stage5Started: false,
    rollback: "disable_retention_runtime_or_remove_retention_foundation_exports",
  };
}

function blocked(
  reason: RetentionRuntimeBlockedReason,
  message: string,
): RetentionRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: RETENTION_RUNTIME_FOUNDATION_VERSION,
    reason,
    message,
    evidence: retentionRuntimeSafetyEvidence(),
  };
}

function allowed(input: {
  resource: RetentionResourceSnapshot;
  rule: RetentionRule;
  decision: RetentionDecision;
  lifecycleAction: "none" | "deletion_planning" | "restriction_review";
  eligibleForDeletionDecision: boolean;
  principalId: string;
  policyVersion: string;
}): RetentionRuntimeEvaluationResult {
  return {
    status: "allowed",
    execution: "preflight_only",
    version: RETENTION_RUNTIME_FOUNDATION_VERSION,
    resourceId: input.resource.resourceId,
    resourceCategory: input.resource.resourceCategory,
    retentionRule: input.rule,
    decision: input.decision,
    lifecycleAction: input.lifecycleAction,
    eligibleForDeletionDecision: input.eligibleForDeletionDecision,
    principalId: input.principalId,
    policyVersion: input.policyVersion,
    evidence: retentionRuntimeSafetyEvidence(),
  };
}

function hasClientOwnerFields(input: RetentionRuntimeEvaluationInput): boolean {
  const fields = input.clientOwnerFields;

  if (!fields) {
    return false;
  }

  return Boolean(
    fields.principalId ||
      fields.ownerPrincipalId ||
      fields.ownerPrincipalType ||
      fields.providerReference,
  );
}

function findPolicy(
  policies: RetentionPolicy[],
  resource: RetentionResourceSnapshot,
): RetentionPolicy | undefined {
  return policies.find(
    (policy) =>
      policy.rule === resource.retentionRule &&
      policy.resourceCategory === resource.resourceCategory,
  );
}

function isKnownRule(rule: string): rule is RetentionRule {
  return (
    rule === "saved_simulation_lifecycle" ||
    rule === "draft_short_lifecycle" ||
    rule === "parent_simulation_lifecycle"
  );
}

function isValidTimestamp(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }

  return Number.isFinite(Date.parse(value));
}

function isExpired(expiresAt: string, now: string): boolean {
  const expiresAtTime = Date.parse(expiresAt);
  const nowTime = Date.parse(now);

  return (
    Number.isFinite(expiresAtTime) &&
    Number.isFinite(nowTime) &&
    expiresAtTime <= nowTime
  );
}

function validateTimestamps(
  resource: RetentionResourceSnapshot,
  now: string,
): RetentionRuntimeEvaluationResult | undefined {
  const timestamps = [
    resource.createdAt,
    resource.updatedAt,
    resource.archivedAt,
    resource.deletedAt,
    resource.expiresAt,
    now,
  ];

  return timestamps.every(isValidTimestamp)
    ? undefined
    : blocked(
        "timestamp_invalid",
        "Retention evaluation requires valid ISO-like timestamp inputs.",
      );
}

function evaluateTerminalState(input: {
  resource: RetentionResourceSnapshot;
  rule: RetentionRule;
  principalId: string;
  policyVersion: string;
}): RetentionRuntimeEvaluationResult | undefined {
  const { resource, rule, principalId, policyVersion } = input;

  if (resource.legalHoldReason || resource.deletionState === "retained_legal_exception") {
    return allowed({
      resource,
      rule,
      decision: "retain_legal_exception",
      lifecycleAction: "none",
      eligibleForDeletionDecision: false,
      principalId,
      policyVersion,
    });
  }

  if (resource.deletionState === "deleted" || resource.deletionState === "anonymized") {
    return allowed({
      resource,
      rule,
      decision: "already_terminal",
      lifecycleAction: "none",
      eligibleForDeletionDecision: false,
      principalId,
      policyVersion,
    });
  }

  return undefined;
}

function evaluateDraft(input: {
  resource: RetentionResourceSnapshot;
  rule: RetentionRule;
  principalId: string;
  policyVersion: string;
  now: string;
}): RetentionRuntimeEvaluationResult {
  const { resource, rule, principalId, policyVersion, now } = input;

  if (!resource.expiresAt) {
    return blocked(
      "expiration_required_missing",
      "Draft retention evaluation requires expiresAt for short-lifecycle policy.",
    );
  }

  if (
    resource.lifecycleState === "discarded" ||
    resource.lifecycleState === "expired" ||
    isExpired(resource.expiresAt, now)
  ) {
    return allowed({
      resource,
      rule,
      decision: "eligible_for_deletion_planning",
      lifecycleAction: "deletion_planning",
      eligibleForDeletionDecision: true,
      principalId,
      policyVersion,
    });
  }

  return allowed({
    resource,
    rule,
    decision: "retain_until_expiration",
    lifecycleAction: "none",
    eligibleForDeletionDecision: false,
    principalId,
    policyVersion,
  });
}

function evaluateSavedSimulation(input: {
  resource: RetentionResourceSnapshot;
  rule: RetentionRule;
  principalId: string;
  policyVersion: string;
}): RetentionRuntimeEvaluationResult {
  const { resource, rule, principalId, policyVersion } = input;

  if (
    resource.deletionState === "deletion_requested" ||
    resource.lifecycleState === "deletion_pending"
  ) {
    return allowed({
      resource,
      rule,
      decision: "eligible_for_deletion_planning",
      lifecycleAction: "deletion_planning",
      eligibleForDeletionDecision: true,
      principalId,
      policyVersion,
    });
  }

  if (resource.deletionState === "restricted") {
    return allowed({
      resource,
      rule,
      decision: "eligible_for_restriction_review",
      lifecycleAction: "restriction_review",
      eligibleForDeletionDecision: false,
      principalId,
      policyVersion,
    });
  }

  return allowed({
    resource,
    rule,
    decision: "retain",
    lifecycleAction: "none",
    eligibleForDeletionDecision: false,
    principalId,
    policyVersion,
  });
}

function evaluateHistoryEntry(input: {
  evaluationInput: RetentionRuntimeEvaluationInput;
  resource: RetentionResourceSnapshot;
  rule: RetentionRule;
  principalId: string;
  policyVersion: string;
}): RetentionRuntimeEvaluationResult {
  const { evaluationInput, resource, rule, principalId, policyVersion } = input;
  const parent = evaluationInput.parentRecord;

  if (!parent) {
    return blocked(
      "parent_context_required",
      "History retention evaluation requires parent simulation lifecycle context.",
    );
  }

  if (
    parent.ownerPrincipalId !== principalId ||
    parent.ownerPrincipalType !== "registered_user"
  ) {
    return blocked(
      "parent_owner_mismatch",
      "History parent owner does not match the authenticated registered user.",
    );
  }

  if (parent.retentionRule !== "saved_simulation_lifecycle") {
    return blocked(
      "parent_retention_rule_unsupported",
      "History retention can only follow a supported saved simulation lifecycle.",
    );
  }

  if (
    parent.deletionState === "deletion_requested" ||
    parent.deletionState === "deleted" ||
    parent.deletionState === "anonymized" ||
    parent.lifecycleState === "deletion_pending"
  ) {
    return allowed({
      resource,
      rule,
      decision: "eligible_for_deletion_planning",
      lifecycleAction: "deletion_planning",
      eligibleForDeletionDecision: true,
      principalId,
      policyVersion,
    });
  }

  if (parent.deletionState === "restricted") {
    return allowed({
      resource,
      rule,
      decision: "eligible_for_restriction_review",
      lifecycleAction: "restriction_review",
      eligibleForDeletionDecision: false,
      principalId,
      policyVersion,
    });
  }

  return allowed({
    resource,
    rule,
    decision: "retain_until_parent_lifecycle_changes",
    lifecycleAction: "none",
    eligibleForDeletionDecision: false,
    principalId,
    policyVersion,
  });
}

function evaluatePolicy(input: {
  evaluationInput: RetentionRuntimeEvaluationInput;
  policy: RetentionPolicy;
  resource: RetentionResourceSnapshot;
  rule: RetentionRule;
  principalId: string;
  now: string;
}): RetentionRuntimeEvaluationResult {
  const { evaluationInput, policy, resource, rule, principalId, now } = input;
  const terminalResult = evaluateTerminalState({
    resource,
    rule,
    principalId,
    policyVersion: policy.policyVersion,
  });

  if (terminalResult) {
    return terminalResult;
  }

  if (policy.resourceCategory === "simulation_draft") {
    return evaluateDraft({
      resource,
      rule,
      principalId,
      policyVersion: policy.policyVersion,
      now,
    });
  }

  if (policy.resourceCategory === "simulation_history_entry") {
    return evaluateHistoryEntry({
      evaluationInput,
      resource,
      rule,
      principalId,
      policyVersion: policy.policyVersion,
    });
  }

  return evaluateSavedSimulation({
    resource,
    rule,
    principalId,
    policyVersion: policy.policyVersion,
  });
}

export function createRetentionRuntimeFoundation(
  config: RetentionRuntimeConfig = {
    enabled: false,
    policies: DEFAULT_RETENTION_RUNTIME_POLICIES,
  },
): RetentionRuntimeFoundation {
  const policies = [...config.policies];

  return {
    version: RETENTION_RUNTIME_FOUNDATION_VERSION,
    mode: RETENTION_RUNTIME_FOUNDATION_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    supportedRules: policies.map((policy) => policy.rule),
    evaluate(input) {
      if (!config.enabled) {
        return blocked(
          "retention_runtime_disabled",
          "Retention runtime foundation is disabled by controlled rollout configuration.",
        );
      }

      if (!input.authContext) {
        return blocked(
          "auth_context_missing",
          "Retention evaluation requires an auth context.",
        );
      }

      if (input.authContext.identityState !== "authenticated") {
        return blocked(
          "auth_context_not_authenticated",
          "Retention evaluation requires an authenticated registered-user context.",
        );
      }

      if (input.authContext.sessionStatus !== "active") {
        return blocked(
          "session_not_active",
          "Retention evaluation requires an active session.",
        );
      }

      if (input.authContext.principal.principalType !== "registered_user") {
        return blocked(
          "principal_type_not_supported",
          "Only registered_user principals are eligible for Stage 4.3C retention evaluation.",
        );
      }

      if (hasClientOwnerFields(input)) {
        return blocked(
          "client_owner_input_rejected",
          "Client-supplied owner or provider fields are rejected by the retention foundation.",
        );
      }

      const principalId = input.authContext.principal.principalId;

      if (input.ownerPrincipalId && input.ownerPrincipalId !== principalId) {
        return blocked(
          "owner_mismatch",
          "Requested owner does not match the authenticated registered user.",
        );
      }

      if (!input.resource) {
        return blocked(
          "resource_snapshot_missing",
          "Retention evaluation requires a resource snapshot.",
        );
      }

      if (
        input.resource.ownerPrincipalId !== principalId ||
        input.resource.ownerPrincipalType !== "registered_user"
      ) {
        return blocked(
          "resource_owner_mismatch",
          "Resource owner does not match the authenticated registered user.",
        );
      }

      if (!isKnownRule(input.resource.retentionRule)) {
        return blocked(
          "retention_rule_mismatch",
          "Resource retention rule is unknown or outside Stage 4.3C scope.",
        );
      }

      const timestampIssue = validateTimestamps(
        input.resource,
        input.now ?? new Date(0).toISOString(),
      );

      if (timestampIssue) {
        return timestampIssue;
      }

      const policy = findPolicy(policies, input.resource);

      if (!policy) {
        return blocked(
          "retention_policy_missing",
          "No retention policy is configured for the resource category and rule.",
        );
      }

      if (
        policy.requiresExpiration &&
        input.resource.resourceCategory === "simulation_draft" &&
        !input.resource.expiresAt
      ) {
        return blocked(
          "expiration_required_missing",
          "Short-lifecycle draft retention requires an expiration timestamp.",
        );
      }

      if (policy.requiresParentRecord && !input.parentRecord) {
        return blocked(
          "parent_context_required",
          "Parent simulation lifecycle context is required for history retention.",
        );
      }

      return evaluatePolicy({
        evaluationInput: input,
        policy,
        resource: input.resource,
        rule: input.resource.retentionRule,
        principalId,
        now: input.now ?? new Date(0).toISOString(),
      });
    },
  };
}
