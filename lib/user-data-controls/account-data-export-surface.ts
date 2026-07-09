import { readSavedSimulationsHistorySurface } from "../saved-decision-simulations/product-surface";

export const ACCOUNT_DATA_EXPORT_SURFACE_VERSION =
  "block-c-c1-account-data-export-surface.1" as const;

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

export type AccountDataExportDocument = {
  exportVersion: typeof ACCOUNT_DATA_EXPORT_SURFACE_VERSION;
  format: "levio-account-data-export-json";
  generatedAt: string;
  scope: {
    account: "authenticated_session_summary";
    savedSimulations: "owner_scoped_saved_simulation_history";
    simulationDrafts: "not_included_in_c1";
    simulationHistory: "not_included_in_c1";
    deletion: "not_executed";
  };
  account: {
    identityState: "authenticated";
    sessionStatus: "active";
  };
  savedSimulations: AccountDataExportSavedSimulation[];
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
): AccountDataExportDocument {
  return {
    exportVersion: ACCOUNT_DATA_EXPORT_SURFACE_VERSION,
    format: "levio-account-data-export-json",
    generatedAt,
    scope: {
      account: "authenticated_session_summary",
      savedSimulations: "owner_scoped_saved_simulation_history",
      simulationDrafts: "not_included_in_c1",
      simulationHistory: "not_included_in_c1",
      deletion: "not_executed",
    },
    account: {
      identityState: "authenticated",
      sessionStatus: "active",
    },
    savedSimulations,
    excluded: [
      {
        category: "simulationDrafts",
        reason: "Block C C1 exports saved simulation history only.",
      },
      {
        category: "simulationHistory",
        reason: "Block C C1 exports saved simulation history only.",
      },
      {
        category: "deletion",
        reason: "Deletion execution is outside Block C C1.",
      },
    ],
  };
}

export async function readAccountDataExportSurface(): Promise<AccountDataExportSurfaceResult> {
  const generatedAt = new Date().toISOString();
  const history = await readSavedSimulationsHistorySurface();

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

  const document = createDocument(generatedAt, history.simulations);

  if (document.savedSimulations.length === 0) {
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
