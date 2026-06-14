import type {
  DeterministicRecommendation,
  DeterministicRiskAssessment,
  DeterministicScenario,
  EntityId,
  RecommendationCategory,
  RecommendationCondition,
  RecommendationEngineInput,
  RecommendationEngineResult,
  RecommendationPriority,
  RecommendationRationale,
  RecommendationTraceEntry,
  RiskLevel,
  Score,
  ScoreBand,
} from "./types";

type OptionEvaluation = {
  optionId: EntityId;
  scenarios: DeterministicScenario[];
  risks: DeterministicRiskAssessment[];
  score: number;
};

function scoreBand(value: number): ScoreBand {
  if (value < 20) return "very_low";
  if (value < 40) return "low";
  if (value < 60) return "medium";
  if (value < 80) return "high";
  return "very_high";
}

function recommendationScore(value: number, rationale: string): Score {
  const boundedValue = Math.max(0, Math.min(100, Math.round(value)));

  return {
    value: boundedValue,
    band: scoreBand(boundedValue),
    rationale,
    evidenceRefs: [],
  };
}

function riskLevelPenalty(level: RiskLevel): number {
  return { low: 5, medium: 20, high: 40, critical: 70 }[level];
}

function costOfErrorPenalty(cost: DeterministicRiskAssessment["costOfError"]): number {
  return { low: 0, moderate: 12, high: 30 }[cost];
}

function evaluateOptions(input: RecommendationEngineInput): OptionEvaluation[] {
  const optionIds = [...new Set(input.scenarios.map((scenario) => scenario.optionId))];

  return optionIds
    .map((optionId) => {
      const scenarios = input.scenarios.filter((scenario) => scenario.optionId === optionId);
      const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
      const risks = input.risks.filter((risk) => scenarioIds.has(risk.scenarioId));
      const averageScenarioConfidence =
        scenarios.reduce((sum, scenario) => sum + scenario.confidence.value, 0) / Math.max(1, scenarios.length);
      const averageRiskPenalty =
        risks.reduce(
          (sum, risk) => sum + riskLevelPenalty(risk.level) + costOfErrorPenalty(risk.costOfError),
          0,
        ) / Math.max(1, risks.length);
      const realisticScenario = scenarios.find((scenario) => scenario.perspective === "realistic");
      const realisticOpportunitySupport =
        realisticScenario?.outcomeIndicators.filter(
          (indicator) => indicator.category === "opportunity" && indicator.state !== "adverse",
        ).length ?? 0;

      return {
        optionId,
        scenarios,
        risks,
        score: averageScenarioConfidence - averageRiskPenalty + realisticOpportunitySupport * 3,
      };
    })
    .sort((left, right) => right.score - left.score || left.optionId.localeCompare(right.optionId));
}

function unresolvedCriticalGaps(input: RecommendationEngineInput) {
  return input.analysis.gaps.filter(
    (gap) => gap.severity === "critical" && gap.resolution !== "resolved",
  );
}

function missingRiskScenarioIds(option?: OptionEvaluation): EntityId[] {
  if (!option) return [];

  const assessedScenarioIds = new Set(option.risks.map((risk) => risk.scenarioId));
  return option.scenarios
    .filter((scenario) => !assessedScenarioIds.has(scenario.id))
    .map((scenario) => scenario.id);
}

function safetyBlocksRecommendation(input: RecommendationEngineInput): boolean {
  return Boolean(
    input.safety &&
      (!input.safety.recommendationAllowed ||
        input.safety.level === "restricted" ||
        input.safety.level === "refuse"),
  );
}

