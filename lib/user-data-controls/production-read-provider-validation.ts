import type { LevioSessionContext } from "../auth/types";
import type {
  LevioPrincipalRow,
  PersistenceProviderAdapter,
  SimulationHistoryEntryRow,
  SimulationRecordRow,
} from "../persistence-runtime";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import { createUserDataControlsPersistenceReadAdapter } from "./persistence-read-adapter";
import {
  createUserDataControlsProductionReadProvider,
  type UserDataControlsProductionReadClient,
  type UserDataControlsProductionReadProviderEvidence,
  type UserDataControlsProductionReadQuery,
  type UserDataControlsProductionReadQueryResponse,
} from "./production-read-provider";
import { createUserDataControlsServerWorkflowFoundation } from "./server-workflow";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]>;
};

export type UserDataControlsProductionReadProviderValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type UserDataControlsProductionReadProviderValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: UserDataControlsProductionReadProviderValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

type TableName =
  | "simulation_records"
  | "simulation_drafts"
  | "simulation_history_entries";

type QueryCall = {
  table: TableName;
  columns: string;
  filters: { column: string; value: string | boolean }[];
  order?: { column: string; ascending: boolean };
  limit?: number;
};

type MockClientInput = {
  records?: unknown[];
  drafts?: unknown[];
  history?: unknown[];
  error?: { message: string };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-aaaaaaaaaaaa";
const principalId = "3d25a625-7ad3-4995-9d13-aaaaaaaaaaaa";
const requestedAt = "2026-06-20T20:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_3x_validation_session",
  sessionStatus: "active",
  assuranceLevel: "authenticated",
  riskFlags: [],
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

const simulationRecord = {
  record_id: "record_stage4_3x",
  owner_principal_id: principalId,
  owner_principal_type: "registered_user",
  record_status: "active",
  source_type: "explicit_save",
  simulation_response_version: "stage4_3x_validation",
  decision_contract_version: "stage4_3x_validation",
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

const simulationDraft = {
  draft_id: "draft_stage4_3x",
  owner_principal_id: principalId,
  owner_principal_type: "registered_user",
  draft_status: "active",
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

const simulationHistory = {
  history_entry_id: "history_stage4_3x",
  owner_principal_id: principalId,
  owner_principal_type: "registered_user",
  record_id: simulationRecord.record_id,
  event_type: "created",
  event_timestamp: "2026-06-20T10:50:00.000Z",
  event_source: "owner_action",
  user_visible: true,
  event_summary: "Saved decision artifact",
  before_reference: null,
  after_reference: simulationRecord.record_id,
  revision_reference: null,
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

const forbiddenSelectedColumns = [
  "user_input_snapshot",
  "deterministic_output_snapshot",
  "draft_payload",
  "draft_text_snapshot",
  "clarification_answers_snapshot",
  "structured_context_snapshot",
  "event_payload",
  "outcome_snapshot",
  "ai_prompt",
  "raw_ai_response",
  "embedding",
  "vector",
  "memory",
  "chat",
  "conversation",
];

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function expectEvidence(evidence: UserDataControlsProductionReadProviderEvidence): string[] {
  return evidence.stage === "4.3X" &&
    evidence.productionReadProviderFoundationOnly &&
    evidence.serverOnlyBoundaryRequired &&
    evidence.serviceRoleRequired &&
    evidence.ownerScopedReadsOnly &&
    evidence.canonicalPrincipalRequired &&
    evidence.clientOwnerInputAccepted === false &&
    evidence.minimalPlanningColumnsOnly &&
    evidence.mapsDecisionSimulationArtifactsOnly &&
    evidence.rawSimulationPayloadRead === false &&
    evidence.conversationHistoryRead === false &&
    evidence.chatLogsRead === false &&
    evidence.runtimeWritesEnabled === false &&
    evidence.databaseWritesExecuted === false &&
    evidence.exportFilesCreated === false &&
    evidence.exportStorageConnected === false &&
    evidence.deletionExecuted === false &&
    evidence.hardDeleteExecuted === false &&
    evidence.routeEnablementChanged === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.openAiIntegrated === false &&
    evidence.billingIntegrated === false &&
    evidence.subscriptionsIntegrated === false &&
    evidence.memoryRuntimeIntegrated === false &&
    evidence.productBehaviorChanged === false
    ? []
    : ["Stage 4.3X production read provider safety evidence changed."];
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

function dataForTable(input: MockClientInput, table: TableName): unknown[] {
  if (table === "simulation_records") {
    return input.records ?? [simulationRecord];
  }

  if (table === "simulation_drafts") {
    return input.drafts ?? [simulationDraft];
  }

  return input.history ?? [simulationHistory];
}

function createMockClient(input: MockClientInput = {}): {
  client: UserDataControlsProductionReadClient;
  calls: QueryCall[];
} {
  const calls: QueryCall[] = [];

  function query(call: QueryCall): UserDataControlsProductionReadQuery {
    return {
      eq(column, value) {
        call.filters.push({ column, value });
        return query(call);
      },
      order(column, options) {
        call.order = { column, ascending: options.ascending };
        return query(call);
      },
      async limit(count): Promise<UserDataControlsProductionReadQueryResponse> {
        call.limit = count;

        if (input.error) {
          return {
            data: null,
            error: input.error,
          };
        }

        return {
          data: dataForTable(input, call.table),
          error: null,
        };
      },
    };
  }

  return {
    calls,
    client: {
      from(table) {
        return {
          select(columns) {
            const call: QueryCall = {
              table,
              columns,
              filters: [],
            };
            calls.push(call);
            return query(call);
          },
        };
      },
    },
  };
}

function createProvider(input?: {
  enabled?: boolean;
  client?: UserDataControlsProductionReadClient;
}) {
  return createUserDataControlsProductionReadProvider({
    enabled: input?.enabled ?? true,
    supabaseUrl: "https://stage-43x-validation.supabase.co",
    serviceRoleKey: "stage_43x_service_role",
    client: input?.client ?? createMockClient().client,
  });
}

function createWorkflow(input?: { client?: UserDataControlsProductionReadClient }) {
  const provider = createProvider({ client: input?.client });
  const artifactSource = createUserDataControlsPersistenceReadAdapter({
    enabled: true,
    readProvider: provider,
  });

  return createUserDataControlsServerWorkflowFoundation({
    enabled: true,
    persistenceRuntime: initializePersistenceRuntimeWiring({
      providerAdapter: createResolvingAdapter(),
    }),
    artifactSource,
  });
}

function selectedColumnsAreSanitized(calls: QueryCall[]): boolean {
  return calls.every((call) =>
    forbiddenSelectedColumns.every((column) => !call.columns.includes(column)),
  );
}

function ownerFiltersPresent(call: QueryCall | undefined): boolean {
  if (!call) {
    return false;
  }

  return (
    call.filters.some(
      (filter) => filter.column === "owner_principal_id" && filter.value === principalId,
    ) &&
    call.filters.some(
      (filter) =>
        filter.column === "owner_principal_type" && filter.value === "registered_user",
    )
  );
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_feature_flag_blocks_reads",
      title: "Disabled feature flag blocks reads",
      expectedBehavior: "Read provider fails closed when its rollout flag is disabled.",
      async run() {
        const provider = createProvider({ enabled: false });
        const result = await provider.listSimulationRecords({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "provider_scope_not_supported",
            "Expected disabled provider to block reads.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "missing_principal_blocks_reads",
      title: "Missing principal blocks reads",
      expectedBehavior: "Provider requires a canonical owner principal id.",
      async run() {
        const provider = createProvider();
        const result = await provider.listSimulationRecords({
          ownerPrincipalId: "",
          purpose: "export",
          requestedAt,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "provider_scope_not_supported",
            "Expected missing principal id to block reads.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "successful_owner_scoped_read",
      title: "Successful owner-scoped read",
      expectedBehavior: "Provider reads rows only through canonical owner filters.",
      async run() {
        const mock = createMockClient();
        const provider = createProvider({ client: mock.client });
        const result = await provider.listSimulationRecords({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });
        const record = result.status === "ready" ? result.rows[0] : undefined;

        return [
          ...issueUnless(result.status === "ready", "Expected owner-scoped read to be ready."),
          ...issueUnless(result.status === "ready" && result.rows.length === 1, "Expected one record."),
          ...issueUnless(ownerFiltersPresent(mock.calls[0]), "Expected owner filters on read query."),
          ...issueUnless(
            record?.owner_principal_id === principalId &&
              record.user_input_snapshot &&
              Object.keys(record.user_input_snapshot).length === 0 &&
              record.deterministic_output_snapshot &&
              Object.keys(record.deterministic_output_snapshot).length === 0,
            "Expected sanitized simulation record row.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "wrong_owner_fails_closed",
      title: "Wrong owner fails closed",
      expectedBehavior: "Rows outside the resolved owner scope are rejected even if returned by provider.",
      async run() {
        const mock = createMockClient({
          records: [
            {
              ...simulationRecord,
              owner_principal_id: "another_principal",
            },
          ],
        });
        const provider = createProvider({ client: mock.client });
        const result = await provider.listSimulationRecords({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "provider_owner_scope_failed",
            "Expected cross-owner row to fail closed.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "empty_artifacts_are_ready",
      title: "Empty artifacts are ready",
      expectedBehavior: "An owner with no artifacts returns an empty ready result, not a fallback read.",
      async run() {
        const mock = createMockClient({ records: [] });
        const provider = createProvider({ client: mock.client });
        const result = await provider.listSimulationRecords({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });

        return [
          ...issueUnless(
            result.status === "ready" && result.rows.length === 0,
            "Expected empty owner-scoped artifacts to return ready empty rows.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "malformed_rows_fail_closed",
      title: "Malformed rows fail closed",
      expectedBehavior: "Malformed persistence rows are blocked before planning.",
      async run() {
        const mock = createMockClient({
          records: [
            {
              ...simulationRecord,
              record_status: null,
            },
          ],
        });
        const provider = createProvider({ client: mock.client });
        const result = await provider.listSimulationRecords({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "provider_read_failed",
            "Expected malformed row to fail closed.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "selected_columns_are_sanitized",
      title: "Selected columns are sanitized",
      expectedBehavior: "Provider does not select raw prompt, response, draft, event, chat, or memory payload columns.",
      async run() {
        const mock = createMockClient();
        const provider = createProvider({ client: mock.client });
        const recordResult = await provider.listSimulationRecords({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });
        const draftResult = await provider.listSimulationDrafts({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });
        const historyResult = await provider.listSimulationHistoryEntries({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });

        return [
          ...issueUnless(recordResult.status === "ready", "Expected records read to be ready."),
          ...issueUnless(draftResult.status === "ready", "Expected drafts read to be ready."),
          ...issueUnless(historyResult.status === "ready", "Expected history read to be ready."),
          ...issueUnless(selectedColumnsAreSanitized(mock.calls), "Expected sanitized select columns."),
          ...issueUnless(
            mock.calls.some((call) =>
              call.filters.some(
                (filter) => filter.column === "user_visible" && filter.value === true,
              ),
            ),
            "Expected history reads to require user_visible=true.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "provider_error_fails_closed",
      title: "Provider error fails closed",
      expectedBehavior: "Database/provider errors return sanitized blocked results.",
      async run() {
        const mock = createMockClient({
          error: {
            message: "database unavailable",
          },
        });
        const provider = createProvider({ client: mock.client });
        const result = await provider.listSimulationRecords({
          ownerPrincipalId: principalId,
          purpose: "export",
          requestedAt,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "provider_read_failed",
            "Expected provider error to fail closed.",
          ),
          ...expectEvidence(provider.evidence),
        ];
      },
    },
    {
      id: "export_planning_read_path",
      title: "Export planning read path",
      expectedBehavior: "Production read provider feeds Stage 4.3S export planning without generating files.",
      async run() {
        const workflow = createWorkflow();
        const result = await workflow.planExport({
          authContext: authenticatedContext,
          requestId: "udc_stage4_3x_export",
          requestedAt,
          scope: {
            includePrincipalMetadata: false,
            includeSavedSimulations: true,
            includeSimulationDrafts: false,
            includeSimulationHistory: false,
          },
          packageFormat: "manifest_only",
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected export planning to be allowed."),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.exportResult.packagePlan.packageFormat === "manifest_only" &&
              result.payload.exportResult.packagePlan.fileCreated === false &&
              result.payload.exportResult.packagePlan.storageWrite === false,
            "Expected manifest-only export planning with no file or storage write.",
          ),
        ];
      },
    },
    {
      id: "deletion_planning_read_path",
      title: "Deletion planning read path",
      expectedBehavior: "Production read provider feeds lifecycle-only deletion planning without writes.",
      async run() {
        const workflow = createWorkflow();
        const result = await workflow.planDeletion({
          authContext: authenticatedContext,
          requestId: "udc_stage4_3x_deletion",
          requestedAt,
          scope: {
            includePrincipalRecord: false,
            includeSavedSimulations: true,
            includeSimulationDrafts: false,
            includeSimulationHistory: false,
          },
          requestKind: "resource_deletion_planning",
          confirmationAcknowledged: true,
        });

        return [
          ...issueUnless(result.status === "allowed", "Expected deletion planning to be allowed."),
          ...issueUnless(
            result.status === "allowed" &&
              result.payload.deletionResult.deletionPlan.lifecycleOnly &&
              result.payload.deletionResult.deletionPlan.databaseWrite === false &&
              result.payload.deletionResult.deletionPlan.hardDeleteExecuted === false,
            "Expected lifecycle-only deletion planning with no writes.",
          ),
        ];
      },
    },
  ];
}

export async function runUserDataControlsProductionReadProviderValidation(): Promise<UserDataControlsProductionReadProviderValidationResult> {
  const results: UserDataControlsProductionReadProviderValidationCaseResult[] = [];

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
