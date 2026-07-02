import {
  buildDecisionContext,
  DECISION_CONTEXT_BUILDER_VERSION,
  type DecisionContextBuilderMissingFieldKind,
  type DecisionContextBuilderResult,
} from "./context-builder";
import type { SimulationResponseV2Draft } from "./contracts";
import { runSimulationPipeline } from "./pipeline";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import type { DecisionIntent, EntityId, EvidenceRef } from "./types";

export const SIMULATION_PIPELINE_RUNNER_VERSION = "0.1.0-deterministic";
export const DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER = "deterministic-engine-preview";

export type SimulationPipelineRunnerRuntimeOutcome =
  | "success"
  | "refused"
  | "clarification"
  | "cannot_recommend"
  | "simulation_failed";

export type SimulationPipelineRunnerRuntimeMetadata = {
  marker: typeof DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER;
  deterministicOnly: true;
  previewOnly: true;
  outcome: SimulationPipelineRunnerRuntimeOutcome;
  source: "builder" | "pipeline" | "runner";
  rollbackSafe: true;
};

export type SimulationPipelineRunnerRequest = {
  requestId: string;
  input: string;
  inputLanguage?: string;
  requestedOutputLanguage?: string;
  userIntent?: DecisionIntent;
};

export type SimulationPipelineRunnerStatus = "completed" | "rejected" | "failed";

export type SimulationPipelineRunnerErrorCode =
  | "builder_rejected"
  | "pipeline_failed"
  | "invalid_pipeline_response"
  | "internal_error";

export type SimulationPipelineRunnerError = {
  code: SimulationPipelineRunnerErrorCode;
  message: string;
  retryable: boolean;
  source: "builder" | "pipeline" | "runner";
};

export type SimulationPipelineRunnerTraceEntry = {
  stage: "runner_received" | "context_builder" | "simulation_pipeline" | "response_validation";
  status: "completed" | "rejected" | "failed";
  detail: string;
  sourceEntityIds: EntityId[];
};

export type SimulationPipelineRunnerBuilderMetadata = {
  status: DecisionContextBuilderResult["status"];
  builderVersion: typeof DECISION_CONTEXT_BUILDER_VERSION;
  category?: DecisionContextBuilderResult["category"];
  safetyDomain?: NonNullable<DecisionContextBuilderResult["safety"]>["domain"];
  safetyLevel?: NonNullable<DecisionContextBuilderResult["safety"]>["level"];
  safetyContextComplete: boolean;
  missingFields: DecisionContextBuilderMissingFieldKind[];
  inferenceCount: number;
  evidenceCount: number;
};

export type SimulationPipelineRunnerIsolationEvidence = {
  deterministicOnly: true;
  builderUsed: true;
  pipelineUsed: true;
  publicApiAdapterUsed: false;
  publicMockEnvelopeCreated: false;
  modelCallsExecuted: false;
  providerSdkUsed: false;
  environmentRead: false;
  apiKeyRead: false;
  persistenceUsed: false;
  authUsed: false;
  billingUsed: false;
};

export type SimulationPipelineRunnerResult = {
  status: SimulationPipelineRunnerStatus;
  runnerVersion: typeof SIMULATION_PIPELINE_RUNNER_VERSION;
  runtime: SimulationPipelineRunnerRuntimeMetadata;
  requestId: string;
  builder: SimulationPipelineRunnerBuilderMetadata;
  pipelineStatus?: SimulationResponseV2Draft["status"];
  response?: SimulationResponseV2Draft;
  error?: SimulationPipelineRunnerError;
  evidence: EvidenceRef[];
  trace: SimulationPipelineRunnerTraceEntry[];
};

function traceEntry(
  stage: SimulationPipelineRunnerTraceEntry["stage"],
  status: SimulationPipelineRunnerTraceEntry["status"],
  detail: string,
  sourceEntityIds: EntityId[] = [],
): SimulationPipelineRunnerTraceEntry {
  return { stage, status, detail, sourceEntityIds };
}

function builderMetadata(builder: DecisionContextBuilderResult): SimulationPipelineRunnerBuilderMetadata {
  return {
    status: builder.status,
    builderVersion: builder.builderVersion,
    category: builder.category,
    safetyDomain: builder.safety?.domain,
    safetyLevel: builder.safety?.level,
    safetyContextComplete: builder.safetyContextComplete,
    missingFields: builder.missing.map((field) => field.field),
    inferenceCount: builder.inferred.length,
    evidenceCount: builder.evidence.length,
  };
}

function runtimeMetadata(
  outcome: SimulationPipelineRunnerRuntimeOutcome,
  source: SimulationPipelineRunnerRuntimeMetadata["source"],
): SimulationPipelineRunnerRuntimeMetadata {
  return {
    marker: DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER,
    deterministicOnly: true,
    previewOnly: true,
    outcome,
    source,
    rollbackSafe: true,
  };
}

export function simulationRuntimeOutcomeForResponseStatus(
  status: SimulationResponseV2Draft["status"],
): SimulationPipelineRunnerRuntimeOutcome {
  if (status === "analysis_ready" || status === "limited_analysis") {
    return "success";
  }

  if (status === "refused") {
    return "refused";
  }

  if (status === "clarification_required") {
    return "clarification";
  }

  if (status === "cannot_recommend") {
    return "cannot_recommend";
  }

  return "simulation_failed";
}

