import type { LevioAuthRuntimeContext } from "../auth/types";
import { readServerAuthSession } from "../auth/session";
import {
  initializePersistenceRuntimeWiring,
  type PersistenceRuntimeWiring,
  type SimulationDraftRow,
  type SupabaseSimulationDraftDeleteProvider,
  type SupabaseSimulationDraftRetentionProvider,
} from "../persistence-runtime";
import {
  enforceExpiredSimulationDraftRetention,
  evaluateSimulationDraftRetentionState,
} from "./simulation-draft-retention-enforcement";

export const SIMULATION_DRAFT_DELETION_EXECUTION_VERSION =
  "stage-7-owner-scoped-simulation-draft-deletion.1" as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLIENT_OWNER_KEYS = [
  "principalId",
  "principal_id",
  "ownerPrincipalId",
  "owner_principal_id",
  "providerReference",
  "provider_reference",
] as const;

type DraftDeletionInput = {
  draftId: string;
  authContext?: LevioAuthRuntimeContext | null;
  runtime?: PersistenceRuntimeWiring;
  deleteProvider?: SupabaseSimulationDraftDeleteProvider & SupabaseSimulationDraftRetentionProvider;
  deletedAt?: string;
};

export type DraftDeletionResult =
  | { status: "deleted" | "already_absent"; version: typeof SIMULATION_DRAFT_DELETION_EXECUTION_VERSION }
  | {
      status: "blocked";
      version: typeof SIMULATION_DRAFT_DELETION_EXECUTION_VERSION;
      reason: "auth_required" | "invalid_request" | "runtime_not_ready" | "delete_restricted" | "delete_failed";
      message: string;
    };

function blocked(reason: Extract<DraftDeletionResult, { status: "blocked" }>["reason"], message: string): DraftDeletionResult {
  return { status: "blocked", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION, reason, message };
}

function hasClientOwnerAuthority(input: unknown): boolean {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return false;
  return CLIENT_OWNER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function supportsDraftDeletion(
  value: unknown,
): value is SupabaseSimulationDraftDeleteProvider & SupabaseSimulationDraftRetentionProvider {
  return typeof value === "object" && value !== null &&
    "readSimulationDraft" in value && typeof value.readSimulationDraft === "function" &&
    "deleteSimulationDraft" in value && typeof value.deleteSimulationDraft === "function" &&
    "deleteExpiredSimulationDraft" in value && typeof value.deleteExpiredSimulationDraft === "function";
}

function isRestrictedDraft(draft: SimulationDraftRow): boolean {
  return draft.draft_status === "restricted" ||
    draft.deletion_state === "restricted" ||
    draft.deletion_state === "retained_legal_exception" ||
    Boolean(draft.legal_hold_reason);
}

export async function deleteOwnedSimulationDraft(input: DraftDeletionInput): Promise<DraftDeletionResult> {
  if (hasClientOwnerAuthority(input) || !UUID_PATTERN.test(input.draftId.trim())) {
    return blocked("invalid_request", "La solicitud de eliminación del borrador no es válida.");
  }

  const authContext = input.authContext ?? await readServerAuthSession();
  if (authContext.identityState !== "authenticated") {
    return blocked("auth_required", "Inicia sesión para eliminar este borrador.");
  }

  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();
  if (runtime.status !== "ready") {
    return blocked("runtime_not_ready", "No se pudo preparar la eliminación del borrador.");
  }

  const deleteProvider = input.deleteProvider ?? runtime.providerAdapter;
  if (!supportsDraftDeletion(deleteProvider)) {
    return blocked("runtime_not_ready", "El proveedor no admite la eliminación del borrador.");
  }

  const preflight = await runtime.preflight({ operation: "resolve_principal", authContext });
  if (preflight.status === "blocked") {
    return blocked("runtime_not_ready", "No se pudo validar el propietario del borrador.");
  }

  const draftId = input.draftId.trim();
  const deletedAt = input.deletedAt ?? new Date().toISOString();
  const read = await deleteProvider.readSimulationDraft({
    draftId,
    ownerPrincipalId: preflight.principalId,
  });

  if (read.status === "failed") {
    return blocked("delete_failed", "No se pudo validar el borrador antes de eliminarlo.");
  }

  if (read.status === "not_found") {
    return { status: "already_absent", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
  }

  if (
    read.draft.owner_principal_id !== preflight.principalId ||
    read.draft.owner_principal_type !== "registered_user"
  ) {
    return { status: "already_absent", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
  }

  if (isRestrictedDraft(read.draft)) {
    return blocked("delete_restricted", "Este borrador está restringido y no se puede eliminar.");
  }

  const retention = evaluateSimulationDraftRetentionState({ draft: read.draft, now: deletedAt });
  if (retention.status === "invalid") {
    return blocked("delete_failed", "No se pudo validar la retención del borrador.");
  }

  if (retention.state === "deleted_or_absent") {
    return { status: "already_absent", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
  }

  if (retention.state === "expired") {
    const expired = await enforceExpiredSimulationDraftRetention({
      draftId,
      authContext,
      runtime,
      retentionProvider: deleteProvider,
      serverNow: deletedAt,
    });
    if (expired.status === "deleted") {
      return { status: "deleted", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
    }
    if (expired.status === "deleted_or_absent") {
      return { status: "already_absent", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
    }
    if (expired.status === "restricted") {
      return blocked("delete_restricted", "Este borrador está restringido y no se puede eliminar.");
    }
    return blocked("delete_failed", "No se pudo aplicar la retención del borrador.");
  }

  const deletion = await deleteProvider.deleteSimulationDraft({
    draftId,
    ownerPrincipalId: preflight.principalId,
    deletedAt,
  });

  if (deletion.status === "failed") {
    return blocked("delete_failed", "No se pudo eliminar el borrador de forma controlada.");
  }

  if (deletion.status === "not_found") {
    const afterRace = await deleteProvider.readSimulationDraft({
      draftId,
      ownerPrincipalId: preflight.principalId,
    });
    if (afterRace.status === "failed") {
      return blocked("delete_failed", "No se pudo confirmar la eliminación del borrador.");
    }
    if (afterRace.status === "not_found") {
      return { status: "already_absent", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
    }
    if (isRestrictedDraft(afterRace.draft)) {
      return blocked("delete_restricted", "Este borrador está restringido y no se puede eliminar.");
    }
    if (
      afterRace.draft.draft_status === "deleted" &&
      afterRace.draft.deletion_state === "deleted" &&
      afterRace.draft.deleted_at !== null &&
      afterRace.draft.export_eligible === false
    ) {
      return { status: "already_absent", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
    }
    return blocked("delete_failed", "El borrador cambió antes de completar la eliminación.");
  }

  if (
    deletion.draft.owner_principal_id !== preflight.principalId ||
    deletion.draft.owner_principal_type !== "registered_user" ||
    deletion.draft.draft_status !== "deleted" ||
    deletion.draft.deletion_state !== "deleted" ||
    deletion.draft.deleted_at === null ||
    deletion.draft.export_eligible !== false ||
    Object.keys(deletion.draft.draft_payload).length !== 0 ||
    deletion.draft.draft_text_snapshot !== null ||
    deletion.draft.clarification_answers_snapshot !== null ||
    deletion.draft.structured_context_snapshot !== null ||
    deletion.draft.autosave_enabled !== false
  ) {
    return blocked("delete_failed", "El resultado de eliminación no respetó el ámbito del propietario.");
  }

  return { status: "deleted", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
}
