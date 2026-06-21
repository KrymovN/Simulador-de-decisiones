import {
  createAIProviderBoundary,
} from "./boundary";
import {
  type AIProviderBoundary,
  type AIProviderBoundaryResult,
  type AIProviderContractsValidationResult,
  type AIProviderDefinition,
  type AIProviderRequest,
  type AIProviderRuntimePreflightResult,
} from "./contracts";
import {
  createAIProviderRuntimeSelection,
} from "./runtime";
import {
  createAIProviderAdapter,
  runAIProviderContractsValidation,
} from "./validation";

export type AIProviderStage51RegressionArea =
  | "contracts"
  | "runtime_selection"
  | "controlled_boundary";

export type AIProviderStage51RegressionCase = {
  caseId: string;
  area: AIProviderStage51RegressionArea;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AIProviderStage51RegressionResult = {
  passed: boolean;
  failed: boolean;
  contracts: AIProviderContractsValidationResult;
  cases: AIProviderStage51RegressionCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
};

const provider: AIProviderDefinition = {
  providerId: "internal_foundation_provider",
  enabled: true,
  availability: "available",
  capabilities: [
    "decision_simulation_structuring",
    "scenario_generation",
    "risk_tradeoff_analysis",
  ],
};

function request(
  overrides: Partial<AIProviderRequest> = {},
): AIProviderRequest {
  return {
    requestId: "stage_5_1_regression_request",
    providerId: provider.providerId,
    capability: "decision_simulation_structuring",
    inputFingerprint: "stage-5-1-context-fingerprint",
    requestedAt: "2026-06-21T00:00:00.000Z",
    requireStructuredOutput: true,
    tokenBudget: {
      maxInputTokens: 2000,
      maxOutputTokens: 500,
    },
    temperature: 0.2,
    ...overrides,
  };
}

function enabledBoundary(
  providers: AIProviderDefinition[] = [provider],
): AIProviderBoundary {
  const adapter = createAIProviderAdapter({
    enabled: true,
    providers,
  });
  const runtime = createAIProviderRuntimeSelection({
    enabled: true,
    adapter,
    selectionStrategy: "requested_provider_first",
  });

  return createAIProviderBoundary({
    enabled: true,
    runtime,
  });
}

function caseResult(input: {
  caseId: string;
  area: AIProviderStage51RegressionArea;
  issues: string[];
}): AIProviderStage51RegressionCase {
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

function noModelCallIssue(
  result: AIProviderRuntimePreflightResult | AIProviderBoundaryResult,
): string[] {
  return issueUnless(
    result.modelCallExecuted === false,
    "AI provider regression result must not execute model calls.",
  );
}

function runRuntimeReadyCase(): AIProviderStage51RegressionCase {
  const adapter = createAIProviderAdapter({
    enabled: true,
    providers: [provider],
  });
  const runtime = createAIProviderRuntimeSelection({
    enabled: true,
    adapter,
    selectionStrategy: "requested_provider_first",
  });
  const result = runtime.selectProvider({
    request: request(),
  });

  return caseResult({
    caseId: "runtime_selection_ready_preflight_only",
    area: "runtime_selection",
    issues: [
      ...issueUnless(result.status === "ready", "Runtime selection should be ready."),
      ...issueUnless(
        result.execution === "provider_selection_preflight_only",
        "Runtime selection must stay preflight-only.",
      ),
      ...noModelCallIssue(result),
    ],
  });
}

function runUnavailableProviderCase(): AIProviderStage51RegressionCase {
  const adapter = createAIProviderAdapter({
    enabled: true,
    providers: [
      {
        ...provider,
        availability: "unavailable",
      },
    ],
  });
  const runtime = createAIProviderRuntimeSelection({
    enabled: true,
    adapter,
    selectionStrategy: "requested_provider_first",
  });
  const result = runtime.selectProvider({
    request: request(),
  });

  return caseResult({
    caseId: "runtime_selection_unavailable_provider_blocks",
    area: "runtime_selection",
    issues: [
      ...issueUnless(result.status === "blocked", "Unavailable provider should block."),
      ...issueUnless(
        result.status === "blocked" &&
          result.error.code === "provider_unavailable",
        "Unavailable provider should use provider_unavailable.",
      ),
      ...noModelCallIssue(result),
    ],
  });
}

function runBoundaryReadyCase(): AIProviderStage51RegressionCase {
  const result = enabledBoundary().evaluate({
    request: request(),
  });

  return caseResult({
    caseId: "controlled_boundary_ready_preflight_only",
    area: "controlled_boundary",
    issues: [
      ...issueUnless(result.status === "ready", "Boundary should be ready."),
      ...issueUnless(
        result.execution === "controlled_boundary_preflight_only",
        "Boundary must stay controlled preflight-only.",
      ),
      ...noModelCallIssue(result),
    ],
  });
}

function runBoundaryRawPromptCase(): AIProviderStage51RegressionCase {
  const result = enabledBoundary().evaluate({
    request: request(),
    rawPrompt: "forbidden raw prompt",
  });

  return caseResult({
    caseId: "controlled_boundary_rejects_raw_prompt",
    area: "controlled_boundary",
    issues: [
      ...issueUnless(result.status === "blocked", "Raw prompt should block."),
      ...issueUnless(
        result.status === "blocked" &&
          result.error.code === "client_runtime_field_rejected",
        "Raw prompt should use client_runtime_field_rejected.",
      ),
      ...noModelCallIssue(result),
    ],
  });
}

function runBoundaryClientSecretCase(): AIProviderStage51RegressionCase {
  const result = enabledBoundary().evaluate({
    request: {
      ...request(),
      clientRuntimeFields: {
        apiKey: "forbidden",
      },
    },
  });

  return caseResult({
    caseId: "controlled_boundary_rejects_client_runtime_fields",
    area: "controlled_boundary",
    issues: [
      ...issueUnless(
        result.status === "blocked",
        "Client runtime fields should block.",
      ),
      ...issueUnless(
        result.status === "blocked" &&
          result.error.code === "client_runtime_field_rejected",
        "Client runtime fields should use client_runtime_field_rejected.",
      ),
      ...noModelCallIssue(result),
    ],
  });
}

export function runAIProviderStage51Regression(): AIProviderStage51RegressionResult {
  const contracts = runAIProviderContractsValidation();
  const cases: AIProviderStage51RegressionCase[] = [
    caseResult({
      caseId: "contracts_validation_catalog_passes",
      area: "contracts",
      issues: issueUnless(
        contracts.passed && contracts.summary.failed === 0,
        "Contracts validation catalog should pass.",
      ),
    }),
    runRuntimeReadyCase(),
    runUnavailableProviderCase(),
    runBoundaryReadyCase(),
    runBoundaryRawPromptCase(),
    runBoundaryClientSecretCase(),
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
