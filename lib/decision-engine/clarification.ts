import type {
  ClarificationDecision,
  ClarificationEngineInput,
  ClarificationEngineOptions,
  ClarificationEngineResult,
  ClarificationQuestion,
  ClarificationTraceEntry,
  DetectedCriticalGap,
  PrioritizedGap,
} from "./types";

const DEFAULT_MAX_QUESTIONS = 3;
const MAX_QUESTIONS_BEFORE_REEVALUATION = 5;

const QUESTION_TEXT: Record<DetectedCriticalGap["code"], string> = {
  missing_goal: "What outcome matters most for this decision?",
  missing_context: "What essential context should the analysis consider before comparing options?",
  missing_constraints: "What constraints or non-negotiable limits must the decision respect?",
  missing_time_horizon: "What deadline or time horizon should guide this decision?",
  critical_unknown: "What is the current value or boundary for this critical unknown?",
  contradiction_detected: "Which of the conflicting statements should the analysis treat as current?",
  safety_gap: "What safety context is necessary to assess this decision responsibly?",
};

function maxQuestions(options?: ClarificationEngineOptions): number {
  const requested = options?.maxQuestions ?? DEFAULT_MAX_QUESTIONS;

  if (!Number.isFinite(requested)) {
    return DEFAULT_MAX_QUESTIONS;
  }

  return Math.min(MAX_QUESTIONS_BEFORE_REEVALUATION, Math.max(0, Math.floor(requested)));
}

function priorityScore(gap: DetectedCriticalGap): PrioritizedGap {
  const reasons: string[] = [];
  let score = 0;

  const severityScores = { critical: 100, important: 60, optional: 20 } as const;
  score += severityScores[gap.severity];
  reasons.push(`${gap.severity} severity`);

  if (gap.code === "safety_gap") {
    score += 50;
    reasons.push("safety boundary");
  }

  if (gap.code === "contradiction_detected") {
    score += 40;
    reasons.push("contradiction reconciliation");
  }

  const impactScores = {
    could_reverse: 30,
    could_change: 20,
    could_refine: 10,
    no_material_change: 0,
  } as const;
  score += impactScores[gap.recommendationImpact];
  reasons.push(`${gap.recommendationImpact} recommendation impact`);

  return { gap, priorityScore: score, priorityReasons: reasons };
}

/**
 * Orders gaps by deterministic materiality, preserving input order for ties.
 */
export function prioritizeClarificationGaps(gaps: DetectedCriticalGap[]): PrioritizedGap[] {
  return gaps
    .map((gap, index) => ({ prioritized: priorityScore(gap), index }))
    .sort((left, right) => right.prioritized.priorityScore - left.prioritized.priorityScore || left.index - right.index)
    .map(({ prioritized }) => prioritized);
}

/**
 * Creates one stable English question for a supported deterministic gap.
 */
export function createClarificationQuestion(gap: DetectedCriticalGap): ClarificationQuestion {
  return {
    id: `question_${gap.id}`,
    text: QUESTION_TEXT[gap.code],
    answerType: "free_text",
    required: gap.severity === "critical",
    resolvesGapIds: [gap.id],
    whyItMatters: gap.reason,
  };
}

/**
 * Selects the smallest useful first-pass set, deduplicated by gap type.
 */
export function selectClarificationQuestions(
  prioritizedGaps: PrioritizedGap[],
  options?: ClarificationEngineOptions,
): ClarificationQuestion[] {
  const selected: ClarificationQuestion[] = [];
  const selectedCodes = new Set<DetectedCriticalGap["code"]>();

  for (const { gap } of prioritizedGaps) {
    if (selected.length >= maxQuestions(options)) {
      break;
    }

    if (gap.severity === "optional" || gap.resolution === "resolved" || selectedCodes.has(gap.code)) {
      continue;
    }

    selected.push(createClarificationQuestion(gap));
    selectedCodes.add(gap.code);
  }

  return selected;
}

