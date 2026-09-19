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
const CONTROLLED_RISK_SIGNAL_CONTENT =
  "La evidencia temprana puede ocultar una adopcion insuficiente del piloto.";

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

function traceOnlyCandidate(
  overrides: Partial<CandidateDecisionMaterialItem> = {},
): CandidateDecisionMaterialItem {
  return dependencyCandidate({
    candidate_id: "candidate_context_baseline",
    item_type: "benefit_or_opportunity",
    content: "El contexto sintetico permanece acotado a las opciones declaradas.",
    option_refs: [],
    scenario_refs: [],
    ...overrides,
  });
}

function riskSignalCandidate(
  overrides: Partial<CandidateDecisionMaterialItem> = {},
): CandidateDecisionMaterialItem {
  return dependencyCandidate({
    candidate_id: "candidate_risk_signal_launch",
    item_type: "risk_signal",
    content: CONTROLLED_RISK_SIGNAL_CONTENT,
    ...overrides,
  });
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
  input: CandidateDecisionMaterialItem | CandidateDecisionMaterialItem[],
): PostProviderDecisionEngineBoundaryResult {
  const items = Array.isArray(input) ? input : [input];
  const material: CandidateDecisionMaterial = {
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items,
  };
  return composePostProviderDecisionMaterial({
    boundaryId: `boundary_${items.length}_${items[0].candidate_id}`,
    bridgeRequest: semanticBridgeRequest(),
    candidateMaterial: material,
  });
}

function scenarioProjection(result: PostProviderSimulationCompositionResult) {
  return result.status === "composed" ? result.response.analysis?.scenarios : undefined;
}

function riskProjection(result: PostProviderSimulationCompositionResult) {
  return result.status === "composed" ? result.response.analysis?.risks : undefined;
}

