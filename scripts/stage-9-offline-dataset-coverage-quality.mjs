import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function loadInternal(request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, parent, isMain);
};

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
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

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 offline dataset gate.");
};

let fixtures;
let riskFixtures;
let evaluation;
try {
  fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
  riskFixtures = require(join(root, "lib", "ai-quality", "synthetic-risk-evaluation-fixtures.ts"));
  evaluation = require(join(root, "lib", "ai-decision-material", "evaluation.ts"));
} finally {
  globalThis.fetch = originalFetch;
  Module._load = originalLoad;
}

const cases = fixtures.CANONICAL_OFFLINE_EVALUATION_CASES;
const richFixtures = fixtures.RICH_DECISION_MATERIAL_FIXTURES;
const riskCases = riskFixtures.SYNTHETIC_RISK_EVALUATION_FIXTURES;
const report = evaluation.runAIValuePreservationEvaluation(richFixtures);
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const nonEmptyStrings = (value) => Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("und").replace(/[\p{P}\p{S}\s]+/gu, " ").trim();
const counts = (values) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length]));

const requiredKeys = [
  "case_id", "case_version", "language", "domain", "decision_type", "user_situation", "user_intent",
  "completeness_level", "known_facts", "known_assumptions", "critical_gaps", "important_gaps",
  "expected_clarification_behavior", "expected_scenario_behavior", "expected_risk_behavior",
  "expected_recommendation_behavior", "safety_expectations", "privacy_expectations", "failure_expectations",
  "expected_v2_statuses", "traceability_expectations", "cost_profile", "review_rubric", "dataset_split",
  "provenance", "review_status", "coverage_flags",
];
const decisionTypes = new Set(["binary", "comparative", "timing", "resource_allocation", "strategic_direction", "risk_response", "interpersonal", "exploratory"]);
const splits = new Set(["core_release", "challenge", "safety_privacy", "regression"]);
const validCases = cases.filter((item) =>
  exactKeys(item, requiredKeys) && /^S9-CORE-\d{3}-(?:ES|EN|RU|ZH)$/.test(item.case_id) && item.case_version === "1.0" &&
  fixtures.OFFLINE_DATASET_LANGUAGES.includes(item.language) && fixtures.OFFLINE_DATASET_DOMAINS.includes(item.domain) &&
  decisionTypes.has(item.decision_type) && typeof item.user_situation === "string" && item.user_situation.trim().length >= 12 &&
  typeof item.user_intent === "string" && item.user_intent.length > 0 && fixtures.OFFLINE_DATASET_COMPLETENESS_STATES.includes(item.completeness_level) &&
  [item.known_facts, item.known_assumptions, item.critical_gaps, item.important_gaps].every(Array.isArray) &&
  [item.expected_clarification_behavior, item.expected_scenario_behavior, item.expected_risk_behavior,
    item.expected_recommendation_behavior, item.safety_expectations, item.privacy_expectations,
    item.failure_expectations, item.expected_v2_statuses, item.traceability_expectations, item.review_rubric].every(nonEmptyStrings) &&
  exactKeys(item.cost_profile, ["profile", "max_relative_units"]) && ["bounded_low", "standard"].includes(item.cost_profile.profile) &&
  Number.isInteger(item.cost_profile.max_relative_units) && item.cost_profile.max_relative_units > 0 && splits.has(item.dataset_split) &&
  exactKeys(item.provenance, ["kind", "semantic_cluster_id"]) && item.provenance.kind === "purpose_written_synthetic" &&
  /^S9-CLUSTER-\d{3}$/.test(item.provenance.semantic_cluster_id) && item.review_status === "pending_human_review" &&
  exactKeys(item.coverage_flags, ["high_risk_or_safety_sensitive", "privacy_boundary", "controlled_failure_or_malformed_output", "cost_profile"]) &&
  Object.values(item.coverage_flags).every((value) => typeof value === "boolean") && item.coverage_flags.cost_profile === true
);

const allIds = [...riskCases.map((item) => item.case_id), ...richFixtures.map((item) => item.fixture_id)];
const normalizedSituations = cases.map((item) => normalize(item.user_situation));
const exactSerialized = cases.map((item) => JSON.stringify(item));
const domainCounts = counts(cases.map((item) => item.domain));
const languageCounts = counts(cases.map((item) => item.language));
const completenessCounts = counts(cases.map((item) => item.completeness_level));
const clusterGroups = cases.reduce((groups, item) => {
  (groups[item.provenance.semantic_cluster_id] ??= []).push(item);
  return groups;
}, {});
const completeClusters = Object.values(clusterGroups).filter((cluster) =>
  cluster.length === 4 && fixtures.OFFLINE_DATASET_LANGUAGES.every((language) => cluster.some((item) => item.language === language)));
const highRiskCount = cases.filter((item) => item.coverage_flags.high_risk_or_safety_sensitive).length;
const privacyCount = cases.filter((item) => item.coverage_flags.privacy_boundary).length;
const controlledFailureCount = cases.filter((item) => item.coverage_flags.controlled_failure_or_malformed_output).length;
const costProfileCount = cases.filter((item) => item.coverage_flags.cost_profile).length;
const canonicalState = ["PROJECT_CONTEXT.md", "LEVIO_IMPLEMENTATION_PLAN.md", "CURRENT_STAGE.md", "LEVIO_CURRENT_STATE.md", "LEVIO_PROJECT_PROGRESS.md"].map((path) => read(path)).join("\n").replace(/\s+/g, " ");
const fixtureSource = read("lib", "ai-decision-material", "fixtures.ts");
const gateSource = read("scripts", "stage-9-offline-dataset-coverage-quality.mjs");

