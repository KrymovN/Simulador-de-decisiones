export const PROMPT_CONTEXT_CONTRACTS_VERSION =
  "5.2A-prompt-context-contracts-foundation.1" as const;
export const PROMPT_CONTEXT_CONTRACTS_MODE =
  "prompt_context_contracts_foundation_only" as const;
export const PROMPT_CONTEXT_RUNTIME_VERSION =
  "5.2B-prompt-context-runtime-foundation.1" as const;
export const PROMPT_CONTEXT_RUNTIME_MODE =
  "prompt_context_runtime_foundation_only" as const;

export type PromptContextContractsVersion =
  typeof PROMPT_CONTEXT_CONTRACTS_VERSION;
export type PromptContextContractsMode =
  typeof PROMPT_CONTEXT_CONTRACTS_MODE;
export type PromptContextRuntimeVersion = typeof PROMPT_CONTEXT_RUNTIME_VERSION;
export type PromptContextRuntimeMode = typeof PROMPT_CONTEXT_RUNTIME_MODE;

export type PromptContextInputKind =
  | "decision_simulation_brief"
  | "decision_simulation_revision";

export type PromptContextSource = "user_supplied_decision_context";

export type PromptContextHorizon =
  | "immediate"
  | "short_term"
  | "medium_term"
  | "long_term";

export type PromptContextTradeoffFocus =
  | "cost"
  | "speed"
  | "risk"
  | "reversibility"
  | "opportunity"
  | "confidence"
  | "stakeholder_impact";

export type PromptContextPacketKind = "decision_simulation_context_packet";

export type PromptContextItemKind =
  | "decision_objective"
  | "decision_question"
  | "scenario_anchor"
  | "known_constraint"
  | "tradeoff_focus"
  | "desired_output_shape";

export type DecisionSimulationInstructionTask =
  | "model_scenarios"
  | "compare_tradeoffs"
  | "surface_risks"
  | "map_consequences"
  | "identify_reversibility"
  | "preserve_uncertainty";

export type DecisionSimulationInstructionOutputShape =
  "structured_decision_simulation_context";

export type PromptContextForbiddenPatternCategory =
  | "chat_mode"
  | "answer_engine_mode"
  | "prompt_injection"
  | "secret_or_env_access"
  | "provider_runtime_request"
  | "raw_prompt_forwarding"
  | "model_call_request"
  | "sensitive_personal_data";

export type PromptContextForbiddenPattern = {
  patternId: string;
  category: PromptContextForbiddenPatternCategory;
  tokens: string[];
  severity: "block";
  action: "fail_closed";
};

export type PromptContextSafetyModel = {
  requireDecisionSimulationFrame: true;
  requireScenarioTradeoffRiskFrame: true;
  allowChatMode: false;
  allowAnswerEngineMode: false;
  allowRawPromptForwarding: false;
  allowPromptInjection: false;
  allowSensitivePersonalData: false;
  allowProviderRuntimeDirectAccess: false;
  allowModelCalls: false;
  promptContextLayerOnly: true;
};

export type PromptContextBudgetModel = {
  maxUserInputCharacters: number;
  maxContextItems: number;
  maxContextItemCharacters: number;
  maxInstructionCharacters: number;
  maxTotalPacketCharacters: number;
  enforcement: "foundation_validation_only";
};

export type PromptContextClientRuntimeFields = {
  rawPrompt?: string;
  apiKey?: string;
  envVarName?: string;
  providerPayload?: string;
  modelCallPayload?: string;
};

export type PromptContextInputContract = {
  inputId: string;
  inputKind: PromptContextInputKind;
  source: PromptContextSource;
  submittedAt: string;
  locale: "en" | "es" | "ru";
  objective: string;
  decisionQuestion: string;
  decisionHorizon: PromptContextHorizon;
  scenarioAnchors: string[];
  knownConstraints: string[];
  tradeoffFocus: PromptContextTradeoffFocus[];
  desiredOutcomeFormat: DecisionSimulationInstructionOutputShape;
  safety: PromptContextSafetyModel;
  budget: PromptContextBudgetModel;
  clientRuntimeFields?: PromptContextClientRuntimeFields;
};

export type DecisionSimulationInstructionModel = {
  instructionId: string;
  mode: "decision_simulation";
  outputShape: DecisionSimulationInstructionOutputShape;
  tasks: DecisionSimulationInstructionTask[];
  forbiddenModes: ["ai_chat", "answer_engine", "raw_prompt_forwarding"];
  requiresTradeoffs: true;
  requiresRisks: true;
  requiresConsequences: true;
  requiresUncertainty: true;
};

export type PromptContextPacketItem = {
  itemId: string;
  kind: PromptContextItemKind;
  value: string;
  source: PromptContextSource;
};

export type PromptContextPacketModel = {
  packetId: string;
  inputId: string;
  packetKind: PromptContextPacketKind;
  instruction: DecisionSimulationInstructionModel;
  items: PromptContextPacketItem[];
  safety: PromptContextSafetyModel;
  budget: PromptContextBudgetModel;
  forbiddenPatterns: PromptContextForbiddenPattern[];
  packetFingerprint: string;
};

export type PromptContextErrorCode =
  | "prompt_context_contracts_disabled"
  | "input_id_missing"
  | "input_kind_invalid"
  | "input_source_invalid"
  | "timestamp_invalid"
  | "objective_missing"
  | "decision_question_missing"
  | "decision_horizon_invalid"
  | "scenario_anchor_missing"
  | "tradeoff_focus_missing"
  | "desired_outcome_invalid"
  | "safety_model_invalid"
  | "budget_model_invalid"
  | "context_budget_exceeded"
  | "forbidden_prompt_pattern_detected"
  | "client_runtime_field_rejected";