function clarificationDecision(
  input: ClarificationEngineInput,
  questions: ClarificationQuestion[],
): ClarificationDecision {
  const { analysis, safety } = input;
  const unresolvedCriticalGaps = analysis.gaps.filter(
    (gap) => gap.severity === "critical" && gap.resolution !== "resolved",
  );

  if (safety?.level === "refuse") {
    return {
      action: "refuse",
      reason: "The explicit safety boundary requires refusal before clarification or analysis.",
      questions: [],
      canProceedWithoutAnswers: false,
    };
  }

  if (safety?.level === "restricted") {
    return {
      action: "withhold",
      reason: "The explicit safety boundary requires normal analysis and recommendation to be withheld.",
      questions: [],
      canProceedWithoutAnswers: false,
    };
  }

  if (unresolvedCriticalGaps.length > 0 && questions.length > 0) {
    return {
      action: "ask",
      reason: "Unresolved critical gaps require a minimal clarification pass before normal analysis.",
      questions,
      canProceedWithoutAnswers: false,
      proceedWithoutAnswersEffect: "Only limited analysis may be possible and recommendation may be withheld.",
    };
  }

  if (unresolvedCriticalGaps.length > 0) {
    return {
      action: "withhold",
      reason: "Unresolved critical gaps remain, but no useful clarification question was selected.",
      questions: [],
      canProceedWithoutAnswers: false,
    };
  }

  if (analysis.completeness.level === "partial" || analysis.gaps.length > 0) {
    return {
      action: "proceed_limited",
      reason: "No critical gap blocks analysis, but unresolved limitations require conditional output.",
      questions,
      canProceedWithoutAnswers: true,
      proceedWithoutAnswersEffect: "Analysis must disclose limitations and avoid unsupported certainty.",
    };
  }

  return {
    action: "not_required",
    reason: "No unresolved material gap requires clarification before analysis.",
    questions: [],
    canProceedWithoutAnswers: true,
  };
}

function clarificationTrace(
  input: ClarificationEngineInput,
  prioritizedGaps: PrioritizedGap[],
  decision: ClarificationDecision,
): ClarificationTraceEntry[] {
  const safetyStopped = decision.action === "refuse" || decision.action === "withhold";

  return [
    {
      check: "safety_boundary",
      status: safetyStopped ? "stopped" : "passed",
      detail: input.safety
        ? `Applied explicit ${input.safety.level} safety boundary.`
        : "No explicit safety boundary changed clarification behavior.",
    },
    {
      check: "gap_prioritization",
      status: prioritizedGaps.length > 0 ? "action_required" : "passed",
      detail: `Prioritized ${prioritizedGaps.length} deterministic gap(s).`,
    },
    {
      check: "question_selection",
      status: decision.questions.length > 0 ? "action_required" : "passed",
      detail: `Selected ${decision.questions.length} minimal clarification question(s).`,
    },
    {
      check: "clarification_decision",
      status: safetyStopped ? "stopped" : decision.action === "ask" ? "action_required" : "passed",
      detail: `Deterministic clarification action: ${decision.action}.`,
    },
  ];
}

/**
 * Decides whether the Stage 3.2 analysis requires clarification, limited
 * analysis, withholding, or refusal. It does not answer product questions.
 */
export function decideClarification(
  input: ClarificationEngineInput,
  options?: ClarificationEngineOptions,
): ClarificationEngineResult {
  const prioritizedGaps = prioritizeClarificationGaps(input.analysis.gaps);
  const selectedQuestions =
    input.safety?.level === "refuse" || input.safety?.level === "restricted"
      ? []
      : selectClarificationQuestions(prioritizedGaps, options);
  const decision = clarificationDecision(input, selectedQuestions);

  return {
    decision,
    prioritizedGaps,
    selectedQuestions: decision.questions,
    confidence: input.analysis.confidence,
    traceEntries: clarificationTrace(input, prioritizedGaps, decision),
  };
}
