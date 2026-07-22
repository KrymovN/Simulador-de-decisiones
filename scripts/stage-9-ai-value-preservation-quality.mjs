import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
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
const baseline = "6f1d6624e78a30fb9c7f020db22a876e9d285624";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const before = (path) => execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root, encoding: "utf8" });

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

const contractsSource = read("lib", "ai-decision-material", "contracts.ts");
const acceptanceSource = read("lib", "ai-decision-material", "acceptance.ts");
const evaluationSource = read("lib", "ai-decision-material", "evaluation.ts");
const fixturesSource = read("lib", "ai-decision-material", "fixtures.ts");
const providerSource = read("lib", "ai-provider", "openai-synthetic-risk-adapter.ts");
const routeSource = read("app", "api", "simulate", "route.ts");
const homeSource = read("components", "HomeSimulator.tsx");
const packageJson = read("package.json");
const aiArchitecture = read("docs", "architecture", "LEVIO_AI_ABSTRACTION_OBSERVABILITY_COSTS.md");
const decisionEngineDoc = read("docs", "architecture", "LEVIO_DECISION_ENGINE.md");
const evaluationDoc = read("docs", "qa", "LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md");
const canonicalStateSources = [
  "PROJECT_CONTEXT.md",
  "LEVIO_IMPLEMENTATION_PLAN.md",
  "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md",
  "LEVIO_PROJECT_PROGRESS.md",
].map((path) => read(path));
const currentCanonicalState = canonicalStateSources.map((source) => {
  const firstHeading = source.indexOf("\n## ");
  const nextHeading = source.indexOf("\n## ", firstHeading + 4);
  return source.slice(0, nextHeading === -1 ? source.length : nextHeading);
}).join("\n").replace(/\s+/g, " ");

const contracts = require(join(root, "lib", "ai-decision-material", "contracts.ts"));
const fixtures = require(join(root, "lib", "ai-decision-material", "fixtures.ts"));
const evaluation = require(join(root, "lib", "ai-decision-material", "evaluation.ts"));

const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

function imports(source, fileName) {
  const ast = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  return ast.statements
    .filter(ts.isImportDeclaration)
    .map((node) => node.moduleSpecifier.text);
}

function filesUnder(directory) {
  const output = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) output.push(...filesUnder(path));
    else if (/\.(?:ts|tsx)$/.test(entry)) output.push(path);
  }
  return output;
}

function importedByPublicRuntime() {
  return [...filesUnder(join(root, "app")), ...filesUnder(join(root, "components"))]
    .flatMap((path) => imports(readFileSync(path, "utf8"), relative(root, path)).map((specifier) => ({ path, specifier })))
    .filter(({ specifier }) => specifier.includes("ai-decision-material"));
}

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden in the Stage 9 value-preservation gate.");
};
let report;
try {
  report = evaluation.runAIValuePreservationEvaluation(fixtures.RICH_DECISION_MATERIAL_FIXTURES);
} finally {
  globalThis.fetch = originalFetch;
  Module._load = originalLoad;
}

const firstAcceptance = report.results.find((item) => item.coverage_id === "wide_useful_material")?.acceptance;
const duplicateAcceptance = report.results.find((item) => item.coverage_id === "duplicate_merge")?.acceptance;
const lossExample = report.results.find((item) => item.coverage_id === "risk_only_value_loss");
const unsupportedRecommendation = report.results.find((item) => item.coverage_id === "unsupported_recommendation")?.acceptance;

