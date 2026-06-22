import {
  AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
  AI_PROVIDER_RUNTIME_SELECTION_VERSION,
  type AIProviderBoundaryResult,
} from "../ai-provider/contracts";
import {
  AI_QUALITY_BOUNDARY_VERSION,
  AI_QUALITY_RUNTIME_VERSION,
  type AiQualityBoundaryEvaluationResult,
} from "../ai-quality/contracts";
import {
  PROMPT_CONTEXT_BOUNDARY_VERSION,
  PROMPT_CONTEXT_CONTRACTS_VERSION,
  PROMPT_CONTEXT_RUNTIME_VERSION,
  type PromptContextBoundaryResult,
} from "../prompt-context/contracts";
import {
  type AIIntegrationBoundaryCompositionInput,
  type AIIntegrationBoundaryCompositionResult,
  type AIIntegrationComponent,
  type AIIntegrationComponentExecution,
  type AIIntegrationComponentReference,
  type AIIntegrationPreflightInput,
  type AIIntegrationValidationCaseResult,
  type AIIntegrationValidationResult,
} from "./contracts";
import {
  DEFAULT_AI_INTEGRATION_POLICY,
  createAIIntegrationContractsFoundation,
} from "./validation";
import { createAIIntegrationRuntimeFoundation } from "./runtime";
import {
  DEFAULT_AI_INTEGRATION_BOUNDARY_COMPOSITION_CONFIG,
  composeAIIntegrationBoundaries,
} from "./boundary-composition";

type ValidationCase = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  run: () => AIIntegrationBoundaryCompositionResult;
  assertions: ((
    result: AIIntegrationBoundaryCompositionResult,
  ) => string | undefined)[];
};

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

function preflightInput(
  overrides: Partial<AIIntegrationPreflightInput> = {},
): AIIntegrationPreflightInput {
  return {
    preflightId: "stage_5_4c_preflight",
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
    inputFingerprint: "stage-5-4c:fingerprint",
    ...overrides,
  };
}

function promptContextBoundary(
  overrides: Partial<Extract<PromptContextBoundaryResult, { status: "ready" }>> = {},
): PromptContextBoundaryResult {
  return {
    status: "ready",
    execution: "boundary_facade_only",
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    requestId: "stage_5_4c_prompt_context",
    runtimeResult: {
      status: "ready",
      execution: "runtime_build_only",
      version: PROMPT_CONTEXT_RUNTIME_VERSION,
      requestId: "stage_5_4c_prompt_context",
      inputValidation: {
        status: "valid",
        execution: "contract_validation_only",
        version: PROMPT_CONTEXT_CONTRACTS_VERSION,
        evidence: {
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
        },
      },
      outputValidation: {
        status: "valid",
        execution: "contract_validation_only",
        version: PROMPT_CONTEXT_CONTRACTS_VERSION,
        evidence: {
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
        },
      },
      output: {
        outputId: "stage_5_4c_context_output",
        inputId: "stage_5_4c_context_input",
        outputKind: "structured_decision_simulation_context",
        contextFrame: {
          objective: "Evaluate controlled AI integration.",
          decisionQuestion: "Can the boundaries compose safely?",
          scenarioSeeds: ["foundation-only composition"],
          knownConstraints: ["no model calls"],
          tradeoffFocus: ["safety", "cost", "quality"],
        },
        policy: {
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
        },
        riskBoundary: {
          requireScenarioFrame: true,
          requireRiskFrame: true,
          requireTradeoffFrame: true,
          requireConsequenceFrame: true,
          requireUncertaintyFrame: true,
          allowFinalAdvice: false,
          allowDirectAnswer: false,
        },
        evidence: {
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
        },
        directAnswerMode: false,
        genericAssistantMode: false,
        chatMode: false,
        modelCallExecuted: false,
        aiProviderRuntimeCalled: false,
      },
      evidence: {
        stage: "5.2B",
        promptContextOnly: true,
        runtimeOnly: true,
        contractsFoundationUsed: true,
        providerAgnostic: true,
        decisionSimulationFramePreserved: true,
        structuredContextBuilt: true,
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
      },
    },
    output: {
      outputId: "stage_5_4c_context_output",
      inputId: "stage_5_4c_context_input",
      outputKind: "structured_decision_simulation_context",
      contextFrame: {
        objective: "Evaluate controlled AI integration.",
        decisionQuestion: "Can the boundaries compose safely?",
        scenarioSeeds: ["foundation-only composition"],
        knownConstraints: ["no model calls"],
        tradeoffFocus: ["safety", "cost", "quality"],
      },
      policy: {
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
      },
      riskBoundary: {
        requireScenarioFrame: true,
        requireRiskFrame: true,
        requireTradeoffFrame: true,
        requireConsequenceFrame: true,
        requireUncertaintyFrame: true,
        allowFinalAdvice: false,
        allowDirectAnswer: false,
      },
      evidence: {
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
      },
      directAnswerMode: false,
      genericAssistantMode: false,
      chatMode: false,
      modelCallExecuted: false,
      aiProviderRuntimeCalled: false,
    },
    evidence: {
      stage: "5.2C",
      promptContextOnly: true,
      boundaryOnly: true,
      runtimeFoundationUsed: true,
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
      stage52DStarted: false,
      stage53Started: false,
    },
    ...overrides,
  };
}

