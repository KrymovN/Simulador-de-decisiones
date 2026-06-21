import {
  AI_PROVIDER_RUNTIME_SELECTION_MODE,
  AI_PROVIDER_RUNTIME_SELECTION_VERSION,
  type AIProviderAdapter,
  type AIProviderAvailabilityPreflight,
  type AIProviderCapability,
  type AIProviderDefinition,
  type AIProviderRequest,
  type AIProviderRuntimeError,
  type AIProviderRuntimeErrorCode,
  type AIProviderRuntimePreflightResult,
  type AIProviderRuntimeSelection,
  type AIProviderRuntimeSelectionConfig,
  type AIProviderRuntimeSelectionRequest,
  type AIProviderRuntimeSelectionStrategy,
} from "./contracts";
import {
  DEFAULT_AI_PROVIDER_ADAPTER_CONFIG,
  createAIProviderAdapter,
} from "./validation";

export const DEFAULT_AI_PROVIDER_RUNTIME_SELECTION_CONFIG: AIProviderRuntimeSelectionConfig =
  {
    enabled: false,
    adapter: createAIProviderAdapter(DEFAULT_AI_PROVIDER_ADAPTER_CONFIG),
    selectionStrategy: "requested_provider_first",
  };

function error(
  code: AIProviderRuntimeErrorCode,
  message: string,
): AIProviderRuntimeError {
  return {
    code,
    message,
    recoverable: false,
  };
}

function blocked(input: {
  providerId?: string;
  capability?: AIProviderCapability;
  selectionStrategy: AIProviderRuntimeSelectionStrategy;
  availability?: AIProviderAvailabilityPreflight;
  contractResponse?: AIProviderRuntimePreflightResult["contractResponse"];
  code: AIProviderRuntimeErrorCode;
  message: string;
}): AIProviderRuntimePreflightResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_PROVIDER_RUNTIME_SELECTION_VERSION,
    providerId: input.providerId,
    capability: input.capability,
    selectionStrategy: input.selectionStrategy,
    availability: input.availability,
    contractResponse: input.contractResponse,
    modelCallExecuted: false,
    error: error(input.code, input.message),
  };
}

function providerIsAvailable(provider: AIProviderDefinition): boolean {
  return provider.enabled && provider.availability !== "unavailable";
}

function providerSupportsCapability(
  provider: AIProviderDefinition,
  capability: AIProviderCapability | undefined,
): boolean {
  return Boolean(capability && provider.capabilities.includes(capability));
}

function availabilityFor(
  provider: AIProviderDefinition,
  capability: AIProviderCapability | undefined,
): AIProviderAvailabilityPreflight {
  const enabled = provider.enabled;
  const available = provider.availability !== "unavailable";
  const supportsCapability = providerSupportsCapability(provider, capability);

  if (!enabled) {
    return {
      providerId: provider.providerId,
      available: false,
      enabled,
      supportsCapability,
      capability,
      reason: "provider_disabled",
    };
  }

  if (!available) {
    return {
      providerId: provider.providerId,
      available: false,
      enabled,
      supportsCapability,
      capability,
      reason: "provider_unavailable",
    };
  }

  if (!supportsCapability) {
    return {
      providerId: provider.providerId,
      available,
      enabled,
      supportsCapability,
      capability,
      reason: "capability_not_supported",
    };
  }

  return {
    providerId: provider.providerId,
    available,
    enabled,
    supportsCapability,
    capability,
  };
}

function uniqueProviderIds(providerIds: string[]): string[] {
  return providerIds.filter(
    (providerId, index, all) =>
      Boolean(providerId) && all.indexOf(providerId) === index,
  );
}

function candidateProviderIds(
  adapter: AIProviderAdapter,
  input: AIProviderRuntimeSelectionRequest,
  strategy: AIProviderRuntimeSelectionStrategy,
): string[] {
  const requestedProviderId = input.request?.providerId;
  const preferredProviderIds = input.preferredProviderIds ?? [];
  const configuredProviderIds = adapter.providers.map(
    (provider) => provider.providerId,
  );

  if (strategy === "first_available_provider") {
    return uniqueProviderIds([...preferredProviderIds, ...configuredProviderIds]);
  }

  return uniqueProviderIds([
    requestedProviderId ?? "",
    ...preferredProviderIds,
    ...configuredProviderIds,
  ]);
}

