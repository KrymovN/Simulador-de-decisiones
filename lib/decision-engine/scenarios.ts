import type {
  Assumption,
  DecisionContext,
  DecisionOption,
  DeterministicScenario,
  EntityId,
  ScenarioDependency,
  ScenarioEngineInput,
  ScenarioEngineResult,
  ScenarioOutcomeIndicator,
  ScenarioPerspective,
  ScenarioTraceEntry,
  ScenarioUncertaintyMarker,
  Score,
  ScoreBand,
} from "./types";

const PERSPECTIVES: ScenarioPerspective[] = ["optimistic", "realistic", "pessimistic"];

const CANONICAL_TYPE = {
  optimistic: "favorable",
  realistic: "base_case",
  pessimistic: "adverse",
} as const;

function scoreBand(value: number): ScoreBand {
  if (value < 20) return "very_low";
  if (value < 40) return "low";
  if (value < 60) return "medium";
  if (value < 80) return "high";
  return "very_high";
}

function scenarioScore(value: number, rationale: string): Score {
  const boundedValue = Math.max(0, Math.min(100, Math.round(value)));

  return {
    value: boundedValue,
    band: scoreBand(boundedValue),
    rationale,
    evidenceRefs: [],
  };
}

function knownValueStatus(value: { status: "known" | "unknown" | "not_applicable" }): ScenarioDependency["status"] {
  return value.status;
}

function assumptionAppliesToOption(assumption: Assumption, optionId: EntityId): boolean {
  return assumption.affectedEntityIds.length === 0 || assumption.affectedEntityIds.includes(optionId);
}

function dependenciesForOption(context: DecisionContext, optionId: EntityId): ScenarioDependency[] {
  const constraints: ScenarioDependency[] = context.constraints
    .filter((constraint) => constraint.appliesToOptionIds.length === 0 || constraint.appliesToOptionIds.includes(optionId))
    .map((constraint) => ({
      id: `dependency_constraint_${constraint.id}`,
      kind: "constraint",
      sourceEntityId: constraint.id,
      status: "known",
      materiality:
        constraint.severity === "blocking"
          ? "critical"
          : constraint.severity === "material"
            ? "important"
            : "supporting",
      description: constraint.description,
    }));

  const variables: ScenarioDependency[] = context.variables
    .filter((variable) => variable.affectedOptionIds.length === 0 || variable.affectedOptionIds.includes(optionId))
    .map((variable) => ({
      id: `dependency_variable_${variable.id}`,
      kind: "variable",
      sourceEntityId: variable.id,
      status: knownValueStatus(variable.value),
      materiality: variable.materiality,
      description: variable.description,
    }));

  const stakeholders: ScenarioDependency[] = context.stakeholders.map((stakeholder) => ({
    id: `dependency_stakeholder_${stakeholder.id}`,
    kind: "stakeholder",
    sourceEntityId: stakeholder.id,
    status: stakeholder.interests.status,
    materiality:
      stakeholder.impactExposure === "high"
        ? "critical"
        : stakeholder.impactExposure === "medium"
          ? "important"
          : "supporting",
    description: stakeholder.role,
  }));

  const timeHorizon: ScenarioDependency[] = Object.entries(context.timeHorizon).map(([field, value]) => ({
    id: `dependency_time_horizon_${field}`,
    kind: "time_horizon",
    sourceEntityId: `time_horizon_${field}`,
    status: knownValueStatus(value),
    materiality: field === "decisionDeadline" || field === "reversibilityWindow" ? "important" : "supporting",
    description: field,
  }));

  return [...constraints, ...variables, ...stakeholders, ...timeHorizon];
}

