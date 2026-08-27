import { readServerAuthSession } from "../auth/session";
import type { LevioAuthRuntimeContext, LevioSessionContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  type JsonObject,
  type PersistenceRuntimeWiring,
  type SimulationDraftRow,
  type SimulationHistoryEntryRow,
  type SimulationRecordRow,
  type SupabaseSimulationDraftReadProvider,
  type SupabaseSimulationHistoryEntryReadProvider,
  type SupabaseSimulationRecordExportProvider,
} from "../persistence-runtime";
import {
  mapSimulationRecordToDecisionSimulation,
  type DecisionSimulationDomainModel,
} from "../saved-decision-simulations";
import { mapDecisionSimulationToHistoryItem } from "../saved-decision-simulations/product-surface";

export const ACCOUNT_DATA_EXPORT_SURFACE_VERSION =
  "levio-account-data-export.1" as const;

const MAX_EXPORTED_SAVED_SIMULATIONS = 1000;
const MAX_EXPORTED_DRAFTS = 1000;
const MAX_EXPORTED_HISTORY_ENTRIES = 2000;
const OMIT_FROM_EXPORT = Symbol("omit-from-account-export");

const INTERNAL_CONTENT_KEYS = new Set([
  "chainofthought",
  "debug",
  "debuginfo",
  "internaldebug",
  "internalsubstep",
  "legalholdreason",
  "orchestratortrace",
  "ownerprincipalid",
  "providerreference",
  "rawprompt",
  "rawproviderresponse",
  "substep",
  "thinkingstages",
  "trace",
]);

const INTERNAL_CONTENT_VALUE =
  /stage[-_ ]?7|mock_recommendation_available|\binternal(?:\s+|[_-])?substep\b|\bdebug(?:ging)?\b/i;

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
  input: {
    userInputSnapshot: JsonObject;
    clarificationAnswers: JsonObject | null;
    decisionContext: JsonObject | null;
    language: string;
    source: string;
    submittedAt: string;
    title: string | null;
    userNote: string | null;
    originatingDraftId: string | null;
  };
  result: {
    status: string;
    recommendationStatus: string;
    content: JsonObject;
    generatedScenarios: JsonObject | null;
    confidenceSummary: JsonObject | null;
  };
  lifecycle: {
    state: "saved" | "archived";
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
    parentSimulationId: string | null;
    revisionLabel: string | null;
    retentionPolicy: string;
    exportEligible: true;
  };
  provenance: {
    source: string;
    resultFormatVersion: "1.0" | "2.0";
    schemaVersion: number;
  };
};

type AccountDataExportSimulationDraft = {
  id: string;
  status: SimulationDraftRow["draft_status"];
  draftPayload: JsonObject;
  draftText: string | null;
  clarificationAnswers: JsonObject | null;
  structuredContext: JsonObject | null;
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
  eventSource: string;
  summary: string | null;
  eventPayload: JsonObject;
  beforeReference: string | null;
  afterReference: string | null;
  revisionReference: string | null;
  outcomeSnapshot: JsonObject | null;
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
    account: "authenticated_account";
    savedSimulations: "eligible_saved_simulations";
    simulationDrafts: "eligible_simulation_drafts";
    simulationHistory: "eligible_user_visible_history";
    deletion: "not_included";
  };
  account: {
    identityState: "authenticated";
    sessionStatus: "active";
  };
  savedSimulations: AccountDataExportSavedSimulation[];
  simulationDrafts: AccountDataExportSimulationDraft[];
  simulationHistory: AccountDataExportSimulationHistoryEntry[];
  excluded: Array<{ category: string; reason: string }>;
};

export type AccountDataExportSurfaceResult =
  | { status: "ready"; document: AccountDataExportDocument }
  | { status: "empty"; document: AccountDataExportDocument }
  | {
      status: "blocked";
      reason: "auth_required" | "read_failed";
      message: string;
    };

