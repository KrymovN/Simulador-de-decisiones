import {
  DEFAULT_AI_PROVIDER_DEFINITIONS,
} from "./validation";
import { createAiProviderAdapterRuntimeFoundation } from "./runtime";
import type {
  AiProviderAdapterRequestContract,
  AiProviderAdapterRuntimeBlockedReason,
  AiProviderAdapterRuntimeEvaluationResult,
  AiProviderAdapterRuntimeValidationCaseResult,
  AiProviderAdapterRuntimeValidationResult,
  AiProviderId,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => AiProviderAdapterRuntimeEvaluationResult;
  assertions: ((
    result: AiProviderAdapterRuntimeEvaluationResult,
  ) => string | undefined)[];
};

const now = "2026-06-19T12:00:00.000Z";

function request(
  overrides: Partial<AiProviderAdapterRequestContract> = {},
): AiProviderAdapterRequestContract {
  return {
    requestId: "stage_5_1b_request",
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

function enabledRuntime(input: {
  allowedProviders?: AiProviderId[];
  selectionStrategy?: "requested_provider_first" | "first_capable_provider";
  providers?: typeof DEFAULT_AI_PROVIDER_DEFINITIONS;
} = {}) {
  return createAiProviderAdapterRuntimeFoundation({
    enabled: true,
    adapterConfig: {
      enabled: true,
      providers: input.providers ?? DEFAULT_AI_PROVIDER_DEFINITIONS,
    },
    allowedProviders: input.allowedProviders ?? ["openai", "local_contract_stub"],
    selectionStrategy: input.selectionStrategy ?? "requested_provider_first",
  });
}

function expectBlocked(reason: AiProviderAdapterRuntimeBlockedReason) {
  return (
    result: AiProviderAdapterRuntimeEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked runtime result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: AiProviderAdapterRuntimeEvaluationResult,
): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only runtime result.";
}

function expectSelectedProvider(providerId: AiProviderId) {
  return (
    result: AiProviderAdapterRuntimeEvaluationResult,
  ): string | undefined =>
    result.selection?.providerId === providerId
      ? undefined
      : `Expected selected provider ${providerId}.`;
}

function expectContractResult(
  result: AiProviderAdapterRuntimeEvaluationResult,
): string | undefined {
  return result.contractResult &&
    result.contractResult.evidence.stage === "5.1A" &&
    result.contractResult.evidence.modelCallExecuted === false &&
    result.contractResult.evidence.openAiSdkConnected === false &&
    result.contractResult.evidence.apiKeysRead === false &&
    result.contractResult.evidence.envVariablesRead === false &&
    result.contractResult.evidence.apiRouteIntegrated === false &&
    result.contractResult.evidence.simulatorIntegrated === false &&
    result.contractResult.evidence.decisionEngineRuntimeConnected === false &&
    result.contractResult.evidence.promptContextLayerConnected === false &&
    result.contractResult.evidence.databaseConnected === false &&
    result.contractResult.evidence.supabaseConnected === false &&
    result.contractResult.evidence.authRuntimeConnected === false &&
    result.contractResult.evidence.persistenceRuntimeConnected === false &&
    result.contractResult.evidence.subscriptionsRuntimeConnected === false &&
    result.contractResult.evidence.uiIntegrated === false &&
    result.contractResult.evidence.dashboardIntegrated === false
    ? undefined
    : "Expected isolated Stage 5.1A contract result.";
}

function expectIsolation(
  result: AiProviderAdapterRuntimeEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "5.1B" &&
    evidence.aiProviderOnly &&
    evidence.runtimeFoundationOnly &&
    evidence.contractsFoundationUsed &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
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
    evidence.stage51CStarted === false &&
    evidence.stage52Started === false &&
    evidence.stage53Started === false
    ? undefined
    : "AI provider adapter runtime isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_runtime_blocks",
      title: "Disabled runtime blocks",
      expectedBehavior: "Runtime foundation fails closed by default.",
      run: () =>
        createAiProviderAdapterRuntimeFoundation().evaluate({
          request: request(),
        }),
      assertions: [expectBlocked("ai_provider_runtime_disabled"), expectIsolation],
    },
    {
      id: "missing_request_blocks",
      title: "Missing request blocks",
      expectedBehavior: "Runtime requires a provider adapter request contract.",
      run: () =>
        enabledRuntime().evaluate({
          request: null,
        }),
      assertions: [expectBlocked("request_missing"), expectIsolation],
    },
    {
      id: "provider_not_allowed_blocks",
      title: "Provider not allowed blocks",
      expectedBehavior: "Runtime rejects providers outside the allowed list.",
      run: () =>
        enabledRuntime({ allowedProviders: ["local_contract_stub"] }).evaluate({
          request: request(),
        }),
      assertions: [expectBlocked("provider_not_allowed"), expectIsolation],
    },
    {
      id: "provider_selection_failed_blocks",
      title: "Provider selection failure blocks",
      expectedBehavior:
        "Runtime fails closed when no allowed provider can satisfy the request.",
      run: () =>
        enabledRuntime({ allowedProviders: ["anthropic"], providers: [] }).evaluate({
          request: request({ providerId: "anthropic" }),
        }),
      assertions: [expectBlocked("provider_selection_failed"), expectIsolation],
    },
    {
      id: "requested_provider_selected",
      title: "Requested provider selected",
      expectedBehavior: "Requested provider is selected when it is allowed and capable.",
      run: () =>
        enabledRuntime().evaluate({
          request: request(),
        }),
      assertions: [
        expectAllowed,
        expectSelectedProvider("openai"),
        expectContractResult,
        expectIsolation,
      ],
    },
    {
      id: "first_capable_provider_selected",
      title: "First capable provider selected",
      expectedBehavior:
        "Runtime can select the first capable provider from preference order.",
      run: () =>
        enabledRuntime({ selectionStrategy: "first_capable_provider" }).evaluate({
          request: request(),
          providerPreference: ["local_contract_stub", "openai"],
        }),
      assertions: [
        expectAllowed,
        expectSelectedProvider("local_contract_stub"),
        expectContractResult,
        expectIsolation,
      ],
    },
    {
      id: "contract_error_maps_token_limit",
      title: "Contract token-limit error maps",
      expectedBehavior:
        "Runtime maps contract token-limit denial into fail-closed runtime decision.",
      run: () =>
        enabledRuntime().evaluate({
          request: request({
            constraints: {
              ...request().constraints,
              maxInputTokens: 50000,
            },
          }),
        }),
      assertions: [
        expectBlocked("token_limit_invalid"),
        expectContractResult,
        expectIsolation,
      ],
    },
    {
      id: "cost_guard_blocks",
      title: "Cost guard blocks",
      expectedBehavior: "Runtime preserves fail-closed cost guard evaluation.",
      run: () =>
        enabledRuntime().evaluate({
          request: request({
            costBudget: {
              currency: "USD",
              maxEstimatedCostMinorUnits: -1,
              enforcement: "foundation_preflight_only",
            },
          }),
        }),
      assertions: [
        expectBlocked("cost_budget_invalid"),
        expectContractResult,
        expectIsolation,
      ],
    },
    {
      id: "latency_guard_blocks",
      title: "Latency guard blocks",
      expectedBehavior: "Runtime preserves fail-closed latency guard evaluation.",
      run: () =>
        enabledRuntime().evaluate({
          request: request({
            latencyBudget: {
              maxLatencyMs: 1000,
              timeoutMs: 2000,
              enforcement: "foundation_preflight_only",
            },
          }),
        }),
      assertions: [
        expectBlocked("latency_budget_invalid"),
        expectContractResult,
        expectIsolation,
      ],
    },
    {
      id: "client_runtime_fields_block",
      title: "Client runtime fields block",
      expectedBehavior: "Runtime rejects API keys, env names, raw prompts, or secrets.",
      run: () =>
        enabledRuntime().evaluate({
          request: request({
            clientRuntimeFields: {
              envVarName: "OPENAI_API_KEY",
            },
          }),
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectContractResult,
        expectIsolation,
      ],
    },
  ];
}

function runCase(
  input: ValidationCase,
): AiProviderAdapterRuntimeValidationCaseResult {
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

export function runAiProviderAdapterRuntimeValidation(): AiProviderAdapterRuntimeValidationResult {
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
