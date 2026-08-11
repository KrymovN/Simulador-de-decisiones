import "server-only";

import {
  candidateDecisionMaterialHasValidContract,
  inspectCandidateDecisionMaterialContract,
} from "../ai-decision-material/acceptance";
import type {
  CandidateDecisionMaterial,
  CandidateDecisionMaterialItem,
  DecisionMaterialItemType,
} from "../ai-decision-material/contracts";
import type { CanonicalProviderEvaluationInputV1 } from
  "../ai-decision-material/canonical-provider-evaluation-input";
import {
  CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA,
} from "../ai-provider/openai-decision-material-adapter";
import {
  CANONICAL_PROVIDER_EVALUATION_CATEGORIES,
  CANONICAL_PROVIDER_EVALUATION_TAXONOMY,
  canonicalOracleConceptsByCategory,
  type CanonicalProviderEvaluationCategory,
} from "./canonical-provider-evaluation-taxonomy";
import type { CanonicalProviderEvaluationOracle } from
  "../ai-decision-material/canonical-provider-evaluation-input";

export const CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION =
  "canonical-provider-evaluation-result.1" as const;

export const CANONICAL_PROVIDER_EVALUATION_SCHEMA_NAME =
  "levio_canonical_provider_evaluation_result_v1" as const;

export const CANONICAL_PROVIDER_EVALUATION_OUTCOMES = [
  "candidate_material",
  "clarification_required",
  "recommendation_withheld",
  "safe_refusal",
  "controlled_failure",
] as const;

export type CanonicalProviderEvaluationOutcome =
  (typeof CANONICAL_PROVIDER_EVALUATION_OUTCOMES)[number];

export type CanonicalProviderEvaluationAnnotation = {
  concept_id: string;
  evidence_kind: "candidate_material" | "execution_outcome";
  candidate_ids: string[];
  source_refs: string[];
};

export type CanonicalProviderEvaluationResultV1 = {
  evaluation_contract_version: typeof CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION;
  candidate_material: CandidateDecisionMaterial | null;
  evaluation_annotations: Record<
    CanonicalProviderEvaluationCategory,
    CanonicalProviderEvaluationAnnotation[]
  >;
  outcome: {
    kind: CanonicalProviderEvaluationOutcome;
    v2_status: "SIMULATED" | "CLARIFICATION_REQUIRED" | "CANNOT_RECOMMEND";
  };
};

export const CANONICAL_PROVIDER_ANNOTATION_INVALID_REASONS = [
  "evaluation_annotations_object_invalid",
  "annotation_category_not_array",
  "annotation_object_invalid",
  "annotation_fields_invalid",
  "concept_id_invalid",
  "evidence_kind_invalid",
  "candidate_ids_invalid",
  "source_refs_invalid",
  "duplicate_candidate_id",
  "duplicate_source_ref",
  "duplicate_concept_id",
  "execution_outcome_references_not_empty",
  "v2_status_outcome_mismatch",
  "scenario_compare_requires_candidate_material",
  "risk_execution_outcome_incompatible",
  "candidate_material_references_empty",
  "risk_candidate_type_incompatible",
  "clarification_candidate_type_missing",
  "scenario_compare_option_count_insufficient",
  "scenario_compare_consequence_missing",
  "information_first_grounding_missing",
  "v2_status_candidate_material_forbidden",
] as const;

export type CanonicalProviderAnnotationInvalidReason =
  (typeof CANONICAL_PROVIDER_ANNOTATION_INVALID_REASONS)[number];

export type CanonicalProviderAnnotationInvalidDiagnostic = {
  reason: CanonicalProviderAnnotationInvalidReason;
  annotationCategory: CanonicalProviderEvaluationCategory | null;
  conceptId: string | null;
  evidenceKind: "candidate_material" | "execution_outcome" | null;
  candidateIdCount: number | null;
  sourceRefCount: number | null;
  actualCandidateItemTypes: DecisionMaterialItemType[];
};

export type CanonicalProviderEvaluationResultValidation =
  | { status: "valid"; result: CanonicalProviderEvaluationResultV1 }
  | {
      status: "invalid";
      category:
        | "evaluation_result_contract_invalid"
        | "evaluation_annotation_invalid"
        | "evaluation_annotation_grounding_invalid"
        | "evaluation_outcome_invalid";
      annotationDiagnostic?: CanonicalProviderAnnotationInvalidDiagnostic;
    };

export type CanonicalProviderEvaluationOracleMatch = {
  passed: boolean;
  categories: Record<CanonicalProviderEvaluationCategory, {
    passed: boolean;
    expected: string[];
    actual: string[];
    missing: string[];
    unexpected: string[];
  }>;
};

