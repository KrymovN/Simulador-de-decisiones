import {
  PROMPT_CONTEXT_RUNTIME_MODE,
  PROMPT_CONTEXT_RUNTIME_VERSION,
  type PromptContextContract,
  type PromptContextCreateResult,
  type PromptContextError,
  type PromptContextOutput,
  type PromptContextRuntime,
  type PromptContextRuntimeConfig,
  type PromptContextRuntimeError,
  type PromptContextRuntimeErrorCode,
  type PromptContextRuntimeEvidence,
  type PromptContextRuntimeRequest,
  type PromptContextRuntimeResult,
  type PromptContextValidationResult,
} from "./contracts";
import {
  DEFAULT_PROMPT_CONTEXT_CONTRACT_CONFIG,
  createPromptContextContract,
} from "./validation";

export const DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG: PromptContextRuntimeConfig =
  {
    enabled: false,
    contract: createPromptContextContract(DEFAULT_PROMPT_CONTEXT_CONTRACT_CONFIG),
  };

function runtimeEvidence(input: {
  structuredContextBuilt?: boolean;
} = {}): PromptContextRuntimeEvidence {
  return {
    stage: "5.2B",
    promptContextOnly: true,
    runtimeOnly: true,
    contractsFoundationUsed: true,
    providerAgnostic: true,
    decisionSimulationFramePreserved: true,
    structuredContextBuilt: input.structuredContextBuilt === true,
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
    stage52CStarted: false,
    stage53Started: false,
  };
}

function runtimeError(input: {
  code: PromptContextRuntimeErrorCode;
  message: string;
  contractError?: PromptContextError;
}): PromptContextRuntimeError {
  return {
    code: input.code,
    message: input.message,
    recoverable: false,
    contractError: input.contractError,
  };
}

function blocked(input: {
  requestId?: string;
  code: PromptContextRuntimeErrorCode;
  message: string;
  contractError?: PromptContextError;
  inputValidation?: PromptContextValidationResult;
  outputValidation?: PromptContextValidationResult;
}): PromptContextRuntimeResult {
  return {
    status: "blocked",
    execution: "none",
    version: PROMPT_CONTEXT_RUNTIME_VERSION,
    requestId: input.requestId,
    error: runtimeError({
      code: input.code,
      message: input.message,
      contractError: input.contractError,
    }),
    inputValidation: input.inputValidation,
    outputValidation: input.outputValidation,
    evidence: runtimeEvidence(),
  };
}

function outputPreservesRuntimeBoundary(output: PromptContextOutput): boolean {
  return output.outputKind === "structured_decision_simulation_context" &&
    output.directAnswerMode === false &&
    output.genericAssistantMode === false &&
    output.chatMode === false &&
    output.modelCallExecuted === false &&
    output.aiProviderRuntimeCalled === false &&
    output.evidence.modelCallExecuted === false &&
    output.evidence.aiProviderRuntimeCalled === false &&
    output.evidence.decisionSimulationFramePreserved === true;
}

function createRuntimeResult(input: {
  requestId: string;
  output: PromptContextOutput;
  inputValidation: Extract<PromptContextValidationResult, { status: "valid" }>;
  outputValidation: Extract<PromptContextValidationResult, { status: "valid" }>;
}): PromptContextRuntimeResult {
  return {
    status: "ready",
    execution: "runtime_build_only",
    version: PROMPT_CONTEXT_RUNTIME_VERSION,
    requestId: input.requestId,
    output: input.output,
    inputValidation: input.inputValidation,
    outputValidation: input.outputValidation,
    evidence: runtimeEvidence({
      structuredContextBuilt: true,
    }),
  };
}

function extractOutput(
  result: PromptContextCreateResult,
): PromptContextOutput | undefined {
  return result.status === "created" ? result.output : undefined;
}

export function buildPromptContextRuntime(
  config: PromptContextRuntimeConfig,
  request: PromptContextRuntimeRequest,
): PromptContextRuntimeResult {
  if (!config.enabled) {
    return blocked({
      requestId: request.requestId,
      code: "runtime_disabled",
      message: "Prompt Context runtime is disabled by default.",
    });
  }

  if (!request.input) {
    return blocked({
      requestId: request.requestId,
      code: "runtime_request_missing",
      message: "Prompt Context runtime requires structured Decision Simulation input.",
    });
  }

  const inputValidation = config.contract.validateInput(request.input);

  if (inputValidation.status === "blocked") {
    return blocked({
      requestId: request.requestId,
      code: "input_validation_failed",
      message: "Prompt Context runtime input validation failed.",
      contractError: inputValidation.error,
      inputValidation,
    });
  }

  const created = config.contract.create(request.input);
  const output = extractOutput(created);

  if (created.status === "blocked" || !output) {
    return blocked({
      requestId: request.requestId,
      code: "contract_creation_failed",
      message: "Prompt Context contract creation failed.",
      contractError: created.status === "blocked" ? created.error : undefined,
      inputValidation,
    });
  }

  const outputValidation = config.contract.validateOutput(output);

  if (outputValidation.status === "blocked") {
    return blocked({
      requestId: request.requestId,
      code: "output_validation_failed",
      message: "Prompt Context runtime output validation failed.",
      contractError: outputValidation.error,
      inputValidation,
      outputValidation,
    });
  }

  if (!outputPreservesRuntimeBoundary(output)) {
    return blocked({
      requestId: request.requestId,
      code: "runtime_output_invalid",
      message: "Prompt Context runtime output violated internal boundary constraints.",
      inputValidation,
      outputValidation,
    });
  }

  return createRuntimeResult({
    requestId: request.requestId,
    output,
    inputValidation,
    outputValidation,
  });
}

export function createPromptContextRuntime(
  config: PromptContextRuntimeConfig = DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG,
): PromptContextRuntime {
  return {
    version: PROMPT_CONTEXT_RUNTIME_VERSION,
    mode: PROMPT_CONTEXT_RUNTIME_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    aiProviderRuntimeEnabled: false,
    build: (request) => buildPromptContextRuntime(config, request),
  };
}
