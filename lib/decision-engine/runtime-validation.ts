import { DECISION_ENGINE_STATUSES, type DecisionEngineStatus, type SimulationResponseV2Draft } from "./contracts";
import { runSimulationPipeline, type SimulationPipelineOptions } from "./pipeline";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import type {
  Constraint,
  DecisionContext,
  DecisionInput,
  DecisionOption,
  SafetyBoundary,
} from "./types";

export type RuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: DecisionEngineStatus;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type RuntimeValidationSummary = {
  total: number;
  passed: number;
  failed: number;
};

export type RuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: RuntimeValidationCaseResult[];
  summary: RuntimeValidationSummary;
};

type RuntimeValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  input: DecisionInput;
  options?: SimulationPipelineOptions;
  assertions: ((response: SimulationResponseV2Draft) => string | undefined)[];
};

const known = <T>(value: T) => ({ status: "known" as const, value, evidenceRefs: [] });
const unknown = (reason: string) => ({ status: "unknown" as const, reason });

function decisionInput(id: string): DecisionInput {
  return {
    contractVersion: "2.0",
    requestId: `runtime_validation_${id}`,
    input: {
      originalText: "Compare the available options against the stated goal.",
      inputLanguage: "en",
      requestedOutputLanguage: "en",
    },
    userIntent: "recommend",
  };
}

function option(id: string, type: DecisionOption["type"] = "action"): DecisionOption {
  return {
    id,
    label: id,
    description: `Structured option ${id}`,
    type,
    userProposed: true,
    feasible: known(true),
    evidenceRefs: [],
  };
}

function constraint(id: string, severity: Constraint["severity"] = "preference"): Constraint {
  return {
    id,
    description: `Structured constraint ${id}`,
    kind: "resource",
    severity,
    appliesToOptionIds: [],
    evidenceRefs: [],
  };
}

function completeContext(id: string): DecisionContext {
  return {
    decisionId: `decision_${id}`,
    decisionTypes: ["comparative"],
    statement: "Choose between two structured options.",
    goals: [
      {
        id: `goal_${id}`,
        description: "Select the option with the strongest goal alignment.",
        priority: "primary",
        successCriteria: known(["Goal alignment"]),
        evidenceRefs: [],
      },
    ],
    options: [option(`option_${id}_a`), option(`option_${id}_b`, "no_action")],
    constraints: [constraint(`constraint_${id}`)],
    variables: [
      {
        id: `variable_${id}`,
        name: "Available capacity",
        description: "Known available capacity.",
        value: known("sufficient"),
        materiality: "important",
        volatility: "stable",
        affectedOptionIds: [],
      },
    ],
    stakeholders: [],
    timeHorizon: {
      decisionDeadline: known("30 days"),
      shortTermWindow: known("90 days"),
      longTermWindow: known("12 months"),
      delayCost: known("low"),
      reversibilityWindow: known("90 days"),
    },
    assumptions: [
      {
        id: `assumption_${id}`,
        statement: "Current capacity remains available.",
        source: "user",
        materiality: "important",
        validationStatus: "validated",
        affectedEntityIds: [],
        evidenceRefs: [],
      },
    ],
    evidence: [],
  };
}

function partialContext(id: string): DecisionContext {
  const context = completeContext(id);

  return {
    ...context,
    constraints: [],
    timeHorizon: {
      decisionDeadline: unknown("Not supplied."),
      shortTermWindow: unknown("Not supplied."),
      longTermWindow: unknown("Not supplied."),
      delayCost: unknown("Not supplied."),
      reversibilityWindow: unknown("Not supplied."),
    },
  };
}

function missingGoalContext(id: string): DecisionContext {
  return { ...completeContext(id), goals: [] };
}

function contradictionContext(id: string): DecisionContext {
  const context = completeContext(id);

  return {
    ...context,
    assumptions: context.assumptions.map((assumption) => ({
      ...assumption,
      validationStatus: "contradicted",
    })),
  };
}

const elevatedSafety: SafetyBoundary = {
  domain: "financial",
  level: "elevated",
  recommendationAllowed: true,
  requiredNotices: ["Use qualified financial review for consequential action."],
  requiredEscalations: [],
  prohibitedOutputs: [],
  rationale: "Financial context requires an explicit safety-context completeness check.",
};