function builderRejectedResult(
  requestId: string,
  builder: DecisionContextBuilderResult,
  trace: SimulationPipelineRunnerTraceEntry[],
): SimulationPipelineRunnerResult {
  return {
    status: "rejected",
    runnerVersion: SIMULATION_PIPELINE_RUNNER_VERSION,
    runtime: runtimeMetadata("simulation_failed", "builder"),
    requestId,
    builder: builderMetadata(builder),
    error: {
      code: "builder_rejected",
      message: builder.error?.message ?? "DecisionContext Builder rejected the input.",
      retryable: builder.error?.recoverable ?? true,
      source: "builder",
    },
    evidence: builder.evidence,
    trace,
  };
}

function failedResult(
  requestId: string,
  builder: DecisionContextBuilderResult,
  trace: SimulationPipelineRunnerTraceEntry[],
  error: SimulationPipelineRunnerError,
  response?: SimulationResponseV2Draft,
): SimulationPipelineRunnerResult {
  return {
    status: "failed",
    runnerVersion: SIMULATION_PIPELINE_RUNNER_VERSION,
    runtime: runtimeMetadata(
      response ? simulationRuntimeOutcomeForResponseStatus(response.status) : "simulation_failed",
      error.source,
    ),
    requestId,
    builder: builderMetadata(builder),
    pipelineStatus: response?.status,
    response,
    error,
    evidence: builder.evidence,
    trace,
  };
}

export function simulationPipelineRunnerIsolationEvidence(): SimulationPipelineRunnerIsolationEvidence {
  return {
    deterministicOnly: true,
    builderUsed: true,
    pipelineUsed: true,
    publicApiAdapterUsed: false,
    publicMockEnvelopeCreated: false,
    modelCallsExecuted: false,
    providerSdkUsed: false,
    environmentRead: false,
    apiKeyRead: false,
    persistenceUsed: false,
    authUsed: false,
    billingUsed: false,
  };
}

export function runInternalSimulationPipeline(
  request: SimulationPipelineRunnerRequest,
): SimulationPipelineRunnerResult {
  const requestId = typeof request?.requestId === "string" && request.requestId.trim()
    ? request.requestId.trim()
    : "runner_request_missing";
  const trace: SimulationPipelineRunnerTraceEntry[] = [
    traceEntry("runner_received", "completed", "Internal deterministic simulation runner received raw input.", [
      requestId,
    ]),
  ];

  try {
    const builder = buildDecisionContext({
      requestId,
      rawInput: request?.input,
      inputLanguage: request?.inputLanguage,
      requestedOutputLanguage: request?.requestedOutputLanguage,
      userIntent: request?.userIntent,
    });

    if (builder.status === "rejected") {
      trace.push(
        traceEntry(
          "context_builder",
          "rejected",
          builder.error?.message ?? "DecisionContext Builder rejected the input.",
          [requestId],
        ),
      );
      return builderRejectedResult(requestId, builder, trace);
    }

    trace.push(
      traceEntry("context_builder", "completed", "DecisionContext Builder produced DecisionInput, DecisionContext, and SafetyBoundary.", [
        builder.decisionInput?.requestId ?? requestId,
        builder.decisionContext?.decisionId ?? requestId,
      ]),
    );

    if (!builder.decisionInput || !builder.decisionContext || !builder.safety) {
      trace.push(
        traceEntry("simulation_pipeline", "failed", "Builder result was built but missing required runtime artifacts.", [
          requestId,
        ]),
      );
      return failedResult(requestId, builder, trace, {
        code: "internal_error",
        message: "Builder result was built but missing required runtime artifacts.",
        retryable: false,
        source: "runner",
      });
    }

    const response = runSimulationPipeline(builder.decisionInput, {
      context: builder.decisionContext,
      safety: builder.safety,
      safetyContextComplete: builder.safetyContextComplete,
    });
    trace.push(
      traceEntry("simulation_pipeline", "completed", `Pipeline returned status ${response.status}.`, [
        response.responseId,
      ]),
    );

    if (!validateSimulationResponseV2DraftShape(response)) {
      trace.push(
        traceEntry("response_validation", "failed", "Pipeline response did not satisfy SimulationResponseV2Draft shape.", [
          requestId,
        ]),
      );
      return failedResult(requestId, builder, trace, {
        code: "invalid_pipeline_response",
        message: "Pipeline response did not satisfy SimulationResponseV2Draft shape.",
        retryable: false,
        source: "pipeline",
      });
    }

    trace.push(
      traceEntry("response_validation", "completed", "Pipeline response satisfied SimulationResponseV2Draft shape.", [
        response.responseId,
      ]),
    );

    if (response.status === "failed") {
      return failedResult(
        requestId,
        builder,
        trace,
        {
          code: "pipeline_failed",
          message: response.failure?.message ?? "Simulation pipeline returned failed status.",
          retryable: response.failure?.retryable ?? false,
          source: "pipeline",
        },
        response,
      );
    }

    return {
      status: "completed",
      runnerVersion: SIMULATION_PIPELINE_RUNNER_VERSION,
      runtime: runtimeMetadata(simulationRuntimeOutcomeForResponseStatus(response.status), "pipeline"),
      requestId,
      builder: builderMetadata(builder),
      pipelineStatus: response.status,
      response,
      evidence: builder.evidence,
      trace,
    };
  } catch {
    const syntheticBuilder: DecisionContextBuilderResult = {
      status: "rejected",
      builderVersion: DECISION_CONTEXT_BUILDER_VERSION,
      safetyContextComplete: false,
      inferred: [],
      missing: [],
      clarificationQuestions: [],
      evidence: [],
    };
    trace.push(traceEntry("simulation_pipeline", "failed", "Internal simulation runner encountered a controlled failure.", [
      requestId,
    ]));

    return failedResult(requestId, syntheticBuilder, trace, {
      code: "internal_error",
      message: "Internal simulation runner encountered a controlled failure.",
      retryable: false,
      source: "runner",
    });
  }
}
