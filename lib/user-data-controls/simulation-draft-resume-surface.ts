import { readServerAuthSession } from "../auth/session";
import type { LevioAuthRuntimeContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  updateSimulationDraft,
  type PersistenceRuntimeWiring,
  type SimulationDraftRow,
  type SupabaseSimulationDraftRetentionProvider,
  type SupabaseSimulationDraftSaveProvider,
} from "../persistence-runtime";
import {
  enforceExpiredSimulationDraftRetention,
  evaluateSimulationDraftRetentionState,
} from "./simulation-draft-retention-enforcement";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SimulationDraftResumeState =
  | { status: "active" | "warning_window"; draftId: string; draftText: string; expiresAt: string }
  | { status: "invalid_id" | "deleted_or_absent" | "expired" | "restricted" | "persistence_error"; message: string };

type SurfaceInput = {
  draftId: string;
  authContext?: LevioAuthRuntimeContext | null;
  runtime?: PersistenceRuntimeWiring;
  provider?: SupabaseSimulationDraftSaveProvider & SupabaseSimulationDraftRetentionProvider;
  serverNow?: string;
};

function unavailable(status: Exclude<SimulationDraftResumeState["status"], "active" | "warning_window">, message: string): SimulationDraftResumeState {
  return { status, message };
}

function isRestricted(draft: SimulationDraftRow): boolean {
  return draft.draft_status === "restricted" || draft.deletion_state === "restricted" ||
    draft.deletion_state === "retained_legal_exception" || Boolean(draft.legal_hold_reason);
}

export async function readSimulationDraftResumeSurface(input: SurfaceInput): Promise<SimulationDraftResumeState> {
  const draftId = input.draftId.trim();
  if (!UUID_PATTERN.test(draftId)) return unavailable("invalid_id", "El identificador del borrador no es válido.");

  const authContext = input.authContext ?? await readServerAuthSession();
  if (authContext.identityState !== "authenticated") return unavailable("persistence_error", "Inicia sesión para abrir este borrador.");

  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();
  if (runtime.status !== "ready") return unavailable("persistence_error", "No se pudo preparar el borrador.");
  const provider = input.provider ?? runtime.providerAdapter as SupabaseSimulationDraftSaveProvider & SupabaseSimulationDraftRetentionProvider;
  if (typeof provider.readSimulationDraft !== "function") return unavailable("persistence_error", "No se pudo preparar el borrador.");

  const preflight = await runtime.preflight({ operation: "read_simulation_draft", authContext });
  if (preflight.status === "blocked") return unavailable("persistence_error", "No se pudo validar el propietario del borrador.");
  const read = await provider.readSimulationDraft({ draftId, ownerPrincipalId: preflight.principalId });
  if (read.status === "failed") return unavailable("persistence_error", "No se pudo leer el borrador.");
  if (read.status === "not_found") return unavailable("deleted_or_absent", "El borrador no existe o no está disponible.");
  const draft = read.draft;
  if (draft.owner_principal_id !== preflight.principalId || draft.owner_principal_type !== "registered_user") {
    return unavailable("deleted_or_absent", "El borrador no existe o no está disponible.");
  }
  if (isRestricted(draft)) return unavailable("restricted", "Este borrador está restringido y no se puede editar.");

  const now = new Date(input.serverNow ?? Date.now()).toISOString();
  const evaluation = evaluateSimulationDraftRetentionState({ draft, now });
  if (evaluation.status === "invalid") return unavailable("persistence_error", "No se pudo validar la retención del borrador.");
  if (evaluation.state === "expired") {
    const result = await enforceExpiredSimulationDraftRetention({ draftId, authContext, runtime, retentionProvider: provider, serverNow: now });
    return result.status === "deleted" || result.status === "deleted_or_absent"
      ? unavailable("expired", "El borrador ha caducado y su contenido ya no está disponible.")
      : unavailable(result.status === "restricted" ? "restricted" : "persistence_error", result.status === "restricted" ? "Este borrador está restringido." : "No se pudo aplicar la retención del borrador.");
  }
  if (evaluation.state === "deleted_or_absent") return unavailable("deleted_or_absent", "El borrador no existe o no está disponible.");

  return { status: evaluation.state === "warning_window" ? "warning_window" : "active", draftId, draftText: draft.draft_text_snapshot ?? "", expiresAt: evaluation.expiresAt! };
}

export async function saveSimulationDraftResumeSurface(input: SurfaceInput & { draftText: string }): Promise<
  | { status: "saved" | "unchanged"; expiresAt: string }
  | { status: "blocked"; message: string }
> {
  const state = await readSimulationDraftResumeSurface(input);
  if ("message" in state) return { status: "blocked", message: state.message };
  const normalizedIncoming = input.draftText.trim();
  if (normalizedIncoming === state.draftText.trim()) return { status: "unchanged", expiresAt: state.expiresAt };

  const authContext = input.authContext ?? await readServerAuthSession();
  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();
  if (authContext.identityState !== "authenticated" || runtime.status !== "ready") return { status: "blocked", message: "No se pudo guardar el borrador." };
  const provider = input.provider ?? runtime.providerAdapter as SupabaseSimulationDraftSaveProvider & SupabaseSimulationDraftRetentionProvider;
  const preflight = await runtime.preflight({ operation: "read_simulation_draft", authContext });
  if (preflight.status === "blocked") return { status: "blocked", message: "No se pudo validar el propietario del borrador." };
  const result = await updateSimulationDraft({
    authContext,
    draft: { draft_id: state.draftId, owner_principal_id: preflight.principalId, owner_principal_type: "registered_user" },
    draftText: normalizedIncoming,
    runtime,
    saveProvider: provider,
    config: { enabled: true },
    serverConfirmedChangeAt: input.serverNow ?? new Date().toISOString(),
  });
  if (result.status !== "saved") return { status: "blocked", message: "No se pudo guardar el borrador." };
  return { status: "saved", expiresAt: result.draft.expires_at };
}
