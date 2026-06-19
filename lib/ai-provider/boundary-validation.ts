import { DEFAULT_AI_PROVIDER_DEFINITIONS } from "./validation";
import { createAiProviderAdapterRuntimeFoundation } from "./runtime";
import { createAiProviderAdapterBoundary } from "./boundary";
import type {
  AiProviderAdapterBoundaryBlockedReason,
  AiProviderAdapterBoundaryEvaluationResult,
  AiProviderAdapterBoundaryValidationCaseResult,
  AiProviderAdapterBoundaryValidationResult,
  AiProviderAdapterRequestContract,
  AiProviderAdapterRuntimeEvaluationInput,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => AiProviderAdapterBoundaryEvaluationResult;
  assertions: ((
    result: AiProviderAdapterBoundaryEvaluationResult,
  ) => string | undefined)[];
};

const now = "2026-06-19T12:00:00.000Z";

function request(
  overrides: Partial<AiProviderAdapterRequestContract> = {},
): AiProviderAdapterRequestContract {
  return {
    requestId: "stage_5_1c_request",
    providerId: "openai",
    capability: "decision_simulation_structured_reasoning",
    inputKind: "decision_simulation_context",
    inputFingerprint: "decision-context-fingerprint",
    requestedAt: now,
    constraints: {
      modelId: "future-openai-structured-model",
      maxInputTokens: 2000,
      maxOutputTokens: 500,
      temperature: 0.2,
    },
    safety: {
      requireStructuredOutput: true,
      allowTrainingUse: false,
      allowRawPromptPersistence: false,
      allowSensitivePersonalData: false,
      promptContextLayerConnected: false,
    },
    costBudget: {
      currency: "USD",
      maxEstimatedCostMinorUnits: 0,
      enforcement: "foundation_preflight_only",
    },
    latencyBudget: {
      maxLatencyMs: 5000,
      timeoutMs: 3000,
      enforcement: "foundation_preflight_only",
    },
    ...overrides,
  };
}

function runtimePayload(
  overrides: Partial<AiProviderAdapterRuntimeEvaluationInput> = {},
): AiProviderAdapterRuntimeEvaluationInput {
  return {
    request: request(),
    ...overrides,
  };
}

function runtimeEnabled() {
  return createAiProviderAdapterRuntimeFoundation({
    enabled: true,
    adapterConfig: {
      enabled: true,
      providers: DEFAULT_AI_PROVIDER_DEFINITIONS,
    },
    allowedProviders: ["openai", "local_contract_stub"],
    selectionStrategy: "requested_provider_first",
  });
}

function boundaryEnabled() {
  return createAiProviderAdapterBoundary({
    enabled: true,
    allowedOperations: ["ai_provider_runtime_preflight"],
    runtime: runtimeEnabled(),
  });
}

function expectBlocked(reason: AiProviderAdapterBoundaryBlockedReason) {
  return (
    result: AiProviderAdapterBoundaryEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked boundary result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: AiProviderAdapterBoundaryEvaluationResult,
): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only AI provider boundary result.";
}

function expectRuntimeResult(
  result: AiProviderAdapterBoundaryEvaluationResult,
): string | undefined {
  return result.runtimeResult &&
    result.runtimeResult.evidence.stage === "5.1B" &&
    result.runtimeResult.evidence.modelCallExecuted === false &&
    result.runtimeResult.evidence.openAiSdkConnected === false &&
    result.runtimeResult.evidence.apiKeysRead === false &&
    result.runtimeResult.evidence.envVariablesRead === false &&
    result.runtimeResult.evidence.apiRouteIntegrated === false &&
    result.runtimeResult.evidence.simulatorIntegrated === false &&
    result.runtimeResult.evidence.decisionEngineRuntimeConnected === false &&
    result.runtimeResult.evidence.promptContextLayerConnected === false &&
    result.runtimeResult.evidence.databaseConnected === false &&
    result.runtimeResult.evidence.supabaseConnected === false &&
    result.runtimeResult.evidence.authRuntimeConnected === false &&
    result.runtimeResult.evidence.persistenceRuntimeConnected === false &&
    result.runtimeResult.evidence.subscriptionsRuntimeConnected === false &&
    result.runtimeResult.evidence.uiIntegrated === false &&
    result.runtimeResult.evidence.dashboardIntegrated === false
    ? undefined
    : "Expected isolated Stage 5.1B runtime result.";
}

