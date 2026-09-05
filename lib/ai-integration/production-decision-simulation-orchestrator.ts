import "server-only";

import {
  executeCandidateDecisionMaterial,
  type DecisionMaterialAdapterExecutionConfig,
  type DecisionMaterialGroundingFailure,
} from "../ai-provider/openai-decision-material-adapter";
import type { SimulationResponseV2Draft } from "../decision-engine/contracts";
import {
  composePostProviderDecisionMaterial,
} from "../decision-engine/post-provider-boundary";
import {
  composePostProviderSimulationResponse,
} from "../decision-engine/post-provider-simulation-composition";
import type { DecisionEnginePromptContextBridgeRequest } from "./contracts";
import { bridgeDecisionEngineToPromptContext } from "./decision-engine-prompt-context-bridge";

export const PRODUCTION_DECISION_SIMULATION_ORCHESTRATOR_VERSION =
  "stage-9-production-decision-simulation-orchestrator.1" as const;

const REQUEST_KEYS = ["orchestrationId", "bridgeRequest"] as const;
const DEPENDENCY_KEYS = [
  "enabled",
  "apiKeyAvailable",
  "provider",
  "transport",
  "requestedAt",
  "now",
] as const;
const STAGES = [
  "decision_prompt_context",
  "provider_adapter",
  "post_provider_decision_engine",
  "simulation_composition",
] as const;

export type ProductionDecisionSimulationOrchestratorStage =
  (typeof STAGES)[number];

export type ProductionDecisionSimulationOrchestratorRequest = {
  orchestrationId: string;
  bridgeRequest: DecisionEnginePromptContextBridgeRequest;
};

export type ProductionDecisionSimulationOrchestratorDependencies =
  DecisionMaterialAdapterExecutionConfig;

export type ProductionDecisionSimulationOrchestratorErrorCode =
  | "orchestration_input_invalid"
  | "prompt_context_boundary_failed"
  | "provider_adapter_failed"
  | "post_provider_decision_engine_failed"
  | "simulation_composition_failed"
  | "orchestration_internal_failure";

export type ProductionDecisionSimulationOrchestratorTraceEntry = {
  stage: ProductionDecisionSimulationOrchestratorStage;
  status: "completed" | "failed" | "skipped";
  sourceCode?: string;
};

export type ProductionDecisionSimulationOrchestratorEvidence = {
  serverOnly: true;
  canonicalBoundaryOrderEnforced: true;
  injectedProviderTransportUsed: boolean;
  postProviderDecisionEngineRequired: true;
  directProviderToSimulatorAllowed: false;
  directProviderToUiAllowed: false;
  rawProviderMaterialReturned: false;
  providerMetadataReturned: false;
  orchestratorCredentialAccessCount: 0;
  orchestratorDirectNetworkRequestCount: 0;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  persistenceIntegrated: false;
};

export type ProductionDecisionSimulationOrchestratorResult =
  | {
      status: "completed";
      execution: "server_only_canonical_ai_flow";
      version: typeof PRODUCTION_DECISION_SIMULATION_ORCHESTRATOR_VERSION;
      orchestrationId: string;
      response: SimulationResponseV2Draft;
      trace: ProductionDecisionSimulationOrchestratorTraceEntry[];
      evidence: ProductionDecisionSimulationOrchestratorEvidence;
    }
  | {
      status: "failed";
      execution: "controlled_fail_closed";
      version: typeof PRODUCTION_DECISION_SIMULATION_ORCHESTRATOR_VERSION;
      orchestrationId?: string;
      error: {
        code: ProductionDecisionSimulationOrchestratorErrorCode;
        stage: ProductionDecisionSimulationOrchestratorStage | "orchestrator";
        sourceCode?: string;
        groundingFailure?: DecisionMaterialGroundingFailure;
        message: string;
        retryable: false;
      };
      trace: ProductionDecisionSimulationOrchestratorTraceEntry[];
      evidence: ProductionDecisionSimulationOrchestratorEvidence;
    };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

