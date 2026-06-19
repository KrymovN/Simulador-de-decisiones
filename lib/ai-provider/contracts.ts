export const AI_PROVIDER_ADAPTER_CONTRACTS_VERSION =
  "5.1A-ai-provider-adapter-contracts-foundation.1" as const;
export const AI_PROVIDER_ADAPTER_CONTRACTS_MODE =
  "ai_provider_adapter_contracts_foundation_only" as const;
export const AI_PROVIDER_ADAPTER_RUNTIME_VERSION =
  "5.1B-ai-provider-adapter-runtime-foundation.1" as const;
export const AI_PROVIDER_ADAPTER_RUNTIME_MODE =
  "ai_provider_adapter_runtime_foundation_only" as const;

export type AiProviderAdapterContractsVersion =
  typeof AI_PROVIDER_ADAPTER_CONTRACTS_VERSION;
export type AiProviderAdapterContractsMode =
  typeof AI_PROVIDER_ADAPTER_CONTRACTS_MODE;
export type AiProviderAdapterRuntimeVersion =
  typeof AI_PROVIDER_ADAPTER_RUNTIME_VERSION;
export type AiProviderAdapterRuntimeMode =
  typeof AI_PROVIDER_ADAPTER_RUNTIME_MODE;

export type AiProviderId = "openai" | "anthropic" | "local_contract_stub";

export type AiProviderKind =
  | "external_model_provider"
  | "local_contract_stub";

export type AiProviderStatus = "available" | "disabled" | "unsupported";

export type AiProviderCapability =
  | "decision_simulation_structured_reasoning"
  | "scenario_expansion"
  | "risk_tradeoff_analysis"
  | "clarification_signal_generation"
  | "decision_summary_generation";

export type AiProviderInputKind = "decision_simulation_context";

export type AiProviderOutputKind = "structured_adapter_payload";

export type AiProviderCostBudget = {
  currency: "USD" | "EUR";
  maxEstimatedCostMinorUnits: number;
  enforcement: "foundation_preflight_only";
};

export type AiProviderLatencyBudget = {
  maxLatencyMs: number;
  timeoutMs: number;
  enforcement: "foundation_preflight_only";
};

export type AiProviderSafetyRequirements = {
  requireStructuredOutput: true;
  allowTrainingUse: false;
  allowRawPromptPersistence: false;
  allowSensitivePersonalData: false;
  promptContextLayerConnected: false;
};

export type AiProviderModelPolicy = {
  modelId: string;
  capabilities: AiProviderCapability[];
  maxInputTokens: number;
  maxOutputTokens: number;
  supportsStructuredOutput: boolean;
  status: AiProviderStatus;
};

export type AiProviderDefinition = {
  providerId: AiProviderId;
  kind: AiProviderKind;
  status: AiProviderStatus;
  supportedCapabilities: AiProviderCapability[];
  models: AiProviderModelPolicy[];
};

export type AiProviderRequestConstraints = {
  modelId: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  temperature: number;
};

export type AiProviderAdapterRequestContract = {
  requestId: string;
  providerId: AiProviderId;
  capability: AiProviderCapability;
  inputKind: AiProviderInputKind;
  inputFingerprint: string;
  requestedAt: string;
  constraints: AiProviderRequestConstraints;
  safety: AiProviderSafetyRequirements;
  costBudget: AiProviderCostBudget;
  latencyBudget: AiProviderLatencyBudget;
  clientRuntimeFields?: {
    apiKey?: string;
    envVarName?: string;
    rawPrompt?: string;
    providerSecret?: string;
  };
};

export type AiProviderCostEvidence = {
  currency: AiProviderCostBudget["currency"];
  estimatedCostMinorUnits: number;
  maxEstimatedCostMinorUnits: number;
  costLimitEnforced: true;
  billingConnected: false;
};

export type AiProviderLatencyEvidence = {
  maxLatencyMs: number;
  timeoutMs: number;
  latencyLimitEnforced: true;
  networkCallExecuted: false;
};

export type AiProviderSafetyEvidence = {
  structuredOutputRequired: true;
  trainingUseAllowed: false;
  rawPromptPersistenceAllowed: false;
  sensitivePersonalDataAllowed: false;
  promptContextLayerConnected: false;
  unsafeInputBlocked: boolean;
};

export type AiProviderAdapterResponseContract = {
  responseId: string;
  requestId: string;
  providerId: AiProviderId;
  capability: AiProviderCapability;
  outputKind: AiProviderOutputKind;
  status: "contract_validated" | "blocked";
  outputFingerprint?: string;
  safetyEvidence: AiProviderSafetyEvidence;
  costEvidence: AiProviderCostEvidence;
  latencyEvidence: AiProviderLatencyEvidence;
  error?: AiProviderAdapterError;
};

export type AiProviderAdapterErrorCode =
  | "ai_provider_adapter_disabled"
  | "provider_not_supported"
  | "provider_disabled"
  | "model_not_supported"
  | "model_disabled"
  | "capability_not_supported"
  | "structured_output_not_supported"
  | "input_fingerprint_missing"
  | "timestamp_invalid"
  | "token_limit_invalid"
  | "temperature_out_of_range"
  | "cost_budget_invalid"
  | "latency_budget_invalid"
  | "safety_requirements_invalid"
  | "client_runtime_field_rejected";

export type AiProviderAdapterError = {
  code: AiProviderAdapterErrorCode;
  message: string;
  recoverable: false;
};

export type AiProviderAdapterConfig = {
  enabled: boolean;
  providers: AiProviderDefinition[];
};

