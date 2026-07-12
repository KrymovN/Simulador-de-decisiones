import { readServerAuthSession } from "../auth/session";
import type { LevioAuthRuntimeContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  type PersistenceRuntimeWiring,
  type SimulationDraftRow,
  type SupabaseSimulationDraftRetentionProvider,
} from "../persistence-runtime";

export const SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION =
  "stage-7-explicit-simulation-draft-retention-enforcement.1" as const;

export const SIMULATION_DRAFT_WARNING_DAYS = 7;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLIENT_OWNER_KEYS = [
  "principalId",
  "principal_id",
  "ownerPrincipalId",
  "owner_principal_id",
  "ownerPrincipalType",
  "owner_principal_type",
  "providerReference",
  "provider_reference",
] as const;

export type SimulationDraftRetentionState =
  | "not_due"
  | "warning_window"
  | "expired"
  | "deleted_or_absent";

export type SimulationDraftRetentionEvaluation =
  | {
      status: "evaluated";
      state: SimulationDraftRetentionState;
      expiresAt?: string;
      warningStartsAt?: string;
    }
  | { status: "invalid" };

export type SimulationDraftRetentionResult =
  | {
      status: "not_due" | "warning_window";
      version: typeof SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION;
      expiresAt: string;
      warningStartsAt: string;
      mutation: "none";
    }
  | {
      status: "deleted";
      version: typeof SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION;
      retentionState: "expired";
      mutation: "draft_lifecycle_deleted";
    }
  | {
      status: "deleted_or_absent";
      version: typeof SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION;
      mutation: "none";
    }
  | {
      status: "restricted";
      version: typeof SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION;
      mutation: "none";
    }
  | {
      status: "blocked";
      version: typeof SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION;
      reason:
        | "auth_required"
        | "invalid_request"
        | "runtime_not_ready"
        | "read_failed"
        | "retention_state_invalid"
        | "delete_failed";
      message: string;
    };

export type SimulationDraftRetentionRequestParseResult =
  | { status: "ready"; draftId: string }
  | Extract<SimulationDraftRetentionResult, { status: "blocked" }>;

type EnforcementInput = {
  draftId: string;
  authContext?: LevioAuthRuntimeContext | null;
  runtime?: PersistenceRuntimeWiring;
  retentionProvider?: SupabaseSimulationDraftRetentionProvider;
  serverNow?: string;
};

type EvaluationDraft = Pick<
  SimulationDraftRow,
  "draft_status" | "deletion_state" | "expires_at"
>;

