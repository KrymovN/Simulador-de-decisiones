import "server-only";

import { createHash } from "node:crypto";
import type { CandidateDecisionMaterialItem, SemanticPreservationLedgerEntry } from "../ai-decision-material/contracts";
import { inspectCandidateDecisionMaterialContract } from "../ai-decision-material/acceptance";
import type { DecisionEnginePromptContextBridgeRequest } from "../ai-integration/contracts";
import { bridgeDecisionEngineToPromptContext, readableKnownValue } from "../ai-integration/decision-engine-prompt-context-bridge";
import type { PromptContextOutput } from "../prompt-context/contracts";
import type { DecisionEngineControlledMaterialItem } from "./post-provider-boundary";
import type { DecisionContext, KnownValue } from "./types";
import { detectCriticalGaps } from "./gaps";

export type InformationGapKind = "unknown" | "clarification_need";
export type InformationGapTarget = { decisionId: string; entityId: string; field: string };
export type InformationGapMateriality = "non_material" | "material" | "blocking";
export type InformationGapOrigin = {
  source: "controlled_material";
  candidateId: string;
  materialItemId: string;
  sourceRef: string;
  kind: InformationGapKind;
};
/** Internal observation, NOT a fact, CriticalGap, public question or lifecycle. */
export type InformationGapObservation = {
  id: string;
  semanticKey: string;
  target: InformationGapTarget;
  kinds: InformationGapKind[];
  origins: InformationGapOrigin[];
  resolution: "ACTIVE" | "SUPPRESSED_ALREADY_KNOWN" | "SUPPRESSED_NOT_APPLICABLE";
  materiality: InformationGapMateriality;
  ruleEvidence: { ruleId: string; entityId: string };
  wouldRequireClarification: boolean;
};
type CatalogEntry = {
  target: InformationGapTarget;
  semanticKey: string;
  sourceRefs: string[];
  valueStatus: KnownValue<unknown>["status"];
  optionIds: string[];
  ambiguousEntity: boolean;
  classification: Pick<InformationGapObservation, "materiality" | "ruleEvidence" | "wouldRequireClarification">;
};
export type InformationGapTargetCatalog = {
  promptFrameFingerprint: string;
  promptInputId: string;
  entries: CatalogEntry[];
};
export type InformationGapBinding =
  | { status: "bound"; entry: CatalogEntry }
  | { status: "unbound" | "ambiguous" };
export type InformationGapAccounting = {
  candidateId: string;
  materialItemId: string;
  kind: InformationGapKind;
  targetBound: boolean;
  observationId: string | null;
  disposition: "STRUCTURED_ACTIVE" | "SUPPRESSED_ALREADY_KNOWN" | "SUPPRESSED_NOT_APPLICABLE" |
    "DUPLICATE_MERGED" | "TRACE_ONLY_UNBOUND" | "TRACE_ONLY_AMBIGUOUS";
};
export type InformationGapEvaluation = {
  status: "evaluated" | "rejected";
  observations: InformationGapObservation[];
  accounting: InformationGapAccounting[];
  rejectionReason?: string;
  questionsCreated: 0;
  lifecycleTransitions: 0;
};

const MAX_OBSERVATIONS = 64;
const MAX_ORIGINS = 64;
const boundedRef = (value: string) => /^[a-z0-9][a-z0-9_-]{0,159}$/i.test(value);
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const normalize = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
function readableLedgerReceipt(value: SemanticPreservationLedgerEntry): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      typeof value.candidate_id !== "string" || typeof value.original_item_type !== "string" ||
      typeof value.disposition !== "string" || typeof value.reason !== "string" ||
      typeof value.traceability_marker !== "string" ||
      (value.normalized_or_merged_item_id !== undefined && typeof value.normalized_or_merged_item_id !== "string")) return false;
  const mapping = value.downstream_mapping;
  return mapping !== null && typeof mapping === "object" && !Array.isArray(mapping) &&
    ["mapped", "not_mapped"].includes(mapping.status) && Array.isArray(mapping.target_refs) &&
    mapping.target_refs.length <= 64 && mapping.target_refs.every((ref) => typeof ref === "string");
}
export const informationGapSemanticKey = (target: InformationGapTarget) =>
  JSON.stringify([target.decisionId, target.entityId, target.field]);

