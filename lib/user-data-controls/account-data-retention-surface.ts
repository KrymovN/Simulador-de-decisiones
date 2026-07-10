import { readServerAuthSession } from "../auth/session";
import type { LevioSessionContext } from "../auth/types";
import {
  initializePersistenceRuntimeWiring,
  type SimulationDraftRow,
  type SupabaseSimulationDraftReadProvider,
} from "../persistence-runtime";
import type { DecisionSimulationDomainModel } from "../saved-decision-simulations/contracts";
import { listDecisionSimulations } from "../saved-decision-simulations/runtime";
import type {
  RetentionDecision,
  RetentionLifecycleState,
  RetentionResourceSnapshot,
  RetentionRuntimeEvaluationResult,
} from "./contracts";
import {
  createRetentionRuntimeFoundation,
  DEFAULT_RETENTION_RUNTIME_POLICIES,
} from "./retention-runtime";

export const ACCOUNT_DATA_RETENTION_SURFACE_VERSION =
  "stage-7-account-data-retention-surface.2" as const;

const MAX_RETENTION_DRAFTS = 1000;

type AccountDataRetentionSavedSimulationPlan = {
  id: string;
  href: string;
  title: string;
  lifecycleState: RetentionLifecycleState;
  deletionState: RetentionResourceSnapshot["deletionState"];
  retentionRule: string;
  evaluationStatus: RetentionRuntimeEvaluationResult["status"];
  retentionDecision: RetentionDecision | "not_evaluated";
  lifecycleAction: "none" | "deletion_planning" | "restriction_review";
  execution: "preflight_only" | "none";
  retentionJob: "not_started";
  databaseWrites: "not_executed";
  reason: string;
};

type AccountDataRetentionSimulationDraftPlan = {
  id: string;
  status: SimulationDraftRow["draft_status"];
  expiresAt: string;
  lifecycleState: RetentionLifecycleState;
  deletionState: RetentionResourceSnapshot["deletionState"];
  retentionRule: string;
  evaluationStatus: RetentionRuntimeEvaluationResult["status"];
  retentionDecision: RetentionDecision | "not_evaluated";
  lifecycleAction: "none" | "deletion_planning" | "restriction_review";
  execution: "preflight_only" | "none";
  retentionJob: "not_started";
  databaseWrites: "not_executed";
  reason: string;
};

export type AccountDataRetentionPlanDocument = {
  retentionPlanVersion: typeof ACCOUNT_DATA_RETENTION_SURFACE_VERSION;
  format: "levio-account-data-retention-plan-json";
  generatedAt: string;
  scope: {
    account: "authenticated_session_summary";
    savedSimulations: "owner_scoped_saved_simulation_history";
    simulationDrafts: "owner_scoped_simulation_drafts";
    simulationHistory: "not_included_in_stage_7_retention_surface";
    deletion: "not_executed";
    retention: "planning_status_only_no_enforcement";
  };
  account: {
    identityState: "authenticated";
    sessionStatus: "active";
  };
  retentionRuntime: {
    mode: "retention_foundation_preflight";
    enabled: true;
    writesEnabled: false;
  };
  savedSimulationRetentionPlan: AccountDataRetentionSavedSimulationPlan[];
  simulationDraftRetentionPlan: AccountDataRetentionSimulationDraftPlan[];
  safety: {
    retentionEnforcement: "not_started";
    retentionJobs: "not_started";
    deletionExecution: "not_executed";
    hardDelete: "not_executed";
    databaseWrites: "not_executed";
    accountDeletion: "not_included";
  };
  excluded: Array<{
    category: string;
    reason: string;
  }>;
};

export type AccountDataRetentionSurfaceResult =
  | {
      status: "ready";
      document: AccountDataRetentionPlanDocument;
    }
  | {
      status: "empty";
      document: AccountDataRetentionPlanDocument;
    }
  | {
      status: "blocked";
      reason: "auth_required" | "read_failed";
      message: string;
    };

function toRetentionLifecycleState(
  simulation: DecisionSimulationDomainModel,
): RetentionLifecycleState {
  if (simulation.lifecycleMetadata.state === "reopened") {
    return "active";
  }

  return simulation.lifecycleMetadata.state;
}

function toResourceSnapshot(
  simulation: DecisionSimulationDomainModel,
): RetentionResourceSnapshot {
  return {
    resourceId: simulation.identity.simulationId,
    resourceCategory: "saved_simulation",
    ownerPrincipalId: simulation.ownership.ownerPrincipalId,
    ownerPrincipalType: simulation.ownership.ownerPrincipalType,
    lifecycleState: toRetentionLifecycleState(simulation),
    deletionState: simulation.lifecycleMetadata.deletionState,
    retentionRule: simulation.lifecycleMetadata.retentionRule,
    createdAt: simulation.identity.createdAt,
    updatedAt: simulation.identity.updatedAt,
    archivedAt: simulation.lifecycleMetadata.archivedAt,
    deletedAt: simulation.lifecycleMetadata.deletedAt,
    expiresAt: null,
    legalHoldReason: simulation.lifecycleMetadata.legalHoldReason,
    exportEligible: simulation.lifecycleMetadata.exportEligible,
  };
}

