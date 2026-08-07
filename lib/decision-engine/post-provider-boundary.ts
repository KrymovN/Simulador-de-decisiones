import "server-only";

import {
  acceptCandidateDecisionMaterial,
  inspectCandidateDecisionMaterialContract,
} from "../ai-decision-material/acceptance";
import {
  type CandidateDecisionMaterial,
  type CandidateDecisionMaterialItem,
  type DecisionCompositionEvidence,
  type DecisionMaterialAcceptanceResult,
  type DecisionMaterialItemType,
  type ValueAddTransformation,
} from "../ai-decision-material/contracts";
import { bridgeDecisionEngineToPromptContext } from "../ai-integration/decision-engine-prompt-context-bridge";
import type { DecisionEnginePromptContextBridgeRequest } from "../ai-integration/contracts";
import type { DecisionContext, EntityId } from "./types";

export const POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION =
  "stage-9-post-provider-decision-engine-boundary.1" as const;

const REQUEST_KEYS = ["boundaryId", "bridgeRequest", "candidateMaterial"] as const;
const FACT_OR_OPTION_TYPES = new Set<DecisionMaterialItemType>([
  "context_factor",
  "user_goal",
  "decision_criterion",
  "option",
]);

export type PostProviderDecisionEngineBoundaryRequest = {
  boundaryId: string;
  bridgeRequest: DecisionEnginePromptContextBridgeRequest;
  candidateMaterial: CandidateDecisionMaterial;
};

export type PostProviderDecisionEngineErrorCode =
  | "request_invalid"
  | "decision_context_invalid"
  | "candidate_contract_invalid"
  | "candidate_safety_invalid"
  | "candidate_grounding_invalid"
  | "no_acceptable_material";

export type DecisionEngineControlledMaterialItem = {
  materialItemId: string;
  sourceCandidateIds: string[];
  itemType: DecisionMaterialItemType;
  content: string;
  evidenceClassification: CandidateDecisionMaterialItem["evidence"];
  confidence: CandidateDecisionMaterialItem["confidence"];
  sourceContextEntityIds: EntityId[];
  optionIds: EntityId[];
  scenarioOptionIds: EntityId[];
  criterionRefs: string[];
  transformations: ValueAddTransformation[];
  authority: "decision_engine";
};

export type DecisionEngineControlledMaterial = {
  contractVersion: "2.0";
  decisionId: EntityId;
  mode: "post_provider_controlled_candidate_material";
  items: DecisionEngineControlledMaterialItem[];
  finalRecommendationProduced: false;
  providerMetadataIncluded: false;
};

export type PostProviderDecisionEngineEvidence = {
  serverOnly: true;
  deterministicOnly: true;
  originalDecisionContextMatched: boolean;
  candidateContractValidated: boolean;
  groundingValidated: boolean;
  safetyValidated: boolean;
  semanticPreservationLedgerComplete: boolean;
  decisionEngineIsFinalAuthority: true;
  providerMetadataIncluded: false;
  rawProviderAnswerPersisted: false;
  providerExecutionCount: 0;
  networkExecutionCount: 0;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  persistenceIntegrated: false;
};

export type PostProviderDecisionEngineBoundaryResult =
  | {
      status: "composed";
      execution: "post_provider_decision_engine_only";
      version: typeof POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION;
      boundaryId: string;
      outcome: "accepted" | "accepted_with_rejections";
      acceptance: DecisionMaterialAcceptanceResult;
      controlledMaterial: DecisionEngineControlledMaterial;
      compositionEvidence: DecisionCompositionEvidence;
      evidence: PostProviderDecisionEngineEvidence;
    }
  | {
      status: "rejected";
      execution: "none";
      version: typeof POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION;
      boundaryId?: string;
      error: {
        code: PostProviderDecisionEngineErrorCode;
        message: string;
        recoverable: false;
      };
      acceptance?: DecisionMaterialAcceptanceResult;
      evidence: PostProviderDecisionEngineEvidence;
    };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

