import {
  DEFAULT_AI_QUALITY_RELEASE_GATE,
  createAiQualityContractsFoundation,
} from "./validation";
import { createAiQualityRuntimeFoundation } from "./runtime";
import { createAiQualityBoundary } from "./boundary";
import type {
  AiQualityBoundaryBlockedReason,
  AiQualityBoundaryEvaluationResult,
  AiQualityBoundaryOperation,
  AiQualityBoundaryValidationCaseResult,
  AiQualityBoundaryValidationResult,
  AiQualityContractsFoundation,
  AiQualityEvaluationDimension,
  AiQualityObservedMetric,
  AiQualityRuntimeFoundation,
  AiQualityValidationInputContract,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => AiQualityBoundaryEvaluationResult;
  assertions: ((
    result: AiQualityBoundaryEvaluationResult,
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
    evidenceFingerprint: `${criterion.dimension}:boundary-evidence`,
  }));
}

function validationInput(
  overrides: Partial<AiQualityValidationInputContract> = {},
): AiQualityValidationInputContract {
  return {
    validationId: "stage_5_3c_validation",
    evaluation: {
      evaluationId: "stage_5_3c_evaluation",
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
      allowGenericAssistantMode: false,
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
      evidenceId: "stage_5_3c_evidence",
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
        genericAssistantModeAllowed: false,
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
  contracts: AiQualityContractsFoundation = enabledContracts(),
): AiQualityRuntimeFoundation {
  return createAiQualityRuntimeFoundation({
    enabled: true,
    contracts,
    failClosedOnContractBlock: true,
  });
}

function enabledBoundary(
  overrides: Partial<{
    allowedOperations: AiQualityBoundaryOperation[];
    runtime: AiQualityRuntimeFoundation;
  }> = {},
) {
  return createAiQualityBoundary({
    enabled: true,
    allowedOperations:
      overrides.allowedOperations ?? ["ai_quality_runtime_preflight"],
    runtime: overrides.runtime ?? enabledRuntime(),
  });
}

function runtimeWithIsolationDrift(): AiQualityRuntimeFoundation {
  const runtime = enabledRuntime();

  return {
    ...runtime,
    evaluate: (input) => {
      const result = runtime.evaluate(input);

      return {
        ...result,
        evidence: {
          ...result.evidence,
          openAiSdkConnected: true,
        } as unknown as typeof result.evidence,
      };
    },
  };
}

function expectBlocked(reason: AiQualityBoundaryBlockedReason) {
  return (
    result: AiQualityBoundaryEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" &&
    result.reason === reason &&
    result.error.code === reason &&
    result.error.recoverable === false
      ? undefined
      : `Expected blocked boundary result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: AiQualityBoundaryEvaluationResult,
): string | undefined {
  return result.status === "allowed" &&
    result.execution === "boundary_preflight_only" &&
    result.operation === "ai_quality_runtime_preflight"
    ? undefined
    : "Expected allowed boundary preflight-only result.";
}

function expectRuntimeResult(
  result: AiQualityBoundaryEvaluationResult,
): string | undefined {
  const runtimeResult = result.runtimeResult;

  return runtimeResult &&
    runtimeResult.evidence.stage === "5.3B" &&
    runtimeResult.evidence.aiQualityOnly &&
    runtimeResult.evidence.runtimeFoundationOnly &&
    runtimeResult.evidence.contractsFoundationUsed &&
    runtimeResult.evidence.deterministicOnly &&
    runtimeResult.evidence.failClosedByDefault &&
    runtimeResult.evidence.qualityGateEvaluated &&
    runtimeResult.evidence.costBudgetEvaluated &&
    runtimeResult.evidence.safetyGateEvaluated &&
    runtimeResult.evidence.releaseGateEvaluated &&
    runtimeResult.evidence.severityAggregated &&
    runtimeResult.evidence.genericAssistantBehaviorAllowed === false &&
    runtimeResult.evidence.modelCallExecuted === false &&
    runtimeResult.evidence.openAiSdkConnected === false &&
    runtimeResult.evidence.apiKeysRead === false &&
    runtimeResult.evidence.envVariablesRead === false &&
    runtimeResult.evidence.apiRouteIntegrated === false &&
    runtimeResult.evidence.simulatorIntegrated === false &&
    runtimeResult.evidence.decisionEngineRuntimeConnected === false &&
    runtimeResult.evidence.aiProviderRuntimeConnected === false &&
    runtimeResult.evidence.promptContextRuntimeConnected === false &&
    runtimeResult.evidence.databaseConnected === false &&
    runtimeResult.evidence.supabaseConnected === false &&
    runtimeResult.evidence.authRuntimeConnected === false &&
    runtimeResult.evidence.persistenceRuntimeConnected === false &&
    runtimeResult.evidence.subscriptionsRuntimeConnected === false &&
    runtimeResult.evidence.uiIntegrated === false &&
    runtimeResult.evidence.dashboardIntegrated === false &&
    runtimeResult.evidence.stage53CStarted === false
    ? undefined
    : "Expected isolated Stage 5.3B runtime result.";
}

function expectBoundaryIsolation(
  result: AiQualityBoundaryEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "5.3C" &&
    evidence.aiQualityOnly &&
    evidence.boundaryOnly &&
    evidence.facadeOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.allowedOperationsExplicit &&
    evidence.payloadIsolationEnforced &&
    evidence.runtimeIsolationEnforced &&
    evidence.genericAssistantBehaviorAllowed === false &&
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
    evidence.stage53DStarted === false
    ? undefined
    : "AI quality boundary isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_boundary_blocks",
      title: "Disabled boundary blocks",
      expectedBehavior: "Boundary facade fails closed by default.",
      run: () =>
        createAiQualityBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
        }),
      assertions: [
        expectBlocked("ai_quality_boundary_disabled"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "missing_operation_blocks",
      title: "Missing operation blocks",
      expectedBehavior: "Boundary requires an explicit allowed operation.",
      run: () =>
        enabledBoundary().evaluate({
          runtime: { validation: validationInput() },
        }),
      assertions: [expectBlocked("operation_missing"), expectBoundaryIsolation],
    },
    {
      id: "unsupported_operation_blocks",
      title: "Unsupported operation blocks",
      expectedBehavior:
        "Boundary rejects operations outside the AI quality operation model.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "model_call",
          runtime: { validation: validationInput() },
        }),
      assertions: [
        expectBlocked("operation_not_supported"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "disallowed_operation_blocks",
      title: "Disallowed operation blocks",
      expectedBehavior:
        "Boundary rejects supported operations not present in config allowlist.",
      run: () =>
        enabledBoundary({
          allowedOperations: [],
        }).evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
        }),
      assertions: [expectBlocked("operation_not_allowed"), expectBoundaryIsolation],
    },
    {
      id: "missing_payload_blocks",
      title: "Missing payload blocks",
      expectedBehavior: "Boundary requires runtime payload for preflight.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
        }),
      assertions: [expectBlocked("payload_missing"), expectBoundaryIsolation],
    },
    {
      id: "payload_mismatch_blocks",
      title: "Payload mismatch blocks",
      expectedBehavior:
        "Boundary rejects mixed or unexpected payload shapes before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          unexpectedPayload: { providerPayload: "forbidden" },
      }),
      assertions: [expectBlocked("payload_mismatch"), expectBoundaryIsolation],
    },
    {
      id: "boundary_env_field_blocks",
      title: "Boundary env field blocks",
      expectedBehavior: "Boundary rejects client-provided env fields before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          clientRuntimeFields: {
            envVarName: "OPENAI_API_KEY",
          },
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "boundary_api_key_field_blocks",
      title: "Boundary API key field blocks",
      expectedBehavior: "Boundary rejects client-provided API key fields before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          apiKey: "forbidden",
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "boundary_provider_payload_blocks",
      title: "Boundary provider payload blocks",
      expectedBehavior: "Boundary rejects provider payload fields before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          providerPayload: "forbidden",
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "boundary_chat_mode_blocks",
      title: "Boundary chat mode blocks",
      expectedBehavior: "Boundary rejects chat mode fields before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          chatMode: true,
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "boundary_answer_engine_mode_blocks",
      title: "Boundary answer engine mode blocks",
      expectedBehavior: "Boundary rejects answer engine mode fields before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          answerEngineMode: true,
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "boundary_generic_assistant_mode_blocks",
      title: "Boundary generic assistant mode blocks",
      expectedBehavior: "Boundary rejects generic assistant mode fields before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          genericAssistantMode: true,
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "boundary_model_call_payload_blocks",
      title: "Boundary model-call payload blocks",
      expectedBehavior: "Boundary rejects model-call payload fields before runtime.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
          modelCallPayload: "forbidden",
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "runtime_block_propagates",
      title: "Runtime block propagates",
      expectedBehavior:
        "Boundary preserves fail-closed runtime decisions and does not execute fallback paths.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: {
            validation: validationInput({
              clientRuntimeFields: {
                apiKey: "forbidden",
              },
            }),
          },
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectRuntimeResult,
        expectBoundaryIsolation,
      ],
    },
    {
      id: "runtime_isolation_blocks",
      title: "Runtime isolation blocks",
      expectedBehavior:
        "Boundary fails closed when runtime evidence isolation is weakened.",
      run: () =>
        enabledBoundary({
          runtime: runtimeWithIsolationDrift(),
        }).evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
        }),
      assertions: [
        expectBlocked("runtime_isolation_failed"),
        expectBoundaryIsolation,
      ],
    },
    {
      id: "allowed_boundary_passes",
      title: "Allowed boundary passes",
      expectedBehavior:
        "Boundary allows valid AI quality runtime preflight without model calls.",
      run: () =>
        enabledBoundary().evaluate({
          operation: "ai_quality_runtime_preflight",
          runtime: { validation: validationInput() },
        }),
      assertions: [expectAllowed, expectRuntimeResult, expectBoundaryIsolation],
    },
  ];
}

function runCase(
  input: ValidationCase,
): AiQualityBoundaryValidationCaseResult {
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

export function runAiQualityBoundaryValidation(): AiQualityBoundaryValidationResult {
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
