import {
  AI_QUALITY_CONTRACTS_MODE,
  AI_QUALITY_CONTRACTS_VERSION,
  type AiQualityContractsConfig,
  type AiQualityContractsFoundation,
  type AiQualityContractsSafetyEvidence,
  type AiQualityError,
  type AiQualityErrorCode,
  type AiQualityEvaluationCriterion,
  type AiQualityEvaluationDimension,
  type AiQualityEvaluationResult,
  type AiQualityFailureSeverity,
  type AiQualityObservedMetric,
  type AiQualityReleaseGateModel,
  type AiQualityValidationCaseResult,
  type AiQualityValidationInputContract,
  type AiQualityValidationResult,
} from "./contracts";

export const DEFAULT_AI_QUALITY_RELEASE_GATE: AiQualityReleaseGateModel = {
  gateId: "stage_5_3a_foundation_gate",
  scope: "decision_simulation_ai_quality_cost_safety",
  minWeightedQualityScore: 0.75,
  blockOnAnyBlockingFailure: true,
  blockOnCostBudgetFailure: true,
  blockOnSafetyFailure: true,
  allowWarnings: true,
};

export const DEFAULT_AI_QUALITY_CONTRACTS_CONFIG: AiQualityContractsConfig = {
  enabled: false,
  defaultReleaseGate: DEFAULT_AI_QUALITY_RELEASE_GATE,
};

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => AiQualityEvaluationResult;
  assertions: ((
    result: AiQualityEvaluationResult,
  ) => string | undefined)[];
};

const now = "2026-06-19T12:00:00.000Z";

export function aiQualityContractsSafetyEvidence(): AiQualityContractsSafetyEvidence {
  return {
    stage: "5.3A",
    aiQualityOnly: true,
    contractsOnly: true,
    foundationOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    qualityEvaluationDefined: true,
    costBudgetDefined: true,
    safetyValidationDefined: true,
    releaseGateDefined: true,
    validationEvidenceDefined: true,
    modelCallExecuted: false,
    openAiSdkConnected: false,
    apiKeysRead: false,
    envVariablesRead: false,
    apiRouteIntegrated: false,
    simulatorIntegrated: false,
    decisionEngineRuntimeConnected: false,
    aiProviderRuntimeConnected: false,
    promptContextRuntimeConnected: false,
    databaseConnected: false,
    supabaseConnected: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    subscriptionsRuntimeConnected: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    rollback: "disable_ai_quality_contracts_or_remove_ai_quality_exports",
  };
}

function error(input: {
  code: AiQualityErrorCode;
  message: string;
  severity: AiQualityFailureSeverity;
}): AiQualityError {
  return {
    code: input.code,
    message: input.message,
    severity: input.severity,
    recoverable: false,
  };
}

function blocked(input: {
  code: AiQualityErrorCode;
  message: string;
  severity?: AiQualityFailureSeverity;
}): AiQualityEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_QUALITY_CONTRACTS_VERSION,
    releaseGateStatus: "blocked",
    error: error({
      code: input.code,
      message: input.message,
      severity: input.severity ?? "blocking",
    }),
    evidence: aiQualityContractsSafetyEvidence(),
  };
}

