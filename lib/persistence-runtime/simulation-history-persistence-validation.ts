import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type {
  LevioPrincipalRow,
  SimulationHistoryEntryRow,
  SimulationRecordRow,
} from "./contracts";
import { initializePersistenceRuntimeWiring } from "./runtime-wiring";
import {
  buildSimulationHistoryEntryInsertPayload,
  saveSimulationHistoryEntry,
  simulationHistoryPersistenceEvidence,
  type SimulationHistoryPersistenceConfig,
} from "./simulation-history-persistence";
import type {
  SupabaseSimulationHistoryEntryInsertPayload,
  SupabaseSimulationHistoryEntrySaveProvider,
} from "./supabase-provider";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

export type SimulationHistoryPersistenceValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SimulationHistoryPersistenceValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SimulationHistoryPersistenceValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const recordId = "5ce1e4a7-4494-45d9-a481-444444444444";
const enabledConfig: SimulationHistoryPersistenceConfig = { enabled: true };

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_2j_validation_session",
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

const resolvedPrincipal: LevioPrincipalRow = {
  principal_id: principalId,
  principal_type: "registered_user",
  principal_status: "active",
  provider_name: "supabase",
  provider_reference: providerReference,
  provider_reference_status: "active",
  provider_subject_type: "user",
  provider_email_snapshot: null,
  provider_email_verified: false,
  created_at: "2026-06-18T00:00:00.000Z",
  updated_at: "2026-06-18T00:00:00.000Z",
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

const parentRecord: Pick<
  SimulationRecordRow,
  "record_id" | "owner_principal_id" | "owner_principal_type"
> = {
  record_id: recordId,
  owner_principal_id: principalId,
  owner_principal_type: "registered_user",
};

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function historyEntryFromPayload(
  payload: SupabaseSimulationHistoryEntryInsertPayload,
): SimulationHistoryEntryRow {
  return {
    history_entry_id: "79d609e0-302d-4b3d-b00a-555555555555",
    owner_principal_id: payload.owner_principal_id,
    owner_principal_type: payload.owner_principal_type,
    record_id: payload.record_id,
    event_type: payload.event_type,
    event_timestamp: payload.event_timestamp,
    event_source: payload.event_source,
    user_visible: payload.user_visible,
    event_summary: payload.event_summary,
    event_payload: payload.event_payload,
    before_reference: payload.before_reference,
    after_reference: payload.after_reference,
    revision_reference: payload.revision_reference,
    outcome_snapshot: payload.outcome_snapshot,
    claim_transaction_reference: payload.claim_transaction_reference,
    export_reference: payload.export_reference,
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    deletion_state: payload.deletion_state,
    retention_rule: payload.retention_rule,
    export_eligible: payload.export_eligible,
    deleted_at: null,
    legal_hold_reason: null,
    schema_version: payload.schema_version,
  };
}

function createHistoryProvider(calls: {
  resolve: number;
  save: number;
  payloads: SupabaseSimulationHistoryEntryInsertPayload[];
}): SupabaseSimulationHistoryEntrySaveProvider {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference() {
      calls.resolve += 1;
      return resolvedPrincipal;
    },
    async saveSimulationHistoryEntry(payload) {
      calls.save += 1;
      calls.payloads.push(payload);
      return historyEntryFromPayload(payload);
    },
  };
}

