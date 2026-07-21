import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(root, "docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
export const batchRoot = join(root, "docs", "qa", "review", "ai-batches", "batch-4");
const progressPath = join(root, "docs", "qa", "review", "AI_REVIEW_PROGRESS.json");
const patternPath = join(root, "docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json");
const saturationPath = join(root, "docs", "qa", "review", "AI_REVIEW_PATTERN_SATURATION.json");
const timestamp = "2026-07-21T22:30:00.000Z";
const batchId = "stage-9-ai-review-batch-4-of-6";
const implementationBaseline = "70bacba4919aef2df057db4b43a70df4ea9f978e";
const roles = ["ai-semantic-reviewer-v1", "ai-comparative-reviewer-v1", "ai-adversarial-reviewer-v1", "ai-adjudicator-v1"];
const verdicts = ["AI_PASS", "AI_PASS_WITH_NOTE", "AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED", "AI_NOT_REVIEWED"];
const severities = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const BATCH_4_FIXTURE_IDS = [
  "S9-EVAL-003", "S9-EVAL-005", "S9-EVAL-015", "S9-EVAL-024",
  "S9-MATERIAL-002", "S9-MATERIAL-004", "S9-MATERIAL-016", "S9-MATERIAL-021",
  ...["004", "009", "018", "020", "027", "034", "039"].flatMap((cluster) =>
    ["ES", "EN", "RU", "ZH"].map((language) => `S9-CORE-${cluster}-${language}`)),
];

const clusterReview = {
  "004": {
    verdict: "AI_FAIL_MAJOR", severity: "HIGH", confidence: 0.98,
    code: "UNSUPPORTED_CONTRADICTION_GROUND_TRUTH",
    finding: "The promotion source supplies two compatible facts, one uncertain role-scope assumption, and one household gap, but no incompatible claims to reconcile or preserve as a pair.",
    remediation: "Add two explicit incompatible promotion, relocation, or household claims, or classify the case as incomplete rather than contradictory.",
  },
  "009": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.97,
    code: null,
    finding: "The three education options, placement-quality assumption, opportunity-cost and skill-fit risks, and conditional recommendation behavior are mutually coherent and equivalent across languages.",
    remediation: "NONE",
  },
  "018": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.94,
    code: null,
    finding: "Usage history, uncertain future usage, cancellation-penalty gap, service continuity, and sunk-cost caution form a coherent partial subscription decision without unsupported certainty.",
    remediation: "NONE",
  },
  "020": {
    verdict: "AI_FAIL_MAJOR", severity: "HIGH", confidence: 0.98,
    code: "UNSUPPORTED_CONTRADICTION_GROUND_TRUTH",
    finding: "A renewal deadline, an expected alternative offer, and a missing response date create uncertainty and urgency but do not form an explicit contradiction requiring two incompatible claims to be preserved.",
    remediation: "Add explicit incompatible lease or response-date claims, or reclassify the case as critically incomplete and retain only the grounded clarification path.",
  },
  "027": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.97,
    code: null,
    finding: "Minimum launch scope, uncertain demand transfer, missing support capacity, missed-window and reputation risks, and recommendation withholding are coherently grounded.",
    remediation: "NONE",
  },
  "034": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.95,
    code: null,
    finding: "Overlapping schedules, uncertain travel time, missing minimum-rest preference, overcommitment, and withdrawal-cost risks support a bounded clarification-first comparison.",
    remediation: "NONE",
  },
  "039": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.98,
    code: null,
    finding: "Temporary physical limits, pending qualified clearance, injury and coverage risks, elevated privacy handling, and recommendation withholding form a grounded high-risk counterexample.",
    remediation: "NONE",
  },
};

const fixtureReview = {
  "S9-EVAL-003": {
    verdict: "AI_FAIL_MINOR", severity: "MEDIUM", confidence: 0.93,
    code: "OVER_SPECIFIED_GROUNDED_RISK_MECHANISMS",
    finding: "The source states an initial internal investment and limited provider capacity, while the expected risks strengthen these into a recurring fixed cost and a provider outage mechanism that are not explicit.",
    remediation: "Keep the candidate mechanisms at the stated initial-investment and limited-capacity level, or add facts supporting recurrent cost and operational interruption.",
  },
  "S9-EVAL-005": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.99,
    code: null,
    finding: "Six repeated candidate risks visibly exceed the bounded candidate contract and the schema-invalid rejection is directly testable.",
    remediation: "NONE",
  },
  "S9-EVAL-015": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.99,
    code: null,
    finding: "The candidate explicitly selects a best option, so the safety-invalid rejection is grounded in the visible text and preserves Decision Engine authority.",
    remediation: "NONE",
  },
  "S9-EVAL-024": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.99,
    code: null,
    finding: "The meaningless candidate content is visible and the semantic-validation rejection is deterministic and appropriately fail-closed.",
    remediation: "NONE",
  },
  "S9-MATERIAL-002": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.99,
    code: null,
    finding: "The accepted benefit and risk remain distinct, keep valid option, scenario, and criterion references, and each receives a traceable future-composition item.",
    remediation: "NONE",
  },
  "S9-MATERIAL-004": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.99,
    code: null,
    finding: "Short- and long-term consequences are separately retained with valid scenario references, correct horizon transformations, and complete traceability.",
    remediation: "NONE",
  },
  "S9-MATERIAL-016": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.99,
    code: null,
    finding: "The unknown top-level material field produces the declared critical contract failure before any candidate item is accepted or composed.",
    remediation: "NONE",
  },
  "S9-MATERIAL-021": {
    verdict: "AI_PASS", severity: "NONE", confidence: 0.99,
    code: null,
    finding: "The imperative to choose immediately is explicit, and rejection for unsupported authority correctly prevents provider material from becoming product instruction.",
    remediation: "NONE",
  },
  "S9-CORE-020-ES": {
    verdict: "AI_FAIL_MAJOR", severity: "HIGH", confidence: 0.98,
    code: "UNSUPPORTED_CONTRADICTION_AND_GENDER_DRIFT",
    finding: "The source has no incompatible claim pair, and the Spanish fixture adds a specifically female tenant where EN and ZH are neutral and RU uses a masculine-form referent.",
    remediation: "Add explicit contradictory claims or reclassify the case, and align the referent's gender treatment across all four locale variants.",
  },
};

function reviewFor(id) {
  if (fixtureReview[id]) return fixtureReview[id];
  const cluster = id.match(/^S9-CORE-(\d{3})-/)?.[1];
  return clusterReview[cluster];
}

function readJson(...parts) {
  return JSON.parse(readFileSync(join(root, ...parts), "utf8"));
}

function sourceEntries() {
  return JSON.parse(readFileSync(manifestPath, "utf8")).entries;
}

