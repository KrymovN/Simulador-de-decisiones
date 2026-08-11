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

export const CANONICAL_PROVIDER_PRE_MATCHER_DIAGNOSTIC_MAX_ISSUES = 8 as const;

export const CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS = {
  sourceRefAllowed: {
    code: "source_ref_not_allowed",
    expectedConstraint: "provenance.source_ref must exactly equal a member of input.allowed_refs.source_refs",
    providerInstruction: "For every candidate_material item, provenance.source_ref MUST exactly equal one member of input.allowed_refs.source_refs.",
  },
  optionRefsEmpty: {
    code: "option_refs_must_be_empty",
    expectedConstraint: "option_refs must be an empty array in canonical evaluation",
    providerInstruction: "For every candidate_material item, option_refs MUST be an empty array for canonical evaluation.",
  },
  scenarioRefsEmpty: {
    code: "scenario_refs_must_be_empty",
    expectedConstraint: "scenario_refs must be an empty array in canonical evaluation",
    providerInstruction: "For every candidate_material item, scenario_refs MUST be an empty array for canonical evaluation.",
  },
  criterionRefsEmpty: {
    code: "criterion_refs_must_be_empty",
    expectedConstraint: "criterion_refs must be an empty array in canonical evaluation",
    providerInstruction: "For every candidate_material item, criterion_refs MUST be an empty array for canonical evaluation.",
  },
  providerInferenceSource: {
    code: "provider_inference_source_ref_mismatch",
    expectedConstraint: "evidence=provider_inference requires provenance.source_ref=provider_inference",
    providerInstruction: "If a candidate_material item has evidence=provider_inference, its provenance.source_ref MUST be exactly provider_inference.",
  },
  unknownSource: {
    code: "unknown_source_ref_mismatch",
    expectedConstraint: "evidence=unknown requires source_ref=unknown or an input critical/important gap source_ref",
    providerInstruction: "If a candidate_material item has evidence=unknown, its provenance.source_ref MUST be exactly unknown or the source_ref of an input critical_gaps or important_gaps entry.",
  },
} as const;

export const CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS = {
  candidateExists: {
    code: "annotation_candidate_id_not_found",
    expectedConstraint: "candidate_ids must exactly reference existing candidate_material.items candidate_id values",
    providerInstruction: "Every evaluation annotation candidate_ids value MUST exactly equal an existing candidate_material.items candidate_id.",
  },
  sourceAllowed: {
    code: "annotation_source_ref_not_allowed",
    expectedConstraint: "source_refs must exactly equal members of input.allowed_refs.source_refs",
    providerInstruction: "Every evaluation annotation source_refs value MUST exactly equal a member of input.allowed_refs.source_refs.",
  },
  sourceMatchesCandidateProvenance: {
    code: "annotation_source_ref_not_in_selected_candidate_provenance",
    expectedConstraint: "candidate_material annotation source_refs must come from provenance.source_ref of the candidates selected by candidate_ids",
    providerInstruction: "For evidence_kind=candidate_material, every annotation source_refs value MUST also equal provenance.source_ref of at least one candidate item selected by that annotation candidate_ids array.",
  },
} as const;

export const CANONICAL_PROVIDER_RESULT_REFINEMENT_INSTRUCTIONS = [
  "Every candidate_id MUST be unique across candidate_material.items.",
  "Every reference identifier within any candidate reference array MUST be unique; canonical evaluation candidate option_refs, scenario_refs, and criterion_refs are additionally required to be empty.",
  "Candidate content MUST contain non-whitespace text and MUST NOT contain personal data, prompt-injection instructions, secrets or hidden reasoning, direct recommendations, imperative advice, or unsupported certainty.",
  "outcome.kind=candidate_material requires non-null candidate_material and outcome.v2_status=SIMULATED.",
  "outcome.kind=clarification_required requires non-null candidate_material and outcome.v2_status=CLARIFICATION_REQUIRED.",
  "outcome.kind=safe_refusal or controlled_failure requires candidate_material=null and outcome.v2_status=CANNOT_RECOMMEND.",
  "outcome.kind=recommendation_withheld requires non-null candidate_material.",
] as const;