function recommendationConfidence(
  input: RecommendationEngineInput,
  option?: OptionEvaluation,
): Score {
  const scenarioConfidence = option
    ? option.scenarios.reduce((sum, scenario) => sum + scenario.confidence.value, 0) /
      Math.max(1, option.scenarios.length)
    : 0;
  const riskConfidence = option
    ? option.risks.reduce((sum, risk) => sum + risk.confidence.value, 0) / Math.max(1, option.risks.length)
    : 0;
  const completenessPenalty = {
    complete: 0,
    partial: 10,
    critical: 25,
  }[input.analysis.completeness.level];
  const clarificationPenalty = {
    not_required: 0,
    proceed_limited: 10,
    ask: 25,
    withhold: 35,
    refuse: 50,
  }[input.clarification.decision.action];
  const contradictionCount = input.analysis.gaps.filter(
    (gap) => gap.code === "contradiction_detected" && gap.resolution !== "resolved",
  ).length;
  const criticalGapCount = unresolvedCriticalGaps(input).length;
  const value =
    input.analysis.completeness.overall.value * 0.3 +
    scenarioConfidence * 0.35 +
    riskConfidence * 0.35 -
    completenessPenalty -
    clarificationPenalty -
    contradictionCount * 15 -
    criticalGapCount * 20;

  return recommendationScore(
    value,
    "Derived from completeness, clarification status, scenario confidence, risk confidence, contradictions, and critical gaps.",
  );
}

/**
 * Calculates confidence in recommendation reasoning, not certainty that the
 * preferred option will succeed.
 */
export function calculateRecommendationConfidence(
  input: RecommendationEngineInput,
  optionId?: EntityId,
): Score {
  const option = evaluateOptions(input).find((evaluation) => evaluation.optionId === optionId);
  return recommendationConfidence(input, option);
}

function conditions(
  input: RecommendationEngineInput,
  option?: OptionEvaluation,
): { required: RecommendationCondition[]; blocking: RecommendationCondition[]; dependencies: EntityId[] } {
  const required: RecommendationCondition[] = input.analysis.gaps
    .filter((gap) => gap.severity === "important" && gap.resolution !== "resolved")
    .map((gap) => ({
      id: `condition_gap_${gap.id}`,
      kind: "gap",
      sourceEntityId: gap.id,
      status: gap.resolution === "accepted_unknown" ? "accepted_unknown" : "required",
    }));
  const blocking: RecommendationCondition[] = unresolvedCriticalGaps(input).map((gap) => ({
    id: `condition_gap_${gap.id}`,
    kind: "gap",
    sourceEntityId: gap.id,
    status: "blocking",
  }));

  if (!option) {
    blocking.push({
      id: "condition_scenario_basis_missing",
      kind: "scenario",
      sourceEntityId: "scenario_basis",
      status: "blocking",
    });
  }

  for (const scenarioId of missingRiskScenarioIds(option)) {
    blocking.push({
      id: `condition_risk_missing_${scenarioId}`,
      kind: "risk",
      sourceEntityId: scenarioId,
      status: "blocking",
    });
  }

  if (input.clarification.decision.action === "ask") {
    blocking.push({
      id: "condition_clarification_required",
      kind: "clarification",
      sourceEntityId: "clarification_decision",
      status: "blocking",
    });
  }

  if (
    input.clarification.decision.action === "withhold" ||
    input.clarification.decision.action === "refuse"
  ) {
    blocking.push({
      id: `condition_clarification_${input.clarification.decision.action}`,
      kind: "clarification",
      sourceEntityId: "clarification_decision",
      status: "blocking",
    });
  }

  if (safetyBlocksRecommendation(input)) {
    blocking.push({
      id: "condition_safety_boundary",
      kind: "safety",
      sourceEntityId: "safety_boundary",
      status: "blocking",
    });
  }

  for (const risk of option?.risks ?? []) {
    if (risk.level === "high" || risk.level === "critical" || risk.costOfError === "high") {
      required.push({
        id: `condition_risk_${risk.id}`,
        kind: "risk",
        sourceEntityId: risk.id,
        status: "required",
      });
    }
  }

  const dependencies = [
    ...new Set(
      (option?.scenarios ?? []).flatMap((scenario) =>
        scenario.dependencies
          .filter((dependency) => dependency.materiality !== "supporting")
          .map((dependency) => dependency.sourceEntityId),
      ),
    ),
  ];

  return { required, blocking, dependencies };
}

