import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, PersistenceProviderAdapter } from "../persistence-runtime";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import type {
  DeletionResourceSnapshot,
  ExportResourceSnapshot,
} from "./contracts";
import {
  createUserDataControlsApiRouteFoundation,
  type UserDataControlsApiRouteResponsePayload,
  type UserDataControlsApiRouteSafetyEvidence,
} from "./api-route-foundation";
import {
  createUserDataControlsServerWorkflowFoundation,
  type UserDataControlsOwnerScopedArtifactSource,
} from "./server-workflow";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]>;
};

export type UserDataControlsApiRouteFoundationValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type UserDataControlsApiRouteFoundationValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: UserDataControlsApiRouteFoundationValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-999999999999";
const principalId = "3d25a625-7ad3-4995-9d13-999999999999";
const requestedAt = "2026-06-20T18:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_3v_validation_session",
  sessionStatus: "active",
  assuranceLevel: "authenticated",
  riskFlags: [],
};

const signedOutContext: LevioAuthRuntimeContext = {
  identityState: "signed_out",
  error: {
    code: "session_missing",
    message: "No validation session.",
  },
};

const principalRow: LevioPrincipalRow = {
  principal_id: principalId,
  principal_type: "registered_user",
  principal_status: "active",
  provider_name: "supabase",
  provider_reference: providerReference,
  provider_reference_status: "active",
  provider_subject_type: "user",
  provider_email_snapshot: null,
  provider_email_verified: false,
  created_at: "2026-06-20T10:00:00.000Z",
  updated_at: "2026-06-20T10:00:00.000Z",
  verified_at: null,
  disabled_at: null,
  deleted_at: null,
  deletion_requested_at: null,
  last_authenticated_at: null,
  last_provider_sync_at: null,
  deletion_state: "active",
  retention_rule: "account_lifecycle",
  recovery_state: null,
  locale_preference: null,
  metadata_version: null,
  legal_hold_reason: null,
  schema_version: 1,
};

const exportResource: ExportResourceSnapshot = {
  resourceId: "record_stage4_3v_export",
  resourceCategory: "saved_simulation",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  exportEligible: true,
  deletionState: "active",
  lifecycleState: "active",
  dataCategories: ["simulation_record", "decision_provenance", "lifecycle_metadata"],
  createdAt: "2026-06-20T10:10:00.000Z",
  updatedAt: "2026-06-20T10:20:00.000Z",
  deletedAt: null,
  retentionRule: "saved_simulation_lifecycle",
  schemaVersion: 1,
};

const deletionResource: DeletionResourceSnapshot = {
  resourceId: "record_stage4_3v_delete",
  resourceCategory: "saved_simulation",
  ownerPrincipalId: principalId,
  ownerPrincipalType: "registered_user",
  lifecycleState: "active",
  deletionState: "active",
  retentionRule: "saved_simulation_lifecycle",
  createdAt: "2026-06-20T10:10:00.000Z",
  updatedAt: "2026-06-20T10:20:00.000Z",
  deletedAt: null,
};

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function expectEvidence(evidence: UserDataControlsApiRouteSafetyEvidence): string[] {
  return evidence.stage === "4.3V" &&
    evidence.apiRouteFoundationOnly &&
    evidence.authenticatedOnly &&
    evidence.ownerScopedOnly &&
    evidence.canonicalPrincipalResolutionRequired &&
    evidence.serverOnlyHandlers &&
    evidence.failClosedByDefault &&
    evidence.routeFeatureFlagRequired &&
    evidence.clientOwnerInputAccepted === false &&
    evidence.publicUnauthenticatedAccessAllowed === false &&
    evidence.decisionSimulationArtifactsOnly &&
    evidence.conversationHistoryCreated === false &&
    evidence.chatLogsCreated === false &&
    evidence.runtimeWritesEnabled === false &&
    evidence.persistenceWritesEnabled === false &&
    evidence.exportFilesCreated === false &&
    evidence.exportStorageConnected === false &&
    evidence.storageDownloadLinksCreated === false &&
    evidence.deletionWritesEnabled === false &&
    evidence.deletionExecuted === false &&
    evidence.hardDeleteExecuted === false &&
    evidence.accountDeletionOrchestrationEnabled === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.openAiIntegrated === false &&
    evidence.billingIntegrated === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.memoryRuntimeIntegrated === false &&
    evidence.productBehaviorChanged === false
    ? []
    : ["Stage 4.3V API route safety evidence changed."];
}