function aiProviderBoundary(
  overrides: Partial<Extract<AIProviderBoundaryResult, { status: "ready" }>> = {},
): AIProviderBoundaryResult {
  return {
    status: "ready",
    execution: "controlled_boundary_preflight_only",
    version: AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
    providerId: "foundation_provider",
    capability: "scenario_generation",
    preflight: {
      status: "ready",
      execution: "provider_selection_preflight_only",
      version: AI_PROVIDER_RUNTIME_SELECTION_VERSION,
      providerId: "foundation_provider",
      capability: "scenario_generation",
      selectionStrategy: "requested_provider_first",
      availability: {
        providerId: "foundation_provider",
        available: true,
        enabled: true,
        supportsCapability: true,
        capability: "scenario_generation",
      },
      contractResponse: {
        status: "validated",
        execution: "contract_validation_only",
        requestId: "stage_5_4c_provider_request",
        providerId: "foundation_provider",
        capability: "scenario_generation",
        modelCallExecuted: false,
        outputFingerprint: "provider-boundary:fingerprint",
      },
      modelCallExecuted: false,
    },
    modelCallExecuted: false,
    ...overrides,
  };
}

function aiQualityBoundary(
  overrides: Partial<Extract<AiQualityBoundaryEvaluationResult, { status: "allowed" }>> = {},
): AiQualityBoundaryEvaluationResult {
  return {
    status: "allowed",
    execution: "boundary_preflight_only",
    version: AI_QUALITY_BOUNDARY_VERSION,
    operation: "ai_quality_runtime_preflight",
    runtimeResult: {
      status: "allowed",
      execution: "preflight_only",
      version: AI_QUALITY_RUNTIME_VERSION,
      releaseGateDecision: "approved_for_foundation_preflight",
      weightedQualityScore: 0.95,
      severitySummary: {
        info: 0,
        warning: 0,
        blocking: 0,
        highestSeverity: "none",
      },
      contractResult: {
        status: "allowed",
        execution: "contract_validation_only",
        version: "5.3A-ai-quality-cost-safety-contracts-foundation.1",
        releaseGateStatus: "approved_for_foundation_preflight",
        weightedQualityScore: 0.95,
        evidence: {
          stage: "5.3A",
          aiQualityOnly: true,
          contractsOnly: true,
          foundationOnly: true,
          deterministicOnly: true,
          failClosedByDefault: true,
          qualityEvaluationDefined: true,
          costBudgetDefined: true,
          safetyValidationDefined: true,
          releaseGateDefined: true,
          validationEvidenceDefined: true,
          genericAssistantBehaviorAllowed: false,
          modelCallExecuted: false,
          openAiSdkConnected: false,
          apiKeysRead: false,
          envVariablesRead: false,
          apiRouteIntegrated: false,
          simulatorIntegrated: false,
          decisionEngineRuntimeConnected: false,
          aiProviderRuntimeConnected: false,
          promptContextRuntimeConnected: false,
          databaseConnected: false,
          supabaseConnected: false,
          authRuntimeConnected: false,
          persistenceRuntimeConnected: false,
          subscriptionsRuntimeConnected: false,
          uiIntegrated: false,
          dashboardIntegrated: false,
          rollback: "disable_ai_quality_contracts_or_remove_ai_quality_exports",
        },
      },
      evidence: {
        stage: "5.3B",
        aiQualityOnly: true,
        runtimeFoundationOnly: true,
        contractsFoundationUsed: true,
        deterministicOnly: true,
        failClosedByDefault: true,
        qualityGateEvaluated: true,
        costBudgetEvaluated: true,
        safetyGateEvaluated: true,
        releaseGateEvaluated: true,
        severityAggregated: true,
        genericAssistantBehaviorAllowed: false,
        modelCallExecuted: false,
        openAiSdkConnected: false,
        apiKeysRead: false,
        envVariablesRead: false,
        apiRouteIntegrated: false,
        simulatorIntegrated: false,
        decisionEngineRuntimeConnected: false,
        aiProviderRuntimeConnected: false,
        promptContextRuntimeConnected: false,
        databaseConnected: false,
        supabaseConnected: false,
        authRuntimeConnected: false,
        persistenceRuntimeConnected: false,
        subscriptionsRuntimeConnected: false,
        uiIntegrated: false,
        dashboardIntegrated: false,
        stage53CStarted: false,
        rollback: "disable_ai_quality_runtime_or_remove_runtime_exports",
      },
    },
    evidence: {
      stage: "5.3C",
      aiQualityOnly: true,
      boundaryOnly: true,
      facadeOnly: true,
      deterministicOnly: true,
      failClosedByDefault: true,
      allowedOperationsExplicit: true,
      payloadIsolationEnforced: true,
      runtimeIsolationEnforced: true,
      genericAssistantBehaviorAllowed: false,
      modelCallExecuted: false,
      openAiSdkConnected: false,
      apiKeysRead: false,
      envVariablesRead: false,
      apiRouteIntegrated: false,
      simulatorIntegrated: false,
      decisionEngineRuntimeConnected: false,
      aiProviderRuntimeConnected: false,
      promptContextRuntimeConnected: false,
      databaseConnected: false,
      supabaseConnected: false,
      authRuntimeConnected: false,
      persistenceRuntimeConnected: false,
      subscriptionsRuntimeConnected: false,
      uiIntegrated: false,
      dashboardIntegrated: false,
      stage53DStarted: false,
      rollback: "disable_ai_quality_boundary_or_remove_boundary_exports",
    },
    ...overrides,
  };
}

