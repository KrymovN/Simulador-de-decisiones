import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, SimulationDraftRow } from "./contracts";
import { initializePersistenceRuntimeWiring } from "./runtime-wiring";
import {
  buildSimulationDraftInsertPayload,
  buildSimulationDraftUpdatePayload,
  saveSimulationDraft,
  simulationDraftPersistenceEvidence,
  updateSimulationDraft,
  type SimulationDraftPersistenceConfig,
} from "./simulation-draft-persistence";
import type {
  SupabaseSimulationDraftInsertPayload,
  SupabaseSimulationDraftSaveProvider,
  SupabaseSimulationDraftUpdatePayload,
} from "./supabase-provider";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => Promise<string[]> | string[];
};

export type SimulationDraftPersistenceValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type SimulationDraftPersistenceValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: SimulationDraftPersistenceValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const draftId = "6dd4510d-a549-4113-8d39-666666666666";
const enabledConfig: SimulationDraftPersistenceConfig = { enabled: true };

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_4_2k_validation_session",
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

const draftReference = {
  draft_id: draftId,
  owner_principal_id: principalId,
  owner_principal_type: "registered_user" as const,
};

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function draftFromPayload(payload: SupabaseSimulationDraftInsertPayload): SimulationDraftRow {
  return {
    draft_id: draftId,
    owner_principal_id: payload.owner_principal_id,
    owner_principal_type: payload.owner_principal_type,
    draft_status: payload.draft_status,
    draft_payload: payload.draft_payload,
    draft_text_snapshot: payload.draft_text_snapshot,
    clarification_answers_snapshot: payload.clarification_answers_snapshot,
    structured_context_snapshot: payload.structured_context_snapshot,
    language: payload.language,
    autosave_enabled: payload.autosave_enabled,
    originating_surface: payload.originating_surface,
    converted_record_id: null,
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:00:00.000Z",
    last_autosaved_at: null,
    expires_at: payload.expires_at,
    discarded_at: null,
    deleted_at: null,
    deletion_state: payload.deletion_state,
    retention_rule: payload.retention_rule,
    export_eligible: payload.export_eligible,
    legal_hold_reason: null,
    schema_version: payload.schema_version,
  };
}

function updatedDraftFromPayload(payload: SupabaseSimulationDraftUpdatePayload): SimulationDraftRow {
  return {
    draft_id: draftId,
    owner_principal_id: principalId,
    owner_principal_type: "registered_user",
    draft_status: payload.draft_status ?? "active",
    draft_payload: payload.draft_payload ?? { text: "existing draft" },
    draft_text_snapshot: payload.draft_text_snapshot ?? "existing draft",
    clarification_answers_snapshot: payload.clarification_answers_snapshot ?? null,
    structured_context_snapshot: payload.structured_context_snapshot ?? null,
    language: payload.language ?? "es",
    autosave_enabled: payload.autosave_enabled ?? true,
    originating_surface: "validation",
    converted_record_id: null,
    created_at: "2026-06-18T00:00:00.000Z",
    updated_at: "2026-06-18T00:01:00.000Z",
    last_autosaved_at: payload.last_autosaved_at ?? null,
    expires_at: payload.expires_at ?? "2026-06-25T00:00:00.000Z",
    discarded_at: null,
    deleted_at: null,
    deletion_state: "active",
    retention_rule: "draft_short_lifecycle",
    export_eligible: true,
    legal_hold_reason: null,
    schema_version: 1,
  };
}

function createDraftProvider(calls: {
  resolve: number;
  save: number;
  update: number;
  inserts: SupabaseSimulationDraftInsertPayload[];
  updates: SupabaseSimulationDraftUpdatePayload[];
}): SupabaseSimulationDraftSaveProvider {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference() {
      calls.resolve += 1;
      return resolvedPrincipal;
    },
    async saveSimulationDraft(payload) {
      calls.save += 1;
      calls.inserts.push(payload);
      return draftFromPayload(payload);
    },
    async updateSimulationDraft(input) {
      calls.update += 1;
      calls.updates.push(input.payload);
      return updatedDraftFromPayload(input.payload);
    },
  };
}

