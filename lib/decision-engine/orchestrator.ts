import { analyzeCompleteness } from "./completeness";
import { CONTRACT_VERSION, type DecisionEngineResult, type DecisionEngineStatus } from "./contracts";
import { detectContradictions } from "./contradictions";
import { decideClarification } from "./clarification";
import { detectCriticalGaps } from "./gaps";
import { generateRecommendations } from "./recommendations";
import { assessScenarioRisks } from "./risks";
import { generateScenarios } from "./scenarios";
import type {
  ClarificationEngineResult,
  CompletenessEngineInput,
  CompletenessEngineResult,
  ControlledFailure,
  DecisionEngineConfidenceSummary,
  DecisionEngineOrchestratorOptions,
  DecisionEngineOrchestratorTraceEntry,
  DecisionEngineTrace,
  DecisionInput,
  DeterministicRecommendation,
  DeterministicRiskAssessment,
  DeterministicScenario,
  EntityId,
  SafetyBoundary,
  Score,
  ScoreBand,
} from "./types";
import { validateDecisionInputShape } from "./validation";

const DEFAULT_SAFETY_BOUNDARY: SafetyBoundary = {
  domain: "general",
  level: "standard",
  recommendationAllowed: true,
  requiredNotices: [],
  requiredEscalations: [],
  prohibitedOutputs: [],
  rationale: "No explicit safety boundary was supplied; the orchestrator does not infer a safety domain.",
};

function scoreBand(value: number): ScoreBand {
  if (value < 20) return "very_low";
  if (value < 40) return "low";
  if (value < 60) return "medium";
  if (value < 80) return "high";
  return "very_high";
}

function summaryScore(value: number, rationale: string): Score {
  const boundedValue = Math.max(0, Math.min(100, Math.round(value)));

  return {
    value: boundedValue,
    band: scoreBand(boundedValue),
    rationale,
    evidenceRefs: [],
  };
}

function averageScore(scores: Score[], rationale: string): Score | undefined {
  if (scores.length === 0) {
    return undefined;
  }

  return summaryScore(
    scores.reduce((sum, score) => sum + score.value, 0) / scores.length,
    rationale,
  );
}

function confidenceSummary(
  analysis: CompletenessEngineResult,
  clarification: ClarificationEngineResult,
  scenarios: DeterministicScenario[],
  risks: DeterministicRiskAssessment[],
  recommendations: DeterministicRecommendation[],
): DecisionEngineConfidenceSummary {
  const scenarioConfidence = averageScore(
    scenarios.map((scenario) => scenario.confidence),
    "Average deterministic scenario-structure confidence.",
  );
  const riskConfidence = averageScore(
    risks.map((risk) => risk.confidence),
    "Average deterministic risk-assessment confidence.",
  );
  const recommendationConfidence = averageScore(
    recommendations.map((recommendation) => recommendation.confidence),
    "Average deterministic recommendation-reasoning confidence.",
  );
  const availableScores = [
    analysis.completeness.overall,
    clarification.confidence.overall,
    scenarioConfidence,
    riskConfidence,
    recommendationConfidence,
  ].filter((score): score is Score => Boolean(score));

  return {
    overall: summaryScore(
      availableScores.reduce((sum, score) => sum + score.value, 0) / availableScores.length,
      "Average available pipeline confidence; this is model-quality confidence, not outcome probability.",
    ),
    completeness: analysis.completeness.overall,
    clarification: clarification.confidence.overall,
    scenarios: scenarioConfidence,
    risks: riskConfidence,
    recommendations: recommendationConfidence,
    calibration: "model_quality_not_probability",
  };
}

function traceEntry(
  stage: DecisionEngineOrchestratorTraceEntry["stage"],
  status: DecisionEngineOrchestratorTraceEntry["status"],
  detail: string,
  sourceEntityIds: EntityId[] = [],
): DecisionEngineOrchestratorTraceEntry {
  return { stage, status, detail, sourceEntityIds };
}

function unresolvedCriticalGapExists(analysis: CompletenessEngineResult): boolean {
  return analysis.gaps.some((gap) => gap.severity === "critical" && gap.resolution !== "resolved");
}

function analysisBlockedBySafety(safety: SafetyBoundary): boolean {
  return safety.level === "restricted" || safety.level === "refuse";
}

function recommendationBlockedBySafety(safety: SafetyBoundary): boolean {
  return analysisBlockedBySafety(safety) || !safety.recommendationAllowed;
}