function boundedId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{2,47}$/i.test(value);
}

function dependenciesAreInjected(
  value: unknown,
): value is ProductionDecisionSimulationOrchestratorDependencies {
  return record(value) &&
    Object.keys(value).every((key) => DEPENDENCY_KEYS.includes(key as never)) &&
    typeof value.enabled === "boolean" &&
    typeof value.apiKeyAvailable === "boolean" &&
    (value.provider === undefined || typeof value.provider === "string") &&
    record(value.transport) &&
    typeof value.transport.countInput === "function" &&
    typeof value.transport.generate === "function";
}

function evidence(
  injectedProviderTransportUsed: boolean,
): ProductionDecisionSimulationOrchestratorEvidence {
  return {
    serverOnly: true,
    canonicalBoundaryOrderEnforced: true,
    injectedProviderTransportUsed,
    postProviderDecisionEngineRequired: true,
    directProviderToSimulatorAllowed: false,
    directProviderToUiAllowed: false,
    rawProviderMaterialReturned: false,
    providerMetadataReturned: false,
    orchestratorCredentialAccessCount: 0,
    orchestratorDirectNetworkRequestCount: 0,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    persistenceIntegrated: false,
  };
}

function skippedAfter(
  failedStage: ProductionDecisionSimulationOrchestratorStage,
): ProductionDecisionSimulationOrchestratorTraceEntry[] {
  const failedIndex = STAGES.indexOf(failedStage);
  return STAGES.slice(failedIndex + 1).map((stage) => ({
    stage,
    status: "skipped" as const,
  }));
}

function failed(input: {
  orchestrationId?: string;
  code: ProductionDecisionSimulationOrchestratorErrorCode;
  stage: ProductionDecisionSimulationOrchestratorStage | "orchestrator";
  sourceCode?: string;
  groundingFailure?: DecisionMaterialGroundingFailure;
  message: string;
  trace?: ProductionDecisionSimulationOrchestratorTraceEntry[];
  injectedProviderTransportUsed?: boolean;
}): ProductionDecisionSimulationOrchestratorResult {
  return {
    status: "failed",
    execution: "controlled_fail_closed",
    version: PRODUCTION_DECISION_SIMULATION_ORCHESTRATOR_VERSION,
    ...(input.orchestrationId ? { orchestrationId: input.orchestrationId } : {}),
    error: {
      code: input.code,
      stage: input.stage,
      ...(input.sourceCode ? { sourceCode: input.sourceCode } : {}),
      ...(input.groundingFailure ? { groundingFailure: input.groundingFailure } : {}),
      message: input.message,
      retryable: false,
    },
    trace: input.trace ?? [],
    evidence: evidence(input.injectedProviderTransportUsed === true),
  };
}

function stageFailure(input: {
  orchestrationId: string;
  code: ProductionDecisionSimulationOrchestratorErrorCode;
  stage: ProductionDecisionSimulationOrchestratorStage;
  sourceCode: string;
  groundingFailure?: DecisionMaterialGroundingFailure;
  message: string;
  completed: ProductionDecisionSimulationOrchestratorTraceEntry[];
  injectedProviderTransportUsed: boolean;
}): ProductionDecisionSimulationOrchestratorResult {
  return failed({
    orchestrationId: input.orchestrationId,
    code: input.code,
    stage: input.stage,
    sourceCode: input.sourceCode,
    groundingFailure: input.groundingFailure,
    message: input.message,
    trace: [
      ...input.completed,
      { stage: input.stage, status: "failed", sourceCode: input.sourceCode },
      ...skippedAfter(input.stage),
    ],
    injectedProviderTransportUsed: input.injectedProviderTransportUsed,
  });
}

/**
 * Runs the canonical server-only AI chain through every existing boundary.
 * Provider transport is injected; this module reads no credentials or env and
 * performs no direct network, API, UI, or persistence work.
 */