add("canonical-capability-preservation-invariant", aiArchitecture.includes("AI capability preservation and decision authority invariant") && aiArchitecture.includes("must not arbitrarily reduce the useful intellectual depth"), "Canonical AI architecture must preserve useful provider depth.");
add("canonical-decision-authority-invariant", aiArchitecture.includes("The provider is never the recommendation authority") && decisionEngineDoc.includes("Decision Engine remains the sole product authority"), "Provider material must remain candidate-only.");
add("canonical-no-silent-degradation-invariant", aiArchitecture.includes("silent_drop_count === 0") && decisionEngineDoc.includes("explicit disposition"), "Canonical hierarchy must forbid silent degradation.");
add("canonical-value-add-invariant", aiArchitecture.includes("Shortening or") && aiArchitecture.includes("is not transformation value") && decisionEngineDoc.includes("Concise rewriting alone does not satisfy"), "Simple summarization must not count as Levio value.");
add("canonical-risk-slice-distinction", aiArchitecture.includes("candidate_risk_signals_v1") && aiArchitecture.includes("candidate_decision_material_v1") && aiArchitecture.includes("narrow synthetic risk"), "Narrow risk capability and rich material foundation must remain distinct.");
add("evaluation-contract-canonical", evaluationDoc.includes("Provider-material preservation and value-add evaluation") && evaluationDoc.includes("semantic coverage") && evaluationDoc.includes("56-fixture combined"), "Offline value-add metrics must be canonicalized without claiming readiness.");