const annotationSchema = (category: CanonicalProviderEvaluationCategory) => ({
  type: "array",
  description: "Each concept_id may appear at most once in this category.",
  maxItems: CANONICAL_PROVIDER_EVALUATION_TAXONOMY[category].length,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["concept_id", "evidence_kind", "candidate_ids", "source_refs"],
    properties: {
      concept_id: {
        type: "string",
        description: "Select a concept only once within its annotation category.",
        enum: [...CANONICAL_PROVIDER_EVALUATION_TAXONOMY[category]],
      },
      evidence_kind: {
        type: "string",
        description: "candidate_material requires non-empty grounded candidate_ids and source_refs. execution_outcome requires both arrays to be empty.",
        enum: ["candidate_material", "execution_outcome"],
      },
      candidate_ids: {
        type: "array",
        description: "Unique existing candidate IDs only; no duplicate value is allowed.",
        maxItems: 24,
        items: { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$" },
      },
      source_refs: {
        type: "array",
        description: "Unique allowed source references only; no duplicate value is allowed.",
        maxItems: 24,
        items: { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$" },
      },
    },
  },
});

export const CANONICAL_PROVIDER_EVALUATION_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "evaluation_contract_version",
    "candidate_material",
    "evaluation_annotations",
    "outcome",
  ],
  properties: {
    evaluation_contract_version: {
      type: "string",
      const: CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION,
    },
    candidate_material: {
      anyOf: [CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA, { type: "null" }],
    },
    evaluation_annotations: {
      type: "object",
      description: "Annotation relations must follow the evaluation instructions, including category-specific evidence and candidate-item-type requirements.",
      additionalProperties: false,
      required: [...CANONICAL_PROVIDER_EVALUATION_CATEGORIES],
      properties: Object.fromEntries(
        CANONICAL_PROVIDER_EVALUATION_CATEGORIES.map((category) => [
          category,
          annotationSchema(category),
        ]),
      ),
    },
    outcome: {
      type: "object",
      additionalProperties: false,
      required: ["kind", "v2_status"],
      properties: {
        kind: { type: "string", enum: [...CANONICAL_PROVIDER_EVALUATION_OUTCOMES] },
        v2_status: {
          type: "string",
          enum: ["SIMULATED", "CLARIFICATION_REQUIRED", "CANNOT_RECOMMEND"],
        },
      },
    },
  },
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && actual.every((key) => expected.includes(key));
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
}