function categoryFor(input: RecommendationEngineInput, option?: OptionEvaluation): RecommendationCategory {
  if (input.safety?.level === "refuse" || input.clarification.decision.action === "refuse") return "stop";
  if (input.clarification.decision.action === "withhold") return "stop";
  if (safetyBlocksRecommendation(input)) return "stop";
  if (unresolvedCriticalGaps(input).length > 0 || input.clarification.decision.action === "ask") {
    return "gather_information";
  }
  if (!option) return "gather_information";
  if (missingRiskScenarioIds(option).length > 0) return "gather_information";

  const hasCriticalRisk = option.risks.some((risk) => risk.level === "critical");
  const hasHighRisk = option.risks.some((risk) => risk.level === "high" || risk.costOfError === "high");
  const hasHighUncertainty = option.risks.some((risk) => risk.uncertainty.value >= 60);

  if (hasCriticalRisk) return "avoid";
  if (hasHighRisk) return "mitigate_risk";
  if (hasHighUncertainty) return "delay";
  if (
    input.analysis.completeness.level === "partial" ||
    input.clarification.decision.action === "proceed_limited" ||
    input.analysis.gaps.some((gap) => gap.severity === "important" && gap.resolution !== "resolved")
  ) {
    return "proceed_with_conditions";
  }
  return "proceed";
}

function statusFor(category: RecommendationCategory): DeterministicRecommendation["status"] {
  if (category === "proceed") return "recommended";
  if (category === "proceed_with_conditions" || category === "mitigate_risk") return "conditional";
  if (category === "delay" || category === "gather_information") return "defer";
  return "withheld";
}

function priorityFor(
  category: RecommendationCategory,
  option?: OptionEvaluation,
): RecommendationPriority {
  if (category === "stop" || category === "avoid") return "critical";
  if (category === "gather_information" || category === "mitigate_risk") return "high";
  if (category === "delay" || category === "proceed_with_conditions") return "medium";
  return option && option.score >= 70 ? "high" : "low";
}

function rationale(
  input: RecommendationEngineInput,
  option: OptionEvaluation | undefined,
  category: RecommendationCategory,
): RecommendationRationale[] {
  const optionScenarioIds = option?.scenarios.map((scenario) => scenario.id) ?? [];
  const optionRiskIds = option?.risks.map((risk) => risk.id) ?? [];
  const riskValue = option
    ? option.risks.reduce((sum, risk) => sum + riskLevelPenalty(risk.level), 0) /
      Math.max(1, option.risks.length)
    : 100;
  const uncertaintyValue = option
    ? option.risks.reduce((sum, risk) => sum + risk.uncertainty.value, 0) / Math.max(1, option.risks.length)
    : 100;
  const reversibilityDifficulty = option
    ? option.risks.reduce((sum, risk) => sum + risk.reversibility.difficulty.value, 0) /
      Math.max(1, option.risks.length)
    : 100;

  return [
    {
      criterion: "eligibility",
      priority: unresolvedCriticalGaps(input).length > 0 ? "critical" : "high",
      score: recommendationScore(
        unresolvedCriticalGaps(input).length > 0 ? 0 : input.analysis.completeness.overall.value,
        "Represents deterministic recommendation eligibility after completeness and critical-gap gates.",
      ),
      sourceEntityIds: input.analysis.gaps.map((gap) => gap.id),
    },
    {
      criterion: "scenario_support",
      priority: "high",
      score: recommendationScore(
        option?.score ?? 0,
        "Represents comparative structural support for the selected option.",
      ),
      sourceEntityIds: optionScenarioIds,
    },
    {
      criterion: "risk_exposure",
      priority: category === "avoid" || category === "mitigate_risk" ? "critical" : "high",
      score: recommendationScore(100 - riskValue, "Represents inverse structured risk exposure."),
      sourceEntityIds: optionRiskIds,
    },
    {
      criterion: "reversibility",
      priority: reversibilityDifficulty >= 70 ? "high" : "medium",
      score: recommendationScore(
        100 - reversibilityDifficulty,
        "Represents inverse structured reversibility difficulty.",
      ),
      sourceEntityIds: optionRiskIds,
    },
    {
      criterion: "uncertainty",
      priority: category === "gather_information" || category === "delay" ? "high" : "medium",
      score: recommendationScore(
        100 - uncertaintyValue,
        "Represents inverse explicit uncertainty exposure.",
      ),
      sourceEntityIds: optionRiskIds,
    },
    {
      criterion: "safety",
      priority: safetyBlocksRecommendation(input) ? "critical" : "high",
      score: recommendationScore(safetyBlocksRecommendation(input) ? 0 : 100, "Represents the safety eligibility gate."),
      sourceEntityIds: input.safety ? ["safety_boundary"] : [],
    },
  ];
}

