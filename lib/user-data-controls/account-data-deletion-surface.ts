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

export const ACCOUNT_DATA_DELETION_SURFACE_VERSION =
  "stage-7-account-data-deletion-surface.3" as const;

const MAX_PLANNED_DRAFTS = 1000;
const MAX_PLANNED_HISTORY_ENTRIES = 1000;

type AccountDataDeletionSavedSimulationPlan = {
  id: string;
  href: string;
  title: string;
  deletionState: "active";
  plannedAction: "eligible_for_deletion_request";
  execution: "not_executed";
  reason: string;
};

type AccountDataDeletionSimulationDraftPlan = {
  id: string;
  status: SimulationDraftRow["draft_status"];
  expiresAt: string;
  deletionState: "active";
  retentionRule: string;
  plannedAction: "eligible_for_deletion_request";
  execution: "not_executed";
  reason: string;
};

type AccountDataDeletionSimulationHistoryPlan = {
  id: string;
  simulationId: string;
  eventType: SimulationHistoryEntryRow["event_type"];
  eventTimestamp: string;
  deletionState: "active";
  retentionRule: string;
  plannedAction: "eligible_for_deletion_request";
  execution: "not_executed";
  reason: string;
};

export type AccountDataDeletionPlanDocument = {
  deletionPlanVersion: typeof ACCOUNT_DATA_DELETION_SURFACE_VERSION;
  format: "levio-account-data-deletion-plan-json";
  generatedAt: string;
  scope: {
    account: "authenticated_session_summary";
    savedSimulations: "owner_scoped_saved_simulation_history";
    simulationDrafts: "owner_scoped_eligible_simulation_drafts";
    simulationHistory: "owner_scoped_simulation_history_entries";
    accountDeletion: "not_included_in_c2";
    deletion: "planning_only_no_execution";
  };
  account: {
    identityState: "authenticated";
    sessionStatus: "active";
  };
  savedSimulationDeletionPlan: AccountDataDeletionSavedSimulationPlan[];
  simulationDraftDeletionPlan: AccountDataDeletionSimulationDraftPlan[];
  simulationHistoryDeletionPlan: AccountDataDeletionSimulationHistoryPlan[];
  safety: {
    deletionExecution: "not_executed";
    hardDelete: "not_executed";
    databaseWrites: "not_executed";
    retentionJobs: "not_started";
    accountDeletion: "not_included";
  };
  excluded: Array<{
    category: string;
    reason: string;
  }>;
};

export type AccountDataDeletionSurfaceResult =
  | {
      status: "ready";
      document: AccountDataDeletionPlanDocument;
    }
  | {
      status: "empty";
      document: AccountDataDeletionPlanDocument;
    }
  | {
      status: "blocked";
      reason: "auth_required" | "read_failed";
      message: string;
    };

function createDocument(
  generatedAt: string,
  savedSimulationDeletionPlan: AccountDataDeletionSavedSimulationPlan[],
  simulationDraftDeletionPlan: AccountDataDeletionSimulationDraftPlan[],
  simulationHistoryDeletionPlan: AccountDataDeletionSimulationHistoryPlan[],
): AccountDataDeletionPlanDocument {
  return {
    deletionPlanVersion: ACCOUNT_DATA_DELETION_SURFACE_VERSION,
    format: "levio-account-data-deletion-plan-json",
    generatedAt,
    scope: {
      account: "authenticated_session_summary",
      savedSimulations: "owner_scoped_saved_simulation_history",
      simulationDrafts: "owner_scoped_eligible_simulation_drafts",
      simulationHistory: "owner_scoped_simulation_history_entries",
      accountDeletion: "not_included_in_c2",
      deletion: "planning_only_no_execution",
    },
    account: {
      identityState: "authenticated",
      sessionStatus: "active",
    },
    savedSimulationDeletionPlan,
    simulationDraftDeletionPlan,
    simulationHistoryDeletionPlan,
    safety: {
      deletionExecution: "not_executed",
      hardDelete: "not_executed",
      databaseWrites: "not_executed",
      retentionJobs: "not_started",
      accountDeletion: "not_included",
    },
    excluded: [
      {
        category: "accountDeletion",
        reason: "Account deletion is outside Block C C2.",
      },
      {
        category: "deletionExecution",
        reason: "Deletion execution is outside Block C C2.",
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
    "listSimulationHistoryEntriesForDeletion" in value &&
    typeof value.listSimulationHistoryEntriesForDeletion === "function"
  );
}

function supportsSimulationDraftReadProvider(
  value: unknown,
): value is SupabaseSimulationDraftReadProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "listSimulationDraftsForDeletion" in value &&
    typeof value.listSimulationDraftsForDeletion === "function"
  );
}

