import "server-only";

import { createHash } from "node:crypto";
import type { CandidateDecisionMaterial, CandidateDecisionMaterialItem } from "../ai-decision-material/contracts";
import { createShadowSemanticDeltaCorpus, shadowCanonicalRequest } from "../ai-quality/shadow-semantic-delta-fixtures";
import { normalizedShadowJson, shadowSaveProjection } from "../ai-quality/shadow-semantic-delta-evaluator";
import type { SimulationResponseV2Draft } from "../decision-engine/contracts";
import type { DecisionConsequence } from "../decision-engine/types";
import type { PublicSimulationApiV2Envelope } from "../runtime-integration/public-simulation-api-v2-contracts";
import { composePostProviderDecisionMaterial } from "../decision-engine/post-provider-boundary";
import { composePostProviderSimulationResponse } from "../decision-engine/post-provider-simulation-composition";
import { validateSimulationResponseV2DraftShape } from "../decision-engine/simulation-response";
import { mapSimulationResponseV2ToUiModel } from "../decision-engine/simulation-response-v2-ui-mapping";
import { buildMockSimulation } from "../simulationEngine";
import { listDecisionSimulations, mapSimulationRecordToDecisionSimulation, reopenDecisionSimulation, saveDecisionSimulation } from "../saved-decision-simulations/runtime";
import type { LevioSessionContext } from "../auth/types";
import type { LevioPrincipalRow, SimulationRecordRow } from "./contracts";
import { decodeStoredDecisionConsequences, validateStoredDecisionConsequences } from "./consequence-snapshot";
import { initializePersistenceRuntimeWiring } from "./runtime-wiring";
import { buildSimulationRecordInsertPayload } from "./simulation-record-persistence";
import { createSupabasePersistenceProviderAdapter, type SupabasePrincipalResolutionClient, type SupabaseSimulationRecordReadClient, type SupabaseSimulationRecordInsertPayload } from "./supabase-provider";

const principalId = "3d25a625-7ad3-4995-9d13-222222222222";
const providerReference = "9f1e5a40-0a5f-4f76-8c9c-111111111111";
const recordId = "5ce1e4a7-4494-45d9-9481-444444444444";
const clock = "2026-10-12T10:00:00.000Z";
const config = { enabled: true, simulationRecordPersistence: { enabled: true } };
const authContext: LevioSessionContext = {
  identityState: "authenticated", principal: { principalId, principalType: "registered_user", providerReference: `supabase:${providerReference}` },
  sessionId: "synthetic_durability_session", sessionStatus: "active", assuranceLevel: "authenticated", riskFlags: [],
};
const principal: LevioPrincipalRow = {
  principal_id: principalId, principal_type: "registered_user", principal_status: "active", provider_name: "supabase",
  provider_reference: providerReference, provider_reference_status: "active", provider_subject_type: "user",
  provider_email_snapshot: null, provider_email_verified: false, created_at: clock, updated_at: clock, verified_at: null,
  disabled_at: null, deleted_at: null, deletion_requested_at: null, last_authenticated_at: null, last_provider_sync_at: null,
  deletion_state: "active", retention_rule: "account_lifecycle", recovery_state: null, locale_preference: null,
  metadata_version: null, legal_hold_reason: null, schema_version: 1,
};

function storedRow(payload: SupabaseSimulationRecordInsertPayload): SimulationRecordRow {
  return JSON.parse(JSON.stringify({ ...payload, record_id: recordId, originating_draft_id: null, parent_record_id: null,
    revision_label: null, created_at: clock, updated_at: clock, archived_at: null, deleted_at: null,
    last_exported_at: null, legal_hold_reason: null })) as SimulationRecordRow;
}

/** Only unordered sets are normalized. All text, identity, horizon, linkage and
 * provenance fields remain exact; timestamps outside the contract are excluded. */
