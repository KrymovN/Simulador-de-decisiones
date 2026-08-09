import "server-only";

import {
  CANDIDATE_DECISION_MATERIAL_CAPABILITY,
  CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
  type CandidateDecisionMaterial,
} from "../ai-decision-material/contracts";
import {
  DecisionMaterialTransportFailure,
  type DecisionMaterialProviderRequest,
  type DecisionMaterialTransport,
  type DecisionMaterialTransportGeneration,
} from "../ai-provider/openai-decision-material-adapter";
import { validCandidateDecisionMaterial } from "../ai-provider/openai-decision-material-adapter-validation";
import { validPostProviderBridgeRequest } from "../decision-engine/post-provider-boundary-validation";
import { validateSimulationResponseV2DraftShape } from "../decision-engine/simulation-response";
import {
  executeProductionDecisionSimulationFlow,
  type ProductionDecisionSimulationOrchestratorErrorCode,
  type ProductionDecisionSimulationOrchestratorResult,
  type ProductionDecisionSimulationOrchestratorStage,
} from "./production-decision-simulation-orchestrator";

export type ProductionDecisionSimulationOrchestratorValidationCase = {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue?: string;
};

export type ProductionDecisionSimulationOrchestratorValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: ProductionDecisionSimulationOrchestratorValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    positive: number;
    negative: number;
    networkRequests: 0;
  };
};

type MockTransportOptions = {
  count?: number;
  countFailure?: Error;
  generation?: DecisionMaterialTransportGeneration;
  generationFailure?: Error;
};

function mockTransport(options: MockTransportOptions = {}) {
  let countCalls = 0;
  let generationCalls = 0;
  let countRequest: DecisionMaterialProviderRequest | undefined;
  let generationRequest: DecisionMaterialProviderRequest | undefined;
  const events: string[] = [];
  const transport: DecisionMaterialTransport = {
    async countInput(request: DecisionMaterialProviderRequest) {
      countCalls += 1;
      countRequest = request;
      events.push("provider_count_input");
      if (options.countFailure) throw options.countFailure;
      return options.count ?? 1200;
    },
    async generate(request: DecisionMaterialProviderRequest) {
      generationCalls += 1;
      generationRequest = request;
      events.push("provider_generate");
      if (options.generationFailure) throw options.generationFailure;
      return options.generation ?? {
        status: "completed",
        outputText: JSON.stringify(validCandidateDecisionMaterial()),
        usage: { inputTokens: 1200, outputTokens: 700, totalTokens: 1900 },
      };
    },
  };
  return {
    transport,
    events,
    stats: () => ({ countCalls, generationCalls, countRequest, generationRequest }),
  };
}

function request(): Record<string, unknown> {
  return {
    orchestrationId: "stage9_ai_flow",
    bridgeRequest: validPostProviderBridgeRequest(),
  };
}

function zhCandidateDecisionMaterial(): CandidateDecisionMaterial {
  const value = structuredClone(validCandidateDecisionMaterial());
  value.items[0].content = "北方方案以较低固定成本支持渐进增长。";
  value.items[1].content = "外部依赖会影响快速增长情景。";
  return value;
}

function zhRequest(): Record<string, unknown> {
  const value = structuredClone(request());
  value.orchestrationId = "stage9_ai_flow_zh";
  const bridge = value.bridgeRequest as ReturnType<typeof validPostProviderBridgeRequest>;
  bridge.bridgeId = "stage9_ai_flow_zh_bridge";
  bridge.locale = "zh";
  bridge.decisionContext.decisionId = "decision_post_provider_zh";
  bridge.decisionContext.statement = "合成团队应启动有限试点，还是等待更多证据？";
  bridge.decisionContext.goals[0].description = "在学习过程中保持决策可逆。";
  if (bridge.decisionContext.goals[0].successCriteria.status === "known") {
    bridge.decisionContext.goals[0].successCriteria.value = ["限制下行风险", "保留学习机会"];
  }
  bridge.decisionContext.options[0].label = "启动有限试点";
  bridge.decisionContext.options[0].description = "使用小规模合成样本群。";
  bridge.decisionContext.options[1].label = "等待更多证据";
  bridge.decisionContext.options[1].description = "在衡量合成需求期间推迟启动。";
  bridge.decisionContext.constraints[0].description = "保持在合成预算范围内。";
  bridge.safety = {
    domain: "general",
    level: "standard",
    recommendationAllowed: true,
    requiredNotices: [],
    requiredEscalations: [],
    prohibitedOutputs: ["保证合成结果"],
    rationale: "这是一个可逆的合成决策。",
  };
  return value;
}

