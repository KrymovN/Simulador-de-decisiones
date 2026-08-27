import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  type LevioPrincipalRow,
  type SimulationDraftRow,
  type SimulationHistoryEntryRow,
  type SimulationRecordRow,
} from "../persistence-runtime";
import { readAccountDataExportSurface } from "./account-data-export-surface";

type ValidationCase = { caseId: string; run: () => Promise<string[]> };

const generatedAt = "2026-08-27T08:00:00.000Z";
const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const ownerPrincipalId = "3d25a625-7ad3-4995-9d13-222222222222";
const otherPrincipalId = "4d25a625-7ad3-4995-9d13-333333333333";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "account-export-validation-session",
  sessionStatus: "active",
  assuranceLevel: "authenticated",
  riskFlags: [],
};

const signedOutContext: LevioAuthRuntimeContext = {
  identityState: "signed_out",
  error: { code: "session_missing", message: "No validation session." },
};

const resolvedPrincipal: LevioPrincipalRow = {
  principal_id: ownerPrincipalId,
  principal_type: "registered_user",
  principal_status: "active",
  provider_name: "supabase",
  provider_reference: providerReference,
  provider_reference_status: "active",
  provider_subject_type: "user",
  provider_email_snapshot: null,
  provider_email_verified: false,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  verified_at: null,
  disabled_at: null,
  deleted_at: null,
  deletion_requested_at: null,
  last_authenticated_at: null,
  last_provider_sync_at: null,
  deletion_state: "active",
  retention_rule: "account_lifecycle",
  recovery_state: null,
  locale_preference: "es",
  metadata_version: 1,
  legal_hold_reason: null,
  schema_version: 1,
};