function statusFor(
  clarification: ClarificationEngineResult,
  safety: SafetyBoundary,
  scenarios: DeterministicScenario[],
  recommendations: DeterministicRecommendation[],
): DecisionEngineStatus {
  if (safety.level === "refuse" || clarification.decision.action === "refuse") {
    return "refused";
  }

  if (clarification.decision.action === "ask") {
    return "clarification_required";
  }

  if (
    safety.level === "restricted" ||
    clarification.decision.action === "withhold" ||
    recommendationBlockedBySafety(safety)
  ) {
    return "cannot_recommend";
  }

  const recommendation = recommendations[0];

  if (
    scenarios.length > 0 &&
    recommendation &&
    recommendation.status === "recommended" &&
    clarification.decision.action === "not_required"
  ) {
    return "analysis_ready";
  }

  return scenarios.length > 0 || recommendations.length > 0 ? "limited_analysis" : "cannot_recommend";
}

function auditTrace(
  requestId: string,
  decisionId: string | undefined,
  status: DecisionEngineStatus,
  valid: boolean,
  errors: string[],
  processingNotices: string[],
): DecisionEngineTrace {
  return {
    contractVersion: CONTRACT_VERSION,
    traceId: `trace_${requestId}`,
    requestId,
    decisionId,
    createdAt: "not_recorded",
    pipelineStatus: status,
    schemaValidation: {
      valid,
      errors,
      warnings: [],
    },
    policyVersion: "deterministic-stage-3.7",
    processingNotices,
  };
}

function invalidResult(input: DecisionInput, safety: SafetyBoundary): DecisionEngineResult {
  const requestId = typeof input?.requestId === "string" ? input.requestId : "invalid_request";
  const analysis = analyzeCompleteness({ decisionInput: input });
  const clarification = decideClarification({ analysis, safety });
  const failure: ControlledFailure = {
    code: "validation_failure",
    message: "Decision input shape validation failed.",
    retryable: false,
    retryGuidance: "Provide a DecisionInput that conforms to contract version 2.0.",
  };
  const orchestratorTrace: DecisionEngineOrchestratorTraceEntry[] = [
    traceEntry("input_validation", "failed", failure.message),
    traceEntry("completeness", "skipped", "Input validation failed."),
    traceEntry("critical_gaps", "skipped", "Input validation failed."),
    traceEntry("contradictions", "skipped", "Input validation failed."),
    traceEntry("clarification", "skipped", "Input validation failed."),
    traceEntry("scenarios", "skipped", "Input validation failed."),
    traceEntry("risks", "skipped", "Input validation failed."),
    traceEntry("recommendations", "skipped", "Input validation failed."),
  ];

  return {
    contractVersion: CONTRACT_VERSION,
    resultId: `result_${requestId}`,
    requestId,
    status: "failed",
    input,
    inputValidation: { valid: false, errors: [failure.message] },
    completeness: analysis.completeness,
    confidence: analysis.confidence,
    confidenceSummary: confidenceSummary(analysis, clarification, [], [], []),
    gaps: [],
    contradictions: [],
    clarification,
    scenarios: [],
    risks: [],
    recommendations: [],
    safety,
    trace: auditTrace(requestId, undefined, "failed", false, [failure.message], ["Pipeline stopped at input validation."]),
    orchestratorTrace,
    controlledFailures: [failure],
    failure,
  };
}

/**
 * Runs the deterministic Decision Engine stages in their required order.
 * It coordinates existing pure engines and does not infer missing context.
 */
