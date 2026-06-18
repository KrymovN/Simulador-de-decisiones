import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import { buildMockSimulation, type SimulationResponse } from "../simulationEngine";
import type { LevioPrincipalRow, SimulationRecordRow } from "./contracts";
import { initializePersistenceRuntimeWiring } from "./runtime-wiring";
import {
  buildSimulationRecordInsertPayload,
  saveSimulationRecordFromSimulationResponse,
  simulationRecordPersistenceEvidence,
  type SimulationRecordPersistenceConfig,
} from "./simulation-record-persistence";
import type {
  SupabaseSimulationRecordInsertPayload,
  SupabaseSimulationRecordSaveProvider,
} from "./supabase-provider";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

export type SimulationRecordPersistenceValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SimulationRecordPersistenceValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SimulationRecordPersistenceValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const enabledConfig: SimulationRecordPersistenceConfig = { enabled: true };

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_2i_validation_session",
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

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function recordFromPayload(payload: SupabaseSimulationRecordInsertPayload): SimulationRecordRow {
  return {
    record_id: "5ce1e4a7-4494-45d9-a481-444444444444",
    owner_principal_id: payload.owner_principal_id,
    owner_principal_type: payload.owner_principal_type,
    record_status: payload.record_status,
    source_type: payload.source_type,
    title: payload.title,
    user_note: payload.user_note,
    user_input_snapshot: payload.user_input_snapshot,
    deterministic_output_snapshot: payload.deterministic_output_snapshot,
    metadata: payload.metadata,
    safety_flags: payload.safety_flags,
    clarification_snapshot: payload.clarification_snapshot,
    decision_model_snapshot: payload.decision_model_snapshot,
    confidence_summary: payload.confidence_summary,
    simulation_response_version: payload.simulation_response_version,
    decision_contract_version: payload.decision_contract_version,
    language: payload.language,
    safety_classification: payload.safety_classification,
    recommendation_state: payload.recommendation_state,
    content_sensitivity: payload.content_sensitivity,
    originating_draft_id: null,
    parent_record_id: null,
    revision_label: null,
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    archived_at: null,
    deleted_at: null,
    last_exported_at: null,
    deletion_state: payload.deletion_state,
    retention_rule: payload.retention_rule,
    export_eligible: payload.export_eligible,
    legal_hold_reason: null,
    schema_version: payload.schema_version,
  };
}

function createSaveProvider(calls: {
  resolve: number;
  save: number;
  payloads: SupabaseSimulationRecordInsertPayload[];
}): SupabaseSimulationRecordSaveProvider {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference() {
      calls.resolve += 1;
      return resolvedPrincipal;
    },
    async saveSimulationRecord(payload) {
      calls.save += 1;
      calls.payloads.push(payload);
      return recordFromPayload(payload);
    },
  };
}

