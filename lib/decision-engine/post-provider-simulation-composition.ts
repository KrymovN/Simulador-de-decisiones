import "server-only";

import { DECISION_MATERIAL_ITEM_TYPES, VALUE_ADD_TRANSFORMATIONS } from "../ai-decision-material/contracts";
import { bridgeDecisionEngineToPromptContext } from "../ai-integration/decision-engine-prompt-context-bridge";
import type { SimulationResponseV2Draft } from "./contracts";
import {
  POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION,
  type DecisionEngineControlledMaterialItem,
  type DecisionEngineSimulationSource,
  type PostProviderDecisionEngineBoundaryResult,
} from "./post-provider-boundary";
import { runSimulationPipeline } from "./pipeline";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import type { DecisionInput, DecisionIntent, EvidenceRef } from "./types";

export const POST_PROVIDER_SIMULATION_COMPOSITION_VERSION =
  "stage-9-post-provider-simulation-composition.1" as const;

const CONTROLLED_ITEM_KEYS = [
  "materialItemId",
  "sourceCandidateIds",
  "itemType",
  "content",
  "evidenceClassification",
  "confidence",
  "sourceContextEntityIds",
  "optionIds",
  "scenarioOptionIds",
  "criterionRefs",
  "transformations",
  "authority",
] as const;

const SIMULATION_SOURCE_KEYS = [
  "requestId",
  "generatedAt",
  "inputLanguage",
  "requestedOutputLanguage",
  "decisionContext",
  "safetyContextComplete",
] as const;

export type PostProviderSimulationCompositionErrorCode =
  | "input_invalid"
  | "controlled_result_incompatible"
  | "simulation_source_invalid"
  | "deterministic_pipeline_failed"
  | "simulation_response_invalid";

export type PostProviderSimulationCompositionEvidence = {
  serverOnly: true;
  deterministicPipelineUsed: boolean;
  postProviderBoundaryRequired: true;
  decisionEngineAuthorityPreserved: boolean;
  controlledMaterialTraceabilityPreserved: boolean;
  providerMetadataIncluded: false;
  directProviderInputAccepted: false;
  providerExecutionCount: 0;
  networkExecutionCount: 0;
  apiRouteIntegrated: false;
  uiIntegrated: false;
  persistenceIntegrated: false;
};

export type PostProviderSimulationCompositionResult =
  | {
      status: "composed";
      execution: "post_provider_simulation_composition_only";
      version: typeof POST_PROVIDER_SIMULATION_COMPOSITION_VERSION;
      boundaryId: string;
      response: SimulationResponseV2Draft;
      evidence: PostProviderSimulationCompositionEvidence;
    }
  | {
      status: "rejected";
      execution: "none";
      version: typeof POST_PROVIDER_SIMULATION_COMPOSITION_VERSION;
      error: {
        code: PostProviderSimulationCompositionErrorCode;
        message: string;
        recoverable: false;
      };
      evidence: PostProviderSimulationCompositionEvidence;
    };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonEmptyString) && new Set(value).size === value.length;
}

function compositionEvidence(
  input: Partial<PostProviderSimulationCompositionEvidence> = {},
): PostProviderSimulationCompositionEvidence {
  return {
    serverOnly: true,
    deterministicPipelineUsed: input.deterministicPipelineUsed === true,
    postProviderBoundaryRequired: true,
    decisionEngineAuthorityPreserved: input.decisionEngineAuthorityPreserved === true,
    controlledMaterialTraceabilityPreserved: input.controlledMaterialTraceabilityPreserved === true,
    providerMetadataIncluded: false,
    directProviderInputAccepted: false,
    providerExecutionCount: 0,
    networkExecutionCount: 0,
    apiRouteIntegrated: false,
    uiIntegrated: false,
    persistenceIntegrated: false,
  };
}

function rejected(
  code: PostProviderSimulationCompositionErrorCode,
  message: string,
  evidence: Partial<PostProviderSimulationCompositionEvidence> = {},
): PostProviderSimulationCompositionResult {
  return {
    status: "rejected",
    execution: "none",
    version: POST_PROVIDER_SIMULATION_COMPOSITION_VERSION,
    error: { code, message, recoverable: false },
    evidence: compositionEvidence(evidence),
  };
}

