import "server-only";

import {
  DecisionMaterialTransportFailure,
  type DecisionMaterialProviderRequest,
  type DecisionMaterialTransport,
  type DecisionMaterialTransportGeneration,
} from "../ai-provider/openai-decision-material-adapter";
import { validCandidateDecisionMaterial } from
  "../ai-provider/openai-decision-material-adapter-validation";
import { runMinimumNecessaryPromptContextProof } from
  "../ai-integration/minimum-necessary-prompt-context-proof";
import { validPostProviderBridgeRequest } from
  "../decision-engine/post-provider-boundary-validation";
import { runSimulationResponseV2UiMappingValidation } from
  "../decision-engine/simulation-response-v2-ui-mapping-validation";
import {
  bindControlledProductionAiRuntimeSwitch,
  CONTROLLED_PRODUCTION_AI_PUBLIC_FAILURE_MESSAGE,
} from "./controlled-production-ai-runtime-switch.server";
import {
  CONTROLLED_SIMULATOR_SWITCH_MODE,
  CONTROLLED_SIMULATOR_SWITCH_VERSION,
  type ControlledProductionAiFailureResult,
  type ControlledServerRuntimeSelectionResult,
  type ControlledSimulatorSwitchRequest,
} from "./controlled-simulator-runtime-switch-contracts";

export const CONTROLLED_FAILURE_PRODUCT_PRESENTATION_PROOF_VERSION =
  "stage-9-controlled-failure-product-presentation-proof.1" as const;

export type ControlledFailureProductPresentationProofCheck = {
  checkId: string;
  passed: boolean;
};

export type ControlledFailureProductPresentationProofResult = {
  version: typeof CONTROLLED_FAILURE_PRODUCT_PRESENTATION_PROOF_VERSION;
  guaranteeId: "controlled_failure_product_presentation";
  canonicalObligation:
    "Present a controlled public V2 failure state when production AI is active.";
  rootCause: "PARTIAL_IMPLEMENTATION_AND_PROOF_GAP";
  status: "PASS" | "FAIL";
  checks: ControlledFailureProductPresentationProofCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    externalProviderOperations: 0;
    apiOperations: 0;
    humanReviewOperations: 0;
  };
};

type StubTransportOptions = {
  countFailure?: Error;
  generation?: DecisionMaterialTransportGeneration;
};

function stubTransport(options: StubTransportOptions = {}) {
  let countCalls = 0;
  let generationCalls = 0;
  const transport: DecisionMaterialTransport = {
    async countInput(_request: DecisionMaterialProviderRequest) {
      countCalls += 1;
      if (options.countFailure) throw options.countFailure;
      return 1200;
    },
    async generate(_request: DecisionMaterialProviderRequest) {
      generationCalls += 1;
      return options.generation ?? {
        status: "completed",
        outputText: JSON.stringify(validCandidateDecisionMaterial()),
        usage: { inputTokens: 1200, outputTokens: 700, totalTokens: 1900 },
      };
    },
  };
  return { transport, stats: () => ({ countCalls, generationCalls }) };
}

function request(): ControlledSimulatorSwitchRequest {
  const bridge = validPostProviderBridgeRequest();
  return {
    switchVersion: CONTROLLED_SIMULATOR_SWITCH_VERSION,
    mode: CONTROLLED_SIMULATOR_SWITCH_MODE,
    executionContext: "internal_dev",
    requestId: "controlled_failure_presentation",
    input: bridge.decisionContext.statement,
    lang: "es",
    requestedOutputLanguage: "es",
    userIntent: "compare",
    context: bridge.decisionContext,
    safety: bridge.safety,
    safetyContextComplete: true,
  };
}

async function execute(
  transport = stubTransport(),
  environment: Record<string, string | undefined> = {
    LEVIO_REAL_AI_DEV_ENABLED: "true",
    LEVIO_AI_PROVIDER: "openai",
    OPENAI_API_KEY: "offline-proof-key",
  },
  runtimeRequest: ControlledSimulatorSwitchRequest = request(),
) {
  const runtime = bindControlledProductionAiRuntimeSwitch(
    environment,
    () => transport.transport,
    () => "2026-08-23T00:00:00.000Z",
  );
  return {
    result: await runtime.execute(runtimeRequest),
    transport,
  };
}

function productionFailure(
  result: ControlledServerRuntimeSelectionResult,
): result is ControlledProductionAiFailureResult {
  return result.selectedPath === "controlled_failure" &&
    "runtimeSource" in result && result.runtimeSource === "production_ai";
}

