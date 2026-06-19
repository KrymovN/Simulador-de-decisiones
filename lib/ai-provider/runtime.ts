import {
  DEFAULT_AI_PROVIDER_ADAPTER_CONFIG,
  DEFAULT_AI_PROVIDER_DEFINITIONS,
  createAiProviderAdapterContractsFoundation,
} from "./validation";
import {
  AI_PROVIDER_ADAPTER_RUNTIME_MODE,
  AI_PROVIDER_ADAPTER_RUNTIME_VERSION,
  type AiProviderAdapterConfig,
  type AiProviderAdapterEvaluationResult,
  type AiProviderAdapterRequestContract,
  type AiProviderAdapterRuntimeBlockedReason,
  type AiProviderAdapterRuntimeConfig,
  type AiProviderAdapterRuntimeEvaluationInput,
  type AiProviderAdapterRuntimeEvaluationResult,
  type AiProviderAdapterRuntimeFoundation,
  type AiProviderAdapterRuntimeSafetyEvidence,
  type AiProviderAdapterRuntimeSelection,
  type AiProviderCapability,
  type AiProviderDefinition,
  type AiProviderId,
  type AiProviderModelPolicy,
} from "./contracts";

export const DEFAULT_AI_PROVIDER_ADAPTER_RUNTIME_CONFIG: AiProviderAdapterRuntimeConfig =
  {
    enabled: false,
    adapterConfig: {
      ...DEFAULT_AI_PROVIDER_ADAPTER_CONFIG,
      enabled: true,
      providers: DEFAULT_AI_PROVIDER_DEFINITIONS,
    },
    allowedProviders: ["openai", "local_contract_stub"],
    selectionStrategy: "requested_provider_first",
  };

export function aiProviderAdapterRuntimeSafetyEvidence(): AiProviderAdapterRuntimeSafetyEvidence {
  return {
    stage: "5.1B",
    aiProviderOnly: true,
    runtimeFoundationOnly: true,
    contractsFoundationUsed: true,
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
    stage51CStarted: false,
    stage52Started: false,
    stage53Started: false,
    rollback: "disable_ai_provider_adapter_runtime_or_remove_runtime_exports",
  };
}

function blocked(input: {
  reason: AiProviderAdapterRuntimeBlockedReason;
  message: string;
  selection?: AiProviderAdapterRuntimeSelection;
  selectedRequest?: AiProviderAdapterRequestContract;
  contractResult?: AiProviderAdapterEvaluationResult;
}): AiProviderAdapterRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_PROVIDER_ADAPTER_RUNTIME_VERSION,
    reason: input.reason,
    message: input.message,
    selection: input.selection,
    selectedRequest: input.selectedRequest,
    contractResult: input.contractResult,
    evidence: aiProviderAdapterRuntimeSafetyEvidence(),
  };
}

function providerIsAllowed(
  providerId: AiProviderId,
  allowedProviders: AiProviderId[],
): boolean {
  return allowedProviders.includes(providerId);
}

function findCapableModel(
  provider: AiProviderDefinition,
  capability: AiProviderCapability,
): AiProviderModelPolicy | undefined {
  return provider.models.find(
    (model) =>
      model.status === "available" &&
      model.supportsStructuredOutput &&
      model.capabilities.includes(capability),
  );
}

function providerCanServe(
  provider: AiProviderDefinition,
  capability: AiProviderCapability,
): boolean {
  return (
    provider.status === "available" &&
    provider.supportedCapabilities.includes(capability) &&
    Boolean(findCapableModel(provider, capability))
  );
}

function candidateProviderIds(
  config: AiProviderAdapterRuntimeConfig,
  input: AiProviderAdapterRuntimeEvaluationInput,
  request: AiProviderAdapterRequestContract,
): AiProviderId[] {
  const allowedProviders = input.allowedProviders ?? config.allowedProviders;
  const preferred = input.providerPreference ?? [];

  if (config.selectionStrategy === "first_capable_provider") {
    return [...preferred, ...allowedProviders].filter(
      (providerId, index, all) => all.indexOf(providerId) === index,
    );
  }

  return [request.providerId, ...preferred, ...allowedProviders].filter(
    (providerId, index, all) => all.indexOf(providerId) === index,
  );
}

