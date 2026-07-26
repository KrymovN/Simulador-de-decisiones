import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const originalLoad = Module._load;

Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};

require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  module._compile(output.outputText, filename);
};

const { SYNTHETIC_RISK_EVALUATION_FIXTURES } = require(join(root, "lib", "ai-quality", "synthetic-risk-evaluation-fixtures.ts"));
const {
  CANONICAL_OFFLINE_EVALUATION_CASES,
  RICH_DECISION_MATERIAL_FIXTURES,
  RICH_DECISION_MATERIAL_BASELINE_COUNT,
} = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
Module._load = originalLoad;

export const REVIEW_MANIFEST_PATH = join(root, "docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
export const REVIEW_METHODOLOGY_PATH = join(root, "docs", "qa", "LEVIO_STAGE_9_HUMAN_REVIEW_METHODOLOGY.md");
export const POST_REMEDIATION_MANIFEST_PATH = join(root, "docs", "qa", "remediation", "stage-9", "LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json");
export const REVISION_LEDGER_PATH = join(root, "docs", "qa", "remediation", "stage-9", "AI_REMEDIATION_REVISION_LEDGER.json");
export const REVIEW_VERDICTS = ["PASS", "PASS_WITH_NOTE", "FAIL_MINOR", "FAIL_MAJOR", "NOT_REVIEWED"];
export const STAGE_9_REMEDIATION_BASELINE_COMMIT = "d6072c5dbfda63d22cab19c9c1f082e1d22d6c3a";
export const STAGE_9_SCHEMA_ORACLE_MAPPINGS = [
  { fixture_id: "S9-EVAL-006", claim_id: "B5-ISSUE-001", mutation_type: "unknown_output_field", json_path: "candidate.output.raw_response", invalid_value: "forbidden" },
  { fixture_id: "S9-EVAL-007", claim_id: "B6-ISSUE-027", mutation_type: "unknown_nested_field", json_path: "candidate.output.risks[0].advice", invalid_value: "none" },
  { fixture_id: "S9-EVAL-009", claim_id: "B6-ISSUE-029", mutation_type: "invalid_severity", json_path: "candidate.output.risks[0].severity_hint", invalid_value: "critical" },
  { fixture_id: "S9-EVAL-010", claim_id: "B6-ISSUE-030", mutation_type: "invalid_likelihood", json_path: "candidate.output.risks[0].likelihood_hint", invalid_value: "certain" },
  { fixture_id: "S9-EVAL-011", claim_id: "B2-ISSUE-001", mutation_type: "nonexistent_option_ref", json_path: "candidate.output.risks[0].affected_option_refs", invalid_value: ["option_9"] },
  { fixture_id: "S9-EVAL-012", claim_id: "B3-ISSUE-002", mutation_type: "nonexistent_fact_ref", json_path: "candidate.output.risks[0].basis_fact_refs", invalid_value: ["fact_9"] },
];

const SYNTHETIC_FIXTURE_PATH = "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts";
const LEGACY_MANIFEST_PATH = "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json";
const LEGACY_MANIFEST_SHA256 = "5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b";
const SYNTHETIC_FIXTURE_SHA256 = "150c99e1184c46af31c92f789c05b07559f2d45a7546072d6822751c58477f7b";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function evidenceFragmentFor(fixture, mapping) {
  if (mapping.fixture_id === "S9-EVAL-006") return fixture.candidate.output;
  if (["S9-EVAL-007", "S9-EVAL-009", "S9-EVAL-010", "S9-EVAL-011", "S9-EVAL-012"].includes(mapping.fixture_id)) {
    return fixture.candidate.output.risks[0];
  }
  throw new Error(`Unsupported schema-oracle mapping ${mapping.fixture_id}`);
}

function comparisonSetFor(fixture, mapping, sourceFixture) {
  if (mapping.fixture_id === "S9-EVAL-006") {
    return {
      candidate_container_keys: Object.keys(fixture.candidate.output).sort(),
      source_valid_container_keys: Object.keys(sourceFixture.candidate.output).sort(),
    };
  }
  if (mapping.fixture_id === "S9-EVAL-007") {
    return {
      candidate_risk_keys: Object.keys(fixture.candidate.output.risks[0]).sort(),
      source_valid_risk_keys: Object.keys(sourceFixture.candidate.output.risks[0]).sort(),
    };
  }
  if (mapping.fixture_id === "S9-EVAL-009") {
    return {
      candidate_values: [...new Set(fixture.candidate.output.risks.map((risk) => risk.severity_hint))].sort(),
      source_valid_values: [...new Set(sourceFixture.candidate.output.risks.map((risk) => risk.severity_hint))].sort(),
    };
  }
  if (mapping.fixture_id === "S9-EVAL-010") {
    return {
      candidate_values: [...new Set(fixture.candidate.output.risks.map((risk) => risk.likelihood_hint))].sort(),
      source_valid_values: [...new Set(sourceFixture.candidate.output.risks.map((risk) => risk.likelihood_hint))].sort(),
    };
  }
  if (mapping.fixture_id === "S9-EVAL-011") {
    return {
      candidate_references: fixture.candidate.output.risks[0].affected_option_refs,
      available_source_option_ids: fixture.input.options.map((_, index) => `option_${index + 1}`),
    };
  }
  if (mapping.fixture_id === "S9-EVAL-012") {
    return {
      candidate_references: fixture.candidate.output.risks[0].basis_fact_refs,
      available_source_fact_ids: fixture.input.known_facts.map((_, index) => `fact_${index + 1}`),
    };
  }
  throw new Error(`Unsupported schema-oracle mapping ${mapping.fixture_id}`);
}

function schemaOracleProjectionEntry(mapping, fixturesById, sourceFixture) {
  const fixture = fixturesById.get(mapping.fixture_id);
  if (!fixture) throw new Error(`Missing synthetic fixture ${mapping.fixture_id}`);
  const evidenceFragment = canonicalize(evidenceFragmentFor(fixture, mapping));
  return {
    fixture_id: mapping.fixture_id,
    claim_id: mapping.claim_id,
    mutation_type: mapping.mutation_type,
    json_path: mapping.json_path,
    invalid_value: mapping.invalid_value,
    comparison_set: comparisonSetFor(fixture, mapping, sourceFixture),
    evidence_fragment: evidenceFragment,
    evidence_fragment_sha256: sha256(JSON.stringify(evidenceFragment)),
    provenance: {
      source_fixture_path: SYNTHETIC_FIXTURE_PATH,
      source_fixture_id: mapping.fixture_id,
      source_fixture_sha256: SYNTHETIC_FIXTURE_SHA256,
      projection_rule: "Exact candidate payload fragment plus a source-derived comparison set; no schema-oracle inference is added.",
    },
  };
}

export function buildPostRemediationManifest() {
  const fixturesById = new Map(SYNTHETIC_RISK_EVALUATION_FIXTURES.map((fixture) => [fixture.case_id, fixture]));
  const sourceFixture = fixturesById.get("S9-EVAL-001");
  if (!sourceFixture) throw new Error("Missing valid source fixture S9-EVAL-001");
  const schemaOracleEvidence = STAGE_9_SCHEMA_ORACLE_MAPPINGS.map((mapping) =>
    schemaOracleProjectionEntry(mapping, fixturesById, sourceFixture));

  return {
    package_version: "stage-9-post-remediation-manifest.1",
    generated_at: null,
    baseline_commit: STAGE_9_REMEDIATION_BASELINE_COMMIT,
    substep_id: "S9-FIX-01",
    candidate_id: "Stage 9 Schema-Oracle Evidence Projection Revision",
    scope: "Versioned sibling projection only; legacy review evidence and runtime behavior remain unchanged.",
    source_integrity: {
      legacy_manifest_path: LEGACY_MANIFEST_PATH,
      legacy_manifest_sha256: LEGACY_MANIFEST_SHA256,
      legacy_manifest_entry_count: 216,
      synthetic_fixture_path: SYNTHETIC_FIXTURE_PATH,
      synthetic_fixture_sha256: SYNTHETIC_FIXTURE_SHA256,
    },
    summary: {
      schema_oracle_mapping_count: schemaOracleEvidence.length,
      network_request_count: 0,
      runtime_change_count: 0,
    },
    schema_oracle_evidence: schemaOracleEvidence,
  };
}

export function serializePostRemediationManifest() {
  return `${JSON.stringify(buildPostRemediationManifest(), null, 2)}\n`;
}

export function buildRemediationRevisionLedger() {
  const manifest = buildPostRemediationManifest();
  return {
    ledger_version: "stage-9-ai-remediation-revision-ledger.1",
    append_only: true,
    generated_at: null,
    baseline_commit: STAGE_9_REMEDIATION_BASELINE_COMMIT,
    substep_id: "S9-FIX-01",
    candidate_id: manifest.candidate_id,
    revision_count: manifest.schema_oracle_evidence.length,
    revisions: manifest.schema_oracle_evidence.map((entry, index) => ({
      revision_id: `S9-FIX-01-REV-${String(index + 1).padStart(3, "0")}`,
      operation: "ADD_VERSIONED_SCHEMA_ORACLE_EVIDENCE",
      fixture_id: entry.fixture_id,
      claim_id: entry.claim_id,
      json_path: entry.json_path,
      source_fixture_sha256: entry.provenance.source_fixture_sha256,
      legacy_manifest_sha256: manifest.source_integrity.legacy_manifest_sha256,
      evidence_fragment_sha256: entry.evidence_fragment_sha256,
      implementation_commit_message: "fix(stage-9): expose schema oracle evidence",
    })),
  };
}

export function serializeRemediationRevisionLedger() {
  return `${JSON.stringify(buildRemediationRevisionLedger(), null, 2)}\n`;
}

const pendingReview = () => ({
  verdict: "NOT_REVIEWED",
  severity: null,
  reviewer_notes: "",
  reviewer_identity: null,
  reviewed_at: null,
  translation_equivalence_verdict: "NOT_REVIEWED",
  semantic_duplication_verdict: "NOT_REVIEWED",
});

function candidateRisks(candidate) {
  const value = candidate?.kind === "candidate_output" ? candidate.output : candidate?.result?.candidateMaterial;
  return Array.isArray(value?.risks)
    ? value.risks.map((risk) => ({
      category: risk?.category ?? null,
      statement: risk?.statement ?? null,
      mechanism: risk?.mechanism ?? null,
      uncertainty_note: risk?.uncertainty_note ?? null,
    }))
    : [];
}

function riskEntry(fixture) {
  const language = typeof fixture.input?.locale === "string" ? fixture.input.locale.slice(0, 2) : "not_declared";
  return {
    fixture_id: fixture.case_id,
    dataset_type: "synthetic_risk",
    equivalence_cluster: null,
    language,
    domain: "adapter_contract_and_safety",
    completeness_state: "not_applicable",
    risk_markers: [fixture.coverage_id, ...fixture.expected.failure_categories],
    privacy_marker: ["auth_owner_session_leakage", "secret_token_leakage"].includes(fixture.coverage_id),
    controlled_failure_marker: fixture.expected.disposition === "reject",
    cost_profile: null,
    source_input: fixture.input,
    expected_candidate_risk_signals: candidateRisks(fixture.candidate),
    expected_decision_material: {
      disposition: fixture.expected.disposition,
      failure_categories: fixture.expected.failure_categories,
      candidate_kind: fixture.candidate.kind,
    },
    expected_critical_information_preservation: {
      coverage_id: fixture.coverage_id,
      provenance: fixture.provenance,
      preserve_input_facts_and_uncertainties: true,
      no_recommendation_authority: true,
    },
    human_review: pendingReview(),
  };
}

function richBaselineEntry(fixture) {
  const materialItems = Array.isArray(fixture.material?.items) ? fixture.material.items : [];
  return {
    fixture_id: fixture.fixture_id,
    dataset_type: "rich_decision_material_baseline",
    equivalence_cluster: null,
    language: "not_declared",
    domain: "decision_material_contract_and_preservation",
    completeness_state: "not_applicable",
    risk_markers: [fixture.coverage_id, ...fixture.expected.reasons],
    privacy_marker: fixture.coverage_id === "personal_data_leakage",
    controlled_failure_marker: fixture.expected.status === "controlled_failure",
    cost_profile: null,
    source_input: { material: fixture.material, acceptance_context: fixture.context },
    expected_candidate_risk_signals: materialItems
      .filter((item) => item?.item_type === "risk_signal")
      .map((item) => ({ statement: item.content, confidence: item.confidence, evidence: item.evidence })),
    expected_decision_material: {
      status: fixture.expected.status,
      dispositions: fixture.expected.dispositions,
      reasons: fixture.expected.reasons,
      accepted_count: fixture.expected.accepted_count,
      future_composition: fixture.future_composition,
    },
    expected_critical_information_preservation: {
      every_observed_item_requires_ledger_disposition: true,
      risk_only_would_lose_value: fixture.risk_only_would_lose_value,
      no_silent_loss: true,
    },
    human_review: pendingReview(),
  };
}

function canonicalEntry(datasetCase) {
  return {
    fixture_id: datasetCase.case_id,
    dataset_type: "canonical_core",
    equivalence_cluster: datasetCase.provenance.semantic_cluster_id,
    language: datasetCase.language,
    domain: datasetCase.domain,
    completeness_state: datasetCase.completeness_level,
    risk_markers: datasetCase.coverage_flags.high_risk_or_safety_sensitive
      ? ["high_risk_or_safety_sensitive", ...datasetCase.expected_risk_behavior]
      : datasetCase.expected_risk_behavior,
    privacy_marker: datasetCase.coverage_flags.privacy_boundary,
    controlled_failure_marker: datasetCase.coverage_flags.controlled_failure_or_malformed_output,
    cost_profile: datasetCase.cost_profile,
    source_input: {
      user_situation: datasetCase.user_situation,
      user_intent: datasetCase.user_intent,
      known_facts: datasetCase.known_facts,
      known_assumptions: datasetCase.known_assumptions,
      critical_gaps: datasetCase.critical_gaps,
      important_gaps: datasetCase.important_gaps,
    },
    expected_candidate_risk_signals: datasetCase.expected_risk_behavior,
    expected_decision_material: {
      clarification: datasetCase.expected_clarification_behavior,
      scenarios: datasetCase.expected_scenario_behavior,
      recommendation: datasetCase.expected_recommendation_behavior,
      safety: datasetCase.safety_expectations,
      privacy: datasetCase.privacy_expectations,
      failure: datasetCase.failure_expectations,
      allowed_v2_statuses: datasetCase.expected_v2_statuses,
    },
    expected_critical_information_preservation: {
      known_facts: datasetCase.known_facts,
      known_assumptions: datasetCase.known_assumptions,
      critical_gaps: datasetCase.critical_gaps,
      important_gaps: datasetCase.important_gaps,
      traceability: datasetCase.traceability_expectations,
      do_not_invent_facts: true,
      preserve_uncertainty: true,
    },
    human_review: pendingReview(),
  };
}

function countBy(entries, selector) {
  return Object.fromEntries([...entries.reduce((counts, entry) => {
    const key = selector(entry);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map())].sort(([a], [b]) => a.localeCompare(b)));
}

export function buildHumanReviewManifest() {
  const riskEntries = SYNTHETIC_RISK_EVALUATION_FIXTURES.map(riskEntry);
  const baselineRichEntries = RICH_DECISION_MATERIAL_FIXTURES
    .slice(0, RICH_DECISION_MATERIAL_BASELINE_COUNT)
    .map(richBaselineEntry);
  const canonicalEntries = CANONICAL_OFFLINE_EVALUATION_CASES.map(canonicalEntry);
  const entries = [...riskEntries, ...baselineRichEntries, ...canonicalEntries];
  const clusterCounts = countBy(canonicalEntries, (entry) => entry.equivalence_cluster);
  const completeClusters = Object.values(clusterCounts).filter((count) => count === 4).length;

  return {
    package_version: "stage-9-human-review-package.1",
    source_dataset_commit: "81435cbf4ce3ebc00c80aba33b8b753b2c62322c",
    generated_at: null,
    generation_note: "Deterministic repository artifact; no reviewer identity or review timestamp is generated.",
    threshold_interpretation: {
      verdict: "CASE_RECORD_THRESHOLD_SATISFIED",
      originating_commit: "5b0674e8",
      rule: "At least 160 versioned evaluation case records; multilingual equivalents are separate cases and must also form explicit equivalence clusters.",
      semantic_independence_requirement: false,
      current_model: "40 semantic scenarios × 4 first-wave languages = 160 canonical case records",
      caveat: "Semantic diversity and translation equivalence require human review and are not release-approved by this audit.",
    },
    review_policy: {
      allowed_verdicts: REVIEW_VERDICTS,
      completion_rule: "No NOT_REVIEWED in mandatory scope and no unresolved FAIL_MAJOR.",
      human_review_status: "Pending",
    },
    rc_pre_assessment: {
      verdict: "READY_FOR_HUMAN_REVIEW",
      quantitative_readiness: "pass",
      schema_readiness: "pass",
      coverage_readiness: "pass",
      deterministic_execution: "pass",
      network_isolation: "pass",
      silent_loss_protection: "pass",
      semantic_diversity_risk: "requires_human_review",
      multilingual_equivalence_risk: "requires_native_or_professionally_qualified_human_review",
      human_review_readiness: "package_ready_review_pending",
      runtime_readiness: "closed_not_assessed_for_release",
    },
    summary: {
      source_fixture_count: entries.length,
      manifest_entry_count: entries.length,
      dataset_types: countBy(entries, (entry) => entry.dataset_type),
      languages: countBy(entries, (entry) => entry.language),
      complete_equivalence_clusters: completeClusters,
      not_reviewed_count: entries.filter((entry) => entry.human_review.verdict === "NOT_REVIEWED").length,
      duplicate_id_count: entries.length - new Set(entries.map((entry) => entry.fixture_id)).size,
      missing_manifest_count: 0,
      metadata_mismatch_count: 0,
      network_request_count: 0,
    },
    entries,
  };
}

export function serializeHumanReviewManifest() {
  return `${JSON.stringify(buildHumanReviewManifest(), null, 2)}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(dirname(REVIEW_MANIFEST_PATH), { recursive: true });
  writeFileSync(REVIEW_MANIFEST_PATH, serializeHumanReviewManifest(), "utf8");
  console.log(`WROTE ${REVIEW_MANIFEST_PATH}`);
}
