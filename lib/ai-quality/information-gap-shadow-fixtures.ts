import "server-only";

import type { CandidateDecisionMaterial, CandidateDecisionMaterialItem } from "../ai-decision-material/contracts";
import { createInformationGapTargetCatalog, type InformationGapKind } from "../decision-engine/information-gap-observations";
import { createShadowSemanticDeltaCorpus, shadowCanonicalRequest, type ShadowFixture } from "./shadow-semantic-delta-fixtures";

export type InformationGapShadowFixture = {
  fixture: ShadowFixture;
  request: ReturnType<typeof shadowCanonicalRequest>;
  expected: { active: number; known: number; merged: number; traceOnly: number;
    materialities: string[]; wouldClarify: number; failure: string | null };
};

export function createInformationGapShadowFixtures(): InformationGapShadowFixture[] {
  const packet = structuredClone(createShadowSemanticDeltaCorpus().find((item) => item.caseId === "unknown_linked")!.packet) as CandidateDecisionMaterial;
  const original = shadowCanonicalRequest();
  const missing = structuredClone(original);
  missing.decisionContext.variables[0].value = { status: "unknown", reason: "Synthetic value was not supplied." };
  missing.decisionContext.variables[0].materiality = "important";
  missing.decisionContext.timeHorizon.shortTermWindow = { status: "unknown", reason: "Synthetic short-term window was not supplied." };
  const variableId = missing.decisionContext.variables[0].id;
  const ref = (request: typeof original, entityId: string, field: string, alias = 0) => {
    const entry = createInformationGapTargetCatalog(request)?.entries.find((item) => item.target.entityId === entityId && item.target.field === field);
    if (!entry?.sourceRefs[alias]) throw new Error("Synthetic gap target is not registered.");
    return entry.sourceRefs[alias];
  };
  const item = (kind: InformationGapKind, id: string, sourceRef: string, patch: Partial<CandidateDecisionMaterialItem> = {}): CandidateDecisionMaterialItem => ({
    ...structuredClone(packet.items[0]), candidate_id: id, item_type: kind, content: "Synthetic information may be missing.",
    provenance: { source: "provider_candidate", source_ref: sourceRef }, evidence: "unknown",
    option_refs: [], scenario_refs: [], criterion_refs: [sourceRef], ...patch,
  });
  const cases: InformationGapShadowFixture[] = [];
  const add = (caseId: string, request: typeof original, items: CandidateDecisionMaterialItem[],
    expected: Partial<InformationGapShadowFixture["expected"]> = {}) => {
    const value = { active: 1, known: 0, merged: 0, traceOnly: 0, materialities: ["material"], wouldClarify: 1, failure: null, ...expected };
    cases.push({ request, expected: value, fixture: {
      caseId, group: "semantic", candidateType: items[0].item_type as ShadowFixture["candidateType"], packet: { ...packet, items },
      expected: { accepted: value.failure ? 0 : items.length, duplicate: 0, failure: value.failure,
        substantive: false, uiMaterial: !value.failure, homeMaterial: false, saveMaterial: !value.failure, traceOnly: value.traceOnly > 0 },
    } });
  };
  add("gap_unknown_grounded", missing, [item("unknown", "gap_unknown", ref(missing, variableId, "value"))]);
  add("gap_clarification_grounded", missing, [item("clarification_need", "gap_clarification", ref(missing, variableId, "value"))]);
  add("gap_known_unknown_suppressed", original, [item("unknown", "gap_known", ref(original, variableId, "value"))],
    { active: 0, known: 1, materialities: [], wouldClarify: 0 });
  add("gap_mixed_kinds_merge", missing, [
    item("unknown", "gap_mixed_unknown", ref(missing, variableId, "value")),
    item("clarification_need", "gap_mixed_clarification", ref(missing, variableId, "value"), { content: "Different synthetic wording suggests a clarification." }),
  ], { merged: 1 });
  add("gap_ambiguous_targets", missing, [item("unknown", "gap_ambiguous", ref(missing, variableId, "value"), {
    criterion_refs: [ref(missing, variableId, "value"), ref(missing, missing.decisionContext.decisionId, "timeHorizon.decisionDeadline")],
  })], { active: 0, traceOnly: 1, materialities: [], wouldClarify: 0 });
  add("gap_invalid_target_rejected", missing, [item("unknown", "gap_invalid", "criterion_999")],
    { active: 0, materialities: [], wouldClarify: 0, failure: "unknown_source_ref" });
  add("gap_nonmaterial_time_window", missing, [item("unknown", "gap_window", ref(missing, missing.decisionContext.decisionId, "timeHorizon.shortTermWindow"))],
    { materialities: ["non_material"], wouldClarify: 0 });
  const critical = structuredClone(missing); critical.decisionContext.variables[0].materiality = "critical";
  add("gap_blocking_canonical_rule", critical, [item("unknown", "gap_blocking", ref(critical, variableId, "value"))], { materialities: ["blocking"] });
  const supporting = structuredClone(missing); supporting.decisionContext.variables[0].materiality = "supporting";
  add("gap_provider_critical_is_not_authority", supporting, [item("clarification_need", "gap_no_escalation", ref(supporting, variableId, "value"), {
    content: "Critical information may be missing in this synthetic context.", confidence: "high",
  })], { materialities: ["non_material"], wouldClarify: 0 });
  add("gap_generic_unknown_trace_only", missing, [item("unknown", "gap_generic", "unknown", { criterion_refs: [] })],
    { active: 0, traceOnly: 1, materialities: [], wouldClarify: 0 });
  const notApplicable = structuredClone(missing); notApplicable.decisionContext.variables[0].value = { status: "not_applicable", reason: "Synthetic field is not applicable." };
  add("gap_not_applicable_suppressed", notApplicable, [item("unknown", "gap_not_applicable", ref(notApplicable, variableId, "value"))],
    { active: 0, materialities: [], wouldClarify: 0 });
  add("gap_unregistered_provenance_rejected", missing, [item("unknown", "gap_constraint", "constraint_1", { criterion_refs: [] })],
    { active: 0, materialities: [], wouldClarify: 0, failure: "unknown_evidence_requires_unknown_source" });
  const scoped = structuredClone(missing); scoped.decisionContext.variables[0].affectedOptionIds = [scoped.decisionContext.options[0].id];
  add("gap_option_scope_mismatch", scoped, [item("clarification_need", "gap_bad_scope", ref(scoped, variableId, "value"), { option_refs: ["option_2"] })],
    { active: 0, traceOnly: 1, materialities: [], wouldClarify: 0 });
  add("gap_provenance_aliases_merge", missing, [
    item("unknown", "gap_alias_one", ref(missing, variableId, "value")),
    item("unknown", "gap_alias_two", ref(missing, variableId, "value", 1), { content: "Another wording for the same synthetic information gap." }),
  ], { merged: 1 });
  add("gap_known_clarification_suppressed", original, [item("clarification_need", "gap_known_clarification", ref(original, variableId, "value"))],
    { active: 0, known: 1, materialities: [], wouldClarify: 0 });
  add("gap_identical_text_distinct_targets", missing, [
    item("unknown", "gap_scope_one", ref(missing, variableId, "value")),
    item("unknown", "gap_scope_two", ref(missing, missing.decisionContext.decisionId, "timeHorizon.shortTermWindow")),
  ], { active: 2, materialities: ["material", "non_material"] });
  return cases;
}
