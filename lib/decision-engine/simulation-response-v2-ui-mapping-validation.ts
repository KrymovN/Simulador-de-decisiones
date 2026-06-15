import type {
  DecisionEngineStatus,
  RuntimeAvailability,
  SimulationResponseV2Draft,
} from "./contracts";
import type {
  ControlledFailure,
  DeterministicRecommendation,
  DeterministicRiskAssessment,
  DeterministicScenario,
  Score,
} from "./types";
import {
  type SimulationResponseV2UiMappingValidationCaseResult,
  type SimulationResponseV2UiMappingValidationResult,
  type SimulationResponseV2UiModel,
} from "./simulation-response-v2-ui-mapping-contracts";
import {
  createSimulationResponseV2UiEmptyModel,
  createSimulationResponseV2UiLoadingModel,
  mapSimulationResponseV2ToUiModel,
} from "./simulation-response-v2-ui-mapping";

type MappingValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => SimulationResponseV2UiModel;
  assertions: ((model: SimulationResponseV2UiModel) => string | undefined)[];
};

const score = (value: number, rationale: string): Score => ({
  value,
  band: value >= 70 ? "high" : value >= 40 ? "medium" : "low",
  rationale,
  evidenceRefs: [],
});

const scenario: DeterministicScenario = {
  id: "ui_scenario_base",
  optionId: "ui_option_a",
  perspective: "realistic",
  canonicalType: "base_case",
  assumptionIds: ["ui_assumption"],
  assumptions: [{
    id: "ui_assumption",
    source: "user",
    materiality: "important",
    validationStatus: "validated",
  }],
  dependencies: [{
    id: "ui_dependency",
    kind: "constraint",
    sourceEntityId: "ui_constraint",
    status: "known",
    materiality: "important",
    description: "Maintain the stated resource boundary.",
  }],
  uncertaintyMarkers: [{
    id: "ui_uncertainty",
    sourceType: "dependency",
    sourceEntityId: "ui_dependency",
    severity: "important",
    reason: "Resource stability should be monitored.",
  }],
  outcomeIndicators: [{
    id: "ui_consequence",
    category: "resource",
    sourceEntityId: "ui_dependency",
    state: "stable",
  }],
  confidence: score(68, "Scenario structure confidence."),
  traceEntries: [],
};

const risk: DeterministicRiskAssessment = {
  id: "ui_risk",
  scenarioId: scenario.id,
  optionId: scenario.optionId,
  riskTypes: ["dependency"],
  level: "medium",
  probability: {
    ...score(52, "Comparative scenario risk."),
    calibration: "comparative_not_calibrated",
  },
  impactSeverity: score(58, "Material but bounded impact."),
  reversibility: {
    level: "moderate",
    difficulty: score(48, "Moderate reversal difficulty."),
  },
  uncertainty: score(44, "Some uncertainty remains."),
  costOfError: "moderate",
  confidence: score(64, "Risk assessment confidence."),
  assumptionIds: scenario.assumptionIds,
  uncertaintyMarkerIds: ["ui_uncertainty"],
  traceEntries: [],
};

const recommendation: DeterministicRecommendation = {
  id: "ui_recommendation",
  status: "conditional",
  category: "proceed_with_conditions",
  priority: "high",
  preferredOptionId: "ui_option_a",
  requiredConditions: [{
    id: "ui_condition",
    kind: "dependency",
    sourceEntityId: "ui_dependency",
    status: "required",
  }],
  blockingConditions: [],
  dependencies: ["ui_dependency"],
  sourceScenarioIds: [scenario.id],
  sourceRiskIds: [risk.id],
  rationale: [{
    criterion: "risk_exposure",
    priority: "high",
    score: score(65, "Risk is manageable with the required condition."),
    sourceEntityIds: [risk.id],
  }],
  confidence: score(63, "Conditional recommendation confidence."),
  traceEntries: [],
};

const available = (): RuntimeAvailability => ({ status: "available", reasons: [] });
const blocked = (reason: string): RuntimeAvailability => ({ status: "blocked", reasons: [reason] });
const notApplicable = (reason: string): RuntimeAvailability => ({ status: "not_applicable", reasons: [reason] });

