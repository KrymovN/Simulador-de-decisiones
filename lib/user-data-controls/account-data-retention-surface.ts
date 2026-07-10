import { readServerAuthSession } from "../auth/session";
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
  "stage-7-account-data-retention-surface.1" as const;

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

export type AccountDataRetentionPlanDocument = {
  retentionPlanVersion: typeof ACCOUNT_DATA_RETENTION_SURFACE_VERSION;
  format: "levio-account-data-retention-plan-json";
  generatedAt: string;
  scope: {
    account: "authenticated_session_summary";
    savedSimulations: "owner_scoped_saved_simulation_history";
    simulationDrafts: "not_included_in_stage_7_retention_surface";
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

function createDocument(
  generatedAt: string,
  savedSimulationRetentionPlan: AccountDataRetentionSavedSimulationPlan[],
): AccountDataRetentionPlanDocument {
  return {
    retentionPlanVersion: ACCOUNT_DATA_RETENTION_SURFACE_VERSION,
    format: "levio-account-data-retention-plan-json",
    generatedAt,
    scope: {
      account: "authenticated_session_summary",
      savedSimulations: "owner_scoped_saved_simulation_history",
      simulationDrafts: "not_included_in_stage_7_retention_surface",
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
        category: "simulationDrafts",
        reason:
          "Stage 7 retention surface reports saved simulation retention status only.",
      },
      {
        category: "simulationHistory",
        reason:
          "Stage 7 retention surface reports saved simulation retention status only.",
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
  const document = createDocument(generatedAt, savedSimulationRetentionPlan);

  if (document.savedSimulationRetentionPlan.length === 0) {
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
