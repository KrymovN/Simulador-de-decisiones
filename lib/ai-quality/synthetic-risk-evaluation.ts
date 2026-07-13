import {
  CANDIDATE_RISK_SIGNALS_CAPABILITY,
  OPENAI_SYNTHETIC_RISK_MODEL,
  candidateRiskMaterialHasValidSchema,
  inspectCandidateRiskMaterial,
  validateSyntheticCandidateRiskInput,
  type CandidateRiskMaterial,
  type SyntheticRiskErrorCategory,
} from "../ai-provider/openai-synthetic-risk-adapter";

export const SYNTHETIC_RISK_EVALUATION_VERSION =
  "stage-9-candidate-risk-synthetic-evaluation.1" as const;

export const SYNTHETIC_RISK_COVERAGE_IDS = [
  "valid_ordinary_multi_option",
  "valid_uncertainty_heavy",
  "valid_multiple_grounded",
  "too_few_risks",
  "too_many_risks",
  "unknown_output_field",
  "unknown_nested_field",
  "invalid_category",
  "invalid_severity",
  "invalid_likelihood",
  "nonexistent_option_ref",
  "nonexistent_fact_ref",
  "duplicate_risk",
  "recommendation_language",
  "best_option_language",
  "direct_imperative",
  "assistant_chat_language",
  "provider_system_leakage",
  "raw_reasoning_leakage",
  "auth_owner_session_leakage",
  "secret_token_leakage",
  "meaningless_content",
  "malformed_normalized_success",
  "normalized_controlled_error",
  "injection_like_untrusted_input",
  "valid_near_field_limits",
  "input_above_field_limit",
  "unsupported_scope",
] as const;

export type SyntheticRiskCoverageId = (typeof SYNTHETIC_RISK_COVERAGE_IDS)[number];
export type EvaluationDisposition = "accept" | "reject";
export type EvaluationFailureCategory =
  | SyntheticRiskErrorCategory
  | "case_contract_invalid"
  | "grounding_invalid"
  | "safety_invalid"
  | "normalized_result_invalid";

export type SyntheticRiskEvaluationCase = {
  case_id: string;
  capability: typeof CANDIDATE_RISK_SIGNALS_CAPABILITY;
  case_kind: "valid" | "schema_invalid" | "semantic_invalid" | "grounding_invalid" |
    "safety_invalid" | "boundary_invalid" | "normalized_error";
  coverage_id: SyntheticRiskCoverageId;
  provenance: {
    kind: "canonical_mapping" | "adapter_specific";
    source_document: "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md";
    source_case_id?: "EVAL-001" | "EVAL-013" | "EVAL-017";
    mapping_note: string;
  };
  input: unknown;
  candidate:
    | { kind: "candidate_output"; output: unknown }
    | { kind: "normalized_result"; result: unknown };
  expected: {
    disposition: EvaluationDisposition;
    failure_categories: EvaluationFailureCategory[];
  };
};

type GateState = "passed" | "failed" | "not_applicable";

export type SyntheticRiskEvaluationResult = {
  case_id: string;
  capability: typeof CANDIDATE_RISK_SIGNALS_CAPABILITY;
  coverage_id: SyntheticRiskCoverageId;
  expected_disposition: EvaluationDisposition;
  actual_disposition: EvaluationDisposition;
  passed: boolean;
  failure_categories: EvaluationFailureCategory[];
  hard_gates: {
    case_contract: GateState;
    input_contract: GateState;
    output_schema: GateState;
    grounding: GateState;
    safety_product_role: GateState;
    semantic_integrity: GateState;
    normalized_boundary: GateState;
  };
  signals: {
    risk_count: number;
    unique_category_count: number;
    option_reference_count: number;
    fact_reference_count: number;
    uncertainty_note_count: number;
    trigger_condition_count: number;
  };
  elapsed_ms: number;
};

export type SyntheticRiskEvaluationReport = {
  evaluation_version: typeof SYNTHETIC_RISK_EVALUATION_VERSION;
  capability: typeof CANDIDATE_RISK_SIGNALS_CAPABILITY;
  total_cases: number;
  expected_accepts: number;
  expected_rejects: number;
  accepted_as_expected: number;
  rejected_as_expected: number;
  false_accepts: number;
  false_rejects: number;
  unexpected_dispositions: number;
  category_mismatches: number;
  covered_categories: number;
  required_categories: number;
  coverage_percent: number;
  hard_gate_coverage: Record<keyof SyntheticRiskEvaluationResult["hard_gates"], {
    applicable: number;
    passed: number;
    failed: number;
  }>;
  network_requests: 0;
  passed: boolean;
  results: SyntheticRiskEvaluationResult[];
};

