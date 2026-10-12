import type { DecisionConsequence } from "./types";

export const CONSEQUENCE_MAX_ITEMS = 64;
export const CONSEQUENCE_MAX_DESCRIPTION_LENGTH = 600;
export const CONSEQUENCE_MAX_SOURCE_REFS = 16;
export const CONSEQUENCE_MAX_ORIGINS = 64;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keys(value: Record<string, unknown>, required: string[], optional: string[] = []): boolean {
  return required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => required.includes(key) || optional.includes(key));
}

export function boundedConsequenceRef(value: unknown): value is string {
  // Controlled material IDs include the bounded candidate ID plus a prefix.
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,159}$/i.test(value);
}

export function normalizeConsequenceDescription(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ")
    .toLocaleLowerCase("es-ES").replace(/[.,;:!?]+$/gu, "");
}

export function consequenceSemanticKey(value: Pick<DecisionConsequence, "optionId" | "scenarioId" | "horizon" | "description">): string {
  return JSON.stringify([value.optionId, value.scenarioId ?? null, value.horizon,
    normalizeConsequenceDescription(value.description)]);
}

function stringRefs(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.length <= CONSEQUENCE_MAX_SOURCE_REFS &&
    value.every(boundedConsequenceRef) && new Set(value).size === value.length;
}

/** Pure/client-safe present-field guard. Full canonical grounding is also
 * checked against the original DecisionContext by the server composer. The
 * public response resolves supporting refs through its existing trace receipts;
 * it does not serialize the complete private canonical context. */
