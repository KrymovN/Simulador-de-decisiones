import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, SimulationRecordRow } from "../persistence-runtime";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import { buildMockSimulation } from "../simulationEngine";
import {
  listDecisionSimulations,
  loadDecisionSimulation,
  saveDecisionSimulation,
  savedDecisionSimulationsRuntimeEvidence,
} from "./runtime";
import type { SavedDecisionSimulationsRuntimeConfig } from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

export type SavedDecisionSimulationsRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SavedDecisionSimulationsRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SavedDecisionSimulationsRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const savedRecordId = "5ce1e4a7-4494-45d9-a481-444444444444";
const otherPrincipalId = "19a54cf2-5d7d-4f1d-9e59-555555555555";

const enabledConfig: SavedDecisionSimulationsRuntimeConfig = {
  enabled: true,
  simulationRecordPersistence: {
    enabled: true,
  },
};

const disabledConfig: SavedDecisionSimulationsRuntimeConfig = {
  enabled: false,
  simulationRecordPersistence: {
    enabled: true,
  },
};

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage15_saved_simulations:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_15_saved_decision_simulations_validation_session",
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

function simulationRecord(ownerPrincipalId = principalId): SimulationRecordRow {
  const simulation = buildMockSimulation("Guardar una simulación de decisión");

  return {
    record_id: savedRecordId,
    owner_principal_id: ownerPrincipalId,
    owner_principal_type: "registered_user",
    record_status: "active",
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
    decision_contract_version: "stage_15_saved_decision_simulations_runtime_v1",
    language: simulation.lang,
    safety_classification: "standard_user_decision_content",
    recommendation_state: "mock_recommendation_available",
    content_sensitivity: "user_decision_content",
    originating_draft_id: null,
    parent_record_id: null,
    revision_label: null,
    created_at: "2026-07-06T00:00:00.000Z",
    updated_at: "2026-07-06T00:00:00.000Z",
    archived_at: null,
    deleted_at: null,
    last_exported_at: null,
    deletion_state: "active",
    retention_rule: "saved_simulation_lifecycle",
    export_eligible: true,
    legal_hold_reason: null,
    schema_version: 1,
  };
}

function createSavedDecisionSimulationsProvider(calls: {
  resolve: number;
  save: number;
  read: number;
  list: number;
  leakOwnerOnRead?: boolean;
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
      return simulationRecord();
    },
    async readSimulationRecord(input: { recordId: string; ownerPrincipalId: string }) {
      calls.read += 1;

      if (input.recordId !== savedRecordId || input.ownerPrincipalId !== principalId) {
        return null;
      }

      return simulationRecord(calls.leakOwnerOnRead ? otherPrincipalId : principalId);
    },
    async listSimulationRecords(input: { ownerPrincipalId: string; limit: number }) {
      calls.list += 1;

      if (input.ownerPrincipalId !== principalId || input.limit < 1) {
        return [];
      }

      return [simulationRecord(calls.leakOwnerOnRead ? otherPrincipalId : principalId)];
    },
  };
}

