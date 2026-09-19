import "server-only";

import {
  CANDIDATE_DECISION_MATERIAL_CAPABILITY,
  CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
  type CandidateDecisionMaterial,
  type CandidateDecisionMaterialItem,
} from "../ai-decision-material/contracts";
import {
  composePostProviderDecisionMaterial,
  type PostProviderDecisionEngineBoundaryResult,
} from "./post-provider-boundary";
import {
  validPostProviderBridgeRequest,
  validPostProviderDecisionEngineResult,
} from "./post-provider-boundary-validation";
import {
  composePostProviderSimulationResponse,
  type PostProviderSimulationCompositionErrorCode,
  type PostProviderSimulationCompositionResult,
} from "./post-provider-simulation-composition";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import { mapSimulationResponseV2ToUiModel } from "./simulation-response-v2-ui-mapping";

export type PostProviderSimulationCompositionValidationCase = {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue?: string;
};

export type PostProviderSimulationCompositionValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PostProviderSimulationCompositionValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    positive: number;
    negative: number;
    networkRequests: 0;
  };
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function changed(
  update: (value: Record<string, any>) => void,
): Record<string, any> {
  const value = clone(validPostProviderDecisionEngineResult()) as unknown as Record<string, any>;
  update(value);
  return value;
}

function errorCode(
  result: PostProviderSimulationCompositionResult,
): PostProviderSimulationCompositionErrorCode | undefined {
  return result.status === "rejected" ? result.error.code : undefined;
}

const CONTROLLED_DEPENDENCY_CONTENT =
  "La disponibilidad del equipo operativo debe confirmarse antes del piloto.";

function dependencyCandidate(
  overrides: Partial<CandidateDecisionMaterialItem> = {},
): CandidateDecisionMaterialItem {
  return {
    candidate_id: "candidate_dependency_launch",
    item_type: "dependency",
    content: CONTROLLED_DEPENDENCY_CONTENT,
    provenance: { source: "provider_candidate", source_ref: "question_1" },
    confidence: "medium",
    evidence: "provider_inference",
    option_refs: ["option_1"],
    scenario_refs: ["scenario_1"],
    criterion_refs: [],
    authority: "candidate_only",
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    ...overrides,
  };
}

function semanticBridgeRequest() {
  const request = clone(validPostProviderBridgeRequest());
  request.bridgeId = "stage_9_dependency_semantic_effect";
  request.decisionContext.options[1].feasible = {
    status: "known",
    value: true,
    evidenceRefs: ["evidence_wait"],
  };
  request.decisionContext.constraints[0].severity = "material";
  request.decisionContext.variables = [{
    id: "variable_capacity",
    name: "Available capacity",
    description: "Known operational capacity.",
    value: { status: "known", value: "sufficient", evidenceRefs: [] },
    materiality: "important",
    volatility: "stable",
    affectedOptionIds: [],
  }];
  request.decisionContext.timeHorizon = {
    decisionDeadline: { status: "known", value: "30 days", evidenceRefs: [] },
    shortTermWindow: { status: "known", value: "90 days", evidenceRefs: [] },
    longTermWindow: { status: "known", value: "12 months", evidenceRefs: [] },
    delayCost: { status: "known", value: "low", evidenceRefs: [] },
    reversibilityWindow: { status: "known", value: "90 days", evidenceRefs: [] },
  };
  request.decisionContext.assumptions = [{
    id: "assumption_capacity",
    statement: "Current capacity remains available.",
    source: "user",
    materiality: "important",
    validationStatus: "validated",
    affectedEntityIds: [],
    evidenceRefs: [],
  }];
  return request;
}

function controlledMaterialResult(
  item: CandidateDecisionMaterialItem,
): PostProviderDecisionEngineBoundaryResult {
  const material: CandidateDecisionMaterial = {
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items: [item],
  };
  return composePostProviderDecisionMaterial({
    boundaryId: `boundary_${item.candidate_id}`,
    bridgeRequest: semanticBridgeRequest(),
    candidateMaterial: material,
  });
}

function scenarioProjection(result: PostProviderSimulationCompositionResult) {
  return result.status === "composed" ? result.response.analysis?.scenarios : undefined;
}

function validationCase(input: {
  caseId: string;
  kind: "positive" | "negative";
  result: PostProviderSimulationCompositionResult;
  passed: (result: PostProviderSimulationCompositionResult) => boolean;
  issue: string;
}): PostProviderSimulationCompositionValidationCase {
  const passed = input.passed(input.result);
  return {
    caseId: input.caseId,
    kind: input.kind,
    passed,
    ...(passed ? {} : { issue: input.issue }),
  };
}

