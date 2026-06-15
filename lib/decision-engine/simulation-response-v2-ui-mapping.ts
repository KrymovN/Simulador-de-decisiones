import type {
  DecisionEngineStatus,
  RuntimeAvailability,
  SimulationResponseV2Draft,
} from "./contracts";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import {
  SIMULATION_RESPONSE_V2_UI_MAPPING_MODE,
  SIMULATION_RESPONSE_V2_UI_MAPPING_VERSION,
  type SimulationResponseV2UiMappingEvidence,
  type SimulationResponseV2UiModel,
  type SimulationResponseV2UiRenderState,
  type SimulationResponseV2UiSection,
  type SimulationResponseV2UiSectionId,
  type SimulationResponseV2UiSectionState,
} from "./simulation-response-v2-ui-mapping-contracts";

const UI_MAPPING_EVIDENCE: SimulationResponseV2UiMappingEvidence = {
  sourceContract: "SimulationResponseV2Draft",
  targetContract: "SimulationResponseV2UiModel",
  v1CoercionUsed: false,
  deterministicRuntimeExecuted: false,
  sandboxExposed: false,
  publicRuntimeTouched: false,
  publicApiTouched: false,
  persistenceUsed: false,
};

function section<T>(
  id: SimulationResponseV2UiSectionId,
  state: SimulationResponseV2UiSectionState,
  items: T[] = [],
  reasons: string[] = [],
): SimulationResponseV2UiSection<T> {
  return { id, state, reasons, items };
}

function availabilityState(
  availability: RuntimeAvailability,
  hasItems: boolean,
): { state: SimulationResponseV2UiSectionState; reasons: string[] } {
  if (hasItems) {
    return { state: "available", reasons: [] };
  }

  return {
    state: availability.status === "available" ? "empty" : availability.status,
    reasons: availability.reasons,
  };
}

function renderState(status: DecisionEngineStatus): SimulationResponseV2UiRenderState {
  const states: Record<DecisionEngineStatus, SimulationResponseV2UiRenderState> = {
    clarification_required: "clarification",
    analysis_ready: "ready",
    limited_analysis: "limited",
    cannot_recommend: "cannot_recommend",
    refused: "refused",
    failed: "controlled_failure",
  };

  return states[status];
}

function statusTone(status: DecisionEngineStatus) {
  if (status === "failed") return "failure" as const;
  if (status === "refused" || status === "cannot_recommend") return "restricted" as const;
  if (status === "clarification_required" || status === "limited_analysis") return "warning" as const;
  return "information" as const;
}

function statusMessage(response: SimulationResponseV2Draft): string {
  if (response.status === "failed") {
    return response.failure?.message ?? response.controlledFailures[0]?.message ?? "Controlled failure.";
  }

  if (response.status === "clarification_required") {
    return response.clarification?.reason ?? "Clarification is required before analysis.";
  }

  return response.safety.message;
}

function emptySections(
  statusState: "loading" | "empty",
): SimulationResponseV2UiModel["sections"] {
  const reason = statusState === "loading" ? ["V2 response is loading."] : ["No V2 response is available."];

  return {
    status: section("status", statusState, [{
      lifecycle: statusState,
      tone: "neutral",
      message: reason[0],
    }]),
    decisionSummary: section("decision_summary", statusState, [], reason),
    modelQuality: section("model_quality", statusState, [], reason),
    clarification: section("clarification", statusState, [], reason),
    scenarios: section("scenarios", statusState, [], reason),
    risks: section("risks", statusState, [], reason),
    consequences: section("consequences", statusState, [], reason),
    recommendation: section("recommendation", statusState, [], reason),
    safety: section("safety", statusState, [], reason),
    notices: section("notices", statusState, [], reason),
    traceability: section("traceability", statusState, [], reason),
  };
}

function baseModel(
  renderStateValue: SimulationResponseV2UiRenderState,
  sections: SimulationResponseV2UiModel["sections"],
  mappingErrors: string[] = [],
): SimulationResponseV2UiModel {
  return {
    mappingVersion: SIMULATION_RESPONSE_V2_UI_MAPPING_VERSION,
    mode: SIMULATION_RESPONSE_V2_UI_MAPPING_MODE,
    renderState: renderStateValue,
    sections,
    mappingErrors,
    evidence: { ...UI_MAPPING_EVIDENCE },
  };
}

export function createSimulationResponseV2UiLoadingModel(): SimulationResponseV2UiModel {
  return baseModel("loading", emptySections("loading"));
}

export function createSimulationResponseV2UiEmptyModel(): SimulationResponseV2UiModel {
  return baseModel("empty", emptySections("empty"));
}

