import "server-only";

export const CANDIDATE_DECISION_MATERIAL_CAPABILITY =
  "candidate_decision_material_v1" as const;

export const CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION = "1.0" as const;

export const CANDIDATE_DECISION_MATERIAL_MODE =
  "internal_provider_neutral_foundation_only" as const;

export const DECISION_MATERIAL_ITEM_TYPES = [
  "context_factor",
  "user_goal",
  "decision_criterion",
  "option",
  "benefit_or_opportunity",
  "risk_signal",
  "dependency",
  "assumption",
  "unknown",
  "contradiction",
  "short_term_consequence",
  "long_term_consequence",
  "reversibility",
  "decision_trigger",
  "clarification_need",
] as const;

export type DecisionMaterialItemType =
  (typeof DECISION_MATERIAL_ITEM_TYPES)[number];

export type CandidateConfidence = "low" | "medium" | "high" | "unknown";

export type CandidateEvidenceClassification =
  | "user_fact_reference"
  | "user_assumption_reference"
  | "provider_inference"
  | "unknown";

export type CandidateDecisionMaterialItem = {
  candidate_id: string;
  item_type: DecisionMaterialItemType;
  content: string;
  provenance: {
    source: "provider_candidate";
    source_ref: string;
  };
  confidence: CandidateConfidence;
  evidence: CandidateEvidenceClassification;
  option_refs: string[];
  scenario_refs: string[];
  criterion_refs: string[];
  authority: "candidate_only";
  capability: typeof CANDIDATE_DECISION_MATERIAL_CAPABILITY;
  contract_version: typeof CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION;
};

export type CandidateDecisionMaterial = {
  capability: typeof CANDIDATE_DECISION_MATERIAL_CAPABILITY;
  contract_version: typeof CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION;
  generation_status: "completed";
  classification: "synthetic_non_personal";
  items: CandidateDecisionMaterialItem[];
};

export const SEMANTIC_PRESERVATION_DISPOSITIONS = [
  "accepted",
  "accepted_with_normalization",
  "merged_as_duplicate",
  "rejected_invalid",
  "rejected_unsafe",
  "rejected_privacy",
  "rejected_irrelevant",
  "rejected_unsupported_authority",
  "controlled_failure",
] as const;

export type SemanticPreservationDisposition =
  (typeof SEMANTIC_PRESERVATION_DISPOSITIONS)[number];

export type SemanticPreservationReason =
  | "accepted_valid"
  | "normalized_whitespace"
  | "duplicate_semantic_content"
  | "schema_invalid"
  | "capability_version_invalid"
  | "unknown_field"
  | "item_type_invalid"
  | "missing_provenance"
  | "evidence_classification_invalid"
  | "authority_classification_invalid"
  | "direct_recommendation_forbidden"
  | "unsupported_certainty_forbidden"
  | "imperative_instruction_forbidden"
  | "prompt_injection_content"
  | "raw_reasoning_or_secret"
  | "personal_data_detected"
  | "deterministic_context_contradiction"
  | "deterministically_irrelevant"
  | "invalid_reference"
  | "excessive_length"
  | "excessive_item_count"
  | "critical_contract_failure";

export type DownstreamMappingStatus = {
  status: "mapped" | "not_mapped";
  target_refs: string[];
  reason?: "no_known_mapping" | "rejected_before_mapping";
};

export type SemanticPreservationLedgerEntry = {
  candidate_id: string;
  original_item_type: DecisionMaterialItemType | "unknown";
  disposition: SemanticPreservationDisposition;
  reason: SemanticPreservationReason;
  normalized_or_merged_item_id?: string;
  downstream_mapping: DownstreamMappingStatus;
  traceability_marker: string;
};

export type DecisionMaterialAcceptanceContext = {
  allowed_option_refs: string[];
  allowed_scenario_refs: string[];
  allowed_criterion_refs: string[];
  contradictory_candidate_ids: string[];
  irrelevant_candidate_ids: string[];
};

export type AcceptedDecisionMaterial = {
  capability: typeof CANDIDATE_DECISION_MATERIAL_CAPABILITY;
  contract_version: typeof CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION;
  mode: typeof CANDIDATE_DECISION_MATERIAL_MODE;
  items: CandidateDecisionMaterialItem[];
};

export type DecisionMaterialAcceptanceResult = {
  status: "accepted" | "controlled_failure";
  accepted_material: AcceptedDecisionMaterial;
  ledger: SemanticPreservationLedgerEntry[];
  warnings: SemanticPreservationReason[];
  observed_candidate_count: number;
  silent_drop_count: 0;
  raw_provider_material_persisted: false;
};

export const VALUE_ADD_TRANSFORMATIONS = [
  "scenario_mapping",
  "criterion_mapping",
  "epistemic_classification",
  "dependency_identification",
  "decision_trigger_identification",
  "consequence_horizon_classification",
  "reversibility_classification",
  "clarification_identification",
  "traceability",
] as const;

export type ValueAddTransformation =
  (typeof VALUE_ADD_TRANSFORMATIONS)[number];

export type DecisionCompositionEvidenceItem = {
  composition_item_id: string;
  source_candidate_ids: string[];
  transformations: ValueAddTransformation[];
  authority: "decision_engine";
};

export type DecisionCompositionEvidence = {
  items: DecisionCompositionEvidenceItem[];
  contains_raw_provider_answer: false;
  personal_data_scope_opened: false;
};