export function runPostProviderSimulationCompositionValidation(): PostProviderSimulationCompositionValidationResult {
  const controlled = validPostProviderDecisionEngineResult();
  const first = composePostProviderSimulationResponse(controlled);
  const repeated = composePostProviderSimulationResponse(clone(controlled));
  const semanticBaseline = composePostProviderSimulationResponse(
    controlledMaterialResult(dependencyCandidate({
      candidate_id: "candidate_risk_baseline",
      item_type: "risk_signal",
      content: "La evidencia inicial puede ser insuficiente.",
    })),
  );
  const linkedDependency = composePostProviderSimulationResponse(
    controlledMaterialResult(dependencyCandidate()),
  );
  const duplicateDependency = composePostProviderSimulationResponse(
    controlledMaterialResult(dependencyCandidate({
      candidate_id: "candidate_dependency_duplicate",
      content: "  STAY inside   the synthetic budget.  ",
    })),
  );
  const unlinkedDependency = composePostProviderSimulationResponse(
    controlledMaterialResult(dependencyCandidate({
      candidate_id: "candidate_dependency_unlinked",
      provenance: { source: "provider_candidate", source_ref: "question_1" },
      option_refs: [],
      scenario_refs: [],
    })),
  );
  const ambiguousDependency = composePostProviderSimulationResponse(
    controlledMaterialResult(dependencyCandidate({
      candidate_id: "candidate_dependency_ambiguous",
      option_refs: ["option_1"],
      scenario_refs: ["scenario_2"],
    })),
  );
  const cases = [
    validationCase({
      caseId: "controlled_result_composes_into_simulation_response_v2",
      kind: "positive",
      result: first,
      passed: (result) => result.status === "composed" &&
        validateSimulationResponseV2DraftShape(result.response) &&
        result.response.contractVersion === "2.0" &&
        result.response.decision.statement === "Should the synthetic team launch a bounded pilot or wait?" &&
        result.response.decision.optionSummaries.map((item) => item.id).join(",") === "option_launch,option_wait",
      issue: "Controlled Decision Engine result did not produce the existing SimulationResponseV2Draft.",
    }),
    validationCase({
      caseId: "controlled_material_is_preserved_as_engine_evidence",
      kind: "positive",
      result: first,
      passed: (result) => result.status === "composed" &&
        result.response.traceability.evidence.some((item) =>
          item.id === "decision_material_1_candidate_risk_launch" &&
          item.source === "engine_inference" &&
          item.userConfirmed === false) &&
        result.response.traceability.responseMapping.some((item) =>
          item.sourceEntityIds.includes("decision_material_1_candidate_risk_launch") &&
          item.sourceEntityIds.includes("decision_post_provider") &&
          item.detail.includes("provenance question_1")),
      issue: "Controlled material lost Decision Engine traceability during Simulator composition.",
    }),
    validationCase({
      caseId: "canonical_pipeline_semantics_are_preserved",
      kind: "positive",
      result: first,
      passed: (result) => result.status === "composed" &&
        Array.isArray(result.response.gaps) &&
        Array.isArray(result.response.contradictions) &&
        Boolean(result.response.availability.scenarios) &&
        Boolean(result.response.availability.risks) &&
        result.response.safety.recommendationAllowed === false,
      issue: "Canonical gaps, risks, availability, or safety semantics were overwritten.",
    }),
    validationCase({
      caseId: "composition_is_deterministic",
      kind: "positive",
      result: repeated,
      passed: (result) => JSON.stringify(result) === JSON.stringify(first),
      issue: "Repeated Simulator composition changed the draft.",
    }),
    validationCase({
      caseId: "provider_metadata_and_runtime_remain_absent",
      kind: "positive",
      result: first,
      passed: (result) => result.status === "composed" &&
        !JSON.stringify(result.response).toLowerCase().includes("openai") &&
        !JSON.stringify(result.response).toLowerCase().includes("gpt-") &&
        result.evidence.providerMetadataIncluded === false &&
        result.evidence.providerExecutionCount === 0 &&
        result.evidence.networkExecutionCount === 0 &&
        !result.evidence.apiRouteIntegrated && !result.evidence.uiIntegrated && !result.evidence.persistenceIntegrated,
      issue: "Provider-specific metadata or runtime integration leaked into SimulationResponseV2Draft.",
    }),
    validationCase({
      caseId: "grounded_dependency_has_option_scoped_semantic_effect",
      kind: "positive",
      result: linkedDependency,
      passed: (result) => {
        if (semanticBaseline.status !== "composed" || result.status !== "composed") return false;
        const baselineScenarios = scenarioProjection(semanticBaseline);
        const composedScenarios = scenarioProjection(result);
        if (!baselineScenarios || !composedScenarios) return false;
        const baselineTarget = baselineScenarios.filter((scenario) => scenario.optionId === "option_launch");
        const composedTarget = composedScenarios.filter((scenario) => scenario.optionId === "option_launch");
        const baselineOther = baselineScenarios.filter((scenario) => scenario.optionId !== "option_launch");
        const composedOther = composedScenarios.filter((scenario) => scenario.optionId !== "option_launch");
        const uiModel = mapSimulationResponseV2ToUiModel(result.response);
        const targetUiScenarios = uiModel.sections.scenarios.items.filter(
          (scenario) => scenario.optionId === "option_launch",
        );
        const otherUiScenarios = uiModel.sections.scenarios.items.filter(
          (scenario) => scenario.optionId !== "option_launch",
        );
        return baselineTarget.length > 0 &&
          composedTarget.length === baselineTarget.length &&
          composedTarget.every((scenario) =>
            scenario.dependencies.some((dependency) =>
              dependency.id === "decision_material_1_candidate_dependency_launch" &&
              dependency.description === CONTROLLED_DEPENDENCY_CONTENT) &&
            (() => {
              const baseline = baselineTarget.find((candidate) => candidate.id === scenario.id);
              if (!baseline) return false;
              const { dependencies: baselineDependencies, ...baselineRest } = baseline;
              const { dependencies: composedDependencies, ...composedRest } = scenario;
              return JSON.stringify(composedRest) === JSON.stringify(baselineRest) &&
                baselineDependencies.every((dependency) => composedDependencies.some((candidate) =>
                  JSON.stringify(candidate) === JSON.stringify(dependency)));
            })()) &&
          JSON.stringify(composedOther) === JSON.stringify(baselineOther) &&
          composedScenarios.length === baselineScenarios.length &&
          JSON.stringify(composedScenarios.map((scenario) => scenario.id)) ===
            JSON.stringify(baselineScenarios.map((scenario) => scenario.id)) &&
          JSON.stringify(result.response.analysis?.risks) === JSON.stringify(semanticBaseline.response.analysis?.risks) &&
          JSON.stringify(result.response.recommendation) === JSON.stringify(semanticBaseline.response.recommendation) &&
          JSON.stringify(result.response.safety) === JSON.stringify(semanticBaseline.response.safety) &&
          JSON.stringify(result.response.clarification) === JSON.stringify(semanticBaseline.response.clarification) &&
          JSON.stringify(result.response.modelQuality) === JSON.stringify(semanticBaseline.response.modelQuality) &&
          result.response.traceability.evidence.some((evidence) =>
            evidence.id === "decision_material_1_candidate_dependency_launch" &&
            evidence.claim === CONTROLLED_DEPENDENCY_CONTENT) &&
          result.response.traceability.responseMapping.some((entry) =>
            entry.sourceEntityIds.includes("decision_material_1_candidate_dependency_launch")) &&
          targetUiScenarios.length === composedTarget.length &&
          targetUiScenarios.every((scenario) =>
            scenario.triggerConditions.includes(CONTROLLED_DEPENDENCY_CONTENT)) &&
          otherUiScenarios.every((scenario) =>
            !scenario.triggerConditions.includes(CONTROLLED_DEPENDENCY_CONTENT));
      },
      issue: "Grounded dependency did not affect every and only deterministic scenario for its linked option.",
    }),
    validationCase({
      caseId: "semantic_duplicate_dependency_is_trace_only",
      kind: "positive",
      result: duplicateDependency,
      passed: (result) => result.status === "composed" && semanticBaseline.status === "composed" &&
        JSON.stringify(result.response.analysis?.scenarios) === JSON.stringify(semanticBaseline.response.analysis?.scenarios) &&
        result.response.traceability.evidence.some((evidence) =>
          evidence.id === "decision_material_1_candidate_dependency_duplicate") &&
        result.response.traceability.responseMapping.some((entry) =>
          entry.sourceEntityIds.includes("decision_material_1_candidate_dependency_duplicate")),
      issue: "Semantically duplicate dependency changed scenarios or lost traceability.",
    }),
    validationCase({
      caseId: "unlinked_dependency_remains_trace_only",
      kind: "negative",
      result: unlinkedDependency,
      passed: (result) => result.status === "composed" && semanticBaseline.status === "composed" &&
        JSON.stringify(result.response.analysis?.scenarios) === JSON.stringify(semanticBaseline.response.analysis?.scenarios) &&
        result.response.traceability.evidence.some((evidence) =>
          evidence.id === "decision_material_1_candidate_dependency_unlinked") &&
        result.response.traceability.responseMapping.some((entry) =>
          entry.sourceEntityIds.includes("decision_material_1_candidate_dependency_unlinked")),
      issue: "Dependency without canonical option linkage changed scenarios or lost traceability.",
    }),
    validationCase({
      caseId: "ambiguous_dependency_linkage_remains_trace_only",
      kind: "negative",
      result: ambiguousDependency,
      passed: (result) => result.status === "composed" && semanticBaseline.status === "composed" &&
        JSON.stringify(result.response.analysis?.scenarios) === JSON.stringify(semanticBaseline.response.analysis?.scenarios) &&
        result.response.traceability.evidence.some((evidence) =>
          evidence.id === "decision_material_1_candidate_dependency_ambiguous") &&
        result.response.traceability.responseMapping.some((entry) =>
          entry.sourceEntityIds.includes("decision_material_1_candidate_dependency_ambiguous")),
      issue: "Ambiguous option linkage changed scenarios or lost traceability.",
    }),
    validationCase({
      caseId: "raw_candidate_material_cannot_bypass_decision_engine",
      kind: "negative",
      result: composePostProviderSimulationResponse({
        capability: "candidate_decision_material_v1",
        items: [],
      }),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Direct Provider candidate material bypassed the post-provider Decision Engine boundary.",
    }),
    validationCase({
      caseId: "missing_input_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(null),
      passed: (result) => errorCode(result) === "input_invalid",
      issue: "Missing composition input was accepted.",
    }),
    validationCase({
      caseId: "rejected_post_provider_result_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.status = "rejected";
        value.execution = "none";
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Rejected post-provider result entered Simulator composition.",
    }),
    validationCase({
      caseId: "missing_simulation_source_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        delete value.simulationSource;
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Controlled result without canonical simulation source was accepted.",
    }),
    validationCase({
      caseId: "tampered_decision_context_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.simulationSource.decisionContext.options[0].label = "";
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Tampered Decision Context was accepted.",
    }),
    validationCase({
      caseId: "decision_identity_mismatch_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.controlledMaterial.decisionId = "another_decision";
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Controlled material was composed into a different decision.",
    }),
    validationCase({
      caseId: "provider_authority_tampering_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.controlledMaterial.items[0].authority = "provider";
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Provider authority tampering was accepted.",
    }),
    validationCase({
      caseId: "provider_selected_recommendation_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.controlledMaterial.finalRecommendationProduced = true;
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Provider-selected recommendation entered Simulator composition.",
    }),
    validationCase({
      caseId: "unsupported_option_mapping_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.controlledMaterial.items[0].optionIds = ["option_unknown"];
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Unsupported option mapping entered SimulationResponseV2Draft.",
    }),
    validationCase({
      caseId: "tampered_source_provenance_ref_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.controlledMaterial.items[0].sourceProvenanceRef = "made_up_fact";
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Fabricated controlled provenance reference entered SimulationResponseV2Draft.",
    }),
    validationCase({
      caseId: "unknown_controlled_material_field_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.controlledMaterial.items[0].provider = "openai";
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Provider-specific controlled-material field was accepted.",
    }),
    validationCase({
      caseId: "incomplete_semantic_ledger_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.acceptance.silent_drop_count = 1;
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Silent semantic loss was accepted.",
    }),
    validationCase({
      caseId: "composition_trace_authority_mismatch_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.compositionEvidence.items[0].authority = "provider";
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Composition evidence without Decision Engine authority was accepted.",
    }),
    validationCase({
      caseId: "empty_controlled_material_fails_closed",
      kind: "negative",
      result: composePostProviderSimulationResponse(changed((value) => {
        value.controlledMaterial.items = [];
      })),
      passed: (result) => errorCode(result) === "controlled_result_incompatible",
      issue: "Empty controlled material was presented as a Simulator result.",
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
