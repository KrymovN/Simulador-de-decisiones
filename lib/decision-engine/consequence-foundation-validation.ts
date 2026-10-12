import "server-only";

import { createHash } from "node:crypto";
import type { CandidateDecisionMaterial, CandidateDecisionMaterialItem } from "../ai-decision-material/contracts";
import { createShadowSemanticDeltaCorpus, shadowCanonicalRequest } from "../ai-quality/shadow-semantic-delta-fixtures";
import { normalizedShadowJson, shadowSaveProjection } from "../ai-quality/shadow-semantic-delta-evaluator";
import { mapSimulationRecordToDecisionSimulation } from "../saved-decision-simulations/runtime";
import type { SimulationRecordRow } from "../persistence-runtime/contracts";
import { adaptControlledProductionAiResultToPublicV2Envelope } from "../runtime-integration/public-simulation-api-v2-adapter.server";
import type { ControlledServerRuntimeSelectionResult } from "../runtime-integration/controlled-simulator-runtime-switch-contracts";
import { isPublicSimulationApiV2Envelope } from "../runtime-integration/public-simulation-api-v2-contracts";
import { composePostProviderDecisionMaterial } from "./post-provider-boundary";
import { composePostProviderSimulationResponse } from "./post-provider-simulation-composition";
import { validateSimulationResponseV2DraftShape } from "./simulation-response";
import { mapSimulationResponseV2ToUiModel } from "./simulation-response-v2-ui-mapping";
import { adaptSimulationResponseV2ToPublicSimulatorEnvelope } from "./simulation-response-public-adapter";
import type { SimulationResponseV2Draft } from "./contracts";
import type { DecisionConsequence } from "./types";