function compositionInput(
  overrides: Partial<AIIntegrationBoundaryCompositionInput> = {},
): AIIntegrationBoundaryCompositionInput {
  return {
    compositionId: "stage_5_4c_boundary_composition",
    requestedAt: "2026-06-22T00:00:00.000Z",
    inputFingerprint: "stage-5-4c:fingerprint",
    policy: DEFAULT_AI_INTEGRATION_POLICY,
    promptContextBoundary: promptContextBoundary(),
    preflightInput: preflightInput(),
    aiProviderBoundary: aiProviderBoundary(),
    aiQualityBoundary: aiQualityBoundary(),
    ...overrides,
  };
}

function enabledCompositionConfig() {
  const contracts = createAIIntegrationContractsFoundation({
    enabled: true,
  });
  const runtime = createAIIntegrationRuntimeFoundation({
    enabled: true,
    contracts,
    failClosedOnContractBlock: true,
  });

  return {
    ...DEFAULT_AI_INTEGRATION_BOUNDARY_COMPOSITION_CONFIG,
    enabled: true,
    runtime,
  };
}

function evidenceRemainsIsolated(
  result: AIIntegrationBoundaryCompositionResult,
): boolean {
  return result.evidence.modelCallExecuted === false &&
    result.evidence.openAiSdkConnected === false &&
    result.evidence.envRead === false &&
    result.evidence.apiRouteIntegrated === false &&
    result.evidence.simulatorIntegrated === false &&
    result.evidence.decisionEngineRuntimeConnected === false &&
    result.evidence.uiIntegrated === false;
}

