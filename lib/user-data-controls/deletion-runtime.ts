import {
  DELETION_RUNTIME_FOUNDATION_MODE,
  DELETION_RUNTIME_FOUNDATION_VERSION,
  type DeletionPlan,
  type DeletionPlanAction,
  type DeletionPlanEntry,
  type DeletionResourceCategory,
  type DeletionResourceSnapshot,
  type DeletionRuntimeBlockedReason,
  type DeletionRuntimeConfig,
  type DeletionRuntimeEvaluationInput,
  type DeletionRuntimeEvaluationResult,
  type DeletionRuntimeFoundation,
  type DeletionRuntimeSafetyEvidence,
  type DeletionScope,
} from "./contracts";

export const DEFAULT_DELETION_RUNTIME_CONFIG: DeletionRuntimeConfig = {
  enabled: false,
};

export function deletionRuntimeSafetyEvidence(): DeletionRuntimeSafetyEvidence {
  return {
    stage: "4.3E",
    deletionOnly: true,
    foundationOnly: true,
    failClosedByDefault: true,
    runtimeWritesEnabled: false,
    hardDeleteExecuted: false,
    dbOperationsExecuted: false,
    supabaseConnected: false,
    migrationsChanged: false,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    cronJobsStarted: false,
    exportRuntimeChanged: false,
    retentionRuntimeChanged: false,
    consentRuntimeChanged: false,
    authRuntimeChanged: false,
    simulatorIntegrated: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    aiIntegrated: false,
    stage43FStarted: false,
    stage44Started: false,
    stage5Started: false,
    rollback: "disable_deletion_runtime_or_remove_deletion_foundation_exports",
  };
}

function blocked(
  reason: DeletionRuntimeBlockedReason,
  message: string,
): DeletionRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: DELETION_RUNTIME_FOUNDATION_VERSION,
    reason,
    message,
    evidence: deletionRuntimeSafetyEvidence(),
  };
}

function hasClientOwnerFields(input: DeletionRuntimeEvaluationInput): boolean {
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

function isScopeEmpty(scope: DeletionScope): boolean {
  return !(
    scope.includePrincipalRecord ||
    scope.includeSavedSimulations ||
    scope.includeSimulationDrafts ||
    scope.includeSimulationHistory
  );
}

function scopeIncludes(
  scope: DeletionScope,
  category: DeletionResourceCategory,
): boolean {
  if (category === "levio_principal") {
    return scope.includePrincipalRecord;
  }

  if (category === "saved_simulation") {
    return scope.includeSavedSimulations;
  }

  if (category === "simulation_draft") {
    return scope.includeSimulationDrafts;
  }

  if (category === "simulation_history_entry") {
    return scope.includeSimulationHistory;
  }

  return false;
}

function isSupportedCategory(category: string): category is DeletionResourceCategory {
  return (
    category === "levio_principal" ||
    category === "saved_simulation" ||
    category === "simulation_draft" ||
    category === "simulation_history_entry"
  );
}

function isValidTimestamp(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }

  return Number.isFinite(Date.parse(value));
}

function validateTimestamps(
  input: DeletionRuntimeEvaluationInput,
): DeletionRuntimeEvaluationResult | undefined {
  if (!isValidTimestamp(input.request?.requestedAt)) {
    return blocked(
      "timestamp_invalid",
      "Deletion request requires a valid requestedAt timestamp.",
    );
  }

  const resourceTimestampsValid = input.resources.every((resource) =>
    [
      resource.createdAt,
      resource.updatedAt,
      resource.deletedAt,
      resource.expiresAt,
    ].every(isValidTimestamp),
  );

  return resourceTimestampsValid
    ? undefined
    : blocked(
        "timestamp_invalid",
        "Deletion resource snapshots require valid ISO-like timestamp inputs.",
      );
}

