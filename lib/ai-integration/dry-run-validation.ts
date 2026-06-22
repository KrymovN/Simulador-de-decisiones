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
  type AIIntegrationDryRunRequest,
  type AIIntegrationDryRunResult,
  type AIIntegrationPreflightInput,
  type AIIntegrationValidationCaseResult,
  type AIIntegrationValidationResult,
} from "./contracts";
import {
  DEFAULT_AI_INTEGRATION_POLICY,
  createAIIntegrationContractsFoundation,
} from "./validation";
import { createAIIntegrationRuntimeFoundation } from "./runtime";
import { createAIIntegrationBoundaryCompositionFoundation } from "./boundary-composition";
import {
  DEFAULT_AI_INTEGRATION_DRY_RUN_CONFIG,
  executeAIIntegrationDryRun,
} from "./dry-run";

type ValidationCase = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  run: () => AIIntegrationDryRunResult;
  assertions: ((result: AIIntegrationDryRunResult) => string | undefined)[];
};

function preflightInput(
  overrides: Partial<AIIntegrationPreflightInput> = {},
): AIIntegrationPreflightInput {
  return {
    preflightId: "stage_5_4d_preflight",
    operation: "controlled_ai_integration_preflight",
    requestedAt: "2026-06-22T00:00:00.000Z",
    scope: "decision_simulation_ai_integration_preflight",
    policy: DEFAULT_AI_INTEGRATION_POLICY,
    promptContext: {
      component: "prompt_context_boundary",
      version: "prompt_context_boundary.foundation",
      status: "ready",
      execution: "boundary_facade_only",
      modelCallExecuted: false,
      providerExecutionCompleted: false,
    },
    aiProvider: {
      component: "ai_provider_boundary",
      version: "ai_provider_boundary.foundation",
      status: "ready",
      execution: "controlled_boundary_preflight_only",
      modelCallExecuted: false,
      providerExecutionCompleted: false,
    },
    aiQuality: {
      component: "ai_quality_boundary",
      version: "ai_quality_boundary.foundation",
      status: "allowed",
      execution: "boundary_preflight_only",
      modelCallExecuted: false,
      providerExecutionCompleted: false,
    },
    inputFingerprint: "stage-5-4d:fingerprint",
    ...overrides,
  };
}

function promptContextBoundary(): PromptContextBoundaryResult {
  const contractEvidence = {
    stage: "5.2A" as const,
    promptContextOnly: true as const,
    contractsOnly: true as const,
    providerAgnostic: true as const,
    decisionSimulationFramePreserved: true as const,
    rawChatMessagesAllowed: false as const,
    userSystemPromptAllowed: false as const,
    directAnswerModeAllowed: false as const,
    genericAssistantBehaviorAllowed: false as const,
    providerRuntimeFieldsAllowed: false as const,
    modelCallExecuted: false as const,
    aiProviderRuntimeCalled: false as const,
    envRead: false as const,
    apiKeyRead: false as const,
    apiRouteIntegrated: false as const,
    simulatorRuntimeIntegrated: false as const,
    decisionEngineRuntimeIntegrated: false as const,
    uiIntegrated: false as const,
    stage52BStarted: false as const,
    stage53Started: false as const,
  };
  const output = {
    outputId: "stage_5_4d_context_output",
    inputId: "stage_5_4d_context_input",
    outputKind: "structured_decision_simulation_context" as const,
    contextFrame: {
      objective: "Evaluate controlled dry-run.",
      decisionQuestion: "Can dry-run execute without AI calls?",
      scenarioSeeds: ["foundation-only dry-run"],
      knownConstraints: ["no model calls"],
      tradeoffFocus: ["safety", "cost", "quality"],
    },
    policy: {
      mode: "decision_simulation_context" as const,
      requireStructuredContext: true as const,
      promptContextOnly: true as const,
      allowRawChatMessages: false as const,
      allowUserSystemPrompt: false as const,
      allowDirectAnswerMode: false as const,
      allowGenericAssistantBehavior: false as const,
      allowProviderRuntimeFields: false as const,
      allowModelCalls: false as const,
      maxContextCharacters: 6000,
    },
    riskBoundary: {
      requireScenarioFrame: true as const,
      requireRiskFrame: true as const,
      requireTradeoffFrame: true as const,
      requireConsequenceFrame: true as const,
      requireUncertaintyFrame: true as const,
      allowFinalAdvice: false as const,
      allowDirectAnswer: false as const,
    },
    evidence: contractEvidence,
    directAnswerMode: false as const,
    genericAssistantMode: false as const,
    chatMode: false as const,
    modelCallExecuted: false as const,
    aiProviderRuntimeCalled: false as const,
  };

  return {
    status: "ready",
    execution: "boundary_facade_only",
    version: PROMPT_CONTEXT_BOUNDARY_VERSION,
    requestId: "stage_5_4d_prompt_context",
    runtimeResult: {
      status: "ready",
      execution: "runtime_build_only",
      version: PROMPT_CONTEXT_RUNTIME_VERSION,
      requestId: "stage_5_4d_prompt_context",
      output,
      inputValidation: {
        status: "valid",
        execution: "contract_validation_only",
        version: PROMPT_CONTEXT_CONTRACTS_VERSION,
        evidence: contractEvidence,
      },
      outputValidation: {
        status: "valid",
        execution: "contract_validation_only",
        version: PROMPT_CONTEXT_CONTRACTS_VERSION,
        evidence: contractEvidence,
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
    output,
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
  };
}

function aiProviderBoundary(): AIProviderBoundaryResult {
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
        requestId: "stage_5_4d_provider_request",
        providerId: "foundation_provider",
        capability: "scenario_generation",
        modelCallExecuted: false,
        outputFingerprint: "provider-boundary:fingerprint",
      },
      modelCallExecuted: false,
    },
    modelCallExecuted: false,
  };
}

