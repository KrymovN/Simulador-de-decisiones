import "server-only";

import {
  CANDIDATE_DECISION_MATERIAL_CAPABILITY,
  CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
  type CandidateDecisionMaterial,
  type CandidateDecisionMaterialItem,
} from "../ai-decision-material/contracts";
import type { DecisionEnginePromptContextBridgeRequest } from "../ai-integration/contracts";
import type { DecisionContext, SafetyBoundary } from "./types";
import {
  composePostProviderDecisionMaterial,
  type PostProviderDecisionEngineBoundaryResult,
  type PostProviderDecisionEngineErrorCode,
} from "./post-provider-boundary";

export type PostProviderDecisionEngineValidationCase = {
  caseId: string;
  kind: "positive" | "negative";
  passed: boolean;
  issue?: string;
};

export type PostProviderDecisionEngineValidationResult = {
  passed: boolean;
  failed: boolean;
  cases: PostProviderDecisionEngineValidationCase[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    positive: number;
    negative: number;
    networkRequests: 0;
  };
};

function decisionContext(): DecisionContext {
  return {
    decisionId: "decision_post_provider",
    decisionTypes: ["comparative"],
    statement: "Should the synthetic team launch a bounded pilot or wait?",
    goals: [{
      id: "goal_reversible",
      description: "Preserve reversibility while learning.",
      priority: "primary",
      successCriteria: {
        status: "known",
        value: ["Limit downside", "Preserve learning"],
        evidenceRefs: ["evidence_goal"],
      },
      evidenceRefs: ["evidence_goal"],
    }],
    options: [
      {
        id: "option_launch",
        label: "Launch a bounded pilot",
        description: "Use a small synthetic cohort.",
        type: "action",
        userProposed: true,
        feasible: { status: "known", value: true, evidenceRefs: ["evidence_launch"] },
        evidenceRefs: ["evidence_launch"],
      },
      {
        id: "option_wait",
        label: "Wait for evidence",
        description: "Delay while measuring synthetic demand.",
        type: "delay",
        userProposed: true,
        feasible: { status: "unknown", reason: "Delay cost is unknown." },
        evidenceRefs: ["evidence_wait"],
      },
    ],
    constraints: [{
      id: "constraint_budget",
      description: "Stay inside the synthetic budget.",
      kind: "financial",
      severity: "blocking",
      appliesToOptionIds: ["option_launch", "option_wait"],
      evidenceRefs: ["evidence_budget"],
    }],
    variables: [],
    stakeholders: [],
    timeHorizon: {
      decisionDeadline: { status: "unknown", reason: "No deadline supplied." },
      shortTermWindow: { status: "known", value: "30 days", evidenceRefs: ["evidence_time"] },
      longTermWindow: { status: "unknown", reason: "Not supplied." },
      delayCost: { status: "unknown", reason: "Not quantified." },
      reversibilityWindow: { status: "known", value: "30 days", evidenceRefs: ["evidence_time"] },
    },
    assumptions: [],
    evidence: [],
  };
}

function safety(): SafetyBoundary {
  return {
    domain: "general",
    level: "standard",
    recommendationAllowed: true,
    requiredNotices: [],
    requiredEscalations: [],
    prohibitedOutputs: ["Guaranteed synthetic outcome"],
    rationale: "Synthetic reversible decision.",
  };
}

function bridgeRequest(): DecisionEnginePromptContextBridgeRequest {
  return {
    bridgeId: "stage_9_post_provider_bridge",
    submittedAt: "2026-08-07T00:00:00.000Z",
    locale: "es",
    decisionContext: decisionContext(),
    safety: safety(),
  };
}

function candidate(overrides: Partial<CandidateDecisionMaterialItem> = {}): CandidateDecisionMaterialItem {
  return {
    candidate_id: "candidate_risk_launch",
    item_type: "risk_signal",
    content: "La dependencia de evidencia temprana puede limitar el aprendizaje.",
    provenance: { source: "provider_candidate", source_ref: "provider_inference" },
    confidence: "medium",
    evidence: "provider_inference",
    option_refs: ["option_1"],
    scenario_refs: ["scenario_1"],
    criterion_refs: ["criterion_1"],
    authority: "candidate_only",
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    ...overrides,
  };
}

function material(items: CandidateDecisionMaterialItem[] = [candidate()]): CandidateDecisionMaterial {
  return {
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    generation_status: "completed",
    classification: "synthetic_non_personal",
    items,
  };
}

function request(candidateMaterial: unknown = material()): Record<string, unknown> {
  return {
    boundaryId: "stage_9_post_provider_boundary",
    bridgeRequest: bridgeRequest(),
    candidateMaterial,
  };
}

