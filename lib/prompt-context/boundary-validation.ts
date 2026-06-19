import {
  DEFAULT_PROMPT_CONTEXT_BUDGET,
  DEFAULT_PROMPT_CONTEXT_FORBIDDEN_PATTERNS,
  createPromptContextContractsFoundation,
} from "./validation";
import { createPromptContextRuntimeFoundation } from "./runtime";
import { createPromptContextBoundary } from "./boundary";
import type {
  PromptContextBoundaryBlockedReason,
  PromptContextBoundaryEvaluationResult,
  PromptContextBoundaryValidationCaseResult,
  PromptContextBoundaryValidationResult,
  PromptContextInputContract,
  PromptContextRuntimeEvaluationInput,
} from "./contracts";

type ValidationCase = {
  id: string;
  title: string;
  expectedBehavior: string;
  run: () => PromptContextBoundaryEvaluationResult;
  assertions: ((
    result: PromptContextBoundaryEvaluationResult,
  ) => string | undefined)[];
};

const now = "2026-06-19T12:00:00.000Z";

function input(
  overrides: Partial<PromptContextInputContract> = {},
): PromptContextInputContract {
  return {
    inputId: "stage_5_2c_input",
    inputKind: "decision_simulation_brief",
    source: "user_supplied_decision_context",
    submittedAt: now,
    locale: "en",
    objective: "Evaluate whether to expand a product team next quarter.",
    decisionQuestion: "Should the team hire now or delay until revenue improves?",
    decisionHorizon: "medium_term",
    scenarioAnchors: ["Revenue may grow slowly", "Hiring lead time is long"],
    knownConstraints: ["Budget must remain controlled"],
    tradeoffFocus: ["cost", "risk", "opportunity"],
    desiredOutcomeFormat: "structured_decision_simulation_context",
    safety: {
      requireDecisionSimulationFrame: true,
      requireScenarioTradeoffRiskFrame: true,
      allowChatMode: false,
      allowAnswerEngineMode: false,
      allowRawPromptForwarding: false,
      allowPromptInjection: false,
      allowSensitivePersonalData: false,
      allowProviderRuntimeDirectAccess: false,
      allowModelCalls: false,
      promptContextLayerOnly: true,
    },
    budget: DEFAULT_PROMPT_CONTEXT_BUDGET,
    ...overrides,
  };
}

function runtimePayload(
  overrides: Partial<PromptContextRuntimeEvaluationInput> = {},
): PromptContextRuntimeEvaluationInput {
  return {
    input: input(),
    ...overrides,
  };
}

function runtimeEnabled() {
  return createPromptContextRuntimeFoundation({
    enabled: true,
    contracts: createPromptContextContractsFoundation({
      enabled: true,
      forbiddenPatterns: DEFAULT_PROMPT_CONTEXT_FORBIDDEN_PATTERNS,
      budget: DEFAULT_PROMPT_CONTEXT_BUDGET,
    }),
    maxRuntimePacketCharacters: DEFAULT_PROMPT_CONTEXT_BUDGET.maxTotalPacketCharacters,
    requireDecisionSimulationInstruction: true,
    failClosedOnContractBlock: true,
  });
}

function boundaryEnabled() {
  return createPromptContextBoundary({
    enabled: true,
    allowedOperations: ["prompt_context_runtime_preflight"],
    runtime: runtimeEnabled(),
  });
}

function expectBlocked(reason: PromptContextBoundaryBlockedReason) {
  return (
    result: PromptContextBoundaryEvaluationResult,
  ): string | undefined =>
    result.status === "blocked" && result.reason === reason
      ? undefined
      : `Expected blocked boundary result with reason ${String(reason)}.`;
}

function expectAllowed(
  result: PromptContextBoundaryEvaluationResult,
): string | undefined {
  return result.status === "allowed" && result.execution === "preflight_only"
    ? undefined
    : "Expected allowed preflight-only prompt/context boundary result.";
}

function expectRuntimeResult(
  result: PromptContextBoundaryEvaluationResult,
): string | undefined {
  return result.runtimeResult &&
    result.runtimeResult.evidence.stage === "5.2B" &&
    result.runtimeResult.evidence.modelCallExecuted === false &&
    result.runtimeResult.evidence.openAiSdkConnected === false &&
    result.runtimeResult.evidence.apiKeysRead === false &&
    result.runtimeResult.evidence.envVariablesRead === false &&
    result.runtimeResult.evidence.apiRouteIntegrated === false &&
    result.runtimeResult.evidence.simulatorIntegrated === false &&
    result.runtimeResult.evidence.decisionEngineRuntimeConnected === false &&
    result.runtimeResult.evidence.aiProviderRuntimeConnected === false &&
    result.runtimeResult.evidence.databaseConnected === false &&
    result.runtimeResult.evidence.supabaseConnected === false &&
    result.runtimeResult.evidence.authRuntimeConnected === false &&
    result.runtimeResult.evidence.persistenceRuntimeConnected === false &&
    result.runtimeResult.evidence.subscriptionsRuntimeConnected === false &&
    result.runtimeResult.evidence.uiIntegrated === false &&
    result.runtimeResult.evidence.dashboardIntegrated === false
    ? undefined
    : "Expected isolated Stage 5.2B runtime result.";
}

