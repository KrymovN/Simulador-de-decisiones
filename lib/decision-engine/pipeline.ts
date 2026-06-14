import type { DecisionEngineResult, SimulationResponseV2Draft } from "./contracts";
import { runDecisionEngine } from "./orchestrator";
import {
  mapDecisionEngineResultToSimulationResponseV2,
  validateSimulationResponseV2DraftShape,
} from "./simulation-response";
import type {
  ControlledFailure,
  DecisionEngineOrchestratorOptions,
  DecisionInput,
  Score,
} from "./types";

export type SimulationPipelineOptions = DecisionEngineOrchestratorOptions;

function pipelineFailure(message: string): ControlledFailure {
  return {
    code: "validation_failure",
    message,
    retryable: false,
    retryGuidance: "Review the deterministic runtime contracts before retrying.",
  };
}

function failedDecisionResult(result: DecisionEngineResult, failure: ControlledFailure): DecisionEngineResult {
  return {
    ...result,
    status: "failed",
    scenarios: [],
    risks: [],
    recommendations: [],
    failure,
    controlledFailures: [...result.controlledFailures, failure],
    trace: {
      ...result.trace,
      pipelineStatus: "failed",
      schemaValidation: {
        ...result.trace.schemaValidation,
        valid: false,
        errors: [...result.trace.schemaValidation.errors, failure.message],
      },
      processingNotices: [...result.trace.processingNotices, failure.message],
    },
  };
}

function mapFailedDecisionResult(
  result: DecisionEngineResult,
  failure: ControlledFailure,
): SimulationResponseV2Draft {
  const response = mapDecisionEngineResultToSimulationResponseV2(failedDecisionResult(result, failure));

  response.traceability.responseMapping.push({
    stage: "response_validation",
    status: "failed",
    detail: failure.message,
    sourceEntityIds: [response.responseId],
  });

  return validateSimulationResponseV2DraftShape(response)
    ? response
    : emergencyFailureResponse(result.input, failure);
}

function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function emergencyScore(message: string): Score {
  return {
    value: 0,
    band: "very_low",
    rationale: message,
    evidenceRefs: [],
  };
}

function emergencyFailureResponse(
  input: DecisionInput,
  failure: ControlledFailure,
): SimulationResponseV2Draft {
  const unsafeInput = input as unknown as {
    requestId?: unknown;
    input?: { originalText?: unknown; inputLanguage?: unknown; requestedOutputLanguage?: unknown };
  };
  const requestId = safeString(unsafeInput?.requestId, "invalid_request");
  const inputLanguage = safeString(unsafeInput?.input?.inputLanguage, "und");
  const outputLanguage = safeString(unsafeInput?.input?.requestedOutputLanguage, inputLanguage);
  const score = emergencyScore(failure.message);

  return {
    contractVersion: "2.0",
    responseId: `response_failed_${requestId}`,
    requestId,
    generatedAt: "not_recorded",
    status: "failed",
    language: { input: inputLanguage, output: outputLanguage },
    decision: {
      statement: safeString(unsafeInput?.input?.originalText, ""),
      decisionTypes: [],
      secondaryGoals: [],
      optionSummaries: [],
      keyConstraints: [],
    },
    modelQuality: {
      completeness: {
        score: 0,
        band: "very_low",
        blockingDimensions: ["runtime_validation"],
        explanation: failure.message,
      },
      confidence: {
        score: 0,
        band: "very_low",
        explanation: failure.message,
        limitations: [failure.message],
        calibration: "model_quality_not_probability",
        stages: {
          overall: score,
          completeness: score,
          clarification: score,
          calibration: "model_quality_not_probability",
        },
      },
    },
    gaps: [],
    contradictions: [],
    safety: {
      level: "standard",
      domain: "general",
      recommendationAllowed: false,
      message: "A controlled internal failure prevented a valid deterministic simulation response.",
      suggestedSupport: [],
      prohibitedOutputs: [],
    },
    availability: {
      scenarios: { status: "not_applicable", reasons: [failure.message] },
      risks: { status: "not_applicable", reasons: [failure.message] },
      recommendation: { status: "not_applicable", reasons: [failure.message] },
    },
    traceability: {
      evidence: [],
      policyVersion: "deterministic-stage-3.9",
      inputValidation: { valid: false, errors: [failure.message] },
      completeness: [],
      gaps: [],
      contradictions: [],
      clarification: [],
      scenarios: [],
      risks: [],
      recommendations: [],
      orchestrator: [],
      responseMapping: [
        {
          stage: "response_mapping",
          status: "failed",
          detail: failure.message,
          sourceEntityIds: [],
        },
        {
          stage: "response_validation",
          status: "failed",
          detail: "The emergency controlled-failure draft was returned without normal analysis.",
          sourceEntityIds: [],
        },
      ],
    },
    notices: [
      {
        code: "technical_limitation",
        severity: "critical",
        message: failure.message,
      },
    ],
    controlledFailures: [failure],
    failure,
  };
}

/**
 * Runs the complete deterministic simulation pipeline and returns a validated
 * SimulationResponse V2 draft without connecting it to product runtime.
 */
export function runSimulationPipeline(
  input: DecisionInput,
  options: SimulationPipelineOptions = {},
): SimulationResponseV2Draft {
  let decisionResult: DecisionEngineResult | undefined;

  try {
    decisionResult = runDecisionEngine(input, options);
    const response = mapDecisionEngineResultToSimulationResponseV2(decisionResult);

    if (!validateSimulationResponseV2DraftShape(response)) {
      return mapFailedDecisionResult(
        decisionResult,
        pipelineFailure("SimulationResponse V2 draft validation failed."),
      );
    }

    response.traceability.responseMapping.push({
      stage: "response_validation",
      status: "completed",
      detail: "Validated the SimulationResponse V2 draft envelope and lifecycle invariants.",
      sourceEntityIds: [response.responseId],
    });

    return response;
  } catch {
    const failure: ControlledFailure = {
      code: "internal_error",
      message: "The deterministic simulation pipeline encountered a controlled internal error.",
      retryable: false,
      retryGuidance: "Review the deterministic runtime trace and contracts before retrying.",
    };

    if (decisionResult) {
      try {
        return mapFailedDecisionResult(decisionResult, failure);
      } catch {
        return emergencyFailureResponse(input, failure);
      }
    }

    return emergencyFailureResponse(input, failure);
  }
}
