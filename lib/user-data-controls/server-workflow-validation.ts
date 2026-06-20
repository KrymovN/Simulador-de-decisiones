import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, PersistenceProviderAdapter } from "../persistence-runtime";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import type {
  DeletionResourceSnapshot,
  ExportResourceSnapshot,
} from "./contracts";
import {
  createUserDataControlsServerWorkflowFoundation,
  type UserDataControlsOwnerScopedArtifactSource,
  type UserDataControlsServerWorkflowFoundation,
  type UserDataControlsServerWorkflowBlockedReason,
  type UserDataControlsServerWorkflowSafetyEvidence,
} from "./server-workflow";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]>;
};

export type UserDataControlsServerWorkflowValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type UserDataControlsServerWorkflowValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: UserDataControlsServerWorkflowValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-444444444444";
const principalId = "3d25a625-7ad3-4995-9d13-555555555555";
const requestedAt = "2026-06-20T14:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_3s_validation_session",
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

const exportRecord: ExportResourceSnapshot = {
  resourceId: "record_stage4_3s_export",
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

const deletionRecord: DeletionResourceSnapshot = {
  resourceId: "record_stage4_3s_delete",
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
        resources: input?.exportResources ?? [exportRecord],
      };
    },
    async listDeletionResources() {
      return {
        status: "ready",
        resources: input?.deletionResources ?? [deletionRecord],
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
  enabled?: boolean;
  artifactSource?: UserDataControlsOwnerScopedArtifactSource;
}): UserDataControlsServerWorkflowFoundation {
  return createUserDataControlsServerWorkflowFoundation({
    enabled: input?.enabled ?? true,
    persistenceRuntime: initializePersistenceRuntimeWiring({
      providerAdapter: createResolvingAdapter(),
    }),
    artifactSource: input?.artifactSource ?? createArtifactSource(),
  });
}

function expectWorkflowEvidence(
  evidence: UserDataControlsServerWorkflowSafetyEvidence,
): string[] {
  return evidence.stage === "4.3S" &&
    evidence.serverWorkflowOnly &&
    evidence.foundationOnly &&
    evidence.failClosedByDefault &&
    evidence.canonicalPrincipalResolutionRequired &&
    evidence.ownerScopedArtifactsOnly &&
    evidence.persistenceRuntimeBoundaryUsed &&
    evidence.artifactSourceRequiresServerOnly &&
    evidence.exportFoundationContractUsed &&
    evidence.deletionFoundationContractUsed &&
    evidence.runtimeWritesEnabled === false &&
    evidence.persistenceWritesEnabled === false &&
    evidence.exportFilesCreated === false &&
    evidence.exportStorageConnected === false &&
    evidence.deletionExecuted === false &&
    evidence.hardDeleteExecuted === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.openAiIntegrated === false &&
    evidence.billingIntegrated === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.memoryRuntimeIntegrated === false &&
    evidence.productBehaviorChanged === false
    ? []
    : ["Stage 4.3S server workflow safety evidence changed."];
}

function expectBlocked(
  reason: UserDataControlsServerWorkflowBlockedReason,
) {
  return (result: { status: string; reason?: string }): string[] =>
    result.status === "blocked" && result.reason === reason
      ? []
      : [`Expected blocked result with reason ${reason}.`];
}

function exportScope() {
  return {
    includePrincipalMetadata: false,
    includeSavedSimulations: true,
    includeSimulationDrafts: false,
    includeSimulationHistory: false,
  };
}

