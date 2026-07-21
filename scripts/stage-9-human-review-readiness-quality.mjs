import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REVIEW_MANIFEST_PATH,
  REVIEW_METHODOLOGY_PATH,
  REVIEW_VERDICTS,
  buildHumanReviewManifest,
  serializeHumanReviewManifest,
} from "./generate-stage-9-human-review-package.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const manifestSource = readFileSync(REVIEW_MANIFEST_PATH, "utf8");
const methodology = readFileSync(REVIEW_METHODOLOGY_PATH, "utf8");
const aiMethodology = read("docs", "qa", "LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md");
const batchSelection = JSON.parse(read("docs", "qa", "review", "ai-batches", "batch-1", "selection.json"));
const manifest = JSON.parse(manifestSource);
const rebuilt = buildHumanReviewManifest();
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 review-readiness compatibility gate.");
};

const ids = manifest.entries.map((entry) => entry.fixture_id);
const rebuiltIds = rebuilt.entries.map((entry) => entry.fixture_id);
const duplicateCount = ids.length - new Set(ids).size;
const missingCount = rebuiltIds.filter((id) => !ids.includes(id)).length;
const rebuiltById = new Map(rebuilt.entries.map((entry) => [entry.fixture_id, entry]));
const metadataMismatchCount = manifest.entries.filter((entry) =>
  JSON.stringify(entry) !== JSON.stringify(rebuiltById.get(entry.fixture_id))).length;
const notReviewedCount = manifest.entries.filter((entry) =>
  entry.human_review.verdict === "NOT_REVIEWED").length;
const clusters = new Map();
for (const entry of manifest.entries.filter((entry) => entry.equivalence_cluster)) {
  const members = clusters.get(entry.equivalence_cluster) ?? [];
  members.push(entry.language);
  clusters.set(entry.equivalence_cluster, members);
}
const currentCanonical = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"]
  .map((path) => {
    const source = read(path);
    const nextHeading = source.indexOf("\n## ", source.indexOf("\n## ") + 4);
    return source.slice(0, nextHeading === -1 ? source.length : nextHeading);
  }).join("\n");

