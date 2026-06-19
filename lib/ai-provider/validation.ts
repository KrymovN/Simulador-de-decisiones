import {
  AI_PROVIDER_ADAPTER_CONTRACTS_MODE,
  AI_PROVIDER_ADAPTER_CONTRACTS_VERSION,
  type AiProviderAdapterConfig,
  type AiProviderAdapterContractsFoundation,
  type AiProviderAdapterError,
  type AiProviderAdapterErrorCode,
  type AiProviderAdapterEvaluationResult,
  type AiProviderAdapterRequestContract,
  type AiProviderAdapterResponseContract,
  type AiProviderAdapterSafetyEvidence,
  type AiProviderAdapterValidationCaseResult,
  type AiProviderAdapterValidationResult,
  type AiProviderCapability,
  type AiProviderDefinition,
} from "./contracts";

export const DEFAULT_AI_PROVIDER_DEFINITIONS: AiProviderDefinition[] = [
  {
    providerId: "openai",
    kind: "external_model_provider",
    status: "available",
    supportedCapabilities: [
      "decision_simulation_structured_reasoning",
      "scenario_expansion",
      "risk_tradeoff_analysis",
      "clarification_signal_generation",
      "decision_summary_generation",
    ],
    models: [
      {
        modelId: "future-openai-structured-model",
        capabilities: [
          "decision_simulation_structured_reasoning",
          "scenario_expansion",
          "risk_tradeoff_analysis",
          "clarification_signal_generation",
          "decision_summary_generation",
        ],
        maxInputTokens: 12000,
        maxOutputTokens: 2000,
        supportsStructuredOutput: true,
        status: "available",
      },
    ],
  },
  {
    providerId: "local_contract_stub",
    kind: "local_contract_stub",
    status: "available",
    supportedCapabilities: ["decision_simulation_structured_reasoning"],
    models: [
      {
        modelId: "local-contract-stub",
        capabilities: ["decision_simulation_structured_reasoning"],
        maxInputTokens: 2000,
        maxOutputTokens: 500,
        supportsStructuredOutput: true,
        status: "available",
      },
    ],
  },
];

export const DEFAULT_AI_PROVIDER_ADAPTER_CONFIG: AiProviderAdapterConfig = {
  enabled: false,
  providers: DEFAULT_AI_PROVIDER_DEFINITIONS,
};

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => AiProviderAdapterEvaluationResult;
  assertions: ((
    result: AiProviderAdapterEvaluationResult,
  ) => string | undefined)[];
};

const now = "2026-06-19T12:00:00.000Z";

export function aiProviderAdapterSafetyEvidence(): AiProviderAdapterSafetyEvidence {
  return {
    stage: "5.1A",
    aiProviderOnly: true,
    contractsOnly: true,
    foundationOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    modelCallExecuted: false,
    openAiSdkConnected: false,
    apiKeysRead: false,
    envVariablesRead: false,
    apiRouteIntegrated: false,
    simulatorIntegrated: false,
    decisionEngineRuntimeConnected: false,
    promptContextLayerConnected: false,
    databaseConnected: false,
    supabaseConnected: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    subscriptionsRuntimeConnected: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    stage51BStarted: false,
    stage52Started: false,
    stage53Started: false,
    rollback: "disable_ai_provider_adapter_contracts_or_remove_ai_provider_exports",
  };
}

function error(
  code: AiProviderAdapterErrorCode,
  message: string,
): AiProviderAdapterError {
  return {
    code,
    message,
    recoverable: false,
  };
}

function blocked(input: {
  request: AiProviderAdapterRequestContract;
  code: AiProviderAdapterErrorCode;
  message: string;
}): AiProviderAdapterEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_PROVIDER_ADAPTER_CONTRACTS_VERSION,
    providerId: input.request.providerId,
    modelId: input.request.constraints.modelId,
    capability: input.request.capability,
    error: error(input.code, input.message),
    evidence: aiProviderAdapterSafetyEvidence(),
  };
}

