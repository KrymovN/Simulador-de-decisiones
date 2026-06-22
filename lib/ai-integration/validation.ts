import {
  AI_INTEGRATION_PREFLIGHT_CONTRACTS_MODE,
  AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION,
  type AIIntegrationComponent,
  type AIIntegrationComponentExecution,
  type AIIntegrationComponentReference,
  type AIIntegrationContractsConfig,
  type AIIntegrationContractsFoundation,
  type AIIntegrationError,
  type AIIntegrationErrorCode,
  type AIIntegrationForbiddenClientFields,
  type AIIntegrationPolicy,
  type AIIntegrationPreflightInput,
  type AIIntegrationPreflightOperation,
  type AIIntegrationPreflightResult,
  type AIIntegrationSafetyEvidence,
  type AIIntegrationValidationCaseResult,
  type AIIntegrationValidationResult,
} from "./contracts";

export const DEFAULT_AI_INTEGRATION_CONTRACTS_CONFIG: AIIntegrationContractsConfig =
  {
    enabled: false,
  };

type ValidationCase = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  run: () => AIIntegrationPreflightResult;
  assertions: ((
    result: AIIntegrationPreflightResult,
  ) => string | undefined)[];
};

export const DEFAULT_AI_INTEGRATION_POLICY: AIIntegrationPolicy = {
  mode: "decision_simulation_ai_integration_preflight",
  requirePromptContextBoundary: true,
  requireAIProviderBoundaryPreflight: true,
  requireAIQualityBoundary: true,
  requireStructuredDecisionSimulationFrame: true,
  allowProviderExecution: false,
  allowModelCalls: false,
  allowStreaming: false,
  allowApiRoutes: false,
  allowSimulatorRuntime: false,
  allowDecisionEngineRuntime: false,
  allowUiRuntime: false,
};