add("baseline-56-preserved", riskCases.length === 32 && fixtures.RICH_DECISION_MATERIAL_BASELINE_COUNT === 24 && richFixtures.slice(0, 24).every((item, index) => item.fixture_id === `S9-MATERIAL-${String(index + 1).padStart(3, "0")}`), "Existing 32 risk and 24 rich-material fixtures must remain present.");
add("canonical-expansion-160", cases.length === 160 && fixtures.CANONICAL_OFFLINE_DATASET_EXPANSION_COUNT === 160, `${cases.length} canonical cases generated.`);
add("combined-offline-total-216", allIds.length === 216 && fixtures.COMBINED_STAGE9_OFFLINE_FIXTURE_COUNT === 216, `${allIds.length} total offline cases.`);
add("all-case-ids-unique", new Set(allIds).size === allIds.length, `${allIds.length - new Set(allIds).size} duplicate IDs.`);
add("zero-exact-duplicates", new Set(exactSerialized).size === exactSerialized.length, `${exactSerialized.length - new Set(exactSerialized).size} exact duplicates.`);
add("zero-normalized-text-duplicates", new Set(normalizedSituations).size === normalizedSituations.length, `${normalizedSituations.length - new Set(normalizedSituations).size} normalized-text duplicates.`);
add("all-cases-schema-valid", validCases.length === cases.length, `${cases.length - validCases.length} invalid cases.`);
add("all-core-domains-covered", fixtures.OFFLINE_DATASET_DOMAINS.every((domain) => domainCounts[domain] >= 20), JSON.stringify(domainCounts));
add("no-domain-over-25-percent", Object.values(domainCounts).every((count) => count / cases.length <= 0.25), JSON.stringify(domainCounts));
add("first-wave-languages-covered", fixtures.OFFLINE_DATASET_LANGUAGES.every((language) => languageCounts[language] >= 20), JSON.stringify(languageCounts));
add("completeness-per-language", fixtures.OFFLINE_DATASET_LANGUAGES.every((language) => fixtures.OFFLINE_DATASET_COMPLETENESS_STATES.every((state) => cases.some((item) => item.language === language && item.completeness_level === state))), JSON.stringify(completenessCounts));
add("four-language-equivalence-clusters", completeClusters.length >= 8, `${completeClusters.length} complete clusters.`);
add("high-risk-minimum-30", highRiskCount >= 30, `${highRiskCount} high-risk cases.`);
add("privacy-minimum-20", privacyCount >= 20, `${privacyCount} privacy-boundary cases.`);
add("controlled-failure-minimum-20", controlledFailureCount >= 20, `${controlledFailureCount} controlled-failure cases.`);
add("cost-profile-minimum-20", costProfileCount >= 20, `${costProfileCount} cost-profile cases.`);
add("decision-types-covered", decisionTypes.size === new Set(cases.map((item) => item.decision_type)).size, JSON.stringify(counts(cases.map((item) => item.decision_type))));
add("rich-evaluation-all-pass", report.passed && report.total_cases === 184 && report.failed_cases === 0, `${report.passed_cases}/${report.total_cases} rich fixtures passed.`);
add("silent-loss-zero", report.results.every((item) => item.metrics.silent_loss_count === 0), `${report.results.reduce((sum, item) => sum + item.metrics.silent_loss_count, 0)} silent losses.`);
add("deterministic-repeat", JSON.stringify(cases) === JSON.stringify(fixtures.CANONICAL_OFFLINE_EVALUATION_CASES), "Repeated dataset serialization must be equivalent.");
add("network-zero", networkRequests === 0 && !fixtureSource.includes("fetch(") && !fixtureSource.includes("process.env") && !fixtureSource.includes('from "openai"'), `${networkRequests} network requests.`);
add("legacy-review-field-unclaimed", cases.every((item) => item.review_status === "pending_human_review") && canonicalState.includes("AI review status remains `In Progress`") && canonicalState.includes("owner-approved independent AI review protocol") && !canonicalState.includes("Human review is complete"), "Legacy fixture review fields remain unclaimed; active review is tracked only in versioned independent-AI artifacts.");
add("stage-and-runtime-boundaries", canonicalState.includes("Stage 9 remains **In Progress**") && canonicalState.includes("`/api/simulate` remains deterministic with `mockOnly=true`") && canonicalState.includes("Live OpenAI execution is not opened"), "Stage 9 and mock-only/offline boundaries must remain closed.");
add("gate-self-protection", gateSource.includes("zero-normalized-text-duplicates") && gateSource.includes("all-cases-schema-valid") && gateSource.includes("network-zero"), "Coverage gate must retain duplicate, schema, and network protections.");

for (const check of checks) console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
console.log(`REPORT before=56 added=${cases.length} after=${allIds.length} risk=${riskCases.length} rich_baseline=24 rich_expansion=${cases.length} rich_total=${richFixtures.length} duplicates=${exactSerialized.length - new Set(exactSerialized).size} normalized_duplicates=${normalizedSituations.length - new Set(normalizedSituations).size} invalid=${cases.length - validCases.length} network=${networkRequests}`);
console.log(`DISTRIBUTION domains=${JSON.stringify(domainCounts)} languages=${JSON.stringify(languageCounts)} completeness=${JSON.stringify(completenessCounts)} high_risk=${highRiskCount} privacy=${privacyCount} controlled_failure=${controlledFailureCount} cost_profile=${costProfileCount} clusters=${completeClusters.length}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
