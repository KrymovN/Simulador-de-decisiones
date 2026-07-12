import type { LevioAuthRuntimeContext } from "../auth/types";
import type { SimulationDraftRow } from "./contracts";
import {
  initializePersistenceRuntimeWiring,
  type PersistenceRuntimeWiring,
} from "./runtime-wiring";
import type {
  SupabaseSimulationDraftInsertPayload,
  SupabaseSimulationDraftSaveProvider,
  SupabaseSimulationDraftUpdatePayload,
} from "./supabase-provider";

export const SIMULATION_DRAFT_PERSISTENCE_VERSION =
  "4.2K-simulation-draft-persistence.1" as const;

export type SimulationDraftPersistenceBlockedReason =
  | "persistence_disabled"
  | "runtime_not_ready"
  | "auth_context_not_authenticated"
  | "provider_draft_save_not_supported"
  | "principal_preflight_blocked"
  | "draft_payload_invalid"
  | "draft_read_failed"
  | "draft_save_failed"
  | "draft_update_failed";

export type SimulationDraftPersistenceEvidence = {
  stage: "4.2K";
  simulationDraftsOnly: true;
  savePathEnabled: true;
  updatePathEnabled: true;
  controlledRolloutRequired: true;
  runtimeWiringUsed: true;
  providerResolutionUsed: true;
  dashboardIntegrated: false;
  uiChanged: false;
  apiRouteChanged: false;
  authRuntimeChanged: false;
  schemaChanged: false;
  migrationsChanged: false;
  stage42LStarted: false;
  stage43Started: false;
  stage44Started: false;
  rollback: "disable_simulation_draft_persistence_or_remove_service_exports";
};

export type SimulationDraftPersistenceConfig = {
  enabled: boolean;
};

export type SimulationDraftReference = Pick<
  SimulationDraftRow,
  "draft_id" | "owner_principal_id" | "owner_principal_type"
>;

export type SimulationDraftSaveInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  draftPayload: Record<string, unknown>;
  draftText?: string;
  clarificationAnswers?: Record<string, unknown> | null;
  structuredContext?: Record<string, unknown> | null;
  language?: string;
  autosaveEnabled?: boolean;
  originatingSurface?: string;
  runtime?: PersistenceRuntimeWiring;
  saveProvider?: SupabaseSimulationDraftSaveProvider;
  config?: SimulationDraftPersistenceConfig;
};

export type SimulationDraftUpdateInput = {
  authContext: LevioAuthRuntimeContext | null | undefined;
  draft: SimulationDraftReference;
  draftPayload?: Record<string, unknown>;
  draftText?: string | null;
  clarificationAnswers?: Record<string, unknown> | null;
  structuredContext?: Record<string, unknown> | null;
  language?: string;
  autosaveEnabled?: boolean;
  markSaved?: boolean;
  lastAutosavedAt?: string | null;
  serverConfirmedChangeAt?: string;
  runtime?: PersistenceRuntimeWiring;
  saveProvider?: SupabaseSimulationDraftSaveProvider;
  config?: SimulationDraftPersistenceConfig;
};

export type SimulationDraftPersistenceResult =
  | {
      status: "saved";
      version: typeof SIMULATION_DRAFT_PERSISTENCE_VERSION;
      draft: SimulationDraftRow;
      principalId: string;
      evidence: SimulationDraftPersistenceEvidence;
    }
  | {
      status: "blocked";
      version: typeof SIMULATION_DRAFT_PERSISTENCE_VERSION;
      reason: SimulationDraftPersistenceBlockedReason;
      message: string;
      evidence: SimulationDraftPersistenceEvidence;
    };

type ConfigEnv = Record<string, string | undefined>;

function isEnabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function evidence(): SimulationDraftPersistenceEvidence {
  return {
    stage: "4.2K",
    simulationDraftsOnly: true,
    savePathEnabled: true,
    updatePathEnabled: true,
    controlledRolloutRequired: true,
    runtimeWiringUsed: true,
    providerResolutionUsed: true,
    dashboardIntegrated: false,
    uiChanged: false,
    apiRouteChanged: false,
    authRuntimeChanged: false,
    schemaChanged: false,
    migrationsChanged: false,
    stage42LStarted: false,
    stage43Started: false,
    stage44Started: false,
    rollback: "disable_simulation_draft_persistence_or_remove_service_exports",
  };
}

