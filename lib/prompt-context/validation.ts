import {
  PROMPT_CONTEXT_CONTRACTS_MODE,
  PROMPT_CONTEXT_CONTRACTS_VERSION,
  type PromptContextContract,
  type PromptContextContractConfig,
  type PromptContextContractsValidationCase,
  type PromptContextContractsValidationResult,
  type PromptContextCreateResult,
  type PromptContextDecisionFrame,
  type PromptContextError,
  type PromptContextErrorCode,
  type PromptContextEvidence,
  type PromptContextForbiddenClientFields,
  type PromptContextInput,
  type PromptContextOutput,
  type PromptContextPolicy,
  type PromptContextRiskBoundary,
  type PromptContextValidationResult,
} from "./contracts";

export const DEFAULT_PROMPT_CONTEXT_POLICY: PromptContextPolicy = {
  mode: "decision_simulation_context",
  requireStructuredContext: true,
  promptContextOnly: true,
  allowRawChatMessages: false,
  allowUserSystemPrompt: false,
  allowDirectAnswerMode: false,
  allowGenericAssistantBehavior: false,
  allowProviderRuntimeFields: false,
  allowModelCalls: false,
  maxContextCharacters: 6000,
};

export const DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY: PromptContextRiskBoundary = {
  requireScenarioFrame: true,
  requireRiskFrame: true,
  requireTradeoffFrame: true,
  requireConsequenceFrame: true,
  requireUncertaintyFrame: true,
  allowFinalAdvice: false,
  allowDirectAnswer: false,
};

export const DEFAULT_PROMPT_CONTEXT_CONTRACT_CONFIG: PromptContextContractConfig =
  {
    enabled: false,
    policy: DEFAULT_PROMPT_CONTEXT_POLICY,
    riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  };

export function promptContextEvidence(): PromptContextEvidence {
  return {
    stage: "5.2A",
    promptContextOnly: true,
    contractsOnly: true,
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
    stage52BStarted: false,
    stage53Started: false,
  };
}

function error(
  code: PromptContextErrorCode,
  message: string,
): PromptContextError {
  return {
    code,
    message,
    recoverable: false,
  };
}

function blocked(
  code: PromptContextErrorCode,
  message: string,
): PromptContextValidationResult {
  return {
    status: "blocked",
    execution: "none",
    version: PROMPT_CONTEXT_CONTRACTS_VERSION,
    error: error(code, message),
    evidence: promptContextEvidence(),
  };
}

function blockedCreate(
  code: PromptContextErrorCode,
  message: string,
): PromptContextCreateResult {
  return {
    status: "blocked",
    execution: "none",
    version: PROMPT_CONTEXT_CONTRACTS_VERSION,
    error: error(code, message),
    evidence: promptContextEvidence(),
  };
}

function valid(): PromptContextValidationResult {
  return {
    status: "valid",
    execution: "contract_validation_only",
    version: PROMPT_CONTEXT_CONTRACTS_VERSION,
    evidence: promptContextEvidence(),
  };
}

