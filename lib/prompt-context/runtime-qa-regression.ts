import {
  createPromptContextBoundary,
} from "./boundary";
import {
  type PromptContextBoundary,
  type PromptContextBoundaryResult,
  type PromptContextContractsValidationResult,
  type PromptContextInput,
  type PromptContextRuntime,
  type PromptContextRuntimeResult,
} from "./contracts";
import {
  createPromptContextRuntime,
} from "./runtime";
import {
  DEFAULT_PROMPT_CONTEXT_POLICY,
  DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  createPromptContextContract,
  runPromptContextContractsValidation,
} from "./validation";

export type PromptContextStage52RegressionArea =
  | "contracts"
  | "runtime"
  | "controlled_boundary";

export type PromptContextStage52RegressionCase = {
  caseId: string;
  area: PromptContextStage52RegressionArea;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type PromptContextStage52RegressionResult = {
  passed: boolean;
  failed: boolean;
  contracts: PromptContextContractsValidationResult;
  cases: PromptContextStage52RegressionCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

function input(
  overrides: Partial<PromptContextInput> = {},
): PromptContextInput {
  return {
    inputId: "stage_5_2_regression_input",
    submittedAt: "2026-06-21T00:00:00.000Z",
    locale: "en",
    decisionFrame: {
      objective: "Evaluate a decision simulation option.",
      decisionQuestion: "Should the team proceed now or wait?",
      scenarioSeeds: ["Demand may shift during the next cycle"],
      knownConstraints: ["Budget and timing remain constrained"],
      tradeoffFocus: ["risk", "cost", "opportunity"],
    },
    policy: DEFAULT_PROMPT_CONTEXT_POLICY,
    riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
    ...overrides,
  };
}

function enabledRuntime(): PromptContextRuntime {
  const contract = createPromptContextContract({
    enabled: true,
    policy: DEFAULT_PROMPT_CONTEXT_POLICY,
    riskBoundary: DEFAULT_PROMPT_CONTEXT_RISK_BOUNDARY,
  });

  return createPromptContextRuntime({
    enabled: true,
    contract,
  });
}

function enabledBoundary(): PromptContextBoundary {
  return createPromptContextBoundary({
    enabled: true,
    runtime: enabledRuntime(),
  });
}

function caseResult(input: {
  caseId: string;
  area: PromptContextStage52RegressionArea;
  issues: string[];
}): PromptContextStage52RegressionCase {
  return {
    caseId: input.caseId,
    area: input.area,
    passed: input.issues.length === 0,
    failed: input.issues.length > 0,
    issues: input.issues,
  };
}

function issueUnless(condition: boolean, issue: string): string[] {
  return condition ? [] : [issue];
}

function noIntegrationIssues(
  result: PromptContextRuntimeResult | PromptContextBoundaryResult,
): string[] {
  return [
    ...issueUnless(
      result.evidence.modelCallExecuted === false,
      "Prompt Context regression result must not execute model calls.",
    ),
    ...issueUnless(
      result.evidence.aiProviderRuntimeCalled === false,
      "Prompt Context regression result must not call AI Provider runtime.",
    ),
    ...issueUnless(
      result.evidence.envRead === false,
      "Prompt Context regression result must not read env.",
    ),
    ...issueUnless(
      result.evidence.apiRouteIntegrated === false,
      "Prompt Context regression result must not integrate API routes.",
    ),
    ...issueUnless(
      result.evidence.simulatorRuntimeIntegrated === false,
      "Prompt Context regression result must not integrate Simulator runtime.",
    ),
    ...issueUnless(
      result.evidence.decisionEngineRuntimeIntegrated === false,
      "Prompt Context regression result must not integrate Decision Engine runtime.",
    ),
    ...issueUnless(
      result.evidence.uiIntegrated === false,
      "Prompt Context regression result must not integrate UI.",
    ),
  ];
}

function runRuntimeDisabledCase(): PromptContextStage52RegressionCase {
  const result = createPromptContextRuntime().build({
    requestId: "runtime_disabled",
    input: input(),
  });

  return caseResult({
    caseId: "runtime_disabled_by_default_blocks",
    area: "runtime",
    issues: [
      ...issueUnless(result.status === "blocked", "Runtime should block by default."),
      ...issueUnless(
        result.status === "blocked" && result.error.code === "runtime_disabled",
        "Runtime should use runtime_disabled.",
      ),
      ...noIntegrationIssues(result),
    ],
  });
}

function runRuntimeReadyCase(): PromptContextStage52RegressionCase {
  const result = enabledRuntime().build({
    requestId: "runtime_ready",
    input: input(),
  });

  return caseResult({
    caseId: "runtime_builds_structured_context_only",
    area: "runtime",
    issues: [
      ...issueUnless(result.status === "ready", "Runtime should be ready."),
      ...issueUnless(
        result.execution === "runtime_build_only",
        "Runtime must stay build-only.",
      ),
      ...issueUnless(
        result.status === "ready" &&
          result.output.outputKind === "structured_decision_simulation_context",
        "Runtime output must be structured Decision Simulation context.",
      ),
      ...noIntegrationIssues(result),
    ],
  });
}

function runRuntimeForbiddenFieldCase(): PromptContextStage52RegressionCase {
  const result = enabledRuntime().build({
    requestId: "runtime_forbidden_fields",
    input: input({
      clientFields: {
        apiKey: "forbidden",
      },
    }),
  });

  return caseResult({
    caseId: "runtime_rejects_provider_runtime_fields",
    area: "runtime",
    issues: [
      ...issueUnless(result.status === "blocked", "Runtime should block provider fields."),
      ...issueUnless(
        result.status === "blocked" &&
          result.error.code === "input_validation_failed" &&
          result.error.contractError?.code === "provider_runtime_field_rejected",
        "Runtime should surface provider_runtime_field_rejected.",
      ),
      ...noIntegrationIssues(result),
    ],
  });
}

function runBoundaryDisabledCase(): PromptContextStage52RegressionCase {
  const result = createPromptContextBoundary().evaluate({
    requestId: "boundary_disabled",
    runtime: {
      requestId: "boundary_runtime_disabled",
      input: input(),
    },
  });

  return caseResult({
    caseId: "boundary_disabled_by_default_blocks",
    area: "controlled_boundary",
    issues: [
      ...issueUnless(result.status === "blocked", "Boundary should block by default."),
      ...issueUnless(
        result.status === "blocked" && result.error.code === "boundary_disabled",
        "Boundary should use boundary_disabled.",
      ),
      ...noIntegrationIssues(result),
    ],
  });
}

function runBoundaryReadyCase(): PromptContextStage52RegressionCase {
  const result = enabledBoundary().evaluate({
    requestId: "boundary_ready",
    runtime: {
      requestId: "boundary_runtime_ready",
      input: input(),
    },
  });

  return caseResult({
    caseId: "boundary_ready_after_runtime_build_only",
    area: "controlled_boundary",
    issues: [
      ...issueUnless(result.status === "ready", "Boundary should be ready."),
      ...issueUnless(
        result.execution === "boundary_facade_only",
        "Boundary must stay facade-only.",
      ),
      ...issueUnless(
        result.status === "ready" &&
          result.runtimeResult.execution === "runtime_build_only",
        "Boundary must run runtime build before ready result.",
      ),
      ...noIntegrationIssues(result),
    ],
  });
}

function runBoundaryRawChatCase(): PromptContextStage52RegressionCase {
  const result = enabledBoundary().evaluate({
    requestId: "boundary_raw_chat",
    runtime: {
      requestId: "boundary_runtime_raw_chat",
      input: input(),
    },
    clientFields: {
      rawChatMessages: ["forbidden chat message"],
    },
  });

  return caseResult({
    caseId: "boundary_rejects_raw_chat",
    area: "controlled_boundary",
    issues: [
      ...issueUnless(result.status === "blocked", "Boundary should block raw chat."),
      ...issueUnless(
        result.status === "blocked" &&
          result.error.code === "unsafe_client_fields_rejected",
        "Boundary should use unsafe_client_fields_rejected.",
      ),
      ...noIntegrationIssues(result),
    ],
  });
}

function runBoundaryUserSystemPromptCase(): PromptContextStage52RegressionCase {
  const result = enabledBoundary().evaluate({
    requestId: "boundary_user_system_prompt",
    runtime: {
      requestId: "boundary_runtime_user_system_prompt",
      input: input(),
    },
    userSystemPrompt: "You are a generic assistant.",
  });

  return caseResult({
    caseId: "boundary_rejects_user_system_prompt",
    area: "controlled_boundary",
    issues: [
      ...issueUnless(
        result.status === "blocked",
        "Boundary should block user system prompt.",
      ),
      ...issueUnless(
        result.status === "blocked" &&
          result.error.code === "unsafe_client_fields_rejected",
        "Boundary should use unsafe_client_fields_rejected.",
      ),
      ...noIntegrationIssues(result),
    ],
  });
}

export function runPromptContextStage52Regression(): PromptContextStage52RegressionResult {
  const contracts = runPromptContextContractsValidation();
  const cases: PromptContextStage52RegressionCase[] = [
    caseResult({
      caseId: "contracts_validation_catalog_passes",
      area: "contracts",
      issues: issueUnless(
        contracts.passed && contracts.summary.failed === 0,
        "Contracts validation catalog should pass.",
      ),
    }),
    runRuntimeDisabledCase(),
    runRuntimeReadyCase(),
    runRuntimeForbiddenFieldCase(),
    runBoundaryDisabledCase(),
    runBoundaryReadyCase(),
    runBoundaryRawChatCase(),
    runBoundaryUserSystemPromptCase(),
  ];
  const passed = cases.filter((item) => item.passed).length;
  const failed = cases.length - passed;

  return {
    passed: failed === 0,
    failed: failed > 0,
    contracts,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed,
    },
  };
}