function uncertaintiesForScenario(
  input: ScenarioEngineInput,
  optionId: EntityId,
  dependencies: ScenarioDependency[],
  assumptions: Assumption[],
): ScenarioUncertaintyMarker[] {
  const dependencyMarkers: ScenarioUncertaintyMarker[] = dependencies
    .filter((dependency) => dependency.status === "unknown")
    .map((dependency) => ({
      id: `uncertainty_dependency_${dependency.id}`,
      sourceType: "dependency",
      sourceEntityId: dependency.sourceEntityId,
      severity: dependency.materiality,
      reason: dependency.description,
    }));

  const assumptionMarkers: ScenarioUncertaintyMarker[] = assumptions
    .filter((assumption) => assumption.validationStatus !== "validated")
    .map((assumption) => ({
      id: `uncertainty_assumption_${assumption.id}`,
      sourceType: "assumption",
      sourceEntityId: assumption.id,
      severity: assumption.materiality,
      reason: assumption.statement,
    }));

  const gapMarkers: ScenarioUncertaintyMarker[] = input.analysis.gaps
    .filter(
      (gap) =>
        gap.resolution !== "resolved" &&
        (gap.affectedEntityIds.length === 0 || gap.affectedEntityIds.includes(optionId)),
    )
    .map((gap) => ({
      id: `uncertainty_gap_${gap.id}`,
      sourceType: "gap",
      sourceEntityId: gap.id,
      severity: gap.severity === "optional" ? "supporting" : gap.severity,
      reason: gap.reason,
    }));

  return [...dependencyMarkers, ...assumptionMarkers, ...gapMarkers];
}

function perspectiveState(
  perspective: ScenarioPerspective,
  fallback: ScenarioOutcomeIndicator["state"] = "stable",
): ScenarioOutcomeIndicator["state"] {
  if (perspective === "optimistic") return "favorable";
  if (perspective === "pessimistic") return "adverse";
  return fallback;
}

function outcomeIndicators(
  context: DecisionContext,
  optionId: EntityId,
  perspective: ScenarioPerspective,
): ScenarioOutcomeIndicator[] {
  const opportunities: ScenarioOutcomeIndicator[] = context.goals.map((goal) => ({
    id: `indicator_${perspective}_opportunity_${goal.id}`,
    category: "opportunity",
    sourceEntityId: goal.id,
    state: perspectiveState(perspective, "uncertain"),
  }));

  const constraints: ScenarioOutcomeIndicator[] = context.constraints
    .filter((constraint) => constraint.appliesToOptionIds.length === 0 || constraint.appliesToOptionIds.includes(optionId))
    .map((constraint) => ({
      id: `indicator_${perspective}_constraint_${constraint.id}`,
      category: "constraint",
      sourceEntityId: constraint.id,
      state:
        constraint.severity === "blocking"
          ? "adverse"
          : perspective === "pessimistic"
            ? "adverse"
            : constraint.severity === "material"
              ? "uncertain"
              : "stable",
    }));

  const resources: ScenarioOutcomeIndicator[] = context.variables
    .filter((variable) => variable.affectedOptionIds.length === 0 || variable.affectedOptionIds.includes(optionId))
    .map((variable) => ({
      id: `indicator_${perspective}_resource_${variable.id}`,
      category: "resource",
      sourceEntityId: variable.id,
      state: variable.value.status === "known" ? perspectiveState(perspective) : "uncertain",
    }));

  const timeline: ScenarioOutcomeIndicator[] = Object.entries(context.timeHorizon).map(([field, value]) => ({
    id: `indicator_${perspective}_timeline_${field}`,
    category: "timeline",
    sourceEntityId: `time_horizon_${field}`,
    state: value.status === "known" ? perspectiveState(perspective) : "uncertain",
  }));

  return [...opportunities, ...constraints, ...resources, ...timeline];
}

/**
 * Calculates confidence in the scenario structure, not probability of success.
 */
export function calculateScenarioConfidence(
  input: ScenarioEngineInput,
  perspective: ScenarioPerspective,
  uncertaintyMarkers: ScenarioUncertaintyMarker[],
): Score {
  const criticalGapCount = input.analysis.gaps.filter(
    (gap) => gap.severity === "critical" && gap.resolution !== "resolved",
  ).length;
  const importantGapCount = input.analysis.gaps.filter(
    (gap) => gap.severity === "important" && gap.resolution !== "resolved",
  ).length;
  const contradictionCount = input.analysis.gaps.filter(
    (gap) => gap.code === "contradiction_detected" && gap.resolution !== "resolved",
  ).length;
  const clarificationPenalty = {
    not_required: 0,
    proceed_limited: 12,
    ask: 25,
    withhold: 35,
    refuse: 50,
  }[input.clarification.decision.action];
  const completenessLevelPenalty = {
    complete: 0,
    partial: 10,
    critical: 25,
  }[input.analysis.completeness.level];
  const perspectivePenalty = perspective === "realistic" ? 0 : 5;
  const value =
    input.analysis.completeness.overall.value -
    completenessLevelPenalty -
    criticalGapCount * 20 -
    importantGapCount * 7 -
    contradictionCount * 15 -
    clarificationPenalty -
    uncertaintyMarkers.length * 2 -
    perspectivePenalty;

  return scenarioScore(
    value,
    "Derived from completeness score and level, unresolved gaps, contradictions, clarification status, and explicit uncertainty.",
  );
}

