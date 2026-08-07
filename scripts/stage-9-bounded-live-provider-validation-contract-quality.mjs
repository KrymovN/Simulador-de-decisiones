import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const decisionPath = "docs/qa/stage-9/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_AUTHORIZATION_DECISION.v1.md";
const specPath = "docs/qa/stage-9/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_EXECUTION_SPEC.v1.md";
const manifestPath = "docs/qa/stage-9/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_EXECUTION_MANIFEST.v1.json";
const activationResultPath = "docs/qa/stage-9/results/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_CONTRACT_ACTIVATION_RESULT.v1.json";
const gatePath = "scripts/stage-9-bounded-live-provider-validation-contract-quality.mjs";
const diagnosticsMaintenancePaths = [
  "docs/qa/stage-9/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_EXECUTION_MANIFEST.v1.json",
  "lib/ai-provider/openai-synthetic-risk-adapter.server.ts",
  "lib/ai-provider/openai-synthetic-risk-adapter-validation.ts",
  "lib/ai-provider/openai-synthetic-risk-adapter.ts",
  "lib/ai-quality/synthetic-risk-evaluation.ts",
  "scripts/stage-9-openai-synthetic-risk-adapter-quality.mjs",
  gatePath,
];
const liveEvidencePath = "docs/qa/stage-9/live-evidence/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_EVIDENCE.v1.json";
const liveResultPath = "docs/qa/stage-9/results/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_RESULT.v1.json";
const activationWriteSet = [decisionPath, specPath, manifestPath, activationResultPath, gatePath, "package.json"];
const runtimeWriteSet = [liveEvidencePath, liveResultPath];
const contractArtifacts = [decisionPath, specPath, manifestPath, activationResultPath, gatePath];
const sourceHashes = {
  "app/api/simulate/route.ts": "9b29fdbfbcb78d539abca6a9dcc9bdbfaa5b396a6d8b514d9850eb93d1c94d11",
  "docs/qa/stage-9/STAGE_9_BOUNDED_RUNTIME_READINESS_EVIDENCE_MANIFEST.v1.json": "860c6510c81f0b3ff64a0c1c9c4eb7ef8c82e2445702f5d92de391482fcfb8f9",
  "docs/qa/stage-9/STAGE_9_BOUNDED_RUNTIME_READINESS_EVIDENCE_SPEC.v1.md": "5391949dbe79fffb6b5dafd123751aa278b9b9eccf014333ee2837629b4f0ffd",
  "docs/qa/stage-9/results/STAGE_9_BOUNDED_RUNTIME_READINESS_EVIDENCE_PREPARATION_RESULT.v1.json": "5823116faa89786161d5b575479f5c70df73ed09c6f7c5160229397682cfe6a6",
  "lib/ai-provider/openai-synthetic-risk-adapter.server.ts": "38a1cec5bfa2b7e86722d442a24983513acc0b7be4fb85b6097bdec2d3977f3f",
  "lib/ai-provider/openai-synthetic-risk-adapter.ts": "a1db527042cb610773644a1762fc8c098b43804c2b7fe0901939614432968275",
  "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts": "68f4e3a144a6ce34c467fe24645bdfdbf2a5311eed9e9b70d1665131d0ad90a3",
  "lib/decision-engine/simulation-pipeline-runner.ts": "2d5cd2585be44c57b5e8f367428720d37b0cd63e65f333d2adb0f1b71c67ed19",
};
const decisionSha = "bded19f3d3f63a203aa911fb25edd6915338d91be4475bafac4a59d415c26554";
const specSha = "9fafd63c2fbbe304b4b9f8f25d05927b45dc65bfb510cca988d24b74b175e73a";
const manifestSha = "6e856716816da1735f2089ebb04763ad02faae883b24b08b3f21edb11b3e4f02";
const activationManifestSha = "6ed9d25700e7778708f13af994e60fd78826a1a83f2f430292f3419fc4dd8ef4";
const manifestTopKeys = ["artifact_version", "authorization", "canonical_state", "cost_policy", "evidence_output_files", "evidence_schema", "fixture", "generated_at", "network_policy", "one_run_identifier_policy", "provider_configuration", "repository_checks", "required_gate_commands", "runtime_write_allowlist", "schema_version", "specification_binding", "verdict_rules"];
const evidenceTopKeys = ["artifact_version", "authorization", "configuration", "execution", "generated_at", "identity", "privacy", "repository_state", "requests", "usage", "validation"];
const resultKeys = ["artifact_version", "authorization_consumption_state", "dedicated_gate", "decision_engine_integrity_gate", "evidence_path", "evidence_sha256", "generated_at", "git_diff_cached_check", "git_diff_check", "negative_self_tests", "provider_cost_usd", "provider_execution_count", "provider_request_count", "runtime_write_set", "secret_scan", "status"];
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const clone = (value) => structuredClone(value);
const sortValue = (value) => Array.isArray(value) ? value.map(sortValue)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]))
    : value;
