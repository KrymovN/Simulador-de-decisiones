import type { AIProviderBoundaryResult } from "../ai-provider/contracts";
import type { AiQualityBoundaryEvaluationResult } from "../ai-quality/contracts";
import type { PromptContextBoundaryResult } from "../prompt-context/contracts";

export const AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION =
  "5.4A-controlled-ai-integration-preflight-contracts-foundation.1" as const;

export const AI_INTEGRATION_PREFLIGHT_CONTRACTS_MODE =
  "controlled_ai_integration_preflight_contracts_foundation_only" as const;

export const AI_INTEGRATION_PREFLIGHT_RUNTIME_VERSION =
  "5.4B-controlled-ai-integration-preflight-runtime-validation-foundation.1" as const;

export const AI_INTEGRATION_PREFLIGHT_RUNTIME_MODE =
  "controlled_ai_integration_preflight_runtime_validation_foundation_only" as const;

export const AI_INTEGRATION_BOUNDARY_COMPOSITION_VERSION =
  "5.4C-controlled-ai-integration-boundary-composition-foundation.1" as const;

export const AI_INTEGRATION_BOUNDARY_COMPOSITION_MODE =
  "controlled_ai_integration_boundary_composition_foundation_only" as const;

export const AI_INTEGRATION_DRY_RUN_VERSION =
  "5.4D-controlled-ai-integration-dry-run-execution-foundation.1" as const;

export const AI_INTEGRATION_DRY_RUN_MODE =
  "controlled_ai_integration_dry_run_execution_foundation_only" as const;

export type AIIntegrationPreflightContractsVersion =
  typeof AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION;

export type AIIntegrationPreflightContractsMode =
  typeof AI_INTEGRATION_PREFLIGHT_CONTRACTS_MODE;

export type AIIntegrationPreflightRuntimeVersion =
  typeof AI_INTEGRATION_PREFLIGHT_RUNTIME_VERSION;

export type AIIntegrationPreflightRuntimeMode =
  typeof AI_INTEGRATION_PREFLIGHT_RUNTIME_MODE;

export type AIIntegrationBoundaryCompositionVersion =
  typeof AI_INTEGRATION_BOUNDARY_COMPOSITION_VERSION;

export type AIIntegrationBoundaryCompositionMode =
  typeof AI_INTEGRATION_BOUNDARY_COMPOSITION_MODE;

export type AIIntegrationDryRunVersion = typeof AI_INTEGRATION_DRY_RUN_VERSION;

export type AIIntegrationDryRunMode = typeof AI_INTEGRATION_DRY_RUN_MODE;

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
  | "runtime_isolation_failed"
  | "composition_disabled"
  | "composition_request_missing"
  | "composition_id_missing"
  | "composition_timestamp_invalid"
  | "composition_input_fingerprint_missing"
  | "composition_policy_invalid"
  | "composition_runtime_disabled"
  | "composition_runtime_isolation_failed"
  | "prompt_context_boundary_blocked"
  | "ai_integration_preflight_blocked"
  | "ai_provider_boundary_blocked"
  | "ai_quality_boundary_blocked"
  | "composition_output_invalid"
  | "dry_run_disabled"
  | "dry_run_request_missing"
  | "dry_run_id_missing"
  | "dry_run_timestamp_invalid"
  | "dry_run_input_fingerprint_missing"
  | "dry_run_composition_missing"
  | "dry_run_composition_disabled"
  | "dry_run_composition_blocked"
  | "dry_run_isolation_failed";

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

export type AIIntegrationBoundaryCompositionInput = {
  compositionId: string;
  requestedAt: string;
  inputFingerprint: string;
  policy: AIIntegrationPolicy;
  promptContextBoundary: PromptContextBoundaryResult;
  preflightInput: Partial<AIIntegrationPreflightInput> | null;
  aiProviderBoundary: AIProviderBoundaryResult;
  aiQualityBoundary: AiQualityBoundaryEvaluationResult;
  clientRuntimeFields?: AIIntegrationForbiddenClientFields;
};

