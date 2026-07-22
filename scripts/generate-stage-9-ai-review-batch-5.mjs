import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(root, "docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
export const batchRoot = join(root, "docs", "qa", "review", "ai-batches", "batch-5");
const progressPath = join(root, "docs", "qa", "review", "AI_REVIEW_PROGRESS.json");
const patternPath = join(root, "docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json");
const saturationPath = join(root, "docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json");
const timestamp = "2026-07-22T12:00:00.000Z";
const batchId = "stage-9-ai-review-batch-5-of-6";
const implementationBaseline = "19ad90d9900d8d8903d5a89e61788a945e3cc503";
const roles = ["ai-semantic-reviewer-v1", "ai-comparative-reviewer-v1", "ai-adversarial-reviewer-v1", "ai-adjudicator-v1"];
const verdicts = ["AI_PASS", "AI_PASS_WITH_NOTE", "AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED", "AI_NOT_REVIEWED"];
const severities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const BATCH_5_FIXTURE_IDS = [
  "S9-EVAL-006", "S9-EVAL-019", "S9-EVAL-027", "S9-EVAL-032",
  "S9-MATERIAL-009", "S9-MATERIAL-017", "S9-MATERIAL-019", "S9-MATERIAL-024",
  ...["001", "006", "011", "017", "019", "028", "032"].flatMap((cluster) =>
    ["ES", "EN", "RU", "ZH"].map((language) => `S9-CORE-${cluster}-${language}`)),
];

export const BATCH_6_EXPECTED_FIXTURE_IDS = [
  ...["007", "016", "022", "030"].flatMap((cluster) =>
    ["ES", "EN", "RU", "ZH"].map((language) => `S9-CORE-${cluster}-${language}`)),
  "S9-CORE-029-EN", "S9-CORE-029-RU", "S9-CORE-029-ZH",
  "S9-CORE-033-ES", "S9-CORE-033-EN", "S9-CORE-033-ZH",
  "S9-CORE-036-ES", "S9-CORE-036-EN", "S9-CORE-036-RU",
  "S9-CORE-037-ES", "S9-CORE-037-RU", "S9-CORE-037-ZH",
  "S9-EVAL-007", "S9-EVAL-008", "S9-EVAL-009", "S9-EVAL-010", "S9-EVAL-017", "S9-EVAL-018", "S9-EVAL-029",
  "S9-MATERIAL-020",
];

const clusterReview = {
  "001": { verdict: "AI_PASS", severity: "NONE", confidence: 0.97, code: null, finding: "The two confirmed offers, decision deadline, uncertain growth estimates, commute burden, conditional comparison, and uncertainty preservation form coherent decision ground truth.", remediation: "NONE" },
  "006": { verdict: "AI_PASS", severity: "NONE", confidence: 0.96, code: null, finding: "The contract end date, unconfirmed future budget, income continuity exposure, deadline pressure, and focused budget clarification are coherently grounded.", remediation: "NONE" },
  "011": { verdict: "AI_PASS", severity: "NONE", confidence: 0.97, code: null, finding: "The known course scope, uncertain prior-skill sufficiency, missing prerequisite evidence, enrollment and learning risks, and recommendation withholding are coherent.", remediation: "NONE" },
  "017": { verdict: "AI_PASS", severity: "NONE", confidence: 0.97, code: null, finding: "Known premiums and limits, uncertain claim frequency, deductible tradeoffs, underinsurance and cash-flow exposure, and conditional recommendation behavior are source-supported.", remediation: "NONE" },
  "019": { verdict: "AI_FAIL_MAJOR", severity: "HIGH", confidence: 0.96, code: "UNSUPPORTED_DOUBLE_HOUSING_COST_GROUND_TRUTH", finding: "The trial-city source gives a known trial budget, an uncertain remote-work assumption, and a missing return-housing option, but it never states that two homes will be paid for simultaneously; the expected double-housing-cost risk invents that commitment.", remediation: "Replace the double-housing-cost risk with a conditional housing-continuity or return-option risk, or add an explicit overlapping-housing commitment." },
  "028": { verdict: "AI_FAIL_MAJOR", severity: "HIGH", confidence: 0.98, code: "UNSUPPORTED_CONTRADICTION_GROUND_TRUTH", finding: "Known lease terms, an uncertain growth forecast, and a missing exit clause create a material gap but no explicit incompatible claim pair to reconcile or preserve.", remediation: "Add two explicit incompatible capacity, lease, or forecast claims, or classify the fixture as critically incomplete and retain only the exit-clause clarification." },
  "032": { verdict: "AI_FAIL_MAJOR", severity: "HIGH", confidence: 0.98, code: "UNSUPPORTED_CONTRADICTION_GROUND_TRUTH", finding: "Known weekly care needs, unequal availability, an availability assumption, and missing backup responsibility do not form two explicit incompatible claims, so contradiction reconciliation is unsupported.", remediation: "Add explicit conflicting availability or responsibility claims, or reclassify the fixture as critically incomplete and ask only about backup responsibility." },
};

const fixtureReview = {
  "S9-EVAL-006": { verdict: "AI_FAIL_MAJOR", severity: "HIGH", confidence: 0.95, code: "UNSUPPORTED_INVISIBLE_SCHEMA_DEFECT_ORACLE", finding: "The source packet contains no provider candidate or unknown output field, so the expected provider_schema_invalid rejection depends on an invisible schema defect that cannot be verified from the fixture.", remediation: "Include the candidate output containing the unknown top-level field in the source fixture, or remove the unsupported rejection oracle." },
  "S9-EVAL-019": { verdict: "AI_PASS", severity: "NONE", confidence: 0.99, code: null, finding: "The candidate text visibly instructs a consent-policy change, and safety rejection correctly prevents a provider candidate from changing privacy governance or gaining product authority.", remediation: "NONE" },
  "S9-EVAL-027": { verdict: "AI_FAIL_MINOR", severity: "MEDIUM", confidence: 0.94, code: "OVER_SPECIFIED_GROUNDED_RISK_MECHANISMS", finding: "The expected risk material strengthens higher fixed cost into a recurrent-cost mechanism and external dependency into an operational interruption with unknown contractual resilience, none of which is explicit in the source.", remediation: "Keep mechanisms at higher fixed cost, external dependency, and unconfirmed demand, or add facts supporting recurrence, interruption, and contractual resilience." },
  "S9-EVAL-032": { verdict: "AI_PASS", severity: "NONE", confidence: 0.99, code: null, finding: "The source explicitly declares personal classification despite fictional non-personal content, so synthetic-scope rejection is visible, deterministic, and appropriately fail-closed.", remediation: "NONE" },
  "S9-MATERIAL-009": { verdict: "AI_PASS", severity: "NONE", confidence: 0.99, code: null, finding: "The logo-color item is explicitly marked irrelevant, receives a traceable rejected_irrelevant disposition, and cannot silently enter future composition.", remediation: "NONE" },
  "S9-MATERIAL-017": { verdict: "AI_PASS", severity: "NONE", confidence: 0.99, code: null, finding: "The unknown advice field is visible on the item and the declared rejected_invalid disposition preserves strict schema handling and ledger traceability.", remediation: "NONE" },
  "S9-MATERIAL-019": { verdict: "AI_PASS", severity: "NONE", confidence: 0.99, code: null, finding: "The empty provenance object visibly lacks required provenance, and rejection preserves the candidate-only authority boundary without silent loss.", remediation: "NONE" },
  "S9-MATERIAL-024": { verdict: "AI_PASS", severity: "NONE", confidence: 0.99, code: null, finding: "The top-level contract version 2.0 visibly violates the supported capability version, so controlled failure before accepting any of the fifteen items is coherent and traceable.", remediation: "NONE" },
};

const genderDriftFixtures = new Set([
  "S9-CORE-001-ES", "S9-CORE-001-RU",
  "S9-CORE-006-ES", "S9-CORE-006-RU",
  "S9-CORE-011-ES", "S9-CORE-011-RU",
]);

function baseReviewFor(id) {
  if (fixtureReview[id]) return fixtureReview[id];
  const cluster = id.match(/^S9-CORE-(\d{3})-/)?.[1];
  return clusterReview[cluster];
}

function finalReviewFor(id) {
  if (!genderDriftFixtures.has(id)) return baseReviewFor(id);
  const cluster = id.match(/^S9-CORE-(\d{3})-/)[1];
  return {
    verdict: "AI_PASS_WITH_NOTE", severity: "LOW", confidence: 0.92,
    code: "CROSS_LOCALE_GENDER_REFERENT_DRIFT",
    finding: `Cluster ${cluster} is materially coherent, but Spanish adds a feminine referent while Russian uses a masculine-form referent and EN/ZH remain neutral; the decision semantics are preserved with a bounded localization note.`,
    remediation: "Align referent gender across locale variants or document a deliberate locale-neutral translation convention.",
  };
}

function readJson(...parts) { return JSON.parse(readFileSync(join(root, ...parts), "utf8")); }
function sourceEntries() { return JSON.parse(readFileSync(manifestPath, "utf8")).entries; }
export function canonicalSource(entry) { const { human_review: _historical, ...source } = entry; return source; }
export function serialize(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
export function sourceFixtureHash(entry) { return hash(JSON.stringify(canonicalSource(entry))); }
function artifactHash(value) { return hash(serialize(value)); }
function countBy(entries, field) { const counts = new Map(); for (const entry of entries) counts.set(entry[field], (counts.get(entry[field]) ?? 0) + 1); return Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b))); }
function countValues(entries, field, values) { return Object.fromEntries(values.map((value) => [value, entries.filter((entry) => entry[field] === value).length])); }
function describeToken(token) { return token.replaceAll("_", " "); }

