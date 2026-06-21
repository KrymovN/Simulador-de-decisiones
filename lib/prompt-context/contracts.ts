export const PROMPT_CONTEXT_CONTRACTS_VERSION =
  "5.2A-prompt-context-contracts-foundation.1" as const;

export const PROMPT_CONTEXT_CONTRACTS_MODE =
  "prompt_context_contracts_foundation_only" as const;

export type PromptContextErrorCode =
  | "contract_disabled"
  | "input_missing"
  | "output_missing"
  | "input_id_missing"
  | "timestamp_invalid"
  | "decision_frame_missing"
  | "decision_simulation_framing_missing"
  | "risk_boundary_invalid"
  | "policy_invalid"
  | "context_budget_exceeded"
  | "forbidden_client_field_rejected"
  | "raw_chat_message_rejected"
  | "user_system_prompt_rejected"
  | "direct_answer_mode_rejected"
  | "generic_assistant_mode_rejected"
  | "provider_runtime_field_rejected"
  | "output_contract_invalid";

export type PromptContextError = {
  code: PromptContextErrorCode;
  message: string;
  recoverable: false;
};

export type PromptContextRiskBoundary = {
  requireScenarioFrame: true;
  requireRiskFrame: true;
  requireTradeoffFrame: true;
  requireConsequenceFrame: true;
  requireUncertaintyFrame: true;
  allowFinalAdvice: false;
  allowDirectAnswer: false;
};

export type PromptContextPolicy = {
  mode: "decision_simulation_context";
  requireStructuredContext: true;
  promptContextOnly: true;
  allowRawChatMessages: false;
  allowUserSystemPrompt: false;
  allowDirectAnswerMode: false;
  allowGenericAssistantBehavior: false;
  allowProviderRuntimeFields: false;
  allowModelCalls: false;
  maxContextCharacters: number;
};

export type PromptContextEvidence = {
  stage: "5.2A";
  promptContextOnly: true;
  contractsOnly: true;
  providerAgnostic: true;
  decisionSimulationFramePreserved: true;
  rawChatMessagesAllowed: false;
  userSystemPromptAllowed: false;
  directAnswerModeAllowed: false;
  genericAssistantBehaviorAllowed: false;
  providerRuntimeFieldsAllowed: false;
  modelCallExecuted: false;
  aiProviderRuntimeCalled: false;
  envRead: false;
  apiKeyRead: false;
  apiRouteIntegrated: false;
  simulatorRuntimeIntegrated: false;
  decisionEngineRuntimeIntegrated: false;
  uiIntegrated: false;
  stage52BStarted: false;
  stage53Started: false;
};

export type PromptContextDecisionFrame = {
  objective: string;
  decisionQuestion: string;
  scenarioSeeds: string[];
  knownConstraints: string[];
  tradeoffFocus: string[];
};

export type PromptContextForbiddenClientFields = {
  rawChatMessages?: string[];
  rawPrompt?: string;
  userSystemPrompt?: string;
  directAnswerMode?: boolean;
  genericAssistantMode?: boolean;
  providerId?: string;
  modelId?: string;
  envVarName?: string;
  apiKey?: string;
  providerPayload?: unknown;
};

export type PromptContextInput = {
  inputId: string;
  submittedAt: string;
  locale: "en" | "es" | "ru";
  decisionFrame: PromptContextDecisionFrame;
  policy: PromptContextPolicy;
  riskBoundary: PromptContextRiskBoundary;
  clientFields?: PromptContextForbiddenClientFields;
};

export type PromptContextOutput = {
  outputId: string;
  inputId: string;
  outputKind: "structured_decision_simulation_context";
  contextFrame: PromptContextDecisionFrame;
  policy: PromptContextPolicy;
  riskBoundary: PromptContextRiskBoundary;
  evidence: PromptContextEvidence;
  directAnswerMode: false;
  genericAssistantMode: false;
  chatMode: false;
  modelCallExecuted: false;
  aiProviderRuntimeCalled: false;
};

export type PromptContextValidationResult =
  | {
      status: "valid";
      execution: "contract_validation_only";
      version: typeof PROMPT_CONTEXT_CONTRACTS_VERSION;
      evidence: PromptContextEvidence;
    }
  | {
      status: "blocked";
      execution: "none";
      version: typeof PROMPT_CONTEXT_CONTRACTS_VERSION;
      error: PromptContextError;
      evidence: PromptContextEvidence;
    };

export type PromptContextCreateResult =
  | {
      status: "created";
      execution: "contract_creation_only";
      version: typeof PROMPT_CONTEXT_CONTRACTS_VERSION;
      output: PromptContextOutput;
      evidence: PromptContextEvidence;
    }
  | {
      status: "blocked";
      execution: "none";
      version: typeof PROMPT_CONTEXT_CONTRACTS_VERSION;
      error: PromptContextError;
      evidence: PromptContextEvidence;
    };

export type PromptContextContractConfig = {
  enabled: boolean;
  policy: PromptContextPolicy;
  riskBoundary: PromptContextRiskBoundary;
};

export type PromptContextContract = {
  version: typeof PROMPT_CONTEXT_CONTRACTS_VERSION;
  mode: typeof PROMPT_CONTEXT_CONTRACTS_MODE;
  enabled: boolean;
  modelCallsEnabled: false;
  aiProviderRuntimeEnabled: false;
  create(input: PromptContextInput): PromptContextCreateResult;
  validateInput(input: PromptContextInput): PromptContextValidationResult;
  validateOutput(output: PromptContextOutput): PromptContextValidationResult;
};

export type PromptContextContractsValidationCase = {
  caseId: string;
  passed: boolean;
  errorCode?: PromptContextErrorCode;
};

export type PromptContextContractsValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PromptContextContractsValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