function sourceCode(result: ControlledServerRuntimeSelectionResult): string | undefined {
  return productionFailure(result) ? result.failure.sourceCode : undefined;
}

function boundedFailurePresentation(
  result: ControlledServerRuntimeSelectionResult,
  forbidden: readonly string[] = [],
): boolean {
  if (!productionFailure(result)) return false;
  const ui = result.uiModel;
  const serialized = JSON.stringify(ui);
  const nonStatusSectionsEmpty = Object.entries(ui.sections).every(
    ([id, section]) => id === "status" || section.items.length === 0,
  );
  return result.selectedContract === "SimulationResponseV2UiModel" &&
    result.fallback.used === false &&
    ui.renderState === "controlled_failure" &&
    ui.responseStatus === "failed" &&
    ui.requestId === result.requestId &&
    ui.mappingErrors.length === 0 &&
    ui.sections.status.state === "available" &&
    ui.sections.status.items.length === 1 &&
    ui.sections.status.items[0].lifecycle === "failed" &&
    ui.sections.status.items[0].tone === "failure" &&
    ui.sections.status.items[0].message ===
      CONTROLLED_PRODUCTION_AI_PUBLIC_FAILURE_MESSAGE &&
    nonStatusSectionsEmpty &&
    serialized.length <= 4000 &&
    !serialized.includes("provider_") &&
    !serialized.toLowerCase().includes("openai") &&
    !serialized.toLowerCase().includes("gpt-") &&
    !serialized.toLowerCase().includes("oracle") &&
    !serialized.toLowerCase().includes("matcher") &&
    forbidden.every((value) => !serialized.includes(value));
}

function generation(output: unknown, outputTokens = 100): StubTransportOptions {
  return {
    generation: {
      status: "completed",
      outputText: JSON.stringify(output),
      usage: {
        inputTokens: 1200,
        outputTokens,
        totalTokens: 1200 + outputTokens,
      },
    },
  };
}