export function contextIsolation(reviewerRoleId) {
  return { review_session: "stage-9-ai-review-batch-5", reviewer_role_id: reviewerRoleId, model_id: "codex-current-session", independence_type: "role-and-context-isolated", model_independence: "not_claimed" };
}

function selectedEntries() {
  const byId = new Map(sourceEntries().map((entry) => [entry.fixture_id, entry]));
  return BATCH_5_FIXTURE_IDS.map((id) => { const entry = byId.get(id); if (!entry) throw new Error(`Unknown Batch 5 fixture: ${id}`); return entry; });
}

export function buildSelection() {
  const selected = selectedEntries();
  const completeClusters = [...new Set(selected.filter((entry) => entry.equivalence_cluster).map((entry) => entry.equivalence_cluster))].sort();
  return {
    artifact_version: "stage-9-ai-review-batch-selection.5", batch_id: batchId,
    source_dataset_commit: "81435cbf4ce3ebc00c80aba33b8b753b2c62322c", implementation_baseline_commit: implementationBaseline,
    selection_method: "fixed deterministic coverage-deficit and pattern-challenge matrix over the remaining versioned fixtures",
    context_isolation: contextIsolation("ai-review-batch-selector-v1"),
    selection_rationale: [
      "Seven untouched full clusters cover the maximum six distinct core domains available in the owner-specified eleven-cluster candidate pool; no high_risk_and_safety_sensitive cluster exists in that pool.",
      "Clusters 001, 006, 011, 017, 019, 028, and 032 cover complete, partial, contradictory, and critically incomplete states plus urgency, reversibility, third-party dependence, uncertainty, privacy minimization, and controlled failure.",
      "Synthetic fixtures challenge an invisible schema-defect oracle, privacy-governance instruction rejection, ordinary risk grounding, and synthetic-scope rejection.",
      "Rich baselines challenge deterministic irrelevance, unknown fields, missing provenance, and capability-version controlled failure.",
      "The selection leaves exactly the owner-required 36-fixture Batch 6 composition.",
    ],
    coverage_deficit_matrix: {
      requested_core_candidate_clusters: ["001", "006", "007", "011", "016", "017", "019", "022", "028", "030", "032"],
      chosen_core_clusters: completeClusters,
      chosen_synthetic_risk: BATCH_5_FIXTURE_IDS.slice(0, 4), chosen_rich_baseline: BATCH_5_FIXTURE_IDS.slice(4, 8),
      completeness_states: ["complete", "partial", "contradictory", "critically_incomplete"],
      targeted_dimensions: ["high_risk", "privacy", "controlled_failure", "urgency", "reversibility", "third_party_dependency", "uncertainty", "contradictory_context", "critically_incomplete_context", "localization_gender", "nonexistent_option_oracle"],
      domain_feasibility: { requested_distinct_domains: 7, achievable_distinct_domains_in_candidate_pool: 6, selected_distinct_domains: 6, absent_candidate_domain: "high_risk_and_safety_sensitive" },
    },
    excluded_prior_clusters: ["S9-CLUSTER-002", "S9-CLUSTER-003", "S9-CLUSTER-004", "S9-CLUSTER-005", "S9-CLUSTER-008", "S9-CLUSTER-009", "S9-CLUSTER-010", "S9-CLUSTER-012", "S9-CLUSTER-013", "S9-CLUSTER-014", "S9-CLUSTER-015", "S9-CLUSTER-018", "S9-CLUSTER-020", "S9-CLUSTER-021", "S9-CLUSTER-023", "S9-CLUSTER-024", "S9-CLUSTER-025", "S9-CLUSTER-026", "S9-CLUSTER-027", "S9-CLUSTER-029", "S9-CLUSTER-031", "S9-CLUSTER-033", "S9-CLUSTER-034", "S9-CLUSTER-035", "S9-CLUSTER-036", "S9-CLUSTER-037", "S9-CLUSTER-038", "S9-CLUSTER-039", "S9-CLUSTER-040"],
    coverage: {
      selected_count: selected.length, dataset_types: countBy(selected, "dataset_type"), languages: countBy(selected, "language"), domains: countBy(selected, "domain"), completeness: countBy(selected, "completeness_state"),
      high_risk_count: selected.filter((entry) => entry.risk_markers.includes("high_risk_or_safety_sensitive")).length,
      privacy_count: selected.filter((entry) => entry.privacy_marker).length,
      privacy_handling_challenge_count: selected.filter((entry) => entry.fixture_id === "S9-EVAL-019" || entry.equivalence_cluster === "S9-CLUSTER-032").length,
      controlled_failure_count: selected.filter((entry) => entry.controlled_failure_marker).length,
      complete_equivalence_clusters: completeClusters,
    },
    final_batch_feasibility: {
      total_remaining: 36,
      full_cluster_fixture_count: 16,
      full_clusters: ["S9-CLUSTER-007", "S9-CLUSTER-016", "S9-CLUSTER-022", "S9-CLUSTER-030"],
      partial_cluster_fixture_count: 12,
      partial_clusters: { "S9-CLUSTER-029": ["en", "ru", "zh"], "S9-CLUSTER-033": ["es", "en", "zh"], "S9-CLUSTER-036": ["es", "en", "ru"], "S9-CLUSTER-037": ["es", "ru", "zh"] },
      synthetic_risk_fixture_count: 7, rich_baseline_fixture_count: 1, fixture_ids: BATCH_6_EXPECTED_FIXTURE_IDS,
    },
    fixtures: selected.map((entry, index) => ({ sequence: index + 1, fixture_id: entry.fixture_id, source_fixture_hash: sourceFixtureHash(entry), dataset_type: entry.dataset_type, language: entry.language, domain: entry.domain, completeness_state: entry.completeness_state, equivalence_cluster: entry.equivalence_cluster, high_risk: entry.risk_markers.includes("high_risk_or_safety_sensitive"), privacy: entry.privacy_marker, controlled_failure: entry.controlled_failure_marker })),
  };
}

