import type {
  ClarificationEngineResult,
  CompletenessEngineResult,
  CostOfError,
  DeterministicRiskAssessment,
  DeterministicScenario,
  RiskEngineInput,
  RiskEngineResult,
  RiskAssessment,
  RiskLevel,
  RiskReversibility,
  RiskTraceEntry,
  Score,
  ScoreBand,
} from "./types";

function scoreBand(value: number): ScoreBand {
  if (value < 20) return "very_low";
  if (value < 40) return "low";
  if (value < 60) return "medium";
  if (value < 80) return "high";
  return "very_high";
}

function riskScore(value: number, rationale: string): Score {
  const boundedValue = Math.max(0, Math.min(100, Math.round(value)));

  return {
    value: boundedValue,
    band: scoreBand(boundedValue),
    rationale,
    evidenceRefs: [],
  };
}

function probabilityScore(scenario: DeterministicScenario): DeterministicRiskAssessment["probability"] {
  const perspectiveBase = {
    optimistic: 25,
    realistic: 50,
    pessimistic: 75,
  }[scenario.perspective];
  const adverseIndicators = scenario.outcomeIndicators.filter((indicator) => indicator.state === "adverse").length;
  const uncertainIndicators = scenario.outcomeIndicators.filter((indicator) => indicator.state === "uncertain").length;
  const value = perspectiveBase + adverseIndicators * 4 + uncertainIndicators * 2;

  return {
    ...riskScore(
      value,
      "Comparative likelihood derived from scenario perspective and structured adverse or uncertain indicators.",
    ),
    calibration: "comparative_not_calibrated",
  };
}

function riskTypes(scenario: DeterministicScenario): RiskAssessment["type"][] {
  const types = new Set<RiskAssessment["type"]>(["direct"]);

  if (scenario.dependencies.length > 0) types.add("dependency");
  if (scenario.dependencies.some((dependency) => dependency.kind === "time_horizon")) types.add("delayed");
  if (
    scenario.outcomeIndicators.some(
      (indicator) => indicator.category === "constraint" || indicator.category === "resource",
    )
  ) {
    types.add("execution");
  }
  if (scenario.dependencies.some((dependency) => dependency.kind === "stakeholder")) types.add("indirect");

  return [...types];
}

function impactSeverityScore(scenario: DeterministicScenario): Score {
  const criticalDependencies = scenario.dependencies.filter((dependency) => dependency.materiality === "critical").length;
  const importantDependencies = scenario.dependencies.filter((dependency) => dependency.materiality === "important").length;
  const adverseIndicators = scenario.outcomeIndicators.filter((indicator) => indicator.state === "adverse").length;
  const value = 20 + criticalDependencies * 25 + importantDependencies * 10 + adverseIndicators * 8;

  return riskScore(
    value,
    "Derived from material dependencies and adverse structured outcome indicators.",
  );
}

function reversibilityAssessment(scenario: DeterministicScenario): RiskReversibility {
  const reversibilityWindow = scenario.dependencies.find(
    (dependency) =>
      dependency.kind === "time_horizon" && dependency.sourceEntityId === "time_horizon_reversibilityWindow",
  );

  if (!reversibilityWindow || reversibilityWindow.status === "unknown") {
    return {
      level: "unknown",
      difficulty: riskScore(70, "Reversibility window is not known."),
    };
  }

  const criticalDependencies = scenario.dependencies.filter((dependency) => dependency.materiality === "critical").length;
  const difficultyValue =
    scenario.perspective === "pessimistic"
      ? 75
      : scenario.perspective === "optimistic" && criticalDependencies === 0
        ? 25
        : 50 + criticalDependencies * 10;
  const level = difficultyValue >= 70 ? "difficult" : difficultyValue >= 40 ? "moderate" : "easy";

  return {
    level,
    difficulty: riskScore(difficultyValue, "Derived from known reversibility context and material dependencies."),
  };
}

function uncertaintyScore(scenario: DeterministicScenario): Score {
  const criticalMarkers = scenario.uncertaintyMarkers.filter((marker) => marker.severity === "critical").length;
  const importantMarkers = scenario.uncertaintyMarkers.filter((marker) => marker.severity === "important").length;
  const supportingMarkers = scenario.uncertaintyMarkers.filter((marker) => marker.severity === "supporting").length;
  const value = criticalMarkers * 30 + importantMarkers * 15 + supportingMarkers * 5;

  return riskScore(value, "Derived only from explicit scenario uncertainty markers.");
}

function costOfError(impact: Score, reversibility: RiskReversibility, uncertainty: Score): CostOfError {
  const costScore = impact.value * 0.5 + reversibility.difficulty.value * 0.35 + uncertainty.value * 0.15;

  if (costScore >= 65) return "high";
  if (costScore >= 35) return "moderate";
  return "low";
}