export function aiIntegrationSafetyEvidence(): AIIntegrationSafetyEvidence {
  return {
    stage: "5.4A",
    controlledAIIntegrationOnly: true,
    contractsOnly: true,
    foundationOnly: true,
    preflightOnly: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    promptContextBoundaryRequired: true,
    aiProviderBoundaryPreflightRequired: true,
    aiQualityBoundaryRequired: true,
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

function allowed(input: {
  preflightId: string;
  operation: AIIntegrationPreflightOperation;
}): AIIntegrationPreflightResult {
  return {
    status: "allowed",
    execution: "contract_validation_only",
    version: AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION,
    preflightId: input.preflightId,
    operation: input.operation,
    components: {
      promptContextBoundaryReady: true,
      aiProviderBoundaryPreflightReady: true,
      aiQualityBoundaryReady: true,
    },
    evidence: aiIntegrationSafetyEvidence(),
  };
}

function isTimestampValid(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function policyIsValid(policy: AIIntegrationPolicy | undefined): boolean {
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

function unsafeClientFieldCode(
  fields: AIIntegrationForbiddenClientFields | undefined,
): AIIntegrationErrorCode | undefined {
  if (!fields) {
    return undefined;
  }

  if (
    fields.apiKey ||
    fields.envVarName ||
    fields.providerSecret ||
    fields.rawPrompt ||
    fields.rawChatMessages?.length ||
    fields.userSystemPrompt ||
    fields.providerPayload !== undefined
  ) {
    return "unsafe_client_field_rejected";
  }

  if (fields.providerExecution) {
    return "provider_execution_rejected";
  }

  if (fields.modelCall || fields.modelCallPayload !== undefined || fields.modelId) {
    return "model_call_rejected";
  }

  if (fields.streaming) {
    return "streaming_rejected";
  }

  if (
    fields.apiRoute ||
    fields.simulatorRuntime ||
    fields.decisionEngineRuntime ||
    fields.uiRuntime
  ) {
    return "product_runtime_rejected";
  }

  return undefined;
}

function componentReferenceIsValid(input: {
  reference: AIIntegrationComponentReference | undefined;
  component: AIIntegrationComponent;
  execution: AIIntegrationComponentExecution;
}): boolean {
  return input.reference?.component === input.component &&
    typeof input.reference.version === "string" &&
    input.reference.version.trim().length > 0 &&
    (input.reference.status === "ready" || input.reference.status === "allowed") &&
    input.reference.execution === input.execution &&
    input.reference.modelCallExecuted === false &&
    input.reference.providerExecutionCompleted === false;
}

function outputEvidenceIsSafe(
  evidence: Partial<AIIntegrationSafetyEvidence> | undefined,
): evidence is AIIntegrationSafetyEvidence {
  return evidence?.stage === "5.4A" &&
    evidence.controlledAIIntegrationOnly === true &&
    evidence.contractsOnly === true &&
    evidence.foundationOnly === true &&
    evidence.preflightOnly === true &&
    evidence.deterministicOnly === true &&
    evidence.failClosedByDefault === true &&
    evidence.promptContextBoundaryRequired === true &&
    evidence.aiProviderBoundaryPreflightRequired === true &&
    evidence.aiQualityBoundaryRequired === true &&
    evidence.providerExecutionAllowed === false &&
    evidence.streamingAllowed === false &&
    evidence.rawPromptAllowed === false &&
    evidence.providerPayloadAllowed === false &&
    evidence.modelCallPayloadAllowed === false &&
    evidence.modelCallExecuted === false &&
    evidence.providerExecutionCompleted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.aiSdkConnected === false &&
    evidence.apiKeyRead === false &&
    evidence.envRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.uiIntegrated === false;
}

export function validateAIIntegrationPreflightInput(
  config: AIIntegrationContractsConfig,
  input: Partial<AIIntegrationPreflightInput> | null | undefined,
): AIIntegrationPreflightResult {
  if (!config.enabled) {
    return blocked({
      code: "integration_contracts_disabled",
      message:
        "Controlled AI integration preflight contracts are disabled by default.",
    });
  }

  if (!input) {
    return blocked({
      code: "preflight_input_missing",
      message: "Controlled AI integration preflight input is required.",
    });
  }

  if (!input.preflightId) {
    return blocked({
      code: "preflight_id_missing",
      message: "Controlled AI integration preflight requires preflightId.",
    });
  }

  if (input.operation !== "controlled_ai_integration_preflight") {
    return blocked({
      code: "operation_invalid",
      message: "Controlled AI integration preflight operation is invalid.",
      preflightId: input.preflightId,
    });
  }

  if (!isTimestampValid(input.requestedAt)) {
    return blocked({
      code: "timestamp_invalid",
      message: "Controlled AI integration preflight requires a valid timestamp.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  if (input.scope !== "decision_simulation_ai_integration_preflight") {
    return blocked({
      code: "scope_invalid",
      message:
        "Controlled AI integration preflight must remain decision-simulation scoped.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  if (!policyIsValid(input.policy)) {
    return blocked({
      code: "policy_invalid",
      message:
        "Controlled AI integration policy must preserve preflight-only boundaries.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  if (!input.inputFingerprint?.trim()) {
    return blocked({
      code: "input_fingerprint_missing",
      message:
        "Controlled AI integration preflight requires an input fingerprint.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  const unsafeCode = unsafeClientFieldCode(input.clientRuntimeFields);

  if (unsafeCode) {
    return blocked({
      code: unsafeCode,
      message:
        "Controlled AI integration preflight rejects runtime, provider, prompt, key, streaming, and product integration fields.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  if (!input.promptContext) {
    return blocked({
      code: "prompt_context_boundary_missing",
      message: "Prompt Context boundary reference is required.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  if (!input.aiProvider) {
    return blocked({
      code: "ai_provider_boundary_missing",
      message: "AI Provider boundary preflight reference is required.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  if (!input.aiQuality) {
    return blocked({
      code: "ai_quality_boundary_missing",
      message: "AI Quality boundary reference is required.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  if (
    !componentReferenceIsValid({
      reference: input.promptContext,
      component: "prompt_context_boundary",
      execution: "boundary_facade_only",
    }) ||
    !componentReferenceIsValid({
      reference: input.aiProvider,
      component: "ai_provider_boundary",
      execution: "controlled_boundary_preflight_only",
    }) ||
    !componentReferenceIsValid({
      reference: input.aiQuality,
      component: "ai_quality_boundary",
      execution: "boundary_preflight_only",
    })
  ) {
    return blocked({
      code: "component_reference_invalid",
      message:
        "Controlled AI integration components must be boundary-only, preflight-only, and execution-free.",
      preflightId: input.preflightId,
      operation: input.operation,
    });
  }

  return allowed({
    preflightId: input.preflightId,
    operation: input.operation,
  });
}

export function validateAIIntegrationPreflightOutput(
  config: AIIntegrationContractsConfig,
  output: Partial<AIIntegrationPreflightResult> | null | undefined,
): AIIntegrationPreflightResult {
  if (!config.enabled) {
    return blocked({
      code: "integration_contracts_disabled",
      message:
        "Controlled AI integration preflight contracts are disabled by default.",
    });
  }

  if (
    !output ||
    output.version !== AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION ||
    !outputEvidenceIsSafe(output.evidence)
  ) {
    return blocked({
      code: "output_contract_invalid",
      message:
        "Controlled AI integration output must remain contracts-only, preflight-only, and integration-free.",
    });
  }

  if (output.status === "blocked") {
    return {
      status: "blocked",
      execution: "none",
      version: AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION,
      preflightId: output.preflightId,
      operation: output.operation,
      error: output.error ?? error(
        "output_contract_invalid",
        "Controlled AI integration blocked output requires an error.",
      ),
      evidence: aiIntegrationSafetyEvidence(),
    };
  }

  if (
    output.status !== "allowed" ||
    output.execution !== "contract_validation_only" ||
    output.operation !== "controlled_ai_integration_preflight" ||
    output.components?.promptContextBoundaryReady !== true ||
    output.components.aiProviderBoundaryPreflightReady !== true ||
    output.components.aiQualityBoundaryReady !== true ||
    !output.preflightId
  ) {
    return blocked({
      code: "output_contract_invalid",
      message:
        "Controlled AI integration allowed output must preserve all preflight component gates.",
    });
  }

  return allowed({
    preflightId: output.preflightId,
    operation: output.operation,
  });
}

export function createAIIntegrationContractsFoundation(
  config: AIIntegrationContractsConfig = DEFAULT_AI_INTEGRATION_CONTRACTS_CONFIG,
): AIIntegrationContractsFoundation {
  return {
    version: AI_INTEGRATION_PREFLIGHT_CONTRACTS_VERSION,
    mode: AI_INTEGRATION_PREFLIGHT_CONTRACTS_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    providerExecutionEnabled: false,
    streamingEnabled: false,
    apiRoutesEnabled: false,
    simulatorRuntimeEnabled: false,
    decisionEngineRuntimeEnabled: false,
    uiRuntimeEnabled: false,
    validatePreflight: (input) =>
      validateAIIntegrationPreflightInput(config, input),
    validateOutput: (output) =>
      validateAIIntegrationPreflightOutput(config, output),
  };
}

function component(
  componentName: AIIntegrationComponent,
  execution: AIIntegrationComponentExecution,
): AIIntegrationComponentReference {
  return {
    component: componentName,
    version: `${componentName}.foundation`,
    status: componentName === "ai_quality_boundary" ? "allowed" : "ready",
    execution,
    modelCallExecuted: false,
    providerExecutionCompleted: false,
  };
}

function validInput(
  overrides: Partial<AIIntegrationPreflightInput> = {},
): AIIntegrationPreflightInput {
  return {
    preflightId: "stage_5_4a_preflight",
    operation: "controlled_ai_integration_preflight",
    requestedAt: "2026-06-22T00:00:00.000Z",
    scope: "decision_simulation_ai_integration_preflight",
    policy: DEFAULT_AI_INTEGRATION_POLICY,
    promptContext: component("prompt_context_boundary", "boundary_facade_only"),
    aiProvider: component(
      "ai_provider_boundary",
      "controlled_boundary_preflight_only",
    ),
    aiQuality: component("ai_quality_boundary", "boundary_preflight_only"),
    inputFingerprint: "decision-simulation-context:fingerprint",
    ...overrides,
  };
}

function validationCases(): ValidationCase[] {
  const enabledConfig: AIIntegrationContractsConfig = { enabled: true };

  return [
    {
      caseId: "stage_5_4a_disabled_by_default",
      title: "Contracts fail closed when disabled.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationPreflightInput(
          DEFAULT_AI_INTEGRATION_CONTRACTS_CONFIG,
          validInput(),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "integration_contracts_disabled"
            ? undefined
            : "Expected disabled error code.",
      ],
    },
    {
      caseId: "stage_5_4a_valid_preflight_contract",
      title: "Valid preflight contract is allowed without execution.",
      expectedBehavior: "allowed",
      run: () => validateAIIntegrationPreflightInput(enabledConfig, validInput()),
      assertions: [
        (result) =>
          result.status === "allowed" ? undefined : "Expected allowed result.",
        (result) =>
          result.evidence.modelCallExecuted === false &&
          result.evidence.openAiSdkConnected === false &&
          result.evidence.envRead === false &&
          result.evidence.apiRouteIntegrated === false &&
          result.evidence.simulatorIntegrated === false &&
          result.evidence.decisionEngineRuntimeConnected === false &&
          result.evidence.uiIntegrated === false
            ? undefined
            : "Expected Stage 5.4A isolation evidence.",
      ],
    },
    {
      caseId: "stage_5_4a_rejects_api_key_env_and_prompt",
      title: "Client runtime secrets and raw prompts are rejected.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationPreflightInput(
          enabledConfig,
          validInput({
            clientRuntimeFields: {
              apiKey: "sk-test",
              envVarName: "OPENAI_API_KEY",
              rawPrompt: "answer directly",
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "unsafe_client_field_rejected"
            ? undefined
            : "Expected unsafe client field rejection.",
      ],
    },
    {
      caseId: "stage_5_4a_rejects_model_calls_and_streaming",
      title: "Model calls and streaming are rejected.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationPreflightInput(
          enabledConfig,
          validInput({
            clientRuntimeFields: {
              modelCall: true,
              streaming: true,
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "model_call_rejected"
            ? undefined
            : "Expected model call rejection before streaming.",
      ],
    },
    {
      caseId: "stage_5_4a_rejects_product_runtime",
      title: "Simulator, Decision Engine, UI, and API runtime fields are rejected.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationPreflightInput(
          enabledConfig,
          validInput({
            clientRuntimeFields: {
              simulatorRuntime: true,
              decisionEngineRuntime: true,
              uiRuntime: true,
              apiRoute: true,
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "product_runtime_rejected"
            ? undefined
            : "Expected product runtime rejection.",
      ],
    },
    {
      caseId: "stage_5_4a_rejects_invalid_component_reference",
      title: "Component references must remain boundary-only and execution-free.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationPreflightInput(
          enabledConfig,
          validInput({
            aiProvider: {
              ...component(
                "ai_provider_boundary",
                "controlled_boundary_preflight_only",
              ),
              providerExecutionCompleted: true as false,
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "component_reference_invalid"
            ? undefined
            : "Expected component reference rejection.",
      ],
    },
  ];
}

export function runAIIntegrationContractsValidation(): AIIntegrationValidationResult {
  const cases = validationCases().map((item): AIIntegrationValidationCaseResult => {
    const result = item.run();
    const issues = item.assertions
      .map((assertion) => assertion(result))
      .filter((issue): issue is string => Boolean(issue));

    return {
      caseId: item.caseId,
      title: item.title,
      expectedBehavior: item.expectedBehavior,
      actualStatus: result.status,
      passed: issues.length === 0,
      failed: issues.length > 0,
      issues,
    };
  });

  const passed = cases.filter((item) => item.passed).length;
  const failed = cases.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed,
    },
  };
}