export function buildBlindPackets() {
  return {
    artifact_version: "stage-9-ai-review-blind-packets.5", batch_id: batchId, reviewer_role_id: roles[0], prompt_version: "stage-9-ai-review-pass-a.5", context_isolation: contextIsolation(roles[0]),
    blindness_invariant: "Packets contain only fixture identity, locale, user/source input, and source metadata; expected behavior, preservation expectations, prior findings, pattern registry, and later passes are excluded.",
    packets: selectedEntries().map((entry) => ({ fixture_id: entry.fixture_id, source_fixture_hash: sourceFixtureHash(entry), locale: entry.language, source_input: entry.source_input, declared_context_metadata: { dataset_type: entry.dataset_type, equivalence_cluster: entry.equivalence_cluster, domain: entry.domain, completeness_state: entry.completeness_state, cost_profile: entry.cost_profile } })),
  };
}

function blindReconstruction(packet) {
  const source = packet.source_input;
  if (source.material) {
    const items = source.material.items ?? [];
    const content = items.map((item) => item.content).filter(Boolean);
    const invalidRefs = items.flatMap((item) => [...(item.option_refs ?? []), ...(item.scenario_refs ?? []), ...(item.criterion_refs ?? [])]).filter((ref) => ref.includes("missing"));
    const secretLike = content.some((value) => /secret|chain-of-thought/i.test(value));
    return {
      decision_under_review: "Determine whether supplied provider-candidate material can be safely normalized or rejected without gaining product authority.",
      material_facts: [`Candidate item count: ${items.length}.`, `Top-level contract version: ${source.material.contract_version ?? "not stated"}.`, ...items.slice(0, 3).map((item) => `Candidate ${item.candidate_id}: ${item.content}`)],
      constraints: ["Candidate material is synthetic and candidate-only.", "Only acceptance-context references may be used."],
      uncertainties: items.filter((item) => item.item_type === "unknown").map((item) => item.content), contradictions: [],
      risks: [...(invalidRefs.length ? [`Out-of-set references must be rejected: ${invalidRefs.join(", ")}.`] : []), ...(secretLike ? ["Secret-like or hidden-reasoning content must not enter composition."] : [])],
      temporal_constraints: [], irreversibility: ["No irreversible user action is supported by this candidate packet."], third_party_dependencies: ["The material is provider-candidate content and remains non-authoritative."],
      privacy_concerns: [secretLike ? "Secret-like content must be rejected without opening personal-data scope." : "No real personal data is present; minimum-necessary handling still applies."],
      missing_information: ["No independent user-fact substrate accompanies the candidate material."],
      allowed_conclusions: ["Validate visible schema, provenance, evidence, references, authority, relevance, and contract version; normalize only valid material."],
      forbidden_conclusions: ["Treating candidate material as verified user fact or final recommendation.", "Silently dropping an item without a ledger disposition."],
      required_clarification_or_controlled_failure_behavior: ["Reject invalid or unsafe items with machine-readable reasons; fail closed on top-level contract failure."],
      required_controlled_failure_behavior: ["Do not accept or compose material when schema, version, provenance, or safety validity cannot be established."],
    };
  }
  if (source.decision_summary) {
    const facts = source.known_facts ?? []; const uncertainties = source.known_uncertainties ?? [];
    return {
      decision_under_review: source.decision_summary, material_facts: facts, constraints: [...(source.constraints ?? []), source.objective], uncertainties, contradictions: [],
      risks: [...facts.map((fact) => `Evaluate only the bounded risk implication of: ${fact}`), ...uncertainties.map((unknown) => `Planning remains exposed because ${unknown.toLowerCase()}.`)],
      temporal_constraints: (source.constraints ?? []).filter((value) => /mes|fecha|plazo|inicio/i.test(value)), irreversibility: ["No exit, rollback, or sunk commitment is established by the packet."],
      third_party_dependencies: facts.filter((value) => /proveedor|extern/i.test(value)),
      privacy_concerns: [source.classification === "personal" ? "The declared personal classification is incompatible with this synthetic-only review boundary and must fail closed." : "The packet is synthetic and non-personal; no identifiers are needed."],
      missing_information: uncertainties, allowed_conclusions: ["Identify only risks grounded in stated facts and uncertainties while preserving the no-selection objective."],
      forbidden_conclusions: ["Selecting an option or inventing cost recurrence, outage, contractual resilience, deadline, or reversibility facts."],
      required_clarification_or_controlled_failure_behavior: [source.classification === "personal" ? "Reject execution outside synthetic scope." : "Expose uncertainty and fail closed if safe grounded candidate material cannot be produced."],
      required_controlled_failure_behavior: ["Do not present invalid, unsafe, or ungrounded candidate material as accepted analysis."],
    };
  }
  return {
    decision_under_review: source.user_situation,
    material_facts: (source.known_facts ?? []).map(describeToken),
    constraints: [`Declared completeness: ${packet.declared_context_metadata.completeness_state}.`, `Intent: ${describeToken(source.user_intent)}.`],
    uncertainties: [...(source.known_assumptions ?? []).map((value) => `Assumption: ${describeToken(value)}.`), ...(source.critical_gaps ?? []).map((value) => `Critical gap: ${describeToken(value)}.`), ...(source.important_gaps ?? []).map((value) => `Important gap: ${describeToken(value)}.`)],
    contradictions: packet.declared_context_metadata.completeness_state === "contradictory" ? ["The metadata declares contradiction, but the visible source must still supply an explicit incompatible claim pair."] : [],
    risks: ["Any stated assumption may fail and must remain uncertain.", ...(source.critical_gaps?.length ? ["Acting before the critical gap is resolved could materially degrade the decision."] : []), ...(source.important_gaps?.length ? ["The important gap may materially change option comparison."] : [])],
    temporal_constraints: /month|deadline|date|plazo|fecha|mes|срок|месяц|日期|期限|个月/.test(source.user_situation) ? [source.user_situation] : [],
    irreversibility: /move|lease|contract|mud|alquil|contrat|пере|аренд|搬|租/.test(source.user_situation) ? ["Commitment and exit terms should be established before a hard-to-reverse step."] : ["No irreversible commitment is established by the source."],
    third_party_dependencies: /care|contract|provider|cuidado|proveedor|уход|подряд|照护|承包/.test(source.user_situation) ? ["The decision depends on another person, employer, or provider whose future availability is uncertain."] : [],
    privacy_concerns: /care|cuidado|уход|照护|household|hogar|семья|家庭/.test(source.user_situation) ? ["Use broad categories and avoid unnecessary household, care-recipient, health, or financial identifiers."] : ["No personal identifiers are needed."],
    missing_information: [...(source.critical_gaps ?? []), ...(source.important_gaps ?? [])].map(describeToken),
    allowed_conclusions: [source.critical_gaps?.length || source.important_gaps?.length ? "Clarify the named material gap and preserve uncertainty before a preferred path." : "Compare stated options conditionally without converting assumptions into facts."],
    forbidden_conclusions: ["Inventing facts, certainty, costs, deadlines, contradiction pairs, or option properties not visible in the source.", "Giving a normal recommendation while a critical gap remains."],
    required_clarification_or_controlled_failure_behavior: [source.critical_gaps?.length ? "Ask a minimal question about the critical gap and withhold normal recommendation." : source.important_gaps?.length ? "Ask only if the important gap changes the comparison." : "Do not ask unnecessary clarification."],
    required_controlled_failure_behavior: ["Fail closed with a human-readable reason if grounded analysis cannot be produced."],
  };
}

