import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  type LevioPrincipalRow,
  type SimulationDraftRow,
  type SupabaseSimulationDraftDeleteProvider,
  type SupabaseSimulationDraftRetentionProvider,
} from "../persistence-runtime";
import { deleteOwnedSimulationDraft } from "./simulation-draft-deletion-execution";

type ValidationCase = { caseId: string; run: () => Promise<string[]> };

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const otherPrincipalId = "4d25a625-7ad3-4995-9d13-333333333333";
const draftId = "6dd4510d-a549-4113-8d39-666666666666";
const deletedAt = "2026-07-13T12:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_7_draft_deletion_surface_validation",
  sessionStatus: "active",
  assuranceLevel: "authenticated",
  riskFlags: [],
};

const signedOutContext: LevioAuthRuntimeContext = {
  identityState: "signed_out",
  error: { code: "session_missing", message: "No validation session." },
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
  locale_preference: null,
  metadata_version: null,
  legal_hold_reason: null,
  schema_version: 1,
};

function draft(overrides: Partial<SimulationDraftRow> = {}): SimulationDraftRow {
  return {
    draft_id: draftId,
    owner_principal_id: principalId,
    owner_principal_type: "registered_user",
    draft_status: "active",
    draft_payload: { text: "private draft" },
    draft_text_snapshot: "private draft",
    clarification_answers_snapshot: { answer: "private" },
    structured_context_snapshot: { context: "private" },
    language: "es",
    autosave_enabled: true,
    originating_surface: "validation",
    converted_record_id: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    last_autosaved_at: "2026-07-01T00:00:00.000Z",
    expires_at: "2026-07-20T12:00:00.000Z",
    discarded_at: null,
    deleted_at: null,
    deletion_state: "active",
    retention_rule: "draft_short_lifecycle",
    export_eligible: true,
    legal_hold_reason: null,
    schema_version: 1,
    ...overrides,
  };
}

type Calls = { read: number; directDelete: number; retentionDelete: number; directOwner?: string };

function terminal(source: SimulationDraftRow): SimulationDraftRow {
  return draft({
    ...source,
    draft_status: "deleted",
    draft_payload: {},
    draft_text_snapshot: null,
    clarification_answers_snapshot: null,
    structured_context_snapshot: null,
    autosave_enabled: false,
    last_autosaved_at: null,
    discarded_at: deletedAt,
    deleted_at: deletedAt,
    deletion_state: "deleted",
    export_eligible: false,
  });
}

function createProvider(input: {
  row?: SimulationDraftRow;
  readStatus?: "found" | "not_found" | "failed";
  directDeleteStatus?: "deleted" | "not_found" | "failed";
  retentionDeleteStatus?: "deleted" | "not_found" | "failed";
  calls: Calls;
}): SupabaseSimulationDraftDeleteProvider & SupabaseSimulationDraftRetentionProvider {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference() {
      return resolvedPrincipal;
    },
    async readSimulationDraft() {
      input.calls.read += 1;
      if (input.readStatus === "failed") return { status: "failed" };
      if (input.readStatus === "not_found") return { status: "not_found" };
      return { status: "found", draft: input.row ?? draft() };
    },
    async deleteSimulationDraft(deleteInput) {
      input.calls.directDelete += 1;
      input.calls.directOwner = deleteInput.ownerPrincipalId;
      if (input.directDeleteStatus === "failed") return { status: "failed" };
      if (input.directDeleteStatus === "not_found") return { status: "not_found" };
      return { status: "deleted", draft: terminal(input.row ?? draft()) };
    },
    async deleteExpiredSimulationDraft() {
      input.calls.retentionDelete += 1;
      if (input.retentionDeleteStatus === "failed") return { status: "failed" };
      if (input.retentionDeleteStatus === "not_found") return { status: "not_found" };
      return { status: "deleted", draft: terminal(input.row ?? draft()) };
    },
  };
}

async function execute(input: {
  row?: SimulationDraftRow;
  readStatus?: "found" | "not_found" | "failed";
  directDeleteStatus?: "deleted" | "not_found" | "failed";
  retentionDeleteStatus?: "deleted" | "not_found" | "failed";
  authContext?: LevioAuthRuntimeContext;
  unsafeInput?: Record<string, unknown>;
}) {
  const calls: Calls = { read: 0, directDelete: 0, retentionDelete: 0 };
  const provider = createProvider({ ...input, calls });
  const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
  const result = await deleteOwnedSimulationDraft({
    draftId,
    authContext: input.authContext ?? authenticatedContext,
    runtime,
    deleteProvider: provider,
    deletedAt,
    ...(input.unsafeInput ?? {}),
  });
  return { result, calls };
}

function expect(condition: boolean, issue: string): string[] {
  return condition ? [] : [issue];
}