/** Uses the EXISTING emitted criterion refs and shared field formatter. It never
 * parses candidate prose, invents target names or changes the provider request. */
export function createInformationGapTargetCatalog(request: DecisionEnginePromptContextBridgeRequest): InformationGapTargetCatalog | null {
  const bridge = bridgeDecisionEngineToPromptContext(request);
  if (bridge.status !== "ready") return null;
  const context = request.decisionContext;
  const frame = bridge.promptContextOutput.contextFrame;
  // A valid but unsupported target identity remains unbound, not a new failure
  // for legacy generic/trace-only material.
  const emptyCatalog: InformationGapTargetCatalog = { promptFrameFingerprint: hash(frame),
    promptInputId: bridge.promptContextOutput.inputId, entries: [] };
  if (!boundedRef(context.decisionId)) return emptyCatalog;
  const ids = [context.decisionId, ...context.goals.map((item) => item.id), ...context.options.map((item) => item.id),
    ...context.variables.map((item) => item.id), ...context.constraints.map((item) => item.id), ...context.stakeholders.map((item) => item.id),
    ...context.assumptions.map((item) => item.id), ...context.evidence.map((item) => item?.id)];
  const existingOptions = new Set(context.options.map((item) => item.id));
  const entries: CatalogEntry[] = [];
  const add = (entityId: string, field: string, value: KnownValue<unknown>, labels: string[], optionIds: string[],
    classification: CatalogEntry["classification"]) => {
    if (!boundedRef(entityId) || optionIds.some((id) => !existingOptions.has(id))) return;
    const sourceRefs = [...new Set(labels.map(normalize).flatMap((label) => {
      const index = frame.tradeoffFocus.indexOf(label);
      return index === -1 ? [] : [`criterion_${index + 1}`];
    }))];
    if (sourceRefs.length === 0) return;
    const target = { decisionId: context.decisionId, entityId, field };
    entries.push({ target, semanticKey: informationGapSemanticKey(target), sourceRefs, valueStatus: value.status,
      optionIds: [...optionIds], ambiguousEntity: ids.filter((id) => id === entityId).length !== 1 ||
        optionIds.some((id) => context.options.filter((option) => option.id === id).length !== 1),
      classification: { ...classification, wouldRequireClarification: classification.wouldRequireClarification &&
        (request.safety === undefined || request.safety.level === "standard") } });
  };
  const nonMaterial = (entityId: string): CatalogEntry["classification"] => ({ materiality: "non_material",
    ruleEvidence: { ruleId: "no_supported_materiality_rule", entityId }, wouldRequireClarification: false });
  const material = (entityId: string, ruleId: string): CatalogEntry["classification"] => ({ materiality: "material",
    ruleEvidence: { ruleId, entityId }, wouldRequireClarification: true });
  const allOptions = context.options.map((item) => item.id);
  for (const goal of context.goals) add(goal.id, "successCriteria", goal.successCriteria, [
    ...(goal.successCriteria.status === "unknown" ? [readableKnownValue(`Goal ${goal.id} success criteria`, goal.successCriteria)] : []),
    ...(goal.successCriteria.status === "known" ? goal.successCriteria.value.map((criterion) => `Decision criterion for ${goal.id}: ${criterion}`) : []),
  ], allOptions, goal.priority === "primary" ? material(goal.id, "context_builder.missing_success_criteria") : nonMaterial(goal.id));
  for (const option of context.options) add(option.id, "feasible", option.feasible,
    option.feasible.status === "unknown" ? [readableKnownValue(`Option ${option.id} feasibility`, option.feasible)] : [],
    [option.id], material(option.id, "context_builder.missing_feasibility"));
  for (const variable of context.variables) {
    const critical = variable.value.status === "unknown" && variable.materiality === "critical" && detectCriticalGaps({
      decisionInput: { contractVersion: "2.0", requestId: request.bridgeId, userIntent: "explore",
        input: { originalText: context.statement, inputLanguage: request.locale, requestedOutputLanguage: request.locale } },
      context,
    }).some((gap) => gap.code === "critical_unknown" && gap.severity === "critical" && gap.affectedEntityIds.includes(variable.id));
    const classification: CatalogEntry["classification"] = critical
      ? { materiality: "blocking", ruleEvidence: { ruleId: "detectCriticalGaps.critical_unknown", entityId: variable.id }, wouldRequireClarification: true }
      : variable.materiality === "important" ? material(variable.id, "canonical_variable.important_materiality") : nonMaterial(variable.id);
    add(variable.id, "value", variable.value, [
      `${readableKnownValue(`Variable ${variable.id} (${variable.name})`, variable.value)}; materiality: ${variable.materiality}; volatility: ${variable.volatility}`,
      ...(variable.value.status === "unknown" ? [readableKnownValue(`Variable ${variable.id}`, variable.value)] : []),
    ], variable.affectedOptionIds.length ? variable.affectedOptionIds : allOptions, classification);
  }
  for (const stakeholder of context.stakeholders) add(stakeholder.id, "interests", stakeholder.interests, [
    `${readableKnownValue(`Stakeholder ${stakeholder.id} (${stakeholder.role}) interests`, stakeholder.interests)}; influence: ${stakeholder.influence}; exposure: ${stakeholder.impactExposure}`,
    ...(stakeholder.interests.status === "unknown" ? [readableKnownValue(`Stakeholder ${stakeholder.id} interests`, stakeholder.interests)] : []),
  ], allOptions, nonMaterial(stakeholder.id));
  for (const [field, value] of Object.entries(context.timeHorizon)) add(context.decisionId, `timeHorizon.${field}`, value,
    [readableKnownValue(`Time horizon ${field}`, value)], allOptions,
    field === "decisionDeadline" ? material(context.decisionId, "context_builder.missing_deadline") : nonMaterial(context.decisionId));
  if (entries.length > 128) return emptyCatalog;
  return { promptFrameFingerprint: hash(frame), promptInputId: bridge.promptContextOutput.inputId, entries };
}