function deletionScope() {
  return {
    includePrincipalRecord: false,
    includeSavedSimulations: true,
    includeSimulationDrafts: false,
    includeSimulationHistory: false,
  };
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_workflow_blocks",
      title: "Disabled server workflow fails closed",
      expectedBehavior:
        "The Stage 4.3S server workflow cannot resolve principals while disabled.",
      run: async () => {
        const result = await createWorkflow({ enabled: false }).resolveCanonicalPrincipal({
          authContext: authenticatedContext,
        });

        return [
          ...expectBlocked("workflow_disabled")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "signed_out_context_denied",
      title: "Signed-out context is denied",
      expectedBehavior:
        "Canonical principal resolution requires authenticated registered-user context.",
      run: async () => {
        const result = await createWorkflow().resolveCanonicalPrincipal({
          authContext: signedOutContext,
        });

        return [
          ...expectBlocked("auth_context_not_authenticated")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "canonical_principal_resolution_allowed",
      title: "Provider reference resolves to canonical Levio principal",
      expectedBehavior:
        "Stage 4.3S replaces provider-derived auth principal with levio_principals.principal_id.",
      run: async () => {
        const result = await createWorkflow().resolveCanonicalPrincipal({
          authContext: authenticatedContext,
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected canonical resolution to pass."),
          ...issueUnless(
            result.status === "allowed" && result.principal.principalId === principalId,
            "Expected canonical principal id from levio_principals.",
          ),
          ...issueUnless(
            result.status === "allowed" &&
              result.principal.authContext.principal.principalId === principalId,
            "Expected canonical auth context for downstream Stage 4.3 contracts.",
          ),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "client_owner_fields_rejected",
      title: "Client owner fields are rejected",
      expectedBehavior:
        "Client-supplied owner identifiers cannot participate in server workflow authorization.",
      run: async () => {
        const result = await createWorkflow().verifyOwnership({
          authContext: authenticatedContext,
          clientOwnerFields: {
            ownerPrincipalId: principalId,
          },
        });

        return [
          ...expectBlocked("client_owner_input_rejected")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "owner_mismatch_denied",
      title: "Owner mismatch is denied",
      expectedBehavior:
        "A resource owner must match the canonical Levio principal before controls run.",
      run: async () => {
        const result = await createWorkflow().verifyOwnership({
          authContext: authenticatedContext,
          resourceOwnerPrincipalId: "other_principal",
        });

        return [
          ...expectBlocked("ownership_mismatch")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "artifact_source_required",
      title: "Artifact source is required",
      expectedBehavior:
        "Owner-scoped artifact access fails closed until a server-only source is injected.",
      run: async () => {
        const workflow = createUserDataControlsServerWorkflowFoundation({
          enabled: true,
          persistenceRuntime: initializePersistenceRuntimeWiring({
            providerAdapter: createResolvingAdapter(),
          }),
        });
        const result = await workflow.accessOwnerScopedArtifacts({
          authContext: authenticatedContext,
          purpose: "export",
          requestedAt,
          exportScope: exportScope(),
        });

        return [
          ...expectBlocked("artifact_source_unavailable")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "artifact_source_owner_mismatch_denied",
      title: "Artifact source owner mismatch is denied",
      expectedBehavior:
        "Injected artifact sources must return resources scoped to the canonical owner only.",
      run: async () => {
        const result = await createWorkflow({
          artifactSource: createArtifactSource({
            exportResources: [
              {
                ...exportRecord,
                ownerPrincipalId: "other_principal",
              },
            ],
          }),
        }).accessOwnerScopedArtifacts({
          authContext: authenticatedContext,
          purpose: "export",
          requestedAt,
          exportScope: exportScope(),
        });

        return [
          ...expectBlocked("artifact_source_owner_mismatch")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "export_plan_allowed_manifest_only",
      title: "Export workflow plans manifest-only package",
      expectedBehavior:
        "Export workflow can produce a preflight-only manifest plan without file or storage creation.",
      run: async () => {
        const result = await createWorkflow().planExport({
          authContext: authenticatedContext,
          requestId: "export_stage4_3s_request",
          requestedAt,
          scope: exportScope(),
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected export workflow to pass."),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.exportResult.packagePlan.packageFormat === "manifest_only",
            "Expected manifest-only export plan.",
          ),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.exportResult.packagePlan.fileCreated === false &&
              result.payload.exportResult.packagePlan.storageWrite === false,
            "Expected no export file or storage write.",
          ),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "export_forbidden_category_blocked",
      title: "Forbidden export categories are blocked",
      expectedBehavior:
        "Export workflow blocks artifacts that expose forbidden AI/provider/billing categories.",
      run: async () => {
        const result = await createWorkflow({
          artifactSource: createArtifactSource({
            exportResources: [
              {
                ...exportRecord,
                forbiddenDataCategories: ["raw_ai_response"],
              },
            ],
          }),
        }).planExport({
          authContext: authenticatedContext,
          requestId: "export_stage4_3s_forbidden",
          requestedAt,
          scope: exportScope(),
        });

        return [
          ...expectBlocked("export_contract_blocked")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "deletion_plan_allowed_lifecycle_only",
      title: "Deletion workflow plans lifecycle-only action",
      expectedBehavior:
        "Deletion workflow can produce a preflight-only lifecycle plan without hard delete.",
      run: async () => {
        const result = await createWorkflow().planDeletion({
          authContext: authenticatedContext,
          requestId: "deletion_stage4_3s_request",
          requestedAt,
          scope: deletionScope(),
          requestKind: "resource_deletion_planning",
          confirmationAcknowledged: true,
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected deletion workflow to pass."),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.deletionResult.deletionPlan.lifecycleOnly,
            "Expected lifecycle-only deletion plan.",
          ),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.deletionResult.deletionPlan.hardDeleteExecuted === false &&
              result.payload.deletionResult.deletionPlan.databaseWrite === false,
            "Expected no hard delete or database write.",
          ),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
    {
      id: "deletion_confirmation_required",
      title: "Deletion confirmation is required",
      expectedBehavior:
        "Deletion workflow blocks unconfirmed deletion planning requests.",
      run: async () => {
        const result = await createWorkflow().planDeletion({
          authContext: authenticatedContext,
          requestId: "deletion_stage4_3s_unconfirmed",
          requestedAt,
          scope: deletionScope(),
          requestKind: "resource_deletion_planning",
          confirmationAcknowledged: false,
        });

        return [
          ...expectBlocked("deletion_contract_blocked")(result),
          ...expectWorkflowEvidence(result.evidence),
        ];
      },
    },
  ];
}

export async function runUserDataControlsServerWorkflowValidation(): Promise<UserDataControlsServerWorkflowValidationResult> {
  const results: UserDataControlsServerWorkflowValidationCaseResult[] = [];

  for (const validationCase of cases()) {
    try {
      const issues = await validationCase.run();

      results.push({
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      });
    } catch {
      results.push({
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        passed: false,
        failed: true,
        issues: [
          "User data controls server workflow validation case threw an uncaught exception.",
        ],
      });
    }
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}