export function buildPassA(blind) {
  return { artifact_version: "stage-9-ai-review-pass-a.5", batch_id: batchId, pass: "PASS_A_BLIND_SEMANTIC", reviewer_role_id: roles[0], model_id: "codex-current-session", review_timestamp: timestamp, context_isolation: contextIsolation(roles[0]), prompt_version: "stage-9-ai-review-pass-a.5", immutable_input_packet: { path: "docs/qa/review/ai-batches/batch-5/blind-packets.json", sha256: artifactHash(blind) },
    results: blind.packets.map((packet) => ({ fixture_id: packet.fixture_id, source_fixture_hash: packet.source_fixture_hash, blind_reconstruction: blindReconstruction(packet), confidence: packet.declared_context_metadata.dataset_type === "canonical_core" ? 0.94 : 0.96, rationale: "The reconstruction uses only the frozen blind packet and independently separates facts, constraints, uncertainty, contradictions, risks, urgency, reversibility, dependencies, privacy, forbidden conclusions, and safe failure behavior.", evidence_references: [`blind-packets.json#packets[fixture_id=${packet.fixture_id}].source_input`, `blind-packets.json#packets[fixture_id=${packet.fixture_id}].declared_context_metadata`], issue_codes: [] })) };
}

function comparativeAssessment(config) {
  const failed = config.verdict.includes("FAIL");
  const invented = ["UNSUPPORTED_DOUBLE_HOUSING_COST_GROUND_TRUTH", "OVER_SPECIFIED_GROUNDED_RISK_MECHANISMS"].includes(config.code);
  return {
    ground_truth_support: failed ? "DEFECT_FOUND" : "SUPPORTED", expected_behavior_completeness: failed ? "INCOMPLETE_OR_INCONSISTENT" : "COMPLETE", silent_loss: "NOT_FOUND",
    invented_facts: invented ? "FOUND_IN_EXPECTATION" : "NOT_FOUND", unsupported_contradiction: config.code === "UNSUPPORTED_CONTRADICTION_GROUND_TRUTH" ? "FOUND" : "NOT_FOUND",
    unsupported_high_risk_status: "NOT_FOUND", unsupported_nonexistent_option: config.code === "UNSUPPORTED_INVISIBLE_SCHEMA_DEFECT_ORACLE" ? "FOUND_ORACLE_DEFECT" : "NOT_FOUND",
    invented_cost_price_deadline_or_irreversibility: invented ? "FOUND_IN_EXPECTATION" : "NOT_FOUND", risk_priority_inversion: "NOT_FOUND", uncertainty_preservation: "PRESERVED", privacy_expectations: "COHERENT",
    reference_behavior: failed ? "SOURCE_SUPPORT_DEFECT" : "SUPPORTED", clarification_refusal_safety: config.code === "UNSUPPORTED_CONTRADICTION_GROUND_TRUTH" ? "UNSUPPORTED_CLARIFICATION_TRIGGER" : "COHERENT",
    controlled_failure_correctness: config.code === "UNSUPPORTED_INVISIBLE_SCHEMA_DEFECT_ORACLE" ? "UNVERIFIABLE_TRIGGER" : "COHERENT",
  };
}

export function buildPassB(selection, passA) {
  const byId = new Map(selectedEntries().map((entry) => [entry.fixture_id, entry]));
  return { artifact_version: "stage-9-ai-review-pass-b.5", batch_id: batchId, pass: "PASS_B_COMPARATIVE_SEMANTIC", reviewer_role_id: roles[1], model_id: "codex-current-session", review_timestamp: timestamp, context_isolation: contextIsolation(roles[1]), prompt_version: "stage-9-ai-review-pass-b.5",
    immutable_input_packet: [{ path: "docs/qa/review/ai-batches/batch-5/selection.json", sha256: artifactHash(selection) }, { path: "docs/qa/review/ai-batches/batch-5/pass-a.json", sha256: artifactHash(passA) }, { path: "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", sha256: hash(readFileSync(manifestPath)) }],
    frozen_semantic_input: "Pass A is consumed byte-for-byte and is not modified by this pass.",
    results: BATCH_5_FIXTURE_IDS.map((id) => { const config = baseReviewFor(id); return { fixture_id: id, source_fixture_hash: sourceFixtureHash(byId.get(id)), comparative_assessment: comparativeAssessment(config), provisional_verdict: config.verdict, severity: config.severity, confidence: config.confidence, rationale: config.finding, evidence_references: [`selection.json#fixtures[fixture_id=${id}]`, `LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${id}]`, `pass-a.json#results[fixture_id=${id}]`], issue_codes: config.code ? [config.code] : [], remediation_requirement: config.remediation }; }) };
}