export function registeredInformationGapSourceRef(sourceRef: string, catalog: InformationGapTargetCatalog | null): boolean {
  return catalog?.entries.some((entry) => entry.sourceRefs.includes(sourceRef)) === true;
}

export function informationGapCatalogMatchesPrompt(catalog: InformationGapTargetCatalog | null, prompt: PromptContextOutput): boolean {
  return catalog !== null && catalog.promptInputId === prompt.inputId && catalog.promptFrameFingerprint === hash(prompt.contextFrame);
}

export function bindInformationGapTarget(candidate: CandidateDecisionMaterialItem, catalog: InformationGapTargetCatalog,
  context: DecisionContext): InformationGapBinding {
  const refs = [candidate.provenance.source_ref, ...candidate.criterion_refs];
  const candidates = catalog.entries.filter((entry) => entry.sourceRefs.some((ref) => refs.includes(ref)));
  const keys = new Set(candidates.map((entry) => entry.semanticKey));
  if (keys.size > 1 || candidates.some((entry) => entry.ambiguousEntity)) return { status: "ambiguous" };
  const entry = candidates[0];
  // Generic provenance never gains authority from an inferred prose match.
  if (!entry || !entry.sourceRefs.includes(candidate.provenance.source_ref)) return { status: "unbound" };
  const optionIds = [...candidate.option_refs, ...candidate.scenario_refs].map((ref) =>
    context.options[Number(ref.slice(ref.lastIndexOf("_") + 1)) - 1]?.id);
  if (optionIds.some((id) => !id || !entry.optionIds.includes(id))) return { status: "ambiguous" };
  return { status: "bound", entry };
}

