import { readServerAuthSession } from "../auth/session";
import type { LevioAuthRuntimeContext } from "../auth/types";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import type {
  DeletionPlan,
  DeletionPlanAction,
  DeletionScope,
  ExportPackagePlan,
  ExportRequestScope,
} from "./contracts";
import { createUserDataControlsPersistenceReadAdapter } from "./persistence-read-adapter";
import {
  createUserDataControlsServerWorkflowFoundation,
  type UserDataControlsDeletionWorkflowFoundationResult,
  type UserDataControlsExportWorkflowFoundationResult,
  type UserDataControlsServerWorkflowBlockedReason,
  type UserDataControlsServerWorkflowFoundation,
} from "./server-workflow";

export const USER_DATA_CONTROLS_API_ROUTE_FOUNDATION_VERSION =
  "4.3V-api-route-foundation.1" as const;
export const USER_DATA_CONTROLS_API_ROUTE_FOUNDATION_MODE =
  "api_route_foundation_only" as const;

export type UserDataControlsApiRouteFoundationVersion =
  typeof USER_DATA_CONTROLS_API_ROUTE_FOUNDATION_VERSION;
export type UserDataControlsApiRouteFoundationMode =
  typeof USER_DATA_CONTROLS_API_ROUTE_FOUNDATION_MODE;

export type UserDataControlsApiRouteOperation =
  | "export_request"
  | "deletion_request";

export type UserDataControlsApiRouteBlockedReason =
  | "api_route_disabled"
  | "method_not_allowed"
  | "invalid_json"
  | "request_body_invalid"
  | "client_owner_input_rejected"
  | "scope_empty"
  | "scope_not_supported"
  | "confirmation_required"
  | "workflow_blocked";

export type UserDataControlsApiRouteSafetyEvidence = {
  stage: "4.3V";
  apiRouteFoundationOnly: true;
  authenticatedOnly: true;
  ownerScopedOnly: true;
  canonicalPrincipalResolutionRequired: true;
  serverOnlyHandlers: true;
  failClosedByDefault: true;
  routeFeatureFlagRequired: true;
  clientOwnerInputAccepted: false;
  publicUnauthenticatedAccessAllowed: false;
  decisionSimulationArtifactsOnly: true;
  conversationHistoryCreated: false;
  chatLogsCreated: false;
  runtimeWritesEnabled: false;
  persistenceWritesEnabled: false;
  exportFilesCreated: false;
  exportStorageConnected: false;
  storageDownloadLinksCreated: false;
  deletionWritesEnabled: false;
  deletionExecuted: false;
  hardDeleteExecuted: false;
  accountDeletionOrchestrationEnabled: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  simulatorIntegrated: false;
  openAiIntegrated: false;
  billingIntegrated: false;
  subscriptionsIntegrated: false;
  memoryRuntimeIntegrated: false;
  productBehaviorChanged: false;
  rollback: "disable_LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED_or_remove_stage_4_3v_routes";
};

export type UserDataControlsApiRouteBlockedResponse = {
  status: "blocked";
  operation: UserDataControlsApiRouteOperation;
  reason: UserDataControlsApiRouteBlockedReason;
  workflowReason?: UserDataControlsServerWorkflowBlockedReason;
  message: string;
  evidence: UserDataControlsApiRouteSafetyEvidence;
};

export type UserDataControlsExportRouteAllowedResponse = {
  status: "accepted_foundation";
  operation: "export_request";
  requestId: string;
  execution: "preflight_only";
  packageFormat: "manifest_only";
  packageGeneration: "not_started";
  fileCreated: false;
  storageWrite: false;
  includedResources: number;
  excludedResources: number;
  includedResourceCategories: string[];
  forbiddenCategoriesExcluded: string[];
  evidence: UserDataControlsApiRouteSafetyEvidence;
};

export type UserDataControlsDeletionRouteAllowedResponse = {
  status: "accepted_foundation";
  operation: "deletion_request";
  requestId: string;
  execution: "preflight_only";
  requestKind: "resource_deletion_planning";
  lifecycleOnly: true;
  hardDeleteExecuted: false;
  databaseWrite: false;
  plannedEntries: number;
  blockedEntries: number;
  plannedActions: Record<DeletionPlanAction, number>;
  affectedResourceCategories: string[];
  evidence: UserDataControlsApiRouteSafetyEvidence;
};