function isTimestampValid(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function hasClientRuntimeFields(request: AiProviderAdapterRequestContract): boolean {
  const fields = request.clientRuntimeFields;

  if (!fields) {
    return false;
  }

  return Boolean(
    fields.apiKey ||
      fields.envVarName ||
      fields.rawPrompt ||
      fields.providerSecret,
  );
}

function findProvider(
  config: AiProviderAdapterConfig,
  request: AiProviderAdapterRequestContract,
) {
  return config.providers.find(
    (provider) => provider.providerId === request.providerId,
  );
}

function buildResponseContract(
  request: AiProviderAdapterRequestContract,
): AiProviderAdapterResponseContract {
  return {
    responseId: `${request.requestId}:contract`,
    requestId: request.requestId,
    providerId: request.providerId,
    capability: request.capability,
    outputKind: "structured_adapter_payload",
    status: "contract_validated",
    outputFingerprint: `${request.inputFingerprint}:validated`,
    safetyEvidence: {
      structuredOutputRequired: true,
      trainingUseAllowed: false,
      rawPromptPersistenceAllowed: false,
      sensitivePersonalDataAllowed: false,
      promptContextLayerConnected: false,
      unsafeInputBlocked: false,
    },
    costEvidence: {
      currency: request.costBudget.currency,
      estimatedCostMinorUnits: 0,
      maxEstimatedCostMinorUnits: request.costBudget.maxEstimatedCostMinorUnits,
      costLimitEnforced: true,
      billingConnected: false,
    },
    latencyEvidence: {
      maxLatencyMs: request.latencyBudget.maxLatencyMs,
      timeoutMs: request.latencyBudget.timeoutMs,
      latencyLimitEnforced: true,
      networkCallExecuted: false,
    },
  };
}

export function evaluateAiProviderAdapterRequest(
  config: AiProviderAdapterConfig,
  request: AiProviderAdapterRequestContract,
): AiProviderAdapterEvaluationResult {
  if (!config.enabled) {
    return blocked({
      request,
      code: "ai_provider_adapter_disabled",
      message: "AI provider adapter contracts foundation is disabled by default.",
    });
  }

  if (hasClientRuntimeFields(request)) {
    return blocked({
      request,
      code: "client_runtime_field_rejected",
      message: "Client-supplied provider runtime fields are rejected.",
    });
  }

  if (!request.inputFingerprint) {
    return blocked({
      request,
      code: "input_fingerprint_missing",
      message: "AI provider adapter request requires an input fingerprint.",
    });
  }

  if (!isTimestampValid(request.requestedAt)) {
    return blocked({
      request,
      code: "timestamp_invalid",
      message: "AI provider adapter request requires a valid requestedAt timestamp.",
    });
  }

  const provider = findProvider(config, request);

  if (!provider) {
    return blocked({
      request,
      code: "provider_not_supported",
      message: "AI provider is not supported by this foundation config.",
    });
  }

  if (provider.status !== "available") {
    return blocked({
      request,
      code: "provider_disabled",
      message: "AI provider is disabled or unsupported.",
    });
  }

  if (!provider.supportedCapabilities.includes(request.capability)) {
    return blocked({
      request,
      code: "capability_not_supported",
      message: "AI provider does not support the requested capability.",
    });
  }

  const model = provider.models.find(
    (candidate) => candidate.modelId === request.constraints.modelId,
  );

  if (!model) {
    return blocked({
      request,
      code: "model_not_supported",
      message: "AI provider model is not supported.",
    });
  }

  if (model.status !== "available") {
    return blocked({
      request,
      code: "model_disabled",
      message: "AI provider model is disabled or unsupported.",
    });
  }

  if (!model.capabilities.includes(request.capability)) {
    return blocked({
      request,
      code: "capability_not_supported",
      message: "AI provider model does not support the requested capability.",
    });
  }

  if (!model.supportsStructuredOutput || !request.safety.requireStructuredOutput) {
    return blocked({
      request,
      code: "structured_output_not_supported",
      message: "AI provider adapter requires structured output support.",
    });
  }

  if (
    request.constraints.maxInputTokens <= 0 ||
    request.constraints.maxOutputTokens <= 0 ||
    request.constraints.maxInputTokens > model.maxInputTokens ||
    request.constraints.maxOutputTokens > model.maxOutputTokens
  ) {
    return blocked({
      request,
      code: "token_limit_invalid",
      message: "AI provider adapter token constraints are invalid.",
    });
  }

  if (request.constraints.temperature < 0 || request.constraints.temperature > 1) {
    return blocked({
      request,
      code: "temperature_out_of_range",
      message: "AI provider adapter temperature must stay between 0 and 1.",
    });
  }

  if (request.costBudget.maxEstimatedCostMinorUnits < 0) {
    return blocked({
      request,
      code: "cost_budget_invalid",
      message: "AI provider adapter cost budget must be non-negative.",
    });
  }

  if (
    request.latencyBudget.maxLatencyMs <= 0 ||
    request.latencyBudget.timeoutMs <= 0 ||
    request.latencyBudget.timeoutMs > request.latencyBudget.maxLatencyMs
  ) {
    return blocked({
      request,
      code: "latency_budget_invalid",
      message: "AI provider adapter latency budget is invalid.",
    });
  }

  if (
    request.safety.allowTrainingUse ||
    request.safety.allowRawPromptPersistence ||
    request.safety.allowSensitivePersonalData ||
    request.safety.promptContextLayerConnected
  ) {
    return blocked({
      request,
      code: "safety_requirements_invalid",
      message: "AI provider adapter safety requirements violate Stage 5.1A scope.",
    });
  }

  return {
    status: "allowed",
    execution: "contract_validation_only",
    version: AI_PROVIDER_ADAPTER_CONTRACTS_VERSION,
    providerId: request.providerId,
    modelId: request.constraints.modelId,
    capability: request.capability,
    responseContract: buildResponseContract(request),
    evidence: aiProviderAdapterSafetyEvidence(),
  };
}

export function createAiProviderAdapterContractsFoundation(
  config: AiProviderAdapterConfig = DEFAULT_AI_PROVIDER_ADAPTER_CONFIG,
): AiProviderAdapterContractsFoundation {
  return {
    version: AI_PROVIDER_ADAPTER_CONTRACTS_VERSION,
    mode: AI_PROVIDER_ADAPTER_CONTRACTS_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    providers: config.providers,
    evaluateRequest: (request) => evaluateAiProviderAdapterRequest(config, request),
  };
}

function request(
  overrides: Partial<AiProviderAdapterRequestContract> = {},
): AiProviderAdapterRequestContract {
  return {
    requestId: "stage_5_1a_request",
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

function enabledFoundation() {
  return createAiProviderAdapterContractsFoundation({
    enabled: true,
    providers: DEFAULT_AI_PROVIDER_DEFINITIONS,
  });
}

function expectBlocked(code: AiProviderAdapterErrorCode) {
  return (result: AiProviderAdapterEvaluationResult): string | undefined =>
    result.status === "blocked" && result.error.code === code
      ? undefined
      : `Expected blocked result with error ${String(code)}.`;
}

function expectAllowed(
  result: AiProviderAdapterEvaluationResult,
): string | undefined {
  return result.status === "allowed" &&
    result.execution === "contract_validation_only"
    ? undefined
    : "Expected allowed contract-validation-only result.";
}

function expectIsolation(
  result: AiProviderAdapterEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "5.1A" &&
    evidence.aiProviderOnly &&
    evidence.contractsOnly &&
    evidence.foundationOnly &&
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
    evidence.stage51BStarted === false &&
    evidence.stage52Started === false &&
    evidence.stage53Started === false
    ? undefined
    : "AI provider adapter isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_foundation_blocks",
      title: "Disabled AI provider adapter blocks",
      expectedBehavior: "Fail closed before any provider request is accepted.",
      run: () =>
        createAiProviderAdapterContractsFoundation().evaluateRequest(request()),
      assertions: [expectBlocked("ai_provider_adapter_disabled"), expectIsolation],
    },
    {
      id: "client_runtime_fields_block",
      title: "Client runtime fields block",
      expectedBehavior: "Reject API keys, env names, raw prompts, or secrets.",
      run: () =>
        enabledFoundation().evaluateRequest(
          request({
            clientRuntimeFields: {
              apiKey: "forbidden",
            },
          }),
        ),
      assertions: [expectBlocked("client_runtime_field_rejected"), expectIsolation],
    },
    {
      id: "missing_input_fingerprint_blocks",
      title: "Missing input fingerprint blocks",
      expectedBehavior: "Require opaque input fingerprints instead of raw prompts.",
      run: () => enabledFoundation().evaluateRequest(request({ inputFingerprint: "" })),
      assertions: [expectBlocked("input_fingerprint_missing"), expectIsolation],
    },
    {
      id: "unsupported_provider_blocks",
      title: "Unsupported provider blocks",
      expectedBehavior: "Fail closed when provider is not in config.",
      run: () =>
        createAiProviderAdapterContractsFoundation({
          enabled: true,
          providers: [],
        }).evaluateRequest(request()),
      assertions: [expectBlocked("provider_not_supported"), expectIsolation],
    },
    {
      id: "unsupported_model_blocks",
      title: "Unsupported model blocks",
      expectedBehavior: "Fail closed when model is not supported by provider.",
      run: () =>
        enabledFoundation().evaluateRequest(
          request({
            constraints: {
              ...request().constraints,
              modelId: "unknown-model",
            },
          }),
        ),
      assertions: [expectBlocked("model_not_supported"), expectIsolation],
    },
    {
      id: "unsupported_capability_blocks",
      title: "Unsupported capability blocks",
      expectedBehavior: "Fail closed when provider lacks requested capability.",
      run: () =>
        enabledFoundation().evaluateRequest(
          request({
            providerId: "local_contract_stub",
            constraints: {
              ...request().constraints,
              modelId: "local-contract-stub",
            },
            capability: "risk_tradeoff_analysis",
          }),
        ),
      assertions: [expectBlocked("capability_not_supported"), expectIsolation],
    },
    {
      id: "token_limit_blocks",
      title: "Invalid token limits block",
      expectedBehavior: "Fail closed for token limits outside model policy.",
      run: () =>
        enabledFoundation().evaluateRequest(
          request({
            constraints: {
              ...request().constraints,
              maxInputTokens: 50000,
            },
          }),
        ),
      assertions: [expectBlocked("token_limit_invalid"), expectIsolation],
    },
    {
      id: "temperature_blocks",
      title: "Temperature outside deterministic range blocks",
      expectedBehavior: "Fail closed for temperature outside 0 to 1.",
      run: () =>
        enabledFoundation().evaluateRequest(
          request({
            constraints: {
              ...request().constraints,
              temperature: 1.5,
            },
          }),
        ),
      assertions: [expectBlocked("temperature_out_of_range"), expectIsolation],
    },
    {
      id: "cost_budget_blocks",
      title: "Invalid cost budget blocks",
      expectedBehavior: "Fail closed for invalid cost budget.",
      run: () =>
        enabledFoundation().evaluateRequest(
          request({
            costBudget: {
              currency: "USD",
              maxEstimatedCostMinorUnits: -1,
              enforcement: "foundation_preflight_only",
            },
          }),
        ),
      assertions: [expectBlocked("cost_budget_invalid"), expectIsolation],
    },
    {
      id: "latency_budget_blocks",
      title: "Invalid latency budget blocks",
      expectedBehavior: "Fail closed for invalid latency budget.",
      run: () =>
        enabledFoundation().evaluateRequest(
          request({
            latencyBudget: {
              maxLatencyMs: 1000,
              timeoutMs: 2000,
              enforcement: "foundation_preflight_only",
            },
          }),
        ),
      assertions: [expectBlocked("latency_budget_invalid"), expectIsolation],
    },
    {
      id: "unsafe_safety_requirements_block",
      title: "Unsafe safety requirements block",
      expectedBehavior:
        "Fail closed when training, raw prompt persistence, sensitive data, or prompt/context layer are enabled.",
      run: () =>
        enabledFoundation().evaluateRequest(
          {
            ...request(),
            safety: {
              requireStructuredOutput: true,
              allowTrainingUse: true,
              allowRawPromptPersistence: false,
              allowSensitivePersonalData: false,
              promptContextLayerConnected: false,
            } as unknown as AiProviderAdapterRequestContract["safety"],
          },
        ),
      assertions: [expectBlocked("safety_requirements_invalid"), expectIsolation],
    },
    {
      id: "valid_contract_allows",
      title: "Valid provider contract allows",
      expectedBehavior:
        "A valid provider request is accepted only for contract validation without model calls.",
      run: () => enabledFoundation().evaluateRequest(request()),
      assertions: [expectAllowed, expectIsolation],
    },
  ];
}

function runCase(input: ValidationCase): AiProviderAdapterValidationCaseResult {
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

export function runAiProviderAdapterContractsValidation(): AiProviderAdapterValidationResult {
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