export type AiProviderAdapterSafetyEvidence = {
  stage: "5.1A";
  aiProviderOnly: true;
  contractsOnly: true;
  foundationOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  modelCallExecuted: false;
  openAiSdkConnected: false;
  apiKeysRead: false;
  envVariablesRead: false;
  apiRouteIntegrated: false;
  simulatorIntegrated: false;
  decisionEngineRuntimeConnected: false;
  promptContextLayerConnected: false;
  databaseConnected: false;
  supabaseConnected: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  subscriptionsRuntimeConnected: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  stage51BStarted: false;
  stage52Started: false;
  stage53Started: false;
  rollback: "disable_ai_provider_adapter_contracts_or_remove_ai_provider_exports";
};

export type AiProviderAdapterAllowedEvaluation = {
  status: "allowed";
  execution: "contract_validation_only";
  version: AiProviderAdapterContractsVersion;
  providerId: AiProviderId;
  modelId: string;
  capability: AiProviderCapability;
  responseContract: AiProviderAdapterResponseContract;
  evidence: AiProviderAdapterSafetyEvidence;
};

export type AiProviderAdapterBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: AiProviderAdapterContractsVersion;
  providerId?: AiProviderId;
  modelId?: string;
  capability: AiProviderCapability;
  error: AiProviderAdapterError;
  evidence: AiProviderAdapterSafetyEvidence;
};

export type AiProviderAdapterEvaluationResult =
  | AiProviderAdapterAllowedEvaluation
  | AiProviderAdapterBlockedEvaluation;

export type AiProviderAdapterContractsFoundation = {
  version: AiProviderAdapterContractsVersion;
  mode: AiProviderAdapterContractsMode;
  enabled: boolean;
  modelCallsEnabled: false;
  providers: AiProviderDefinition[];
  evaluateRequest(
    request: AiProviderAdapterRequestContract,
  ): AiProviderAdapterEvaluationResult;
};

export type AiProviderAdapterValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: AiProviderAdapterEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AiProviderAdapterValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: AiProviderAdapterValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type AiProviderAdapterRuntimeSelectionStrategy =
  | "requested_provider_first"
  | "first_capable_provider";

export type AiProviderAdapterRuntimeConfig = {
  enabled: boolean;
  adapterConfig: AiProviderAdapterConfig;
  allowedProviders: AiProviderId[];
  selectionStrategy: AiProviderAdapterRuntimeSelectionStrategy;
};

export type AiProviderAdapterRuntimeBlockedReason =
  | AiProviderAdapterErrorCode
  | "ai_provider_runtime_disabled"
  | "request_missing"
  | "provider_not_allowed"
  | "provider_selection_failed"
  | "runtime_contract_isolation_failed";

export type AiProviderAdapterRuntimeSelection = {
  providerId: AiProviderId;
  modelId: string;
  strategy: AiProviderAdapterRuntimeSelectionStrategy;
  source: "runtime_preflight_selection";
};

export type AiProviderAdapterRuntimeSafetyEvidence = {
  stage: "5.1B";
  aiProviderOnly: true;
  runtimeFoundationOnly: true;
  contractsFoundationUsed: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  modelCallExecuted: false;
  openAiSdkConnected: false;
  apiKeysRead: false;
  envVariablesRead: false;
  apiRouteIntegrated: false;
  simulatorIntegrated: false;
  decisionEngineRuntimeConnected: false;
  promptContextLayerConnected: false;
  databaseConnected: false;
  supabaseConnected: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  subscriptionsRuntimeConnected: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  stage51CStarted: false;
  stage52Started: false;
  stage53Started: false;
  rollback: "disable_ai_provider_adapter_runtime_or_remove_runtime_exports";
};

export type AiProviderAdapterRuntimeEvaluationInput = {
  request?: AiProviderAdapterRequestContract | null;
  providerPreference?: AiProviderId[];
  allowedProviders?: AiProviderId[];
};

export type AiProviderAdapterRuntimeAllowedDecision = {
  status: "allowed";
  execution: "preflight_only";
  version: AiProviderAdapterRuntimeVersion;
  selection: AiProviderAdapterRuntimeSelection;
  selectedRequest: AiProviderAdapterRequestContract;
  contractResult: AiProviderAdapterAllowedEvaluation;
  evidence: AiProviderAdapterRuntimeSafetyEvidence;
};

export type AiProviderAdapterRuntimeBlockedDecision = {
  status: "blocked";
  execution: "none";
  version: AiProviderAdapterRuntimeVersion;
  reason: AiProviderAdapterRuntimeBlockedReason;
  message: string;
  selection?: AiProviderAdapterRuntimeSelection;
  selectedRequest?: AiProviderAdapterRequestContract;
  contractResult?: AiProviderAdapterEvaluationResult;
  evidence: AiProviderAdapterRuntimeSafetyEvidence;
};

export type AiProviderAdapterRuntimeEvaluationResult =
  | AiProviderAdapterRuntimeAllowedDecision
  | AiProviderAdapterRuntimeBlockedDecision;

export type AiProviderAdapterRuntimeFoundation = {
  version: AiProviderAdapterRuntimeVersion;
  mode: AiProviderAdapterRuntimeMode;
  enabled: boolean;
  modelCallsEnabled: false;
  evaluate(
    input: AiProviderAdapterRuntimeEvaluationInput,
  ): AiProviderAdapterRuntimeEvaluationResult;
};

export type AiProviderAdapterRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: AiProviderAdapterRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AiProviderAdapterRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: AiProviderAdapterRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
