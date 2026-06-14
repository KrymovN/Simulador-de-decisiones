import { detectCriticalGaps } from "./gaps";
import type {
  CompletenessAssessment,
  CompletenessEngineInput,
  CompletenessEngineResult,
  CompletenessTraceEntry,
  ConfidenceAssessment,
  DetectedCriticalGap,
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

function score(value: number, rationale: string): Score {
  return {
    value,
    band: scoreBand(value),
    rationale,
    evidenceRefs: [],
  };
}

function knownTimeHorizonCount(input: CompletenessEngineInput): number {
  if (!input.context) {
    return 0;
  }

  return Object.values(input.context.timeHorizon).filter((value) => value.status === "known").length;
}

function calculateCoreScore(input: CompletenessEngineInput, gaps: DetectedCriticalGap[]): number {
  const context = input.context;
  const hasGoal = context?.goals.some((goal) => goal.priority === "primary") ?? false;
  const hasContext = Boolean(context);
  const hasConstraints = Boolean(context?.constraints.length);
  const hasTimeHorizon = knownTimeHorizonCount(input) > 0;
  const hasNoCriticalUnknowns = !gaps.some((gap) => gap.code === "critical_unknown");
  const checks = [hasGoal, hasContext, hasConstraints, hasTimeHorizon, hasNoCriticalUnknowns];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function completenessLevel(gaps: DetectedCriticalGap[]): CompletenessAssessment["level"] {
  if (gaps.some((gap) => gap.severity === "critical")) {
    return "critical";
  }

  return gaps.length === 0 ? "complete" : "partial";
}

function buildCompletenessAssessment(
  input: CompletenessEngineInput,
  gaps: DetectedCriticalGap[],
): CompletenessAssessment {
  const context = input.context;
  const hasGoal = context?.goals.some((goal) => goal.priority === "primary") ?? false;
  const timeCount = knownTimeHorizonCount(input);
  const overallValue = calculateCoreScore(input, gaps);

  return {
    level: completenessLevel(gaps),
    overall: score(overallValue, "Calculated from five deterministic Stage 3.2 completeness checks."),
    dimensions: {
      goal: score(hasGoal ? 100 : 0, hasGoal ? "Primary goal is present." : "Primary goal is missing."),
      options: score(
        context ? Math.min(context.options.length * 50, 100) : 0,
        "Based on the count of explicitly structured options.",
      ),
      constraints: score(
        context?.constraints.length ? 100 : 0,
        context?.constraints.length ? "Constraints are present." : "Constraints are missing.",
      ),
      variables: score(
        context?.variables.length ? 100 : 0,
        context?.variables.length ? "Decision variables are present." : "Decision variables are missing.",
      ),
      stakeholders: score(
        context?.stakeholders.length ? 100 : 50,
        context?.stakeholders.length
          ? "Stakeholders are present."
          : "No stakeholders supplied; relevance is not inferred by this engine.",
      ),
      timeHorizon: score(
        Math.round((timeCount / 5) * 100),
        timeCount ? "At least one time-horizon field is known." : "Time horizon is missing.",
      ),
      risks: score(0, "Risk coverage is not evaluated by the Stage 3.2 completeness engine."),
      benefits: score(0, "Benefit coverage is not evaluated by the Stage 3.2 completeness engine."),
      assumptions: score(
        context?.assumptions.length ? 100 : 50,
        context?.assumptions.length
          ? "Assumptions are explicitly represented."
          : "No assumptions supplied; this engine does not invent them.",
      ),
    },
    blockingDimensions: gaps
      .filter((gap) => gap.severity === "critical")
      .map((gap) => gap.code),
  };
}

function buildConfidenceAssessment(
  input: CompletenessEngineInput,
  gaps: DetectedCriticalGap[],
  completeness: CompletenessAssessment,
): ConfidenceAssessment {
  const criticalCount = gaps.filter((gap) => gap.severity === "critical").length;
  const importantCount = gaps.filter((gap) => gap.severity === "important").length;
  const confidenceValue = Math.max(0, completeness.overall.value - criticalCount * 20 - importantCount * 8);
  const context = input.context;
  const contradictionCount = gaps.filter((gap) => gap.code === "contradiction_detected").length;

  return {
    overall: score(confidenceValue, "Derived from deterministic completeness and detected-gap penalties."),
    factors: {
      goalClarity: completeness.dimensions.goal,
      evidenceQuality: score(
        context?.evidence.length ? 70 : 30,
        context?.evidence.length ? "Evidence records are present." : "No structured evidence records are present.",
      ),
      variableCoverage: completeness.dimensions.variables,
      assumptionReliability: score(
        context?.assumptions.some((assumption) => assumption.validationStatus === "contradicted") ? 20 : 60,
        "Based only on explicit assumption validation states.",
      ),
      contradictionLevel: score(
        contradictionCount ? Math.max(0, 100 - contradictionCount * 40) : 100,
        contradictionCount ? "Explicit contradictions reduce confidence." : "No explicit contradiction detected.",
      ),
      externalUncertainty: score(50, "External uncertainty is not evaluated by the Stage 3.2 engine."),
    },
    limitations: gaps.map((gap) => gap.description),
  };
}

function traceEntries(input: CompletenessEngineInput, gaps: DetectedCriticalGap[]): CompletenessTraceEntry[] {
  const statusFor = (code: DetectedCriticalGap["code"]): CompletenessTraceEntry["status"] =>
    gaps.some((gap) => gap.code === code) ? "gap_detected" : "passed";

  return [
    {
      check: "goal_presence",
      status: statusFor("missing_goal"),
      detail: "Checked for an explicitly structured primary goal.",
    },
    {
      check: "context_presence",
      status: statusFor("missing_context"),
      detail: "Checked for a structured DecisionContext.",
    },
    {
      check: "constraint_presence",
      status: input.context ? statusFor("missing_constraints") : "not_applicable",
      detail: "Checked for explicitly structured constraints.",
    },
    {
      check: "time_horizon_presence",
      status: input.context ? statusFor("missing_time_horizon") : "not_applicable",
      detail: "Checked for at least one known time-horizon field.",
    },
    {
      check: "critical_unknowns",
      status: input.context ? statusFor("critical_unknown") : "not_applicable",
      detail: "Checked for explicitly unknown critical variables.",
    },
    {
      check: "contradictions",
      status: input.context ? statusFor("contradiction_detected") : "not_applicable",
      detail: "Applied limited deterministic contradiction rules.",
    },
    {
      check: "safety_context",
      status: input.safety && input.safety.domain !== "general" ? statusFor("safety_gap") : "not_applicable",
      detail: "Checked explicit high-stakes safety-context completeness.",
    },
  ];
}

/**
 * Runs the Stage 3.2 deterministic completeness and critical-gap analysis.
 */
export function analyzeCompleteness(input: CompletenessEngineInput): CompletenessEngineResult {
  const gaps = detectCriticalGaps(input);
  const completeness = buildCompletenessAssessment(input, gaps);

  return {
    completeness,
    gaps,
    confidence: buildConfidenceAssessment(input, gaps, completeness),
    traceEntries: traceEntries(input, gaps),
  };
}
