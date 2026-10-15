import "server-only";

import type { CandidateDecisionMaterial, CandidateDecisionMaterialItem } from "../ai-decision-material/contracts";
import { bridgeDecisionEngineToPromptContext } from "../ai-integration/decision-engine-prompt-context-bridge";
import { validateMaterialGrounding } from "../ai-provider/openai-decision-material-adapter";
import { createInformationGapShadowFixtures } from "../ai-quality/information-gap-shadow-fixtures";
import { normalizedShadowJson, shadowSaveProjection } from "../ai-quality/shadow-semantic-delta-evaluator";
import { createInformationGapTargetCatalog, bindInformationGapTarget, evaluateInformationGapObservations,
  informationGapSemanticKey } from "./information-gap-observations";
import { composePostProviderDecisionMaterial } from "./post-provider-boundary";
import { composePostProviderSimulationResponse } from "./post-provider-simulation-composition";
import { adaptSimulationResponseV2ToPublicSimulatorEnvelope, SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY } from "./simulation-response-public-adapter";
import { mapSimulationResponseV2ToUiModel } from "./simulation-response-v2-ui-mapping";
import { detectCriticalGaps } from "./gaps";
import { adaptControlledProductionAiResultToPublicV2Envelope } from "../runtime-integration/public-simulation-api-v2-adapter.server";
import type { ControlledServerRuntimeSelectionResult } from "../runtime-integration/controlled-simulator-runtime-switch-contracts";