export function mapSimulationResponseV2ToUiModel(value: unknown): SimulationResponseV2UiModel {
  if (!validateSimulationResponseV2DraftShape(value)) {
    const error = "SimulationResponse V2 shape validation failed before UI mapping.";
    const model = baseModel("controlled_failure", emptySections("empty"), [error]);
    model.sections.status = section("status", "available", [{
      lifecycle: "failed",
      tone: "failure",
      message: error,
    }]);
    return model;
  }

  const response = value;
  const optionLabels = new Map(response.decision.optionSummaries.map((option) => [option.id, option.label]));
  const scenarios = response.analysis?.scenarios.map((scenario) => ({
    id: scenario.id,
    optionId: scenario.optionId,
    optionLabel: optionLabels.get(scenario.optionId) ?? scenario.optionId,
    perspective: scenario.perspective,
    canonicalType: scenario.canonicalType,
    assumptionIds: scenario.assumptionIds,
    triggerConditions: scenario.dependencies.map((dependency) => dependency.description),
    uncertaintyReasons: scenario.uncertaintyMarkers.map((marker) => marker.reason),
    confidence: {
      score: scenario.confidence.value,
      band: scenario.confidence.band,
      explanation: scenario.confidence.rationale,
    },
  })) ?? [];
  const risks = response.analysis?.risks.map((risk) => ({
    id: risk.id,
    scenarioId: risk.scenarioId,
    optionId: risk.optionId,
    level: risk.level,
    riskTypes: risk.riskTypes,
    comparativeProbability: {
      score: risk.probability.value,
      band: risk.probability.band,
      explanation: risk.probability.rationale,
      calibration: risk.probability.calibration,
    },
    impactSeverity: risk.impactSeverity.value,
    reversibility: risk.reversibility.level,
    uncertainty: risk.uncertainty.value,
    costOfError: risk.costOfError,
    confidence: risk.confidence.value,
  })) ?? [];
  const consequences = response.analysis?.scenarios.flatMap((scenario) =>
    scenario.outcomeIndicators.map((indicator) => ({
      id: indicator.id,
      scenarioId: scenario.id,
      optionId: scenario.optionId,
      category: indicator.category,
      state: indicator.state,
      sourceEntityId: indicator.sourceEntityId,
    })),
  ) ?? [];
  const recommendation = response.recommendation
    ? [{
        id: response.recommendation.id,
        status: response.recommendation.status,
        category: response.recommendation.category,
        priority: response.recommendation.priority,
        preferredOptionId: response.recommendation.preferredOptionId,
        preferredOptionLabel: response.recommendation.preferredOptionId
          ? optionLabels.get(response.recommendation.preferredOptionId)
          : undefined,
        requiredConditions: response.recommendation.requiredConditions.map((condition) => condition.sourceEntityId),
        blockingConditions: response.recommendation.blockingConditions.map((condition) => condition.sourceEntityId),
        rationale: response.recommendation.rationale.map((rationale) => ({
          criterion: rationale.criterion,
          priority: rationale.priority,
          score: rationale.score.value,
          explanation: rationale.score.rationale,
        })),
        confidence: {
          score: response.recommendation.confidence.value,
          band: response.recommendation.confidence.band,
          explanation: response.recommendation.confidence.rationale,
        },
      }]
    : [];
  const scenarioState = availabilityState(response.availability.scenarios, scenarios.length > 0);
  const riskState = availabilityState(response.availability.risks, risks.length > 0);
  const recommendationState = availabilityState(
    response.availability.recommendation,
    recommendation.length > 0,
  );
  const consequenceState = scenarios.length > 0
    ? { state: consequences.length > 0 ? "available" as const : "empty" as const, reasons: [] as string[] }
    : scenarioState;

  return {
    ...baseModel(renderState(response.status), {
      status: section("status", "available", [{
        lifecycle: response.status,
        tone: statusTone(response.status),
        message: statusMessage(response),
      }]),
      decisionSummary: section("decision_summary", "available", [{
        statement: response.decision.statement,
        primaryGoal: response.decision.primaryGoal,
        secondaryGoals: response.decision.secondaryGoals,
        options: response.decision.optionSummaries,
        constraints: response.decision.keyConstraints,
        timeHorizon: response.decision.timeHorizonSummary,
      }]),
      modelQuality: section("model_quality", "available", [{
        completeness: response.modelQuality.completeness,
        confidence: {
          score: response.modelQuality.confidence.score,
          band: response.modelQuality.confidence.band,
          explanation: response.modelQuality.confidence.explanation,
          limitations: response.modelQuality.confidence.limitations,
          calibration: response.modelQuality.confidence.calibration,
        },
      }]),
      clarification: section(
        "clarification",
        response.clarification ? "available" : "not_applicable",
        response.clarification ? [{
          reason: response.clarification.reason,
          canProceedWithoutAnswers: response.clarification.canProceedWithoutAnswers,
          proceedWithoutAnswersEffect: response.clarification.proceedWithoutAnswersEffect,
          questions: response.clarification.questions,
        }] : [],
      ),
      scenarios: section("scenarios", scenarioState.state, scenarios, scenarioState.reasons),
      risks: section("risks", riskState.state, risks, riskState.reasons),
      consequences: section("consequences", consequenceState.state, consequences, consequenceState.reasons),
      recommendation: section(
        "recommendation",
        recommendationState.state,
        recommendation,
        recommendationState.reasons,
      ),
      safety: section("safety", "available", [{
        level: response.safety.level,
        domain: response.safety.domain,
        recommendationAllowed: response.safety.recommendationAllowed,
        message: response.safety.message,
        suggestedSupport: response.safety.suggestedSupport,
      }]),
      notices: section(
        "notices",
        response.notices.length > 0 ? "available" : "empty",
        response.notices,
      ),
      traceability: section("traceability", "available", [{
        policyVersion: response.traceability.policyVersion,
        evidenceCount: response.traceability.evidence.length,
        gapCount: response.gaps.length,
        contradictionCount: response.contradictions.length,
      }]),
    }),
    requestId: response.requestId,
    responseId: response.responseId,
    generatedAt: response.generatedAt,
    responseStatus: response.status,
  };
}

export function simulationResponseV2UiMappingEvidence(): SimulationResponseV2UiMappingEvidence {
  return { ...UI_MAPPING_EVIDENCE };
}