function blocked(
  reason: SimulationDraftPersistenceBlockedReason,
  message: string,
): SimulationDraftPersistenceResult {
  return {
    status: "blocked",
    version: SIMULATION_DRAFT_PERSISTENCE_VERSION,
    reason,
    message,
    evidence: evidence(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: string | null | undefined): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value?.trim();
  return trimmed || null;
}

export const SIMULATION_DRAFT_RETENTION_DAYS = 30;

type SimulationDraftContentSnapshot = Pick<
  SimulationDraftRow,
  | "draft_payload"
  | "draft_text_snapshot"
  | "clarification_answers_snapshot"
  | "structured_context_snapshot"
>;

export function calculateSimulationDraftExpiresAt(confirmedChangeAt: string): string | null {
  const confirmedChange = new Date(confirmedChangeAt);

  if (!Number.isFinite(confirmedChange.getTime())) {
    return null;
  }

  confirmedChange.setUTCDate(
    confirmedChange.getUTCDate() + SIMULATION_DRAFT_RETENTION_DAYS,
  );

  return confirmedChange.toISOString();
}

function jsonValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => jsonValuesEqual(value, right[index]))
    );
  }

  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) {
      return false;
    }

    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key, index) =>
          key === rightKeys[index] && jsonValuesEqual(left[key], right[key]),
      )
    );
  }

  return false;
}

function hasConfirmedContentChange(input: {
  currentDraft: SimulationDraftContentSnapshot;
  draftPayload?: Record<string, unknown>;
  draftText?: string | null;
  clarificationAnswers?: Record<string, unknown> | null;
  structuredContext?: Record<string, unknown> | null;
}): boolean {
  return (
    (input.draftPayload !== undefined &&
      !jsonValuesEqual(input.draftPayload, input.currentDraft.draft_payload)) ||
    (input.draftText !== undefined &&
      normalizeText(input.draftText) !==
        normalizeText(input.currentDraft.draft_text_snapshot)) ||
    (input.clarificationAnswers !== undefined &&
      !jsonValuesEqual(
        input.clarificationAnswers,
        input.currentDraft.clarification_answers_snapshot,
      )) ||
    (input.structuredContext !== undefined &&
      !jsonValuesEqual(
        input.structuredContext,
        input.currentDraft.structured_context_snapshot,
      ))
  );
}

function supportsSimulationDraftSaveProvider(
  value: unknown,
): value is SupabaseSimulationDraftSaveProvider {
  return (
    isRecord(value) &&
    typeof value.readSimulationDraft === "function" &&
    typeof value.saveSimulationDraft === "function" &&
    typeof value.updateSimulationDraft === "function"
  );
}

export function readSimulationDraftPersistenceConfig(
  env: ConfigEnv = process.env,
): SimulationDraftPersistenceConfig {
  return {
    enabled: isEnabledFlag(env.LEVIO_SIMULATION_DRAFT_PERSISTENCE_ENABLED),
  };
}

export function simulationDraftPersistenceEvidence(): SimulationDraftPersistenceEvidence {
  return evidence();
}

export function buildSimulationDraftInsertPayload(input: {
  ownerPrincipalId: string;
  draftPayload: Record<string, unknown>;
  draftText?: string;
  clarificationAnswers?: Record<string, unknown> | null;
  structuredContext?: Record<string, unknown> | null;
  language?: string;
  autosaveEnabled?: boolean;
  originatingSurface?: string;
  serverConfirmedChangeAt?: string;
}): SupabaseSimulationDraftInsertPayload | null {
  if (!input.ownerPrincipalId || !isRecord(input.draftPayload)) {
    return null;
  }

  const expiresAt = calculateSimulationDraftExpiresAt(
    input.serverConfirmedChangeAt ?? new Date().toISOString(),
  );

  if (!expiresAt) {
    return null;
  }

  return {
    owner_principal_id: input.ownerPrincipalId,
    owner_principal_type: "registered_user",
    draft_status: "active",
    draft_payload: input.draftPayload,
    draft_text_snapshot: normalizeText(input.draftText),
    clarification_answers_snapshot: input.clarificationAnswers ?? null,
    structured_context_snapshot: input.structuredContext ?? null,
    language: input.language ?? "es",
    autosave_enabled: input.autosaveEnabled ?? false,
    originating_surface: normalizeText(input.originatingSurface),
    expires_at: expiresAt,
    deletion_state: "active",
    retention_rule: "draft_short_lifecycle",
    export_eligible: true,
    schema_version: 1,
  };
}