function validateResources(input: {
  resources: DeletionResourceSnapshot[];
  principalId: string;
}): DeletionRuntimeEvaluationResult | undefined {
  if (input.resources.length === 0) {
    return blocked(
      "resource_snapshot_missing",
      "Deletion evaluation requires at least one resource snapshot.",
    );
  }

  for (const resource of input.resources) {
    if (!isSupportedCategory(resource.resourceCategory)) {
      return blocked(
        "resource_category_not_supported",
        "Deletion resource category is outside Stage 4.3E scope.",
      );
    }

    if (
      resource.ownerPrincipalId !== input.principalId ||
      resource.ownerPrincipalType !== "registered_user"
    ) {
      return blocked(
        "resource_owner_mismatch",
        "Deletion resource owner does not match the authenticated registered user.",
      );
    }
  }

  return undefined;
}

function validateParentContexts(input: {
  evaluationInput: DeletionRuntimeEvaluationInput;
  principalId: string;
}): DeletionRuntimeEvaluationResult | undefined {
  const request = input.evaluationInput.request;

  if (!request) {
    return undefined;
  }

  for (const resource of input.evaluationInput.resources) {
    if (
      resource.resourceCategory !== "simulation_history_entry" ||
      !scopeIncludes(request.scope, resource.resourceCategory)
    ) {
      continue;
    }

    if (!resource.parentRecordId) {
      return blocked(
        "parent_context_required",
        "History deletion planning requires parent simulation context.",
      );
    }

    const parent = findParent(input.evaluationInput, resource);

    if (!parent) {
      return blocked(
        "parent_context_required",
        "Parent simulation snapshot is required for history deletion planning.",
      );
    }

    if (
      parent.ownerPrincipalId !== input.principalId ||
      parent.ownerPrincipalType !== "registered_user"
    ) {
      return blocked(
        "parent_owner_mismatch",
        "Parent simulation owner does not match the authenticated registered user.",
      );
    }
  }

  return undefined;
}

function terminalEntry(resource: DeletionResourceSnapshot): DeletionPlanEntry {
  return {
    resourceId: resource.resourceId,
    resourceCategory: resource.resourceCategory,
    eligibility: "already_terminal",
    plannedAction: "no_action_terminal",
    execution: "not_started",
    reason: "Resource is already deleted or anonymized.",
  };
}

function scopeExcludedEntry(resource: DeletionResourceSnapshot): DeletionPlanEntry {
  return {
    resourceId: resource.resourceId,
    resourceCategory: resource.resourceCategory,
    eligibility: "blocked_scope_excluded",
    plannedAction: "no_action_scope_excluded",
    execution: "not_started",
    reason: "Resource category is outside the requested deletion scope.",
  };
}

function legalHoldEntry(resource: DeletionResourceSnapshot): DeletionPlanEntry {
  return {
    resourceId: resource.resourceId,
    resourceCategory: resource.resourceCategory,
    eligibility: "blocked_legal_hold",
    plannedAction: "retain_legal_exception",
    execution: "not_started",
    reason: "Legal hold or retained legal exception blocks deletion planning.",
  };
}

function activeSubscriptionEntry(resource: DeletionResourceSnapshot): DeletionPlanEntry {
  return {
    resourceId: resource.resourceId,
    resourceCategory: resource.resourceCategory,
    eligibility: "blocked_active_subscription",
    plannedAction: "retain_active_subscription",
    execution: "not_started",
    reason: "Active subscription requires separate cancellation before account deletion planning.",
  };
}

function lifecycleEntry(
  resource: DeletionResourceSnapshot,
  plannedAction: DeletionPlanAction,
): DeletionPlanEntry {
  return {
    resourceId: resource.resourceId,
    resourceCategory: resource.resourceCategory,
    eligibility:
      plannedAction === "mark_restricted"
        ? "eligible_for_restriction_review"
        : "eligible_for_lifecycle_request",
    plannedAction,
    execution: "not_started",
    reason: "Resource is eligible for lifecycle-only deletion planning.",
  };
}

function findParent(
  input: DeletionRuntimeEvaluationInput,
  resource: DeletionResourceSnapshot,
) {
  return input.parentRecords?.find(
    (parent) => parent.recordId === resource.parentRecordId,
  );
}

