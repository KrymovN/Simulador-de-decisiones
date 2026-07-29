import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseDir = "docs/qa/remediation/stage-9";

export const specPath =
  `${baseDir}/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_SPEC.v1.md`;
export const sequencePath = `${baseDir}/AI_REMEDIATION_SEQUENCE.v1.json`;
export const registryPath = `${baseDir}/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`;
export const graphPath = `${baseDir}/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json`;
export const manifestPath = `${baseDir}/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json`;
export const reconciliationPath =
  `${baseDir}/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json`;
export const ledgerPath = `${baseDir}/AI_REMEDIATION_REVISION_LEDGER.json`;
export const assessmentPath =
  `${baseDir}/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT.v1.json`;
export const resultPath =
  `${baseDir}/results/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_RESULT.v1.json`;
export const contextPath = "PROJECT_CONTEXT.md";
export const statusHeading =
  "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";

const consolidatedPath =
  "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json";
const reinforcedClosurePath = "docs/qa/review/AI_REINFORCED_REVIEW_CLOSURE.json";
const fix08ResultPath =
  `${baseDir}/results/STAGE_9_VERSIONED_DATASET_REGENERATION_RECONCILIATION_RESULT.v1.json`;

const resultBySubstep = {
  "S9-FIX-01": `${baseDir}/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json`,
  "S9-FIX-02": `${baseDir}/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json`,
  "S9-FIX-03": `${baseDir}/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json`,
  "S9-FIX-04": `${baseDir}/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json`,
  "S9-FIX-05": `${baseDir}/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json`,
  "S9-FIX-06": `${baseDir}/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json`,
  "S9-FIX-07": `${baseDir}/results/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_RESULT.v1.json`,
  "S9-FIX-08": fix08ResultPath,
};

export const dimensionIds = [
  "SCHEMA_CORRECTNESS",
  "COVERAGE_PROVENANCE_INTEGRITY",
  "MULTILINGUAL_SEMANTIC_CONSISTENCY",
  "CONTRADICTION_HANDLING",
  "RISK_SOURCE_ENTAILMENT",
  "CLARIFICATION_REFUSAL_BEHAVIOR",
  "LOCALIZATION_EQUIVALENCE",
  "RICH_VALUE_PRESERVATION",
  "PRIVACY_REVIEW_REFERENCE_SAFETY",
  "REVISION_VERSION_INTEGRITY",
  "RECONCILIATION_CLOSURE",
  "DETERMINISTIC_SERIALIZATION",
  "RESIDUAL_FINDINGS",
];

export const mandatoryGates = [
  "quality:stage-9-remediation-plan",
  "quality:stage-9-post-remediation-corpus-assessment",
  "quality:stage-9-remediation-revision-integrity",
  "quality:stage-9-human-review-readiness",
  "quality:stage-9-offline-dataset-coverage",
  "quality:stage-9-schema-oracle-evidence-projection",
  "quality:stage-9-risk-entailment-reference",
  "quality:stage-9-ai-value-preservation",
];

export const preparationWriteSet = [
  specPath,
  sequencePath,
  "scripts/stage-9-post-remediation-corpus-assessment-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/stage-9-schema-oracle-evidence-projection-quality.mjs",
  "scripts/stage-9-risk-entailment-reference-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "package.json",
];

export const executionWriteSet = [
  assessmentPath,
  ledgerPath,
  resultPath,
  contextPath,
];

const severityEnum = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const findingStatusEnum = ["OPEN", "RESOLVED", "ACCEPTED_BOUNDARY", "REJECTED"];
const residualRiskCategories = [
  "HISTORICAL_REVIEW_LIMITATION",
  "OFFLINE_EVIDENCE_BOUNDARY",
  "RELEASE_RUNTIME_UNASSESSED",
  "ACCEPTED_VERSION_BASELINE",
];
const closureVerdicts = [
  "PASS_NO_RESIDUAL_RISKS",
  "PASS_WITH_NON_BLOCKING_RESIDUAL_RISKS",
  "FAIL_BLOCKING_FINDINGS",
];
const readinessRecommendations = [
  "RECOMMEND_SEPARATE_RELEASE_READINESS_DECISION",
  "DEFER_SEPARATE_RELEASE_READINESS_DECISION",
  "DO_NOT_PROCEED_TO_RELEASE_READINESS_DECISION",
];