add("source-dataset-216", rebuilt.entries.length === 216, `${rebuilt.entries.length} source fixtures.`);
add("manifest-entries-216", manifest.entries.length === 216, `${manifest.entries.length} manifest entries.`);
add("ids-exactly-match-source", JSON.stringify(ids) === JSON.stringify(rebuiltIds), "Manifest IDs preserve source order and membership.");
add("no-extra-missing-or-duplicate-ids", duplicateCount === 0 && missingCount === 0 && ids.every((id) => rebuiltIds.includes(id)), `${duplicateCount} duplicate and ${missingCount} missing fixture IDs.`);
add("metadata-corresponds-to-source", metadataMismatchCount === 0, `${metadataMismatchCount} metadata mismatches.`);
add("metadata-byte-matches-source-build", manifestSource === serializeHumanReviewManifest(), "Checked-in manifest matches deterministic source projection.");
add("deterministic-repeat", JSON.stringify(buildHumanReviewManifest()) === JSON.stringify(buildHumanReviewManifest()), "Two builds are byte-equivalent.");
add("required-review-fields", manifest.entries.every((entry) => ["fixture_id", "dataset_type", "equivalence_cluster", "language", "domain", "completeness_state", "risk_markers", "privacy_marker", "controlled_failure_marker", "cost_profile", "source_input", "expected_candidate_risk_signals", "expected_decision_material", "expected_critical_information_preservation", "human_review"].every((key) => key in entry)), "Every entry exposes the complete reviewer surface.");
add("historical-human-verdicts-remain-unclaimed", notReviewedCount === 216, `${notReviewedCount} historical NOT_REVIEWED entries.`);
add("all-review-fields-initialized", manifest.entries.every((entry) => entry.human_review.severity === null && entry.human_review.reviewer_notes === "" && entry.human_review.translation_equivalence_verdict === "NOT_REVIEWED" && entry.human_review.semantic_duplication_verdict === "NOT_REVIEWED"), "Severity, notes, equivalence, and duplication fields are unclaimed.");
add("no-fabricated-historical-human-identity", manifest.entries.every((entry) => entry.human_review.reviewer_identity === null), "Historical human reviewer identities remain null.");
add("no-fabricated-historical-human-timestamps", manifest.generated_at === null && manifest.entries.every((entry) => entry.human_review.reviewed_at === null), "Historical human-review timestamps remain null.");
add("review-verdict-vocabulary", JSON.stringify(manifest.review_policy.allowed_verdicts) === JSON.stringify(REVIEW_VERDICTS), "Canonical five-verdict vocabulary is fixed.");
add("all-four-languages", ["es", "en", "ru", "zh"].every((language) => manifest.summary.languages[language] >= 40), JSON.stringify(manifest.summary.languages));
add("forty-complete-equivalence-clusters", clusters.size === 40 && [...clusters.values()].every((languages) => new Set(languages).size === 4 && ["es", "en", "ru", "zh"].every((language) => languages.includes(language))), `${clusters.size} complete clusters.`);
add("methodology-exists-and-is-complete", ["schema correctness", "realism", "semantic diversity", "uncertainty preservation", "invented facts", "privacy", "controlled failure", "translation equivalence", "semantic duplication", "cultural correctness"].every((term) => methodology.toLowerCase().includes(term)), "Methodology covers mandatory review dimensions.");
add("historical-methodology-retained", methodology.includes("Historical artifact:") && methodology.includes("NOT_REVIEWED") && methodology.includes("FAIL_MAJOR"), "Prior human-review package remains traceable but inactive.");
add("active-ai-review-methodology", aiMethodology.includes("independent AI-assisted multi-pass review") && aiMethodology.includes("ai-semantic-reviewer-v1") && aiMethodology.includes("ai-adjudicator-v1") && aiMethodology.includes("It is not human review"), "Owner-approved independent AI review is the active methodology.");
add("batch-1-selection-ready", batchSelection.coverage.selected_count === 36 && batchSelection.fixtures.length === 36, `${batchSelection.fixtures.length} Batch 1 fixtures.`);
add("threshold-audit-not-retroactive", manifest.threshold_interpretation.originating_commit === "5b0674e8" && manifest.threshold_interpretation.verdict === "CASE_RECORD_THRESHOLD_SATISFIED" && manifest.threshold_interpretation.semantic_independence_requirement === false, manifest.threshold_interpretation.verdict);
add("historical-rc-verdict-bounded", manifest.rc_pre_assessment.verdict === "READY_FOR_HUMAN_REVIEW" && !JSON.stringify(manifest.rc_pre_assessment).includes("RELEASE_READY"), manifest.rc_pre_assessment.verdict);
add("historical-human-review-not-misrepresented", manifest.review_policy.human_review_status === "Pending" && !currentCanonical.includes("Human review is complete") && !currentCanonical.includes("Human review has been completed"), manifest.review_policy.human_review_status);
add("active-ai-review-status", currentCanonical.includes("owner-approved independent AI review protocol") && currentCanonical.includes("AI review status remains `In Progress`"), "Active AI review status is explicit.");
add("stage-9-in-progress", currentCanonical.includes("Stage 9 remains **In Progress**") && !currentCanonical.includes("Stage 9 is complete"), "Stage 9 remains In Progress.");
add("runtime-boundaries-closed", currentCanonical.includes("Live OpenAI execution is not opened") && currentCanonical.includes("`/api/simulate` remains deterministic with `mockOnly=true`") && currentCanonical.includes("runtime boundaries remain closed"), "Runtime and live-provider boundaries remain closed.");
add("network-zero", networkRequests === 0 && manifest.summary.network_request_count === 0, `${networkRequests} network requests.`);
add("quality-gate-registered", read("package.json").includes('"quality:stage-9-human-review-readiness": "node scripts/stage-9-human-review-readiness-quality.mjs"'), "Dedicated package script is registered.");

globalThis.fetch = originalFetch;

const allowed = new Set([
  "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_IMPLEMENTATION_PLAN.md", "LEVIO_PROJECT_PROGRESS.md", "PROJECT_CONTEXT.md",
  "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md", "docs/qa/LEVIO_STAGE_9_HUMAN_REVIEW_METHODOLOGY.md",
  "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json", "package.json",
  "docs/qa/review/ai-batches/batch-1/selection.json", "docs/qa/review/ai-batches/batch-1/blind-packets.json",
  "docs/qa/review/ai-batches/batch-1/pass-a.json", "docs/qa/review/ai-batches/batch-1/pass-b.json", "docs/qa/review/ai-batches/batch-1/pass-c.json",
  "docs/qa/review/ai-batches/batch-1/adjudication.json", "docs/qa/review/ai-batches/batch-1/summary.json", "docs/qa/review/ai-batches/batch-1/issue-ledger.json",
  "scripts/generate-stage-9-human-review-package.mjs", "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/generate-stage-9-ai-review-batch-1.mjs", "scripts/stage-9-ai-review-batch-1-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs", "scripts/visual-migration-closure-quality.mjs",
]);
const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const diff = [...new Set([...tracked, ...untracked])].sort();
add("bounded-review-only-diff", diff.every((path) => allowed.has(path)), `Unexpected files: ${diff.filter((path) => !allowed.has(path)).join(", ")}`);

for (const check of checks) console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT source=${rebuilt.entries.length} manifest=${manifest.entries.length} clusters=${clusters.size} languages=${JSON.stringify(manifest.summary.languages)} historical_not_reviewed=${notReviewedCount} duplicates=${duplicateCount} missing=${missingCount} metadata_mismatch=${metadataMismatchCount} threshold=${manifest.threshold_interpretation.verdict} historical_rc=${manifest.rc_pre_assessment.verdict} active_review=INDEPENDENT_AI_REVIEW_BATCH_1_COMPLETE network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
