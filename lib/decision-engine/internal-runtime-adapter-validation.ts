import type { DecisionEngineStatus, SimulationResponseV2Draft } from "./contracts";
import {
  INTERNAL_DETERMINISTIC_RUNTIME_MODE,
  INTERNAL_RUNTIME_ADAPTER_VERSION,
  type InternalRuntimeAdapterRequest,
  type InternalRuntimeAdapterResult,
  type InternalRuntimeAdapterValidationCaseResult,
  type InternalRuntimeAdapterValidationResult,
} from "./internal-runtime-adapter-contracts";
import {
  runCanonicalInternalRuntime,
  runInternalRuntimeAdapter,
  validateInternalRuntimeAdapterRequestShape,
} from "./internal-runtime-adapter";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import type {
  Constraint,
  DecisionContext,
  DecisionInput,
  DecisionOption,
  SafetyBoundary,
} from "./types";

type AdapterValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => InternalRuntimeAdapterResult;
  assertions: ((result: InternalRuntimeAdapterResult) => string | undefined)[];
};

const known = <T>(value: T) => ({ status: "known" as const, value, evidenceRefs: [] });
const unknown = (reason: string) => ({ status: "unknown" as const, reason });

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

function constraint(id: string): Constraint {
  return {
    id,
    description: `Structured constraint ${id}`,
    kind: "resource",
    severity: "preference",
    appliesToOptionIds: [],
    evidenceRefs: [],
  };
}

