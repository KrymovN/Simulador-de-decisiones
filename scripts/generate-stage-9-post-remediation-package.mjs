import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const canonicalSourceCommit = "ab8125e4d186dbab3ecc3df17ed4a12eba2bae5a";
const baseDir = "docs/qa/remediation/stage-9";
export const manifestPath = `${baseDir}/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json`;
export const reconciliationPath = `${baseDir}/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json`;
export const ledgerPath = `${baseDir}/AI_REMEDIATION_REVISION_LEDGER.json`;
export const resultPath = `${baseDir}/results/STAGE_9_VERSIONED_DATASET_REGENERATION_RECONCILIATION_RESULT.v1.json`;
export const contextPath = "PROJECT_CONTEXT.md";
export const statusHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
export const executionWriteSet = [
  manifestPath,
  reconciliationPath,
  ledgerPath,
  resultPath,
  contextPath,
].sort();
export const mandatoryGates = [
  "quality:stage-9-remediation-plan",
  "quality:stage-9-post-remediation-regeneration",
  "quality:stage-9-remediation-revision-integrity",
  "quality:stage-9-schema-oracle-evidence-projection",
  "quality:stage-9-human-review-readiness",
  "quality:stage-9-risk-entailment-reference",
  "quality:stage-9-offline-dataset-coverage",
];
export const preparationWriteSet = [
  `${baseDir}/STAGE_9_VERSIONED_DATASET_REGENERATION_RECONCILIATION_SPEC.v1.md`,
  `${baseDir}/AI_REMEDIATION_SEQUENCE.v1.json`,
  "scripts/generate-stage-9-post-remediation-package.mjs",
  "scripts/stage-9-post-remediation-regeneration-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "scripts/stage-9-schema-oracle-evidence-projection-quality.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-risk-entailment-reference-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "package.json",
].sort();

const resultBySubstep = {
  "S9-FIX-01": `${baseDir}/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json`,
  "S9-FIX-02": `${baseDir}/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json`,
  "S9-FIX-03": `${baseDir}/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json`,
  "S9-FIX-04": `${baseDir}/results/STAGE_9_INVENTED_RISK_MECHANISM_REFERENCE_RESULT.v1.json`,
  "S9-FIX-05": `${baseDir}/results/STAGE_9_REVERSIBLE_TRIAL_LOCALIZATION_TEMPLATE_RESULT.v1.json`,
  "S9-FIX-06": `${baseDir}/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json`,
  "S9-FIX-07": `${baseDir}/results/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_RESULT.v1.json`,
};
const commitBySubstep = {
  "S9-FIX-01": "6b04c405a2a8aaba9e9c3e164413a9d954ee04af",
  "S9-FIX-02": "18c8d6bffa422c46f4439b6b93c1076fc98a375c",
  "S9-FIX-03": "82073c46d2f4568875bdbf51310ae75e35118de7",
  "S9-FIX-04": "700d4ab1e562a211e73f2d3e59eb1ce232ff98aa",
  "S9-FIX-05": "8fcf95241aa4ff5424a88b0c773771d5735b590d",
  "S9-FIX-06": "2aa1cbb7dbff338fc434f8a72710af69affde3a7",
  "S9-FIX-07": "ab8125e4d186dbab3ecc3df17ed4a12eba2bae5a",
};
const categoryByCandidate = {
  "S9-REM-SCHEMA-001": "SCHEMA_ORACLE_PROJECTION",
  "S9-REM-EXPECTED-001": "REFERENCE_REVISION",
  "S9-REM-EXPECTED-002": "REFERENCE_REVISION",
  "S9-REM-EXPECTED-003": "REFERENCE_REVISION",
  "S9-REM-GENERATOR-001": "FIXTURE_REVISION",
  "S9-REM-CLUSTER-001": "VALIDATION_ONLY",
  "S9-REM-FIXTURE-001": "FIXTURE_REVISION",
  "S9-REM-FIXTURE-002": "METHODOLOGY_CLARIFICATION",
};

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) =>
      [key, canonicalize(value[key])]));
  }
  return value;
};
const compactCanonical = (value) => JSON.stringify(canonicalize(value));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const read = (repositoryRoot, path) => readFileSync(join(repositoryRoot, path));
const readText = (repositoryRoot, path) => read(repositoryRoot, path).toString("utf8");
const readJson = (repositoryRoot, path) => JSON.parse(readText(repositoryRoot, path));