function traceEntries(
  input: RecommendationEngineInput,
  option: OptionEvaluation | undefined,
  category: RecommendationCategory,
  mappedConditions: ReturnType<typeof conditions>,
  confidence: Score,
): RecommendationTraceEntry[] {
  return [
    {
      rule: "eligibility_gate",
      detail: `Applied completeness, critical-gap, and clarification gates; selected ${category}.`,
      sourceEntityIds: input.analysis.gaps.map((gap) => gap.id),
    },
    {
      rule: "option_comparison",
      detail: `Compared ${new Set(input.scenarios.map((scenario) => scenario.optionId)).size} option(s) using structured scenarios and risks.`,
      sourceEntityIds: option?.scenarios.map((scenario) => scenario.id) ?? [],
    },
    {
      rule: "risk_gate",
      detail: `Linked ${option?.risks.length ?? 0} risk assessment(s) to recommendation eligibility.`,
      sourceEntityIds: option?.risks.map((risk) => risk.id) ?? [],
    },
    {
      rule: "precondition_mapping",
      detail: `Mapped ${mappedConditions.required.length} required and ${mappedConditions.blocking.length} blocking condition(s).`,
      sourceEntityIds: [...mappedConditions.required, ...mappedConditions.blocking].map(
        (condition) => condition.sourceEntityId,
      ),
    },
    {
      rule: "safety_gate",
      detail: safetyBlocksRecommendation(input)
        ? "Safety boundary withheld a consequential preferred path."
        : "No explicit safety boundary withheld recommendation eligibility.",
      sourceEntityIds: input.safety ? ["safety_boundary"] : [],
    },
    {
      rule: "confidence_calculation",
      detail: `Calculated deterministic recommendation confidence of ${confidence.value}.`,
      sourceEntityIds: option ? [option.optionId] : [],
    },
  ];
}

/**
 * Produces one structured deterministic recommendation without advice prose.
 */
export function generateRecommendations(input: RecommendationEngineInput): RecommendationEngineResult {
  const evaluations = evaluateOptions(input);
  const preferredOption = evaluations[0];
  const category = categoryFor(input, preferredOption);
  const status = statusFor(category);
  const consequentialPreferenceAllowed = status === "recommended" || status === "conditional";
  const mappedConditions = conditions(input, preferredOption);
  const confidence = recommendationConfidence(input, preferredOption);
  const sourceScenarios = preferredOption?.scenarios.map((scenario) => scenario.id) ?? [];
  const sourceRisks = preferredOption?.risks.map((risk) => risk.id) ?? [];
  const recommendation: DeterministicRecommendation = {
    id: "recommendation_primary",
    status,
    category,
    priority: priorityFor(category, preferredOption),
    preferredOptionId: consequentialPreferenceAllowed ? preferredOption?.optionId : undefined,
    requiredConditions: mappedConditions.required,
    blockingConditions: mappedConditions.blocking,
    dependencies: mappedConditions.dependencies,
    sourceScenarioIds: sourceScenarios,
    sourceRiskIds: sourceRisks,
    rationale: rationale(input, preferredOption, category),
    confidence,
    traceEntries: traceEntries(input, preferredOption, category, mappedConditions, confidence),
  };

  return {
    recommendations: [recommendation],
    preferredRecommendationId: consequentialPreferenceAllowed ? recommendation.id : undefined,
  };
}