function cases(): ValidationCase[] {
  return [
    {
      caseId: "owner_can_delete_active_draft",
      run: async () => {
        const { result, calls } = await execute({});
        return [
          ...expect(result.status === "deleted", "Owner draft must be deleted."),
          ...expect(calls.read === 1 && calls.directDelete === 1, "Exactly one owner-scoped direct mutation is required."),
          ...expect(calls.directOwner === principalId, "Canonical principal must scope the mutation."),
        ];
      },
    },
    {
      caseId: "missing_draft_is_safe_absence",
      run: async () => {
        const { result, calls } = await execute({ readStatus: "not_found" });
        return [
          ...expect(result.status === "already_absent", "Missing draft must be safely absent."),
          ...expect(calls.directDelete === 0, "Missing draft must not mutate."),
        ];
      },
    },
    {
      caseId: "cross_owner_draft_is_safe_absence",
      run: async () => {
        const { result, calls } = await execute({ row: draft({ owner_principal_id: otherPrincipalId }) });
        return [
          ...expect(result.status === "already_absent", "Cross-owner draft must be indistinguishable from absence."),
          ...expect(calls.directDelete === 0 && calls.retentionDelete === 0, "Cross-owner draft must not mutate."),
        ];
      },
    },
    {
      caseId: "client_owner_authority_is_rejected",
      run: async () => {
        const { result, calls } = await execute({ unsafeInput: { ownerPrincipalId: otherPrincipalId } });
        return [
          ...expect(result.status === "blocked" && result.reason === "invalid_request", "Client owner authority must fail."),
          ...expect(calls.read === 0 && calls.directDelete === 0, "Rejected owner input must not reach draft persistence."),
        ];
      },
    },
    {
      caseId: "restricted_draft_is_preserved",
      run: async () => {
        const { result, calls } = await execute({ row: draft({ draft_status: "restricted", deletion_state: "restricted" }) });
        return [
          ...expect(result.status === "blocked" && result.reason === "delete_restricted", "Restricted draft must be blocked."),
          ...expect(calls.directDelete === 0 && calls.retentionDelete === 0, "Restricted draft must remain unchanged."),
        ];
      },
    },
    {
      caseId: "legal_hold_draft_is_preserved",
      run: async () => {
        const { result, calls } = await execute({ row: draft({ legal_hold_reason: "validation_hold" }) });
        return [
          ...expect(result.status === "blocked" && result.reason === "delete_restricted", "Legal-hold draft must be blocked."),
          ...expect(calls.directDelete === 0 && calls.retentionDelete === 0, "Legal-hold draft must remain unchanged."),
        ];
      },
    },
    {
      caseId: "repeat_deletion_is_idempotent",
      run: async () => {
        const { result, calls } = await execute({ row: terminal(draft()) });
        return [
          ...expect(result.status === "already_absent", "Repeated deletion must be safely absent."),
          ...expect(calls.directDelete === 0 && calls.retentionDelete === 0, "Repeated deletion must not mutate."),
        ];
      },
    },
    {
      caseId: "expired_draft_uses_retention_semantics",
      run: async () => {
        const { result, calls } = await execute({ row: draft({ expires_at: deletedAt }) });
        return [
          ...expect(result.status === "deleted", "Expired draft must use the approved terminal retention result."),
          ...expect(calls.directDelete === 0 && calls.retentionDelete === 1, "Expired draft must not use direct deletion."),
        ];
      },
    },
    {
      caseId: "unexpected_failure_fails_closed",
      run: async () => {
        const { result, calls } = await execute({ directDeleteStatus: "failed" });
        return [
          ...expect(result.status === "blocked" && result.reason === "delete_failed", "Provider failure must fail closed."),
          ...expect(calls.directDelete === 1, "Failed mutation must not retry."),
        ];
      },
    },
    {
      caseId: "unauthenticated_request_fails_before_persistence",
      run: async () => {
        const { result, calls } = await execute({ authContext: signedOutContext });
        return [
          ...expect(result.status === "blocked" && result.reason === "auth_required", "Authentication must be required."),
          ...expect(calls.read === 0 && calls.directDelete === 0, "Unauthenticated request must not reach persistence."),
        ];
      },
    },
  ];
}

export async function runSimulationDraftDeletionExecutionValidation() {
  const results = [];
  for (const validationCase of cases()) {
    try {
      const issues = await validationCase.run();
      results.push({ caseId: validationCase.caseId, passed: issues.length === 0, failed: issues.length > 0, issues });
    } catch {
      results.push({ caseId: validationCase.caseId, passed: false, failed: true, issues: ["Validation case threw."] });
    }
  }
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  return { passed: failed === 0, failed: failed > 0, cases: results, summary: { total: results.length, passed, failed } };
}
