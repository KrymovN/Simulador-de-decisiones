import {
  PROMPT_CONTEXT_BOUNDARY_MODE,
  PROMPT_CONTEXT_BOUNDARY_VERSION,
  type PromptContextBoundary,
  type PromptContextBoundaryConfig,
  type PromptContextBoundaryError,
  type PromptContextBoundaryErrorCode,
  type PromptContextBoundaryEvidence,
  type PromptContextBoundaryRequest,
  type PromptContextBoundaryResult,
  type PromptContextForbiddenClientFields,
  type PromptContextRuntimeError,
  type PromptContextRuntimeResult,
} from "./contracts";
import {
  DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG,
  createPromptContextRuntime,
} from "./runtime";

export const DEFAULT_PROMPT_CONTEXT_BOUNDARY_CONFIG: PromptContextBoundaryConfig =
  {
    enabled: false,
    runtime: createPromptContextRuntime(DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG),
  };

function boundaryEvidence(): PromptContextBoundaryEvidence {
  return {
    stage: "5.2C",
    promptContextOnly: true,
    boundaryOnly: true,
    runtimeFoundationUsed: true,
    providerAgnostic: true,
    decisionSimulationFramePreserved: true,
    rawChatMessagesAllowed: false,
    userSystemPromptAllowed: false,
    directAnswerModeAllowed: false,
    genericAssistantBehaviorAllowed: false,
    providerRuntimeFieldsAllowed: false,
    modelCallExecuted: false,
    aiProviderRuntimeCalled: false,
    envRead: false,
    apiKeyRead: false,
    apiRouteIntegrated: false,
    simulatorRuntimeIntegrated: false,
    decisionEngineRuntimeIntegrated: false,
    uiIntegrated: false,
    stage52DStarted: false,
    stage53Started: false,
  };
}

function boundaryError(input: {
  code: PromptContextBoundaryErrorCode;
  message: string;
  runtimeError?: PromptContextRuntimeError;
}): PromptContextBoundaryError {
  return {
    code: input.code,
    message: input.message,
    recoverable: false,
    runtimeError: input.runtimeError,
  };
}

function blocked(input: {
  requestId?: string;
  code: PromptContextBoundaryErrorCode;
  message: string;
  runtimeResult?: PromptContextRuntimeResult;
  runtimeError?: PromptContextRuntimeError;
}): PromptContextBoundaryResult {
  return {
    status: "blocked",
    execution: "none",
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    requestId: input.requestId,
    runtimeResult: input.runtimeResult,
    error: boundaryError({
      code: input.code,
      message: input.message,
      runtimeError: input.runtimeError,
    }),
    evidence: boundaryEvidence(),
  };
}

function hasUnsafeClientFields(
  fields: PromptContextForbiddenClientFields | undefined,
): boolean {
  return Boolean(
    fields?.rawChatMessages?.length ||
      fields?.rawPrompt ||
      fields?.userSystemPrompt ||
      fields?.directAnswerMode ||
      fields?.genericAssistantMode ||
      fields?.providerId ||
      fields?.modelId ||
      fields?.envVarName ||
      fields?.apiKey ||
      fields?.providerPayload,
  );
}

function boundaryHasUnsafePayload(request: PromptContextBoundaryRequest): boolean {
  return Boolean(
    hasUnsafeClientFields(request.clientFields) ||
      request.rawPrompt ||
      request.userSystemPrompt ||
      request.providerPayload,
  );
}

function runtimeResultPreservesBoundary(
  result: Extract<PromptContextRuntimeResult, { status: "ready" }>,
): boolean {
  return result.execution === "runtime_build_only" &&
    result.evidence.modelCallExecuted === false &&
    result.evidence.aiProviderRuntimeCalled === false &&
    result.evidence.decisionSimulationFramePreserved === true &&
    result.output.modelCallExecuted === false &&
    result.output.aiProviderRuntimeCalled === false &&
    result.output.directAnswerMode === false &&
    result.output.genericAssistantMode === false &&
    result.output.chatMode === false;
}

export function evaluatePromptContextBoundary(
  config: PromptContextBoundaryConfig,
  request: PromptContextBoundaryRequest,
): PromptContextBoundaryResult {
  if (!config.enabled) {
    return blocked({
      requestId: request.requestId,
      code: "boundary_disabled",
      message: "Prompt Context boundary is disabled by default.",
    });
  }

  if (!request.runtime) {
    return blocked({
      requestId: request.requestId,
      code: "boundary_request_missing",
      message: "Prompt Context boundary requires a runtime request.",
    });
  }

  if (request.unexpectedPayload !== undefined) {
    return blocked({
      requestId: request.requestId,
      code: "payload_rejected",
      message: "Prompt Context boundary rejects unexpected payloads.",
    });
  }

  if (boundaryHasUnsafePayload(request)) {
    return blocked({
      requestId: request.requestId,
      code: "unsafe_client_fields_rejected",
      message: "Prompt Context boundary rejects raw chat, system prompts, provider fields, and client runtime fields.",
    });
  }

  const runtimeResult = config.runtime.build(request.runtime);

  if (runtimeResult.status === "blocked") {
    return blocked({
      requestId: request.requestId,
      code: "runtime_build_blocked",
      message: "Prompt Context boundary blocked after runtime build.",
      runtimeResult,
      runtimeError: runtimeResult.error,
    });
  }

  if (!runtimeResultPreservesBoundary(runtimeResult)) {
    return blocked({
      requestId: request.requestId,
      code: "runtime_build_blocked",
      message: "Prompt Context runtime result did not preserve boundary constraints.",
      runtimeResult,
    });
  }

  return {
    status: "ready",
    execution: "boundary_facade_only",
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    requestId: request.requestId,
    runtimeResult,
    output: runtimeResult.output,
    evidence: boundaryEvidence(),
  };
}

export function createPromptContextBoundary(
  config: PromptContextBoundaryConfig = DEFAULT_PROMPT_CONTEXT_BOUNDARY_CONFIG,
): PromptContextBoundary {
  return {
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    mode: PROMPT_CONTEXT_BOUNDARY_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    aiProviderRuntimeEnabled: false,
    evaluate: (request) => evaluatePromptContextBoundary(config, request),
  };
}