function fixture(status: DecisionEngineStatus): SimulationResponseV2Draft {
  const analysisAllowed =
    status !== "clarification_required" && status !== "refused" && status !== "failed";
  const recommendationAllowed = status === "analysis_ready" || status === "limited_analysis";
  const controlledFailure: ControlledFailure = {
    code: "internal_error",
    message: "Controlled UI mapping fixture failure.",
    retryable: true,
    retryGuidance: "Retry after validation.",
  };

  return {
    contractVersion: "2.0",
    responseId: `ui_response_${status}`,
    requestId: `ui_request_${status}`,
    generatedAt: "2026-06-15T00:00:00.000Z",
    status,
    language: { input: "en", output: "en" },
    decision: {
      statement: "Choose between the mapped options.",
      decisionTypes: ["comparative"],
      primaryGoal: "Preserve value while limiting downside.",
      secondaryGoals: [],
      optionSummaries: [{
        id: "ui_option_a",
        label: "Mapped option A",
        type: "action",
        feasibility: "feasible",
      }],
      keyConstraints: ["Maintain the resource boundary."],
      timeHorizonSummary: "Review within 30 days.",
    },
    modelQuality: {
      completeness: {
        score: 72,
        band: "high",
        blockingDimensions: [],
        explanation: "The fixture includes the required mapped dimensions.",
      },
      confidence: {
        score: 63,
        band: "medium",
        explanation: "Confidence remains model quality, not probability.",
        limitations: ["One uncertainty remains."],
        calibration: "model_quality_not_probability",
        stages: {
          overall: score(63, "Overall confidence."),
          completeness: score(72, "Completeness confidence."),
          clarification: score(70, "Clarification confidence."),
          scenarios: score(68, "Scenario confidence."),
          risks: score(64, "Risk confidence."),
          recommendations: score(63, "Recommendation confidence."),
          calibration: "model_quality_not_probability",
        },
      },
    },
    gaps: [],
    contradictions: [],
    clarification: status === "clarification_required" ? {
      action: "ask",
      reason: "A critical decision-changing detail is missing.",
      questions: [{
        id: "ui_question",
        text: "What constraint would reverse the decision?",
        answerType: "free_text",
        required: true,
        resolvesGapIds: ["ui_gap"],
        whyItMatters: "The answer may reverse the recommendation.",
      }],
      canProceedWithoutAnswers: false,
    } : undefined,
    analysis: analysisAllowed ? {
      assumptions: [],
      scenarios: [scenario],
      risks: [risk],
    } : undefined,
    recommendation: recommendationAllowed ? recommendation : undefined,
    safety: {
      level: status === "refused" ? "refuse" : status === "cannot_recommend" ? "restricted" : "standard",
      domain: status === "refused" || status === "cannot_recommend" ? "financial" : "general",
      recommendationAllowed,
      message: `Safety mapping for ${status}.`,
      suggestedSupport: status === "refused" ? ["Use qualified support."] : [],
      prohibitedOutputs: status === "refused" ? ["Enabling analysis"] : [],
    },
    availability: {
      scenarios: analysisAllowed ? available() : notApplicable("Analysis is not available for this lifecycle."),
      risks: analysisAllowed ? available() : notApplicable("Risk mapping is not available for this lifecycle."),
      recommendation: recommendationAllowed
        ? available()
        : blocked("Normal recommendation is not available for this lifecycle."),
    },
    traceability: {
      evidence: [],
      policyVersion: "ui-mapping-validation-1.0",
      inputValidation: { valid: true, errors: [] },
      completeness: [],
      gaps: [],
      contradictions: [],
      clarification: [],
      scenarios: [],
      risks: [],
      recommendations: [],
      orchestrator: [],
      responseMapping: [],
    },
    notices: status === "limited_analysis" ? [{
      code: "uncertainty",
      severity: "warning",
      message: "The mapped result remains limited.",
    }] : [],
    controlledFailures: status === "failed" ? [controlledFailure] : [],
    failure: status === "failed" ? controlledFailure : undefined,
  };
}

function isolated(model: SimulationResponseV2UiModel): string | undefined {
  const evidence = model.evidence;

  return evidence.sourceContract === "SimulationResponseV2Draft" &&
    evidence.targetContract === "SimulationResponseV2UiModel" &&
    evidence.v1CoercionUsed === false &&
    evidence.deterministicRuntimeExecuted === false &&
    evidence.sandboxExposed === false &&
    evidence.publicRuntimeTouched === false &&
    evidence.publicApiTouched === false &&
    evidence.persistenceUsed === false
    ? undefined
    : "V2 UI mapping isolation evidence changed.";
}

