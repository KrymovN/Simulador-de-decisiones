import { detectContradictions } from "./contradictions";
import type {
  CompletenessEngineInput,
  CriticalGap,
  DetectedCriticalGap,
  DeterministicGapType,
  EntityId,
  GapSeverity,
} from "./types";

type GapDefinition = {
  code: DeterministicGapType;
  category: CriticalGap["category"];
  description: string;
  severity: GapSeverity;
  reason: string;
  recommendationImpact: CriticalGap["recommendationImpact"];
  affectedEntityIds?: EntityId[];
};

function createGap(definition: GapDefinition): DetectedCriticalGap {
  return {
    id: `gap_${definition.code}`,
    code: definition.code,
    category: definition.category,
    description: definition.description,
    severity: definition.severity,
    reason: definition.reason,
    affectedEntityIds: definition.affectedEntityIds ?? [],
    recommendationImpact: definition.recommendationImpact,
    resolution: "unresolved",
  };
}

function hasKnownTimeHorizon(input: CompletenessEngineInput): boolean {
  const timeHorizon = input.context?.timeHorizon;

  if (!timeHorizon) {
    return false;
  }

  return Object.values(timeHorizon).some((value) => value.status === "known");
}

function detectCriticalUnknowns(input: CompletenessEngineInput): DetectedCriticalGap[] {
  const variables = input.context?.variables ?? [];

  return variables
    .filter((variable) => variable.materiality === "critical" && variable.value.status === "unknown")
    .map((variable, index) =>
      createGap({
        code: "critical_unknown",
        category: "variable",
        description: `Critical variable "${variable.name}" is unknown.`,
        severity: "critical",
        reason: "A critical unknown can materially change the analysis or recommendation.",
        recommendationImpact: "could_reverse",
        affectedEntityIds: [variable.id],
      }),
    )
    .map((gap, index) => ({ ...gap, id: `${gap.id}_${index + 1}` }));
}

/**
 * Detects deterministic missing-information, contradiction, and safety gaps.
 */
export function detectCriticalGaps(input: CompletenessEngineInput): DetectedCriticalGap[] {
  const gaps: DetectedCriticalGap[] = [];
  const context = input.context;

  if (!context) {
    gaps.push(
      createGap({
        code: "missing_context",
        category: "variable",
        description: "Structured decision context is missing.",
        severity: "critical",
        reason: "The engine cannot evaluate decision dimensions without structured context.",
        recommendationImpact: "could_reverse",
      }),
    );
  }

  if (!context?.goals.some((goal) => goal.priority === "primary")) {
    gaps.push(
      createGap({
        code: "missing_goal",
        category: "goal",
        description: "A primary decision goal is missing.",
        severity: "critical",
        reason: "A recommendation cannot be evaluated without a primary goal.",
        recommendationImpact: "could_reverse",
      }),
    );
  }

  if (context && context.constraints.length === 0) {
    gaps.push(
      createGap({
        code: "missing_constraints",
        category: "constraint",
        description: "No decision constraints are supplied.",
        severity: "important",
        reason: "Unknown constraints may change feasibility or ranking.",
        recommendationImpact: "could_change",
      }),
    );
  }

  if (context && !hasKnownTimeHorizon(input)) {
    gaps.push(
      createGap({
        code: "missing_time_horizon",
        category: "time_horizon",
        description: "No known decision time horizon is supplied.",
        severity: "important",
        reason: "Timing, delay cost, and reversibility may change the decision.",
        recommendationImpact: "could_change",
      }),
    );
  }

  gaps.push(...detectCriticalUnknowns(input));
  gaps.push(...detectContradictions(context));

  if (input.safety && input.safety.domain !== "general" && input.safetyContextComplete !== true) {
    gaps.push(
      createGap({
        code: "safety_gap",
        category: "safety",
        description: `Safety context for ${input.safety.domain} is incomplete.`,
        severity: "critical",
        reason: "High-stakes context requires explicit safety information before normal recommendation.",
        recommendationImpact: "could_reverse",
      }),
    );
  }

  return gaps;
}
