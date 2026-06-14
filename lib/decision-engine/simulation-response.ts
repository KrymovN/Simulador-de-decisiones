import {
  CONTRACT_VERSION,
  DECISION_ENGINE_STATUSES,
  type DecisionEngineResult,
  type RuntimeAvailability,
  type SimulationResponseV2Draft,
} from "./contracts";
import type {
  ControlledFailure,
  DecisionOption,
  DeterministicRecommendation,
  EvidenceRef,
} from "./types";

export type SimulationResponseV2MappingOptions = {
  generatedAt?: string;
};

function feasibility(option: DecisionOption): "feasible" | "infeasible" | "unknown" {
  if (option.feasible.status !== "known") {
    return "unknown";
  }

  return option.feasible.value ? "feasible" : "infeasible";
}

function inputLanguage(result: DecisionEngineResult): string {
  return result.input?.input?.inputLanguage ?? "und";
}

function outputLanguage(result: DecisionEngineResult): string {
  return result.input?.input?.requestedOutputLanguage ?? inputLanguage(result);
}

function originalStatement(result: DecisionEngineResult): string {
  return result.input?.input?.originalText ?? "";
}

function suppliedEvidence(result: DecisionEngineResult): EvidenceRef[] {
  return Array.isArray(result.input?.suppliedContext) ? result.input.suppliedContext : [];
}

function timeHorizonSummary(result: DecisionEngineResult): string | undefined {
  if (!result.context) {
    return undefined;
  }

  const knownFields = Object.entries(result.context.timeHorizon)
    .filter(([, value]) => value.status === "known")
    .map(([field]) => field);

  return knownFields.length > 0 ? `Known fields: ${knownFields.join(", ")}.` : undefined;
}

function blockerReasons(result: DecisionEngineResult, stage: "scenarios" | "risks" | "recommendations"): string[] {
  return result.orchestratorTrace
    .filter((entry) => entry.stage === stage && entry.status !== "completed")
    .map((entry) => entry.detail);
}

function availability(
  count: number,
  reasons: string[],
  failed: boolean,
  refused: boolean,
): RuntimeAvailability {
  if (count > 0) {
    return { status: "available", reasons: [] };
  }

  if (failed || refused) {
    return { status: "not_applicable", reasons };
  }

  return {
    status: reasons.length > 0 ? "blocked" : "unavailable",
    reasons,
  };
}

function recommendationForResponse(result: DecisionEngineResult): DeterministicRecommendation | undefined {
  if (result.status === "refused" || result.status === "failed" || result.status === "clarification_required") {
    return undefined;
  }

  const recommendation = result.recommendations[0];

  if (result.status === "cannot_recommend" && recommendation?.status !== "withheld") {
    return undefined;
  }

  return recommendation;
}

function safetyMessage(result: DecisionEngineResult): string {
  if (result.status === "refused") {
    return "The deterministic safety boundary requires refusal.";
  }

  if (result.status === "clarification_required") {
    return "Clarification is required before a responsible recommendation.";
  }

  if (result.status === "cannot_recommend") {
    return "The current deterministic result does not permit a recommendation.";
  }

  if (result.status === "failed") {
    return "A controlled failure prevented a valid recommendation.";
  }

  return result.safety.rationale;
}

function responseNotices(result: DecisionEngineResult): SimulationResponseV2Draft["notices"] {
  const notices: SimulationResponseV2Draft["notices"] = [];

  for (const gap of result.gaps.filter((candidate) => candidate.resolution !== "resolved")) {
    notices.push({
      code: gap.resolution === "accepted_unknown" ? "accepted_unknown" : "limited_context",
      severity: gap.severity === "critical" ? "critical" : "warning",
      message: gap.description,
    });
  }

  if (result.confidenceSummary.overall.value < 60) {
    notices.push({
      code: "uncertainty",
      severity: "warning",
      message: result.confidenceSummary.overall.rationale,
    });
  }

  if (result.safety.domain !== "general" || result.safety.level !== "standard") {
    notices.push({
      code: result.safety.level === "standard" ? "professional_review" : "high_stakes",
      severity: result.safety.level === "restricted" || result.safety.level === "refuse" ? "critical" : "warning",
      message: result.safety.rationale,
    });
  }

  for (const failure of allFailures(result)) {
    notices.push({
      code: result.status === "failed" ? "technical_limitation" : "limited_context",
      severity: "critical",
      message: failure.message,
    });
  }

  for (const entry of result.orchestratorTrace.filter(
    (candidate) =>
      (candidate.stage === "scenarios" || candidate.stage === "risks" || candidate.stage === "recommendations") &&
      candidate.status !== "completed",
  )) {
    notices.push({
      code: "technical_limitation",
      severity: entry.status === "blocked" ? "warning" : "info",
      message: `${entry.stage}: ${entry.detail}`,
    });
  }

  return notices;
}