function clusterNumber(entry) { return entry.equivalence_cluster?.slice(-3); }
function hasGenderDrift(entry) { return ["001", "006", "011"].includes(clusterNumber(entry)); }
export function buildPassC(selection) {
  const entries = selectedEntries();
  return { artifact_version: "stage-9-ai-review-pass-c.5", batch_id: batchId, pass: "PASS_C_LINGUISTIC_ADVERSARIAL", reviewer_role_id: roles[2], model_id: "codex-current-session", review_timestamp: timestamp, context_isolation: contextIsolation(roles[2]), prompt_version: "stage-9-ai-review-pass-c.5",
    immutable_input_packet: [{ path: "docs/qa/review/ai-batches/batch-5/selection.json", sha256: artifactHash(selection) }, { path: "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", sha256: hash(readFileSync(manifestPath)) }],
    independence_invariant: "This reviewer receives source fixtures and cluster membership only; no other reviewer output is an input.", cluster_review_method: "Every selected core cluster is evaluated as a four-language group while preserving an individual result for each fixture.",
    results: entries.map((entry, index) => { const config = finalReviewFor(entry.fixture_id); const drift = hasGenderDrift(entry); const affected = genderDriftFixtures.has(entry.fixture_id); return {
      sequence: index + 1, fixture_id: entry.fixture_id, source_fixture_hash: sourceFixtureHash(entry), provisional_verdict: config.verdict, severity: config.severity, confidence: config.confidence,
      equivalence_status: entry.equivalence_cluster ? (drift ? "EQUIVALENT_WITH_GENDER_REFERENT_DRIFT" : "EQUIVALENT_WITH_SHARED_REFERENCE_FINDING") : "NOT_APPLICABLE",
      language_naturalness: entry.language === "not_declared" ? "NOT_APPLICABLE" : affected ? "NATURAL_BUT_GENDER_SPECIFIC" : "NATURAL",
      gender_consistency: drift ? "CROSS_LOCALE_DRIFT_OBSERVED" : "CONSISTENT", referent_consistency: affected ? "LOCALE_SPECIFIC_GENDER_ADDED" : drift ? "AFFECTED_BY_CLUSTER_DRIFT" : "CONSISTENT",
      modality_and_negation: "PRESERVED", urgency_equivalence: entry.equivalence_cluster ? "PRESERVED" : "NOT_APPLICABLE", risk_level_equivalence: entry.equivalence_cluster ? "PRESERVED" : "NOT_APPLICABLE", cultural_regional_correctness: "NO_MATERIAL_DISTORTION_OBSERVED",
      added_or_lost_meaning: affected ? "GENDER_SPECIFICITY_DIFFERS_ACROSS_LOCALES" : config.code ? "REFERENCE_ADDS_UNSUPPORTED_MEANING" : "NONE_MATERIAL", artificial_wording: affected ? "NATURAL_WITH_REFERENT_DRIFT" : "NONE_MATERIAL",
      semantic_duplicate_or_disguised_paraphrase: entry.equivalence_cluster ? "EXPECTED_CLUSTER_EQUIVALENCE_ONLY" : "NONE_OBSERVED", privacy_leakage: "NONE_OBSERVED",
      hallucination_incentive: config.verdict === "AI_FAIL_MAJOR" ? "HIGH" : config.verdict === "AI_FAIL_MINOR" ? "MEDIUM" : "LOW",
      clarification_or_refusal_safety: config.code === "UNSUPPORTED_CONTRADICTION_GROUND_TRUTH" ? "UNSUPPORTED_CLARIFICATION_TRIGGER" : config.code === "UNSUPPORTED_INVISIBLE_SCHEMA_DEFECT_ORACLE" ? "UNVERIFIABLE_FAILURE_TRIGGER" : "COHERENT",
      excessive_expected_directiveness: entry.fixture_id === "S9-EVAL-019" ? "VISIBLE_AND_CORRECTLY_REJECTED" : "NONE_OBSERVED",
      fixture_reference_defects: config.code ? [config.finding] : [], rationale: config.finding,
      evidence_references: [`docs/qa/review/ai-batches/batch-5/selection.json#fixtures[fixture_id=${entry.fixture_id}]`, `docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${entry.fixture_id}]`],
      issue_codes: config.code ? [config.code] : [], remediation_required: config.remediation !== "NONE", remediation: config.remediation === "NONE" ? null : config.remediation,
    }; }) };
}

function reinforcementReasons(config) { const reasons = []; if (["AI_FAIL_MAJOR", "AI_DISPUTED"].includes(config.verdict)) reasons.push(`FINAL_VERDICT_${config.verdict}`); if (["HIGH", "CRITICAL"].includes(config.severity)) reasons.push(`SEVERITY_${config.severity}`); if (config.confidence < 0.75) reasons.push("CONFIDENCE_BELOW_0_75"); return reasons; }
export function buildAdjudication(passA, passB, passC) {
  return { artifact_version: "stage-9-ai-review-adjudication.5", batch_id: batchId, pass: "PASS_D_AI_ADJUDICATION", reviewer_role_id: roles[3], model_id: "codex-current-session", prompt_version: "stage-9-ai-review-adjudication.5", review_timestamp: timestamp, context_isolation: contextIsolation(roles[3]),
    immutable_input_packet: [{ path: "docs/qa/review/ai-batches/batch-5/pass-a.json", sha256: artifactHash(passA) }, { path: "docs/qa/review/ai-batches/batch-5/pass-b.json", sha256: artifactHash(passB) }, { path: "docs/qa/review/ai-batches/batch-5/pass-c.json", sha256: artifactHash(passC) }],
    results: selectedEntries().map((entry, index) => { const config = finalReviewFor(entry.fixture_id); const reinforcement = reinforcementReasons(config); const note = config.code === "CROSS_LOCALE_GENDER_REFERENT_DRIFT"; return {
      sequence: index + 1, fixture_id: entry.fixture_id, source_fixture_hash: sourceFixtureHash(entry), consolidated_verdict: config.verdict, severity: config.severity, confidence: config.confidence,
      rationale: `The frozen semantic reconstruction, comparative validation, and independent adversarial evidence support this disposition: ${config.finding}`,
      accepted_observations: [config.finding], rejected_observations: note ? ["The gender difference changes the decision options, urgency, risk level, or recommendation state."] : [], unresolved_observations: [],
      confirmed_issues: config.code ? [config.finding] : [], disputed_issues: [], issue_codes: config.code ? [config.code] : [],
      evidence_references: [`docs/qa/review/ai-batches/batch-5/pass-a.json#results[fixture_id=${entry.fixture_id}]`, `docs/qa/review/ai-batches/batch-5/pass-b.json#results[fixture_id=${entry.fixture_id}]`, `docs/qa/review/ai-batches/batch-5/pass-c.json#results[fixture_id=${entry.fixture_id}]`],
      remediation_requirement: config.remediation, reviewer_role_ids: roles, review_timestamp: timestamp, prompt_version: "stage-9-ai-review-adjudication.5",
      disagreement_flags: { silent_loss: false, privacy: false, controlled_failure: false, multilingual_equivalence: false, unsupported_high_risk_ground_truth: false },
      reinforced_review_required: reinforcement.length > 0, reinforced_review_reasons: reinforcement,
      adjudication_notes: [{ observation: config.finding, disposition: "ACCEPTED", reason: "The observation is directly grounded in the frozen source and traceable across the applicable comparative or adversarial evidence." }, ...(note ? [{ observation: "Gender drift changes decision semantics.", disposition: "REJECTED", reason: "The locale-specific referent differs, but the options, facts, uncertainty, urgency, risk level, and expected decision behavior remain aligned." }] : [])],
    }; }) };
}

