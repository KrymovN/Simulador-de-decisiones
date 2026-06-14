import type {
  Assumption,
  Constraint,
  DecisionContext,
  DecisionOption,
  DetectedCriticalGap,
  EntityId,
} from "./types";

const POSITIVE_CONSTRAINT_PREFIXES = ["must ", "required ", "debe ", "obligatorio "];
const NEGATIVE_CONSTRAINT_PREFIXES = [
  "cannot ",
  "must not ",
  "impossible ",
  "no puede ",
  "no se puede ",
  "prohibido ",
];
const COST_MARKERS = [
  "buy",
  "cost",
  "expensive",
  "paid",
  "purchase",
  "spend",
  "comprar",
  "coste",
  "costo",
  "gastar",
  "pago",
];
const RELOCATION_MARKERS = ["move", "relocate", "moving", "mudar", "mudanza", "переезд", "переехать", "搬家", "搬迁"];
const IMPOSSIBILITY_MARKERS = [
  "cannot",
  "impossible",
  "must not",
  "imposible",
  "no puede",
  "невозмож",
  "нельзя",
  "不可能",
  "不能",
];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasSharedOption(first: Constraint, second: Constraint): boolean {
  if (first.appliesToOptionIds.length === 0 && second.appliesToOptionIds.length === 0) {
    return true;
  }

  return first.appliesToOptionIds.some((optionId) => second.appliesToOptionIds.includes(optionId));
}

function constraintPolarity(description: string): "positive" | "negative" | undefined {
  const normalized = normalize(description);

  if (NEGATIVE_CONSTRAINT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return "negative";
  }

  if (POSITIVE_CONSTRAINT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return "positive";
  }

  return undefined;
}

function constraintCore(description: string): string {
  const normalized = normalize(description);
  const matchingPrefix = [...POSITIVE_CONSTRAINT_PREFIXES, ...NEGATIVE_CONSTRAINT_PREFIXES].find((prefix) =>
    normalized.startsWith(prefix),
  );

  return matchingPrefix ? normalized.slice(matchingPrefix.length).trim() : normalized;
}

function contradictionGap(id: EntityId, reason: string, affectedEntityIds: EntityId[]): DetectedCriticalGap {
  return {
    id,
    code: "contradiction_detected",
    category: "contradiction",
    description: "Material structured facts conflict.",
    severity: "critical",
    reason,
    affectedEntityIds,
    recommendationImpact: "could_reverse",
    resolution: "unresolved",
  };
}

function detectContradictedAssumptions(assumptions: Assumption[]): DetectedCriticalGap[] {
  return assumptions
    .filter((assumption) => assumption.validationStatus === "contradicted")
    .map((assumption, index) =>
      contradictionGap(
        `gap_contradicted_assumption_${index + 1}`,
        `Assumption "${assumption.statement}" is explicitly marked as contradicted.`,
        [assumption.id, ...assumption.affectedEntityIds],
      ),
    );
}

function detectFeasibilityConflicts(
  constraints: Constraint[],
  options: DecisionOption[],
): DetectedCriticalGap[] {
  return constraints.flatMap((constraint, constraintIndex) => {
    if (constraint.severity !== "blocking") {
      return [];
    }

    return options.flatMap((option, optionIndex) => {
      const appliesToOption = constraint.appliesToOptionIds.includes(option.id);
      const optionMarkedFeasible = option.feasible.status === "known" && option.feasible.value;

      if (!appliesToOption || !optionMarkedFeasible) {
        return [];
      }

      return [
        contradictionGap(
          `gap_feasibility_conflict_${constraintIndex + 1}_${optionIndex + 1}`,
          `Option "${option.label}" is marked feasible while blocking constraint "${constraint.description}" applies.`,
          [constraint.id, option.id],
        ),
      ];
    });
  });
}

function detectOpposingConstraints(constraints: Constraint[]): DetectedCriticalGap[] {
  const gaps: DetectedCriticalGap[] = [];

  for (let firstIndex = 0; firstIndex < constraints.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < constraints.length; secondIndex += 1) {
      const first = constraints[firstIndex];
      const second = constraints[secondIndex];
      const firstPolarity = constraintPolarity(first.description);
      const secondPolarity = constraintPolarity(second.description);

      if (
        firstPolarity &&
        secondPolarity &&
        firstPolarity !== secondPolarity &&
        constraintCore(first.description) === constraintCore(second.description) &&
        hasSharedOption(first, second)
      ) {
        gaps.push(
          contradictionGap(
            `gap_opposing_constraints_${firstIndex + 1}_${secondIndex + 1}`,
            `Constraints "${first.description}" and "${second.description}" have opposing requirements.`,
            [first.id, second.id],
          ),
        );
      }
    }
  }

  return gaps;
}

function detectZeroBudgetCostConflict(context: DecisionContext): DetectedCriticalGap[] {
  const zeroBudgetVariable = context.variables.find((variable) => {
    const variableText = normalize(`${variable.name} ${variable.description}`);
    return (
      (variableText.includes("budget") || variableText.includes("presupuesto")) &&
      variable.value.status === "known" &&
      variable.value.value === 0
    );
  });

  if (!zeroBudgetVariable) {
    return [];
  }

  const costlyOption = context.options.find((option) =>
    COST_MARKERS.some((marker) => normalize(`${option.label} ${option.description}`).includes(marker)),
  );
  const costlyConstraint = context.constraints.find(
    (constraint) =>
      constraint.kind === "financial" &&
      constraint.severity !== "preference" &&
      COST_MARKERS.some((marker) => normalize(constraint.description).includes(marker)),
  );

  if (!costlyOption && !costlyConstraint) {
    return [];
  }

  return [
    contradictionGap(
      "gap_zero_budget_required_cost",
      "Budget is explicitly zero while a material action or constraint requires spending.",
      [zeroBudgetVariable.id, costlyOption?.id, costlyConstraint?.id].filter((id): id is string => Boolean(id)),
    ),
  ];
}

function detectImpossibleRelocationConflict(context: DecisionContext): DetectedCriticalGap[] {
  const goalText = normalize(`${context.statement} ${context.goals.map((goal) => goal.description).join(" ")}`);
  const relocationGoalExists = RELOCATION_MARKERS.some((marker) => goalText.includes(marker));

  if (!relocationGoalExists) {
    return [];
  }

  const impossibleConstraint = context.constraints.find(
    (constraint) =>
      constraint.severity === "blocking" &&
      RELOCATION_MARKERS.some((marker) => normalize(constraint.description).includes(marker)) &&
      IMPOSSIBILITY_MARKERS.some((marker) => normalize(constraint.description).includes(marker)),
  );

  if (!impossibleConstraint) {
    return [];
  }

  return [
    contradictionGap(
      "gap_impossible_relocation",
      "The decision goal requires relocation while a blocking constraint states that relocation is impossible.",
      [impossibleConstraint.id, ...context.goals.map((goal) => goal.id)],
    ),
  ];
}

/**
 * Detects only explicit or narrowly defined structural contradictions.
 */
export function detectContradictions(context?: DecisionContext): DetectedCriticalGap[] {
  if (!context) {
    return [];
  }

  return [
    ...detectContradictedAssumptions(context.assumptions),
    ...detectFeasibilityConflicts(context.constraints, context.options),
    ...detectOpposingConstraints(context.constraints),
    ...detectZeroBudgetCostConflict(context),
    ...detectImpossibleRelocationConflict(context),
  ];
}
