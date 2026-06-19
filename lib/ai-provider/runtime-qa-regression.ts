import { createAiProviderAdapterBoundary } from "./boundary";
import { runAiProviderAdapterBoundaryValidation } from "./boundary-validation";
import { createAiProviderAdapterRuntimeFoundation } from "./runtime";
import { runAiProviderAdapterRuntimeValidation } from "./runtime-validation";
import {
  DEFAULT_AI_PROVIDER_DEFINITIONS,
  createAiProviderAdapterContractsFoundation,
  runAiProviderAdapterContractsValidation,
} from "./validation";
import type {
  AiProviderAdapterBoundaryValidationResult,
  AiProviderAdapterRequestContract,
  AiProviderAdapterRuntimeEvaluationInput,
  AiProviderAdapterRuntimeValidationResult,
  AiProviderAdapterValidationResult,
  AiProviderId,
} from "./contracts";

export type AiProviderAdapterRuntimeQaArea =
  | "contracts"
  | "runtime"
  | "boundary"
  | "aggregate";

export type AiProviderAdapterRuntimeQaCaseResult = {
  caseId: string;
  title: string;
  area: AiProviderAdapterRuntimeQaArea;
  expectedBehavior: string;
  passed: boolean;
  failed: boolean;
  issues: string[];
};

export type AiProviderAdapterRuntimeQaResult = {
  passed: boolean;
  failed: boolean;
  catalogs: {
    contracts: AiProviderAdapterValidationResult;
    runtime: AiProviderAdapterRuntimeValidationResult;
    boundary: AiProviderAdapterBoundaryValidationResult;
  };
  cases: AiProviderAdapterRuntimeQaCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    catalogCases: number;
  };
};

type QaCase = {
  id: string;
  title: string;
  area: AiProviderAdapterRuntimeQaArea;
  expectedBehavior: string;
  run: () => string[];
};

const now = "2026-06-19T12:00:00.000Z";

function request(
  overrides: Partial<AiProviderAdapterRequestContract> = {},
): AiProviderAdapterRequestContract {
  return {
    requestId: "stage_5_1d_request",
    providerId: "openai",
    capability: "decision_simulation_structured_reasoning",
    inputKind: "decision_simulation_context",
    inputFingerprint: "decision-context-fingerprint",
    requestedAt: now,
    constraints: {
      modelId: "future-openai-structured-model",
      maxInputTokens: 2000,
      maxOutputTokens: 500,
      temperature: 0.2,
    },
    safety: {
      requireStructuredOutput: true,
      allowTrainingUse: false,
      allowRawPromptPersistence: false,
      allowSensitivePersonalData: false,
      promptContextLayerConnected: false,
    },
    costBudget: {
      currency: "USD",
      maxEstimatedCostMinorUnits: 0,
      enforcement: "foundation_preflight_only",
    },
    latencyBudget: {
      maxLatencyMs: 5000,
      timeoutMs: 3000,
      enforcement: "foundation_preflight_only",
    },
    ...overrides,
  };
}

function runtimePayload(
  overrides: Partial<AiProviderAdapterRuntimeEvaluationInput> = {},
): AiProviderAdapterRuntimeEvaluationInput {
  return {
    request: request(),
    ...overrides,
  };
}

function enabledContracts() {
  return createAiProviderAdapterContractsFoundation({
    enabled: true,
    providers: DEFAULT_AI_PROVIDER_DEFINITIONS,
  });
}

function enabledRuntime(input: {
  allowedProviders?: AiProviderId[];
  selectionStrategy?: "requested_provider_first" | "first_capable_provider";
} = {}) {
  return createAiProviderAdapterRuntimeFoundation({
    enabled: true,
    adapterConfig: {
      enabled: true,
      providers: DEFAULT_AI_PROVIDER_DEFINITIONS,
    },
    allowedProviders: input.allowedProviders ?? ["openai", "local_contract_stub"],
    selectionStrategy: input.selectionStrategy ?? "requested_provider_first",
  });
}

function enabledBoundary() {
  return createAiProviderAdapterBoundary({
    enabled: true,
    allowedOperations: ["ai_provider_runtime_preflight"],
    runtime: enabledRuntime(),
  });
}

