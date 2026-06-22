export const AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION =
  "5.4A-controlled-ai-integration-preflight-contracts-foundation.1" as const;

export const AI_INTEGRATION_PREFLIGHT_CONTRACTS_MODE =
  "controlled_ai_integration_preflight_contracts_foundation_only" as const;

export const AI_INTEGRATION_PREFLIGHT_RUNTIME_VERSION =
  "5.4B-controlled-ai-integration-preflight-runtime-validation-foundation.1" as const;

export const AI_INTEGRATION_PREFLIGHT_RUNTIME_MODE =
  "controlled_ai_integration_preflight_runtime_validation_foundation_only" as const;

export type AIIntegrationPreflightContractsVersion =
  typeof AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION;

export type AIIntegrationPreflightContractsMode =
  typeof AI_INTEGRATION_PREFLIGHT_CONTRACTS_MODE;

export type AIIntegrationPreflightRuntimeVersion =
  typeof AI_INTEGRATION_PREFLIGHT_RUNTIME_VERSION;

export type AIIntegrationPreflightRuntimeMode =
  typeof AI_INTEGRATION_PREFLIGHT_RUNTIME_MODE;

export type AIIntegrationPreflightOperation =
  "controlled_ai_integration_preflight";

export type AIIntegrationComponent =
  | "prompt_context_boundary"
  | "ai_provider_boundary"
  | "ai_quality_boundary";

export type AIIntegrationComponentExecution =
  | "boundary_facade_only"
  | "controlled_boundary_preflight_only"
  | "boundary_preflight_only";

export type AIIntegrationComponentReference = {
  component: AIIntegrationComponent;
  version: string;
  status: "ready" | "allowed";
  execution: AIIntegrationComponentExecution;
  modelCallExecuted: false;
  providerExecutionCompleted: false;
};

export type AIIntegrationPolicy = {
  mode: "decision_simulation_ai_integration_preflight";
  requirePromptContextBoundary: true;
  requireAIProviderBoundaryPreflight: true;
  requireAIQualityBoundary: true;
  requireStructuredDecisionSimulationFrame: true;
  allowProviderExecution: false;
  allowModelCalls: false;
  allowStreaming: false;
  allowApiRoutes: false;
  allowSimulatorRuntime: false;
  allowDecisionEngineRuntime: false;
  allowUiRuntime: false;
};

export type AIIntegrationForbiddenClientFields = {
  rawPrompt?: string;
  rawChatMessages?: string[];
  userSystemPrompt?: string;
  providerPayload?: unknown;
  modelCallPayload?: unknown;
  apiKey?: string;
  envVarName?: string;
  providerSecret?: string;
  modelId?: string;
  providerExecution?: boolean;
  modelCall?: boolean;
  streaming?: boolean;
  apiRoute?: boolean;
  simulatorRuntime?: boolean;
  decisionEngineRuntime?: boolean;
  uiRuntime?: boolean;
};

export type AIIntegrationPreflightInput = {
  preflightId: string;
  operation: AIIntegrationPreflightOperation;
  requestedAt: string;
  scope: "decision_simulation_ai_integration_preflight";
  policy: AIIntegrationPolicy;
  promptContext: AIIntegrationComponentReference;
  aiProvider: AIIntegrationComponentReference;
  aiQuality: AIIntegrationComponentReference;
  inputFingerprint: string;
  clientRuntimeFields?: AIIntegrationForbiddenClientFields;
};

export type AIIntegrationSafetyEvidence = {
  stage: "5.4A";
  controlledAIIntegrationOnly: true;
  contractsOnly: true;
  foundationOnly: true;
  preflightOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  promptContextBoundaryRequired: true;
  aiProviderBoundaryPreflightRequired: true;
  aiQualityBoundaryRequired: true;
  providerExecutionAllowed: false;
  streamingAllowed: false;
  rawPromptAllowed: false;
  providerPayloadAllowed: false;
  modelCallPayloadAllowed: false;
  modelCallExecuted: false;
  providerExecutionCompleted: false;
  openAiSdkConnected: false;
  aiSdkConnected: false;
  apiKeyRead: false;
  envRead: false;
  apiRouteIntegrated: false;
  simulatorIntegrated: false;
  decisionEngineRuntimeConnected: false;
  uiIntegrated: false;
};