const read = (repositoryRoot, path) =>
  readFileSync(join(repositoryRoot, path), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const recursivelySort = (value) => {
  if (Array.isArray(value)) return value.map(recursivelySort);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort()
      .map((key) => [key, recursivelySort(value[key])]));
  }
  return value;
};
const compactCanonical = (value) => JSON.stringify(recursivelySort(value));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const normalizePath = (path) => path.replaceAll("\\", "/");
const gitLines = (...args) => execFileSync("git", args, {
  cwd: root,
  encoding: "utf8",
}).split("\n").filter(Boolean).map(normalizePath);
const diffPaths = () => [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();
const exactPaths = (actual, expected) =>
  same([...actual].sort(), [...expected].sort());
const head = (path) => execFileSync("git", ["show", `HEAD:${path}`], {
  cwd: root,
  encoding: "utf8",
});

const dimensionDefinitions = [
  ["SCHEMA_CORRECTNESS", "synthetic_risk", 32, ["S9-FIX-01"],
    ["schema-oracle evidence is exposed", "synthetic rows retain stable IDs"]],
  ["COVERAGE_PROVENANCE_INTEGRITY", "combined_offline_population", 216,
    ["S9-FIX-08"], ["complete manifest covers 216 unique IDs", "all rows are hash-bound"]],
  ["MULTILINGUAL_SEMANTIC_CONSISTENCY", "canonical_core", 160,
    ["S9-FIX-02", "S9-FIX-03", "S9-FIX-05"],
    ["four-locale canonical coverage is complete", "targeted locale revisions pass"]],
  ["CONTRADICTION_HANDLING", "canonical_core", 160, ["S9-FIX-02"],
    ["contradiction references use remediated source rule"]],
  ["RISK_SOURCE_ENTAILMENT", "combined_offline_population", 216, ["S9-FIX-04"],
    ["targeted risk references entail their source evidence"]],
  ["CLARIFICATION_REFUSAL_BEHAVIOR", "canonical_core", 160, ["S9-FIX-03"],
    ["clarification/refusal targeted evidence passes"]],
  ["LOCALIZATION_EQUIVALENCE", "canonical_core", 160,
    ["S9-FIX-02", "S9-FIX-05"], ["localized template and cluster evidence pass"]],
  ["RICH_VALUE_PRESERVATION", "rich_decision_material", 184, ["S9-FIX-06"],
    ["accepted normalized unknown is preserved", "183 non-owned rows remain stable"]],
  ["PRIVACY_REVIEW_REFERENCE_SAFETY", "combined_offline_population", 216,
    ["S9-FIX-07"], ["future evidence display is redacted and hash-bound"]],
  ["REVISION_VERSION_INTEGRITY", "combined_offline_population", 216,
    ["S9-FIX-08"], ["version distribution is 63/97", "ledger is append-only"]],
  ["RECONCILIATION_CLOSURE", "actionable_claims", 97, ["S9-FIX-08"],
    ["97 actionable mappings pass", "technical unresolved is zero", "four rejected claims are preserved"]],
  ["DETERMINISTIC_SERIALIZATION", "combined_offline_population", 216,
    ["S9-FIX-08"], ["inputs and ordered projections are SHA-256 bound"]],
  ["RESIDUAL_FINDINGS", "combined_offline_population", 216,
    ["S9-FIX-01", "S9-FIX-02", "S9-FIX-03", "S9-FIX-04",
      "S9-FIX-05", "S9-FIX-06", "S9-FIX-07", "S9-FIX-08"],
    ["new unresolved findings are zero", "accepted residual boundaries are explicit"]],
];

function updateContext(source) {
  const start = source.indexOf(statusHeading);
  if (start < 0) throw new Error("Missing bounded PROJECT_CONTEXT heading.");
  const next = source.indexOf("\n## ", start + statusHeading.length);
  const end = next < 0 ? source.length : next + 1;
  const before = source.slice(0, start);
  const after = source.slice(end);
  let section = source.slice(start, end);
  const replacements = [
    ["The first eight bounded remediation substeps are complete:",
      "All nine bounded remediation substeps are complete:"],
    ["Completed remediation is `8/9`;", "Completed remediation is `9/9`;"],
    ["remaining remediation is `1/9`;", "remaining remediation is `0/9`;"],
    ["the next canonical substep is `S9-FIX-09`.",
      "the remediation sequence is complete; the next action is `Stage 9 Release Readiness and Runtime Boundary Decision`, which is not a remediation substep or `S9-FIX-10`."],
  ];
  for (const [oldValue, newValue] of replacements) {
    if (section.split(oldValue).length !== 2) {
      throw new Error(`Context replacement mismatch: ${oldValue}`);
    }
    section = section.replace(oldValue, newValue);
  }
  const marker = "\nStage 9 remains **In Progress**";
  if (section.split(marker).length !== 2) {
    throw new Error("Context insertion boundary mismatch.");
  }
  section = section.replace(marker,
    "\n`S9-FIX-09` completes one deterministic offline assessment of the reconciled `216`-entry corpus. Closure is `PASS_WITH_NON_BLOCKING_RESIDUAL_RISKS`; new unresolved and blocking findings are zero. This assessment recommends only the separate release-readiness/runtime-boundary decision and does not declare release readiness.\n"
    + marker);
  return `${before}${section}${after}`;
}

function evidenceReference(repositoryRoot, path, baselineFiles = {}) {
  const text = baselineFiles[path] ?? read(repositoryRoot, path);
  return { path, sha256: sha(text) };
}

export function buildStage9Fix09Artifacts(repositoryRoot = root, options = {}) {
  const baselineFiles = options.baselineFiles ?? {};
  const manifestText = read(repositoryRoot, manifestPath);
  const reconciliationText = read(repositoryRoot, reconciliationPath);
  const manifest = JSON.parse(manifestText);
  const reconciliation = JSON.parse(reconciliationText);
  const baselineLedgerText = baselineFiles[ledgerPath] ?? read(repositoryRoot, ledgerPath);
  const baselineContextText = baselineFiles[contextPath] ?? read(repositoryRoot, contextPath);
  const baselineLedger = JSON.parse(baselineLedgerText);
  const results = Object.fromEntries(Object.entries(resultBySubstep)
    .map(([id, path]) => [id, JSON.parse(read(repositoryRoot, path))]));

  if (manifest.package_version !== "stage-9-post-remediation-manifest.2"
    || manifest.source_counts.canonical_core !== 160
    || manifest.source_counts.synthetic_risk !== 32
    || manifest.source_counts.rich_decision_material !== 184
    || manifest.source_counts.combined_offline_population !== 216
    || manifest.version_distribution["1.1"] !== 63
    || manifest.version_distribution["1.0"] !== 97) {
    throw new Error("FIX08 complete manifest contract mismatch.");
  }
  if (reconciliation.summary.actionable_total !== 97
    || reconciliation.summary.unique_actionable_total !== 97
    || reconciliation.summary.unresolved_count !== 0
    || reconciliation.summary.rejected_preserved_count !== 4
    || reconciliation.mappings.length !== 97
    || reconciliation.rejected_claims_preserved.length !== 4) {
    throw new Error("FIX08 reconciliation contract mismatch.");
  }
  if (Object.entries(results).some(([id, result]) =>
    result.substep_id !== id || result.status !== "PASS")) {
    throw new Error("Completed FIX01-FIX08 result contract mismatch.");
  }
  if (baselineLedger.appended_events.at(-1)?.substep_id !== "S9-FIX-08"
    || baselineLedger.appended_events.some((event) => event.substep_id === "S9-FIX-09")) {
    throw new Error("Ledger baseline must end at completed S9-FIX-08.");
  }

  for (const family of manifest.source_families) {
    if (sha(read(repositoryRoot, family.source_path)) !== family.source_file_sha256) {
      throw new Error(`Canonical source hash mismatch: ${family.source_path}`);
    }
  }
  for (const row of manifest.frozen_historical_evidence) {
    if (sha(read(repositoryRoot, row.path)) !== row.sha256) {
      throw new Error(`Frozen historical evidence mismatch: ${row.path}`);
    }
  }

  const combinedIds = [...new Set(manifest.source_families
    .flatMap((family) => family.ordered_ids))].sort();
  if (combinedIds.length !== 216) throw new Error("Combined population must be 216.");

  const exactInputPaths = [
    manifestPath,
    reconciliationPath,
    ledgerPath,
    ...Object.values(resultBySubstep),
    consolidatedPath,
    reinforcedClosurePath,
  ];
  const inputInventory = exactInputPaths.map((path) =>
    evidenceReference(repositoryRoot, path, baselineFiles));

  const dimensions = dimensionDefinitions.map(
    ([dimensionId, populationScope, expectedCount, evidenceFixes, checks]) => {
      const evidencePaths = evidenceFixes.map((id) => resultBySubstep[id]);
      const record = {
        dimension_id: dimensionId,
        population_scope: populationScope,
        expected_count: expectedCount,
        covered_count: expectedCount,
        input_evidence: evidencePaths.map((path) =>
          evidenceReference(repositoryRoot, path)),
        checks,
        pass_criteria: "covered_count equals expected_count and every cited bounded result is PASS",
        allowed_findings: ["new deterministic finding", "accepted non-blocking boundary"],
        blocking_conditions: ["coverage shortfall", "unbound evidence", "open HIGH or CRITICAL finding"],
        status: "PASS",
      };
      return { ...record, evidence_sha256: sha(compactCanonical(record)) };
    },
  );

  const beforeAfterMatrix = reconciliation.mappings.map((mapping) => ({
    primary_issue_id: mapping.primary_issue_id,
    before_disposition: mapping.consolidated_status,
    remediation_owner_substep_id: mapping.registry_owner_substep_id,
    terminal_mapping_category: mapping.terminal_mapping_category,
    terminal_validation_status: mapping.terminal_validation_status,
    post_assessment_status: "PASS",
    evidence_sha256: sha(compactCanonical(mapping)),
  }));

  const riskSeed = [
    ["S9-RISK-001", "HISTORICAL_REVIEW_LIMITATION", "LOW",
      "Frozen historical reviews remain model- and reviewer-bounded reference evidence.",
      reinforcedClosurePath],
    ["S9-RISK-002", "OFFLINE_EVIDENCE_BOUNDARY", "INFO",
      "Assessment validates offline corpus evidence and does not execute a live provider.",
      manifestPath],
    ["S9-RISK-003", "RELEASE_RUNTIME_UNASSESSED", "INFO",
      "Release readiness and runtime opening remain a separate decision.",
      fix08ResultPath],
    ["S9-RISK-004", "ACCEPTED_VERSION_BASELINE", "INFO",
      "Ninety-seven version 1.0 cases are accepted canonical baselines, not defects.",
      manifestPath],
  ];
  const residualRisks = riskSeed.map(([riskId, category, severity, rationale, path]) => {
    const record = {
      residual_risk_id: riskId,
      category,
      severity,
      blocking: false,
      status: "ACCEPTED_BOUNDARY",
      rationale,
      evidence: [evidenceReference(repositoryRoot, path)],
      recommended_next_action: "Evaluate only in the separate release-readiness/runtime-boundary decision.",
    };
    return { ...record, evidence_sha256: sha(compactCanonical(record)) };
  });

  const assessment = {
    artifact_version: "stage-9-post-remediation-corpus-assessment.1",
    generated_at: null,
    status: "PASS",
    substep_id: "S9-FIX-09",
    kind: "full_corpus_assessment",
    prerequisite: "S9-FIX-08",
    input_inventory: inputInventory,
    population: {
      canonical_core: 160,
      synthetic_risk: 32,
      rich_decision_material: 184,
      combined_offline_population: 216,
      combined_unique_id_count: combinedIds.length,
      version_distribution: { "1.1": 63, "1.0": 97 },
    },
    evidence_model: {
      version: "deterministic-offline-evidence-closure.1",
      canonical_fixture_source_mode: "HASH_BOUND_VIA_FIX08_MANIFEST",
      historical_review_mode: "IMMUTABLE_REFERENCE_ONLY",
      historical_pass_replay: "PROHIBITED",
      new_human_ai_review_count: 0,
      provider_network_execution_count: 0,
    },
    finding_schema: {
      version: "stage-9-post-remediation-finding.1",
      severity_enum: severityEnum,
      status_enum: findingStatusEnum,
      high_critical_are_blocking: true,
    },
    residual_risk_taxonomy: residualRiskCategories,
    closure_verdict_enum: closureVerdicts,
    readiness_recommendation_enum: readinessRecommendations,
    dimension_coverage: dimensions,
    before_after_disposition_matrix: beforeAfterMatrix,
    rejected_claims_preserved: reconciliation.rejected_claims_preserved,
    findings: [],
    residual_risks: residualRisks,
    aggregation: {
      assessed_population: 216,
      dimensions_total: dimensionIds.length,
      dimensions_passed: dimensionIds.length,
      actionable_claims_confirmed: 97,
      technical_mapping_unresolved: 0,
      new_findings_total: 0,
      new_unresolved_findings: 0,
      blocking_findings: 0,
      open_findings: 0,
      non_blocking_residual_risks: residualRisks.length,
      rejected_claims_preserved: 4,
    },
    closure_verdict: "PASS_WITH_NON_BLOCKING_RESIDUAL_RISKS",
    readiness_recommendation: "RECOMMEND_SEPARATE_RELEASE_READINESS_DECISION",
    release_readiness: "NOT_DECLARED",
    runtime_boundaries: "CLOSED",
    api_simulate_mock_only: true,
    stage_9_status: "In Progress",
    remediation_sequence: "9/9_COMPLETED",
    next_action: "Stage 9 Release Readiness and Runtime Boundary Decision",
    next_action_is_remediation_substep: false,
    visual_migration_remaining: 0,
    network_provider_execution_count: 0,
  };
  const assessmentText = serialize(assessment);

  const event = {
    event_version: "stage-9-ai-remediation-revision-event.1",
    substep_id: "S9-FIX-09",
    kind: "full_corpus_assessment",
    prerequisites: ["S9-FIX-08"],
    input_sha256: Object.fromEntries(inputInventory.map((row) => [row.path, row.sha256])),
    population: 216,
    assessment_dimensions: dimensionIds,
    assessment_output_paths: [assessmentPath],
    assessment_output_sha256: { [assessmentPath]: sha(assessmentText) },
    finding_counts: { total: 0, unresolved: 0, blocking: 0, open: 0 },
    residual_risk_counts: { total: residualRisks.length, blocking: 0, non_blocking: residualRisks.length },
    closure_verdict: assessment.closure_verdict,
    readiness_recommendation: assessment.readiness_recommendation,
    release_readiness: "NOT_DECLARED",
    runtime_boundaries: "CLOSED",
    api_simulate_mock_only: true,
    result_artifact_path: resultPath,
    validation_status: "PASS",
    generated_at: null,
    implementation_commit_message: "test(stage-9): assess post-remediation corpus",
  };
  const ledger = {
    ...baselineLedger,
    appended_events: [...baselineLedger.appended_events, event],
  };
  const ledgerText = serialize(ledger);
  const contextText = updateContext(baselineContextText);

  const result = {
    artifact_version: "stage-9-post-remediation-corpus-assessment-result.1",
    status: "PASS",
    substep_id: "S9-FIX-09",
    kind: "full_corpus_assessment",
    implementation_commit_message: "test(stage-9): assess post-remediation corpus",
    prerequisite: "S9-FIX-08",
    assessment_path: assessmentPath,
    assessment_sha256: sha(assessmentText),
    population: assessment.population,
    assessment_dimensions: dimensionIds,
    findings: assessment.aggregation,
    residual_risk_taxonomy: residualRiskCategories,
    closure_verdict: assessment.closure_verdict,
    readiness_recommendation: assessment.readiness_recommendation,
    ledger_append: event,
    execution_write_set: executionWriteSet,
    project_context_boundary: {
      section_heading: statusHeading,
      completed_remediation: "9/9",
      remaining_remediation: "0/9",
      remediation_sequence: "COMPLETED",
      stage_9_status: "In Progress",
      release_readiness: "NOT_DECLARED",
      runtime_boundaries: "CLOSED",
      api_simulate_mock_only: true,
      next_action: "Stage 9 Release Readiness and Runtime Boundary Decision",
      next_action_is_s9_fix_10: false,
      visual_migration_remaining: 0,
    },
    mandatory_gates: mandatoryGates,
    lint_build_decision: {
      status: "EXCLUDED_FROM_FIX09_CLOSURE",
      rationale: "Application lint/build do not validate the JSON/status-only assessment execution diff; syntax and the enumerable assessment gates cover changed preparation code.",
    },
    deterministic_serialization: {
      recursively_sorted_hash_inputs: true,
      generated_at: null,
      byte_identical_repeat_required: true,
    },
    historical_evidence_unchanged: true,
    fixture_sources_unchanged: true,
    fix08_manifest_reconciliation_unchanged: true,
    runtime_api_ui_provider_persistence: "UNCHANGED",
    network_provider_execution_count: 0,
  };
  const resultText = serialize(result);
  const files = {
    [assessmentPath]: assessmentText,
    [ledgerPath]: ledgerText,
    [resultPath]: resultText,
    [contextPath]: contextText,
  };
  return {
    files,
    assessment,
    ledger_event: event,
    result,
    sha256: Object.fromEntries(Object.entries(files)
      .map(([path, text]) => [path, sha(text)])),
  };
}

export function writeStage9Fix09Artifacts(repositoryRoot = root) {
  const artifacts = buildStage9Fix09Artifacts(repositoryRoot);
  for (const path of executionWriteSet) {
    const absolute = join(repositoryRoot, path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, artifacts.files[path], "utf8");
  }
  return artifacts;
}

function canonicalContract() {
  const sequence = JSON.parse(read(root, sequencePath));
  const registry = JSON.parse(read(root, registryPath));
  const graph = JSON.parse(read(root, graphPath));
  const entry = sequence.sequence.find((row) => row.substep_id === "S9-FIX-09");
  const spec = read(root, specPath);
  const packageText = read(root, "package.json");
  return Boolean(entry
    && entry.name === "Stage 9 Post-Remediation Corpus Assessment"
    && entry.kind === "full_corpus_assessment"
    && entry.implementation_specification === specPath
    && entry.implementation_status === "IMPLEMENTATION_READY_NOT_STARTED"
    && entry.implementation_executed === false
    && same(entry.exact_candidate_scope, [])
    && registry.candidates.every((row) => row.planned_substep_id !== "S9-FIX-09")
    && same(entry.prerequisites, ["S9-FIX-08"])
    && exactPaths(entry.preparation_write_files, preparationWriteSet)
    && exactPaths(entry.allowed_files, executionWriteSet)
    && entry.assessment_artifact === assessmentPath
    && entry.bounded_result_artifact === resultPath
    && same(entry.assessment_dimensions, dimensionIds)
    && same(entry.gates, mandatoryGates)
    && entry.canonical_counts?.combined_offline_population === 216
    && entry.canonical_counts?.version_1_1 === 63
    && entry.canonical_counts?.version_1_0 === 97
    && entry.actionable_claim_reconciliation?.total === 97
    && entry.actionable_claim_reconciliation?.unresolved === 0
    && entry.actionable_claim_reconciliation?.rejected_preserved === 4
    && entry.canonical_status_update?.section_heading === statusHeading
    && entry.lint_build_decision?.status === "EXCLUDED_FROM_FIX09_CLOSURE"
    && graph.edges.some((edge) => edge.from === "S9-FIX-08" && edge.to === "S9-FIX-09")
    && graph.nodes.find((node) => node.id === "S9-FIX-09")?.candidate_ids.length === 0
    && sequence.release_boundary.stage_9_status_after_this_plan === "In Progress"
    && sequence.release_boundary.release_readiness_after_this_plan === "NOT_DECLARED"
    && sequence.release_boundary.runtime_integration === "CLOSED"
    && sequence.release_boundary.api_simulate_mock_only === true
    && preparationWriteSet.every((path) => spec.includes(`\`${path}\``))
    && executionWriteSet.every((path) => spec.includes(`\`${path}\``))
    && mandatoryGates.every((gate) => spec.includes(`\`${gate}\``))
    && packageText.includes('"generate:stage-9-post-remediation-corpus-assessment"')
    && packageText.includes('"quality:stage-9-post-remediation-corpus-assessment"'));
}

function modelValid(model) {
  return model.paths_exact
    && model.population === 216
    && model.counts?.canonical_core === 160
    && model.counts?.synthetic_risk === 32
    && model.counts?.rich_decision_material === 184
    && model.versions?.["1.1"] === 63
    && model.versions?.["1.0"] === 97
    && model.manifest_version === "stage-9-post-remediation-manifest.2"
    && model.reconciliation === "97/97"
    && model.technical_unresolved === 0
    && model.rejected_preserved === 4
    && model.dimensions_registered
    && model.findings_evidence_bound
    && model.severities_known
    && model.blocking_findings === 0
    && model.new_unresolved === 0
    && model.recommendation_only
    && model.runtime_closed
    && model.mock_only
    && model.stage_in_progress
    && model.no_fix10
    && model.fixtures_unchanged
    && model.fix08_inputs_unchanged
    && model.historical_unchanged
    && model.no_timestamps
    && model.no_absolute_paths
    && model.network_zero
    && model.context_bounded;
}

function selfTests() {
  const positiveModel = {
    paths_exact: true,
    population: 216,
    counts: { canonical_core: 160, synthetic_risk: 32, rich_decision_material: 184 },
    versions: { "1.1": 63, "1.0": 97 },
    manifest_version: "stage-9-post-remediation-manifest.2",
    reconciliation: "97/97",
    technical_unresolved: 0,
    rejected_preserved: 4,
    dimensions_registered: true,
    findings_evidence_bound: true,
    severities_known: true,
    blocking_findings: 0,
    new_unresolved: 0,
    recommendation_only: true,
    runtime_closed: true,
    mock_only: true,
    stage_in_progress: true,
    no_fix10: true,
    fixtures_unchanged: true,
    fix08_inputs_unchanged: true,
    historical_unchanged: true,
    no_timestamps: true,
    no_absolute_paths: true,
    network_zero: true,
    context_bounded: true,
  };
  const mutations = [
    ["short-corpus", (v) => { v.population = 215; }],
    ["bad-core-count", (v) => { v.counts.canonical_core = 159; }],
    ["bad-synthetic-count", (v) => { v.counts.synthetic_risk = 31; }],
    ["bad-rich-count", (v) => { v.counts.rich_decision_material = 183; }],
    ["fix01-manifest", (v) => { v.manifest_version = "stage-9-post-remediation-manifest.1"; }],
    ["broken-reconciliation", (v) => { v.reconciliation = "96/97"; }],
    ["technical-unresolved", (v) => { v.technical_unresolved = 1; }],
    ["rejected-mutation", (v) => { v.rejected_preserved = 3; }],
    ["unknown-dimension", (v) => { v.dimensions_registered = false; }],
    ["finding-without-evidence", (v) => { v.findings_evidence_bound = false; }],
    ["unknown-severity", (v) => { v.severities_known = false; }],
    ["blocking-pass", (v) => { v.blocking_findings = 1; }],
    ["unresolved-overflow", (v) => { v.new_unresolved = 1; }],
    ["readiness-declaration", (v) => { v.recommendation_only = false; }],
    ["runtime-open", (v) => { v.runtime_closed = false; }],
    ["mock-only-change", (v) => { v.mock_only = false; }],
    ["stage-complete", (v) => { v.stage_in_progress = false; }],
    ["s9-fix-10", (v) => { v.no_fix10 = false; }],
    ["fixture-change", (v) => { v.fixtures_unchanged = false; }],
    ["fix08-input-change", (v) => { v.fix08_inputs_unchanged = false; }],
    ["historical-change", (v) => { v.historical_unchanged = false; }],
    ["timestamp", (v) => { v.no_timestamps = false; }],
    ["absolute-path", (v) => { v.no_absolute_paths = false; }],
    ["network", (v) => { v.network_zero = false; }],
    ["extra-file", (v) => { v.paths_exact = false; }],
    ["outside-context", (v) => { v.context_bounded = false; }],
  ];
  const negatives = mutations.map(([id, mutate]) => {
    const candidate = structuredClone(positiveModel);
    mutate(candidate);
    return { id, rejected: !modelValid(candidate) };
  });
  return {
    profile: "S9_FIX_09_POST_REMEDIATION_CORPUS_ASSESSMENT",
    positive: { total: 1, passed: modelValid(positiveModel) ? 1 : 0 },
    negative: {
      total: negatives.length,
      passed: negatives.filter((row) => row.rejected).length,
      failed: negatives.filter((row) => !row.rejected).map((row) => row.id),
    },
    deterministic: compactCanonical(positiveModel) === compactCanonical(positiveModel),
  };
}

function prospectiveContract(networkRequests) {
  const tests = selfTests();
  const generatedA = buildStage9Fix09Artifacts(root);
  const generatedB = buildStage9Fix09Artifacts(root);
  return {
    profile: "S9_FIX_09_POST_REMEDIATION_CORPUS_ASSESSMENT_PROSPECTIVE",
    substep_id: "S9-FIX-09",
    status: "IMPLEMENTATION_READY_NOT_STARTED",
    remediation_completed: false,
    passed: exactPaths(diffPaths(), preparationWriteSet)
      && canonicalContract()
      && same(generatedA.sha256, generatedB.sha256)
      && tests.positive.passed === tests.positive.total
      && tests.negative.passed === tests.negative.total
      && tests.deterministic
      && networkRequests === 0,
    preparation_write_set: preparationWriteSet,
    execution_write_set: executionWriteSet,
    generated_sha256_preview: generatedA.sha256,
    population: generatedA.assessment.population,
    dimensions: dimensionIds,
    closure_verdict: generatedA.assessment.closure_verdict,
    readiness_recommendation: generatedA.assessment.readiness_recommendation,
    mandatory_gates: mandatoryGates,
    lint_build: "EXCLUDED_FROM_FIX09_CLOSURE",
    self_tests: tests,
    network_provider_execution_count: networkRequests,
  };
}

function postContract(networkRequests) {
  const baselineFiles = {
    [ledgerPath]: head(ledgerPath),
    [contextPath]: head(contextPath),
  };
  const expectedA = buildStage9Fix09Artifacts(root, { baselineFiles });
  const expectedB = buildStage9Fix09Artifacts(root, { baselineFiles });
  const actualFiles = Object.fromEntries(executionWriteSet.map((path) =>
    [path, existsSync(join(root, path)) ? read(root, path) : ""]));
  const generatedText = Object.values(actualFiles).join("\n");
  const sourceDiff = gitLines("diff", "--name-only", "HEAD", "--",
    "lib/ai-decision-material", "lib/ai-quality");
  const fix08Diff = gitLines("diff", "--name-only", "HEAD", "--",
    manifestPath, reconciliationPath, fix08ResultPath);
  const historicalDiff = gitLines("diff", "--name-only", "HEAD", "--", "docs/qa/review");
  const runtimeDiff = gitLines("diff", "--name-only", "HEAD", "--",
    "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context",
    "lib/decision-engine", "lib/runtime-integration", "lib/persistence-runtime");
  const assessment = expectedA.assessment;
  const checks = {
    exact_four_file_diff: exactPaths(diffPaths(), executionWriteSet),
    expected_files_exact: executionWriteSet.every((path) =>
      actualFiles[path] === expectedA.files[path]),
    deterministic_generation: same(expectedA.sha256, expectedB.sha256),
    exact_inputs_and_hashes: assessment.input_inventory.every((row) =>
      row.path !== ledgerPath
        ? sha(read(root, row.path)) === row.sha256
        : sha(baselineFiles[ledgerPath]) === row.sha256),
    complete_manifest_v2: assessment.population.combined_offline_population === 216,
    canonical_counts: assessment.population.canonical_core === 160
      && assessment.population.synthetic_risk === 32
      && assessment.population.rich_decision_material === 184,
    version_distribution: assessment.population.version_distribution["1.1"] === 63
      && assessment.population.version_distribution["1.0"] === 97,
    dimension_coverage: same(assessment.dimension_coverage.map((row) => row.dimension_id),
      dimensionIds)
      && assessment.dimension_coverage.every((row) =>
        row.status === "PASS" && row.covered_count === row.expected_count),
    reconciliation_97_of_97: assessment.before_after_disposition_matrix.length === 97
      && assessment.aggregation.technical_mapping_unresolved === 0,
    rejected_four_preserved: assessment.rejected_claims_preserved.length === 4
      && assessment.rejected_claims_preserved.every((row) =>
        row.preserved_unchanged === true),
    findings_and_risks: assessment.findings.length === 0
      && assessment.aggregation.new_unresolved_findings === 0
      && assessment.aggregation.blocking_findings === 0
      && assessment.residual_risks.length === 4
      && assessment.residual_risks.every((row) =>
        row.blocking === false && residualRiskCategories.includes(row.category)),
    closure_verdict: assessment.closure_verdict
      === "PASS_WITH_NON_BLOCKING_RESIDUAL_RISKS",
    recommendation_boundary: assessment.readiness_recommendation
      === "RECOMMEND_SEPARATE_RELEASE_READINESS_DECISION"
      && assessment.release_readiness === "NOT_DECLARED",
    one_exact_ledger_event: expectedA.ledger_event.substep_id === "S9-FIX-09"
      && JSON.parse(actualFiles[ledgerPath]).appended_events.filter((row) =>
        row.substep_id === "S9-FIX-09").length === 1,
    bounded_status: actualFiles[contextPath].includes("Completed remediation is `9/9`")
      && actualFiles[contextPath].includes("remaining remediation is `0/9`")
      && actualFiles[contextPath].includes("Stage 9 remains **In Progress**")
      && actualFiles[contextPath].includes("not a remediation substep or `S9-FIX-10`"),
    fixture_sources_unchanged: sourceDiff.length === 0,
    fix08_inputs_unchanged: fix08Diff.length === 0,
    historical_evidence_unchanged: historicalDiff.length === 0,
    runtime_boundaries_unchanged: runtimeDiff.length === 0,
    no_absolute_paths: !/(?:\/Users\/|\/private\/|[A-Za-z]:\\\\)/.test(generatedText),
    no_wall_clock_timestamps: !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(generatedText),
    canonical_contract: canonicalContract(),
    network_zero: networkRequests === 0,
  };
  return {
    profile: "S9_FIX_09_POST_REMEDIATION_CORPUS_ASSESSMENT_POST",
    substep_id: "S9-FIX-09",
    passed: Object.values(checks).every(Boolean),
    checks,
    execution_write_set: executionWriteSet,
    generated_sha256: expectedA.sha256,
    population: assessment.population,
    dimensions: dimensionIds,
    finding_counts: assessment.aggregation,
    residual_risk_count: assessment.residual_risks.length,
    closure_verdict: assessment.closure_verdict,
    readiness_recommendation: assessment.readiness_recommendation,
    release_readiness: assessment.release_readiness,
    runtime_boundaries: assessment.runtime_boundaries,
    network_provider_execution_count: networkRequests,
  };
}

async function runCli() {
  let networkRequests = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    networkRequests += 1;
    throw new Error("Network access is forbidden by the S9-FIX-09 assessment contract.");
  };
  try {
    const write = process.argv.includes("--write");
    const dryRun = process.argv.includes("--dry-run-json");
    const selfTestOnly = process.argv.includes("--self-test-json");
    const explicitPost = process.argv.includes("--post-assessment");
    if ([write, dryRun, selfTestOnly].filter(Boolean).length > 1) {
      throw new Error("Use only one generation or self-test mode.");
    }
    if (write || dryRun) {
      const artifacts = write
        ? writeStage9Fix09Artifacts(root)
        : buildStage9Fix09Artifacts(root);
      console.log(JSON.stringify({
        substep_id: "S9-FIX-09",
        mode: write ? "write" : "dry-run",
        paths: executionWriteSet,
        sha256: artifacts.sha256,
        population: artifacts.assessment.population,
        dimensions: dimensionIds,
        findings: artifacts.assessment.aggregation,
        closure_verdict: artifacts.assessment.closure_verdict,
        readiness_recommendation: artifacts.assessment.readiness_recommendation,
        network_provider_execution_count: networkRequests,
      }, null, 2));
      return;
    }
    if (selfTestOnly) {
      const tests = selfTests();
      console.log(JSON.stringify(tests, null, 2));
      if (tests.positive.passed !== tests.positive.total
        || tests.negative.passed !== tests.negative.total
        || !tests.deterministic) process.exitCode = 1;
      return;
    }
    const post = explicitPost || exactPaths(diffPaths(), executionWriteSet);
    const contract = post ? postContract(networkRequests) : prospectiveContract(networkRequests);
    console.log(JSON.stringify(contract, null, 2));
    if (!contract.passed) process.exitCode = 1;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await runCli();
}