function expectIsolationEvidence(): string[] {
  const evidence = savedDecisionSimulationsRuntimeEvidence();

  return evidence.stage === "15-product-implementation" &&
    evidence.productCapability === "saved_decision_simulations" &&
    evidence.serverRuntimeBoundaryOnly &&
    evidence.usesAuthRuntime &&
    evidence.usesPersistenceRuntime &&
    evidence.usesDecisionSimulationEngineArtifact &&
    evidence.saveSupported &&
    evidence.loadSupported &&
    evidence.listSupported &&
    evidence.ownerScopedReadsOnly &&
    evidence.clientOwnerInputAccepted === false &&
    evidence.uiChanged === false &&
    evidence.apiRouteChanged === false &&
    evidence.publicContractChanged === false &&
    evidence.architectureInvariantChanged === false &&
    evidence.productionReleaseOpened === false &&
    evidence.commercialLaunchOpened === false &&
    evidence.realAiIntegrated === false &&
    evidence.billingIntegrated === false &&
    evidence.analyticsIntegrated === false &&
    evidence.trackingIntegrated === false &&
    evidence.roadmapChanged === false
    ? []
    : ["Saved decision simulations runtime isolation evidence changed."];
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Saved simulations runtime is controlled by rollout config",
      expectedBehavior: "Runtime blocks without touching persistence when disabled.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveDecisionSimulation({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una simulación de decisión"),
          runtime,
          saveProvider: provider,
          config: disabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "runtime_disabled",
            "Expected disabled runtime to block save.",
          ),
          ...issueUnless(calls.resolve === 0 && calls.save === 0, "Disabled runtime must not call provider."),
          ...expectIsolationEvidence(),
        ];
      },
    },
    {
      id: "signed_out_load_blocks",
      title: "Signed-out context blocks load",
      expectedBehavior: "Runtime does not read saved simulations without auth.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await loadDecisionSimulation({
          authContext: signedOutContext,
          recordId: savedRecordId,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "auth_context_not_authenticated",
            "Expected signed-out load to block.",
          ),
          ...issueUnless(calls.read === 0, "Signed-out load must not call read provider."),
        ];
      },
    },
    {
      id: "save_delegates_to_persistence_runtime",
      title: "Save delegates to simulation record persistence",
      expectedBehavior: "Runtime saves one Decision Simulation through existing persistence boundaries.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveDecisionSimulation({
          authContext: authenticatedContext,
          simulation: buildMockSimulation("Guardar una simulación de decisión"),
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "saved", "Expected saved simulation result."),
          ...issueUnless(calls.resolve === 1 && calls.save === 1, "Expected one principal resolution and one save."),
          ...issueUnless(
            result.status === "saved" && result.record.owner_principal_id === principalId,
            "Expected saved record to belong to resolved principal.",
          ),
        ];
      },
    },
    {
      id: "load_owner_scoped_record",
      title: "Load returns an owner-scoped saved simulation",
      expectedBehavior: "Runtime resolves principal and loads only the authenticated owner's record.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await loadDecisionSimulation({
          authContext: authenticatedContext,
          recordId: savedRecordId,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "loaded", "Expected saved simulation to load."),
          ...issueUnless(calls.resolve === 1 && calls.read === 1, "Expected one principal resolution and one read."),
          ...issueUnless(
            result.status === "loaded" && result.record.owner_principal_id === principalId,
            "Expected loaded record to be owner-scoped.",
          ),
        ];
      },
    },
    {
      id: "list_owner_scoped_records",
      title: "List returns owner-scoped saved simulations",
      expectedBehavior: "Runtime lists only active saved simulations for the authenticated owner.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await listDecisionSimulations({
          authContext: authenticatedContext,
          limit: 500,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "listed", "Expected saved simulations to list."),
          ...issueUnless(calls.resolve === 1 && calls.list === 1, "Expected one principal resolution and one list."),
          ...issueUnless(
            result.status === "listed" && result.records.length === 1,
            "Expected one saved simulation record.",
          ),
        ];
      },
    },
    {
      id: "invalid_record_id_blocks",
      title: "Invalid record id blocks load",
      expectedBehavior: "Runtime rejects malformed record ids before provider reads.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await loadDecisionSimulation({
          authContext: authenticatedContext,
          recordId: "not-a-record-id",
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "record_id_invalid",
            "Expected malformed record id to block.",
          ),
          ...issueUnless(calls.read === 0, "Invalid record id must not call read provider."),
        ];
      },
    },
    {
      id: "provider_owner_leak_blocks",
      title: "Provider owner leakage blocks load",
      expectedBehavior: "Runtime rejects rows outside the authenticated owner scope.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, leakOwnerOnRead: true };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await loadDecisionSimulation({
          authContext: authenticatedContext,
          recordId: savedRecordId,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "blocked" && result.reason === "record_owner_scope_failed",
          "Expected owner leakage to block loaded record.",
        );
      },
    },
  ];
}

export async function runSavedDecisionSimulationsRuntimeValidation(): Promise<SavedDecisionSimulationsRuntimeValidationResult> {
  const results: SavedDecisionSimulationsRuntimeValidationCaseResult[] = [];

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
        issues: ["Saved decision simulations runtime validation case threw an uncaught exception."],
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