export type AIIntegrationErrorCode =
  | "integration_contracts_disabled"
  | "preflight_input_missing"
  | "preflight_id_missing"
  | "operation_invalid"
  | "timestamp_invalid"
  | "scope_invalid"
  | "policy_invalid"
  | "input_fingerprint_missing"
  | "prompt_context_boundary_missing"
  | "ai_provider_boundary_missing"
  | "ai_quality_boundary_missing"
  | "component_reference_invalid"
  | "unsafe_client_field_rejected"
  | "provider_execution_rejected"
  | "model_call_rejected"
  | "streaming_rejected"
  | "product_runtime_rejected"
  | "output_contract_invalid"
  | "runtime_disabled"
  | "runtime_request_missing"
  | "contract_preflight_blocked"
  | "runtime_output_validation_failed"
  | "runtime_isolation_failed";

export type AIIntegrationError = {
  code: AIIntegrationErrorCode;
  message: string;
  recoverable: false;
};

export type AIIntegrationAllowedPreflight = {
  status: "allowed";
  execution: "contract_validation_only";
  version: AIIntegrationPreflightContractsVersion;
  preflightId: string;
  operation: AIIntegrationPreflightOperation;
  components: {
    promptContextBoundaryReady: true;
    aiProviderBoundaryPreflightReady: true;
    aiQualityBoundaryReady: true;
  };
  evidence: AIIntegrationSafetyEvidence;
};

export type AIIntegrationBlockedPreflight = {
  status: "blocked";
  execution: "none";
  version: AIIntegrationPreflightContractsVersion;
  preflightId?: string;
  operation?: AIIntegrationPreflightOperation;
  error: AIIntegrationError;
  evidence: AIIntegrationSafetyEvidence;
};

export type AIIntegrationPreflightResult =
  | AIIntegrationAllowedPreflight
  | AIIntegrationBlockedPreflight;

export type AIIntegrationContractsConfig = {
  enabled: boolean;
};

export type AIIntegrationContractsFoundation = {
  version: AIIntegrationPreflightContractsVersion;
  mode: AIIntegrationPreflightContractsMode;
  enabled: boolean;
  modelCallsEnabled: false;
  providerExecutionEnabled: false;
  streamingEnabled: false;
  apiRoutesEnabled: false;
  simulatorRuntimeEnabled: false;
  decisionEngineRuntimeEnabled: false;
  uiRuntimeEnabled: false;
  validatePreflight(
    input: Partial<AIIntegrationPreflightInput> | null | undefined,
  ): AIIntegrationPreflightResult;
  validateOutput(
    output: Partial<AIIntegrationPreflightResult> | null | undefined,
  ): AIIntegrationPreflightResult;
};

export type AIIntegrationRuntimeConfig = {
  enabled: boolean;
  contracts: AIIntegrationContractsFoundation;
  failClosedOnContractBlock: true;
};

export type AIIntegrationRuntimePreflightRequest = {
  input?: Partial<AIIntegrationPreflightInput> | null;
};

export type AIIntegrationRuntimeFoundation = {
  version: AIIntegrationPreflightRuntimeVersion;
  mode: AIIntegrationPreflightRuntimeMode;
  enabled: boolean;
  modelCallsEnabled: false;
  providerExecutionEnabled: false;
  streamingEnabled: false;
  apiRoutesEnabled: false;
  simulatorRuntimeEnabled: false;
  decisionEngineRuntimeEnabled: false;
  uiRuntimeEnabled: false;
  validate(
    request: AIIntegrationRuntimePreflightRequest,
  ): AIIntegrationPreflightResult;
};

export type AIIntegrationValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: AIIntegrationPreflightResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AIIntegrationValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: AIIntegrationValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