function expectIsolation(
  result: AiProviderAdapterBoundaryEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "5.1C" &&
    evidence.aiProviderOnly &&
    evidence.boundaryOnly &&
    evidence.facadeOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.allowedOperationsExplicit &&
    evidence.payloadIsolationEnforced &&
    evidence.runtimeIsolationEnforced &&
    evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.apiKeysRead === false &&
    evidence.envVariablesRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.promptContextLayerConnected === false &&
    evidence.databaseConnected === false &&
    evidence.supabaseConnected === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.subscriptionsRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.stage51DStarted === false &&
    evidence.stage52Started === false &&
    evidence.stage53Started === false
    ? undefined
    : "AI provider adapter boundary isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_boundary_blocks",
      title: "Disabled boundary blocks",
      expectedBehavior: "Boundary fails closed by default.",
      run: () =>
        createAiProviderAdapterBoundary().evaluate({
          operation: "ai_provider_runtime_preflight",
          runtime: runtimePayload(),
        }),
      assertions: [
        expectBlocked("ai_provider_boundary_disabled"),
        expectIsolation,
      ],
    },
    {
      id: "missing_operation_blocks",
      title: "Missing operation blocks",
      expectedBehavior: "Boundary requires explicit operation.",
      run: () =>
        boundaryEnabled().evaluate({
          runtime: runtimePayload(),
        }),
      assertions: [expectBlocked("operation_missing"), expectIsolation],
    },
    {
      id: "unsupported_operation_blocks",
      title: "Unsupported operation blocks",
      expectedBehavior: "Boundary rejects unknown operation names.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "model_call",
          runtime: runtimePayload(),
        }),
      assertions: [expectBlocked("operation_not_supported"), expectIsolation],
    },
    {
      id: "disallowed_operation_blocks",
      title: "Disallowed operation blocks",
      expectedBehavior: "Boundary rejects supported operations disabled by config.",
      run: () =>
        createAiProviderAdapterBoundary({
          enabled: true,
          allowedOperations: [],
          runtime: runtimeEnabled(),
        }).evaluate({
          operation: "ai_provider_runtime_preflight",
          runtime: runtimePayload(),
        }),
      assertions: [expectBlocked("operation_not_allowed"), expectIsolation],
    },
    {
      id: "missing_payload_blocks",
      title: "Missing payload blocks",
      expectedBehavior: "Boundary requires runtime payload.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "ai_provider_runtime_preflight",
        }),
      assertions: [expectBlocked("payload_missing"), expectIsolation],
    },
    {
      id: "payload_mismatch_blocks",
      title: "Payload mismatch blocks",
      expectedBehavior: "Boundary accepts exactly one payload.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "ai_provider_runtime_preflight",
          runtime: runtimePayload(),
          unexpectedPayload: {
            rawPrompt: "forbidden",
          },
        }),
      assertions: [expectBlocked("payload_mismatch"), expectIsolation],
    },
    {
      id: "runtime_block_propagates",
      title: "Runtime blocked result propagates",
      expectedBehavior: "Boundary preserves fail-closed runtime denial.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "ai_provider_runtime_preflight",
          runtime: runtimePayload({
            request: request({
              clientRuntimeFields: {
                apiKey: "forbidden",
              },
            }),
          }),
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectRuntimeResult,
        expectIsolation,
      ],
    },
    {
      id: "allowed_runtime_result_passes",
      title: "Allowed runtime result passes",
      expectedBehavior: "Boundary returns allowed preflight when runtime allows.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "ai_provider_runtime_preflight",
          runtime: runtimePayload(),
        }),
      assertions: [expectAllowed, expectRuntimeResult, expectIsolation],
    },
  ];
}

function runCase(
  input: ValidationCase,
): AiProviderAdapterBoundaryValidationCaseResult {
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

export function runAiProviderAdapterBoundaryValidation(): AiProviderAdapterBoundaryValidationResult {
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