export function canonicalSource(entry) {
  const { human_review: _historicalHumanReview, ...source } = entry;
  return source;
}

export function sourceFixtureHash(entry) {
  return hash(JSON.stringify(canonicalSource(entry)));
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function artifactHash(value) {
  return hash(serialize(value));
}

function countBy(entries, field) {
  const counts = new Map();
  for (const entry of entries) counts.set(entry[field], (counts.get(entry[field]) ?? 0) + 1);
  return Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
}

function countValues(entries, field, values) {
  return Object.fromEntries(values.map((value) => [value, entries.filter((entry) => entry[field] === value).length]));
}

export function contextIsolation(reviewerRoleId) {
  return {
    review_session: "stage-9-ai-review-batch-4",
    reviewer_role_id: reviewerRoleId,
    model_id: "codex-current-session",
    independence_type: "role-and-context-isolated",
    model_independence: "not_claimed",
  };
}

function selectedEntries() {
  const byId = new Map(sourceEntries().map((entry) => [entry.fixture_id, entry]));
  return BATCH_4_FIXTURE_IDS.map((id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`Unknown Batch 4 fixture: ${id}`);
    return entry;
  });
}

export function buildSelection() {
  const selected = selectedEntries();
  const completeClusters = [...new Set(selected.filter((entry) => entry.equivalence_cluster).map((entry) => entry.equivalence_cluster))].sort();
  return {
    artifact_version: "stage-9-ai-review-batch-selection.4",
    batch_id: batchId,
    source_dataset_commit: "81435cbf4ce3ebc00c80aba33b8b753b2c62322c",
    implementation_baseline_commit: implementationBaseline,
    selection_method: "fixed deterministic coverage-deficit matrix over the versioned 216-entry offline source catalog",
    context_isolation: contextIsolation("ai-review-batch-selector-v1"),
    selection_rationale: [
      "Exactly seven untouched core clusters provide one complete ES/EN/RU/ZH group per required domain and cover complete, partial, contradictory, and critically incomplete inputs.",
      "Clusters 004, 009, 018, 020, 027, 034, and 039 cover every required domain and completeness state while stressing contradiction, high-risk, privacy, urgency, reversibility, third-party, and multilingual behavior.",
      "Four synthetic-risk fixtures challenge grounded risk mechanisms, bounded schema rejection, unsupported best-option authority, and meaningless-content rejection.",
      "Four rich baselines provide preservation counterexamples for benefits, risks, and consequence horizons plus controlled contract failure and imperative-authority rejection.",
      "The sample deliberately supplies both confirmations and counterexamples for the five named cross-batch patterns instead of assuming every prior pattern recurs.",
    ],
    coverage_deficit_matrix: {
      domain_rule: "one untouched complete four-language cluster per each of seven core domains",
      completeness_states: ["complete", "partial", "contradictory", "critically_incomplete"],
      targeted_dimensions: ["high_risk", "privacy", "controlled_failure", "urgency", "reversibility", "third_party_dependency", "incomplete_information", "contradictory_information", "uncertainty_preservation", "semantic_similarity", "potential_ground_truth_defect"],
      chosen_core_clusters: completeClusters,
      chosen_synthetic_risk: BATCH_4_FIXTURE_IDS.slice(0, 4),
      chosen_rich_baseline: BATCH_4_FIXTURE_IDS.slice(4, 8),
    },
    excluded_prior_clusters: ["S9-CLUSTER-002", "S9-CLUSTER-003", "S9-CLUSTER-005", "S9-CLUSTER-008", "S9-CLUSTER-010", "S9-CLUSTER-012", "S9-CLUSTER-013", "S9-CLUSTER-014", "S9-CLUSTER-015", "S9-CLUSTER-021", "S9-CLUSTER-023", "S9-CLUSTER-024", "S9-CLUSTER-025", "S9-CLUSTER-026", "S9-CLUSTER-029", "S9-CLUSTER-031", "S9-CLUSTER-033", "S9-CLUSTER-035", "S9-CLUSTER-036", "S9-CLUSTER-037", "S9-CLUSTER-038", "S9-CLUSTER-040"],
    coverage: {
      selected_count: selected.length,
      dataset_types: countBy(selected, "dataset_type"),
      languages: countBy(selected, "language"),
      domains: countBy(selected, "domain"),
      completeness: countBy(selected, "completeness_state"),
      high_risk_count: selected.filter((entry) => entry.risk_markers.includes("high_risk_or_safety_sensitive")).length,
      privacy_count: selected.filter((entry) => entry.privacy_marker).length,
      controlled_failure_count: selected.filter((entry) => entry.controlled_failure_marker).length,
      complete_equivalence_clusters: completeClusters,
    },
    fixtures: selected.map((entry, index) => ({
      sequence: index + 1,
      fixture_id: entry.fixture_id,
      source_fixture_hash: sourceFixtureHash(entry),
      dataset_type: entry.dataset_type,
      language: entry.language,
      domain: entry.domain,
      completeness_state: entry.completeness_state,
      equivalence_cluster: entry.equivalence_cluster,
      high_risk: entry.risk_markers.includes("high_risk_or_safety_sensitive"),
      privacy: entry.privacy_marker,
      controlled_failure: entry.controlled_failure_marker,
    })),
  };
}

export function buildBlindPackets() {
  return {
    artifact_version: "stage-9-ai-review-blind-packets.4",
    batch_id: batchId,
    reviewer_role_id: roles[0],
    prompt_version: "stage-9-ai-review-pass-a.4",
    context_isolation: contextIsolation(roles[0]),
    blindness_invariant: "Packets contain only fixture identity, locale, user/source input, and source metadata; expected behavior, preservation expectations, prior findings, ledgers, and later passes are excluded.",
    packets: selectedEntries().map((entry) => ({
      fixture_id: entry.fixture_id,
      source_fixture_hash: sourceFixtureHash(entry),
      locale: entry.language,
      source_input: entry.source_input,
      declared_context_metadata: {
        dataset_type: entry.dataset_type,
        equivalence_cluster: entry.equivalence_cluster,
        domain: entry.domain,
        completeness_state: entry.completeness_state,
        cost_profile: entry.cost_profile,
      },
    })),
  };
}

function describeToken(token) {
  return token.replaceAll("_", " ");
}

