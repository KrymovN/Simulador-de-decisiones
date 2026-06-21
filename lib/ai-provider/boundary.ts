import {
  AI_PROVIDER_CONTROLLED_BOUNDARY_MODE,
  AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
  type AIProviderBoundary,
  type AIProviderBoundaryConfig,
  type AIProviderBoundaryError,
  type AIProviderBoundaryErrorCode,
  type AIProviderBoundaryRequest,
  type AIProviderBoundaryResult,
  type AIProviderCapability,
  type AIProviderRuntimePreflightResult,
} from "./contracts";
import {
  DEFAULT_AI_PROVIDER_RUNTIME_SELECTION_CONFIG,
  createAIProviderRuntimeSelection,
} from "./runtime";

export const DEFAULT_AI_PROVIDER_BOUNDARY_CONFIG: AIProviderBoundaryConfig = {
  enabled: false,
  runtime: createAIProviderRuntimeSelection(
    DEFAULT_AI_PROVIDER_RUNTIME_SELECTION_CONFIG,
  ),
};

function error(
  code: AIProviderBoundaryErrorCode,
  message: string,
): AIProviderBoundaryError {
  return {
    code,
    message,
    recoverable: false,
  };
}

function blocked(input: {
  providerId?: string;
  capability?: AIProviderCapability;
  preflight?: AIProviderRuntimePreflightResult;
  code: AIProviderBoundaryErrorCode;
  message: string;
}): AIProviderBoundaryResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
    providerId: input.providerId,
    capability: input.capability,
    preflight: input.preflight,
    modelCallExecuted: false,
    error: error(input.code, input.message),
  };
}

function hasBoundaryRuntimeFields(input: AIProviderBoundaryRequest): boolean {
  return Boolean(
    input.clientRuntimeFields?.apiKey ||
      input.clientRuntimeFields?.envVarName ||
      input.clientRuntimeFields?.rawPrompt ||
      input.clientRuntimeFields?.providerSecret ||
      input.rawPrompt ||
      input.providerSecret ||
      input.request?.clientRuntimeFields?.apiKey ||
      input.request?.clientRuntimeFields?.envVarName ||
      input.request?.clientRuntimeFields?.rawPrompt ||
      input.request?.clientRuntimeFields?.providerSecret,
  );
}

export function evaluateAIProviderBoundary(
  config: AIProviderBoundaryConfig,
  input: AIProviderBoundaryRequest,
): AIProviderBoundaryResult {
  if (!config.enabled) {
    return blocked({
      code: "boundary_disabled",
      message: "AI provider controlled boundary is disabled by default.",
    });
  }

  if (!input.request) {
    return blocked({
      code: "request_missing",
      message: "AI provider controlled boundary requires a request payload.",
    });
  }

  if (input.unexpectedPayload !== undefined) {
    return blocked({
      providerId: input.request.providerId,
      capability: input.request.capability,
      code: "payload_rejected",
      message: "AI provider controlled boundary rejects unexpected payloads.",
    });
  }

  if (hasBoundaryRuntimeFields(input)) {
    return blocked({
      providerId: input.request.providerId,
      capability: input.request.capability,
      code: "client_runtime_field_rejected",
      message: "AI provider controlled boundary rejects raw prompts, secrets, and client runtime fields.",
    });
  }

  const preflight = config.runtime.selectProvider({
    request: input.request,
    preferredProviderIds: input.preferredProviderIds,
    selectionStrategy: input.selectionStrategy,
  });

  if (preflight.status === "blocked") {
    return blocked({
      providerId: preflight.providerId,
      capability: preflight.capability,
      preflight,
      code: "runtime_preflight_blocked",
      message: "AI provider controlled boundary blocked after runtime preflight.",
    });
  }

  return {
    status: "ready",
    execution: "controlled_boundary_preflight_only",
    version: AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
    providerId: preflight.providerId,
    capability: preflight.capability,
    preflight,
    modelCallExecuted: false,
  };
}

export function createAIProviderBoundary(
  config: AIProviderBoundaryConfig = DEFAULT_AI_PROVIDER_BOUNDARY_CONFIG,
): AIProviderBoundary {
  return {
    version: AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
    mode: AI_PROVIDER_CONTROLLED_BOUNDARY_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    evaluate: (input) => evaluateAIProviderBoundary(config, input),
  };
}
