import {
  AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
  type AIProviderBoundaryResult,
} from "../ai-provider/contracts";
import {
  AI_QUALITY_BOUNDARY_VERSION,
  type AiQualityBoundaryEvaluationResult,
} from "../ai-quality/contracts";
import {
  PROMPT_CONTEXT_BOUNDARY_VERSION,
  type PromptContextBoundaryResult,
} from "../prompt-context/contracts";
import {
  AI_INTEGRATION_BOUNDARY_COMPOSITION_MODE,
  AI_INTEGRATION_BOUNDARY_COMPOSITION_VERSION,
  type AIIntegrationBoundaryCompositionConfig,
  type AIIntegrationBoundaryCompositionEvidence,
  type AIIntegrationBoundaryCompositionFoundation,
  type AIIntegrationBoundaryCompositionInput,
  type AIIntegrationBoundaryCompositionResult,
  type AIIntegrationError,
  type AIIntegrationErrorCode,
  type AIIntegrationForbiddenClientFields,
  type AIIntegrationPreflightResult,
} from "./contracts";
import {
  DEFAULT_AI_INTEGRATION_RUNTIME_CONFIG,
  createAIIntegrationRuntimeFoundation,
} from "./runtime";

export const DEFAULT_AI_INTEGRATION_BOUNDARY_COMPOSITION_CONFIG: AIIntegrationBoundaryCompositionConfig =
  {
    enabled: false,
    runtime: createAIIntegrationRuntimeFoundation({
      ...DEFAULT_AI_INTEGRATION_RUNTIME_CONFIG,
      enabled: true,
    }),
  };

function evidence(input: {
  promptContextBoundaryComposed?: boolean;
  aiIntegrationRuntimePreflightComposed?: boolean;
  aiProviderBoundaryComposed?: boolean;
  aiQualityBoundaryComposed?: boolean;
} = {}): AIIntegrationBoundaryCompositionEvidence {
  return {
    stage: "5.4C",
    controlledAIIntegrationOnly: true,
    boundaryCompositionOnly: true,
    foundationOnly: true,
    preflightOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    promptContextBoundaryComposed: input.promptContextBoundaryComposed === true,
    aiIntegrationRuntimePreflightComposed:
      input.aiIntegrationRuntimePreflightComposed === true,
    aiProviderBoundaryComposed: input.aiProviderBoundaryComposed === true,
    aiQualityBoundaryComposed: input.aiQualityBoundaryComposed === true,
    promptContextRuntimeExecutedByComposition: false,
    aiProviderExecutedByComposition: false,
    aiQualityRealEnforcementExecuted: false,
    providerExecutionAllowed: false,
    streamingAllowed: false,
    rawPromptAllowed: false,
    providerPayloadAllowed: false,
    modelCallPayloadAllowed: false,
    modelCallExecuted: false,
    providerExecutionCompleted: false,
    openAiSdkConnected: false,
    aiSdkConnected: false,
    apiKeyRead: false,
    envRead: false,
    apiRouteIntegrated: false,
    simulatorIntegrated: false,
    decisionEngineRuntimeConnected: false,
    uiIntegrated: false,
  };
}

function error(
  code: AIIntegrationErrorCode,
  message: string,
): AIIntegrationError {
  return {
    code,
    message,
    recoverable: false,
  };
}

function blocked(input: {
  reason: AIIntegrationErrorCode;
  message: string;
  compositionId?: string;
  inputFingerprint?: string;
  promptContextBoundary?: PromptContextBoundaryResult;
  aiIntegrationPreflight?: AIIntegrationPreflightResult;
  aiProviderBoundary?: AIProviderBoundaryResult;
  aiQualityBoundary?: AiQualityBoundaryEvaluationResult;
  evidence?: AIIntegrationBoundaryCompositionEvidence;
}): AIIntegrationBoundaryCompositionResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_INTEGRATION_BOUNDARY_COMPOSITION_VERSION,
    compositionId: input.compositionId,
    inputFingerprint: input.inputFingerprint,
    reason: input.reason,
    error: error(input.reason, input.message),
    promptContextBoundary: input.promptContextBoundary,
    aiIntegrationPreflight: input.aiIntegrationPreflight,
    aiProviderBoundary: input.aiProviderBoundary,
    aiQualityBoundary: input.aiQualityBoundary,
    evidence: input.evidence ?? evidence(),
  };
}

