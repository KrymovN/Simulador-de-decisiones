import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type {
  LevioPrincipalRow,
  PersistenceProviderAdapter,
  SimulationDraftRow,
  SimulationHistoryEntryRow,
  SimulationRecordRow,
} from "../persistence-runtime";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import {
  createUserDataControlsServerWorkflowFoundation,
  type UserDataControlsCanonicalPrincipal,
} from "./server-workflow";
import {
  createUserDataControlsPersistenceReadAdapter,
  type UserDataControlsPersistenceReadAdapterSafetyEvidence,
  type UserDataControlsPersistenceReadProvider,
} from "./persistence-read-adapter";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]>;
};

export type UserDataControlsPersistenceReadAdapterValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type UserDataControlsPersistenceReadAdapterValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: UserDataControlsPersistenceReadAdapterValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-666666666666";
const principalId = "3d25a625-7ad3-4995-9d13-777777777777";
const otherPrincipalId = "3d25a625-7ad3-4995-9d13-888888888888";
const requestedAt = "2026-06-20T16:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_3t_validation_session",
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

const canonicalPrincipal: UserDataControlsCanonicalPrincipal = {
  principalId,
  principalType: "registered_user",
  providerReference,
  row: principalRow,
  authContext: {
    ...authenticatedContext,
    principal: {
      ...authenticatedContext.principal,
      principalId,
    },
  },
};

const simulationRecord: SimulationRecordRow = {
  record_id: "record_stage4_3t",
  owner_principal_id: principalId,
  owner_principal_type: "registered_user",
  record_status: "active",
  source_type: "explicit_save",
  title: "Decision artifact",
  user_note: null,
  user_input_snapshot: { decision: "expand" },
  deterministic_output_snapshot: { scenarios: [] },
  metadata: {},
  safety_flags: {},
  clarification_snapshot: null,
  decision_model_snapshot: null,
  confidence_summary: null,
  simulation_response_version: "stage4_3t_validation",
  decision_contract_version: "stage4_3t_validation",
  language: "en",
  safety_classification: "standard",
  recommendation_state: "simulation_only",
  content_sensitivity: "standard",
  originating_draft_id: null,
  parent_record_id: null,
  revision_label: null,
  created_at: "2026-06-20T10:10:00.000Z",
  updated_at: "2026-06-20T10:20:00.000Z",
  archived_at: null,
  deleted_at: null,
  last_exported_at: null,
  deletion_state: "active",
  retention_rule: "saved_simulation_lifecycle",
  export_eligible: true,
  legal_hold_reason: null,
  schema_version: 1,
};

const simulationDraft: SimulationDraftRow = {
  draft_id: "draft_stage4_3t",
  owner_principal_id: principalId,
  owner_principal_type: "registered_user",
  draft_status: "active",
  draft_payload: { text: "Draft decision artifact" },
  draft_text_snapshot: "Draft decision artifact",
  clarification_answers_snapshot: null,
  structured_context_snapshot: null,
  language: "en",
  autosave_enabled: false,
  originating_surface: "validation",
  converted_record_id: null,
  created_at: "2026-06-20T10:30:00.000Z",
  updated_at: "2026-06-20T10:40:00.000Z",
  last_autosaved_at: null,
  expires_at: "2026-06-21T10:30:00.000Z",
  discarded_at: null,
  deleted_at: null,
  deletion_state: "active",
  retention_rule: "draft_short_lifecycle",
  export_eligible: true,
  legal_hold_reason: null,
  schema_version: 1,
};