function titleFromSimulation(simulation: DecisionSimulationDomainModel): string {
  return simulation.simulationInput.title ?? "Simulación guardada";
}

function reasonFromEvaluation(result: RetentionRuntimeEvaluationResult): string {
  if (result.status === "blocked") {
    return result.message;
  }

  if (result.decision === "retain") {
    return "Owner-scoped saved simulation is retained until user deletion, account lifecycle change, or approved retention policy change.";
  }

  return "Owner-scoped saved simulation has a retention lifecycle state that requires planning review only.";
}

function toPlanItem(
  simulation: DecisionSimulationDomainModel,
  evaluation: RetentionRuntimeEvaluationResult,
): AccountDataRetentionSavedSimulationPlan {
  const lifecycleState = toRetentionLifecycleState(simulation);

  if (evaluation.status === "blocked") {
    return {
      id: simulation.identity.simulationId,
      href: `/dashboard/simulations/${simulation.identity.simulationId}`,
      title: titleFromSimulation(simulation),
      lifecycleState,
      deletionState: simulation.lifecycleMetadata.deletionState,
      retentionRule: simulation.lifecycleMetadata.retentionRule,
      evaluationStatus: "blocked",
      retentionDecision: "not_evaluated",
      lifecycleAction: "none",
      execution: "none",
      retentionJob: "not_started",
      databaseWrites: "not_executed",
      reason: reasonFromEvaluation(evaluation),
    };
  }

  return {
    id: simulation.identity.simulationId,
    href: `/dashboard/simulations/${simulation.identity.simulationId}`,
    title: titleFromSimulation(simulation),
    lifecycleState,
    deletionState: simulation.lifecycleMetadata.deletionState,
    retentionRule: evaluation.retentionRule,
    evaluationStatus: "allowed",
    retentionDecision: evaluation.decision,
    lifecycleAction: evaluation.lifecycleAction,
    execution: evaluation.execution,
    retentionJob: "not_started",
    databaseWrites: "not_executed",
    reason: reasonFromEvaluation(evaluation),
  };
}

function supportsSimulationDraftRetentionReadProvider(
  value: unknown,
): value is SupabaseSimulationDraftReadProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    "listSimulationDraftsForRetention" in value &&
    typeof value.listSimulationDraftsForRetention === "function"
  );
}

function toDraftResourceSnapshot(row: SimulationDraftRow): RetentionResourceSnapshot {
  return {
    resourceId: row.draft_id,
    resourceCategory: "simulation_draft",
    ownerPrincipalId: row.owner_principal_id,
    ownerPrincipalType: row.owner_principal_type,
    lifecycleState: row.draft_status,
    deletionState: row.deletion_state,
    retentionRule: row.retention_rule,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: null,
    deletedAt: row.deleted_at,
    expiresAt: row.expires_at,
    legalHoldReason: row.legal_hold_reason,
    exportEligible: row.export_eligible,
  };
}

function toDraftPlanItem(
  row: SimulationDraftRow,
  evaluation: RetentionRuntimeEvaluationResult,
): AccountDataRetentionSimulationDraftPlan {
  const base = {
    id: row.draft_id,
    status: row.draft_status,
    expiresAt: row.expires_at,
    lifecycleState: row.draft_status,
    deletionState: row.deletion_state,
    retentionRule: row.retention_rule,
    retentionJob: "not_started" as const,
    databaseWrites: "not_executed" as const,
  };

  if (evaluation.status === "blocked") {
    return {
      ...base,
      evaluationStatus: "blocked",
      retentionDecision: "not_evaluated",
      lifecycleAction: "none",
      execution: "none",
      reason: evaluation.message,
    };
  }

  return {
    ...base,
    retentionRule: evaluation.retentionRule,
    evaluationStatus: "allowed",
    retentionDecision: evaluation.decision,
    lifecycleAction: evaluation.lifecycleAction,
    execution: evaluation.execution,
    reason:
      evaluation.decision === "retain_until_expiration"
        ? "Owner-scoped simulation draft is retained until its configured expiration."
        : "Owner-scoped simulation draft requires retention planning review only.",
  };
}

