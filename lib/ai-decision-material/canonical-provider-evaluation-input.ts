import "server-only";

import {
  OFFLINE_DATASET_COMPLETENESS_STATES,
  OFFLINE_DATASET_DOMAINS,
  OFFLINE_DATASET_LANGUAGES,
  type CanonicalOfflineEvaluationCase,
} from "./fixtures";
import {
  CANDIDATE_DECISION_MATERIAL_CAPABILITY,
  CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
} from "./contracts";

export const CANONICAL_PROVIDER_EVALUATION_INPUT_VERSION =
  "canonical-provider-evaluation-input.1" as const;

const CASE_KEYS = [
  "case_id", "case_version", "language", "domain", "decision_type",
  "user_situation", "user_intent", "completeness_level", "known_facts",
  "known_assumptions", "critical_gaps", "important_gaps",
  "expected_clarification_behavior", "expected_scenario_behavior",
  "expected_risk_behavior", "expected_recommendation_behavior",
  "safety_expectations", "privacy_expectations", "failure_expectations",
  "expected_v2_statuses", "traceability_expectations", "cost_profile",
  "review_rubric", "dataset_split", "provenance", "review_status",
  "coverage_flags",
] as const;

const DECISION_TYPES = [
  "binary", "comparative", "timing", "resource_allocation",
  "strategic_direction", "risk_response", "interpersonal", "exploratory",
] as const;

const ORACLE_KEYS = [
  "expected_clarification_behavior", "expected_scenario_behavior",
  "expected_risk_behavior", "expected_recommendation_behavior",
  "safety_expectations", "privacy_expectations", "failure_expectations",
  "expected_v2_statuses", "traceability_expectations", "cost_profile",
  "review_rubric", "dataset_split", "provenance", "review_status",
  "coverage_flags",
] as const;

export const CANONICAL_PROVIDER_EVALUATION_ORACLE_KEYS = ORACLE_KEYS;

export type CanonicalProviderEvaluationInputV1 = {
  boundary_version: typeof CANONICAL_PROVIDER_EVALUATION_INPUT_VERSION;
  capability: typeof CANDIDATE_DECISION_MATERIAL_CAPABILITY;
  contract_version: typeof CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION;
  classification: "synthetic_non_personal";
  trace: { source_case_id: string };
  language: CanonicalOfflineEvaluationCase["language"];
  domain: CanonicalOfflineEvaluationCase["domain"];
  decision_type: CanonicalOfflineEvaluationCase["decision_type"];
  completeness_level: CanonicalOfflineEvaluationCase["completeness_level"];
  input: {
    user_situation: string;
    user_intent: string;
    known_facts: Array<{ source_ref: string; content: string }>;
    known_assumptions: Array<{ source_ref: string; content: string }>;
    critical_gaps: Array<{ source_ref: string; content: string }>;
    important_gaps: Array<{ source_ref: string; content: string }>;
  };
  allowed_refs: {
    source_refs: string[];
    option_refs: [];
    scenario_refs: [];
    criterion_refs: [];
  };
};

export type CanonicalProviderEvaluationOracle = Pick<
  CanonicalOfflineEvaluationCase,
  (typeof ORACLE_KEYS)[number]
>;

export type CanonicalProviderEvaluationCompilationResult =
  | { status: "ready"; input: CanonicalProviderEvaluationInputV1 }
  | { status: "blocked"; category: "canonical_case_invalid" };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonEmptyString);
}

