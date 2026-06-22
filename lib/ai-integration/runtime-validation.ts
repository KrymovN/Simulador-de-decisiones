import {
  type AIIntegrationComponent,
  type AIIntegrationComponentExecution,
  type AIIntegrationComponentReference,
  type AIIntegrationPreflightInput,
  type AIIntegrationPreflightResult,
  type AIIntegrationValidationCaseResult,
  type AIIntegrationValidationResult,
} from "./contracts";
import {
  DEFAULT_AI_INTEGRATION_POLICY,
  createAIIntegrationContractsFoundation,
} from "./validation";
import {
  DEFAULT_AI_INTEGRATION_RUNTIME_CONFIG,
  validateAIIntegrationRuntimePreflight,
} from "./runtime";

type ValidationCase = {
  caseId: string;
  title: string;
  expectedBehavior: string;
  run: () => AIIntegrationPreflightResult;
  assertions: ((
    result: AIIntegrationPreflightResult,
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

function validInput(
  overrides: Partial<AIIntegrationPreflightInput> = {},
): AIIntegrationPreflightInput {
  return {
    preflightId: "stage_5_4b_runtime_preflight",
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
    inputFingerprint: "decision-simulation-context:runtime-fingerprint",
    ...overrides,
  };
}

function evidenceRemainsIsolated(
  result: AIIntegrationPreflightResult,
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
  const enabledContracts = createAIIntegrationContractsFoundation({
    enabled: true,
  });
  const enabledRuntime = {
    ...DEFAULT_AI_INTEGRATION_RUNTIME_CONFIG,
    enabled: true,
    contracts: enabledContracts,
  };

  return [
    {
      caseId: "stage_5_4b_runtime_disabled_by_default",
      title: "Runtime validation fails closed when disabled.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationRuntimePreflight(
          DEFAULT_AI_INTEGRATION_RUNTIME_CONFIG,
          { input: validInput() },
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "runtime_disabled"
            ? undefined
            : "Expected runtime disabled error.",
        (result) =>
          evidenceRemainsIsolated(result)
            ? undefined
            : "Expected isolated evidence.",
      ],
    },
    {
      caseId: "stage_5_4b_runtime_requires_input",
      title: "Runtime validation requires preflight input.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationRuntimePreflight(enabledRuntime, { input: null }),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "runtime_request_missing"
            ? undefined
            : "Expected missing runtime request error.",
      ],
    },
    {
      caseId: "stage_5_4b_runtime_allows_valid_preflight",
      title: "Runtime validation allows a valid execution-free preflight.",
      expectedBehavior: "allowed",
      run: () =>
        validateAIIntegrationRuntimePreflight(enabledRuntime, {
          input: validInput(),
        }),
      assertions: [
        (result) =>
          result.status === "allowed" ? undefined : "Expected allowed result.",
        (result) =>
          evidenceRemainsIsolated(result)
            ? undefined
            : "Expected required evidence flags to remain false.",
      ],
    },
    {
      caseId: "stage_5_4b_runtime_blocks_contract_failure",
      title: "Runtime validation blocks failed contract preflight.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationRuntimePreflight(enabledRuntime, {
          input: validInput({
            clientRuntimeFields: {
              modelCall: true,
            },
          }),
        }),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "contract_preflight_blocked"
            ? undefined
            : "Expected contract preflight block.",
        (result) =>
          evidenceRemainsIsolated(result)
            ? undefined
            : "Expected isolated evidence after contract block.",
      ],
    },
    {
      caseId: "stage_5_4b_runtime_blocks_unsafe_contracts",
      title: "Runtime validation rejects contracts with execution enabled.",
      expectedBehavior: "blocked",
      run: () =>
        validateAIIntegrationRuntimePreflight(
          {
            ...enabledRuntime,
            contracts: {
              ...enabledContracts,
              modelCallsEnabled: true as false,
            },
          },
          { input: validInput() },
        ),
      assertions: [
        (result) =>
          result.status === "blocked" ? undefined : "Expected blocked result.",
        (result) =>
          result.status === "blocked" &&
          result.error.code === "runtime_isolation_failed"
            ? undefined
            : "Expected runtime isolation failure.",
      ],
    },
  ];
}

export function runAIIntegrationRuntimeValidation(): AIIntegrationValidationResult {
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