export type UserDataControlsApiRouteResponsePayload =
  | UserDataControlsApiRouteBlockedResponse
  | UserDataControlsExportRouteAllowedResponse
  | UserDataControlsDeletionRouteAllowedResponse;

export type UserDataControlsApiRouteConfig = {
  enabled: boolean;
  workflow?: UserDataControlsServerWorkflowFoundation;
  readAuthContext?: () => Promise<LevioAuthRuntimeContext>;
  requestIdFactory?: () => string;
  now?: () => string;
};

type JsonRecord = Record<string, unknown>;

type ParsedBodyResult =
  | {
      status: "ready";
      body: JsonRecord;
    }
  | {
      status: "blocked";
      reason: Extract<UserDataControlsApiRouteBlockedReason, "invalid_json" | "request_body_invalid">;
      message: string;
    };

type ParsedExportRequest =
  | {
      status: "ready";
      scope: ExportRequestScope;
    }
  | {
      status: "blocked";
      reason: UserDataControlsApiRouteBlockedReason;
      message: string;
    };

type ParsedDeletionRequest =
  | {
      status: "ready";
      scope: DeletionScope;
      confirmationAcknowledged: true;
    }
  | {
      status: "blocked";
      reason: UserDataControlsApiRouteBlockedReason;
      message: string;
    };

