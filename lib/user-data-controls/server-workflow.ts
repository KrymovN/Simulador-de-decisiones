import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type {
  LevioPrincipalRow,
  PersistenceRuntimeOperation,
  PersistenceRuntimeWiring,
} from "../persistence-runtime";
import {
  createDeletionRuntimeFoundation,
  DEFAULT_DELETION_RUNTIME_CONFIG,
} from "./deletion-runtime";
import {
  createExportRuntimeFoundation,
  DEFAULT_EXPORT_DATA_CATEGORIES,
  DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES,
} from "./export-runtime";
import type {
  DeletionAccountState,
  DeletionParentSnapshot,
  DeletionResourceSnapshot,
  DeletionRuntimeEvaluationResult,
  DeletionRuntimeFoundation,
  DeletionScope,
  ExportPackageFormat,
  ExportRequestScope,
  ExportResourceSnapshot,
  ExportRuntimeEvaluationResult,
  ExportRuntimeFoundation,
} from "./contracts";

export const USER_DATA_CONTROLS_SERVER_WORKFLOW_VERSION =
  "4.3-server-workflow-foundation.1" as const;
export const USER_DATA_CONTROLS_SERVER_WORKFLOW_MODE =
  "server_workflow_foundation_only" as const;

export type UserDataControlsServerWorkflowVersion =
  typeof USER_DATA_CONTROLS_SERVER_WORKFLOW_VERSION;
export type UserDataControlsServerWorkflowMode =
  typeof USER_DATA_CONTROLS_SERVER_WORKFLOW_MODE;

export type UserDataControlsServerWorkflowOperation =
  | "resolve_canonical_principal"
  | "verify_ownership"
  | "access_owner_scoped_artifacts"
  | "plan_export"
  | "plan_deletion";

export type UserDataControlsArtifactAccessPurpose = "export" | "deletion";

export type UserDataControlsServerWorkflowBlockedReason =
  | "workflow_disabled"
  | "auth_context_missing"
  | "auth_context_not_authenticated"
  | "session_not_active"
  | "principal_type_not_supported"
  | "provider_reference_invalid"
  | "client_owner_input_rejected"
  | "persistence_runtime_unavailable"
  | "principal_resolution_failed"
  | "principal_not_active"
  | "principal_provider_mismatch"
  | "ownership_mismatch"
  | "artifact_source_unavailable"
  | "artifact_source_not_server_only"
  | "artifact_source_blocked"
  | "artifact_source_owner_mismatch"
  | "export_contract_blocked"
  | "deletion_contract_blocked";

export type UserDataControlsServerWorkflowSafetyEvidence = {
  stage: "4.3";
  serverWorkflowOnly: true;
  foundationOnly: true;
  failClosedByDefault: true;
  canonicalPrincipalResolutionRequired: true;
  ownerScopedArtifactsOnly: true;
  persistenceRuntimeBoundaryUsed: true;
  artifactSourceRequiresServerOnly: true;
  exportFoundationContractUsed: true;
  deletionFoundationContractUsed: true;
  runtimeWritesEnabled: false;
  persistenceWritesEnabled: false;
  exportFilesCreated: false;
  exportStorageConnected: false;
  deletionExecuted: false;
  hardDeleteExecuted: false;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  simulatorIntegrated: false;
  openAiIntegrated: false;
  billingIntegrated: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  productBehaviorChanged: false;
  rollback: "disable_server_workflow_foundation_or_remove_stage_4_3_exports";
};

export type UserDataControlsClientOwnerFields = {
  principalId?: string;
  ownerPrincipalId?: string;
  ownerPrincipalType?: string;
  providerReference?: string;
};

export type UserDataControlsCanonicalPrincipal = {
  principalId: string;
  principalType: "registered_user";
  providerReference: string;
  row: LevioPrincipalRow;
  authContext: LevioSessionContext;
};