export type AccountDataExportSurfaceInput = {
  authContext?: LevioAuthRuntimeContext;
  generatedAt?: string;
  runtime?: PersistenceRuntimeWiring;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function sanitizeDerivedValue(value: unknown): unknown | typeof OMIT_FROM_EXPORT {
  if (typeof value === "string") {
    return INTERNAL_CONTENT_VALUE.test(value) ? OMIT_FROM_EXPORT : value;
  }

  if (Array.isArray(value)) {
    return value
      .map(sanitizeDerivedValue)
      .filter((item) => item !== OMIT_FROM_EXPORT);
  }

  if (!isRecord(value)) {
    return value;
  }

  const sanitized: JsonObject = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (INTERNAL_CONTENT_KEYS.has(normalizedKey(key))) {
      continue;
    }

    const mappedValue = sanitizeDerivedValue(nestedValue);
    if (mappedValue !== OMIT_FROM_EXPORT) {
      sanitized[key] = mappedValue;
    }
  }

  return sanitized;
}

export function sanitizeAccountExportDerivedContent(value: JsonObject): JsonObject;
export function sanitizeAccountExportDerivedContent(value: JsonObject | null): JsonObject | null;
export function sanitizeAccountExportDerivedContent(
  value: JsonObject | null,
): JsonObject | null {
  if (value === null) {
    return null;
  }

  const sanitized = sanitizeDerivedValue(value);
  return isRecord(sanitized) ? sanitized : {};
}

function productStatus(value: string): string {
  const labels: Record<string, string> = {
    active: "Activa",
    analysis_ready: "Análisis disponible",
    archived: "Archivada",
    available: "Disponible",
    cannot_recommend: "Sin recomendación",
    clarification_required: "Faltan datos",
    conditional: "Recomendación condicional",
    failed: "Resultado no disponible",
    limited_analysis: "Análisis limitado",
    mock_recommendation_available: "Recomendación orientativa disponible",
    not_applicable: "No aplicable",
    recommended: "Recomendación orientativa disponible",
    refused: "Resultado no disponible",
    unavailable: "No disponible",
    withheld: "Sin recomendación",
  };

  return labels[value] ?? "Estado disponible en el resultado";
}

function productSource(value: SimulationRecordRow["source_type"]): string {
  if (value === "registered_user_import") return "Importada por el usuario";
  if (value === "approved_account_save") return "Guardada en la cuenta";
  return "Guardada por el usuario";
}

function productDraftSource(value: string | null): string | null {
  if (!value) return null;
  return value === "levio_simulator" || value === "simulator"
    ? "Simulador Levio"
    : "Levio";
}

function productHistorySource(
  value: SimulationHistoryEntryRow["event_source"],
): string {
  const sources: Record<SimulationHistoryEntryRow["event_source"], string> = {
    export_flow: "Exportación de datos",
    import_flow: "Importación de datos",
    owner_action: "Acción del usuario",
    server: "Servicio Levio",
    system_lifecycle: "Ciclo de vida de Levio",
  };
  return sources[value];
}

function resultFormatVersion(simulation: DecisionSimulationDomainModel): "1.0" | "2.0" {
  return simulation.decisionEngineOutput.simulationResponseVersion ===
    "simulation_response_v2"
    ? "2.0"
    : "1.0";
}