export function runConsequenceFoundationValidation() {
  const cases: { caseId: string; passed: boolean; issue?: string }[] = [];
  const check = (caseId: string, condition: boolean) => cases.push({ caseId, passed: condition,
    ...(condition ? {} : { issue: "Consequence foundation invariant failed." }) });
  const request = shadowCanonicalRequest();
  const corpus = createShadowSemanticDeltaCorpus();
  const shortPacket = structuredClone(corpus.find((fixture) => fixture.caseId === "short_term_consequence_linked")!.packet) as CandidateDecisionMaterial;
  const candidate = (overrides: Partial<CandidateDecisionMaterialItem> = {}) => ({ ...structuredClone(shortPacket.items[0]), ...overrides });
  const boundary = (items: CandidateDecisionMaterialItem[], source = request) => composePostProviderDecisionMaterial({
    boundaryId: "consequence_foundation_validation", bridgeRequest: structuredClone(source),
    candidateMaterial: { ...shortPacket, items },
  });
  const compose = (items: CandidateDecisionMaterialItem[], source = request) => composePostProviderSimulationResponse(boundary(items, source));
  const requireResponse = (items: CandidateDecisionMaterialItem[], source = request): SimulationResponseV2Draft => {
    const result = compose(items, source);
    if (result.status !== "composed") throw new Error(`Synthetic consequence composition failed: ${result.error.code}`);
    return result.response;
  };
  const entries = (response: SimulationResponseV2Draft) => response.analysis?.consequences ?? [];
  const short = requireResponse([candidate()]);
  const long = requireResponse([candidate({ candidate_id: "long_effect", item_type: "long_term_consequence", content: "Synthetic delayed effect on capacity." })]);
  check("grounded_short_term_is_structured", entries(short).length === 1 && entries(short)[0].horizon === "short_term");
  check("grounded_long_term_is_structured", entries(long).length === 1 && entries(long)[0].horizon === "long_term");
  check("canonical_option_owner_and_no_provider_seed_scenario", entries(short)[0].optionId === "option_launch" &&
    !Object.hasOwn(entries(short)[0], "scenarioId") && JSON.stringify(entries(short)[0].sourceEntityIds) === JSON.stringify([request.decisionContext.decisionId]));
  const firstOrigin = entries(short)[0].provenance.origins[0];
  check("description_and_provenance_not_rephrased", entries(short)[0].description === candidate().content &&
    entries(short)[0].provenance.independentlyVerified === false &&
    firstOrigin.source === "controlled_material" && firstOrigin.sourceRef === candidate().provenance.source_ref);
  const both = requireResponse([candidate(), candidate({ candidate_id: "same_text_long", item_type: "long_term_consequence" })]);
  check("identical_text_different_horizons_remains_distinct", entries(both).length === 2 && new Set(entries(both).map((entry) => entry.id)).size === 2);
  const sameTextDifferentOptions = requireResponse([candidate(), candidate({ candidate_id: "other_option", option_refs: ["option_2"], scenario_refs: ["scenario_2"] })]);
  check("same_text_different_option_scopes_not_upstream_dropped", entries(sameTextDifferentOptions).length === 2 &&
    new Set(entries(sameTextDifferentOptions).map((entry) => entry.optionId)).size === 2);
  const unlinked = requireResponse([candidate({ option_refs: [], scenario_refs: [] })]);
  const ambiguous = requireResponse([candidate({ option_refs: ["option_1", "option_2"] })]);
  const conflicting = requireResponse([candidate({ option_refs: ["option_1"], scenario_refs: ["scenario_2"] })]);
  check("unlinked_is_trace_only", entries(unlinked).length === 0 && unlinked.traceability.evidence.some((entry) => entry.claim === candidate().content));
  check("ambiguous_is_trace_only", entries(ambiguous).length === 0);
  check("conflicting_seed_refs_are_trace_only", entries(conflicting).length === 0);
  const outsideScope = structuredClone(request);
  outsideScope.decisionContext.constraints[0].appliesToOptionIds = ["option_wait"];
  check("constraint_option_mismatch_is_not_mapped", entries(requireResponse([candidate({ provenance: { source: "provider_candidate", source_ref: "constraint_1" } })], outsideScope)).length === 0);
  check("invalid_reference_uses_existing_failure", boundary([candidate({ option_refs: ["option_999"] })]).status === "rejected");
  check("recommendation_disguised_as_consequence_is_rejected", boundary([candidate({ content: "I recommend the best option: launch the pilot." })]).status === "rejected");
  const duplicates = boundary([candidate(), candidate({ candidate_id: "identical_duplicate" })]);
  const duplicateResult = composePostProviderSimulationResponse(duplicates);
  check("identical_duplicate_one_receipt_and_preserved_ledger", duplicates.status === "composed" &&
    duplicates.acceptance.ledger.length === 2 && duplicates.acceptance.ledger.some((entry) => entry.disposition === "merged_as_duplicate") &&
    duplicateResult.status === "composed" && entries(duplicateResult.response).length === 1 &&
    entries(duplicateResult.response)[0].provenance.origins.length === 1);
  const differentOrigins = [candidate(), candidate({ candidate_id: "constraint_origin", provenance: { source: "provider_candidate", source_ref: "constraint_1" } })];
  const originResponse = requireResponse(differentOrigins);
  check("duplicate_content_preserves_distinct_origins", entries(originResponse).length === 1 && entries(originResponse)[0].provenance.origins.length === 2 &&
    entries(originResponse)[0].sourceEntityIds.includes("constraint_budget") && validateSimulationResponseV2DraftShape(originResponse));
  const reversed = requireResponse([...differentOrigins].reverse());
  check("stable_id_independent_of_candidate_order_and_receipt_index", entries(reversed)[0].id === entries(originResponse)[0].id);
  const otherResponse = requireResponse([candidate({ candidate_id: "unrelated_before", item_type: "assumption", content: "Synthetic capacity remains available." }), candidate()]);
  check("stable_id_independent_of_unrelated_candidate_position", entries(otherResponse)[0].id === entries(short)[0].id);
  const normalized = requireResponse([candidate({ content: "Capacity may change." }), candidate({ candidate_id: "unicode_duplicate", content: "Ｃａｐａｃｉｔｙ may change." })]);
  check("normalized_duplicate_preserves_both_material_origins", entries(normalized).length === 1 && entries(normalized)[0].provenance.origins.length === 2);
  const originalInput = boundary(differentOrigins);
  const inputBefore = JSON.stringify(originalInput);
  composePostProviderSimulationResponse(originalInput);
  check("context_ledger_and_controlled_input_are_not_mutated", JSON.stringify(originalInput) === inputBefore);
  const forged = structuredClone(originalInput);
  if (forged.status === "composed") forged.controlledMaterial.items[0].content = "Unaccepted synthetic text.";
  const forgedResult = composePostProviderSimulationResponse(forged);
  check("forged_controlled_content_cannot_gain_destination", forgedResult.status === "composed" &&
    entries(forgedResult.response).every((entry) => entry.description !== "Unaccepted synthetic text."));
  const forgedSource = boundary([candidate()]);
  if (forgedSource.status === "composed") forgedSource.controlledMaterial.items[0].sourceContextEntityIds = ["option_wait"];
  const forgedSourceResult = composePostProviderSimulationResponse(forgedSource);
  check("forged_provenance_entity_does_not_map", forgedSourceResult.status === "composed" && entries(forgedSourceResult.response).length === 0);
  const forgedAuthority = boundary([candidate()]);
  if (forgedAuthority.status === "composed") {
    const content = "I recommend the best option: launch the pilot.";
    forgedAuthority.controlledMaterial.items[0].content = content;
    forgedAuthority.acceptance.accepted_material.items[0].content = content;
  }
  const forgedAuthorityResult = composePostProviderSimulationResponse(forgedAuthority);
  check("forged_acceptance_flag_cannot_bypass_existing_safety_validation", forgedAuthorityResult.status === "composed" && entries(forgedAuthorityResult.response).length === 0);
  check("exact_600_character_description_supported", entries(requireResponse([candidate({ content: "x".repeat(600) })]))[0].description.length === 600);
  check("exact_64_distinct_consequences_supported", entries(requireResponse(Array.from({ length: 64 }, (_, index) =>
    candidate({ candidate_id: `bounded_effect_${index}`, content: `Synthetic qualitative capacity effect ${index}.` })))).length === 64);

  const old = structuredClone(short);
  delete old.analysis!.consequences;
  check("old_v2_without_field_remains_valid", validateSimulationResponseV2DraftShape(old));
  const empty = structuredClone(old);
  empty.analysis!.consequences = [];
  check("present_empty_consequence_list_is_valid", validateSimulationResponseV2DraftShape(empty));
  check("existing_ui_mapping_unchanged", JSON.stringify(mapSimulationResponseV2ToUiModel(short)) === JSON.stringify(mapSimulationResponseV2ToUiModel(old)));
  check("validated_consequences_retained_in_save_projection",
    normalizedShadowJson((shadowSaveProjection(short)?.deterministic_output_snapshot.analysis as Record<string, unknown>).consequences) ===
    normalizedShadowJson(short.analysis!.consequences));
  const projected = shadowSaveProjection(short)!;
  const saved = { ...projected, record_id: "synthetic_saved_record", schema_version: 1,
    created_at: short.generatedAt, updated_at: short.generatedAt, archived_at: null, deleted_at: null,
    last_exported_at: null, deletion_state: "active", retention_rule: "saved_simulation_lifecycle",
    export_eligible: true, legal_hold_reason: null,
  } as SimulationRecordRow;
  const reopened = mapSimulationRecordToDecisionSimulation(saved, { lifecycleState: "reopened" });
  check("typed_reopen_restores_validated_consequences",
    normalizedShadowJson(reopened.decisionEngineOutput.consequences) === normalizedShadowJson(short.analysis!.consequences));
  const wrap = (response: SimulationResponseV2Draft) => adaptControlledProductionAiResultToPublicV2Envelope({
    selectedPath: "controlled_production_ai_v2", runtimeSource: "production_ai", fallback: { used: false }, response,
  } as ControlledServerRuntimeSelectionResult, {
    requestId: response.requestId, generatedAt: response.generatedAt, maxInputLength: 1200, maxBodyLength: 8192,
  });
  const publicValue = wrap(short);
  check("v2_public_adapter_passes_optional_consequence_and_safeRender", publicValue.status === "completed" &&
    publicValue.data.analysis?.consequences === short.analysis?.consequences && publicValue.meta.safeRender === true &&
    publicValue.contractVersion === "simulate-api-v2" && isPublicSimulationApiV2Envelope(publicValue));
  check("old_v2_public_adapter_still_accepts", wrap(old).status === "completed");
  const invalidPublic = structuredClone(publicValue);
  if (invalidPublic.status === "completed") invalidPublic.data.analysis!.consequences![0].optionId = "invented_option";
  check("public_envelope_guard_rejects_invalid_present_field", !isPublicSimulationApiV2Envelope(invalidPublic));
  const legacy = (response: SimulationResponseV2Draft) => adaptSimulationResponseV2ToPublicSimulatorEnvelope({
    response, requestId: response.requestId, generatedAt: response.generatedAt, truthBoundary: "deterministic-engine-preview",
  });
  check("legacy_public_adapter_unchanged", JSON.stringify(legacy(short)) === JSON.stringify(legacy(old)));
  const traceOnly = requireResponse([candidate({ item_type: "assumption" })]);
  check("recommendation_ranking_scoring_safety_availability_and_scenarios_unchanged", ["decision", "modelQuality", "recommendation", "safety", "status", "availability"]
    .every((key) => JSON.stringify(short[key as keyof SimulationResponseV2Draft]) === JSON.stringify(traceOnly[key as keyof SimulationResponseV2Draft])) &&
    JSON.stringify(short.analysis?.scenarios) === JSON.stringify(traceOnly.analysis?.scenarios) &&
    JSON.stringify(short.analysis?.risks) === JSON.stringify(traceOnly.analysis?.risks));
  const refusedRequest = structuredClone(request);
  refusedRequest.safety!.level = "refuse";
  refusedRequest.safety!.recommendationAllowed = false;
  const refused = requireResponse([candidate()], refusedRequest);
  check("refused_composer_does_not_create_analysis", refused.status === "refused" && refused.analysis === undefined);

  const invalid = (caseId: string, update: (response: SimulationResponseV2Draft, entry: Record<string, unknown>) => void) => {
    const response = structuredClone(short);
    update(response, entries(response)[0] as unknown as Record<string, unknown>);
    check(caseId, !validateSimulationResponseV2DraftShape(response));
  };
  invalid("description_over_600_rejected", (_, entry) => { entry.description = "x".repeat(601); });
  invalid("empty_description_rejected", (_, entry) => { entry.description = " "; });
  invalid("over_64_consequences_rejected", (response) => { response.analysis!.consequences = Array.from({ length: 65 }, () => structuredClone(entries(short)[0])); });
  invalid("unknown_horizon_rejected", (_, entry) => { entry.horizon = "five_years"; });
  invalid("missing_option_rejected", (_, entry) => { delete entry.optionId; });
  invalid("invented_option_rejected", (_, entry) => { entry.optionId = "invented_option"; });
  invalid("invented_scenario_rejected", (_, entry) => { entry.scenarioId = "scenario_1"; });
  invalid("scenario_option_mismatch_rejected", (response, entry) => { entry.scenarioId = response.analysis!.scenarios.find((scenario) => scenario.optionId === "option_wait")!.id; });
  invalid("unproven_concrete_provider_scenario_rejected", (response, entry) => { entry.scenarioId = response.analysis!.scenarios[0].id; });
  invalid("invented_source_entity_rejected", (_, entry) => { entry.sourceEntityIds = ["invented_entity"]; });
  invalid("unrelated_existing_source_not_grounded_by_origin_rejected", (_, entry) => { entry.sourceEntityIds = ["constraint_budget"]; });
  invalid("unbounded_canonical_ref_rejected", (_, entry) => { entry.sourceEntityIds = ["a".repeat(161)]; });
  invalid("extra_recommendation_field_rejected", (_, entry) => { entry.recommendation = "launch"; });
  invalid("extra_numeric_field_rejected", (_, entry) => { entry.probability = 99; });
  invalid("malformed_provenance_rejected", (_, entry) => { entry.provenance = { origins: [] }; });
  invalid("independently_verified_true_rejected", (_, entry) => { entry.provenance = { ...entries(short)[0].provenance, independentlyVerified: true }; });
  invalid("unknown_origin_rejected", (_, entry) => { entry.provenance = { independentlyVerified: false, origins: [{ source: "provider", rawResponse: "raw" }] }; });
  invalid("provider_confidence_cannot_enter_origin", (_, entry) => { entry.provenance = { independentlyVerified: false,
    origins: [{ ...entries(short)[0].provenance.origins[0], confidence: "high" }] }; });
  invalid("duplicate_origin_objects_rejected", (_, entry) => { entry.provenance = { independentlyVerified: false,
    origins: [entries(short)[0].provenance.origins[0], entries(short)[0].provenance.origins[0]] }; });
  invalid("over_64_origins_rejected", (_, entry) => { entry.provenance = { independentlyVerified: false, origins: Array.from({ length: 65 }, () => structuredClone(entries(short)[0].provenance.origins[0])) }; });
  invalid("missing_material_receipt_rejected", (_, entry) => { entry.provenance = { independentlyVerified: false, origins: [{ source: "controlled_material", materialItemId: "missing_material", sourceRef: "question_1" }] }; });
  invalid("altered_source_ref_rejected", (_, entry) => { entry.provenance = { independentlyVerified: false, origins: [{ ...entries(short)[0].provenance.origins[0], sourceRef: "constraint_1" }] }; });
  invalid("lost_source_trace_rejected", (response) => { response.traceability.responseMapping = []; });
  invalid("duplicate_entries_rejected", (response) => { response.analysis!.consequences!.push(structuredClone(entries(response)[0])); });
  invalid("refused_analysis_consequences_rejected", (response) => { response.status = "refused"; delete response.recommendation; response.safety.recommendationAllowed = false; });
  const scenarioRule = structuredClone(short);
  const ruleEntry = entries(scenarioRule)[0];
  ruleEntry.scenarioId = scenarioRule.analysis!.scenarios.find((scenario) => scenario.optionId === ruleEntry.optionId)!.id;
  ruleEntry.id = `consequence_${createHash("sha256").update("synthetic_rule_scope").digest("hex")}`;
  ruleEntry.sourceEntityIds = [ruleEntry.optionId];
  ruleEntry.provenance.origins = [{ source: "deterministic_rule", ruleId: "synthetic_qualitative_rule" }];
  check("optional_valid_canonical_scenario_shape_supported_for_trusted_rule", validateSimulationResponseV2DraftShape(scenarioRule));
  const goalSource = structuredClone(scenarioRule);
  entries(goalSource)[0].sourceEntityIds = [request.decisionContext.goals[0].id];
  check("existing_canonical_goal_anchor_resolves_for_rule_origin", validateSimulationResponseV2DraftShape(goalSource));
  const sourceBounds = structuredClone(scenarioRule);
  const canonicalSources = [...new Set([
    ...sourceBounds.decision.optionSummaries.map((option) => option.id),
    ...sourceBounds.analysis!.assumptions.map((assumption) => assumption.id),
    ...sourceBounds.analysis!.scenarios.flatMap((scenario) => [scenario.id,
      ...scenario.dependencies.map((item) => item.sourceEntityId), ...scenario.outcomeIndicators.map((item) => item.sourceEntityId)]),
    ...sourceBounds.traceability.responseMapping.flatMap((trace) => trace.sourceEntityIds.filter((id) =>
      !sourceBounds.traceability.evidence.some((receipt) => receipt.id === id))),
  ])];
  entries(sourceBounds)[0].sourceEntityIds = canonicalSources.slice(0, 16);
  check("exact_16_resolved_canonical_refs_supported", canonicalSources.length >= 17 && validateSimulationResponseV2DraftShape(sourceBounds));
  entries(sourceBounds)[0].sourceEntityIds = canonicalSources.slice(0, 17);
  check("over_16_resolved_canonical_refs_rejected", !validateSimulationResponseV2DraftShape(sourceBounds));
  const manual = structuredClone(scenarioRule);
  entries(manual)[0].provenance.origins = [{ source: "manual", evidenceRefId: "synthetic_manual_receipt" }];
  manual.traceability.evidence.push({ id: "synthetic_manual_receipt", source: "user_statement", claim: "Synthetic manual basis.", reliability: "unverified", userConfirmed: false });
  check("manual_origin_shape_uses_existing_evidence_without_verification_claim", validateSimulationResponseV2DraftShape(manual));
  manual.traceability.evidence = manual.traceability.evidence.filter((entry) => entry.id !== "synthetic_manual_receipt");
  check("missing_manual_evidence_rejected", !validateSimulationResponseV2DraftShape(manual));
  return { passed: cases.every((entry) => entry.passed), cases,
    persistenceStatus: "VALIDATED SNAPSHOT DURABILITY", providerOperations: 0, networkRequests: 0 };
}
