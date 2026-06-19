import {
  DEFAULT_AI_QUALITY_RELEASE_GATE,
  createAiQualityContractsFoundation,
} from "./validation";
import { createAiQualityRuntimeFoundation } from "./runtime";
import type {
  AiQualityContractsFoundation,
  AiQualityEvaluationDimension,
  AiQualityEvaluationResult,
  AiQualityObservedMetric,
  AiQualityRuntimeBlockedReason,
  AiQualityRuntimeEvaluationResult,
  AiQualityRuntimeValidationCaseResult,
  AiQualityRuntimeValidationResult,
  AiQualityValidationInputContract,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => AiQualityRuntimeEvaluationResult;
  assertions: ((
    result: AiQualityRuntimeEvaluationResult,
  ) => string | undefined)[];
};

const now = "2026-06-19T12:00:00.000Z";

function criteria() {
  return [
    {
      dimension: "decision_simulation_fidelity" as const,
      minScore: 0.8,
      weight: 0.3,
      severityOnFail: "blocking" as const,
    },
    {
      dimension: "scenario_tradeoff_coverage" as const,
      minScore: 0.75,
      weight: 0.25,
      severityOnFail: "blocking" as const,
    },
    {
      dimension: "risk_consequence_coverage" as const,
      minScore: 0.75,
      weight: 0.25,
      severityOnFail: "blocking" as const,
    },
    {
      dimension: "uncertainty_calibration" as const,
      minScore: 0.65,
      weight: 0.1,
      severityOnFail: "warning" as const,
    },
    {
      dimension: "structured_output_integrity" as const,
      minScore: 0.9,
      weight: 0.1,
      severityOnFail: "blocking" as const,
    },
  ];
}

function metrics(
  overrides: Partial<Record<AiQualityEvaluationDimension, number>> = {},
): AiQualityObservedMetric[] {
  return criteria().map((criterion) => ({
    dimension: criterion.dimension,
    score: overrides[criterion.dimension] ?? 0.95,
    evidenceFingerprint: `${criterion.dimension}:runtime-evidence`,
  }));
}

