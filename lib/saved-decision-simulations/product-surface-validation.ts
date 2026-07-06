import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, SimulationRecordRow } from "../persistence-runtime";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import { buildMockSimulation } from "../simulationEngine";
import type { SavedDecisionSimulationsRuntimeConfig } from "./contracts";
import {
  saveCompletedSimulationSurface,
  readSavedSimulationDetailSurface,
  readSavedSimulationsHistorySurface,
} from "./product-surface";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

export type SavedSimulationsProductSurfaceValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SavedSimulationsProductSurfaceValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SavedSimulationsProductSurfaceValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const savedRecordId = "5ce1e4a7-4494-45d9-9481-444444444444";
const otherPrincipalId = "19a54cf2-5d7d-4f1d-9e59-555555555555";

const enabledConfig: SavedDecisionSimulationsRuntimeConfig = {
  enabled: true,
  simulationRecordPersistence: {
    enabled: true,
  },
};

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `a3_saved_surface:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "block_a_a3_saved_surface_validation_session",
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
  created_at: "2026-07-06T00:00:00.000Z",
  updated_at: "2026-07-06T00:00:00.000Z",
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

function simulationRecord(
  ownerPrincipalId = principalId,
  status: SimulationRecordRow["record_status"] = "active",
): SimulationRecordRow {
  const simulation = buildMockSimulation("Revisar una simulación guardada");
  const archived = status === "archived";

  return {
    record_id: savedRecordId,
    owner_principal_id: ownerPrincipalId,
    owner_principal_type: "registered_user",
    record_status: status,
    source_type: "explicit_save",
    title: simulation.simulation.decision,
    user_note: null,
    user_input_snapshot: {
      input: simulation.input,
      language: simulation.lang,
      generatedAt: simulation.generatedAt,
      source: "levio_simulator",
    },
    deterministic_output_snapshot: {
      simulation: simulation.simulation,
      thinkingStages: simulation.thinkingStages,
    },
    metadata: {
      source: "simulator",
      simulationId: simulation.simulation.id,
    },
    safety_flags: {
      mockOnly: true,
      memoryCreated: false,
      aiProviderUsed: false,
    },
    clarification_snapshot: null,
    decision_model_snapshot: null,
    confidence_summary: {
      confidence: simulation.simulation.signals.confidence,
      risk: simulation.simulation.signals.risk,
      advantage: simulation.simulation.signals.advantage,
    },
    simulation_response_version: "simulation_response_v1_mock",
    decision_contract_version: "block_a_a3_saved_surface_validation_v1",
    language: simulation.lang,
    safety_classification: "standard_user_decision_content",
    recommendation_state: "mock_recommendation_available",
    content_sensitivity: "user_decision_content",
    originating_draft_id: null,
    parent_record_id: null,
    revision_label: null,
    created_at: "2026-07-06T00:00:00.000Z",
    updated_at: "2026-07-06T00:00:00.000Z",
    archived_at: archived ? "2026-07-06T01:00:00.000Z" : null,
    deleted_at: null,
    last_exported_at: null,
    deletion_state: "active",
    retention_rule: "saved_simulation_lifecycle",
    export_eligible: true,
    legal_hold_reason: null,
    schema_version: 1,
  };
}

function createProvider(calls: {
  resolve: number;
  save: number;
  read: number;
  list: number;
  leakOwnerOnSave?: boolean;
  leakOwnerOnList?: boolean;
  includeArchivedInList?: boolean;
}) {
  return {
    providerId: "supabase" as const,
    executionBoundary: "server_only" as const,
    async resolvePrincipalByProviderReference() {
      calls.resolve += 1;
      return resolvedPrincipal;
    },
    async saveSimulationRecord() {
      calls.save += 1;
      return simulationRecord(calls.leakOwnerOnSave ? otherPrincipalId : principalId);
    },
    async readSimulationRecord(input: { recordId: string; ownerPrincipalId: string }) {
      calls.read += 1;

      if (input.recordId !== savedRecordId || input.ownerPrincipalId !== principalId) {
        return null;
      }

      return simulationRecord();
    },
    async listSimulationRecords(input: { ownerPrincipalId: string; limit: number }) {
      calls.list += 1;

      if (input.ownerPrincipalId !== principalId || input.limit < 1) {
        return [];
      }

      return [
        simulationRecord(
          calls.leakOwnerOnList ? otherPrincipalId : principalId,
          calls.includeArchivedInList ? "archived" : "active",
        ),
      ];
    },
  };
}

function cases(): ValidationCase[] {
  return [
    {
      id: "unauthenticated_history_requires_auth",
      title: "Unauthenticated users cannot read saved simulations history",
      expectedBehavior: "Product surface returns controlled auth state without provider access.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await readSavedSimulationsHistorySurface({
          authContext: signedOutContext,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "auth_required", "Expected auth-required history state."),
          ...issueUnless(calls.resolve === 0 && calls.list === 0, "Auth-required state must not touch provider."),
        ];
      },
    },
    {
      id: "authenticated_history_maps_only_owner_records",
      title: "Authenticated users see only owner-scoped records",
      expectedBehavior: "Product surface maps active owner records into client-safe view models.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await readSavedSimulationsHistorySurface({
          authContext: authenticatedContext,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "ready", "Expected ready history state."),
          ...issueUnless(calls.resolve === 1 && calls.list === 1, "Expected runtime owner resolution and list."),
          ...issueUnless(
            result.status === "ready" &&
              result.simulations.length === 1 &&
              result.simulations[0]?.id === savedRecordId &&
              !("ownerPrincipalId" in result.simulations[0]),
            "Expected client-safe view model without owner fields.",
          ),
        ];
      },
    },
    {
      id: "archived_records_hidden_from_active_history",
      title: "Archived records are hidden from active history",
      expectedBehavior: "Product surface returns controlled error if provider leaks archived records into active list.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, includeArchivedInList: true };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await readSavedSimulationsHistorySurface({
          authContext: authenticatedContext,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "error",
          "Expected archived active-list leakage to fail closed.",
        );
      },
    },
    {
      id: "invalid_detail_id_is_controlled",
      title: "Invalid detail id returns controlled state",
      expectedBehavior: "Malformed ids never reach persistence provider.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await readSavedSimulationDetailSurface({
          authContext: authenticatedContext,
          recordId: "oferta-premium",
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "invalid_id", "Expected invalid-id detail state."),
          ...issueUnless(calls.read === 0, "Invalid ids must not call read provider."),
        ];
      },
    },
    {
      id: "missing_detail_id_is_controlled",
      title: "Missing owner record returns controlled state",
      expectedBehavior: "Unknown or cross-owner ids return not-found without leaking ownership.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await readSavedSimulationDetailSurface({
          authContext: authenticatedContext,
          recordId: "2d2de1f1-720d-487a-b45f-666666666666",
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return issueUnless(result.status === "not_found", "Expected not-found detail state.");
      },
    },
    {
      id: "detail_reopen_uses_runtime_boundary",
      title: "Detail view reopens through runtime boundary",
      expectedBehavior: "Product surface uses reopen runtime and maps the loaded record.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await readSavedSimulationDetailSurface({
          authContext: authenticatedContext,
          recordId: savedRecordId,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "loaded", "Expected loaded detail state."),
          ...issueUnless(calls.resolve === 1 && calls.read === 1, "Expected runtime owner resolution and read."),
          ...issueUnless(
            result.status === "loaded" &&
              result.simulation.id === savedRecordId &&
              result.simulation.lifecycleLabel === "Reabierta",
            "Expected detail view to represent a reopened saved simulation.",
          ),
        ];
      },
    },
    {
      id: "unauthenticated_save_requires_auth",
      title: "Unauthenticated users cannot save owner-bound simulations",
      expectedBehavior: "Save surface returns controlled auth state without provider access.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveCompletedSimulationSurface({
          authContext: signedOutContext,
          simulation: buildMockSimulation("Guardar una simulación sin sesión"),
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "auth_required", "Expected auth-required save state."),
          ...issueUnless(
            calls.resolve === 0 && calls.save === 0,
            "Auth-required save must not touch provider.",
          ),
        ];
      },
    },
    {
      id: "authenticated_save_uses_owner_runtime",
      title: "Authenticated save uses owner-scoped runtime",
      expectedBehavior: "Save surface delegates to runtime and returns only client-safe navigation.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveCompletedSimulationSurface({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una simulación autenticada"),
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "saved", "Expected saved surface state."),
          ...issueUnless(calls.resolve === 1 && calls.save === 1, "Expected runtime owner resolution and save."),
          ...issueUnless(
            result.status === "saved" &&
              result.recordId === savedRecordId &&
              result.historyHref === "/dashboard/simulations" &&
              result.detailHref === `/dashboard/simulations/${savedRecordId}` &&
              !("ownerPrincipalId" in result),
            "Expected client-safe saved navigation without owner fields.",
          ),
        ];
      },
    },
    {
      id: "save_owner_leak_fails_closed",
      title: "Save blocks provider owner leakage",
      expectedBehavior: "Save surface reports controlled error if saved row leaves resolved owner scope.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, leakOwnerOnSave: true };
        const provider = createProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveCompletedSimulationSurface({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una simulación con fuga de owner"),
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "error" && result.reason === "record_owner_scope_failed",
          "Expected owner leakage during save to fail closed.",
        );
      },
    },
  ];
}

export async function runSavedSimulationsProductSurfaceValidation(): Promise<SavedSimulationsProductSurfaceValidationResult> {
  const results: SavedSimulationsProductSurfaceValidationCaseResult[] = [];

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
        issues: ["Saved simulations product surface validation case threw an uncaught exception."],
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