function createResolvingAdapter(): PersistenceProviderAdapter {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference(input) {
      return input.providerReference === `supabase:${providerReference}` ||
        input.providerReference === providerReference
        ? principalRow
        : null;
    },
  };
}

function createArtifactSource(input?: {
  exportResources?: ExportResourceSnapshot[];
  deletionResources?: DeletionResourceSnapshot[];
  executionBoundary?: "server_only";
}): UserDataControlsOwnerScopedArtifactSource {
  return {
    executionBoundary: input?.executionBoundary ?? "server_only",
    async listExportResources() {
      return {
        status: "ready",
        resources: input?.exportResources ?? [exportResource],
      };
    },
    async listDeletionResources() {
      return {
        status: "ready",
        resources: input?.deletionResources ?? [deletionResource],
        parentRecords: [],
        accountState: {
          activeSubscription: false,
          subscriptionStatus: "none",
        },
      };
    },
  };
}

function createWorkflow(input?: {
  artifactSource?: UserDataControlsOwnerScopedArtifactSource;
}) {
  return createUserDataControlsServerWorkflowFoundation({
    enabled: true,
    persistenceRuntime: initializePersistenceRuntimeWiring({
      providerAdapter: createResolvingAdapter(),
    }),
    artifactSource: input?.artifactSource ?? createArtifactSource(),
  });
}

function createRouteFoundation(input?: {
  enabled?: boolean;
  authContext?: LevioAuthRuntimeContext;
  artifactSource?: UserDataControlsOwnerScopedArtifactSource;
}) {
  return createUserDataControlsApiRouteFoundation({
    enabled: input?.enabled ?? true,
    workflow: createWorkflow({ artifactSource: input?.artifactSource }),
    readAuthContext: async () => input?.authContext ?? authenticatedContext,
    requestIdFactory: () => "udc_stage4_3v_validation",
    now: () => requestedAt,
  });
}

