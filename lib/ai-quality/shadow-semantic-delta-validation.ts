import "server-only";
import { createHash } from "node:crypto";

import { runSimulationPipeline } from "../decision-engine/pipeline";
import { composePostProviderDecisionMaterial } from "../decision-engine/post-provider-boundary";
import { composePostProviderSimulationResponse } from "../decision-engine/post-provider-simulation-composition";
import type { CandidateDecisionMaterial } from "../ai-decision-material/contracts";
import type { SimulationResponseV2Draft } from "../decision-engine/contracts";
import {
  createShadowSemanticDeltaCorpus, shadowCanonicalRequest, SHADOW_SEMANTIC_TYPES,
} from "./shadow-semantic-delta-fixtures";
import {
  normalizedShadowJson, shadowFingerprint, shadowProtectedInvariants, summarizeShadowCases, summarizeInformationGapCases,
  type ShadowSemanticDeltaReport,
} from "./shadow-semantic-delta-evaluator";
import { createInformationGapShadowFixtures } from "./information-gap-shadow-fixtures";
import { createInformationGapTargetCatalog, informationGapSemanticKey } from "../decision-engine/information-gap-observations";

export function inspectShadowSemanticDeltaReport(report: ShadowSemanticDeltaReport): string[] {
  const errors: string[] = [];
  const fixtures = createShadowSemanticDeltaCorpus();
  const check = (condition: boolean, error: string) => { if (!condition) errors.push(error); };
  check(report.cases.length === 24, "corpus_count");
  check(report.cases.filter((item) => item.group === "semantic").length === 18, "semantic_count");
  check(report.cases.filter((item) => item.group === "boundary").length === 6, "boundary_count");
  check(new Set(report.cases.map((item) => item.caseId)).size === 24, "unique_case_ids");
  check(report.providerOperations === 0 && report.networkRequests === 0 && report.credentialReads === 0, "offline_evidence");
  check(report.productionAiActivated === false && report.providerQualityAssessed === false, "scope_claims");
  check(report.consequencePersistence === "VALIDATED SNAPSHOT DURABILITY", "consequence_persistence_claim");
  check(report.matrix.length === 9 && report.matrix.every((row, index) => row.type === SHADOW_SEMANTIC_TYPES[index]), "type_matrix");
  check(new Set(report.cases.map((item) => item.baselineFingerprint)).size === 1, "identical_baseline");
  for (const fixture of fixtures) {
    const item = report.cases.find((candidate) => candidate.caseId === fixture.caseId);
    if (!item) { errors.push(`${fixture.caseId}:missing_case`); continue; }
    const id = fixture.caseId;
    check(item.candidateType === fixture.candidateType && item.group === fixture.group, `${id}:fixture_identity`);
    check(item.canonicalInputFingerprint === item.replayInputFingerprint, `${id}:canonical_input_mutated`);
    check(item.fakeTransportCalls.tokenCount === 1 && item.fakeTransportCalls.generation === 1 && item.identicalTransportRequest, `${id}:fake_transport`);
    const sourceIds = (fixture.packet as { items: { candidate_id: string }[] }).items.map((candidate) => candidate.candidate_id);
    check(normalizedShadowJson(item.candidateIds) === normalizedShadowJson(sourceIds), `${id}:observed_candidate_ids`);
    check(item.accounting.length === sourceIds.length && new Set(item.accounting.map((candidate) => candidate.candidateId)).size === sourceIds.length &&
      sourceIds.every((candidateId) => item.accounting.some((candidate) => candidate.candidateId === candidateId)), `${id}:candidate_accounting`);
    const accepted = item.accounting.filter((candidate) => candidate.disposition.startsWith("accepted_"));
    const duplicates = item.accounting.filter((candidate) => candidate.disposition === "duplicate");
    check(accepted.length === fixture.expected.accepted && duplicates.length === fixture.expected.duplicate, `${id}:disposition_counts`);
    check((item.packetFailure?.reason ?? null) === fixture.expected.failure, `${id}:failure_reason`);
    for (const candidate of item.accounting) {
      check(Boolean(candidate.validationReason) && candidate.validationReason !== "missing_disposition", `${id}:${candidate.candidateId}:missing_disposition`);
      check(["accepted_mapped", "accepted_unmapped", "duplicate", "rejected", "packet_failure"].includes(candidate.disposition), `${id}:unknown_disposition`);
      if (candidate.disposition.startsWith("accepted_") || candidate.disposition === "duplicate") {
        check(candidate.controlledMaterialIds.length > 0 && candidate.tracePresent && Boolean(candidate.ledgerTraceMarker), `${id}:missing_controlled_trace`);
      }
      if (candidate.disposition === "duplicate") check(Boolean(candidate.mergedIntoCandidateId), `${id}:duplicate_target_missing`);
      if (candidate.disposition === "packet_failure") check(Boolean(item.packetFailure) && candidate.controlledMaterialIds.length === 0, `${id}:failure_escaped`);
    }
    check(Object.entries(item.protectedInvariants).every(([key, value]) => key === "assessed" || value === true), `${id}:authority_invariant`);
    const comparison = item.packetFailure ? null : false;
    check(item.recommendationDelta.changed === comparison && item.numericMetricDelta.changed === comparison, `${id}:protected_delta`);
    check(item.simulationDelta.substantive === (item.packetFailure ? null : fixture.expected.substantive), `${id}:simulation_delta`);
    check(item.uiVisibility.materialVisible === (item.packetFailure ? null : fixture.expected.uiMaterial), `${id}:ui_material`);
    check(item.uiVisibility.homeRendered === (item.packetFailure ? null : fixture.expected.homeMaterial), `${id}:home_material`);
    check(item.saveRetention.materialRetained === (item.packetFailure ? null : fixture.expected.saveMaterial), `${id}:save_material`);
    check(item.traceOnly === fixture.expected.traceOnly, `${id}:trace_only`);
    check(item.uiVisibility.materialVisible === (item.packetFailure ? null : item.accounting.some((candidate) => candidate.uiPaths.length > 0)) &&
      item.uiVisibility.homeRendered === (item.packetFailure ? null : item.accounting.some((candidate) => candidate.homePaths.length > 0)) &&
      item.saveRetention.materialRetained === (item.packetFailure ? null : item.accounting.some((candidate) => candidate.savePaths.length > 0)), `${id}:material_path_accounting`);
    check(normalizedShadowJson(item.saveRetention.candidateIds) === normalizedShadowJson(
      item.accounting.filter((candidate) => candidate.savePaths.length > 0).map((candidate) => candidate.candidateId)), `${id}:save_candidate_accounting`);
    check(item.packetFailure ? !item.saveRetention.projectionAvailable : item.saveRetention.projectionAvailable, `${id}:projection_availability`);
    check(item.limitation === (fixture.limitation ?? null), `${id}:known_limitation_missing`);
    const expectedContradictions = fixture.candidateType === "contradiction" && fixture.expected.substantive ? 1 : 0;
    check(item.structuredContradictionIds.length === expectedContradictions &&
      normalizedShadowJson(item.structuredContradictionIds) === normalizedShadowJson(
        [...new Set(item.accounting.flatMap((candidate) => candidate.structuredContradictionIds))]), `${id}:structured_contradiction_accounting`);
    check(item.accounting.every((candidate) => candidate.structuredContradictionIds.length === 0 ||
      (candidate.candidateType === "contradiction" && candidate.simulationPaths.some((path) => path.startsWith("$.contradictions[")))), `${id}:structured_destination_paths`);
    const isConsequence = ["short_term_consequence", "long_term_consequence"].includes(fixture.candidateType);
    check(item.structuredConsequenceIds.length === (isConsequence && fixture.expected.substantive ? 1 : 0) &&
      normalizedShadowJson(item.structuredConsequenceIds) === normalizedShadowJson(
        [...new Set(item.accounting.flatMap((candidate) => candidate.structuredConsequenceIds))]), `${id}:structured_consequence_accounting`);
    check(item.accounting.every((candidate) => candidate.structuredConsequenceIds.length === 0 ||
      (["short_term_consequence", "long_term_consequence"].includes(candidate.candidateType) &&
       candidate.simulationPaths.some((path) => path.startsWith("$.analysis.consequences[")))), `${id}:consequence_destination_paths`);
    if (isConsequence) check(Boolean(item.packetFailure) || (item.consequenceFoundation.uiMappingUnchanged === true &&
      item.consequenceFoundation.saveAuthorityUnchanged === true && item.consequenceFoundation.storedConsequencesPreserved === true &&
      item.saveRetention.materialRetained === fixture.expected.saveMaterial && !item.uiVisibility.materialVisible &&
      !item.uiVisibility.homeRendered), `${id}:validated_DURABILITY_and_UI_DEFERRED`);
    if (item.packetFailure) {
      check(!item.simulationDelta.comparable && !item.uiVisibility.comparable && !item.protectedInvariants.assessed, `${id}:failure_claims_comparison`);
      check(item.accounting.every((candidate) => candidate.disposition === "packet_failure" &&
        candidate.simulationPaths.length === 0 && candidate.uiPaths.length === 0 && candidate.savePaths.length === 0 &&
        !candidate.tracePresent && !candidate.noticePresent), `${id}:packet_failure_material_escape`);
    }
  }
  const summary = report.summary;
  const accounting = report.cases.flatMap((item) => item.accounting);
  check(summary.cases === report.cases.length && summary.candidates === accounting.length &&
    summary.accepted === accounting.filter((item) => item.disposition.startsWith("accepted_")).length &&
    summary.rejected === accounting.filter((item) => item.disposition === "rejected").length &&
    summary.duplicate === accounting.filter((item) => item.disposition === "duplicate").length &&
    summary.packetFailures === report.cases.filter((item) => item.packetFailure).length &&
    summary.packetFailureCandidates === accounting.filter((item) => item.disposition === "packet_failure").length, "aggregate_accounting");
  check(summary.substantiveSimulationDeltas === report.cases.filter((item) => item.simulationDelta.substantive).length &&
    summary.uiVisibleDeltas === report.cases.filter((item) => item.uiVisibility.materialVisible).length &&
    summary.homeRenderedDeltas === report.cases.filter((item) => item.uiVisibility.homeRendered).length &&
    summary.saveRetainedDeltas === report.cases.filter((item) => item.saveRetention.materialRetained).length &&
    summary.traceOnlyCases === report.cases.filter((item) => item.traceOnly).length, "aggregate_delta");
  check(summary.unauthorizedRecommendationChanges === 0 && summary.unauthorizedNumericChanges === 0 &&
    summary.unauthorizedSafetyChanges === 0 && summary.unauthorizedDeterministicChanges === 0, "aggregate_authority");
  check(normalizedShadowJson(summary) === normalizedShadowJson(summarizeShadowCases(report.cases)), "aggregate_recomputed");
  for (const row of report.matrix) {
    const { type, ...counts } = row;
    check(normalizedShadowJson(counts) === normalizedShadowJson(summarizeShadowCases(
      report.cases.filter((item) => item.group === "semantic" && item.candidateType === type))), `matrix:${type}:aggregate`);
  }
  const gapFixtures = createInformationGapShadowFixtures();
  check(report.informationGapCases.length === gapFixtures.length &&
    new Set(report.informationGapCases.map((item) => item.caseId)).size === gapFixtures.length, "gap_corpus_identity");
  for (const { fixture, request, expected } of gapFixtures) {
    const item = report.informationGapCases.find((entry) => entry.caseId === fixture.caseId);
    const id = fixture.caseId;
    if (!item) { errors.push(`${id}:missing_gap_case`); continue; }
    const packet = fixture.packet as CandidateDecisionMaterial;
    const gaps = item.informationGaps;
    const catalog = createInformationGapTargetCatalog(request)!;
    const active = gaps.observations.filter((entry) => entry.resolution === "ACTIVE");
    check(item.canonicalInputFingerprint === item.replayInputFingerprint &&
      item.canonicalInputFingerprint === shadowFingerprint(request), `${id}:gap_input_identity`);
    check(item.identicalTransportRequest && item.fakeTransportCalls.tokenCount === 1 && item.fakeTransportCalls.generation === 1, `${id}:gap_offline_transport`);
    check(item.candidateType === fixture.candidateType && item.group === fixture.group &&
      normalizedShadowJson(item.candidateIds) === normalizedShadowJson(packet.items.map((entry) => entry.candidate_id)), `${id}:gap_candidate_identity`);
    check((item.packetFailure?.reason ?? null) === expected.failure, `${id}:gap_failure_reason`);
    check(gaps.status === "evaluated" && gaps.questionsCreated === 0 && gaps.lifecycleTransitions === 0 &&
      item.clarificationLifecycleUnchanged === (expected.failure ? null : true), `${id}:no_clarification_lifecycle_change`);
    check(active.length === expected.active &&
      gaps.observations.filter((entry) => entry.resolution === "SUPPRESSED_ALREADY_KNOWN").length === expected.known &&
      gaps.accounting.filter((entry) => entry.disposition === "DUPLICATE_MERGED").length === expected.merged &&
      gaps.accounting.filter((entry) => entry.disposition.startsWith("TRACE_ONLY")).length === expected.traceOnly, `${id}:gap_counts`);
    check(normalizedShadowJson(active.map((entry) => entry.materiality).sort()) === normalizedShadowJson([...expected.materialities].sort()) &&
      active.filter((entry) => entry.wouldRequireClarification).length === expected.wouldClarify, `${id}:gap_materiality`);
    check(item.recommendationDelta.changed === (expected.failure ? null : false) &&
      item.numericMetricDelta.changed === (expected.failure ? null : false) &&
      Object.entries(item.protectedInvariants).every(([key, value]) => key === "assessed" || value === true), `${id}:gap_authority`);
    check(item.simulationDelta.substantive === (expected.failure ? null : false) &&
      item.uiVisibility.homeRendered === (expected.failure ? null : false), `${id}:internal_not_public_capability`);
    check(gaps.accounting.length === (expected.failure ? 0 : packet.items.length) &&
      item.accounting.length === packet.items.length &&
      item.accounting.filter((entry) => entry.traceOnly).length === expected.traceOnly, `${id}:gap_accounting_complete`);
    check(new Set(gaps.observations.map((entry) => entry.semanticKey)).size === gaps.observations.length &&
      new Set(gaps.observations.map((entry) => entry.id)).size === gaps.observations.length, `${id}:gap_deduplication`);
    for (const observation of gaps.observations) {
      const target = catalog.entries.find((entry) => entry.semanticKey === observation.semanticKey);
      check(Boolean(target) && normalizedShadowJson(target!.target) === normalizedShadowJson(observation.target) &&
        observation.semanticKey === informationGapSemanticKey(observation.target) &&
        observation.id === `gap_observation_${createHash("sha256").update(JSON.stringify(observation.target)).digest("hex")}`, `${id}:canonical_target`);
      if (!target) continue;
      const known = target?.valueStatus === "known", notApplicable = target?.valueStatus === "not_applicable";
      check(observation.resolution === (known ? "SUPPRESSED_ALREADY_KNOWN" : notApplicable ? "SUPPRESSED_NOT_APPLICABLE" : "ACTIVE") &&
        observation.materiality === (known || notApplicable ? "non_material" : target?.classification.materiality) &&
        observation.wouldRequireClarification === (known || notApplicable ? false : target?.classification.wouldRequireClarification) &&
        observation.ruleEvidence.ruleId === (known ? "canonical_value_known" : notApplicable ? "canonical_value_not_applicable" : target?.classification.ruleEvidence.ruleId) &&
        observation.ruleEvidence.entityId === observation.target.entityId, `${id}:deterministic_rule_evidence`);
      check(normalizedShadowJson(Object.keys(observation).sort()) === normalizedShadowJson([
        "id", "semanticKey", "target", "kinds", "origins", "resolution", "materiality", "ruleEvidence", "wouldRequireClarification",
      ].sort()), `${id}:no_extra_gap_authority_fields`);
      const accounts = gaps.accounting.filter((entry) => entry.observationId === observation.id);
      check(observation.origins.length === accounts.length && observation.origins.length > 0 && observation.origins.length <= 64 &&
        new Set(observation.origins.map((entry) => entry.candidateId)).size === observation.origins.length &&
        normalizedShadowJson([...new Set(observation.origins.map((entry) => entry.kind))].sort()) === normalizedShadowJson(observation.kinds), `${id}:gap_origins_complete`);
      for (const origin of observation.origins) {
        const source = packet.items.find((entry) => entry.candidate_id === origin.candidateId);
        check(Boolean(source) && origin.source === "controlled_material" && origin.kind === source?.item_type &&
          origin.sourceRef === source?.provenance.source_ref && target!.sourceRefs.includes(origin.sourceRef) &&
          accounts.some((entry) => entry.candidateId === origin.candidateId && entry.materialItemId === origin.materialItemId) &&
          normalizedShadowJson(Object.keys(origin).sort()) === normalizedShadowJson(["source", "candidateId", "materialItemId", "kind", "sourceRef"].sort()), `${id}:grounded_gap_origin`);
      }
    }
    for (const account of item.accounting) {
      const receipt = gaps.accounting.find((entry) => entry.candidateId === account.candidateId);
      const observation = gaps.observations.find((entry) => entry.id === receipt?.observationId);
      check(account.gapTargetBound === (receipt?.targetBound ?? false) &&
        account.gapKnownSuppressed === (observation?.resolution === "SUPPRESSED_ALREADY_KNOWN") &&
        account.gapDuplicateMerged === (receipt?.disposition === "DUPLICATE_MERGED") &&
        normalizedShadowJson(account.structuredInformationGapIds) === normalizedShadowJson(observation?.resolution === "ACTIVE" ? [observation.id] : []), `${id}:candidate_gap_measurement`);
    }
  }
  check(normalizedShadowJson(report.informationGapMatrix) === normalizedShadowJson(summarizeInformationGapCases(report.informationGapCases)), "gap_matrix_recomputed");
  return errors;
}