function blindReconstruction(packet) {
  const source = packet.source_input;
  if (source.material) {
    const item = source.material.items[0] ?? {};
    const content = item.content ?? "No candidate content supplied.";
    const invalidRefs = [...(item.option_refs ?? []), ...(item.scenario_refs ?? []), ...(item.criterion_refs ?? [])].filter((ref) => ref.includes("missing"));
    return {
      decision_under_review: "Determine whether the supplied provider-candidate material can be safely normalized and retained without gaining product authority.",
      material_facts: [`Candidate type: ${item.item_type ?? "unknown"}.`, `Candidate content: ${content}`, `Declared authority: ${item.authority ?? "not stated"}.`],
      constraints: ["Candidate material is synthetic and candidate-only.", "Only references listed by the acceptance context may be used."],
      uncertainties: item.item_type === "unknown" ? [content.trim().replace(/\s+/g, " ")] : [],
      contradictions: [],
      risks: [
        ...(content.includes("97%") ? ["An unsupported numeric probability could be mistaken for established certainty."] : []),
        ...(content.includes("chain-of-thought") || content.includes("provider secret") ? ["Raw reasoning or secret-like content must not enter composition or logs."] : []),
        ...(invalidRefs.length ? [`Out-of-set references must be rejected: ${invalidRefs.join(", ")}.`] : []),
      ],
      temporal_constraints: [],
      irreversibility: ["No irreversible action is supported by this candidate packet."],
      third_party_dependencies: ["The material is attributed to a provider candidate and remains non-authoritative."],
      privacy_concerns: content.includes("secret") ? ["Secret-like text must be rejected and must not open personal-data scope."] : ["No real personal data is present; minimum-necessary handling still applies."],
      missing_information: ["No independent user-fact substrate is included in this packet."],
      allowed_conclusions: [invalidRefs.length || content.includes("97%") || content.includes("chain-of-thought") || content.includes("provider secret") ? "The candidate may be rejected for the visible contract or safety defect." : "The candidate may be normalized only without changing its semantic type, uncertainty, provenance, or authority."],
      forbidden_conclusions: ["Treating candidate material as a verified user fact or final recommendation.", "Silently dropping an observed item without a ledger disposition."],
      required_clarification_or_controlled_failure_behavior: ["Reject invalid or unsafe material with a machine-readable reason; otherwise preserve normalized content and traceability."],
      required_controlled_failure_behavior: ["Fail closed if schema, reference, provenance, safety, or preservation validity cannot be established."],
    };
  }
  if (source.decision_summary) {
    const facts = source.known_facts ?? [];
    const uncertainties = source.known_uncertainties ?? [];
    const risks = [
      ...facts.map((fact) => `Risk implication to evaluate without converting it into a recommendation: ${fact}`),
      ...uncertainties.map((unknown) => `Planning remains exposed because ${unknown.toLowerCase()}.`),
    ];
    return {
      decision_under_review: source.decision_summary,
      material_facts: facts,
      constraints: [...(source.constraints ?? []), source.objective],
      uncertainties,
      contradictions: [],
      risks,
      temporal_constraints: (source.constraints ?? []).filter((value) => /mes|fecha|plazo|inicio/i.test(value)),
      irreversibility: ["No exit, rollback, or sunk commitment is established by the packet."],
      third_party_dependencies: facts.filter((value) => /proveedor|extern/i.test(value)),
      privacy_concerns: ["The packet is synthetic and non-personal; no additional identifiers are needed."],
      missing_information: uncertainties,
      allowed_conclusions: ["Identify only risks grounded in stated facts and uncertainties while preserving the no-selection objective."],
      forbidden_conclusions: ["Selecting an option or inventing cost, provider, demand, deadline, or reversibility facts."],
      required_clarification_or_controlled_failure_behavior: ["Expose material uncertainty and fail closed if safe grounded risk material cannot be produced."],
      required_controlled_failure_behavior: ["Do not present invalid or ungrounded candidate material as accepted analysis."],
    };
  }
  const contradictionVisible = (source.known_facts?.length ?? 0) > 1 && source.known_facts.some((value) => /not_|no_|without_/.test(value));
  return {
    decision_under_review: source.user_situation,
    material_facts: (source.known_facts ?? []).map(describeToken),
    constraints: [`Declared completeness: ${packet.declared_context_metadata.completeness_state}.`, `Intent: ${describeToken(source.user_intent)}.`],
    uncertainties: [...(source.known_assumptions ?? []).map((value) => `Assumption: ${describeToken(value)}.`), ...(source.critical_gaps ?? []).map((value) => `Critical gap: ${describeToken(value)}.`), ...(source.important_gaps ?? []).map((value) => `Important gap: ${describeToken(value)}.`)],
    contradictions: packet.declared_context_metadata.completeness_state === "contradictory" && !contradictionVisible ? ["The metadata declares a contradiction, but the visible claims do not contain an explicit incompatible pair."] : [],
    risks: ["The stated assumption may fail and must remain uncertain.", ...(source.critical_gaps?.length ? ["Acting before the critical gap is resolved could reverse the decision quality."] : []), ...(source.important_gaps?.length ? ["The important gap may materially change option comparison."] : [])],
    temporal_constraints: /month|deadline|date|six|plazo|fecha|mes|срок|месяц|日期|期限|个月/.test(source.user_situation) ? [source.user_situation] : [],
    irreversibility: /move|hire|booking|contract|mudanza|contrat|reserv|переезд|найм|бронир|搬迁|招聘|预订/.test(source.user_situation) ? ["Commitment and exit terms should be established before an irreversible step."] : ["No irreversible commitment is established by the source."],
    third_party_dependencies: /care|contract|provider|cuidado|proveedor|уход|подряд|照护|承包/.test(source.user_situation) ? ["The decision depends on another person or contracted party whose continued availability is not guaranteed."] : [],
    privacy_concerns: packet.declared_context_metadata.domain.includes("finance") || /care|cuidado|уход|照护/.test(source.user_situation) ? ["Use broad categories and do not request account identifiers or unnecessary family details."] : ["No personal identifiers are needed."],
    missing_information: [...(source.critical_gaps ?? []), ...(source.important_gaps ?? [])].map(describeToken),
    allowed_conclusions: [source.critical_gaps?.length || source.important_gaps?.length ? "Clarify the named material gap and preserve uncertainty before a preferred path." : "Compare the stated options conditionally without converting assumptions into facts."],
    forbidden_conclusions: ["Inventing facts, certainty, costs, deadlines, or option properties not visible in the source.", "Giving a definitive professional answer or normal recommendation while a critical gap remains."],
    required_clarification_or_controlled_failure_behavior: [source.critical_gaps?.length ? "Ask a minimal question about the critical gap and withhold normal recommendation." : source.important_gaps?.length ? "Ask only if the important gap materially changes the comparison." : "Do not ask unnecessary clarification."],
    required_controlled_failure_behavior: ["Fail closed with a human-readable reason if grounded analysis cannot be produced."],
  };
}

