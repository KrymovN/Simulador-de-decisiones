import type { LevioAuthRuntimeContext } from "../auth/types";
import { readServerAuthSession } from "../auth/session";
import type { SimulationResponse } from "../simulationEngine";
import type {
  PersistenceRuntimeWiring,
  SupabaseSimulationRecordArchiveProvider,
  SupabaseSimulationRecordReadProvider,
  SupabaseSimulationRecordSaveProvider,
} from "../persistence-runtime";
import {
  archiveDecisionSimulation,
  listDecisionSimulations,
  reopenDecisionSimulation,
  saveDecisionSimulation,
} from "./runtime";
import type {
  DecisionSimulationDomainModel,
  SavedDecisionSimulationsBlockedReason,
  SavedDecisionSimulationsRuntimeConfig,
} from "./contracts";

export const SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION =
  "block-a-a3-saved-simulations-history-product-surface.1" as const;

type JsonRecord = Record<string, unknown>;

export type SavedSimulationHistoryItemView = {
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

export type SavedSimulationScenarioView = {
  id: string;
  label: string;
  title: string;
  copy: string;
  signal: string;
};

export type SavedSimulationDetailView = SavedSimulationHistoryItemView & {
  userInputSummary: string;
  decisionSummary: string;
  languageLabel: string;
  lifecycleLabel: string;
  exportLabel: string;
  engineStatusLabel: string;
  scenarios: SavedSimulationScenarioView[];
  notices: string[];
};

export type SavedSimulationsProductSurfaceInput = {
  authContext?: LevioAuthRuntimeContext | null;
  limit?: number;
  runtime?: PersistenceRuntimeWiring;
  readProvider?: SupabaseSimulationRecordReadProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SaveCompletedSimulationSurfaceInput = {
  authContext?: LevioAuthRuntimeContext | null;
  simulation: SimulationResponse;
  runtime?: PersistenceRuntimeWiring;
  saveProvider?: SupabaseSimulationRecordSaveProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SavedSimulationDetailSurfaceInput = SavedSimulationsProductSurfaceInput & {
  recordId: string;
};

export type ArchiveSavedSimulationSurfaceInput = {
  authContext?: LevioAuthRuntimeContext | null;
  recordId: string;
  runtime?: PersistenceRuntimeWiring;
  archiveProvider?: SupabaseSimulationRecordArchiveProvider;
  config?: SavedDecisionSimulationsRuntimeConfig;
};

export type SavedSimulationsHistorySurfaceResult =
  | {
      status: "auth_required";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      message: string;
    }
  | {
      status: "empty";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      simulations: [];
      message: string;
    }
  | {
      status: "ready";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      simulations: SavedSimulationHistoryItemView[];
    }
  | {
      status: "error";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      reason: SavedDecisionSimulationsBlockedReason;
      message: string;
    };

export type SavedSimulationDetailSurfaceResult =
  | {
      status: "auth_required";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      message: string;
    }
  | {
      status: "invalid_id";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      message: string;
    }
  | {
      status: "not_found";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      message: string;
    }
  | {
      status: "loaded";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      simulation: SavedSimulationDetailView;
    }
  | {
      status: "error";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      reason: SavedDecisionSimulationsBlockedReason;
      message: string;
    };

export type SaveCompletedSimulationSurfaceResult =
  | {
      status: "auth_required";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      message: string;
      loginHref: string;
    }
  | {
      status: "saved";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      recordId: string;
      historyHref: string;
      detailHref: string;
      message: string;
    }
  | {
      status: "error";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      reason: SavedDecisionSimulationsBlockedReason;
      message: string;
    };

export type ArchiveSavedSimulationSurfaceResult =
  | {
      status: "auth_required";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      message: string;
      loginHref: string;
    }
  | {
      status: "archived";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      historyHref: string;
      message: string;
    }
  | {
      status: "error";
      version: typeof SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION;
      reason: SavedDecisionSimulationsBlockedReason;
      message: string;
    };

async function authContextFromInput(
  authContext: LevioAuthRuntimeContext | null | undefined,
): Promise<LevioAuthRuntimeContext> {
  return authContext ?? readServerAuthSession();
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function recordValue(record: JsonRecord, key: string): JsonRecord | null {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function arrayValue(record: JsonRecord, key: string): unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function dateLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function sentenceFromUserInput(input: JsonRecord): string {
  return (
    stringValue(input.input) ??
    stringValue(input.originalText) ??
    stringValue(input.statement) ??
    "Entrada guardada para esta simulación."
  );
}

function deterministicOutput(simulation: DecisionSimulationDomainModel): JsonRecord {
  return simulation.decisionEngineOutput.deterministicOutputSnapshot;
}

function legacySimulation(output: JsonRecord): JsonRecord | null {
  return recordValue(output, "simulation");
}

function v2Decision(output: JsonRecord): JsonRecord | null {
  return recordValue(output, "decision");
}

function titleFromSimulation(simulation: DecisionSimulationDomainModel): string {
  const output = deterministicOutput(simulation);
  const legacy = legacySimulation(output);
  const decision = v2Decision(output);

  return (
    simulation.simulationInput.title ??
    (legacy ? stringValue(legacy.decision) : null) ??
    (decision ? stringValue(decision.statement) : null) ??
    sentenceFromUserInput(simulation.simulationInput.userInputSnapshot) ??
    "Simulación guardada"
  );
}

function summaryFromSimulation(simulation: DecisionSimulationDomainModel): string {
  const output = deterministicOutput(simulation);
  const legacy = legacySimulation(output);
  const recommendation = recordValue(output, "recommendation");

  return (
    (legacy ? stringValue(legacy.result) : null) ??
    (recommendation ? stringValue(recommendation.summary) : null) ??
    simulation.decisionEngineOutput.recommendationState ??
    "Simulación de decisión guardada."
  );
}

function confidenceValue(simulation: DecisionSimulationDomainModel): number | null {
  const confidence = simulation.decisionEngineOutput.confidenceSummary;

  if (!confidence) {
    return null;
  }

  const direct = numberValue(confidence.confidence);

  if (direct !== null) {
    return direct;
  }

  const overall = recordValue(confidence, "overall");
  return overall ? numberValue(overall.value) : null;
}

function riskValue(simulation: DecisionSimulationDomainModel): number | null {
  const confidence = simulation.decisionEngineOutput.confidenceSummary;
  return confidence ? numberValue(confidence.risk) : null;
}

function sourceLabel(simulation: DecisionSimulationDomainModel): string {
  if (simulation.runtimeMetadata.runtimeTruthBoundary === "deterministic_preview") {
    return "Motor determinista";
  }

  return "Proveedor AI interno";
}

function statusLabel(simulation: DecisionSimulationDomainModel): string {
  if (simulation.lifecycleMetadata.state === "reopened") {
    return "Reabierta";
  }

  return "Guardada";
}

export function mapDecisionSimulationToHistoryItem(
  simulation: DecisionSimulationDomainModel,
): SavedSimulationHistoryItemView {
  const confidence = confidenceValue(simulation);
  const risk = riskValue(simulation);

  return {
    id: simulation.identity.simulationId,
    href: `/dashboard/simulations/${simulation.identity.simulationId}`,
    title: titleFromSimulation(simulation),
    summary: summaryFromSimulation(simulation),
    createdLabel: dateLabel(simulation.identity.createdAt),
    statusLabel: statusLabel(simulation),
    recommendationLabel: simulation.decisionEngineOutput.recommendationState,
    confidenceLabel: confidence === null ? "Claridad pendiente" : `Claridad ${Math.round(confidence)}%`,
    riskLabel: risk === null ? "Riesgo no calculado" : `Riesgo ${Math.round(risk)}%`,
    sourceLabel: sourceLabel(simulation),
  };
}

function scenarioViews(simulation: DecisionSimulationDomainModel): SavedSimulationScenarioView[] {
  const output = deterministicOutput(simulation);
  const legacy = legacySimulation(output);
  const analysis = recordValue(output, "analysis");
  const sourceScenarios = legacy
    ? arrayValue(legacy, "scenarios")
    : analysis
      ? arrayValue(analysis, "scenarios")
      : [];

  return sourceScenarios.slice(0, 4).map((scenario, index) => {
    const record = isRecord(scenario) ? scenario : {};
    const label = stringValue(record.label) ?? `Escenario ${index + 1}`;
    const title = stringValue(record.title) ?? stringValue(record.name) ?? label;
    const copy =
      stringValue(record.copy) ??
      stringValue(record.summary) ??
      stringValue(record.description) ??
      "Escenario guardado dentro de la simulación.";
    const signal =
      stringValue(record.signal) ??
      stringValue(record.score) ??
      stringValue(record.status) ??
      "Disponible";

    return {
      id: `${simulation.identity.simulationId}-${index}`,
      label,
      title,
      copy,
      signal,
    };
  });
}

function noticeViews(simulation: DecisionSimulationDomainModel): string[] {
  const output = deterministicOutput(simulation);
  const notices = arrayValue(output, "notices");

  return notices
    .map((notice) => {
      if (!isRecord(notice)) {
        return null;
      }

      return stringValue(notice.message);
    })
    .filter((notice): notice is string => Boolean(notice))
    .slice(0, 3);
}

export function mapDecisionSimulationToDetail(
  simulation: DecisionSimulationDomainModel,
): SavedSimulationDetailView {
  const item = mapDecisionSimulationToHistoryItem(simulation);
  const output = deterministicOutput(simulation);
  const decision = v2Decision(output);

  return {
    ...item,
    userInputSummary: sentenceFromUserInput(simulation.simulationInput.userInputSnapshot),
    decisionSummary:
      (decision ? stringValue(decision.statement) : null) ??
      titleFromSimulation(simulation),
    languageLabel: simulation.simulationInput.language.toUpperCase(),
    lifecycleLabel: statusLabel(simulation),
    exportLabel: simulation.lifecycleMetadata.exportEligible
      ? "Incluida en futura exportación"
      : "Exportación restringida",
    engineStatusLabel: simulation.decisionEngineOutput.status,
    scenarios: scenarioViews(simulation),
    notices: noticeViews(simulation),
  };
}

export async function saveCompletedSimulationSurface(
  input: SaveCompletedSimulationSurfaceInput,
): Promise<SaveCompletedSimulationSurfaceResult> {
  const authContext = await authContextFromInput(input.authContext);

  if (authContext.identityState !== "authenticated") {
    return {
      status: "auth_required",
      version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
      message: "Inicia sesión para guardar esta simulación en tu historial.",
      loginHref: "/login?next=/dashboard/simulations",
    };
  }

  const result = await saveDecisionSimulation({
    authContext,
    simulation: input.simulation,
    runtime: input.runtime,
    saveProvider: input.saveProvider,
    config: input.config,
  });

  if (result.status === "blocked") {
    return {
      status: "error",
      version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
      reason: result.reason,
      message: "No se pudo guardar la simulación de forma controlada.",
    };
  }

  return {
    status: "saved",
    version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
    recordId: result.record.record_id,
    historyHref: "/dashboard/simulations",
    detailHref: `/dashboard/simulations/${result.record.record_id}`,
    message: "Simulación guardada en tu historial.",
  };
}

export async function archiveSavedSimulationSurface(
  input: ArchiveSavedSimulationSurfaceInput,
): Promise<ArchiveSavedSimulationSurfaceResult> {
  const authContext = await authContextFromInput(input.authContext);

  if (authContext.identityState !== "authenticated") {
    return {
      status: "auth_required",
      version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
      message: "Inicia sesión para archivar esta simulación guardada.",
      loginHref: "/login?next=/dashboard/simulations",
    };
  }

  const result = await archiveDecisionSimulation({
    authContext,
    recordId: input.recordId,
    runtime: input.runtime,
    archiveProvider: input.archiveProvider,
    config: input.config,
  });

  if (result.status === "blocked") {
    return {
      status: "error",
      version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
      reason: result.reason,
      message: "No se pudo archivar la simulación de forma controlada.",
    };
  }

  return {
    status: "archived",
    version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
    historyHref: "/dashboard/simulations",
    message: "Simulación archivada fuera del historial activo.",
  };
}

function errorResult(
  reason: SavedDecisionSimulationsBlockedReason,
  message: string,
): SavedSimulationsHistorySurfaceResult {
  return {
    status: "error",
    version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
    reason,
    message,
  };
}

function detailErrorResult(
  reason: SavedDecisionSimulationsBlockedReason,
  message: string,
): SavedSimulationDetailSurfaceResult {
  return {
    status: "error",
    version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
    reason,
    message,
  };
}

export async function readSavedSimulationsHistorySurface(
  input: SavedSimulationsProductSurfaceInput = {},
): Promise<SavedSimulationsHistorySurfaceResult> {
  const authContext = await authContextFromInput(input.authContext);

  if (authContext.identityState !== "authenticated") {
    return {
      status: "auth_required",
      version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
      message: "Inicia sesión para ver tus simulaciones guardadas.",
    };
  }

  const result = await listDecisionSimulations({
    authContext,
    limit: input.limit,
    runtime: input.runtime,
    readProvider: input.readProvider,
    config: input.config,
  });

  if (result.status === "blocked") {
    if (result.reason === "auth_context_not_authenticated") {
      return {
        status: "auth_required",
        version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
        message: "Inicia sesión para ver tus simulaciones guardadas.",
      };
    }

    return errorResult(
      result.reason,
      "No se pudieron cargar las simulaciones guardadas de forma controlada.",
    );
  }

  const simulations = result.simulations.map(mapDecisionSimulationToHistoryItem);

  if (simulations.length === 0) {
    return {
      status: "empty",
      version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
      simulations: [],
      message: "Todavía no hay simulaciones guardadas en esta cuenta.",
    };
  }

  return {
    status: "ready",
    version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
    simulations,
  };
}

export async function readSavedSimulationDetailSurface(
  input: SavedSimulationDetailSurfaceInput,
): Promise<SavedSimulationDetailSurfaceResult> {
  const authContext = await authContextFromInput(input.authContext);

  if (authContext.identityState !== "authenticated") {
    return {
      status: "auth_required",
      version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
      message: "Inicia sesión para abrir esta simulación guardada.",
    };
  }

  const result = await reopenDecisionSimulation({
    authContext,
    recordId: input.recordId,
    runtime: input.runtime,
    readProvider: input.readProvider,
    config: input.config,
  });

  if (result.status === "blocked") {
    if (result.reason === "record_id_invalid") {
      return {
        status: "invalid_id",
        version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
        message: "El identificador de la simulación guardada no es válido.",
      };
    }

    if (result.reason === "record_not_found") {
      return {
        status: "not_found",
        version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
        message: "La simulación no existe, está archivada o no pertenece a esta cuenta.",
      };
    }

    if (result.reason === "auth_context_not_authenticated") {
      return {
        status: "auth_required",
        version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
        message: "Inicia sesión para abrir esta simulación guardada.",
      };
    }

    return detailErrorResult(
      result.reason,
      "No se pudo abrir la simulación guardada de forma controlada.",
    );
  }

  return {
    status: "loaded",
    version: SAVED_DECISION_SIMULATIONS_PRODUCT_SURFACE_VERSION,
    simulation: mapDecisionSimulationToDetail(result.simulation),
  };
}
