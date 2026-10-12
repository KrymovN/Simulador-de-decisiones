import type { SimulationResponseV2Draft } from "../decision-engine/contracts";
import type { DecisionConsequence, EvidenceSource } from "../decision-engine/types";
import {
  boundedConsequenceRef,
  CONSEQUENCE_MAX_ITEMS,
  CONSEQUENCE_MAX_ORIGINS,
  validatePresentDecisionConsequences,
} from "../decision-engine/consequence-validation";

const REFERENCE_VERSION = "consequence-snapshot-references.1" as const;
const MAX_SOURCE_IDS = 64 * 16;
const SOURCE_RECEIPT_DETAIL = "Stored supporting source references from the validated response trace.";

/** Immutable supporting receipts, not a provider packet or operational trace.
 * Option/scenario identities continue to resolve in the existing snapshot. */
type ConsequenceReferences = {
  version: typeof REFERENCE_VERSION;
  assumptionIds: string[];
  scenarioSources: { id: string; optionId: string; sourceEntityIds: string[] }[];
  evidence: { id: string; source: EvidenceSource; claim: string; userConfirmed: boolean }[];
  responseMapping: { detail: string; sourceEntityIds: string[] }[];
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => Object.hasOwn(value, key)) && Object.keys(value).every((key) => keys.includes(key));
}

function refs(value: unknown, maximum = MAX_SOURCE_IDS): value is string[] {
  return Array.isArray(value) && value.length <= maximum && value.every(boundedConsequenceRef) &&
    new Set(value).size === value.length;
}

function copyConsequences(values: DecisionConsequence[]): DecisionConsequence[] {
  return values.map((value) => ({
    id: value.id, description: value.description, horizon: value.horizon, optionId: value.optionId,
    ...(value.scenarioId !== undefined ? { scenarioId: value.scenarioId } : {}),
    sourceEntityIds: [...value.sourceEntityIds],
    provenance: { independentlyVerified: false, origins: value.provenance.origins.map((origin) => {
      if (origin.source === "controlled_material") return {
        source: origin.source, materialItemId: origin.materialItemId, sourceRef: origin.sourceRef,
      };
      if (origin.source === "manual") return { source: origin.source, evidenceRefId: origin.evidenceRefId };
      return { source: origin.source, ruleId: origin.ruleId };
    }) as DecisionConsequence["provenance"]["origins"] },
  }));
}

/** Called only after the complete live response guard. No IDs are regenerated.
 * A material ID resolves to its archived receipt, not to a future AI run. */
