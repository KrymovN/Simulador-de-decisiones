import {
  buildDecisionContext,
  type DecisionContextBuilderClarificationAnswer,
  type DecisionContextBuilderClarificationQuestion,
  type DecisionContextBuilderResult,
  type DecisionContextBuilderMissingFieldKind,
} from "./context-builder";

export const DETERMINISTIC_CLARIFICATION_MAX_ROUNDS = 2;
export const DETERMINISTIC_CLARIFICATION_MAX_QUESTIONS_PER_ROUND = 3;
export const DETERMINISTIC_CLARIFICATION_MAX_ANSWERS =
  DETERMINISTIC_CLARIFICATION_MAX_ROUNDS * DETERMINISTIC_CLARIFICATION_MAX_QUESTIONS_PER_ROUND;
export const DETERMINISTIC_CLARIFICATION_MAX_ANSWER_LENGTH = 600;
export const DETERMINISTIC_CLARIFICATION_MIN_MATERIAL_GAPS = 4;

export const DETERMINISTIC_CLARIFICATION_FIELDS: readonly DecisionContextBuilderMissingFieldKind[] = [
  "deadline",
  "budget",
  "stakeholders",
  "constraints",
  "reversibility",
  "success_criteria",
  "risk_tolerance",
  "feasibility",
];

export type DeterministicClarificationSubmittedAnswer = {
  questionId: string;
  answer: string;
};

export type DeterministicClarificationRoundTripRequest = {
  requestId: string;
  simulationId: string;
  input: string;
  round: number;
  answers: DeterministicClarificationSubmittedAnswer[];
};

export type DeterministicClarificationRoundTripResult =
  | {
      status: "rejected";
      builder: DecisionContextBuilderResult;
    }
  | {
      status: "clarification_required";
      builder: DecisionContextBuilderResult;
      round: number;
      questions: DecisionContextBuilderClarificationQuestion[];
      answers: DecisionContextBuilderClarificationAnswer[];
    }
  | {
      status: "ready";
      builder: DecisionContextBuilderResult;
      answers: DecisionContextBuilderClarificationAnswer[];
      clarificationLimitReached: boolean;
    };

export function clarificationFieldForQuestionId(
  questionId: string,
): DecisionContextBuilderMissingFieldKind | undefined {
  return DETERMINISTIC_CLARIFICATION_FIELDS.find(
    (field) => questionId === `builder_question_${field}`,
  );
}

function canonicalAnswers(
  answers: DeterministicClarificationSubmittedAnswer[],
): DecisionContextBuilderClarificationAnswer[] {
  const canonical = new Map<DecisionContextBuilderMissingFieldKind, DecisionContextBuilderClarificationAnswer>();

  for (const submitted of answers) {
    const field = clarificationFieldForQuestionId(submitted.questionId);

    if (!field) {
      continue;
    }

    canonical.set(field, {
      questionId: submitted.questionId,
      field,
      answer: submitted.answer.trim(),
    });
  }

  return [...canonical.values()];
}

export function runDeterministicClarificationRoundTrip(
  request: DeterministicClarificationRoundTripRequest,
): DeterministicClarificationRoundTripResult {
  const answers = canonicalAnswers(request.answers);
  const builder = buildDecisionContext({
    requestId: request.simulationId,
    rawInput: request.input,
    inputLanguage: "es",
    requestedOutputLanguage: "es",
    clarificationAnswers: answers,
  });

  if (builder.status !== "built") {
    return { status: "rejected", builder };
  }

  const materialGapCount = builder.missing.filter(
    (field) => field.materiality !== "supporting",
  ).length;
  const shouldClarify =
    builder.safety?.level === "standard" &&
    materialGapCount >= DETERMINISTIC_CLARIFICATION_MIN_MATERIAL_GAPS &&
    request.round < DETERMINISTIC_CLARIFICATION_MAX_ROUNDS;

  if (shouldClarify) {
    return {
      status: "clarification_required",
      builder,
      round: request.round + 1,
      questions: builder.clarificationQuestions
        .slice(0, DETERMINISTIC_CLARIFICATION_MAX_QUESTIONS_PER_ROUND)
        .map((question) => ({ ...question, required: true })),
      answers,
    };
  }

  return {
    status: "ready",
    builder,
    answers,
    clarificationLimitReached:
      materialGapCount >= DETERMINISTIC_CLARIFICATION_MIN_MATERIAL_GAPS &&
      request.round >= DETERMINISTIC_CLARIFICATION_MAX_ROUNDS,
  };
}