/** Negative tests exercise the measuring/assertion layer, not production edits. */
export function runShadowSemanticDeltaValidation(report: ShadowSemanticDeltaReport, repeated: ShadowSemanticDeltaReport) {
  const checks: { id: string; passed: boolean; errors?: string[] }[] = [];
  const errors = inspectShadowSemanticDeltaReport(report);
  checks.push({ id: "24_case_report_contract", passed: errors.length === 0, errors });
  checks.push({ id: "identical_normalized_reports", passed: normalizedShadowJson(report) === normalizedShadowJson(repeated) });
  const mutation = (id: string, update: (value: ShadowSemanticDeltaReport) => void) => {
    const altered = structuredClone(report); update(altered);
    checks.push({ id, passed: inspectShadowSemanticDeltaReport(altered).length > 0 });
  };
  mutation("missing_candidate_accounting_fails", (value) => { value.cases[0].accounting = []; });
  mutation("replay_input_identity_mismatch_fails", (value) => { value.cases[0].replayInputFingerprint = "wrong_context"; });
  mutation("invented_candidate_fails", (value) => { value.cases[0].accounting[0].candidateId = "invented_candidate"; });
  mutation("missing_controlled_material_fails", (value) => { value.cases[0].accounting[0].controlledMaterialIds = []; });
  mutation("missing_disposition_fails", (value) => { value.cases[0].accounting[0].validationReason = "missing_disposition"; });
  mutation("trace_only_promoted_to_product_value_fails", (value) => { value.cases[1].simulationDelta.substantive = true; });
  mutation("mapping_notices_claimed_as_home_rendering_fails", (value) => {
    value.cases.find((item) => item.caseId === "unknown_linked")!.uiVisibility.homeRendered = true;
  });
  mutation("lost_packet_failure_fails", (value) => {
    value.cases.find((item) => item.caseId === "unknown_concrete_gap_reference")!.packetFailure = null;
  });
  mutation("unauthorized_recommendation_report_fails", (value) => { value.cases[0].recommendationDelta.changed = true; });
  mutation("unauthorized_numeric_report_fails", (value) => { value.cases[0].numericMetricDelta.changed = true; });
  mutation("unauthorized_safety_report_fails", (value) => { value.cases[0].protectedInvariants.safetyPreserved = false; });
  mutation("aggregate_tampering_fails", (value) => { value.summary.accepted++; });
  mutation("matrix_tampering_fails", (value) => { value.matrix[0].uiVisibleDeltas++; });
  mutation("missing_ui_material_paths_fails", (value) => { value.cases[0].accounting[0].uiPaths = []; });
  mutation("missing_save_material_paths_fails", (value) => { value.cases[0].accounting[0].savePaths = []; });
  mutation("packet_failure_material_escape_fails", (value) => {
    value.cases.find((item) => item.caseId === "unknown_concrete_gap_reference")!.accounting[0].tracePresent = true;
  });
  mutation("missing_structured_contradiction_destination_fails", (value) => {
    value.cases.find((item) => item.limitation === "bounded_contradiction_destination")!.structuredContradictionIds = [];
  });
  mutation("unattributed_structured_contradiction_fails", (value) => {
    value.cases.find((item) => item.limitation === "bounded_contradiction_destination")!.accounting[0].structuredContradictionIds = [];
  });
  mutation("contradiction_authority_violation_fails", (value) => {
    value.cases.find((item) => item.limitation === "bounded_contradiction_destination")!.protectedInvariants.boundedContradictionAdditionsOnly = false;
  });
  mutation("missing_structured_consequence_destination_fails", (value) => {
    value.cases.find((item) => item.caseId === "short_term_consequence_linked")!.structuredConsequenceIds = [];
  });
  mutation("unattributed_structured_consequence_fails", (value) => {
    value.cases.find((item) => item.caseId === "long_term_consequence_linked")!.accounting[0].structuredConsequenceIds = [];
  });
  mutation("consequence_authority_violation_fails", (value) => {
    value.cases.find((item) => item.caseId === "short_term_consequence_linked")!.protectedInvariants.boundedConsequenceAdditionsOnly = false;
  });
  mutation("consequence_durability_loss_fails", (value) => {
    value.cases.find((item) => item.caseId === "short_term_consequence_linked")!.consequenceFoundation.storedConsequencesPreserved = false;
  });
  const gapMutation = (id: string, update: (value: ShadowSemanticDeltaReport["informationGapCases"][number]) => void,
    caseId = "gap_unknown_grounded") => mutation(id, (value) => update(value.informationGapCases.find((entry) => entry.caseId === caseId)!));
  gapMutation("missing_structured_gap_detected", (value) => { value.informationGaps.observations = []; });
  gapMutation("forged_gap_target_detected", (value) => { value.informationGaps.observations[0].target.entityId = "invented_entity"; });
  gapMutation("forged_gap_identity_detected", (value) => { value.informationGaps.observations[0].id = `gap_observation_${"0".repeat(64)}`; });
  gapMutation("forged_semantic_key_detected", (value) => { value.informationGaps.observations[0].semanticKey = "invented_target"; });
  gapMutation("provider_blocking_escalation_detected", (value) => { value.informationGaps.observations[0].materiality = "blocking"; });
  gapMutation("forged_rule_evidence_detected", (value) => { value.informationGaps.observations[0].ruleEvidence.ruleId = "provider_critical"; });
  gapMutation("known_suppression_loss_detected", (value) => { value.informationGaps.observations[0].resolution = "ACTIVE"; }, "gap_known_unknown_suppressed");
  gapMutation("merged_gap_origin_loss_detected", (value) => { value.informationGaps.observations[0].origins.pop(); }, "gap_mixed_kinds_merge");
  gapMutation("gap_origin_source_mismatch_detected", (value) => { value.informationGaps.observations[0].origins[0].sourceRef = "criterion_999"; });
  gapMutation("gap_question_creation_detected", (value) => { value.informationGaps.questionsCreated = 1 as never; });
  gapMutation("gap_lifecycle_transition_detected", (value) => { value.informationGaps.lifecycleTransitions = 1 as never; });
  gapMutation("clarification_result_delta_detected", (value) => { value.clarificationLifecycleUnchanged = false; });
  gapMutation("gap_recommendation_delta_detected", (value) => { value.recommendationDelta.changed = true; });
  gapMutation("gap_numeric_delta_detected", (value) => { value.numericMetricDelta.changed = true; });
  gapMutation("gap_safety_delta_detected", (value) => { value.protectedInvariants.safetyPreserved = false; });
  gapMutation("missing_gap_accounting_detected", (value) => { value.informationGaps.accounting = []; });
  gapMutation("gap_candidate_measurement_tamper_detected", (value) => { value.accounting[0].structuredInformationGapIds = []; });
  mutation("gap_matrix_tamper_detected", (value) => { value.informationGapMatrix[0].structuredGaps++; });

  const request = shadowCanonicalRequest();
  const baseline = runSimulationPipeline({
    contractVersion: "2.0", requestId: request.bridgeId,
    input: { originalText: request.decisionContext.statement, inputLanguage: "es", requestedOutputLanguage: "es" },
    userIntent: "compare", suppliedContext: request.decisionContext.evidence, suppliedOptions: request.decisionContext.options,
  }, { context: request.decisionContext, safety: request.safety, safetyContextComplete: true });
  const alteredResponse = (id: string, change: (value: SimulationResponseV2Draft) => void,
    detected: (value: ReturnType<typeof shadowProtectedInvariants>) => boolean) => {
    const altered = structuredClone(baseline); change(altered);
    checks.push({ id, passed: detected(shadowProtectedInvariants(baseline, altered)) });
  };
  alteredResponse("numeric_probability_mutation_detected", (value) => { value.analysis!.risks[0].probability.value++; }, (value) => !value.numericPreserved);
  alteredResponse("confidence_mutation_detected", (value) => { value.modelQuality.confidence.score++; }, (value) => !value.numericPreserved);
  alteredResponse("risk_confidence_mutation_detected", (value) => { value.analysis!.risks[0].confidence.value++; }, (value) => !value.numericPreserved);
  alteredResponse("risk_level_mutation_detected", (value) => { value.analysis!.risks[0].level = "critical"; }, (value) => !value.deterministicCalculationsPreserved);
  alteredResponse("recommendation_mutation_detected", (value) => { value.recommendation!.preferredOptionId = "option_wait"; }, (value) => !value.recommendationPreserved);
  alteredResponse("option_ranking_mutation_detected", (value) => { value.recommendation!.rationale.reverse(); }, (value) => !value.recommendationPreserved);
  alteredResponse("safety_mutation_detected", (value) => { value.safety.recommendationAllowed = false; }, (value) => !value.safetyPreserved);
  alteredResponse("refusal_mutation_detected", (value) => { value.status = "refused"; }, (value) => !value.safetyPreserved);
  alteredResponse("baseline_dependency_removal_detected", (value) => { value.analysis!.scenarios[0].dependencies = []; }, (value) => !value.qualitativeAdditionsOnly);
  alteredResponse("baseline_risk_trace_removal_detected", (value) => { value.analysis!.risks[0].traceEntries = []; }, (value) => !value.qualitativeAdditionsOnly);

  const linked = createShadowSemanticDeltaCorpus()[0];
  const boundary = composePostProviderDecisionMaterial({
    boundaryId: "shadow_validation_addition", bridgeRequest: request,
    candidateMaterial: linked.packet as CandidateDecisionMaterial,
  });
  if (boundary.status === "composed") {
    const composed = composePostProviderSimulationResponse(boundary);
    checks.push({ id: "real_dependency_addition_allowed", passed: composed.status === "composed" &&
      Object.entries(shadowProtectedInvariants(baseline, composed.response, boundary.controlledMaterial.items))
        .every(([key, value]) => key === "assessed" || value === true) });
  } else checks.push({ id: "real_dependency_addition_allowed", passed: false });
  const contradictionFixture = createShadowSemanticDeltaCorpus().find((item) => item.limitation === "bounded_contradiction_destination")!;
  const contradictionBoundary = composePostProviderDecisionMaterial({
    boundaryId: "shadow_validation_contradiction", bridgeRequest: request,
    candidateMaterial: contradictionFixture.packet as CandidateDecisionMaterial,
  });
  if (contradictionBoundary.status === "composed") {
    const composed = composePostProviderSimulationResponse(contradictionBoundary);
    checks.push({ id: "real_bounded_contradiction_addition_allowed", passed: composed.status === "composed" &&
      composed.response.contradictions.length > baseline.contradictions.length &&
      Object.entries(shadowProtectedInvariants(baseline, composed.response, contradictionBoundary.controlledMaterial.items))
        .every(([key, value]) => key === "assessed" || value === true) });
    if (composed.status === "composed") {
      for (const [id, change] of [
        ["contradiction_cannot_become_blocking", (entry) => { entry.severity = "critical"; }],
        ["contradiction_cannot_gain_recommendation_authority", (entry) => { entry.recommendationImpact = "could_reverse"; }],
        ["contradiction_cannot_invent_entities", (entry) => { entry.affectedEntityIds = ["invented_entity"]; }],
      ] as const) {
        const altered = structuredClone(composed.response);
        change(altered.contradictions[altered.contradictions.length - 1]);
        checks.push({ id, passed: !shadowProtectedInvariants(baseline, altered,
          contradictionBoundary.controlledMaterial.items).boundedContradictionAdditionsOnly });
      }
      const duplicate = structuredClone(composed.response);
      duplicate.contradictions.push(structuredClone(duplicate.contradictions[duplicate.contradictions.length - 1]));
      checks.push({ id: "duplicated_structured_contradiction_detected", passed:
        !shadowProtectedInvariants(baseline, duplicate, contradictionBoundary.controlledMaterial.items).boundedContradictionAdditionsOnly });
      const lostTrace = structuredClone(composed.response);
      lostTrace.traceability.contradictions = [];
      checks.push({ id: "lost_structured_contradiction_trace_detected", passed:
        !shadowProtectedInvariants(baseline, lostTrace, contradictionBoundary.controlledMaterial.items).boundedContradictionAdditionsOnly });
    }
  } else checks.push({ id: "real_bounded_contradiction_addition_allowed", passed: false });
  const consequenceFixture = createShadowSemanticDeltaCorpus().find((item) => item.caseId === "short_term_consequence_linked")!;
  const consequenceBoundary = composePostProviderDecisionMaterial({ boundaryId: "shadow_validation_consequence", bridgeRequest: request,
    candidateMaterial: consequenceFixture.packet as CandidateDecisionMaterial });
  if (consequenceBoundary.status === "composed") {
    const composed = composePostProviderSimulationResponse(consequenceBoundary);
    checks.push({ id: "real_bounded_consequence_addition_allowed", passed: composed.status === "composed" &&
      composed.response.analysis?.consequences?.length === 1 &&
      Object.entries(shadowProtectedInvariants(baseline, composed.response, consequenceBoundary.controlledMaterial.items))
        .every(([key, value]) => key === "assessed" || value === true) });
    if (composed.status === "composed") {
      const mutation = (id: string, change: (value: SimulationResponseV2Draft) => void) => {
        const altered = structuredClone(composed.response); change(altered);
        checks.push({ id, passed: !shadowProtectedInvariants(baseline, altered,
          consequenceBoundary.controlledMaterial.items).boundedConsequenceAdditionsOnly });
      };
      mutation("lost_consequence_destination_detected", (value) => { delete value.analysis!.consequences; });
      mutation("lost_consequence_origin_detected", (value) => { value.analysis!.consequences![0].provenance.origins = [] as never; });
      mutation("consequence_wrong_horizon_detected", (value) => { value.analysis!.consequences![0].horizon = "long_term"; });
      mutation("consequence_wrong_option_detected", (value) => { value.analysis!.consequences![0].optionId = "option_wait"; });
      mutation("consequence_fake_source_detected", (value) => { value.analysis!.consequences![0].sourceEntityIds = ["invented_entity"]; });
      mutation("duplicated_consequence_detected", (value) => { value.analysis!.consequences!.push(structuredClone(value.analysis!.consequences![0])); });
      mutation("unaccepted_rephrased_consequence_detected", (value) => { value.analysis!.consequences![0].description = "Unaccepted replacement."; });
    }
  } else checks.push({ id: "real_bounded_consequence_addition_allowed", passed: false });
  checks.push({ id: "normalization_preserves_numeric_values", passed: shadowFingerprint({ score: 1 }) !== shadowFingerprint({ score: 2 }) });
  const corpusFailures = report.cases.filter((item) => errors.some((error) => error.startsWith(`${item.caseId}:`))).map((item) => item.caseId);
  const gapCorpusFailures = report.informationGapCases.filter((item) => errors.some((error) => error.startsWith(`${item.caseId}:`))).map((item) => item.caseId);
  return { passed: checks.every((item) => item.passed), total: checks.length,
    corpus: { total: report.cases.length, passed: report.cases.length - corpusFailures.length, failures: corpusFailures },
    informationGapCorpus: { total: report.informationGapCases.length, passed: report.informationGapCases.length - gapCorpusFailures.length, failures: gapCorpusFailures },
    passedChecks: checks.filter((item) => item.passed).length, checks };
}
