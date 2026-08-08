import "server-only";

import {
  DecisionMaterialTransportFailure,
  OPENAI_DECISION_MATERIAL_PROVIDER,
  type DecisionMaterialAdapterExecutionConfig,
  type DecisionMaterialTransport,
} from "../ai-provider/openai-decision-material-adapter";
import {
  createOpenAIDecisionMaterialTransport,
  readOpenAIEnvironmentConfiguration,
} from "../ai-provider/openai-synthetic-risk-adapter.server";
import {
  executeProductionDecisionSimulationFlow,
  type ProductionDecisionSimulationOrchestratorResult,
} from "./production-decision-simulation-orchestrator";

export const PRODUCTION_DECISION_SIMULATION_COMPOSITION_ROOT_VERSION =
  "stage-9-production-decision-simulation-composition-root.1" as const;

export type ProductionDecisionSimulationEnvironment = Readonly<
  Record<string, string | undefined> & {
    LEVIO_REAL_AI_DEV_ENABLED?: string;
    LEVIO_AI_PROVIDER?: string;
    OPENAI_API_KEY?: string;
  }
>;

export type ProductionDecisionSimulationBindingErrorCode =
  | "runtime_disabled"
  | "provider_not_approved"
  | "credentials_unavailable"
  | "transport_initialization_failed";

export type ProductionDecisionSimulationCompositionRootBinding =
  | {
      status: "ready";
      serverOnly: true;
      environmentValidated: true;
      credentialsExposed: false;
      providerControlledByServer: true;
      modelControlledByAdapter: true;
      publicRuntimeIntegrated: false;
    }
  | {
      status: "blocked";
      serverOnly: true;
      environmentValidated: false;
      credentialsExposed: false;
      providerControlledByServer: true;
      modelControlledByAdapter: true;
      publicRuntimeIntegrated: false;
      error: {
        code: ProductionDecisionSimulationBindingErrorCode;
        message: string;
        retryable: false;
      };
    };

export type ProductionDecisionSimulationCompositionRoot = {
  version: typeof PRODUCTION_DECISION_SIMULATION_COMPOSITION_ROOT_VERSION;
  execution: "server_only_production_composition_root";
  binding: ProductionDecisionSimulationCompositionRootBinding;
  execute(request: unknown): Promise<ProductionDecisionSimulationOrchestratorResult>;
};

export type OpenAIDecisionMaterialTransportFactory = (
  apiKey: string,
) => DecisionMaterialTransport;

const blockedMessages: Record<ProductionDecisionSimulationBindingErrorCode, string> = {
  runtime_disabled: "The server-only production AI runtime is disabled.",
  provider_not_approved: "The server-side provider configuration is not approved.",
  credentials_unavailable: "Server credentials are unavailable.",
  transport_initialization_failed: "The server-only provider transport could not be initialized.",
};

function blockedBinding(
  code: ProductionDecisionSimulationBindingErrorCode,
): Extract<ProductionDecisionSimulationCompositionRootBinding, { status: "blocked" }> {
  return {
    status: "blocked",
    serverOnly: true,
    environmentValidated: false,
    credentialsExposed: false,
    providerControlledByServer: true,
    modelControlledByAdapter: true,
    publicRuntimeIntegrated: false,
    error: {
      code,
      message: blockedMessages[code],
      retryable: false,
    },
  };
}

function readyBinding(): Extract<
  ProductionDecisionSimulationCompositionRootBinding,
  { status: "ready" }
> {
  return {
    status: "ready",
    serverOnly: true,
    environmentValidated: true,
    credentialsExposed: false,
    providerControlledByServer: true,
    modelControlledByAdapter: true,
    publicRuntimeIntegrated: false,
  };
}

function closedTransport(
  category: "credentials_unavailable" | "provider_unavailable",
): DecisionMaterialTransport {
  const fail = async (): Promise<never> => {
    throw new DecisionMaterialTransportFailure(category);
  };
  return {
    countInput: fail,
    generate: fail,
  };
}

function environmentBinding(environment: ProductionDecisionSimulationEnvironment): {
  binding: ProductionDecisionSimulationCompositionRootBinding;
  config: Omit<DecisionMaterialAdapterExecutionConfig, "transport">;
  apiKey?: string;
} {
  const enabled = environment.LEVIO_REAL_AI_DEV_ENABLED === "true";
  const provider = environment.LEVIO_AI_PROVIDER;
  const apiKey = environment.OPENAI_API_KEY;
  const apiKeyAvailable = typeof apiKey === "string" && apiKey.trim().length > 0;

  if (!enabled) {
    return {
      binding: blockedBinding("runtime_disabled"),
      config: { enabled: false, apiKeyAvailable, provider },
    };
  }
  if (provider !== OPENAI_DECISION_MATERIAL_PROVIDER) {
    return {
      binding: blockedBinding("provider_not_approved"),
      config: { enabled: true, apiKeyAvailable, provider },
    };
  }
  if (!apiKeyAvailable) {
    return {
      binding: blockedBinding("credentials_unavailable"),
      config: { enabled: true, apiKeyAvailable: false, provider },
    };
  }
  return {
    binding: readyBinding(),
    config: { enabled: true, apiKeyAvailable: true, provider },
    apiKey,
  };
}

/**
 * Internal binding seam for offline validation. It is not part of the shared
 * barrel and keeps environment/transport controls outside every product request.
 */
export function bindProductionDecisionSimulationCompositionRoot(
  environment: ProductionDecisionSimulationEnvironment,
  transportFactory: OpenAIDecisionMaterialTransportFactory,
): ProductionDecisionSimulationCompositionRoot {
  const resolved = environmentBinding(environment);
  let binding = resolved.binding;
  let transport = closedTransport("credentials_unavailable");

  if (resolved.binding.status === "ready" && resolved.apiKey) {
    try {
      transport = transportFactory(resolved.apiKey);
    } catch {
      binding = blockedBinding("transport_initialization_failed");
      transport = closedTransport("provider_unavailable");
    }
  }

  const config: DecisionMaterialAdapterExecutionConfig = {
    ...resolved.config,
    transport,
  };

  return {
    version: PRODUCTION_DECISION_SIMULATION_COMPOSITION_ROOT_VERSION,
    execution: "server_only_production_composition_root",
    binding,
    execute(request) {
      return executeProductionDecisionSimulationFlow(request, config);
    },
  };
}

/**
 * Production server-only composition root. The only execution argument is the
 * canonical orchestrator request; provider, model, key, transport, and runtime
 * controls are resolved internally and cannot be supplied by client input.
 */
export function createProductionDecisionSimulationCompositionRoot():
  ProductionDecisionSimulationCompositionRoot {
  return bindProductionDecisionSimulationCompositionRoot(
    readOpenAIEnvironmentConfiguration(),
    createOpenAIDecisionMaterialTransport,
  );
}