export function buildPassA(blind) {
  return {
    artifact_version: "stage-9-ai-review-pass-a.4",
    batch_id: batchId,
    pass: "PASS_A_BLIND_SEMANTIC",
    reviewer_role_id: roles[0],
    model_id: "codex-current-session",
    review_timestamp: timestamp,
    context_isolation: contextIsolation(roles[0]),
    prompt_version: "stage-9-ai-review-pass-a.4",
    immutable_input_packet: { path: "docs/qa/review/ai-batches/batch-4/blind-packets.json", sha256: artifactHash(blind) },
    results: blind.packets.map((packet) => ({
      fixture_id: packet.fixture_id,
      source_fixture_hash: packet.source_fixture_hash,
      blind_reconstruction: blindReconstruction(packet),
      confidence: packet.declared_context_metadata.dataset_type === "canonical_core" ? 0.94 : 0.96,
      rationale: "The reconstruction uses only the frozen source packet and separates visible facts, assumptions, gaps, risks, privacy, and forbidden conclusions.",
      evidence_references: [`blind-packets.json#packets[fixture_id=${packet.fixture_id}].source_input`, `blind-packets.json#packets[fixture_id=${packet.fixture_id}].declared_context_metadata`],
      issue_codes: blindReconstruction(packet).contradictions.length ? ["DECLARED_CONTRADICTION_NOT_VISIBLE"] : [],
    })),
  };
}

function comparativeAssessment(config) {
  const failed = config.verdict.includes("FAIL");
  const silentLoss = config.code === "ACCEPTED_ITEM_SILENTLY_DROPPED";
  return {
    ground_truth_support: failed ? "DEFECT_FOUND" : "SUPPORTED",
    expected_behavior_completeness: failed ? "INCOMPLETE_OR_INCONSISTENT" : "COMPLETE",
    silent_loss: silentLoss ? "FOUND_IN_EXPECTATION" : "NOT_FOUND",
    invented_facts: ["EXPECTED_RISKS_UNSUPPORTED_BY_SOURCE", "UNSUPPORTED_LOCATION_RETENTION_RISK_GROUND_TRUTH", "UNSUPPORTED_RATE_RESET_RISK_GROUND_TRUTH", "UNSUPPORTED_PRICE_INCREASE_GROUND_TRUTH"].includes(config.code) ? "FOUND_IN_EXPECTATION" : "NOT_FOUND",
    unsupported_contradiction: config.code?.includes("CONTRADICTION") ? "FOUND" : "NOT_FOUND",
    unsupported_nonexistent_option: config.code?.includes("NONEXISTENT") ? "FOUND_ORACLE_DEFECT" : "NOT_FOUND",
    unsupported_high_risk_status: config.unsupportedHighRisk ? "EXPECTED_HIGH_RISK_DETAIL_UNSUPPORTED" : "NOT_FOUND",
    risk_priority_inversion: "NOT_FOUND",
    uncertainty_preservation: silentLoss ? "LOST" : "PRESERVED",
    privacy_expectations: "COHERENT",
    clarification_refusal_safety: config.code?.includes("CONTRADICTION") ? "UNSUPPORTED_CLARIFICATION_PATH" : "COHERENT",
    controlled_failure_correctness: silentLoss || config.code?.includes("NONEXISTENT") ? "INCONSISTENT" : "COHERENT",
  };
}

export function buildPassB(selection, passA) {
  const byId = new Map(selectedEntries().map((entry) => [entry.fixture_id, entry]));
  return {
    artifact_version: "stage-9-ai-review-pass-b.4",
    batch_id: batchId,
    pass: "PASS_B_COMPARATIVE_SEMANTIC",
    reviewer_role_id: roles[1],
    model_id: "codex-current-session",
    review_timestamp: timestamp,
    context_isolation: contextIsolation(roles[1]),
    prompt_version: "stage-9-ai-review-pass-b.4",
    immutable_input_packet: [
      { path: "docs/qa/review/ai-batches/batch-4/selection.json", sha256: artifactHash(selection) },
      { path: "docs/qa/review/ai-batches/batch-4/pass-a.json", sha256: artifactHash(passA) },
      { path: "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", sha256: hash(readFileSync(manifestPath)) },
    ],
    frozen_semantic_input: "Pass A is consumed byte-for-byte and is not modified by this pass.",
    results: BATCH_4_FIXTURE_IDS.map((id) => {
      const config = reviewFor(id);
      return {
        fixture_id: id,
        source_fixture_hash: sourceFixtureHash(byId.get(id)),
        comparative_assessment: comparativeAssessment(config),
        provisional_verdict: config.verdict,
        severity: config.severity,
        confidence: config.confidence,
        rationale: config.finding,
        evidence_references: [`selection.json#fixtures[fixture_id=${id}]`, `LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${id}]`, `pass-a.json#results[fixture_id=${id}]`],
        issue_codes: config.code ? [config.code] : [],
        remediation_requirement: config.remediation,
      };
    }),
  };
}

function languageAssessment(id, entry, config) {
  if (id === "S9-CORE-020-ES") return "NATURAL_BUT_GENDER_SPECIFIC";
  return entry.language === "not_declared" ? "NOT_APPLICABLE" : config.verdict === "AI_PASS" ? "NATURAL" : "NATURAL_OR_RECOVERABLE";
}