function loadFixtureModules(repositoryRoot) {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const originalLoad = Module._load;
  const originalTs = require.extensions[".ts"];
  Module._load = function loadInternal(request, parent, isMain) {
    return request === "server-only" ? {} : originalLoad.call(this, request, parent, isMain);
  };
  require.extensions[".ts"] = function loadTypeScript(module, filename) {
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
  try {
    const decision = require(join(repositoryRoot, "lib/ai-decision-material/fixtures.ts"));
    const synthetic = require(join(repositoryRoot, "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts"));
    return {
      canonical: decision.CANONICAL_OFFLINE_EVALUATION_CASES,
      rich: decision.RICH_DECISION_MATERIAL_FIXTURES,
      synthetic: synthetic.SYNTHETIC_RISK_EVALUATION_FIXTURES,
    };
  } finally {
    Module._load = originalLoad;
    if (originalTs) require.extensions[".ts"] = originalTs;
    else delete require.extensions[".ts"];
  }
}

function familyProjection(repositoryRoot, {
  family,
  path,
  symbol,
  rows,
  id,
}) {
  const ids = rows.map(id);
  const rowHashes = rows.map((row, index) => ({
    id: ids[index],
    sha256: sha(compactCanonical(row)),
  }));
  return {
    family,
    source_path: path,
    source_symbol: symbol,
    source_file_sha256: sha(read(repositoryRoot, path)),
    count: rows.length,
    ordered_ids: ids,
    ordered_row_sha256: rowHashes,
    projection_sha256: sha(compactCanonical(rowHashes)),
  };
}

function frozenHistoricalEvidence(repositoryRoot) {
  const directory = join(repositoryRoot, "docs/qa/review");
  const paths = [];
  const walk = (current) => {
    for (const name of readdirSync(current).sort((a, b) => a.localeCompare(b, "en"))) {
      const absolute = join(current, name);
      if (statSync(absolute).isDirectory()) walk(absolute);
      else paths.push(relative(repositoryRoot, absolute).replaceAll("\\", "/"));
    }
  };
  walk(directory);
  return paths.sort().map((path) => ({ path, sha256: sha(read(repositoryRoot, path)) }));
}

function buildReconciliation(repositoryRoot) {
  const consolidatedPath = "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json";
  const registryPath = `${baseDir}/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`;
  const consolidated = readJson(repositoryRoot, consolidatedPath);
  const registry = readJson(repositoryRoot, registryPath);
  const dispositionById = new Map(consolidated.dispositions.map((row) =>
    [row.primary_issue_id, row]));
  const mappings = registry.candidates.flatMap((candidate) => {
    const substep = candidate.planned_substep_id;
    const revisionResultPath = resultBySubstep[substep];
    if (!revisionResultPath || !categoryByCandidate[candidate.candidate_id]) {
      throw new Error(`Missing terminal contract for ${candidate.candidate_id}`);
    }
    const resultHash = sha(read(repositoryRoot, revisionResultPath));
    return candidate.owned_issue_ids.map((primaryIssueId) => {
      const disposition = dispositionById.get(primaryIssueId);
      if (!disposition || !["CONFIRMED", "PARTIALLY_CONFIRMED"]
        .includes(disposition.final_current_disposition)) {
        throw new Error(`Non-actionable or missing owned claim ${primaryIssueId}`);
      }
      return {
        primary_issue_id: primaryIssueId,
        consolidated_status: disposition.final_current_disposition,
        registry_owner_candidate_id: candidate.candidate_id,
        registry_owner_substep_id: substep,
        terminal_mapping_category: categoryByCandidate[candidate.candidate_id],
        source_evidence_path: `${consolidatedPath}#dispositions[primary_issue_id=${primaryIssueId}]`,
        source_evidence_sha256: sha(compactCanonical(disposition)),
        revision_result_path: revisionResultPath,
        revision_result_sha256: resultHash,
        terminal_validation_status: "PASS",
      };
    });
  });
  const rejectedClaims = consolidated.dispositions
    .filter((row) => row.final_current_disposition === "REJECTED")
    .map((row) => ({
      primary_issue_id: row.primary_issue_id,
      consolidated_status: "REJECTED",
      source_evidence_path: `${consolidatedPath}#dispositions[primary_issue_id=${row.primary_issue_id}]`,
      source_evidence_sha256: sha(compactCanonical(row)),
      preserved_unchanged: true,
    }));
  const actionableIds = consolidated.dispositions
    .filter((row) => ["CONFIRMED", "PARTIALLY_CONFIRMED"]
      .includes(row.final_current_disposition))
    .map((row) => row.primary_issue_id);
  const mappedIds = mappings.map((row) => row.primary_issue_id);
  const unresolved = actionableIds.filter((id) => !mappedIds.includes(id));
  if (mappings.length !== 97 || new Set(mappedIds).size !== 97
    || new Set(actionableIds).size !== 97 || unresolved.length !== 0
    || rejectedClaims.length !== 4) {
    throw new Error("Actionable/rejected claim cardinality mismatch.");
  }
  return {
    artifact_version: "stage-9-actionable-claim-reconciliation.1",
    generated_at: null,
    substep_id: "S9-FIX-08",
    matching_key: "consolidated primary_issue_id ↔ registry owned_issue_ids",
    mapping_order: "candidate registry order, then stored owned_issue_ids order",
    terminal_mapping_categories: [
      "SCHEMA_ORACLE_PROJECTION",
      "REFERENCE_REVISION",
      "VALIDATION_ONLY",
      "FIXTURE_REVISION",
      "METHODOLOGY_CLARIFICATION",
    ],
    summary: {
      confirmed: mappings.filter((row) => row.consolidated_status === "CONFIRMED").length,
      partially_confirmed: mappings.filter((row) =>
        row.consolidated_status === "PARTIALLY_CONFIRMED").length,
      actionable_total: mappings.length,
      unique_actionable_total: new Set(mappedIds).size,
      unresolved_count: unresolved.length,
      rejected_preserved_count: rejectedClaims.length,
    },
    mappings,
    rejected_claims_preserved: rejectedClaims,
    network_provider_execution_count: 0,
  };
}

function buildManifest(repositoryRoot, reconciliation) {
  const fixtures = loadFixtureModules(repositoryRoot);
  const canonical = familyProjection(repositoryRoot, {
    family: "canonical_core",
    path: "lib/ai-decision-material/fixtures.ts",
    symbol: "CANONICAL_OFFLINE_EVALUATION_CASES",
    rows: fixtures.canonical,
    id: (row) => row.case_id,
  });
  const synthetic = familyProjection(repositoryRoot, {
    family: "synthetic_risk",
    path: "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts",
    symbol: "SYNTHETIC_RISK_EVALUATION_FIXTURES",
    rows: fixtures.synthetic,
    id: (row) => row.case_id,
  });
  const rich = familyProjection(repositoryRoot, {
    family: "rich_decision_material",
    path: "lib/ai-decision-material/fixtures.ts",
    symbol: "RICH_DECISION_MATERIAL_FIXTURES",
    rows: fixtures.rich,
    id: (row) => row.fixture_id,
  });
  const version11 = fixtures.canonical.filter((row) => row.case_version === "1.1").length;
  const version10 = fixtures.canonical.filter((row) => row.case_version === "1.0").length;
  if (canonical.count !== 160 || synthetic.count !== 32 || rich.count !== 184
    || synthetic.count + rich.count !== 216 || version11 !== 63 || version10 !== 97) {
    throw new Error("Canonical source count/version contract mismatch.");
  }
  const completedRevisionEvidence = Object.keys(resultBySubstep).map((substep) => ({
    substep_id: substep,
    implementation_commit: commitBySubstep[substep],
    result_artifact_path: resultBySubstep[substep],
    result_artifact_sha256: sha(read(repositoryRoot, resultBySubstep[substep])),
  }));
  return {
    package_version: "stage-9-post-remediation-manifest.2",
    generated_at: null,
    substep_id: "S9-FIX-08",
    kind: "integration_regeneration",
    canonical_source_commit: canonicalSourceCommit,
    source_counts: {
      canonical_core: canonical.count,
      synthetic_risk: synthetic.count,
      rich_decision_material: rich.count,
      combined_offline_population: synthetic.count + rich.count,
      legacy_frozen_manifest_entries: 216,
    },
    version_distribution: { "1.1": version11, "1.0": version10 },
    preservation: {
      stable_ids: true,
      non_owned_synthetic_preserved: 31,
      non_owned_rich_preserved: 183,
      historical_evidence_immutable: true,
    },
    source_families: [canonical, synthetic, rich],
    completed_revision_evidence: completedRevisionEvidence,
    frozen_historical_evidence: frozenHistoricalEvidence(repositoryRoot),
    reconciliation_path: reconciliationPath,
    reconciliation_projection_sha256: sha(compactCanonical(reconciliation.mappings)),
    network_provider_execution_count: 0,
    runtime_api_ui_provider_persistence: "UNCHANGED",
  };
}

function updateContext(source) {
  const start = source.indexOf(statusHeading);
  if (start < 0) throw new Error("Missing bounded PROJECT_CONTEXT heading.");
  const next = source.indexOf("\n## ", start + statusHeading.length);
  const end = next < 0 ? source.length : next + 1;
  const before = source.slice(0, start);
  const after = source.slice(end);
  let section = source.slice(start, end);
  const replacements = [
    ["The first seven bounded remediation substeps are complete:", "The first eight bounded remediation substeps are complete:"],
    ["Completed remediation is `7/9`;", "Completed remediation is `8/9`;"],
    ["remaining remediation is `2/9`;", "remaining remediation is `1/9`;"],
    ["the next canonical substep is `S9-FIX-08`.", "the next canonical substep is `S9-FIX-09`."],
  ];
  for (const [oldValue, newValue] of replacements) {
    if (section.split(oldValue).length !== 2) throw new Error(`Context replacement mismatch: ${oldValue}`);
    section = section.replace(oldValue, newValue);
  }
  const marker = "\nStage 9 remains **In Progress**";
  if (section.split(marker).length !== 2) throw new Error("Context insertion boundary mismatch.");
  section = section.replace(marker,
    "\n`S9-FIX-08` completes deterministic versioned dataset regeneration and `97/97` actionable-claim reconciliation with zero unresolved claims. The reconciled technical package is the bounded input for future `S9-FIX-09`; no semantic corpus reassessment or release-readiness decision is performed here.\n"
    + marker);
  return `${before}${section}${after}`;
}

function buildLedgerEvent(repositoryRoot, manifestText, reconciliationText) {
  return {
    event_version: "stage-9-ai-remediation-revision-event.1",
    substep_id: "S9-FIX-08",
    kind: "integration_regeneration",
    prerequisites: Object.keys(resultBySubstep),
    canonical_input_sha256: {
      "lib/ai-decision-material/fixtures.ts": sha(read(repositoryRoot, "lib/ai-decision-material/fixtures.ts")),
      "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts": sha(read(repositoryRoot, "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts")),
      "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json": sha(read(repositoryRoot, "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json")),
      [`${baseDir}/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`]: sha(read(repositoryRoot, `${baseDir}/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json`)),
    },
    generated_output_paths: [manifestPath, reconciliationPath],
    complete_manifest_sha256: sha(manifestText),
    reconciliation_artifact_sha256: sha(reconciliationText),
    actionable_claim_reconciliation: "97/97",
    unresolved_claim_count: 0,
    rejected_claims_preserved: 4,
    result_artifact_path: resultPath,
    validation_status: "PASS",
    generated_at: null,
    implementation_commit_message: "test(stage-9): reconcile remediated dataset revisions",
  };
}

export function buildStage9Fix08Artifacts(repositoryRoot = root, { baselineFiles = {} } = {}) {
  const reconciliation = buildReconciliation(repositoryRoot);
  const manifest = buildManifest(repositoryRoot, reconciliation);
  const manifestText = serialize(manifest);
  const reconciliationText = serialize(reconciliation);
  const ledger = baselineFiles[ledgerPath]
    ? JSON.parse(baselineFiles[ledgerPath])
    : readJson(repositoryRoot, ledgerPath);
  const event = buildLedgerEvent(repositoryRoot, manifestText, reconciliationText);
  const candidateLedger = {
    ...ledger,
    appended_events: [...(ledger.appended_events ?? []), event],
  };
  const contextText = updateContext(
    baselineFiles[contextPath] ?? readText(repositoryRoot, contextPath),
  );
  const result = {
    artifact_version: "stage-9-versioned-dataset-regeneration-reconciliation-result.1",
    status: "PASS",
    substep_id: "S9-FIX-08",
    kind: "integration_regeneration",
    implementation_commit_message: "test(stage-9): reconcile remediated dataset revisions",
    source_commit: canonicalSourceCommit,
    source_counts: manifest.source_counts,
    version_distribution: manifest.version_distribution,
    manifest_path: manifestPath,
    manifest_sha256: sha(manifestText),
    reconciliation_path: reconciliationPath,
    reconciliation_sha256: sha(reconciliationText),
    actionable_claim_reconciliation: "97/97",
    unresolved_claim_count: 0,
    rejected_claims_preserved: 4,
    completed_revision_evidence: manifest.completed_revision_evidence,
    ledger_append: event,
    execution_write_set: executionWriteSet,
    project_context_boundary: {
      section_heading: statusHeading,
      completed_remediation: "8/9",
      remaining_remediation: "1/9",
      next_substep: "S9-FIX-09",
      stage_9_status: "In Progress",
      release_readiness: "NOT_DECLARED",
      runtime_boundaries: "CLOSED",
      api_simulate_mock_only: true,
      visual_migration_remaining: 0,
    },
    mandatory_gates: mandatoryGates,
    deterministic_serialization: true,
    historical_evidence_unchanged: true,
    runtime_api_ui_provider_persistence: "UNCHANGED",
    network_provider_execution_count: 0,
  };
  const files = {
    [manifestPath]: manifestText,
    [reconciliationPath]: reconciliationText,
    [ledgerPath]: serialize(candidateLedger),
    [resultPath]: serialize(result),
    [contextPath]: contextText,
  };
  return {
    files,
    manifest,
    reconciliation,
    ledger_event: event,
    result,
    sha256: Object.fromEntries(Object.entries(files).map(([path, text]) => [path, sha(text)])),
  };
}

export function writeStage9Fix08Artifacts(repositoryRoot = root) {
  const artifacts = buildStage9Fix08Artifacts(repositoryRoot);
  for (const path of executionWriteSet) {
    const absolute = join(repositoryRoot, path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, artifacts.files[path], "utf8");
  }
  return artifacts;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const write = process.argv.includes("--write");
  const dryRun = process.argv.includes("--dry-run-json");
  if (write === dryRun) {
    throw new Error("Use exactly one of --write or --dry-run-json.");
  }
  const artifacts = write ? writeStage9Fix08Artifacts(root) : buildStage9Fix08Artifacts(root);
  console.log(JSON.stringify({
    substep_id: "S9-FIX-08",
    mode: write ? "write" : "dry-run",
    paths: executionWriteSet,
    sha256: artifacts.sha256,
    counts: artifacts.manifest.source_counts,
    version_distribution: artifacts.manifest.version_distribution,
    reconciliation: artifacts.result.actionable_claim_reconciliation,
    unresolved: artifacts.result.unresolved_claim_count,
    network_provider_execution_count: 0,
  }, null, 2));
}
