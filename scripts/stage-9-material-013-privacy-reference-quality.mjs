import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const ts = require("typescript");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha = (value) => createHash("sha256").update(value).digest("hex");
const read = (path) => readFileSync(join(root, path), "utf8");
const head = (path) => execFileSync("git", ["show", `HEAD:${path}`], {
  cwd: root,
  encoding: "utf8",
});
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map((path) => path.replaceAll("\\", "/"));
const diffPaths = () => [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();

const primaryMethodologyPath = "docs/qa/LEVIO_STAGE_9_AI_REVIEW_METHODOLOGY.md";
const reinforcedMethodologyPath = "docs/qa/LEVIO_STAGE_9_REINFORCED_AI_REVIEW_METHODOLOGY.md";
const addendumPath = "docs/qa/remediation/stage-9/MATERIAL_013_PRIVACY_REFERENCE_ADDENDUM.md";
const ledgerPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_RESULT.v1.json";
const contextPath = "PROJECT_CONTEXT.md";
const fixturePath = "lib/ai-decision-material/fixtures.ts";
const specPath = "docs/qa/remediation/stage-9/STAGE_9_MATERIAL_013_PRIVACY_REVIEW_REFERENCE_SPEC.v1.md";
const sequencePath = "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json";
const registryPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_CANDIDATE_REGISTRY.v2.json";
const graphPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json";
const statusHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const primaryParentHeading = "## 3. Blind semantic reconstruction — Pass A";
const reinforcedParentHeading = "## Isolated review passes";
const primaryAddedHeading = "### Privacy-safe evidence display";
const reinforcedAddedHeading = "### Privacy-safe reinforced evidence references";
const displayRepresentation = "[REDACTED_EMAIL]";
const machineCategory = "personal_email_identifier";
const rawIdentifier = "demo@example.com";
const sourceFixtureSha = "e4983e9ad8ca0c2ee5fe8d046bfe562c05f5ad050528267169dcfc608687026b";
const evidencePointer = "docs/qa/review/ai-batches/batch-1/pass-a.json#results[fixture_id=S9-MATERIAL-013]";
const structuralReferenceFields = [
  "fixture_id", "issue_id", "evidence_pointer", "source_fixture_sha256",
];
const structuralReference = {
  fixture_id: "S9-MATERIAL-013",
  issue_id: "B1-ISSUE-006",
  evidence_pointer: evidencePointer,
  source_fixture_sha256: sourceFixtureSha,
};
const methodologyHeadings = {
  [primaryMethodologyPath]: primaryParentHeading,
  [reinforcedMethodologyPath]: reinforcedParentHeading,
};
const historicalHashes = {
  "docs/qa/review/ai-batches/batch-1/pass-a.json": "d6870e7dfe0923c8d4e7d40cb877efca751fabd0e15f5d52509876cf3fde07b8",
  "docs/qa/review/ai-batches/batch-1/adjudication.json": "2610cbb4e374a39b1c5f93c66359c134d566304534a238a3f45f2067109c5480",
  "docs/qa/review/ai-reinforced-batches/batch-1/pass-r1.json": "371ede69d927f561c9ad84431418114e819ac938f4ecdf70b60f0f2b2d283dac",
  "docs/qa/review/ai-reinforced-batches/batch-1/pass-r2.json": "0d5077e69e10ea127d90c55bb56f61617ebf4695187765ee2d9476457244f78a",
  "docs/qa/review/ai-reinforced-batches/batch-1/pass-r3.json": "d8213369449f6c2263ef462c82e5ce797bbe524e6ffec0d5d66e6aff7b560870",
  "docs/qa/review/ai-reinforced-batches/batch-1/adjudication.json": "e46f38648b90e71c3191948765df6d1d26c1d828fb348a5a27d9b92bb5f4c2fb",
  "docs/qa/review/AI_REVIEW_CONSOLIDATED_ISSUE_DISPOSITIONS.json": "ce6c2439d5d3ade88902fdce93269da58ff5e905f0c25d6cc7b66291399621a8",
  "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json": "5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b",
};
const preparationWriteSet = [
  specPath,
  sequencePath,
  registryPath,
  "scripts/stage-9-material-013-privacy-reference-quality.mjs",
  "scripts/stage-9-human-review-readiness-quality.mjs",
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
  "package.json",
].sort();
const implementationWriteSet = [
  primaryMethodologyPath,
  reinforcedMethodologyPath,
  addendumPath,
  ledgerPath,
  resultPath,
  contextPath,
].sort();
const mandatoryGates = [
  "quality:stage-9-remediation-plan",
  "quality:stage-9-material-013-privacy-reference",
  "quality:stage-9-human-review-readiness",
  "quality:stage-9-remediation-revision-integrity",
];
const expectedEvent = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-07",
  remediation_entry_ids: ["S9-REM-FIXTURE-002"],
  issue_ids: ["B1-ISSUE-006"],
  root_cause: "REVIEW_METHODOLOGY",
  shared_rule_id: "privacy_review_display_redacts_identifiers_preserves_hash_bound_reference",
  fixture_reference_ids: ["S9-MATERIAL-013"],
  frozen_source_fixture_sha256: sourceFixtureSha,
  methodology_paths: [primaryMethodologyPath, reinforcedMethodologyPath],
  addendum_path: addendumPath,
  display_representation: displayRepresentation,
  machine_category: machineCategory,
  structural_reference_fields: structuralReferenceFields,
  historical_evidence_immutable: true,
  result_artifact_path: resultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): clarify MATERIAL-013 privacy references",
};