export type UserDataControlsArtifactSourceBlockedReason =
  | "source_unavailable"
  | "source_read_failed"
  | "source_not_owner_scoped"
  | "source_scope_not_supported";

export type UserDataControlsArtifactSourceBlockedResult = {
  status: "blocked";
  reason: UserDataControlsArtifactSourceBlockedReason;
  message: string;
};

export type UserDataControlsExportArtifactSourceReadyResult = {
  status: "ready";
  resources: ExportResourceSnapshot[];
};

export type UserDataControlsDeletionArtifactSourceReadyResult = {
  status: "ready";
  resources: DeletionResourceSnapshot[];
  parentRecords?: DeletionParentSnapshot[];
  accountState?: DeletionAccountState;
};

export type UserDataControlsExportArtifactSourceResult =
  | UserDataControlsExportArtifactSourceReadyResult
  | UserDataControlsArtifactSourceBlockedResult;

export type UserDataControlsDeletionArtifactSourceResult =
  | UserDataControlsDeletionArtifactSourceReadyResult
  | UserDataControlsArtifactSourceBlockedResult;

export type UserDataControlsOwnerScopedArtifactSource = {
  executionBoundary: "server_only";
  listExportResources(input: {
    principal: UserDataControlsCanonicalPrincipal;
    scope: ExportRequestScope;
    requestedAt: string;
  }): Promise<UserDataControlsExportArtifactSourceResult>;
  listDeletionResources(input: {
    principal: UserDataControlsCanonicalPrincipal;
    scope: DeletionScope;
    requestedAt: string;
  }): Promise<UserDataControlsDeletionArtifactSourceResult>;
};

export type UserDataControlsServerWorkflowAllowedResult<TPayload> = {
  status: "allowed";
  execution: "preflight_only";
  version: UserDataControlsServerWorkflowVersion;
  operation: UserDataControlsServerWorkflowOperation;
  principal: UserDataControlsCanonicalPrincipal;
  payload: TPayload;
  evidence: UserDataControlsServerWorkflowSafetyEvidence;
};

export type UserDataControlsServerWorkflowBlockedResult = {
  status: "blocked";
  execution: "none";
  version: UserDataControlsServerWorkflowVersion;
  operation: UserDataControlsServerWorkflowOperation;
  reason: UserDataControlsServerWorkflowBlockedReason;
  message: string;
  evidence: UserDataControlsServerWorkflowSafetyEvidence;
};

export type UserDataControlsCanonicalPrincipalResult =
  | UserDataControlsServerWorkflowAllowedResult<{
      canonicalPrincipalId: string;
      providerReference: string;
    }>
  | UserDataControlsServerWorkflowBlockedResult;

export type UserDataControlsOwnershipVerificationResult =
  | UserDataControlsServerWorkflowAllowedResult<{
      ownerPrincipalId: string;
      verified: true;
    }>
  | UserDataControlsServerWorkflowBlockedResult;

export type UserDataControlsOwnerScopedArtifactAccessResult =
  | UserDataControlsServerWorkflowAllowedResult<
      | {
          purpose: "export";
          exportResources: ExportResourceSnapshot[];
        }
      | {
          purpose: "deletion";
          deletionResources: DeletionResourceSnapshot[];
          parentRecords: DeletionParentSnapshot[];
          accountState: DeletionAccountState;
        }
    >
  | UserDataControlsServerWorkflowBlockedResult;

export type UserDataControlsExportWorkflowFoundationResult =
  | UserDataControlsServerWorkflowAllowedResult<{
      exportResult: Extract<ExportRuntimeEvaluationResult, { status: "allowed" }>;
    }>
  | UserDataControlsServerWorkflowBlockedResult;

export type UserDataControlsDeletionWorkflowFoundationResult =
  | UserDataControlsServerWorkflowAllowedResult<{
      deletionResult: Extract<DeletionRuntimeEvaluationResult, { status: "allowed" }>;
    }>
  | UserDataControlsServerWorkflowBlockedResult;

