import { DECISION_ENGINE_STATUSES, type DecisionEngineResult } from "./contracts";
import type { CompletenessAssessment, DecisionInput, Score } from "./types";

const DECISION_INTENTS = ["explore", "compare", "recommend", "review"] as const;
const SCORE_BANDS = ["very_low", "low", "medium", "high", "very_high"] as const;
const COMPLETENESS_LEVELS = ["complete", "partial", "critical"] as const;
const COMPLETENESS_DIMENSIONS = [
  "goal",
  "options",
  "constraints",
  "variables",
  "stakeholders",
  "timeHorizon",
  "risks",
  "benefits",
  "assumptions",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return isString(value) && allowed.includes(value);
}

function isScore(value: unknown): value is Score {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Number.isInteger(value.value) &&
    typeof value.value === "number" &&
    value.value >= 0 &&
    value.value <= 100 &&
    isOneOf(value.band, SCORE_BANDS) &&
    isString(value.rationale) &&
    isStringArray(value.evidenceRefs)
  );
}

/**
 * Checks only the provider-independent request boundary shape.
 * Meaningful-content and product-eligibility decisions belong to later engine stages.
 */
export function validateDecisionInputShape(value: unknown): value is DecisionInput {
  if (!isRecord(value) || !isRecord(value.input)) {
    return false;
  }

  return (
    value.contractVersion === "2.0" &&
    isString(value.requestId) &&
    isString(value.input.originalText) &&
    isString(value.input.inputLanguage) &&
    isString(value.input.requestedOutputLanguage) &&
    isOneOf(value.userIntent, DECISION_INTENTS) &&
    (value.suppliedContext === undefined || Array.isArray(value.suppliedContext)) &&
    (value.suppliedOptions === undefined || Array.isArray(value.suppliedOptions)) &&
    (value.preferences === undefined || isRecord(value.preferences))
  );
}

/**
 * Checks the deterministic completeness contract shape without calculating completeness.
 */
export function validateCompletenessAssessmentShape(value: unknown): value is CompletenessAssessment {
  if (!isRecord(value) || !isRecord(value.dimensions)) {
    return false;
  }

  const dimensions = value.dimensions;

  return (
    isOneOf(value.level, COMPLETENESS_LEVELS) &&
    isScore(value.overall) &&
    COMPLETENESS_DIMENSIONS.every((dimension) => isScore(dimensions[dimension])) &&
    isStringArray(value.blockingDimensions)
  );
}

/**
 * Checks the top-level result envelope only.
 * Cross-reference, safety, gap, and recommendation invariants are intentionally out of scope.
 */
export function validateDecisionEngineResultShape(value: unknown): value is DecisionEngineResult {
  if (
    !isRecord(value) ||
    !isRecord(value.inputValidation) ||
    !isRecord(value.confidenceSummary) ||
    !isRecord(value.safety) ||
    !isRecord(value.trace)
  ) {
    return false;
  }

  return (
    value.contractVersion === "2.0" &&
    isString(value.resultId) &&
    isString(value.requestId) &&
    isOneOf(value.status, DECISION_ENGINE_STATUSES) &&
    validateDecisionInputShape(value.input) &&
    typeof value.inputValidation.valid === "boolean" &&
    isStringArray(value.inputValidation.errors) &&
    validateCompletenessAssessmentShape(value.completeness) &&
    isRecord(value.confidence) &&
    isScore(value.confidenceSummary.overall) &&
    value.confidenceSummary.calibration === "model_quality_not_probability" &&
    Array.isArray(value.gaps) &&
    Array.isArray(value.contradictions) &&
    isRecord(value.clarification) &&
    Array.isArray(value.scenarios) &&
    Array.isArray(value.risks) &&
    Array.isArray(value.recommendations) &&
    Array.isArray(value.orchestratorTrace) &&
    Array.isArray(value.controlledFailures) &&
    isString(value.safety.domain) &&
    isString(value.safety.level) &&
    typeof value.safety.recommendationAllowed === "boolean" &&
    value.trace.contractVersion === "2.0" &&
    isString(value.trace.traceId) &&
    isString(value.trace.requestId)
  );
}