function canonicalCase(value: unknown): value is CanonicalOfflineEvaluationCase {
  if (!record(value) || !exactKeys(value, CASE_KEYS)) return false;
  if (!nonEmptyString(value.case_id) || !/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(value.case_id)) return false;
  if (value.case_version !== "1.0" && value.case_version !== "1.1") return false;
  if (!OFFLINE_DATASET_LANGUAGES.includes(value.language as never)) return false;
  if (!OFFLINE_DATASET_DOMAINS.includes(value.domain as never)) return false;
  if (!DECISION_TYPES.includes(value.decision_type as never)) return false;
  if (!OFFLINE_DATASET_COMPLETENESS_STATES.includes(value.completeness_level as never)) return false;
  if (!nonEmptyString(value.user_situation) || !nonEmptyString(value.user_intent)) return false;
  const arrayKeys = [
    "known_facts", "known_assumptions", "critical_gaps", "important_gaps",
    "expected_clarification_behavior", "expected_scenario_behavior",
    "expected_risk_behavior", "expected_recommendation_behavior",
    "safety_expectations", "privacy_expectations", "failure_expectations",
    "expected_v2_statuses", "traceability_expectations", "review_rubric",
  ] as const;
  if (!arrayKeys.every((key) => stringArray(value[key]))) return false;
  if (!record(value.cost_profile) || !exactKeys(value.cost_profile, ["profile", "max_relative_units"])) return false;
  if (!record(value.provenance) || !exactKeys(value.provenance, ["kind", "semantic_cluster_id"])) return false;
  if (!record(value.coverage_flags) || !exactKeys(value.coverage_flags, [
    "high_risk_or_safety_sensitive", "privacy_boundary",
    "controlled_failure_or_malformed_output", "cost_profile",
  ])) return false;
  return (value.cost_profile.profile === "bounded_low" || value.cost_profile.profile === "standard") &&
    Number.isFinite(value.cost_profile.max_relative_units) &&
    value.provenance.kind === "purpose_written_synthetic" &&
    nonEmptyString(value.provenance.semantic_cluster_id) &&
    (value.dataset_split === "core_release" || value.dataset_split === "challenge" ||
      value.dataset_split === "safety_privacy" || value.dataset_split === "regression") &&
    value.review_status === "pending_human_review" &&
    typeof value.coverage_flags.high_risk_or_safety_sensitive === "boolean" &&
    typeof value.coverage_flags.privacy_boundary === "boolean" &&
    typeof value.coverage_flags.controlled_failure_or_malformed_output === "boolean" &&
    value.coverage_flags.cost_profile === true;
}

function referenced(values: string[], prefix: string) {
  return values.map((content, index) => ({ source_ref: `${prefix}_${index + 1}`, content }));
}

export function compileCanonicalProviderEvaluationInput(
  value: unknown,
): CanonicalProviderEvaluationCompilationResult {
  if (!canonicalCase(value)) return { status: "blocked", category: "canonical_case_invalid" };
  const knownFacts = referenced(value.known_facts, "fact");
  const knownAssumptions = referenced(value.known_assumptions, "assumption");
  const criticalGaps = referenced(value.critical_gaps, "critical_gap");
  const importantGaps = referenced(value.important_gaps, "important_gap");
  return {
    status: "ready",
    input: {
      boundary_version: CANONICAL_PROVIDER_EVALUATION_INPUT_VERSION,
      capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
      contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
      classification: "synthetic_non_personal",
      trace: { source_case_id: value.case_id },
      language: value.language,
      domain: value.domain,
      decision_type: value.decision_type,
      completeness_level: value.completeness_level,
      input: {
        user_situation: value.user_situation,
        user_intent: value.user_intent,
        known_facts: knownFacts,
        known_assumptions: knownAssumptions,
        critical_gaps: criticalGaps,
        important_gaps: importantGaps,
      },
      allowed_refs: {
        source_refs: [
          "case_situation", "case_intent",
          ...knownFacts.map((item) => item.source_ref),
          ...knownAssumptions.map((item) => item.source_ref),
          ...criticalGaps.map((item) => item.source_ref),
          ...importantGaps.map((item) => item.source_ref),
          "provider_inference", "unknown",
        ],
        option_refs: [], scenario_refs: [], criterion_refs: [],
      },
    },
  };
}

export function extractCanonicalProviderEvaluationOracle(
  value: unknown,
): CanonicalProviderEvaluationOracle | null {
  if (!canonicalCase(value)) return null;
  return Object.fromEntries(
    ORACLE_KEYS.map((key) => [key, structuredClone(value[key])]),
  ) as CanonicalProviderEvaluationOracle;
}