const CASE_KEYS = ["case_id", "capability", "case_kind", "coverage_id", "provenance", "input", "candidate", "expected"];
const PROVENANCE_KEYS = ["kind", "source_document", "source_case_id", "mapping_note"];
const EXPECTED_KEYS = ["disposition", "failure_categories"];
const CASE_KINDS = ["valid", "schema_invalid", "semantic_invalid", "grounding_invalid", "safety_invalid", "boundary_invalid", "normalized_error"];
const CONTROLLED_ERROR_CATEGORIES: SyntheticRiskErrorCategory[] = [
  "provider_disabled", "credentials_unavailable", "provider_not_approved", "synthetic_scope_required",
  "input_contract_invalid", "forbidden_data_detected", "input_limit_exceeded", "cost_limit_exceeded",
  "provider_timeout", "provider_rate_limited", "provider_unavailable", "provider_authentication_failed",
  "provider_refused", "provider_incomplete", "provider_schema_invalid", "provider_semantic_validation_failed",
  "provider_response_invalid", "provider_unknown_failure",
];
const EVALUATION_FAILURE_CATEGORIES: EvaluationFailureCategory[] = [
  ...CONTROLLED_ERROR_CATEGORIES,
  "case_contract_invalid", "grounding_invalid", "safety_invalid", "normalized_result_invalid",
];

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], optional: readonly string[] = []): boolean {
  const keys = Object.keys(value);
  return keys.every((key) => allowed.includes(key)) &&
    allowed.filter((key) => !optional.includes(key)).every((key) => key in value);
}

export function validateSyntheticRiskEvaluationCase(value: unknown): value is SyntheticRiskEvaluationCase {
  if (!record(value) || !exactKeys(value, CASE_KEYS)) return false;
  if (typeof value.case_id !== "string" || !/^S9-EVAL-\d{3}$/.test(value.case_id)) return false;
  if (value.capability !== CANDIDATE_RISK_SIGNALS_CAPABILITY || !CASE_KINDS.includes(String(value.case_kind))) return false;
  if (!SYNTHETIC_RISK_COVERAGE_IDS.includes(value.coverage_id as SyntheticRiskCoverageId)) return false;
  if (!record(value.provenance) || !exactKeys(value.provenance, PROVENANCE_KEYS, ["source_case_id"])) return false;
  if (!record(value.expected) || !exactKeys(value.expected, EXPECTED_KEYS)) return false;
  if (!record(value.candidate) || !["candidate_output", "normalized_result"].includes(String(value.candidate.kind))) return false;
  const candidateKeys = value.candidate.kind === "candidate_output" ? ["kind", "output"] : ["kind", "result"];
  if (!exactKeys(value.candidate, candidateKeys)) return false;
  if (!["canonical_mapping", "adapter_specific"].includes(String(value.provenance.kind)) ||
      value.provenance.source_document !== "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md" ||
      typeof value.provenance.mapping_note !== "string" || !value.provenance.mapping_note.trim()) return false;
  if (value.provenance.kind === "canonical_mapping" && !["EVAL-001", "EVAL-013", "EVAL-017"].includes(String(value.provenance.source_case_id))) return false;
  if (value.provenance.kind === "adapter_specific" && "source_case_id" in value.provenance) return false;
  return ["accept", "reject"].includes(String(value.expected.disposition)) &&
    Array.isArray(value.expected.failure_categories) &&
    value.expected.failure_categories.every((item) => EVALUATION_FAILURE_CATEGORIES.includes(item as EvaluationFailureCategory));
}

function emptySignals() {
  return { risk_count: 0, unique_category_count: 0, option_reference_count: 0, fact_reference_count: 0, uncertainty_note_count: 0, trigger_condition_count: 0 };
}

function signals(material: CandidateRiskMaterial) {
  return {
    risk_count: material.risks.length,
    unique_category_count: new Set(material.risks.map((risk) => risk.category)).size,
    option_reference_count: material.risks.reduce((sum, risk) => sum + risk.affected_option_refs.length, 0),
    fact_reference_count: material.risks.reduce((sum, risk) => sum + risk.basis_fact_refs.length, 0),
    uncertainty_note_count: material.risks.filter((risk) => risk.uncertainty_note.trim()).length,
    trigger_condition_count: material.risks.reduce((sum, risk) => sum + risk.trigger_conditions.length, 0),
  };
}

