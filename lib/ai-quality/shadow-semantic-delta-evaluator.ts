import "server-only";

import { createHash } from "node:crypto";
import { inspectCandidateDecisionMaterialContract } from "../ai-decision-material/acceptance";
import type { SemanticPreservationLedgerEntry } from "../ai-decision-material/contracts";
import {
  executeCandidateDecisionMaterial, OPENAI_DECISION_MATERIAL_PROVIDER,
  type DecisionMaterialTransport,
} from "../ai-provider/openai-decision-material-adapter";
import { bridgeDecisionEngineToPromptContext } from "../ai-integration/decision-engine-prompt-context-bridge";
import type { SimulationResponseV2Draft } from "../decision-engine/contracts";
import { runSimulationPipeline } from "../decision-engine/pipeline";
import {
  composePostProviderDecisionMaterial, type DecisionEngineControlledMaterialItem,
} from "../decision-engine/post-provider-boundary";
import { composePostProviderSimulationResponse } from "../decision-engine/post-provider-simulation-composition";
import { mapSimulationResponseV2ToUiModel } from "../decision-engine/simulation-response-v2-ui-mapping";
import { validateSimulationResponseV2DraftShape } from "../decision-engine/simulation-response";
import { consequenceSemanticKey, normalizeConsequenceDescription } from "../decision-engine/consequence-validation";
import { buildSimulationRecordInsertPayload } from "../persistence-runtime/simulation-record-persistence";
import { decodeStoredDecisionConsequences } from "../persistence-runtime/consequence-snapshot";
import type { InformationGapEvaluation } from "../decision-engine/information-gap-observations";
import { createInformationGapShadowFixtures } from "./information-gap-shadow-fixtures";
import type { PublicSimulationApiV2Envelope } from "../runtime-integration/public-simulation-api-v2-contracts";
import {
  createShadowSemanticDeltaCorpus, shadowCanonicalRequest, SHADOW_FIXED_TIME,
  SHADOW_SEMANTIC_TYPES, type ShadowFixture, type ShadowSemanticType,
} from "./shadow-semantic-delta-fixtures";

export function normalizedShadowJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === "object") return Object.fromEntries(
      Object.entries(item).filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b, "en")).map(([key, entry]) => [key, normalize(entry)]),
    );
    return item;
  };
  return JSON.stringify(normalize(value)) ?? "null";
}

export function shadowFingerprint(value: unknown): string {
  return createHash("sha256").update(normalizedShadowJson(value)).digest("hex");
}

/** Normalize clock metadata here only; production pipeline remains unchanged. */
function fixedResponse(response: SimulationResponseV2Draft): SimulationResponseV2Draft {
  return { ...structuredClone(response), generatedAt: SHADOW_FIXED_TIME };
}

function leaves(value: unknown, path = "$", result: Record<string, unknown> = {}) {
  if (Array.isArray(value)) value.forEach((entry, index) => leaves(entry, `${path}[${index}]`, result));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => leaves(entry, `${path}.${key}`, result));
  else result[path] = value;
  return result;
}