function validationInput(
  overrides: Partial<AiQualityValidationInputContract> = {},
): AiQualityValidationInputContract {
  return {
    validationId: "stage_5_3b_validation",
    evaluation: {
      evaluationId: "stage_5_3b_evaluation",
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
      evidenceId: "stage_5_3b_evidence",
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

function enabledContracts(): AiQualityContractsFoundation {
  return createAiQualityContractsFoundation({
    enabled: true,
    defaultReleaseGate: DEFAULT_AI_QUALITY_RELEASE_GATE,
  });
}

function enabledRuntime(
  overrides: Partial<{ contracts: AiQualityContractsFoundation }> = {},
) {
  return createAiQualityRuntimeFoundation({
    enabled: true,
    contracts: overrides.contracts ?? enabledContracts(),
    failClosedOnContractBlock: true,
  });
}

function customContracts(
  transform: (result: AiQualityEvaluationResult) => AiQualityEvaluationResult,
): AiQualityContractsFoundation {
  const foundation = enabledContracts();

  return {
    ...foundation,
    evaluateValidation: (input) =>
      transform(foundation.evaluateValidation(input)),
  };
}

function expectBlocked(reason: AiQualityRuntimeBlockedReason) {
  return (
    result: AiQualityRuntimeEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked runtime result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: AiQualityRuntimeEvaluationResult,
): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only AI quality runtime result.";
}

function expectContractResult(
  result: AiQualityRuntimeEvaluationResult,
): string | undefined {
  return result.contractResult &&
    result.contractResult.evidence.stage === "5.3A" &&
    result.contractResult.evidence.modelCallExecuted === false &&
    result.contractResult.evidence.openAiSdkConnected === false &&
    result.contractResult.evidence.apiKeysRead === false &&
    result.contractResult.evidence.envVariablesRead === false &&
    result.contractResult.evidence.apiRouteIntegrated === false &&
    result.contractResult.evidence.simulatorIntegrated === false &&
    result.contractResult.evidence.decisionEngineRuntimeConnected === false &&
    result.contractResult.evidence.aiProviderRuntimeConnected === false &&
    result.contractResult.evidence.promptContextRuntimeConnected === false &&
    result.contractResult.evidence.databaseConnected === false &&
    result.contractResult.evidence.supabaseConnected === false &&
    result.contractResult.evidence.authRuntimeConnected === false &&
    result.contractResult.evidence.persistenceRuntimeConnected === false &&
    result.contractResult.evidence.subscriptionsRuntimeConnected === false &&
    result.contractResult.evidence.uiIntegrated === false &&
    result.contractResult.evidence.dashboardIntegrated === false
    ? undefined
    : "Expected isolated Stage 5.3A contract result.";
}

function expectIsolation(
  result: AiQualityRuntimeEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "5.3B" &&
    evidence.aiQualityOnly &&
    evidence.runtimeFoundationOnly &&
    evidence.contractsFoundationUsed &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.qualityGateEvaluated &&
    evidence.costBudgetEvaluated &&
    evidence.safetyGateEvaluated &&
    evidence.releaseGateEvaluated &&
    evidence.severityAggregated &&
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
    evidence.dashboardIntegrated === false &&
    evidence.stage53CStarted === false
    ? undefined
    : "AI quality runtime isolation evidence changed.";
}

function expectSeverity(input: {
  blocking?: number;
  warning?: number;
  highestSeverity?: "none" | "info" | "warning" | "blocking";
}) {
  return (
    result: AiQualityRuntimeEvaluationResult,
  ): string | undefined =>
    (input.blocking == null ||
      result.severitySummary.blocking === input.blocking) &&
    (input.warning == null || result.severitySummary.warning === input.warning) &&
    (input.highestSeverity == null ||
      result.severitySummary.highestSeverity === input.highestSeverity)
      ? undefined
      : "Expected runtime severity aggregation to match.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Disabled AI quality runtime blocks",
      expectedBehavior: "Runtime foundation fails closed by default.",
      run: () =>
        createAiQualityRuntimeFoundation().evaluate({
          validation: validationInput(),
        }),
      assertions: [expectBlocked("ai_quality_runtime_disabled"), expectIsolation],
    },
    {
      id: "missing_validation_blocks",
      title: "Missing validation blocks",
      expectedBehavior: "Runtime requires validation input.",
      run: () =>
        enabledRuntime().evaluate({
          validation: null,
        }),
      assertions: [expectBlocked("validation_missing"), expectIsolation],
    },
    {
      id: "quality_gate_blocks",
      title: "Quality gate blocks",
      expectedBehavior:
        "Runtime preserves fail-closed quality threshold decisions.",
      run: () =>
        enabledRuntime().evaluate({
          validation: validationInput({
            evidence: {
              ...validationInput().evidence,
              quality: metrics({ decision_simulation_fidelity: 0.2 }),
            },
          }),
        }),
      assertions: [
        expectBlocked("quality_threshold_failed"),
        expectContractResult,
        expectSeverity({ blocking: 2, highestSeverity: "blocking" }),
        expectIsolation,
      ],
    },
    {
      id: "cost_budget_blocks",
      title: "Cost budget blocks",
      expectedBehavior: "Runtime preserves fail-closed cost budget decisions.",
      run: () =>
        enabledRuntime().evaluate({
          validation: validationInput({
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
                estimatedTokens: 11,
              },
            },
          }),
        }),
      assertions: [
        expectBlocked("cost_budget_exceeded"),
        expectContractResult,
        expectSeverity({ blocking: 2, highestSeverity: "blocking" }),
        expectIsolation,
      ],
    },
    {
      id: "safety_gate_blocks",
      title: "Safety gate blocks",
      expectedBehavior: "Runtime preserves fail-closed safety gate decisions.",
      run: () =>
        enabledRuntime().evaluate({
          validation: validationInput({
            evidence: {
              ...validationInput().evidence,
              safety: {
                ...validationInput().evidence.safety,
                modelCallExecuted: true,
              } as unknown as AiQualityValidationInputContract["evidence"]["safety"],
            },
          }),
        }),
      assertions: [
        expectBlocked("safety_evidence_invalid"),
        expectContractResult,
        expectSeverity({ blocking: 2, highestSeverity: "blocking" }),
        expectIsolation,
      ],
    },
    {
      id: "release_gate_blocks",
      title: "Release gate blocks",
      expectedBehavior:
        "Runtime preserves fail-closed release gate score decisions.",
      run: () =>
        enabledRuntime().evaluate({
          validation: validationInput({
            releaseGate: {
              ...validationInput().releaseGate,
              minWeightedQualityScore: 0.99,
            },
          }),
        }),
      assertions: [
        expectBlocked("release_gate_blocked"),
        expectContractResult,
        expectSeverity({ blocking: 1, highestSeverity: "blocking" }),
        expectIsolation,
      ],
    },
    {
      id: "warning_severity_allows",
      title: "Warning severity allows",
      expectedBehavior:
        "Runtime aggregates warning severity while allowing non-blocking validation.",
      run: () =>
        enabledRuntime().evaluate({
          validation: validationInput({
            evidence: {
              ...validationInput().evidence,
              quality: metrics({ uncertainty_calibration: 0.2 }),
            },
          }),
        }),
      assertions: [
        expectAllowed,
        expectContractResult,
        expectSeverity({ warning: 1, highestSeverity: "warning" }),
        expectIsolation,
      ],
    },
    {
      id: "allowed_runtime_passes",
      title: "Allowed runtime passes",
      expectedBehavior:
        "Runtime approves valid contract result through preflight only.",
      run: () =>
        enabledRuntime().evaluate({
          validation: validationInput(),
        }),
      assertions: [
        expectAllowed,
        expectContractResult,
        expectSeverity({ blocking: 0, warning: 0, highestSeverity: "none" }),
        expectIsolation,
      ],
    },
    {
      id: "contract_isolation_blocks",
      title: "Contract isolation blocks",
      expectedBehavior:
        "Runtime fails closed when contract evidence isolation is weakened.",
      run: () =>
        enabledRuntime({
          contracts: customContracts((result) => ({
            ...result,
            evidence: {
              ...result.evidence,
              openAiSdkConnected: true,
            } as unknown as typeof result.evidence,
          })),
        }).evaluate({
          validation: validationInput(),
        }),
      assertions: [
        expectBlocked("contracts_isolation_failed"),
        expectContractResult,
        expectIsolation,
      ],
    },
  ];
}

function runCase(
  input: ValidationCase,
): AiQualityRuntimeValidationCaseResult {
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

export function runAiQualityRuntimeValidation(): AiQualityRuntimeValidationResult {
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