export async function executeProductionDecisionSimulationFlow(
  value: unknown,
  dependencies: unknown,
): Promise<ProductionDecisionSimulationOrchestratorResult> {
  if (!record(value) || !exactKeys(value, REQUEST_KEYS) || !boundedId(value.orchestrationId)) {
    return failed({
      code: "orchestration_input_invalid",
      stage: "orchestrator",
      message: "Canonical orchestration request is invalid.",
    });
  }
  const orchestrationId = value.orchestrationId;
  if (!dependenciesAreInjected(dependencies)) {
    return failed({
      orchestrationId,
      code: "orchestration_input_invalid",
      stage: "orchestrator",
      message: "Server-only provider transport dependencies are invalid.",
    });
  }

  const completed: ProductionDecisionSimulationOrchestratorTraceEntry[] = [];
  try {
    const bridge = bridgeDecisionEngineToPromptContext(value.bridgeRequest);
    if (bridge.status !== "ready") {
      return stageFailure({
        orchestrationId,
        code: "prompt_context_boundary_failed",
        stage: "decision_prompt_context",
        sourceCode: bridge.error.code,
        message: "Decision Engine to Prompt Context boundary rejected the request.",
        completed,
        injectedProviderTransportUsed: true,
      });
    }
    completed.push({ stage: "decision_prompt_context", status: "completed" });

    const provider = await executeCandidateDecisionMaterial(
      bridge.promptContextOutput,
      dependencies,
    );
    if (provider.status !== "completed") {
      return stageFailure({
        orchestrationId,
        code: "provider_adapter_failed",
        stage: "provider_adapter",
        sourceCode: provider.error.category,
        groundingFailure: provider.error.groundingFailure,
        message: "Provider Adapter did not produce validated candidate decision material.",
        completed,
        injectedProviderTransportUsed: true,
      });
    }
    completed.push({ stage: "provider_adapter", status: "completed" });

    const postProvider = composePostProviderDecisionMaterial({
      boundaryId: `${orchestrationId}_decision_engine`,
      bridgeRequest: value.bridgeRequest,
      candidateMaterial: provider.candidateMaterial,
    });
    if (postProvider.status !== "composed") {
      return stageFailure({
        orchestrationId,
        code: "post_provider_decision_engine_failed",
        stage: "post_provider_decision_engine",
        sourceCode: postProvider.error.code,
        message: "Post-provider Decision Engine rejected candidate material.",
        completed,
        injectedProviderTransportUsed: true,
      });
    }
    completed.push({ stage: "post_provider_decision_engine", status: "completed" });

    const simulation = composePostProviderSimulationResponse(postProvider);
    if (simulation.status !== "composed") {
      return stageFailure({
        orchestrationId,
        code: "simulation_composition_failed",
        stage: "simulation_composition",
        sourceCode: simulation.error.code,
        message: "Simulator composition rejected the controlled Decision Engine result.",
        completed,
        injectedProviderTransportUsed: true,
      });
    }
    completed.push({ stage: "simulation_composition", status: "completed" });

    return {
      status: "completed",
      execution: "server_only_canonical_ai_flow",
      version: PRODUCTION_DECISION_SIMULATION_ORCHESTRATOR_VERSION,
      orchestrationId,
      response: simulation.response,
      trace: completed,
      evidence: evidence(true),
    };
  } catch {
    const lastCompleted = completed.at(-1)?.stage;
    const nextStage = STAGES[Math.min(
      lastCompleted === undefined ? 0 : STAGES.indexOf(lastCompleted) + 1,
      STAGES.length - 1,
    )];
    return stageFailure({
      orchestrationId,
      code: "orchestration_internal_failure",
      stage: nextStage,
      sourceCode: "controlled_internal_error",
      message: "Canonical server-only orchestration failed closed.",
      completed,
      injectedProviderTransportUsed: true,
    });
  }
}