function expectIsolationEvidence(): string[] {
  const evidence = simulationHistoryPersistenceEvidence();

  return evidence.stage === "4.2J" &&
    evidence.simulationHistoryOnly &&
    evidence.appendOnly &&
    evidence.controlledRolloutRequired &&
    evidence.runtimeWiringUsed &&
    evidence.providerResolutionUsed &&
    evidence.simulationRecordWriteChanged === false &&
    evidence.draftsRuntimeStarted === false &&
    evidence.dashboardIntegrated === false &&
    evidence.uiChanged === false &&
    evidence.apiRouteChanged === false &&
    evidence.authRuntimeChanged === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.stage42KStarted === false &&
    evidence.stage43Started === false &&
    evidence.stage44Started === false
    ? []
    : ["Stage 4.2J simulation history persistence evidence changed."];
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_by_default",
      title: "History persistence is disabled by default",
      expectedBehavior: "Controlled rollout blocks history inserts until explicitly enabled.",
      run: async () => {
        const calls = { resolve: 0, save: 0, payloads: [] as SupabaseSimulationHistoryEntryInsertPayload[] };
        const provider = createHistoryProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationHistoryEntry({
          authContext: authenticatedContext,
          simulationRecord: parentRecord,
          eventType: "created",
          runtime,
          saveProvider: provider,
          config: { enabled: false },
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "persistence_disabled",
            "Expected disabled rollout to block history save.",
          ),
          ...issueUnless(calls.save === 0, "Disabled rollout must not call history provider."),
          ...expectIsolationEvidence(),
        ];
      },
    },
    {
      id: "signed_out_context_blocks",
      title: "Signed-out context blocks history save",
      expectedBehavior: "Do not resolve or save history without an authenticated context.",
      run: async () => {
        const calls = { resolve: 0, save: 0, payloads: [] as SupabaseSimulationHistoryEntryInsertPayload[] };
        const provider = createHistoryProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationHistoryEntry({
          authContext: signedOutContext,
          simulationRecord: parentRecord,
          eventType: "created",
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "auth_context_not_authenticated",
            "Expected signed-out auth context to block history save.",
          ),
          ...issueUnless(calls.resolve === 0 && calls.save === 0, "Signed-out save must not call provider."),
        ];
      },
    },
    {
      id: "runtime_not_ready_blocks",
      title: "Runtime-not-ready blocks history save",
      expectedBehavior: "Fail closed when runtime wiring is unavailable.",
      run: async () => {
        const result = await saveSimulationHistoryEntry({
          authContext: authenticatedContext,
          simulationRecord: parentRecord,
          eventType: "created",
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "blocked" && result.reason === "runtime_not_ready",
          "Expected unavailable runtime wiring to block history save.",
        );
      },
    },
    {
      id: "provider_without_history_save_blocks",
      title: "Provider without history save support blocks",
      expectedBehavior: "Do not save unless provider exposes simulation_history_entries save capability.",
      run: async () => {
        const runtime = initializePersistenceRuntimeWiring({
          providerAdapter: {
            providerId: "supabase",
            executionBoundary: "server_only",
            async resolvePrincipalByProviderReference() {
              return resolvedPrincipal;
            },
          },
        });
        const result = await saveSimulationHistoryEntry({
          authContext: authenticatedContext,
          simulationRecord: parentRecord,
          eventType: "created",
          runtime,
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "blocked" && result.reason === "provider_history_save_not_supported",
          "Expected provider without saveSimulationHistoryEntry to block.",
        );
      },
    },
    {
      id: "owner_mismatch_blocks_payload",
      title: "Owner mismatch blocks payload",
      expectedBehavior: "Do not create history payload when parent record owner differs from principal.",
      run: () => {
        const payload = buildSimulationHistoryEntryInsertPayload({
          simulationRecord: parentRecord,
          ownerPrincipalId: "aafaa42d-f7f0-4e8d-9ed9-333333333333",
          eventType: "created",
        });

        return issueUnless(payload === null, "Expected owner mismatch to block payload mapping.");
      },
    },
    {
      id: "payload_maps_history_entry",
      title: "Payload maps history entry",
      expectedBehavior: "Build a simulation_history_entries insert payload without drafts.",
      run: () => {
        const payload = buildSimulationHistoryEntryInsertPayload({
          simulationRecord: parentRecord,
          ownerPrincipalId: principalId,
          eventType: "created",
          eventSummary: "Simulation saved.",
          eventPayload: { source: "validation" },
          eventTimestamp: "2026-06-18T00:00:00.000Z",
        });

        return [
          ...issueUnless(Boolean(payload), "Expected history payload to be created."),
          ...issueUnless(
            payload?.record_id === recordId && payload.owner_principal_id === principalId,
            "Expected payload to reference parent simulation record and owner.",
          ),
          ...issueUnless(
            payload?.event_type === "created" &&
              payload.event_source === "server" &&
              payload.event_payload.source === "validation",
            "Expected server-created user-visible history payload.",
          ),
          ...issueUnless(
            payload?.retention_rule === "parent_simulation_lifecycle",
            "Expected parent simulation lifecycle retention.",
          ),
        ];
      },
    },
    {
      id: "history_entry_save_success",
      title: "History entry save succeeds",
      expectedBehavior: "Resolve principal through runtime and insert exactly one history entry.",
      run: async () => {
        const calls = { resolve: 0, save: 0, payloads: [] as SupabaseSimulationHistoryEntryInsertPayload[] };
        const provider = createHistoryProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationHistoryEntry({
          authContext: authenticatedContext,
          simulationRecord: parentRecord,
          eventType: "created",
          eventSummary: "Simulation saved.",
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "saved", "Expected history entry to be saved."),
          ...issueUnless(calls.resolve === 1, "Expected one provider principal resolution."),
          ...issueUnless(calls.save === 1, "Expected one simulation_history_entries save call."),
          ...issueUnless(
            result.status === "saved" && result.historyEntry.record_id === recordId,
            "Expected saved history entry to reference parent record.",
          ),
        ];
      },
    },
  ];
}

export async function runSimulationHistoryPersistenceValidation(): Promise<SimulationHistoryPersistenceValidationResult> {
  const results: SimulationHistoryPersistenceValidationCaseResult[] = [];

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
        issues: ["Simulation history persistence validation case threw an uncaught exception."],
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