function boundedId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{2,79}$/i.test(value);
}

function boundaryEvidence(
  input: Partial<PostProviderDecisionEngineEvidence> = {},
): PostProviderDecisionEngineEvidence {
  return {
    serverOnly: true,
    deterministicOnly: true,
    originalDecisionContextMatched: input.originalDecisionContextMatched === true,
    candidateContractValidated: input.candidateContractValidated === true,
    groundingValidated: input.groundingValidated === true,
    safetyValidated: input.safetyValidated === true,
    semanticPreservationLedgerComplete: input.semanticPreservationLedgerComplete === true,
    decisionEngineIsFinalAuthority: true,
    providerMetadataIncluded: false,
    rawProviderAnswerPersisted: false,
    providerExecutionCount: 0,
    networkExecutionCount: 0,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    persistenceIntegrated: false,
  };
}

function rejected(input: {
  boundaryId?: string;
  code: PostProviderDecisionEngineErrorCode;
  message: string;
  acceptance?: DecisionMaterialAcceptanceResult;
  evidence?: Partial<PostProviderDecisionEngineEvidence>;
}): PostProviderDecisionEngineBoundaryResult {
  return {
    status: "rejected",
    execution: "none",
    version: POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION,
    ...(input.boundaryId ? { boundaryId: input.boundaryId } : {}),
    error: { code: input.code, message: input.message, recoverable: false },
    ...(input.acceptance ? { acceptance: input.acceptance } : {}),
    evidence: boundaryEvidence(input.evidence),
  };
}