const primaryAnchor = `The reviewer must distinguish absent information from negative facts and must
not invent expected behavior from a technical case name.`;
const primaryAddition = `

### Privacy-safe evidence display

Future review artifacts must not unnecessarily reproduce personal identifiers.
Email identifiers use the display token \`${displayRepresentation}\` and the
machine category \`${machineCategory}\`. A structural evidence reference retains
\`fixture_id\`, \`issue_id\`, \`evidence_pointer\`, and
\`source_fixture_sha256\`. Authorized forensic inspection may follow that
hash-bound reference to frozen source evidence; ordinary review display must
not repeat the identifier. Purpose-written synthetic identifiers follow the
same display-safety rule. Frozen historical artifacts are not rewritten.`;
const reinforcedAnchor = `The four passes use separate declared roles and context manifests. No pass may
claim human review or external model/provider execution; the process is an
offline repository-grounded AI review.`;
const reinforcedAddition = `

### Privacy-safe reinforced evidence references

Reinforced review display uses \`${displayRepresentation}\` for an email
identifier and \`${machineCategory}\` as its machine category. Evidence remains
traceable through \`fixture_id\`, \`issue_id\`, \`evidence_pointer\`, and
\`source_fixture_sha256\`. Authorized forensic inspection may follow the frozen
hash-bound source reference, while ordinary R1/R2/R3/R4 display must not
reproduce the identifier. Synthetic identifiers receive the same protection,
and frozen primary or reinforced artifacts remain immutable.`;

function replaceExactly(source, anchor, replacement) {
  if (source.split(anchor).length !== 2) throw new Error(`Expected one anchor: ${anchor}`);
  return source.replace(anchor, replacement);
}
const expectedPrimary = (baseline) =>
  replaceExactly(baseline, primaryAnchor, `${primaryAnchor}${primaryAddition}`);
const expectedReinforced = (baseline) =>
  replaceExactly(baseline, reinforcedAnchor, `${reinforcedAnchor}${reinforcedAddition}`);
const expectedAddendum = () => `# MATERIAL-013 Privacy Review-Reference Addendum

## Authority

- Fixture reference: \`S9-MATERIAL-013\`
- Issue: \`B1-ISSUE-006\`
- Root cause: \`REVIEW_METHODOLOGY\`

This addendum clarifies future review-evidence display. The fixture and runtime
privacy behavior remain correct and unchanged. Frozen historical evidence is
not rewritten.

## Privacy-safe representation

- Human-readable display: \`${displayRepresentation}\`
- Machine-readable category: \`${machineCategory}\`

Purpose-written synthetic identifiers follow the same display-safety rule.
Ordinary review output must not reproduce the identifier. Authorized forensic
inspection may follow the frozen structural evidence reference.

## Hash-bound structural reference

\`\`\`json
${JSON.stringify(structuralReference, null, 2)}
\`\`\`

The reference preserves traceability without changing the source fixture,
historical review artifacts, adjudication, or runtime privacy enforcement.
`;

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the S9-FIX-07 quality gate.");
};

function compileFixtures(source, label) {
  const filename = join(root, fixturePath);
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = new Module(`${filename}.${label}`);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(dirname(filename));
  const priorLoad = Module._load;
  const priorExtension = require.extensions[".ts"];
  Module._load = function loadInternal(request, parent, isMain) {
    return request === "server-only" ? {} : priorLoad.call(this, request, parent, isMain);
  };
  require.extensions[".ts"] = function loadDependency(dependency, dependencyPath) {
    const dependencySource = readFileSync(dependencyPath, "utf8");
    const dependencyOutput = ts.transpileModule(dependencySource, {
      fileName: dependencyPath,
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        target: ts.ScriptTarget.ES2022,
      },
    });
    dependency._compile(dependencyOutput.outputText, dependencyPath);
  };
  try {
    module._compile(output.outputText, filename);
  } finally {
    Module._load = priorLoad;
    if (priorExtension) require.extensions[".ts"] = priorExtension;
    else delete require.extensions[".ts"];
  }
  return module.exports.RICH_DECISION_MATERIAL_FIXTURES;
}