async function readOwnerScopedSimulationDrafts(
  authContext: LevioSessionContext,
  generatedAt: string,
  runtime: ReturnType<typeof createRetentionRuntimeFoundation>,
): Promise<
  | { status: "ready"; drafts: AccountDataRetentionSimulationDraftPlan[] }
  | { status: "read_failed" }
> {
  const persistenceRuntime = initializePersistenceRuntimeWiring();

  if (
    persistenceRuntime.status !== "ready" ||
    !supportsSimulationDraftRetentionReadProvider(persistenceRuntime.providerAdapter)
  ) {
    return { status: "read_failed" };
  }

  const preflight = await persistenceRuntime.preflight({
    operation: "list_simulation_drafts",
    authContext,
  });

  if (preflight.status === "blocked") {
    return { status: "read_failed" };
  }

  const rows = await persistenceRuntime.providerAdapter.listSimulationDraftsForRetention({
    ownerPrincipalId: preflight.principalId,
    limit: MAX_RETENTION_DRAFTS,
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

  return {
    status: "ready",
    drafts: rows.map((row) =>
      toDraftPlanItem(
        row,
        runtime.evaluate({
          authContext,
          resource: toDraftResourceSnapshot(row),
          now: generatedAt,
        }),
      ),
    ),
  };
}

function createDocument(
  generatedAt: string,
  savedSimulationRetentionPlan: AccountDataRetentionSavedSimulationPlan[],
  simulationDraftRetentionPlan: AccountDataRetentionSimulationDraftPlan[],
): AccountDataRetentionPlanDocument {
  return {
    retentionPlanVersion: ACCOUNT_DATA_RETENTION_SURFACE_VERSION,
    format: "levio-account-data-retention-plan-json",
    generatedAt,
    scope: {
      account: "authenticated_session_summary",
      savedSimulations: "owner_scoped_saved_simulation_history",
      simulationDrafts: "owner_scoped_simulation_drafts",
      simulationHistory: "not_included_in_stage_7_retention_surface",
      deletion: "not_executed",
      retention: "planning_status_only_no_enforcement",
    },
    account: {
      identityState: "authenticated",
      sessionStatus: "active",
    },
    retentionRuntime: {
      mode: "retention_foundation_preflight",
      enabled: true,
      writesEnabled: false,
    },
    savedSimulationRetentionPlan,
    simulationDraftRetentionPlan,
    safety: {
      retentionEnforcement: "not_started",
      retentionJobs: "not_started",
      deletionExecution: "not_executed",
      hardDelete: "not_executed",
      databaseWrites: "not_executed",
      accountDeletion: "not_included",
    },
    excluded: [
      {
        category: "simulationHistory",
        reason:
          "Stage 7 retention surface does not yet report simulation history retention status.",
      },
      {
        category: "retentionEnforcement",
        reason:
          "Retention enforcement and retention jobs are outside this Stage 7 substep.",
      },
      {
        category: "deletionExecution",
        reason: "Deletion execution is outside this Stage 7 retention surface.",
      },
    ],
  };
}

export async function readAccountDataRetentionSurface(): Promise<AccountDataRetentionSurfaceResult> {
  const generatedAt = new Date().toISOString();
  const authContext = await readServerAuthSession();

  if (authContext.identityState !== "authenticated") {
    return {
      status: "blocked",
      reason: "auth_required",
      message: "Inicia sesión para preparar el estado de retención de esta cuenta.",
    };
  }

  const savedSimulations = await listDecisionSimulations({
    authContext,
  });

  if (savedSimulations.status === "blocked") {
    return {
      status: "blocked",
      reason:
        savedSimulations.reason === "auth_context_not_authenticated"
          ? "auth_required"
          : "read_failed",
      message: "No se pudo preparar el estado de retención de forma controlada.",
    };
  }

  const runtime = createRetentionRuntimeFoundation({
    enabled: true,
    policies: DEFAULT_RETENTION_RUNTIME_POLICIES,
  });
  const simulationDrafts = await readOwnerScopedSimulationDrafts(
    authContext,
    generatedAt,
    runtime,
  );

  if (simulationDrafts.status === "read_failed") {
    return {
      status: "blocked",
      reason: "read_failed",
      message: "No se pudo preparar el estado de retención de forma controlada.",
    };
  }
  const savedSimulationRetentionPlan = savedSimulations.simulations.map((simulation) =>
    toPlanItem(
      simulation,
      runtime.evaluate({
        authContext,
        resource: toResourceSnapshot(simulation),
        now: generatedAt,
      }),
    ),
  );
  const document = createDocument(
    generatedAt,
    savedSimulationRetentionPlan,
    simulationDrafts.drafts,
  );

  if (
    document.savedSimulationRetentionPlan.length === 0 &&
    document.simulationDraftRetentionPlan.length === 0
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
