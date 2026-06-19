import {
  EXPORT_RUNTIME_FOUNDATION_MODE,
  EXPORT_RUNTIME_FOUNDATION_VERSION,
  type ExportDataCategory,
  type ExportForbiddenDataCategory,
  type ExportPackagePlan,
  type ExportRequestScope,
  type ExportResourceCategory,
  type ExportResourceSnapshot,
  type ExportRuntimeBlockedReason,
  type ExportRuntimeConfig,
  type ExportRuntimeEvaluationInput,
  type ExportRuntimeEvaluationResult,
  type ExportRuntimeFoundation,
  type ExportRuntimeSafetyEvidence,
} from "./contracts";

export const DEFAULT_EXPORT_DATA_CATEGORIES: ExportDataCategory[] = [
  "principal_profile",
  "simulation_record",
  "simulation_draft",
  "simulation_history",
  "decision_provenance",
  "lifecycle_metadata",
];

export const DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES: ExportForbiddenDataCategory[] = [
  "provider_secret",
  "auth_token",
  "internal_security_signal",
  "service_role_data",
  "other_user_record",
  "workspace_record",
  "billing_record",
  "ai_prompt",
  "raw_ai_response",
  "embedding",
  "vector",
  "memory_data",
];

export const DEFAULT_EXPORT_RUNTIME_CONFIG: ExportRuntimeConfig = {
  enabled: false,
  allowedDataCategories: DEFAULT_EXPORT_DATA_CATEGORIES,
  forbiddenDataCategories: DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES,
};

export function exportRuntimeSafetyEvidence(): ExportRuntimeSafetyEvidence {
  return {
    stage: "4.3D",
    exportOnly: true,
    foundationOnly: true,
    failClosedByDefault: true,
    runtimeWritesEnabled: false,
    fileCreated: false,
    archiveCreated: false,
    jsonCreated: false,
    csvCreated: false,
    storageConnected: false,
    dbOperationsExecuted: false,
    supabaseConnected: false,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    cronJobsStarted: false,
    deletionRuntimeStarted: false,
    retentionRuntimeChanged: false,
    consentRuntimeChanged: false,
    authRuntimeChanged: false,
    simulatorIntegrated: false,
    persistenceSchemaChanged: false,
    migrationsChanged: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    aiIntegrated: false,
    stage43EStarted: false,
    stage44Started: false,
    stage5Started: false,
    rollback: "disable_export_runtime_or_remove_export_foundation_exports",
  };
}

function blocked(
  reason: ExportRuntimeBlockedReason,
  message: string,
): ExportRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: EXPORT_RUNTIME_FOUNDATION_VERSION,
    reason,
    message,
    evidence: exportRuntimeSafetyEvidence(),
  };
}