export async function runControlledFailureProductPresentationProof():
Promise<ControlledFailureProductPresentationProofResult> {
  const checks: ControlledFailureProductPresentationProofCheck[] = [];
  const add = (checkId: string, passed: boolean) => checks.push({ checkId, passed });

  const success = await execute();
  add("valid-real-provider-result-preserves-normal-v2-success",
    success.result.selectedPath === "controlled_production_ai_v2" &&
    success.result.runtimeSource === "production_ai" &&
    success.result.response.status !== "failed" &&
    success.result.fallback.used === false);

  const unavailableStub = stubTransport({
    countFailure: new DecisionMaterialTransportFailure("provider_unavailable"),
  });
  const unavailable = await execute(unavailableStub);
  add("provider-unavailable-produces-bounded-public-failure",
    sourceCode(unavailable.result) === "provider_unavailable" &&
    boundedFailurePresentation(unavailable.result));

  const timeout = await execute(stubTransport({
    countFailure: new DecisionMaterialTransportFailure("provider_timeout"),
  }));
  add("provider-timeout-cannot-produce-public-success",
    sourceCode(timeout.result) === "provider_timeout" &&
    boundedFailurePresentation(timeout.result));

  const refused = await execute(stubTransport({
    generation: { status: "refused" },
  }));
  add("provider-refusal-cannot-produce-public-success",
    sourceCode(refused.result) === "provider_refused" &&
    boundedFailurePresentation(refused.result));

  const malformed = await execute(stubTransport(generation({})));
  add("malformed-contract-result-cannot-produce-public-success",
    sourceCode(malformed.result) === "provider_schema_invalid" &&
    boundedFailurePresentation(malformed.result));

  const unsafeCandidate = structuredClone(validCandidateDecisionMaterial());
  unsafeCandidate.items[0].content = "Recomiendo elegir la mejor opción.";
  const unsafeSentinel = unsafeCandidate.items[0].content;
  const unsafe = await execute(stubTransport(generation(unsafeCandidate)));
  add("unsafe-candidate-is-suppressed-from-public-failure",
    sourceCode(unsafe.result) === "provider_safety_invalid" &&
    boundedFailurePresentation(unsafe.result, [unsafeSentinel]));

  const ungroundedCandidate = structuredClone(validCandidateDecisionMaterial());
  ungroundedCandidate.items[0].option_refs = ["option_99"];
  const grounding = await execute(stubTransport(generation(ungroundedCandidate)));
  add("grounding-failure-is-suppressed-from-public-failure",
    sourceCode(grounding.result) === "provider_grounding_invalid" &&
    boundedFailurePresentation(grounding.result, ["option_99"]));

  const unsupportedOption = structuredClone(validCandidateDecisionMaterial());
  unsupportedOption.items = [{
    ...unsupportedOption.items[0],
    candidate_id: "candidate_unapproved_new_option",
    item_type: "option",
    content: "Una opción inferida no existe en el Decision Context.",
    provenance: { source: "provider_candidate", source_ref: "question_1" },
    evidence: "provider_inference",
    option_refs: [],
    scenario_refs: [],
    criterion_refs: [],
  }];
  const rejectedContent = unsupportedOption.items[0].content;
  const postProvider = await execute(stubTransport(generation(unsupportedOption)));
  add("post-provider-rejection-cannot-reach-public-success",
    sourceCode(postProvider.result) === "no_acceptable_material" &&
    boundedFailurePresentation(postProvider.result, [rejectedContent]));

  const privacyRequest = request();
  privacyRequest.context = structuredClone(privacyRequest.context);
  if (privacyRequest.context) {
    privacyRequest.context.statement = "Contact private-proof@example.com before deciding.";
  }
  const privacy = await execute(stubTransport(), undefined, privacyRequest);
  add("privacy-rejection-fails-before-provider-and-stays-bounded",
    sourceCode(privacy.result) === "forbidden_data_detected" &&
    privacy.transport.stats().countCalls === 0 &&
    privacy.transport.stats().generationCalls === 0 &&
    boundedFailurePresentation(privacy.result, ["private-proof@example.com"]));

  const diagnosticSentinel =
    "HIDDEN_MATCHER_ORACLE_DIAGNOSTIC_SECRET_PROVIDER_PAYLOAD";
  const internalFailure = await execute(stubTransport({
    countFailure: new Error(diagnosticSentinel),
  }));
  add("internal-provider-or-evaluation-diagnostics-do-not-leak",
    sourceCode(internalFailure.result) === "provider_unknown_failure" &&
    boundedFailurePresentation(internalFailure.result, [diagnosticSentinel]));

  const repeatedTimeout = await execute(stubTransport({
    countFailure: new DecisionMaterialTransportFailure("provider_timeout"),
  }));
  add("equivalent-failure-produces-deterministic-public-output",
    productionFailure(timeout.result) && productionFailure(repeatedTimeout.result) &&
    JSON.stringify(timeout.result.uiModel) ===
      JSON.stringify(repeatedTimeout.result.uiModel));

  add("mock-is-never-substituted-for-production-failure",
    productionFailure(unavailable.result) &&
    unavailable.result.selectedPath === "controlled_failure" &&
    unavailable.result.runtimeSource === "production_ai" &&
    unavailable.result.fallback.used === false &&
    !("response" in unavailable.result) &&
    !JSON.stringify(unavailable.result.uiModel).includes("public_mock_v1"));

  const mock = await execute(stubTransport(), {
    LEVIO_REAL_AI_DEV_ENABLED: "false",
    LEVIO_AI_PROVIDER: "openai",
    OPENAI_API_KEY: "must-not-be-read",
  });
  add("explicit-legitimate-mock-mode-remains-intact",
    mock.result.selectedPath === "public_mock_v1" &&
    mock.result.selectedContract === "SimulationResponse" &&
    mock.result.evidence.externalProviderUsed === false &&
    mock.transport.stats().countCalls === 0 &&
    mock.transport.stats().generationCalls === 0);

  add("existing-v2-ui-mapping-regression-remains-valid",
    runSimulationResponseV2UiMappingValidation().passed);
  add("minimum-necessary-prompt-context-remains-pass",
    runMinimumNecessaryPromptContextProof().status === "PASS");

  const passed = checks.filter((item) => item.passed).length;
  const failed = checks.length - passed;
  return {
    version: CONTROLLED_FAILURE_PRODUCT_PRESENTATION_PROOF_VERSION,
    guaranteeId: "controlled_failure_product_presentation",
    canonicalObligation:
      "Present a controlled public V2 failure state when production AI is active.",
    rootCause: "PARTIAL_IMPLEMENTATION_AND_PROOF_GAP",
    status: failed === 0 ? "PASS" : "FAIL",
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
      externalProviderOperations: 0,
      apiOperations: 0,
      humanReviewOperations: 0,
    },
  };
}