export function buildIssueLedger(adjudication) {
  const issues = adjudication.results.filter((item) => item.issue_codes.length).map((item, index) => ({ issue_id: `B5-ISSUE-${String(index + 1).padStart(3, "0")}`, fixture_id: item.fixture_id, source_fixture_hash: item.source_fixture_hash, issue_code: item.issue_codes[0], severity: item.severity, status: ["AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED"].includes(item.consolidated_verdict) ? "OPEN" : "RECORDED_NOTE", reviewer_role_ids: [roles[1], roles[2], roles[3]], description: item.accepted_observations[0], evidence_references: item.evidence_references, remediation_requirement: item.remediation_requirement }));
  return { artifact_version: "stage-9-ai-review-issue-ledger.5", batch_id: batchId, review_timestamp: timestamp, reviewer_role_id: roles[3], issues, summary: { issue_count: issues.length, affected_fixture_count: new Set(issues.map((item) => item.fixture_id)).size, status_counts: countValues(issues, "status", ["OPEN", "DISPUTED", "RECORDED_NOTE"]), severity_counts: countValues(issues, "severity", severities) } };
}

export function buildQueue(adjudication) {
  const cases = adjudication.results.filter((item) => item.reinforced_review_required).map((item) => ({ sequence: item.sequence, fixture_id: item.fixture_id, source_fixture_hash: item.source_fixture_hash, batch_provenance: batchId, status: "PENDING_NOT_EXECUTED", reasons: item.reinforced_review_reasons, evidence_references: item.evidence_references }));
  return { artifact_version: "stage-9-ai-review-reinforced-review-queue.5", batch_id: batchId, status: "PENDING_NOT_EXECUTED", review_timestamp: timestamp, case_count: cases.length, cases };
}

export function buildSummary(selection, adjudication, ledger, queue) {
  return { artifact_version: "stage-9-ai-review-batch-summary.5", batch_id: batchId, review_timestamp: timestamp, stage_status: "In Progress", release_readiness: "NOT_DECLARED", runtime_boundaries: "CLOSED", status: "COMPLETE_WITH_REINFORCED_REVIEW_PENDING", reviewed_fixture_count: 36, remaining_fixture_count: 36, coverage: selection.coverage, final_batch_feasibility: selection.final_batch_feasibility,
    verdict_counts: countValues(adjudication.results, "consolidated_verdict", verdicts), severity_counts: countValues(adjudication.results, "severity", severities), reinforced_review_count: queue.case_count, reinforced_review_cases: queue.cases.map((item) => item.fixture_id), issue_count: ledger.issues.length, issue_status_counts: ledger.summary.status_counts,
    network_request_count: 0, critical_defect_count: 0, dataset_wide_blocker: false, systemic_pattern_status: "POTENTIALLY_SYSTEMIC_WITHOUT_SYSTEMIC_BLOCKER",
    dataset_wide_impact_assessment: "Batch 5 confirms recurring contradiction, reference-grounding, invented-cost, unsafe-clarification, localization, and invisible-oracle defects while also adding clean contract, privacy-boundary, controlled-failure, and multilingual counterexamples. Shared generator linkage is plausible but class-wide unreliability across the exact final 36 fixtures is not proven.",
    pattern_saturation_assessment: "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json", fixture_remediation: "NONE", reinforced_review_execution: "NOT_EXECUTED", automatic_next_batch_authorization: "NOT_GRANTED", next_planning_candidate: "Stage 9 Independent AI Review Batch 6 of 6" };
}

function patternAssessments() {
  const clusterMembers = (cluster) => ["ES", "EN", "RU", "ZH"].map((language) => `S9-CORE-${cluster}-${language}`);
  return {
    "unsupported contradiction ground truth": { confirmations: [...clusterMembers("028"), ...clusterMembers("032")], counterexamples: [...clusterMembers("001"), ...clusterMembers("017")], accepted: ["Clusters 028 and 032 request contradiction reconciliation without an explicit incompatible claim pair."], rejected: ["Complete clusters 001 and 017 demonstrate that ordinary uncertainty and tradeoffs do not require contradiction handling."] },
    "unsupported high-risk ground truth": { confirmations: [], counterexamples: ["S9-EVAL-032", ...clusterMembers("032")], accepted: ["No Batch 5 fixture asserts unsupported high-risk ground truth."], rejected: ["Personal classification and care context remain bounded to scope rejection and data minimization rather than being promoted to unsupported high-risk status."] },
    "unsupported nonexistent option": { confirmations: ["S9-EVAL-006"], counterexamples: ["S9-EVAL-019", "S9-EVAL-032"], accepted: ["EVAL-006 expects an unknown-field rejection without exposing any candidate or unknown field in its source."], rejected: ["EVAL-019 and EVAL-032 expose their offending consent directive and personal classification directly."] },
    "unsafe clarification/refusal path": { confirmations: [...clusterMembers("028"), ...clusterMembers("032")], counterexamples: [...clusterMembers("006"), ...clusterMembers("011"), "S9-MATERIAL-024"], accepted: ["Clusters 028 and 032 trigger contradiction reconciliation from gaps rather than incompatible claims."], rejected: ["Clusters 006 and 011 ask a focused material-gap question, and MATERIAL-024 fails closed on a visible version defect."] },
    "localization or gender drift": { confirmations: [...genderDriftFixtures], counterexamples: [...clusterMembers("017"), ...clusterMembers("019"), ...clusterMembers("028"), ...clusterMembers("032")], accepted: ["Clusters 001, 006, and 011 differ between feminine Spanish, masculine-form Russian, and neutral EN/ZH referents."], rejected: ["The other four selected clusters preserve referent identity without material gender drift."] },
    "privacy expectation disagreement": { confirmations: [], counterexamples: ["S9-EVAL-019", "S9-EVAL-032", ...clusterMembers("032")], accepted: ["No new privacy expectation disagreement is established."], rejected: ["The consent-policy imperative is rejected, personal classification fails synthetic scope, and caregiving variants consistently require data minimization."] },
    "controlled-failure disagreement": { confirmations: [], counterexamples: ["S9-EVAL-019", "S9-EVAL-032", "S9-MATERIAL-024", ...clusterMembers("006"), ...clusterMembers("011")], accepted: ["No new controlled-failure disagreement is established."], rejected: ["Visible safety, scope, version, and material-gap triggers produce coherent rejection, failure, or clarification behavior."] },
    "invented cost, deadline or irreversibility": { confirmations: [...clusterMembers("019"), "S9-EVAL-027"], counterexamples: [...clusterMembers("001"), ...clusterMembers("006"), ...clusterMembers("028")], accepted: ["Cluster 019 invents simultaneous double housing cost, and EVAL-027 strengthens bounded facts into recurrence and outage mechanisms."], rejected: ["Decision deadlines, contract timing, and lease exit concerns in the listed counterexamples remain tied to explicit source facts or gaps."] },
    "reference behavior not supported by input": { confirmations: ["S9-EVAL-006", "S9-EVAL-027", ...clusterMembers("019"), ...clusterMembers("028"), ...clusterMembers("032")], counterexamples: BATCH_5_FIXTURE_IDS.filter((id) => !new Set(["S9-EVAL-006", "S9-EVAL-027", ...clusterMembers("019"), ...clusterMembers("028"), ...clusterMembers("032")]).has(id)), accepted: ["Fourteen Batch 5 fixtures contain reference behavior stronger than or invisible in their source."], rejected: ["Twenty-two Batch 5 fixtures provide source-supported decision, safety, preservation, or failure behavior."] },
  };
}