export function projectDecisionConsequences(response: SimulationResponseV2Draft): {
  consequences?: DecisionConsequence[];
  consequenceReferences?: ConsequenceReferences;
} {
  const values = response.analysis?.consequences;
  if (values === undefined) return {};
  const sourceIds = new Set(values.flatMap((entry) => entry.sourceEntityIds));
  const scopeIds = new Set(values.flatMap((entry) => [entry.optionId, ...entry.sourceEntityIds,
    ...(entry.scenarioId === undefined ? [] : [entry.scenarioId])]));
  const receiptIds = new Set(values.flatMap((entry) => entry.provenance.origins.flatMap((origin) =>
    origin.source === "controlled_material" ? [origin.materialItemId] : origin.source === "manual" ? [origin.evidenceRefId] : [])));
  const responseMapping: ConsequenceReferences["responseMapping"] = [];
  for (const entry of values) for (const origin of entry.provenance.origins) {
    if (origin.source !== "controlled_material") continue;
    const detail = `Composed controlled ${entry.horizon === "short_term" ? "short_term_consequence" : "long_term_consequence"} material under Decision Engine authority from provenance ${origin.sourceRef}.`;
    const trace = response.traceability.responseMapping.find((item) =>
      item.detail === detail && item.sourceEntityIds.includes(origin.materialItemId));
    if (trace) responseMapping.push({ detail, sourceEntityIds: [...new Set(trace.sourceEntityIds.filter((id) =>
      id === origin.materialItemId || scopeIds.has(id)))] });
  }
  const allEvidenceIds = new Set(response.traceability.evidence.map((item) => item.id));
  const tracedSources = [...new Set(response.traceability.responseMapping.flatMap((item) =>
    item.sourceEntityIds.filter((id) => sourceIds.has(id) && !allEvidenceIds.has(id))))].sort();
  if (tracedSources.length > 0) responseMapping.push({ detail: SOURCE_RECEIPT_DETAIL, sourceEntityIds: tracedSources });
  const consequenceReferences: ConsequenceReferences = {
    version: REFERENCE_VERSION,
    assumptionIds: (response.analysis?.assumptions ?? []).filter((item) => sourceIds.has(item.id)).map((item) => item.id),
    scenarioSources: (response.analysis?.scenarios ?? []).flatMap((item) => {
      const ids = [...new Set([...item.dependencies, ...item.outcomeIndicators].map((part) => part.sourceEntityId)
        .filter((id) => sourceIds.has(id)))];
      return ids.length === 0 ? [] : [{ id: item.id, optionId: item.optionId, sourceEntityIds: ids }];
    }),
    evidence: response.traceability.evidence.filter((item) => receiptIds.has(item.id)).map((item) => ({
      id: item.id, source: item.source, claim: item.claim, userConfirmed: item.userConfirmed,
    })),
    responseMapping: responseMapping.filter((item, index, all) =>
      all.findIndex((other) => JSON.stringify(other) === JSON.stringify(item)) === index),
  };
  return { consequences: copyConsequences(values), consequenceReferences };
}

export type StoredConsequenceDecodeResult =
  | { valid: true; consequences?: DecisionConsequence[] }
  | { valid: false };

/** Legacy absence stays absent. Present malformed data is never silently dropped
 * or made valid by fallback UI labels, positions, or a fresh simulation. */
