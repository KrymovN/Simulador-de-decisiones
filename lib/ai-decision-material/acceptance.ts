import "server-only";

import {
  CANDIDATE_DECISION_MATERIAL_CAPABILITY,
  CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
  CANDIDATE_DECISION_MATERIAL_MODE,
  DECISION_MATERIAL_ITEM_TYPES,
  type AcceptedDecisionMaterial,
  type CandidateDecisionMaterialItem,
  type DecisionMaterialAcceptanceContext,
  type DecisionMaterialAcceptanceResult,
  type DecisionMaterialItemType,
  type SemanticPreservationLedgerEntry,
  type SemanticPreservationReason,
} from "./contracts";

const MATERIAL_KEYS = [
  "capability",
  "contract_version",
  "generation_status",
  "classification",
  "items",
] as const;

const ITEM_KEYS = [
  "candidate_id",
  "item_type",
  "content",
  "provenance",
  "confidence",
  "evidence",
  "option_refs",
  "scenario_refs",
  "criterion_refs",
  "authority",
  "capability",
  "contract_version",
] as const;

const CONFIDENCE_VALUES = ["low", "medium", "high", "unknown"] as const;
const EVIDENCE_VALUES = [
  "user_fact_reference",
  "user_assumption_reference",
  "provider_inference",
  "unknown",
] as const;
const MAX_ITEMS = 64;
const MAX_CONTENT_LENGTH = 600;

const privacyPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?\d[\d\s().-]{7,}\d)\b/,
  /\b(?:owner|principal|session|account|user)[_-]?id\s*[:=]\s*[\w-]+/i,
  /\b(?:access token|refresh token|auth token|billing account)\s*[:=]/i,
] as const;

const injectionPatterns = [
  /\bignore (?:all |the )?previous\b/i,
  /\b(?:system prompt|developer message|instrucciones del sistema)\b/i,
  /\b(?:change|override|bypass|cambia|ignora)\b.{0,40}\b(?:policy|authority|consent|safety|pol[ií]tica|autoridad|consentimiento)\b/i,
] as const;

const secretOrReasoningPatterns = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /\b(?:chain[- ]of[- ]thought|razonamiento interno|hidden reasoning)\b/i,
  /\b(?:api key|provider secret)\s*[:=]/i,
] as const;

const recommendationPatterns = [
  /\b(?:I recommend|recommended option|best option|optimal option)\b/i,
  /\b(?:recomiendo|opci[oó]n recomendada|mejor opci[oó]n|opci[oó]n [oó]ptima)\b/i,
] as const;

const imperativePatterns = [
  /^(?:choose|select|do|buy|accept|reject|elige|escoge|compra|acepta|rechaza)\b/i,
  /\b(?:you must|you should|debes|deber[ií]as)\b/i,
] as const;

const certaintyPatterns = [
  /\b(?:guaranteed|certain outcome|will definitely|garantizado|sin ninguna duda|ocurrir[aá] con certeza)\b/i,
  /\b\d{1,3}(?:[.,]\d+)?\s*%\s+(?:probability|chance|probabilidad|posibilidad)\b/i,
] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

function boundedId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{2,79}$/i.test(value);
}

function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 16 &&
    value.every((item) => boundedId(item)) && new Set(value).size === value.length;
}