function normalizedResult(value: unknown):
  | { valid: false }
  | { valid: true; disposition: EvaluationDisposition; material?: CandidateRiskMaterial; category?: EvaluationFailureCategory } {
  if (!record(value) || !["completed", "blocked", "failed"].includes(String(value.status))) return { valid: false };
  if (value.status === "completed") {
    if (!exactKeys(value, ["status", "capability", "model", "candidateMaterial", "usage", "elapsedMs", "metadata"]) ||
      value.capability !== CANDIDATE_RISK_SIGNALS_CAPABILITY || value.model !== OPENAI_SYNTHETIC_RISK_MODEL ||
      !record(value.usage) || !exactKeys(value.usage, ["inputTokens", "outputTokens", "totalTokens", "calculatedCostUsd"]) ||
      !Object.values(value.usage).every((item) => typeof item === "number" && Number.isFinite(item)) ||
      !record(value.metadata) || !exactKeys(value.metadata, ["syntheticOnly", "stored", "providerRequests"]) ||
      value.metadata.syntheticOnly !== true || value.metadata.stored !== false || value.metadata.providerRequests !== 2 ||
      typeof value.elapsedMs !== "number") return { valid: false };
    return candidateRiskMaterialHasValidSchema(value.candidateMaterial)
      ? { valid: true, disposition: "accept", material: value.candidateMaterial as CandidateRiskMaterial }
      : { valid: false };
  }
  if (!exactKeys(value, ["status", "capability", "model", "error", "elapsedMs"]) ||
    value.capability !== CANDIDATE_RISK_SIGNALS_CAPABILITY || value.model !== OPENAI_SYNTHETIC_RISK_MODEL ||
    !record(value.error) || !exactKeys(value.error, ["category", "message"]) ||
    typeof value.error.category !== "string" || !CONTROLLED_ERROR_CATEGORIES.includes(value.error.category as SyntheticRiskErrorCategory) ||
    typeof value.error.message !== "string" || typeof value.elapsedMs !== "number") return { valid: false };
  return { valid: true, disposition: "reject", category: value.error.category as EvaluationFailureCategory };
}

function sorted(values: EvaluationFailureCategory[]): EvaluationFailureCategory[] {
  return [...values].sort();
}

export function evaluateSyntheticRiskCase(item: unknown, now: () => number = () => 0): SyntheticRiskEvaluationResult {
  const started = now();
  const baseGates: SyntheticRiskEvaluationResult["hard_gates"] = {
    case_contract: "passed", input_contract: "not_applicable", output_schema: "not_applicable",
    grounding: "not_applicable", safety_product_role: "not_applicable", semantic_integrity: "not_applicable",
    normalized_boundary: "not_applicable",
  };
  if (!validateSyntheticRiskEvaluationCase(item)) {
    return { case_id: "invalid_case", capability: CANDIDATE_RISK_SIGNALS_CAPABILITY, coverage_id: "unsupported_scope", expected_disposition: "reject", actual_disposition: "reject", passed: false, failure_categories: ["case_contract_invalid"], hard_gates: { ...baseGates, case_contract: "failed" }, signals: emptySignals(), elapsed_ms: now() - started };
  }

  const input = validateSyntheticCandidateRiskInput(item.input);
  if (input.status !== "valid") {
    const failures = [input.category] as EvaluationFailureCategory[];
    const actual: EvaluationDisposition = "reject";
    return result(item, actual, failures, { ...baseGates, input_contract: "failed" }, emptySignals(), now() - started);
  }
  baseGates.input_contract = "passed";

  if (item.candidate.kind === "normalized_result") {
    const normalized = normalizedResult(item.candidate.result);
    if (!normalized.valid) return result(item, "reject", ["normalized_result_invalid"], { ...baseGates, normalized_boundary: "failed" }, emptySignals(), now() - started);
    if (!normalized.material) {
      return result(item, normalized.disposition, normalized.category ? [normalized.category] : [], { ...baseGates, normalized_boundary: "passed" }, emptySignals(), now() - started);
    }
    const inspection = inspectCandidateRiskMaterial(normalized.material, input.value);
    const failures = inspection.failureCategories as EvaluationFailureCategory[];
    return result(item, failures.length === 0 ? "accept" : "reject", failures, {
      ...baseGates,
      normalized_boundary: "passed",
      output_schema: inspection.schemaValid ? "passed" : "failed",
      grounding: inspection.schemaValid ? (inspection.groundingValid ? "passed" : "failed") : "not_applicable",
      safety_product_role: inspection.schemaValid ? (inspection.safetyValid ? "passed" : "failed") : "not_applicable",
      semantic_integrity: inspection.schemaValid ? (inspection.semanticValid ? "passed" : "failed") : "not_applicable",
    }, signals(normalized.material), now() - started);
  }

  const inspection = inspectCandidateRiskMaterial(item.candidate.output, input.value);
  const gates = {
    ...baseGates,
    output_schema: inspection.schemaValid ? "passed" as const : "failed" as const,
    grounding: inspection.schemaValid ? (inspection.groundingValid ? "passed" as const : "failed" as const) : "not_applicable" as const,
    safety_product_role: inspection.schemaValid ? (inspection.safetyValid ? "passed" as const : "failed" as const) : "not_applicable" as const,
    semantic_integrity: inspection.schemaValid ? (inspection.semanticValid ? "passed" as const : "failed" as const) : "not_applicable" as const,
  };
  const failures = inspection.failureCategories as EvaluationFailureCategory[];
  const actual = failures.length === 0 ? "accept" : "reject";
  const materialSignals = inspection.schemaValid ? signals(item.candidate.output as CandidateRiskMaterial) : emptySignals();
  return result(item, actual, failures, gates, materialSignals, now() - started);
}