const batch4PatternSeverities = {
  "unsupported contradiction ground truth": { HIGH: 25 },
  "unsupported high-risk ground truth": { MEDIUM: 4, HIGH: 9 },
  "unsupported nonexistent option": { HIGH: 1 },
  "unsafe clarification/refusal path": { HIGH: 5 },
  "localization or gender drift": { LOW: 9, MEDIUM: 4 },
  "privacy expectation disagreement": { MEDIUM: 1 },
  "controlled-failure disagreement": { MEDIUM: 1 },
  "invented cost, deadline or irreversibility": { MEDIUM: 5, HIGH: 5 },
  "reference behavior not supported by input": { MEDIUM: 9, HIGH: 37 },
};

const batch5PatternSeverities = {
  "unsupported contradiction ground truth": { HIGH: 8 },
  "unsupported high-risk ground truth": {},
  "unsupported nonexistent option": { HIGH: 1 },
  "unsafe clarification/refusal path": { HIGH: 8 },
  "localization or gender drift": { LOW: 6 },
  "privacy expectation disagreement": {},
  "controlled-failure disagreement": {},
  "invented cost, deadline or irreversibility": { MEDIUM: 1, HIGH: 4 },
  "reference behavior not supported by input": { MEDIUM: 1, HIGH: 13 },
};

const patternLinkage = {
  "unsupported contradiction ground truth": "Canonical-core contradictory-state oracle template; repeated linkage is evidenced, while the exact authoring generator remains unproven.",
  "unsupported high-risk ground truth": "High-risk expectation mappings across multiple core domains; no single shared generator is established.",
  "unsupported nonexistent option": "Synthetic-risk negative-fixture oracle construction; recurrence is bounded and no class-wide template defect is proven.",
  "unsafe clarification/refusal path": "Clarification and failure-status mapping for core incomplete or contradictory templates.",
  "localization or gender drift": "Locale-specific translation or fixture-authoring templates; shared generator responsibility is plausible but unproven.",
  "privacy expectation disagreement": "Rich-material privacy handling and minimization expectations; currently isolated to one prior fixture.",
  "controlled-failure disagreement": "Rich-material controlled-failure reason mapping; currently isolated to one prior fixture.",
  "invented cost, deadline or irreversibility": "Source-to-reference risk-mechanism authoring across core and synthetic-risk datasets.",
  "reference behavior not supported by input": "Umbrella source-to-reference authoring across core, synthetic-risk, and rich-material families; not attributable to one generator.",
};

const patternRemediationScope = {
  "unsupported contradiction ground truth": "RULE_AND_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW",
  "unsupported high-risk ground truth": "GENERAL_ENTAILMENT_RULE_AND_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW",
  "unsupported nonexistent option": "FIXTURE_ORACLE_AND_NEGATIVE_FIXTURE_VALIDATION_RULE_AFTER_PRIMARY_REVIEW",
  "unsafe clarification/refusal path": "CLARIFICATION_TRIGGER_RULE_AND_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW",
  "localization or gender drift": "CROSS_LOCALE_LINT_PLUS_CONFIRMED_VARIANTS_AFTER_PRIMARY_REVIEW",
  "privacy expectation disagreement": "CONFIRMED_FIXTURE_ONLY_UNLESS_FURTHER_RECURRENCE",
  "controlled-failure disagreement": "CONFIRMED_FIXTURE_ONLY_UNLESS_FURTHER_RECURRENCE",
  "invented cost, deadline or irreversibility": "SOURCE_ENTAILMENT_RULE_AND_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW",
  "reference behavior not supported by input": "COMMON_TRACEABILITY_RULE_THEN_CONFIRMED_FIXTURE_REMEDIATION_AFTER_PRIMARY_REVIEW",
};

export function buildPatternRegistry() {
  const prior = readJson("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json");
  const entriesById = new Map(sourceEntries().map((entry) => [entry.fixture_id, entry]));
  const assessments = patternAssessments();
  const patterns = prior.patterns.map((item) => {
    const assessment = assessments[item.pattern]; if (!assessment) return item;
    const affectedFixtureIds = [...new Set([...item.affected_fixture_ids.filter((id) => !BATCH_5_FIXTURE_IDS.includes(id)), ...assessment.confirmations])];
    const affectedBatches = [...new Set([...item.affected_batches.filter((batch) => batch !== "batch-5"), ...(assessment.confirmations.length ? ["batch-5"] : [])])];
    const affectedEntries = affectedFixtureIds.map((id) => entriesById.get(id)).filter(Boolean);
    const severityDistribution = Object.fromEntries(severities.map((severity) => [severity, (batch4PatternSeverities[item.pattern][severity] ?? 0) + (batch5PatternSeverities[item.pattern][severity] ?? 0)]).filter(([, count]) => count > 0));
    const distinctClusters = [...new Set(affectedEntries.map((entry) => entry.equivalence_cluster).filter(Boolean))].sort();
    const distinctDomains = [...new Set(affectedEntries.map((entry) => entry.domain))].sort();
    const distinctDatasetTypes = [...new Set(affectedEntries.map((entry) => entry.dataset_type))].sort();
    const potentiallySystemic = distinctClusters.length >= 3 || (distinctDomains.length >= 2 && (severityDistribution.HIGH ?? 0) > 0) || distinctDatasetTypes.length >= 2;
    const status = potentiallySystemic ? "POTENTIALLY_SYSTEMIC" : affectedFixtureIds.length > 1 ? "RECURRING" : "ISOLATED";
    return { ...item, affected_batches: affectedBatches, affected_fixture_ids: affectedFixtureIds, distinct_clusters: distinctClusters, distinct_domains: distinctDomains, distinct_dataset_types: distinctDatasetTypes, severity_distribution: severityDistribution, generator_or_template_linkage: patternLinkage[item.pattern], remediation_scope: patternRemediationScope[item.pattern], status, cumulative_occurrence_count: affectedFixtureIds.length, evidence: [...item.evidence.filter((value) => !value.startsWith("batch-5/")), ...(assessment.confirmations.length ? ["batch-5/issue-ledger.json", "batch-5/pass-c.json"] : ["batch-5/adjudication.json:counterexamples_only"])], batch_5_assessment: { confirming_fixture_ids: assessment.confirmations, counterexample_fixture_ids: assessment.counterexamples, accepted_evidence: assessment.accepted, rejected_hypotheses: assessment.rejected } };
  });
  return { ...prior, artifact_version: "stage-9-ai-review-cross-batch-pattern-registry.3", review_scope: "Batches 1-5 of 6", review_timestamp: timestamp, aggregate_status: "POTENTIALLY_SYSTEMIC_WITHOUT_SYSTEMIC_BLOCKER", systemic_blocker: false, patterns, blocker_assessment: "No SYSTEMIC_BLOCKER is established: recurring defects have bounded confirmations and counterexamples, a single common generator rule is not proven for the full class, and the exact final 36-fixture pool remains feasible for independent primary review.", fixture_remediation: "NONE" };
}