const simulationHistory: SimulationHistoryEntryRow = {
  history_entry_id: "history_stage4_3t",
  owner_principal_id: principalId,
  owner_principal_type: "registered_user",
  record_id: simulationRecord.record_id,
  event_type: "created",
  event_timestamp: "2026-06-20T10:50:00.000Z",
  event_source: "owner_action",
  user_visible: true,
  event_summary: "Saved decision artifact",
  event_payload: {},
  before_reference: null,
  after_reference: simulationRecord.record_id,
  revision_reference: null,
  outcome_snapshot: null,
  claim_transaction_reference: null,
  export_reference: null,
  created_at: "2026-06-20T10:50:00.000Z",
  updated_at: "2026-06-20T10:50:00.000Z",
  deletion_state: "active",
  retention_rule: "parent_simulation_lifecycle",
  export_eligible: true,
  deleted_at: null,
  legal_hold_reason: null,
  schema_version: 1,
};

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function expectAdapterEvidence(
  evidence: UserDataControlsPersistenceReadAdapterSafetyEvidence,
): string[] {
  return evidence.stage === "4.3T" &&
    evidence.persistenceReadAdapterOnly &&
    evidence.foundationOnly &&
    evidence.serverOnlyBoundaryRequired &&
    evidence.canonicalPrincipalRequired &&
    evidence.ownerScopedReadsOnly &&
    evidence.clientOwnerInputAccepted === false &&
    evidence.mapsDecisionSimulationArtifactsOnly &&
    evidence.conversationHistoryCreated === false &&
    evidence.chatLogsCreated === false &&
    evidence.runtimeWritesEnabled === false &&
    evidence.databaseWritesExecuted === false &&
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
    : ["Stage 4.3T persistence read adapter safety evidence changed."];
}