const serialize = (value) => `${JSON.stringify(sortValue(value), null, 2)}\n`;
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map((path) => path.replaceAll("\\", "/"));
const diffPaths = () => [...new Set([...gitLines("diff", "--name-only", "HEAD"), ...gitLines("ls-files", "--others", "--exclude-standard")])].sort();
const sameSet = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
const exactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) && sameSet(Object.keys(value), expected);
const secretLike = (text) => /(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{8,}/m.test(text);
const unstable = (text) => /(?:\/Users\/|\/private\/|[A-Za-z]:\\\\|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/.test(text);
const checks = [];
const add = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

function manifestErrors(value) {
  const errors = [];
  const auth = value.authorization ?? {};
  const state = value.canonical_state ?? {};
  const cost = value.cost_policy ?? {};
  const schema = value.evidence_schema ?? {};
  const fixture = value.fixture ?? {};
  const network = value.network_policy ?? {};
  const provider = value.provider_configuration ?? {};
  const verdicts = value.verdict_rules ?? {};
  if (!exactKeys(value, manifestTopKeys)) errors.push("manifest-top-level-schema");
  if (auth.state !== "AUTHORIZED_FOR_ONE_BOUNDED_LIVE_PROVIDER_VALIDATION_RUN") errors.push("authorization-state");
  if (auth.consumption_event !== "FIRST_ATTEMPTED_PROVIDER_NETWORK_REQUEST" || auth.pre_request_abort_consumes_authorization !== false || auth.repeat_execution_requires_new_owner_decision !== true || auth.terminal_after_pass_or_fail !== true) errors.push("authorization-consumption");
  if (auth.decision_sha256 !== decisionSha || auth.decision_path !== decisionPath || auth.decision_date !== "2026-07-31") errors.push("authorization-binding");
  if (value.specification_binding?.path !== specPath || value.specification_binding?.sha256 !== specSha) errors.push("specification-binding");
  if (!sameSet(value.evidence_output_files ?? [], runtimeWriteSet) || value.evidence_output_files?.length !== 2) errors.push("evidence-output-paths");
  if (!sameSet(value.runtime_write_allowlist ?? [], runtimeWriteSet) || value.runtime_write_allowlist?.length !== 2) errors.push("runtime-write-allowlist");
  if (provider.provider !== "OpenAI Responses API" || provider.model !== "gpt-5.6-terra" || provider.capability !== "candidate_risk_signals_v1") errors.push("provider-model-capability");
  if (provider.max_provider_requests !== 2 || provider.retries !== 0) errors.push("request-retry-limits");
  if (provider.max_input_tokens !== 3000 || provider.max_output_tokens !== 1200 || provider.max_total_tokens !== 4200 || provider.max_local_payload_characters !== 16000) errors.push("token-output-limits");
  if (provider.timeouts_ms?.input_count !== 5000 || provider.timeouts_ms?.generation !== 30000 || provider.timeouts_ms?.overall !== 35000) errors.push("timeout-limits");
  if (provider.server_only !== true || provider.store !== false || provider.tools_enabled !== false || provider.stream !== false || provider.background !== false) errors.push("provider-safety-configuration");
  if (provider.decision_engine_path_mode !== "INTEGRITY_GATE_ONLY_NO_PROVIDER_COMPOSITION") errors.push("decision-engine-boundary");
  if (cost.max_total_cost_usd !== 0.03 || cost.worst_allowed_token_budget_cost_usd > cost.max_total_cost_usd || cost.unknown_actual_cost_is_failure_after_provider_request !== true) errors.push("cost-ceiling");
  if (fixture.fixture_ids?.length !== 1 || fixture.fixture_ids[0] !== "S9-EVAL-001" || fixture.classification !== "synthetic_non_personal" || fixture.fixture_input_sha256 !== "b6798ac3fc7aba896e7d8706de66ecc0c29142363aee9af26f6a1acf644a6dfd") errors.push("fixture-binding");
  if (network.allowed_destinations?.length !== 2 || network.all_other_destinations_denied !== true || network.redirects_allowed !== false) errors.push("network-allowlist");
  const expectedPaths = ["/v1/responses/input_tokens", "/v1/responses"];
  if (!network.allowed_destinations?.every((item, index) => item.host === "api.openai.com" && item.protocol === "https" && item.port === 443 && item.method === "POST" && item.path === expectedPaths[index])) errors.push("network-destination");
  if (!schema.evidence_artifact || !schema.result_artifact || schema.additional_properties_allowed !== false) errors.push("evidence-schema");
  if (!sameSet(schema.evidence_artifact?.required_top_level_fields ?? [], evidenceTopKeys)) errors.push("evidence-top-level-fields");
  if (!schema.evidence_artifact?.nested_required_fields || Object.keys(schema.evidence_artifact.nested_required_fields).length !== 8 || !schema.evidence_artifact.request_item_allowed_fields?.length) errors.push("evidence-nested-schema");
  if (!sameSet(schema.evidence_artifact?.provider_error_metadata_allowed_fields ?? [], ["captured", "code", "http_status", "message", "param", "type"])) errors.push("provider-error-metadata-schema");
  if (!sameSet(schema.result_artifact?.required_fields ?? [], resultKeys) || schema.result_artifact?.status_enum?.length !== 3) errors.push("result-schema");
  if (!schema.required_redaction_fields?.length || !schema.prohibited_fields?.includes("api_key") || !schema.prohibited_fields?.includes("raw_provider_response")) errors.push("redaction-schema");
  if (!["pass", "fail", "aborted"].every((key) => Array.isArray(verdicts[key]) && verdicts[key].length > 0)) errors.push("verdict-rules");
  if (state.stage_9 !== "In Progress" || state.release_readiness !== "NOT_DECLARED" || state.api_simulate_mock_only !== true || state.runtime_boundaries_closed !== 11 || state.runtime_boundaries_total !== 11) errors.push("canonical-closed-state");
  if (value.one_run_identifier_policy?.run_id !== "S9-BLPV-RUN-001" || value.one_run_identifier_policy?.random_identifiers_allowed !== false || value.one_run_identifier_policy?.wall_clock_timestamp_allowed !== false) errors.push("one-run-id-policy");
  if (!value.required_gate_commands?.includes("npm run quality:stage-9-bounded-live-provider-validation-contract") || !value.required_gate_commands?.includes("npm run quality:simulation-pipeline-runner")) errors.push("required-gates");
  if (secretLike(JSON.stringify(value))) errors.push("secret-like-value");
  return [...new Set(errors)];
}

function profileErrors({
  changed,
  consumptionState,
  liveEvidenceExists,
  liveResultExists,
  executionStatus,
  resultStatus,
  providerExecutionCount,
  providerRequestCount,
  networkExecutionCount,
  apiKeyAccessCount,
  providerCostUsd,
  evidenceArtifactsExact = true,
}) {
  const preExecution = changed.length === 0 && !liveEvidenceExists && !liveResultExists &&
    consumptionState === "UNCONSUMED";
  const exactEvidencePair = evidenceArtifactsExact && liveEvidenceExists && liveResultExists &&
    (changed.length === 0 || sameSet(changed, runtimeWriteSet));
  const retryablePreExecutionAbort = exactEvidencePair &&
    consumptionState === "UNCONSUMED" &&
    executionStatus === "ABORTED" &&
    resultStatus === "ABORTED_BEFORE_PROVIDER_EXECUTION" &&
    providerExecutionCount === 0 &&
    providerRequestCount === 0 &&
    networkExecutionCount === 0 &&
    apiKeyAccessCount === 0 &&
    providerCostUsd === 0;
  const postExecution = exactEvidencePair && consumptionState === "CONSUMED" &&
    ((executionStatus === "PASS" && resultStatus === "BOUNDED_RUNTIME_VALIDATION_PASS") ||
      (executionStatus === "FAIL" && resultStatus === "BOUNDED_RUNTIME_VALIDATION_FAIL"));
  return preExecution || retryablePreExecutionAbort || postExecution
    ? []
    : ["profile-write-allowlist"];
}

function liveEvidenceErrors(evidence, result, manifest) {
  const errors = [];
  if (!exactKeys(evidence, evidenceTopKeys)) errors.push("live-evidence-top-level-schema");
  for (const [section, fields] of Object.entries(manifest.evidence_schema.evidence_artifact.nested_required_fields)) {
    if (!exactKeys(evidence[section], fields)) errors.push(`live-${section}-schema`);
  }
  if (!Array.isArray(evidence.requests) || !evidence.requests.every((item) => exactKeys(item, manifest.evidence_schema.evidence_artifact.request_item_allowed_fields))) errors.push("live-request-schema");
  if (!exactKeys(result, resultKeys)) errors.push("live-result-schema");
  if (evidence.artifact_version !== manifest.evidence_schema.evidence_artifact.artifact_version || result.artifact_version !== manifest.evidence_schema.result_artifact.artifact_version) errors.push("live-artifact-version");
  if (evidence.identity?.run_id !== manifest.one_run_identifier_policy.run_id) errors.push("live-run-id");
  if (evidence.authorization?.state !== manifest.authorization.state || evidence.authorization?.decision_path !== decisionPath || evidence.authorization?.decision_sha256 !== decisionSha) errors.push("live-authorization-binding");
  const execution = evidence.execution ?? {};
  if (execution.retry_count !== 0 || execution.provider_request_count > 2 || execution.network_execution_count > 2 || execution.api_key_access_count > 1 || execution.provider_execution_count > 1) errors.push("live-execution-limits");
  if (evidence.requests?.length !== execution.provider_request_count || execution.network_execution_count !== execution.provider_request_count) errors.push("live-request-count-evidence");
  if (evidence.configuration?.model !== "gpt-5.6-terra" || evidence.configuration?.provider !== "OpenAI Responses API" || evidence.configuration?.max_output_tokens !== 1200 || evidence.configuration?.retries !== 0 || evidence.configuration?.store !== false || evidence.configuration?.tools_enabled !== false) errors.push("live-configuration");
  if (evidence.repository_state?.stage_9 !== "In Progress" || evidence.repository_state?.release_readiness !== "NOT_DECLARED" || evidence.repository_state?.api_simulate_mock_only !== true || evidence.repository_state?.runtime_boundaries_closed !== 11 || evidence.repository_state?.runtime_boundaries_total !== 11) errors.push("live-closed-state");
  if (evidence.validation?.decision_engine_path_mode !== "INTEGRITY_GATE_ONLY_NO_PROVIDER_COMPOSITION" || evidence.validation?.provider_material_composed !== false) errors.push("live-decision-engine-boundary");
  const providerErrorMetadata = evidence.validation?.provider_error_metadata;
  if (providerErrorMetadata !== null) {
    if (!exactKeys(providerErrorMetadata, manifest.evidence_schema.evidence_artifact.provider_error_metadata_allowed_fields)) errors.push("live-provider-error-metadata-schema");
    else {
      const optionalStringsValid = [providerErrorMetadata.type, providerErrorMetadata.code, providerErrorMetadata.param, providerErrorMetadata.message]
        .every((item) => item === null || typeof item === "string");
      if (typeof providerErrorMetadata.captured !== "boolean" || providerErrorMetadata.http_status !== 400 || !optionalStringsValid) errors.push("live-provider-error-metadata-values");
      if (providerErrorMetadata.captured === true && evidence.validation?.error_category !== "provider_bad_request") errors.push("live-provider-error-metadata-category");
      if (providerErrorMetadata.captured === false && [providerErrorMetadata.type, providerErrorMetadata.code, providerErrorMetadata.param, providerErrorMetadata.message].some((item) => item !== null)) errors.push("live-provider-error-metadata-unpreserved-values");
      if (secretLike(JSON.stringify(providerErrorMetadata)) || Object.keys(providerErrorMetadata).some((key) => /header|body|request.?id/i.test(key))) errors.push("live-provider-error-metadata-secret-or-raw");
    }
  }
  if (!Object.values(evidence.privacy ?? {}).every((item) => item === true)) errors.push("live-privacy-redaction");
  if (execution.status === "PASS") {
    if (execution.provider_execution_count !== 1 || execution.provider_request_count !== 2 || execution.api_key_access_count !== 1 || evidence.authorization.consumption_state !== "CONSUMED") errors.push("live-pass-execution");
    if (!evidence.usage?.usage_observed || typeof evidence.usage.actual_cost_usd !== "number" || evidence.usage.actual_cost_usd > 0.03 || evidence.usage.cost_ceiling_compliant !== true) errors.push("live-pass-usage-cost");
    if (!["fixture_hash_valid", "structured_output_compatible", "schema_valid", "grounding_valid", "safety_valid", "semantic_valid"].every((key) => evidence.validation?.[key] === true) || evidence.validation?.adapter_result !== "PASS" || evidence.validation?.decision_engine_integrity_gate !== "PASS") errors.push("live-pass-validation");
    if (result.status !== "BOUNDED_RUNTIME_VALIDATION_PASS") errors.push("live-pass-result");
  } else if (execution.status === "FAIL") {
    if (execution.provider_request_count > 0 && evidence.authorization.consumption_state !== "CONSUMED") errors.push("live-fail-consumption");
    if (result.status !== "BOUNDED_RUNTIME_VALIDATION_FAIL") errors.push("live-fail-result");
  } else if (execution.status === "ABORTED") {
    if (execution.provider_execution_count !== 0 || execution.provider_request_count !== 0 || execution.network_execution_count !== 0 || evidence.usage?.actual_cost_usd !== 0 || evidence.authorization.consumption_state !== "UNCONSUMED") errors.push("live-aborted-zero-state");
    if (result.status !== "ABORTED_BEFORE_PROVIDER_EXECUTION") errors.push("live-aborted-result");
  } else errors.push("live-status");
  if (result.evidence_path !== liveEvidencePath || result.evidence_sha256 !== sha(serialize(evidence)) || !sameSet(result.runtime_write_set ?? [], runtimeWriteSet) || result.provider_execution_count !== execution.provider_execution_count || result.provider_request_count !== execution.provider_request_count || result.provider_cost_usd !== evidence.usage.actual_cost_usd) errors.push("live-result-binding");
  if (result.dedicated_gate !== "SELF_VALIDATING_CURRENT_INVOCATION" || result.negative_self_tests !== "PASS" || result.secret_scan !== "PASS" || result.git_diff_check !== "PASS" || result.git_diff_cached_check !== "PASS") errors.push("live-result-checks");
  if (secretLike(`${JSON.stringify(evidence)}${JSON.stringify(result)}`) || unstable(`${JSON.stringify(evidence)}${JSON.stringify(result)}`)) errors.push("live-secret-or-unstable-data");
  return [...new Set(errors)];
}

const manifest = json(manifestPath);
const activationResult = json(activationResultPath);
const decision = read(decisionPath);
const spec = read(specPath);
const changed = diffPaths();
const liveEvidenceExists = existsSync(join(root, liveEvidencePath));
const liveResultExists = existsSync(join(root, liveResultPath));
const stage9LiveEvidenceArtifacts = gitLines(
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "--",
  "docs/qa/stage-9/live-evidence",
  "docs/qa/stage-9/results",
).filter((path) =>
  path.startsWith("docs/qa/stage-9/live-evidence/") ||
  (path.startsWith("docs/qa/stage-9/results/STAGE_9_BOUNDED_LIVE_PROVIDER_VALIDATION_") &&
    path !== activationResultPath)
);
const evidenceArtifactsExact = sameSet(stage9LiveEvidenceArtifacts, runtimeWriteSet);
const maintenanceDiff = changed.filter((path) => diagnosticsMaintenancePaths.includes(path));
const profileChanged = changed.filter((path) => !diagnosticsMaintenancePaths.includes(path));
const evidencePairCandidate = evidenceArtifactsExact && liveEvidenceExists && liveResultExists &&
  (profileChanged.length === 0 || sameSet(profileChanged, runtimeWriteSet));
const observedEvidence = evidencePairCandidate ? json(liveEvidencePath) : null;
const observedResult = evidencePairCandidate ? json(liveResultPath) : null;
const observedConsumptionState = observedEvidence?.authorization?.consumption_state ?? "UNCONSUMED";
const currentProfileErrors = profileErrors({
  changed: profileChanged,
  consumptionState: observedConsumptionState,
  liveEvidenceExists,
  liveResultExists,
  executionStatus: observedEvidence?.execution?.status,
  resultStatus: observedResult?.status,
  providerExecutionCount: observedEvidence?.execution?.provider_execution_count,
  providerRequestCount: observedEvidence?.execution?.provider_request_count,
  networkExecutionCount: observedEvidence?.execution?.network_execution_count,
  apiKeyAccessCount: observedEvidence?.execution?.api_key_access_count,
  providerCostUsd: observedEvidence?.usage?.actual_cost_usd,
  evidenceArtifactsExact,
});
const preExecutionProfile = currentProfileErrors.length === 0 && profileChanged.length === 0 &&
  !liveEvidenceExists && !liveResultExists;
const retryableAbortProfile = currentProfileErrors.length === 0 && evidencePairCandidate &&
  observedConsumptionState === "UNCONSUMED";
const liveProfile = currentProfileErrors.length === 0 && evidencePairCandidate;
const successfulLiveValidationClaim = observedResult?.status === "BOUNDED_RUNTIME_VALIDATION_PASS";
const successfulLiveExecution = observedEvidence?.execution?.status === "PASS";
const liveValidationClaimConsistent = liveProfile
  ? successfulLiveValidationClaim === successfulLiveExecution
  : !successfulLiveValidationClaim;
const artifactText = [decision, spec, read(manifestPath), read(activationResultPath)].join("\n");

add("five-contract-artifacts-exist", contractArtifacts.every((path) => existsSync(join(root, path))), "All five Stage 9 contract artifacts exist.");
add("profile-write-allowlist", currentProfileErrors.length === 0, `${profileChanged.length} runtime evidence files in ${preExecutionProfile ? "PRE_EXECUTION_BASELINE" : retryableAbortProfile ? "RETRYABLE_PRE_EXECUTION_ABORT" : liveProfile ? "POST_EXECUTION_EVIDENCE" : "invalid"} profile.`);
add("authorization-decision", decision.includes("AUTHORIZED_FOR_ONE_BOUNDED_LIVE_PROVIDER_VALIDATION_RUN") && decision.includes("Owner decision date: `2026-07-31`") && decision.includes("FIRST") === false && decision.includes("first attempted provider") && decision.includes("UNCONSUMED") && decision.includes("CONSUMED"), "Owner authorization and one-run consumption are binding.");
add("specification-complete", ["## Controlling files and precedence", "## Exact execution scope", "## Credential and network policy", "## Adapter and Decision Engine path", "## Fixture, privacy, and redaction", "## Exact live-evidence outputs and write allowlist", "## Evidence schema", "## Stop and error rules", "## PASS, FAIL, and ABORTED", "## Evidence finalization and repository checks", "gpt-5.6-terra", "S9-EVAL-001", "1200", "3000", "4200", "16000", "$0.03", ...runtimeWriteSet].every((token) => spec.includes(token)), "Execution specification contains every required section and exact limit.");
add("manifest-contract", manifestErrors(manifest).length === 0, manifestErrors(manifest).join(", ") || "Manifest declares the future exact write allowlist and evidence schema.");
add("deterministic-manifest", serialize(manifest) === read(manifestPath), "Manifest JSON is recursively sorted.");
add("contract-hash-bindings", sha(decision) === decisionSha && sha(spec) === specSha && sha(read(manifestPath)) === manifestSha, "Decision, specification, and manifest hashes match.");
add("immutable-source-hashes", Object.entries(sourceHashes).every(([path, expected]) => sha(read(path)) === expected), "Preparation, adapter, fixture, Decision Engine, and route sources are unchanged.");
add("activation-result", activationResult.status === "PASS" && activationResult.starting_commit === "806c86fc8b4c08a0171fd09e41d5d7a869faf944" && activationResult.authorization_state === "AUTHORIZED_FOR_ONE_BOUNDED_LIVE_PROVIDER_VALIDATION_RUN" && activationResult.final_disposition === "EXECUTABLE_CONTRACT_READY_PENDING_LIVE_PROVIDER_EXECUTION" && activationResult.provider_execution_count === 0 && activationResult.provider_request_count === 0 && activationResult.network_execution_count === 0 && activationResult.api_key_access_count === 0 && activationResult.provider_cost_usd === 0 && activationResult.runtime_boundaries_closed === 11 && activationResult.runtime_boundaries_total === 11 && activationResult.stage_9 === "In Progress" && activationResult.release_readiness === "NOT_DECLARED" && activationResult.api_simulate_mock_only === true && activationResult.mock_only === true && activationResult.specification_sha256 === specSha && activationResult.manifest_sha256 === activationManifestSha && sameSet(activationResult.execution_write_set, activationWriteSet), "Historical offline activation result remains bound to its original execution-free manifest.");
add("deterministic-activation-result", serialize(activationResult) === read(activationResultPath), "Activation result JSON is recursively sorted.");
add("no-live-validation-claim", liveValidationClaimConsistent && !artifactText.includes("provider validation already completed") && activationResult.provider_execution_count === 0 && activationResult.final_disposition.endsWith("PENDING_LIVE_PROVIDER_EXECUTION"), "Live-validation success is claimed only by a matching successful post-execution result; failed evidence remains failed.");
add("no-secret-absolute-or-timestamp", !secretLike(artifactText) && !unstable(artifactText), "Artifacts contain no secret-like value, absolute path, or timestamp.");
add("package-command", json("package.json").scripts["quality:stage-9-bounded-live-provider-validation-contract"] === "node scripts/stage-9-bounded-live-provider-validation-contract-quality.mjs", "Dedicated package command is exact.");
add("canonical-state-preserved", manifest.canonical_state.stage_9 === "In Progress" && manifest.canonical_state.release_readiness === "NOT_DECLARED" && manifest.canonical_state.api_simulate_mock_only === true && manifest.canonical_state.runtime_boundaries_closed === 11 && manifest.canonical_state.runtime_boundaries_total === 11, "Stage, release, route, and all boundaries remain closed.");
add("positioning-and-runtime-source-unchanged", maintenanceDiff.length <= diagnosticsMaintenancePaths.length && changed.every((path) => [...diagnosticsMaintenancePaths, ...(liveProfile ? runtimeWriteSet : [])].includes(path)) && sha(read("app/api/simulate/route.ts")) === sourceHashes["app/api/simulate/route.ts"], "Only bounded diagnostics/validator maintenance and exact runtime evidence are in the diff.");

const negativeCases = [
  ["not-authorized", (x) => { x.authorization.state = "NOT_AUTHORIZED"; }],
  ["missing-evidence-output", (x) => { x.evidence_output_files.pop(); }],
  ["missing-write-allowlist", (x) => { delete x.runtime_write_allowlist; }],
  ["missing-evidence-schema", (x) => { delete x.evidence_schema; }],
  ["missing-output-token-limit", (x) => { delete x.provider_configuration.max_output_tokens; }],
  ["cost-ceiling-exceeded", (x) => { x.cost_policy.max_total_cost_usd = 0.04; }],
  ["retry-enabled", (x) => { x.provider_configuration.retries = 1; }],
  ["public-runtime-open", (x) => { x.provider_configuration.decision_engine_path_mode = "PUBLIC_RUNTIME_OPEN"; }],
  ["mock-only-false", (x) => { x.canonical_state.api_simulate_mock_only = false; }],
  ["stage-completed", (x) => { x.canonical_state.stage_9 = "Completed"; }],
  ["release-declared", (x) => { x.canonical_state.release_readiness = "READY"; }],
  ["missing-consumption-rule", (x) => { delete x.authorization.consumption_event; }],
  ["secret-in-artifact", (x) => { x.unexpected_secret = "sk-EXAMPLEVALUE123456"; }],
  ["extra-network-destination", (x) => { x.network_policy.allowed_destinations.push({ host: "example.invalid", method: "POST", path: "/", port: 443, protocol: "https" }); }],
  ["extra-runtime-evidence-file", (x) => { x.runtime_write_allowlist.push("docs/qa/stage-9/live-evidence/EXTRA.json"); }],
];
let negativePassed = 0;
for (const [id, mutate] of negativeCases) {
  const candidate = clone(manifest);
  mutate(candidate);
  const rejected = manifestErrors(candidate).length > 0;
  if (rejected) negativePassed += 1;
  add(`negative-${id}`, rejected, rejected ? "Rejected as required." : "Invalid mutation accepted.");
}
const nonzeroActivation = clone(activationResult);
nonzeroActivation.provider_execution_count = 1;
const nonzeroRejected = !(nonzeroActivation.provider_execution_count === 0 && nonzeroActivation.provider_request_count === 0 && nonzeroActivation.network_execution_count === 0 && nonzeroActivation.api_key_access_count === 0 && nonzeroActivation.provider_cost_usd === 0);
add("negative-nonzero-offline-activation", nonzeroRejected, "Nonzero offline activation execution is rejected.");
add("positive-manifest-self-test", manifestErrors(clone(manifest)).length === 0 && profileErrors({ changed: [], consumptionState: "UNCONSUMED", liveEvidenceExists: false, liveResultExists: false }).length === 0, "Isolated PRE_EXECUTION_BASELINE manifest context accepted.");

const retryableAbortProfileContext = {
  changed: runtimeWriteSet,
  consumptionState: "UNCONSUMED",
  liveEvidenceExists: true,
  liveResultExists: true,
  executionStatus: "ABORTED",
  resultStatus: "ABORTED_BEFORE_PROVIDER_EXECUTION",
  providerExecutionCount: 0,
  providerRequestCount: 0,
  networkExecutionCount: 0,
  apiKeyAccessCount: 0,
  providerCostUsd: 0,
};
add("positive-retryable-pre-execution-abort", profileErrors(retryableAbortProfileContext).length === 0, "Exact zero-request ABORTED evidence remains UNCONSUMED and retryable.");
add("positive-committed-retryable-pre-execution-abort", profileErrors({ ...retryableAbortProfileContext, changed: [] }).length === 0, "Committed zero-request ABORTED evidence remains a valid retryable baseline on clean HEAD.");

const profileNegativeCases = [
  ["pre-unexpected-file", { changed: ["UNEXPECTED_FILE"], consumptionState: "UNCONSUMED", liveEvidenceExists: false, liveResultExists: false }],
  ["pre-partial-live-evidence", { changed: [liveEvidencePath], consumptionState: "UNCONSUMED", liveEvidenceExists: true, liveResultExists: false }],
  ["pre-consumed", { changed: [], consumptionState: "CONSUMED", liveEvidenceExists: false, liveResultExists: false }],
  ["post-unconsumed", { changed: runtimeWriteSet, consumptionState: "UNCONSUMED", liveEvidenceExists: true, liveResultExists: true }],
  ["abort-provider-request", { ...retryableAbortProfileContext, providerRequestCount: 1, networkExecutionCount: 1 }],
  ["abort-provider-execution", { ...retryableAbortProfileContext, providerExecutionCount: 1 }],
  ["abort-api-key-access", { ...retryableAbortProfileContext, apiKeyAccessCount: 1 }],
  ["abort-nonzero-cost", { ...retryableAbortProfileContext, providerCostUsd: 0.001 }],
  ["abort-consumed", { ...retryableAbortProfileContext, consumptionState: "CONSUMED" }],
  ["abort-wrong-result", { ...retryableAbortProfileContext, resultStatus: "BOUNDED_RUNTIME_VALIDATION_PASS" }],
  ["abort-extra-file", { ...retryableAbortProfileContext, changed: [...runtimeWriteSet, "UNEXPECTED_THIRD_FILE"] }],
  ["abort-unknown-committed-evidence", { ...retryableAbortProfileContext, changed: [], evidenceArtifactsExact: false }],
  ["post-third-file", { changed: [...runtimeWriteSet, "UNEXPECTED_THIRD_FILE"], consumptionState: "CONSUMED", liveEvidenceExists: true, liveResultExists: true }],
  ["post-missing-required-file", { changed: [liveEvidencePath], consumptionState: "CONSUMED", liveEvidenceExists: true, liveResultExists: false }],
];
let profileNegativePassed = 0;
for (const [id, context] of profileNegativeCases) {
  const rejected = profileErrors(context).length > 0;
  if (rejected) profileNegativePassed += 1;
  add(`negative-profile-${id}`, rejected, rejected ? "Rejected as required." : "Invalid profile accepted.");
}

let liveEvidenceNegativePassed = 0;
let liveEvidenceNegativeTotal = 0;

if (liveProfile) {
  const filesExist = runtimeWriteSet.every((path) => existsSync(join(root, path)));
  add("live-evidence-files-exist", filesExist, "Both exact live-evidence files must exist.");
  if (filesExist) {
    const evidence = json(liveEvidencePath);
    const result = json(liveResultPath);
    const liveErrors = liveEvidenceErrors(evidence, result, manifest);
    add("nonzero-bounded-live-evidence-profile", liveErrors.length === 0, liveErrors.join(", ") || "Live evidence valid.");
    add("deterministic-live-evidence", serialize(evidence) === read(liveEvidencePath) && serialize(result) === read(liveResultPath), "Live evidence JSON is recursively sorted.");
    const liveNegativeCases = [
      ["false-pass", (evidenceCandidate, resultCandidate) => { resultCandidate.status = "BOUNDED_RUNTIME_VALIDATION_PASS"; }],
      ["unconsumed-after-request", (evidenceCandidate) => { evidenceCandidate.authorization.consumption_state = "UNCONSUMED"; }],
      ["request-count-mismatch", (evidenceCandidate) => { evidenceCandidate.execution.provider_request_count = 2; }],
      ["wrong-evidence-hash", (evidenceCandidate, resultCandidate) => { resultCandidate.evidence_sha256 = "0".repeat(64); }],
      ["runtime-open", (evidenceCandidate) => { evidenceCandidate.repository_state.runtime_boundaries_closed = 10; }],
      ["captured-metadata-with-unknown-category", (evidenceCandidate) => { evidenceCandidate.validation.provider_error_metadata.captured = true; }],
      ["secret-in-provider-message", (evidenceCandidate) => { evidenceCandidate.validation.provider_error_metadata.message = "sk-SYNTHETICSECRET123456"; }],
      ["raw-provider-metadata-field", (evidenceCandidate) => { evidenceCandidate.validation.provider_error_metadata.raw_body = "forbidden"; }],
    ];
    liveEvidenceNegativeTotal = liveNegativeCases.length;
    for (const [id, mutate] of liveNegativeCases) {
      const evidenceCandidate = clone(evidence);
      const resultCandidate = clone(result);
      mutate(evidenceCandidate, resultCandidate);
      const rejected = liveEvidenceErrors(evidenceCandidate, resultCandidate, manifest).length > 0;
      if (rejected) liveEvidenceNegativePassed += 1;
      add(`negative-live-${id}`, rejected, rejected ? "Rejected as required." : "Invalid live evidence accepted.");
    }
  }
} else {
  add("activation-has-no-live-evidence", runtimeWriteSet.every((path) => !existsSync(join(root, path))), "No live evidence exists during activation.");
}

add("negative-self-test-union", negativePassed === negativeCases.length && nonzeroRejected && profileNegativePassed === profileNegativeCases.length && liveEvidenceNegativePassed === liveEvidenceNegativeTotal, `${negativePassed + (nonzeroRejected ? 1 : 0) + profileNegativePassed + liveEvidenceNegativePassed}/${negativeCases.length + 1 + profileNegativeCases.length + liveEvidenceNegativeTotal} invalid cases rejected.`);
for (const check of checks) {
  console[check.passed ? "log" : "error"](`${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`);
}
console.log(`REPORT profile=${preExecutionProfile ? "PRE_EXECUTION_BASELINE" : retryableAbortProfile ? "RETRYABLE_PRE_EXECUTION_ABORT" : liveProfile ? "POST_EXECUTION_EVIDENCE" : "invalid"} positive=${checks.filter((item) => item.passed).length}/${checks.length} negative=${negativePassed + (nonzeroRejected ? 1 : 0) + profileNegativePassed + liveEvidenceNegativePassed}/${negativeCases.length + 1 + profileNegativeCases.length + liveEvidenceNegativeTotal} provider=0 network=0 api_key_access=0`);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
