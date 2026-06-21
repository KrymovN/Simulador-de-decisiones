export const AI_PROVIDER_ADAPTER_CONTRACTS_VERSION =
  "5.1A-ai-provider-adapter-contracts-foundation.1" as const;

export const AI_PROVIDER_ADAPTER_CONTRACTS_MODE =
  "ai_provider_adapter_contracts_foundation_only" as const;

export type AIProviderCapability =
  | "decision_simulation_structuring"
  | "scenario_generation"
  | "risk_tradeoff_analysis"
  | "clarification_signal"
  | "outcome_summary";

export type AIProviderErrorCode =
  | "adapter_disabled"
  | "request_missing"
  | "provider_missing"
  | "provider_disabled"
  | "capability_not_supported"
  | "request_id_missing"
  | "input_fingerprint_missing"
  | "requested_at_invalid"
  | "structured_output_required"
  | "token_budget_invalid"
  | "temperature_out_of_range"
  | "client_runtime_field_rejected";

export type AIProviderError = {
  code: AIProviderErrorCode;
  message: string;
  recoverable: false;
};

export type AIProviderDefinition = {
  providerId: string;
  enabled: boolean;
  capabilities: AIProviderCapability[];
};

export type AIProviderRequest = {
  requestId: string;
  providerId: string;
  capability: AIProviderCapability;
  inputFingerprint: string;
  requestedAt: string;
  requireStructuredOutput: true;
  tokenBudget: {
    maxInputTokens: number;
    maxOutputTokens: number;
  };
  temperature: number;
  clientRuntimeFields?: {
    apiKey?: string;
    envVarName?: string;
    rawPrompt?: string;
    providerSecret?: string;
  };
};

export type AIProviderResponse =
  | {
      status: "validated";
      execution: "contract_validation_only";
      requestId: string;
      providerId: string;
      capability: AIProviderCapability;
      modelCallExecuted: false;
      outputFingerprint: string;
    }
  | {
      status: "blocked";
      execution: "none";
      requestId?: string;
      providerId?: string;
      capability?: AIProviderCapability;
      modelCallExecuted: false;
      error: AIProviderError;
    };

export type AIProviderAdapter = {
  version: typeof AI_PROVIDER_ADAPTER_CONTRACTS_VERSION;
  mode: typeof AI_PROVIDER_ADAPTER_CONTRACTS_MODE;
  enabled: boolean;
  modelCallsEnabled: false;
  providers: AIProviderDefinition[];
  validateRequest(request: AIProviderRequest): AIProviderResponse;
};

export type AIProviderAdapterConfig = {
  enabled: boolean;
  providers: AIProviderDefinition[];
};

export type AIProviderContractsValidationCase = {
  caseId: string;
  passed: boolean;
  errorCode?: AIProviderErrorCode;
};

export type AIProviderContractsValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: AIProviderContractsValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