function isTimestampValid(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function textLength(frame: PromptContextDecisionFrame): number {
  return [
    frame.objective,
    frame.decisionQuestion,
    ...frame.scenarioSeeds,
    ...frame.knownConstraints,
    ...frame.tradeoffFocus,
  ].reduce((total, value) => total + value.length, 0);
}

function frameIsPresent(frame: PromptContextDecisionFrame | undefined): boolean {
  return Boolean(
    frame?.objective?.trim() &&
      frame.decisionQuestion?.trim() &&
      frame.scenarioSeeds?.length &&
      frame.knownConstraints?.length &&
      frame.tradeoffFocus?.length,
  );
}

function riskBoundaryIsValid(boundary: PromptContextRiskBoundary): boolean {
  return boundary.requireScenarioFrame === true &&
    boundary.requireRiskFrame === true &&
    boundary.requireTradeoffFrame === true &&
    boundary.requireConsequenceFrame === true &&
    boundary.requireUncertaintyFrame === true &&
    boundary.allowFinalAdvice === false &&
    boundary.allowDirectAnswer === false;
}

function policyIsValid(policy: PromptContextPolicy): boolean {
  return policy.mode === "decision_simulation_context" &&
    policy.requireStructuredContext === true &&
    policy.promptContextOnly === true &&
    policy.allowRawChatMessages === false &&
    policy.allowUserSystemPrompt === false &&
    policy.allowDirectAnswerMode === false &&
    policy.allowGenericAssistantBehavior === false &&
    policy.allowProviderRuntimeFields === false &&
    policy.allowModelCalls === false &&
    Number.isFinite(policy.maxContextCharacters) &&
    policy.maxContextCharacters > 0;
}

function hasForbiddenClientFields(
  fields: PromptContextForbiddenClientFields | undefined,
): PromptContextErrorCode | undefined {
  if (!fields) {
    return undefined;
  }

  if (fields.rawChatMessages?.length || fields.rawPrompt) {
    return "raw_chat_message_rejected";
  }

  if (fields.userSystemPrompt) {
    return "user_system_prompt_rejected";
  }

  if (fields.directAnswerMode) {
    return "direct_answer_mode_rejected";
  }

  if (fields.genericAssistantMode) {
    return "generic_assistant_mode_rejected";
  }

  if (
    fields.providerId ||
    fields.modelId ||
    fields.envVarName ||
    fields.apiKey ||
    fields.providerPayload
  ) {
    return "provider_runtime_field_rejected";
  }

  return undefined;
}

function validatePolicyAndBoundary(input: {
  policy: PromptContextPolicy;
  riskBoundary: PromptContextRiskBoundary;
}): PromptContextValidationResult | undefined {
  if (!policyIsValid(input.policy)) {
    return blocked(
      "policy_invalid",
      "Prompt Context policy must preserve Decision Simulation Engine framing.",
    );
  }

  if (!riskBoundaryIsValid(input.riskBoundary)) {
    return blocked(
      "risk_boundary_invalid",
      "Prompt Context risk boundary must require scenarios, risks, tradeoffs, consequences, and uncertainty.",
    );
  }

  return undefined;
}

export function validatePromptContextInput(
  config: PromptContextContractConfig,
  input: Partial<PromptContextInput> | null | undefined,
): PromptContextValidationResult {
  if (!config.enabled) {
    return blocked(
      "contract_disabled",
      "Prompt Context contracts foundation is disabled by default.",
    );
  }

  if (!input) {
    return blocked("input_missing", "Prompt Context input is required.");
  }

  if (!input.inputId) {
    return blocked("input_id_missing", "Prompt Context input requires inputId.");
  }

  if (!isTimestampValid(input.submittedAt)) {
    return blocked(
      "timestamp_invalid",
      "Prompt Context input requires a valid submittedAt timestamp.",
    );
  }

  if (!frameIsPresent(input.decisionFrame)) {
    return blocked(
      "decision_frame_missing",
      "Prompt Context input requires objective, decision question, scenarios, constraints, and tradeoffs.",
    );
  }

  if (!input.policy || !input.riskBoundary) {
    return blocked(
      "decision_simulation_framing_missing",
      "Prompt Context input requires policy and risk boundary.",
    );
  }

  const frame = input.decisionFrame;
  const policy = input.policy;
  const riskBoundary = input.riskBoundary;

  if (!frame || !policy || !riskBoundary) {
    return blocked(
      "decision_simulation_framing_missing",
      "Prompt Context input requires policy and risk boundary.",
    );
  }

  const policyBoundaryResult = validatePolicyAndBoundary({
    policy,
    riskBoundary,
  });

  if (policyBoundaryResult) {
    return policyBoundaryResult;
  }

  const forbiddenField = hasForbiddenClientFields(input.clientFields);

  if (forbiddenField) {
    return blocked(
      forbiddenField,
      "Prompt Context rejects raw chat, system prompts, direct answer mode, generic assistant mode, and provider runtime fields.",
    );
  }

  if (textLength(frame) > policy.maxContextCharacters) {
    return blocked(
      "context_budget_exceeded",
      "Prompt Context input exceeds the configured context budget.",
    );
  }

  return valid();
}

export function validatePromptContextOutput(
  config: PromptContextContractConfig,
  output: Partial<PromptContextOutput> | null | undefined,
): PromptContextValidationResult {
  if (!config.enabled) {
    return blocked(
      "contract_disabled",
      "Prompt Context contracts foundation is disabled by default.",
    );
  }

  if (!output) {
    return blocked("output_missing", "Prompt Context output is required.");
  }

  if (
    output.outputKind !== "structured_decision_simulation_context" ||
    output.directAnswerMode !== false ||
    output.genericAssistantMode !== false ||
    output.chatMode !== false ||
    output.modelCallExecuted !== false ||
    output.aiProviderRuntimeCalled !== false ||
    !output.contextFrame ||
    !output.policy ||
    !output.riskBoundary
  ) {
    return blocked(
      "output_contract_invalid",
      "Prompt Context output must stay structured, internal, and non-chat.",
    );
  }

  const inputValidation = validatePromptContextInput(config, {
    inputId: output.inputId,
    submittedAt: "2026-06-21T00:00:00.000Z",
    locale: "en",
    decisionFrame: output.contextFrame,
    policy: output.policy,
    riskBoundary: output.riskBoundary,
  });

  if (inputValidation.status === "blocked") {
    return inputValidation;
  }

  if (
    output.evidence?.modelCallExecuted !== false ||
    output.evidence.aiProviderRuntimeCalled !== false ||
    output.evidence.decisionSimulationFramePreserved !== true
  ) {
    return blocked(
      "output_contract_invalid",
      "Prompt Context evidence must preserve internal Decision Simulation Engine scope.",
    );
  }

  return valid();
}

function buildOutput(input: PromptContextInput): PromptContextOutput {
  return {
    outputId: `${input.inputId}:prompt-context`,
    inputId: input.inputId,
    outputKind: "structured_decision_simulation_context",
    contextFrame: input.decisionFrame,
    policy: input.policy,
    riskBoundary: input.riskBoundary,
    evidence: promptContextEvidence(),
    directAnswerMode: false,
    genericAssistantMode: false,
    chatMode: false,
    modelCallExecuted: false,
    aiProviderRuntimeCalled: false,
  };
}

export function createPromptContextContract(
  config: PromptContextContractConfig = DEFAULT_PROMPT_CONTEXT_CONTRACT_CONFIG,
): PromptContextContract {
  return {
    version: PROMPT_CONTEXT_CONTRACTS_VERSION,
    mode: PROMPT_CONTEXT_CONTRACTS_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    aiProviderRuntimeEnabled: false,
    create: (input) => {
      const inputValidation = validatePromptContextInput(config, input);

      if (inputValidation.status === "blocked") {
        return blockedCreate(
          inputValidation.error.code,
          inputValidation.error.message,
        );
      }

      const output = buildOutput(input);
      const outputValidation = validatePromptContextOutput(config, output);

      if (outputValidation.status === "blocked") {
        return blockedCreate(
          outputValidation.error.code,
          outputValidation.error.message,
        );
      }

      return {
        status: "created",
        execution: "contract_creation_only",
        version: PROMPT_CONTEXT_CONTRACTS_VERSION,
        output,
        evidence: promptContextEvidence(),
      };
    },
    validateInput: (input) => validatePromptContextInput(config, input),
    validateOutput: (output) => validatePromptContextOutput(config, output),
  };
}

function input(
  overrides: Partial<PromptContextInput> = {},
): PromptContextInput {
  return {
    inputId: "stage_5_2a_prompt_context_input",
    submittedAt: "2026-06-21T00:00:00.000Z",
    locale: "en",
    decisionFrame: {
      objective: "Evaluate a product team expansion decision.",
      decisionQuestion: "Should the team hire now or wait for more revenue?",
      scenarioSeeds: ["Revenue may grow slowly"],
      knownConstraints: ["Budget must remain controlled"],
      tradeoffFocus: ["cost", "risk", "opportunity"],
    },
    policy: DEFAULT_PROMPT_CONTEXT_POLICY,
    riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
    ...overrides,
  };
}

function enabledContract(): PromptContextContract {
  return createPromptContextContract({
    enabled: true,
    policy: DEFAULT_PROMPT_CONTEXT_POLICY,
    riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  });
}

function validationCase(inputCase: {
  caseId: string;
  result: PromptContextValidationResult | PromptContextCreateResult;
  expectedStatus: "valid" | "blocked" | "created";
  expectedErrorCode?: PromptContextErrorCode;
}): PromptContextContractsValidationCase {
  const errorCode =
    inputCase.result.status === "blocked"
      ? inputCase.result.error.code
      : undefined;
  const passed =
    inputCase.result.status === inputCase.expectedStatus &&
    errorCode === inputCase.expectedErrorCode &&
    inputCase.result.evidence.modelCallExecuted === false &&
    inputCase.result.evidence.aiProviderRuntimeCalled === false;

  return {
    caseId: inputCase.caseId,
    passed,
    errorCode,
  };
}

export function runPromptContextContractsValidation(): PromptContextContractsValidationResult {
  const contract = enabledContract();
  const created = contract.create(input());
  const output =
    created.status === "created" ? created.output : undefined;
  const cases: PromptContextContractsValidationCase[] = [
    validationCase({
      caseId: "disabled_contract_blocks",
      result: createPromptContextContract().validateInput(input()),
      expectedStatus: "blocked",
      expectedErrorCode: "contract_disabled",
    }),
    validationCase({
      caseId: "valid_input_passes",
      result: contract.validateInput(input()),
      expectedStatus: "valid",
    }),
    validationCase({
      caseId: "raw_chat_messages_block",
      result: contract.validateInput(
        input({
          clientFields: {
            rawChatMessages: ["hello assistant"],
          },
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "raw_chat_message_rejected",
    }),
    validationCase({
      caseId: "user_system_prompt_blocks",
      result: contract.validateInput(
        input({
          clientFields: {
            userSystemPrompt: "You are a helpful assistant.",
          },
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "user_system_prompt_rejected",
    }),
    validationCase({
      caseId: "provider_runtime_fields_block",
      result: contract.validateInput(
        input({
          clientFields: {
            apiKey: "forbidden",
          },
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "provider_runtime_field_rejected",
    }),
    validationCase({
      caseId: "direct_answer_mode_blocks",
      result: contract.validateInput(
        input({
          clientFields: {
            directAnswerMode: true,
          },
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "direct_answer_mode_rejected",
    }),
    validationCase({
      caseId: "generic_assistant_mode_blocks",
      result: contract.validateInput(
        input({
          clientFields: {
            genericAssistantMode: true,
          },
        }),
      ),
      expectedStatus: "blocked",
      expectedErrorCode: "generic_assistant_mode_rejected",
    }),
    validationCase({
      caseId: "contract_create_outputs_structured_context",
      result: created,
      expectedStatus: "created",
    }),
    validationCase({
      caseId: "output_validation_passes",
      result: output
        ? contract.validateOutput(output)
        : blocked("output_missing", "Expected created output."),
      expectedStatus: "valid",
    }),
  ];
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