function expectIsolation(
  result: PromptContextBoundaryEvaluationResult,
): string | undefined {
  const evidence = result.evidence;

  return evidence.stage === "5.2C" &&
    evidence.promptContextOnly &&
    evidence.boundaryOnly &&
    evidence.facadeOnly &&
    evidence.deterministicOnly &&
    evidence.failClosedByDefault &&
    evidence.allowedOperationsExplicit &&
    evidence.payloadIsolationEnforced &&
    evidence.runtimeIsolationEnforced &&
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
    evidence.stage52DStarted === false &&
    evidence.stage53Started === false
    ? undefined
    : "Prompt/context boundary isolation evidence changed.";
}

function cases(): ValidationCase[] {
  return [
    {
      id: "disabled_boundary_blocks",
      title: "Disabled prompt/context boundary blocks",
      expectedBehavior: "Boundary fails closed by default.",
      run: () =>
        createPromptContextBoundary().evaluate({
          operation: "prompt_context_runtime_preflight",
          runtime: runtimePayload(),
        }),
      assertions: [
        expectBlocked("prompt_context_boundary_disabled"),
        expectIsolation,
      ],
    },
    {
      id: "missing_operation_blocks",
      title: "Missing operation blocks",
      expectedBehavior: "Boundary requires explicit operation.",
      run: () =>
        boundaryEnabled().evaluate({
          runtime: runtimePayload(),
        }),
      assertions: [expectBlocked("operation_missing"), expectIsolation],
    },
    {
      id: "unsupported_operation_blocks",
      title: "Unsupported operation blocks",
      expectedBehavior: "Boundary rejects unknown operation names.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "model_call",
          runtime: runtimePayload(),
        }),
      assertions: [expectBlocked("operation_not_supported"), expectIsolation],
    },
    {
      id: "disallowed_operation_blocks",
      title: "Disallowed operation blocks",
      expectedBehavior: "Boundary rejects supported operations disabled by config.",
      run: () =>
        createPromptContextBoundary({
          enabled: true,
          allowedOperations: [],
          runtime: runtimeEnabled(),
        }).evaluate({
          operation: "prompt_context_runtime_preflight",
          runtime: runtimePayload(),
        }),
      assertions: [expectBlocked("operation_not_allowed"), expectIsolation],
    },
    {
      id: "missing_payload_blocks",
      title: "Missing payload blocks",
      expectedBehavior: "Boundary requires runtime payload.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "prompt_context_runtime_preflight",
        }),
      assertions: [expectBlocked("payload_missing"), expectIsolation],
    },
    {
      id: "payload_mismatch_blocks",
      title: "Payload mismatch blocks",
      expectedBehavior: "Boundary accepts exactly one payload.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "prompt_context_runtime_preflight",
          runtime: runtimePayload(),
          unexpectedPayload: {
            rawPrompt: "forbidden",
          },
        }),
      assertions: [expectBlocked("payload_mismatch"), expectIsolation],
    },
    {
      id: "runtime_block_propagates",
      title: "Runtime blocked result propagates",
      expectedBehavior: "Boundary preserves fail-closed runtime denial.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "prompt_context_runtime_preflight",
          runtime: runtimePayload({
            input: input({
              clientRuntimeFields: {
                apiKey: "forbidden",
              },
            }),
          }),
        }),
      assertions: [
        expectBlocked("client_runtime_field_rejected"),
        expectRuntimeResult,
        expectIsolation,
      ],
    },
    {
      id: "allowed_runtime_result_passes",
      title: "Allowed runtime result passes",
      expectedBehavior: "Boundary returns allowed preflight when runtime allows.",
      run: () =>
        boundaryEnabled().evaluate({
          operation: "prompt_context_runtime_preflight",
          runtime: runtimePayload(),
        }),
      assertions: [expectAllowed, expectRuntimeResult, expectIsolation],
    },
  ];
}

function runCase(
  input: ValidationCase,
): PromptContextBoundaryValidationCaseResult {
  const result = input.run();
  const issues = input.assertions
    .map((assertion) => assertion(result))
    .filter((issue): issue is string => Boolean(issue));

  return {
    caseId: input.id,
    title: input.title,
    expectedBehavior: input.expectedBehavior,
    actualStatus: result.status,
    passed: issues.length === 0,
    failed: issues.length > 0,
    issues,
  };
}

export function runPromptContextBoundaryValidation(): PromptContextBoundaryValidationResult {
  const results = cases().map(runCase);
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}