export const CANONICAL_PROVIDER_EFFECTIVE_CONTRACT_INSTRUCTIONS = [
  ...Object.values(CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS).map(
    (invariant) => invariant.providerInstruction,
  ),
  ...Object.values(CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS).map(
    (invariant) => invariant.providerInstruction,
  ),
  ...CANONICAL_PROVIDER_RESULT_REFINEMENT_INSTRUCTIONS,
] as const;

export type CanonicalProviderPreMatcherIssue = {
  stage: "evaluation_result_contract" | "evaluation_outcome" |
    "candidate_grounding" | "annotation_grounding";
  code: string;
  path: string;
  candidateIndex: number | null;
  annotationCategory: CanonicalProviderEvaluationCategory | null;
  annotationIndex: number | null;
  candidateId: string | null;
  sourceRef: string | null;
  receivedIdentifier: string | null;
  receivedCount: number | null;
  receivedLength: number | null;
  expectedConstraint: string;
};

export type CanonicalProviderPreMatcherDiagnostic = {
  issues: CanonicalProviderPreMatcherIssue[];
  truncated: boolean;
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
      preMatcherDiagnostic?: CanonicalProviderPreMatcherDiagnostic;
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

function canonicalEvaluationCandidateSchema(): Record<string, unknown> {
  const schema = structuredClone(CANDIDATE_DECISION_MATERIAL_OUTPUT_SCHEMA) as {
    properties: {
      items: {
        description?: string;
        items: {
          properties: Record<string, Record<string, unknown>>;
        };
      };
    };
  };
  const items = schema.properties.items;
  const properties = items.items.properties;
  items.description = "candidate_id values must be unique across candidate_material.items.";
  properties.candidate_id = {
    ...properties.candidate_id,
    description: "Unique across all candidate_material.items.",
  };
  properties.content = {
    ...properties.content,
    description: "Non-whitespace candidate content that satisfies the evaluation safety instructions.",
  };
  properties.provenance = {
    ...properties.provenance,
    description: CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.sourceRefAllowed.providerInstruction,
  };
  properties.evidence = {
    ...properties.evidence,
    description: [
      CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.providerInferenceSource.providerInstruction,
      CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.unknownSource.providerInstruction,
    ].join(" "),
  };
  for (const [field, invariant] of [
    ["option_refs", CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.optionRefsEmpty],
    ["scenario_refs", CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.scenarioRefsEmpty],
    ["criterion_refs", CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.criterionRefsEmpty],
  ] as const) {
    properties[field] = {
      ...properties[field],
      maxItems: 0,
      description: invariant.providerInstruction,
    };
  }
  return schema as unknown as Record<string, unknown>;
}

const CANONICAL_EVALUATION_CANDIDATE_SCHEMA = canonicalEvaluationCandidateSchema();

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
        description: `Unique existing candidate IDs only; no duplicate value is allowed. ${CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS.candidateExists.providerInstruction}`,
        maxItems: 24,
        items: { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$" },
      },
      source_refs: {
        type: "array",
        description: `Unique allowed source references only; no duplicate value is allowed. ${CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS.sourceAllowed.providerInstruction} ${CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS.sourceMatchesCandidateProvenance.providerInstruction}`,
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
      anyOf: [CANONICAL_EVALUATION_CANDIDATE_SCHEMA, { type: "null" }],
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
      description: CANONICAL_PROVIDER_RESULT_REFINEMENT_INSTRUCTIONS.slice(3).join(" "),
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

function boundedIdentifier(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(value)
    ? value
    : null;
}

function issue(
  stage: CanonicalProviderPreMatcherIssue["stage"],
  code: string,
  path: string,
  expectedConstraint: string,
  details: Partial<Omit<
    CanonicalProviderPreMatcherIssue,
    "stage" | "code" | "path" | "expectedConstraint"
  >> = {},
): CanonicalProviderPreMatcherIssue {
  return {
    stage,
    code,
    path,
    candidateIndex: details.candidateIndex ?? null,
    annotationCategory: details.annotationCategory ?? null,
    annotationIndex: details.annotationIndex ?? null,
    candidateId: boundedIdentifier(details.candidateId),
    sourceRef: boundedIdentifier(details.sourceRef),
    receivedIdentifier: boundedIdentifier(details.receivedIdentifier),
    receivedCount: details.receivedCount ?? null,
    receivedLength: details.receivedLength ?? null,
    expectedConstraint,
  };
}

function singleIssueDiagnostic(
  validationIssue: CanonicalProviderPreMatcherIssue,
): CanonicalProviderPreMatcherDiagnostic {
  return { issues: [validationIssue], truncated: false };
}

export function inspectCanonicalProviderCandidateGrounding(
  material: CandidateDecisionMaterial,
  input: CanonicalProviderEvaluationInputV1,
): { valid: boolean; diagnostic: CanonicalProviderPreMatcherDiagnostic | null } {
  const issues: CanonicalProviderPreMatcherIssue[] = [];
  let truncated = false;
  const append = (validationIssue: CanonicalProviderPreMatcherIssue) => {
    if (issues.length < CANONICAL_PROVIDER_PRE_MATCHER_DIAGNOSTIC_MAX_ISSUES) {
      issues.push(validationIssue);
    } else {
      truncated = true;
    }
  };
  const sourceRefs = new Set(input.allowed_refs.source_refs);
  const gapRefs = new Set([
    ...input.input.critical_gaps.map((item) => item.source_ref),
    ...input.input.important_gaps.map((item) => item.source_ref),
  ]);
  material.items.forEach((item, candidateIndex) => {
    const base = `candidate_material.items[${candidateIndex}]`;
    const common = { candidateIndex, candidateId: item.candidate_id };
    if (!sourceRefs.has(item.provenance.source_ref)) {
      const invariant = CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.sourceRefAllowed;
      append(issue("candidate_grounding", invariant.code, `${base}.provenance.source_ref`,
        invariant.expectedConstraint, {
          ...common,
          sourceRef: item.provenance.source_ref,
          receivedIdentifier: item.provenance.source_ref,
        }));
    }
    for (const [field, values, invariant] of [
      ["option_refs", item.option_refs,
        CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.optionRefsEmpty],
      ["scenario_refs", item.scenario_refs,
        CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.scenarioRefsEmpty],
      ["criterion_refs", item.criterion_refs,
        CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.criterionRefsEmpty],
    ] as const) {
      if (values.length > 0) {
        append(issue("candidate_grounding", invariant.code, `${base}.${field}`,
          invariant.expectedConstraint, { ...common, receivedCount: values.length }));
      }
    }
    if (item.evidence === "provider_inference" &&
      item.provenance.source_ref !== "provider_inference") {
      const invariant = CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.providerInferenceSource;
      append(issue("candidate_grounding", invariant.code, `${base}.provenance.source_ref`,
        invariant.expectedConstraint, {
          ...common,
          sourceRef: item.provenance.source_ref,
          receivedIdentifier: item.provenance.source_ref,
        }));
    }
    if (item.evidence === "unknown" && item.provenance.source_ref !== "unknown" &&
      !gapRefs.has(item.provenance.source_ref)) {
      const invariant = CANONICAL_PROVIDER_CANDIDATE_GROUNDING_INVARIANTS.unknownSource;
      append(issue("candidate_grounding", invariant.code, `${base}.provenance.source_ref`,
        invariant.expectedConstraint, {
          ...common,
          sourceRef: item.provenance.source_ref,
          receivedIdentifier: item.provenance.source_ref,
        }));
    }
  });
  return issues.length === 0
    ? { valid: true, diagnostic: null }
    : { valid: false, diagnostic: { issues, truncated } };
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

const CANDIDATE_MATERIAL_KEYS = [
  "capability", "contract_version", "generation_status", "classification", "items",
] as const;
const CANDIDATE_ITEM_KEYS = [
  "candidate_id", "item_type", "content", "provenance", "confidence", "evidence",
  "option_refs", "scenario_refs", "criterion_refs", "authority", "capability",
  "contract_version",
] as const;

function candidateContractDiagnostic(
  value: unknown,
): CanonicalProviderPreMatcherDiagnostic {
  if (!record(value)) {
    return singleIssueDiagnostic(issue(
      "evaluation_result_contract", "candidate_material_not_object",
      "candidate_material", "candidate_material must be an object or null",
    ));
  }
  if (!exactKeys(value, CANDIDATE_MATERIAL_KEYS)) {
    return singleIssueDiagnostic(issue(
      "evaluation_result_contract", "candidate_material_fields_invalid",
      "candidate_material", "candidate_material must contain exactly its canonical fields",
      { receivedCount: Object.keys(value).length },
    ));
  }
  if (!Array.isArray(value.items)) {
    return singleIssueDiagnostic(issue(
      "evaluation_result_contract", "candidate_items_not_array",
      "candidate_material.items", "candidate_material.items must be an array",
    ));
  }
  if (value.items.length > 64) {
    return singleIssueDiagnostic(issue(
      "evaluation_result_contract", "candidate_item_count_exceeded",
      "candidate_material.items", "candidate material must contain at most 64 items",
      { receivedCount: value.items.length },
    ));
  }
  const candidateIds = new Set<string>();
  for (let candidateIndex = 0; candidateIndex < value.items.length; candidateIndex += 1) {
    const candidate = value.items[candidateIndex];
    const base = `candidate_material.items[${candidateIndex}]`;
    if (!record(candidate)) {
      return singleIssueDiagnostic(issue(
        "evaluation_result_contract", "candidate_item_not_object", base,
        "candidate item must be an object", { candidateIndex },
      ));
    }
    const candidateId = boundedIdentifier(candidate.candidate_id);
    if (!exactKeys(candidate, CANDIDATE_ITEM_KEYS)) {
      return singleIssueDiagnostic(issue(
        "evaluation_result_contract", "candidate_item_fields_invalid", base,
        "candidate item must contain exactly its canonical fields",
        { candidateIndex, candidateId, receivedCount: Object.keys(candidate).length },
      ));
    }
    if (candidateId === null) {
      return singleIssueDiagnostic(issue(
        "evaluation_result_contract", "candidate_id_invalid", `${base}.candidate_id`,
        "candidate_id must be a bounded canonical identifier", { candidateIndex },
      ));
    }
    if (candidateIds.has(candidateId)) {
      return singleIssueDiagnostic(issue(
        "evaluation_result_contract", "duplicate_candidate_id", `${base}.candidate_id`,
        "candidate_id must be unique across candidate_material.items",
        { candidateIndex, candidateId, receivedIdentifier: candidateId },
      ));
    }
    candidateIds.add(candidateId);
    if (typeof candidate.content !== "string") {
      return singleIssueDiagnostic(issue(
        "evaluation_result_contract", "candidate_content_not_string", `${base}.content`,
        "candidate content must be a string", { candidateIndex, candidateId },
      ));
    }
    if (candidate.content.trim().length === 0) {
      return singleIssueDiagnostic(issue(
        "evaluation_result_contract", "candidate_content_whitespace_only", `${base}.content`,
        "candidate content must contain non-whitespace text", {
          candidateIndex,
          candidateId,
          receivedLength: candidate.content.length,
        },
      ));
    }
    if (candidate.content.length > 600) {
      return singleIssueDiagnostic(issue(
        "evaluation_result_contract", "candidate_content_too_long", `${base}.content`,
        "candidate content length must not exceed 600", {
          candidateIndex,
          candidateId,
          receivedLength: candidate.content.length,
        },
      ));
    }
    for (const field of ["option_refs", "scenario_refs", "criterion_refs"] as const) {
      const references = candidate[field];
      if (Array.isArray(references) && references.every((reference) => typeof reference === "string") &&
        new Set(references).size !== references.length) {
        const duplicate = references.find((reference, index) => references.indexOf(reference) !== index);
        return singleIssueDiagnostic(issue(
          "evaluation_result_contract", "duplicate_reference_identifier", `${base}.${field}`,
          "reference identifiers must be unique within each reference array", {
            candidateIndex,
            candidateId,
            receivedIdentifier: duplicate,
            receivedCount: references.length,
          },
        ));
      }
    }
  }
  const inspection = inspectCandidateDecisionMaterialContract(value);
  if (inspection.schemaValid && !inspection.safetyValid) {
    for (let candidateIndex = 0; candidateIndex < value.items.length; candidateIndex += 1) {
      const candidate = value.items[candidateIndex];
      if (!record(candidate)) continue;
      const singleCandidateInspection = inspectCandidateDecisionMaterialContract({
        ...value,
        items: [candidate],
      });
      if (singleCandidateInspection.schemaValid && !singleCandidateInspection.safetyValid) {
        const content = typeof candidate.content === "string" ? candidate.content : "";
        return singleIssueDiagnostic(issue(
          "evaluation_result_contract",
          singleCandidateInspection.issue ?? "candidate_safety_rule_violation",
          `candidate_material.items[${candidateIndex}].content`,
          "candidate content must satisfy the provider-visible evaluation safety rules",
          {
            candidateIndex,
            candidateId: boundedIdentifier(candidate.candidate_id),
            receivedLength: content.length,
          },
        ));
      }
    }
  }
  return singleIssueDiagnostic(issue(
    "evaluation_result_contract",
    inspection.issue ?? "candidate_contract_invalid",
    "candidate_material",
    "candidate_material must satisfy the canonical candidate contract",
  ));
}

function evaluationResultContractDiagnostic(
  value: unknown,
): CanonicalProviderPreMatcherDiagnostic {
  if (!record(value)) {
    return singleIssueDiagnostic(issue(
      "evaluation_result_contract", "evaluation_result_not_object", "$",
      "evaluation result must be an object",
    ));
  }
  const expectedKeys = [
    "evaluation_contract_version", "candidate_material", "evaluation_annotations", "outcome",
  ] as const;
  if (!exactKeys(value, expectedKeys)) {
    return singleIssueDiagnostic(issue(
      "evaluation_result_contract", "evaluation_result_fields_invalid", "$",
      "evaluation result must contain exactly its four canonical fields",
      { receivedCount: Object.keys(value).length },
    ));
  }
  if (value.evaluation_contract_version !== CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION) {
    return singleIssueDiagnostic(issue(
      "evaluation_result_contract", "evaluation_contract_version_mismatch",
      "evaluation_contract_version", `must equal ${CANONICAL_PROVIDER_EVALUATION_RESULT_VERSION}`,
      { receivedIdentifier: value.evaluation_contract_version as string },
    ));
  }
  return candidateContractDiagnostic(value.candidate_material);
}

function outcomeDiagnostic(
  outcome: unknown,
  candidateMaterial: CandidateDecisionMaterial | null,
): CanonicalProviderPreMatcherDiagnostic {
  const kind = record(outcome) && typeof outcome.kind === "string" ? outcome.kind : null;
  const v2Status = record(outcome) && typeof outcome.v2_status === "string"
    ? outcome.v2_status
    : null;
  let code = "evaluation_outcome_invalid";
  let path = "outcome";
  let expectedConstraint = "outcome must satisfy its canonical cross-field relationship";
  if ((kind === "safe_refusal" || kind === "controlled_failure") && candidateMaterial !== null) {
    code = "failure_outcome_requires_null_candidate_material";
    path = "candidate_material";
    expectedConstraint = `${kind} requires candidate_material=null`;
  } else if (kind !== "safe_refusal" && kind !== "controlled_failure" &&
    candidateMaterial === null) {
    code = "non_failure_outcome_requires_candidate_material";
    path = "candidate_material";
    expectedConstraint = `${kind ?? "non-failure outcome"} requires non-null candidate_material`;
  } else if (kind === "candidate_material" && v2Status !== "SIMULATED") {
    code = "candidate_material_v2_status_mismatch";
    path = "outcome.v2_status";
    expectedConstraint = "candidate_material requires v2_status=SIMULATED";
  } else if (kind === "clarification_required" && v2Status !== "CLARIFICATION_REQUIRED") {
    code = "clarification_v2_status_mismatch";
    path = "outcome.v2_status";
    expectedConstraint = "clarification_required requires v2_status=CLARIFICATION_REQUIRED";
  } else if ((kind === "safe_refusal" || kind === "controlled_failure") &&
    v2Status !== "CANNOT_RECOMMEND") {
    code = "failure_v2_status_mismatch";
    path = "outcome.v2_status";
    expectedConstraint = `${kind} requires v2_status=CANNOT_RECOMMEND`;
  }
  return singleIssueDiagnostic(issue(
    "evaluation_outcome", code, path, expectedConstraint,
    { receivedIdentifier: path === "outcome.v2_status" ? v2Status : kind },
  ));
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
    return {
      status: "invalid",
      category: "evaluation_result_contract_invalid",
      preMatcherDiagnostic: evaluationResultContractDiagnostic(value),
    };
  }
  const candidateMaterialValue = value.candidate_material;
  let candidateMaterial: CandidateDecisionMaterial | null;
  if (candidateMaterialValue === null) {
    candidateMaterial = null;
  } else {
    if (!candidateDecisionMaterialHasValidContract(candidateMaterialValue)) {
      return {
        status: "invalid",
        category: "evaluation_result_contract_invalid",
        preMatcherDiagnostic: candidateContractDiagnostic(candidateMaterialValue),
      };
    }
    const typedCandidateMaterial = candidateMaterialValue as CandidateDecisionMaterial;
    if (!inspectCandidateDecisionMaterialContract(typedCandidateMaterial).safetyValid) {
      return {
        status: "invalid",
        category: "evaluation_result_contract_invalid",
        preMatcherDiagnostic: candidateContractDiagnostic(candidateMaterialValue),
      };
    }
    candidateMaterial = typedCandidateMaterial;
  }
  if (!record(value.outcome) || !outcomeIsValid(value.outcome, candidateMaterial)) {
    return {
      status: "invalid",
      category: "evaluation_outcome_invalid",
      preMatcherDiagnostic: outcomeDiagnostic(value.outcome, candidateMaterial),
    };
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
    for (let annotationIndex = 0; annotationIndex < annotations.length; annotationIndex += 1) {
      const annotation = annotations[annotationIndex];
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
      const missingCandidateId = annotation.candidate_ids.find((id) => !candidateById.has(id));
      if (missingCandidateId !== undefined) {
        const invariant = CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS.candidateExists;
        return {
          status: "invalid",
          category: "evaluation_annotation_grounding_invalid",
          preMatcherDiagnostic: singleIssueDiagnostic(issue(
            "annotation_grounding", invariant.code,
            `evaluation_annotations.${category}[${annotationIndex}].candidate_ids`,
            invariant.expectedConstraint,
            {
              annotationCategory: category,
              annotationIndex,
              candidateId: missingCandidateId,
              receivedIdentifier: missingCandidateId,
            },
          )),
        };
      }
      const disallowedSourceRef = annotation.source_refs.find(
        (ref) => !allowedSourceRefs.has(ref),
      );
      if (disallowedSourceRef !== undefined) {
        const invariant = CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS.sourceAllowed;
        return {
          status: "invalid",
          category: "evaluation_annotation_grounding_invalid",
          preMatcherDiagnostic: singleIssueDiagnostic(issue(
            "annotation_grounding", invariant.code,
            `evaluation_annotations.${category}[${annotationIndex}].source_refs`,
            invariant.expectedConstraint,
            {
              annotationCategory: category,
              annotationIndex,
              sourceRef: disallowedSourceRef,
              receivedIdentifier: disallowedSourceRef,
            },
          )),
        };
      }
      const typedAnnotation = annotation as CanonicalProviderEvaluationAnnotation;
      if (typedAnnotation.evidence_kind === "candidate_material") {
        const candidateSourceRefs = new Set(
          typedAnnotation.candidate_ids.map((id) => candidateById.get(id)?.provenance.source_ref),
        );
        const unmatchedSourceRef = typedAnnotation.source_refs.find(
          (ref) => !candidateSourceRefs.has(ref),
        );
        if (unmatchedSourceRef !== undefined) {
          const invariant = CANONICAL_PROVIDER_ANNOTATION_GROUNDING_INVARIANTS
            .sourceMatchesCandidateProvenance;
          return {
            status: "invalid",
            category: "evaluation_annotation_grounding_invalid",
            preMatcherDiagnostic: singleIssueDiagnostic(issue(
              "annotation_grounding", invariant.code,
              `evaluation_annotations.${category}[${annotationIndex}].source_refs`,
              invariant.expectedConstraint,
              {
                annotationCategory: category,
                annotationIndex,
                sourceRef: unmatchedSourceRef,
                receivedIdentifier: unmatchedSourceRef,
                receivedCount: typedAnnotation.candidate_ids.length,
              },
            )),
          };
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