function issueUnless(condition: boolean, issue: string): string[] {
  return condition ? [] : [issue];
}

function collect(...groups: string[][]): string[] {
  return groups.flat();
}

function catalogCases(input: {
  contracts: AiProviderAdapterValidationResult;
  runtime: AiProviderAdapterRuntimeValidationResult;
  boundary: AiProviderAdapterBoundaryValidationResult;
}): Set<string> {
  return new Set([
    ...input.contracts.cases.map((item) => item.caseId),
    ...input.runtime.cases.map((item) => item.caseId),
    ...input.boundary.cases.map((item) => item.caseId),
  ]);
}

function cases(input: {
  contracts: AiProviderAdapterValidationResult;
  runtime: AiProviderAdapterRuntimeValidationResult;
  boundary: AiProviderAdapterBoundaryValidationResult;
}): QaCase[] {
  return [
    {
      id: "validation_catalogs_pass",
      title: "Validation catalogs pass",
      area: "aggregate",
      expectedBehavior:
        "Contracts, runtime, and boundary validation catalogs all pass.",
      run: () =>
        collect(
          issueUnless(input.contracts.passed, "Contracts validation catalog failed."),
          issueUnless(input.runtime.passed, "Runtime validation catalog failed."),
          issueUnless(input.boundary.passed, "Boundary validation catalog failed."),
          issueUnless(
            input.contracts.summary.total > 0 &&
              input.runtime.summary.total > 0 &&
              input.boundary.summary.total > 0,
            "Validation catalogs must expose deterministic case coverage.",
          ),
        ),
    },
    {
      id: "provider_model_catalog_integrity",
      title: "Provider model catalog integrity",
      area: "contracts",
      expectedBehavior:
        "Provider model is explicit, capability-scoped, and Decision Simulation oriented.",
      run: () => {
        const openAiProvider = DEFAULT_AI_PROVIDER_DEFINITIONS.find(
          (provider) => provider.providerId === "openai",
        );
        const localStub = DEFAULT_AI_PROVIDER_DEFINITIONS.find(
          (provider) => provider.providerId === "local_contract_stub",
        );
        const openAiModel = openAiProvider?.models.find(
          (model) => model.modelId === "future-openai-structured-model",
        );

        return collect(
          issueUnless(Boolean(openAiProvider), "OpenAI provider contract is missing."),
          issueUnless(Boolean(localStub), "Local contract stub provider is missing."),
          issueUnless(
            openAiProvider?.kind === "external_model_provider",
            "OpenAI provider must remain an external model provider contract.",
          ),
          issueUnless(
            openAiModel?.supportsStructuredOutput === true,
            "OpenAI provider model must require structured output.",
          ),
          issueUnless(
            openAiModel?.capabilities.includes(
              "decision_simulation_structured_reasoning",
            ) === true,
            "Provider model must preserve decision simulation capability.",
          ),
        );
      },
    },
    {
      id: "request_response_contract_shape",
      title: "Request and response contract shape",
      area: "contracts",
      expectedBehavior:
        "Valid request produces a contract-only structured response with safety, cost, and latency evidence.",
      run: () => {
        const result = enabledContracts().evaluateRequest(request());

        if (result.status !== "allowed") {
          return [`Expected allowed contract result, got ${result.status}.`];
        }

        return collect(
          issueUnless(
            result.responseContract.requestId === "stage_5_1d_request",
            "Response contract must preserve requestId.",
          ),
          issueUnless(
            result.responseContract.outputKind === "structured_adapter_payload",
            "Response contract must stay structured adapter payload only.",
          ),
          issueUnless(
            result.responseContract.safetyEvidence.structuredOutputRequired,
            "Safety evidence must require structured output.",
          ),
          issueUnless(
            result.responseContract.costEvidence.billingConnected === false,
            "Cost evidence must not connect billing.",
          ),
          issueUnless(
            result.responseContract.latencyEvidence.networkCallExecuted === false,
            "Latency evidence must not execute network calls.",
          ),
          issueUnless(
            result.evidence.modelCallExecuted === false &&
              result.evidence.openAiSdkConnected === false,
            "Contracts QA must not execute model calls or connect OpenAI SDK.",
          ),
        );
      },
    },
    {
      id: "provider_selection_requested_provider",
      title: "Requested provider selection",
      area: "runtime",
      expectedBehavior:
        "Runtime selects the requested capable provider through preflight only.",
      run: () => {
        const result = enabledRuntime().evaluate(runtimePayload());

        if (result.status !== "allowed") {
          return [`Expected allowed runtime result, got ${result.status}.`];
        }

        return collect(
          issueUnless(
            result.selection.providerId === "openai",
            "Runtime must select requested OpenAI provider when allowed.",
          ),
          issueUnless(
            result.selection.modelId === "future-openai-structured-model",
            "Runtime must select the provider model from the model catalog.",
          ),
          issueUnless(
            result.execution === "preflight_only" &&
              result.evidence.modelCallExecuted === false,
            "Runtime selection must remain preflight-only.",
          ),
        );
      },
    },
    {
      id: "provider_selection_first_capable",
      title: "First capable provider selection",
      area: "runtime",
      expectedBehavior:
        "Runtime can select the first capable provider from preference order.",
      run: () => {
        const result = enabledRuntime({
          selectionStrategy: "first_capable_provider",
        }).evaluate({
          request: request(),
          providerPreference: ["local_contract_stub", "openai"],
        });

        if (result.status !== "allowed") {
          return [`Expected allowed runtime result, got ${result.status}.`];
        }

        return collect(
          issueUnless(
            result.selection.providerId === "local_contract_stub",
            "Runtime must select local contract stub from preference order.",
          ),
          issueUnless(
            result.selectedRequest.providerId === "local_contract_stub",
            "Selected request must match selected provider.",
          ),
        );
      },
    },
    {
      id: "capability_guard_blocks",
      title: "Capability guard blocks",
      area: "contracts",
      expectedBehavior: "Unsupported provider capability fails closed.",
      run: () => {
        const result = enabledContracts().evaluateRequest(
          request({
            providerId: "local_contract_stub",
            capability: "risk_tradeoff_analysis",
            constraints: {
              ...request().constraints,
              modelId: "local-contract-stub",
            },
          }),
        );

        return issueUnless(
          result.status === "blocked" &&
            result.error.code === "capability_not_supported",
          "Unsupported capability must block with capability_not_supported.",
        );
      },
    },
    {
      id: "safety_guard_blocks",
      title: "Safety guard blocks",
      area: "contracts",
      expectedBehavior: "Unsafe safety requirements fail closed.",
      run: () => {
        const result = enabledContracts().evaluateRequest({
          ...request(),
          safety: {
            requireStructuredOutput: true,
            allowTrainingUse: true,
            allowRawPromptPersistence: false,
            allowSensitivePersonalData: false,
            promptContextLayerConnected: false,
          } as unknown as AiProviderAdapterRequestContract["safety"],
        });

        return issueUnless(
          result.status === "blocked" &&
            result.error.code === "safety_requirements_invalid",
          "Unsafe safety requirements must block with safety_requirements_invalid.",
        );
      },
    },
    {
      id: "cost_latency_guards_block",
      title: "Cost and latency guards block",
      area: "runtime",
      expectedBehavior:
        "Runtime preserves fail-closed cost and latency guard behavior.",
      run: () => {
        const costResult = enabledRuntime().evaluate({
          request: request({
            costBudget: {
              currency: "USD",
              maxEstimatedCostMinorUnits: -1,
              enforcement: "foundation_preflight_only",
            },
          }),
        });
        const latencyResult = enabledRuntime().evaluate({
          request: request({
            latencyBudget: {
              maxLatencyMs: 1000,
              timeoutMs: 2000,
              enforcement: "foundation_preflight_only",
            },
          }),
        });

        return collect(
          issueUnless(
            costResult.status === "blocked" &&
              costResult.reason === "cost_budget_invalid",
            "Invalid cost budget must block at runtime.",
          ),
          issueUnless(
            latencyResult.status === "blocked" &&
              latencyResult.reason === "latency_budget_invalid",
            "Invalid latency budget must block at runtime.",
          ),
        );
      },
    },
    {
      id: "adapter_error_mapping",
      title: "Adapter error mapping",
      area: "runtime",
      expectedBehavior:
        "Runtime maps adapter contract errors into fail-closed runtime decisions.",
      run: () => {
        const result = enabledRuntime().evaluate({
          request: request({
            clientRuntimeFields: {
              apiKey: "forbidden",
            },
          }),
        });

        return collect(
          issueUnless(
            result.status === "blocked" &&
              result.reason === "client_runtime_field_rejected",
            "Runtime must map client runtime field rejection.",
          ),
          issueUnless(
            result.contractResult?.status === "blocked" &&
              result.contractResult.error.code === "client_runtime_field_rejected",
            "Runtime must preserve the blocked contract error.",
          ),
        );
      },
    },
    {
      id: "boundary_isolation",
      title: "Boundary isolation",
      area: "boundary",
      expectedBehavior:
        "Boundary preserves 5.1C isolation and contains nested 5.1B/5.1A evidence.",
      run: () => {
        const result = enabledBoundary().evaluate({
          operation: "ai_provider_runtime_preflight",
          runtime: runtimePayload(),
        });

        if (result.status !== "allowed") {
          return [`Expected allowed boundary result, got ${result.status}.`];
        }

        return collect(
          issueUnless(
            result.evidence.stage === "5.1C" &&
              result.evidence.boundaryOnly &&
              result.evidence.modelCallExecuted === false &&
              result.evidence.openAiSdkConnected === false &&
              result.evidence.apiRouteIntegrated === false &&
              result.evidence.simulatorIntegrated === false,
            "Boundary evidence must remain isolated and integration-free.",
          ),
          issueUnless(
            result.runtimeResult.evidence.stage === "5.1B" &&
              result.runtimeResult.contractResult.evidence.stage === "5.1A",
            "Boundary must preserve nested runtime and contract evidence.",
          ),
        );
      },
    },
    {
      id: "fail_closed_catalog_coverage",
      title: "Fail-closed catalog coverage",
      area: "aggregate",
      expectedBehavior:
        "Aggregated catalogs cover disabled modules, malformed payloads, guard failures, and blocked runtime propagation.",
      run: () => {
        const allCases = catalogCases(input);
        const required = [
          "disabled_foundation_blocks",
          "client_runtime_fields_block",
          "unsafe_safety_requirements_block",
          "disabled_runtime_blocks",
          "missing_request_blocks",
          "provider_not_allowed_blocks",
          "contract_error_maps_token_limit",
          "cost_guard_blocks",
          "latency_guard_blocks",
          "disabled_boundary_blocks",
          "unsupported_operation_blocks",
          "payload_mismatch_blocks",
          "runtime_block_propagates",
        ];

        return required
          .filter((caseId) => !allCases.has(caseId))
          .map((caseId) => `Missing fail-closed catalog case ${caseId}.`);
      },
    },
  ];
}

function runCase(input: QaCase): AiProviderAdapterRuntimeQaCaseResult {
  const issues = input.run();

  return {
    caseId: input.id,
    title: input.title,
    area: input.area,
    expectedBehavior: input.expectedBehavior,
    passed: issues.length === 0,
    failed: issues.length > 0,
    issues,
  };
}

export function runAiProviderAdapterRuntimeQaRegression(): AiProviderAdapterRuntimeQaResult {
  const catalogs = {
    contracts: runAiProviderAdapterContractsValidation(),
    runtime: runAiProviderAdapterRuntimeValidation(),
    boundary: runAiProviderAdapterBoundaryValidation(),
  };
  const results = cases(catalogs).map(runCase);
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const catalogCases =
    catalogs.contracts.summary.total +
    catalogs.runtime.summary.total +
    catalogs.boundary.summary.total;

  return {
    passed: failed === 0 && catalogs.contracts.passed && catalogs.runtime.passed &&
      catalogs.boundary.passed,
    failed: failed > 0 || catalogs.contracts.failed || catalogs.runtime.failed ||
      catalogs.boundary.failed,
    catalogs,
    cases: results,
    summary: {
      total: results.length,
      passed,
      failed,
      catalogCases,
    },
  };
}