function hasClientOwnerFields(input: ExportRuntimeEvaluationInput): boolean {
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

function isScopeEmpty(scope: ExportRequestScope): boolean {
  return !(
    scope.includePrincipalMetadata ||
    scope.includeSavedSimulations ||
    scope.includeSimulationDrafts ||
    scope.includeSimulationHistory
  );
}

function scopeIncludes(
  scope: ExportRequestScope,
  category: ExportResourceCategory,
): boolean {
  if (category === "levio_principal_metadata") {
    return scope.includePrincipalMetadata;
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

function isSupportedCategory(category: string): category is ExportResourceCategory {
  return (
    category === "levio_principal_metadata" ||
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
  input: ExportRuntimeEvaluationInput,
): ExportRuntimeEvaluationResult | undefined {
  if (!isValidTimestamp(input.request?.requestedAt)) {
    return blocked(
      "timestamp_invalid",
      "Export request requires a valid requestedAt timestamp.",
    );
  }

  const allResourceTimestampsValid = input.resources.every((resource) =>
    [
      resource.createdAt,
      resource.updatedAt,
      resource.archivedAt,
      resource.deletedAt,
      resource.expiresAt,
    ].every(isValidTimestamp),
  );

  return allResourceTimestampsValid
    ? undefined
    : blocked(
        "timestamp_invalid",
        "Export resource snapshots require valid ISO-like timestamp inputs.",
      );
}

function findForbiddenCategories(
  resource: ExportResourceSnapshot,
  forbiddenCategories: ExportForbiddenDataCategory[],
): ExportForbiddenDataCategory[] {
  const supplied = resource.forbiddenDataCategories ?? [];

  return supplied.filter((category) => forbiddenCategories.includes(category));
}

function hasOnlyAllowedDataCategories(
  resource: ExportResourceSnapshot,
  allowedDataCategories: ExportDataCategory[],
): boolean {
  return resource.dataCategories.every((category) =>
    allowedDataCategories.includes(category),
  );
}

function exclusionReason(resource: ExportResourceSnapshot): {
  eligibility: ExportPackagePlan["excluded"][number]["eligibility"];
  reason: string;
} | undefined {
  if (!resource.exportEligible) {
    return {
      eligibility: "ineligible_scope_excluded",
      reason: "Resource is not marked export eligible.",
    };
  }

  if (resource.deletionState === "deleted" || resource.deletionState === "anonymized") {
    return {
      eligibility: "ineligible_deleted",
      reason: "Deleted or anonymized resources are excluded from export foundation.",
    };
  }

  if (resource.deletionState === "restricted" || resource.lifecycleState === "restricted") {
    return {
      eligibility: "ineligible_restricted",
      reason: "Restricted resources require a later reviewed export exception.",
    };
  }

  if (
    resource.deletionState === "retained_legal_exception" ||
    resource.lifecycleState === "retained_legal_exception"
  ) {
    return {
      eligibility: "ineligible_legal_exception",
      reason: "Legal exception resources require separate export review.",
    };
  }

  if (resource.lifecycleState === "expired" || resource.lifecycleState === "discarded") {
    return {
      eligibility: "ineligible_expired",
      reason: "Expired or discarded resources are not included in Stage 4.3D export foundation.",
    };
  }

  return undefined;
}

function buildPackagePlan(input: {
  scope: ExportRequestScope;
  resources: ExportResourceSnapshot[];
  forbiddenCategories: ExportForbiddenDataCategory[];
}): ExportPackagePlan {
  const forbiddenCategoriesExcluded = new Set<ExportForbiddenDataCategory>();
  const packagePlan: ExportPackagePlan = {
    packageFormat: "manifest_only",
    generation: "not_started",
    fileCreated: false,
    storageWrite: false,
    databaseRead: false,
    includes: [],
    excluded: [],
    forbiddenCategoriesExcluded: [],
  };

  for (const resource of input.resources) {
    for (const category of resource.forbiddenDataCategories ?? []) {
      forbiddenCategoriesExcluded.add(category);
    }

    if (!scopeIncludes(input.scope, resource.resourceCategory)) {
      packagePlan.excluded.push({
        resourceId: resource.resourceId,
        resourceCategory: resource.resourceCategory,
        eligibility: "ineligible_scope_excluded",
        reason: "Resource category is outside the requested export scope.",
      });
      continue;
    }

    const exclusion = exclusionReason(resource);

    if (exclusion) {
      packagePlan.excluded.push({
        resourceId: resource.resourceId,
        resourceCategory: resource.resourceCategory,
        eligibility: exclusion.eligibility,
        reason: exclusion.reason,
      });
      continue;
    }

    packagePlan.includes.push({
      resourceId: resource.resourceId,
      resourceCategory: resource.resourceCategory,
      dataCategories: resource.dataCategories,
      eligibility: "eligible",
    });
  }

  packagePlan.forbiddenCategoriesExcluded = Array.from(forbiddenCategoriesExcluded).filter(
    (category) => input.forbiddenCategories.includes(category),
  );

  return packagePlan;
}

function validateResources(input: {
  resources: ExportResourceSnapshot[];
  principalId: string;
  allowedDataCategories: ExportDataCategory[];
  forbiddenDataCategories: ExportForbiddenDataCategory[];
}): ExportRuntimeEvaluationResult | undefined {
  for (const resource of input.resources) {
    if (!isSupportedCategory(resource.resourceCategory)) {
      return blocked(
        "resource_category_not_supported",
        "Export resource category is outside Stage 4.3D scope.",
      );
    }

    if (
      resource.ownerPrincipalId !== input.principalId ||
      resource.ownerPrincipalType !== "registered_user"
    ) {
      return blocked(
        "resource_owner_mismatch",
        "Export resource owner does not match the authenticated registered user.",
      );
    }

    if (!hasOnlyAllowedDataCategories(resource, input.allowedDataCategories)) {
      return blocked(
        "resource_data_category_not_allowed",
        "Export resource contains a data category outside the approved export model.",
      );
    }

    if (
      findForbiddenCategories(resource, input.forbiddenDataCategories).length > 0
    ) {
      return blocked(
        "resource_forbidden_data_present",
        "Export resource snapshot contains forbidden data categories.",
      );
    }
  }

  return undefined;
}

export function createExportRuntimeFoundation(
  config: ExportRuntimeConfig = DEFAULT_EXPORT_RUNTIME_CONFIG,
): ExportRuntimeFoundation {
  return {
    version: EXPORT_RUNTIME_FOUNDATION_VERSION,
    mode: EXPORT_RUNTIME_FOUNDATION_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    packageFormat: "manifest_only",
    evaluate(input) {
      if (!config.enabled) {
        return blocked(
          "export_runtime_disabled",
          "Export runtime foundation is disabled by controlled rollout configuration.",
        );
      }

      if (!input.authContext) {
        return blocked(
          "auth_context_missing",
          "Export evaluation requires an auth context.",
        );
      }

      if (input.authContext.identityState !== "authenticated") {
        return blocked(
          "auth_context_not_authenticated",
          "Export evaluation requires an authenticated registered-user context.",
        );
      }

      if (input.authContext.sessionStatus !== "active") {
        return blocked(
          "session_not_active",
          "Export evaluation requires an active session.",
        );
      }

      if (input.authContext.principal.principalType !== "registered_user") {
        return blocked(
          "principal_type_not_supported",
          "Only registered_user principals are eligible for Stage 4.3D export evaluation.",
        );
      }

      if (hasClientOwnerFields(input)) {
        return blocked(
          "client_owner_input_rejected",
          "Client-supplied owner or provider fields are rejected by the export foundation.",
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
          "export_request_missing",
          "Export evaluation requires a request model.",
        );
      }

      if (
        input.request.ownerPrincipalId &&
        input.request.ownerPrincipalId !== principalId
      ) {
        return blocked(
          "owner_mismatch",
          "Export request owner does not match the authenticated registered user.",
        );
      }

      if (isScopeEmpty(input.request.scope)) {
        return blocked(
          "export_scope_empty",
          "Export request scope must include at least one approved data category.",
        );
      }

      const timestampIssue = validateTimestamps(input);

      if (timestampIssue) {
        return timestampIssue;
      }

      const resourceIssue = validateResources({
        resources: input.resources,
        principalId,
        allowedDataCategories: config.allowedDataCategories,
        forbiddenDataCategories: config.forbiddenDataCategories,
      });

      if (resourceIssue) {
        return resourceIssue;
      }

      const packagePlan = buildPackagePlan({
        scope: input.request.scope,
        resources: input.resources,
        forbiddenCategories: config.forbiddenDataCategories,
      });

      if (packagePlan.includes.length === 0) {
        return blocked(
          "no_exportable_resources",
          "Export request has no eligible resources in Stage 4.3D foundation.",
        );
      }

      return {
        status: "allowed",
        execution: "preflight_only",
        version: EXPORT_RUNTIME_FOUNDATION_VERSION,
        requestId: input.request.requestId,
        principalId,
        scope: input.request.scope,
        packagePlan,
        evidence: exportRuntimeSafetyEvidence(),
      };
    },
  };
}