function dependencies(mock = mockTransport()): Record<string, unknown> {
  return {
    enabled: true,
    apiKeyAvailable: true,
    provider: "openai",
    transport: mock.transport,
    requestedAt: "2026-08-07T00:00:00.000Z",
  };
}

function unsupportedOptionMaterial(): CandidateDecisionMaterial {
  return {
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items: [{
      candidate_id: "candidate_provider_option",
      item_type: "option",
      content: "Una tercera opción inferida no existe en el Decision Context.",
      provenance: { source: "provider_candidate", source_ref: "provider_inference" },
      confidence: "medium",
      evidence: "provider_inference",
      option_refs: [],
      scenario_refs: [],
      criterion_refs: [],
      authority: "candidate_only",
      capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
      contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    }],
  };
}

function stages(result: ProductionDecisionSimulationOrchestratorResult): string {
  return result.trace.map((item) => `${item.stage}:${item.status}`).join(",");
}

function errorCode(
  result: ProductionDecisionSimulationOrchestratorResult,
): ProductionDecisionSimulationOrchestratorErrorCode | undefined {
  return result.status === "failed" ? result.error.code : undefined;
}

function errorStage(
  result: ProductionDecisionSimulationOrchestratorResult,
): ProductionDecisionSimulationOrchestratorStage | "orchestrator" | undefined {
  return result.status === "failed" ? result.error.stage : undefined;
}

function validationCase(input: {
  caseId: string;
  kind: "positive" | "negative";
  result: ProductionDecisionSimulationOrchestratorResult;
  passed: (result: ProductionDecisionSimulationOrchestratorResult) => boolean;
  issue: string;
}): ProductionDecisionSimulationOrchestratorValidationCase {
  const passed = input.passed(input.result);
  return {
    caseId: input.caseId,
    kind: input.kind,
    passed,
    ...(passed ? {} : { issue: input.issue }),
  };
}