function aiQualityBoundary(): AiQualityBoundaryEvaluationResult {
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
  };
}

function compositionInput(
  overrides: Partial<AIIntegrationBoundaryCompositionInput> = {},
): AIIntegrationBoundaryCompositionInput {
  return {
    compositionId: "stage_5_4d_composition",
    requestedAt: "2026-06-22T00:00:00.000Z",
    inputFingerprint: "stage-5-4d:fingerprint",
    policy: DEFAULT_AI_INTEGRATION_POLICY,
    promptContextBoundary: promptContextBoundary(),
    preflightInput: preflightInput(),
    aiProviderBoundary: aiProviderBoundary(),
    aiQualityBoundary: aiQualityBoundary(),
    ...overrides,
  };
}

function dryRunRequest(
  overrides: Partial<AIIntegrationDryRunRequest> = {},
): AIIntegrationDryRunRequest {
  return {
    dryRunId: "stage_5_4d_dry_run",
    requestedAt: "2026-06-22T00:00:00.000Z",
    inputFingerprint: "stage-5-4d:fingerprint",
    composition: compositionInput(),
    ...overrides,
  };
}

function enabledDryRunConfig() {
  const contracts = createAIIntegrationContractsFoundation({
    enabled: true,
  });
  const runtime = createAIIntegrationRuntimeFoundation({
    enabled: true,
    contracts,
    failClosedOnContractBlock: true,
  });
  const composition = createAIIntegrationBoundaryCompositionFoundation({
    enabled: true,
    runtime,
  });

  return {
    ...DEFAULT_AI_INTEGRATION_DRY_RUN_CONFIG,
    enabled: true,
    composition,
  };
}

function evidenceRemainsIsolated(result: AIIntegrationDryRunResult): boolean {
  return result.evidence.modelCallExecuted === false &&
    result.evidence.openAiSdkConnected === false &&
    result.evidence.envRead === false &&
    result.evidence.apiRouteIntegrated === false &&
    result.evidence.simulatorIntegrated === false &&
    result.evidence.decisionEngineRuntimeConnected === false &&
    result.evidence.uiIntegrated === false;
}

function validationCases(): ValidationCase[] {
  const enabledConfig = enabledDryRunConfig();

  return [
    {
      caseId: "stage_5_4d_dry_run_disabled_by_default",
      title: "Dry-run fails closed when disabled.",
      expectedBehavior: "blocked",
      run: () =>
        executeAIIntegrationDryRun(
          DEFAULT_AI_INTEGRATION_DRY_RUN_CONFIG,
          dryRunRequest(),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" && result.reason === "dry_run_disabled"
            ? undefined
            : "Expected dry-run disabled reason.",
        (result) =>
          evidenceRemainsIsolated(result)
            ? undefined
            : "Expected isolated dry-run evidence.",
      ],
    },
    {
      caseId: "stage_5_4d_dry_run_requires_request",
      title: "Dry-run requires a request.",
      expectedBehavior: "blocked",
      run: () => executeAIIntegrationDryRun(enabledConfig, null),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "dry_run_request_missing"
            ? undefined
            : "Expected missing request reason.",
      ],
    },
    {
      caseId: "stage_5_4d_dry_run_completes_without_ai_call",
      title: "Dry-run completes through composition without AI execution.",
      expectedBehavior: "completed",
      run: () => executeAIIntegrationDryRun(enabledConfig, dryRunRequest()),
      assertions: [
        (result) =>
          result.status === "completed"
            ? undefined
            : "Expected completed dry-run.",
        (result) =>
          result.status === "completed" &&
          result.execution === "dry_run_preflight_only" &&
          result.evidence.aiCallConfirmedAbsent === true
            ? undefined
            : "Expected preflight-only dry-run completion.",
        (result) =>
          evidenceRemainsIsolated(result)
            ? undefined
            : "Expected required evidence flags to remain false.",
      ],
    },
    {
      caseId: "stage_5_4d_dry_run_blocks_unsafe_fields",
      title: "Dry-run rejects unsafe runtime fields.",
      expectedBehavior: "blocked",
      run: () =>
        executeAIIntegrationDryRun(
          enabledConfig,
          dryRunRequest({
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
    {
      caseId: "stage_5_4d_dry_run_blocks_composition_failure",
      title: "Dry-run blocks when composition blocks.",
      expectedBehavior: "blocked",
      run: () =>
        executeAIIntegrationDryRun(
          enabledConfig,
          dryRunRequest({
            composition: compositionInput({
              preflightInput: preflightInput({
                clientRuntimeFields: {
                  modelCall: true,
                },
              }),
            }),
          }),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "dry_run_composition_blocked"
            ? undefined
            : "Expected composition block.",
      ],
    },
    {
      caseId: "stage_5_4d_dry_run_blocks_unsafe_composition_foundation",
      title: "Dry-run rejects unsafe composition foundation.",
      expectedBehavior: "blocked",
      run: () =>
        executeAIIntegrationDryRun(
          {
            ...enabledConfig,
            composition: {
              ...enabledConfig.composition,
              modelCallsEnabled: true as false,
            },
          },
          dryRunRequest(),
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.reason === "dry_run_composition_disabled"
            ? undefined
            : "Expected unsafe composition foundation block.",
      ],
    },
  ];
}

export function runAIIntegrationDryRunValidation(): AIIntegrationValidationResult {
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
