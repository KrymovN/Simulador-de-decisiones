import {
  AI_PROVIDER_ADAPTER_CONTRACTS_MODE,
  AI_PROVIDER_ADAPTER_CONTRACTS_VERSION,
  type AIProviderAdapter,
  type AIProviderAdapterConfig,
  type AIProviderCapability,
  type AIProviderContractsValidationCase,
  type AIProviderContractsValidationResult,
  type AIProviderDefinition,
  type AIProviderError,
  type AIProviderErrorCode,
  type AIProviderRequest,
  type AIProviderResponse,
} from "./contracts";

export const DEFAULT_AI_PROVIDER_ADAPTER_CONFIG: AIProviderAdapterConfig = {
  enabled: false,
  providers: [],
};

function error(
  code: AIProviderErrorCode,
  message: string,
): AIProviderError {
  return {
    code,
    message,
    recoverable: false,
  };
}

function blocked(input: {
  request?: Partial<AIProviderRequest> | null;
  code: AIProviderErrorCode;
  message: string;
}): AIProviderResponse {
  return {
    status: "blocked",
    execution: "none",
    requestId: input.request?.requestId,
    providerId: input.request?.providerId,
    capability: input.request?.capability,
    modelCallExecuted: false,
    error: error(input.code, input.message),
  };
}

function hasClientRuntimeFields(
  request: Partial<AIProviderRequest>,
): boolean {
  const fields = request.clientRuntimeFields;

  return Boolean(
    fields?.apiKey ||
      fields?.envVarName ||
      fields?.rawPrompt ||
      fields?.providerSecret,
  );
}

function isValidTimestamp(value: string | undefined): boolean {
  return Boolean(value) && Number.isFinite(Date.parse(value));
}

function findProvider(
  providers: AIProviderDefinition[],
  providerId: string,
): AIProviderDefinition | undefined {
  return providers.find((provider) => provider.providerId === providerId);
}

export function validateAIProviderRequest(
  config: AIProviderAdapterConfig,
  request: Partial<AIProviderRequest> | null | undefined,
): AIProviderResponse {
  if (!request) {
    return blocked({
      request,
      code: "request_missing",
      message: "AI provider request is required.",
    });
  }

  if (!config.enabled) {
    return blocked({
      request,
      code: "adapter_disabled",
      message: "AI provider adapter is disabled by default.",
    });
  }

  if (hasClientRuntimeFields(request)) {
    return blocked({
      request,
      code: "client_runtime_field_rejected",
      message: "Client-supplied API keys, env names, raw prompts, or provider secrets are rejected.",
    });
  }

  if (!request.requestId) {
    return blocked({
      request,
      code: "request_id_missing",
      message: "AI provider request requires a requestId.",
    });
  }

  if (!request.providerId) {
    return blocked({
      request,
      code: "provider_missing",
      message: "AI provider request requires an internal providerId.",
    });
  }

  if (!request.inputFingerprint) {
    return blocked({
      request,
      code: "input_fingerprint_missing",
      message: "AI provider request requires an opaque input fingerprint.",
    });
  }

  if (!isValidTimestamp(request.requestedAt)) {
    return blocked({
      request,
      code: "requested_at_invalid",
      message: "AI provider request requires a valid requestedAt timestamp.",
    });
  }

  if (!request.capability) {
    return blocked({
      request,
      code: "capability_not_supported",
      message: "AI provider request requires a supported capability.",
    });
  }

  if (request.requireStructuredOutput !== true) {
    return blocked({
      request,
      code: "structured_output_required",
      message: "AI provider contracts require structured output.",
    });
  }

  if (
    !request.tokenBudget ||
    !Number.isFinite(request.tokenBudget.maxInputTokens) ||
    !Number.isFinite(request.tokenBudget.maxOutputTokens) ||
    request.tokenBudget.maxInputTokens <= 0 ||
    request.tokenBudget.maxOutputTokens <= 0
  ) {
    return blocked({
      request,
      code: "token_budget_invalid",
      message: "AI provider token budgets must be positive.",
    });
  }

  if (
    !Number.isFinite(request.temperature) ||
    request.temperature < 0 ||
    request.temperature > 1
  ) {
    return blocked({
      request,
      code: "temperature_out_of_range",
      message: "AI provider temperature must stay between 0 and 1.",
    });
  }

  const provider = findProvider(config.providers, request.providerId);

  if (!provider) {
    return blocked({
      request,
      code: "provider_missing",
      message: "Requested AI provider is not configured.",
    });
  }

  if (!provider.enabled) {
    return blocked({
      request,
      code: "provider_disabled",
      message: "Requested AI provider is disabled.",
    });
  }

  if (provider.availability === "unavailable") {
    return blocked({
      request,
      code: "provider_unavailable",
      message: "Requested AI provider is unavailable.",
    });
  }

  if (!provider.capabilities.includes(request.capability)) {
    return blocked({
      request,
      code: "capability_not_supported",
      message: "Requested AI provider capability is not supported.",
    });
  }

  return {
    status: "validated",
    execution: "contract_validation_only",
    requestId: request.requestId,
    providerId: request.providerId,
    capability: request.capability,
    modelCallExecuted: false,
    outputFingerprint: `${request.inputFingerprint}:validated`,
  };
}