const restrictedSafety: SafetyBoundary = {
  domain: "financial",
  level: "restricted",
  recommendationAllowed: false,
  requiredNotices: ["Direct recommendation is restricted."],
  requiredEscalations: ["Use qualified financial review."],
  prohibitedOutputs: ["Consequential preferred path"],
  rationale: "The explicit safety boundary restricts normal analysis and recommendation.",
};

function statusIs(...statuses: DecisionEngineStatus[]) {
  return (response: SimulationResponseV2Draft): string | undefined =>
    statuses.includes(response.status) ? undefined : `Expected status ${statuses.join(" or ")}, received ${response.status}.`;
}

function scenariosAvailable(response: SimulationResponseV2Draft): string | undefined {
  return response.analysis?.scenarios.length && response.availability.scenarios.status === "available"
    ? undefined
    : "Expected deterministic scenarios to be available.";
}

function scenariosBlocked(response: SimulationResponseV2Draft): string | undefined {
  return response.analysis === undefined && response.availability.scenarios.status !== "available"
    ? undefined
    : "Expected scenario generation to remain blocked.";
}

function risksAvailable(response: SimulationResponseV2Draft): string | undefined {
  return response.analysis?.risks.length && response.availability.risks.status === "available"
    ? undefined
    : "Expected structured risk coverage.";
}

function recommendationAbsent(response: SimulationResponseV2Draft): string | undefined {
  return response.recommendation === undefined ? undefined : "Expected recommendation to be absent.";
}

function gapExists(code: SimulationResponseV2Draft["gaps"][number]["code"]) {
  return (response: SimulationResponseV2Draft): string | undefined =>
    response.gaps.some((gap) => gap.code === code) ? undefined : `Expected ${code} gap.`;
}

function runtimeCases(): RuntimeValidationCase[] {
  const complete = completeContext("complete");
  const partial = partialContext("partial");
  const missingGoal = missingGoalContext("missing_goal");
  const contradiction = contradictionContext("contradiction");

  return [
    {
      id: "complete_input",
      title: "Complete input reaches useful analysis",
      expectedBehavior: "Return analysis_ready or equivalent limited successful analysis with scenarios and risks.",
      input: decisionInput("complete_input"),
      options: { context: complete },
      assertions: [statusIs("analysis_ready", "limited_analysis"), scenariosAvailable, risksAvailable],
    },
    {
      id: "partial_input",
      title: "Partial input remains explicitly limited",
      expectedBehavior: "Return limited_analysis while preserving important missing-information gaps.",
      input: decisionInput("partial_input"),
      options: { context: partial },
      assertions: [statusIs("limited_analysis"), gapExists("missing_constraints"), gapExists("missing_time_horizon")],
    },
    {
      id: "missing_goal",
      title: "Missing primary goal requires clarification",
      expectedBehavior: "Return clarification_required without normal analysis or recommendation.",
      input: decisionInput("missing_goal"),
      options: { context: missingGoal },
      assertions: [statusIs("clarification_required"), gapExists("missing_goal"), scenariosBlocked, recommendationAbsent],
    },
    {
      id: "contradiction",
      title: "Explicit contradiction blocks normal analysis",
      expectedBehavior: "Return clarification_required with contradiction trace and no fabricated recommendation.",
      input: decisionInput("contradiction"),
      options: { context: contradiction },
      assertions: [statusIs("clarification_required"), gapExists("contradiction_detected"), recommendationAbsent],
    },
    {
      id: "safety_gap",
      title: "Incomplete high-stakes safety context creates a safety gap",
      expectedBehavior: "Return clarification_required or cannot_recommend and preserve the safety gap.",
      input: decisionInput("safety_gap"),
      options: { context: completeContext("safety_gap"), safety: elevatedSafety, safetyContextComplete: false },
      assertions: [statusIs("clarification_required", "cannot_recommend"), gapExists("safety_gap"), recommendationAbsent],
    },
    {
      id: "scenario_allowed",
      title: "Scenario generation runs when gates permit",
      expectedBehavior: "Expose deterministic scenarios and completed scenario trace.",
      input: decisionInput("scenario_allowed"),
      options: { context: completeContext("scenario_allowed") },
      assertions: [scenariosAvailable],
    },
    {
      id: "scenario_blocked",
      title: "Scenario generation stops on a critical gap",
      expectedBehavior: "Expose blocked scenario availability and no analysis block.",
      input: decisionInput("scenario_blocked"),
      options: { context: missingGoalContext("scenario_blocked") },
      assertions: [scenariosBlocked],
    },
    {
      id: "risk_coverage",
      title: "Every generated scenario receives risk coverage",
      expectedBehavior: "Expose one structured risk assessment for every generated scenario.",
      input: decisionInput("risk_coverage"),
      options: { context: completeContext("risk_coverage") },
      assertions: [
        risksAvailable,
        (response) =>
          response.analysis?.scenarios.length === response.analysis?.risks.length
            ? undefined
            : "Scenario and risk assessment counts must match.",
      ],
    },
    {
      id: "recommendation_withheld",
      title: "Restricted safety withholds recommendation",
      expectedBehavior: "Return cannot_recommend without a normal recommendation.",
      input: decisionInput("recommendation_withheld"),
      options: { context: completeContext("recommendation_withheld"), safety: restrictedSafety, safetyContextComplete: true },
      assertions: [statusIs("cannot_recommend"), recommendationAbsent, scenariosBlocked],
    },
    {
      id: "validation_failure",
      title: "Malformed input returns controlled failure",
      expectedBehavior: "Return failed without throwing and without analysis or recommendation.",
      input: { requestId: "runtime_validation_invalid" } as DecisionInput,
      assertions: [
        statusIs("failed"),
        recommendationAbsent,
        scenariosBlocked,
        (response) => (response.controlledFailures.length > 0 ? undefined : "Expected a controlled failure record."),
      ],
    },
  ];
}