function cases(): MappingValidationCase[] {
  return [
    {
      id: "loading_state",
      title: "Loading state is defined without a response",
      expectedBehavior: "Expose loading sections without runtime execution.",
      run: createSimulationResponseV2UiLoadingModel,
      assertions: [
        (model) => model.renderState === "loading" ? undefined : "Expected loading render state.",
        isolated,
      ],
    },
    {
      id: "empty_state",
      title: "Empty state is defined without a response",
      expectedBehavior: "Expose empty sections without fabricating V2.",
      run: createSimulationResponseV2UiEmptyModel,
      assertions: [
        (model) => model.renderState === "empty" ? undefined : "Expected empty render state.",
        isolated,
      ],
    },
    {
      id: "clarification_mapping",
      title: "Clarification lifecycle maps to clarification UI",
      expectedBehavior: "Expose questions while keeping analysis and recommendation unavailable.",
      run: () => mapSimulationResponseV2ToUiModel(fixture("clarification_required")),
      assertions: [
        (model) => model.renderState === "clarification" ? undefined : "Expected clarification render state.",
        (model) => model.sections.clarification.items.length === 1 ? undefined : "Expected clarification section.",
        (model) => model.sections.recommendation.items.length === 0 ? undefined : "Recommendation must be absent.",
      ],
    },
    {
      id: "analysis_ready_mapping",
      title: "Analysis-ready lifecycle maps complete output areas",
      expectedBehavior: "Expose scenarios, risks, consequences, and recommendation.",
      run: () => mapSimulationResponseV2ToUiModel(fixture("analysis_ready")),
      assertions: [
        (model) => model.renderState === "ready" ? undefined : "Expected ready render state.",
        (model) => model.sections.scenarios.items.length === 1 ? undefined : "Expected scenario mapping.",
        (model) => model.sections.risks.items.length === 1 ? undefined : "Expected risk mapping.",
        (model) => model.sections.consequences.items.length === 1 ? undefined : "Expected consequence mapping.",
        (model) => model.sections.recommendation.items.length === 1 ? undefined : "Expected recommendation mapping.",
      ],
    },
    {
      id: "limited_mapping",
      title: "Limited lifecycle preserves quality and notices",
      expectedBehavior: "Expose useful output with limitations and calibrated scores.",
      run: () => mapSimulationResponseV2ToUiModel(fixture("limited_analysis")),
      assertions: [
        (model) => model.renderState === "limited" ? undefined : "Expected limited render state.",
        (model) => model.sections.notices.items.length === 1 ? undefined : "Expected limitation notice.",
        (model) =>
          model.sections.modelQuality.items[0]?.confidence.calibration === "model_quality_not_probability"
            ? undefined
            : "Confidence calibration must remain explicit.",
        (model) =>
          model.sections.risks.items[0]?.comparativeProbability.calibration === "comparative_not_calibrated"
            ? undefined
            : "Risk probability calibration must remain explicit.",
      ],
    },
    {
      id: "cannot_recommend_mapping",
      title: "Cannot-recommend lifecycle maps restricted recommendation state",
      expectedBehavior: "Expose safe analysis without a normal recommendation.",
      run: () => mapSimulationResponseV2ToUiModel(fixture("cannot_recommend")),
      assertions: [
        (model) => model.renderState === "cannot_recommend" ? undefined : "Expected cannot_recommend state.",
        (model) => model.sections.recommendation.items.length === 0 ? undefined : "Recommendation must be absent.",
      ],
    },
    {
      id: "refused_mapping",
      title: "Refused lifecycle maps safe refusal",
      expectedBehavior: "Expose safety support without enabling analysis.",
      run: () => mapSimulationResponseV2ToUiModel(fixture("refused")),
      assertions: [
        (model) => model.renderState === "refused" ? undefined : "Expected refused state.",
        (model) => model.sections.scenarios.items.length === 0 ? undefined : "Refusal must not expose scenarios.",
        (model) => model.sections.safety.items[0]?.suggestedSupport.length === 1 ? undefined : "Expected safe support.",
      ],
    },
    {
      id: "failed_mapping",
      title: "Failed lifecycle maps controlled failure",
      expectedBehavior: "Expose controlled failure without fabricated output.",
      run: () => mapSimulationResponseV2ToUiModel(fixture("failed")),
      assertions: [
        (model) => model.renderState === "controlled_failure" ? undefined : "Expected controlled failure state.",
        (model) => model.sections.scenarios.items.length === 0 ? undefined : "Failure must not expose scenarios.",
        (model) => model.sections.recommendation.items.length === 0 ? undefined : "Failure must not expose recommendation.",
      ],
    },
    {
      id: "invalid_response_mapping",
      title: "Invalid V2 maps to controlled failure",
      expectedBehavior: "Reject malformed input before field mapping.",
      run: () => mapSimulationResponseV2ToUiModel({ contractVersion: "2.0" }),
      assertions: [
        (model) => model.renderState === "controlled_failure" ? undefined : "Expected controlled failure state.",
        (model) => model.mappingErrors.length === 1 ? undefined : "Expected mapping validation error.",
      ],
    },
    {
      id: "v1_v2_boundary",
      title: "Mapping preserves strict V1 and V2 boundaries",
      expectedBehavior: "Produce no public V1 envelope and execute no runtime.",
      run: () => mapSimulationResponseV2ToUiModel(fixture("limited_analysis")),
      assertions: [
        isolated,
        (model) => {
          const value = model as unknown as Record<string, unknown>;
          return value.simulation === undefined &&
            value.thinkingStages === undefined &&
            value.lang === undefined
            ? undefined
            : "UI mapping must not expose the V1 response envelope.";
        },
      ],
    },
  ];
}

export function runSimulationResponseV2UiMappingValidation(): SimulationResponseV2UiMappingValidationResult {
  const results = cases().map((validationCase): SimulationResponseV2UiMappingValidationCaseResult => {
    try {
      const model = validationCase.run();
      const issues = validationCase.assertions
        .map((assertion) => assertion(model))
        .filter((issue): issue is string => Boolean(issue));

      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualState: model.renderState,
        passed: issues.length === 0,
        failed: issues.length > 0,
        issues,
      };
    } catch {
      return {
        caseId: validationCase.id,
        title: validationCase.title,
        expectedBehavior: validationCase.expectedBehavior,
        actualState: "controlled_failure",
        passed: false,
        failed: true,
        issues: ["UI mapping validation case threw an uncaught exception."],
      };
    }
  });
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}