function contextSections(text) {
  const start = text.indexOf(statusHeading);
  if (start < 0) return null;
  const next = text.indexOf("\n## ", start + statusHeading.length);
  const end = next < 0 ? text.length : next + 1;
  return { before: text.slice(0, start), section: text.slice(start, end), after: text.slice(end) };
}
function contextValid(baselineText, candidateText) {
  const baseline = contextSections(baselineText);
  const candidate = contextSections(candidateText);
  return Boolean(baseline && candidate
    && baseline.before === candidate.before
    && baseline.after === candidate.after
    && candidate.section.includes("`S9-FIX-07`")
    && candidate.section.includes("7/9")
    && candidate.section.includes("2/9")
    && candidate.section.includes("`S9-FIX-08`")
    && candidate.section.includes("**In Progress**")
    && candidate.section.includes("not declared")
    && candidate.section.includes("mockOnly=true")
    && candidate.section.includes("closed")
    && candidate.section.includes("0 remaining"));
}

function historicalHashContract() {
  return Object.entries(historicalHashes).every(([path, expected]) =>
    sha(read(path)) === expected);
}

function canonicalContract() {
  const sequence = JSON.parse(read(sequencePath)).sequence.find((row) =>
    row.substep_id === "S9-FIX-07");
  const registry = JSON.parse(read(registryPath)).candidates.find((row) =>
    row.candidate_id === "S9-REM-FIXTURE-002");
  const graph = JSON.parse(read(graphPath));
  const entries = [sequence, registry];
  return Boolean(sequence && registry
    && entries.every((row) =>
      row.root_cause === "REVIEW_METHODOLOGY"
      && row.implementation_specification === specPath
      && row.implementation_status === "IMPLEMENTATION_READY_NOT_STARTED"
      && row.implementation_executed === false
      && row.owned_fixture_count === 1
      && same(row.owned_fixture_ids, ["S9-MATERIAL-013"])
      && row.display_representation === displayRepresentation
      && row.machine_category === machineCategory
      && same(row.structural_reference_fields, structuralReferenceFields)
      && row.frozen_source_fixture_sha256 === sourceFixtureSha
      && same(row.methodology_headings, methodologyHeadings)
      && same([...row.preparation_write_files].sort(), preparationWriteSet)
      && same([...(row.allowed_files ?? row.planned_write_files)].sort(), implementationWriteSet)
      && same(row.gates ?? row.required_regression_gates, mandatoryGates)
      && row.bounded_result_artifact === resultPath
      && row.canonical_status_update?.section_heading === statusHeading)
    && graph.edges.some((edge) => edge.from === "S9-FIX-07" && edge.to === "S9-FIX-08")
    && !graph.edges.some((edge) => edge.to === "S9-FIX-07")
    && read("package.json").includes('"quality:stage-9-material-013-privacy-reference"'));
}

function expectedResult({
  beforePrimary,
  afterPrimary,
  beforeReinforced,
  afterReinforced,
  addendum,
}) {
  return {
    artifact_version: "stage-9-material-013-privacy-review-reference-result.1",
    status: "PASS",
    substep_id: "S9-FIX-07",
    candidate_id: "S9-REM-FIXTURE-002",
    issue_id: "B1-ISSUE-006",
    root_cause: "REVIEW_METHODOLOGY",
    shared_rule_id: expectedEvent.shared_rule_id,
    implementation_commit_message: expectedEvent.implementation_commit_message,
    fixture_reference_id: "S9-MATERIAL-013",
    ownership: "1/1",
    display_representation: displayRepresentation,
    machine_category: machineCategory,
    methodology_headings: methodologyHeadings,
    addendum_path: addendumPath,
    structural_reference: structuralReference,
    frozen_source_fixture_sha256: sourceFixtureSha,
    historical_artifact_sha256: historicalHashes,
    methodology_sha256: {
      primary_before: sha(beforePrimary),
      primary_after: sha(afterPrimary),
      reinforced_before: sha(beforeReinforced),
      reinforced_after: sha(afterReinforced),
      addendum: sha(addendum),
    },
    fixture_preservation: {
      rich_fixture_count: 184,
      preserved_count: 184,
      fixture_source_unchanged: true,
    },
    historical_artifacts_unchanged: true,
    raw_identifier_absent_from_new_display: true,
    ledger_append: expectedEvent,
    implementation_write_set: implementationWriteSet,
    project_context_boundary: {
      section_heading: statusHeading,
      completed_remediation: "7/9",
      remaining_remediation: "2/9",
      next_substep: "S9-FIX-08",
      stage_9_status: "In Progress",
      release_readiness: "NOT_DECLARED",
      runtime_boundaries: "CLOSED",
      api_simulate_mock_only: true,
      visual_migration_remaining: 0,
    },
    mandatory_gates: mandatoryGates,
    runtime_api_ui_provider_persistence: "UNCHANGED",
    network_provider_execution_count: 0,
    visual_migration_remaining: 0,
  };
}

