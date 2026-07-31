import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const specPath = "docs/qa/stage-9/STAGE_9_BOUNDED_RUNTIME_READINESS_EVIDENCE_SPEC.v1.md";
const manifestPath = "docs/qa/stage-9/STAGE_9_BOUNDED_RUNTIME_READINESS_EVIDENCE_MANIFEST.v1.json";
const resultPath = "docs/qa/stage-9/results/STAGE_9_BOUNDED_RUNTIME_READINESS_EVIDENCE_PREPARATION_RESULT.v1.json";
const gatePath = "scripts/stage-9-bounded-runtime-readiness-evidence-quality.mjs";
const routePath = "app/api/simulate/route.ts";
const fixtureSourcePath = "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts";
const writeSet = [specPath, manifestPath, resultPath, gatePath, "package.json"];
const expectedHashes = {
  "docs/qa/stage-9/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION.v1.json": "52faf418654566ce066b87a9177ae417feb3a4424b5a172958bbbb77d274625f",
  "docs/qa/stage-9/results/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_RESULT.v1.json": "fc99e63aee513444707f65d9832ed8e1ce6c648e3688e600555701712f87e3d5",
  "lib/ai-provider/openai-synthetic-risk-adapter.ts": "4450f0190219fc875669146c6bfa575882b70fe010682e437b9ab62c9f5802a6",
  "lib/ai-provider/openai-synthetic-risk-adapter.server.ts": "5c478f0a814b11ecfce2e9ae9eb7b7fb288560562da7ed28662d0ed1da5d2eef",
  [fixtureSourcePath]: "68f4e3a144a6ce34c467fe24645bdfdbf2a5311eed9e9b70d1665131d0ad90a3",
  [routePath]: "9b29fdbfbcb78d539abca6a9dcc9bdbfaa5b396a6d8b514d9850eb93d1c94d11",
};
const boundaryIds = [
  "LIVE_OPENAI_PROVIDER_RUNTIME", "PROMPT_CONTEXT_RUNTIME", "DECISION_ENGINE_PRE_PROVIDER",
  "DECISION_ENGINE_POST_PROVIDER", "AI_API", "AI_UI", "PERSISTENCE_COUPLING",
  "SUPABASE_AUTH_EXPANSION", "LIVE_AI_OBSERVABILITY", "PRODUCTION_DEPLOYMENT",
  "API_SIMULATE_MOCK_ONLY",
];
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const clone = (value) => structuredClone(value);
const sortValue = (value) => Array.isArray(value) ? value.map(sortValue)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]))
    : value;
const serialize = (value) => `${JSON.stringify(sortValue(value), null, 2)}\n`;
const lines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map((path) => path.replaceAll("\\", "/"));
const diffPaths = () => [...new Set([
  ...lines("diff", "--name-only", "HEAD"),
  ...lines("ls-files", "--others", "--exclude-standard"),
])].sort();
const sameSet = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const ts = require("typescript");
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
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