export function decodeStoredDecisionConsequences(snapshot: unknown): StoredConsequenceDecodeResult {
  if (!record(snapshot)) return { valid: false };
  if (!record(snapshot.analysis)) return { valid: true };
  const analysis = snapshot.analysis;
  const hasValues = Object.hasOwn(analysis, "consequences");
  const hasReferences = Object.hasOwn(analysis, "consequenceReferences");
  if (!hasValues && !hasReferences) return { valid: true };
  if (!hasValues || !hasReferences || !Array.isArray(analysis.consequences) || analysis.consequences.length > CONSEQUENCE_MAX_ITEMS ||
      !record(snapshot.decision) || !Array.isArray(snapshot.decision.options) || !Array.isArray(analysis.scenarios) ||
      !record(analysis.consequenceReferences)) return { valid: false };
  const references = analysis.consequenceReferences;
  if (!exactKeys(references, ["version", "assumptionIds", "scenarioSources", "evidence", "responseMapping"]) ||
      references.version !== REFERENCE_VERSION || !refs(references.assumptionIds) ||
      !Array.isArray(references.scenarioSources) || references.scenarioSources.length > MAX_SOURCE_IDS ||
      !Array.isArray(references.evidence) || references.evidence.length > CONSEQUENCE_MAX_ORIGINS ||
      !Array.isArray(references.responseMapping) || references.responseMapping.length > CONSEQUENCE_MAX_ORIGINS + 1) return { valid: false };
  const options = snapshot.decision.options;
  const scenarios = analysis.scenarios;
  if (!options.every((item) => record(item) && boundedConsequenceRef(item.id)) ||
      new Set(options.map((item) => (item as Record<string, unknown>).id)).size !== options.length ||
      !scenarios.every((item) => record(item) && boundedConsequenceRef(item.id) && boundedConsequenceRef(item.optionId) &&
        options.some((option) => (option as Record<string, unknown>).id === item.optionId)) ||
      new Set(scenarios.map((item) => (item as Record<string, unknown>).id)).size !== scenarios.length) return { valid: false };
  if (!references.scenarioSources.every((item) => record(item) && exactKeys(item, ["id", "optionId", "sourceEntityIds"]) &&
      refs(item.sourceEntityIds) && scenarios.some((scenario) => record(scenario) && scenario.id === item.id && scenario.optionId === item.optionId)) ||
      new Set(references.scenarioSources.map((item) => item.id)).size !== references.scenarioSources.length ||
      !references.evidence.every((item) => record(item) && exactKeys(item, ["id", "source", "claim", "userConfirmed"]) &&
        boundedConsequenceRef(item.id) && ["engine_inference", "user_statement", "user_answer", "user_confirmed_memory"].includes(String(item.source)) &&
        typeof item.claim === "string" && item.claim.length <= 4096 && typeof item.userConfirmed === "boolean") ||
      new Set(references.evidence.map((item) => item.id)).size !== references.evidence.length ||
      !references.responseMapping.every((item) => record(item) && exactKeys(item, ["detail", "sourceEntityIds"]) &&
        refs(item.sourceEntityIds, MAX_SOURCE_IDS + CONSEQUENCE_MAX_ORIGINS) && item.sourceEntityIds.length > 0 &&
        typeof item.detail === "string" && (item.detail === SOURCE_RECEIPT_DETAIL ||
          /^Composed controlled (short_term_consequence|long_term_consequence) material under Decision Engine authority from provenance (?:objective_1|question_1|(?:option|scenario|constraint|criterion)_[1-9]\d*)\.$/.test(item.detail)))) return { valid: false };
  const scenarioSources = references.scenarioSources;
  const expectedReceipts = new Set<string>();
  let originCount = 0;
  // Validate the consequence representation before reading typed origin fields.
  // The shared guard below remains the authority for all semantic bounds.
  for (const entry of analysis.consequences) {
    if (!record(entry) || !record(entry.provenance) || !Array.isArray(entry.provenance.origins) ||
        entry.provenance.origins.length === 0 || entry.provenance.origins.length > CONSEQUENCE_MAX_ORIGINS) return { valid: false };
    originCount += entry.provenance.origins.length;
    if (originCount > CONSEQUENCE_MAX_ORIGINS) return { valid: false };
    for (const origin of entry.provenance.origins) {
      if (!record(origin)) return { valid: false };
      if (origin.source === "controlled_material" && boundedConsequenceRef(origin.materialItemId)) expectedReceipts.add(origin.materialItemId);
      if (origin.source === "manual" && boundedConsequenceRef(origin.evidenceRefId)) expectedReceipts.add(origin.evidenceRefId);
    }
  }
  if (references.evidence.length !== expectedReceipts.size || !references.evidence.every((item) => expectedReceipts.has(item.id)) ||
      references.responseMapping.reduce((count, item) => count + item.sourceEntityIds.length, 0) > MAX_SOURCE_IDS * 2 + CONSEQUENCE_MAX_ORIGINS) return { valid: false };
  const validationView = {
    status: snapshot.status,
    decision: { optionSummaries: options },
    analysis: {
      consequences: analysis.consequences,
      assumptions: references.assumptionIds.map((id) => ({ id })),
      scenarios: scenarios.map((scenario) => {
        const value = scenario as Record<string, unknown>;
        const sources = scenarioSources.find((item) => item.id === value.id);
        return { id: value.id, optionId: value.optionId,
          dependencies: (sources?.sourceEntityIds ?? []).map((sourceEntityId: string) => ({ sourceEntityId })) };
      }),
    },
    traceability: { evidence: references.evidence, responseMapping: references.responseMapping },
  };
  return validatePresentDecisionConsequences(validationView)
    ? { valid: true, consequences: copyConsequences(analysis.consequences as DecisionConsequence[]) }
    : { valid: false };
}

export function validateStoredDecisionConsequences(snapshot: unknown): boolean {
  return decodeStoredDecisionConsequences(snapshot).valid;
}