function completeContext(id: string): DecisionContext {
  return {
    decisionId: `adapter_decision_${id}`,
    decisionTypes: ["comparative"],
    statement: "Choose between two structured options.",
    goals: [
      {
        id: `adapter_goal_${id}`,
        description: "Select the option with the strongest goal alignment.",
        priority: "primary",
        successCriteria: known(["Goal alignment"]),
        evidenceRefs: [],
      },
    ],
    options: [option(`adapter_option_${id}_a`), option(`adapter_option_${id}_b`, "no_action")],
    constraints: [constraint(`adapter_constraint_${id}`)],
    variables: [
      {
        id: `adapter_variable_${id}`,
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
        id: `adapter_assumption_${id}`,
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
  return {
    ...completeContext(id),
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

function adapterRequest(id: string, context?: DecisionContext): InternalRuntimeAdapterRequest {
  return {
    adapterVersion: INTERNAL_RUNTIME_ADAPTER_VERSION,
    requestId: `adapter_validation_${id}`,
    originalText: "Compare the available options against the stated goal.",
    inputLanguage: "en",
    requestedOutputLanguage: "en",
    userIntent: "recommend",
    context,
  };
}

function statusIs(...statuses: DecisionEngineStatus[]) {
  return (result: InternalRuntimeAdapterResult): string | undefined =>
    statuses.includes(result.status)
      ? undefined
      : `Expected status ${statuses.join(" or ")}, received ${result.status}.`;
}

function gapExists(code: SimulationResponseV2Draft["gaps"][number]["code"]) {
  return (result: InternalRuntimeAdapterResult): string | undefined =>
    result.response.gaps.some((gap) => gap.code === code)
      ? undefined
      : `Expected ${code} gap.`;
}

function recommendationAbsent(result: InternalRuntimeAdapterResult): string | undefined {
  return result.response.recommendation === undefined
    ? undefined
    : "Expected recommendation to be absent.";
}

function scenariosAvailable(result: InternalRuntimeAdapterResult): string | undefined {
  return result.response.analysis?.scenarios.length &&
    result.response.availability.scenarios.status === "available"
    ? undefined
    : "Expected deterministic scenarios to be available.";
}

function noV1Envelope(result: InternalRuntimeAdapterResult): string | undefined {
  const response = result.response as unknown as Record<string, unknown>;

  return response.simulation === undefined &&
    response.thinkingStages === undefined &&
    response.lang === undefined
    ? undefined
    : "Internal V2 response must not expose the public V1 envelope.";
}

function isolationPreserved(result: InternalRuntimeAdapterResult): string | undefined {
  return Object.values(result.operational).every((value) => value === false)
    ? undefined
    : "Internal runtime isolation evidence must remain false for every external or public coupling.";
}

export function validateSimulationResponseV2DeepInvariants(
  response: SimulationResponseV2Draft,
  expectedRequestId?: string,
): string[] {
  const issues: string[] = [];

  if (!validateSimulationResponseV2DraftShape(response)) {
    return ["SimulationResponse V2 draft shape validation failed."];
  }

  const optionIds = new Set(response.decision.optionSummaries.map((option) => option.id));
  const scenarioIds = new Set(response.analysis?.scenarios.map((scenario) => scenario.id) ?? []);
  const normalRecommendation =
    response.recommendation?.status === "recommended" ||
    response.recommendation?.status === "conditional";

  if (expectedRequestId && response.requestId !== expectedRequestId) {
    issues.push("Adapter and V2 request identifiers must match.");
  }

  for (const scenario of response.analysis?.scenarios ?? []) {
    if (!optionIds.has(scenario.optionId)) {
      issues.push(`Scenario ${scenario.id} references an unknown option.`);
    }
  }

  for (const risk of response.analysis?.risks ?? []) {
    if (!scenarioIds.has(risk.scenarioId)) {
      issues.push(`Risk ${risk.id} references an unknown scenario.`);
    }

    if (risk.probability.calibration !== "comparative_not_calibrated") {
      issues.push(`Risk ${risk.id} changed comparative probability calibration.`);
    }
  }

  if (
    response.recommendation?.preferredOptionId &&
    !optionIds.has(response.recommendation.preferredOptionId)
  ) {
    issues.push("Preferred recommendation option does not exist.");
  }

  if (
    response.recommendation?.preferredOptionId &&
    response.decision.optionSummaries.some(
      (option) =>
        option.id === response.recommendation?.preferredOptionId &&
        option.feasibility === "infeasible",
    )
  ) {
    issues.push("Preferred recommendation option is infeasible.");
  }

  if (
    normalRecommendation &&
    response.gaps.some(
      (gap) => gap.severity === "critical" && gap.resolution !== "resolved",
    )
  ) {
    issues.push("Normal recommendation cannot coexist with an unresolved critical gap.");
  }

  if (
    normalRecommendation &&
    (response.status === "clarification_required" ||
      response.status === "cannot_recommend" ||
      response.status === "refused" ||
      response.status === "failed" ||
      response.safety.level === "restricted" ||
      response.safety.level === "refuse")
  ) {
    issues.push("Blocked lifecycle or safety state exposed a normal recommendation.");
  }

  if (response.modelQuality.confidence.calibration !== "model_quality_not_probability") {
    issues.push("Confidence calibration marker changed.");
  }

  if (
    response.controlledFailures.length > 0 &&
    (response.analysis !== undefined || response.recommendation !== undefined)
  ) {
    issues.push("Controlled failure must not contain normal analysis or recommendation.");
  }

  return issues;
}

export function validateInternalRuntimeAdapterResult(
  value: unknown,
): value is InternalRuntimeAdapterResult {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("response" in value) ||
    !("adapterValidation" in value) ||
    !("operational" in value) ||
    typeof value.response !== "object" ||
    value.response === null ||
    Array.isArray(value.response) ||
    typeof value.adapterValidation !== "object" ||
    value.adapterValidation === null ||
    Array.isArray(value.adapterValidation) ||
    typeof value.operational !== "object" ||
    value.operational === null ||
    Array.isArray(value.operational)
  ) {
    return false;
  }

  const result = value as InternalRuntimeAdapterResult;

  return (
    result.adapterVersion === INTERNAL_RUNTIME_ADAPTER_VERSION &&
    result.mode === INTERNAL_DETERMINISTIC_RUNTIME_MODE &&
    typeof result.requestId === "string" &&
    result.status === result.response?.status &&
    typeof result.adapterValidation?.valid === "boolean" &&
    Array.isArray(result.adapterValidation?.errors) &&
    isolationPreserved(result) === undefined &&
    noV1Envelope(result) === undefined &&
    validateSimulationResponseV2DeepInvariants(result.response, result.requestId).length === 0
  );
}

function commonIssues(result: InternalRuntimeAdapterResult): string[] {
  const issues = validateSimulationResponseV2DeepInvariants(result.response, result.requestId);

  if (!validateInternalRuntimeAdapterResult(result)) {
    issues.push("Internal runtime adapter result validation failed.");
  }

  const isolationIssue = isolationPreserved(result);
  const v1Issue = noV1Envelope(result);

  if (isolationIssue) issues.push(isolationIssue);
  if (v1Issue) issues.push(v1Issue);

  return issues;
}

function adapterCases(): AdapterValidationCase[] {
  const deterministicRequest = adapterRequest("deterministic", completeContext("deterministic"));

  return [
    {
      id: "raw_text_only",
      title: "Raw text preserves missing structured context",
      expectedBehavior: "Return clarification behavior without inventing DecisionContext.",
      run: () => runInternalRuntimeAdapter(adapterRequest("raw_text_only")),
      assertions: [statusIs("clarification_required", "cannot_recommend"), gapExists("missing_context")],
    },
    {
      id: "complete_context",
      title: "Complete structured context reaches useful analysis",
      expectedBehavior: "Return successful limited or ready analysis with deterministic scenarios.",
      run: () => runInternalRuntimeAdapter(adapterRequest("complete_context", completeContext("complete_context"))),
      assertions: [statusIs("analysis_ready", "limited_analysis"), scenariosAvailable],
    },
    {
      id: "partial_context",
      title: "Partial structured context remains limited",
      expectedBehavior: "Return limited analysis and preserve important gaps.",
      run: () => runInternalRuntimeAdapter(adapterRequest("partial_context", partialContext("partial_context"))),
      assertions: [statusIs("limited_analysis"), gapExists("missing_constraints"), gapExists("missing_time_horizon")],
    },
    {
      id: "missing_goal",
      title: "Missing primary goal requires clarification",
      expectedBehavior: "Return clarification_required without normal recommendation.",
      run: () => runInternalRuntimeAdapter(adapterRequest("missing_goal", missingGoalContext("missing_goal"))),
      assertions: [statusIs("clarification_required"), gapExists("missing_goal"), recommendationAbsent],
    },
    {
      id: "contradiction",
      title: "Explicit contradiction remains visible",
      expectedBehavior: "Return clarification_required and preserve contradiction gap.",
      run: () => runInternalRuntimeAdapter(adapterRequest("contradiction", contradictionContext("contradiction"))),
      assertions: [statusIs("clarification_required"), gapExists("contradiction_detected"), recommendationAbsent],
    },
    {
      id: "safety_gap",
      title: "Incomplete elevated safety context creates a gap",
      expectedBehavior: "Preserve the safety gap and withhold normal recommendation.",
      run: () =>
        runInternalRuntimeAdapter({
          ...adapterRequest("safety_gap", completeContext("safety_gap")),
          safety: elevatedSafety,
          safetyContextComplete: false,
        }),
      assertions: [statusIs("clarification_required", "cannot_recommend"), gapExists("safety_gap"), recommendationAbsent],
    },
    {
      id: "restricted_safety",
      title: "Restricted safety withholds normal recommendation",
      expectedBehavior: "Return cannot_recommend with no normal recommendation.",
      run: () =>
        runInternalRuntimeAdapter({
          ...adapterRequest("restricted_safety", completeContext("restricted_safety")),
          safety: restrictedSafety,
          safetyContextComplete: true,
        }),
      assertions: [statusIs("cannot_recommend"), recommendationAbsent],
    },
    {
      id: "malformed_adapter_request",
      title: "Malformed adapter request returns controlled failure",
      expectedBehavior: "Return failed without an uncaught exception.",
      run: () => runInternalRuntimeAdapter({ requestId: "adapter_validation_malformed_request" }),
      assertions: [
        statusIs("failed"),
        recommendationAbsent,
        (result) => result.adapterValidation.valid ? "Malformed adapter request must fail validation." : undefined,
      ],
    },
    {
      id: "malformed_canonical_input",
      title: "Malformed canonical input returns controlled failure",
      expectedBehavior: "Return failed without invoking an unvalidated normal pipeline path.",
      run: () => runCanonicalInternalRuntime({ requestId: "adapter_validation_malformed_canonical" }),
      assertions: [
        statusIs("failed"),
        recommendationAbsent,
        (result) => result.adapterValidation.valid ? "Malformed canonical input must fail validation." : undefined,
      ],
    },
    {
      id: "unsupported_mode",
      title: "Unsupported runtime mode is denied",
      expectedBehavior: "Return controlled failure and do not select a public runtime.",
      run: () => runInternalRuntimeAdapter(adapterRequest("unsupported_mode"), "public_deterministic_v2"),
      assertions: [statusIs("failed"), recommendationAbsent],
    },
    {
      id: "deterministic_repeat",
      title: "Identical adapter invocation is deterministic",
      expectedBehavior: "Return byte-equivalent structured results for identical input.",
      run: () => {
        const first = runInternalRuntimeAdapter(deterministicRequest);
        const second = runInternalRuntimeAdapter(deterministicRequest);

        if (JSON.stringify(first) !== JSON.stringify(second)) {
          return {
            ...first,
            adapterValidation: {
              valid: false,
              errors: ["Repeated adapter invocation changed deterministic output."],
            },
          };
        }

        return first;
      },
      assertions: [
        (result) =>
          result.adapterValidation.valid
            ? undefined
            : "Repeated adapter invocation changed deterministic output.",
      ],
    },
    {
      id: "contract_isolation",
      title: "V1 and V2 contracts remain isolated",
      expectedBehavior: "Expose only V2 and explicit no-coupling operational evidence.",
      run: () => runInternalRuntimeAdapter(adapterRequest("contract_isolation", completeContext("contract_isolation"))),
      assertions: [noV1Envelope, isolationPreserved],
    },
  ];
}

/**
 * Executes the Stage 3.12 internal adapter validation catalog.
 */
export function runInternalRuntimeAdapterValidation(): InternalRuntimeAdapterValidationResult {
  const cases = adapterCases().map((validationCase): InternalRuntimeAdapterValidationCaseResult => {
    try {
      const result = validationCase.run();
      const issues = [
        ...commonIssues(result),
        ...validationCase.assertions
          .map((assertion) => assertion(result))
          .filter((issue): issue is string => Boolean(issue)),
      ];

      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualStatus: result.status,
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
        issues: ["Internal runtime adapter validation case threw an uncaught exception."],
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