function manifestErrors(value, changed = writeSet) {
  const errors = [];
  const config = value.future_provider_configuration ?? {};
  const ceilings = value.execution_ceiling ?? {};
  const state = value.current_state ?? {};
  const privacy = value.privacy_assertions ?? {};
  const fixture = value.selected_synthetic_fixtures?.[0] ?? {};
  const rules = value.rules ?? {};
  if (!sameSet(changed, writeSet)) errors.push("exact-five-file-write-set");
  if (value.authorization?.state !== "NOT_AUTHORIZED") errors.push("authorization");
  if (state.provider_executions !== 0) errors.push("provider-executions");
  if (state.provider_requests !== 0) errors.push("provider-requests");
  if (state.provider_cost_usd !== 0) errors.push("provider-cost");
  if (privacy.network_execution_count !== 0) errors.push("network-execution");
  if (privacy.api_key_access_count !== 0) errors.push("api-key-access");
  if (ceilings.max_bounded_validation_executions !== 1) errors.push("execution-ceiling");
  if (ceilings.max_provider_requests !== 2) errors.push("request-ceiling");
  if (ceilings.max_total_provider_cost_usd !== 0.03) errors.push("cost-ceiling");
  if (ceilings.overall_timeout_ms !== 35000) errors.push("timeout-ceiling");
  if (config.exact_model_allowlist?.length !== 1 || config.exact_model_allowlist[0] !== "gpt-5.6-terra") errors.push("model-allowlist");
  if (config.server_only !== true) errors.push("server-only");
  if (config.tools_enabled !== false) errors.push("tools-disabled");
  if (config.retries !== 0) errors.push("retries-zero");
  if (config.store !== false) errors.push("store-false");
  if (config.background !== false || config.stream !== false) errors.push("foreground-nonstreaming");
  if (state.api_simulate_mock_only !== true) errors.push("mock-only");
  if (state.runtime_boundaries !== "CLOSED") errors.push("runtime-closed");
  for (const key of ["no_ui_integration", "no_public_api_integration", "no_persistence", "no_auth_expansion", "no_supabase_coupling", "no_production_deployment", "no_user_traffic", "no_background_execution"]) {
    if (privacy[key] !== true) errors.push(key);
  }
  if (privacy.synthetic_non_personal_only !== true || privacy.no_personal_data !== true) errors.push("synthetic-non-personal-only");
  if (value.selected_synthetic_fixtures?.length !== 1) errors.push("minimal-fixture-set");
  if (fixture.classification !== "synthetic_non_personal") errors.push("fixture-classification");
  if (!/^[a-f0-9]{64}$/.test(fixture.fixture_input_sha256 ?? "")) errors.push("fixture-hash");
  if (!/^[a-f0-9]{64}$/.test(fixture.source_sha256 ?? "")) errors.push("fixture-source-hash");
  if (!fixture.proof_of_non_personal_synthetic_status) errors.push("fixture-synthetic-proof");
  for (const key of ["pass", "fail", "blocked", "immediate_abort"]) {
    if (!Array.isArray(rules[key]) || rules[key].length === 0) errors.push(`${key}-rules`);
  }
  if (!value.kill_switch_and_rollback?.api_simulate_mock_only_after_every_verdict ||
      !value.kill_switch_and_rollback?.runtime_remains_closed_pending_separate_decision) errors.push("kill-switch-rollback");
  return [...new Set(errors)];
}

const manifest = json(manifestPath);
const result = json(resultPath);
const spec = read(specPath);
const changed = diffPaths();
const hashBindingsValid = Object.entries(expectedHashes).every(([path, expected]) => sha(read(path)) === expected);
const decision = json("docs/qa/stage-9/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION.v1.json");
const decisionResult = json("docs/qa/stage-9/results/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_RESULT.v1.json");
const route = read(routePath);
const fixtureModule = require(join(root, fixtureSourcePath));
const selectedFixture = fixtureModule.SYNTHETIC_RISK_EVALUATION_FIXTURES.find((item) => item.case_id === "S9-EVAL-001");
const selectedFixtureHash = selectedFixture ? sha(JSON.stringify(sortValue(selectedFixture.input))) : null;

