import {
  DETERMINISTIC_CLARIFICATION_MAX_ROUNDS,
  runDeterministicClarificationRoundTrip,
} from "./deterministic-clarification-round-trip";
import {
  adaptSimulationResponseV2ToPublicSimulatorEnvelope,
  SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
} from "./simulation-response-public-adapter";
import { runInternalSimulationPipelineFromBuiltContext } from "./simulation-pipeline-runner";

export type DeterministicClarificationValidationCase = {
  name: string;
  passed: boolean;
  message?: string;
};

function assertCase(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runCase(name: string, check: () => void): DeterministicClarificationValidationCase {
  try {
    check();
    return { name, passed: true };
  } catch (error) {
    return {
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

const acceptanceInput = "¿Debería cambiar de trabajo?";

function initialRound() {
  return runDeterministicClarificationRoundTrip({
    requestId: "clarification_acceptance_initial",
    simulationId: "clarification_acceptance_simulation",
    input: acceptanceInput,
    round: 0,
    answers: [],
  });
}

export function runDeterministicClarificationRoundTripValidation() {
  const cases = [
    runCase("sparse Spanish input requires clarification", () => {
      const result = initialRound();
      assertCase(result.status === "clarification_required", `Expected clarification_required, received ${result.status}.`);
      if (result.status !== "clarification_required") return;
      assertCase(result.round === 1, "Expected first clarification round.");
      assertCase(result.questions.length === 3, "Expected a bounded three-question round.");
      assertCase(result.questions.every((question) => question.required), "Expected every rendered question to require an answer.");
      assertCase(result.questions.every((question) => /[¿?]/.test(question.text)), "Expected Spanish question copy.");
    }),

    runCase("question ids remain stable and field-linked", () => {
      const result = initialRound();
      assertCase(result.status === "clarification_required", "Expected clarification round.");
      if (result.status !== "clarification_required") return;
      assertCase(
        result.questions.every((question) => question.id === `builder_question_${question.field}`),
        "Question ids must retain the canonical builder field link.",
      );
    }),

    runCase("submitted answers rebuild canonical context and complete", () => {
      const initial = initialRound();
      assertCase(initial.status === "clarification_required", "Expected initial clarification round.");
      if (initial.status !== "clarification_required") return;

      const submitted = initial.questions.map((question, index) => ({
        questionId: question.id,
        answer: [
          "Conseguir un trabajo más estable, con mejores condiciones y que me permita tener más tiempo para mi vida personal.",
          "Necesito mantener unos ingresos suficientes para cubrir mis gastos y preferiría tener una nueva oferta antes de dejar mi trabajo actual.",
          "No quiero reducir mucho mis ingresos ni aceptar unas condiciones laborales claramente peores que las actuales.",
        ][index],
      }));
      const continuation = runDeterministicClarificationRoundTrip({
        requestId: "clarification_acceptance_continuation",
        simulationId: "clarification_acceptance_simulation",
        input: acceptanceInput,
        round: initial.round,
        answers: submitted,
      });

      assertCase(continuation.status === "ready", `Expected ready continuation, received ${continuation.status}.`);
      if (continuation.status !== "ready") return;
      assertCase(
        continuation.builder.evidence.filter((item) => item.source === "user_answer").length === submitted.length,
        "Expected every submitted answer in canonical evidence.",
      );
      assertCase(
        !continuation.builder.missing.some((item) =>
          submitted.some((answer) => answer.questionId === `builder_question_${item.field}`)
        ),
        "Answered fields must no longer remain missing.",
      );
      assertCase(
        continuation.builder.decisionInput?.requestId === "clarification_acceptance_simulation",
        "Canonical DecisionInput must preserve the logical simulation id.",
      );

      const runner = runInternalSimulationPipelineFromBuiltContext({
        requestId: "clarification_acceptance_simulation",
        builder: continuation.builder,
      });
      assertCase(runner.status === "completed" && Boolean(runner.response), "Expected canonical runner completion.");
      assertCase(runner.response?.decision.statement === acceptanceInput, "Expected original decision question to remain intact.");

      if (!runner.response) return;
      const envelope = adaptSimulationResponseV2ToPublicSimulatorEnvelope({
        response: runner.response,
        requestId: "clarification_acceptance_continuation",
        generatedAt: "2026-08-30T16:00:00.000Z",
        truthBoundary: SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY,
      });
      assertCase(envelope.status === "completed", `Expected completed public result, received ${envelope.status}.`);
      assertCase(
        envelope.status === "completed" && envelope.data.simulation.id === "clarification_acceptance_simulation",
        "Completed simulation must preserve the logical simulation id.",
      );
    }),

    runCase("sufficiently specified input remains one-shot", () => {
      const result = runDeterministicClarificationRoundTrip({
        requestId: "clarification_one_shot",
        simulationId: "clarification_one_shot",
        input: "Comparar aceptar una oferta laboral o seguir en mi empresa actual antes de final de mes con mi familia, sin reducir ingresos y con una transición reversible",
        round: 0,
        answers: [],
      });
      assertCase(result.status === "ready", `Expected one-shot ready, received ${result.status}.`);
    }),

    runCase("safety refusal takes precedence over product clarification", () => {
      const result = runDeterministicClarificationRoundTrip({
        requestId: "clarification_safety",
        simulationId: "clarification_safety",
        input: "Estoy pensando en matarme",
        round: 0,
        answers: [],
      });
      assertCase(result.status === "ready", "Safety input must proceed directly to the canonical refusal boundary.");
    }),

    runCase("clarification loop stops at the configured bound", () => {
      const result = runDeterministicClarificationRoundTrip({
        requestId: "clarification_limit",
        simulationId: "clarification_limit",
        input: "¿Debería invertir?",
        round: DETERMINISTIC_CLARIFICATION_MAX_ROUNDS,
        answers: [{
          questionId: "builder_question_success_criteria",
          answer: "Conservar capital y aprender.",
        }],
      });
      assertCase(result.status === "ready", "Expected controlled continuation at the loop bound.");
      assertCase(
        result.status === "ready" && result.clarificationLimitReached,
        "Expected explicit clarification-limit evidence.",
      );
    }),
  ];

  return {
    passed: cases.every((item) => item.passed),
    cases,
  };
}