export function mapDecisionSimulationToAccountExport(
  simulation: DecisionSimulationDomainModel,
): AccountDataExportSavedSimulation {
  const compatibility = mapDecisionSimulationToHistoryItem(simulation);
  const lifecycleState =
    simulation.lifecycleMetadata.state === "archived" ? "archived" : "saved";
  const userInputSnapshot = {
    ...simulation.simulationInput.userInputSnapshot,
    ...(typeof simulation.simulationInput.userInputSnapshot.source === "string"
      ? {
          source:
            productDraftSource(
              simulation.simulationInput.userInputSnapshot.source,
            ) ?? "Levio",
        }
      : {}),
  };
  const summary =
    compatibility.summary === simulation.decisionEngineOutput.recommendationState ||
    INTERNAL_CONTENT_VALUE.test(compatibility.summary)
      ? productStatus(simulation.decisionEngineOutput.recommendationState)
      : compatibility.summary;

  return {
    ...compatibility,
    summary,
    recommendationLabel: productStatus(
      simulation.decisionEngineOutput.recommendationState,
    ),
    input: {
      userInputSnapshot,
      clarificationAnswers: simulation.simulationInput.clarificationSnapshot,
      decisionContext: sanitizeAccountExportDerivedContent(
        simulation.decisionContext.snapshot,
      ),
      language: simulation.simulationInput.language,
      source: compatibility.sourceLabel,
      submittedAt: simulation.simulationInput.submittedAt,
      title: simulation.simulationInput.title,
      userNote: simulation.simulationInput.userNote,
      originatingDraftId: simulation.simulationInput.originatingDraftId,
    },
    result: {
      status: productStatus(simulation.decisionEngineOutput.status),
      recommendationStatus: productStatus(
        simulation.decisionEngineOutput.recommendationState,
      ),
      content: sanitizeAccountExportDerivedContent(
        simulation.decisionEngineOutput.deterministicOutputSnapshot,
      ),
      generatedScenarios: sanitizeAccountExportDerivedContent(
        simulation.generatedScenarios.snapshot,
      ),
      confidenceSummary: sanitizeAccountExportDerivedContent(
        simulation.decisionEngineOutput.confidenceSummary,
      ),
    },
    lifecycle: {
      state: lifecycleState,
      createdAt: simulation.identity.createdAt,
      updatedAt: simulation.identity.updatedAt,
      archivedAt: simulation.lifecycleMetadata.archivedAt,
      parentSimulationId: simulation.auditMetadata.parentRecordId,
      revisionLabel: simulation.auditMetadata.revisionLabel,
      retentionPolicy:
        "Conservada hasta que el usuario la elimine o se aplique una obligación legal.",
      exportEligible: true,
    },
    provenance: {
      source: productSource(simulation.runtimeMetadata.sourceType),
      resultFormatVersion: resultFormatVersion(simulation),
      schemaVersion: simulation.identity.schemaVersion,
    },
  };
}

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
      account: "authenticated_account",
      savedSimulations: "eligible_saved_simulations",
      simulationDrafts: "eligible_simulation_drafts",
      simulationHistory: "eligible_user_visible_history",
      deletion: "not_included",
    },
    account: { identityState: "authenticated", sessionStatus: "active" },
    savedSimulations,
    simulationDrafts,
    simulationHistory,
    excluded: [
      {
        category: "Acciones de eliminación",
        reason: "Esta descarga no ejecuta ni incluye solicitudes de eliminación.",
      },
    ],
  };
}

function supportsSimulationRecordExportProvider(
  value: unknown,
): value is SupabaseSimulationRecordExportProvider {
  return (
    isRecord(value) &&
    typeof value.listExportEligibleSimulationRecords === "function"
  );
}

function supportsSimulationHistoryReadProvider(
  value: unknown,
): value is SupabaseSimulationHistoryEntryReadProvider {
  return (
    isRecord(value) &&
    typeof value.listSimulationHistoryEntries === "function"
  );
}

function supportsSimulationDraftReadProvider(
  value: unknown,
): value is SupabaseSimulationDraftReadProvider {
  return isRecord(value) && typeof value.listSimulationDrafts === "function";
}

function mapDraft(row: SimulationDraftRow): AccountDataExportSimulationDraft {
  return {
    id: row.draft_id,
    status: row.draft_status,
    draftPayload: sanitizeAccountExportDerivedContent(row.draft_payload),
    draftText: row.draft_text_snapshot,
    clarificationAnswers: sanitizeAccountExportDerivedContent(
      row.clarification_answers_snapshot,
    ),
    structuredContext: sanitizeAccountExportDerivedContent(
      row.structured_context_snapshot,
    ),
    language: row.language,
    autosaveEnabled: row.autosave_enabled,
    originatingSurface: productDraftSource(row.originating_surface),
    convertedRecordId: row.converted_record_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastAutosavedAt: row.last_autosaved_at,
    expiresAt: row.expires_at,
    discardedAt: row.discarded_at,
    deletionState: row.deletion_state,
    retentionRule: "Borrador temporal con caducidad indicada en expiresAt.",
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
    eventSource: productHistorySource(row.event_source),
    summary:
      row.event_summary && !INTERNAL_CONTENT_VALUE.test(row.event_summary)
        ? row.event_summary
        : null,
    eventPayload: sanitizeAccountExportDerivedContent(row.event_payload),
    beforeReference: row.before_reference,
    afterReference: row.after_reference,
    revisionReference: row.revision_reference,
    outcomeSnapshot: sanitizeAccountExportDerivedContent(row.outcome_snapshot),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletionState: row.deletion_state,
    retentionRule: "Vinculada al ciclo de vida de la simulación guardada.",
    exportEligible: true,
    schemaVersion: row.schema_version,
  };
}

