import { readServerAuthSession } from "../auth/session";
import type { LevioSessionContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  type SimulationDraftRow,
  type SimulationHistoryEntryRow,
  type SupabaseSimulationDraftReadProvider,
  type SupabaseSimulationHistoryEntryReadProvider,
} from "../persistence-runtime";
import { readSavedSimulationsHistorySurface } from "../saved-decision-simulations/product-surface";

export const ACCOUNT_DATA_EXPORT_SURFACE_VERSION =
  "stage-7-account-data-export-surface.3" as const;

const MAX_EXPORTED_DRAFTS = 1000;
const MAX_EXPORTED_HISTORY_ENTRIES = 2000;

type AccountDataExportSavedSimulation = {
  id: string;
  href: string;
  title: string;
  summary: string;
  createdLabel: string;
  statusLabel: string;
  recommendationLabel: string;
  confidenceLabel: string;
  riskLabel: string;
  sourceLabel: string;
};

type AccountDataExportSimulationDraft = {
  id: string;
  status: SimulationDraftRow["draft_status"];
  draftPayload: SimulationDraftRow["draft_payload"];
  draftText: string | null;
  clarificationAnswers: SimulationDraftRow["clarification_answers_snapshot"];
  structuredContext: SimulationDraftRow["structured_context_snapshot"];
  language: string;
  autosaveEnabled: boolean;
  originatingSurface: string | null;
  convertedRecordId: string | null;
  createdAt: string;
  updatedAt: string;
  lastAutosavedAt: string | null;
  expiresAt: string;
  discardedAt: string | null;
  deletionState: SimulationDraftRow["deletion_state"];
  retentionRule: string;
  exportEligible: true;
  schemaVersion: number;
};

type AccountDataExportSimulationHistoryEntry = {
  id: string;
  simulationId: string;
  eventType: SimulationHistoryEntryRow["event_type"];
  eventTimestamp: string;
  eventSource: SimulationHistoryEntryRow["event_source"];
  summary: string | null;
  eventPayload: SimulationHistoryEntryRow["event_payload"];
  beforeReference: string | null;
  afterReference: string | null;
  revisionReference: string | null;
  outcomeSnapshot: SimulationHistoryEntryRow["outcome_snapshot"];
  createdAt: string;
  updatedAt: string;
  deletionState: SimulationHistoryEntryRow["deletion_state"];
  retentionRule: string;
  exportEligible: true;
  schemaVersion: number;
};

export type AccountDataExportDocument = {
  exportVersion: typeof ACCOUNT_DATA_EXPORT_SURFACE_VERSION;
  format: "levio-account-data-export-json";
  generatedAt: string;
  scope: {
    account: "authenticated_session_summary";
    savedSimulations: "owner_scoped_saved_simulation_history";
    simulationDrafts: "owner_scoped_eligible_simulation_drafts";
    simulationHistory: "owner_scoped_eligible_user_visible_history";
    deletion: "not_executed";
  };
  account: {
    identityState: "authenticated";
    sessionStatus: "active";
  };
  savedSimulations: AccountDataExportSavedSimulation[];
  simulationDrafts: AccountDataExportSimulationDraft[];
  simulationHistory: AccountDataExportSimulationHistoryEntry[];
  excluded: Array<{
    category: string;
    reason: string;
  }>;
};

export type AccountDataExportSurfaceResult =
  | {
      status: "ready";
      document: AccountDataExportDocument;
    }
  | {
      status: "empty";
      document: AccountDataExportDocument;
    }
  | {
      status: "blocked";
      reason: "auth_required" | "read_failed";
      message: string;
    };

function createDocument(
  generatedAt: string,
  savedSimulations: AccountDataExportSavedSimulation[],
  simulationDrafts: AccountDataExportSimulationDraft[],
  simulationHistory: AccountDataExportSimulationHistoryEntry[],
): AccountDataExportDocument {
  return {
    exportVersion: ACCOUNT_DATA_EXPORT_SURFACE_VERSION,
    format: "levio-account-data-export-json",
    generatedAt,
    scope: {
      account: "authenticated_session_summary",
      savedSimulations: "owner_scoped_saved_simulation_history",
      simulationDrafts: "owner_scoped_eligible_simulation_drafts",
      simulationHistory: "owner_scoped_eligible_user_visible_history",
      deletion: "not_executed",
    },
    account: {
      identityState: "authenticated",
      sessionStatus: "active",
    },
    savedSimulations,
    simulationDrafts,
    simulationHistory,
    excluded: [
      {
        category: "deletion",
        reason: "Deletion execution is outside this Stage 7 export substep.",
      },
    ],
  };
}

function supportsSimulationHistoryReadProvider(
  value: unknown,
): value is SupabaseSimulationHistoryEntryReadProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "listSimulationHistoryEntries" in value &&
    typeof value.listSimulationHistoryEntries === "function"
  );
}

function supportsSimulationDraftReadProvider(
  value: unknown,
): value is SupabaseSimulationDraftReadProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "listSimulationDrafts" in value &&
    typeof value.listSimulationDrafts === "function"
  );
}

