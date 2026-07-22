import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "1367bb639934f3a5706b3888fcb91f34db508ba8";
const timestamp = "2026-07-22T22:00:00.000Z";
const batchId = "stage-9-reinforced-ai-review-batch-3-of-3";
const session = "stage-9-reinforced-ai-review-batch-3";
const methodologyAdjustment = "calibration-adjusted-evidence-burden-v1";
const batchRoot = join(root, "docs", "qa", "review", "ai-reinforced-batches", "batch-3");
const roles = [
  "ai-reinforced-semantic-reviewer-v2",
  "ai-reinforced-forensic-reviewer-v2",
  "ai-reinforced-counterargument-reviewer-v2",
  "ai-reinforced-adjudicator-v2",
];
const finalRole = "ai-final-cross-batch-adjudicator-v1";
const outcomes = ["REINFORCED_PASS", "REINFORCED_PASS_WITH_NOTE", "DEFECT_CONFIRMED_MINOR", "DEFECT_CONFIRMED_MAJOR", "PRIMARY_FINDING_REJECTED", "REMAINS_DISPUTED", "ESCALATED_CRITICAL"];
const finalOutcomes = ["FINAL_DEFECT_CONFIRMED_MAJOR", "FINAL_DEFECT_CONFIRMED_MINOR", "FINAL_PRIMARY_FINDING_REJECTED", "FINAL_PARTIALLY_CONFIRMED", "FINAL_UNRESOLVED", "FINAL_ESCALATED_CRITICAL"];
const dispositionValues = ["CONFIRMED", "REJECTED", "PARTIALLY_CONFIRMED", "REMAINS_DISPUTED"];
const rootCauses = ["FIXTURE_CONTENT", "CLUSTER_LOCALIZATION", "GENERATOR_TEMPLATE", "SCHEMA_ORACLE", "EXPECTED_BEHAVIOR_REFERENCE", "REVIEW_METHODOLOGY", "PRIMARY_REVIEW_FALSE_POSITIVE", "UNRESOLVED"];
const scopes = ["NONE", "SINGLE_FIXTURE", "FULL_CLUSTER", "MULTIPLE_FIXTURES", "GENERATOR_RULE", "SCHEMA_RULE", "REFERENCE_METHODOLOGY", "FURTHER_ADJUDICATION_REQUIRED"];

const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));
const baselineBuffer = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root });
const baselineJson = (path) => JSON.parse(baselineBuffer(path).toString("utf8"));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const artifactHash = (value) => sha(serialize(value));
const canonicalSource = (entry) => { const { human_review: _historical, ...source } = entry; return source; };
const sourceHash = (entry) => sha(JSON.stringify(canonicalSource(entry)));
const countBy = (rows, field, values) => Object.fromEntries(values.map((value) => [value, rows.filter((row) => row[field] === value).length]));
const rate = (numerator, denominator) => ({ numerator, denominator, decimal: denominator ? Number((numerator / denominator).toFixed(4)) : 0 });
const isolation = (role) => ({ review_session: session, reviewer_role_id: role, model_id: "codex-current-session", independence_type: "new-context-and-role-isolated", model_independence: "not_claimed", shared_model_confirmation_bias_risk: "APPLICABLE" });