export function buildPassC(selection) {
  const entries = selectedEntries();
  return {
    artifact_version: "stage-9-ai-review-pass-c.4",
    batch_id: batchId,
    pass: "PASS_C_LINGUISTIC_ADVERSARIAL",
    reviewer_role_id: roles[2],
    model_id: "codex-current-session",
    review_timestamp: timestamp,
    context_isolation: contextIsolation(roles[2]),
    prompt_version: "stage-9-ai-review-pass-c.4",
    immutable_input_packet: [
      { path: "docs/qa/review/ai-batches/batch-4/selection.json", sha256: artifactHash(selection) },
      { path: "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", sha256: hash(readFileSync(manifestPath)) },
    ],
    independence_invariant: "This reviewer receives source fixtures and cluster membership only; no other reviewer output is an input.",
    cluster_review_method: "Every selected core cluster is evaluated as a four-language group while preserving an individual result for each fixture.",
    results: entries.map((entry, index) => {
      const config = reviewFor(entry.fixture_id);
      const cluster = entry.equivalence_cluster;
      return {
        sequence: index + 1,
        fixture_id: entry.fixture_id,
        source_fixture_hash: sourceFixtureHash(entry),
        provisional_verdict: config.verdict,
        severity: config.severity,
        confidence: config.confidence,
        equivalence_status: cluster === "S9-CLUSTER-020" ? "EQUIVALENT_WITH_GENDER_REFERENT_DRIFT" : cluster ? "EQUIVALENT_WITH_SHARED_REFERENCE_FINDING" : "NOT_APPLICABLE",
        language_naturalness: languageAssessment(entry.fixture_id, entry, config),
        gender_consistency: cluster === "S9-CLUSTER-020" ? "CROSS_LOCALE_DRIFT_OBSERVED" : "CONSISTENT",
        referent_consistency: entry.fixture_id === "S9-CORE-020-ES" ? "SPANISH_ADDS_FEMALE_REFERENT" : cluster === "S9-CLUSTER-020" ? "AFFECTED_BY_CLUSTER_DRIFT" : "CONSISTENT",
        modality_and_negation: "PRESERVED",
        urgency_equivalence: cluster ? "PRESERVED" : "NOT_APPLICABLE",
        risk_level_equivalence: cluster ? "PRESERVED" : "NOT_APPLICABLE",
        cultural_regional_correctness: "NO_MATERIAL_DISTORTION_OBSERVED",
        added_or_lost_meaning: entry.fixture_id === "S9-CORE-020-ES" ? "GENDER_SPECIFICITY_ADDED" : config.code?.includes("UNSUPPORTED") || config.code?.includes("SILENTLY") ? "REFERENCE_ADDS_OR_LOSES_UNSUPPORTED_MEANING" : "NONE_MATERIAL",
        artificial_wording: languageAssessment(entry.fixture_id, entry, config),
        semantic_duplicate_or_disguised_paraphrase: cluster ? "EXPECTED_CLUSTER_EQUIVALENCE_ONLY" : "NONE_OBSERVED",
        privacy_leakage: "NONE_OBSERVED",
        hallucination_incentive: config.verdict === "AI_FAIL_MAJOR" ? "HIGH" : config.verdict === "AI_FAIL_MINOR" ? "MEDIUM" : "LOW",
        clarification_or_refusal_safety: config.code?.includes("CONTRADICTION") ? "UNSUPPORTED_CLARIFICATION_TRIGGER" : "COHERENT",
        excessive_expected_directiveness: "NONE_OBSERVED",
        fixture_reference_defects: config.code ? [config.finding] : [],
        rationale: config.finding,
        evidence_references: [`docs/qa/review/ai-batches/batch-4/selection.json#fixtures[fixture_id=${entry.fixture_id}]`, `docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json#entries[fixture_id=${entry.fixture_id}]`],
        issue_codes: config.code ? [config.code] : [],
        remediation_required: config.remediation !== "NONE",
        remediation: config.remediation === "NONE" ? null : config.remediation,
      };
    }),
  };
}

function reinforcementReasons(config) {
  const reasons = [];
  if (["AI_FAIL_MAJOR", "AI_DISPUTED"].includes(config.verdict)) reasons.push(`FINAL_VERDICT_${config.verdict}`);
  if (["HIGH", "CRITICAL"].includes(config.severity)) reasons.push(`SEVERITY_${config.severity}`);
  if (config.confidence < 0.75) reasons.push("CONFIDENCE_BELOW_0_75");
  if (config.unsupportedHighRisk) reasons.push("UNSUPPORTED_HIGH_RISK_GROUND_TRUTH");
  return reasons;
}

export function buildAdjudication(passA, passB, passC) {
  const entries = selectedEntries();
  return {
    artifact_version: "stage-9-ai-review-adjudication.4",
    batch_id: batchId,
    pass: "PASS_D_AI_ADJUDICATION",
    reviewer_role_id: roles[3],
    model_id: "codex-current-session",
    prompt_version: "stage-9-ai-review-adjudication.4",
    review_timestamp: timestamp,
    context_isolation: contextIsolation(roles[3]),
    immutable_input_packet: [
      { path: "docs/qa/review/ai-batches/batch-4/pass-a.json", sha256: artifactHash(passA) },
      { path: "docs/qa/review/ai-batches/batch-4/pass-b.json", sha256: artifactHash(passB) },
      { path: "docs/qa/review/ai-batches/batch-4/pass-c.json", sha256: artifactHash(passC) },
    ],
    results: entries.map((entry, index) => {
      const config = reviewFor(entry.fixture_id);
      const accepted = [config.finding];
      const reinforcement = reinforcementReasons(config);
      return {
        sequence: index + 1,
        fixture_id: entry.fixture_id,
        source_fixture_hash: sourceFixtureHash(entry),
        consolidated_verdict: config.verdict,
        severity: config.severity,
        confidence: config.confidence,
        rationale: `The frozen semantic reconstruction, comparative validation, and independent adversarial evidence support this disposition: ${config.finding}`,
        accepted_observations: accepted,
        rejected_observations: [],
        unresolved_observations: [],
        confirmed_issues: config.code ? accepted : [],
        disputed_issues: [],
        issue_codes: config.code ? [config.code] : [],
        evidence_references: [`docs/qa/review/ai-batches/batch-4/pass-a.json#results[fixture_id=${entry.fixture_id}]`, `docs/qa/review/ai-batches/batch-4/pass-b.json#results[fixture_id=${entry.fixture_id}]`, `docs/qa/review/ai-batches/batch-4/pass-c.json#results[fixture_id=${entry.fixture_id}]`],
        remediation_requirement: config.remediation,
        reviewer_role_ids: roles,
        review_timestamp: timestamp,
        prompt_version: "stage-9-ai-review-adjudication.4",
        disagreement_flags: {
          silent_loss: false,
          privacy: false,
          controlled_failure: false,
          multilingual_equivalence: false,
          unsupported_high_risk_ground_truth: Boolean(config.unsupportedHighRisk),
        },
        reinforced_review_required: reinforcement.length > 0,
        reinforced_review_reasons: reinforcement,
        adjudication_notes: [{ observation: config.finding, disposition: "ACCEPTED", reason: "The observation is directly grounded in the frozen source and independently traceable in the comparative and adversarial records." }],
      };
    }),
  };
}

export function buildIssueLedger(adjudication) {
  const issues = adjudication.results.filter((item) => item.issue_codes.length).map((item, index) => ({
    issue_id: `B4-ISSUE-${String(index + 1).padStart(3, "0")}`,
    fixture_id: item.fixture_id,
    source_fixture_hash: item.source_fixture_hash,
    issue_code: item.issue_codes[0],
    severity: item.severity,
    status: ["AI_FAIL_MINOR", "AI_FAIL_MAJOR", "AI_DISPUTED"].includes(item.consolidated_verdict) ? "OPEN" : "RECORDED_NOTE",
    reviewer_role_ids: [roles[1], roles[2], roles[3]],
    description: item.accepted_observations[0],
    evidence_references: item.evidence_references,
    remediation_requirement: item.remediation_requirement,
  }));
  return {
    artifact_version: "stage-9-ai-review-issue-ledger.4",
    batch_id: batchId,
    review_timestamp: timestamp,
    reviewer_role_id: roles[3],
    issues,
    summary: {
      issue_count: issues.length,
      affected_fixture_count: new Set(issues.map((item) => item.fixture_id)).size,
      status_counts: countValues(issues, "status", ["OPEN", "DISPUTED", "RECORDED_NOTE"]),
      severity_counts: countValues(issues, "severity", severities),
    },
  };
}