function simulationSourceIsValid(value: unknown): value is DecisionEngineSimulationSource {
  if (!record(value)) return false;
  const allowedKeys = value.safety === undefined
    ? SIMULATION_SOURCE_KEYS
    : [...SIMULATION_SOURCE_KEYS, "safety"];
  if (!exactKeys(value, allowedKeys)) return false;
  if (
    !nonEmptyString(value.requestId) ||
    !nonEmptyString(value.generatedAt) ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    !["en", "es", "ru"].includes(value.inputLanguage as string) ||
    value.requestedOutputLanguage !== value.inputLanguage ||
    typeof value.safetyContextComplete !== "boolean" ||
    !record(value.decisionContext)
  ) return false;

  const bridge = bridgeDecisionEngineToPromptContext({
    bridgeId: value.requestId,
    submittedAt: value.generatedAt,
    locale: value.inputLanguage,
    decisionContext: value.decisionContext,
    ...(value.safety === undefined ? {} : { safety: value.safety }),
  });
  return bridge.status === "ready" &&
    value.safetyContextComplete === (value.safety !== undefined);
}

function controlledItemIsValid(
  value: unknown,
  source: DecisionEngineSimulationSource,
): value is DecisionEngineControlledMaterialItem {
  if (!record(value) || !exactKeys(value, CONTROLLED_ITEM_KEYS)) return false;
  if (
    !nonEmptyString(value.materialItemId) ||
    !uniqueStringList(value.sourceCandidateIds) || value.sourceCandidateIds.length === 0 ||
    !DECISION_MATERIAL_ITEM_TYPES.includes(value.itemType as never) ||
    !nonEmptyString(value.content) ||
    !["user_fact_reference", "user_assumption_reference", "provider_inference", "unknown"]
      .includes(value.evidenceClassification as string) ||
    !["low", "medium", "high", "unknown"].includes(value.confidence as string) ||
    !uniqueStringList(value.sourceContextEntityIds) ||
    !uniqueStringList(value.optionIds) ||
    !uniqueStringList(value.scenarioOptionIds) ||
    !uniqueStringList(value.criterionRefs) ||
    !uniqueStringList(value.transformations) ||
    value.authority !== "decision_engine"
  ) return false;

  const context = source.decisionContext;
  const allowedOptionIds = new Set(context.options.map((item) => item.id));
  const allowedSourceIds = new Set([
    context.decisionId,
    ...context.goals.map((item) => item.id),
    ...context.options.map((item) => item.id),
    ...context.constraints.map((item) => item.id),
    ...context.variables.map((item) => item.id),
    ...context.stakeholders.map((item) => item.id),
    ...context.assumptions.map((item) => item.id),
    ...context.evidence.map((item) => item.id),
  ]);
  return value.optionIds.every((id) => allowedOptionIds.has(id)) &&
    value.scenarioOptionIds.every((id) => allowedOptionIds.has(id)) &&
    value.sourceContextEntityIds.every((id) => allowedSourceIds.has(id)) &&
    value.criterionRefs.every((ref) => /^criterion_[1-9]\d*$/.test(ref)) &&
    value.transformations.every((item) => VALUE_ADD_TRANSFORMATIONS.includes(item as never)) &&
    value.transformations.includes("epistemic_classification") &&
    value.transformations.includes("traceability");
}

