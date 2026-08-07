import "server-only";

import { validPostProviderDecisionEngineResult } from "./post-provider-boundary-validation";
import {
  composePostProviderSimulationResponse,
  type PostProviderSimulationCompositionErrorCode,
  type PostProviderSimulationCompositionResult,
} from "./post-provider-simulation-composition";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";

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
          item.sourceEntityIds.includes("decision_material_1_candidate_risk_launch")),
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