function commonIssues(response: SimulationResponseV2Draft): string[] {
  const issues: string[] = [];

  if (!DECISION_ENGINE_STATUSES.includes(response.status)) {
    issues.push(`Unsupported lifecycle status: ${response.status}.`);
  }

  if (!validateSimulationResponseV2DraftShape(response)) {
    issues.push("SimulationResponse V2 draft shape validation failed.");
  }

  if (
    response.traceability.orchestrator.length === 0 &&
    response.status !== "failed"
  ) {
    issues.push("Expected orchestrator trace.");
  }

  if (response.traceability.responseMapping.length === 0) {
    issues.push("Expected response-mapping trace.");
  }

  if (response.modelQuality.confidence.calibration !== "model_quality_not_probability") {
    issues.push("Confidence calibration marker changed.");
  }

  if (
    (response.status === "refused" ||
      response.status === "failed" ||
      response.status === "clarification_required") &&
    (response.analysis !== undefined || response.recommendation !== undefined)
  ) {
    issues.push(`${response.status} must not include normal analysis or recommendation.`);
  }

  if (
    response.status === "cannot_recommend" &&
    response.recommendation !== undefined &&
    response.recommendation.status !== "withheld"
  ) {
    issues.push("cannot_recommend may contain only withheld recommendation behavior.");
  }

  return issues;
}

/**
 * Executes the internal Stage 3.10 deterministic runtime validation catalog.
 */
export function runDecisionEngineRuntimeValidation(): RuntimeValidationResult {
  const cases = runtimeCases().map((validationCase): RuntimeValidationCaseResult => {
    try {
      const response = runSimulationPipeline(validationCase.input, validationCase.options);
      const issues = [
        ...commonIssues(response),
        ...validationCase.assertions
          .map((assertion) => assertion(response))
          .filter((issue): issue is string => Boolean(issue)),
      ];

      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: response.status,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      };
    } catch {
      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: "failed",
        passed: false,
        failed: true,
        issues: ["Runtime validation case threw an uncaught exception."],
      };
    }
  });
  const passed = cases.filter((validationCase) => validationCase.passed).length;
  const failed = cases.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed,
    },
  };
}
