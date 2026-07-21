import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceManifestPath = join(root, "docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
export const batchRoot = join(root, "docs", "qa", "review", "ai-batches", "batch-1");
export const selectionPath = join(batchRoot, "selection.json");
export const blindPacketsPath = join(batchRoot, "blind-packets.json");

export const BATCH_1_FIXTURE_IDS = [
  "S9-EVAL-001", "S9-EVAL-013", "S9-EVAL-014", "S9-EVAL-022",
  "S9-EVAL-023", "S9-EVAL-025", "S9-EVAL-026", "S9-EVAL-030",
  "S9-MATERIAL-001", "S9-MATERIAL-003", "S9-MATERIAL-007", "S9-MATERIAL-010",
  "S9-MATERIAL-012", "S9-MATERIAL-013", "S9-MATERIAL-014", "S9-MATERIAL-023",
  "S9-CORE-003-ES", "S9-CORE-003-EN", "S9-CORE-003-RU", "S9-CORE-003-ZH",
  "S9-CORE-010-ES", "S9-CORE-010-EN", "S9-CORE-010-RU", "S9-CORE-010-ZH",
  "S9-CORE-013-ES", "S9-CORE-013-EN", "S9-CORE-013-RU", "S9-CORE-013-ZH",
  "S9-CORE-024-ES", "S9-CORE-024-EN", "S9-CORE-024-RU", "S9-CORE-024-ZH",
  "S9-CORE-029-ES", "S9-CORE-033-RU", "S9-CORE-036-ZH", "S9-CORE-037-EN",
];

function sourceEntries() {
  return JSON.parse(readFileSync(sourceManifestPath, "utf8")).entries;
}

export function canonicalSource(entry) {
  const { human_review: _historicalHumanReview, ...source } = entry;
  return source;
}

export function sourceFixtureHash(entry) {
  return createHash("sha256").update(JSON.stringify(canonicalSource(entry))).digest("hex");
}

function countBy(entries, field) {
  const counts = new Map();
  for (const entry of entries) counts.set(entry[field], (counts.get(entry[field]) ?? 0) + 1);
  return Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
}

export function buildBatchSelection() {
  const byId = new Map(sourceEntries().map((entry) => [entry.fixture_id, entry]));
  const selected = BATCH_1_FIXTURE_IDS.map((id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`Unknown Batch 1 fixture: ${id}`);
    return entry;
  });
  const clusterCounts = new Map();
  for (const entry of selected.filter((item) => item.equivalence_cluster)) {
    clusterCounts.set(entry.equivalence_cluster, (clusterCounts.get(entry.equivalence_cluster) ?? 0) + 1);
  }
  const completeClusters = [...clusterCounts].filter(([, count]) => count === 4).map(([id]) => id).sort();

  return {
    artifact_version: "stage-9-ai-review-batch-selection.1",
    batch_id: "stage-9-ai-review-batch-1-of-6",
    source_dataset_commit: "81435cbf4ce3ebc00c80aba33b8b753b2c62322c",
    protocol_owner_decision_commit_base: "372b82f58fbc637d8769e9b1cbf147f3d7b22136",
    selection_method: "fixed deterministic stratified IDs over the versioned 216-entry offline source catalog",
    selection_rationale: [
      "Eight synthetic-risk fixtures cover accepted behavior, duplicate risk, recommendation leakage, privacy leakage, malformed normalization, timeout, and input limit failure.",
      "Eight rich-material fixtures cover broad preservation, assumptions and unknowns, duplicate merge, unsupported authority, prompt injection, privacy, malformed structure, and risk-only value loss.",
      "Twenty canonical fixtures include four complete multilingual clusters plus four stratified cases, all languages, all seven core domains, all completeness states, high-risk, privacy, controlled failure, and cross-cluster duplicate inspection.",
    ],
    duplicate_audit_targets: [
      "S9-EVAL-013", "S9-MATERIAL-007", "S9-CLUSTER-003", "S9-CLUSTER-010",
      "S9-CLUSTER-013", "S9-CLUSTER-024", "S9-CORE-036-ZH", "S9-CORE-037-EN",
    ],
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
  const byId = new Map(sourceEntries().map((entry) => [entry.fixture_id, entry]));
  return {
    artifact_version: "stage-9-ai-review-blind-packets.1",
    batch_id: "stage-9-ai-review-batch-1-of-6",
    reviewer_role_id: "ai-semantic-reviewer-v1",
    prompt_version: "stage-9-ai-review-pass-a.1",
    blindness_invariant: "Packets exclude expected risk signals, expected decision material, preservation expectations, prior verdicts, and review results.",
    packets: BATCH_1_FIXTURE_IDS.map((id) => {
      const entry = byId.get(id);
      return {
        fixture_id: id,
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
      };
    }),
  };
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(batchRoot, { recursive: true });
  writeFileSync(selectionPath, serialize(buildBatchSelection()), "utf8");
  writeFileSync(blindPacketsPath, serialize(buildBlindPackets()), "utf8");
  console.log(`WROTE ${selectionPath}`);
  console.log(`WROTE ${blindPacketsPath}`);
}
