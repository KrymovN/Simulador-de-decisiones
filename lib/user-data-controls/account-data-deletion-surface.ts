import { readSavedSimulationsHistorySurface } from "../saved-decision-simulations/product-surface";

export const ACCOUNT_DATA_DELETION_SURFACE_VERSION =
  "block-c-c2-account-data-deletion-surface.1" as const;

type AccountDataDeletionSavedSimulationPlan = {
  id: string;
  href: string;
  title: string;
  deletionState: "active";
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
    simulationDrafts: "not_included_in_c2";
    simulationHistory: "not_included_in_c2";
    accountDeletion: "not_included_in_c2";
    deletion: "planning_only_no_execution";
  };
  account: {
    identityState: "authenticated";
    sessionStatus: "active";
  };
  savedSimulationDeletionPlan: AccountDataDeletionSavedSimulationPlan[];
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
): AccountDataDeletionPlanDocument {
  return {
    deletionPlanVersion: ACCOUNT_DATA_DELETION_SURFACE_VERSION,
    format: "levio-account-data-deletion-plan-json",
    generatedAt,
    scope: {
      account: "authenticated_session_summary",
      savedSimulations: "owner_scoped_saved_simulation_history",
      simulationDrafts: "not_included_in_c2",
      simulationHistory: "not_included_in_c2",
      accountDeletion: "not_included_in_c2",
      deletion: "planning_only_no_execution",
    },
    account: {
      identityState: "authenticated",
      sessionStatus: "active",
    },
    savedSimulationDeletionPlan,
    safety: {
      deletionExecution: "not_executed",
      hardDelete: "not_executed",
      databaseWrites: "not_executed",
      retentionJobs: "not_started",
      accountDeletion: "not_included",
    },
    excluded: [
      {
        category: "simulationDrafts",
        reason: "Block C C2 prepares saved simulation deletion planning only.",
      },
      {
        category: "simulationHistory",
        reason: "Block C C2 prepares saved simulation deletion planning only.",
      },
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

export async function readAccountDataDeletionSurface(): Promise<AccountDataDeletionSurfaceResult> {
  const generatedAt = new Date().toISOString();
  const history = await readSavedSimulationsHistorySurface();

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

  const savedSimulationDeletionPlan = history.simulations.map((simulation) => ({
    id: simulation.id,
    href: simulation.href,
    title: simulation.title,
    deletionState: "active" as const,
    plannedAction: "eligible_for_deletion_request" as const,
    execution: "not_executed" as const,
    reason: "Block C C2 identifies owner-scoped saved simulations without executing deletion.",
  }));
  const document = createDocument(generatedAt, savedSimulationDeletionPlan);

  if (document.savedSimulationDeletionPlan.length === 0) {
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