function expectIsolationEvidence(): string[] {
  const evidence = simulationDraftPersistenceEvidence();

  return evidence.stage === "4.2K" &&
    evidence.simulationDraftsOnly &&
    evidence.savePathEnabled &&
    evidence.updatePathEnabled &&
    evidence.controlledRolloutRequired &&
    evidence.runtimeWiringUsed &&
    evidence.providerResolutionUsed &&
    evidence.dashboardIntegrated === false &&
    evidence.uiChanged === false &&
    evidence.apiRouteChanged === false &&
    evidence.authRuntimeChanged === false &&
    evidence.schemaChanged === false &&
    evidence.migrationsChanged === false &&
    evidence.stage42LStarted === false &&
    evidence.stage43Started === false &&
    evidence.stage44Started === false
    ? []
    : ["Stage 4.2K simulation draft persistence evidence changed."];
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_by_default",
      title: "Draft persistence is disabled by default",
      expectedBehavior: "Controlled rollout blocks draft saves until explicitly enabled.",
      run: async () => {
        const calls = { resolve: 0, save: 0, update: 0, inserts: [] as SupabaseSimulationDraftInsertPayload[], updates: [] as SupabaseSimulationDraftUpdatePayload[] };
        const provider = createDraftProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationDraft({
          authContext: authenticatedContext,
          draftPayload: { text: "validation draft" },
          runtime,
          saveProvider: provider,
          config: { enabled: false },
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "persistence_disabled",
            "Expected disabled rollout to block draft save.",
          ),
          ...issueUnless(calls.save === 0 && calls.update === 0, "Disabled rollout must not call draft provider."),
          ...expectIsolationEvidence(),
        ];
      },
    },
    {
      id: "signed_out_context_blocks",
      title: "Signed-out context blocks draft save",
      expectedBehavior: "Do not resolve or save drafts without an authenticated context.",
      run: async () => {
        const calls = { resolve: 0, save: 0, update: 0, inserts: [] as SupabaseSimulationDraftInsertPayload[], updates: [] as SupabaseSimulationDraftUpdatePayload[] };
        const provider = createDraftProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationDraft({
          authContext: signedOutContext,
          draftPayload: { text: "validation draft" },
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" && result.reason === "auth_context_not_authenticated",
            "Expected signed-out auth context to block draft save.",
          ),
          ...issueUnless(calls.resolve === 0 && calls.save === 0, "Signed-out save must not call provider."),
        ];
      },
    },
    {
      id: "provider_without_draft_save_blocks",
      title: "Provider without draft save support blocks",
      expectedBehavior: "Do not save unless provider exposes draft save/update capability.",
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
        const result = await saveSimulationDraft({
          authContext: authenticatedContext,
          draftPayload: { text: "validation draft" },
          runtime,
          config: enabledConfig,
        });

        return issueUnless(
          result.status === "blocked" && result.reason === "provider_draft_save_not_supported",
          "Expected provider without draft methods to block.",
        );
      },
    },
    {
      id: "insert_payload_maps_draft",
      title: "Insert payload maps draft",
      expectedBehavior: "Build a simulation_drafts insert payload only.",
      run: () => {
        const payload = buildSimulationDraftInsertPayload({
          ownerPrincipalId: principalId,
          draftPayload: { text: "validation draft" },
          draftText: "validation draft",
          language: "es",
          autosaveEnabled: true,
          originatingSurface: "validation",
          expiresAt: "2026-06-25T00:00:00.000Z",
        });

        return [
          ...issueUnless(Boolean(payload), "Expected draft insert payload."),
          ...issueUnless(
            payload?.owner_principal_id === principalId &&
              payload.owner_principal_type === "registered_user",
            "Expected owner fields to come from resolved principal.",
          ),
          ...issueUnless(
            payload?.draft_status === "active" &&
              payload.autosave_enabled === true &&
              payload.retention_rule === "draft_short_lifecycle",
            "Expected active short-lifecycle draft payload.",
          ),
        ];
      },
    },
    {
      id: "update_payload_requires_fields",
      title: "Update payload requires fields",
      expectedBehavior: "Do not update a draft when no approved fields are present.",
      run: () => {
        const payload = buildSimulationDraftUpdatePayload({});
        return issueUnless(payload === null, "Expected empty update payload to be rejected.");
      },
    },
    {
      id: "save_draft_success",
      title: "Draft save succeeds",
      expectedBehavior: "Resolve principal and insert exactly one simulation_drafts row.",
      run: async () => {
        const calls = { resolve: 0, save: 0, update: 0, inserts: [] as SupabaseSimulationDraftInsertPayload[], updates: [] as SupabaseSimulationDraftUpdatePayload[] };
        const provider = createDraftProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await saveSimulationDraft({
          authContext: authenticatedContext,
          draftPayload: { text: "validation draft" },
          draftText: "validation draft",
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "saved", "Expected draft to be saved."),
          ...issueUnless(calls.resolve === 1, "Expected one provider principal resolution."),
          ...issueUnless(calls.save === 1 && calls.update === 0, "Expected one draft insert only."),
          ...issueUnless(
            result.status === "saved" && result.draft.owner_principal_id === principalId,
            "Expected saved draft to belong to resolved principal.",
          ),
        ];
      },
    },
    {
      id: "update_draft_success",
      title: "Draft update succeeds",
      expectedBehavior: "Resolve owner and update exactly one existing simulation_drafts row.",
      run: async () => {
        const calls = { resolve: 0, save: 0, update: 0, inserts: [] as SupabaseSimulationDraftInsertPayload[], updates: [] as SupabaseSimulationDraftUpdatePayload[] };
        const provider = createDraftProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await updateSimulationDraft({
          authContext: authenticatedContext,
          draft: draftReference,
          draftPayload: { text: "updated validation draft" },
          draftText: "updated validation draft",
          lastAutosavedAt: "2026-06-18T00:01:00.000Z",
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(result.status === "saved", "Expected draft update to be saved."),
          ...issueUnless(calls.resolve === 1, "Expected one provider principal resolution."),
          ...issueUnless(calls.update === 1 && calls.save === 0, "Expected one draft update only."),
          ...issueUnless(
            calls.updates[0]?.draft_text_snapshot === "updated validation draft",
            "Expected update payload text snapshot.",
          ),
        ];
      },
    },
    {
      id: "owner_mismatch_blocks_update",
      title: "Owner mismatch blocks update",
      expectedBehavior: "Do not update a draft whose owner does not match the resolved principal.",
      run: async () => {
        const calls = { resolve: 0, save: 0, update: 0, inserts: [] as SupabaseSimulationDraftInsertPayload[], updates: [] as SupabaseSimulationDraftUpdatePayload[] };
        const provider = createDraftProvider(calls);
        const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
        const result = await updateSimulationDraft({
          authContext: authenticatedContext,
          draft: {
            ...draftReference,
            owner_principal_id: "aafaa42d-f7f0-4e8d-9ed9-333333333333",
          },
          draftPayload: { text: "updated validation draft" },
          runtime,
          saveProvider: provider,
          config: enabledConfig,
        });

        return [
          ...issueUnless(
            result.status === "blocked" &&
              (result.reason === "principal_preflight_blocked" ||
                result.reason === "draft_payload_invalid"),
            "Expected owner mismatch to block update.",
          ),
          ...issueUnless(calls.update === 0, "Owner mismatch must not call draft update provider."),
        ];
      },
    },
  ];
}

export async function runSimulationDraftPersistenceValidation(): Promise<SimulationDraftPersistenceValidationResult> {
  const results: SimulationDraftPersistenceValidationCaseResult[] = [];

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
        issues: ["Simulation draft persistence validation case threw an uncaught exception."],
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
