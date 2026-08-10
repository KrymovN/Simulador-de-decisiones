import "server-only";

import {
  CANONICAL_OFFLINE_EVALUATION_CASES,
  type CanonicalOfflineEvaluationCase,
} from "../ai-decision-material/fixtures";

export const CANONICAL_PROVIDER_EVALUATION_TAXONOMY_VERSION =
  "canonical-provider-evaluation-taxonomy.1" as const;

export const CANONICAL_PROVIDER_EVALUATION_TASK_PROFILE_VERSION =
  "canonical-provider-evaluation-task-profile.1" as const;

export const CANONICAL_PROVIDER_EVALUATION_CATEGORIES = [
  "scenario",
  "risk",
  "clarification",
  "recommendation",
  "safety",
  "privacy",
  "failure",
  "v2_status",
  "traceability",
  "rubric",
] as const;

export type CanonicalProviderEvaluationCategory =
  (typeof CANONICAL_PROVIDER_EVALUATION_CATEGORIES)[number];

const ORACLE_FIELD_BY_CATEGORY = {
  scenario: "expected_scenario_behavior",
  risk: "expected_risk_behavior",
  clarification: "expected_clarification_behavior",
  recommendation: "expected_recommendation_behavior",
  safety: "safety_expectations",
  privacy: "privacy_expectations",
  failure: "failure_expectations",
  v2_status: "expected_v2_statuses",
  traceability: "traceability_expectations",
  rubric: "review_rubric",
} as const satisfies Record<
  CanonicalProviderEvaluationCategory,
  keyof CanonicalOfflineEvaluationCase
>;

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "en"));
}

export const CANONICAL_PROVIDER_EVALUATION_TAXONOMY = Object.freeze(
  Object.fromEntries(
    CANONICAL_PROVIDER_EVALUATION_CATEGORIES.map((category) => [
      category,
      Object.freeze(uniqueSorted(CANONICAL_OFFLINE_EVALUATION_CASES.flatMap(
        (item) => item[ORACLE_FIELD_BY_CATEGORY[category]] as string[],
      ))),
    ]),
  ) as Record<CanonicalProviderEvaluationCategory, readonly string[]>,
);

type CanonicalOracleConceptSource = Pick<
  CanonicalOfflineEvaluationCase,
  (typeof ORACLE_FIELD_BY_CATEGORY)[CanonicalProviderEvaluationCategory]
>;

export type CanonicalProviderEvaluationTaxonomyRegistry = {
  version: typeof CANONICAL_PROVIDER_EVALUATION_TAXONOMY_VERSION;
  categories: Record<CanonicalProviderEvaluationCategory, readonly string[]>;
};

export const CANONICAL_PROVIDER_EVALUATION_TAXONOMY_REGISTRY:
CanonicalProviderEvaluationTaxonomyRegistry = Object.freeze({
  version: CANONICAL_PROVIDER_EVALUATION_TAXONOMY_VERSION,
  categories: CANONICAL_PROVIDER_EVALUATION_TAXONOMY,
});

export type CanonicalProviderEvaluationTaskProfile = {
  version: typeof CANONICAL_PROVIDER_EVALUATION_TASK_PROFILE_VERSION;
  global_requirements: readonly [
    "identify_materially_distinct_paths",
    "identify_short_term_consequences",
    "identify_long_term_consequences",
    "identify_material_risks",
    "connect_material_uncertainty_to_risk",
    "identify_material_tradeoffs",
    "identify_clarification_needs",
    "consider_no_action_defer_or_information_first_path",
    "apply_safety_and_privacy_boundaries",
    "preserve_traceability_without_invented_refs",
  ];
  input_derived_requirements: {
    clarification_material_required: boolean;
    information_first_or_defer_required: boolean;
    normal_recommendation_must_be_withheld: boolean;
  };
};

type TaskProfileSource = Pick<
  CanonicalOfflineEvaluationCase,
  "completeness_level" | "critical_gaps" | "important_gaps"
>;

export function buildCanonicalProviderEvaluationTaskProfile(
  source: TaskProfileSource,
): CanonicalProviderEvaluationTaskProfile {
  const incomplete = source.completeness_level !== "complete";
  const hasCriticalGap = source.critical_gaps.length > 0;
  const hasImportantGap = source.important_gaps.length > 0;
  return {
    version: CANONICAL_PROVIDER_EVALUATION_TASK_PROFILE_VERSION,
    global_requirements: [
      "identify_materially_distinct_paths",
      "identify_short_term_consequences",
      "identify_long_term_consequences",
      "identify_material_risks",
      "connect_material_uncertainty_to_risk",
      "identify_material_tradeoffs",
      "identify_clarification_needs",
      "consider_no_action_defer_or_information_first_path",
      "apply_safety_and_privacy_boundaries",
      "preserve_traceability_without_invented_refs",
    ],
    input_derived_requirements: {
      clarification_material_required: incomplete || hasCriticalGap || hasImportantGap,
      information_first_or_defer_required: incomplete || hasCriticalGap,
      normal_recommendation_must_be_withheld: incomplete || hasCriticalGap,
    },
  };
}

export function canonicalOracleConceptsByCategory(
  source: CanonicalOracleConceptSource,
): Record<CanonicalProviderEvaluationCategory, readonly string[]> {
  return Object.fromEntries(
    CANONICAL_PROVIDER_EVALUATION_CATEGORIES.map((category) => [
      category,
      source[ORACLE_FIELD_BY_CATEGORY[category]],
    ]),
  ) as unknown as Record<CanonicalProviderEvaluationCategory, readonly string[]>;
}