function compatibleControlledResult(
  value: unknown,
): value is Extract<PostProviderDecisionEngineBoundaryResult, { status: "composed" }> {
  if (!record(value) ||
    value.status !== "composed" ||
    value.execution !== "post_provider_decision_engine_only" ||
    value.version !== POST_PROVIDER_DECISION_ENGINE_BOUNDARY_VERSION ||
    !nonEmptyString(value.boundaryId) ||
    !record(value.acceptance) ||
    !record(value.controlledMaterial) ||
    !record(value.compositionEvidence) ||
    !record(value.evidence) ||
    !simulationSourceIsValid(value.simulationSource)
  ) return false;

  const source = value.simulationSource;
  const controlled = value.controlledMaterial;
  if (
    controlled.contractVersion !== "2.0" ||
    controlled.decisionId !== source.decisionContext.decisionId ||
    controlled.mode !== "post_provider_controlled_candidate_material" ||
    controlled.finalRecommendationProduced !== false ||
    controlled.providerMetadataIncluded !== false ||
    !Array.isArray(controlled.items) || controlled.items.length === 0 ||
    !controlled.items.every((item) => controlledItemIsValid(item, source))
  ) return false;

  const boundaryEvidence = value.evidence;
  if (
    boundaryEvidence.serverOnly !== true ||
    boundaryEvidence.deterministicOnly !== true ||
    boundaryEvidence.originalDecisionContextMatched !== true ||
    boundaryEvidence.candidateContractValidated !== true ||
    boundaryEvidence.groundingValidated !== true ||
    boundaryEvidence.safetyValidated !== true ||
    boundaryEvidence.semanticPreservationLedgerComplete !== true ||
    boundaryEvidence.decisionEngineIsFinalAuthority !== true ||
    boundaryEvidence.providerMetadataIncluded !== false ||
    boundaryEvidence.rawProviderAnswerPersisted !== false ||
    boundaryEvidence.providerExecutionCount !== 0 ||
    boundaryEvidence.networkExecutionCount !== 0 ||
    boundaryEvidence.apiRouteIntegrated !== false ||
    boundaryEvidence.uiIntegrated !== false ||
    boundaryEvidence.persistenceIntegrated !== false
  ) return false;

  const acceptance = value.acceptance;
  if (
    acceptance.status !== "accepted" ||
    acceptance.silent_drop_count !== 0 ||
    acceptance.raw_provider_material_persisted !== false ||
    !Array.isArray(acceptance.ledger) ||
    acceptance.ledger.length !== acceptance.observed_candidate_count ||
    !record(acceptance.accepted_material) ||
    !Array.isArray(acceptance.accepted_material.items) ||
    acceptance.accepted_material.items.length !== controlled.items.length
  ) return false;

  const acceptedIds = new Set(
    acceptance.accepted_material.items
      .filter(record)
      .map((item) => item.candidate_id)
      .filter(nonEmptyString),
  );
  if (!controlled.items.every((item) => item.sourceCandidateIds.every((id) => acceptedIds.has(id)))) {
    return false;
  }

  const decisionComposition = value.compositionEvidence;
  if (
    decisionComposition.contains_raw_provider_answer !== false ||
    decisionComposition.personal_data_scope_opened !== false ||
    !Array.isArray(decisionComposition.items) ||
    decisionComposition.items.length !== controlled.items.length
  ) return false;
  const decisionCompositionItems = decisionComposition.items;
  return controlled.items.every((item) => decisionCompositionItems.some((candidate) =>
    record(candidate) &&
    candidate.composition_item_id === item.materialItemId &&
    candidate.authority === "decision_engine" &&
    JSON.stringify(candidate.source_candidate_ids) === JSON.stringify(item.sourceCandidateIds) &&
    JSON.stringify(candidate.transformations) === JSON.stringify(item.transformations)
  ));
}

function decisionIntent(source: DecisionEngineSimulationSource): DecisionIntent {
  const types = source.decisionContext.decisionTypes;
  if (types.includes("comparative") || types.includes("binary")) return "compare";
  if (types.includes("exploratory")) return "explore";
  return "review";
}

function decisionInput(source: DecisionEngineSimulationSource): DecisionInput {
  return {
    contractVersion: "2.0",
    requestId: source.requestId,
    input: {
      originalText: source.decisionContext.statement,
      inputLanguage: source.inputLanguage,
      requestedOutputLanguage: source.requestedOutputLanguage,
    },
    userIntent: decisionIntent(source),
    suppliedContext: structuredClone(source.decisionContext.evidence),
    suppliedOptions: structuredClone(source.decisionContext.options),
  };
}