function traceEntries(
  option: DecisionOption,
  perspective: ScenarioPerspective,
  assumptions: Assumption[],
  dependencies: ScenarioDependency[],
  uncertainties: ScenarioUncertaintyMarker[],
  confidence: Score,
): ScenarioTraceEntry[] {
  return [
    {
      rule: "option_eligibility",
      detail: "The option is not explicitly marked infeasible.",
      sourceEntityIds: [option.id],
    },
    {
      rule: "perspective_mapping",
      detail: `Mapped ${perspective} perspective to canonical ${CANONICAL_TYPE[perspective]} scenario type.`,
      sourceEntityIds: [option.id],
    },
    {
      rule: "assumption_linking",
      detail: `Linked ${assumptions.length} explicit assumption(s).`,
      sourceEntityIds: assumptions.map((assumption) => assumption.id),
    },
    {
      rule: "dependency_linking",
      detail: `Linked ${dependencies.length} structured dependency record(s).`,
      sourceEntityIds: dependencies.map((dependency) => dependency.sourceEntityId),
    },
    {
      rule: "uncertainty_preservation",
      detail: `Preserved ${uncertainties.length} explicit uncertainty marker(s).`,
      sourceEntityIds: uncertainties.map((uncertainty) => uncertainty.sourceEntityId),
    },
    {
      rule: "confidence_calculation",
      detail: `Calculated deterministic scenario-structure confidence of ${confidence.value}.`,
      sourceEntityIds: [],
    },
  ];
}

function buildScenario(
  input: ScenarioEngineInput,
  option: DecisionOption,
  perspective: ScenarioPerspective,
): DeterministicScenario {
  const assumptions = input.context.assumptions.filter((assumption) =>
    assumptionAppliesToOption(assumption, option.id),
  );
  const dependencies = dependenciesForOption(input.context, option.id);
  const uncertaintyMarkers = uncertaintiesForScenario(input, option.id, dependencies, assumptions);
  const confidence = calculateScenarioConfidence(input, perspective, uncertaintyMarkers);

  return {
    id: `scenario_${option.id}_${perspective}`,
    optionId: option.id,
    perspective,
    canonicalType: CANONICAL_TYPE[perspective],
    assumptionIds: assumptions.map((assumption) => assumption.id),
    assumptions: assumptions.map((assumption) => ({
      id: assumption.id,
      source: assumption.source,
      materiality: assumption.materiality,
      validationStatus: assumption.validationStatus,
    })),
    dependencies,
    uncertaintyMarkers,
    outcomeIndicators: outcomeIndicators(input.context, option.id, perspective),
    confidence,
    traceEntries: traceEntries(option, perspective, assumptions, dependencies, uncertaintyMarkers, confidence),
  };
}

/**
 * Builds structured deterministic scenarios without narrative generation.
 */
export function generateScenarios(input: ScenarioEngineInput): ScenarioEngineResult {
  const blockedActions = new Set(["ask", "withhold", "refuse"]);
  const eligibleOptions = input.context.options.filter(
    (option) => !(option.feasible.status === "known" && option.feasible.value === false),
  );
  const skippedOptions = input.context.options.filter(
    (option) => option.feasible.status === "known" && option.feasible.value === false,
  );

  if (blockedActions.has(input.clarification.decision.action)) {
    return {
      scenarios: [],
      eligibleOptionIds: eligibleOptions.map((option) => option.id),
      skippedOptionIds: skippedOptions.map((option) => option.id),
      blockedReason: `Clarification action ${input.clarification.decision.action} blocks scenario generation.`,
    };
  }

  if (eligibleOptions.length === 0) {
    return {
      scenarios: [],
      eligibleOptionIds: [],
      skippedOptionIds: skippedOptions.map((option) => option.id),
      blockedReason: "No option is eligible for deterministic scenario generation.",
    };
  }

  return {
    scenarios: eligibleOptions.flatMap((option) =>
      PERSPECTIVES.map((perspective) => buildScenario(input, option, perspective)),
    ),
    eligibleOptionIds: eligibleOptions.map((option) => option.id),
    skippedOptionIds: skippedOptions.map((option) => option.id),
  };
}