/** Pure engine-owned evaluation sidecar; no context mutation or public output. */
export function evaluateInformationGapObservations(input: {
  request: DecisionEnginePromptContextBridgeRequest;
  controlled: DecisionEngineControlledMaterialItem[];
  accepted: CandidateDecisionMaterialItem[];
  ledger: SemanticPreservationLedgerEntry[];
}): InformationGapEvaluation {
  const empty = { observations: [], accounting: [], questionsCreated: 0 as const, lifecycleTransitions: 0 as const };
  const reject = (rejectionReason: string): InformationGapEvaluation => ({ ...empty, status: "rejected", rejectionReason });
  const items = input.controlled.filter((item) => item.itemType === "unknown" || item.itemType === "clarification_need");
  if (items.length === 0) return { ...empty, status: "evaluated" };
  const catalog = createInformationGapTargetCatalog(input.request);
  if (!catalog) return reject("canonical_target_catalog_invalid");
  const inspected = inspectCandidateDecisionMaterialContract({ capability: "candidate_decision_material_v1", contract_version: "1.0",
    generation_status: "completed", classification: "synthetic_non_personal", items: input.accepted });
  if (!inspected.schemaValid || !inspected.safetyValid) return reject("accepted_gap_material_invalid");
  if (input.ledger.length > MAX_ORIGINS || items.length > MAX_OBSERVATIONS) return reject("gap_observation_bounds_exceeded");
  if (!input.ledger.every(readableLedgerReceipt)) return reject("gap_ledger_receipt_invalid");
  if (new Set(input.ledger.map((entry) => entry.candidate_id)).size !== input.ledger.length ||
      new Set(items.map((entry) => entry.materialItemId)).size !== items.length) return reject("gap_duplicate_receipt");
  const bridge = bridgeDecisionEngineToPromptContext(input.request);
  if (bridge.status !== "ready") return reject("canonical_target_catalog_invalid");
  const frame = bridge.promptContextOutput.contextFrame;
  const allowedSourceRefs = new Set(["objective_1", "question_1", "unknown",
    ...frame.knownConstraints.map((_, index) => `constraint_${index + 1}`),
    ...frame.scenarioSeeds.flatMap((_, index) => [`option_${index + 1}`, `scenario_${index + 1}`]),
    ...frame.tradeoffFocus.map((_, index) => `criterion_${index + 1}`)]);
  const mapOptions = (refs: string[], prefix: string) => refs.map((ref) =>
    new RegExp(`^${prefix}_[1-9]\\d*$`).test(ref) ? input.request.decisionContext.options[Number(ref.slice(prefix.length + 1)) - 1]?.id : undefined);
  const sameRefs = (a: string[], b: string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  const observations = new Map<string, InformationGapObservation>();
  const accounting: InformationGapAccounting[] = [];
  let originCount = 0;
  for (const item of items) {
    const candidate = input.accepted.find((entry) => entry.candidate_id === item.sourceCandidateIds[0]);
    if (!candidate || item.sourceCandidateIds.length !== 1 || candidate.item_type !== item.itemType || candidate.content !== item.content ||
        candidate.provenance.source_ref !== item.sourceProvenanceRef || candidate.evidence !== item.evidenceClassification ||
        candidate.confidence !== item.confidence || JSON.stringify(candidate.criterion_refs) !== JSON.stringify(item.criterionRefs) ||
        candidate.authority !== "candidate_only" || item.authority !== "decision_engine" ||
        item.materialItemId !== `decision_material_${input.accepted.indexOf(candidate) + 1}_${candidate.candidate_id}` ||
        JSON.stringify(mapOptions(candidate.option_refs, "option")) !== JSON.stringify(item.optionIds) ||
        JSON.stringify(mapOptions(candidate.scenario_refs, "scenario")) !== JSON.stringify(item.scenarioOptionIds)) return reject("controlled_gap_receipt_mismatch");
    if (!allowedSourceRefs.has(candidate.provenance.source_ref) ||
        candidate.criterion_refs.some((ref) => !/^criterion_[1-9]\d*$/.test(ref) || !allowedSourceRefs.has(ref)) ||
        mapOptions(candidate.option_refs, "option").some((id) => !id) || mapOptions(candidate.scenario_refs, "scenario").some((id) => !id) ||
        (["user_fact_reference", "user_assumption_reference"].includes(candidate.evidence) && candidate.provenance.source_ref === "unknown") ||
        (candidate.evidence === "provider_inference" && candidate.provenance.source_ref === "unknown") ||
        (candidate.evidence === "unknown" && candidate.provenance.source_ref !== "unknown" &&
          !registeredInformationGapSourceRef(candidate.provenance.source_ref, catalog))) return reject("accepted_gap_reference_invalid");
    const binding = bindInformationGapTarget(candidate, catalog, input.request.decisionContext);
    const ledger = input.ledger.filter((entry) => entry.candidate_id === candidate.candidate_id ||
      (entry.disposition === "merged_as_duplicate" && entry.normalized_or_merged_item_id === candidate.candidate_id));
    if (ledger.filter((entry) => entry.candidate_id === candidate.candidate_id &&
        ["accepted", "accepted_with_normalization"].includes(entry.disposition)).length !== 1) return reject("gap_acceptance_receipt_missing");
    for (const receipt of ledger) {
      const acceptedReceipt = receipt.candidate_id === candidate.candidate_id;
      const expectedRefs = [...candidate.option_refs, ...candidate.scenario_refs, ...candidate.criterion_refs];
      if (receipt.original_item_type !== candidate.item_type || !boundedRef(receipt.candidate_id) ||
          !receipt.traceability_marker.startsWith(`trace_candidate_${receipt.candidate_id}_`) ||
          !/_[1-9]\d*$/.test(receipt.traceability_marker) ||
          receipt.downstream_mapping.status !== (expectedRefs.length ? "mapped" : "not_mapped") ||
          !sameRefs(receipt.downstream_mapping.target_refs, expectedRefs) ||
          (acceptedReceipt ? !["accepted_valid", "normalized_whitespace"].includes(receipt.reason) ||
            (receipt.normalized_or_merged_item_id !== undefined && receipt.normalized_or_merged_item_id !== candidate.candidate_id)
            : receipt.reason !== "duplicate_semantic_content" || input.accepted.some((entry) => entry.candidate_id === receipt.candidate_id))) {
        return reject("gap_ledger_receipt_invalid");
      }
      const kind = item.itemType as InformationGapKind;
      const base = { candidateId: receipt.candidate_id, materialItemId: item.materialItemId, kind };
      if (binding.status !== "bound") {
        accounting.push({ ...base, targetBound: false, observationId: null,
          disposition: binding.status === "ambiguous" ? "TRACE_ONLY_AMBIGUOUS" : "TRACE_ONLY_UNBOUND" });
        continue;
      }
      const entry = binding.entry;
      if (JSON.stringify(item.sourceContextEntityIds) !== JSON.stringify([entry.target.entityId])) return reject("gap_canonical_source_mismatch");
      const known = entry.valueStatus === "known", notApplicable = entry.valueStatus === "not_applicable";
      const resolution = known ? "SUPPRESSED_ALREADY_KNOWN" : notApplicable ? "SUPPRESSED_NOT_APPLICABLE" : "ACTIVE";
      const existing = observations.get(entry.semanticKey);
      const id = `gap_observation_${hash(entry.target)}`;
      const origin: InformationGapOrigin = { source: "controlled_material", ...base, sourceRef: candidate.provenance.source_ref };
      if (++originCount > MAX_ORIGINS) return reject("gap_origin_bounds_exceeded");
      observations.set(entry.semanticKey, {
        id, semanticKey: entry.semanticKey, target: { ...entry.target }, resolution,
        kinds: [...new Set([...(existing?.kinds ?? []), kind])].sort(),
        origins: [...(existing?.origins ?? []), origin].sort((a, b) => a.candidateId.localeCompare(b.candidateId, "en")),
        ...(known || notApplicable ? { materiality: "non_material" as const,
          ruleEvidence: { ruleId: known ? "canonical_value_known" : "canonical_value_not_applicable", entityId: entry.target.entityId },
          wouldRequireClarification: false } : entry.classification),
      });
      accounting.push({ ...base, targetBound: true, observationId: id,
        disposition: existing ? "DUPLICATE_MERGED" : known ? "SUPPRESSED_ALREADY_KNOWN" : notApplicable ? "SUPPRESSED_NOT_APPLICABLE" : "STRUCTURED_ACTIVE" });
    }
  }
  return { status: "evaluated", observations: [...observations.values()].sort((a, b) => a.id.localeCompare(b.id, "en")),
    accounting, questionsCreated: 0, lifecycleTransitions: 0 };
}
