import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceManifestPath = join(root, "docs", "qa", "review", "LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json");
export const batchRoot = join(root, "docs", "qa", "review", "ai-batches", "batch-2");
export const selectionPath = join(batchRoot, "selection.json");
export const blindPacketsPath = join(batchRoot, "blind-packets.json");

export const BATCH_2_FIXTURE_IDS = [
  "S9-EVAL-004", "S9-EVAL-011", "S9-EVAL-016", "S9-EVAL-020", "S9-EVAL-031",
  "S9-MATERIAL-005", "S9-MATERIAL-008", "S9-MATERIAL-015",
  ...["005", "012", "015", "021", "026", "031", "038"].flatMap((cluster) =>
    ["ES", "EN", "RU", "ZH"].map((language) => `S9-CORE-${cluster}-${language}`)),
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

export function contextIsolation(reviewerRoleId) {
  return {
    review_session: "stage-9-ai-review-batch-2",
    reviewer_role_id: reviewerRoleId,
    model_id: "codex-current-session",
    independence_type: "role-and-context-isolated",
    model_independence: "not_claimed",
  };
}

export function buildBatchSelection() {
  const byId = new Map(sourceEntries().map((entry) => [entry.fixture_id, entry]));
  const selected = BATCH_2_FIXTURE_IDS.map((id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`Unknown Batch 2 fixture: ${id}`);
    return entry;
  });
  const clusterCounts = new Map();
  for (const entry of selected.filter((item) => item.equivalence_cluster)) {
    clusterCounts.set(entry.equivalence_cluster, (clusterCounts.get(entry.equivalence_cluster) ?? 0) + 1);
  }
  const completeClusters = [...clusterCounts].filter(([, count]) => count === 4).map(([id]) => id).sort();

  return {
    artifact_version: "stage-9-ai-review-batch-selection.2",
    batch_id: "stage-9-ai-review-batch-2-of-6",
    source_dataset_commit: "81435cbf4ce3ebc00c80aba33b8b753b2c62322c",
    implementation_baseline_commit: "f3aad669d6ba56ad1088479345ba9255bc1419e5",
    selection_method: "fixed deterministic stratified IDs over the versioned 216-entry offline source catalog",
    context_isolation: contextIsolation("ai-review-batch-selector-v1"),
    selection_rationale: [
      "Five new synthetic-risk fixtures cover too-few risks, nonexistent option references, direct imperatives, provider-system leakage, and unsupported scope.",
      "Three new rich-material fixtures cover dependencies and reversibility, deterministic contradiction, and oversized controlled failure.",
      "Twenty-eight canonical fixtures are exactly seven complete four-language clusters: one per core domain, spanning complete, partial, contradictory, and critically incomplete inputs.",
      "The sample deliberately raises high-risk, privacy, controlled-failure, urgency, contradiction, reversibility, incomplete-information, and duplicate-equivalence review pressure.",
    ],
    excluded_prior_clusters: [
      "S9-CLUSTER-003", "S9-CLUSTER-010", "S9-CLUSTER-013", "S9-CLUSTER-024",
      "S9-CLUSTER-029", "S9-CLUSTER-033", "S9-CLUSTER-036", "S9-CLUSTER-037",
    ],
    duplicate_audit_targets: [
      "S9-CLUSTER-005", "S9-CLUSTER-012", "S9-CLUSTER-015", "S9-CLUSTER-021",
      "S9-CLUSTER-026", "S9-CLUSTER-031", "S9-CLUSTER-038", "S9-MATERIAL-005",
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
    artifact_version: "stage-9-ai-review-blind-packets.2",
    batch_id: "stage-9-ai-review-batch-2-of-6",
    reviewer_role_id: "ai-semantic-reviewer-v1",
    prompt_version: "stage-9-ai-review-pass-a.2",
    context_isolation: contextIsolation("ai-semantic-reviewer-v1"),
    blindness_invariant: "Packets exclude expected risk signals, expected decision material, preservation expectations, prior verdicts, and review results.",
    packets: BATCH_2_FIXTURE_IDS.map((id) => {
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