function simulationRecord(
  index: number,
  overrides: Partial<SimulationRecordRow> = {},
): SimulationRecordRow {
  const id = `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
  return {
    record_id: id,
    owner_principal_id: ownerPrincipalId,
    owner_principal_type: "registered_user",
    record_status: "active",
    source_type: "explicit_save",
    title: `Decisión guardada ${index}`,
    user_note: `Nota completa ${index}`,
    user_input_snapshot: {
      input: `Entrada completa ${index}`,
      constraints: [`Restricción ${index}`],
      source: "levio_simulator",
    },
    deterministic_output_snapshot: {
      simulation: {
        id: `simulation-${index}`,
        decision: `Decisión completa ${index}`,
        result: `Resultado completo ${index}`,
        category: "Trabajo",
        scenarios: [
          { title: `Escenario ${index}A`, description: "Contenido A" },
          { title: `Escenario ${index}B`, description: "Contenido B" },
        ],
        signals: { confidence: 81, risk: 24, advantage: 66 },
      },
      thinkingStages: [
        { label: "stage-7 internal substep", debug: "not user data" },
      ],
    },
    metadata: {
      source: "simulator",
      internalSubstep: "stage-7 export preparation",
    },
    safety_flags: { mockOnly: true, aiProviderUsed: false },
    clarification_snapshot: { answer: `Aclaración ${index}` },
    decision_model_snapshot: {
      goals: [`Objetivo ${index}`],
      options: [`Opción ${index}A`, `Opción ${index}B`],
    },
    confidence_summary: { confidence: 81, risk: 24, debug: "hidden" },
    simulation_response_version: "simulation_response_v1_mock",
    decision_contract_version: "stage_4_2i_simulator_persistence_v1",
    language: "es",
    safety_classification: "standard_user_decision_content",
    recommendation_state: "mock_recommendation_available",
    content_sensitivity: "user_decision_content",
    originating_draft_id: null,
    parent_record_id: null,
    revision_label: null,
    created_at: `2026-08-${String(index).padStart(2, "0")}T09:00:00.000Z`,
    updated_at: `2026-08-${String(index).padStart(2, "0")}T10:00:00.000Z`,
    archived_at: null,
    deleted_at: null,
    last_exported_at: null,
    deletion_state: "active",
    retention_rule: "saved_simulation_lifecycle",
    export_eligible: true,
    legal_hold_reason: "internal-only-validation-hold",
    schema_version: 1,
    ...overrides,
  };
}

function draft(overrides: Partial<SimulationDraftRow> = {}): SimulationDraftRow {
  return {
    draft_id: "10000000-0000-4000-8000-000000000001",
    owner_principal_id: ownerPrincipalId,
    owner_principal_type: "registered_user",
    draft_status: "active",
    draft_payload: {
      input: "Texto completo del borrador",
      internalSubstep: "stage-7 debug",
    },
    draft_text_snapshot: "Texto completo del borrador",
    clarification_answers_snapshot: { answer: "Respuesta guardada" },
    structured_context_snapshot: { goals: ["Objetivo del borrador"] },
    language: "es",
    autosave_enabled: true,
    originating_surface: "levio_simulator",
    converted_record_id: null,
    created_at: "2026-08-20T09:00:00.000Z",
    updated_at: "2026-08-21T09:00:00.000Z",
    last_autosaved_at: "2026-08-21T09:00:00.000Z",
    expires_at: "2026-09-20T09:00:00.000Z",
    discarded_at: null,
    deleted_at: null,
    deletion_state: "active",
    retention_rule: "stage-7-draft-short-lifecycle",
    export_eligible: true,
    legal_hold_reason: null,
    schema_version: 1,
    ...overrides,
  };
}

function historyEntry(
  recordId: string,
  overrides: Partial<SimulationHistoryEntryRow> = {},
): SimulationHistoryEntryRow {
  return {
    history_entry_id: "20000000-0000-4000-8000-000000000001",
    owner_principal_id: ownerPrincipalId,
    owner_principal_type: "registered_user",
    record_id: recordId,
    event_type: "created",
    event_timestamp: "2026-08-20T09:00:00.000Z",
    event_source: "server",
    user_visible: true,
    event_summary: "stage-7 internal substep",
    event_payload: { title: "Simulación creada", debug: "internal" },
    before_reference: null,
    after_reference: recordId,
    revision_reference: null,
    outcome_snapshot: { outcome: "Contenido visible", trace: "internal" },
    claim_transaction_reference: null,
    export_reference: null,
    created_at: "2026-08-20T09:00:00.000Z",
    updated_at: "2026-08-20T09:00:00.000Z",
    deletion_state: "active",
    retention_rule: "stage-7-parent-simulation-lifecycle",
    export_eligible: true,
    deleted_at: null,
    legal_hold_reason: null,
    schema_version: 1,
    ...overrides,
  };
}

type ProviderInput = {
  simulations?: SimulationRecordRow[];
  drafts?: SimulationDraftRow[];
  history?: SimulationHistoryEntryRow[];
  returnUnscopedSimulations?: boolean;
  calls: { resolve: number; simulations: number; drafts: number; history: number; limit?: number };
};

function createProvider(input: ProviderInput) {
  const simulations = input.simulations ?? [];
  const drafts = input.drafts ?? [];
  const history = input.history ?? [];

  return {
    providerId: "supabase" as const,
    executionBoundary: "server_only" as const,
    async resolvePrincipalByProviderReference() {
      input.calls.resolve += 1;
      return resolvedPrincipal;
    },
    async listExportEligibleSimulationRecords(query: {
      ownerPrincipalId: string;
      limit: number;
    }) {
      input.calls.simulations += 1;
      input.calls.limit = query.limit;
      if (input.returnUnscopedSimulations) return simulations.slice(0, query.limit);
      return simulations
        .filter(
          (row) =>
            row.owner_principal_id === query.ownerPrincipalId &&
            (row.record_status === "active" || row.record_status === "archived") &&
            row.deletion_state === "active" &&
            row.export_eligible,
        )
        .slice(0, query.limit);
    },
    async listSimulationDrafts(query: { ownerPrincipalId: string; limit: number }) {
      input.calls.drafts += 1;
      return drafts
        .filter(
          (row) =>
            row.owner_principal_id === query.ownerPrincipalId &&
            row.deletion_state === "active" &&
            row.export_eligible,
        )
        .slice(0, query.limit);
    },
    async listSimulationHistoryEntries(query: {
      ownerPrincipalId: string;
      limit: number;
    }) {
      input.calls.history += 1;
      return history
        .filter(
          (row) =>
            row.owner_principal_id === query.ownerPrincipalId &&
            row.user_visible &&
            row.deletion_state === "active" &&
            row.export_eligible,
        )
        .slice(0, query.limit);
    },
  };
}

async function execute(input: Omit<ProviderInput, "calls"> & {
  authContext?: LevioAuthRuntimeContext;
}) {
  const calls: ProviderInput["calls"] = {
    resolve: 0,
    simulations: 0,
    drafts: 0,
    history: 0,
  };
  const provider = createProvider({ ...input, calls });
  const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
  const result = await readAccountDataExportSurface({
    authContext: input.authContext ?? authenticatedContext,
    generatedAt,
    runtime,
  });
  return { result, calls };
}

function expect(condition: boolean, issue: string): string[] {
  return condition ? [] : [issue];
}

function cases(): ValidationCase[] {
  const active = simulationRecord(1);
  const archived = simulationRecord(2, {
    record_status: "archived",
    archived_at: "2026-08-22T11:00:00.000Z",
    deterministic_output_snapshot: {
      contractVersion: "2.0",
      status: "analysis_ready",
      decision: {
        statement: "Decisión V2 completa",
        primaryGoal: "Objetivo V2",
        optionSummaries: [
          { id: "option-a", label: "Opción A" },
          { id: "option-b", label: "Opción B" },
        ],
      },
      modelQuality: {
        confidence: { score: 78, explanation: "Confianza moderada" },
      },
      analysis: {
        scenarios: [
          { id: "scenario-a", summary: "Escenario V2 A" },
          { id: "scenario-b", summary: "Escenario V2 B" },
        ],
        risks: [{ id: "risk-a", summary: "Riesgo V2" }],
      },
      recommendation: {
        status: "recommended",
        summary: "Recomendación V2 completa",
      },
      safety: { level: "standard", message: "Resultado orientativo" },
      notices: [],
    },
    decision_model_snapshot: null,
    confidence_summary: { confidence: 78, risk: 31 },
    simulation_response_version: "simulation_response_v2",
    decision_contract_version: "2.0",
    recommendation_state: "recommended",
    safety_flags: { mockOnly: false, aiProviderUsed: true },
  });

  return [
    {
      caseId: "complete_multiple_saved_simulations",
      run: async () => {
        const { result, calls } = await execute({
          simulations: [active, archived],
          drafts: [draft()],
          history: [historyEntry(active.record_id)],
        });
        if (result.status !== "ready") return ["Complete eligible export must be ready."];

        const [first, second] = result.document.savedSimulations;
        const serialized = JSON.stringify(result.document).toLowerCase();
        return [
          ...expect(result.document.generatedAt === generatedAt, "Serialization clock must be stable."),
          ...expect(result.document.savedSimulations.length === 2, "All eligible saved simulations must be exported."),
          ...expect(calls.limit === 1000, "Export must use the bounded export capacity, not the dashboard card limit."),
          ...expect(first.input.userInputSnapshot.input === "Entrada completa 1", "Full saved input snapshot is required."),
          ...expect(first.input.decisionContext?.goals?.[0] === "Objetivo 1", "Saved decision context is required."),
          ...expect(
            Array.isArray((first.result.content.simulation as Record<string, unknown>).scenarios) &&
              ((first.result.content.simulation as Record<string, unknown>).scenarios as unknown[]).length === 2,
            "Full saved result scenarios are required.",
          ),
          ...expect(first.result.confidenceSummary?.confidence === 81, "Saved confidence result is required."),
          ...expect(second.lifecycle.state === "archived", "Eligible archived simulations must remain portable."),
          ...expect(
            (second.result.content.decision as Record<string, unknown>).statement ===
              "Decisión V2 completa" &&
              Array.isArray(
                (second.result.content.analysis as Record<string, unknown>)
                  .scenarios,
              ),
            "Current V2 saved decision and scenario result content is required.",
          ),
          ...expect(second.provenance.resultFormatVersion === "2.0", "V2 result format must remain identifiable without internal labels."),
          ...expect(result.document.simulationDrafts[0]?.draftText === "Texto completo del borrador", "Eligible draft content must remain present."),
          ...expect(result.document.simulationHistory[0]?.simulationId === active.record_id, "History parent relationship must remain present."),
          ...expect(!serialized.includes("stage-7"), "Export must not contain Stage 7 markers."),
          ...expect(!serialized.includes("mock_recommendation_available"), "Export must not contain mock recommendation markers."),
          ...expect(!serialized.includes("internal substep") && !serialized.includes('"debug"'), "Export must not contain internal substep/debug material."),
          ...expect(!serialized.includes("internal-only-validation-hold"), "Legal-hold internals must remain excluded."),
        ];
      },
    },
    {
      caseId: "cross_owner_results_fail_closed",
      run: async () => {
        const { result } = await execute({
          simulations: [simulationRecord(3, { owner_principal_id: otherPrincipalId })],
          returnUnscopedSimulations: true,
        });
        return expect(
          result.status === "blocked" && result.reason === "read_failed",
          "Mixed-owner provider results must fail closed without a document.",
        );
      },
    },
    {
      caseId: "deleted_and_non_exportable_content_stays_absent",
      run: async () => {
        const deleted = simulationRecord(4, {
          record_status: "deleted",
          deletion_state: "deleted",
          deleted_at: generatedAt,
          export_eligible: false,
        });
        const expiredDraft = draft({
          draft_status: "deleted",
          deletion_state: "deleted",
          export_eligible: false,
          deleted_at: generatedAt,
        });
        const deletedHistory = historyEntry(active.record_id, {
          deletion_state: "deleted",
          export_eligible: false,
          deleted_at: generatedAt,
        });
        const { result } = await execute({
          simulations: [active, deleted],
          drafts: [expiredDraft],
          history: [deletedHistory],
        });
        if (result.status !== "ready") return ["Remaining eligible data must still export."];
        return [
          ...expect(result.document.savedSimulations.length === 1, "Deleted saved content must remain absent."),
          ...expect(result.document.simulationDrafts.length === 0, "Deleted draft content must remain absent."),
          ...expect(result.document.simulationHistory.length === 0, "Deleted history content must remain absent."),
        ];
      },
    },
    {
      caseId: "empty_account_keeps_stable_document",
      run: async () => {
        const { result } = await execute({});
        if (result.status !== "empty") return ["Eligible empty account must return the empty export contract."];
        return [
          ...expect(result.document.savedSimulations.length === 0, "Saved simulation array must be empty."),
          ...expect(result.document.simulationDrafts.length === 0, "Draft array must be empty."),
          ...expect(result.document.simulationHistory.length === 0, "History array must be empty."),
          ...expect(result.document.format === "levio-account-data-export-json", "Export format must remain stable."),
        ];
      },
    },
    {
      caseId: "unauthenticated_export_stops_before_persistence",
      run: async () => {
        const { result, calls } = await execute({ authContext: signedOutContext });
        return [
          ...expect(result.status === "blocked" && result.reason === "auth_required", "Authentication is required."),
          ...expect(calls.resolve === 0 && calls.simulations === 0 && calls.drafts === 0 && calls.history === 0, "Unauthenticated export must not read persistence."),
        ];
      },
    },
  ];
}

export async function runAccountDataExportSurfaceValidation() {
  const results = [];
  for (const validationCase of cases()) {
    try {
      const issues = await validationCase.run();
      results.push({
        caseId: validationCase.caseId,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      });
    } catch {
      results.push({
        caseId: validationCase.caseId,
        passed: false,
        failed: true,
        issues: ["Validation case threw."],
      });
    }
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  return {
    passed: failed === 0,
    failed: failed > 0,
    cases: results,
    summary: { total: results.length, passed, failed },
  };
}