const contractAst = ts.createSourceFile("contracts.ts", contractsSource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
const declarations = new Set(contractAst.statements.flatMap((node) => {
  if (ts.isTypeAliasDeclaration(node) || ts.isVariableStatement(node)) {
    if (ts.isTypeAliasDeclaration(node)) return [node.name.text];
    return node.declarationList.declarations.map((declaration) => declaration.name.getText(contractAst));
  }
  return [];
}));
add("contract-ast-declarations", ["CandidateDecisionMaterial", "CandidateDecisionMaterialItem", "SemanticPreservationLedgerEntry", "DecisionCompositionEvidence"].every((name) => declarations.has(name)), "AST must expose rich material, ledger, and composition evidence contracts.");
add("server-only-contract-marker", contractsSource.startsWith('import "server-only";') && acceptanceSource.startsWith('import "server-only";'), "Contract and acceptance layer must be server-only.");
add("all-rich-item-types", contracts.DECISION_MATERIAL_ITEM_TYPES.length === 15 && ["benefit_or_opportunity", "assumption", "unknown", "short_term_consequence", "long_term_consequence", "reversibility", "clarification_need"].every((type) => contracts.DECISION_MATERIAL_ITEM_TYPES.includes(type)), "Rich contract must not collapse material into risks.");
add("candidate-only-authority", contractsSource.includes('authority: "candidate_only"') && acceptanceSource.includes("authority_classification_invalid"), "Provider items must have candidate-only authority.");
add("strict-schema-no-extra-fields", acceptanceSource.includes("MATERIAL_KEYS") && acceptanceSource.includes("ITEM_KEYS") && acceptanceSource.includes("exactKeys"), "Material and item schemas must reject arbitrary fields.");
add("acceptance-boundaries", ["direct_recommendation_forbidden", "unsupported_certainty_forbidden", "personal_data_detected", "prompt_injection_content", "invalid_reference", "excessive_item_count"].every((reason) => acceptanceSource.includes(reason)), "Acceptance must enforce authority, certainty, privacy, injection, reference, and size boundaries.");
add("ledger-dispositions-complete", contracts.SEMANTIC_PRESERVATION_DISPOSITIONS.length === 9 && ["accepted", "accepted_with_normalization", "merged_as_duplicate", "rejected_invalid", "rejected_unsafe", "rejected_privacy", "rejected_irrelevant", "rejected_unsupported_authority", "controlled_failure"].every((value) => contracts.SEMANTIC_PRESERVATION_DISPOSITIONS.includes(value)), "Ledger must distinguish every required disposition.");
add("silent-drop-zero", report.results.every((item) => item.acceptance.silent_drop_count === 0), "Every evaluated candidate must have a ledger outcome.");
add("all-observed-items-ledgered", report.results.every((item) => item.acceptance.observed_candidate_count === 0 || item.acceptance.ledger.length === item.acceptance.observed_candidate_count), "No observed candidate item may disappear, including during controlled failure.");
add("accepted-items-traceable", firstAcceptance?.ledger.every((entry) => entry.traceability_marker) && firstAcceptance.ledger.length === 15, "Wide provider material must retain item-level traceability.");
add("merged-item-has-target", duplicateAcceptance?.ledger.some((entry) => entry.disposition === "merged_as_duplicate" && entry.normalized_or_merged_item_id), "Merged duplicates must identify their accepted target.");
add("rejected-items-have-reasons", report.results.every((item) => item.acceptance.ledger.every((entry) => !entry.disposition.startsWith("rejected") || Boolean(entry.reason))), "Every rejected item needs a machine-readable reason.");
add("epistemic-boundaries-preserved", report.results.every((item) => item.metrics.fact_assumption_unknown_separation_preserved && item.metrics.uncertainty_preserved), "Normalization must preserve assumption and unknown semantics.");
add("risk-only-loss-detected", lossExample?.metrics.risk_only_value_loss_detected, "Fixture must prove that risk-only mapping would lose useful rich material.");
add("meaningful-transformation-measured", evaluationSource.includes("meaningful_transformation_count") && evaluationSource.includes("no_meaningful_transformation"), "Value-add evaluation must reject composition without substantive transformation.");

add("fixture-count-24-baseline-preserved", fixtures.RICH_DECISION_MATERIAL_BASELINE_COUNT === 24 && fixtures.RICH_DECISION_MATERIAL_FIXTURES.slice(0, 24).every((item, index) => item.fixture_id === `S9-MATERIAL-${String(index + 1).padStart(3, "0")}`), "The original 24 rich-material fixtures must remain intact and ordered.");
add("fixture-count-expanded-to-216", fixtures.EXISTING_SYNTHETIC_RISK_FIXTURE_BASELINE === 32 && fixtures.CANONICAL_OFFLINE_DATASET_EXPANSION_COUNT === 160 && fixtures.RICH_DECISION_MATERIAL_FIXTURE_COUNT === 184 && fixtures.COMBINED_STAGE9_OFFLINE_FIXTURE_COUNT === 216, "Combined offline fixture count must grow from 56 to 216 without removing the baseline.");
add("fixture-coverage-complete", report.covered_categories === report.required_categories && report.required_categories === 24, `${report.covered_categories}/${report.required_categories} categories covered.`);
add("offline-evaluation-pass", report.passed && report.failed_cases === 0, `${report.passed_cases}/${report.total_cases} cases passed.`);
add("zero-network", networkRequests === 0 && report.network_requests === 0 && !evaluationSource.includes("process.env") && !fixturesSource.includes("process.env"), `${networkRequests} network requests.`);

add("existing-risk-capability-unchanged", providerSource.includes('"candidate_risk_signals_v1" as const') && providerSource === before("lib/ai-provider/openai-synthetic-risk-adapter.ts"), "Existing narrow synthetic risk capability must remain byte-identical.");
add("no-public-runtime-import", importedByPublicRuntime().length === 0, "App and component AST imports must not reference the rich AI foundation.");
add("public-api-remains-mock-only", routeSource.includes("mockOnly: true") && !routeSource.includes("ai-decision-material") && !routeSource.toLowerCase().includes("openai"), "Public API must remain deterministic and mock-only.");
add("home-simulator-unchanged", homeSource === before("components/HomeSimulator.tsx") && homeSource.includes('fetch("/api/simulate"'), "HomeSimulator must remain byte-identical and public-API-only.");
add("no-live-sdk-or-runtime-bridge", ![contractsSource, acceptanceSource, evaluationSource, fixturesSource].some((source) => source.includes('from "openai"') || source.includes("prompt-context") || source.includes("decision-engine") || source.includes("process.env") || source.includes("fetch(")), "Foundation must have no SDK, environment, Prompt Context, Decision Engine, or live network bridge.");
add("no-persistence-or-personal-scope", ![contractsSource, acceptanceSource, evaluationSource, fixturesSource].some((source) => source.includes("supabase") || source.includes("persistence-runtime")) && contractsSource.includes('classification: "synthetic_non_personal"'), "Foundation must not open persistence or personal-data provider scope.");
add("raw-provider-material-not-persisted", report.results.every((item) => item.acceptance.raw_provider_material_persisted === false) && contractsSource.includes("raw_provider_material_persisted: false"), "Raw provider prompts and responses must not become durable records.");
add("quality-gate-registered", packageJson.includes('"quality:stage-9-ai-value-preservation": "node scripts/stage-9-ai-value-preservation-quality.mjs"'), "Dedicated gate must be registered.");

const canonicalReconciliationBoundariesPreserved =
  currentCanonicalState.includes("Stage 9 remains **In Progress**") &&
  !currentCanonicalState.includes("Stage 9 is complete") &&
  !currentCanonicalState.includes("Stage 9 is **Complete**") &&
  currentCanonicalState.includes("25 of 73") &&
  currentCanonicalState.includes("48") &&
  currentCanonicalState.includes("release readiness is not declared") &&
  currentCanonicalState.includes("next planning candidate") &&
  currentCanonicalState.includes("Visual migration remains fully closed with 0 remaining substeps") &&
  !/\bStage (?:1[6-9]|[2-9]\d)\b/.test(currentCanonicalState) &&
  routeSource.includes("mockOnly: true") &&
  !routeSource.toLowerCase().includes("openai") &&
  homeSource.includes('fetch("/api/simulate"') &&
  importedByPublicRuntime().length === 0 &&
  ![contractsSource, acceptanceSource, evaluationSource, fixturesSource].some((source) =>
    source.includes('from "openai"') || source.includes("prompt-context") ||
    source.includes("decision-engine") || source.includes("persistence-runtime") ||
    source.includes("process.env") || source.includes("fetch("));
add("canonical-reconciliation-boundaries-preserved", canonicalReconciliationBoundariesPreserved, "Canonical reconciliation must preserve Stage 9, Stage 15, offline/mock-only, no-bridge, dataset, human-review, visual-closure, and planning-only boundaries.");

const allowedDiff = new Set([
  "docs/architecture/LEVIO_AI_ABSTRACTION_OBSERVABILITY_COSTS.md",
  "docs/architecture/LEVIO_DECISION_ENGINE.md",
  "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md",
  "docs/qa/LEVIO_STAGE_9_HUMAN_REVIEW_METHODOLOGY.md",
  "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json",
  "docs/qa/review/ai-batches/batch-1/selection.json",
  "docs/qa/review/ai-batches/batch-1/blind-packets.json",
  "docs/qa/review/ai-batches/batch-1/pass-a.json",
  "docs/qa/review/ai-batches/batch-1/pass-b.json",
  "docs/qa/review/ai-batches/batch-1/pass-c.json",
  "docs/qa/review/ai-batches/batch-1/adjudication.json",
  "docs/qa/review/ai-batches/batch-1/summary.json",
  "docs/qa/review/ai-batches/batch-1/issue-ledger.json",
  "docs/qa/review/AI_REVIEW_PROGRESS.json",
  "docs/qa/review/ai-batches/batch-2/selection.json",
  "docs/qa/review/ai-batches/batch-2/blind-packets.json",
  "docs/qa/review/ai-batches/batch-2/pass-a.json",
  "docs/qa/review/ai-batches/batch-2/pass-b.json",
  "docs/qa/review/ai-batches/batch-2/pass-c.json",
  "docs/qa/review/ai-batches/batch-2/adjudication.json",
  "docs/qa/review/ai-batches/batch-2/summary.json",
  "docs/qa/review/ai-batches/batch-2/issue-ledger.json",
  "docs/qa/review/ai-batches/batch-2/reinforced-review-queue.json",
  "PROJECT_CONTEXT.md",
  "LEVIO_IMPLEMENTATION_PLAN.md",
  "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md",
  "LEVIO_PROJECT_PROGRESS.md",
  "lib/ai-decision-material/acceptance.ts",
  "lib/ai-decision-material/contracts.ts",
  "lib/ai-decision-material/evaluation.ts",
  "lib/ai-decision-material/fixtures.ts",
  "package.json",
  "scripts/dashboard-shell-landing-quality.mjs",
  "scripts/privacy-data-controls-shared-states-visual-quality.mjs",
  "scripts/saved-simulations-and-drafts-visual-quality.mjs",
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/generate-stage-9-human-review-package.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/generate-stage-9-ai-review-batch-1.mjs",
  "scripts/stage-9-ai-review-batch-1-quality.mjs",
  "scripts/generate-stage-9-ai-review-batch-2.mjs",
  "scripts/stage-9-ai-review-batch-2-quality.mjs",
  "scripts/visual-migration-closure-quality.mjs",
  "scripts/workspace-surfaces-quality.mjs",
]);
for (const path of [
  "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-3/${name}`),
  "scripts/generate-stage-9-ai-review-batch-3.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs",
  "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-4/${name}`),
  "scripts/generate-stage-9-ai-review-batch-4.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-5/${name}`),
  "scripts/generate-stage-9-ai-review-batch-5.mjs", "scripts/stage-9-ai-review-batch-5-quality.mjs",
  "docs/qa/review/AI_REVIEW_PRIMARY_CLOSURE.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-6/${name}`),
  "scripts/generate-stage-9-ai-review-batch-6.mjs", "scripts/stage-9-ai-review-batch-6-quality.mjs",
]) allowedDiff.add(path);
const tracked = execFileSync("git", ["diff", "--name-only", baseline], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const actualDiff = [...new Set([...tracked, ...untracked])].sort();
add("git-diff-bounded", actualDiff.every((path) => allowedDiff.has(path) || path.startsWith("docs/qa/review/ai-reinforced-batches/batch-1/") || ["docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md", "docs/qa/review/AI_REINFORCED_REVIEW_PROGRESS.json", "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json", "scripts/generate-stage-9-reinforced-ai-review-batch-1.mjs", "scripts/stage-9-reinforced-ai-review-batch-1-quality.mjs"].includes(path)), `Unexpected files: ${actualDiff.filter((path) => !allowedDiff.has(path)).join(", ")}`);
const reconciliationAllowed = new Set([
  "scripts/stage-9-ai-value-preservation-quality.mjs",
  "scripts/visual-migration-closure-quality.mjs",
  "scripts/stage-9-offline-dataset-coverage-quality.mjs",
  "scripts/generate-stage-9-human-review-package.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/generate-stage-9-ai-review-batch-1.mjs",
  "scripts/stage-9-ai-review-batch-1-quality.mjs",
  "scripts/generate-stage-9-ai-review-batch-2.mjs",
  "scripts/stage-9-ai-review-batch-2-quality.mjs",
  "lib/ai-decision-material/fixtures.ts",
  "lib/ai-decision-material/evaluation.ts",
  "docs/qa/LEVIO_EVALUATION_DATASET_QUALITY_THRESHOLDS.md",
  "docs/qa/LEVIO_STAGE_9_HUMAN_REVIEW_METHODOLOGY.md",
  "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md",
  "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json",
  "docs/qa/review/ai-batches/batch-1/selection.json",
  "docs/qa/review/ai-batches/batch-1/blind-packets.json",
  "docs/qa/review/ai-batches/batch-1/pass-a.json",
  "docs/qa/review/ai-batches/batch-1/pass-b.json",
  "docs/qa/review/ai-batches/batch-1/pass-c.json",
  "docs/qa/review/ai-batches/batch-1/adjudication.json",
  "docs/qa/review/ai-batches/batch-1/summary.json",
  "docs/qa/review/ai-batches/batch-1/issue-ledger.json",
  "docs/qa/review/AI_REVIEW_PROGRESS.json",
  "docs/qa/review/ai-batches/batch-2/selection.json",
  "docs/qa/review/ai-batches/batch-2/blind-packets.json",
  "docs/qa/review/ai-batches/batch-2/pass-a.json",
  "docs/qa/review/ai-batches/batch-2/pass-b.json",
  "docs/qa/review/ai-batches/batch-2/pass-c.json",
  "docs/qa/review/ai-batches/batch-2/adjudication.json",
  "docs/qa/review/ai-batches/batch-2/summary.json",
  "docs/qa/review/ai-batches/batch-2/issue-ledger.json",
  "docs/qa/review/ai-batches/batch-2/reinforced-review-queue.json",
  "package.json",
  "PROJECT_CONTEXT.md",
  "LEVIO_IMPLEMENTATION_PLAN.md",
  "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md",
  "LEVIO_PROJECT_PROGRESS.md",
]);
for (const path of [
  "docs/qa/review/AI_REVIEW_CROSS_BATCH_PATTERNS.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-3/${name}`),
  "scripts/generate-stage-9-ai-review-batch-3.mjs", "scripts/stage-9-ai-review-batch-3-quality.mjs",
  "docs/qa/review/AI_REVIEW_PATTERN_SATURATION.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-4/${name}`),
  "scripts/generate-stage-9-ai-review-batch-4.mjs", "scripts/stage-9-ai-review-batch-4-quality.mjs",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-5/${name}`),
  "scripts/generate-stage-9-ai-review-batch-5.mjs", "scripts/stage-9-ai-review-batch-5-quality.mjs",
  "docs/qa/review/AI_REVIEW_PRIMARY_CLOSURE.json",
  ...["selection.json", "blind-packets.json", "pass-a.json", "pass-b.json", "pass-c.json", "adjudication.json", "summary.json", "issue-ledger.json", "reinforced-review-queue.json"].map((name) => `docs/qa/review/ai-batches/batch-6/${name}`),
  "scripts/generate-stage-9-ai-review-batch-6.mjs", "scripts/stage-9-ai-review-batch-6-quality.mjs",
]) reconciliationAllowed.add(path);
const reconciliationTracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
const reconciliationDiff = [...new Set([...reconciliationTracked, ...untracked])].sort();
add("no-production-diff", reconciliationDiff.every((path) => reconciliationAllowed.has(path) || path.startsWith("docs/qa/review/ai-reinforced-batches/batch-1/") || ["docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md", "docs/qa/review/AI_REINFORCED_REVIEW_PROGRESS.json", "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json", "scripts/generate-stage-9-reinforced-ai-review-batch-1.mjs", "scripts/stage-9-reinforced-ai-review-batch-1-quality.mjs"].includes(path)), `Current reconciliation diff must contain only approved gate and canonical files. Unexpected files: ${reconciliationDiff.filter((path) => !reconciliationAllowed.has(path)).join(", ")}`);

for (const check of checks) {
  console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
}
for (const result of report.results.filter((item) => !item.passed)) {
  console.error(`FAIL fixture ${result.fixture_id}/${result.coverage_id}: ${result.hard_failures.join(",") || "expectation_mismatch"}`);
}
console.log(`LEDGER_EXAMPLE ${JSON.stringify(firstAcceptance?.ledger.find((entry) => entry.original_item_type === "benefit_or_opportunity"))}`);
console.log(`SILENT_DEGRADATION_BLOCKED ${JSON.stringify(unsupportedRecommendation?.ledger[0])}`);
console.log(`REPORT fixtures=${report.total_cases} passed=${report.passed_cases} coverage=${report.covered_categories}/${report.required_categories} silent_loss=${report.results.reduce((sum, item) => sum + item.metrics.silent_loss_count, 0)} network=${networkRequests}`);
console.log(`${checks.filter((check) => check.passed).length}/${checks.length} checks passed.`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