function historyEntry(input: {
  evaluationInput: DeletionRuntimeEvaluationInput;
  resource: DeletionResourceSnapshot;
  principalId: string;
}): DeletionPlanEntry {
  const { evaluationInput, resource, principalId } = input;

  if (!resource.parentRecordId) {
    return {
      resourceId: resource.resourceId,
      resourceCategory: resource.resourceCategory,
      eligibility: "blocked_parent_context_missing",
      plannedAction: "no_action_scope_excluded",
      execution: "not_started",
      reason: "History deletion planning requires parent simulation context.",
    };
  }

  const parent = findParent(evaluationInput, resource);

  if (!parent) {
    return {
      resourceId: resource.resourceId,
      resourceCategory: resource.resourceCategory,
      eligibility: "blocked_parent_context_missing",
      plannedAction: "no_action_scope_excluded",
      execution: "not_started",
      reason: "Parent simulation snapshot is missing.",
    };
  }

  if (
    parent.ownerPrincipalId !== principalId ||
    parent.ownerPrincipalType !== "registered_user"
  ) {
    return {
      resourceId: resource.resourceId,
      resourceCategory: resource.resourceCategory,
      eligibility: "blocked_parent_owner_mismatch",
      plannedAction: "no_action_scope_excluded",
      execution: "not_started",
      reason: "Parent simulation owner does not match authenticated owner.",
    };
  }

  if (
    parent.deletionState === "deletion_requested" ||
    parent.lifecycleState === "deletion_pending" ||
    parent.deletionState === "deleted" ||
    parent.deletionState === "anonymized"
  ) {
    return lifecycleEntry(resource, "mark_deletion_requested");
  }

  return lifecycleEntry(resource, "mark_restricted");
}

function resourceEntry(input: {
  evaluationInput: DeletionRuntimeEvaluationInput;
  resource: DeletionResourceSnapshot;
  principalId: string;
}): DeletionPlanEntry {
  const { evaluationInput, resource, principalId } = input;
  const request = evaluationInput.request;

  if (!request || !scopeIncludes(request.scope, resource.resourceCategory)) {
    return scopeExcludedEntry(resource);
  }

  if (
    resource.legalHoldReason ||
    resource.deletionState === "retained_legal_exception"
  ) {
    return legalHoldEntry(resource);
  }

  if (resource.deletionState === "deleted" || resource.deletionState === "anonymized") {
    return terminalEntry(resource);
  }

  if (
    request.requestKind === "account_deletion_planning" &&
    resource.resourceCategory === "levio_principal" &&
    evaluationInput.accountState?.activeSubscription
  ) {
    return activeSubscriptionEntry(resource);
  }

  if (resource.resourceCategory === "simulation_history_entry") {
    return historyEntry({ evaluationInput, resource, principalId });
  }

  if (resource.deletionState === "restricted") {
    return lifecycleEntry(resource, "mark_restricted");
  }

  return lifecycleEntry(resource, "mark_deletion_requested");
}

function buildDeletionPlan(input: {
  evaluationInput: DeletionRuntimeEvaluationInput;
  principalId: string;
}): DeletionPlan {
  const requestKind =
    input.evaluationInput.request?.requestKind ?? "resource_deletion_planning";
  const entries = input.evaluationInput.resources.map((resource) =>
    resourceEntry({
      evaluationInput: input.evaluationInput,
      resource,
      principalId: input.principalId,
    }),
  );
  const blockers = entries.filter(
    (entry) =>
      entry.eligibility === "blocked_legal_hold" ||
      entry.eligibility === "blocked_active_subscription" ||
      entry.eligibility === "blocked_parent_context_missing" ||
      entry.eligibility === "blocked_parent_owner_mismatch",
  );

  return {
    requestKind,
    execution: "not_started",
    hardDeleteExecuted: false,
    databaseWrite: false,
    supabaseConnected: false,
    lifecycleOnly: true,
    entries,
    blockers,
  };
}

