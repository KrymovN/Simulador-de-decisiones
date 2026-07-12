import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  type LevioPrincipalRow,
  type SimulationDraftRow,
  type SupabaseSimulationDraftRetentionProvider,
} from "../persistence-runtime";
import {
  enforceExpiredSimulationDraftRetention,
  evaluateSimulationDraftRetentionState,
  parseSimulationDraftRetentionRequest,
} from "./simulation-draft-retention-enforcement";

type ValidationCase = {
  caseId: string;
  run: () => Promise<string[]> | string[];
};

export type SimulationDraftRetentionEnforcementValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: Array<{
    caseId: string;
    passed: boolean;
    failed: boolean;
    issues: string[];
  }>;
  summary: { total: number; passed: number; failed: number };
};

const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const draftId = "6dd4510d-a549-4113-8d39-666666666666";
const serverNow = "2026-07-12T12:00:00.000Z";

const authenticatedContext: LevioSessionContext = {
  identityState: "authenticated",
  principal: {
    principalId: `stage4_1b_registered:${providerReference}`,
    principalType: "registered_user",
    providerReference: `supabase:${providerReference}`,
  },
  sessionId: "stage_7_retention_validation_session",
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
    draft_payload: { text: "validation draft" },
    draft_text_snapshot: "validation draft",
    clarification_answers_snapshot: null,
    structured_context_snapshot: null,
    language: "es",
    autosave_enabled: true,
    originating_surface: "validation",
    converted_record_id: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-12T12:00:00.000Z",
    last_autosaved_at: "2026-06-12T12:00:00.000Z",
    expires_at: "2026-07-12T12:00:00.000Z",
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

type ProviderCalls = {
  resolve: number;
  read: number;
  delete: number;
  deleteInputs: Array<{
    draftId: string;
    ownerPrincipalId: string;
    evaluatedAt: string;
    deletedAt: string;
  }>;
};

function provider(input: {
  row?: SimulationDraftRow;
  readStatus?: "found" | "not_found" | "failed";
  deleteStatus?: "deleted" | "not_found" | "failed";
  calls: ProviderCalls;
}): SupabaseSimulationDraftRetentionProvider {
  return {
    providerId: "supabase",
    executionBoundary: "server_only",
    async resolvePrincipalByProviderReference() {
      input.calls.resolve += 1;
      return resolvedPrincipal;
    },
    async readSimulationDraft() {
      input.calls.read += 1;
      if (input.readStatus === "failed") return { status: "failed" };
      if (input.readStatus === "not_found") return { status: "not_found" };
      return { status: "found", draft: input.row ?? draft() };
    },
    async deleteExpiredSimulationDraft(deleteInput) {
      input.calls.delete += 1;
      input.calls.deleteInputs.push(deleteInput);
      if (input.deleteStatus === "failed") return { status: "failed" };
      if (input.deleteStatus === "not_found") return { status: "not_found" };
      const source = input.row ?? draft();
      return {
        status: "deleted",
        draft: draft({
          ...source,
          draft_payload: {},
          draft_text_snapshot: null,
          clarification_answers_snapshot: null,
          structured_context_snapshot: null,
          autosave_enabled: false,
          draft_status: "deleted",
          deletion_state: "deleted",
          deleted_at: deleteInput.deletedAt,
          export_eligible: false,
        }),
      };
    },
  };
}

function calls(): ProviderCalls {
  return { resolve: 0, read: 0, delete: 0, deleteInputs: [] };
}

function issueUnless(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

async function execute(input: {
  row?: SimulationDraftRow;
  readStatus?: "found" | "not_found" | "failed";
  deleteStatus?: "deleted" | "not_found" | "failed";
  authContext?: LevioAuthRuntimeContext;
  unsafeInput?: Record<string, unknown>;
}) {
  const providerCalls = calls();
  const retentionProvider = provider({ ...input, calls: providerCalls });
  const runtime = initializePersistenceRuntimeWiring({ providerAdapter: retentionProvider });
  const request = {
    draftId,
    authContext: input.authContext ?? authenticatedContext,
    runtime,
    retentionProvider,
    serverNow,
    ...(input.unsafeInput ?? {}),
  };
  const result = await enforceExpiredSimulationDraftRetention(request);
  return { result, providerCalls };
}

function validationCases(): ValidationCase[] {
  return [
    {
      caseId: "request_accepts_exact_draft_id",
      run: () => issueUnless(
        parseSimulationDraftRetentionRequest({ draftId }).status === "ready",
        "Exact one-draft request must be accepted.",
      ),
    },
    {
      caseId: "request_rejects_extra_or_owner_authority",
      run: () => [
        ...issueUnless(parseSimulationDraftRetentionRequest({}).status === "blocked", "Empty request must fail."),
        ...issueUnless(parseSimulationDraftRetentionRequest({ draftId, ownerPrincipalId: principalId }).status === "blocked", "Owner authority must fail."),
        ...issueUnless(parseSimulationDraftRetentionRequest({ draftId, draftIds: [draftId] }).status === "blocked", "Bulk input must fail."),
      ],
    },
    {
      caseId: "request_rejects_malformed_identifier",
      run: () => issueUnless(
        parseSimulationDraftRetentionRequest({ draftId: "not-a-uuid" }).status === "blocked",
        "Malformed identifier must fail.",
      ),
    },
    {
      caseId: "warning_and_expiration_boundaries",
      run: () => {
        const row = draft({ expires_at: "2026-07-12T12:00:00.000Z" });
        const states = [
          evaluateSimulationDraftRetentionState({ draft: row, now: "2026-07-05T11:59:59.999Z" }),
          evaluateSimulationDraftRetentionState({ draft: row, now: "2026-07-05T12:00:00.000Z" }),
          evaluateSimulationDraftRetentionState({ draft: row, now: "2026-07-10T12:00:00.000Z" }),
          evaluateSimulationDraftRetentionState({ draft: row, now: "2026-07-12T12:00:00.000Z" }),
          evaluateSimulationDraftRetentionState({ draft: row, now: "2026-07-12T12:00:00.001Z" }),
        ];
        return issueUnless(
          states.map((state) => state.status === "evaluated" ? state.state : "invalid").join(",") ===
            "not_due,warning_window,warning_window,expired,expired",
          "Warning/expiration boundaries changed.",
        );
      },
    },
    {
      caseId: "deleted_or_absent_evaluator_state",
      run: () => [
        ...issueUnless(evaluateSimulationDraftRetentionState({ draft: null, now: serverNow }).status === "evaluated", "Absent draft must evaluate safely."),
        ...issueUnless(
          evaluateSimulationDraftRetentionState({ draft: draft({ draft_status: "deleted", deletion_state: "deleted" }), now: serverNow }).status === "evaluated",
          "Deleted draft must evaluate safely.",
        ),
      ],
    },
    {
      caseId: "unauthenticated_rejected_before_provider",
      run: async () => {
        const { result, providerCalls } = await execute({ authContext: signedOutContext });
        return [
          ...issueUnless(result.status === "blocked" && result.reason === "auth_required", "Auth must be required."),
          ...issueUnless(providerCalls.read === 0 && providerCalls.delete === 0, "Unauthenticated request must not reach persistence."),
        ];
      },
    },
    {
      caseId: "direct_client_owner_authority_rejected",
      run: async () => {
        const { result, providerCalls } = await execute({ unsafeInput: { ownerPrincipalId: principalId } });
        return [
          ...issueUnless(result.status === "blocked" && result.reason === "invalid_request", "Client owner authority must fail."),
          ...issueUnless(providerCalls.read === 0 && providerCalls.delete === 0, "Rejected owner input must not reach persistence."),
        ];
      },
    },
    {
      caseId: "not_due_does_not_mutate",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ expires_at: "2026-07-20T12:00:00.000Z" }) });
        return [
          ...issueUnless(result.status === "not_due", "Expected not_due state."),
          ...issueUnless(providerCalls.delete === 0, "not_due must not mutate."),
        ];
      },
    },
    {
      caseId: "warning_window_does_not_mutate",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ expires_at: "2026-07-15T12:00:00.000Z" }) });
        return [
          ...issueUnless(result.status === "warning_window", "Expected warning_window state."),
          ...issueUnless(providerCalls.delete === 0, "warning_window must not mutate."),
        ];
      },
    },
    {
      caseId: "expired_owner_draft_deleted_once",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ expires_at: "2026-07-12T11:59:59.000Z" }) });
        return [
          ...issueUnless(result.status === "deleted", "Expired owner draft must transition to deleted."),
          ...issueUnless(providerCalls.delete === 1, "Exactly one draft mutation is allowed."),
          ...issueUnless(providerCalls.deleteInputs[0]?.ownerPrincipalId === principalId, "Canonical principal must scope deletion."),
          ...issueUnless(providerCalls.deleteInputs[0]?.evaluatedAt === serverNow, "Server time must drive atomic expiry guard."),
        ];
      },
    },
    {
      caseId: "missing_or_cross_owner_is_safe_absence",
      run: async () => {
        const { result, providerCalls } = await execute({ readStatus: "not_found" });
        return [
          ...issueUnless(result.status === "deleted_or_absent", "Missing/cross-owner draft must be indistinguishable."),
          ...issueUnless(providerCalls.delete === 0, "Safe absence must not mutate."),
        ];
      },
    },
    {
      caseId: "already_deleted_is_idempotent",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ draft_status: "deleted", deletion_state: "deleted", deleted_at: serverNow }) });
        return [
          ...issueUnless(result.status === "deleted_or_absent", "Repeated request must be safely absent."),
          ...issueUnless(providerCalls.delete === 0, "Repeated request must not mutate."),
        ];
      },
    },
    {
      caseId: "restricted_state_does_not_mutate",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ draft_status: "restricted", deletion_state: "restricted" }) });
        return [
          ...issueUnless(result.status === "restricted", "Restricted draft must return controlled state."),
          ...issueUnless(providerCalls.delete === 0, "Restricted draft must not mutate."),
        ];
      },
    },
    {
      caseId: "legal_hold_does_not_mutate",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ legal_hold_reason: "validation_hold" }) });
        return [
          ...issueUnless(result.status === "restricted", "Legal-hold draft must return controlled state."),
          ...issueUnless(providerCalls.delete === 0, "Legal-hold draft must not mutate."),
        ];
      },
    },
    {
      caseId: "retained_legal_exception_does_not_mutate",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ deletion_state: "retained_legal_exception" }) });
        return [
          ...issueUnless(result.status === "restricted", "Retained legal exception must return controlled state."),
          ...issueUnless(providerCalls.delete === 0, "Retained legal exception must not mutate."),
        ];
      },
    },
    {
      caseId: "read_failure_fails_closed",
      run: async () => {
        const { result, providerCalls } = await execute({ readStatus: "failed" });
        return [
          ...issueUnless(result.status === "blocked" && result.reason === "read_failed", "Read failure must fail closed."),
          ...issueUnless(providerCalls.delete === 0, "Read failure must not mutate."),
        ];
      },
    },
    {
      caseId: "delete_failure_fails_closed",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ expires_at: "2026-07-01T00:00:00.000Z" }), deleteStatus: "failed" });
        return [
          ...issueUnless(result.status === "blocked" && result.reason === "delete_failed", "Delete failure must fail closed."),
          ...issueUnless(providerCalls.delete === 1, "Delete failure must not retry or bulk mutate."),
        ];
      },
    },
    {
      caseId: "atomic_guard_race_is_safe_absence",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ expires_at: "2026-07-01T00:00:00.000Z" }), deleteStatus: "not_found" });
        return [
          ...issueUnless(result.status === "deleted_or_absent", "Guarded race must become safe absence."),
          ...issueUnless(providerCalls.delete === 1, "Guarded mutation must execute at most once."),
        ];
      },
    },
    {
      caseId: "unsupported_retention_rule_fails_closed",
      run: async () => {
        const { result, providerCalls } = await execute({ row: draft({ retention_rule: "unknown_policy" }) });
        return [
          ...issueUnless(result.status === "blocked" && result.reason === "retention_state_invalid", "Unknown policy must fail closed."),
          ...issueUnless(providerCalls.delete === 0, "Unknown policy must not mutate."),
        ];
      },
    },
  ];
}

export async function runSimulationDraftRetentionEnforcementValidation(): Promise<SimulationDraftRetentionEnforcementValidationResult> {
  const results: SimulationDraftRetentionEnforcementValidationResult["cases"] = [];

  for (const validationCase of validationCases()) {
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
        issues: ["Validation case threw an uncaught exception."],
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