function positionalRefs(prefix: "option" | "scenario" | "criterion", count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}_${index + 1}`);
}

function allowedSourceRefs(optionCount: number, constraintCount: number, criterionCount: number): Set<string> {
  return new Set([
    "objective_1",
    "question_1",
    ...positionalRefs("option", optionCount),
    ...positionalRefs("scenario", optionCount),
    ...Array.from({ length: constraintCount }, (_, index) => `constraint_${index + 1}`),
    ...positionalRefs("criterion", criterionCount),
    "provider_inference",
    "unknown",
  ]);
}

function provenanceIsGrounded(
  material: CandidateDecisionMaterial,
  sourceRefs: Set<string>,
): boolean {
  return material.items.every((item) =>
    sourceRefs.has(item.provenance.source_ref) &&
    (item.evidence !== "provider_inference" || item.provenance.source_ref === "provider_inference") &&
    (item.evidence !== "unknown" || item.provenance.source_ref === "unknown") &&
    (!["user_fact_reference", "user_assumption_reference"].includes(item.evidence) ||
      !["provider_inference", "unknown"].includes(item.provenance.source_ref))
  );
}

function unsupportedFactOrOption(item: CandidateDecisionMaterialItem): boolean {
  if (!FACT_OR_OPTION_TYPES.has(item.item_type)) return false;
  if (item.evidence !== "user_fact_reference") return true;

  if (item.item_type === "option") {
    return item.option_refs.length !== 1 || item.provenance.source_ref !== item.option_refs[0];
  }
  if (item.item_type === "decision_criterion") {
    return item.criterion_refs.length === 0 || !item.criterion_refs.includes(item.provenance.source_ref);
  }
  if (item.item_type === "user_goal") {
    return !["objective_1", "question_1"].includes(item.provenance.source_ref) &&
      !item.provenance.source_ref.startsWith("criterion_");
  }
  return !["objective_1", "question_1"].includes(item.provenance.source_ref) &&
    !item.provenance.source_ref.startsWith("constraint_");
}

function violatesSafetyBoundary(
  material: CandidateDecisionMaterial,
  request: DecisionEnginePromptContextBridgeRequest,
): boolean {
  const prohibited = request.safety?.prohibitedOutputs
    .map((item) => item.trim().toLocaleLowerCase(request.locale))
    .filter((item) => item.length >= 4) ?? [];
  return material.items.some((item) => {
    const content = item.content.toLocaleLowerCase(request.locale);
    return prohibited.some((phrase) => content.includes(phrase));
  });
}

function mapOptionRefs(refs: string[], context: DecisionContext): EntityId[] {
  return refs.map((ref) => {
    const index = Number(ref.slice(ref.lastIndexOf("_") + 1)) - 1;
    return context.options[index]?.id;
  }).filter((id): id is EntityId => Boolean(id));
}

function sourceContextEntityIds(
  item: CandidateDecisionMaterialItem,
  context: DecisionContext,
): EntityId[] {
  const source = item.provenance.source_ref;
  if (source === "objective_1" || source === "question_1") return [context.decisionId];
  if (source.startsWith("option_") || source.startsWith("scenario_")) {
    return mapOptionRefs([source], context);
  }
  if (source.startsWith("constraint_")) {
    const index = Number(source.slice("constraint_".length)) - 1;
    return context.constraints[index] ? [context.constraints[index].id] : [];
  }
  return [];
}

function transformations(item: CandidateDecisionMaterialItem): ValueAddTransformation[] {
  const values = new Set<ValueAddTransformation>(["epistemic_classification", "traceability"]);
  if (item.option_refs.length > 0 || item.scenario_refs.length > 0) values.add("scenario_mapping");
  if (item.criterion_refs.length > 0) values.add("criterion_mapping");
  if (item.item_type === "dependency") values.add("dependency_identification");
  if (item.item_type === "decision_trigger") values.add("decision_trigger_identification");
  if (["short_term_consequence", "long_term_consequence"].includes(item.item_type)) {
    values.add("consequence_horizon_classification");
  }
  if (item.item_type === "reversibility") values.add("reversibility_classification");
  if (item.item_type === "clarification_need") values.add("clarification_identification");
  return [...values];
}

function controlledItem(
  item: CandidateDecisionMaterialItem,
  index: number,
  context: DecisionContext,
): DecisionEngineControlledMaterialItem {
  return {
    materialItemId: `decision_material_${index + 1}_${item.candidate_id}`,
    sourceCandidateIds: [item.candidate_id],
    itemType: item.item_type,
    content: item.content,
    evidenceClassification: item.evidence,
    confidence: item.confidence,
    sourceContextEntityIds: sourceContextEntityIds(item, context),
    optionIds: mapOptionRefs(item.option_refs, context),
    scenarioOptionIds: mapOptionRefs(item.scenario_refs, context),
    criterionRefs: [...item.criterion_refs],
    transformations: transformations(item),
    authority: "decision_engine",
  };
}

/**
 * Re-enters validated provider-neutral candidate material into the deterministic
 * Decision Engine. This boundary performs no provider, network, persistence,
 * API, Simulator, or UI work.
 */
export function composePostProviderDecisionMaterial(
  value: unknown,
): PostProviderDecisionEngineBoundaryResult {
  if (!record(value) || !exactKeys(value, REQUEST_KEYS) || !boundedId(value.boundaryId)) {
    return rejected({ code: "request_invalid", message: "Post-provider boundary requires the exact canonical request shape." });
  }
  const boundaryId = value.boundaryId;
  const bridge = bridgeDecisionEngineToPromptContext(value.bridgeRequest);
  if (bridge.status !== "ready") {
    return rejected({
      boundaryId,
      code: "decision_context_invalid",
      message: "The original Decision Context could not be re-established through the canonical bridge.",
    });
  }

  const inspection = inspectCandidateDecisionMaterialContract(value.candidateMaterial);
  if (!inspection.schemaValid) {
    return rejected({
      boundaryId,
      code: "candidate_contract_invalid",
      message: "Candidate material does not satisfy candidate_decision_material_v1.",
      evidence: { originalDecisionContextMatched: true },
    });
  }
  if (!inspection.safetyValid) {
    return rejected({
      boundaryId,
      code: "candidate_safety_invalid",
      message: "Candidate material violated the post-provider safety or authority boundary.",
      evidence: { originalDecisionContextMatched: true, candidateContractValidated: true },
    });
  }

  const material = value.candidateMaterial as CandidateDecisionMaterial;
  const request = value.bridgeRequest as DecisionEnginePromptContextBridgeRequest;
  const context = request.decisionContext;
  const frame = bridge.promptContextOutput.contextFrame;
  const optionRefs = positionalRefs("option", frame.scenarioSeeds.length);
  const scenarioRefs = positionalRefs("scenario", frame.scenarioSeeds.length);
  const criterionRefs = positionalRefs("criterion", frame.tradeoffFocus.length);
  const sourceRefs = allowedSourceRefs(
    frame.scenarioSeeds.length,
    frame.knownConstraints.length,
    frame.tradeoffFocus.length,
  );

  if (!provenanceIsGrounded(material, sourceRefs)) {
    return rejected({
      boundaryId,
      code: "candidate_grounding_invalid",
      message: "Candidate provenance is not grounded in Prompt Context derived from the original Decision Context.",
      evidence: {
        originalDecisionContextMatched: true,
        candidateContractValidated: true,
        safetyValidated: true,
      },
    });
  }
  if (violatesSafetyBoundary(material, request)) {
    return rejected({
      boundaryId,
      code: "candidate_safety_invalid",
      message: "Candidate material contains content prohibited by the original Decision Engine safety boundary.",
      evidence: {
        originalDecisionContextMatched: true,
        candidateContractValidated: true,
        groundingValidated: true,
      },
    });
  }

  const unsupportedCandidateIds = material.items
    .filter(unsupportedFactOrOption)
    .map((item) => item.candidate_id);
  const acceptance = acceptCandidateDecisionMaterial(material, {
    allowed_option_refs: optionRefs,
    allowed_scenario_refs: scenarioRefs,
    allowed_criterion_refs: criterionRefs,
    contradictory_candidate_ids: [],
    irrelevant_candidate_ids: unsupportedCandidateIds,
  });
  const ledgerComplete = acceptance.silent_drop_count === 0 &&
    acceptance.ledger.length === acceptance.observed_candidate_count;
  const completedEvidence = {
    originalDecisionContextMatched: true,
    candidateContractValidated: true,
    groundingValidated: true,
    safetyValidated: true,
    semanticPreservationLedgerComplete: ledgerComplete,
  } as const;

  if (acceptance.status !== "accepted" || acceptance.accepted_material.items.length === 0 || !ledgerComplete) {
    return rejected({
      boundaryId,
      code: "no_acceptable_material",
      message: "Decision Engine rejected the provider material because no controlled candidate item remained.",
      acceptance,
      evidence: completedEvidence,
    });
  }

  const items = acceptance.accepted_material.items.map((item, index) => controlledItem(item, index, context));
  const compositionEvidence: DecisionCompositionEvidence = {
    items: items.map((item) => ({
      composition_item_id: item.materialItemId,
      source_candidate_ids: item.sourceCandidateIds,
      transformations: item.transformations,
      authority: "decision_engine",
    })),
    contains_raw_provider_answer: false,
    personal_data_scope_opened: false,
  };
  const hadRejections = acceptance.ledger.some((entry) =>
    entry.disposition.startsWith("rejected") || entry.disposition === "controlled_failure"
  );
  return {
    status: "composed",
    execution: "post_provider_decision_engine_only",
    version: POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION,
    boundaryId,
    outcome: hadRejections ? "accepted_with_rejections" : "accepted",
    acceptance,
    controlledMaterial: {
      contractVersion: "2.0",
      decisionId: context.decisionId,
      mode: "post_provider_controlled_candidate_material",
      items,
      finalRecommendationProduced: false,
      providerMetadataIncluded: false,
    },
    compositionEvidence,
    evidence: boundaryEvidence(completedEvidence),
  };
}