export function createDeletionRuntimeFoundation(
  config: DeletionRuntimeConfig = DEFAULT_DELETION_RUNTIME_CONFIG,
): DeletionRuntimeFoundation {
  return {
    version: DELETION_RUNTIME_FOUNDATION_VERSION,
    mode: DELETION_RUNTIME_FOUNDATION_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    evaluate(input) {
      if (!config.enabled) {
        return blocked(
          "deletion_runtime_disabled",
          "Deletion runtime foundation is disabled by controlled rollout configuration.",
        );
      }

      if (!input.authContext) {
        return blocked(
          "auth_context_missing",
          "Deletion evaluation requires an auth context.",
        );
      }

      if (input.authContext.identityState !== "authenticated") {
        return blocked(
          "auth_context_not_authenticated",
          "Deletion evaluation requires an authenticated registered-user context.",
        );
      }

      if (input.authContext.sessionStatus !== "active") {
        return blocked(
          "session_not_active",
          "Deletion evaluation requires an active session.",
        );
      }

      if (input.authContext.principal.principalType !== "registered_user") {
        return blocked(
          "principal_type_not_supported",
          "Only registered_user principals are eligible for Stage 4.3E deletion evaluation.",
        );
      }

      if (hasClientOwnerFields(input)) {
        return blocked(
          "client_owner_input_rejected",
          "Client-supplied owner or provider fields are rejected by the deletion foundation.",
        );
      }

      const principalId = input.authContext.principal.principalId;

      if (input.ownerPrincipalId && input.ownerPrincipalId !== principalId) {
        return blocked(
          "owner_mismatch",
          "Requested owner does not match the authenticated registered user.",
        );
      }

      if (!input.request) {
        return blocked(
          "deletion_request_missing",
          "Deletion evaluation requires a request model.",
        );
      }

      if (input.request.ownerPrincipalId && input.request.ownerPrincipalId !== principalId) {
        return blocked(
          "owner_mismatch",
          "Deletion request owner does not match the authenticated registered user.",
        );
      }

      if (isScopeEmpty(input.request.scope)) {
        return blocked(
          "deletion_scope_empty",
          "Deletion request scope must include at least one approved resource category.",
        );
      }

      if (!input.request.confirmationAcknowledged) {
        return blocked(
          "request_confirmation_missing",
          "Deletion planning requires explicit request confirmation evidence.",
        );
      }

      const timestampIssue = validateTimestamps(input);

      if (timestampIssue) {
        return timestampIssue;
      }

      const resourceIssue = validateResources({
        resources: input.resources,
        principalId,
      });

      if (resourceIssue) {
        return resourceIssue;
      }

      if (
        input.request.requestKind === "account_deletion_planning" &&
        input.accountState?.activeSubscription
      ) {
        return blocked(
          "active_subscription_blocks_account_deletion",
          "Active subscription requires separate cancellation before account deletion planning.",
        );
      }

      if (
        input.resources.some(
          (resource) =>
            resource.legalHoldReason ||
            resource.deletionState === "retained_legal_exception",
        )
      ) {
        return blocked(
          "legal_hold_blocks_deletion",
          "Legal hold or retained legal exception blocks deletion planning.",
        );
      }

      const parentIssue = validateParentContexts({
        evaluationInput: input,
        principalId,
      });

      if (parentIssue) {
        return parentIssue;
      }

      const deletionPlan = buildDeletionPlan({
        evaluationInput: input,
        principalId,
      });
      const actionableEntries = deletionPlan.entries.filter(
        (entry) =>
          entry.eligibility === "eligible_for_lifecycle_request" ||
          entry.eligibility === "eligible_for_restriction_review",
      );

      if (actionableEntries.length === 0) {
        return blocked(
          "no_deletable_resources",
          "Deletion request has no resources eligible for lifecycle-only planning.",
        );
      }

      return {
        status: "allowed",
        execution: "preflight_only",
        version: DELETION_RUNTIME_FOUNDATION_VERSION,
        requestId: input.request.requestId,
        principalId,
        scope: input.request.scope,
        deletionPlan,
        evidence: deletionRuntimeSafetyEvidence(),
      };
    },
  };
}