function blocked(
  reason: Extract<SimulationDraftRetentionResult, { status: "blocked" }>["reason"],
  message: string,
): Extract<SimulationDraftRetentionResult, { status: "blocked" }> {
  return {
    status: "blocked",
    version: SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION,
    reason,
    message,
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasClientOwnerAuthority(input: unknown): boolean {
  if (!isPlainRecord(input)) return false;
  return CLIENT_OWNER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function supportsRetentionProvider(
  value: unknown,
): value is SupabaseSimulationDraftRetentionProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "readSimulationDraft" in value &&
    typeof value.readSimulationDraft === "function" &&
    "deleteExpiredSimulationDraft" in value &&
    typeof value.deleteExpiredSimulationDraft === "function"
  );
}

function subtractUtcCalendarDays(value: Date, days: number): Date {
  const result = new Date(value.getTime());
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

export function parseSimulationDraftRetentionRequest(
  value: unknown,
): SimulationDraftRetentionRequestParseResult {
  if (!isPlainRecord(value)) {
    return blocked("invalid_request", "La solicitud de retención del borrador no es válida.");
  }

  const keys = Object.keys(value);
  if (
    keys.length !== 1 ||
    keys[0] !== "draftId" ||
    typeof value.draftId !== "string" ||
    !UUID_PATTERN.test(value.draftId.trim())
  ) {
    return blocked("invalid_request", "La solicitud de retención del borrador no es válida.");
  }

  return { status: "ready", draftId: value.draftId.trim() };
}

export function evaluateSimulationDraftRetentionState(input: {
  draft: EvaluationDraft | null;
  now: string;
}): SimulationDraftRetentionEvaluation {
  if (
    input.draft === null ||
    input.draft.draft_status !== "active" ||
    input.draft.deletion_state !== "active"
  ) {
    return { status: "evaluated", state: "deleted_or_absent" };
  }

  const expiresAt = new Date(input.draft.expires_at);
  const now = new Date(input.now);
  if (!Number.isFinite(expiresAt.getTime()) || !Number.isFinite(now.getTime())) {
    return { status: "invalid" };
  }

  const warningStartsAt = subtractUtcCalendarDays(
    expiresAt,
    SIMULATION_DRAFT_WARNING_DAYS,
  );

  if (now.getTime() >= expiresAt.getTime()) {
    return {
      status: "evaluated",
      state: "expired",
      expiresAt: expiresAt.toISOString(),
      warningStartsAt: warningStartsAt.toISOString(),
    };
  }

  return {
    status: "evaluated",
    state:
      now.getTime() >= warningStartsAt.getTime() ? "warning_window" : "not_due",
    expiresAt: expiresAt.toISOString(),
    warningStartsAt: warningStartsAt.toISOString(),
  };
}

function isRestrictedDraft(draft: SimulationDraftRow): boolean {
  return (
    draft.draft_status === "restricted" ||
    draft.deletion_state === "restricted" ||
    draft.deletion_state === "retained_legal_exception" ||
    Boolean(draft.legal_hold_reason)
  );
}

export async function enforceExpiredSimulationDraftRetention(
  input: EnforcementInput,
): Promise<SimulationDraftRetentionResult> {
  if (hasClientOwnerAuthority(input) || !UUID_PATTERN.test(input.draftId.trim())) {
    return blocked("invalid_request", "La solicitud de retención del borrador no es válida.");
  }

  const serverNow = new Date(input.serverNow ?? Date.now());
  if (!Number.isFinite(serverNow.getTime())) {
    return blocked("invalid_request", "No se pudo validar el tiempo de retención.");
  }
  const evaluatedAt = serverNow.toISOString();

  const authContext = input.authContext ?? await readServerAuthSession();
  if (authContext.identityState !== "authenticated") {
    return blocked("auth_required", "Inicia sesión para revisar este borrador.");
  }

  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();
  if (runtime.status !== "ready") {
    return blocked("runtime_not_ready", "No se pudo preparar el control de retención.");
  }

  const retentionProvider = input.retentionProvider ?? runtime.providerAdapter;
  if (!supportsRetentionProvider(retentionProvider)) {
    return blocked("runtime_not_ready", "El proveedor no admite este control de retención.");
  }

  const preflight = await runtime.preflight({ operation: "resolve_principal", authContext });
  if (preflight.status === "blocked") {
    return blocked("runtime_not_ready", "No se pudo validar el propietario del borrador.");
  }

  const read = await retentionProvider.readSimulationDraft({
    draftId: input.draftId.trim(),
    ownerPrincipalId: preflight.principalId,
  });

  if (read.status === "failed") {
    return blocked("read_failed", "No se pudo leer el borrador de forma controlada.");
  }

  if (read.status === "not_found") {
    return {
      status: "deleted_or_absent",
      version: SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION,
      mutation: "none",
    };
  }

  const draft = read.draft;
  if (
    draft.owner_principal_id !== preflight.principalId ||
    draft.owner_principal_type !== "registered_user"
  ) {
    return blocked("read_failed", "El resultado no respetó el ámbito del propietario.");
  }

  if (isRestrictedDraft(draft)) {
    return {
      status: "restricted",
      version: SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION,
      mutation: "none",
    };
  }

  if (draft.retention_rule !== "draft_short_lifecycle") {
    return blocked("retention_state_invalid", "La política de retención no es compatible.");
  }

  const evaluation = evaluateSimulationDraftRetentionState({
    draft,
    now: evaluatedAt,
  });

  if (evaluation.status === "invalid") {
    return blocked("retention_state_invalid", "El estado temporal del borrador no es válido.");
  }

  if (evaluation.state === "deleted_or_absent") {
    return {
      status: "deleted_or_absent",
      version: SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION,
      mutation: "none",
    };
  }

  if (evaluation.state === "not_due" || evaluation.state === "warning_window") {
    return {
      status: evaluation.state,
      version: SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION,
      expiresAt: evaluation.expiresAt!,
      warningStartsAt: evaluation.warningStartsAt!,
      mutation: "none",
    };
  }

  const deletion = await retentionProvider.deleteExpiredSimulationDraft({
    draftId: input.draftId.trim(),
    ownerPrincipalId: preflight.principalId,
    evaluatedAt,
    deletedAt: evaluatedAt,
  });

  if (deletion.status === "failed") {
    return blocked("delete_failed", "No se pudo eliminar el borrador de forma controlada.");
  }

  if (deletion.status === "not_found") {
    return {
      status: "deleted_or_absent",
      version: SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION,
      mutation: "none",
    };
  }

  if (
    deletion.draft.owner_principal_id !== preflight.principalId ||
    deletion.draft.owner_principal_type !== "registered_user" ||
    deletion.draft.draft_status !== "deleted" ||
    deletion.draft.deletion_state !== "deleted" ||
    deletion.draft.deleted_at === null ||
    deletion.draft.export_eligible !== false
  ) {
    return blocked("delete_failed", "El resultado no respetó el lifecycle del borrador.");
  }

  return {
    status: "deleted",
    version: SIMULATION_DRAFT_RETENTION_ENFORCEMENT_VERSION,
    retentionState: "expired",
    mutation: "draft_lifecycle_deleted",
  };
}
