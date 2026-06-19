import {
  DEFAULT_PROMPT_CONTEXT_BUDGET,
  DEFAULT_PROMPT_CONTEXT_FORBIDDEN_PATTERNS,
  createPromptContextContractsFoundation,
} from "./validation";
import {
  PROMPT_CONTEXT_RUNTIME_MODE,
  PROMPT_CONTEXT_RUNTIME_VERSION,
  type DecisionSimulationInstructionModel,
  type PromptContextEvaluationResult,
  type PromptContextPacketModel,
  type PromptContextRuntimeBlockedReason,
  type PromptContextRuntimeConfig,
  type PromptContextRuntimeEvaluationInput,
  type PromptContextRuntimeEvaluationResult,
  type PromptContextRuntimeFoundation,
  type PromptContextRuntimeSafetyEvidence,
} from "./contracts";

export const DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG: PromptContextRuntimeConfig = {
  enabled: false,
  contracts: createPromptContextContractsFoundation({
    enabled: true,
    forbiddenPatterns: DEFAULT_PROMPT_CONTEXT_FORBIDDEN_PATTERNS,
    budget: DEFAULT_PROMPT_CONTEXT_BUDGET,
  }),
  maxRuntimePacketCharacters: DEFAULT_PROMPT_CONTEXT_BUDGET.maxTotalPacketCharacters,
  requireDecisionSimulationInstruction: true,
  failClosedOnContractBlock: true,
};

export function promptContextRuntimeSafetyEvidence(
  input: { instructionResolved?: boolean } = {},
): PromptContextRuntimeSafetyEvidence {
  return {
    stage: "5.2B",
    promptContextOnly: true,
    runtimeFoundationOnly: true,
    contractsFoundationUsed: true,
    deterministicOnly: true,
    failClosedByDefault: true,
    contextPacketAssemblyPreflightOnly: true,
    decisionSimulationInstructionResolved: input.instructionResolved === true,
    forbiddenPromptPatternsChecked: true,
    contextBudgetEvaluated: true,
    contextSafetyGuardEvaluated: true,
    modelCallExecuted: false,
    openAiSdkConnected: false,
    apiKeysRead: false,
    envVariablesRead: false,
    apiRouteIntegrated: false,
    simulatorIntegrated: false,
    decisionEngineRuntimeConnected: false,
    aiProviderRuntimeConnected: false,
    databaseConnected: false,
    supabaseConnected: false,
    authRuntimeConnected: false,
    persistenceRuntimeConnected: false,
    subscriptionsRuntimeConnected: false,
    uiIntegrated: false,
    dashboardIntegrated: false,
    stage52CStarted: false,
    stage53Started: false,
    rollback: "disable_prompt_context_runtime_or_remove_runtime_exports",
  };
}

function blocked(input: {
  reason: PromptContextRuntimeBlockedReason;
  message: string;
  contractResult?: PromptContextEvaluationResult;
  packet?: PromptContextPacketModel;
  instructionResolved?: boolean;
}): PromptContextRuntimeEvaluationResult {
  return {
    status: "blocked",
    execution: "none",
    version: PROMPT_CONTEXT_RUNTIME_VERSION,
    reason: input.reason,
    message: input.message,
    contractResult: input.contractResult,
    packet: input.packet,
    evidence: promptContextRuntimeSafetyEvidence({
      instructionResolved: input.instructionResolved,
    }),
  };
}

function contractEvidenceIsIsolated(
  result: PromptContextEvaluationResult,
): boolean {
  const evidence = result.evidence;

  return evidence.stage === "5.2A" &&
    evidence.promptContextOnly &&
    evidence.contractsOnly &&
    evidence.foundationOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.decisionSimulationFrameRequired &&
    evidence.chatModeAllowed === false &&
    evidence.answerEngineModeAllowed === false &&
    evidence.rawPromptForwardingAllowed === false &&
    evidence.promptInjectionAllowed === false &&
    evidence.sensitivePersonalDataAllowed === false &&
    evidence.modelCallExecuted === false &&
    evidence.openAiSdkConnected === false &&
    evidence.apiKeysRead === false &&
    evidence.envVariablesRead === false &&
    evidence.apiRouteIntegrated === false &&
    evidence.simulatorIntegrated === false &&
    evidence.decisionEngineRuntimeConnected === false &&
    evidence.aiProviderRuntimeConnected === false &&
    evidence.databaseConnected === false &&
    evidence.supabaseConnected === false &&
    evidence.authRuntimeConnected === false &&
    evidence.persistenceRuntimeConnected === false &&
    evidence.subscriptionsRuntimeConnected === false &&
    evidence.uiIntegrated === false &&
    evidence.dashboardIntegrated === false &&
    evidence.stage52BStarted === false &&
    evidence.stage53Started === false;
}

function packetCharacterCount(packet: PromptContextPacketModel): number {
  const itemCharacters = packet.items.reduce(
    (total, item) => total + item.value.length,
    0,
  );
  const instructionCharacters = packet.instruction.tasks.join(" ").length +
    packet.instruction.forbiddenModes.join(" ").length +
    packet.instruction.outputShape.length;

  return itemCharacters + instructionCharacters;
}

