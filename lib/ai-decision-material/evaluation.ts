import { acceptCandidateDecisionMaterial } from "./acceptance";
import {
  RICH_DECISION_MATERIAL_COVERAGE_IDS,
  type RichDecisionMaterialFixture,
} from "./fixtures";
import type {
  CandidateDecisionMaterialItem,
  DecisionMaterialAcceptanceResult,
  SemanticPreservationDisposition,
  SemanticPreservationReason,
  ValueAddTransformation,
} from "./contracts";

export const AI_VALUE_PRESERVATION_EVALUATION_VERSION =
  "stage-9-ai-value-preservation.1" as const;

export type AIValuePreservationMetrics = {
  semantic_coverage_percent: number;
  silent_loss_count: number;
  traceability_coverage_percent: number;
  fact_assumption_unknown_separation_preserved: boolean;
  option_scenario_mapping_count: number;
  criterion_mapping_count: number;
  uncertainty_preserved: boolean;
  duplicate_merge_count: number;
  authority_violation_count: number;
  unsupported_certainty_count: number;
  meaningful_transformation_count: number;
  risk_only_value_loss_detected: boolean;
};

export type AIValuePreservationCaseResult = {
  fixture_id: string;
  coverage_id: RichDecisionMaterialFixture["coverage_id"];
  passed: boolean;
  acceptance: DecisionMaterialAcceptanceResult;
  metrics: AIValuePreservationMetrics;
  hard_failures: string[];
};