function isTimestampValid(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function hasUnsafeClientFields(
  fields: AIIntegrationForbiddenClientFields | undefined,
): boolean {
  return Boolean(
    fields?.apiKey ||
      fields?.envVarName ||
      fields?.providerSecret ||
      fields?.rawPrompt ||
      fields?.rawChatMessages?.length ||
      fields?.userSystemPrompt ||
      fields?.providerPayload !== undefined ||
      fields?.modelCallPayload !== undefined ||
      fields?.modelId ||
      fields?.providerExecution ||
      fields?.modelCall ||
      fields?.streaming ||
      fields?.apiRoute ||
      fields?.simulatorRuntime ||
      fields?.decisionEngineRuntime ||
      fields?.uiRuntime,
  );
}

function policyIsSafe(
  input: Partial<AIIntegrationBoundaryCompositionInput>,
): boolean {
  const policy = input.policy;

  return policy?.mode === "decision_simulation_ai_integration_preflight" &&
    policy.requirePromptContextBoundary === true &&
    policy.requireAIProviderBoundaryPreflight === true &&
    policy.requireAIQualityBoundary === true &&
    policy.requireStructuredDecisionSimulationFrame === true &&
    policy.allowProviderExecution === false &&
    policy.allowModelCalls === false &&
    policy.allowStreaming === false &&
    policy.allowApiRoutes === false &&
    policy.allowSimulatorRuntime === false &&
    policy.allowDecisionEngineRuntime === false &&
    policy.allowUiRuntime === false;
}

function promptContextBoundaryIsReady(
  result: PromptContextBoundaryResult | undefined,
): result is Extract<PromptContextBoundaryResult, { status: "ready" }> {
  return result?.status === "ready" &&
    result.version === PROMPT_CONTEXT_BOUNDARY_VERSION &&
    result.execution === "boundary_facade_only" &&
    result.evidence.modelCallExecuted === false &&
    result.evidence.aiProviderRuntimeCalled === false &&
    result.evidence.envRead === false &&
    result.evidence.apiKeyRead === false &&
    result.evidence.apiRouteIntegrated === false &&
    result.evidence.simulatorRuntimeIntegrated === false &&
    result.evidence.decisionEngineRuntimeIntegrated === false &&
    result.evidence.uiIntegrated === false &&
    result.output.modelCallExecuted === false &&
    result.output.aiProviderRuntimeCalled === false &&
    result.output.directAnswerMode === false &&
    result.output.genericAssistantMode === false &&
    result.output.chatMode === false;
}

function aiIntegrationPreflightIsAllowed(
  result: AIIntegrationPreflightResult,
): result is Extract<AIIntegrationPreflightResult, { status: "allowed" }> {
  return result.status === "allowed" &&
    result.evidence.modelCallExecuted === false &&
    result.evidence.openAiSdkConnected === false &&
    result.evidence.envRead === false &&
    result.evidence.apiRouteIntegrated === false &&
    result.evidence.simulatorIntegrated === false &&
    result.evidence.decisionEngineRuntimeConnected === false &&
    result.evidence.uiIntegrated === false;
}

function aiProviderBoundaryIsReady(
  result: AIProviderBoundaryResult | undefined,
): result is Extract<AIProviderBoundaryResult, { status: "ready" }> {
  return result?.status === "ready" &&
    result.version === AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION &&
    result.execution === "controlled_boundary_preflight_only" &&
    result.modelCallExecuted === false &&
    result.preflight.modelCallExecuted === false &&
    result.preflight.execution === "provider_selection_preflight_only";
}

function aiQualityBoundaryIsAllowed(
  result: AiQualityBoundaryEvaluationResult | undefined,
): result is Extract<AiQualityBoundaryEvaluationResult, { status: "allowed" }> {
  return result?.status === "allowed" &&
    result.version === AI_QUALITY_BOUNDARY_VERSION &&
    result.execution === "boundary_preflight_only" &&
    result.evidence.modelCallExecuted === false &&
    result.evidence.openAiSdkConnected === false &&
    result.evidence.apiKeysRead === false &&
    result.evidence.envVariablesRead === false &&
    result.evidence.apiRouteIntegrated === false &&
    result.evidence.simulatorIntegrated === false &&
    result.evidence.decisionEngineRuntimeConnected === false &&
    result.evidence.uiIntegrated === false &&
    result.evidence.aiProviderRuntimeConnected === false &&
    result.evidence.promptContextRuntimeConnected === false;
}

function runtimeIsCompositionSafe(
  config: AIIntegrationBoundaryCompositionConfig,
): boolean {
  return config.runtime.modelCallsEnabled === false &&
    config.runtime.providerExecutionEnabled === false &&
    config.runtime.streamingEnabled === false &&
    config.runtime.apiRoutesEnabled === false &&
    config.runtime.simulatorRuntimeEnabled === false &&
    config.runtime.decisionEngineRuntimeEnabled === false &&
    config.runtime.uiRuntimeEnabled === false;
}

export function composeAIIntegrationBoundaries(
  config: AIIntegrationBoundaryCompositionConfig,
  input: Partial<AIIntegrationBoundaryCompositionInput> | null | undefined,
): AIIntegrationBoundaryCompositionResult {
  if (!config.enabled) {
    return blocked({
      reason: "composition_disabled",
      message:
        "Controlled AI integration boundary composition is disabled by default.",
    });
  }

  if (!input) {
    return blocked({
      reason: "composition_request_missing",
      message: "Controlled AI integration boundary composition requires input.",
    });
  }

  if (!input.compositionId) {
    return blocked({
      reason: "composition_id_missing",
      message:
        "Controlled AI integration boundary composition requires compositionId.",
    });
  }

  if (!isTimestampValid(input.requestedAt)) {
    return blocked({
      reason: "composition_timestamp_invalid",
      message:
        "Controlled AI integration boundary composition requires a valid timestamp.",
      compositionId: input.compositionId,
    });
  }

  if (!input.inputFingerprint?.trim()) {
    return blocked({
      reason: "composition_input_fingerprint_missing",
      message:
        "Controlled AI integration boundary composition requires input fingerprint.",
      compositionId: input.compositionId,
    });
  }

  if (!policyIsSafe(input)) {
    return blocked({
      reason: "composition_policy_invalid",
      message:
        "Controlled AI integration boundary composition policy must remain preflight-only.",
      compositionId: input.compositionId,
      inputFingerprint: input.inputFingerprint,
    });
  }

  if (hasUnsafeClientFields(input.clientRuntimeFields)) {
    return blocked({
      reason: "unsafe_client_field_rejected",
      message:
        "Controlled AI integration boundary composition rejects prompt, provider, key, streaming, and product runtime fields.",
      compositionId: input.compositionId,
      inputFingerprint: input.inputFingerprint,
    });
  }

  if (!runtimeIsCompositionSafe(config)) {
    return blocked({
      reason: "composition_runtime_isolation_failed",
      message:
        "Controlled AI integration boundary composition requires an execution-free runtime preflight foundation.",
      compositionId: input.compositionId,
      inputFingerprint: input.inputFingerprint,
    });
  }

  if (!promptContextBoundaryIsReady(input.promptContextBoundary)) {
    return blocked({
      reason: "prompt_context_boundary_blocked",
      message:
        "Prompt Context boundary result must be ready, boundary-only, and integration-free.",
      compositionId: input.compositionId,
      inputFingerprint: input.inputFingerprint,
      promptContextBoundary: input.promptContextBoundary,
    });
  }

  const preflight = config.runtime.validate({
    input: input.preflightInput,
  });

  if (!aiIntegrationPreflightIsAllowed(preflight)) {
    return blocked({
      reason: "ai_integration_preflight_blocked",
      message:
        "AI Integration preflight runtime must return an allowed preflight result.",
      compositionId: input.compositionId,
      inputFingerprint: input.inputFingerprint,
      promptContextBoundary: input.promptContextBoundary,
      aiIntegrationPreflight: preflight,
      evidence: evidence({
        promptContextBoundaryComposed: true,
      }),
    });
  }

  if (!aiProviderBoundaryIsReady(input.aiProviderBoundary)) {
    return blocked({
      reason: "ai_provider_boundary_blocked",
      message:
        "AI Provider boundary result must be ready, preflight-only, and model-call-free.",
      compositionId: input.compositionId,
      inputFingerprint: input.inputFingerprint,
      promptContextBoundary: input.promptContextBoundary,
      aiIntegrationPreflight: preflight,
      aiProviderBoundary: input.aiProviderBoundary,
      evidence: evidence({
        promptContextBoundaryComposed: true,
        aiIntegrationRuntimePreflightComposed: true,
      }),
    });
  }

  if (!aiQualityBoundaryIsAllowed(input.aiQualityBoundary)) {
    return blocked({
      reason: "ai_quality_boundary_blocked",
      message:
        "AI Quality boundary result must be allowed, preflight-only, and model-call-free.",
      compositionId: input.compositionId,
      inputFingerprint: input.inputFingerprint,
      promptContextBoundary: input.promptContextBoundary,
      aiIntegrationPreflight: preflight,
      aiProviderBoundary: input.aiProviderBoundary,
      aiQualityBoundary: input.aiQualityBoundary,
      evidence: evidence({
        promptContextBoundaryComposed: true,
        aiIntegrationRuntimePreflightComposed: true,
        aiProviderBoundaryComposed: true,
      }),
    });
  }

  return {
    status: "allowed",
    execution: "boundary_composition_preflight_only",
    version: AI_INTEGRATION_BOUNDARY_COMPOSITION_VERSION,
    compositionId: input.compositionId,
    inputFingerprint: input.inputFingerprint,
    promptContextBoundary: input.promptContextBoundary,
    aiIntegrationPreflight: preflight,
    aiProviderBoundary: input.aiProviderBoundary,
    aiQualityBoundary: input.aiQualityBoundary,
    evidence: evidence({
      promptContextBoundaryComposed: true,
      aiIntegrationRuntimePreflightComposed: true,
      aiProviderBoundaryComposed: true,
      aiQualityBoundaryComposed: true,
    }),
  };
}

export function createAIIntegrationBoundaryCompositionFoundation(
  config: AIIntegrationBoundaryCompositionConfig = DEFAULT_AI_INTEGRATION_BOUNDARY_COMPOSITION_CONFIG,
): AIIntegrationBoundaryCompositionFoundation {
  return {
    version: AI_INTEGRATION_BOUNDARY_COMPOSITION_VERSION,
    mode: AI_INTEGRATION_BOUNDARY_COMPOSITION_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    providerExecutionEnabled: false,
    streamingEnabled: false,
    apiRoutesEnabled: false,
    simulatorRuntimeEnabled: false,
    decisionEngineRuntimeEnabled: false,
    uiRuntimeEnabled: false,
    compose: (input) => composeAIIntegrationBoundaries(config, input),
  };
}