function findProvider(
  providers: AIProviderDefinition[],
  providerId: string,
): AIProviderDefinition | undefined {
  return providers.find((provider) => provider.providerId === providerId);
}

function selectProvider(input: {
  adapter: AIProviderAdapter;
  request: Partial<AIProviderRequest>;
  strategy: AIProviderRuntimeSelectionStrategy;
  providerIds: string[];
}): {
  provider: AIProviderDefinition;
  availability: AIProviderAvailabilityPreflight;
} | undefined {
  for (const providerId of input.providerIds) {
    const provider = findProvider(input.adapter.providers, providerId);

    if (!provider) {
      continue;
    }

    const availability = availabilityFor(provider, input.request.capability);

    if (
      providerIsAvailable(provider) &&
      availability.supportsCapability
    ) {
      return {
        provider,
        availability,
      };
    }
  }

  return undefined;
}

function firstBlockedAvailability(input: {
  adapter: AIProviderAdapter;
  request: Partial<AIProviderRequest>;
  providerIds: string[];
}): AIProviderAvailabilityPreflight | undefined {
  for (const providerId of input.providerIds) {
    const provider = findProvider(input.adapter.providers, providerId);

    if (provider) {
      return availabilityFor(provider, input.request.capability);
    }
  }

  return undefined;
}

function runtimeErrorForAvailability(
  availability: AIProviderAvailabilityPreflight | undefined,
): AIProviderRuntimeErrorCode {
  return availability?.reason ?? "provider_missing";
}

export function resolveAIProviderRuntimePreflight(
  config: AIProviderRuntimeSelectionConfig,
  input: AIProviderRuntimeSelectionRequest,
): AIProviderRuntimePreflightResult {
  const selectionStrategy =
    input.selectionStrategy ?? config.selectionStrategy;

  if (!config.enabled) {
    return blocked({
      selectionStrategy,
      code: "runtime_disabled",
      message: "AI provider runtime selection is disabled by default.",
    });
  }

  if (!input.request) {
    return blocked({
      selectionStrategy,
      code: "request_missing",
      message: "AI provider runtime selection requires a request contract.",
    });
  }

  const providerIds = candidateProviderIds(
    config.adapter,
    input,
    selectionStrategy,
  );

  const selected = selectProvider({
    adapter: config.adapter,
    request: input.request,
    strategy: selectionStrategy,
    providerIds,
  });

  if (!selected) {
    const availability = firstBlockedAvailability({
      adapter: config.adapter,
      request: input.request,
      providerIds,
    });
    const code = runtimeErrorForAvailability(availability);

    return blocked({
      providerId: availability?.providerId ?? input.request.providerId,
      capability: input.request.capability,
      selectionStrategy,
      availability,
      code: code === "capability_not_supported" ? "provider_unsupported" : code,
      message: "AI provider runtime selection could not resolve an available provider.",
    });
  }

  const selectedRequest: Partial<AIProviderRequest> = {
    ...input.request,
    providerId: selected.provider.providerId,
  };
  const contractResponse = config.adapter.validateRequest(
    selectedRequest as AIProviderRequest,
  );

  if (contractResponse.status === "blocked") {
    return blocked({
      providerId: selected.provider.providerId,
      capability: input.request.capability,
      selectionStrategy,
      availability: selected.availability,
      contractResponse,
      code: "contract_preflight_failed",
      message: "AI provider contract preflight failed after provider selection.",
    });
  }

  return {
    status: "ready",
    execution: "provider_selection_preflight_only",
    version: AI_PROVIDER_RUNTIME_SELECTION_VERSION,
    providerId: selected.provider.providerId,
    capability: contractResponse.capability,
    selectionStrategy,
    availability: selected.availability,
    contractResponse,
    modelCallExecuted: false,
  };
}

export function createAIProviderRuntimeSelection(
  config: AIProviderRuntimeSelectionConfig = DEFAULT_AI_PROVIDER_RUNTIME_SELECTION_CONFIG,
): AIProviderRuntimeSelection {
  return {
    version: AI_PROVIDER_RUNTIME_SELECTION_VERSION,
    mode: AI_PROVIDER_RUNTIME_SELECTION_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    selectProvider: (request) =>
      resolveAIProviderRuntimePreflight(config, request),
  };
}