function isTimestampValid(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function hasClientRuntimeFields(input: AiQualityValidationInputContract): boolean {
  const fields = input.clientRuntimeFields;

  if (!fields) {
    return false;
  }

  return Boolean(
    fields.apiKey ||
      fields.envVarName ||
      fields.rawPrompt ||
      fields.providerPayload ||
      fields.modelCallPayload,
  );
}

function criteriaDimensions(
  criteria: AiQualityEvaluationCriterion[],
): Set<AiQualityEvaluationDimension> {
  return new Set(criteria.map((item) => item.dimension));
}

function metricByDimension(
  metrics: AiQualityObservedMetric[],
): Map<AiQualityEvaluationDimension, AiQualityObservedMetric> {
  return new Map(metrics.map((metric) => [metric.dimension, metric]));
}

function criteriaAreValid(criteria: AiQualityEvaluationCriterion[]): boolean {
  return criteria.length > 0 &&
    criteria.every(
      (criterion) =>
        criterion.minScore >= 0 &&
        criterion.minScore <= 1 &&
        criterion.weight > 0 &&
        criterion.weight <= 1 &&
        (criterion.severityOnFail === "info" ||
          criterion.severityOnFail === "warning" ||
          criterion.severityOnFail === "blocking"),
    );
}

function metricsAreValid(metrics: AiQualityObservedMetric[]): boolean {
  return metrics.every(
    (metric) =>
      metric.score >= 0 &&
      metric.score <= 1 &&
      metric.evidenceFingerprint.trim().length > 0,
  );
}

function missingMetric(
  criteria: AiQualityEvaluationCriterion[],
  metrics: AiQualityObservedMetric[],
): boolean {
  const metricsByDimension = metricByDimension(metrics);

  return criteria.some((criterion) => !metricsByDimension.has(criterion.dimension));
}

function failingBlockingCriterion(
  criteria: AiQualityEvaluationCriterion[],
  metrics: AiQualityObservedMetric[],
): AiQualityEvaluationCriterion | undefined {
  const metricsByDimension = metricByDimension(metrics);

  return criteria.find((criterion) => {
    const metric = metricsByDimension.get(criterion.dimension);

    return Boolean(
      metric &&
        metric.score < criterion.minScore &&
        criterion.severityOnFail === "blocking",
    );
  });
}

function weightedQualityScore(
  criteria: AiQualityEvaluationCriterion[],
  metrics: AiQualityObservedMetric[],
): number {
  const metricsByDimension = metricByDimension(metrics);
  const totalWeight = criteria.reduce((total, item) => total + item.weight, 0);

  if (totalWeight <= 0) {
    return 0;
  }

  const weightedScore = criteria.reduce((total, criterion) => {
    const metric = metricsByDimension.get(criterion.dimension);

    return total + (metric?.score ?? 0) * criterion.weight;
  }, 0);

  return weightedScore / totalWeight;
}

function costBudgetIsValid(input: AiQualityValidationInputContract): boolean {
  const budget = input.costBudget;

  return budget.enforcement === "foundation_validation_only" &&
    budget.requireCostEvidence === true &&
    budget.maxEstimatedCostMinorUnits >= 0 &&
    budget.maxEstimatedTokens > 0;
}

function costBudgetExceeded(input: AiQualityValidationInputContract): boolean {
  const budget = input.costBudget;
  const evidence = input.evidence.cost;

  return evidence.costLimitEnforced !== true ||
    evidence.billingConnected !== false ||
    evidence.currency !== budget.currency ||
    evidence.maxEstimatedCostMinorUnits !== budget.maxEstimatedCostMinorUnits ||
    evidence.maxEstimatedTokens !== budget.maxEstimatedTokens ||
    evidence.estimatedCostMinorUnits > budget.maxEstimatedCostMinorUnits ||
    evidence.estimatedTokens > budget.maxEstimatedTokens;
}

function safetyModelIsValid(input: AiQualityValidationInputContract): boolean {
  const safety = input.safety;

  return safety.allowChatMode === false &&
    safety.allowAnswerEngineMode === false &&
    safety.allowUnsafeAdvice === false &&
    safety.allowSensitivePersonalData === false &&
    safety.allowPromptInjection === false &&
    safety.allowRawPromptPersistence === false &&
    safety.allowModelCalls === false &&
    safety.requireDecisionSimulationInvariant === true &&
    safety.requireFailClosedPosture === true;
}

function safetyEvidenceIsValid(input: AiQualityValidationInputContract): boolean {
  const evidence = input.evidence.safety;

  return evidence.chatModeAllowed === false &&
    evidence.answerEngineModeAllowed === false &&
    evidence.unsafeAdviceAllowed === false &&
    evidence.sensitivePersonalDataAllowed === false &&
    evidence.promptInjectionAllowed === false &&
    evidence.rawPromptPersistenceAllowed === false &&
    evidence.modelCallExecuted === false &&
    evidence.decisionSimulationInvariantPreserved === true &&
    evidence.failClosedPosturePreserved === true;
}

function releaseGateIsValid(input: AiQualityValidationInputContract): boolean {
  const gate = input.releaseGate;

  return gate.scope === "decision_simulation_ai_quality_cost_safety" &&
    gate.minWeightedQualityScore >= 0 &&
    gate.minWeightedQualityScore <= 1 &&
    gate.blockOnAnyBlockingFailure === true &&
    gate.blockOnCostBudgetFailure === true &&
    gate.blockOnSafetyFailure === true;
}

export function evaluateAiQualityValidation(
  config: AiQualityContractsConfig,
  input: AiQualityValidationInputContract,
): AiQualityEvaluationResult {
  if (!config.enabled) {
    return blocked({
      code: "ai_quality_contracts_disabled",
      message: "AI quality/cost/safety contracts foundation is disabled by default.",
    });
  }

  if (!input.validationId) {
    return blocked({
      code: "validation_id_missing",
      message: "AI quality validation requires a validationId.",
    });
  }

  if (hasClientRuntimeFields(input)) {
    return blocked({
      code: "client_runtime_field_rejected",
      message: "Client-supplied runtime, prompt, provider, or key fields are rejected.",
    });
  }

  if (
    input.evaluation.scope !== "decision_simulation_ai_quality_cost_safety" ||
    input.releaseGate.scope !== "decision_simulation_ai_quality_cost_safety"
  ) {
    return blocked({
      code: "evaluation_scope_invalid",
      message: "AI quality validation scope must remain decision simulation scoped.",
    });
  }

  if (!isTimestampValid(input.evidence.evaluatedAt)) {
    return blocked({
      code: "timestamp_invalid",
      message: "AI quality validation evidence requires a valid evaluatedAt timestamp.",
    });
  }

  if (input.evaluation.criteria.length === 0) {
    return blocked({
      code: "criteria_missing",
      message: "AI quality validation requires at least one quality criterion.",
    });
  }

  if (!criteriaAreValid(input.evaluation.criteria)) {
    return blocked({
      code: "criteria_invalid",
      message: "AI quality criteria must use normalized thresholds and weights.",
    });
  }

  if (
    !input.evaluation.requireStructuredOutput ||
    !input.evaluation.requireDecisionSimulationFrame ||
    !input.evaluation.requireScenarioTradeoffRiskFrame
  ) {
    return blocked({
      code: "criteria_invalid",
      message: "AI quality evaluation must require structured decision simulation framing.",
    });
  }

  if (!metricsAreValid(input.evidence.quality)) {
    return blocked({
      code: "quality_score_invalid",
      message: "AI quality metrics must use normalized scores and evidence fingerprints.",
    });
  }

  if (missingMetric(input.evaluation.criteria, input.evidence.quality)) {
    return blocked({
      code: "quality_metric_missing",
      message: "AI quality evidence is missing a required criterion metric.",
    });
  }

  const dimensions = criteriaDimensions(input.evaluation.criteria);

  if (dimensions.size !== input.evaluation.criteria.length) {
    return blocked({
      code: "criteria_invalid",
      message: "AI quality criteria dimensions must be unique.",
    });
  }

  if (!costBudgetIsValid(input)) {
    return blocked({
      code: "cost_budget_invalid",
      message: "AI cost budget model is invalid.",
    });
  }

  if (costBudgetExceeded(input)) {
    return blocked({
      code: "cost_budget_exceeded",
      message: "AI cost evidence exceeds the configured budget.",
    });
  }

  if (!safetyModelIsValid(input)) {
    return blocked({
      code: "safety_model_invalid",
      message: "AI safety validation model violates Stage 5.3A scope.",
    });
  }

  if (!safetyEvidenceIsValid(input)) {
    return blocked({
      code: "safety_evidence_invalid",
      message: "AI safety evidence violates Stage 5.3A scope.",
    });
  }

  if (!releaseGateIsValid(input)) {
    return blocked({
      code: "release_gate_invalid",
      message: "AI quality release gate is invalid.",
    });
  }

  const blockingFailure = failingBlockingCriterion(
    input.evaluation.criteria,
    input.evidence.quality,
  );

  if (blockingFailure && input.releaseGate.blockOnAnyBlockingFailure) {
    return blocked({
      code: "quality_threshold_failed",
      message: "AI quality validation failed a blocking quality threshold.",
    });
  }

  const score = weightedQualityScore(
    input.evaluation.criteria,
    input.evidence.quality,
  );

  if (score < input.releaseGate.minWeightedQualityScore) {
    return blocked({
      code: "release_gate_blocked",
      message: "AI quality release gate blocked the validation result.",
    });
  }

  return {
    status: "allowed",
    execution: "contract_validation_only",
    version: AI_QUALITY_CONTRACTS_VERSION,
    releaseGateStatus: "approved_for_foundation_preflight",
    weightedQualityScore: score,
    evidence: aiQualityContractsSafetyEvidence(),
  };
}

export function createAiQualityContractsFoundation(
  config: AiQualityContractsConfig = DEFAULT_AI_QUALITY_CONTRACTS_CONFIG,
): AiQualityContractsFoundation {
  return {
    version: AI_QUALITY_CONTRACTS_VERSION,
    mode: AI_QUALITY_CONTRACTS_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    evaluateValidation: (input) => evaluateAiQualityValidation(config, input),
  };
}

function criteria(): AiQualityEvaluationCriterion[] {
  return [
    {
      dimension: "decision_simulation_fidelity",
      minScore: 0.8,
      weight: 0.3,
      severityOnFail: "blocking",
    },
    {
      dimension: "scenario_tradeoff_coverage",
      minScore: 0.75,
      weight: 0.25,
      severityOnFail: "blocking",
    },
    {
      dimension: "risk_consequence_coverage",
      minScore: 0.75,
      weight: 0.25,
      severityOnFail: "blocking",
    },
    {
      dimension: "uncertainty_calibration",
      minScore: 0.65,
      weight: 0.1,
      severityOnFail: "warning",
    },
    {
      dimension: "structured_output_integrity",
      minScore: 0.9,
      weight: 0.1,
      severityOnFail: "blocking",
    },
  ];
}

function metrics(
  overrides: Partial<Record<AiQualityEvaluationDimension, number>> = {},
): AiQualityObservedMetric[] {
  return criteria().map((criterion) => ({
    dimension: criterion.dimension,
    score: overrides[criterion.dimension] ?? 0.95,
    evidenceFingerprint: `${criterion.dimension}:foundation-evidence`,
  }));
}

function validationInput(
  overrides: Partial<AiQualityValidationInputContract> = {},
): AiQualityValidationInputContract {
  return {
    validationId: "stage_5_3a_validation",
    evaluation: {
      evaluationId: "stage_5_3a_evaluation",
      scope: "decision_simulation_ai_quality_cost_safety",
      criteria: criteria(),
      requireStructuredOutput: true,
      requireDecisionSimulationFrame: true,
      requireScenarioTradeoffRiskFrame: true,
    },
    costBudget: {
      currency: "USD",
      maxEstimatedCostMinorUnits: 0,
      maxEstimatedTokens: 1,
      requireCostEvidence: true,
      enforcement: "foundation_validation_only",
    },
    safety: {
      allowChatMode: false,
      allowAnswerEngineMode: false,
      allowUnsafeAdvice: false,
      allowSensitivePersonalData: false,
      allowPromptInjection: false,
      allowRawPromptPersistence: false,
      allowModelCalls: false,
      requireDecisionSimulationInvariant: true,
      requireFailClosedPosture: true,
    },
    releaseGate: DEFAULT_AI_QUALITY_RELEASE_GATE,
    evidence: {
      evidenceId: "stage_5_3a_evidence",
      evaluatedAt: now,
      source: "foundation_validation_catalog",
      quality: metrics(),
      cost: {
        currency: "USD",
        estimatedCostMinorUnits: 0,
        maxEstimatedCostMinorUnits: 0,
        estimatedTokens: 0,
        maxEstimatedTokens: 1,
        costLimitEnforced: true,
        billingConnected: false,
      },
      safety: {
        chatModeAllowed: false,
        answerEngineModeAllowed: false,
        unsafeAdviceAllowed: false,
        sensitivePersonalDataAllowed: false,
        promptInjectionAllowed: false,
        rawPromptPersistenceAllowed: false,
        modelCallExecuted: false,
        decisionSimulationInvariantPreserved: true,
        failClosedPosturePreserved: true,
      },
    },
    ...overrides,
  };
}

function enabledFoundation() {
  return createAiQualityContractsFoundation({
    enabled: true,
    defaultReleaseGate: DEFAULT_AI_QUALITY_RELEASE_GATE,
  });
}

function expectBlocked(code: AiQualityErrorCode) {
  return (result: AiQualityEvaluationResult): string | undefined =>
    result.status === "blocked" && result.error.code === code
      ? undefined
      : `Expected blocked result with error ${String(code)}.`;
}

function expectAllowed(
  result: AiQualityEvaluationResult,
): string | undefined {
  return result.status === "allowed" &&
    result.execution === "contract_validation_only" &&
    result.releaseGateStatus === "approved_for_foundation_preflight"
    ? undefined
    : "Expected allowed AI quality contract-validation-only result.";
}

function expectIsolation(
  result: AiQualityEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "5.3A" &&
    evidence.aiQualityOnly &&
    evidence.contractsOnly &&
    evidence.foundationOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.qualityEvaluationDefined &&
    evidence.costBudgetDefined &&
    evidence.safetyValidationDefined &&
    evidence.releaseGateDefined &&
    evidence.validationEvidenceDefined &&
    evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.apiKeysRead === false &&
    evidence.envVariablesRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.aiProviderRuntimeConnected === false &&
    evidence.promptContextRuntimeConnected === false &&
    evidence.databaseConnected === false &&
    evidence.supabaseConnected === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.subscriptionsRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false
    ? undefined
    : "AI quality/cost/safety isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_foundation_blocks",
      title: "Disabled AI quality foundation blocks",
      expectedBehavior: "Fail closed before quality validation is accepted.",
      run: () =>
        createAiQualityContractsFoundation().evaluateValidation(validationInput()),
      assertions: [expectBlocked("ai_quality_contracts_disabled"), expectIsolation],
    },
    {
      id: "missing_validation_id_blocks",
      title: "Missing validation ID blocks",
      expectedBehavior: "Require stable validation identity.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({ validationId: "" }),
        ),
      assertions: [expectBlocked("validation_id_missing"), expectIsolation],
    },
    {
      id: "client_runtime_fields_block",
      title: "Client runtime fields block",
      expectedBehavior: "Reject API keys, env names, raw prompts, provider payloads, and model-call payloads.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            clientRuntimeFields: {
              envVarName: "OPENAI_API_KEY",
            },
          }),
        ),
      assertions: [expectBlocked("client_runtime_field_rejected"), expectIsolation],
    },
    {
      id: "invalid_scope_blocks",
      title: "Invalid scope blocks",
      expectedBehavior: "Require decision simulation quality/cost/safety scope.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            evaluation: {
              ...validationInput().evaluation,
              scope: "invalid" as unknown as "decision_simulation_ai_quality_cost_safety",
            },
          }),
        ),
      assertions: [expectBlocked("evaluation_scope_invalid"), expectIsolation],
    },
    {
      id: "missing_criteria_blocks",
      title: "Missing criteria blocks",
      expectedBehavior: "Require quality evaluation criteria.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            evaluation: {
              ...validationInput().evaluation,
              criteria: [],
            },
          }),
        ),
      assertions: [expectBlocked("criteria_missing"), expectIsolation],
    },
    {
      id: "missing_metric_blocks",
      title: "Missing quality metric blocks",
      expectedBehavior: "Require evidence metric for every quality criterion.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            evidence: {
              ...validationInput().evidence,
              quality: metrics().slice(1),
            },
          }),
        ),
      assertions: [expectBlocked("quality_metric_missing"), expectIsolation],
    },
    {
      id: "invalid_quality_score_blocks",
      title: "Invalid quality score blocks",
      expectedBehavior: "Require normalized quality scores and evidence fingerprints.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            evidence: {
              ...validationInput().evidence,
              quality: metrics({ decision_simulation_fidelity: 1.5 }),
            },
          }),
        ),
      assertions: [expectBlocked("quality_score_invalid"), expectIsolation],
    },
    {
      id: "quality_threshold_blocks",
      title: "Quality threshold blocks",
      expectedBehavior: "Fail closed when a blocking quality criterion fails.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            evidence: {
              ...validationInput().evidence,
              quality: metrics({ decision_simulation_fidelity: 0.2 }),
            },
          }),
        ),
      assertions: [expectBlocked("quality_threshold_failed"), expectIsolation],
    },
    {
      id: "invalid_cost_budget_blocks",
      title: "Invalid cost budget blocks",
      expectedBehavior: "Require valid cost and token budgets.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            costBudget: {
              ...validationInput().costBudget,
              maxEstimatedTokens: -1,
            },
          }),
        ),
      assertions: [expectBlocked("cost_budget_invalid"), expectIsolation],
    },
    {
      id: "cost_budget_exceeded_blocks",
      title: "Cost budget exceeded blocks",
      expectedBehavior: "Fail closed when cost evidence exceeds budget.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            costBudget: {
              ...validationInput().costBudget,
              maxEstimatedCostMinorUnits: 10,
              maxEstimatedTokens: 10,
            },
            evidence: {
              ...validationInput().evidence,
              cost: {
                ...validationInput().evidence.cost,
                maxEstimatedCostMinorUnits: 10,
                maxEstimatedTokens: 10,
                estimatedCostMinorUnits: 11,
              },
            },
          }),
        ),
      assertions: [expectBlocked("cost_budget_exceeded"), expectIsolation],
    },
    {
      id: "unsafe_safety_model_blocks",
      title: "Unsafe safety model blocks",
      expectedBehavior: "Reject chat mode, answer-engine mode, unsafe advice, prompt injection, raw persistence, and model calls.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            safety: {
              ...validationInput().safety,
              allowModelCalls: true,
            } as unknown as AiQualityValidationInputContract["safety"],
          }),
        ),
      assertions: [expectBlocked("safety_model_invalid"), expectIsolation],
    },
    {
      id: "unsafe_safety_evidence_blocks",
      title: "Unsafe safety evidence blocks",
      expectedBehavior: "Reject evidence that reports model calls or invariant violations.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            evidence: {
              ...validationInput().evidence,
              safety: {
                ...validationInput().evidence.safety,
                modelCallExecuted: true,
              } as unknown as AiQualityValidationInputContract["evidence"]["safety"],
            },
          }),
        ),
      assertions: [expectBlocked("safety_evidence_invalid"), expectIsolation],
    },
    {
      id: "invalid_release_gate_blocks",
      title: "Invalid release gate blocks",
      expectedBehavior: "Require fail-closed release gate rules.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            releaseGate: {
              ...validationInput().releaseGate,
              blockOnSafetyFailure: false,
            } as unknown as AiQualityReleaseGateModel,
          }),
        ),
      assertions: [expectBlocked("release_gate_invalid"), expectIsolation],
    },
    {
      id: "release_gate_score_blocks",
      title: "Release gate score blocks",
      expectedBehavior: "Fail closed when weighted quality score misses the release gate.",
      run: () =>
        enabledFoundation().evaluateValidation(
          validationInput({
            releaseGate: {
              ...validationInput().releaseGate,
              minWeightedQualityScore: 0.99,
            },
          }),
        ),
      assertions: [expectBlocked("release_gate_blocked"), expectIsolation],
    },
    {
      id: "valid_validation_allows",
      title: "Valid quality/cost/safety validation allows",
      expectedBehavior: "Valid validation passes contract-only release gate preflight.",
      run: () => enabledFoundation().evaluateValidation(validationInput()),
      assertions: [expectAllowed, expectIsolation],
    },
  ];
}

function runCase(input: ValidationCase): AiQualityValidationCaseResult {
  const result = input.run();
  const issues = input.assertions
    .map((assertion) => assertion(result))
    .filter((issue): issue is string => Boolean(issue));

  return {
    caseId: input.id,
    title: input.title,
    expectedBehavior: input.expectedBehavior,
    actualStatus: result.status,
    passed: issues.length === 0,
    failed: issues.length > 0,
    issues,
  };
}

export function runAiQualityContractsValidation(): AiQualityValidationResult {
  const results = cases().map(runCase);
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