/** Synthetic, pure validation. No transport, credentials, runtime client or writes. */
export function runInformationGapObservationsValidation() {
  const cases: { caseId: string; passed: boolean; issue?: string }[] = [];
  const check = (caseId: string, test: () => boolean) => {
    try { cases.push({ caseId, passed: test() }); }
    catch (error) { cases.push({ caseId, passed: false, issue: error instanceof Error ? error.message : "Validation failed." }); }
  };
  const fixtures = createInformationGapShadowFixtures();
  const sample = fixtures.find((item) => item.fixture.caseId === "gap_unknown_grounded")!;
  const request = sample.request;
  const packet = sample.fixture.packet as CandidateDecisionMaterial;
  const candidate = (change: Partial<CandidateDecisionMaterialItem> = {}) => ({ ...structuredClone(packet.items[0]), ...change });
  const boundary = (items = [candidate()], source = request) => {
    const result = composePostProviderDecisionMaterial({ boundaryId: "gap_foundation_validation",
      bridgeRequest: structuredClone(source), candidateMaterial: { ...packet, items } });
    if (result.status !== "composed") throw new Error(`Gap boundary failed: ${result.error.code}`);
    return result;
  };
  const evaluate = (result: ReturnType<typeof boundary>) => evaluateInformationGapObservations({
    request: { bridgeId: result.simulationSource.requestId, submittedAt: result.simulationSource.generatedAt,
      locale: request.locale, decisionContext: result.simulationSource.decisionContext,
      ...(result.simulationSource.safety ? { safety: result.simulationSource.safety } : {}) },
    controlled: result.controlledMaterial.items, accepted: result.acceptance.accepted_material.items, ledger: result.acceptance.ledger,
  });
  const requireGaps = (items = [candidate()], source = request) => {
    const result = evaluate(boundary(items, source));
    if (result.status !== "evaluated") throw new Error(result.rejectionReason);
    return result;
  };
  const prompt = bridgeDecisionEngineToPromptContext(request);
  if (prompt.status !== "ready") throw new Error("Synthetic bridge was not ready.");
  for (const { fixture, request: source, expected } of fixtures) {
    check(`${fixture.caseId}:bounded_behavior`, () => {
      const material = fixture.packet as CandidateDecisionMaterial;
      const bridge = bridgeDecisionEngineToPromptContext(source);
      if (bridge.status !== "ready") return false;
      const grounding = validateMaterialGrounding(material, bridge.promptContextOutput, source);
      if (expected.failure) return grounding.valid === false && grounding.failure.predicate === expected.failure &&
        composePostProviderDecisionMaterial({ boundaryId: "gap_failure", bridgeRequest: source, candidateMaterial: material }).status === "rejected";
      if (!grounding.valid) return false;
      const value = requireGaps(material.items, source);
      const active = value.observations.filter((entry) => entry.resolution === "ACTIVE");
      return active.length === expected.active &&
        value.observations.filter((entry) => entry.resolution === "SUPPRESSED_ALREADY_KNOWN").length === expected.known &&
        value.accounting.filter((entry) => entry.disposition === "DUPLICATE_MERGED").length === expected.merged &&
        value.accounting.filter((entry) => entry.disposition.startsWith("TRACE_ONLY")).length === expected.traceOnly &&
        normalizedShadowJson(active.map((entry) => entry.materiality).sort()) === normalizedShadowJson([...expected.materialities].sort()) &&
        active.filter((entry) => entry.wouldRequireClarification).length === expected.wouldClarify;
    });
  }
  const first = requireGaps().observations[0];
  const stable = (items: CandidateDecisionMaterialItem[], source = request) => requireGaps(items, source).observations[0].id === first.id;
  check("identity_uses_only_decision_entity_field", () => first.semanticKey === informationGapSemanticKey(first.target) &&
    /^gap_observation_[a-f0-9]{64}$/.test(first.id));
  check("wording_not_identity", () => stable([candidate({ content: "Different synthetic missing-information wording." })]));
  check("candidate_id_not_identity", () => stable([candidate({ candidate_id: "replacement_candidate" })]));
  check("semantic_kind_not_identity", () => stable([candidate({ item_type: "clarification_need" })]));
  check("provider_confidence_not_identity_or_authority", () => {
    const alternate = requireGaps([candidate({ confidence: "high" })]).observations[0];
    return alternate.id === first.id && alternate.materiality === first.materiality &&
      normalizedShadowJson(alternate.ruleEvidence) === normalizedShadowJson(first.ruleEvidence);
  });
  check("request_id_and_time_not_identity", () => stable([candidate()], { ...request,
    bridgeId: "later_request", submittedAt: "2026-10-13T12:00:00.000Z" }));
  check("decision_identity_separates_observations", () => {
    const source = structuredClone(request); source.decisionContext.decisionId = "other_decision";
    return requireGaps([candidate()], source).observations[0].id !== first.id;
  });
  check("canonical_value_status_not_identity", () => {
    const known = fixtures.find((item) => item.fixture.caseId === "gap_known_unknown_suppressed")!;
    return requireGaps((known.fixture.packet as CandidateDecisionMaterial).items, known.request).observations[0].id === first.id;
  });
  check("context_order_and_positional_ref_not_identity", () => {
    const source = structuredClone(request);
    source.decisionContext.variables.unshift({ ...structuredClone(source.decisionContext.variables[0]), id: "variable_other", name: "Other synthetic field" });
    const ref = createInformationGapTargetCatalog(source)!.entries.find((entry) => entry.target.entityId === first.target.entityId)!.sourceRefs[0];
    return stable([candidate({ provenance: { source: "provider_candidate", source_ref: ref }, criterion_refs: [ref] })], source);
  });
  check("full_and_short_source_alias_same_identity", () => {
    const ref = createInformationGapTargetCatalog(request)!.entries.find((entry) => entry.target.entityId === first.target.entityId)!.sourceRefs[1];
    return stable([candidate({ provenance: { source: "provider_candidate", source_ref: ref }, criterion_refs: [ref] })]);
  });
  check("upstream_exact_duplicate_retains_both_origins", () => {
    const value = requireGaps([candidate(), candidate({ candidate_id: "exact_duplicate", confidence: "high" })]);
    return value.observations.length === 1 && value.observations[0].origins.length === 2 && value.accounting.length === 2 &&
      value.accounting.some((entry) => entry.candidateId === "exact_duplicate" && entry.disposition === "DUPLICATE_MERGED");
  });
  check("mixed_kind_wording_order_stable_and_origins_preserved", () => {
    const other = candidate({ candidate_id: "clarification_origin", item_type: "clarification_need", content: "Another synthetic clarification observation." });
    const a = requireGaps([candidate(), other]), b = requireGaps([other, candidate()]);
    return a.observations.length === 1 && b.observations.length === 1 && a.observations[0].id === b.observations[0].id &&
      a.observations[0].kinds.length === 2 && a.observations[0].origins.length === 2 && b.observations[0].origins.length === 2;
  });
  check("known_value_not_overwritten_and_provenance_retained", () => {
    const known = fixtures.find((item) => item.fixture.caseId === "gap_known_unknown_suppressed")!;
    const before = normalizedShadowJson(known.request);
    const value = requireGaps((known.fixture.packet as CandidateDecisionMaterial).items, known.request);
    return before === normalizedShadowJson(known.request) && value.observations[0].resolution === "SUPPRESSED_ALREADY_KNOWN" &&
      value.observations[0].origins.length === 1 && !value.observations[0].wouldRequireClarification && value.observations[0].materiality === "non_material";
  });
  check("generic_unknown_cannot_gain_target_via_criterion_only", () => requireGaps([candidate({
    provenance: { source: "provider_candidate", source_ref: "unknown" },
  })]).accounting[0].disposition === "TRACE_ONLY_UNBOUND");
  check("duplicate_canonical_entity_is_ambiguous", () => {
    const source = structuredClone(request); source.decisionContext.assumptions[0].id = first.target.entityId;
    const catalog = createInformationGapTargetCatalog(source);
    return catalog !== null && bindInformationGapTarget(candidate(), catalog, source.decisionContext).status === "ambiguous";
  });
  check("duplicate_canonical_option_scope_is_ambiguous", () => {
    const source = structuredClone(request); source.decisionContext.options[1].id = source.decisionContext.options[0].id;
    const catalog = createInformationGapTargetCatalog(source);
    return catalog !== null && bindInformationGapTarget(candidate(), catalog, source.decisionContext).status === "ambiguous";
  });
  check("unsupported_target_identity_stays_generic_trace_only", () => {
    const source = structuredClone(request); source.decisionContext.decisionId = "unsupported decision identity";
    const value = requireGaps([candidate({ provenance: { source: "provider_candidate", source_ref: "unknown" }, criterion_refs: [] })], source);
    return value.observations.length === 0 && value.accounting[0].disposition === "TRACE_ONLY_UNBOUND";
  });
  for (const [field, classification] of [["successCriteria", "material"], ["feasible", "material"],
    ["interests", "non_material"], ["timeHorizon.decisionDeadline", "material"]] as const) {
    check(`${field}:whitelisted_field_and_deterministic_materiality`, () => {
      const source = structuredClone(request);
      source.decisionContext.goals[0].successCriteria = { status: "unknown", reason: "Synthetic success criteria were not supplied." };
      source.decisionContext.options[0].feasible = { status: "unknown", reason: "Synthetic feasibility was not supplied." };
      source.decisionContext.stakeholders = [{ id: "stakeholder_team", role: "Synthetic team", interests: { status: "unknown" },
        influence: "unknown", impactExposure: "unknown", evidenceRefs: [] }];
      source.decisionContext.timeHorizon.decisionDeadline = { status: "unknown", reason: "Synthetic deadline was not supplied." };
      const target = createInformationGapTargetCatalog(source)!.entries.find((entry) => entry.target.field === field)!;
      const ref = target.sourceRefs[0];
      const observation = requireGaps([candidate({ provenance: { source: "provider_candidate", source_ref: ref }, criterion_refs: [ref] })], source).observations[0];
      return observation.target.field === field && observation.materiality === classification && observation.resolution === "ACTIVE";
    });
  }
  check("unsafe_canonical_runtime_field_has_no_catalog", () => {
    const source = Object.assign(structuredClone(request), { userSystemPrompt: "Synthetic forbidden override." });
    return createInformationGapTargetCatalog(source) === null;
  });
  check("legacy_grounding_without_canonical_source_stays_strict", () => !validateMaterialGrounding(packet, prompt.promptContextOutput).valid);
  check("catalog_must_match_actual_prompt_frame", () => {
    const source = structuredClone(request); source.decisionContext.variables[0].name = "Different canonical field";
    return !validateMaterialGrounding(packet, prompt.promptContextOutput, source).valid;
  });
  check("catalog_must_match_actual_prompt_input_id", () =>
    !validateMaterialGrounding(packet, prompt.promptContextOutput, { ...request, bridgeId: "wrong_input_id" }).valid);
  for (const kind of ["dependency", "risk_signal", "short_term_consequence", "contradiction"] as const) {
    check(`${kind}:unknown_evidence_not_relaxed`, () => !validateMaterialGrounding({ ...packet,
      items: [candidate({ item_type: kind })] }, prompt.promptContextOutput, request).valid);
  }
  check("blocking_requires_real_critical_unknown_rule", () => {
    const value = fixtures.find((item) => item.fixture.caseId === "gap_blocking_canonical_rule")!;
    const observation = requireGaps((value.fixture.packet as CandidateDecisionMaterial).items, value.request).observations[0];
    const rules = detectCriticalGaps({ decisionInput: { contractVersion: "2.0", requestId: value.request.bridgeId, userIntent: "explore",
      input: { originalText: value.request.decisionContext.statement, inputLanguage: "es", requestedOutputLanguage: "es" } }, context: value.request.decisionContext });
    return observation.materiality === "blocking" && observation.ruleEvidence.ruleId === "detectCriticalGaps.critical_unknown" &&
      rules.some((rule) => rule.code === "critical_unknown" && rule.severity === "critical" && rule.affectedEntityIds.includes(observation.target.entityId));
  });
  check("no_rule_defaults_nonmaterial", () => {
    const value = fixtures.find((item) => item.fixture.caseId === "gap_provider_critical_is_not_authority")!;
    const gap = requireGaps((value.fixture.packet as CandidateDecisionMaterial).items, value.request).observations[0];
    return gap.materiality === "non_material" && gap.ruleEvidence.ruleId === "no_supported_materiality_rule" && !gap.wouldRequireClarification;
  });
  check("restricted_safety_no_would_clarify", () => {
    const source = structuredClone(request); source.safety!.level = "restricted";
    return !requireGaps([candidate()], source).observations[0].wouldRequireClarification;
  });
  const good = boundary();
  const tamper = (id: string, update: (value: typeof good) => void) => check(id, () => {
    const changed = structuredClone(good); update(changed);
    return evaluate(changed).status === "rejected" && composePostProviderSimulationResponse(changed).status === "rejected";
  });
  tamper("forged_content_rejected", (value) => { value.controlledMaterial.items[0].content = "Unaccepted replacement."; });
  tamper("forged_provenance_rejected", (value) => { value.controlledMaterial.items[0].sourceProvenanceRef = "unknown"; });
  tamper("forged_kind_rejected", (value) => { value.controlledMaterial.items[0].itemType = "clarification_need"; });
  tamper("forged_confidence_rejected", (value) => { value.controlledMaterial.items[0].confidence = "high"; });
  tamper("forged_material_id_rejected", (value) => { value.controlledMaterial.items[0].materialItemId = "forged_receipt"; });
  tamper("forged_option_link_rejected", (value) => { value.controlledMaterial.items[0].optionIds = ["option_wait"]; });
  tamper("forged_scenario_link_rejected", (value) => { value.controlledMaterial.items[0].scenarioOptionIds = ["option_wait"]; });
  tamper("forged_criterion_link_rejected", (value) => { value.controlledMaterial.items[0].criterionRefs = ["criterion_999"]; });
  tamper("forged_canonical_entity_rejected", (value) => { value.controlledMaterial.items[0].sourceContextEntityIds = [request.decisionContext.decisionId]; });
  tamper("forged_authority_rejected", (value) => { value.acceptance.accepted_material.items[0].authority = "decision_engine" as never; });
  tamper("missing_acceptance_receipt_rejected", (value) => { value.acceptance.ledger = []; });
  tamper("duplicate_ledger_receipt_rejected", (value) => { value.acceptance.ledger.push(structuredClone(value.acceptance.ledger[0])); });
  tamper("ledger_kind_mismatch_rejected", (value) => { value.acceptance.ledger[0].original_item_type = "clarification_need"; });
  tamper("ledger_trace_missing_rejected", (value) => { value.acceptance.ledger[0].traceability_marker = ""; });
  tamper("null_ledger_entry_fails_closed", (value) => { value.acceptance.ledger[0] = null as never; });
  tamper("malformed_ledger_mapping_fails_closed", (value) => { value.acceptance.ledger[0].downstream_mapping = undefined as never; });
  tamper("nonstring_ledger_trace_fails_closed", (value) => { value.acceptance.ledger[0].traceability_marker = 1 as never; });
  tamper("malformed_ledger_refs_fails_closed", (value) => { value.acceptance.ledger[0].downstream_mapping.target_refs = null as never; });
  tamper("ledger_target_mismatch_rejected", (value) => { value.acceptance.ledger[0].downstream_mapping.target_refs = []; });
  tamper("ledger_reason_mismatch_rejected", (value) => { value.acceptance.ledger[0].reason = "direct_recommendation_forbidden"; });
  tamper("ledger_normalized_target_mismatch_rejected", (value) => { value.acceptance.ledger[0].normalized_or_merged_item_id = "forged_candidate"; });
  tamper("accepted_invalid_ref_rechecked", (value) => {
    value.acceptance.accepted_material.items[0].criterion_refs = ["criterion_999"];
    value.controlledMaterial.items[0].criterionRefs = ["criterion_999"];
  });
  tamper("accepted_user_fact_with_unknown_source_rechecked", (value) => {
    value.acceptance.accepted_material.items[0].evidence = "user_fact_reference";
    value.acceptance.accepted_material.items[0].provenance.source_ref = "unknown";
    value.controlledMaterial.items[0].evidenceClassification = "user_fact_reference";
    value.controlledMaterial.items[0].sourceProvenanceRef = "unknown";
  });
  check("ledger_origin_bound_enforced", () => {
    const value = structuredClone(good);
    value.acceptance.ledger = Array.from({ length: 65 }, (_, index) => ({ ...structuredClone(value.acceptance.ledger[0]), candidate_id: `origin_${index}` }));
    return evaluate(value).status === "rejected";
  });
  check("empty_material_is_no_gap_no_lifecycle", () => {
    const value = evaluateInformationGapObservations({ request, controlled: [], accepted: [], ledger: [] });
    return value.status === "evaluated" && value.observations.length === 0 && value.questionsCreated === 0 && value.lifecycleTransitions === 0;
  });
  check("input_context_receipts_not_mutated", () => {
    const before = normalizedShadowJson(good); evaluate(good); composePostProviderSimulationResponse(good);
    return before === normalizedShadowJson(good);
  });
  check("sidecar_never_enters_public_ui_or_save_projection", () => {
    const value = composePostProviderSimulationResponse(good);
    if (value.status !== "composed") return false;
    const publicV2 = adaptControlledProductionAiResultToPublicV2Envelope({ selectedPath: "controlled_production_ai_v2",
      runtimeSource: "production_ai", fallback: { used: false }, response: value.response,
    } as ControlledServerRuntimeSelectionResult, { requestId: request.bridgeId, generatedAt: value.response.generatedAt,
      maxInputLength: 1200, maxBodyLength: 8192 });
    const outputs = [value.response, publicV2, adaptSimulationResponseV2ToPublicSimulatorEnvelope({ response: value.response,
      requestId: request.bridgeId, truthBoundary: SIMULATION_RESPONSE_PUBLIC_ADAPTER_TRUTH_BOUNDARY }),
      mapSimulationResponseV2ToUiModel(value.response), shadowSaveProjection(value.response)];
    return publicV2.status === "completed" && value.informationGaps.observations.length === 1 && outputs.every((output) =>
      !JSON.stringify(output).includes(first.id) && !JSON.stringify(output).includes('"informationGaps"'));
  });
  check("observation_has_no_provider_text_confidence_or_question", () => {
    const allowed = ["id", "semanticKey", "target", "kinds", "origins", "resolution", "materiality", "ruleEvidence", "wouldRequireClarification"].sort();
    return normalizedShadowJson(Object.keys(first).sort()) === normalizedShadowJson(allowed) &&
      !JSON.stringify(first).includes(candidate().content) && !/question|confidence|prompt|credential|rawProvider/.test(JSON.stringify(first));
  });
  return { passed: cases.every((item) => item.passed), cases, providerOperations: 0, questionsCreated: 0, lifecycleTransitions: 0 };
}