export function validatePresentDecisionConsequences(response: Record<string, unknown>): boolean {
  if (!record(response.analysis) || response.analysis.consequences === undefined) return true;
  const values = response.analysis.consequences;
  if (!Array.isArray(values) || values.length > CONSEQUENCE_MAX_ITEMS ||
      !["analysis_ready", "limited_analysis", "cannot_recommend"].includes(String(response.status)) ||
      !record(response.decision) || !Array.isArray(response.decision.optionSummaries) ||
      !Array.isArray(response.analysis.scenarios) || !record(response.traceability)) return false;
  const options = response.decision.optionSummaries.filter(record);
  const optionIds = new Set(options.map((option) => option.id).filter(boundedConsequenceRef));
  const scenarios = response.analysis.scenarios.filter(record);
  const evidence = Array.isArray(response.traceability.evidence) ? response.traceability.evidence.filter(record) : [];
  const traces = Array.isArray(response.traceability.responseMapping) ? response.traceability.responseMapping.filter(record) : [];
  const materialIds = new Set(evidence.map((entry) => entry.id));
  const sourceIds = new Set<string>(optionIds);
  for (const assumption of Array.isArray(response.analysis.assumptions) ? response.analysis.assumptions.filter(record) : []) {
    if (boundedConsequenceRef(assumption.id)) sourceIds.add(assumption.id);
  }
  for (const scenario of scenarios) {
    if (boundedConsequenceRef(scenario.id)) sourceIds.add(scenario.id);
    for (const dependency of Array.isArray(scenario.dependencies) ? scenario.dependencies.filter(record) : []) {
      if (boundedConsequenceRef(dependency.sourceEntityId)) sourceIds.add(dependency.sourceEntityId);
    }
    for (const indicator of Array.isArray(scenario.outcomeIndicators) ? scenario.outcomeIndicators.filter(record) : []) {
      if (boundedConsequenceRef(indicator.sourceEntityId)) sourceIds.add(indicator.sourceEntityId);
    }
  }
  for (const trace of traces) {
    for (const id of Array.isArray(trace.sourceEntityIds) ? trace.sourceEntityIds : []) {
      if (boundedConsequenceRef(id) && !materialIds.has(id)) sourceIds.add(id);
    }
  }
  const seenIds = new Set<string>(), seenKeys = new Set<string>();
  let originCount = 0;
  return values.every((value) => {
    if (!record(value) || !keys(value, ["id", "description", "horizon", "optionId", "sourceEntityIds", "provenance"], ["scenarioId"]) ||
        typeof value.id !== "string" || !/^consequence_[a-f0-9]{64}$/.test(value.id) ||
        typeof value.description !== "string" || value.description.trim().length === 0 ||
        value.description.length > CONSEQUENCE_MAX_DESCRIPTION_LENGTH ||
        !["short_term", "long_term"].includes(String(value.horizon)) ||
        !boundedConsequenceRef(value.optionId) || !optionIds.has(value.optionId) ||
        !stringRefs(value.sourceEntityIds) || !value.sourceEntityIds.every((id) => sourceIds.has(id)) ||
        !record(value.provenance) || !keys(value.provenance, ["origins", "independentlyVerified"]) ||
        value.provenance.independentlyVerified !== false || !Array.isArray(value.provenance.origins) ||
        value.provenance.origins.length === 0 || value.provenance.origins.length > CONSEQUENCE_MAX_ORIGINS) return false;
    if (Object.hasOwn(value, "scenarioId") && (!boundedConsequenceRef(value.scenarioId) ||
        !scenarios.some((scenario) => scenario.id === value.scenarioId && scenario.optionId === value.optionId))) return false;
    const semanticKey = consequenceSemanticKey(value as unknown as DecisionConsequence);
    if (seenIds.has(value.id) || seenKeys.has(semanticKey)) return false;
    seenIds.add(value.id); seenKeys.add(semanticKey);
    originCount += value.provenance.origins.length;
    if (originCount > CONSEQUENCE_MAX_ORIGINS) return false;
    const seenOrigins = new Set<string>();
    const supportedSources = new Set<string>([value.optionId]);
    const validOrigins = value.provenance.origins.every((origin: unknown) => {
      if (!record(origin)) return false;
      let originKey: string;
      if (origin.source === "controlled_material") {
        if (!keys(origin, ["source", "materialItemId", "sourceRef"]) || !boundedConsequenceRef(origin.materialItemId) ||
            !boundedConsequenceRef(origin.sourceRef) || !/^(?:objective_1|question_1|(?:option|scenario|constraint|criterion)_[1-9]\d*)$/.test(origin.sourceRef)) return false;
        const receipt = evidence.find((entry) => entry.id === origin.materialItemId);
        const receiptTrace = traces.find((trace) => Array.isArray(trace.sourceEntityIds) &&
          trace.sourceEntityIds.includes(origin.materialItemId) &&
          trace.detail === `Composed controlled ${value.horizon === "short_term" ? "short_term_consequence" : "long_term_consequence"} material under Decision Engine authority from provenance ${origin.sourceRef}.`);
        if (!receipt || receipt.source !== "engine_inference" || receipt.userConfirmed !== false ||
            typeof receipt.claim !== "string" || normalizeConsequenceDescription(receipt.claim) !== normalizeConsequenceDescription(value.description as string) ||
            !receiptTrace || (value.scenarioId !== undefined && !(receiptTrace.sourceEntityIds as unknown[]).includes(value.scenarioId)) ||
            (receiptTrace.sourceEntityIds as unknown[]).some((id) => optionIds.has(id as string) && id !== value.optionId)) return false;
        for (const id of receiptTrace.sourceEntityIds as unknown[]) {
          if (boundedConsequenceRef(id) && !materialIds.has(id)) supportedSources.add(id);
        }
        originKey = JSON.stringify([origin.source, origin.materialItemId, origin.sourceRef]);
      } else if (origin.source === "deterministic_rule") {
        if (!keys(origin, ["source", "ruleId"]) || !boundedConsequenceRef(origin.ruleId)) return false;
        // A bounded rule identity is not an independent verification claim.
        originKey = JSON.stringify([origin.source, origin.ruleId]);
        sourceIds.forEach((id) => supportedSources.add(id));
      } else if (origin.source === "manual") {
        if (!keys(origin, ["source", "evidenceRefId"]) || !boundedConsequenceRef(origin.evidenceRefId) ||
            !evidence.some((entry) => entry.id === origin.evidenceRefId &&
              ["user_statement", "user_answer", "user_confirmed_memory"].includes(String(entry.source)))) return false;
        originKey = JSON.stringify([origin.source, origin.evidenceRefId]);
        sourceIds.forEach((id) => supportedSources.add(id));
      } else return false;
      if (seenOrigins.has(originKey)) return false;
      seenOrigins.add(originKey);
      return true;
    });
    return validOrigins && value.sourceEntityIds.every((id) => supportedSources.has(id));
  });
}