const OWNER_FIELD_NAMES = new Set([
  "principalId",
  "principal_id",
  "ownerPrincipalId",
  "owner_principal_id",
  "ownerPrincipalType",
  "owner_principal_type",
  "ownerId",
  "owner_id",
  "providerReference",
  "provider_reference",
  "providerSubject",
  "provider_subject",
  "email",
]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function enabledFlag(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export function readUserDataControlsApiRouteConfigFromEnv(): Pick<
  UserDataControlsApiRouteConfig,
  "enabled"
> {
  return {
    enabled: enabledFlag(process.env.LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED),
  };
}

export function userDataControlsApiRouteSafetyEvidence(): UserDataControlsApiRouteSafetyEvidence {
  return {
    stage: "4.3V",
    apiRouteFoundationOnly: true,
    authenticatedOnly: true,
    ownerScopedOnly: true,
    canonicalPrincipalResolutionRequired: true,
    serverOnlyHandlers: true,
    failClosedByDefault: true,
    routeFeatureFlagRequired: true,
    clientOwnerInputAccepted: false,
    publicUnauthenticatedAccessAllowed: false,
    decisionSimulationArtifactsOnly: true,
    conversationHistoryCreated: false,
    chatLogsCreated: false,
    runtimeWritesEnabled: false,
    persistenceWritesEnabled: false,
    exportFilesCreated: false,
    exportStorageConnected: false,
    storageDownloadLinksCreated: false,
    deletionWritesEnabled: false,
    deletionExecuted: false,
    hardDeleteExecuted: false,
    accountDeletionOrchestrationEnabled: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    simulatorIntegrated: false,
    openAiIntegrated: false,
    billingIntegrated: false,
    subscriptionsIntegrated: false,
    memoryRuntimeIntegrated: false,
    productBehaviorChanged: false,
    rollback: "disable_LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED_or_remove_stage_4_3v_routes",
  };
}

function defaultRequestId(): string {
  return `udc_${crypto.randomUUID()}`;
}

function response(
  payload: UserDataControlsApiRouteResponsePayload,
  status: number,
): Response {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function blockedPayload(input: {
  operation: UserDataControlsApiRouteOperation;
  reason: UserDataControlsApiRouteBlockedReason;
  message: string;
  workflowReason?: UserDataControlsServerWorkflowBlockedReason;
}): UserDataControlsApiRouteBlockedResponse {
  return {
    status: "blocked",
    operation: input.operation,
    reason: input.reason,
    workflowReason: input.workflowReason,
    message: input.message,
    evidence: userDataControlsApiRouteSafetyEvidence(),
  };
}

function statusForBlockedReason(input: {
  reason: UserDataControlsApiRouteBlockedReason;
  workflowReason?: UserDataControlsServerWorkflowBlockedReason;
}): number {
  if (input.reason === "method_not_allowed") {
    return 405;
  }

  if (input.reason === "api_route_disabled") {
    return 503;
  }

  if (
    input.reason === "invalid_json" ||
    input.reason === "request_body_invalid" ||
    input.reason === "scope_empty" ||
    input.reason === "scope_not_supported" ||
    input.reason === "confirmation_required" ||
    input.reason === "client_owner_input_rejected"
  ) {
    return 400;
  }

  if (
    input.workflowReason === "auth_context_missing" ||
    input.workflowReason === "auth_context_not_authenticated" ||
    input.workflowReason === "session_not_active"
  ) {
    return 401;
  }

  if (
    input.workflowReason === "ownership_mismatch" ||
    input.workflowReason === "artifact_source_owner_mismatch" ||
    input.workflowReason === "principal_provider_mismatch"
  ) {
    return 403;
  }

  if (
    input.workflowReason === "persistence_runtime_unavailable" ||
    input.workflowReason === "artifact_source_unavailable" ||
    input.workflowReason === "artifact_source_blocked" ||
    input.workflowReason === "principal_resolution_failed"
  ) {
    return 503;
  }

  return 409;
}

function blockedResponse(input: {
  operation: UserDataControlsApiRouteOperation;
  reason: UserDataControlsApiRouteBlockedReason;
  message: string;
  workflowReason?: UserDataControlsServerWorkflowBlockedReason;
}): Response {
  return response(
    blockedPayload(input),
    statusForBlockedReason({
      reason: input.reason,
      workflowReason: input.workflowReason,
    }),
  );
}

async function parseJsonBody(request: Request): Promise<ParsedBodyResult> {
  let value: unknown;

  try {
    value = await request.json();
  } catch {
    return {
      status: "blocked",
      reason: "invalid_json",
      message: "User Data Controls API route foundation requires a JSON request body.",
    };
  }

  if (!isRecord(value)) {
    return {
      status: "blocked",
      reason: "request_body_invalid",
      message: "User Data Controls API route foundation accepts JSON objects only.",
    };
  }

  return {
    status: "ready",
    body: value,
  };
}

function containsOwnerField(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsOwnerField);
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(
    ([key, nestedValue]) => OWNER_FIELD_NAMES.has(key) || containsOwnerField(nestedValue),
  );
}

function readBoolean(record: JsonRecord, key: string): boolean {
  return record[key] === true;
}

function readScopeRecord(body: JsonRecord): JsonRecord | undefined {
  return isRecord(body.scope) ? body.scope : undefined;
}

function exportScopeEmpty(scope: ExportRequestScope): boolean {
  return !(
    scope.includePrincipalMetadata ||
    scope.includeSavedSimulations ||
    scope.includeSimulationDrafts ||
    scope.includeSimulationHistory
  );
}

function deletionScopeEmpty(scope: DeletionScope): boolean {
  return !(
    scope.includePrincipalRecord ||
    scope.includeSavedSimulations ||
    scope.includeSimulationDrafts ||
    scope.includeSimulationHistory
  );
}

function parseExportRequest(body: JsonRecord): ParsedExportRequest {
  if (containsOwnerField(body)) {
    return {
      status: "blocked",
      reason: "client_owner_input_rejected",
      message: "Client-supplied owner, principal, provider, or email fields are rejected.",
    };
  }

  const scopeRecord = readScopeRecord(body);

  if (!scopeRecord) {
    return {
      status: "blocked",
      reason: "request_body_invalid",
      message: "Export request foundation requires a scope object.",
    };
  }

  const scope: ExportRequestScope = {
    includePrincipalMetadata: readBoolean(scopeRecord, "includePrincipalMetadata"),
    includeSavedSimulations: readBoolean(scopeRecord, "includeSavedSimulations"),
    includeSimulationDrafts: readBoolean(scopeRecord, "includeSimulationDrafts"),
    includeSimulationHistory: readBoolean(scopeRecord, "includeSimulationHistory"),
  };

  if (exportScopeEmpty(scope)) {
    return {
      status: "blocked",
      reason: "scope_empty",
      message: "Export request foundation requires at least one owner-scoped resource category.",
    };
  }

  return {
    status: "ready",
    scope,
  };
}

function parseDeletionRequest(body: JsonRecord): ParsedDeletionRequest {
  if (containsOwnerField(body)) {
    return {
      status: "blocked",
      reason: "client_owner_input_rejected",
      message: "Client-supplied owner, principal, provider, or email fields are rejected.",
    };
  }

  if (body.requestKind && body.requestKind !== "resource_deletion_planning") {
    return {
      status: "blocked",
      reason: "scope_not_supported",
      message: "Stage 4.3V supports resource deletion planning only, not account deletion orchestration.",
    };
  }

  if (body.confirmationAcknowledged !== true) {
    return {
      status: "blocked",
      reason: "confirmation_required",
      message: "Deletion request foundation requires explicit confirmation acknowledgement.",
    };
  }

  const scopeRecord = readScopeRecord(body);

  if (!scopeRecord) {
    return {
      status: "blocked",
      reason: "request_body_invalid",
      message: "Deletion request foundation requires a scope object.",
    };
  }

  const scope: DeletionScope = {
    includePrincipalRecord: readBoolean(scopeRecord, "includePrincipalRecord"),
    includeSavedSimulations: readBoolean(scopeRecord, "includeSavedSimulations"),
    includeSimulationDrafts: readBoolean(scopeRecord, "includeSimulationDrafts"),
    includeSimulationHistory: readBoolean(scopeRecord, "includeSimulationHistory"),
  };

  if (scope.includePrincipalRecord) {
    return {
      status: "blocked",
      reason: "scope_not_supported",
      message: "Stage 4.3V does not expose principal or account deletion orchestration.",
    };
  }

  if (deletionScopeEmpty(scope)) {
    return {
      status: "blocked",
      reason: "scope_empty",
      message: "Deletion request foundation requires at least one decision artifact category.",
    };
  }

  return {
    status: "ready",
    scope,
    confirmationAcknowledged: true,
  };
}

function exportAllowedPayload(
  result: Extract<UserDataControlsExportWorkflowFoundationResult, { status: "allowed" }>,
): UserDataControlsExportRouteAllowedResponse {
  const exportResult = result.payload.exportResult;
  const packagePlan: ExportPackagePlan = exportResult.packagePlan;
  const includedResourceCategories = Array.from(
    new Set(packagePlan.includes.map((entry) => entry.resourceCategory)),
  ).sort();

  return {
    status: "accepted_foundation",
    operation: "export_request",
    requestId: exportResult.requestId,
    execution: "preflight_only",
    packageFormat: packagePlan.packageFormat,
    packageGeneration: packagePlan.generation,
    fileCreated: packagePlan.fileCreated,
    storageWrite: packagePlan.storageWrite,
    includedResources: packagePlan.includes.length,
    excludedResources: packagePlan.excluded.length,
    includedResourceCategories,
    forbiddenCategoriesExcluded: packagePlan.forbiddenCategoriesExcluded,
    evidence: userDataControlsApiRouteSafetyEvidence(),
  };
}

function countDeletionActions(plan: DeletionPlan): Record<DeletionPlanAction, number> {
  const counts: Record<DeletionPlanAction, number> = {
    mark_deletion_requested: 0,
    mark_restricted: 0,
    retain_legal_exception: 0,
    retain_active_subscription: 0,
    no_action_terminal: 0,
    no_action_scope_excluded: 0,
  };

  plan.entries.forEach((entry) => {
    counts[entry.plannedAction] += 1;
  });

  return counts;
}

function deletionAllowedPayload(
  result: Extract<UserDataControlsDeletionWorkflowFoundationResult, { status: "allowed" }>,
): UserDataControlsDeletionRouteAllowedResponse {
  const deletionResult = result.payload.deletionResult;
  const plan = deletionResult.deletionPlan;
  const affectedResourceCategories = Array.from(
    new Set(plan.entries.map((entry) => entry.resourceCategory)),
  ).sort();

  return {
    status: "accepted_foundation",
    operation: "deletion_request",
    requestId: deletionResult.requestId,
    execution: "preflight_only",
    requestKind: "resource_deletion_planning",
    lifecycleOnly: plan.lifecycleOnly,
    hardDeleteExecuted: plan.hardDeleteExecuted,
    databaseWrite: plan.databaseWrite,
    plannedEntries: plan.entries.length,
    blockedEntries: plan.blockers.length,
    plannedActions: countDeletionActions(plan),
    affectedResourceCategories,
    evidence: userDataControlsApiRouteSafetyEvidence(),
  };
}

function defaultWorkflow(enabled: boolean): UserDataControlsServerWorkflowFoundation {
  const artifactSource = createUserDataControlsPersistenceReadAdapter({
    enabled,
  });

  return createUserDataControlsServerWorkflowFoundation({
    enabled,
    persistenceRuntime: initializePersistenceRuntimeWiring({
      providerFactoryInput: {
        adapterKind: "supabase",
      },
    }),
    artifactSource,
  });
}

export function createUserDataControlsApiRouteFoundation(
  config: UserDataControlsApiRouteConfig,
) {
  const readAuthContext = config.readAuthContext ?? readServerAuthSession;
  const requestIdFactory = config.requestIdFactory ?? defaultRequestId;
  const now = config.now ?? (() => new Date().toISOString());
  const workflow = config.workflow ?? defaultWorkflow(config.enabled);

  async function handleExportRequest(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return blockedResponse({
        operation: "export_request",
        reason: "method_not_allowed",
        message: "Export request foundation accepts POST only.",
      });
    }

    if (!config.enabled) {
      return blockedResponse({
        operation: "export_request",
        reason: "api_route_disabled",
        message: "User Data Controls API route foundation is disabled by rollout configuration.",
      });
    }

    const parsedBody = await parseJsonBody(request);

    if (parsedBody.status === "blocked") {
      return blockedResponse({
        operation: "export_request",
        reason: parsedBody.reason,
        message: parsedBody.message,
      });
    }

    const parsedRequest = parseExportRequest(parsedBody.body);

    if (parsedRequest.status === "blocked") {
      return blockedResponse({
        operation: "export_request",
        reason: parsedRequest.reason,
        message: parsedRequest.message,
      });
    }

    const workflowResult = await workflow.planExport({
      authContext: await readAuthContext(),
      requestId: requestIdFactory(),
      requestedAt: now(),
      scope: parsedRequest.scope,
      packageFormat: "manifest_only",
    });

    if (workflowResult.status === "blocked") {
      return blockedResponse({
        operation: "export_request",
        reason: "workflow_blocked",
        workflowReason: workflowResult.reason,
        message: workflowResult.message,
      });
    }

    return response(exportAllowedPayload(workflowResult), 202);
  }

  async function handleDeletionRequest(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return blockedResponse({
        operation: "deletion_request",
        reason: "method_not_allowed",
        message: "Deletion request foundation accepts POST only.",
      });
    }

    if (!config.enabled) {
      return blockedResponse({
        operation: "deletion_request",
        reason: "api_route_disabled",
        message: "User Data Controls API route foundation is disabled by rollout configuration.",
      });
    }

    const parsedBody = await parseJsonBody(request);

    if (parsedBody.status === "blocked") {
      return blockedResponse({
        operation: "deletion_request",
        reason: parsedBody.reason,
        message: parsedBody.message,
      });
    }

    const parsedRequest = parseDeletionRequest(parsedBody.body);

    if (parsedRequest.status === "blocked") {
      return blockedResponse({
        operation: "deletion_request",
        reason: parsedRequest.reason,
        message: parsedRequest.message,
      });
    }

    const workflowResult = await workflow.planDeletion({
      authContext: await readAuthContext(),
      requestId: requestIdFactory(),
      requestedAt: now(),
      scope: parsedRequest.scope,
      requestKind: "resource_deletion_planning",
      confirmationAcknowledged: parsedRequest.confirmationAcknowledged,
    });

    if (workflowResult.status === "blocked") {
      return blockedResponse({
        operation: "deletion_request",
        reason: "workflow_blocked",
        workflowReason: workflowResult.reason,
        message: workflowResult.message,
      });
    }

    return response(deletionAllowedPayload(workflowResult), 202);
  }

  return {
    version: USER_DATA_CONTROLS_API_ROUTE_FOUNDATION_VERSION,
    mode: USER_DATA_CONTROLS_API_ROUTE_FOUNDATION_MODE,
    enabled: config.enabled,
    writesEnabled: false as const,
    evidence: userDataControlsApiRouteSafetyEvidence(),
    handleExportRequest,
    handleDeletionRequest,
  };
}

const defaultRouteFoundation = createUserDataControlsApiRouteFoundation({
  ...readUserDataControlsApiRouteConfigFromEnv(),
});

export function handleUserDataControlsExportRequest(request: Request): Promise<Response> {
  return defaultRouteFoundation.handleExportRequest(request);
}

export function handleUserDataControlsDeletionRequest(request: Request): Promise<Response> {
  return defaultRouteFoundation.handleDeletionRequest(request);
}