function allFailures(result: DecisionEngineResult): ControlledFailure[] {
  const failures = [...result.controlledFailures];

  if (result.failure && !failures.some((failure) => failure.code === result.failure?.code && failure.message === result.failure.message)) {
    failures.push(result.failure);
  }

  return failures;
}

function recommendationAllowed(result: DecisionEngineResult): boolean {
  return (
    result.safety.recommendationAllowed &&
    result.status !== "clarification_required" &&
    result.status !== "cannot_recommend" &&
    result.status !== "refused" &&
    result.status !== "failed"
  );
}

/**
 * Maps an isolated deterministic DecisionEngineResult into the V2 runtime draft.
 * The mapper preserves structured reasoning and never creates missing analysis.
 */
export function mapDecisionEngineResultToSimulationResponseV2(
  result: DecisionEngineResult,
  options: SimulationResponseV2MappingOptions = {},
): SimulationResponseV2Draft {
  const context = result.context;
  const failed = result.status === "failed";
  const refused = result.status === "refused";
  const recommendation = recommendationForResponse(result);
  const scenarioReasons = blockerReasons(result, "scenarios");
  const riskReasons = blockerReasons(result, "risks");
  const recommendationReasons = blockerReasons(result, "recommendations");
  const analysisAllowed =
    result.status !== "clarification_required" && result.status !== "refused" && result.status !== "failed";
  const mappedScenarios = analysisAllowed ? result.scenarios : [];
  const mappedRisks = analysisAllowed ? result.risks : [];

  return {
    contractVersion: CONTRACT_VERSION,
    responseId: `response_${result.resultId}`,
    requestId: result.requestId,
    generatedAt: options.generatedAt ?? result.trace.createdAt,
    status: result.status,
    language: {
      input: inputLanguage(result),
      output: outputLanguage(result),
    },
    decision: {
      statement: context?.statement ?? originalStatement(result),
      decisionTypes: context?.decisionTypes ?? [],
      primaryGoal: context?.goals.find((goal) => goal.priority === "primary")?.description,
      secondaryGoals: context?.goals
        .filter((goal) => goal.priority === "secondary")
        .map((goal) => goal.description) ?? [],
      optionSummaries:
        context?.options.map((option) => ({
          id: option.id,
          label: option.label,
          type: option.type,
          feasibility: feasibility(option),
        })) ?? [],
      keyConstraints: context?.constraints.map((constraint) => constraint.description) ?? [],
      timeHorizonSummary: timeHorizonSummary(result),
    },
    modelQuality: {
      completeness: {
        score: result.completeness.overall.value,
        band: result.completeness.overall.band,
        blockingDimensions: result.completeness.blockingDimensions,
        explanation: result.completeness.overall.rationale,
      },
      confidence: {
        score: result.confidenceSummary.overall.value,
        band: result.confidenceSummary.overall.band,
        explanation: result.confidenceSummary.overall.rationale,
        limitations: result.confidence.limitations,
        calibration: "model_quality_not_probability",
        stages: result.confidenceSummary,
      },
    },
    gaps: result.gaps,
    contradictions: result.contradictions,
    clarification: result.clarification.decision.action === "not_required" ? undefined : result.clarification.decision,
    analysis:
      mappedScenarios.length > 0 || mappedRisks.length > 0
        ? {
            assumptions: context?.assumptions ?? [],
            scenarios: mappedScenarios,
            risks: mappedRisks,
          }
        : undefined,
    recommendation,
    safety: {
      level: result.safety.level,
      domain: result.safety.domain,
      recommendationAllowed: recommendationAllowed(result),
      message: safetyMessage(result),
      suggestedSupport: [...result.safety.requiredNotices, ...result.safety.requiredEscalations],
      prohibitedOutputs: result.safety.prohibitedOutputs,
    },
    availability: {
      scenarios: availability(mappedScenarios.length, scenarioReasons, failed, refused),
      risks: availability(mappedRisks.length, riskReasons, failed, refused),
      recommendation: availability(recommendation ? 1 : 0, recommendationReasons, failed, refused),
    },
    traceability: {
      evidence: context?.evidence ?? suppliedEvidence(result),
      policyVersion: result.trace.policyVersion,
      inputValidation: result.inputValidation,
      completeness: result.completenessTrace,
      gaps: result.gaps,
      contradictions: result.contradictions,
      clarification: result.clarification.traceEntries,
      scenarios: result.scenarios.flatMap((scenario) => scenario.traceEntries),
      risks: result.risks.flatMap((risk) => risk.traceEntries),
      recommendations: result.recommendations.flatMap((candidate) => candidate.traceEntries),
      orchestrator: result.orchestratorTrace,
      responseMapping: [
        {
          stage: "response_mapping",
          status: "completed",
          detail: "Mapped DecisionEngineResult into the SimulationResponse V2 draft contract.",
          sourceEntityIds: [result.resultId],
        },
      ],
    },
    notices: responseNotices(result),
    controlledFailures: allFailures(result),
    failure: result.failure,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isLifecycleStatus(value: unknown): boolean {
  return isString(value) && DECISION_ENGINE_STATUSES.includes(value as (typeof DECISION_ENGINE_STATUSES)[number]);
}

/**
 * Validates only the lightweight V2 draft envelope and lifecycle invariants.
 */
export function validateSimulationResponseV2DraftShape(value: unknown): value is SimulationResponseV2Draft {
  if (
    !isRecord(value) ||
    !isRecord(value.language) ||
    !isRecord(value.decision) ||
    !isRecord(value.modelQuality) ||
    !isRecord(value.safety) ||
    !isRecord(value.availability) ||
    !isRecord(value.traceability)
  ) {
    return false;
  }

  const recommendationAllowedForStatus =
    value.status !== "clarification_required" &&
    value.status !== "cannot_recommend" &&
    value.status !== "refused" &&
    value.status !== "failed";
  const recommendationInvariant =
    value.status === "refused" || value.status === "failed" || value.status === "clarification_required"
      ? value.recommendation === undefined
      : true;
  const analysisInvariant =
    value.status === "refused" || value.status === "failed" || value.status === "clarification_required"
      ? value.analysis === undefined
      : true;
  const clarificationInvariant =
    value.status === "clarification_required"
      ? isRecord(value.clarification) &&
        Array.isArray(value.clarification.questions) &&
        value.clarification.questions.length > 0
      : true;
  const analysisReadyInvariant =
    value.status === "analysis_ready"
      ? isRecord(value.analysis) && isRecord(value.recommendation) && value.safety.recommendationAllowed === true
      : true;
  const cannotRecommendInvariant =
    value.status === "cannot_recommend"
      ? value.recommendation === undefined ||
        (isRecord(value.recommendation) && value.recommendation.status === "withheld")
      : true;
  const hasControlledFailure = Array.isArray(value.controlledFailures) && value.controlledFailures.length > 0;
  const failedInvariant =
    value.status === "failed" ? value.failure !== undefined || hasControlledFailure : true;

  return (
    value.contractVersion === "2.0" &&
    isString(value.responseId) &&
    isString(value.requestId) &&
    isString(value.generatedAt) &&
    isLifecycleStatus(value.status) &&
    isString(value.language.input) &&
    isString(value.language.output) &&
    isString(value.decision.statement) &&
    Array.isArray(value.gaps) &&
    Array.isArray(value.contradictions) &&
    Array.isArray(value.notices) &&
    Array.isArray(value.controlledFailures) &&
    Array.isArray(value.traceability.responseMapping) &&
    typeof value.safety.recommendationAllowed === "boolean" &&
    (!value.safety.recommendationAllowed || recommendationAllowedForStatus) &&
    recommendationInvariant &&
    analysisInvariant &&
    clarificationInvariant &&
    analysisReadyInvariant &&
    cannotRecommendInvariant &&
    failedInvariant
  );
}