function createReadProvider(input?: {
  records?: SimulationRecordRow[];
  drafts?: SimulationDraftRow[];
  history?: SimulationHistoryEntryRow[];
  block?: boolean;
}): UserDataControlsPersistenceReadProvider {
  return {
    executionBoundary: "server_only",
    async listSimulationRecords() {
      if (input?.block) {
        return {
          status: "blocked",
          reason: "provider_read_failed",
          message: "Validation provider blocked record read.",
        };
      }

      return {
        status: "ready",
        rows: input?.records ?? [simulationRecord],
      };
    },
    async listSimulationDrafts() {
      if (input?.block) {
        return {
          status: "blocked",
          reason: "provider_read_failed",
          message: "Validation provider blocked draft read.",
        };
      }

      return {
        status: "ready",
        rows: input?.drafts ?? [simulationDraft],
      };
    },
    async listSimulationHistoryEntries() {
      if (input?.block) {
        return {
          status: "blocked",
          reason: "provider_read_failed",
          message: "Validation provider blocked history read.",
        };
      }

      return {
        status: "ready",
        rows: input?.history ?? [simulationHistory],
      };
    },
  };
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

function exportScope() {
  return {
    includePrincipalMetadata: true,
    includeSavedSimulations: true,
    includeSimulationDrafts: true,
    includeSimulationHistory: true,
  };
}

function deletionScope() {
  return {
    includePrincipalRecord: false,
    includeSavedSimulations: true,
    includeSimulationDrafts: true,
    includeSimulationHistory: true,
  };
}

function createWorkflow(readProvider = createReadProvider()) {
  return createUserDataControlsServerWorkflowFoundation({
    enabled: true,
    persistenceRuntime: initializePersistenceRuntimeWiring({
      providerAdapter: createResolvingAdapter(),
    }),
    artifactSource: createUserDataControlsPersistenceReadAdapter({
      enabled: true,
      readProvider,
    }),
  });
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_adapter_blocks_export",
      title: "Disabled persistence read adapter blocks export reads",
      expectedBehavior: "Adapter fails closed before any artifact read can occur.",
      run: async () => {
        const adapter = createUserDataControlsPersistenceReadAdapter({
          enabled: false,
          readProvider: createReadProvider(),
        });
        const result = await adapter.listExportResources({
          principal: canonicalPrincipal,
          scope: exportScope(),
          requestedAt,
        });

        return [
          ...issueUnless(result.status === "blocked", "Expected disabled adapter to block."),
          ...expectAdapterEvidence(adapter.evidence),
        ];
      },
    },
    {
      id: "read_provider_required",
      title: "Read provider is required",
      expectedBehavior:
        "Adapter fails closed when no server-only persistence read provider is injected.",
      run: async () => {
        const adapter = createUserDataControlsPersistenceReadAdapter({
          enabled: true,
        });
        const result = await adapter.listExportResources({
          principal: canonicalPrincipal,
          scope: exportScope(),
          requestedAt,
        });

        return [
          ...issueUnless(result.status === "blocked", "Expected missing provider to block."),
          ...expectAdapterEvidence(adapter.evidence),
        ];
      },
    },
    {
      id: "signed_out_workflow_denied_before_reads",
      title: "Signed-out workflow is denied before reads",
      expectedBehavior:
        "Server workflow blocks unauthenticated contexts before the read adapter can expose artifacts.",
      run: async () => {
        const result = await createWorkflow().planExport({
          authContext: signedOutContext,
          requestId: "export_stage4_3t_signed_out",
          requestedAt,
          scope: exportScope(),
        });

        return [
          ...issueUnless(result.status === "blocked", "Expected signed-out workflow to block."),
          ...issueUnless(
            result.status === "blocked" &&
              result.reason === "auth_context_not_authenticated",
            "Expected auth_context_not_authenticated before reads.",
          ),
        ];
      },
    },
    {
      id: "export_reads_decision_artifacts_only",
      title: "Export reads decision simulation artifacts only",
      expectedBehavior:
        "Adapter maps principal metadata, saved simulations, drafts, and history to allowed export categories.",
      run: async () => {
        const adapter = createUserDataControlsPersistenceReadAdapter({
          enabled: true,
          readProvider: createReadProvider(),
        });
        const result = await adapter.listExportResources({
          principal: canonicalPrincipal,
          scope: exportScope(),
          requestedAt,
        });
        const forbiddenCategories =
          result.status === "ready"
            ? result.resources.flatMap((resource) => resource.forbiddenDataCategories ?? [])
            : ["blocked"];

        return [
          ...issueUnless(result.status === "ready", "Expected export resources to be ready."),
          ...issueUnless(
            result.status === "ready" && result.resources.length === 4,
            "Expected principal, record, draft, and history export snapshots.",
          ),
          ...issueUnless(
            forbiddenCategories.length === 0,
            "Expected no forbidden export categories from read adapter.",
          ),
          ...expectAdapterEvidence(adapter.evidence),
        ];
      },
    },
    {
      id: "cross_owner_record_denied",
      title: "Cross-owner record output is denied",
      expectedBehavior:
        "Adapter blocks provider rows that are not scoped to the canonical principal.",
      run: async () => {
        const adapter = createUserDataControlsPersistenceReadAdapter({
          enabled: true,
          readProvider: createReadProvider({
            records: [
              {
                ...simulationRecord,
                owner_principal_id: otherPrincipalId,
              },
            ],
          }),
        });
        const result = await adapter.listExportResources({
          principal: canonicalPrincipal,
          scope: {
            ...exportScope(),
            includePrincipalMetadata: false,
            includeSimulationDrafts: false,
            includeSimulationHistory: false,
          },
          requestedAt,
        });

        return [
          ...issueUnless(result.status === "blocked", "Expected cross-owner read to block."),
          ...issueUnless(
            result.status === "blocked" && result.reason === "source_not_owner_scoped",
            "Expected source_not_owner_scoped.",
          ),
          ...expectAdapterEvidence(adapter.evidence),
        ];
      },
    },
    {
      id: "provider_block_propagates",
      title: "Provider read block propagates",
      expectedBehavior: "Adapter returns blocked when the provider cannot read rows safely.",
      run: async () => {
        const adapter = createUserDataControlsPersistenceReadAdapter({
          enabled: true,
          readProvider: createReadProvider({ block: true }),
        });
        const result = await adapter.listExportResources({
          principal: canonicalPrincipal,
          scope: {
            ...exportScope(),
            includePrincipalMetadata: false,
            includeSimulationDrafts: false,
            includeSimulationHistory: false,
          },
          requestedAt,
        });

        return [
          ...issueUnless(result.status === "blocked", "Expected provider block to propagate."),
          ...issueUnless(
            result.status === "blocked" && result.reason === "source_read_failed",
            "Expected source_read_failed.",
          ),
          ...expectAdapterEvidence(adapter.evidence),
        ];
      },
    },
    {
      id: "deletion_reads_lifecycle_artifacts",
      title: "Deletion reads lifecycle artifacts",
      expectedBehavior:
        "Adapter maps records, drafts, history, and parent contexts without executing deletion.",
      run: async () => {
        const adapter = createUserDataControlsPersistenceReadAdapter({
          enabled: true,
          readProvider: createReadProvider(),
        });
        const result = await adapter.listDeletionResources({
          principal: canonicalPrincipal,
          scope: deletionScope(),
          requestedAt,
        });

        return [
          ...issueUnless(result.status === "ready", "Expected deletion resources to be ready."),
          ...issueUnless(
            result.status === "ready" && result.resources.length === 3,
            "Expected record, draft, and history deletion snapshots.",
          ),
          ...issueUnless(
            result.status === "ready" && (result.parentRecords?.length ?? 0) === 1,
            "Expected parent simulation context for history deletion planning.",
          ),
          ...issueUnless(
            result.status === "ready" &&
              result.resources.every((resource) => resource.ownerPrincipalId === principalId),
            "Expected deletion snapshots to remain owner-scoped.",
          ),
          ...expectAdapterEvidence(adapter.evidence),
        ];
      },
    },
    {
      id: "history_parent_context_required",
      title: "History deletion requires parent context",
      expectedBehavior:
        "Adapter blocks history deletion snapshots when parent simulation context cannot be read.",
      run: async () => {
        const adapter = createUserDataControlsPersistenceReadAdapter({
          enabled: true,
          readProvider: createReadProvider({
            records: [],
            history: [simulationHistory],
          }),
        });
        const result = await adapter.listDeletionResources({
          principal: canonicalPrincipal,
          scope: {
            includePrincipalRecord: false,
            includeSavedSimulations: false,
            includeSimulationDrafts: false,
            includeSimulationHistory: true,
          },
          requestedAt,
        });

        return [
          ...issueUnless(result.status === "blocked", "Expected missing parent context to block."),
          ...issueUnless(
            result.status === "blocked" && result.reason === "source_not_owner_scoped",
            "Expected source_not_owner_scoped for missing parent context.",
          ),
          ...expectAdapterEvidence(adapter.evidence),
        ];
      },
    },
    {
      id: "workflow_export_plan_uses_adapter",
      title: "Server workflow export plan uses persistence read adapter",
      expectedBehavior:
        "Stage 4.3S workflow can use the 4.3T adapter to create manifest-only export plans.",
      run: async () => {
        const result = await createWorkflow().planExport({
          authContext: authenticatedContext,
          requestId: "export_stage4_3t_workflow",
          requestedAt,
          scope: exportScope(),
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected workflow export plan to pass."),
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
        ];
      },
    },
    {
      id: "workflow_deletion_plan_uses_adapter",
      title: "Server workflow deletion plan uses persistence read adapter",
      expectedBehavior:
        "Stage 4.3S workflow can use the 4.3T adapter to create lifecycle-only deletion plans.",
      run: async () => {
        const result = await createWorkflow().planDeletion({
          authContext: authenticatedContext,
          requestId: "deletion_stage4_3t_workflow",
          requestedAt,
          scope: deletionScope(),
          requestKind: "resource_deletion_planning",
          confirmationAcknowledged: true,
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected workflow deletion plan to pass."),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.deletionResult.deletionPlan.lifecycleOnly,
            "Expected lifecycle-only deletion plan.",
          ),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.deletionResult.deletionPlan.databaseWrite === false &&
              result.payload.deletionResult.deletionPlan.hardDeleteExecuted === false,
            "Expected no deletion writes or hard delete.",
          ),
        ];
      },
    },
  ];
}

export async function runUserDataControlsPersistenceReadAdapterValidation(): Promise<UserDataControlsPersistenceReadAdapterValidationResult> {
  const results: UserDataControlsPersistenceReadAdapterValidationCaseResult[] = [];

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
          "User data controls persistence read adapter validation case threw an uncaught exception.",
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