export type UserDataControlsServerWorkflowConfig = {
  enabled: boolean;
  persistenceRuntime?: PersistenceRuntimeWiring;
  artifactSource?: UserDataControlsOwnerScopedArtifactSource;
  exportRuntime?: ExportRuntimeFoundation;
  deletionRuntime?: DeletionRuntimeFoundation;
};

export type UserDataControlsResolveCanonicalPrincipalInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  clientOwnerFields?: UserDataControlsClientOwnerFields;
};

export type UserDataControlsVerifyOwnershipInput =
  UserDataControlsResolveCanonicalPrincipalInput & {
    resourceOwnerPrincipalId?: string;
    persistenceOperation?: PersistenceRuntimeOperation;
  };

export type UserDataControlsAccessArtifactsInput =
  UserDataControlsVerifyOwnershipInput & {
    purpose: UserDataControlsArtifactAccessPurpose;
    requestedAt: string;
    exportScope?: ExportRequestScope;
    deletionScope?: DeletionScope;
  };

export type UserDataControlsPlanExportInput =
  UserDataControlsResolveCanonicalPrincipalInput & {
    requestId: string;
    requestedAt: string;
    scope: ExportRequestScope;
    packageFormat?: ExportPackageFormat;
  };

export type UserDataControlsPlanDeletionInput =
  UserDataControlsResolveCanonicalPrincipalInput & {
    requestId: string;
    requestedAt: string;
    scope: DeletionScope;
    requestKind: "resource_deletion_planning" | "account_deletion_planning";
    confirmationAcknowledged: boolean;
  };

export type UserDataControlsServerWorkflowFoundation = {
  version: UserDataControlsServerWorkflowVersion;
  mode: UserDataControlsServerWorkflowMode;
  enabled: boolean;
  writesEnabled: false;
  resolveCanonicalPrincipal(
    input: UserDataControlsResolveCanonicalPrincipalInput,
  ): Promise<UserDataControlsCanonicalPrincipalResult>;
  verifyOwnership(
    input: UserDataControlsVerifyOwnershipInput,
  ): Promise<UserDataControlsOwnershipVerificationResult>;
  accessOwnerScopedArtifacts(
    input: UserDataControlsAccessArtifactsInput,
  ): Promise<UserDataControlsOwnerScopedArtifactAccessResult>;
  planExport(
    input: UserDataControlsPlanExportInput,
  ): Promise<UserDataControlsExportWorkflowFoundationResult>;
  planDeletion(
    input: UserDataControlsPlanDeletionInput,
  ): Promise<UserDataControlsDeletionWorkflowFoundationResult>;
};