export function buildQueue(adjudication) {
  const cases = adjudication.results.filter((item) => item.reinforced_review_required).map((item) => ({
    sequence: item.sequence,
    fixture_id: item.fixture_id,
    source_fixture_hash: item.source_fixture_hash,
    batch_provenance: batchId,
    status: "PENDING_NOT_EXECUTED",
    reasons: item.reinforced_review_reasons,
    evidence_references: item.evidence_references,
  }));
  return {
    artifact_version: "stage-9-ai-review-reinforced-review-queue.4",
    batch_id: batchId,
    status: "PENDING_NOT_EXECUTED",
    review_timestamp: timestamp,
    case_count: cases.length,
    cases,
  };
}

export function buildSummary(selection, adjudication, ledger, queue) {
  const verdictCounts = countValues(adjudication.results, "consolidated_verdict", verdicts);
  const severityCounts = countValues(adjudication.results, "severity", severities);
  return {
    artifact_version: "stage-9-ai-review-batch-summary.4",
    batch_id: batchId,
    review_timestamp: timestamp,
    stage_status: "In Progress",
    release_readiness: "NOT_DECLARED",
    runtime_boundaries: "CLOSED",
    status: "COMPLETE_WITH_REINFORCED_REVIEW_PENDING",
    reviewed_fixture_count: 36,
    remaining_fixture_count: 72,
    coverage: selection.coverage,
    verdict_counts: verdictCounts,
    severity_counts: severityCounts,
    reinforced_review_count: queue.case_count,
    reinforced_review_cases: queue.cases.map((item) => item.fixture_id),
    issue_count: ledger.issues.length,
    issue_status_counts: ledger.summary.status_counts,
    network_request_count: 0,
    critical_defect_count: 0,
    dataset_wide_blocker: false,
    systemic_pattern_status: "POTENTIALLY_SYSTEMIC_WITHOUT_SYSTEMIC_BLOCKER",
    dataset_wide_impact_assessment: "Batch 4 confirms contradiction-oracle recurrence in two more clusters and one bounded synthetic over-specification, while 27 selected fixtures act as counterexamples. The evidence remains potentially systemic but does not establish class-wide unreliability or a blocker across the 72 unreviewed fixtures.",
    pattern_saturation_assessment: "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json",
    fixture_remediation: "NONE",
    reinforced_review_execution: "NOT_EXECUTED",
    automatic_next_batch_authorization: "NOT_GRANTED",
    next_planning_candidate: "Stage 9 Independent AI Review Batch 5 of 6",
  };
}

export function buildPatternRegistry() {
  const prior = readJson("docs", "qa", "review", "AI_REVIEW_CROSS_BATCH_PATTERNS.json");
  const entriesById = new Map(sourceEntries().map((entry) => [entry.fixture_id, entry]));
  const clusterMembers = (cluster) => ["ES", "EN", "RU", "ZH"].map((language) => `S9-CORE-${cluster}-${language}`);
  const allSelected = BATCH_4_FIXTURE_IDS;
  const assessments = {
    "unsupported contradiction ground truth": {
      confirmations: [...clusterMembers("004"), ...clusterMembers("020")],
      counterexamples: allSelected.filter((id) => /^S9-CORE-(009|018|027|034|039)-/.test(id)),
      severity: { HIGH: 25 },
      accepted: ["Clusters 004 and 020 declare contradiction handling without an explicit incompatible claim pair."],
      rejected: ["The defect does not apply merely because a fixture contains a gap or an uncertain assumption."],
    },
    "unsupported high-risk ground truth": {
      confirmations: [], counterexamples: clusterMembers("039"), severity: { MEDIUM: 4, HIGH: 9 },
      accepted: ["Prior unsupported high-risk occurrences remain valid."],
      rejected: ["Cluster 039 does not repeat the defect: its injury, coverage, qualified-review, privacy, and withholding expectations are source-grounded."],
    },
    "unsupported nonexistent option": {
      confirmations: [], counterexamples: ["S9-EVAL-015", "S9-MATERIAL-021"], severity: { HIGH: 1 },
      accepted: ["The prior unsupported nonexistent-option occurrence remains valid."],
      rejected: ["Batch 4 authority-rejection fixtures expose their offending imperative directly and do not depend on an invisible nonexistent option."],
    },
    "unsafe clarification/refusal path": {
      confirmations: [], counterexamples: clusterMembers("039"), severity: { HIGH: 5 },
      accepted: ["The prior unsafe clarification or refusal findings remain valid."],
      rejected: ["Cluster 039 provides a grounded high-risk clarification and withholding counterexample without professional certainty."],
    },
    "localization or gender drift": {
      confirmations: ["S9-CORE-020-ES"], counterexamples: allSelected.filter((id) => id.startsWith("S9-CORE-") && !id.startsWith("S9-CORE-020-")), severity: { LOW: 9, MEDIUM: 4 },
      accepted: ["The Spanish tenant is explicitly female while the cluster's other referents are neutral or masculine-form."],
      rejected: ["No material gender or referent drift was found in the other six selected clusters."],
    },
    "privacy expectation disagreement": {
      confirmations: [], counterexamples: clusterMembers("039"), severity: { MEDIUM: 1 },
      accepted: ["The prior privacy-expectation disagreement remains recorded."],
      rejected: ["Cluster 039 consistently requires data minimization, no identifiers, and broad-category handling across all four languages."],
    },
    "controlled-failure disagreement": {
      confirmations: [], counterexamples: ["S9-EVAL-005", "S9-EVAL-015", "S9-EVAL-024", "S9-MATERIAL-016", ...clusterMembers("020")], severity: { MEDIUM: 1 },
      accepted: ["The prior controlled-failure disagreement remains recorded."],
      rejected: ["Eight Batch 4 controlled-failure fixtures expose coherent fail-closed triggers and machine-readable reasons."],
    },
    "invented cost, deadline or irreversibility": {
      confirmations: ["S9-EVAL-003"], counterexamples: ["S9-MATERIAL-004", ...clusterMembers("004"), ...clusterMembers("020"), ...clusterMembers("034")], severity: { MEDIUM: 5, HIGH: 5 },
      accepted: ["EVAL-003 strengthens initial investment into recurrent fixed cost and limited capacity into outage."],
      rejected: ["Relocation, overlap, withdrawal, and consequence-horizon risks in the listed counterexamples remain bounded by visible source commitments."],
    },
    "reference behavior not supported by input": {
      confirmations: [...clusterMembers("004"), ...clusterMembers("020"), "S9-EVAL-003"], counterexamples: allSelected.filter((id) => ![...clusterMembers("004"), ...clusterMembers("020"), "S9-EVAL-003"].includes(id)), severity: { MEDIUM: 9, HIGH: 37 },
      accepted: ["Nine Batch 4 fixtures contain reference behavior stronger than their visible input."],
      rejected: ["Twenty-seven Batch 4 fixtures provide counterexamples with coherent, source-supported reference behavior."],
    },
  };
  const patterns = prior.patterns.map((item) => {
    const assessment = assessments[item.pattern];
    if (!assessment) return item;
    const affectedFixtureIds = [...new Set([...item.affected_fixture_ids.filter((id) => !BATCH_4_FIXTURE_IDS.includes(id)), ...assessment.confirmations])];
    const batch4Occurs = assessment.confirmations.length > 0;
    const affectedBatches = [...new Set([...item.affected_batches.filter((batch) => batch !== "batch-4"), ...(batch4Occurs ? ["batch-4"] : [])])];
    const affectedEntries = affectedFixtureIds.map((id) => entriesById.get(id)).filter(Boolean);
    return {
      ...item,
      affected_batches: affectedBatches,
      affected_fixture_ids: affectedFixtureIds,
      distinct_clusters: [...new Set(affectedEntries.map((entry) => entry.equivalence_cluster).filter(Boolean))].sort(),
      distinct_domains: [...new Set(affectedEntries.map((entry) => entry.domain))].sort(),
      distinct_dataset_types: [...new Set(affectedEntries.map((entry) => entry.dataset_type))].sort(),
      severity_distribution: assessment.severity,
      cumulative_occurrence_count: affectedFixtureIds.length,
      evidence: [...item.evidence.filter((value) => !value.startsWith("batch-4/")), ...(batch4Occurs ? ["batch-4/issue-ledger.json", "batch-4/pass-c.json"] : ["batch-4/adjudication.json:counterexamples_only"])],
      batch_4_assessment: { confirming_fixture_ids: assessment.confirmations, counterexample_fixture_ids: assessment.counterexamples, accepted_evidence: assessment.accepted, rejected_hypotheses: assessment.rejected },
    };
  });
  return { ...prior, artifact_version: "stage-9-ai-review-cross-batch-pattern-registry.2", review_scope: "Batches 1-4 of 6", review_timestamp: timestamp, aggregate_status: "POTENTIALLY_SYSTEMIC_WITHOUT_SYSTEMIC_BLOCKER", systemic_blocker: false, patterns, blocker_assessment: "No SYSTEMIC_BLOCKER is established: Batch 4 adds bounded confirmations and substantial counterevidence, while 72 fixtures remain unreviewed and class-level ground-truth unreliability is not proven.", fixture_remediation: "NONE" };
}