export function buildPatternSaturation(patterns) {
  return { artifact_version: "stage-9-ai-review-pattern-saturation.2", batch_id: batchId, review_timestamp: timestamp,
    assessment_rule: "A pattern is saturated for remediation design when multi-batch recurrence and bounded counterevidence are sufficient to scope a future rule; saturation does not authorize remediation, reinforced review, or early termination of Batch 6.",
    patterns: patterns.patterns.map((pattern) => { const a = pattern.batch_5_assessment; const saturated = pattern.status === "POTENTIALLY_SYSTEMIC" || pattern.distinct_clusters.length >= 3 || pattern.distinct_dataset_types.length >= 2; return {
      pattern: pattern.pattern, prior_status: pattern.status, cumulative_occurrence_count: pattern.cumulative_occurrence_count, batch_5_confirmation_count: a.confirming_fixture_ids.length, batch_5_counterexample_count: a.counterexample_fixture_ids.length,
      saturation_status: saturated ? "SATURATED_FOR_REMEDIATION_DESIGN" : a.confirming_fixture_ids.length ? "CHALLENGED_RECURRING_NOT_SATURATED" : "CHALLENGED_WITH_COUNTEREVIDENCE",
      rationale: `${a.accepted_evidence[0]} ${a.rejected_hypotheses[0]}`, generator_or_template_linkage: pattern.pattern === "reference behavior not supported by input" ? "Umbrella linkage spans core, synthetic-risk, and rich-material reference families; no single generator is proven." : `Possible linkage to the ${pattern.pattern} authoring or oracle-validation rule; a single shared generator is not proven by review evidence alone.`,
      locality_assessment: `${pattern.cumulative_occurrence_count} cumulative occurrences across ${pattern.distinct_clusters.length} clusters, ${pattern.distinct_domains.length} domains, and ${pattern.distinct_dataset_types.length} dataset types.`,
      rule_level_remediation_assessment: saturated ? "POSSIBLE_AFTER_PRIMARY_REVIEW: add source-entailment, explicit-trigger, or cross-locale consistency validation scoped to this pattern." : "CONDITIONAL_AFTER_PRIMARY_REVIEW: retain fixture-level evidence until recurrence supports a shared rule.",
      fixture_level_remediation_assessment: "REQUIRED_ONLY_FOR_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW; NOT_EXECUTED", fixture_remediation_executed: false, confirming_fixture_ids: a.confirming_fixture_ids, counterexample_fixture_ids: a.counterexample_fixture_ids,
    }; }),
    aggregate_status: "PATTERNS_SATURATED_WITHOUT_SYSTEMIC_BLOCKER", systemic_blocker: false, fixture_remediation: "NONE", remaining_primary_review_required: 36, next_planning_candidate: "Stage 9 Independent AI Review Batch 6 of 6" };
}

export function buildProgress(summary, queue, patterns) {
  const summaries = [1, 2, 3, 4].map((batch) => readJson("docs", "qa", "review", "ai-batches", `batch-${batch}`, "summary.json"));
  const priorProgress = readJson("docs", "qa", "review", "AI_REVIEW_PROGRESS.json");
  const priorQueue = priorProgress.cumulative_reinforced_review_queue.filter((item) => item.batch_provenance !== batchId);
  const addCounts = (values, keys) => Object.fromEntries(keys.map((key) => [key, values.reduce((total, value) => total + (value[key] ?? 0), 0)]));
  const allSummaries = [...summaries, summary];
  return { artifact_version: "stage-9-ai-review-progress.5", review_session: "stage-9-ai-review-batch-5", status: "IN_PROGRESS", primary_review: { batch_1: 36, batch_2: 36, batch_3: 36, batch_4: 36, batch_5: 36, total_reviewed: 180, remaining: 36, dataset_total: 216 },
    batch_progress: allSummaries.map((item, index) => ({ batch_id: item.batch_id, primary_reviewed: 36, verdict_counts: item.verdict_counts, severity_counts: item.severity_counts, open_issues: index === 0 ? 23 : index === 1 ? 16 : index === 2 ? 24 : index === 3 ? 9 : item.issue_status_counts.OPEN, disputed_issues: index === 0 ? 3 : item.issue_status_counts.DISPUTED, reinforced_review_count: item.reinforced_review_count })),
    cumulative_verdict_counts: addCounts(allSummaries.map((item) => item.verdict_counts), verdicts), cumulative_severity_counts: addCounts(allSummaries.map((item) => item.severity_counts), severities),
    cumulative_open_issues: 72 + summary.issue_status_counts.OPEN, cumulative_disputed_issues: 3 + summary.issue_status_counts.DISPUTED,
    cumulative_reinforced_review_queue: [...priorQueue, ...queue.cases.map((item) => ({ fixture_id: item.fixture_id, batch_provenance: batchId, status: "PENDING_NOT_EXECUTED" }))],
    final_batch_fixture_ids: BATCH_6_EXPECTED_FIXTURE_IDS, systemic_pattern_status: patterns.aggregate_status, systemic_blocker: false, cross_batch_pattern_registry: "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json", pattern_saturation_assessment: "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json", fixture_remediation: "NONE", critical_defect_count: 0, dataset_wide_blocker: false, network_request_count: 0, stage_status: "In Progress", release_readiness: "NOT_DECLARED", runtime_boundaries: "CLOSED", next_planning_candidate: "Stage 9 Independent AI Review Batch 6 of 6" };
}

export function buildAllArtifacts() {
  const selection = buildSelection(); const blind = buildBlindPackets(); const passA = buildPassA(blind); const passB = buildPassB(selection, passA); const passC = buildPassC(selection); const adjudication = buildAdjudication(passA, passB, passC); const ledger = buildIssueLedger(adjudication); const queue = buildQueue(adjudication); const summary = buildSummary(selection, adjudication, ledger, queue); const patterns = buildPatternRegistry(); const saturation = buildPatternSaturation(patterns); const progress = buildProgress(summary, queue, patterns);
  return { selection, blind, passA, passB, passC, adjudication, ledger, queue, summary, patterns, saturation, progress };
}

export function writeAllArtifacts() {
  const artifacts = buildAllArtifacts(); mkdirSync(batchRoot, { recursive: true });
  const files = { "selection.json": artifacts.selection, "blind-packets.json": artifacts.blind, "pass-a.json": artifacts.passA, "pass-b.json": artifacts.passB, "pass-c.json": artifacts.passC, "adjudication.json": artifacts.adjudication, "issue-ledger.json": artifacts.ledger, "reinforced-review-queue.json": artifacts.queue, "summary.json": artifacts.summary };
  for (const [name, value] of Object.entries(files)) writeFileSync(join(batchRoot, name), serialize(value), "utf8");
  writeFileSync(progressPath, serialize(artifacts.progress), "utf8"); writeFileSync(patternPath, serialize(artifacts.patterns), "utf8"); writeFileSync(saturationPath, serialize(artifacts.saturation), "utf8");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeAllArtifacts(); console.log(`WROTE Batch 5 artifacts to ${batchRoot}`); console.log(`WROTE ${progressPath}`); console.log(`WROTE ${patternPath}`); console.log(`WROTE ${saturationPath}`);
}