function changedPaths(before: unknown, after: unknown): string[] {
  const left = leaves(before), right = leaves(after);
  return [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()
    .filter((path) => normalizedShadowJson(left[path]) !== normalizedShadowJson(right[path]));
}

function newMaterialPaths(before: unknown, after: unknown, content: string): string[] {
  const left = leaves(before), right = leaves(after);
  return Object.keys(right).sort().filter((path) =>
    typeof right[path] === "string" && (right[path] as string).includes(content) &&
    !(typeof left[path] === "string" && (left[path] as string).includes(content)),
  );
}

function numericMetrics(response: SimulationResponseV2Draft) {
  return Object.fromEntries(Object.entries(leaves({
    modelQuality: response.modelQuality, decision: response.decision,
    analysis: response.analysis, recommendation: response.recommendation,
  })).filter(([, value]) => typeof value === "number"));
}

function simulationStructure(response: SimulationResponseV2Draft) {
  return {
    decision: response.decision, gaps: response.gaps, contradictions: response.contradictions,
    clarification: response.clarification,
    analysis: response.analysis && {
      ...response.analysis,
      scenarios: response.analysis.scenarios.map(({ traceEntries: _trace, ...scenario }) => scenario),
      risks: response.analysis.risks.map(({ traceEntries: _trace, ...risk }) => risk),
    },
  };
}

function protectedCalculations(response: SimulationResponseV2Draft) {
  const { generatedAt: _clock, traceability: _trace, notices: _notices, contradictions: _contradictions, ...rest } = response;
  return { ...rest, analysis: rest.analysis && {
    ...rest.analysis,
    consequences: undefined,
    scenarios: rest.analysis.scenarios.map(({ dependencies: _dependencies, ...scenario }) => scenario),
    risks: rest.analysis.risks.map(({ traceEntries: _traceEntries, ...risk }) => risk),
  } };
}

/** Pure existing payload projection only. No save service/client is invoked. */
export function shadowSaveProjection(response: SimulationResponseV2Draft) {
  const simulation: PublicSimulationApiV2Envelope = {
    contractVersion: "simulate-api-v2", responseMode: "production_v2", runtimeSource: "production_ai",
    requestId: response.requestId, status: "completed", data: response,
    uiModel: mapSimulationResponseV2ToUiModel(response), error: null,
    meta: {
      lang: "es", safeRender: true, mockOnly: false, apiReady: true,
      maxInputLength: 2400, maxBodyLength: 12000, generatedAt: SHADOW_FIXED_TIME,
      responseContractVersion: "2.0",
    },
  };
  return buildSimulationRecordInsertPayload({ simulation, ownerPrincipalId: "synthetic-shadow-owner" });
}

function containsOriginalEntries(before: unknown[], after: unknown[]): boolean {
  let position = 0;
  for (const original of before) {
    const index = after.findIndex((entry, offset) => offset >= position &&
      normalizedShadowJson(entry) === normalizedShadowJson(original));
    if (index < 0) return false;
    position = index + 1;
  }
  return true;
}

/** Independently account for every grounded consequence receipt in the fixed
 * corpus context. No provider generation or new outcome calculation. */
function boundedConsequenceAdditions(baseline: SimulationResponseV2Draft, replay: SimulationResponseV2Draft,
  controlled: DecisionEngineControlledMaterialItem[]): boolean {
  const context = shadowCanonicalRequest().decisionContext;
  const expected = new Map<string, DecisionEngineControlledMaterialItem[]>();
  for (const item of controlled) {
    if (!["short_term_consequence", "long_term_consequence"].includes(item.itemType)) continue;
    const source = item.sourceProvenanceRef;
    const sourceMatch = /^(option|scenario|constraint)_([1-9]\d*)$/.exec(source);
    const canonicalSource = ["question_1", "objective_1"].includes(source) ? context.decisionId
      : sourceMatch?.[1] === "constraint" ? context.constraints[Number(sourceMatch[2]) - 1]?.id
      : sourceMatch ? context.options[Number(sourceMatch[2]) - 1]?.id : undefined;
    if (!canonicalSource || normalizedShadowJson(item.sourceContextEntityIds) !== normalizedShadowJson([canonicalSource])) continue;
    const links = [...item.optionIds, ...item.scenarioOptionIds];
    if (sourceMatch && sourceMatch[1] !== "constraint") links.push(canonicalSource);
    const ids = [...new Set(links)];
    if (ids.length !== 1 || !context.options.some((option) => option.id === ids[0])) continue;
    if (sourceMatch?.[1] === "constraint") {
      const constraint = context.constraints[Number(sourceMatch[2]) - 1];
      if (constraint.appliesToOptionIds.length > 0 && !constraint.appliesToOptionIds.includes(ids[0])) continue;
    }
    const key = consequenceSemanticKey({ optionId: ids[0],
      horizon: item.itemType === "short_term_consequence" ? "short_term" : "long_term", description: item.content });
    expected.set(key, [...(expected.get(key) ?? []), item]);
  }
  const original = baseline.analysis?.consequences ?? [];
  const actual = replay.analysis?.consequences ?? [];
  const additions = actual.filter((entry) => !original.some((before) => normalizedShadowJson(before) === normalizedShadowJson(entry)));
  if (!validateSimulationResponseV2DraftShape(replay) || !containsOriginalEntries(original, actual) || additions.length !== expected.size) return false;
  return additions.every((entry) => {
    const key = consequenceSemanticKey(entry), sources = expected.get(key);
    if (!sources || entry.scenarioId !== undefined || !sources.some((item) => item.content === entry.description) ||
        entry.id !== `consequence_${createHash("sha256").update(JSON.stringify([baseline.requestId, context.decisionId, key])).digest("hex")}`) return false;
    const origins = sources.map((item) => ({ source: "controlled_material", materialItemId: item.materialItemId, sourceRef: item.sourceProvenanceRef }));
    const sortedOrigins = (values: unknown[]) => values.map(normalizedShadowJson).sort();
    return normalizedShadowJson(sortedOrigins(entry.provenance.origins)) === normalizedShadowJson(sortedOrigins(origins)) &&
      entry.provenance.independentlyVerified === false &&
      normalizedShadowJson([...entry.sourceEntityIds].sort()) === normalizedShadowJson([...new Set(sources.flatMap((item) => item.sourceContextEntityIds))].sort()) &&
      sources.every((item) => normalizeConsequenceDescription(item.content) === normalizeConsequenceDescription(entry.description));
  });
}

/** Guards authority while permitting only additive qualitative composition. */
export function shadowProtectedInvariants(baseline: SimulationResponseV2Draft,
  replay: SimulationResponseV2Draft | null, controlled: DecisionEngineControlledMaterialItem[] = []) {
  if (!replay) return {
    assessed: false, recommendationPreserved: true, numericPreserved: true,
    safetyPreserved: true, deterministicCalculationsPreserved: true, qualitativeAdditionsOnly: true,
    boundedContradictionAdditionsOnly: true,
    boundedConsequenceAdditionsOnly: true,
  };
  const scenarios = baseline.analysis?.scenarios ?? [];
  const boundedConsequenceAdditionsOnly = boundedConsequenceAdditions(baseline, replay, controlled);
  const risks = baseline.analysis?.risks ?? [];
  const newContradictions = replay.contradictions.filter((entry) => !baseline.contradictions.some((original) =>
    normalizedShadowJson(original) === normalizedShadowJson(entry)));
  const newContradictionTraces = replay.traceability.contradictions.filter((entry) => !baseline.traceability.contradictions.some((original) =>
    normalizedShadowJson(original) === normalizedShadowJson(entry)));
  const boundedContradictionAdditionsOnly = containsOriginalEntries(baseline.contradictions, replay.contradictions) &&
    containsOriginalEntries(baseline.traceability.contradictions, replay.traceability.contradictions) &&
    new Set(newContradictions.map((entry) => entry.id)).size === newContradictions.length &&
    newContradictionTraces.length === newContradictions.length && newContradictions.every((entry) => {
        const item = controlled.find((candidate) => entry.id === `contradiction_${candidate.materialItemId}`);
        const optionIds = item ? [...new Set([...item.optionIds, ...item.scenarioOptionIds])] : [];
        return item?.itemType === "contradiction" && /^constraint_[1-9]\d*$/.test(item.sourceProvenanceRef) &&
          item.sourceContextEntityIds.length === 1 && optionIds.length <= 1 &&
          entry.code === "contradiction_detected" && entry.category === "contradiction" &&
          entry.severity === "optional" && entry.recommendationImpact === "no_material_change" &&
          entry.resolution === "unresolved" && entry.description === item.content &&
          normalizedShadowJson(entry.affectedEntityIds) === normalizedShadowJson([
            ...item.sourceContextEntityIds, ...optionIds, item.materialItemId,
          ]) && entry.reason.includes(`provenance=${item.sourceProvenanceRef};`) &&
          entry.reason.includes("independently_verified=false") && entry.reason.includes("deterministic_calculation=false") &&
          replay.traceability.contradictions.some((trace) => normalizedShadowJson(trace) === normalizedShadowJson(entry));
      }) && newContradictionTraces.every((entry) =>
        replay.contradictions.some((contradiction) => normalizedShadowJson(contradiction) === normalizedShadowJson(entry)),
      );
  const qualitativeAdditionsOnly = scenarios.every((scenario) => {
    const target = replay.analysis?.scenarios.find((item) => item.id === scenario.id);
    if (!target || !containsOriginalEntries(scenario.dependencies, target.dependencies)) return false;
    return target.dependencies.filter((dependency) => !scenario.dependencies.some((original) =>
      normalizedShadowJson(original) === normalizedShadowJson(dependency))).every((dependency) => {
        const item = controlled.find((candidate) => candidate.materialItemId === dependency.id);
        const links = item ? [...new Set([...item.optionIds, ...item.scenarioOptionIds])] : [];
        return item?.itemType === "dependency" && links.length === 1 && links[0] === scenario.optionId &&
          dependency.kind === "constraint" && dependency.status === "unknown" &&
          dependency.materiality === "supporting" && dependency.description === item.content;
      });
  }) && risks.every((risk) => {
    const target = replay.analysis?.risks.find((item) => item.id === risk.id);
    if (!target || !containsOriginalEntries(risk.traceEntries, target.traceEntries)) return false;
    return target.traceEntries.filter((entry) => !risk.traceEntries.some((original) =>
      normalizedShadowJson(original) === normalizedShadowJson(entry))).every((entry) =>
      entry.rule === "risk_classification" && entry.detail.startsWith("Accepted qualitative risk signal [") &&
      entry.detail.includes("deterministic_calculation=false") && controlled.some((item) =>
        item.itemType === "risk_signal" && entry.sourceEntityIds.includes(item.materialItemId) &&
        [...new Set([...item.optionIds, ...item.scenarioOptionIds])].length === 1 &&
        [...item.optionIds, ...item.scenarioOptionIds].includes(risk.optionId)),
    );
  });
  return {
    assessed: true,
    recommendationPreserved: shadowFingerprint(baseline.recommendation) === shadowFingerprint(replay.recommendation),
    numericPreserved: shadowFingerprint(numericMetrics(baseline)) === shadowFingerprint(numericMetrics(replay)),
    safetyPreserved: shadowFingerprint({ safety: baseline.safety, status: baseline.status }) ===
      shadowFingerprint({ safety: replay.safety, status: replay.status }),
    deterministicCalculationsPreserved: boundedContradictionAdditionsOnly && boundedConsequenceAdditionsOnly &&
      shadowFingerprint(protectedCalculations(baseline)) === shadowFingerprint(protectedCalculations(replay)),
    qualitativeAdditionsOnly, boundedContradictionAdditionsOnly, boundedConsequenceAdditionsOnly,
  };
}

type CandidateDisposition = "accepted_mapped" | "accepted_unmapped" | "duplicate" | "rejected" | "packet_failure";
export type ShadowCandidateAccounting = {
  candidateId: string;
  candidateType: string;
  disposition: CandidateDisposition;
  validationReason: string;
  ledgerDisposition: string | null;
  ledgerTraceMarker: string | null;
  mergedIntoCandidateId: string | null;
  controlledMaterialIds: string[];
  structuredContradictionIds: string[];
  structuredConsequenceIds: string[];
  structuredInformationGapIds: string[];
  gapTargetBound: boolean;
  gapKnownSuppressed: boolean;
  gapDuplicateMerged: boolean;
  downstreamRefs: string[];
  simulationPaths: string[];
  uiPaths: string[];
  homePaths: string[];
  savePaths: string[];
  tracePresent: boolean;
  noticePresent: boolean;
  traceOnly: boolean;
};

type PacketFailure = { stage: string; reason: string; category: string };

function observedCandidates(packet: unknown): { candidateId: string; candidateType: string }[] {
  if (!packet || typeof packet !== "object" || !Array.isArray((packet as { items?: unknown }).items)) return [];
  return (packet as { items: Record<string, unknown>[] }).items.map((item, index) => ({
    candidateId: typeof item?.candidate_id === "string" ? item.candidate_id : `unresolved_candidate_${index + 1}`,
    candidateType: typeof item?.item_type === "string" ? item.item_type : "unknown",
  }));
}

function candidateAccounting(packet: unknown, ledger: SemanticPreservationLedgerEntry[],
  controlled: DecisionEngineControlledMaterialItem[], baseline: SimulationResponseV2Draft,
  replay: SimulationResponseV2Draft | null, failure: PacketFailure | null, gaps: InformationGapEvaluation): ShadowCandidateAccounting[] {
  const baselineUi = mapSimulationResponseV2ToUiModel(baseline);
  const replayUi = replay ? mapSimulationResponseV2ToUiModel(replay) : null;
  const beforeSave = shadowSaveProjection(baseline), afterSave = replay ? shadowSaveProjection(replay) : null;
  return observedCandidates(packet).map((candidate) => {
    const entry = ledger.find((item) => item.candidate_id === candidate.candidateId);
    const targetId = entry?.normalized_or_merged_item_id ?? candidate.candidateId;
    const mapped = controlled.filter((item) => item.sourceCandidateIds.includes(targetId));
    const ids = mapped.map((item) => item.materialItemId);
    const paths = (before: unknown, after: unknown) => mapped.flatMap((item) => newMaterialPaths(before, after, item.content));
    const simulationPaths = replay ? paths(simulationStructure(baseline), simulationStructure(replay)) : [];
    const uiPaths = replayUi ? paths(baselineUi.sections, replayUi.sections) : [];
    // Current Home V2 renders scenario conditions, not all mapped sections.
    const homePaths = uiPaths.filter((path) => path.startsWith("$.scenarios.items[") && path.includes(".triggerConditions["));
    const savePaths = afterSave ? paths(beforeSave, afterSave) : [];
    const tracePresent = Boolean(replay && replay.traceability.evidence.some((item) => ids.includes(item.id)));
    const noticePresent = Boolean(replay && mapped.some((item) => replay.notices.some((notice) => notice.message === item.content)));
    const structuredContradictionIds = replay?.contradictions.filter((entry) =>
      ids.some((id) => entry.affectedEntityIds.includes(id)),
    ).map((entry) => entry.id) ?? [];
    const structuredConsequenceIds = replay?.analysis?.consequences?.filter((entry) => entry.provenance.origins.some((origin) =>
      origin.source === "controlled_material" && ids.includes(origin.materialItemId))).map((entry) => entry.id) ?? [];
    const gapReceipt = gaps.accounting.find((item) => item.candidateId === candidate.candidateId);
    const gap = gaps.observations.find((item) => item.id === gapReceipt?.observationId);
    const structuredInformationGapIds = gap?.resolution === "ACTIVE" ? [gap.id] : [];
    const disposition: CandidateDisposition = failure ? "packet_failure"
      : entry?.disposition === "merged_as_duplicate" ? "duplicate"
      : entry?.disposition.startsWith("rejected") || entry?.disposition === "controlled_failure" ? "rejected"
      : entry?.downstream_mapping.status === "mapped" ? "accepted_mapped" : "accepted_unmapped";
    return {
      ...candidate, disposition, validationReason: failure?.reason ?? entry?.reason ?? "missing_disposition",
      ledgerDisposition: entry?.disposition ?? null, ledgerTraceMarker: entry?.traceability_marker ?? null,
      mergedIntoCandidateId: entry?.disposition === "merged_as_duplicate" ? targetId : null,
      controlledMaterialIds: ids, structuredContradictionIds, structuredConsequenceIds, structuredInformationGapIds,
      gapTargetBound: gapReceipt?.targetBound ?? false, gapKnownSuppressed: gap?.resolution === "SUPPRESSED_ALREADY_KNOWN",
      gapDuplicateMerged: gapReceipt?.disposition === "DUPLICATE_MERGED", downstreamRefs: entry?.downstream_mapping.target_refs ?? [],
      simulationPaths, uiPaths, homePaths, savePaths, tracePresent, noticePresent,
      traceOnly: !failure && ids.length > 0 && tracePresent && simulationPaths.length === 0 && !gapReceipt?.targetBound,
    };
  });
}

export async function evaluateShadowFixture(fixture: ShadowFixture, canonicalRequest = shadowCanonicalRequest()) {
  const request = structuredClone(canonicalRequest);
  const inputFingerprint = shadowFingerprint(request);
  const input = {
    contractVersion: "2.0" as const, requestId: request.bridgeId,
    input: { originalText: request.decisionContext.statement, inputLanguage: request.locale, requestedOutputLanguage: request.locale },
    userIntent: "compare" as const, suppliedContext: structuredClone(request.decisionContext.evidence),
    suppliedOptions: structuredClone(request.decisionContext.options),
  };
  const baseline = fixedResponse(runSimulationPipeline(input, {
    context: structuredClone(request.decisionContext), safety: structuredClone(request.safety), safetyContextComplete: true,
  }));
  if (baseline.status === "failed" || !validateSimulationResponseV2DraftShape(baseline) || !shadowSaveProjection(baseline)) {
    throw new Error("Shadow baseline must be a valid, persistable deterministic simulation.");
  }
  const bridge = bridgeDecisionEngineToPromptContext(structuredClone(request));
  if (bridge.status !== "ready") throw new Error("Canonical shadow bridge failed.");
  const fakeCalls = { tokenCount: 0, generation: 0 };
  const requests: string[] = [];
  const transport: DecisionMaterialTransport = {
    async countInput(providerRequest) { fakeCalls.tokenCount++; requests.push(shadowFingerprint(providerRequest)); return 1200; },
    async generate(providerRequest) {
      fakeCalls.generation++; requests.push(shadowFingerprint(providerRequest));
      return { status: "completed", outputText: JSON.stringify(fixture.packet),
        usage: { inputTokens: 1200, outputTokens: 700, totalTokens: 1900 } };
    },
  };
  const adapter = await executeCandidateDecisionMaterial(bridge.promptContextOutput, {
    enabled: true, apiKeyAvailable: true, provider: OPENAI_DECISION_MATERIAL_PROVIDER,
    transport, requestedAt: SHADOW_FIXED_TIME, now: () => 0,
  }, request);
  let replay: SimulationResponseV2Draft | null = null;
  let informationGaps: InformationGapEvaluation = { status: "evaluated", observations: [], accounting: [], questionsCreated: 0, lifecycleTransitions: 0 };
  let controlled: DecisionEngineControlledMaterialItem[] = [];
  let ledger: SemanticPreservationLedgerEntry[] = [];
  let failure: PacketFailure | null = null;
  let replayInputFingerprint = shadowFingerprint(request);
  if (adapter.status !== "completed") {
    failure = { stage: "provider_adapter", category: adapter.error.category,
      reason: adapter.error.groundingFailure?.predicate ??
        inspectCandidateDecisionMaterialContract(fixture.packet).issue ?? adapter.error.category };
  } else {
    const boundary = composePostProviderDecisionMaterial({
      boundaryId: `shadow_${fixture.caseId}`, bridgeRequest: structuredClone(request), candidateMaterial: adapter.candidateMaterial,
    });
    ledger = boundary.acceptance?.ledger ?? [];
    if (boundary.status !== "composed") failure = { stage: "post_provider_boundary", category: boundary.error.code, reason: boundary.error.code };
    else {
      const source = boundary.simulationSource;
      replayInputFingerprint = shadowFingerprint({
        bridgeId: source.requestId, submittedAt: source.generatedAt, locale: source.inputLanguage,
        decisionContext: source.decisionContext, ...(source.safety ? { safety: source.safety } : {}),
      });
      controlled = boundary.controlledMaterial.items;
      const composed = composePostProviderSimulationResponse(boundary);
      if (composed.status !== "composed") failure = { stage: "simulation_composition", category: composed.error.code, reason: composed.error.code };
      else { replay = fixedResponse(composed.response); informationGaps = composed.informationGaps; }
    }
  }
  const accounting = candidateAccounting(fixture.packet, ledger, controlled, baseline, replay, failure, informationGaps);
  const invariants = shadowProtectedInvariants(baseline, replay, controlled);
  const simulationPaths = replay ? changedPaths(simulationStructure(baseline), simulationStructure(replay)) : [];
  const uiPaths = replay ? changedPaths(mapSimulationResponseV2ToUiModel(baseline), mapSimulationResponseV2ToUiModel(replay)) : [];
  const noticeCodes = replay ? replay.notices.filter((notice) =>
    !baseline.notices.some((item) => normalizedShadowJson(item) === normalizedShadowJson(notice))).map((item) => item.code) : [];
  const numericPaths = replay ? changedPaths(numericMetrics(baseline), numericMetrics(replay)) : [];
  const withoutConsequences = replay ? structuredClone(replay) : null;
  if (withoutConsequences?.analysis) delete withoutConsequences.analysis.consequences;
  const projected = replay ? shadowSaveProjection(replay) : null;
  const restored = projected ? decodeStoredDecisionConsequences(projected.deterministic_output_snapshot) : null;
  const withoutStoredConsequences = projected ? structuredClone(projected) : null;
  if (withoutStoredConsequences) {
    const analysis = withoutStoredConsequences.deterministic_output_snapshot.analysis as Record<string, unknown>;
    delete analysis.consequences;
    delete analysis.consequenceReferences;
  }
  const result = {
    caseId: fixture.caseId, group: fixture.group, candidateType: fixture.candidateType,
    baselineFingerprint: shadowFingerprint(baseline), canonicalInputFingerprint: inputFingerprint,
    replayInputFingerprint, candidateIds: accounting.map((item) => item.candidateId),
    accounting, packetFailure: failure, fakeTransportCalls: fakeCalls,
    structuredContradictionIds: [...new Set(accounting.flatMap((item) => item.structuredContradictionIds))],
    structuredConsequenceIds: [...new Set(accounting.flatMap((item) => item.structuredConsequenceIds))],
    informationGaps,
    clarificationLifecycleUnchanged: replay ? normalizedShadowJson(baseline.clarification) === normalizedShadowJson(replay.clarification) &&
      baseline.status === replay.status : null,
    identicalTransportRequest: requests.length === 2 && requests[0] === requests[1],
    simulationDelta: { comparable: Boolean(replay), substantive: replay ? simulationPaths.length > 0 : null, paths: simulationPaths },
    recommendationDelta: { comparable: Boolean(replay), changed: replay ? !invariants.recommendationPreserved : null },
    numericMetricDelta: { comparable: Boolean(replay), changed: replay ? numericPaths.length > 0 : null, paths: numericPaths },
    consequenceFoundation: {
      uiMappingUnchanged: replay && withoutConsequences ? shadowFingerprint(mapSimulationResponseV2ToUiModel(replay)) ===
        shadowFingerprint(mapSimulationResponseV2ToUiModel(withoutConsequences)) : null,
      saveAuthorityUnchanged: replay && withoutConsequences ? shadowFingerprint(withoutStoredConsequences) ===
        shadowFingerprint(shadowSaveProjection(withoutConsequences)) : null,
      storedConsequencesPreserved: replay ? restored?.valid === true &&
        normalizedShadowJson(restored.consequences) === normalizedShadowJson(replay.analysis?.consequences) : null,
    },
    uiVisibility: { comparable: Boolean(replay), mappingChanged: replay ? uiPaths.length > 0 : null,
      materialVisible: replay ? accounting.some((item) => item.uiPaths.length > 0) : null,
      homeRendered: replay ? accounting.some((item) => item.homePaths.length > 0) : null },
    saveRetention: { comparable: Boolean(replay), projectionAvailable: Boolean(replay && shadowSaveProjection(replay)),
      materialRetained: replay ? accounting.some((item) => item.savePaths.length > 0) : null,
      candidateIds: accounting.filter((item) => item.savePaths.length > 0).map((item) => item.candidateId) },
    traceNotices: { evidenceCandidateIds: accounting.filter((item) => item.tracePresent).map((item) => item.candidateId),
      noticeCodes, noticeCandidateIds: accounting.filter((item) => item.noticePresent).map((item) => item.candidateId),
      riskAnnotationCandidateIds: controlled.filter((item) => replay?.analysis?.risks.some((risk) =>
        risk.traceEntries.some((entry) => entry.sourceEntityIds.includes(item.materialItemId)))).flatMap((item) => item.sourceCandidateIds) },
    traceOnly: Boolean(replay && simulationPaths.length === 0 && accounting.some((item) => item.traceOnly)),
    protectedInvariants: invariants, limitation: fixture.limitation ?? null,
  };
  return result;
}

export type ShadowCaseReport = Awaited<ReturnType<typeof evaluateShadowFixture>>;

export function summarizeShadowCases(cases: ShadowCaseReport[]) {
  const accounting = cases.flatMap((item) => item.accounting);
  return {
    cases: cases.length, candidates: accounting.length,
    accepted: accounting.filter((item) => item.disposition.startsWith("accepted_")).length,
    rejected: accounting.filter((item) => item.disposition === "rejected").length,
    duplicate: accounting.filter((item) => item.disposition === "duplicate").length,
    packetFailures: cases.filter((item) => item.packetFailure).length,
    packetFailureCandidates: accounting.filter((item) => item.disposition === "packet_failure").length,
    substantiveSimulationDeltas: cases.filter((item) => item.simulationDelta.substantive).length,
    structuredContradictionCases: cases.filter((item) => item.structuredContradictionIds.length > 0).length,
    structuredConsequenceCases: cases.filter((item) => item.structuredConsequenceIds.length > 0).length,
    uiVisibleDeltas: cases.filter((item) => item.uiVisibility.materialVisible).length,
    homeRenderedDeltas: cases.filter((item) => item.uiVisibility.homeRendered).length,
    saveRetainedDeltas: cases.filter((item) => item.saveRetention.materialRetained).length,
    traceOnlyCases: cases.filter((item) => item.traceOnly).length,
    unauthorizedRecommendationChanges: cases.filter((item) => !item.protectedInvariants.recommendationPreserved).length,
    unauthorizedNumericChanges: cases.filter((item) => !item.protectedInvariants.numericPreserved).length,
    unauthorizedSafetyChanges: cases.filter((item) => !item.protectedInvariants.safetyPreserved).length,
    unauthorizedDeterministicChanges: cases.filter((item) => !item.protectedInvariants.deterministicCalculationsPreserved ||
      !item.protectedInvariants.qualitativeAdditionsOnly || !item.protectedInvariants.boundedContradictionAdditionsOnly ||
      !item.protectedInvariants.boundedConsequenceAdditionsOnly).length,
  };
}

export async function runShadowSemanticDeltaEvaluation() {
  const cases: ShadowCaseReport[] = [];
  for (const fixture of createShadowSemanticDeltaCorpus()) cases.push(await evaluateShadowFixture(fixture));
  const matrix = SHADOW_SEMANTIC_TYPES.map((type: ShadowSemanticType) => ({
    type, ...summarizeShadowCases(cases.filter((item) => item.group === "semantic" && item.candidateType === type)),
  }));
  const informationGapCases: ShadowCaseReport[] = [];
  for (const { fixture, request } of createInformationGapShadowFixtures()) informationGapCases.push(await evaluateShadowFixture(fixture, request));
  return {
    version: "controlled-ai-shadow-semantic-delta.5", execution: "offline_synthetic_replay_only",
    providerQualityAssessed: false, productionAiActivated: false,
    providerOperations: 0, networkRequests: 0, credentialReads: 0,
    uiVisibilityScope: "existing_v2_mapping; home_rendering_reported_separately",
    saveRetentionScope: "pure_payload_projection_only; no_database_save_or_restore_claim",
    consequencePersistence: "VALIDATED SNAPSHOT DURABILITY",
    summary: summarizeShadowCases(cases), matrix, cases,
    informationGapCases, informationGapMatrix: summarizeInformationGapCases(informationGapCases),
  };
}

export function summarizeInformationGapCases(cases: ShadowCaseReport[]) {
  return (["unknown", "clarification_need"] as const).map((kind) => {
    const accounts = cases.flatMap((item) => item.accounting.filter((entry) => entry.candidateType === kind));
    const observations = cases.flatMap((item) => item.informationGaps.observations.filter((entry) => entry.kinds.includes(kind)));
    return { type: kind, accepted: accounts.filter((entry) => entry.disposition.startsWith("accepted_")).length,
      targetBound: accounts.filter((entry) => entry.gapTargetBound).length,
      structuredGaps: observations.filter((entry) => entry.resolution === "ACTIVE").length,
      knownSuppressed: observations.filter((entry) => entry.resolution === "SUPPRESSED_ALREADY_KNOWN").length,
      duplicateMerged: accounts.filter((entry) => entry.gapDuplicateMerged).length,
      materiality: { nonMaterial: observations.filter((entry) => entry.resolution === "ACTIVE" && entry.materiality === "non_material").length,
        material: observations.filter((entry) => entry.resolution === "ACTIVE" && entry.materiality === "material").length,
        blocking: observations.filter((entry) => entry.resolution === "ACTIVE" && entry.materiality === "blocking").length },
      wouldRequireClarification: observations.filter((entry) => entry.resolution === "ACTIVE" && entry.wouldRequireClarification).length,
      clarificationTriggered: cases.reduce((count, entry) => count + entry.informationGaps.lifecycleTransitions, 0),
      recommendationDelta: cases.filter((entry) => entry.accounting.some((item) => item.candidateType === kind) && entry.recommendationDelta.changed).length,
      numericDelta: cases.filter((entry) => entry.accounting.some((item) => item.candidateType === kind) && entry.numericMetricDelta.changed).length,
      safetyDelta: cases.filter((entry) => entry.accounting.some((item) => item.candidateType === kind) && !entry.protectedInvariants.safetyPreserved).length,
      traceOnly: accounts.filter((entry) => entry.traceOnly).length,
    };
  });
}

export type ShadowSemanticDeltaReport = Awaited<ReturnType<typeof runShadowSemanticDeltaEvaluation>>;
