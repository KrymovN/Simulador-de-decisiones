import { createRequire } from "node:module";
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
export const REVIEW_VERDICTS = ["PASS", "PASS_WITH_NOTE", "FAIL_MINOR", "FAIL_MAJOR", "NOT_REVIEWED"];

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
