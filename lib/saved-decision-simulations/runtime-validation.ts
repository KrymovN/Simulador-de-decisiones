import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, SimulationRecordRow } from "../persistence-runtime";
import { initializePersistenceRuntimeWiring } from "../persistence-runtime";
import { buildMockSimulation } from "../simulationEngine";
import {
  archiveDecisionSimulation,
  decisionSimulationPersistenceMapping,
  listDecisionSimulations,
  loadDecisionSimulation,
  mapSimulationRecordToDecisionSimulation,
  reopenDecisionSimulation,
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
const savedRecordId = "5ce1e4a7-4494-45d9-9481-444444444444";
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

function simulationRecord(
  ownerPrincipalId = principalId,
  status: SimulationRecordRow["record_status"] = "active",
): SimulationRecordRow {
  const simulation = buildMockSimulation("Guardar una simulación de decisión");
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

function createSavedDecisionSimulationsProvider(calls: {
  resolve: number;
  save: number;
  read: number;
  list: number;
  archive: number;
  leakOwnerOnRead?: boolean;
  leakOwnerOnArchive?: boolean;
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

      return [
        simulationRecord(
          calls.leakOwnerOnRead ? otherPrincipalId : principalId,
          calls.includeArchivedInList ? "archived" : "active",
        ),
      ];
    },
    async archiveSimulationRecord(input: {
      recordId: string;
      ownerPrincipalId: string;
      archivedAt: string;
    }) {
      calls.archive += 1;

      if (input.recordId !== savedRecordId || input.ownerPrincipalId !== principalId) {
        return null;
      }

      return {
        ...simulationRecord(
          calls.leakOwnerOnArchive ? otherPrincipalId : principalId,
          "archived",
        ),
        archived_at: input.archivedAt,
        updated_at: input.archivedAt,
      };
    },
  };
}

function expectIsolationEvidence(): string[] {
  const evidence = savedDecisionSimulationsRuntimeEvidence();

  return evidence.stage === "block-a-a2" &&
    evidence.productCapability === "saved_decision_simulations" &&
    evidence.runtimeCapability === "decision_simulation_persistence_runtime_mapping" &&
    evidence.serverRuntimeBoundaryOnly &&
    evidence.usesAuthRuntime &&
    evidence.usesPersistenceRuntime &&
    evidence.usesDecisionSimulationEngineArtifact &&
    evidence.domainModelMapped &&
    evidence.saveSupported &&
    evidence.loadSupported &&
    evidence.listSupported &&
    evidence.reopenSupported &&
    evidence.archiveSupported &&
    evidence.ownerScopedReadsOnly &&
    evidence.ownerScopedWritesOnly &&
    evidence.clientOwnerInputAccepted === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
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
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
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
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
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
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
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
          ...issueUnless(
            result.status === "saved" &&
              result.simulation.ownership.ownerPrincipalId === principalId &&
              result.simulation.lifecycleMetadata.state === "saved",
            "Expected saved result to include the canonical Decision Simulation domain model.",
          ),
        ];
      },
    },
    {
      id: "load_owner_scoped_record",
      title: "Load returns an owner-scoped saved simulation",
      expectedBehavior: "Runtime resolves principal and loads only the authenticated owner's record.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
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
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
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
          ...issueUnless(
            result.status === "listed" &&
              result.simulations.length === 1 &&
              result.simulations[0]?.identity.simulationId === savedRecordId,
            "Expected list result to include mapped Decision Simulation objects.",
          ),
        ];
      },
    },
    {
      id: "invalid_record_id_blocks",
      title: "Invalid record id blocks load",
      expectedBehavior: "Runtime rejects malformed record ids before provider reads.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
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
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0, leakOwnerOnRead: true };
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
    {
      id: "client_owner_fields_rejected",
      title: "Client-supplied owner fields are rejected",
      expectedBehavior: "Runtime rejects owner identifiers before persistence is touched.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await listDecisionSimulations({
          authContext: authenticatedContext,
          ownerPrincipalId: otherPrincipalId,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        } as Parameters<typeof listDecisionSimulations>[0] & { ownerPrincipalId: string });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "client_owner_input_rejected",
            "Expected client owner input to be rejected.",
          ),
          ...issueUnless(
            calls.resolve === 0 && calls.list === 0,
            "Client owner rejection must happen before provider access.",
          ),
        ];
      },
    },
    {
      id: "nested_client_owner_fields_rejected",
      title: "Nested client-supplied owner fields are rejected",
      expectedBehavior: "Runtime rejects owner identifiers inside simulation payloads before persistence is touched.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const simulation = {
          ...buildMockSimulation("Guardar una simulación de decisión"),
          simulation: {
            ...buildMockSimulation("Guardar una simulación de decisión").simulation,
            owner_principal_id: otherPrincipalId,
          },
        };
        const result = await saveDecisionSimulation({
          authContext: authenticatedContext,
          simulation,
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "client_owner_input_rejected",
            "Expected nested client owner input to be rejected.",
          ),
          ...issueUnless(
            calls.resolve === 0 && calls.save === 0,
            "Nested client owner rejection must happen before provider access.",
          ),
        ];
      },
    },
    {
      id: "reopen_is_runtime_view_state",
      title: "Reopen maps an active record into a runtime view state",
      expectedBehavior: "Reopen loads the owner's active record without mutating durable record_status.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await reopenDecisionSimulation({
          authContext: authenticatedContext,
          recordId: savedRecordId,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "reopened", "Expected saved simulation to reopen."),
          ...issueUnless(calls.read === 1 && calls.archive === 0, "Reopen must read only and not archive/update."),
          ...issueUnless(
            result.status === "reopened" &&
              result.record.record_status === "active" &&
              result.simulation.lifecycleMetadata.state === "reopened",
            "Expected reopened state to be runtime-only over an active saved record.",
          ),
        ];
      },
    },
    {
      id: "archive_owner_scoped_record",
      title: "Archive updates only the authenticated owner's active record",
      expectedBehavior: "Runtime resolves owner and archives through the server-only persistence provider.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await archiveDecisionSimulation({
          authContext: authenticatedContext,
          recordId: savedRecordId,
          archivedAt: "2026-07-06T02:00:00.000Z",
          runtime,
          archiveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "archived", "Expected saved simulation to archive."),
          ...issueUnless(calls.resolve === 1 && calls.archive === 1, "Expected one principal resolution and one archive."),
          ...issueUnless(
            result.status === "archived" &&
              result.record.owner_principal_id === principalId &&
              result.record.record_status === "archived" &&
              result.simulation.lifecycleMetadata.state === "archived",
            "Expected archived result to remain owner-scoped.",
          ),
        ];
      },
    },
    {
      id: "cross_owner_archive_blocks",
      title: "Cross-owner archive returns controlled not-found",
      expectedBehavior: "Runtime does not archive records outside the resolved owner scope.",
      run: async () => {
        const calls = { resolve: 0, save: 0, read: 0, list: 0, archive: 0 };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await archiveDecisionSimulation({
          authContext: authenticatedContext,
          recordId: "2d2de1f1-720d-487a-b45f-666666666666",
          archivedAt: "2026-07-06T02:00:00.000Z",
          runtime,
          archiveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "record_not_found",
            "Expected cross-owner archive to return controlled not-found.",
          ),
          ...issueUnless(calls.archive === 1, "Archive provider should be called with resolved owner scope."),
        ];
      },
    },
    {
      id: "archived_records_not_active_history",
      title: "Archived records are not treated as active history",
      expectedBehavior: "Runtime rejects provider list results that include archived records in active list.",
      run: async () => {
        const calls = {
          resolve: 0,
          save: 0,
          read: 0,
          list: 0,
          archive: 0,
          includeArchivedInList: true,
        };
        const provider = createSavedDecisionSimulationsProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await listDecisionSimulations({
          authContext: authenticatedContext,
          runtime,
          readProvider: provider,
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "blocked" && result.reason === "record_owner_scope_failed",
          "Expected archived active-list leakage to block.",
        );
      },
    },
    {
      id: "persistence_boundary_required",
      title: "Persistence boundary is required",
      expectedBehavior: "Runtime blocks when the configured provider lacks read/archive capabilities.",
      run: async () => {
        const readResult = await loadDecisionSimulation({
          authContext: authenticatedContext,
          recordId: savedRecordId,
          runtime: initializePersistenceRuntimeWiring({
            providerAdapter: {
              providerId: "supabase",
              executionBoundary: "server_only",
              async resolvePrincipalByProviderReference() {
                return resolvedPrincipal;
              },
            },
          }),
          config: enabledConfig,
        });
        const archiveResult = await archiveDecisionSimulation({
          authContext: authenticatedContext,
          recordId: savedRecordId,
          runtime: initializePersistenceRuntimeWiring({
            providerAdapter: {
              providerId: "supabase",
              executionBoundary: "server_only",
              async resolvePrincipalByProviderReference() {
                return resolvedPrincipal;
              },
            },
          }),
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            readResult.status === "blocked" && readResult.reason === "provider_read_not_supported",
            "Expected load to require read provider support.",
          ),
          ...issueUnless(
            archiveResult.status === "blocked" && archiveResult.reason === "provider_archive_not_supported",
            "Expected archive to require archive provider support.",
          ),
        ];
      },
    },
    {
      id: "domain_mapping_categories_are_explicit",
      title: "Domain mapping categories are explicit",
      expectedBehavior: "Mapping defines stored, deferred, computed, and prohibited client fields.",
      run: () => {
        const mapping = decisionSimulationPersistenceMapping();
        const domain = mapSimulationRecordToDecisionSimulation(simulationRecord());

        return [
          ...issueUnless(mapping.storedNow.length > 0, "Expected stored-now mapping entries."),
          ...issueUnless(mapping.deferred.length > 0, "Expected deferred mapping entries."),
          ...issueUnless(mapping.computedRuntime.length > 0, "Expected computed mapping entries."),
          ...issueUnless(
            mapping.prohibitedClientFields.includes("ownerPrincipalId") &&
              mapping.prohibitedClientFields.includes("owner_principal_id"),
            "Expected prohibited owner fields to be explicit.",
          ),
          ...issueUnless(
            domain.identity.simulationId === savedRecordId &&
              domain.aiMetadata.rawProviderMaterialStored === false &&
              domain.runtimeMetadata.runtimeTruthBoundary === "deterministic_preview",
            "Expected canonical domain model mapping from simulation_records.",
          ),
        ];
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
