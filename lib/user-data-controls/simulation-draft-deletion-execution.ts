import type { LevioAuthRuntimeContext } from "../auth/types";
import { readServerAuthSession } from "../auth/session";
import {
  initializePersistenceRuntimeWiring,
  type PersistenceRuntimeWiring,
  type SupabaseSimulationDraftDeleteProvider,
} from "../persistence-runtime";

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
  deleteProvider?: SupabaseSimulationDraftDeleteProvider;
  deletedAt?: string;
};

export type DraftDeletionResult =
  | { status: "deleted" | "already_absent"; version: typeof SIMULATION_DRAFT_DELETION_EXECUTION_VERSION }
  | {
      status: "blocked";
      version: typeof SIMULATION_DRAFT_DELETION_EXECUTION_VERSION;
      reason: "auth_required" | "invalid_request" | "runtime_not_ready" | "delete_failed";
      message: string;
    };

function blocked(reason: Extract<DraftDeletionResult, { status: "blocked" }>["reason"], message: string): DraftDeletionResult {
  return { status: "blocked", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION, reason, message };
}

function hasClientOwnerAuthority(input: unknown): boolean {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return false;
  return CLIENT_OWNER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function supportsDraftDeletion(value: unknown): value is SupabaseSimulationDraftDeleteProvider {
  return typeof value === "object" && value !== null && "deleteSimulationDraft" in value &&
    typeof value.deleteSimulationDraft === "function";
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

  const deletion = await deleteProvider.deleteSimulationDraft({
    draftId: input.draftId.trim(),
    ownerPrincipalId: preflight.principalId,
    deletedAt: input.deletedAt ?? new Date().toISOString(),
  });

  if (deletion.status === "failed") {
    return blocked("delete_failed", "No se pudo eliminar el borrador de forma controlada.");
  }

  if (deletion.status === "not_found") {
    return { status: "already_absent", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
  }

  if (
    deletion.draft.owner_principal_id !== preflight.principalId ||
    deletion.draft.owner_principal_type !== "registered_user" ||
    deletion.draft.draft_status !== "deleted" ||
    deletion.draft.deletion_state !== "deleted" ||
    deletion.draft.deleted_at === null ||
    deletion.draft.export_eligible !== false
  ) {
    return blocked("delete_failed", "El resultado de eliminación no respetó el ámbito del propietario.");
  }

  return { status: "deleted", version: SIMULATION_DRAFT_DELETION_EXECUTION_VERSION };
}