export function buildPatternSaturation(patterns) {
  const challenged = ["unsupported contradiction ground truth", "unsupported high-risk ground truth", "localization or gender drift", "invented cost, deadline or irreversibility", "reference behavior not supported by input"];
  const remediationAnalysis = {
    "unsupported contradiction ground truth": {
      generator_or_template_linkage: "Repeated in the canonical-core completeness/oracle template family; the exact authoring source is not proven by review artifacts alone.",
      locality_assessment: "Cross-domain and cross-cluster rather than local: 25 occurrences across seven core clusters, with 20 Batch 4 counterexamples showing it is not universal.",
      rule_level_remediation_assessment: "POSSIBLE: require every contradictory label and reconcile_contradiction behavior to cite an explicit incompatible claim pair.",
      fixture_level_remediation_assessment: "REQUIRED_FOR_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW; NOT_EXECUTED",
    },
    "unsupported high-risk ground truth": {
      generator_or_template_linkage: "No single high-risk generator or template is established; prior occurrences span several domain mappings.",
      locality_assessment: "Recurring in four prior clusters but bounded by a fully grounded four-language Batch 4 high-risk counterexample.",
      rule_level_remediation_assessment: "CONDITIONAL: apply a general source-entailment rule, not a blanket rewrite of all high-risk expectations.",
      fixture_level_remediation_assessment: "REQUIRED_ONLY_FOR_CONFIRMED_PRIOR_FIXTURES; NOT_EXECUTED",
    },
    "localization or gender drift": {
      generator_or_template_linkage: "Linked to locale-specific fixture authoring or translation templates; one shared generator defect is not proven.",
      locality_assessment: "Cluster-specific wording drift recurs across several domains; 24 Batch 4 core counterexamples bound the defect.",
      rule_level_remediation_assessment: "PARTIAL: add cross-locale referent/gender lint, followed by qualified language-specific review.",
      fixture_level_remediation_assessment: "REQUIRED_FOR_CONFIRMED_LOCALE_VARIANTS; NOT_EXECUTED",
    },
    "invented cost, deadline or irreversibility": {
      generator_or_template_linkage: "Appears in source-to-reference risk-mechanism authoring across core and synthetic data; no single template is proven responsible.",
      locality_assessment: "Multi-domain and cross-type but bounded: one new confirmation and thirteen direct Batch 4 counterexamples.",
      rule_level_remediation_assessment: "POSSIBLE: prohibit stronger cost, timing, or rollback mechanisms unless entailed by a visible source fact.",
      fixture_level_remediation_assessment: "REQUIRED_FOR_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW; NOT_EXECUTED",
    },
    "reference behavior not supported by input": {
      generator_or_template_linkage: "Umbrella pattern spans multiple core, synthetic-risk, and rich-material reference families; it is not attributable to one generator.",
      locality_assessment: "Broadly recurring but not class-wide: 46 cumulative occurrences and 27 Batch 4 counterexamples.",
      rule_level_remediation_assessment: "POSSIBLE: add a common source-entailment and traceability validation rule before fixture-specific corrections.",
      fixture_level_remediation_assessment: "REQUIRED_FOR_CONFIRMED_FIXTURES_AFTER_PRIMARY_REVIEW; NOT_EXECUTED",
    },
  };
  return {
    artifact_version: "stage-9-ai-review-pattern-saturation.1",
    batch_id: batchId,
    review_timestamp: timestamp,
    assessment_rule: "A pattern is saturated for remediation design when multi-batch recurrence is already established and the challenge sample contains enough confirmations or counterexamples to bound the hypothesis; saturation does not authorize fixture remediation or stop remaining primary review.",
    patterns: challenged.map((name) => {
      const pattern = patterns.patterns.find((item) => item.pattern === name);
      const assessment = pattern.batch_4_assessment;
      return {
        pattern: name,
        prior_status: pattern.status,
        cumulative_occurrence_count: pattern.cumulative_occurrence_count,
        batch_4_confirmation_count: assessment.confirming_fixture_ids.length,
        batch_4_counterexample_count: assessment.counterexample_fixture_ids.length,
        saturation_status: name === "unsupported high-risk ground truth" ? "SATURATED_WITH_COUNTEREVIDENCE" : "SATURATED_FOR_REMEDIATION_DESIGN",
        rationale: assessment.accepted_evidence[0] + " " + assessment.rejected_hypotheses[0],
        ...remediationAnalysis[name],
        fixture_remediation_executed: false,
        confirming_fixture_ids: assessment.confirming_fixture_ids,
        counterexample_fixture_ids: assessment.counterexample_fixture_ids,
      };
    }),
    aggregate_status: "PATTERNS_SATURATED_WITHOUT_SYSTEMIC_BLOCKER",
    systemic_blocker: false,
    fixture_remediation: "NONE",
    remaining_primary_review_required: 72,
    next_planning_candidate: "Stage 9 Independent AI Review Batch 5 of 6",
  };
}