function mapDraft(row: SimulationDraftRow): AccountDataExportSimulationDraft {
  return {
    id: row.draft_id,
    status: row.draft_status,
    draftPayload: row.draft_payload,
    draftText: row.draft_text_snapshot,
    clarificationAnswers: row.clarification_answers_snapshot,
    structuredContext: row.structured_context_snapshot,
    language: row.language,
    autosaveEnabled: row.autosave_enabled,
    originatingSurface: row.originating_surface,
    convertedRecordId: row.converted_record_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastAutosavedAt: row.last_autosaved_at,
    expiresAt: row.expires_at,
    discardedAt: row.discarded_at,
    deletionState: row.deletion_state,
    retentionRule: row.retention_rule,
    exportEligible: true,
    schemaVersion: row.schema_version,
  };
}

function mapHistoryEntry(
  row: SimulationHistoryEntryRow,
): AccountDataExportSimulationHistoryEntry {
  return {
    id: row.history_entry_id,
    simulationId: row.record_id,
    eventType: row.event_type,
    eventTimestamp: row.event_timestamp,
    eventSource: row.event_source,
    summary: row.event_summary,
    eventPayload: row.event_payload,
    beforeReference: row.before_reference,
    afterReference: row.after_reference,
    revisionReference: row.revision_reference,
    outcomeSnapshot: row.outcome_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletionState: row.deletion_state,
    retentionRule: row.retention_rule,
    exportEligible: true,
    schemaVersion: row.schema_version,
  };
}

async function readOwnerScopedSimulationDrafts(
  authContext: LevioSessionContext,
): Promise<
  | { status: "ready"; drafts: AccountDataExportSimulationDraft[] }
  | { status: "read_failed" }
> {
  const runtime = initializePersistenceRuntimeWiring();

  if (
    runtime.status !== "ready" ||
    !supportsSimulationDraftReadProvider(runtime.providerAdapter)
  ) {
    return { status: "read_failed" };
  }

  const preflight = await runtime.preflight({
    operation: "list_simulation_drafts",
    authContext,
  });

  if (preflight.status === "blocked") {
    return { status: "read_failed" };
  }

  const rows = await runtime.providerAdapter.listSimulationDrafts({
    ownerPrincipalId: preflight.principalId,
    limit: MAX_EXPORTED_DRAFTS,
  });

  if (
    rows.some(
      (row) =>
        row.owner_principal_id !== preflight.principalId ||
        row.owner_principal_type !== "registered_user" ||
        row.export_eligible !== true ||
        row.deletion_state !== "active",
    )
  ) {
    return { status: "read_failed" };
  }

  return { status: "ready", drafts: rows.map(mapDraft) };
}

async function readOwnerScopedSimulationHistory(
  authContext: LevioSessionContext,
): Promise<
  | { status: "ready"; entries: AccountDataExportSimulationHistoryEntry[] }
  | { status: "read_failed" }
> {
  const runtime = initializePersistenceRuntimeWiring();

  if (
    runtime.status !== "ready" ||
    !supportsSimulationHistoryReadProvider(runtime.providerAdapter)
  ) {
    return { status: "read_failed" };
  }

  const preflight = await runtime.preflight({
    operation: "list_simulation_history",
    authContext,
  });

  if (preflight.status === "blocked") {
    return { status: "read_failed" };
  }

  const rows = await runtime.providerAdapter.listSimulationHistoryEntries({
    ownerPrincipalId: preflight.principalId,
    limit: MAX_EXPORTED_HISTORY_ENTRIES,
  });

  if (
    rows.some(
      (row) =>
        row.owner_principal_id !== preflight.principalId ||
        row.owner_principal_type !== "registered_user" ||
        row.user_visible !== true ||
        row.export_eligible !== true ||
        row.deletion_state !== "active",
    )
  ) {
    return { status: "read_failed" };
  }

  return { status: "ready", entries: rows.map(mapHistoryEntry) };
}

export async function readAccountDataExportSurface(): Promise<AccountDataExportSurfaceResult> {
  const generatedAt = new Date().toISOString();
  const authContext = await readServerAuthSession();

  if (authContext.identityState !== "authenticated") {
    return {
      status: "blocked",
      reason: "auth_required",
      message: "Inicia sesión para exportar los datos de esta cuenta.",
    };
  }

  const [history, drafts, simulationHistory] = await Promise.all([
    readSavedSimulationsHistorySurface({ authContext }),
    readOwnerScopedSimulationDrafts(authContext),
    readOwnerScopedSimulationHistory(authContext),
  ]);

  if (history.status === "auth_required") {
    return {
      status: "blocked",
      reason: "auth_required",
      message: "Inicia sesión para exportar los datos de esta cuenta.",
    };
  }

  if (history.status === "error") {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo preparar la exportación de datos de forma controlada.",
    };
  }

  if (drafts.status === "read_failed" || simulationHistory.status === "read_failed") {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo preparar la exportación de datos de forma controlada.",
    };
  }

  const document = createDocument(
    generatedAt,
    history.simulations,
    drafts.drafts,
    simulationHistory.entries,
  );

  if (
    document.savedSimulations.length === 0 &&
    document.simulationDrafts.length === 0 &&
    document.simulationHistory.length === 0
  ) {
    return {
      status: "empty",
      document,
    };
  }

  return {
    status: "ready",
    document,
  };
}