export type AIIntegrationBoundaryCompositionEvidence = {
  stage: "5.4C";
  controlledAIIntegrationOnly: true;
  boundaryCompositionOnly: true;
  foundationOnly: true;
  preflightOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  promptContextBoundaryComposed: boolean;
  aiIntegrationRuntimePreflightComposed: boolean;
  aiProviderBoundaryComposed: boolean;
  aiQualityBoundaryComposed: boolean;
  promptContextRuntimeExecutedByComposition: false;
  aiProviderExecutedByComposition: false;
  aiQualityRealEnforcementExecuted: false;
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

export type AIIntegrationBoundaryCompositionResult =
  | {
      status: "allowed";
      execution: "boundary_composition_preflight_only";
      version: AIIntegrationBoundaryCompositionVersion;
      compositionId: string;
      inputFingerprint: string;
      promptContextBoundary: Extract<PromptContextBoundaryResult, { status: "ready" }>;
      aiIntegrationPreflight: Extract<AIIntegrationPreflightResult, { status: "allowed" }>;
      aiProviderBoundary: Extract<AIProviderBoundaryResult, { status: "ready" }>;
      aiQualityBoundary: Extract<AiQualityBoundaryEvaluationResult, { status: "allowed" }>;
      evidence: AIIntegrationBoundaryCompositionEvidence;
    }
  | {
      status: "blocked";
      execution: "none";
      version: AIIntegrationBoundaryCompositionVersion;
      compositionId?: string;
      inputFingerprint?: string;
      reason: AIIntegrationErrorCode;
      error: AIIntegrationError;
      promptContextBoundary?: PromptContextBoundaryResult;
      aiIntegrationPreflight?: AIIntegrationPreflightResult;
      aiProviderBoundary?: AIProviderBoundaryResult;
      aiQualityBoundary?: AiQualityBoundaryEvaluationResult;
      evidence: AIIntegrationBoundaryCompositionEvidence;
    };

export type AIIntegrationBoundaryCompositionConfig = {
  enabled: boolean;
  runtime: AIIntegrationRuntimeFoundation;
};

export type AIIntegrationBoundaryCompositionFoundation = {
  version: AIIntegrationBoundaryCompositionVersion;
  mode: AIIntegrationBoundaryCompositionMode;
  enabled: boolean;
  modelCallsEnabled: false;
  providerExecutionEnabled: false;
  streamingEnabled: false;
  apiRoutesEnabled: false;
  simulatorRuntimeEnabled: false;
  decisionEngineRuntimeEnabled: false;
  uiRuntimeEnabled: false;
  compose(
    input: Partial<AIIntegrationBoundaryCompositionInput> | null | undefined,
  ): AIIntegrationBoundaryCompositionResult;
};

export type AIIntegrationDryRunRequest = {
  dryRunId: string;
  requestedAt: string;
  inputFingerprint: string;
  composition: Partial<AIIntegrationBoundaryCompositionInput> | null;
  clientRuntimeFields?: AIIntegrationForbiddenClientFields;
};

export type AIIntegrationDryRunEvidence = {
  stage: "5.4D";
  controlledAIIntegrationOnly: true;
  dryRunOnly: true;
  boundaryCompositionUsed: true;
  foundationOnly: true;
  preflightOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  aiCallConfirmedAbsent: true;
  envConfirmedUntouched: true;
  apiConfirmedUntouched: true;
  uiConfirmedUntouched: true;
  simulatorConfirmedUntouched: true;
  decisionEngineRuntimeConfirmedUntouched: true;
  promptContextRuntimeExecutedByDryRun: false;
  aiProviderExecutedByDryRun: false;
  aiQualityRealEnforcementExecuted: false;
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

export type AIIntegrationDryRunResult =
  | {
      status: "completed";
      execution: "dry_run_preflight_only";
      version: AIIntegrationDryRunVersion;
      dryRunId: string;
      inputFingerprint: string;
      composition: Extract<AIIntegrationBoundaryCompositionResult, { status: "allowed" }>;
      evidence: AIIntegrationDryRunEvidence;
    }
  | {
      status: "blocked";
      execution: "none";
      version: AIIntegrationDryRunVersion;
      dryRunId?: string;
      inputFingerprint?: string;
      reason: AIIntegrationErrorCode;
      error: AIIntegrationError;
      composition?: AIIntegrationBoundaryCompositionResult;
      evidence: AIIntegrationDryRunEvidence;
    };

export type AIIntegrationDryRunConfig = {
  enabled: boolean;
  composition: AIIntegrationBoundaryCompositionFoundation;
};

export type AIIntegrationDryRunFoundation = {
  version: AIIntegrationDryRunVersion;
  mode: AIIntegrationDryRunMode;
  enabled: boolean;
  modelCallsEnabled: false;
  providerExecutionEnabled: false;
  streamingEnabled: false;
  apiRoutesEnabled: false;
  simulatorRuntimeEnabled: false;
  decisionEngineRuntimeEnabled: false;
  uiRuntimeEnabled: false;
  execute(
    request: Partial<AIIntegrationDryRunRequest> | null | undefined,
  ): AIIntegrationDryRunResult;
};

export type AIIntegrationValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus:
    | AIIntegrationPreflightResult["status"]
    | AIIntegrationBoundaryCompositionResult["status"]
    | AIIntegrationDryRunResult["status"];
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