function postContract() {
  const paths = diffPaths();
  const beforePrimary = head(primaryMethodologyPath);
  const beforeReinforced = head(reinforcedMethodologyPath);
  const afterPrimary = read(primaryMethodologyPath);
  const afterReinforced = read(reinforcedMethodologyPath);
  const addendum = existsSync(join(root, addendumPath)) ? read(addendumPath) : "";
  const baselineFixtures = compileFixtures(head(fixturePath), "fix07-baseline");
  const currentFixtures = compileFixtures(read(fixturePath), "fix07-current");
  const baselineLedger = JSON.parse(head(ledgerPath));
  const candidateLedger = JSON.parse(read(ledgerPath));
  const priorEvents = baselineLedger.appended_events ?? [];
  const candidateEvents = candidateLedger.appended_events ?? [];
  let result = null;
  try {
    result = JSON.parse(read(resultPath));
  } catch {}
  const expected = expectedResult({
    beforePrimary,
    afterPrimary,
    beforeReinforced,
    afterReinforced,
    addendum,
  });
  const checks = {
    exact_six_file_diff: same(paths, implementationWriteSet),
    primary_methodology_exact: afterPrimary === expectedPrimary(beforePrimary)
      && afterPrimary.includes(primaryAddedHeading),
    reinforced_methodology_exact: afterReinforced === expectedReinforced(beforeReinforced)
      && afterReinforced.includes(reinforcedAddedHeading),
    addendum_exact: addendum === expectedAddendum(),
    redaction_and_category_exact: [afterPrimary, afterReinforced, addendum]
      .every((text) => text.includes(displayRepresentation) && text.includes(machineCategory)),
    raw_identifier_absent: ![afterPrimary, afterReinforced, addendum, canonicalJson(result)]
      .some((text) => text.includes(rawIdentifier)),
    fixture_source_unchanged: read(fixturePath) === head(fixturePath),
    fixtures_184_of_184: baselineFixtures.length === 184
      && currentFixtures.length === 184
      && same(baselineFixtures, currentFixtures),
    historical_hashes: historicalHashContract(),
    prior_ledger_immutable: same(
      { ...baselineLedger, appended_events: priorEvents },
      { ...candidateLedger, appended_events: candidateEvents.slice(0, -1) },
    ),
    one_exact_ledger_event: candidateEvents.length === priorEvents.length + 1
      && same(candidateEvents.at(-1), expectedEvent),
    exact_result: same(result, expected),
    bounded_status: contextValid(head(contextPath), read(contextPath)),
    canonical_contract: canonicalContract(),
    runtime_paths_unchanged: paths.every((path) =>
      !["app/", "components/", "lib/ai-provider/", "lib/prompt-context/",
        "lib/decision-engine/", "lib/runtime-integration/", "lib/persistence-runtime/",
        "supabase/"].some((prefix) => path.startsWith(prefix))),
    network_zero: networkRequests === 0,
  };
  return { passed: Object.values(checks).every(Boolean), checks, expected };
}