add("exact-five-file-allowlist", sameSet(changed, writeSet), `${changed.length} changed files.`);
add("specification-required-sections", ["## Current state", "## Future authorization state and owner approval", "## Future maximum execution scope", "## Provider boundaries", "## Input evidence", "## Privacy and logging boundaries", "## Required future evidence", "## PASS conditions", "## FAIL conditions", "## BLOCKED conditions", "## Immediate abort conditions", "## Kill switch and rollback", "## Determinism and exact write set"].every((token) => spec.includes(token)), "All contract sections are present.");
add("specification-required-boundaries", ["NOT_AUTHORIZED", "server-only", "store:false", "tools:[]", "retries `0`", "$0.03", "two provider requests", "synthetic non-personal", "mockOnly=true", ...writeSet].every((token) => spec.includes(token)), "Required scope and exact write set are explicit.");
add("manifest-schema-and-policy", manifestErrors(manifest, changed).length === 0, manifestErrors(manifest, changed).join(", ") || "Manifest policy valid.");
add("deterministic-manifest", serialize(manifest) === read(manifestPath), "Manifest serialization is recursively sorted.");
add("current-commit-binding", manifest.current_commit === execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), manifest.current_commit);
add("decision-and-source-hash-binding", hashBindingsValid && Object.entries(manifest.current_decision_artifacts_sha256).every(([path, hash]) => expectedHashes[path] === hash) && Object.entries(manifest.candidate_adapter_sha256).every(([path, hash]) => expectedHashes[path] === hash), "Decision, adapter, fixture source, and route hashes match.");
add("current-decision-binding", decision.decision_disposition === "DEFERRED_PENDING_RUNTIME_EVIDENCE" && decision.stage_9_completion_verdict === "KEEP_IN_PROGRESS" && decision.release_readiness_verdict === "NOT_DECLARED" && decision.runtime_boundaries.length === 11 && decision.runtime_boundaries.every((item) => item.status === "CLOSED") && decisionResult.status === "PASS", "Canonical decision remains deferred and closed.");
add("fixture-input-hash-binding", selectedFixtureHash === manifest.selected_synthetic_fixtures[0].fixture_input_sha256 && sha(read(fixtureSourcePath)) === manifest.selected_synthetic_fixtures[0].source_sha256, selectedFixtureHash ?? "fixture missing");
add("authorization-not-authorized", manifest.authorization.state === "NOT_AUTHORIZED", manifest.authorization.state);
add("zero-provider-network-key-access", manifest.current_state.provider_executions === 0 && manifest.current_state.provider_requests === 0 && manifest.current_state.provider_cost_usd === 0 && manifest.privacy_assertions.network_execution_count === 0 && manifest.privacy_assertions.api_key_access_count === 0, "All preparation execution counters are zero.");
add("exact-execution-ceilings", manifest.execution_ceiling.max_bounded_validation_executions === 1 && manifest.execution_ceiling.max_provider_requests === 2 && manifest.execution_ceiling.max_total_provider_cost_usd === 0.03 && manifest.execution_ceiling.overall_timeout_ms === 35000, "1 execution, 2 requests, $0.03, 35000 ms.");
add("provider-privacy-configuration", manifest.future_provider_configuration.server_only && manifest.future_provider_configuration.store === false && manifest.future_provider_configuration.tools_enabled === false && manifest.future_provider_configuration.retries === 0 && manifest.privacy_assertions.synthetic_non_personal_only, "Provider and privacy configuration is closed and bounded.");
add("no-runtime-coupling", ["no_ui_integration", "no_public_api_integration", "no_persistence", "no_auth_expansion", "no_supabase_coupling", "no_production_deployment", "no_user_traffic", "no_background_execution"].every((key) => manifest.privacy_assertions[key] === true), "No route/UI/auth/persistence/deployment coupling.");
add("api-simulate-mock-only", sha(route) === expectedHashes[routePath] && /mockOnly:\s*true/.test(route) && manifest.current_state.api_simulate_mock_only === true, "Route bytes unchanged and mockOnly=true.");
add("runtime-boundaries-closed", manifest.current_state.runtime_boundaries === "CLOSED" && boundaryIds.every((id) => decision.runtime_boundaries.some((item) => item.boundary_id === id && item.status === "CLOSED")), "All 11 boundaries remain CLOSED.");
add("verdict-and-abort-rules", ["pass", "fail", "blocked", "immediate_abort"].every((key) => manifest.rules[key]?.length > 0), "PASS/FAIL/BLOCKED/abort rules are defined.");
add("required-future-evidence", manifest.required_future_evidence.length === 20 && ["provider_request_accepted", "structured_output_compatibility", "schema_validation", "latency_and_timeout", "token_usage", "actual_cost", "error_normalization", "kill_switch_availability", "rollback_readiness"].every((item) => manifest.required_future_evidence.includes(item)), `${manifest.required_future_evidence.length} evidence requirements.`);
add("kill-switch-and-rollback", manifest.kill_switch_and_rollback.kill_switch === "STOP_INVOCATION_AND_DISABLE_LEVIO_REAL_AI_DEV_ENABLED" && manifest.kill_switch_and_rollback.runtime_remains_closed_pending_separate_decision === true && manifest.kill_switch_and_rollback.api_simulate_mock_only_after_every_verdict === true, "Fail-closed kill switch and rollback are explicit.");
add("no-unstable-or-secret-artifact-data", !/(?:\/Users\/|\/private\/|[A-Za-z]:\\\\|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{8,}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/m.test(`${spec}\n${read(manifestPath)}\n${read(resultPath)}`), "No absolute paths, secret-like values, or timestamps.");
add("package-command", json("package.json").scripts["quality:stage-9-bounded-runtime-readiness-evidence"] === "node scripts/stage-9-bounded-runtime-readiness-evidence-quality.mjs", "Dedicated package command is exact.");
add("result-artifact-consistency", result.status === "PASS" && result.execution_write_set?.length === 5 && sameSet(result.execution_write_set, writeSet) && result.specification_sha256 === sha(spec) && result.manifest_sha256 === sha(read(manifestPath)) && result.authorization_state === "NOT_AUTHORIZED" && result.provider_execution_count === 0 && result.provider_request_count === 0 && result.provider_cost_usd === 0 && result.network_execution_count === 0 && result.api_key_access_count === 0 && result.runtime_source_diff_outside_write_set === 0 && result.api_simulate_mock_only === true && result.all_runtime_boundaries_closed === true && result.deterministic_serialization === true && result.positive_self_tests === "PASS" && result.negative_self_tests === "PASS" && result.git_diff_check === "PASS", "Preparation result binds the specification and manifest.");
add("deterministic-result", serialize(result) === read(resultPath), "Result serialization is recursively sorted.");

const negativeCases = [
  ["authorization-approved", (x) => { x.authorization.state = "APPROVED"; }],
  ["provider-executions-positive", (x) => { x.current_state.provider_executions = 1; }],
  ["provider-requests-positive", (x) => { x.current_state.provider_requests = 1; }],
  ["provider-cost-positive", (x) => { x.current_state.provider_cost_usd = 0.01; }],
  ["missing-fixture-hash", (x) => { delete x.selected_synthetic_fixtures[0].fixture_input_sha256; }],
  ["personal-data-fixture", (x) => { x.selected_synthetic_fixtures[0].classification = "personal"; }],
  ["tools-enabled", (x) => { x.future_provider_configuration.tools_enabled = true; }],
  ["retries-positive", (x) => { x.future_provider_configuration.retries = 1; }],
  ["store-true", (x) => { x.future_provider_configuration.store = true; }],
  ["model-outside-allowlist", (x) => { x.future_provider_configuration.exact_model_allowlist = ["not-allowlisted"]; }],
  ["request-ceiling-above-two", (x) => { x.execution_ceiling.max_provider_requests = 3; }],
  ["cost-ceiling-above-three-cents", (x) => { x.execution_ceiling.max_total_provider_cost_usd = 0.04; }],
  ["mock-only-false", (x) => { x.current_state.api_simulate_mock_only = false; }],
  ["runtime-boundary-open", (x) => { x.current_state.runtime_boundaries = "OPEN"; }],
  ["ui-api-persistence-coupling", (x) => { x.privacy_assertions.no_ui_integration = false; x.privacy_assertions.no_public_api_integration = false; x.privacy_assertions.no_persistence = false; }],
];
let negativePassed = 0;
for (const [id, mutate] of negativeCases) {
  const candidate = clone(manifest);
  mutate(candidate);
  const rejected = manifestErrors(candidate, writeSet).length > 0;
  if (rejected) negativePassed += 1;
  add(`negative-${id}`, rejected, rejected ? "Rejected as required." : "Invalid mutation was accepted.");
}
add("negative-sixth-changed-file", manifestErrors(clone(manifest), [...writeSet, "UNAUTHORIZED_SIXTH_FILE"]).includes("exact-five-file-write-set"), "Sixth file is rejected.");
add("positive-self-test", manifestErrors(clone(manifest), writeSet).length === 0, "Canonical manifest is accepted.");
add("negative-self-test-union", negativePassed === negativeCases.length, `${negativePassed}/${negativeCases.length} mutated manifests rejected.`);

for (const check of checks) {
  console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
}
console.log(`REPORT positive=${checks.filter((item) => item.passed).length}/${checks.length} negative=${negativePassed + 1}/${negativeCases.length + 1} provider=0 network=0 api_key_access=0`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