function packetBudgetAllowed(
  packet: PromptContextPacketModel,
  maxRuntimePacketCharacters: number,
): boolean {
  return packetCharacterCount(packet) <= maxRuntimePacketCharacters &&
    packetCharacterCount(packet) <= packet.budget.maxTotalPacketCharacters &&
    packet.items.length <= packet.budget.maxContextItems &&
    packet.items.every(
      (item) => item.value.length <= packet.budget.maxContextItemCharacters,
    );
}

function instructionIsDecisionSimulation(
  instruction: DecisionSimulationInstructionModel,
): boolean {
  return instruction.mode === "decision_simulation" &&
    instruction.outputShape === "structured_decision_simulation_context" &&
    instruction.forbiddenModes.includes("ai_chat") &&
    instruction.forbiddenModes.includes("answer_engine") &&
    instruction.forbiddenModes.includes("raw_prompt_forwarding") &&
    instruction.requiresTradeoffs &&
    instruction.requiresRisks &&
    instruction.requiresConsequences &&
    instruction.requiresUncertainty &&
    instruction.tasks.includes("model_scenarios") &&
    instruction.tasks.includes("compare_tradeoffs") &&
    instruction.tasks.includes("surface_risks") &&
    instruction.tasks.includes("map_consequences") &&
    instruction.tasks.includes("identify_reversibility") &&
    instruction.tasks.includes("preserve_uncertainty");
}

function packetSafetyAllowed(packet: PromptContextPacketModel): boolean {
  const safety = packet.safety;

  return safety.requireDecisionSimulationFrame &&
    safety.requireScenarioTradeoffRiskFrame &&
    safety.allowChatMode === false &&
    safety.allowAnswerEngineMode === false &&
    safety.allowRawPromptForwarding === false &&
    safety.allowPromptInjection === false &&
    safety.allowSensitivePersonalData === false &&
    safety.allowProviderRuntimeDirectAccess === false &&
    safety.allowModelCalls === false &&
    safety.promptContextLayerOnly;
}

function forbiddenPatternsAreFailClosed(
  packet: PromptContextPacketModel,
): boolean {
  return packet.forbiddenPatterns.length > 0 &&
    packet.forbiddenPatterns.every(
      (pattern) =>
        pattern.severity === "block" &&
        pattern.action === "fail_closed" &&
        pattern.tokens.length > 0,
    );
}

export function evaluatePromptContextRuntime(
  config: PromptContextRuntimeConfig,
  input: PromptContextRuntimeEvaluationInput,
): PromptContextRuntimeEvaluationResult {
  if (!config.enabled) {
    return blocked({
      reason: "prompt_context_runtime_disabled",
      message: "Prompt/context runtime foundation is disabled by default.",
    });
  }

  if (!input.input) {
    return blocked({
      reason: "input_missing",
      message: "Prompt/context runtime requires an input contract.",
    });
  }

  const contractResult = config.contracts.evaluateInput(input.input);

  if (!contractEvidenceIsIsolated(contractResult)) {
    return blocked({
      reason: "contract_isolation_failed",
      message:
        "Prompt/context contracts result did not preserve isolation evidence.",
      contractResult,
    });
  }

  if (contractResult.status === "blocked") {
    return blocked({
      reason: contractResult.error.code,
      message: contractResult.error.message,
      contractResult,
    });
  }

  if (!contractResult.packet) {
    return blocked({
      reason: "context_packet_missing",
      message: "Prompt/context contract result did not include a context packet.",
      contractResult,
    });
  }

  const instructionResolved = instructionIsDecisionSimulation(
    contractResult.packet.instruction,
  );

  if (
    config.requireDecisionSimulationInstruction &&
    !instructionResolved
  ) {
    return blocked({
      reason: "instruction_resolution_failed",
      message:
        "Prompt/context runtime could not resolve a decision-simulation instruction.",
      contractResult,
      packet: contractResult.packet,
      instructionResolved,
    });
  }

  if (
    !packetBudgetAllowed(
      contractResult.packet,
      config.maxRuntimePacketCharacters,
    )
  ) {
    return blocked({
      reason: "runtime_context_budget_exceeded",
      message: "Prompt/context runtime packet exceeds runtime budget.",
      contractResult,
      packet: contractResult.packet,
      instructionResolved,
    });
  }

  if (
    !packetSafetyAllowed(contractResult.packet) ||
    !forbiddenPatternsAreFailClosed(contractResult.packet)
  ) {
    return blocked({
      reason: "runtime_safety_guard_failed",
      message:
        "Prompt/context runtime safety guard rejected the context packet.",
      contractResult,
      packet: contractResult.packet,
      instructionResolved,
    });
  }

  return {
    status: "allowed",
    execution: "preflight_only",
    version: PROMPT_CONTEXT_RUNTIME_VERSION,
    packet: contractResult.packet,
    instruction: contractResult.packet.instruction,
    contractResult,
    evidence: promptContextRuntimeSafetyEvidence({
      instructionResolved,
    }),
  };
}

export function createPromptContextRuntimeFoundation(
  config: PromptContextRuntimeConfig = DEFAULT_PROMPT_CONTEXT_RUNTIME_CONFIG,
): PromptContextRuntimeFoundation {
  return {
    version: PROMPT_CONTEXT_RUNTIME_VERSION,
    mode: PROMPT_CONTEXT_RUNTIME_MODE,
    enabled: config.enabled,
    modelCallsEnabled: false,
    evaluate: (input) => evaluatePromptContextRuntime(config, input),
  };
}