function unique(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function outcomeIsValid(
  outcome: Record<string, unknown>,
  candidateMaterial: CandidateDecisionMaterial | null,
): outcome is CanonicalProviderEvaluationResultV1["outcome"] {
  if (!exactKeys(outcome, ["kind", "v2_status"])) return false;
  if (!CANONICAL_PROVIDER_EVALUATION_OUTCOMES.includes(outcome.kind as never)) return false;
  if (!["SIMULATED", "CLARIFICATION_REQUIRED", "CANNOT_RECOMMEND"].includes(
    outcome.v2_status as string,
  )) return false;
  const kind = outcome.kind as CanonicalProviderEvaluationOutcome;
  if ((kind === "safe_refusal" || kind === "controlled_failure") && candidateMaterial !== null) {
    return false;
  }
  if (kind !== "safe_refusal" && kind !== "controlled_failure" && candidateMaterial === null) {
    return false;
  }
  if (kind === "candidate_material" && outcome.v2_status !== "SIMULATED") return false;
  if (kind === "clarification_required" && outcome.v2_status !== "CLARIFICATION_REQUIRED") {
    return false;
  }
  if (
    (kind === "safe_refusal" || kind === "controlled_failure") &&
    outcome.v2_status !== "CANNOT_RECOMMEND"
  ) return false;
  return true;
}

function itemTypes(
  candidateIds: string[],
  candidateById: Map<string, CandidateDecisionMaterialItem>,
): Set<DecisionMaterialItemType> {
  return new Set(candidateIds.map((id) => candidateById.get(id)?.item_type).filter(
    (value): value is DecisionMaterialItemType => value !== undefined,
  ));
}

function annotationCompatibilityFailure(
  category: CanonicalProviderEvaluationCategory,
  annotation: CanonicalProviderEvaluationAnnotation,
  outcome: CanonicalProviderEvaluationResultV1["outcome"],
  candidateById: Map<string, CandidateDecisionMaterialItem>,
): CanonicalProviderAnnotationInvalidReason | null {
  if (annotation.evidence_kind === "execution_outcome") {
    if (annotation.candidate_ids.length > 0 || annotation.source_refs.length > 0) {
      return "execution_outcome_references_not_empty";
    }
    if (category === "v2_status") {
      return annotation.concept_id === outcome.v2_status ? null : "v2_status_outcome_mismatch";
    }
    if (category === "scenario" && annotation.concept_id.startsWith("compare_")) {
      return "scenario_compare_requires_candidate_material";
    }
    if (category === "risk" && outcome.kind !== "safe_refusal" && outcome.kind !== "controlled_failure") {
      return "risk_execution_outcome_incompatible";
    }
    return null;
  }

  if (annotation.candidate_ids.length === 0 || annotation.source_refs.length === 0) {
    return "candidate_material_references_empty";
  }
  const types = itemTypes(annotation.candidate_ids, candidateById);
  if (category === "risk") {
    return types.size > 0 && [...types].every((type) => type === "risk_signal")
      ? null
      : "risk_candidate_type_incompatible";
  }
  if (category === "clarification" && annotation.concept_id.startsWith("ask_")) {
    return types.has("clarification_need") ? null : "clarification_candidate_type_missing";
  }
  if (category === "scenario" && annotation.concept_id.startsWith("compare_")) {
    const optionCount = annotation.candidate_ids.filter(
      (id) => candidateById.get(id)?.item_type === "option",
    ).length;
    if (optionCount < 2) return "scenario_compare_option_count_insufficient";
    return types.has("short_term_consequence") || types.has("long_term_consequence")
      ? null
      : "scenario_compare_consequence_missing";
  }
  if (
    category === "scenario" &&
    (annotation.concept_id === "include_information_first_path" ||
      annotation.concept_id === "include_no_action_or_information_first_path")
  ) {
    return types.has("option") || types.has("clarification_need")
      ? null
      : "information_first_grounding_missing";
  }
  if (category === "v2_status") return "v2_status_candidate_material_forbidden";
  return null;
}

function annotationInvalid(
  reason: CanonicalProviderAnnotationInvalidReason,
  category: CanonicalProviderEvaluationCategory | null = null,
  annotation?: Record<string, unknown>,
  candidateById: Map<string, CandidateDecisionMaterialItem> = new Map(),
): CanonicalProviderEvaluationResultValidation {
  const conceptId = category !== null && typeof annotation?.concept_id === "string" &&
      CANONICAL_PROVIDER_EVALUATION_TAXONOMY[category].includes(annotation.concept_id)
    ? annotation.concept_id
    : null;
  const evidenceKind = annotation?.evidence_kind === "candidate_material" ||
      annotation?.evidence_kind === "execution_outcome"
    ? annotation.evidence_kind
    : null;
  const candidateIds = Array.isArray(annotation?.candidate_ids) &&
      annotation.candidate_ids.every((value) => typeof value === "string")
    ? annotation.candidate_ids as string[]
    : null;
  return {
    status: "invalid",
    category: "evaluation_annotation_invalid",
    annotationDiagnostic: {
      reason,
      annotationCategory: category,
      conceptId,
      evidenceKind,
      candidateIdCount: Array.isArray(annotation?.candidate_ids)
        ? annotation.candidate_ids.length
        : null,
      sourceRefCount: Array.isArray(annotation?.source_refs) ? annotation.source_refs.length : null,
      actualCandidateItemTypes: candidateIds === null
        ? []
        : [...itemTypes(candidateIds, candidateById)].sort(),
    },
  };
}

export function validateCanonicalProviderEvaluationResult(
  value: unknown,
  input: CanonicalProviderEvaluationInputV1,
): CanonicalProviderEvaluationResultValidation {
  if (!record(value) || !exactKeys(value, [
    "evaluation_contract_version",
    "candidate_material",
    "evaluation_annotations",
    "outcome",
  ]) || value.evaluation_contract_version !== CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION) {
    return { status: "invalid", category: "evaluation_result_contract_invalid" };
  }
  const candidateMaterialValue = value.candidate_material;
  let candidateMaterial: CandidateDecisionMaterial | null;
  if (candidateMaterialValue === null) {
    candidateMaterial = null;
  } else {
    if (!candidateDecisionMaterialHasValidContract(candidateMaterialValue)) {
      return { status: "invalid", category: "evaluation_result_contract_invalid" };
    }
    const typedCandidateMaterial = candidateMaterialValue as CandidateDecisionMaterial;
    if (!inspectCandidateDecisionMaterialContract(typedCandidateMaterial).safetyValid) {
      return { status: "invalid", category: "evaluation_result_contract_invalid" };
    }
    candidateMaterial = typedCandidateMaterial;
  }
  if (!record(value.outcome) || !outcomeIsValid(value.outcome, candidateMaterial)) {
    return { status: "invalid", category: "evaluation_outcome_invalid" };
  }
  if (!record(value.evaluation_annotations) || !exactKeys(
    value.evaluation_annotations,
    CANONICAL_PROVIDER_EVALUATION_CATEGORIES,
  )) return annotationInvalid("evaluation_annotations_object_invalid");

  const candidateById = new Map(
    (candidateMaterial?.items ?? []).map((item) => [item.candidate_id, item]),
  );
  const allowedSourceRefs = new Set(input.allowed_refs.source_refs);
  for (const category of CANONICAL_PROVIDER_EVALUATION_CATEGORIES) {
    const annotations = value.evaluation_annotations[category];
    if (!Array.isArray(annotations)) {
      return annotationInvalid("annotation_category_not_array", category);
    }
    const conceptIds = new Set<string>();
    for (const annotation of annotations) {
      if (!record(annotation)) return annotationInvalid("annotation_object_invalid", category);
      if (!exactKeys(annotation, [
        "concept_id", "evidence_kind", "candidate_ids", "source_refs",
      ])) return annotationInvalid("annotation_fields_invalid", category, annotation);
      if (typeof annotation.concept_id !== "string" ||
        !CANONICAL_PROVIDER_EVALUATION_TAXONOMY[category].includes(annotation.concept_id)) {
        return annotationInvalid("concept_id_invalid", category, annotation);
      }
      if (annotation.evidence_kind !== "candidate_material" &&
        annotation.evidence_kind !== "execution_outcome") {
        return annotationInvalid("evidence_kind_invalid", category, annotation);
      }
      if (!stringArray(annotation.candidate_ids)) {
        return annotationInvalid("candidate_ids_invalid", category, annotation);
      }
      if (!stringArray(annotation.source_refs)) {
        return annotationInvalid("source_refs_invalid", category, annotation);
      }
      if (!unique(annotation.candidate_ids)) {
        return annotationInvalid("duplicate_candidate_id", category, annotation, candidateById);
      }
      if (!unique(annotation.source_refs)) {
        return annotationInvalid("duplicate_source_ref", category, annotation, candidateById);
      }
      if (conceptIds.has(annotation.concept_id)) {
        return annotationInvalid("duplicate_concept_id", category, annotation, candidateById);
      }
      conceptIds.add(annotation.concept_id);
      if (
        !annotation.candidate_ids.every((id) => candidateById.has(id)) ||
        !annotation.source_refs.every((ref) => allowedSourceRefs.has(ref))
      ) return { status: "invalid", category: "evaluation_annotation_grounding_invalid" };
      const typedAnnotation = annotation as CanonicalProviderEvaluationAnnotation;
      if (typedAnnotation.evidence_kind === "candidate_material") {
        const candidateSourceRefs = new Set(
          typedAnnotation.candidate_ids.map((id) => candidateById.get(id)?.provenance.source_ref),
        );
        if (!typedAnnotation.source_refs.every((ref) => candidateSourceRefs.has(ref))) {
          return { status: "invalid", category: "evaluation_annotation_grounding_invalid" };
        }
      }
      const compatibilityFailure = annotationCompatibilityFailure(
        category,
        typedAnnotation,
        value.outcome,
        candidateById,
      );
      if (compatibilityFailure !== null) {
        return annotationInvalid(compatibilityFailure, category, annotation, candidateById);
      }
    }
  }

  return { status: "valid", result: value as CanonicalProviderEvaluationResultV1 };
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

export function matchCanonicalProviderEvaluationOracle(
  result: CanonicalProviderEvaluationResultV1,
  oracle: CanonicalProviderEvaluationOracle,
): CanonicalProviderEvaluationOracleMatch {
  const expectedByCategory = canonicalOracleConceptsByCategory(oracle);
  const categories = Object.fromEntries(
    CANONICAL_PROVIDER_EVALUATION_CATEGORIES.map((category) => {
      const expected = sorted(expectedByCategory[category]);
      const actual = sorted(
        result.evaluation_annotations[category].map((item) => item.concept_id),
      );
      const expectedSet = new Set(expected);
      const actualSet = new Set(actual);
      const v2Allowed = category === "v2_status" &&
        actual.length === 1 && expectedSet.has(actual[0]) &&
        actual[0] === result.outcome.v2_status;
      const missing = category === "v2_status" && v2Allowed
        ? []
        : expected.filter((id) => !actualSet.has(id));
      const unexpected = category === "v2_status" && v2Allowed
        ? []
        : actual.filter((id) => !expectedSet.has(id));
      const passed = category === "v2_status"
        ? v2Allowed
        : missing.length === 0 && unexpected.length === 0;
      return [category, { passed, expected, actual, missing, unexpected }];
    }),
  ) as CanonicalProviderEvaluationOracleMatch["categories"];
  return {
    passed: CANONICAL_PROVIDER_EVALUATION_CATEGORIES.every(
      (category) => categories[category].passed,
    ),
    categories,
  };
}