function reliability(item: DecisionEngineControlledMaterialItem): EvidenceRef["reliability"] {
  if (item.confidence === "high") return "medium";
  if (item.confidence === "medium" || item.confidence === "low") return "low";
  return "unverified";
}

function controlledEvidence(item: DecisionEngineControlledMaterialItem): EvidenceRef {
  return {
    id: item.materialItemId,
    source: "engine_inference",
    claim: item.content,
    reliability: reliability(item),
    userConfirmed: false,
  };
}

function composeControlledTrace(
  response: SimulationResponseV2Draft,
  items: DecisionEngineControlledMaterialItem[],
): SimulationResponseV2Draft {
  const existingEvidenceIds = new Set(response.traceability.evidence.map((item) => item.id));
  const evidence = items
    .filter((item) => !existingEvidenceIds.has(item.materialItemId))
    .map(controlledEvidence);
  const notices = items.flatMap((item): SimulationResponseV2Draft["notices"] => {
    if (item.itemType === "unknown") {
      return [{ code: "accepted_unknown", severity: "info", message: item.content }];
    }
    if (item.itemType === "clarification_need") {
      return [{ code: "limited_context", severity: "warning", message: item.content }];
    }
    return [];
  });
  return {
    ...response,
    traceability: {
      ...response.traceability,
      evidence: [...response.traceability.evidence, ...evidence],
      responseMapping: [
        ...response.traceability.responseMapping,
        ...items.map((item) => ({
          stage: "response_mapping" as const,
          status: "completed" as const,
          detail: `Composed controlled ${item.itemType} material under Decision Engine authority.`,
          sourceEntityIds: [item.materialItemId, ...item.sourceContextEntityIds, ...item.optionIds],
        })),
      ],
    },
    notices: [...response.notices, ...notices],
  };
}

/**
 * Composes only a completed post-provider Decision Engine result into the
 * existing deterministic SimulationResponseV2Draft contract.
 */
export function composePostProviderSimulationResponse(
  value: unknown,
): PostProviderSimulationCompositionResult {
  if (!record(value)) {
    return rejected("input_invalid", "Simulation composition requires a post-provider Decision Engine result.");
  }
  if (!compatibleControlledResult(value)) {
    return rejected(
      "controlled_result_incompatible",
      "Post-provider controlled material is malformed, incomplete, or not owned by the Decision Engine.",
    );
  }

  const source = value.simulationSource;
  if (!simulationSourceIsValid(source)) {
    return rejected("simulation_source_invalid", "Canonical simulation source is invalid.");
  }
  const response = runSimulationPipeline(decisionInput(source), {
    context: structuredClone(source.decisionContext),
    ...(source.safety ? { safety: structuredClone(source.safety) } : {}),
    safetyContextComplete: source.safetyContextComplete,
  });
  if (response.status === "failed" || !validateSimulationResponseV2DraftShape(response)) {
    return rejected(
      "deterministic_pipeline_failed",
      "Existing deterministic simulation pipeline did not produce a usable draft.",
      { deterministicPipelineUsed: true, decisionEngineAuthorityPreserved: true },
    );
  }

  const composed = composeControlledTrace(
    { ...response, generatedAt: source.generatedAt },
    value.controlledMaterial.items,
  );
  if (!validateSimulationResponseV2DraftShape(composed)) {
    return rejected(
      "simulation_response_invalid",
      "Composed output did not satisfy SimulationResponseV2Draft.",
      { deterministicPipelineUsed: true, decisionEngineAuthorityPreserved: true },
    );
  }

  return {
    status: "composed",
    execution: "post_provider_simulation_composition_only",
    version: POST_PROVIDER_SIMULATION_COMPOSITION_VERSION,
    boundaryId: value.boundaryId,
    response: composed,
    evidence: compositionEvidence({
      deterministicPipelineUsed: true,
      decisionEngineAuthorityPreserved: true,
      controlledMaterialTraceabilityPreserved: true,
    }),
  };
}