function result(
  item: SyntheticRiskEvaluationCase,
  actual: EvaluationDisposition,
  failures: EvaluationFailureCategory[],
  gates: SyntheticRiskEvaluationResult["hard_gates"],
  materialSignals: SyntheticRiskEvaluationResult["signals"],
  elapsed: number,
): SyntheticRiskEvaluationResult {
  const categoriesMatch = JSON.stringify(sorted(failures)) === JSON.stringify(sorted(item.expected.failure_categories));
  return {
    case_id: item.case_id, capability: item.capability, coverage_id: item.coverage_id,
    expected_disposition: item.expected.disposition, actual_disposition: actual,
    passed: actual === item.expected.disposition && categoriesMatch,
    failure_categories: sorted(failures), hard_gates: gates, signals: materialSignals, elapsed_ms: elapsed,
  };
}

export function runSyntheticRiskEvaluation(cases: unknown[], now: () => number = () => 0): SyntheticRiskEvaluationReport {
  const results = cases.map((item) => evaluateSyntheticRiskCase(item, now));
  const coverage = new Set(results.map((item) => item.coverage_id));
  const falseAccepts = results.filter((item) => item.expected_disposition === "reject" && item.actual_disposition === "accept").length;
  const falseRejects = results.filter((item) => item.expected_disposition === "accept" && item.actual_disposition === "reject").length;
  const categoryMismatches = results.filter((item) => !item.passed && item.expected_disposition === item.actual_disposition).length;
  const fullCoverage = SYNTHETIC_RISK_COVERAGE_IDS.every((id) => coverage.has(id));
  const gateNames = Object.keys(results[0]?.hard_gates ?? {}) as Array<keyof SyntheticRiskEvaluationResult["hard_gates"]>;
  const hardGateCoverage = Object.fromEntries(gateNames.map((gate) => {
    const states = results.map((item) => item.hard_gates[gate]);
    return [gate, {
      applicable: states.filter((state) => state !== "not_applicable").length,
      passed: states.filter((state) => state === "passed").length,
      failed: states.filter((state) => state === "failed").length,
    }];
  })) as SyntheticRiskEvaluationReport["hard_gate_coverage"];
  return {
    evaluation_version: SYNTHETIC_RISK_EVALUATION_VERSION,
    capability: CANDIDATE_RISK_SIGNALS_CAPABILITY,
    total_cases: results.length,
    expected_accepts: results.filter((item) => item.expected_disposition === "accept").length,
    expected_rejects: results.filter((item) => item.expected_disposition === "reject").length,
    accepted_as_expected: results.filter((item) => item.expected_disposition === "accept" && item.actual_disposition === "accept").length,
    rejected_as_expected: results.filter((item) => item.expected_disposition === "reject" && item.actual_disposition === "reject").length,
    false_accepts: falseAccepts, false_rejects: falseRejects, category_mismatches: categoryMismatches,
    unexpected_dispositions: falseAccepts + falseRejects,
    covered_categories: coverage.size, required_categories: SYNTHETIC_RISK_COVERAGE_IDS.length,
    coverage_percent: Number((coverage.size / SYNTHETIC_RISK_COVERAGE_IDS.length * 100).toFixed(2)),
    hard_gate_coverage: hardGateCoverage,
    network_requests: 0,
    passed: results.length >= 28 && fullCoverage && falseAccepts === 0 && falseRejects === 0 && categoryMismatches === 0 && results.every((item) => item.passed),
    results,
  };
}