export function buildSimulationDraftUpdatePayload(input: {
  currentDraft: SimulationDraftContentSnapshot;
  draftPayload?: Record<string, unknown>;
  draftText?: string | null;
  clarificationAnswers?: Record<string, unknown> | null;
  structuredContext?: Record<string, unknown> | null;
  language?: string;
  autosaveEnabled?: boolean;
  markSaved?: boolean;
  lastAutosavedAt?: string | null;
  serverConfirmedChangeAt?: string;
}): SupabaseSimulationDraftUpdatePayload | null {
  const payload: SupabaseSimulationDraftUpdatePayload = {};

  if (input.markSaved) {
    payload.draft_status = "saved";
  }

  if (input.draftPayload !== undefined) {
    if (!isRecord(input.draftPayload)) {
      return null;
    }

    payload.draft_payload = input.draftPayload;
  }

  if (input.draftText !== undefined) {
    payload.draft_text_snapshot = normalizeText(input.draftText);
  }

  if (input.clarificationAnswers !== undefined) {
    payload.clarification_answers_snapshot = input.clarificationAnswers;
  }

  if (input.structuredContext !== undefined) {
    payload.structured_context_snapshot = input.structuredContext;
  }

  if (input.language) {
    payload.language = input.language;
  }

  if (input.autosaveEnabled !== undefined) {
    payload.autosave_enabled = input.autosaveEnabled;
  }

  if (input.lastAutosavedAt !== undefined) {
    payload.last_autosaved_at = input.lastAutosavedAt;
  }

  if (hasConfirmedContentChange(input)) {
    const expiresAt = calculateSimulationDraftExpiresAt(
      input.serverConfirmedChangeAt ?? new Date().toISOString(),
    );

    if (!expiresAt) {
      return null;
    }

    payload.expires_at = expiresAt;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

async function resolveRuntimeAndProvider(input: {
  authContext: LevioAuthRuntimeContext | null | undefined;
  runtime?: PersistenceRuntimeWiring;
  saveProvider?: SupabaseSimulationDraftSaveProvider;
}): Promise<
  | {
      status: "ready";
      runtime: Extract<PersistenceRuntimeWiring, { status: "ready" }>;
      saveProvider: SupabaseSimulationDraftSaveProvider;
    }
  | SimulationDraftPersistenceResult
> {
  if (input.authContext?.identityState !== "authenticated") {
    return blocked(
      "auth_context_not_authenticated",
      "Simulation draft persistence requires an authenticated auth context.",
    );
  }

  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();

  if (runtime.status !== "ready") {
    return blocked("runtime_not_ready", "Persistence runtime wiring is not ready.");
  }

  const saveProvider = input.saveProvider ?? runtime.providerAdapter;

  if (!supportsSimulationDraftSaveProvider(saveProvider)) {
    return blocked(
      "provider_draft_save_not_supported",
      "Configured persistence provider does not support simulation draft saves.",
    );
  }

  return {
    status: "ready",
    runtime,
    saveProvider,
  };
}

export async function saveSimulationDraft(
  input: SimulationDraftSaveInput,
): Promise<SimulationDraftPersistenceResult> {
  const config = input.config ?? readSimulationDraftPersistenceConfig();

  if (!config.enabled) {
    return blocked(
      "persistence_disabled",
      "Simulation draft persistence is disabled by controlled rollout configuration.",
    );
  }

  const resolved = await resolveRuntimeAndProvider(input);

  if (resolved.status !== "ready") {
    return resolved;
  }

  const preflight = await resolved.runtime.preflight({
    operation: "resolve_principal",
    authContext: input.authContext,
  });

  if (preflight.status === "blocked") {
    return blocked("principal_preflight_blocked", preflight.message);
  }

  const payload = buildSimulationDraftInsertPayload({
    ownerPrincipalId: preflight.principalId,
    draftPayload: input.draftPayload,
    draftText: input.draftText,
    clarificationAnswers: input.clarificationAnswers,
    structuredContext: input.structuredContext,
    language: input.language,
    autosaveEnabled: input.autosaveEnabled,
    originatingSurface: input.originatingSurface,
  });

  if (!payload) {
    return blocked(
      "draft_payload_invalid",
      "Simulation draft input cannot be mapped to a simulation_drafts payload.",
    );
  }

  const draft = await resolved.saveProvider.saveSimulationDraft(payload);

  if (!draft) {
    return blocked("draft_save_failed", "Simulation draft provider failed to save the draft.");
  }

  return {
    status: "saved",
    version: SIMULATION_DRAFT_PERSISTENCE_VERSION,
    draft,
    principalId: preflight.principalId,
    evidence: evidence(),
  };
}

export async function updateSimulationDraft(
  input: SimulationDraftUpdateInput,
): Promise<SimulationDraftPersistenceResult> {
  const config = input.config ?? readSimulationDraftPersistenceConfig();

  if (!config.enabled) {
    return blocked(
      "persistence_disabled",
      "Simulation draft persistence is disabled by controlled rollout configuration.",
    );
  }

  const resolved = await resolveRuntimeAndProvider(input);

  if (resolved.status !== "ready") {
    return resolved;
  }

  const preflight = await resolved.runtime.preflight({
    operation: "resolve_principal",
    authContext: input.authContext,
    resourceOwnerPrincipalId: input.draft.owner_principal_id,
  });

  if (preflight.status === "blocked") {
    return blocked("principal_preflight_blocked", preflight.message);
  }

  if (
    input.draft.owner_principal_type !== "registered_user" ||
    input.draft.owner_principal_id !== preflight.principalId
  ) {
    return blocked(
      "draft_payload_invalid",
      "Simulation draft owner does not match the resolved principal.",
    );
  }

  const currentDraft = await resolved.saveProvider.readSimulationDraft({
    draftId: input.draft.draft_id,
    ownerPrincipalId: preflight.principalId,
  });

  if (
    currentDraft.status !== "found" ||
    currentDraft.draft.owner_principal_id !== preflight.principalId ||
    currentDraft.draft.owner_principal_type !== "registered_user" ||
    currentDraft.draft.draft_status !== "active" ||
    currentDraft.draft.deletion_state !== "active" ||
    currentDraft.draft.legal_hold_reason !== null
  ) {
    return blocked(
      "draft_read_failed",
      "Simulation draft could not be read in an active owner-scoped lifecycle.",
    );
  }

  const payload = buildSimulationDraftUpdatePayload({
    currentDraft: currentDraft.draft,
    draftPayload: input.draftPayload,
    draftText: input.draftText,
    clarificationAnswers: input.clarificationAnswers,
    structuredContext: input.structuredContext,
    language: input.language,
    autosaveEnabled: input.autosaveEnabled,
    markSaved: input.markSaved,
    lastAutosavedAt: input.lastAutosavedAt,
    serverConfirmedChangeAt: input.serverConfirmedChangeAt,
  });

  if (!payload) {
    return blocked(
      "draft_payload_invalid",
      "Simulation draft update has no valid fields to persist.",
    );
  }

  const draft = await resolved.saveProvider.updateSimulationDraft({
    draftId: input.draft.draft_id,
    ownerPrincipalId: preflight.principalId,
    payload,
    expectedExpiresAt: currentDraft.draft.expires_at,
    serverConfirmedChangeAt: input.serverConfirmedChangeAt,
  });

  if (!draft) {
    return blocked("draft_update_failed", "Simulation draft provider failed to update the draft.");
  }

  return {
    status: "saved",
    version: SIMULATION_DRAFT_PERSISTENCE_VERSION,
    draft,
    principalId: preflight.principalId,
    evidence: evidence(),
  };
}