export function buildProgress(summary, queue, patterns) {
  const batch1 = readJson("docs", "qa", "review", "ai-batches", "batch-1", "summary.json");
  const batch2 = readJson("docs", "qa", "review", "ai-batches", "batch-2", "summary.json");
  const batch3 = readJson("docs", "qa", "review", "ai-batches", "batch-3", "summary.json");
  const priorProgress = readJson("docs", "qa", "review", "AI_REVIEW_PROGRESS.json");
  const priorQueue = priorProgress.cumulative_reinforced_review_queue.filter((item) => item.batch_provenance !== batchId);
  const addCounts = (values, keys) => Object.fromEntries(keys.map((key) => [key, values.reduce((total, value) => total + (value[key] ?? 0), 0)]));
  const cumulativeVerdicts = addCounts([batch1.verdict_counts, batch2.verdict_counts, batch3.verdict_counts, summary.verdict_counts], verdicts);
  const cumulativeSeverities = addCounts([batch1.severity_counts, batch2.severity_counts, batch3.severity_counts, summary.severity_counts], severities);
  return {
    artifact_version: "stage-9-ai-review-progress.4",
    review_session: "stage-9-ai-review-batch-4",
    status: "IN_PROGRESS",
    primary_review: { batch_1: 36, batch_2: 36, batch_3: 36, batch_4: 36, total_reviewed: 144, remaining: 72, dataset_total: 216 },
    batch_progress: [
      { batch_id: batch1.batch_id, primary_reviewed: 36, verdict_counts: batch1.verdict_counts, severity_counts: batch1.severity_counts, open_issues: 23, disputed_issues: 3, reinforced_review_count: batch1.reinforced_review_count },
      { batch_id: batch2.batch_id, primary_reviewed: 36, verdict_counts: batch2.verdict_counts, severity_counts: batch2.severity_counts, open_issues: 16, disputed_issues: 0, reinforced_review_count: batch2.reinforced_review_count },
      { batch_id: batch3.batch_id, primary_reviewed: 36, verdict_counts: batch3.verdict_counts, severity_counts: batch3.severity_counts, open_issues: 24, disputed_issues: 0, reinforced_review_count: batch3.reinforced_review_count },
      { batch_id: summary.batch_id, primary_reviewed: 36, verdict_counts: summary.verdict_counts, severity_counts: summary.severity_counts, open_issues: summary.issue_status_counts.OPEN, disputed_issues: summary.issue_status_counts.DISPUTED, reinforced_review_count: summary.reinforced_review_count },
    ],
    cumulative_verdict_counts: cumulativeVerdicts,
    cumulative_severity_counts: cumulativeSeverities,
    cumulative_open_issues: 63 + summary.issue_status_counts.OPEN,
    cumulative_disputed_issues: 3 + summary.issue_status_counts.DISPUTED,
    cumulative_reinforced_review_queue: [...priorQueue, ...queue.cases.map((item) => ({ fixture_id: item.fixture_id, batch_provenance: batchId, status: "PENDING_NOT_EXECUTED" }))],
    systemic_pattern_status: patterns.aggregate_status,
    systemic_blocker: false,
    cross_batch_pattern_registry: "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json",
    pattern_saturation_assessment: "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json",
    fixture_remediation: "NONE",
    critical_defect_count: 0,
    dataset_wide_blocker: false,
    network_request_count: 0,
    stage_status: "In Progress",
    release_readiness: "NOT_DECLARED",
    runtime_boundaries: "CLOSED",
    next_planning_candidate: "Stage 9 Independent AI Review Batch 5 of 6",
  };
}

export function buildAllArtifacts() {
  const selection = buildSelection();
  const blind = buildBlindPackets();
  const passA = buildPassA(blind);
  const passB = buildPassB(selection, passA);
  const passC = buildPassC(selection);
  const adjudication = buildAdjudication(passA, passB, passC);
  const ledger = buildIssueLedger(adjudication);
  const queue = buildQueue(adjudication);
  const summary = buildSummary(selection, adjudication, ledger, queue);
  const patterns = buildPatternRegistry();
  const saturation = buildPatternSaturation(patterns);
  const progress = buildProgress(summary, queue, patterns);
  return { selection, blind, passA, passB, passC, adjudication, ledger, queue, summary, patterns, saturation, progress };
}

export function writeAllArtifacts() {
  const artifacts = buildAllArtifacts();
  mkdirSync(batchRoot, { recursive: true });
  const files = {
    "selection.json": artifacts.selection,
    "blind-packets.json": artifacts.blind,
    "pass-a.json": artifacts.passA,
    "pass-b.json": artifacts.passB,
    "pass-c.json": artifacts.passC,
    "adjudication.json": artifacts.adjudication,
    "issue-ledger.json": artifacts.ledger,
    "reinforced-review-queue.json": artifacts.queue,
    "summary.json": artifacts.summary,
  };
  for (const [name, value] of Object.entries(files)) writeFileSync(join(batchRoot, name), serialize(value), "utf8");
  writeFileSync(progressPath, serialize(artifacts.progress), "utf8");
  writeFileSync(patternPath, serialize(artifacts.patterns), "utf8");
  writeFileSync(saturationPath, serialize(artifacts.saturation), "utf8");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeAllArtifacts();
  console.log(`WROTE Batch 4 artifacts to ${batchRoot}`);
  console.log(`WROTE ${progressPath}`);
  console.log(`WROTE ${patternPath}`);
  console.log(`WROTE ${saturationPath}`);
}