export type AIValuePreservationEvaluationReport = {
  version: typeof AI_VALUE_PRESERVATION_EVALUATION_VERSION;
  total_cases: number;
  passed_cases: number;
  failed_cases: number;
  covered_categories: number;
  required_categories: number;
  network_requests: 0;
  public_mock_only_path_unchanged: true;
  passed: boolean;
  results: AIValuePreservationCaseResult[];
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function observedItems(material: unknown): CandidateDecisionMaterialItem[] {
  if (!record(material) || !Array.isArray(material.items)) return [];
  return material.items.filter(record) as CandidateDecisionMaterialItem[];
}

function sameSet<T extends string>(actual: T[], expected: T[]): boolean {
  const left = [...new Set(actual)].sort();
  const right = [...new Set(expected)].sort();
  return JSON.stringify(left) === JSON.stringify(right);
}

function dispositionSet(result: DecisionMaterialAcceptanceResult): SemanticPreservationDisposition[] {
  return result.ledger.map((entry) => entry.disposition);
}

function reasonSet(result: DecisionMaterialAcceptanceResult): SemanticPreservationReason[] {
  return result.ledger.map((entry) => entry.reason);
}

function metrics(
  fixture: RichDecisionMaterialFixture,
  acceptance: DecisionMaterialAcceptanceResult,
): AIValuePreservationMetrics {
  const originalItems = observedItems(fixture.material);
  const acceptedById = new Map(
    acceptance.accepted_material.items.map((item) => [item.candidate_id, item]),
  );
  const traceabilityCount = acceptance.ledger.filter((entry) => entry.traceability_marker).length;
  const ledgerCoverageCount = acceptance.ledger.filter((entry) =>
    originalItems.some((item) => item.candidate_id === entry.candidate_id),
  ).length;
  const epistemicTypes = new Set(["assumption", "unknown"]);
  const epistemicPreserved = originalItems
    .filter((item) => epistemicTypes.has(item.item_type))
    .every((item) => {
      const ledger = acceptance.ledger.find((entry) => entry.candidate_id === item.candidate_id);
      if (!ledger || !["accepted", "accepted_with_normalization"].includes(ledger.disposition)) return true;
      return acceptedById.get(item.candidate_id)?.item_type === item.item_type;
    });
  const acceptedTypes = new Set(acceptance.accepted_material.items.map((item) => item.item_type));
  const originalTypes = new Set(originalItems.map((item) => item.item_type));
  const uncertaintyPreserved = acceptance.status === "controlled_failure" ||
    !originalTypes.has("unknown") || acceptedTypes.has("unknown") ||
    acceptance.ledger.some((entry) => entry.original_item_type === "unknown" && entry.disposition.startsWith("rejected"));
  const transformations = fixture.future_composition.items.flatMap((item) => item.transformations);
  const uniqueTransformations = new Set<ValueAddTransformation>(transformations);
  const riskOnlyWouldLoseValue = fixture.risk_only_would_lose_value &&
    originalTypes.has("risk_signal") &&
    [...originalTypes].some((type) => type !== "risk_signal");

  return {
    semantic_coverage_percent: originalItems.length === 0
      ? 100
      : Number((ledgerCoverageCount / originalItems.length * 100).toFixed(2)),
    silent_loss_count: acceptance.silent_drop_count,
    traceability_coverage_percent: acceptance.ledger.length === 0
      ? 100
      : Number((traceabilityCount / acceptance.ledger.length * 100).toFixed(2)),
    fact_assumption_unknown_separation_preserved: epistemicPreserved,
    option_scenario_mapping_count: acceptance.ledger.filter((entry) =>
      entry.downstream_mapping.target_refs.some((ref) => ref.startsWith("option_") || ref.startsWith("scenario_")),
    ).length,
    criterion_mapping_count: acceptance.ledger.filter((entry) =>
      entry.downstream_mapping.target_refs.some((ref) => ref.startsWith("criterion_")),
    ).length,
    uncertainty_preserved: uncertaintyPreserved,
    duplicate_merge_count: acceptance.ledger.filter((entry) => entry.disposition === "merged_as_duplicate").length,
    authority_violation_count: acceptance.accepted_material.items.filter((item) =>
      /\b(?:recomiendo|I recommend|mejor opci[oó]n|best option|debes|you should)\b/i.test(item.content),
    ).length,
    unsupported_certainty_count: acceptance.accepted_material.items.filter((item) =>
      /\b(?:guaranteed|garantizado|sin ninguna duda|\d{1,3}\s*%\s+(?:probability|probabilidad))\b/i.test(item.content),
    ).length,
    meaningful_transformation_count: uniqueTransformations.size,
    risk_only_value_loss_detected: riskOnlyWouldLoseValue,
  };
}

export function evaluateAIValuePreservationFixture(
  fixture: RichDecisionMaterialFixture,
): AIValuePreservationCaseResult {
  const acceptance = acceptCandidateDecisionMaterial(fixture.material, fixture.context);
  const measured = metrics(fixture, acceptance);
  const hardFailures: string[] = [];
  if (measured.silent_loss_count > 0) hardFailures.push("silent_loss");
  if (measured.traceability_coverage_percent !== 100) hardFailures.push("traceability_loss");
  if (!measured.fact_assumption_unknown_separation_preserved) hardFailures.push("epistemic_type_changed");
  if (!measured.uncertainty_preserved) hardFailures.push("uncertainty_lost");
  if (measured.authority_violation_count > 0) hardFailures.push("provider_recommendation_accepted");
  if (measured.unsupported_certainty_count > 0) hardFailures.push("unsupported_certainty_accepted");
  if (acceptance.ledger.some((entry) => entry.disposition.startsWith("rejected") && !entry.reason)) {
    hardFailures.push("rejection_without_reason");
  }
  if (fixture.future_composition.contains_raw_provider_answer) hardFailures.push("raw_provider_answer_exposed");
  if (fixture.future_composition.personal_data_scope_opened) hardFailures.push("personal_data_scope_opened");
  if (fixture.future_composition.items.some((item) => item.authority !== "decision_engine")) {
    hardFailures.push("composition_authority_invalid");
  }
  if (fixture.future_composition.items.some((item) =>
    item.source_candidate_ids.some((id) => !acceptance.accepted_material.items.some((candidate) => candidate.candidate_id === id)))) {
    hardFailures.push("composition_traceability_invalid");
  }
  if (fixture.future_composition.items.length > 0 && measured.meaningful_transformation_count === 0) {
    hardFailures.push("no_meaningful_transformation");
  }
  if (fixture.risk_only_would_lose_value && !measured.risk_only_value_loss_detected) {
    hardFailures.push("risk_only_loss_not_detected");
  }

  const expectationMatches = acceptance.status === fixture.expected.status &&
    acceptance.accepted_material.items.length === fixture.expected.accepted_count &&
    sameSet(dispositionSet(acceptance), fixture.expected.dispositions) &&
    sameSet(reasonSet(acceptance), fixture.expected.reasons);

  return {
    fixture_id: fixture.fixture_id,
    coverage_id: fixture.coverage_id,
    passed: expectationMatches && hardFailures.length === 0,
    acceptance,
    metrics: measured,
    hard_failures: hardFailures,
  };
}

export function runAIValuePreservationEvaluation(
  fixtures: RichDecisionMaterialFixture[],
): AIValuePreservationEvaluationReport {
  const results = fixtures.map(evaluateAIValuePreservationFixture);
  const coverage = new Set(results.map((result) => result.coverage_id));
  const passedCases = results.filter((result) => result.passed).length;
  const fullCoverage = RICH_DECISION_MATERIAL_COVERAGE_IDS.every((id) => coverage.has(id));
  return {
    version: AI_VALUE_PRESERVATION_EVALUATION_VERSION,
    total_cases: results.length,
    passed_cases: passedCases,
    failed_cases: results.length - passedCases,
    covered_categories: coverage.size,
    required_categories: RICH_DECISION_MATERIAL_COVERAGE_IDS.length,
    network_requests: 0,
    public_mock_only_path_unchanged: true,
    passed: fullCoverage && results.length >= RICH_DECISION_MATERIAL_COVERAGE_IDS.length &&
      passedCases === results.length,
    results,
  };
}