function durableEquality(values: DecisionConsequence[] | undefined): string {
  return normalizedShadowJson(values?.map((entry) => ({
    id: entry.id, description: entry.description, horizon: entry.horizon, optionId: entry.optionId,
    ...(entry.scenarioId === undefined ? {} : { scenarioId: entry.scenarioId }),
    sourceEntityIds: [...entry.sourceEntityIds].sort(),
    provenance: { independentlyVerified: entry.provenance.independentlyVerified,
      origins: [...entry.provenance.origins].sort((a, b) => normalizedShadowJson(a).localeCompare(normalizedShadowJson(b))) },
  })).sort((a, b) => a.id.localeCompare(b.id)));
}

export async function runConsequenceDurabilityValidation() {
  const cases: { caseId: string; passed: boolean }[] = [];
  const check = (caseId: string, condition: boolean) => cases.push({ caseId, passed: condition });
  const packet = createShadowSemanticDeltaCorpus().find((item) => item.caseId === "short_term_consequence_linked")!.packet as CandidateDecisionMaterial;
  const candidate = (patch: Partial<CandidateDecisionMaterialItem> = {}) => ({ ...structuredClone(packet.items[0]), ...patch });
  const compose = (items: CandidateDecisionMaterialItem[]) => {
    const result = composePostProviderSimulationResponse(composePostProviderDecisionMaterial({
      boundaryId: "synthetic_durability_boundary", bridgeRequest: shadowCanonicalRequest(), candidateMaterial: { ...packet, items },
    }));
    if (result.status !== "composed") throw new Error("Synthetic durability fixture failed to compose.");
    return result.response;
  };
  const short = compose([candidate()]);
  const long = compose([candidate({ candidate_id: "long_durable", item_type: "long_term_consequence", content: "Synthetic delayed capacity effect." })]);
  const mixed = compose([candidate(), candidate({ candidate_id: "long_durable", item_type: "long_term_consequence" })]);
  const merged = compose([candidate(), candidate({ candidate_id: "second_origin", provenance: { source: "provider_candidate", source_ref: "constraint_1" } })]);
  const scenario = structuredClone(short);
  const entry = scenario.analysis!.consequences![0];
  entry.id = `consequence_${createHash("sha256").update("synthetic_durable_scenario").digest("hex")}`;
  entry.scenarioId = scenario.analysis!.scenarios.find((item) => item.optionId === entry.optionId)!.id;
  entry.sourceEntityIds = [entry.optionId, entry.scenarioId];
  entry.provenance.origins = [{ source: "deterministic_rule", ruleId: "synthetic_scenario_rule" }];
  check("scenario_fixture_is_existing_contract_valid", validateSimulationResponseV2DraftShape(scenario));
  const legacy = structuredClone(short);
  delete legacy.analysis!.consequences;

  let stored: SimulationRecordRow | undefined;
  const calls = { save: 0, read: 0, list: 0 };
  const provider = {
    providerId: "supabase" as const, executionBoundary: "server_only" as const,
    async resolvePrincipalByProviderReference() { return principal; },
    async saveSimulationRecord(payload: SupabaseSimulationRecordInsertPayload) { calls.save++; stored = storedRow(payload); return stored; },
    async readSimulationRecord() { calls.read++; return stored ? JSON.parse(JSON.stringify(stored)) as SimulationRecordRow : null; },
    async listSimulationRecords() { calls.list++; return stored ? [JSON.parse(JSON.stringify(stored)) as SimulationRecordRow] : []; },
  };
  const runtime = initializePersistenceRuntimeWiring({ providerAdapter: provider });
  const roundTrip = async (id: string, response: SimulationResponseV2Draft) => {
    const projected = shadowSaveProjection(response);
    if (!projected) throw new Error("Synthetic response did not project.");
    // Exercise the existing explicit-save service, JSON serialization, owner read
    // and actual reopen service; never a database or provider generation call.
    const envelope: PublicSimulationApiV2Envelope = { contractVersion: "simulate-api-v2", responseMode: "production_v2", runtimeSource: "production_ai",
      requestId: response.requestId, status: "completed", data: response,
      uiModel: mapSimulationResponseV2ToUiModel(response), error: null,
      meta: { lang: "es", safeRender: true, mockOnly: false, apiReady: true, maxInputLength: 1200,
        maxBodyLength: 8192, generatedAt: response.generatedAt, responseContractVersion: "2.0" } };
    const saved = await saveDecisionSimulation({ authContext, simulation: envelope, runtime, saveProvider: provider, config });
    const savesBefore = calls.save;
    const restored = await reopenDecisionSimulation({ authContext, recordId, runtime, readProvider: provider, config });
    check(id, saved.status === "saved" && restored.status === "reopened" &&
      durableEquality(restored.simulation.decisionEngineOutput.consequences) === durableEquality(response.analysis?.consequences) &&
      durableEquality(saved.simulation.decisionEngineOutput.consequences) === durableEquality(response.analysis?.consequences) &&
      restored.simulation.lifecycleMetadata.state === "reopened" && calls.save === savesBefore);
    if (restored.status === "reopened") {
      check(`${id}:authority_state_unchanged`, normalizedShadowJson(restored.record.deterministic_output_snapshot) === normalizedShadowJson(projected.deterministic_output_snapshot) &&
        normalizedShadowJson(restored.record.confidence_summary) === normalizedShadowJson(projected.confidence_summary) &&
        restored.record.recommendation_state === projected.recommendation_state && restored.record.safety_classification === projected.safety_classification);
    }
    return stored!;
  };
  await roundTrip("short_term_option_round_trip", short);
  await roundTrip("long_term_option_round_trip", long);
  await roundTrip("canonical_scenario_round_trip", scenario);
  const scenarioRow = structuredClone(stored!);
  (scenarioRow.deterministic_output_snapshot.analysis as Record<string, unknown>).scenarios = [];
  check("deleted_canonical_scenario_anchor_rejected", !validateStoredDecisionConsequences(scenarioRow.deterministic_output_snapshot));
  await roundTrip("multiple_horizons_round_trip", mixed);
  const mergedRow = await roundTrip("merged_origins_round_trip", merged);
  const mergedDecode = decodeStoredDecisionConsequences(mergedRow.deterministic_output_snapshot);
  check("merged_origins_remain_deduped", mergedDecode.valid && mergedDecode.consequences?.[0].provenance.origins.length === 2);
  const reordered = structuredClone(mergedRow);
  const reorderedConsequence = ((reordered.deterministic_output_snapshot.analysis as Record<string, unknown>).consequences as DecisionConsequence[])[0];
  reorderedConsequence.sourceEntityIds.reverse(); reorderedConsequence.provenance.origins.reverse();
  const reorderedDecode = decodeStoredDecisionConsequences(reordered.deterministic_output_snapshot);
  check("durable_equality_normalizes_only_unordered_reference_sets", reorderedDecode.valid &&
    durableEquality(reorderedDecode.consequences) === durableEquality(merged.analysis!.consequences));
  await roundTrip("legacy_v2_absence_round_trip", legacy);
  const legacyDomain = mapSimulationRecordToDecisionSimulation(stored!);
  check("legacy_absence_not_empty_semantic_claim", !Object.hasOwn(legacyDomain.decisionEngineOutput, "consequences") &&
    !Object.hasOwn(stored!.deterministic_output_snapshot.analysis as object, "consequences"));
  const legacyV1 = buildSimulationRecordInsertPayload({ simulation: buildMockSimulation("Synthetic legacy saved decision"), ownerPrincipalId: principalId })!;
  check("legacy_v1_without_migration", mapSimulationRecordToDecisionSimulation(storedRow(legacyV1)).decisionEngineOutput.consequences === undefined);
  const empty = structuredClone(legacy); empty.analysis!.consequences = [];
  await roundTrip("explicit_empty_list_is_preserved", empty);
  const manual = structuredClone(scenario);
  const manualEntry = manual.analysis!.consequences![0];
  manualEntry.provenance.origins = [{ source: "manual", evidenceRefId: "synthetic_manual_receipt" }];
  manual.traceability.evidence.push({ id: "synthetic_manual_receipt", source: "user_statement",
    claim: manualEntry.description, reliability: "unverified", userConfirmed: false });
  await roundTrip("manual_receipt_origin_round_trip", manual);
  const lostManualReceipt = structuredClone(stored!);
  ((lostManualReceipt.deterministic_output_snapshot.analysis as Record<string, unknown>).consequenceReferences as Record<string, unknown>).evidence = [];
  check("dangling_manual_receipt_rejected", !validateStoredDecisionConsequences(lostManualReceipt.deterministic_output_snapshot));
  const sourceLinked = structuredClone(scenario);
  const sourceScenario = sourceLinked.analysis!.scenarios.find((item) => item.dependencies.length + item.outcomeIndicators.length > 0)!;
  sourceLinked.analysis!.consequences![0].sourceEntityIds = [sourceScenario.dependencies[0]?.sourceEntityId ?? sourceScenario.outcomeIndicators[0].sourceEntityId];
  await roundTrip("scenario_source_catalog_round_trip", sourceLinked);
  const sourceRow = structuredClone(stored!);
  const sourceReferences = (sourceRow.deterministic_output_snapshot.analysis as Record<string, unknown>).consequenceReferences as Record<string, unknown>;
  (sourceReferences.scenarioSources as Record<string, unknown>[])[0].optionId = "missing_option";
  check("scenario_source_anchor_mismatch_rejected", !validateStoredDecisionConsequences(sourceRow.deterministic_output_snapshot));

  const validRow = storedRow({ ...shadowSaveProjection(merged)!, owner_principal_id: principalId });
  const invalidate = async (id: string, mutate: (snapshot: Record<string, unknown>, analysis: Record<string, unknown>, consequence: Record<string, unknown>, references: Record<string, unknown>) => void) => {
    const row = structuredClone(validRow), snapshot = row.deterministic_output_snapshot;
    const analysis = snapshot.analysis as Record<string, unknown>;
    mutate(snapshot, analysis, (analysis.consequences as Record<string, unknown>[])[0], analysis.consequenceReferences as Record<string, unknown>);
    stored = row;
    const result = await reopenDecisionSimulation({ authContext, recordId, runtime, readProvider: provider, config });
    check(id, !validateStoredDecisionConsequences(snapshot) && result.status === "blocked" && result.reason === "record_payload_invalid");
    return row;
  };
  const malformedRow = await invalidate("malformed_stored_horizon_blocks_reopen", (_, __, entry) => { entry.horizon = "future_guess"; });
  await invalidate("dangling_option_rejected", (_, __, entry) => { entry.optionId = "missing_option"; });
  await invalidate("deleted_option_anchor_rejected", (snapshot) => { (snapshot.decision as Record<string, unknown>).options = []; });
  await invalidate("dangling_scenario_rejected", (_, __, entry) => { entry.scenarioId = "missing_scenario"; });
  await invalidate("scenario_wrong_option_rejected", (_, analysis, entry) => {
    entry.scenarioId = (analysis.scenarios as { id: string; optionId: string }[]).find((item) => item.optionId !== entry.optionId)!.id;
  });
  await invalidate("dangling_source_entity_rejected", (_, __, entry) => { entry.sourceEntityIds = ["missing_source"]; });
  await invalidate("missing_material_receipt_rejected", (_, __, ___, refs) => { refs.evidence = []; });
  await invalidate("dangling_material_id_rejected", (_, __, entry) => {
    ((entry.provenance as { origins: { materialItemId: string }[] }).origins[0]).materialItemId = "missing_material";
  });
  await invalidate("missing_material_trace_rejected", (_, __, ___, refs) => { refs.responseMapping = []; });
  await invalidate("altered_provenance_source_rejected", (_, __, entry) => {
    ((entry.provenance as { origins: { sourceRef: string }[] }).origins[0]).sourceRef = "constraint_999";
  });
  await invalidate("duplicate_origins_rejected", (_, __, entry) => {
    const origins = (entry.provenance as { origins: unknown[] }).origins; origins.push(structuredClone(origins[0]));
  });
  await invalidate("oversized_stored_origin_list_rejected", (_, __, entry) => {
    const provenance = entry.provenance as { origins: unknown[] };
    provenance.origins = Array.from({ length: 65 }, () => structuredClone(provenance.origins[0]));
  });
  await invalidate("oversized_stored_consequence_list_rejected", (_, analysis, entry) => {
    analysis.consequences = Array.from({ length: 65 }, () => structuredClone(entry));
  });
  await invalidate("independent_verification_cannot_be_invented", (_, __, entry) => { (entry.provenance as Record<string, unknown>).independentlyVerified = true; });
  await invalidate("provider_confidence_cannot_be_stored", (_, __, entry) => { entry.confidence = "high"; });
  await invalidate("raw_provider_reference_metadata_rejected", (_, __, ___, refs) => { refs.rawResponse = "synthetic prohibited packet"; });
  await invalidate("raw_receipt_fields_rejected", (_, __, ___, refs) => { (refs.evidence as Record<string, unknown>[])[0].prompt = "synthetic prohibited prompt"; });
  await invalidate("unrelated_receipts_cannot_be_archived", (_, __, ___, refs) => {
    (refs.evidence as Record<string, unknown>[]).push({ id: "unrelated_receipt", source: "engine_inference", claim: "Synthetic unrelated material", userConfirmed: false });
  });
  await invalidate("operational_trace_metadata_rejected", (_, __, ___, refs) => { (refs.responseMapping as Record<string, unknown>[])[0].detail = "private synthetic provider timing"; });
  await invalidate("missing_reference_block_rejected", (_, analysis) => { delete analysis.consequenceReferences; });
  await invalidate("explicit_undefined_is_not_legacy_absence", (_, analysis) => { analysis.consequences = undefined; });
  await invalidate("unsupported_reference_version_rejected", (_, __, ___, refs) => { refs.version = "unknown"; });
  await invalidate("orphan_reference_block_rejected", (_, analysis) => { delete analysis.consequences; });
  await invalidate("malformed_reference_array_rejected", (_, __, ___, refs) => { refs.assumptionIds = "not_an_array"; });
  await invalidate("numeric_risk_payload_cannot_enter_consequence", (_, __, entry) => { entry.probability = 0.8; });
  await invalidate("duplicate_consequence_id_rejected", (_, analysis, entry) => { (analysis.consequences as unknown[]).push(structuredClone(entry)); });

  stored = malformedRow;
  const listed = await listDecisionSimulations({ authContext, runtime, readProvider: provider, config });
  check("malformed_list_fails_safely", listed.status === "blocked" && listed.reason === "record_payload_invalid");
  let rejectedDirectMap = false;
  try { mapSimulationRecordToDecisionSimulation(malformedRow); } catch { rejectedDirectMap = true; }
  check("direct_mapper_does_not_type_cast_corrupt_data", rejectedDirectMap);
  let readRow = malformedRow;
  let mutationAttempts = 0;
  const chain = { select() { return chain; }, eq() { return chain; }, async maybeSingle() { return { data: readRow, error: null }; } };
  const adapter = createSupabasePersistenceProviderAdapter({
    config: { supabaseUrl: "https://synthetic.supabase.co", serviceRoleKey: "synthetic-non-credential" },
    client: { from() { mutationAttempts++; throw new Error("Synthetic test forbids mutation calls."); } } as unknown as SupabasePrincipalResolutionClient,
    recordReadClient: { from() { return chain; } } as unknown as SupabaseSimulationRecordReadClient,
  });
  check("supabase_row_guard_rejects_corrupt_snapshot", await adapter.readSimulationRecord({ recordId, ownerPrincipalId: principalId }) === null);
  readRow = validRow;
  check("supabase_row_guard_accepts_valid_durable_snapshot", await adapter.readSimulationRecord({ recordId, ownerPrincipalId: principalId }) !== null);
  const invalidPayload = { ...shadowSaveProjection(merged)!, deterministic_output_snapshot: malformedRow.deterministic_output_snapshot };
  check("invalid_payload_rejected_before_any_insert", await adapter.saveSimulationRecord(invalidPayload) === null && mutationAttempts === 0);
  stored = validRow;
  const ownResult = await reopenDecisionSimulation({ authContext, recordId, runtime, readProvider: provider, config });
  check("valid_owner_can_reopen_after_corruption_tests", ownResult.status === "reopened");
  stored = { ...validRow, owner_principal_id: "19a54cf2-5d7d-4f1d-9e59-555555555555" };
  const foreign = await reopenDecisionSimulation({ authContext, recordId, runtime, readProvider: provider, config });
  check("ownership_boundary_remains_before_semantic_restore", foreign.status === "blocked" && foreign.reason === "record_owner_scope_failed");

  const liveBefore = normalizedShadowJson(merged);
  const payload = shadowSaveProjection(merged)!;
  const output = payload.deterministic_output_snapshot;
  const storedAnalysis = output.analysis as Record<string, unknown>;
  check("projection_does_not_mutate_live_response", normalizedShadowJson(merged) === liveBefore);
  check("only_validated_consequence_fields_stored", durableEquality(storedAnalysis.consequences as DecisionConsequence[]) === durableEquality(merged.analysis!.consequences));
  const oldPayload = shadowSaveProjection(legacy)!;
  const without = structuredClone(payload);
  delete (without.deterministic_output_snapshot.analysis as Record<string, unknown>).consequences;
  delete (without.deterministic_output_snapshot.analysis as Record<string, unknown>).consequenceReferences;
  const sameBaseline = structuredClone(merged); delete sameBaseline.analysis!.consequences;
  check("all_prior_persistence_fields_unchanged", normalizedShadowJson(without) === normalizedShadowJson(shadowSaveProjection(sameBaseline)));
  check("ui_projection_unchanged", normalizedShadowJson(mapSimulationResponseV2ToUiModel(merged)) === normalizedShadowJson(mapSimulationResponseV2ToUiModel(sameBaseline)));
  const domain = mapSimulationRecordToDecisionSimulation(validRow, { lifecycleState: "reopened" });
  domain.decisionEngineOutput.consequences![0].sourceEntityIds.push("synthetic_mutation");
  check("typed_restore_is_detached_from_stored_json", validateStoredDecisionConsequences(validRow.deterministic_output_snapshot));
  const changedClock = { ...validRow, created_at: "2027-01-01T00:00:00.000Z", updated_at: "2027-01-02T00:00:00.000Z" };
  check("durable_equality_excludes_volatile_runtime_metadata", durableEquality(mapSimulationRecordToDecisionSimulation(changedClock).decisionEngineOutput.consequences) === durableEquality(merged.analysis!.consequences));
  check("legacy_payload_remains_without_reference_block", !Object.hasOwn(oldPayload.deterministic_output_snapshot.analysis as object, "consequenceReferences"));
  const invalidLive = structuredClone(short); invalidLive.analysis!.consequences![0].optionId = "missing_option";
  check("invalid_live_response_cannot_save", shadowSaveProjection(invalidLive) === null);
  const privateExtras = structuredClone(short) as SimulationResponseV2Draft & { rawProviderResponse: string; prompt: string; credentials: string };
  privateExtras.rawProviderResponse = "synthetic_raw_marker";
  privateExtras.prompt = "synthetic_prompt_marker";
  privateExtras.credentials = "synthetic_credential_marker";
  const privateProjection = normalizedShadowJson(shadowSaveProjection(privateExtras));
  check("raw_prompt_and_credential_extras_are_not_projected", ![privateExtras.rawProviderResponse, privateExtras.prompt, privateExtras.credentials].some((value) => privateProjection.includes(value)));
  return { passed: cases.every((item) => item.passed), cases,
    summary: { total: cases.length, passed: cases.filter((item) => item.passed).length },
    providerOperations: 0, databaseWrites: 0, storageMechanism: "in_memory_json_round_trip_only" };
}
