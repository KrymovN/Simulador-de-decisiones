import {
  AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION,
  AI_INTEGRATION_PREFLIGHT_RUNTIME_MODE,
  AI_INTEGRATION_PREFLIGHT_RUNTIME_VERSION,
  type AIIntegrationContractsFoundation,
  type AIIntegrationError,
  type AIIntegrationErrorCode,
  type AIIntegrationPreflightOperation,
  type AIIntegrationPreflightResult,
  type AIIntegrationRuntimeConfig,
  type AIIntegrationRuntimeFoundation,
  type AIIntegrationRuntimePreflightRequest,
} from "./contracts";
import {
  DEFAULT_AI_INTEGRATION_CONTRACTS_CONFIG,
  aiIntegrationSafetyEvidence,
  createAIIntegrationContractsFoundation,
} from "./validation";

export const DEFAULT_AI_INTEGRATION_RUNTIME_CONFIG: AIIntegrationRuntimeConfig =
  {
    enabled: false,
    contracts: createAIIntegrationContractsFoundation({
      ...DEFAULT_AI_INTEGRATION_CONTRACTS_CONFIG,
      enabled: true,
    }),
    failClosedOnContractBlock: true,
  };

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
  code: AIIntegrationErrorCode;
  message: string;
  preflightId?: string;
  operation?: AIIntegrationPreflightOperation;
}): AIIntegrationPreflightResult {
  return {
    status: "blocked",
    execution: "none",
    version: AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION,
    preflightId: input.preflightId,
    operation: input.operation,
    error: error(input.code, input.message),
    evidence: aiIntegrationSafetyEvidence(),
  };
}

function contractsAreRuntimeSafe(
  contracts: AIIntegrationContractsFoundation,
): boolean {
  return contracts.modelCallsEnabled === false &&
    contracts.providerExecutionEnabled === false &&
    contracts.streamingEnabled === false &&
    contracts.apiRoutesEnabled === false &&
    contracts.simulatorRuntimeEnabled === false &&
    contracts.decisionEngineRuntimeEnabled === false &&
    contracts.uiRuntimeEnabled === false;
}

function resultEvidenceIsRuntimeSafe(
  result: AIIntegrationPreflightResult,
): boolean {
  const evidence = result.evidence;

  return evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.envRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.providerExecutionCompleted === false &&
    evidence.aiSdkConnected === false &&
    evidence.apiKeyRead === false &&
    evidence.providerExecutionAllowed === false &&
    evidence.streamingAllowed === false &&
    evidence.rawPromptAllowed === false &&
    evidence.providerPayloadAllowed === false &&
    evidence.modelCallPayloadAllowed === false;
}

function normalizeOperation(
  value: unknown,
): AIIntegrationPreflightOperation | undefined {
  return value === "controlled_ai_integration_preflight" ? value : undefined;
}

export function validateAIIntegrationRuntimePreflight(
  config: AIIntegrationRuntimeConfig,
  request: AIIntegrationRuntimePreflightRequest,
): AIIntegrationPreflightResult {
  if (!config.enabled) {
    return blocked({
      code: "runtime_disabled",
      message:
        "Controlled AI integration runtime validation is disabled by default.",
    });
  }

  if (!request.input) {
    return blocked({
      code: "runtime_request_missing",
      message:
        "Controlled AI integration runtime validation requires preflight input.",
    });
  }

  if (!contractsAreRuntimeSafe(config.contracts)) {
    return blocked({
      code: "runtime_isolation_failed",
      message:
        "Controlled AI integration runtime validation requires execution-free contracts.",
      preflightId: request.input.preflightId,
      operation: normalizeOperation(request.input.operation),
    });
  }

  const contractResult = config.contracts.validatePreflight(request.input);

  if (!resultEvidenceIsRuntimeSafe(contractResult)) {
    return blocked({
      code: "runtime_isolation_failed",
      message:
        "Controlled AI integration preflight result did not preserve runtime isolation evidence.",
      preflightId: contractResult.preflightId,
      operation: contractResult.operation,
    });
  }

  if (contractResult.status === "blocked" && config.failClosedOnContractBlock) {
    return blocked({
      code: "contract_preflight_blocked",
      message:
        "Controlled AI integration runtime validation blocked after contract preflight.",
      preflightId: contractResult.preflightId,
      operation: contractResult.operation,
    });
  }

  const outputValidation = config.contracts.validateOutput(contractResult);

  if (
    outputValidation.status === "blocked" ||
    !resultEvidenceIsRuntimeSafe(outputValidation)
  ) {
    return blocked({
      code: "runtime_output_validation_failed",
      message:
        "Controlled AI integration runtime validation failed output validation.",
      preflightId: contractResult.preflightId,
      operation: contractResult.operation,
    });
  }

  return outputValidation;
}

export function createAIIntegrationRuntimeFoundation(
  config: AIIntegrationRuntimeConfig = DEFAULT_AI_INTEGRATION_RUNTIME_CONFIG,
): AIIntegrationRuntimeFoundation {
  return {
    version: AI_INTEGRATION_PREFLIGHT_RUNTIME_VERSION,
    mode: AI_INTEGRATION_PREFLIGHT_RUNTIME_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    providerExecutionEnabled: false,
    streamingEnabled: false,
    apiRoutesEnabled: false,
    simulatorRuntimeEnabled: false,
    decisionEngineRuntimeEnabled: false,
    uiRuntimeEnabled: false,
    validate: (request) => validateAIIntegrationRuntimePreflight(config, request),
  };
}