function mapDraft(row: SimulationDraftRow): AccountDataDeletionSimulationDraftPlan {
  return {
    id: row.draft_id,
    status: row.draft_status,
    expiresAt: row.expires_at,
    deletionState: "active",
    retentionRule: row.retention_rule,
    plannedAction: "eligible_for_deletion_request",
    execution: "not_executed",
    reason: "Stage 7 identifies an eligible owner-scoped draft without executing deletion.",
  };
}

function mapHistoryEntry(
  row: SimulationHistoryEntryRow,
): AccountDataDeletionSimulationHistoryPlan {
  return {
    id: row.history_entry_id,
    simulationId: row.record_id,
    eventType: row.event_type,
    eventTimestamp: row.event_timestamp,
    deletionState: "active",
    retentionRule: row.retention_rule,
    plannedAction: "eligible_for_deletion_request",
    execution: "not_executed",
    reason:
      "Stage 7 identifies an owner-scoped simulation history entry without executing deletion.",
  };
}

async function readOwnerScopedSimulationDrafts(
  authContext: LevioSessionContext,
): Promise<
  | { status: "ready"; drafts: AccountDataDeletionSimulationDraftPlan[] }
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

  const rows = await runtime.providerAdapter.listSimulationDraftsForDeletion({
    ownerPrincipalId: preflight.principalId,
    limit: MAX_PLANNED_DRAFTS,
  });

  if (
    rows.some(
      (row) =>
        row.owner_principal_id !== preflight.principalId ||
        row.owner_principal_type !== "registered_user" ||
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
  | { status: "ready"; history: AccountDataDeletionSimulationHistoryPlan[] }
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

  const rows =
    await runtime.providerAdapter.listSimulationHistoryEntriesForDeletion({
      ownerPrincipalId: preflight.principalId,
      limit: MAX_PLANNED_HISTORY_ENTRIES,
    });

  if (
    rows.some(
      (row) =>
        row.owner_principal_id !== preflight.principalId ||
        row.owner_principal_type !== "registered_user" ||
        row.deletion_state !== "active",
    )
  ) {
    return { status: "read_failed" };
  }

  return { status: "ready", history: rows.map(mapHistoryEntry) };
}

export async function readAccountDataDeletionSurface(): Promise<AccountDataDeletionSurfaceResult> {
  const generatedAt = new Date().toISOString();
  const authContext = await readServerAuthSession();

  if (authContext.identityState !== "authenticated") {
    return {
      status: "blocked",
      reason: "auth_required",
      message: "Inicia sesión para preparar el plan de eliminación de esta cuenta.",
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
      message: "Inicia sesión para preparar el plan de eliminación de esta cuenta.",
    };
  }

  if (history.status === "error") {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo preparar el plan de eliminación de forma controlada.",
    };
  }

  if (drafts.status === "read_failed" || simulationHistory.status === "read_failed") {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo preparar el plan de eliminación de forma controlada.",
    };
  }

  const savedSimulationDeletionPlan = history.simulations.map((simulation) => ({
    id: simulation.id,
    href: simulation.href,
    title: simulation.title,
    deletionState: "active" as const,
    plannedAction: "eligible_for_deletion_request" as const,
    execution: "not_executed" as const,
    reason: "Block C C2 identifies owner-scoped saved simulations without executing deletion.",
  }));
  const document = createDocument(
    generatedAt,
    savedSimulationDeletionPlan,
    drafts.drafts,
    simulationHistory.history,
  );

  if (
    document.savedSimulationDeletionPlan.length === 0 &&
    document.simulationDraftDeletionPlan.length === 0 &&
    document.simulationHistoryDeletionPlan.length === 0
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