const DEFAULT_ACCOUNT_STATE: DeletionAccountState = {
  activeSubscription: false,
  subscriptionStatus: "none",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function userDataControlsServerWorkflowSafetyEvidence(): UserDataControlsServerWorkflowSafetyEvidence {
  return {
    stage: "4.3",
    serverWorkflowOnly: true,
    foundationOnly: true,
    failClosedByDefault: true,
    canonicalPrincipalResolutionRequired: true,
    ownerScopedArtifactsOnly: true,
    persistenceRuntimeBoundaryUsed: true,
    artifactSourceRequiresServerOnly: true,
    exportFoundationContractUsed: true,
    deletionFoundationContractUsed: true,
    runtimeWritesEnabled: false,
    persistenceWritesEnabled: false,
    exportFilesCreated: false,
    exportStorageConnected: false,
    deletionExecuted: false,
    hardDeleteExecuted: false,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    simulatorIntegrated: false,
    openAiIntegrated: false,
    billingIntegrated: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    productBehaviorChanged: false,
    rollback: "disable_server_workflow_foundation_or_remove_stage_4_3_exports",
  };
}

function defaultExportRuntime(): ExportRuntimeFoundation {
  return createExportRuntimeFoundation({
    enabled: true,
    allowedDataCategories: DEFAULT_EXPORT_DATA_CATEGORIES,
    forbiddenDataCategories: DEFAULT_EXPORT_FORBIDDEN_DATA_CATEGORIES,
  });
}

function defaultDeletionRuntime(): DeletionRuntimeFoundation {
  return createDeletionRuntimeFoundation({
    ...DEFAULT_DELETION_RUNTIME_CONFIG,
    enabled: true,
  });
}

function blocked(
  operation: UserDataControlsServerWorkflowOperation,
  reason: UserDataControlsServerWorkflowBlockedReason,
  message: string,
): UserDataControlsServerWorkflowBlockedResult {
  return {
    status: "blocked",
    execution: "none",
    version: USER_DATA_CONTROLS_SERVER_WORKFLOW_VERSION,
    operation,
    reason,
    message,
    evidence: userDataControlsServerWorkflowSafetyEvidence(),
  };
}

function allowed<TPayload>(input: {
  operation: UserDataControlsServerWorkflowOperation;
  principal: UserDataControlsCanonicalPrincipal;
  payload: TPayload;
}): UserDataControlsServerWorkflowAllowedResult<TPayload> {
  return {
    status: "allowed",
    execution: "preflight_only",
    version: USER_DATA_CONTROLS_SERVER_WORKFLOW_VERSION,
    operation: input.operation,
    principal: input.principal,
    payload: input.payload,
    evidence: userDataControlsServerWorkflowSafetyEvidence(),
  };
}

function hasClientOwnerFields(fields?: UserDataControlsClientOwnerFields): boolean {
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

function normalizeProviderReference(value: string): string | undefined {
  const trimmed = value.trim();
  const withoutProviderPrefix = trimmed.startsWith("supabase:")
    ? trimmed.slice("supabase:".length)
    : trimmed;

  return UUID_PATTERN.test(withoutProviderPrefix) ? withoutProviderPrefix : undefined;
}

function principalIsActive(row: LevioPrincipalRow): boolean {
  return (
    row.principal_type === "registered_user" &&
    row.principal_status === "active" &&
    row.provider_name === "supabase" &&
    row.provider_subject_type === "user" &&
    row.provider_reference_status === "active" &&
    row.deletion_state === "active"
  );
}

function canonicalAuthContext(
  authContext: LevioSessionContext,
  principal: LevioPrincipalRow,
): LevioSessionContext {
  return {
    ...authContext,
    principal: {
      ...authContext.principal,
      principalId: principal.principal_id,
      principalType: "registered_user",
      providerReference: authContext.principal.providerReference,
      email: authContext.principal.email ?? principal.provider_email_snapshot ?? undefined,
    },
  };
}

function resourceOwnerMatchesExport(
  principalId: string,
  resources: ExportResourceSnapshot[],
): boolean {
  return resources.every(
    (resource) =>
      resource.ownerPrincipalId === principalId &&
      resource.ownerPrincipalType === "registered_user",
  );
}

function resourceOwnerMatchesDeletion(
  principalId: string,
  resources: DeletionResourceSnapshot[],
  parents: DeletionParentSnapshot[],
): boolean {
  return (
    resources.every(
      (resource) =>
        resource.ownerPrincipalId === principalId &&
        resource.ownerPrincipalType === "registered_user",
    ) &&
    parents.every(
      (parent) =>
        parent.ownerPrincipalId === principalId &&
        parent.ownerPrincipalType === "registered_user",
    )
  );
}

export function createUserDataControlsServerWorkflowFoundation(
  config: UserDataControlsServerWorkflowConfig,
): UserDataControlsServerWorkflowFoundation {
  const exportRuntime = config.exportRuntime ?? defaultExportRuntime();
  const deletionRuntime = config.deletionRuntime ?? defaultDeletionRuntime();

  async function resolveCanonicalPrincipal(
    input: UserDataControlsResolveCanonicalPrincipalInput,
  ): Promise<UserDataControlsCanonicalPrincipalResult> {
    if (!config.enabled) {
      return blocked(
        "resolve_canonical_principal",
        "workflow_disabled",
        "User data controls server workflow foundation is disabled by rollout configuration.",
      );
    }

    if (hasClientOwnerFields(input.clientOwnerFields)) {
      return blocked(
        "resolve_canonical_principal",
        "client_owner_input_rejected",
        "Client-supplied owner or provider fields are rejected before principal resolution.",
      );
    }

    if (!input.authContext) {
      return blocked(
        "resolve_canonical_principal",
        "auth_context_missing",
        "Canonical principal resolution requires an auth context.",
      );
    }

    if (input.authContext.identityState !== "authenticated") {
      return blocked(
        "resolve_canonical_principal",
        "auth_context_not_authenticated",
        "Canonical principal resolution requires an authenticated registered-user context.",
      );
    }

    if (input.authContext.sessionStatus !== "active") {
      return blocked(
        "resolve_canonical_principal",
        "session_not_active",
        "Canonical principal resolution requires an active session.",
      );
    }

    if (input.authContext.principal.principalType !== "registered_user") {
      return blocked(
        "resolve_canonical_principal",
        "principal_type_not_supported",
        "Stage 4.3 supports registered_user ownership only.",
      );
    }

    const providerReference = normalizeProviderReference(
      input.authContext.principal.providerReference,
    );

    if (!providerReference) {
      return blocked(
        "resolve_canonical_principal",
        "provider_reference_invalid",
        "Stage 4.3 requires a Supabase UUID provider reference.",
      );
    }

    if (!config.persistenceRuntime || config.persistenceRuntime.status !== "ready") {
      return blocked(
        "resolve_canonical_principal",
        "persistence_runtime_unavailable",
        "Canonical principal resolution requires a ready server-side persistence runtime.",
      );
    }

    const resolved = await config.persistenceRuntime.resolvePrincipal({
      providerReference: input.authContext.principal.providerReference,
      providerSubjectType: "user",
    });

    if (resolved.status !== "resolved") {
      return blocked(
        "resolve_canonical_principal",
        "principal_resolution_failed",
        resolved.message,
      );
    }

    if (!principalIsActive(resolved.principal)) {
      return blocked(
        "resolve_canonical_principal",
        "principal_not_active",
        "Resolved Levio principal must be active before user data controls can run.",
      );
    }

    if (resolved.principal.provider_reference !== providerReference) {
      return blocked(
        "resolve_canonical_principal",
        "principal_provider_mismatch",
        "Resolved Levio principal provider reference does not match the authenticated session.",
      );
    }

    const principal: UserDataControlsCanonicalPrincipal = {
      principalId: resolved.principal.principal_id,
      principalType: "registered_user",
      providerReference,
      row: resolved.principal,
      authContext: canonicalAuthContext(input.authContext, resolved.principal),
    };

    return allowed({
      operation: "resolve_canonical_principal",
      principal,
      payload: {
        canonicalPrincipalId: principal.principalId,
        providerReference,
      },
    });
  }

  async function verifyOwnership(
    input: UserDataControlsVerifyOwnershipInput,
  ): Promise<UserDataControlsOwnershipVerificationResult> {
    if (hasClientOwnerFields(input.clientOwnerFields)) {
      return blocked(
        "verify_ownership",
        "client_owner_input_rejected",
        "Client-supplied owner or provider fields are rejected before ownership verification.",
      );
    }

    const principalResult = await resolveCanonicalPrincipal(input);

    if (principalResult.status === "blocked") {
      return {
        ...principalResult,
        operation: "verify_ownership",
      };
    }

    const { principal } = principalResult;

    if (
      input.resourceOwnerPrincipalId &&
      input.resourceOwnerPrincipalId !== principal.principalId
    ) {
      return blocked(
        "verify_ownership",
        "ownership_mismatch",
        "Requested resource owner does not match the resolved Levio principal.",
      );
    }

    if (!config.persistenceRuntime || config.persistenceRuntime.status !== "ready") {
      return blocked(
        "verify_ownership",
        "persistence_runtime_unavailable",
        "Ownership verification requires a ready server-side persistence runtime.",
      );
    }

    const preflight = await config.persistenceRuntime.preflight({
      operation: input.persistenceOperation ?? "resolve_principal",
      authContext: input.authContext,
      resourceOwnerPrincipalId: input.resourceOwnerPrincipalId,
      resolvedPrincipal: principal.row,
    });

    if (preflight.status === "blocked") {
      return blocked(
        "verify_ownership",
        "ownership_mismatch",
        preflight.message,
      );
    }

    return allowed({
      operation: "verify_ownership",
      principal,
      payload: {
        ownerPrincipalId: principal.principalId,
        verified: true,
      },
    });
  }

  async function accessOwnerScopedArtifacts(
    input: UserDataControlsAccessArtifactsInput,
  ): Promise<UserDataControlsOwnerScopedArtifactAccessResult> {
    const operation: PersistenceRuntimeOperation =
      input.purpose === "export"
        ? "list_simulation_records"
        : "read_simulation_record";
    const ownership = await verifyOwnership({
      ...input,
      persistenceOperation: operation,
    });

    if (ownership.status === "blocked") {
      return {
        ...ownership,
        operation: "access_owner_scoped_artifacts",
      };
    }

    if (!config.artifactSource) {
      return blocked(
        "access_owner_scoped_artifacts",
        "artifact_source_unavailable",
        "Owner-scoped artifact source is not configured for Stage 4.3.",
      );
    }

    if (config.artifactSource.executionBoundary !== "server_only") {
      return blocked(
        "access_owner_scoped_artifacts",
        "artifact_source_not_server_only",
        "Owner-scoped artifact source must be server-only.",
      );
    }

    if (input.purpose === "export") {
      if (!input.exportScope) {
        return blocked(
          "access_owner_scoped_artifacts",
          "artifact_source_blocked",
          "Export artifact access requires an export scope.",
        );
      }

      const sourceResult = await config.artifactSource.listExportResources({
        principal: ownership.principal,
        scope: input.exportScope,
        requestedAt: input.requestedAt,
      });

      if (sourceResult.status === "blocked") {
        return blocked(
          "access_owner_scoped_artifacts",
          "artifact_source_blocked",
          sourceResult.message,
        );
      }

      if (
        !resourceOwnerMatchesExport(
          ownership.principal.principalId,
          sourceResult.resources,
        )
      ) {
        return blocked(
          "access_owner_scoped_artifacts",
          "artifact_source_owner_mismatch",
          "Export artifact source returned resources outside the resolved owner scope.",
        );
      }

      return allowed({
        operation: "access_owner_scoped_artifacts",
        principal: ownership.principal,
        payload: {
          purpose: "export",
          exportResources: sourceResult.resources,
        },
      });
    }

    if (!input.deletionScope) {
      return blocked(
        "access_owner_scoped_artifacts",
        "artifact_source_blocked",
        "Deletion artifact access requires a deletion scope.",
      );
    }

    const sourceResult = await config.artifactSource.listDeletionResources({
      principal: ownership.principal,
      scope: input.deletionScope,
      requestedAt: input.requestedAt,
    });

    if (sourceResult.status === "blocked") {
      return blocked(
        "access_owner_scoped_artifacts",
        "artifact_source_blocked",
        sourceResult.message,
      );
    }

    const parentRecords = sourceResult.parentRecords ?? [];
    const accountState = sourceResult.accountState ?? DEFAULT_ACCOUNT_STATE;

    if (
      !resourceOwnerMatchesDeletion(
        ownership.principal.principalId,
        sourceResult.resources,
        parentRecords,
      )
    ) {
      return blocked(
        "access_owner_scoped_artifacts",
        "artifact_source_owner_mismatch",
        "Deletion artifact source returned resources outside the resolved owner scope.",
      );
    }

    return allowed({
      operation: "access_owner_scoped_artifacts",
      principal: ownership.principal,
      payload: {
        purpose: "deletion",
        deletionResources: sourceResult.resources,
        parentRecords,
        accountState,
      },
    });
  }

  async function planExport(
    input: UserDataControlsPlanExportInput,
  ): Promise<UserDataControlsExportWorkflowFoundationResult> {
    const artifacts = await accessOwnerScopedArtifacts({
      authContext: input.authContext,
      clientOwnerFields: input.clientOwnerFields,
      purpose: "export",
      requestedAt: input.requestedAt,
      exportScope: input.scope,
    });

    if (artifacts.status === "blocked") {
      return {
        ...artifacts,
        operation: "plan_export",
      };
    }

    if (artifacts.payload.purpose !== "export") {
      return blocked(
        "plan_export",
        "artifact_source_blocked",
        "Export planning received non-export artifact payload.",
      );
    }

    const exportResult = exportRuntime.evaluate({
      authContext: artifacts.principal.authContext,
      ownerPrincipalId: artifacts.principal.principalId,
      request: {
        requestId: input.requestId,
        ownerPrincipalId: artifacts.principal.principalId,
        scope: input.scope,
        requestedAt: input.requestedAt,
        packageFormat: input.packageFormat ?? "manifest_only",
      },
      resources: artifacts.payload.exportResources,
    });

    if (exportResult.status === "blocked") {
      return blocked("plan_export", "export_contract_blocked", exportResult.message);
    }

    return allowed({
      operation: "plan_export",
      principal: artifacts.principal,
      payload: {
        exportResult,
      },
    });
  }

  async function planDeletion(
    input: UserDataControlsPlanDeletionInput,
  ): Promise<UserDataControlsDeletionWorkflowFoundationResult> {
    const artifacts = await accessOwnerScopedArtifacts({
      authContext: input.authContext,
      clientOwnerFields: input.clientOwnerFields,
      purpose: "deletion",
      requestedAt: input.requestedAt,
      deletionScope: input.scope,
    });

    if (artifacts.status === "blocked") {
      return {
        ...artifacts,
        operation: "plan_deletion",
      };
    }

    if (artifacts.payload.purpose !== "deletion") {
      return blocked(
        "plan_deletion",
        "artifact_source_blocked",
        "Deletion planning received non-deletion artifact payload.",
      );
    }

    const deletionResult = deletionRuntime.evaluate({
      authContext: artifacts.principal.authContext,
      ownerPrincipalId: artifacts.principal.principalId,
      request: {
        requestId: input.requestId,
        requestKind: input.requestKind,
        ownerPrincipalId: artifacts.principal.principalId,
        scope: input.scope,
        requestedAt: input.requestedAt,
        confirmationAcknowledged: input.confirmationAcknowledged,
      },
      accountState: artifacts.payload.accountState,
      resources: artifacts.payload.deletionResources,
      parentRecords: artifacts.payload.parentRecords,
    });

    if (deletionResult.status === "blocked") {
      return blocked(
        "plan_deletion",
        "deletion_contract_blocked",
        deletionResult.message,
      );
    }

    return allowed({
      operation: "plan_deletion",
      principal: artifacts.principal,
      payload: {
        deletionResult,
      },
    });
  }

  return {
    version: USER_DATA_CONTROLS_SERVER_WORKFLOW_VERSION,
    mode: USER_DATA_CONTROLS_SERVER_WORKFLOW_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    resolveCanonicalPrincipal,
    verifyOwnership,
    accessOwnerScopedArtifacts,
    planExport,
    planDeletion,
  };
}