async function readOwnerScopedSavedSimulations(
  authContext: LevioSessionContext,
  runtime: PersistenceRuntimeWiring,
): Promise<
  | { status: "ready"; simulations: AccountDataExportSavedSimulation[] }
  | { status: "read_failed" }
> {
  if (
    runtime.status !== "ready" ||
    !supportsSimulationRecordExportProvider(runtime.providerAdapter)
  ) {
    return { status: "read_failed" };
  }

  const preflight = await runtime.preflight({
    operation: "list_simulation_records",
    authContext,
  });
  if (preflight.status === "blocked") return { status: "read_failed" };

  const rows = await runtime.providerAdapter.listExportEligibleSimulationRecords({
    ownerPrincipalId: preflight.principalId,
    limit: MAX_EXPORTED_SAVED_SIMULATIONS,
  });

  if (
    rows.some(
      (row) =>
        row.owner_principal_id !== preflight.principalId ||
        row.owner_principal_type !== "registered_user" ||
        (row.record_status !== "active" && row.record_status !== "archived") ||
        (row.record_status === "archived" && row.archived_at === null) ||
        row.export_eligible !== true ||
        row.deletion_state !== "active",
    )
  ) {
    return { status: "read_failed" };
  }

  return {
    status: "ready",
    simulations: rows
      .map((row) => mapSimulationRecordToDecisionSimulation(row))
      .map(mapDecisionSimulationToAccountExport),
  };
}

async function readOwnerScopedSimulationDrafts(
  authContext: LevioSessionContext,
  runtime: PersistenceRuntimeWiring,
): Promise<
  | { status: "ready"; drafts: AccountDataExportSimulationDraft[] }
  | { status: "read_failed" }
> {
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
  if (preflight.status === "blocked") return { status: "read_failed" };

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
  runtime: PersistenceRuntimeWiring,
): Promise<
  | { status: "ready"; entries: AccountDataExportSimulationHistoryEntry[] }
  | { status: "read_failed" }
> {
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
  if (preflight.status === "blocked") return { status: "read_failed" };

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

export async function readAccountDataExportSurface(
  input: AccountDataExportSurfaceInput = {},
): Promise<AccountDataExportSurfaceResult> {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const authContext = input.authContext ?? (await readServerAuthSession());

  if (authContext.identityState !== "authenticated") {
    return {
      status: "blocked",
      reason: "auth_required",
      message: "Inicia sesión para exportar los datos de esta cuenta.",
    };
  }

  const runtime = input.runtime ?? initializePersistenceRuntimeWiring();
  const [savedSimulations, drafts, simulationHistory] = await Promise.all([
    readOwnerScopedSavedSimulations(authContext, runtime),
    readOwnerScopedSimulationDrafts(authContext, runtime),
    readOwnerScopedSimulationHistory(authContext, runtime),
  ]);

  if (
    savedSimulations.status === "read_failed" ||
    drafts.status === "read_failed" ||
    simulationHistory.status === "read_failed"
  ) {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo preparar la exportación de datos de forma controlada.",
    };
  }

  const document = createDocument(
    generatedAt,
    savedSimulations.simulations,
    drafts.drafts,
    simulationHistory.entries,
  );

  if (
    document.savedSimulations.length === 0 &&
    document.simulationDrafts.length === 0 &&
    document.simulationHistory.length === 0
  ) {
    return { status: "empty", document };
  }

  return { status: "ready", document };
}