function riskLevel(
  probability: DeterministicRiskAssessment["probability"],
  impact: Score,
  reversibility: RiskReversibility,
  uncertainty: Score,
): RiskLevel {
  const aggregate =
    probability.value * 0.3 + impact.value * 0.35 + reversibility.difficulty.value * 0.2 + uncertainty.value * 0.15;

  if (aggregate >= 75) return "critical";
  if (aggregate >= 55) return "high";
  if (aggregate >= 30) return "medium";
  return "low";
}

/**
 * Calculates confidence in the structured risk assessment, not confidence
 * that the scenario outcome will occur.
 */
export function calculateRiskConfidence(
  scenario: DeterministicScenario,
  analysis: CompletenessEngineResult,
  clarification: ClarificationEngineResult,
): Score {
  const completenessPenalty = {
    complete: 0,
    partial: 10,
    critical: 25,
  }[analysis.completeness.level];
  const contradictionCount = analysis.gaps.filter(
    (gap) => gap.code === "contradiction_detected" && gap.resolution !== "resolved",
  ).length;
  const criticalGapCount = analysis.gaps.filter(
    (gap) => gap.severity === "critical" && gap.resolution !== "resolved",
  ).length;
  const clarificationPenalty = {
    not_required: 0,
    proceed_limited: 10,
    ask: 25,
    withhold: 35,
    refuse: 50,
  }[clarification.decision.action];
  const value =
    scenario.confidence.value * 0.6 +
    analysis.completeness.overall.value * 0.4 -
    completenessPenalty -
    contradictionCount * 15 -
    criticalGapCount * 15 -
    clarificationPenalty;

  return riskScore(
    value,
    "Derived from scenario confidence, completeness, contradictions, critical gaps, and clarification status.",
  );
}

function traceEntries(
  scenario: DeterministicScenario,
  cost: CostOfError,
  confidence: Score,
): RiskTraceEntry[] {
  const adverseAndUncertainIndicatorIds = scenario.outcomeIndicators
    .filter((indicator) => indicator.state === "adverse" || indicator.state === "uncertain")
    .map((indicator) => indicator.sourceEntityId);

  return [
    {
      rule: "risk_classification",
      detail: "Classified risk types from structured scenario dependencies and outcome indicators.",
      sourceEntityIds: scenario.dependencies.map((dependency) => dependency.sourceEntityId),
    },
    {
      rule: "scenario_conditions",
      detail: "Risk level derives from the scenario perspective and structured adverse or uncertain conditions.",
      sourceEntityIds: adverseAndUncertainIndicatorIds,
    },
    {
      rule: "assumption_exposure",
      detail: `Linked ${scenario.assumptionIds.length} scenario assumption(s) to the risk assessment.`,
      sourceEntityIds: scenario.assumptionIds,
    },
    {
      rule: "uncertainty_exposure",
      detail: `Linked ${scenario.uncertaintyMarkers.length} explicit uncertainty marker(s) to the risk assessment.`,
      sourceEntityIds: scenario.uncertaintyMarkers.map((marker) => marker.sourceEntityId),
    },
    {
      rule: "cost_of_error",
      detail: `Classified deterministic cost of error as ${cost}.`,
      sourceEntityIds: scenario.dependencies.map((dependency) => dependency.sourceEntityId),
    },
    {
      rule: "confidence_calculation",
      detail: `Calculated deterministic risk-assessment confidence of ${confidence.value}.`,
      sourceEntityIds: [scenario.id],
    },
  ];
}

function assessScenarioRisk(
  scenario: DeterministicScenario,
  analysis: CompletenessEngineResult,
  clarification: ClarificationEngineResult,
): DeterministicRiskAssessment {
  const probability = probabilityScore(scenario);
  const impactSeverity = impactSeverityScore(scenario);
  const reversibility = reversibilityAssessment(scenario);
  const uncertainty = uncertaintyScore(scenario);
  const cost = costOfError(impactSeverity, reversibility, uncertainty);
  const confidence = calculateRiskConfidence(scenario, analysis, clarification);

  return {
    id: `risk_${scenario.id}`,
    scenarioId: scenario.id,
    optionId: scenario.optionId,
    riskTypes: riskTypes(scenario),
    level: riskLevel(probability, impactSeverity, reversibility, uncertainty),
    probability,
    impactSeverity,
    reversibility,
    uncertainty,
    costOfError: cost,
    confidence,
    assumptionIds: scenario.assumptionIds,
    uncertaintyMarkerIds: scenario.uncertaintyMarkers.map((marker) => marker.id),
    traceEntries: traceEntries(scenario, cost, confidence),
  };
}

/**
 * Produces one deterministic structured risk assessment for each scenario.
 */
export function assessScenarioRisks(input: RiskEngineInput): RiskEngineResult {
  return {
    assessments: input.scenarios.map((scenario) =>
      assessScenarioRisk(scenario, input.analysis, input.clarification),
    ),
    assessedScenarioIds: input.scenarios.map((scenario) => scenario.id),
  };
}