function selectProvider(input: {
  config: AiProviderAdapterRuntimeConfig;
  request: AiProviderAdapterRequestContract;
  allowedProviders: AiProviderId[];
  providerIds: AiProviderId[];
}): {
  selection: AiProviderAdapterRuntimeSelection;
  selectedRequest: AiProviderAdapterRequestContract;
} | undefined {
  for (const providerId of input.providerIds) {
    if (!providerIsAllowed(providerId, input.allowedProviders)) {
      continue;
    }

    const provider = input.config.adapterConfig.providers.find(
      (candidate) => candidate.providerId === providerId,
    );

    if (!provider || !providerCanServe(provider, input.request.capability)) {
      continue;
    }

    const model = findCapableModel(provider, input.request.capability);

    if (!model) {
      continue;
    }

    return {
      selection: {
        providerId,
        modelId: model.modelId,
        strategy: input.config.selectionStrategy,
        source: "runtime_preflight_selection",
      },
      selectedRequest: {
        ...input.request,
        providerId,
        constraints: {
          ...input.request.constraints,
          modelId: model.modelId,
          maxInputTokens: Math.min(
            input.request.constraints.maxInputTokens,
            model.maxInputTokens,
          ),
          maxOutputTokens: Math.min(
            input.request.constraints.maxOutputTokens,
            model.maxOutputTokens,
          ),
        },
      },
    };
  }

  return undefined;
}

function contractEvidenceIsIsolated(
  result: AiProviderAdapterEvaluationResult,
): boolean {
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
    evidence.stage53Started === false;
}

function runtimeAdapterConfig(
  config: AiProviderAdapterRuntimeConfig,
): AiProviderAdapterConfig {
  return {
    ...config.adapterConfig,
    enabled: true,
  };
}

export function evaluateAiProviderAdapterRuntime(
  config: AiProviderAdapterRuntimeConfig,
  input: AiProviderAdapterRuntimeEvaluationInput,
): AiProviderAdapterRuntimeEvaluationResult {
  if (!config.enabled) {
    return blocked({
      reason: "ai_provider_runtime_disabled",
      message: "AI provider adapter runtime foundation is disabled by default.",
    });
  }

  if (!input.request) {
    return blocked({
      reason: "request_missing",
      message: "AI provider adapter runtime requires a request contract.",
    });
  }

  const allowedProviders = input.allowedProviders ?? config.allowedProviders;

  if (!providerIsAllowed(input.request.providerId, allowedProviders)) {
    return blocked({
      reason: "provider_not_allowed",
      message: "Requested AI provider is not allowed by runtime policy.",
    });
  }

  const selected = selectProvider({
    config,
    request: input.request,
    allowedProviders,
    providerIds: candidateProviderIds(config, input, input.request),
  });

  if (!selected) {
    return blocked({
      reason: "provider_selection_failed",
      message:
        "AI provider adapter runtime could not select a capable provider and model.",
    });
  }

  const contractResult = createAiProviderAdapterContractsFoundation(
    runtimeAdapterConfig(config),
  ).evaluateRequest(selected.selectedRequest);

  if (!contractEvidenceIsIsolated(contractResult)) {
    return blocked({
      reason: "runtime_contract_isolation_failed",
      message:
        "AI provider adapter contracts result did not preserve isolation evidence.",
      selection: selected.selection,
      selectedRequest: selected.selectedRequest,
      contractResult,
    });
  }

  if (contractResult.status === "blocked") {
    return blocked({
      reason: contractResult.error.code,
      message: contractResult.error.message,
      selection: selected.selection,
      selectedRequest: selected.selectedRequest,
      contractResult,
    });
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    version: AI_PROVIDER_ADAPTER_RUNTIME_VERSION,
    selection: selected.selection,
    selectedRequest: selected.selectedRequest,
    contractResult,
    evidence: aiProviderAdapterRuntimeSafetyEvidence(),
  };
}

export function createAiProviderAdapterRuntimeFoundation(
  config: AiProviderAdapterRuntimeConfig = DEFAULT_AI_PROVIDER_ADAPTER_RUNTIME_CONFIG,
): AiProviderAdapterRuntimeFoundation {
  return {
    version: AI_PROVIDER_ADAPTER_RUNTIME_VERSION,
    mode: AI_PROVIDER_ADAPTER_RUNTIME_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    evaluate: (input) => evaluateAiProviderAdapterRuntime(config, input),
  };
}