export function validPostProviderDecisionEngineResult(): PostProviderDecisionEngineBoundaryResult {
  return composePostProviderDecisionMaterial(request());
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function errorCode(result: PostProviderDecisionEngineBoundaryResult): PostProviderDecisionEngineErrorCode | undefined {
  return result.status === "rejected" ? result.error.code : undefined;
}

function validationCase(input: {
  caseId: string;
  kind: "positive" | "negative";
  result: PostProviderDecisionEngineBoundaryResult;
  passed: (result: PostProviderDecisionEngineBoundaryResult) => boolean;
  issue: string;
}): PostProviderDecisionEngineValidationCase {
  const passed = input.passed(input.result);
  return {
    caseId: input.caseId,
    kind: input.kind,
    passed,
    ...(passed ? {} : { issue: input.issue }),
  };
}

export function runPostProviderDecisionEngineBoundaryValidation(): PostProviderDecisionEngineValidationResult {
  const validRequest = request();
  const first = composePostProviderDecisionMaterial(validRequest);
  const repeated = composePostProviderDecisionMaterial(clone(validRequest));
  const existingOption = candidate({
    candidate_id: "candidate_existing_option",
    item_type: "option",
    content: "El piloto acotado conserva una opción existente.",
    provenance: { source: "provider_candidate", source_ref: "option_1" },
    evidence: "user_fact_reference",
    option_refs: ["option_1"],
    scenario_refs: [],
    criterion_refs: [],
  });
  const unsupportedOption = candidate({
    candidate_id: "candidate_new_option",
    item_type: "option",
    content: "Una tercera vía inferida por el proveedor.",
    provenance: { source: "provider_candidate", source_ref: "provider_inference" },
    evidence: "provider_inference",
    option_refs: [],
    scenario_refs: [],
    criterion_refs: [],
  });
  const partial = composePostProviderDecisionMaterial(
    request(material([candidate(), unsupportedOption])),
  );
  const invalidContextRequest = request();
  ((invalidContextRequest.bridgeRequest as DecisionEnginePromptContextBridgeRequest)
    .decisionContext.options[0] as { label: string }).label = "";

  const cases = [
    validationCase({
      caseId: "validated_candidate_composes_into_decision_engine_material",
      kind: "positive",
      result: first,
      passed: (result) => result.status === "composed" &&
        result.outcome === "accepted" &&
        result.controlledMaterial.items.length === 1 &&
        result.controlledMaterial.items[0].optionIds[0] === "option_launch" &&
        result.controlledMaterial.items[0].scenarioOptionIds[0] === "option_launch" &&
        result.controlledMaterial.items[0].authority === "decision_engine" &&
        result.simulationSource.decisionContext.decisionId === "decision_post_provider" &&
        result.simulationSource.requestId === "stage_9_post_provider_bridge" &&
        !result.controlledMaterial.finalRecommendationProduced &&
        !result.controlledMaterial.providerMetadataIncluded,
      issue: "Validated material was not composed under Decision Engine authority.",
    }),
    validationCase({
      caseId: "existing_option_maps_without_creating_new_option",
      kind: "positive",
      result: composePostProviderDecisionMaterial(request(material([existingOption]))),
      passed: (result) => result.status === "composed" &&
        result.controlledMaterial.items[0].optionIds.join(",") === "option_launch" &&
        result.controlledMaterial.items[0].sourceContextEntityIds.join(",") === "option_launch",
      issue: "Grounded option was not mapped to its Decision Context entity.",
    }),
    validationCase({
      caseId: "unsupported_option_is_rejected_while_valid_item_survives",
      kind: "positive",
      result: partial,
      passed: (result) => result.status === "composed" &&
        result.outcome === "accepted_with_rejections" &&
        result.controlledMaterial.items.length === 1 &&
        result.acceptance.ledger.some((entry) =>
          entry.candidate_id === "candidate_new_option" && entry.disposition === "rejected_irrelevant"),
      issue: "Decision Engine did not independently reject a provider-created option.",
    }),
    validationCase({
      caseId: "composition_is_deterministic",
      kind: "positive",
      result: repeated,
      passed: (result) => JSON.stringify(result) === JSON.stringify(first),
      issue: "Repeated composition changed the controlled result.",
    }),
    validationCase({
      caseId: "semantic_ledger_and_composition_trace_are_complete",
      kind: "positive",
      result: first,
      passed: (result) => result.status === "composed" &&
        result.acceptance.silent_drop_count === 0 &&
        result.evidence.semanticPreservationLedgerComplete &&
        result.compositionEvidence.items.length === result.controlledMaterial.items.length &&
        result.compositionEvidence.items.every((entry) => entry.authority === "decision_engine"),
      issue: "Ledger or composition traceability was incomplete.",
    }),
    validationCase({
      caseId: "provider_and_public_runtime_metadata_remain_absent",
      kind: "positive",
      result: first,
      passed: (result) => result.status === "composed" &&
        !JSON.stringify(result.controlledMaterial).includes("openai") &&
        !JSON.stringify(result.controlledMaterial).includes("gpt-") &&
        result.evidence.providerExecutionCount === 0 &&
        result.evidence.networkExecutionCount === 0 &&
        !result.evidence.apiRouteIntegrated &&
        !result.evidence.uiIntegrated &&
        !result.evidence.persistenceIntegrated,
      issue: "Provider-specific or public-runtime metadata leaked into controlled material.",
    }),
    validationCase({
      caseId: "missing_request_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(null),
      passed: (result) => errorCode(result) === "request_invalid",
      issue: "Missing request was not rejected.",
    }),
    validationCase({
      caseId: "unknown_provider_metadata_field_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial({ ...request(), provider: "openai" }),
      passed: (result) => errorCode(result) === "request_invalid",
      issue: "Unknown provider metadata was accepted.",
    }),
    validationCase({
      caseId: "invalid_original_decision_context_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(invalidContextRequest),
      passed: (result) => errorCode(result) === "decision_context_invalid",
      issue: "Invalid original Decision Context was accepted.",
    }),
    validationCase({
      caseId: "malformed_candidate_contract_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request({ ...material(), unknown: true })),
      passed: (result) => errorCode(result) === "candidate_contract_invalid",
      issue: "Malformed candidate contract was accepted.",
    }),
    validationCase({
      caseId: "direct_best_option_claim_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([
        candidate({ content: "La mejor opción es lanzar ahora." }),
      ]))),
      passed: (result) => errorCode(result) === "candidate_safety_invalid",
      issue: "Provider best-option claim was accepted.",
    }),
    validationCase({
      caseId: "russian_best_option_claim_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([
        candidate({ content: "Лучший вариант — запустить пилот сейчас." }),
      ]))),
      passed: (result) => errorCode(result) === "candidate_safety_invalid",
      issue: "Russian provider best-option claim was accepted.",
    }),
    validationCase({
      caseId: "invalid_provenance_reference_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([candidate({
        provenance: { source: "provider_candidate", source_ref: "external_fact_9" },
      })]))),
      passed: (result) => errorCode(result) === "candidate_grounding_invalid",
      issue: "Ungrounded provenance was accepted.",
    }),
    validationCase({
      caseId: "invalid_option_reference_is_rejected",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([
        candidate({ option_refs: ["option_99"] }),
      ]))),
      passed: (result) => result.status === "rejected" &&
        errorCode(result) === "no_acceptable_material" &&
        result.acceptance?.ledger[0].reason === "invalid_reference",
      issue: "Unsupported option reference was accepted.",
    }),
    validationCase({
      caseId: "unsupported_provider_fact_is_rejected",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([candidate({
        item_type: "context_factor",
        content: "El proveedor inventa un hecho nuevo.",
      })]))),
      passed: (result) => result.status === "rejected" && errorCode(result) === "no_acceptable_material",
      issue: "Provider inference was promoted to a Decision Engine fact.",
    }),
    validationCase({
      caseId: "unsupported_provider_option_is_rejected",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([unsupportedOption]))),
      passed: (result) => result.status === "rejected" && errorCode(result) === "no_acceptable_material",
      issue: "Provider-created option entered controlled material.",
    }),
    validationCase({
      caseId: "prohibited_safety_content_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([candidate({
        content: "Guaranteed synthetic outcome under this scenario.",
      })]))),
      passed: (result) => errorCode(result) === "candidate_safety_invalid",
      issue: "Decision Engine prohibited output was accepted.",
    }),
    validationCase({
      caseId: "empty_candidate_material_fails_closed",
      kind: "negative",
      result: composePostProviderDecisionMaterial(request(material([]))),
      passed: (result) => errorCode(result) === "no_acceptable_material",
      issue: "Empty provider material was presented as composed material.",
    }),
  ];

  const passed = cases.filter((entry) => entry.passed).length;
  return {
    passed: passed === cases.length,
    failed: passed !== cases.length,
    cases,
    summary: {
      total: cases.length,
      passed,
      failed: cases.length - passed,
      positive: cases.filter((entry) => entry.kind === "positive").length,
      negative: cases.filter((entry) => entry.kind === "negative").length,
      networkRequests: 0,
    },
  };
}