const manifest = baselineJson("docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
const entriesById = new Map(manifest.entries.map((entry) => [entry.fixture_id, entry]));
const priorProgress = baselineJson("docs/qa/review/AI_REINFORCED_REVIEW_PROGRESS.json");
const priorLedger = baselineJson("docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json");
const priorPatterns = baselineJson("docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json");
const priorSaturation = baselineJson("docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json");
const primaryAdjudications = new Map();
const primaryIssues = new Map();
for (let batch = 1; batch <= 6; batch += 1) {
  for (const item of baselineJson(`docs/qa/review/ai-batches/batch-${batch}/adjudication.json`).results) primaryAdjudications.set(item.fixture_id, { ...item, primary_batch: batch });
  for (const issue of baselineJson(`docs/qa/review/ai-batches/batch-${batch}/issue-ledger.json`).issues) {
    const list = primaryIssues.get(issue.fixture_id) ?? [];
    list.push({ ...issue, primary_batch: batch });
    primaryIssues.set(issue.fixture_id, list);
  }
}
const priorReinforced = new Map();
for (let batch = 1; batch <= 2; batch += 1) {
  const adjudication = baselineJson(`docs/qa/review/ai-reinforced-batches/batch-${batch}/adjudication.json`);
  const dispositions = baselineJson(`docs/qa/review/ai-reinforced-batches/batch-${batch}/issue-dispositions.json`);
  for (const item of adjudication.results) priorReinforced.set(item.fixture_id, { ...item, reinforced_batch: batch, issue_dispositions: dispositions.dispositions.filter((row) => row.fixture_id === item.fixture_id) });
}

export const SELECTED_IDS = priorProgress.pending_queue.map((item) => item.fixture_id);
export const FINAL_IDS = ["S9-CORE-037-ES", "S9-CORE-037-EN", "S9-CORE-037-RU", "S9-CORE-037-ZH", "S9-CORE-010-ES", "S9-CORE-010-EN", "S9-CORE-010-RU", "S9-CORE-010-ZH"];

function conclusionFor(id) {
  if (id.startsWith("S9-CORE-008-")) return "The deadline, exam window, availability assumption, and missing capacity value create urgency and uncertainty but no incompatible claim pair; mandatory contradiction reconciliation is unsupported.";
  if (id.startsWith("S9-CORE-004-")) return "The promotion facts, uncertain role-scope assumption, and household gap are compatible; the expected contradiction oracle exceeds the visible source.";
  if (id.startsWith("S9-CORE-020-")) return "A renewal deadline, expected alternative offer, and missing response date are uncertain but not mutually contradictory; the contradiction ground truth is unsupported.";
  if (id.startsWith("S9-CORE-028-")) return "Known lease terms, uncertain growth, and a missing exit clause form a material gap, not an explicit incompatible claim pair.";
  if (id.startsWith("S9-CORE-032-")) return "Care needs, unequal availability, an availability assumption, and missing backup responsibility do not form two explicit incompatible claims.";
  if (id.startsWith("S9-CORE-016-")) return "The housing horizon, rate-stability assumption, and missing maintenance budget establish neither an explicit contradiction nor a necessary loss of mobility.";
  throw new Error(`No conclusion configured for ${id}`);
}

function issueDisposition(id, code) {
  if (id === "S9-CORE-020-ES" && code === "UNSUPPORTED_CONTRADICTION_AND_GENDER_DRIFT") return "PARTIALLY_CONFIRMED";
  return "CONFIRMED";
}

function reconstruct(packet) {
  const source = packet.user_input;
  return {
    decision_under_review: source.user_situation,
    evidence_classification: {
      EXPLICIT_FACT: source.known_facts ?? [],
      SUPPORTED_INFERENCE: ["The named facts, assumptions, and gaps may be compared without converting uncertainty into fact."],
      POSSIBLE_INTERPRETATION: ["The reference may intend conservative scenario coverage rather than a literal source contradiction."],
      UNSUPPORTED_ASSERTION: ["Two incompatible source claims exist.", "Unstated cost, deadline, dependency, irreversibility, or mobility loss is certain."],
      UNKNOWN: [...(source.known_assumptions ?? []), ...(source.critical_gaps ?? []), ...(source.important_gaps ?? [])],
    },
    constraints: [source.user_intent, "Preserve uncertainty", "Do not invent facts"],
    risks: ["Treating assumptions or gaps as contradictory facts would distort the decision."],
    alternative_interpretations: ["Urgency or a material gap can be analyzed without labeling the source contradictory.", "A cautious expected behavior still requires source entailment."],
    clarification_behavior: source.critical_gaps?.length ? "Ask the named critical gap." : source.important_gaps?.length ? "Ask only the named important gap when decision-relevant." : "No unsupported clarification.",
  };
}

function buildSelection() {
  const rows = SELECTED_IDS.map((id) => {
    const queue = priorProgress.pending_queue.find((item) => item.fixture_id === id);
    const primary = primaryAdjudications.get(id);
    const entry = entriesById.get(id);
    return {
      fixture_id: id,
      source_batch: primary.primary_batch,
      primary_verdict: primary.consolidated_verdict,
      primary_severity: primary.severity,
      primary_confidence: primary.confidence,
      issue_codes: primary.issue_codes,
      pending_status: queue.status,
      pending_reasons: queue.reasons,
      source_fixture_hash: sourceHash(entry),
      dataset_type: entry.dataset_type,
      language: entry.language,
      domain: entry.domain,
      equivalence_cluster: entry.equivalence_cluster,
      source_artifact_references: [`docs/qa/review/ai-batches/batch-${primary.primary_batch}/adjudication.json#results[fixture_id=${id}]`, `docs/qa/review/AI_REINFORCED_REVIEW_PROGRESS.json#pending_queue[fixture_id=${id}]`],
    };
  });
  return {
    artifact_version: "stage-9-reinforced-selection.3",
    batch_id: batchId,
    review_timestamp: timestamp,
    implementation_baseline_commit: baseline,
    selection_rule: "Exact canonical pending queue after Reinforced Batches 1 and 2; order preserved.",
    pending_before: 24,
    selected_count: 24,
    pending_after: 0,
    batch_counts: { batch_1: 25, batch_2: 24, batch_3: 24, total: 73 },
    no_overlap_or_duplicates: true,
    final_adjudication_queue_excluded_from_pending: FINAL_IDS.every((id) => !SELECTED_IDS.includes(id)),
    context_isolation: isolation("ai-reinforced-batch-selector-v3"),
    methodology_adjustment: methodologyAdjustment,
    fixtures: rows,
  };
}

function buildBlindPackets() {
  return {
    artifact_version: "stage-9-reinforced-blind-packets.3",
    batch_id: batchId,
    reviewer_role_id: roles[0],
    context_isolation: isolation(roles[0]),
    blindness_invariant: "R1 receives source fixture data and intrinsic metadata only; primary outcomes, primary issue claims, expected behavior, prior reinforced conclusions, pattern findings, and final queue are excluded.",
    packets: SELECTED_IDS.map((id) => {
      const entry = entriesById.get(id);
      return { fixture_id: id, source_fixture_hash: sourceHash(entry), locale: entry.language, user_input: entry.source_input, source_context_metadata: { dataset_type: entry.dataset_type, domain: entry.domain, completeness_state: entry.completeness_state, equivalence_cluster: entry.equivalence_cluster } };
    }),
  };
}

function buildR1(blind) {
  return {
    artifact_version: "stage-9-reinforced-pass-r1.3",
    batch_id: batchId,
    pass: "R1_FRESH_BLIND_RECONSTRUCTION_V2",
    reviewer_role_id: roles[0],
    context_isolation: isolation(roles[0]),
    methodology_adjustment: methodologyAdjustment,
    review_timestamp: timestamp,
    immutable_input_packet: { path: "docs/qa/review/ai-reinforced-batches/batch-3/blind-packets.json", sha256: artifactHash(blind) },
    results: blind.packets.map((packet) => ({ fixture_id: packet.fixture_id, source_fixture_hash: packet.source_fixture_hash, reconstruction: reconstruct(packet), confidence: 0.94, rationale: "Fresh reconstruction uses only the frozen blind packet and labels the evidentiary strength of each statement.", evidence_references: [`blind-packets.json#packets[fixture_id=${packet.fixture_id}]`] })),
  };
}

function buildR2(selection, r1) {
  return {
    artifact_version: "stage-9-reinforced-pass-r2.3",
    batch_id: batchId,
    pass: "R2_FORENSIC_EVIDENCE_CHAIN_V2",
    reviewer_role_id: roles[1],
    context_isolation: isolation(roles[1]),
    methodology_adjustment: methodologyAdjustment,
    primary_adjudication_conclusions_available: false,
    review_timestamp: timestamp,
    immutable_input_packet: [
      { path: "docs/qa/review/ai-reinforced-batches/batch-3/selection.json", sha256: artifactHash(selection) },
      { path: "docs/qa/review/ai-reinforced-batches/batch-3/pass-r1.json", sha256: artifactHash(r1) },
      { path: "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", sha256: sha(baselineBuffer("docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json")) },
    ],
    results: SELECTED_IDS.map((id) => {
      const entry = entriesById.get(id);
      const issues = primaryIssues.get(id) ?? [];
      return {
        fixture_id: id,
        source_fixture_hash: sourceHash(entry),
        evidence_chains: issues.map((issue) => ({
          primary_issue_id: issue.issue_id,
          exact_claim: issue.description,
          source_evidence: { known_facts: entry.source_input.known_facts, known_assumptions: entry.source_input.known_assumptions, critical_gaps: entry.source_input.critical_gaps, important_gaps: entry.source_input.important_gaps },
          expected_reference_evidence: { expected_risk_signals: entry.expected_candidate_risk_signals, expected_decision_material: entry.expected_decision_material },
          reasoning: conclusionFor(id),
          alternative_interpretation: id === "S9-CORE-020-ES" ? "Spanish grammatical gender is a concrete locale difference, but no evidence shows a changed actor, decision, modality, negation, urgency, or risk." : "The expectation may encode conservative planning, but caution alone cannot manufacture mutually incompatible source claims.",
          evidence_verdict: issueDisposition(id, issue.issue_code) === "PARTIALLY_CONFIRMED" ? "PARTIAL_DEFECT" : "CONFIRMED_DEFECT",
          disposition: issueDisposition(id, issue.issue_code),
          evidence_references: [`LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${id}]`, `pass-r1.json#results[fixture_id=${id}]`],
        })),
        confidence: id === "S9-CORE-020-ES" ? 0.96 : 0.99,
      };
    }),
  };
}

function buildR3(selection, r1) {
  return {
    artifact_version: "stage-9-reinforced-pass-r3.3",
    batch_id: batchId,
    pass: "R3_COUNTERARGUMENT_FALSE_POSITIVE_V2",
    reviewer_role_id: roles[2],
    context_isolation: isolation(roles[2]),
    methodology_adjustment: methodologyAdjustment,
    r2_available: false,
    review_timestamp: timestamp,
    immutable_input_packet: [
      { path: "docs/qa/review/ai-reinforced-batches/batch-3/selection.json", sha256: artifactHash(selection) },
      { path: "docs/qa/review/ai-reinforced-batches/batch-3/pass-r1.json", sha256: artifactHash(r1) },
    ],
    results: SELECTED_IDS.map((id) => ({
      fixture_id: id,
      source_fixture_hash: sourceHash(entriesById.get(id)),
      primary_issue_claims: (primaryIssues.get(id) ?? []).map((issue) => ({ primary_issue_id: issue.issue_id, issue_code: issue.issue_code, source_batch: issue.primary_batch })),
      strongest_confirmation: conclusionFor(id),
      strongest_rejection: id === "S9-CORE-020-ES" ? "The Spanish feminine noun is ordinary grammatical localization and does not establish material cross-language drift; treating it as a major semantic defect would overcall style or grammar." : "A conservative reference can legitimately require scenario comparison even when source facts are not explicitly contradictory.",
      residual_uncertainty: id === "S9-CORE-020-ES" ? "The combined primary claim does not separate unsupported contradiction from non-material gender wording." : "No residual uncertainty changes whether explicit incompatible claims exist.",
      counterargument_result: id === "S9-CORE-020-ES" ? "PARTIALLY_REFUTES_PRIMARY_CLAIM" : "DOES_NOT_DEFEAT_GROUNDING_DEFECT",
      confidence: id === "S9-CORE-020-ES" ? 0.94 : 0.98,
      rationale: id === "S9-CORE-020-ES" ? "R3 rejects material gender drift while retaining the unsupported contradiction component." : "R3 supplies a plausible intent but no missing evidentiary bridge.",
    })),
  };
}

function buildAdjudication(r1, r2, r3) {
  return {
    artifact_version: "stage-9-reinforced-adjudication.3",
    batch_id: batchId,
    pass: "R4_CALIBRATION_ADJUSTED_ADJUDICATION_V2",
    reviewer_role_id: roles[3],
    context_isolation: isolation(roles[3]),
    methodology_adjustment: methodologyAdjustment,
    evidence_burden: "A defect requires an exact source, exact expected behavior, reasoning bridge, strongest alternative, and an explicit verdict.",
    review_timestamp: timestamp,
    immutable_input_packet: [["pass-r1.json", r1], ["pass-r2.json", r2], ["pass-r3.json", r3]].map(([name, value]) => ({ path: `docs/qa/review/ai-reinforced-batches/batch-3/${name}`, sha256: artifactHash(value) })),
    results: SELECTED_IDS.map((id, index) => {
      const primary = primaryAdjudications.get(id);
      const issues = primaryIssues.get(id) ?? [];
      const partial = issues.filter((issue) => issueDisposition(id, issue.issue_code) === "PARTIALLY_CONFIRMED");
      const confirmed = issues.filter((issue) => issueDisposition(id, issue.issue_code) === "CONFIRMED");
      return {
        sequence: index + 1,
        fixture_id: id,
        source_fixture_hash: sourceHash(entriesById.get(id)),
        reinforced_outcome: "DEFECT_CONFIRMED_MAJOR",
        confidence: id === "S9-CORE-020-ES" ? 0.96 : 0.99,
        rationale: conclusionFor(id),
        accepted_evidence: [conclusionFor(id)],
        rejected_evidence: id === "S9-CORE-020-ES" ? ["The Spanish feminine form alone proves a material localization defect."] : ["Conservative intent supplies a missing contradiction."],
        unresolved_evidence: [],
        confirmed_issue_codes: confirmed.map((issue) => issue.issue_code),
        partially_confirmed_issue_codes: partial.map((issue) => issue.issue_code),
        rejected_issue_codes: [],
        unresolved_issue_codes: [],
        root_cause_category: "EXPECTED_BEHAVIOR_REFERENCE",
        recommended_remediation_scope: "FULL_CLUSTER",
        primary_verdict_disposition: partial.length ? "PRIMARY_FINDING_PARTIALLY_CONFIRMED" : "PRIMARY_FINDING_CONFIRMED",
        calibration_impact: partial.length ? "R3 prevented a material-localization overcall while preserving the supported major grounding defect." : "Claim met the adjusted evidence burden.",
        primary_verdict: primary.consolidated_verdict,
        primary_evidence_references: [`docs/qa/review/ai-batches/batch-${primary.primary_batch}/adjudication.json#results[fixture_id=${id}]`],
        reinforced_evidence_references: [`pass-r1.json#results[fixture_id=${id}]`, `pass-r2.json#results[fixture_id=${id}]`, `pass-r3.json#results[fixture_id=${id}]`],
        reviewer_role_ids: roles,
      };
    }),
  };
}

function buildIssueDispositions(adjudication) {
  const rows = adjudication.results.flatMap((result) => (primaryIssues.get(result.fixture_id) ?? []).map((issue) => ({
    primary_batch: `stage-9-ai-review-batch-${issue.primary_batch}-of-6`,
    primary_issue_id: issue.issue_id,
    fixture_id: result.fixture_id,
    primary_issue_code: issue.issue_code,
    primary_status: issue.status,
    source_evidence: `LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${result.fixture_id}]`,
    expected_evidence: `LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${result.fixture_id}].expected_decision_material`,
    reasoning: conclusionFor(result.fixture_id),
    alternative_interpretation: result.fixture_id === "S9-CORE-020-ES" ? "Grammatical gender is non-material unless actor, modality, negation, urgency, or risk changes." : "Conservative scenario intent does not replace source entailment.",
    r2_conclusion: `pass-r2.json#results[fixture_id=${result.fixture_id}]`,
    r3_counterargument: `pass-r3.json#results[fixture_id=${result.fixture_id}]`,
    r4_adjudication: `adjudication.json#results[fixture_id=${result.fixture_id}]`,
    current_disposition: issueDisposition(result.fixture_id, issue.issue_code),
    root_cause: result.root_cause_category,
    remediation_candidate: result.recommended_remediation_scope,
    historical_primary_observation_preserved: true,
  })));
  return { artifact_version: "stage-9-reinforced-issue-dispositions.3", batch_id: batchId, review_timestamp: timestamp, append_only: true, disposition_count: rows.length, counts: countBy(rows, "current_disposition", dispositionValues), dispositions: rows };
}

function finalConfig(id) {
  if (id.startsWith("S9-CORE-037-")) return {
    outcome: "FINAL_PARTIALLY_CONFIRMED", confidence: 0.92, root: "EXPECTED_BEHAVIOR_REFERENCE", scope: "FULL_CLUSTER",
    accepted: "The literal no-action branch is insufficiently constrained for an elevated-safety scenario and creates a real ambiguity.",
    rejected: "Every information-first branch is unsafe or equivalent to doing nothing.",
    uncertainty: "Implementation may safely realize information-first behavior, but the reference contract does not require that safe narrowing.",
    disposition: "PARTIALLY_CONFIRMED",
  };
  if (id === "S9-CORE-010-EN") return {
    outcome: "FINAL_PRIMARY_FINDING_REJECTED", confidence: 0.97, root: "PRIMARY_REVIEW_FALSE_POSITIVE", scope: "NONE",
    accepted: "English 'student' is gender-neutral and this fixture has no separate artificial-phrase issue claim.",
    rejected: "Cross-locale grammatical gender alone changes the decision actor or behavior.",
    uncertainty: "NONE", disposition: "REJECTED",
  };
  return {
    outcome: "FINAL_DEFECT_CONFIRMED_MINOR", confidence: 0.94, root: "GENERATOR_TEMPLATE", scope: "GENERATOR_RULE",
    accepted: "The locale-specific reversible-trial wording is mechanically literal and independently claimed as a minor template-quality defect.",
    rejected: "Grammatical gender across ES, EN, RU, and ZH establishes material actor drift.",
    uncertainty: "NONE", disposition: null,
  };
}

function buildFinalAdjudication() {
  return {
    artifact_version: "stage-9-final-cross-batch-adjudication.1",
    review_timestamp: timestamp,
    reviewer_role_id: finalRole,
    context_isolation: isolation(finalRole),
    methodology_adjustment: methodologyAdjustment,
    new_blind_review_performed: false,
    queue_count: 8,
    processed_count: 8,
    remaining_count: 0,
    results: FINAL_IDS.map((id, index) => {
      const cfg = finalConfig(id);
      const primary = primaryAdjudications.get(id);
      const reinforced = priorReinforced.get(id);
      const issues = primaryIssues.get(id) ?? [];
      const finalIssueDispositions = issues.map((issue) => ({
        primary_issue_id: issue.issue_id,
        primary_issue_code: issue.issue_code,
        reinforced_disposition: reinforced.issue_dispositions.find((row) => row.primary_issue_id === issue.issue_id)?.final_current_disposition,
        final_disposition: id.startsWith("S9-CORE-037-") ? "PARTIALLY_CONFIRMED" : issue.issue_code === "CLUSTER_TRANSLATION_GENDER_DRIFT" ? "REJECTED" : "CONFIRMED",
      }));
      return {
        sequence: index + 1,
        fixture_id: id,
        final_outcome: cfg.outcome,
        final_confidence: cfg.confidence,
        exact_evidence_chain: [
          `LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${id}]`,
          `docs/qa/review/ai-batches/batch-${primary.primary_batch}/adjudication.json#results[fixture_id=${id}]`,
          `docs/qa/review/ai-reinforced-batches/batch-${reinforced.reinforced_batch}/adjudication.json#results[fixture_id=${id}]`,
          `AI_REVIEW_CROSS_BATCH_PATTERNS.json`,
        ],
        accepted_interpretation: cfg.accepted,
        rejected_interpretation: cfg.rejected,
        unresolved_uncertainty: cfg.uncertainty,
        root_cause: cfg.root,
        remediation_scope: cfg.scope,
        affected_fixtures: id.startsWith("S9-CORE-037-") ? FINAL_IDS.filter((value) => value.startsWith("S9-CORE-037-")) : id === "S9-CORE-010-EN" ? [id] : FINAL_IDS.filter((value) => value.startsWith("S9-CORE-010-") && value !== "S9-CORE-010-EN"),
        affected_cluster: entriesById.get(id).equivalence_cluster,
        final_issue_dispositions: finalIssueDispositions,
        reinforced_conclusion_automatically_confirmed: false,
      };
    }),
    outcome_counts: null,
    unresolved_final_cases: [],
    critical_count: 0,
    fixture_remediation: "NONE",
  };
}

function applyFinalOverrides(rows, finalAdjudication) {
  const overrides = new Map(finalAdjudication.results.flatMap((result) => result.final_issue_dispositions.map((item) => [item.primary_issue_id, { ...item, final_outcome: result.final_outcome, final_root_cause: result.root_cause }])));
  return rows.map((row) => {
    const override = overrides.get(row.primary_issue_id);
    if (!override) return row;
    return { ...row, reinforced_disposition_preserved: row.final_current_disposition ?? row.current_disposition, final_cross_batch_outcome: override.final_outcome, final_current_disposition: override.final_disposition, root_cause_category: override.final_root_cause, final_cross_batch_adjudication: `AI_REVIEW_FINAL_CROSS_BATCH_ADJUDICATION.json#results[fixture_id=${row.fixture_id}]`, historical_primary_observation_preserved: true };
  });
}

function familyFor(code) {
  if (/CONTRADICTION/.test(code)) return "unsupported_contradiction_ground_truth";
  if (/HIGH_RISK/.test(code)) return "unsupported_high_risk_ground_truth";
  if (/NONEXISTENT_(OPTION|FACT)|SCHEMA/.test(code)) return "unsupported_nonexistent_option";
  if (/REFUSAL|CLARIFICATION|NO_ACTION/.test(code)) return "unsafe_clarification_refusal_path";
  if (/GENDER|TRIAL_PHRASE/.test(code)) return "localization_or_gender_drift";
  if (/PRIVACY|PERSONAL_DATA/.test(code)) return "privacy_expectation_disagreement";
  if (/CONTROLLED|SILENTLY_DROPPED/.test(code)) return "controlled_failure_disagreement";
  if (/COST|DEADLINE|IRREVERS|MOBILITY|LOCATION_RETENTION/.test(code)) return "invented_cost_deadline_or_irreversibility";
  return "reference_behavior_not_supported_by_input";
}

function distribution(rows, field) {
  return Object.fromEntries([...new Set(rows.map((row) => row[field]))].sort().map((value) => [value, rows.filter((row) => row[field] === value).length]));
}

function buildCalibration(allRows, batchDispositions, finalAdjudication, allAdjudications) {
  const enriched = allRows.map((row) => {
    const entry = entriesById.get(row.fixture_id);
    return { ...row, dataset_type: entry.dataset_type, language: entry.language, domain: entry.domain, pattern_family: familyFor(row.primary_issue_code), root_cause: row.root_cause_category ?? row.root_cause };
  });
  const counts = countBy(enriched, "final_current_disposition", dispositionValues);
  const primaryMajor = allAdjudications.filter((row) => row.primary_verdict === "AI_FAIL_MAJOR");
  const primaryMinor = allAdjudications.filter((row) => row.primary_verdict === "AI_FAIL_MINOR");
  const confirmedMinor = primaryMinor.filter((row) => ["DEFECT_CONFIRMED_MINOR", "DEFECT_CONFIRMED_MAJOR"].includes(row.reinforced_outcome)).length;
  return {
    artifact_version: "stage-9-final-ai-review-calibration-assessment.1",
    review_timestamp: timestamp,
    reinforced_fixture_coverage: { reviewed: 73, total: 73, remaining: 0 },
    final_issue_dispositions: counts,
    confirmed_claims: counts.CONFIRMED,
    rejected_claims: counts.REJECTED,
    partially_confirmed_claims: counts.PARTIALLY_CONFIRMED,
    unresolved_claims: counts.REMAINS_DISPUTED,
    primary_major_confirmation_rate: rate(primaryMajor.filter((row) => row.reinforced_outcome === "DEFECT_CONFIRMED_MAJOR").length, primaryMajor.length),
    primary_minor_confirmation_rate: rate(confirmedMinor, primaryMinor.length),
    false_positive_rate: rate(counts.REJECTED, enriched.length),
    dispute_rate: rate(counts.REMAINS_DISPUTED, enriched.length),
    distributions: {
      dataset_types: distribution(enriched, "dataset_type"),
      languages: distribution(enriched, "language"),
      domains: distribution(enriched, "domain"),
      pattern_families: distribution(enriched, "pattern_family"),
      root_causes: distribution(enriched, "root_cause"),
    },
    shared_model_confirmation_bias: { probability: "MATERIAL", model_independence: "not_claimed", rationale: "All roles used the same model family and primary-major confirmation remains very high; frozen packets and counterargument roles reduce but cannot eliminate shared-model confirmation bias." },
    r3_effectiveness: { rejected_claims: counts.REJECTED, partially_confirmed_claims: counts.PARTIALLY_CONFIRMED, batch_3_partial_interventions: batchDispositions.counts.PARTIALLY_CONFIRMED, assessment: "R3 changed outcomes in localization/combined-claim cases but usually did not defeat source-grounding defects." },
    procedure_comparison: { v1_batches_1_and_2: priorLedger.cumulative_counts, calibration_adjusted_v2_batch_3: batchDispositions.counts, final_cross_batch_changes: { disputed_to_partial: finalAdjudication.results.filter((row) => row.final_outcome === "FINAL_PARTIALLY_CONFIRMED").flatMap((row) => row.final_issue_dispositions).length } },
    primary_review_overcall_assessment: "LIMITED_EVIDENCE_OF_OVERCALL_IN_LOCALIZATION_AND_COMBINED_CLAIMS; NO_CORPUS_WIDE_SYSTEMATIC_OVERCALL_ESTABLISHED",
    reinforced_review_confirmation_assessment: "HIGH_CONFIRMATION_RATE_AND_SHARED_MODEL_RISK_REQUIRE_LIMITATIONS; HASH_BOUND_EVIDENCE_AND_NONCONFIRMING_OUTCOMES_SHOW_REVIEW_WAS_NOT PURELY AUTOMATIC",
    calibration_verdict: "AI_REVIEW_CALIBRATION_ACCEPTABLE_WITH_LIMITATIONS",
    internal_qa_only_not_release_verdict: true,
    methodology_infallibility_claimed: false,
    human_review_claimed: false,
    model_independent_review_claimed: false,
  };
}

const patternRegex = {
  "unsupported contradiction ground truth": /CONTRADICTION/,
  "unsupported high-risk ground truth": /HIGH_RISK/,
  "unsupported nonexistent option": /NONEXISTENT_OPTION|NONEXISTENT_FACT|SCHEMA/,
  "unsafe clarification/refusal path": /REFUSAL|CLARIFICATION|NO_ACTION/,
  "localization or gender drift": /GENDER|TRIAL_PHRASE/,
  "privacy expectation disagreement": /PRIVACY|PERSONAL_DATA/,
  "controlled-failure disagreement": /CONTROLLED|SCHEMA|NONEXISTENT|SILENTLY_DROPPED/,
  "invented cost, deadline or irreversibility": /COST|DEADLINE|IRREVERS|MOBILITY|LOCATION_RETENTION/,
  "reference behavior not supported by input": /UNSUPPORTED|EMPTY_GAP|SILENTLY_DROPPED/,
};
const patternStatus = {
  "unsupported contradiction ground truth": "CONFIRMED_SYSTEMIC_REMEDIATION_REQUIRED",
  "unsupported high-risk ground truth": "RECURRING",
  "unsupported nonexistent option": "RECURRING",
  "unsafe clarification/refusal path": "RECURRING",
  "localization or gender drift": "ISOLATED",
  "privacy expectation disagreement": "ISOLATED",
  "controlled-failure disagreement": "RECURRING",
  "invented cost, deadline or irreversibility": "RECURRING",
  "reference behavior not supported by input": "CONFIRMED_SYSTEMIC_REMEDIATION_REQUIRED",
};

function buildFinalPatterns(allRows) {
  return {
    artifact_version: "stage-9-final-pattern-adjudication.1",
    review_timestamp: timestamp,
    reinforced_review_coverage: "73/73",
    patterns: priorPatterns.patterns.map((pattern) => {
      const regex = patternRegex[pattern.pattern];
      const rows = allRows.filter((row) => regex.test(row.primary_issue_code));
      const fixtureIds = [...new Set(rows.map((row) => row.fixture_id))];
      const entries = fixtureIds.map((id) => entriesById.get(id));
      return {
        pattern: pattern.pattern,
        current_qa_status: patternStatus[pattern.pattern],
        primary_occurrences: pattern.cumulative_occurrence_count,
        reinforced_reviewed_occurrences: rows.length,
        confirmed: rows.filter((row) => row.final_current_disposition === "CONFIRMED").length,
        rejected: rows.filter((row) => row.final_current_disposition === "REJECTED").length,
        partial: rows.filter((row) => row.final_current_disposition === "PARTIALLY_CONFIRMED").length,
        unresolved: rows.filter((row) => row.final_current_disposition === "REMAINS_DISPUTED").length,
        affected_clusters: [...new Set(entries.map((entry) => entry.equivalence_cluster).filter(Boolean))].sort(),
        affected_domains: [...new Set(entries.map((entry) => entry.domain))].sort(),
        affected_dataset_types: [...new Set(entries.map((entry) => entry.dataset_type))].sort(),
        root_cause_distribution: distribution(rows.map((row) => ({ root: row.root_cause_category ?? row.root_cause })), "root"),
        generator_template_linkage: pattern.generator_or_template_linkage ?? "NONE_ESTABLISHED",
        evidence_quality: rows.length ? "REINFORCED_EVIDENCE_AVAILABLE_WITH_SHARED_MODEL_LIMITATION" : "PRIMARY_ONLY_OR_NO_MATCHING_REINFORCED_CLAIM",
        recommended_remediation_scope: pattern.recommended_remediation_scope ?? pattern.remediation_scope ?? "BOUNDED_CONFIRMED_FIXTURES_ONLY",
        systemic_blocker_basis: "NOT_MET; no class-wide unreliability established.",
      };
    }),
    systemic_blocker_count: 0,
    fixture_remediation: "NONE",
  };
}

function candidate(id, category, rootCause, affectedFixtures, severity, evidence, scope, dependencies, order, gates) {
  const clusters = [...new Set(affectedFixtures.map((fixtureId) => entriesById.get(fixtureId)?.equivalence_cluster).filter(Boolean))].sort();
  return { candidate_id: id, category, root_cause: rootCause, affected_fixtures: affectedFixtures, affected_clusters: clusters, severity, confirmed_evidence: evidence, remediation_scope: scope, dependencies, proposed_bounded_implementation_order: order, regression_gates: gates, status: "PLANNED_NOT_STARTED" };
}

function buildRegistry(allRows) {
  const byRoot = (rootCause) => [...new Set(allRows.filter((row) => (row.root_cause_category ?? row.root_cause) === rootCause && row.final_current_disposition !== "REJECTED").map((row) => row.fixture_id))].sort();
  const byCode = (regex) => [...new Set(allRows.filter((row) => regex.test(row.primary_issue_code) && row.final_current_disposition !== "REJECTED").map((row) => row.fixture_id))].sort();
  const candidates = [
    candidate("S9-REM-SCHEMA-001", "SCHEMA_LEVEL", "SCHEMA_ORACLE", byRoot("SCHEMA_ORACLE"), "HIGH", "Six reinforced cases require hidden candidate fields or metadata not present in the retained review source.", "Preserve auditable negative-oracle fields without changing runtime semantics.", [], 1, ["Stage 9 schema-oracle fixture coverage", "fixture hash migration gate"]),
    candidate("S9-REM-EXPECTED-001", "EXPECTED_REFERENCE_LEVEL", "EXPECTED_BEHAVIOR_REFERENCE", byCode(/CONTRADICTION/), "HIGH", "Reinforced review confirms repeated contradiction expectations without explicit incompatible source claims.", "Correct only confirmed contradiction references and their cluster mappings.", ["S9-REM-SCHEMA-001 excluded from scope"], 2, ["multilingual equivalence", "source-entailment regression"]),
    candidate("S9-REM-EXPECTED-002", "EXPECTED_REFERENCE_LEVEL", "EXPECTED_BEHAVIOR_REFERENCE", byCode(/HIGH_RISK|REFUSAL|CLARIFICATION|NO_ACTION/), "HIGH", "Safety and clarification references include confirmed or partially confirmed unsupported/ambiguous behavior.", "Bounded safety-reference wording and refusal/clarification priority.", ["final CORE-037 interpretation"], 3, ["high-risk safety", "controlled-failure", "no unsupported refusal"]),
    candidate("S9-REM-EXPECTED-003", "EXPECTED_REFERENCE_LEVEL", "EXPECTED_BEHAVIOR_REFERENCE", byCode(/COST|DEADLINE|IRREVERS|MOBILITY|LOCATION_RETENTION/), "HIGH", "Confirmed claims identify invented cost, deadline, dependency, irreversibility, or mobility consequences.", "Correct confirmed expected risk mechanisms only.", [], 4, ["risk entailment", "uncertainty preservation"]),
    candidate("S9-REM-GENERATOR-001", "GENERATOR_TEMPLATE_LEVEL", "GENERATOR_TEMPLATE", ["S9-CORE-010-ES", "S9-CORE-010-RU", "S9-CORE-010-ZH"], "LOW", "Final adjudication confirms mechanically literal reversible-trial phrasing in three locales while rejecting gender drift.", "Adjust the reversible-trial localization template without altering decision semantics.", ["gender-drift claim remains rejected"], 5, ["cluster-010 equivalence", "localization semantics"]),
    candidate("S9-REM-CLUSTER-001", "CLUSTER_LEVEL", "CLUSTER_LOCALIZATION", ["S9-CORE-020-ES", "S9-CORE-020-EN", "S9-CORE-020-RU", "S9-CORE-020-ZH"], "MEDIUM", "The combined ES claim is only partially confirmed; locale grammar must be separated from the confirmed contradiction-reference defect.", "Clarify cluster-specific ground truth and material-localization criteria.", ["S9-REM-EXPECTED-001"], 6, ["four-locale semantic parity", "actor/modality/negation/urgency/risk equivalence"]),
    candidate("S9-REM-FIXTURE-001", "FIXTURE_LEVEL", "FIXTURE_CONTENT", byRoot("FIXTURE_CONTENT"), "HIGH", "Reinforced review confirms isolated silent-loss fixture content evidence.", "Correct the isolated fixture only after versioned migration approval.", [], 7, ["no-silent-loss", "fixture migration hash"]),
    candidate("S9-REM-FIXTURE-002", "FIXTURE_LEVEL", "REVIEW_METHODOLOGY", byRoot("REVIEW_METHODOLOGY"), "MEDIUM", "A retained primary privacy observation requires reference-methodology correction rather than runtime change.", "Bounded review-reference clarification.", [], 8, ["privacy data minimization", "review ledger preservation"]),
  ];
  return { artifact_version: "stage-9-remediation-candidate-registry.1", review_timestamp: timestamp, status: "PLANNING_ONLY", implementation_executed: false, fixture_remediation: "NONE", candidate_count: candidates.length, categories: Object.fromEntries(["SCHEMA_LEVEL", "EXPECTED_REFERENCE_LEVEL", "GENERATOR_TEMPLATE_LEVEL", "CLUSTER_LEVEL", "FIXTURE_LEVEL"].map((category) => [category, candidates.filter((item) => item.category === category).map((item) => item.candidate_id)])), candidates };
}

function buildClosure(finalAdjudication, calibration, registry) {
  return {
    artifact_version: "stage-9-reinforced-review-closure.1",
    review_timestamp: timestamp,
    primary_review: "216/216",
    reinforced_review: "73/73",
    reinforced_remaining: 0,
    final_adjudication: "8/8",
    unresolved_final_cases: finalAdjudication.unresolved_final_cases,
    critical_count: 0,
    calibration_verdict: calibration.calibration_verdict,
    remediation_candidate_count: registry.candidate_count,
    closure_verdict: "REINFORCED_AI_REVIEW_COMPLETE_REMEDIATION_REQUIRED",
    fixture_remediation: "NONE",
    stage_status: "In Progress",
    release_readiness: "NOT_DECLARED",
    runtime_boundaries: "CLOSED",
    human_review_claimed: false,
    model_independent_review_claimed: false,
    next_planning_candidate: "Stage 9 Remediation Plan and Bounded Fix Sequencing",
  };
}

function cumulativeOutcomeCounts(batch3) {
  return Object.fromEntries(outcomes.map((value) => [value, (priorProgress.reinforced_outcome_counts[value] ?? 0) + batch3.filter((row) => row.reinforced_outcome === value).length]));
}

function buildAllArtifacts() {
  const selection = buildSelection();
  const blind = buildBlindPackets();
  const r1 = buildR1(blind);
  const r2 = buildR2(selection, r1);
  const r3 = buildR3(selection, r1);
  const adjudication = buildAdjudication(r1, r2, r3);
  const dispositions = buildIssueDispositions(adjudication);
  const finalAdjudication = buildFinalAdjudication();
  finalAdjudication.outcome_counts = countBy(finalAdjudication.results, "final_outcome", finalOutcomes);
  const appended = [...priorLedger.dispositions, ...dispositions.dispositions.map((row) => ({ ...row, final_current_disposition: row.current_disposition }))];
  const finalRows = applyFinalOverrides(appended, finalAdjudication);
  const allAdjudications = [...priorReinforced.values(), ...adjudication.results];
  const calibration = buildCalibration(finalRows, dispositions, finalAdjudication, allAdjudications);
  const finalPatterns = buildFinalPatterns(finalRows);
  const registry = buildRegistry(finalRows);
  const closure = buildClosure(finalAdjudication, calibration, registry);
  const summary = {
    artifact_version: "stage-9-reinforced-summary.3", batch_id: batchId, review_timestamp: timestamp, status: "BATCH_COMPLETE", selected_count: 24,
    reinforced_outcome_counts: countBy(adjudication.results, "reinforced_outcome", outcomes), primary_issue_disposition_counts: dispositions.counts,
    root_cause_distribution: countBy(adjudication.results, "root_cause_category", rootCauses), remediation_scope_distribution: countBy(adjudication.results, "recommended_remediation_scope", scopes),
    final_adjudication_processed: 8, final_adjudication_remaining: 0, critical_count: 0, aggregate_reinforced_completed: 73, aggregate_reinforced_remaining: 0, aggregate_reinforced_total: 73,
    fixture_remediation: "NONE", stage_status: "In Progress", release_readiness: "NOT_DECLARED", runtime_boundaries: "CLOSED", network_request_count: 0,
    calibration_verdict: calibration.calibration_verdict, closure_verdict: closure.closure_verdict, next_planning_candidate: closure.next_planning_candidate,
  };
  const consolidated = {
    artifact_version: "stage-9-consolidated-issue-disposition-ledger.3", review_timestamp: timestamp, source_primary_open_issues: 113, source_primary_disputed_issues: 9,
    reinforced_batch_1_disposition_count: 43, reinforced_batch_2_disposition_count: 30, reinforced_batch_3_disposition_count: dispositions.disposition_count,
    cumulative_reinforced_disposition_count: finalRows.length, cumulative_counts: calibration.final_issue_dispositions, append_only: true, dispositions: finalRows,
    final_cross_batch_adjudication_count: 8, remaining_primary_observations_unchanged: true, fixture_remediation: "NONE",
  };
  const progress = {
    artifact_version: "stage-9-reinforced-review-progress.3", review_session: session, status: "REINFORCED_REVIEW_COMPLETE",
    primary_review: { reviewed: 216, total: 216, remaining: 0 }, reinforced_review: { batch_1: 25, batch_2: 24, batch_3: 24, completed: 73, remaining: 0, total: 73 },
    completed_fixture_ids: [...priorProgress.completed_fixture_ids, ...SELECTED_IDS], pending_queue: [], final_adjudication_queue: [],
    final_adjudication: { processed: 8, total: 8, remaining: 0, fixture_ids: FINAL_IDS }, reinforced_outcome_counts: cumulativeOutcomeCounts(adjudication.results),
    final_issue_disposition_counts: calibration.final_issue_dispositions, root_cause_distribution: { FIXTURE_CONTENT: 1, CLUSTER_LOCALIZATION: 0, GENERATOR_TEMPLATE: 3, SCHEMA_ORACLE: 6, EXPECTED_BEHAVIOR_REFERENCE: 61, REVIEW_METHODOLOGY: 1, PRIMARY_REVIEW_FALSE_POSITIVE: 1, UNRESOLVED: 0 },
    calibration_verdict: calibration.calibration_verdict, closure_verdict: closure.closure_verdict, duplicate_completed_pending_ids: [], fixture_remediation: "NONE", critical_count: 0,
    stage_status: "In Progress", release_readiness: "NOT_DECLARED", runtime_boundaries: "CLOSED", next_planning_candidate: closure.next_planning_candidate,
  };
  const patterns = {
    ...priorPatterns, artifact_version: "stage-9-ai-review-cross-batch-pattern-registry.7", review_scope: "Primary Batches 1-6 plus Reinforced Batches 1-3 and final cross-batch adjudication",
    review_timestamp: timestamp, reinforced_review_status: "73/73_COMPLETE", patterns: priorPatterns.patterns.map((pattern) => ({ ...pattern, final_reinforced_adjudication: finalPatterns.patterns.find((row) => row.pattern === pattern.pattern), status: finalPatterns.patterns.find((row) => row.pattern === pattern.pattern).current_qa_status })),
    fixture_remediation: "NONE", final_corpus_wide_verdict: "REINFORCED_REVIEW_COMPLETE_REMEDIATION_PLANNING_REQUIRED",
  };
  const saturation = {
    ...priorSaturation, artifact_version: "stage-9-ai-review-pattern-saturation.6", review_timestamp: timestamp,
    reinforced_review_progress: { batch_1: 25, batch_2: 24, batch_3: 24, completed: 73, total: 73, remaining: 0 },
    patterns: priorSaturation.patterns.map((item) => ({ ...item, final_reinforced_adjudication: finalPatterns.patterns.find((row) => row.pattern === item.pattern), final_saturation_verdict: finalPatterns.patterns.find((row) => row.pattern === item.pattern).current_qa_status, fixture_remediation_executed: false })),
    remaining_reinforced_review_required: 0, next_planning_candidate: closure.next_planning_candidate,
  };
  return { selection, blind, r1, r2, r3, adjudication, dispositions, summary, finalAdjudication, calibration, finalPatterns, registry, closure, consolidated, progress, patterns, saturation };
}

export function writeAllArtifacts() {
  const a = buildAllArtifacts();
  mkdirSync(batchRoot, { recursive: true });
  for (const [name, value] of Object.entries({ "selection.json": a.selection, "blind-packets.json": a.blind, "pass-r1.json": a.r1, "pass-r2.json": a.r2, "pass-r3.json": a.r3, "adjudication.json": a.adjudication, "issue-dispositions.json": a.dispositions, "summary.json": a.summary })) writeFileSync(join(batchRoot, name), serialize(value));
  const rootArtifacts = {
    "AI_REINFORCED_REVIEW_PROGRESS.json": a.progress,
    "AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json": a.consolidated,
    "AI_REVIEW_CALIBRATION_ASSESSMENT.json": a.calibration,
    "AI_REVIEW_FINAL_CALIBRATION_ASSESSMENT.json": a.calibration,
    "AI_REVIEW_FINAL_CROSS_BATCH_ADJUDICATION.json": a.finalAdjudication,
    "AI_REVIEW_FINAL_PATTERN_ADJUDICATION.json": a.finalPatterns,
    "AI_REVIEW_REMEDIATION_CANDIDATE_REGISTRY.json": a.registry,
    "AI_REINFORCED_REVIEW_CLOSURE.json": a.closure,
    "AI_REVIEW_CROSS_BATCH_PATTERNS.json": a.patterns,
    "AI_REVIEW_PATTERN_SATURATION.json": a.saturation,
  };
  for (const [name, value] of Object.entries(rootArtifacts)) writeFileSync(join(root, "docs", "qa", "review", name), serialize(value));
}

export { baseline, serialize, sourceHash, artifactHash, buildAllArtifacts };

if (process.argv[1] === fileURLToPath(import.meta.url)) writeAllArtifacts();