export function runDecisionEngine(
  input: DecisionInput,
  options: DecisionEngineOrchestratorOptions = {},
): DecisionEngineResult {
  const safety = options.safety ?? DEFAULT_SAFETY_BOUNDARY;

  if (!validateDecisionInputShape(input)) {
    return invalidResult(input, safety);
  }

  const orchestratorTrace: DecisionEngineOrchestratorTraceEntry[] = [
    traceEntry("input_validation", "completed", "DecisionInput shape conforms to contract version 2.0.", [
      input.requestId,
    ]),
  ];
  const completenessInput: CompletenessEngineInput = {
    decisionInput: input,
    context: options.context,
    safety,
    safetyContextComplete: options.safetyContextComplete,
  };
  const initialAnalysis = analyzeCompleteness(completenessInput);
  orchestratorTrace.push(
    traceEntry("completeness", "completed", `Completeness level: ${initialAnalysis.completeness.level}.`),
  );

  const gaps = detectCriticalGaps(completenessInput);
  const analysis: CompletenessEngineResult = { ...initialAnalysis, gaps };
  orchestratorTrace.push(
    traceEntry("critical_gaps", "completed", `Detected ${gaps.length} deterministic gap(s).`, gaps.map((gap) => gap.id)),
  );

  const contradictions = detectContradictions(options.context);
  orchestratorTrace.push(
    traceEntry(
      "contradictions",
      "completed",
      `Detected ${contradictions.length} explicit structural contradiction(s).`,
      contradictions.map((gap) => gap.id),
    ),
  );

  const clarification = decideClarification({ analysis, safety });
  orchestratorTrace.push(
    traceEntry(
      "clarification",
      "completed",
      `Clarification action: ${clarification.decision.action}.`,
      clarification.selectedQuestions.map((question) => question.id),
    ),
  );

  let scenarios: DeterministicScenario[] = [];
  let risks: DeterministicRiskAssessment[] = [];
  let recommendations: DeterministicRecommendation[] = [];
  const scenarioBlocker =
    clarification.decision.action === "ask" ||
    clarification.decision.action === "withhold" ||
    clarification.decision.action === "refuse" ||
    analysisBlockedBySafety(safety) ||
    unresolvedCriticalGapExists(analysis) ||
    !options.context;

  if (scenarioBlocker) {
    const reasons = [
      !options.context ? "structured context is absent" : undefined,
      unresolvedCriticalGapExists(analysis) ? "an unresolved critical gap exists" : undefined,
      analysisBlockedBySafety(safety) ? `safety level ${safety.level} blocks analysis` : undefined,
      ["ask", "withhold", "refuse"].includes(clarification.decision.action)
        ? `clarification action is ${clarification.decision.action}`
        : undefined,
    ].filter((reason): reason is string => Boolean(reason));
    orchestratorTrace.push(traceEntry("scenarios", "blocked", `Scenario generation stopped because ${reasons.join("; ")}.`));
  } else {
    const scenarioResult = generateScenarios({
      context: options.context,
      analysis,
      clarification,
    });
    scenarios = scenarioResult.scenarios;
    orchestratorTrace.push(
      traceEntry(
        "scenarios",
        scenarios.length > 0 ? "completed" : "blocked",
        scenarioResult.blockedReason ?? `Generated ${scenarios.length} deterministic scenario(s).`,
        scenarios.map((scenario) => scenario.id),
      ),
    );
  }

  if (scenarios.length === 0) {
    orchestratorTrace.push(traceEntry("risks", "skipped", "No scenarios are available for risk assessment."));
  } else {
    risks = assessScenarioRisks({ scenarios, analysis, clarification }).assessments;
    orchestratorTrace.push(
      traceEntry("risks", "completed", `Assessed ${risks.length} deterministic scenario risk(s).`, risks.map((risk) => risk.id)),
    );
  }

  if (
    risks.length === 0 ||
    recommendationBlockedBySafety(safety) ||
    unresolvedCriticalGapExists(analysis) ||
    ["ask", "withhold", "refuse"].includes(clarification.decision.action)
  ) {
    orchestratorTrace.push(
      traceEntry(
        "recommendations",
        risks.length === 0 ? "skipped" : "blocked",
        risks.length === 0
          ? "No risk assessments are available for recommendation reasoning."
          : "Recommendation generation is blocked by safety, clarification, or unresolved critical gaps.",
      ),
    );
  } else {
    recommendations = generateRecommendations({
      analysis,
      clarification,
      scenarios,
      risks,
      safety,
    }).recommendations;
    orchestratorTrace.push(
      traceEntry(
        "recommendations",
        "completed",
        `Generated ${recommendations.length} deterministic recommendation(s).`,
        recommendations.map((recommendation) => recommendation.id),
      ),
    );
  }

  const status = statusFor(clarification, safety, scenarios, recommendations);
  const processingNotices = orchestratorTrace
    .filter((entry) => entry.status === "blocked" || entry.status === "skipped")
    .map((entry) => `${entry.stage}: ${entry.detail}`);

  return {
    contractVersion: CONTRACT_VERSION,
    resultId: `result_${input.requestId}`,
    requestId: input.requestId,
    status,
    input,
    context: options.context,
    inputValidation: { valid: true, errors: [] },
    completeness: analysis.completeness,
    confidence: analysis.confidence,
    confidenceSummary: confidenceSummary(analysis, clarification, scenarios, risks, recommendations),
    gaps,
    contradictions,
    clarification,
    scenarios,
    risks,
    recommendations,
    safety,
    trace: auditTrace(input.requestId, options.context?.decisionId, status, true, [], processingNotices),
    orchestratorTrace,
    controlledFailures: [],
  };
}