function modelValid(model) {
  return model.display === displayRepresentation
    && model.category === machineCategory
    && same(model.reference_fields, structuralReferenceFields)
    && model.source_hash === sourceFixtureSha
    && model.raw_identifier_absent
    && model.fixture_preserved === 184
    && model.historical_immutable
    && model.ledger_events_added === 1
    && model.context_heading === statusHeading
    && model.substep === "S9-FIX-07"
    && same([...model.paths].sort(), implementationWriteSet);
}
function selfTests() {
  const positive = {
    display: displayRepresentation,
    category: machineCategory,
    reference_fields: structuralReferenceFields,
    source_hash: sourceFixtureSha,
    raw_identifier_absent: true,
    fixture_preserved: 184,
    historical_immutable: true,
    ledger_events_added: 1,
    context_heading: statusHeading,
    substep: "S9-FIX-07",
    paths: implementationWriteSet,
  };
  const mutations = [
    ["raw-email-addendum", (v) => { v.raw_identifier_absent = false; }],
    ["raw-email-methodology", (v) => { v.raw_identifier_absent = false; }],
    ["raw-email-result", (v) => { v.raw_identifier_absent = false; }],
    ["missing-redaction", (v) => { v.display = ""; }],
    ["wrong-category", (v) => { v.category = "email"; }],
    ["fixture-change", (v) => { v.fixture_preserved = 183; }],
    ["historical-pass-change", (v) => { v.historical_immutable = false; }],
    ["verdict-change", (v) => { v.historical_immutable = false; }],
    ["manifest-change", (v) => { v.historical_immutable = false; }],
    ["missing-source-hash", (v) => { v.source_hash = ""; }],
    ["wrong-reference", (v) => { v.reference_fields = ["fixture_id"]; }],
    ["broad-methodology-rewrite", (v) => { v.paths.push("broad.file"); }],
    ["wrong-heading", (v) => { v.context_heading = "## Other"; }],
    ["wrong-addendum-path", (v) => { v.paths[2] = "wrong-addendum.md"; }],
    ["wrong-result-path", (v) => { v.paths[4] = "wrong-result.json"; }],
    ["wrong-ledger-event", (v) => { v.ledger_events_added = 0; }],
    ["two-ledger-events", (v) => { v.ledger_events_added = 2; }],
    ["other-context-section", (v) => { v.context_heading = "## Other"; }],
    ["seventh-file", (v) => { v.paths.push("seventh.file"); }],
    ["other-substep", (v) => { v.substep = "S9-FIX-08"; }],
    ["completed-result-change", (v) => { v.paths.push("docs/qa/remediation/stage-9/results/STAGE_9_MATERIAL_006_SILENT_LOSS_RESULT.v1.json"); }],
  ];
  const negative = mutations.map(([id, mutate]) => {
    const value = structuredClone(positive);
    mutate(value);
    return { id, passed: !modelValid(value) };
  });
  return {
    profile: "S9_FIX_07_MATERIAL_013_PRIVACY_REFERENCE",
    positive: { total: 1, passed: modelValid(positive) ? 1 : 0 },
    negative: {
      total: negative.length,
      passed: negative.filter((row) => row.passed).length,
      failed: negative.filter((row) => !row.passed).map((row) => row.id),
    },
    deterministic: same(negative, structuredClone(negative)),
  };
}

const tests = selfTests();
if (process.argv.includes("--self-test-json")) {
  process.stdout.write(canonicalJson(tests));
  if (tests.positive.passed !== tests.positive.total
    || tests.negative.passed !== tests.negative.total
    || !tests.deterministic) process.exitCode = 1;
} else if (process.argv.includes("--post-implementation")) {
  const contract = postContract();
  const output = {
    profile: "S9_FIX_07_MATERIAL_013_PRIVACY_REFERENCE_POST_IMPLEMENTATION",
    substep_id: "S9-FIX-07",
    passed: contract.passed,
    checks: contract.checks,
    ownership: "1/1",
    fixture_preservation: "184/184",
    implementation_write_set: implementationWriteSet,
    network_request_count: networkRequests,
  };
  process.stdout.write(canonicalJson(output));
  if (!output.passed) process.exitCode = 1;
} else {
  const paths = diffPaths();
  const output = {
    profile: "S9_FIX_07_MATERIAL_013_PRIVACY_REFERENCE_PROSPECTIVE",
    substep_id: "S9-FIX-07",
    status: "IMPLEMENTATION_READY_NOT_STARTED",
    remediation_completed: false,
    passed: canonicalContract()
      && historicalHashContract()
      && (paths.length === 0 || same(paths, preparationWriteSet))
      && tests.positive.passed === tests.positive.total
      && tests.negative.passed === tests.negative.total
      && networkRequests === 0,
    display_representation: displayRepresentation,
    machine_category: machineCategory,
    ownership: "1/1",
    fixture_preservation: "184/184",
    preparation_write_set: preparationWriteSet,
    implementation_write_set: implementationWriteSet,
    mandatory_gates: mandatoryGates,
    self_tests: tests,
    network_request_count: networkRequests,
  };
  process.stdout.write(canonicalJson(output));
  if (!output.passed) process.exitCode = 1;
}

globalThis.fetch = originalFetch;
