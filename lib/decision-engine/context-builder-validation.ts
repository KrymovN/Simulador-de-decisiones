import {
  buildDecisionContext,
  decisionContextBuilderIsolationEvidence,
  type DecisionContextBuilderResult,
} from "./context-builder";
import { runSimulationPipeline } from "./pipeline";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";

export type DecisionContextBuilderValidationCaseResult = {
  name: string;
  passed: boolean;
  message?: string;
};

export type DecisionContextBuilderValidationResult = {
  passed: boolean;
  cases: DecisionContextBuilderValidationCaseResult[];
};

function assertCase(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function built(result: DecisionContextBuilderResult): asserts result is DecisionContextBuilderResult & {
  status: "built";
  decisionInput: NonNullable<DecisionContextBuilderResult["decisionInput"]>;
  decisionContext: NonNullable<DecisionContextBuilderResult["decisionContext"]>;
  safety: NonNullable<DecisionContextBuilderResult["safety"]>;
} {
  assertCase(result.status === "built", `Expected builder status built, received ${result.status}.`);
  assertCase(Boolean(result.decisionInput), "Expected DecisionInput.");
  assertCase(Boolean(result.decisionContext), "Expected DecisionContext.");
  assertCase(Boolean(result.safety), "Expected SafetyBoundary.");
}

function runCase(name: string, check: () => void): DecisionContextBuilderValidationCaseResult {
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

export function runDecisionContextBuilderValidation(): DecisionContextBuilderValidationResult {
  const cases = [
    runCase("empty input rejected", () => {
      const result = buildDecisionContext({ requestId: "case_empty", rawInput: "   " });
      assertCase(result.status === "rejected", "Expected rejected status.");
      assertCase(result.error?.code === "input_required", "Expected input_required error.");
    }),

    runCase("simple action creates primary goal and three options", () => {
      const result = buildDecisionContext({
        requestId: "case_simple_action",
        rawInput: "Lanzar una oferta premium para clientes existentes",
        inputLanguage: "es",
        requestedOutputLanguage: "es",
      });
      built(result);
      assertCase(result.decisionContext.goals.some((goal) => goal.priority === "primary"), "Missing primary goal.");
      assertCase(result.decisionContext.options.length === 3, "Expected exactly three default options.");
      assertCase(result.decisionContext.options.some((option) => option.type === "information_gathering"), "Missing information option.");
      assertCase(result.decisionContext.options.some((option) => option.type === "no_action"), "Missing no-action option.");
    }),

    runCase("explicit A/B creates comparative options", () => {
      const result = buildDecisionContext({
        requestId: "case_compare",
        rawInput: "Comparar aceptar la oferta laboral o seguir en mi empresa actual",
        inputLanguage: "es",
      });
      built(result);
      assertCase(result.decisionInput.userIntent === "compare", "Expected compare intent.");
      assertCase(result.decisionContext.decisionTypes.includes("comparative"), "Expected comparative DecisionType.");
      assertCase(result.decisionContext.options.length === 2, "Expected two explicit options.");
      assertCase(result.decisionContext.options.every((option) => option.userProposed), "Expected explicit user options.");
    }),

    runCase("finance purchase marks budget unknown unless explicit", () => {
      const result = buildDecisionContext({
        requestId: "case_finance_budget_unknown",
        rawInput: "Comprar un coche usado este mes",
        inputLanguage: "es",
      });
      built(result);
      assertCase(result.category === "finance_purchase", "Expected finance_purchase category.");
      assertCase(result.missing.some((field) => field.field === "budget"), "Expected missing budget.");
      assertCase(
        result.decisionContext.variables.some(
          (variable) => variable.id === "variable_budget" && variable.value.status === "unknown",
        ),
        "Expected unknown budget variable.",
      );
    }),

    runCase("explicit budget creates known financial variable and evidence", () => {
      const result = buildDecisionContext({
        requestId: "case_explicit_budget",
        rawInput: "Comprar un coche usado con presupuesto de 8000 euros este mes",
        inputLanguage: "es",
      });
      built(result);
      const budget = result.decisionContext.variables.find((variable) => variable.id === "variable_budget");
      assertCase(Boolean(budget), "Expected budget variable.");
      assertCase(budget?.value.status === "known", "Expected known budget value.");
      assertCase(result.evidence.some((item) => item.claim.includes("8000")), "Expected budget evidence.");
    }),

    runCase("relocation detects relocation/travel category", () => {
      const result = buildDecisionContext({
        requestId: "case_relocation",
        rawInput: "Mudanza a Lisboa el proximo mes con mi familia",
        inputLanguage: "es",
      });
      built(result);
      assertCase(result.category === "relocation_travel", "Expected relocation_travel category.");
      assertCase(result.decisionContext.timeHorizon.decisionDeadline.status === "known", "Expected known time marker.");
    }),

    runCase("health and legal terms produce elevated or restricted safety", () => {
      const health = buildDecisionContext({
        requestId: "case_health",
        rawInput: "Decidir si cambio mi tratamiento medico",
        inputLanguage: "es",
      });
      const legal = buildDecisionContext({
        requestId: "case_legal",
        rawInput: "Revisar una demanda con mi abogado",
        inputLanguage: "es",
      });
      built(health);
      built(legal);
      assertCase(["elevated", "restricted"].includes(health.safety.level), "Expected health high-stakes safety.");
      assertCase(["elevated", "restricted"].includes(legal.safety.level), "Expected legal high-stakes safety.");
    }),

    runCase("self-harm violence and illegal requests produce refuse boundary", () => {
      const selfHarm = buildDecisionContext({
        requestId: "case_refuse_self_harm",
        rawInput: "Estoy pensando en matarme",
        inputLanguage: "es",
      });
      const violence = buildDecisionContext({
        requestId: "case_refuse_violence",
        rawInput: "Decidir como herir a alguien",
        inputLanguage: "es",
      });
      const illegal = buildDecisionContext({
        requestId: "case_refuse_illegal",
        rawInput: "Planear fraude para evadir impuestos",
        inputLanguage: "es",
      });
      built(selfHarm);
      built(violence);
      built(illegal);
      assertCase(selfHarm.safety.level === "refuse", "Expected self-harm refusal.");
      assertCase(violence.safety.level === "refuse", "Expected violence refusal.");
      assertCase(illegal.safety.level === "refuse", "Expected illegal-activity refusal.");
    }),

    runCase("no deadline remains unknown", () => {
      const result = buildDecisionContext({
        requestId: "case_no_deadline",
        rawInput: "Lanzar un producto nuevo para clientes actuales",
        inputLanguage: "es",
      });
      built(result);
      assertCase(result.decisionContext.timeHorizon.decisionDeadline.status === "unknown", "Expected unknown deadline.");
      assertCase(result.missing.some((field) => field.field === "deadline"), "Expected missing deadline marker.");
    }),

    runCase("explicit deadline creates known time field and evidence", () => {
      const result = buildDecisionContext({
        requestId: "case_deadline",
        rawInput: "Lanzar un producto nuevo antes de final de mes",
        inputLanguage: "es",
      });
      built(result);
      assertCase(result.decisionContext.timeHorizon.decisionDeadline.status === "known", "Expected known deadline.");
      assertCase(result.inferred.some((item) => item.kind === "time_horizon"), "Expected time inference.");
    }),

    runCase("builder isolation evidence forbids external runtime dependencies", () => {
      const isolation = decisionContextBuilderIsolationEvidence();
      assertCase(isolation.deterministicOnly, "Expected deterministicOnly.");
      assertCase(!isolation.modelCallsExecuted, "Expected no model calls.");
      assertCase(!isolation.providerSdkUsed, "Expected no provider SDK.");
      assertCase(!isolation.environmentRead, "Expected no environment reads.");
      assertCase(!isolation.apiKeyRead, "Expected no API key reads.");
      assertCase(!isolation.persistenceUsed, "Expected no persistence.");
      assertCase(!isolation.authUsed, "Expected no auth.");
      assertCase(!isolation.billingUsed, "Expected no billing.");
    }),

    runCase("builder output works with runSimulationPipeline", () => {
      const result = buildDecisionContext({
        requestId: "case_pipeline",
        rawInput: "Lanzar una oferta premium para clientes existentes esta semana sin aumentar presupuesto",
        inputLanguage: "es",
        requestedOutputLanguage: "es",
      });
      built(result);
      const response = runSimulationPipeline(result.decisionInput, {
        context: result.decisionContext,
        safety: result.safety,
        safetyContextComplete: result.safetyContextComplete,
      });
      assertCase(validateSimulationResponseV2DraftShape(response), "Expected valid SimulationResponseV2Draft.");
      assertCase(response.status !== "failed", "Expected pipeline not to fail.");
      assertCase(response.decision.optionSummaries.length > 0, "Expected option summaries.");
    }),
  ];

  return {
    passed: cases.every((item) => item.passed),
    cases,
  };
}