function expectIsolationEvidence(): string[] {
  const evidence = simulationRecordPersistenceEvidence();

  return evidence.stage === "4.2I" &&
    evidence.simulationRecordsOnly &&
    evidence.explicitSaveOnly &&
    evidence.controlledRolloutRequired &&
    evidence.runtimeWiringUsed &&
    evidence.providerResolutionUsed &&
    evidence.historyRuntimeStarted === false &&
    evidence.draftsRuntimeStarted === false &&
    evidence.dashboardIntegrated === false &&
    evidence.uiChanged === false &&
    evidence.apiRouteChanged === false &&
    evidence.authRuntimeChanged === false &&
    evidence.simulatorRuntimeChanged === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.stage42JStarted === false &&
    evidence.stage42KStarted === false &&
    evidence.stage43Started === false &&
    evidence.stage44Started === false
    ? []
    : ["Stage 4.2I simulation record persistence evidence changed."];
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_by_default",
      title: "Simulation persistence is disabled by default",
      expectedBehavior: "Controlled rollout blocks saves until explicitly enabled.",
      run: async () => {
        const calls = { resolve: 0, save: 0, payloads: [] as SupabaseSimulationRecordInsertPayload[] };
        const provider = createSaveProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationRecordFromSimulationResponse({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una decisión estratégica"),
          runtime,
          saveProvider: provider,
          config: { enabled: false },
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "persistence_disabled",
            "Expected disabled rollout to block save.",
          ),
          ...issueUnless(calls.save === 0, "Disabled rollout must not call save provider."),
          ...expectIsolationEvidence(),
        ];
      },
    },
    {
      id: "signed_out_context_blocks",
      title: "Signed-out context blocks save",
      expectedBehavior: "Do not resolve or save without an authenticated context.",
      run: async () => {
        const calls = { resolve: 0, save: 0, payloads: [] as SupabaseSimulationRecordInsertPayload[] };
        const provider = createSaveProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationRecordFromSimulationResponse({
          authContext: signedOutContext,
          simulation: buildMockSimulation("Guardar una decisión estratégica"),
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "auth_context_not_authenticated",
            "Expected signed-out auth context to block save.",
          ),
          ...issueUnless(calls.resolve === 0 && calls.save === 0, "Signed-out save must not call provider."),
        ];
      },
    },
    {
      id: "runtime_not_ready_blocks",
      title: "Runtime-not-ready blocks save",
      expectedBehavior: "Fail closed when runtime wiring is unavailable.",
      run: async () => {
        const result = await saveSimulationRecordFromSimulationResponse({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una decisión estratégica"),
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "blocked" && result.reason === "runtime_not_ready",
          "Expected unavailable runtime wiring to block save.",
        );
      },
    },
    {
      id: "provider_without_save_blocks",
      title: "Provider without save support blocks",
      expectedBehavior: "Do not save unless provider exposes simulation_records save capability.",
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
        const result = await saveSimulationRecordFromSimulationResponse({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una decisión estratégica"),
          runtime,
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "blocked" && result.reason === "provider_save_not_supported",
          "Expected provider without saveSimulationRecord to block.",
        );
      },
    },
    {
      id: "payload_maps_simulation_response",
      title: "Payload maps simulation response",
      expectedBehavior: "Build a simulation_records insert payload without drafts or history.",
      run: () => {
        const simulation = buildMockSimulation("Guardar una decisión estratégica");
        const payload = buildSimulationRecordInsertPayload({
          simulation,
          ownerPrincipalId: principalId,
        });

        return [
          ...issueUnless(Boolean(payload), "Expected payload to be created."),
          ...issueUnless(
            payload?.owner_principal_id === principalId &&
              payload.owner_principal_type === "registered_user",
            "Expected owner fields to come from resolved principal.",
          ),
          ...issueUnless(
            payload?.source_type === "explicit_save" &&
              payload.simulation_response_version === "simulation_response_v1_mock",
            "Expected explicit save simulation response metadata.",
          ),
          ...issueUnless(
            payload?.metadata.source === "simulator" &&
              payload.clarification_snapshot === null,
            "Expected simulator metadata and no draft/history payload.",
          ),
        ];
      },
    },
    {
      id: "save_simulation_record_success",
      title: "Simulation record save succeeds",
      expectedBehavior: "Resolve principal through runtime and save exactly one simulation_records row.",
      run: async () => {
        const calls = { resolve: 0, save: 0, payloads: [] as SupabaseSimulationRecordInsertPayload[] };
        const provider = createSaveProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationRecordFromSimulationResponse({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una decisión estratégica"),
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "saved", "Expected simulation record to be saved."),
          ...issueUnless(calls.resolve === 1, "Expected one provider principal resolution."),
          ...issueUnless(calls.save === 1, "Expected one simulation_records save call."),
          ...issueUnless(
            result.status === "saved" && result.record.owner_principal_id === principalId,
            "Expected saved record to belong to resolved principal.",
          ),
        ];
      },
    },
    {
      id: "invalid_payload_blocks_save",
      title: "Invalid payload blocks save",
      expectedBehavior: "Do not call provider when simulation response cannot map to schema payload.",
      run: async () => {
        const calls = { resolve: 0, save: 0, payloads: [] as SupabaseSimulationRecordInsertPayload[] };
        const provider = createSaveProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const invalidSimulation = {
          ...buildMockSimulation("Guardar una decisión estratégica"),
          lang: "en",
        } as unknown as SimulationResponse;
        const result = await saveSimulationRecordFromSimulationResponse({
          authContext: authenticatedContext,
          simulation: invalidSimulation,
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "simulation_payload_invalid",
            "Expected invalid simulation payload to block.",
          ),
          ...issueUnless(calls.save === 0, "Invalid payload must not call save provider."),
        ];
      },
    },
  ];
}

export async function runSimulationRecordPersistenceValidation(): Promise<SimulationRecordPersistenceValidationResult> {
  const results: SimulationRecordPersistenceValidationCaseResult[] = [];

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
        issues: ["Simulation record persistence validation case threw an uncaught exception."],
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