function qualitativeRiskEntries<T extends { detail: string }>(
  traceEntries: T[],
  content = CONTROLLED_RISK_SIGNAL_CONTENT,
): T[] {
  return traceEntries.filter((entry) =>
    entry.detail.startsWith("Accepted qualitative risk signal [") && entry.detail.endsWith(`: ${content}`)
  );
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
    controlledMaterialResult(traceOnlyCandidate()),
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
  const linkedRiskSignal = composePostProviderSimulationResponse(
    controlledMaterialResult([traceOnlyCandidate(), riskSignalCandidate()]),
  );
  const duplicateRiskSignal = composePostProviderSimulationResponse(
    controlledMaterialResult([
      traceOnlyCandidate(),
      riskSignalCandidate(),
      riskSignalCandidate({
        candidate_id: "candidate_risk_signal_duplicate",
        content: `  ${CONTROLLED_RISK_SIGNAL_CONTENT.toLocaleUpperCase("es-ES")}  `,
      }),
    ]),
  );
  const unlinkedRiskSignal = composePostProviderSimulationResponse(
    controlledMaterialResult([traceOnlyCandidate(), riskSignalCandidate({
      candidate_id: "candidate_risk_signal_unlinked",
      option_refs: [],
      scenario_refs: [],
    })]),
  );
  const conflictingRiskSignal = composePostProviderSimulationResponse(
    controlledMaterialResult([traceOnlyCandidate(), riskSignalCandidate({
      candidate_id: "candidate_risk_signal_conflicting",
      provenance: { source: "provider_candidate", source_ref: "option_1" },
      option_refs: ["option_2"],
      scenario_refs: [],
    })]),
  );
  const multipleRiskSignal = composePostProviderSimulationResponse(
    controlledMaterialResult([traceOnlyCandidate(), riskSignalCandidate({
      candidate_id: "candidate_risk_signal_multiple",
      option_refs: ["option_1", "option_2"],
      scenario_refs: [],
    })]),
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
      caseId: "grounded_risk_signal_has_option_scoped_qualitative_effect",
      kind: "positive",
      result: linkedRiskSignal,
      passed: (result) => {
        if (semanticBaseline.status !== "composed" || result.status !== "composed") return false;
        const baselineRisks = riskProjection(semanticBaseline);
        const composedRisks = riskProjection(result);
        if (!baselineRisks || !composedRisks) return false;
        const baselineTarget = baselineRisks.filter((risk) => risk.optionId === "option_launch");
        const composedTarget = composedRisks.filter((risk) => risk.optionId === "option_launch");
        const baselineOther = baselineRisks.filter((risk) => risk.optionId !== "option_launch");
        const composedOther = composedRisks.filter((risk) => risk.optionId !== "option_launch");
        const materialItemId = "decision_material_2_candidate_risk_signal_launch";
        const addedEntries = composedTarget.flatMap((risk) => qualitativeRiskEntries(risk.traceEntries));

        return baselineTarget.length === 3 &&
          composedTarget.length === baselineTarget.length &&
          composedTarget.every((risk) => {
            const baseline = baselineTarget.find((candidate) => candidate.id === risk.id);
            if (!baseline) return false;
            const { traceEntries: baselineTrace, ...baselineDeterministicRisk } = baseline;
            const { traceEntries: composedTrace, ...composedDeterministicRisk } = risk;
            const signalEntries = qualitativeRiskEntries(composedTrace);
            return JSON.stringify(composedDeterministicRisk) === JSON.stringify(baselineDeterministicRisk) &&
              baselineTrace.every((entry) => composedTrace.some((candidate) =>
                JSON.stringify(candidate) === JSON.stringify(entry))) &&
              signalEntries.length === 1 &&
              signalEntries[0].detail.includes("evidence=provider_inference") &&
              signalEntries[0].detail.includes("confidence=medium") &&
              signalEntries[0].detail.includes("provenance=question_1") &&
              signalEntries[0].detail.includes("deterministic_calculation=false") &&
              signalEntries[0].sourceEntityIds.includes(risk.id) &&
              signalEntries[0].sourceEntityIds.includes(risk.scenarioId) &&
              signalEntries[0].sourceEntityIds.includes("option_launch") &&
              signalEntries[0].sourceEntityIds.includes(materialItemId) &&
              signalEntries[0].sourceEntityIds.includes("decision_post_provider");
          }) &&
          JSON.stringify(composedOther) === JSON.stringify(baselineOther) &&
          composedRisks.length === baselineRisks.length &&
          JSON.stringify(composedRisks.map((risk) => risk.id)) === JSON.stringify(baselineRisks.map((risk) => risk.id)) &&
          addedEntries.length === composedTarget.length &&
          addedEntries.every((entry) => result.response.traceability.risks.some((candidate) =>
            JSON.stringify(candidate) === JSON.stringify(entry))) &&
          semanticBaseline.response.traceability.risks.every((entry) =>
            result.response.traceability.risks.some((candidate) => JSON.stringify(candidate) === JSON.stringify(entry))) &&
          result.response.traceability.evidence.some((entry) =>
            entry.id === materialItemId &&
            entry.claim === CONTROLLED_RISK_SIGNAL_CONTENT &&
            entry.source === "engine_inference" &&
            entry.reliability === "low" &&
            entry.userConfirmed === false) &&
          result.response.traceability.responseMapping.some((entry) =>
            entry.sourceEntityIds.includes(materialItemId) &&
            entry.sourceEntityIds.includes("option_launch") &&
            entry.detail.includes("provenance question_1")) &&
          JSON.stringify(result.response.analysis?.scenarios) ===
            JSON.stringify(semanticBaseline.response.analysis?.scenarios) &&
          JSON.stringify(result.response.recommendation) === JSON.stringify(semanticBaseline.response.recommendation) &&
          JSON.stringify(result.response.safety) === JSON.stringify(semanticBaseline.response.safety) &&
          JSON.stringify(result.response.clarification) === JSON.stringify(semanticBaseline.response.clarification) &&
          JSON.stringify(result.response.modelQuality) === JSON.stringify(semanticBaseline.response.modelQuality);
      },
      issue: "Grounded risk signal did not affect every and only existing risk for its linked option.",
    }),
    validationCase({
      caseId: "semantic_duplicate_risk_signal_is_added_once_per_target_risk",
      kind: "positive",
      result: duplicateRiskSignal,
      passed: (result) => result.status === "composed" &&
        result.response.analysis?.risks.filter((risk) => risk.optionId === "option_launch").length === 3 &&
        result.response.analysis.risks
          .filter((risk) => risk.optionId === "option_launch")
          .every((risk) => risk.traceEntries.filter((entry) =>
            entry.detail.startsWith("Accepted qualitative risk signal [")).length === 1) &&
        result.response.traceability.risks.filter((entry) =>
          entry.detail.startsWith("Accepted qualitative risk signal [")).length === 3,
      issue: "Normalized duplicate risk signal created duplicate qualitative risk trace entries.",
    }),
    validationCase({
      caseId: "unlinked_risk_signal_remains_trace_only",
      kind: "negative",
      result: unlinkedRiskSignal,
      passed: (result) => result.status === "composed" && semanticBaseline.status === "composed" &&
        JSON.stringify(result.response.analysis?.risks) === JSON.stringify(semanticBaseline.response.analysis?.risks) &&
        result.response.traceability.evidence.some((entry) =>
          entry.id === "decision_material_2_candidate_risk_signal_unlinked") &&
        result.response.traceability.responseMapping.some((entry) =>
          entry.sourceEntityIds.includes("decision_material_2_candidate_risk_signal_unlinked")),
      issue: "Risk signal without canonical option linkage changed risks or lost traceability.",
    }),
    validationCase({
      caseId: "conflicting_risk_signal_linkage_remains_trace_only",
      kind: "negative",
      result: conflictingRiskSignal,
      passed: (result) => result.status === "composed" && semanticBaseline.status === "composed" &&
        JSON.stringify(result.response.analysis?.risks) === JSON.stringify(semanticBaseline.response.analysis?.risks) &&
        result.response.traceability.evidence.some((entry) =>
          entry.id === "decision_material_2_candidate_risk_signal_conflicting") &&
        result.response.traceability.responseMapping.some((entry) =>
          entry.sourceEntityIds.includes("decision_material_2_candidate_risk_signal_conflicting")),
      issue: "Risk signal with conflicting provenance and option linkage changed risks or lost traceability.",
    }),
    validationCase({
      caseId: "multiple_risk_signal_linkage_remains_trace_only",
      kind: "negative",
      result: multipleRiskSignal,
      passed: (result) => result.status === "composed" && semanticBaseline.status === "composed" &&
        JSON.stringify(result.response.analysis?.risks) === JSON.stringify(semanticBaseline.response.analysis?.risks) &&
        result.response.traceability.evidence.some((entry) =>
          entry.id === "decision_material_2_candidate_risk_signal_multiple") &&
        result.response.traceability.responseMapping.some((entry) =>
          entry.sourceEntityIds.includes("decision_material_2_candidate_risk_signal_multiple")),
      issue: "Risk signal linked to multiple options changed risks or lost traceability.",
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