function matchesAny(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function normalizedContent(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizedDuplicateKey(item: CandidateDecisionMaterialItem): string {
  return `${item.item_type}:${normalizedContent(item.content)
    .toLocaleLowerCase("es-ES")
    .replace(/[.,;:!?]+$/g, "")}`;
}

function emptyAcceptedMaterial(): AcceptedDecisionMaterial {
  return {
    capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
    contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
    mode: CANDIDATE_DECISION_MATERIAL_MODE,
    items: [],
  };
}

function mapping(
  item: Pick<CandidateDecisionMaterialItem, "option_refs" | "scenario_refs" | "criterion_refs">,
) {
  const targetRefs = [...item.option_refs, ...item.scenario_refs, ...item.criterion_refs];
  return targetRefs.length > 0
    ? { status: "mapped" as const, target_refs: targetRefs }
    : { status: "not_mapped" as const, target_refs: [], reason: "no_known_mapping" as const };
}

function rejectedMapping() {
  return {
    status: "not_mapped" as const,
    target_refs: [],
    reason: "rejected_before_mapping" as const,
  };
}

function ledgerEntry(
  candidateId: string,
  itemType: DecisionMaterialItemType | "unknown",
  disposition: SemanticPreservationLedgerEntry["disposition"],
  reason: SemanticPreservationReason,
  sequence: number,
  extra: Partial<Pick<SemanticPreservationLedgerEntry, "normalized_or_merged_item_id" | "downstream_mapping">> = {},
): SemanticPreservationLedgerEntry {
  return {
    candidate_id: candidateId,
    original_item_type: itemType,
    disposition,
    reason,
    downstream_mapping: extra.downstream_mapping ?? rejectedMapping(),
    traceability_marker: `trace_candidate_${candidateId}_${sequence}`,
    ...(extra.normalized_or_merged_item_id
      ? { normalized_or_merged_item_id: extra.normalized_or_merged_item_id }
      : {}),
  };
}

function controlledFailure(
  reason: SemanticPreservationReason,
  observed: number,
  ledger: SemanticPreservationLedgerEntry[] = [],
): DecisionMaterialAcceptanceResult {
  const failureLedger = ledger.length > 0
    ? ledger
    : [ledgerEntry("material_contract", "unknown", "controlled_failure", reason, 1)];
  return {
    status: "controlled_failure",
    accepted_material: emptyAcceptedMaterial(),
    ledger: failureLedger,
    warnings: [reason],
    observed_candidate_count: observed,
    silent_drop_count: 0,
    raw_provider_material_persisted: false,
  };
}

function controlledItemLedger(
  items: unknown[],
  reason: SemanticPreservationReason,
): SemanticPreservationLedgerEntry[] {
  return items.map((item, index) => ledgerEntry(
    record(item) && boundedId(item.candidate_id)
      ? item.candidate_id
      : `unresolved_candidate_${index + 1}`,
    record(item) && DECISION_MATERIAL_ITEM_TYPES.includes(item.item_type as DecisionMaterialItemType)
      ? item.item_type as DecisionMaterialItemType
      : "unknown",
    "controlled_failure",
    reason,
    index + 1,
  ));
}

function preliminaryReason(value: unknown): SemanticPreservationReason | undefined {
  if (!record(value)) return "schema_invalid";
  if (!exactKeys(value, ITEM_KEYS)) return "unknown_field";
  if (!boundedId(value.candidate_id) ||
      typeof value.content !== "string" || !value.content.trim()) return "schema_invalid";
  if (!DECISION_MATERIAL_ITEM_TYPES.includes(value.item_type as DecisionMaterialItemType)) {
    return "item_type_invalid";
  }
  if (!record(value.provenance) || !exactKeys(value.provenance, ["source", "source_ref"]) ||
      value.provenance.source !== "provider_candidate" || !boundedId(value.provenance.source_ref)) {
    return "missing_provenance";
  }
  if (!CONFIDENCE_VALUES.includes(value.confidence as never)) return "schema_invalid";
  if (!EVIDENCE_VALUES.includes(value.evidence as never)) return "evidence_classification_invalid";
  if (!stringList(value.option_refs) || !stringList(value.scenario_refs) || !stringList(value.criterion_refs)) {
    return "schema_invalid";
  }
  if (value.authority !== "candidate_only") return "authority_classification_invalid";
  if (value.capability !== CANDIDATE_DECISION_MATERIAL_CAPABILITY ||
      value.contract_version !== CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION) {
    return "capability_version_invalid";
  }
  if (value.content.length > MAX_CONTENT_LENGTH) return "excessive_length";
  return undefined;
}

function semanticRejectionReason(content: string): SemanticPreservationReason | undefined {
  if (matchesAny(content, privacyPatterns)) return "personal_data_detected";
  if (matchesAny(content, injectionPatterns)) return "prompt_injection_content";
  if (matchesAny(content, secretOrReasoningPatterns)) return "raw_reasoning_or_secret";
  if (matchesAny(content, recommendationPatterns)) return "direct_recommendation_forbidden";
  if (matchesAny(content, imperativePatterns)) return "imperative_instruction_forbidden";
  if (matchesAny(content, certaintyPatterns)) return "unsupported_certainty_forbidden";
  return undefined;
}

function semanticDisposition(reason: SemanticPreservationReason) {
  if (reason === "personal_data_detected") return "rejected_privacy" as const;
  if (["prompt_injection_content", "raw_reasoning_or_secret"].includes(reason)) {
    return "rejected_unsafe" as const;
  }
  if ([
    "direct_recommendation_forbidden",
    "imperative_instruction_forbidden",
    "unsupported_certainty_forbidden",
    "authority_classification_invalid",
  ].includes(reason)) return "rejected_unsupported_authority" as const;
  return "rejected_invalid" as const;
}

export function acceptCandidateDecisionMaterial(
  input: unknown,
  context: DecisionMaterialAcceptanceContext,
): DecisionMaterialAcceptanceResult {
  if (!record(input)) return controlledFailure("critical_contract_failure", 0);
  const observedItems = Array.isArray(input.items) ? input.items : [];
  if (!exactKeys(input, MATERIAL_KEYS) || !Array.isArray(input.items)) {
    return controlledFailure(
      "critical_contract_failure",
      observedItems.length,
      controlledItemLedger(observedItems, "critical_contract_failure"),
    );
  }
  if (input.capability !== CANDIDATE_DECISION_MATERIAL_CAPABILITY ||
      input.contract_version !== CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION ||
      input.generation_status !== "completed" || input.classification !== "synthetic_non_personal") {
    return controlledFailure(
      "capability_version_invalid",
      input.items.length,
      controlledItemLedger(input.items, "capability_version_invalid"),
    );
  }
  if (input.items.length > MAX_ITEMS) {
    return controlledFailure(
      "excessive_item_count",
      input.items.length,
      controlledItemLedger(input.items, "excessive_item_count"),
    );
  }

  const accepted: CandidateDecisionMaterialItem[] = [];
  const ledger: SemanticPreservationLedgerEntry[] = [];
  const warnings = new Set<SemanticPreservationReason>();
  const acceptedByDuplicateKey = new Map<string, string>();
  const candidateIds = new Set<string>();
  const allowedOptionRefs = new Set(context.allowed_option_refs);
  const allowedScenarioRefs = new Set(context.allowed_scenario_refs);
  const allowedCriterionRefs = new Set(context.allowed_criterion_refs);

  input.items.forEach((rawItem, index) => {
    const fallbackId = `unresolved_candidate_${index + 1}`;
    const candidateId = record(rawItem) && boundedId(rawItem.candidate_id)
      ? rawItem.candidate_id
      : fallbackId;
    const itemType = record(rawItem) && DECISION_MATERIAL_ITEM_TYPES.includes(rawItem.item_type as DecisionMaterialItemType)
      ? rawItem.item_type as DecisionMaterialItemType
      : "unknown";
    const preliminary = preliminaryReason(rawItem);
    if (preliminary || candidateIds.has(candidateId)) {
      const reason = candidateIds.has(candidateId) ? "schema_invalid" : preliminary ?? "schema_invalid";
      warnings.add(reason);
      ledger.push(ledgerEntry(candidateId, itemType, semanticDisposition(reason), reason, index + 1));
      return;
    }
    candidateIds.add(candidateId);
    const item = rawItem as CandidateDecisionMaterialItem;
    const semanticReason = semanticRejectionReason(item.content);
    if (semanticReason) {
      warnings.add(semanticReason);
      ledger.push(ledgerEntry(candidateId, item.item_type, semanticDisposition(semanticReason), semanticReason, index + 1));
      return;
    }
    if (context.contradictory_candidate_ids.includes(candidateId)) {
      warnings.add("deterministic_context_contradiction");
      ledger.push(ledgerEntry(candidateId, item.item_type, "rejected_invalid", "deterministic_context_contradiction", index + 1));
      return;
    }
    if (context.irrelevant_candidate_ids.includes(candidateId)) {
      warnings.add("deterministically_irrelevant");
      ledger.push(ledgerEntry(candidateId, item.item_type, "rejected_irrelevant", "deterministically_irrelevant", index + 1));
      return;
    }
    if (!item.option_refs.every((ref) => allowedOptionRefs.has(ref)) ||
        !item.scenario_refs.every((ref) => allowedScenarioRefs.has(ref)) ||
        !item.criterion_refs.every((ref) => allowedCriterionRefs.has(ref))) {
      warnings.add("invalid_reference");
      ledger.push(ledgerEntry(candidateId, item.item_type, "rejected_invalid", "invalid_reference", index + 1));
      return;
    }

    const normalized = normalizedContent(item.content);
    const normalizedItem = { ...item, content: normalized };
    const duplicateKey = normalizedDuplicateKey(normalizedItem);
    const duplicateTarget = acceptedByDuplicateKey.get(duplicateKey);
    if (duplicateTarget) {
      warnings.add("duplicate_semantic_content");
      ledger.push(ledgerEntry(
        candidateId,
        item.item_type,
        "merged_as_duplicate",
        "duplicate_semantic_content",
        index + 1,
        { normalized_or_merged_item_id: duplicateTarget, downstream_mapping: mapping(normalizedItem) },
      ));
      return;
    }

    accepted.push(normalizedItem);
    acceptedByDuplicateKey.set(duplicateKey, candidateId);
    const wasNormalized = normalized !== item.content;
    if (wasNormalized) warnings.add("normalized_whitespace");
    ledger.push(ledgerEntry(
      candidateId,
      item.item_type,
      wasNormalized ? "accepted_with_normalization" : "accepted",
      wasNormalized ? "normalized_whitespace" : "accepted_valid",
      index + 1,
      {
        ...(wasNormalized ? { normalized_or_merged_item_id: candidateId } : {}),
        downstream_mapping: mapping(normalizedItem),
      },
    ));
  });

  return {
    status: "accepted",
    accepted_material: {
      capability: CANDIDATE_DECISION_MATERIAL_CAPABILITY,
      contract_version: CANDIDATE_DECISION_MATERIAL_CONTRACT_VERSION,
      mode: CANDIDATE_DECISION_MATERIAL_MODE,
      items: accepted,
    },
    ledger,
    warnings: [...warnings],
    observed_candidate_count: input.items.length,
    silent_drop_count: 0,
    raw_provider_material_persisted: false,
  };
}