export type PromptContextError = {
  code: PromptContextErrorCode;
  message: string;
  recoverable: false;
};

export type PromptContextContractsConfig = {
  enabled: boolean;
  forbiddenPatterns: PromptContextForbiddenPattern[];
  budget: PromptContextBudgetModel;
};

export type PromptContextSafetyEvidence = {
  stage: "5.2A";
  promptContextOnly: true;
  contractsOnly: true;
  foundationOnly: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  decisionSimulationFrameRequired: true;
  chatModeAllowed: false;
  answerEngineModeAllowed: false;
  rawPromptForwardingAllowed: false;
  promptInjectionAllowed: false;
  sensitivePersonalDataAllowed: false;
  modelCallExecuted: false;
  openAiSdkConnected: false;
  apiKeysRead: false;
  envVariablesRead: false;
  apiRouteIntegrated: false;
  simulatorIntegrated: false;
  decisionEngineRuntimeConnected: false;
  aiProviderRuntimeConnected: false;
  databaseConnected: false;
  supabaseConnected: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  subscriptionsRuntimeConnected: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  stage52BStarted: false;
  stage53Started: false;
  rollback: "disable_prompt_context_contracts_or_remove_prompt_context_exports";
};

export type PromptContextAllowedEvaluation = {
  status: "allowed";
  execution: "contract_validation_only";
  version: PromptContextContractsVersion;
  packet: PromptContextPacketModel;
  evidence: PromptContextSafetyEvidence;
};

export type PromptContextBlockedEvaluation = {
  status: "blocked";
  execution: "none";
  version: PromptContextContractsVersion;
  inputId?: string;
  error: PromptContextError;
  matchedPattern?: PromptContextForbiddenPattern;
  evidence: PromptContextSafetyEvidence;
};

export type PromptContextEvaluationResult =
  | PromptContextAllowedEvaluation
  | PromptContextBlockedEvaluation;

export type PromptContextContractsFoundation = {
  version: PromptContextContractsVersion;
  mode: PromptContextContractsMode;
  enabled: boolean;
  modelCallsEnabled: false;
  evaluateInput(input: PromptContextInputContract): PromptContextEvaluationResult;
};

export type PromptContextValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: PromptContextEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type PromptContextValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PromptContextValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

export type PromptContextRuntimeConfig = {
  enabled: boolean;
  contracts: PromptContextContractsFoundation;
  maxRuntimePacketCharacters: number;
  requireDecisionSimulationInstruction: true;
  failClosedOnContractBlock: true;
};

export type PromptContextRuntimeBlockedReason =
  | PromptContextErrorCode
  | "prompt_context_runtime_disabled"
  | "input_missing"
  | "contract_isolation_failed"
  | "context_packet_missing"
  | "instruction_resolution_failed"
  | "runtime_context_budget_exceeded"
  | "runtime_safety_guard_failed";

export type PromptContextRuntimeSafetyEvidence = {
  stage: "5.2B";
  promptContextOnly: true;
  runtimeFoundationOnly: true;
  contractsFoundationUsed: true;
  deterministicOnly: true;
  failClosedByDefault: true;
  contextPacketAssemblyPreflightOnly: true;
  decisionSimulationInstructionResolved: boolean;
  forbiddenPromptPatternsChecked: true;
  contextBudgetEvaluated: true;
  contextSafetyGuardEvaluated: true;
  modelCallExecuted: false;
  openAiSdkConnected: false;
  apiKeysRead: false;
  envVariablesRead: false;
  apiRouteIntegrated: false;
  simulatorIntegrated: false;
  decisionEngineRuntimeConnected: false;
  aiProviderRuntimeConnected: false;
  databaseConnected: false;
  supabaseConnected: false;
  authRuntimeConnected: false;
  persistenceRuntimeConnected: false;
  subscriptionsRuntimeConnected: false;
  uiIntegrated: false;
  dashboardIntegrated: false;
  stage52CStarted: false;
  stage53Started: false;
  rollback: "disable_prompt_context_runtime_or_remove_runtime_exports";
};

export type PromptContextRuntimeEvaluationInput = {
  input?: PromptContextInputContract | null;
};

export type PromptContextRuntimeAllowedDecision = {
  status: "allowed";
  execution: "preflight_only";
  version: PromptContextRuntimeVersion;
  packet: PromptContextPacketModel;
  instruction: DecisionSimulationInstructionModel;
  contractResult: PromptContextAllowedEvaluation;
  evidence: PromptContextRuntimeSafetyEvidence;
};

export type PromptContextRuntimeBlockedDecision = {
  status: "blocked";
  execution: "none";
  version: PromptContextRuntimeVersion;
  reason: PromptContextRuntimeBlockedReason;
  message: string;
  contractResult?: PromptContextEvaluationResult;
  packet?: PromptContextPacketModel;
  evidence: PromptContextRuntimeSafetyEvidence;
};

export type PromptContextRuntimeEvaluationResult =
  | PromptContextRuntimeAllowedDecision
  | PromptContextRuntimeBlockedDecision;

export type PromptContextRuntimeFoundation = {
  version: PromptContextRuntimeVersion;
  mode: PromptContextRuntimeMode;
  enabled: boolean;
  modelCallsEnabled: false;
  evaluate(
    input: PromptContextRuntimeEvaluationInput,
  ): PromptContextRuntimeEvaluationResult;
};

export type PromptContextRuntimeValidationCaseResult = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  actualStatus: PromptContextRuntimeEvaluationResult["status"];
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type PromptContextRuntimeValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PromptContextRuntimeValidationCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};