export function createAIProviderAdapter(
  config: AIProviderAdapterConfig = DEFAULT_AI_PROVIDER_ADAPTER_CONFIG,
): AIProviderAdapter {
  return {
    version: AI_PROVIDER_ADAPTER_CONTRACTS_VERSION,
    mode: AI_PROVIDER_ADAPTER_CONTRACTS_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    providers: config.providers,
    validateRequest: (request) => validateAIProviderRequest(config, request),
  };
}

function request(
  overrides: Partial<AIProviderRequest> = {},
): AIProviderRequest {
  return {
    requestId: "stage_5_1a_contract_request",
    providerId: "internal_foundation_provider",
    capability: "decision_simulation_structuring",
    inputFingerprint: "decision-simulation-context-fingerprint",
    requestedAt: "2026-06-21T00:00:00.000Z",
    requireStructuredOutput: true,
    tokenBudget: {
      maxInputTokens: 2000,
      maxOutputTokens: 500,
    },
    temperature: 0.2,
    ...overrides,
  };
}

function enabledAdapter(
  providers: AIProviderDefinition[] = [
    {
      providerId: "internal_foundation_provider",
      enabled: true,
      capabilities: ["decision_simulation_structuring"],
    },
  ],
): AIProviderAdapter {
  return createAIProviderAdapter({
    enabled: true,
    providers,
  });
}

function validationCase(input: {
  caseId: string;
  response: AIProviderResponse;
  expectedStatus: AIProviderResponse["status"];
  expectedErrorCode?: AIProviderErrorCode;
}): AIProviderContractsValidationCase {
  const errorCode =
    input.response.status === "blocked" ? input.response.error.code : undefined;
  const passed =
    input.response.status === input.expectedStatus &&
    errorCode === input.expectedErrorCode &&
    input.response.modelCallExecuted === false;

  return {
    caseId: input.caseId,
    passed,
    errorCode,
  };
}

export function runAIProviderContractsValidation(): AIProviderContractsValidationResult {
  const cases: AIProviderContractsValidationCase[] = [
    validationCase({
      caseId: "disabled_adapter_fails_closed",
      response: createAIProviderAdapter().validateRequest(request()),
      expectedStatus: "blocked",
      expectedErrorCode: "adapter_disabled",
    }),
    validationCase({
      caseId: "client_runtime_fields_rejected",
      response: enabledAdapter().validateRequest(
        request({
          clientRuntimeFields: {
            apiKey: "forbidden",
          },
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "client_runtime_field_rejected",
    }),
    validationCase({
      caseId: "missing_input_fingerprint_rejected",
      response: enabledAdapter().validateRequest(
        request({
          inputFingerprint: "",
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "input_fingerprint_missing",
    }),
    validationCase({
      caseId: "disabled_provider_rejected",
      response: enabledAdapter([
        {
          providerId: "internal_foundation_provider",
          enabled: false,
          capabilities: ["decision_simulation_structuring"],
        },
      ]).validateRequest(request()),
      expectedStatus: "blocked",
      expectedErrorCode: "provider_disabled",
    }),
    validationCase({
      caseId: "unsupported_capability_rejected",
      response: enabledAdapter().validateRequest(
        request({
          capability: "scenario_generation" as AIProviderCapability,
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "capability_not_supported",
    }),
    validationCase({
      caseId: "valid_request_is_contract_validated",
      response: enabledAdapter().validateRequest(request()),
      expectedStatus: "validated",
    }),
  ];

  const passed = cases.filter((item) => item.passed).length;
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