function validationCases(): ValidationCase[] {
  const enabledConfig = enabledCompositionConfig();

  return [
    {
      caseId: "stage_5_4c_composition_disabled_by_default",
      title: "Boundary composition fails closed when disabled.",
      expectedBehavior: "blocked",
      run: () =>
        composeAIIntegrationBoundaries(
          DEFAULT_AI_INTEGRATION_BOUNDARY_COMPOSITION_CONFIG,
          compositionInput(),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "composition_disabled"
            ? undefined
            : "Expected composition disabled reason.",
        (result) =>
          evidenceRemainsIsolated(result)
            ? undefined
            : "Expected isolated evidence.",
      ],
    },
    {
      caseId: "stage_5_4c_valid_boundary_composition",
      title: "Ready boundaries compose through runtime preflight.",
      expectedBehavior: "allowed",
      run: () =>
        composeAIIntegrationBoundaries(enabledConfig, compositionInput()),
      assertions: [
        (result) =>
          result.status === "allowed" ? undefined : "Expected allowed result.",
        (result) =>
          result.status === "allowed" &&
          result.evidence.promptContextBoundaryComposed &&
          result.evidence.aiIntegrationRuntimePreflightComposed &&
          result.evidence.aiProviderBoundaryComposed &&
          result.evidence.aiQualityBoundaryComposed
            ? undefined
            : "Expected all boundaries to compose.",
        (result) =>
          evidenceRemainsIsolated(result)
            ? undefined
            : "Expected required evidence flags to remain false.",
      ],
    },
    {
      caseId: "stage_5_4c_blocks_prompt_context_boundary",
      title: "Blocked Prompt Context boundary blocks composition.",
      expectedBehavior: "blocked",
      run: () =>
        composeAIIntegrationBoundaries(
          enabledConfig,
          compositionInput({
            promptContextBoundary: {
              status: "blocked",
              execution: "none",
              version: PROMPT_CONTEXT_BOUNDARY_VERSION,
              error: {
                code: "boundary_disabled",
                message: "Prompt Context boundary blocked.",
                recoverable: false,
              },
              evidence: promptContextBoundary().evidence,
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "prompt_context_boundary_blocked"
            ? undefined
            : "Expected Prompt Context boundary block.",
      ],
    },
    {
      caseId: "stage_5_4c_blocks_runtime_preflight",
      title: "Failed AI Integration runtime preflight blocks composition.",
      expectedBehavior: "blocked",
      run: () =>
        composeAIIntegrationBoundaries(
          enabledConfig,
          compositionInput({
            preflightInput: preflightInput({
              clientRuntimeFields: {
                modelCall: true,
              },
            }),
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "ai_integration_preflight_blocked"
            ? undefined
            : "Expected runtime preflight block.",
      ],
    },
    {
      caseId: "stage_5_4c_blocks_ai_provider_boundary",
      title: "Blocked AI Provider boundary blocks composition.",
      expectedBehavior: "blocked",
      run: () =>
        composeAIIntegrationBoundaries(
          enabledConfig,
          compositionInput({
            aiProviderBoundary: {
              status: "blocked",
              execution: "none",
              version: AI_PROVIDER_CONTROLLED_BOUNDARY_VERSION,
              modelCallExecuted: false,
              error: {
                code: "runtime_preflight_blocked",
                message: "AI Provider boundary blocked.",
                recoverable: false,
              },
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "ai_provider_boundary_blocked"
            ? undefined
            : "Expected AI Provider boundary block.",
      ],
    },
    {
      caseId: "stage_5_4c_blocks_ai_quality_boundary",
      title: "Blocked AI Quality boundary blocks composition.",
      expectedBehavior: "blocked",
      run: () =>
        composeAIIntegrationBoundaries(
          enabledConfig,
          compositionInput({
            aiQualityBoundary: {
              status: "blocked",
              execution: "none",
              version: AI_QUALITY_BOUNDARY_VERSION,
              operation: "ai_quality_runtime_preflight",
              reason: "release_gate_blocked",
              message: "AI Quality boundary blocked.",
              error: {
                code: "release_gate_blocked",
                message: "AI Quality boundary blocked.",
                recoverable: false,
              },
              evidence: aiQualityBoundary().evidence,
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "ai_quality_boundary_blocked"
            ? undefined
            : "Expected AI Quality boundary block.",
      ],
    },
    {
      caseId: "stage_5_4c_rejects_unsafe_client_fields",
      title: "Composition rejects unsafe runtime fields.",
      expectedBehavior: "blocked",
      run: () =>
        composeAIIntegrationBoundaries(
          enabledConfig,
          compositionInput({
            clientRuntimeFields: {
              apiKey: "sk-test",
              envVarName: "OPENAI_API_KEY",
              streaming: true,
            },
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "unsafe_client_field_rejected"
            ? undefined
            : "Expected unsafe client field rejection.",
      ],
    },
  ];
}

export function runAIIntegrationBoundaryCompositionValidation(): AIIntegrationValidationResult {
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
