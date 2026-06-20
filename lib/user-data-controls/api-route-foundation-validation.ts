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
import { createUserDataControlsApiRouteHardeningFoundation } from "./api-route-hardening";
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
const allowedOrigin = "https://levio.test";
const csrfToken = "stage4_3z_csrf_token";

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

const revokedContext: LevioSessionContext = {
  ...authenticatedContext,
  sessionId: "stage_4_3z_revoked_session",
  sessionStatus: "revoked",
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
    evidence.routeHardeningFoundationIntegrated &&
    evidence.rateLimitingFoundation &&
    evidence.abuseProtectionFoundation &&
    evidence.csrfProtectionFoundation &&
    evidence.originRefererValidationFoundation &&
    evidence.revokedSessionHandlingFoundation &&
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
  rateLimitMaxRequests?: number;
  hardeningEnabled?: boolean;
}) {
  const rateLimitStore = new Map();

  return createUserDataControlsApiRouteFoundation({
    enabled: input?.enabled ?? true,
    hardening: createUserDataControlsApiRouteHardeningFoundation({
      enabled: input?.hardeningEnabled ?? true,
      allowedOrigins: [allowedOrigin],
      rateLimitMaxRequests: input?.rateLimitMaxRequests ?? 100,
      rateLimitWindowMs: 60_000,
      maxRequestBytes: 4_096,
      now: () => 1_000,
      rateLimitStore,
    }),
    workflow: createWorkflow({ artifactSource: input?.artifactSource }),
    readAuthContext: async () => input?.authContext ?? authenticatedContext,
    requestIdFactory: () => "udc_stage4_3v_validation",
    now: () => requestedAt,
  });
}

function createRequest(
  body: unknown,
  method = "POST",
  headers?: Record<string, string | undefined>,
): Request {
  const requestHeaders: Record<string, string> = {
    "content-type": "application/json",
    origin: allowedOrigin,
    cookie: `levio_csrf=${encodeURIComponent(csrfToken)}`,
    "x-levio-csrf-token": csrfToken,
    "x-forwarded-for": "203.0.113.4",
  };

  Object.entries(headers ?? {}).forEach(([key, value]) => {
    if (value === undefined) {
      delete requestHeaders[key.toLowerCase()];
    } else {
      requestHeaders[key] = value;
    }
  });

  return new Request("https://levio.test/api/user-data-controls/export", {
    method,
    headers: requestHeaders,
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

function createRawRequest(
  body: string,
  headers?: Record<string, string | undefined>,
): Request {
  return new Request("https://levio.test/api/user-data-controls/export", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: allowedOrigin,
      cookie: `levio_csrf=${encodeURIComponent(csrfToken)}`,
      "x-levio-csrf-token": csrfToken,
      "x-forwarded-for": "203.0.113.4",
      ...headers,
    },
    body,
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
      id: "rate_limit_exceeded",
      title: "Rate limit exceeded fails closed",
      expectedBehavior: "Route-specific rate limiting blocks repeated requests before workflow exposure.",
      async run() {
        const route = createRouteFoundation({
          rateLimitMaxRequests: 1,
        });
        await route.handleExportRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const response = await route.handleExportRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 429, "Expected rate limit status 429."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "rate_limit_exceeded",
            "Expected rate_limit_exceeded payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "abuse_detection_blocks",
      title: "Abuse detection blocks",
      expectedBehavior: "Route hardening rejects abusive request signals before workflow exposure.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRequest(
            {
              scope: {
                includeSavedSimulations: true,
              },
            },
            "POST",
            {
              "x-levio-abuse-signal": "detected",
            },
          ),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 403, "Expected abuse status 403."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "abuse_detected",
            "Expected abuse_detected payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "missing_origin_blocks",
      title: "Missing origin blocks",
      expectedBehavior: "Origin/Referer validation fails closed when no origin evidence exists.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRequest(
            {
              scope: {
                includeSavedSimulations: true,
              },
            },
            "POST",
            {
              origin: undefined,
              referer: undefined,
            },
          ),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 403, "Expected missing origin status 403."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "origin_missing",
            "Expected origin_missing payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "invalid_origin_blocks",
      title: "Invalid origin blocks",
      expectedBehavior: "Origin/Referer validation rejects requests outside the allowlist.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRequest(
            {
              scope: {
                includeSavedSimulations: true,
              },
            },
            "POST",
            {
              origin: "https://evil.example",
            },
          ),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 403, "Expected invalid origin status 403."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "origin_invalid",
            "Expected origin_invalid payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "csrf_failure_blocks",
      title: "CSRF failure blocks",
      expectedBehavior: "CSRF protection rejects missing or mismatched double-submit tokens.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRequest(
            {
              scope: {
                includeSavedSimulations: true,
              },
            },
            "POST",
            {
              "x-levio-csrf-token": "wrong_stage4_3z_token",
            },
          ),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 403, "Expected CSRF status 403."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "csrf_failed",
            "Expected csrf_failed payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "revoked_session_blocks",
      title: "Revoked session blocks",
      expectedBehavior: "Route hardening explicitly rejects revoked authenticated sessions.",
      async run() {
        const response = await createRouteFoundation({
          authContext: revokedContext,
        }).handleExportRequest(
          createRequest({
            scope: {
              includeSavedSimulations: true,
            },
          }),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 401, "Expected revoked session status 401."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "session_revoked",
            "Expected session_revoked payload.",
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
      id: "malformed_request_blocks",
      title: "Malformed request blocks",
      expectedBehavior: "Malformed JSON fails closed after hardening and before workflow execution.",
      async run() {
        const response = await createRouteFoundation().handleExportRequest(
          createRawRequest("{not-valid-json"),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 400, "Expected malformed request status 400."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "invalid_json",
            "Expected invalid_json payload.",
          ),
          ...expectEvidence(payload.evidence),
        ];
      },
    },
    {
      id: "rollback_disabled_route_preempts_hardening",
      title: "Rollback disabled route preempts hardening",
      expectedBehavior:
        "Disabling the route flag remains the rollback switch even when hardening headers are absent.",
      async run() {
        const response = await createRouteFoundation({
          enabled: false,
        }).handleExportRequest(
          createRequest(
            {
              scope: {
                includeSavedSimulations: true,
              },
            },
            "POST",
            {
              origin: undefined,
              "x-levio-csrf-token": undefined,
            },
          ),
        );
        const payload = await readPayload(response);

        return [
          ...issueUnless(response.status === 503, "Expected disabled route status 503."),
          ...issueUnless(
            payload.status === "blocked" && payload.reason === "api_route_disabled",
            "Expected api_route_disabled rollback payload.",
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