function createRequest(body: unknown, method = "POST"): Request {
  return new Request("https://levio.test/api/user-data-controls/export", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

async function readPayload(response: Response): Promise<UserDataControlsApiRouteResponsePayload> {
  return (await response.json()) as UserDataControlsApiRouteResponsePayload;
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_route_fails_closed",
      title: "Disabled API route fails closed",
      expectedBehavior: "Feature-flag disabled routes return blocked without workflow exposure.",
      async run() {
        const route = createUserDataControlsApiRouteFoundation({
          enabled: false,
          workflow: createWorkflow(),
          readAuthContext: async () => authenticatedContext,
        });
        const response = await route.handleExportRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 503, "Expected disabled route status 503."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "api_route_disabled",
            "Expected api_route_disabled payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "method_not_allowed",
      title: "Unsupported method is rejected",
      expectedBehavior: "Route foundation accepts POST only.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRequest({}, "GET"),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 405, "Expected method-not-allowed status 405."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "method_not_allowed",
            "Expected method_not_allowed payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "export_rejects_client_owner_input",
      title: "Export rejects client owner input",
      expectedBehavior: "Client-supplied ownership is rejected before workflow execution.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRequest({
            ownerPrincipalId: principalId,
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 400, "Expected client owner rejection status 400."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "client_owner_input_rejected",
            "Expected client_owner_input_rejected payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "export_requires_authenticated_context",
      title: "Export requires authentication",
      expectedBehavior: "Signed-out requests fail closed through the server workflow.",
      async run() {
        const response = await createRouteFoundation({
          authContext: signedOutContext,
        }).handleExportRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 401, "Expected signed-out status 401."),
          ...issueUnless(
            payload.status === "blocked" &&
              payload.reason === "workflow_blocked" &&
              payload.workflowReason === "auth_context_not_authenticated",
            "Expected workflow auth_context_not_authenticated block.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "export_returns_manifest_only_summary",
      title: "Export returns manifest-only summary",
      expectedBehavior: "Allowed export route returns sanitized manifest planning metadata only.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 202, "Expected export accepted status 202."),
          ...issueUnless(
            payload.status === "accepted_foundation" &&
              payload.operation === "export_request" &&
              payload.packageFormat === "manifest_only" &&
              payload.packageGeneration === "not_started" &&
              payload.fileCreated === false &&
              payload.storageWrite === false &&
              payload.includedResources === 1,
            "Expected manifest-only export foundation response.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "deletion_requires_confirmation",
      title: "Deletion requires confirmation",
      expectedBehavior: "Deletion route rejects requests without explicit acknowledgement.",
      async run() {
        const response = await createRouteFoundation().handleDeletionRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 400, "Expected confirmation-required status 400."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "confirmation_required",
            "Expected confirmation_required payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "deletion_blocks_account_scope",
      title: "Deletion blocks account scope",
      expectedBehavior: "Account deletion orchestration is not exposed in Stage 4.3V.",
      async run() {
        const response = await createRouteFoundation().handleDeletionRequest(
          createRequest({
            confirmationAcknowledged: true,
            requestKind: "account_deletion_planning",
            scope: {
              includePrincipalRecord: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 400, "Expected account scope rejection status 400."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "scope_not_supported",
            "Expected scope_not_supported payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "deletion_rejects_client_owner_input",
      title: "Deletion rejects client owner input",
      expectedBehavior: "Deletion route rejects forged owner fields before workflow execution.",
      async run() {
        const response = await createRouteFoundation().handleDeletionRequest(
          createRequest({
            ownerPrincipalId: principalId,
            confirmationAcknowledged: true,
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 400, "Expected client owner rejection status 400."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "client_owner_input_rejected",
            "Expected client_owner_input_rejected payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "deletion_returns_lifecycle_only_summary",
      title: "Deletion returns lifecycle-only summary",
      expectedBehavior: "Allowed deletion route returns a lifecycle plan without writes.",
      async run() {
        const response = await createRouteFoundation().handleDeletionRequest(
          createRequest({
            confirmationAcknowledged: true,
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 202, "Expected deletion accepted status 202."),
          ...issueUnless(
            payload.status === "accepted_foundation" &&
              payload.operation === "deletion_request" &&
              payload.lifecycleOnly &&
              payload.hardDeleteExecuted === false &&
              payload.databaseWrite === false &&
              payload.plannedEntries === 1,
            "Expected lifecycle-only deletion foundation response.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "artifact_source_owner_mismatch_fails_closed",
      title: "Artifact source owner mismatch fails closed",
      expectedBehavior: "Cross-owner artifact output is blocked before route response exposure.",
      async run() {
        const response = await createRouteFoundation({
          artifactSource: createArtifactSource({
            exportResources: [
              {
                ...exportResource,
                ownerPrincipalId: "another_principal",
              },
            ],
          }),
        }).handleExportRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 403, "Expected cross-owner artifact status 403."),
          ...issueUnless(
            payload.status === "blocked" &&
              payload.reason === "workflow_blocked" &&
              payload.workflowReason === "artifact_source_owner_mismatch",
            "Expected artifact_source_owner_mismatch payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
  ];
}

export async function runUserDataControlsApiRouteFoundationValidation(): Promise<UserDataControlsApiRouteFoundationValidationResult> {
  const results: UserDataControlsApiRouteFoundationValidationCaseResult[] = [];

  for (const validationCase of cases()) {
    const issues = await validationCase.run();
    const passed = issues.length === 0;

    results.push({
      caseId: validationCase.id,
      title: validationCase.title,
      expectedBehavior: validationCase.expectedBehavior,
      passed,
      failed: !passed,
      issues,
    });
  }

  const passedCount = results.filter((result) => result.passed).length;
  const failedCount = results.length - passedCount;

  return {
    passed: failedCount === 0,
    failed: failedCount > 0,
    cases: results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
    },
  };
}