export async function runProductionDecisionSimulationOrchestratorValidation(): Promise<ProductionDecisionSimulationOrchestratorValidationResult> {
  const happyMock = mockTransport();
  const happy = await executeProductionDecisionSimulationFlow(request(), dependencies(happyMock));
  const repeated = await executeProductionDecisionSimulationFlow(request(), dependencies(mockTransport()));
  const zhMock = mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(zhCandidateDecisionMaterial()),
      usage: { inputTokens: 1200, outputTokens: 700, totalTokens: 1900 },
    },
  });
  const zh = await executeProductionDecisionSimulationFlow(zhRequest(), dependencies(zhMock));

  const invalidBridgeRequest = request();
  const bridge = invalidBridgeRequest.bridgeRequest as ReturnType<typeof validPostProviderBridgeRequest>;
  bridge.decisionContext.options[0].label = "";
  const bridgeMock = mockTransport();
  const bridgeFailure = await executeProductionDecisionSimulationFlow(
    invalidBridgeRequest,
    dependencies(bridgeMock),
  );

  const schemaMock = mockTransport({
    generation: {
      status: "completed",
      outputText: "{}",
      usage: { inputTokens: 1200, outputTokens: 10, totalTokens: 1210 },
    },
  });
  const providerSchemaFailure = await executeProductionDecisionSimulationFlow(
    request(),
    dependencies(schemaMock),
  );

  const postMock = mockTransport({
    generation: {
      status: "completed",
      outputText: JSON.stringify(unsupportedOptionMaterial()),
      usage: { inputTokens: 1200, outputTokens: 100, totalTokens: 1300 },
    },
  });
  const postProviderFailure = await executeProductionDecisionSimulationFlow(
    request(),
    dependencies(postMock),
  );

  const secretFailureMock = mockTransport({ countFailure: new Error("sk-never-return-this-secret") });
  const secretFailure = await executeProductionDecisionSimulationFlow(
    request(),
    dependencies(secretFailureMock),
  );

  const cases = [
    validationCase({
      caseId: "full_canonical_server_flow_returns_simulation_response_v2",
      kind: "positive",
      result: happy,
      passed: (result) => result.status === "completed" &&
        validateSimulationResponseV2DraftShape(result.response) &&
        result.response.contractVersion === "2.0" &&
        result.response.decision.statement === "Should the synthetic team launch a bounded pilot or wait?",
      issue: "Happy path did not reach a valid SimulationResponseV2Draft.",
    }),
    validationCase({
      caseId: "boundaries_execute_in_canonical_order",
      kind: "positive",
      result: happy,
      passed: (result) => stages(result) === [
        "decision_prompt_context:completed",
        "provider_adapter:completed",
        "post_provider_decision_engine:completed",
        "simulation_composition:completed",
      ].join(",") && happyMock.events.join(",") === "provider_count_input,provider_generate",
      issue: "Orchestrator boundary order changed.",
    }),
    validationCase({
      caseId: "injected_fake_transport_is_used_offline",
      kind: "positive",
      result: happy,
      passed: (result) => result.status === "completed" &&
        happyMock.stats().countCalls === 1 &&
        happyMock.stats().generationCalls === 1 &&
        result.evidence.injectedProviderTransportUsed &&
        result.evidence.orchestratorDirectNetworkRequestCount === 0,
      issue: "Injected fake transport did not drive the complete offline flow.",
    }),
    validationCase({
      caseId: "decision_engine_authority_and_traceability_reach_draft",
      kind: "positive",
      result: happy,
      passed: (result) => result.status === "completed" &&
        result.response.traceability.evidence.some((item) => item.source === "engine_inference") &&
        result.evidence.postProviderDecisionEngineRequired &&
        !result.evidence.directProviderToSimulatorAllowed &&
        !result.evidence.rawProviderMaterialReturned,
      issue: "Controlled Decision Engine authority was not preserved through Simulator composition.",
    }),
    validationCase({
      caseId: "orchestrator_result_is_deterministic",
      kind: "positive",
      result: repeated,
      passed: (result) => JSON.stringify(result) === JSON.stringify(happy),
      issue: "Repeated fake-transport orchestration changed the result.",
    }),
    validationCase({
      caseId: "provider_specific_metadata_is_not_returned",
      kind: "positive",
      result: happy,
      passed: (result) => result.status === "completed" &&
        !JSON.stringify(result.response).toLowerCase().includes("openai") &&
        !JSON.stringify(result.response).toLowerCase().includes("gpt-") &&
        result.evidence.providerMetadataReturned === false,
      issue: "Provider-specific metadata leaked into the product draft.",
    }),
    validationCase({
      caseId: "zh_locale_completes_full_offline_production_flow",
      kind: "positive",
      result: zh,
      passed: (result) => {
        const stats = zhMock.stats();
        return result.status === "completed" &&
          result.response.language.input === "zh" &&
          result.response.language.output === "zh" &&
          result.response.decision.statement === "合成团队应启动有限试点，还是等待更多证据？" &&
          JSON.stringify(result.response).includes("北方方案以较低固定成本支持渐进增长。") &&
          stages(result) === [
            "decision_prompt_context:completed",
            "provider_adapter:completed",
            "post_provider_decision_engine:completed",
            "simulation_composition:completed",
          ].join(",") &&
          stats.countCalls === 1 && stats.generationCalls === 1 &&
          Boolean(stats.countRequest?.input.includes("合成团队应启动有限试点")) &&
          Boolean(stats.generationRequest?.input.includes("等待更多证据")) &&
          stats.generationRequest?.instructions.includes("natural language of the supplied context") === true;
      },
      issue: "Chinese locale was substituted, lost, or rejected before SimulationResponseV2Draft.",
    }),
    validationCase({
      caseId: "missing_request_fails_closed",
      kind: "negative",
      result: await executeProductionDecisionSimulationFlow(null, dependencies()),
      passed: (result) => errorCode(result) === "orchestration_input_invalid" && errorStage(result) === "orchestrator",
      issue: "Missing orchestration request was accepted.",
    }),
    validationCase({
      caseId: "candidate_material_cannot_be_supplied_directly",
      kind: "negative",
      result: await executeProductionDecisionSimulationFlow({
        ...request(),
        candidateMaterial: validCandidateDecisionMaterial(),
      }, dependencies()),
      passed: (result) => errorCode(result) === "orchestration_input_invalid",
      issue: "Caller bypassed Provider and post-provider boundaries with direct candidate material.",
    }),
    validationCase({
      caseId: "credential_value_field_is_rejected",
      kind: "negative",
      result: await executeProductionDecisionSimulationFlow(request(), {
        ...dependencies(),
        apiKey: "sk-forbidden-client-value",
      }),
      passed: (result) => errorCode(result) === "orchestration_input_invalid" &&
        !JSON.stringify(result).includes("sk-forbidden-client-value"),
      issue: "Orchestrator accepted or exposed a credential value.",
    }),
    validationCase({
      caseId: "prompt_context_failure_stops_all_downstream_steps",
      kind: "negative",
      result: bridgeFailure,
      passed: (result) => errorCode(result) === "prompt_context_boundary_failed" &&
        errorStage(result) === "decision_prompt_context" &&
        stages(result) === [
          "decision_prompt_context:failed",
          "provider_adapter:skipped",
          "post_provider_decision_engine:skipped",
          "simulation_composition:skipped",
        ].join(",") && bridgeMock.stats().countCalls === 0 && bridgeMock.stats().generationCalls === 0,
      issue: "Prompt Context failure did not stop provider and downstream execution.",
    }),
    validationCase({
      caseId: "disabled_provider_adapter_stops_downstream_steps",
      kind: "negative",
      result: await executeProductionDecisionSimulationFlow(request(), {
        ...dependencies(),
        enabled: false,
      }),
      passed: (result) => errorCode(result) === "provider_adapter_failed" &&
        errorStage(result) === "provider_adapter" &&
        result.status === "failed" && result.error.sourceCode === "adapter_disabled" &&
        stages(result).endsWith("post_provider_decision_engine:skipped,simulation_composition:skipped"),
      issue: "Disabled Provider Adapter did not fail closed before Decision Engine composition.",
    }),
    validationCase({
      caseId: "provider_schema_failure_stops_downstream_steps",
      kind: "negative",
      result: providerSchemaFailure,
      passed: (result) => errorCode(result) === "provider_adapter_failed" &&
        result.status === "failed" && result.error.sourceCode === "provider_schema_invalid" &&
        stages(result).includes("post_provider_decision_engine:skipped") &&
        stages(result).includes("simulation_composition:skipped"),
      issue: "Invalid provider output reached post-provider or Simulator composition.",
    }),
    validationCase({
      caseId: "controlled_transport_failure_hides_raw_exception",
      kind: "negative",
      result: secretFailure,
      passed: (result) => errorCode(result) === "provider_adapter_failed" &&
        result.status === "failed" && result.error.sourceCode === "provider_unknown_failure" &&
        !JSON.stringify(result).includes("sk-never-return-this-secret") &&
        secretFailureMock.stats().countCalls === 1 && secretFailureMock.stats().generationCalls === 0,
      issue: "Raw provider exception leaked or generation continued after count failure.",
    }),
    validationCase({
      caseId: "normalized_provider_error_is_preserved",
      kind: "negative",
      result: await executeProductionDecisionSimulationFlow(
        request(),
        dependencies(mockTransport({
          countFailure: new DecisionMaterialTransportFailure("provider_rate_limited"),
        })),
      ),
      passed: (result) => result.status === "failed" &&
        result.error.code === "provider_adapter_failed" &&
        result.error.sourceCode === "provider_rate_limited",
      issue: "Provider Adapter machine-readable error semantics were lost.",
    }),
    validationCase({
      caseId: "post_provider_rejection_stops_simulator_composition",
      kind: "negative",
      result: postProviderFailure,
      passed: (result) => errorCode(result) === "post_provider_decision_engine_failed" &&
        errorStage(result) === "post_provider_decision_engine" &&
        result.status === "failed" && result.error.sourceCode === "no_acceptable_material" &&
        stages(result).endsWith("post_provider_decision_engine:failed,simulation_composition:skipped"),
      issue: "Rejected post-provider material reached Simulator composition.",
    }),
  ];

  const passed = cases.filter((item) => item.passed).length;
  return {
    passed: passed === cases.length,
    failed: passed !== cases.length,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed: cases.length - passed,
      positive: cases.filter((item) => item.kind === "positive").length,
      negative: cases.filter((item) => item.kind === "negative").length,
      networkRequests: 0,
    },
  };
}
