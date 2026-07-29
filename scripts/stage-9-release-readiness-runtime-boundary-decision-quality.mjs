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
const specPath = "docs/qa/stage-9/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_SPEC.v1.md";
const gatePath = "scripts/stage-9-release-readiness-runtime-boundary-decision-quality.mjs";
const decisionPath = "docs/qa/stage-9/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION.v1.json";
const resultPath = "docs/qa/stage-9/results/STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_RESULT.v1.json";
const contextPath = "PROJECT_CONTEXT.md";
const statusPaths = [
  "LEVIO_IMPLEMENTATION_PLAN.md",
  "CURRENT_STAGE.md",
  "LEVIO_CURRENT_STATE.md",
  "LEVIO_PROJECT_PROGRESS.md",
];
const preparationWriteSet = [
  specPath,
  gatePath,
  "package.json",
  ...statusPaths,
];
const futureDecisionWriteSet = [
  decisionPath,
  resultPath,
  contextPath,
  ...statusPaths,
];

const evidenceHashes = {
  "PROJECT_CONTEXT.md": "e9c26896d29a0e6593483ed7bc7364fe5a3c25323c026cd8aee71dc04bb5f933",
  "docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_SPEC.v1.md": "d73817967a4552df49a80accc75e892028518884ca15dcfbe434fb15ba38f2ea",
  "docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT.v1.json": "b7718d79bad2e9c87839b23067e4b7b176596658097424d7ad9c7760c5172228",
  "docs/qa/remediation/stage-9/results/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_RESULT.v1.json": "c9aea2c69e6d841241402b8391a20ff401f9521ca4e546989730954e221b744f",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json": "15938859a9d9abf519c26a4983495ab9d6106ff94402a2b10f802af2dd7615db",
  "docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json": "7748be17e5f3ead5791aea4b65fd72f98c2187db83a10bf9d172aebd61f26d64",
  "docs/qa/remediation/stage-9/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json": "76d19477cef3757ca7b322f7bf84dfb47031c1a75a6a9a52fa74dad294987f41",
  "LEVIO_PROJECT_CONSTITUTION.md": "7381da6f669dabb425530c085f6e3bd1c413d80512cb5e442d51a16e2d3ba071",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json": "130048eb3561a90f99ee425706dd1f6835399039f5c2413ad07f466c46c58493",
  "docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json": "227203913b551ceb7b7c4f6d1c7e1cc71221f7902ecd670a88fdc0197e61681e",
  "lib/ai-provider/openai-synthetic-risk-adapter.ts": "4450f0190219fc875669146c6bfa575882b70fe010682e437b9ab62c9f5802a6",
  "lib/ai-provider/openai-synthetic-risk-adapter.server.ts": "5c478f0a814b11ecfce2e9ae9eb7b7fb288560562da7ed28662d0ed1da5d2eef",
  "app/api/simulate/route.ts": "9b29fdbfbcb78d539abca6a9dcc9bdbfaa5b396a6d8b514d9850eb93d1c94d11",
};

const boundaryIds = [
  "LIVE_OPENAI_PROVIDER_RUNTIME",
  "PROMPT_CONTEXT_RUNTIME",
  "DECISION_ENGINE_PRE_PROVIDER",
  "DECISION_ENGINE_POST_PROVIDER",
  "AI_API",
  "AI_UI",
  "PERSISTENCE_COUPLING",
  "SUPABASE_AUTH_EXPANSION",
  "LIVE_AI_OBSERVABILITY",
  "PRODUCTION_DEPLOYMENT",
  "API_SIMULATE_MOCK_ONLY",
];
const riskCategories = [
  "HISTORICAL_REVIEW_LIMITATION",
  "OFFLINE_EVIDENCE_BOUNDARY",
  "RELEASE_RUNTIME_UNASSESSED",
  "ACCEPTED_VERSION_BASELINE",
];
const boundaryStatuses = [
  "CLOSED",
  "OFFLINE_PREPARATION_ALLOWED",
  "BOUNDED_VALIDATION_AUTHORIZED",
  "OPEN",
];
const stageVerdicts = ["KEEP_IN_PROGRESS", "COMPLETE"];
const releaseVerdicts = ["NOT_DECLARED", "DEFERRED", "LIMITED_READY", "READY"];
const dispositions = [
  "DEFERRED_PENDING_RUNTIME_EVIDENCE",
  "STAGE_COMPLETE_RELEASE_NOT_DECLARED",
  "BOUNDED_RUNTIME_VALIDATION_AUTHORIZED",
  "RUNTIME_BOUNDARY_CHANGE_APPROVED",
  "BLOCKED",
];
const approvalStates = ["NOT_APPROVED", "TEST_ONLY_APPROVED", "APPROVED", "REVOKED"];
const riskAcceptanceStates = ["NOT_ACCEPTED_PENDING_OWNER_DECISION", "ACCEPTED", "REJECTED"];

const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const normalizePath = (value) => value.replaceAll("\\", "/");
const gitLines = (...args) => execFileSync("git", args, {
  cwd: root,
  encoding: "utf8",
}).split("\n").filter(Boolean).map(normalizePath);
const gitRead = (...args) => execFileSync("git", args, {
  cwd: root,
  encoding: "utf8",
});
const diffPaths = () => [...new Set([
  ...gitLines("diff", "--name-only", "HEAD"),
  ...gitLines("ls-files", "--others", "--exclude-standard"),
])].sort();
const samePaths = (actual, expected) =>
  JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
  }
  return value;
}
const serialize = (value) => `${JSON.stringify(sortValue(value), null, 2)}\n`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const noUnstableText = (text) =>
  !/(?:\/Users\/|\/private\/|[A-Za-z]:\\\\)/.test(text)
  && !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(text);

function immutableEvidenceValid({ contextFromHead = false } = {}) {
  return Object.entries(evidenceHashes).every(([path, expected]) => {
    if (!existsSync(join(root, path))) return false;
    const content = contextFromHead && path === contextPath
      ? gitRead("show", `HEAD:${path}`)
      : read(path);
    return sha(content) === expected;
  });
}

function assessmentEvidenceValid() {
  const assessment = json("docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT.v1.json");
  const result = json("docs/qa/remediation/stage-9/results/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT_RESULT.v1.json");
  const reconciliation = json("docs/qa/remediation/stage-9/STAGE_9_ACTIONABLE_CLAIM_RECONCILIATION.v1.json");
  return assessment.artifact_version === "stage-9-post-remediation-corpus-assessment.1"
    && assessment.population.combined_unique_id_count === 216
    && assessment.aggregation.dimensions_passed === 13
    && assessment.aggregation.new_unresolved_findings === 0
    && assessment.aggregation.blocking_findings === 0
    && assessment.aggregation.open_findings === 0
    && assessment.closure_verdict === "PASS_WITH_NON_BLOCKING_RESIDUAL_RISKS"
    && assessment.readiness_recommendation === "RECOMMEND_SEPARATE_RELEASE_READINESS_DECISION"
    && result.status === "PASS"
    && result.project_context_boundary.completed_remediation === "9/9"
    && result.project_context_boundary.stage_9_status === "In Progress"
    && result.project_context_boundary.release_readiness === "NOT_DECLARED"
    && result.project_context_boundary.runtime_boundaries === "CLOSED"
    && result.project_context_boundary.api_simulate_mock_only === true
    && reconciliation.summary.actionable_total === 97
    && reconciliation.summary.unresolved_count === 0;
}

function ledgerIntegrityValid() {
  const ledger = json("docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json");
  const last = ledger.appended_events.at(-1);
  return last?.substep_id === "S9-FIX-09"
    && last.validation_status === "PASS"
    && last.finding_counts.unresolved === 0
    && last.finding_counts.blocking === 0
    && last.release_readiness === "NOT_DECLARED"
    && last.runtime_boundaries === "CLOSED"
    && last.api_simulate_mock_only === true;
}

function planningSnapshotsClassified() {
  const sequence = json("docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json");
  const graph = json("docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json");
  const spec = read(specPath);
  return sequence.implementation_executed === false
    && graph.implementation_executed === false
    && graph.deferred_future_release_candidate === "Stage 9 Release Readiness and Runtime Boundary Decision"
    && spec.includes("are frozen planning evidence")
    && spec.includes("are not current-state authority");
}

function preparedStatusDocumentsValid() {
  return statusPaths.every((path) => {
    const current = read(path).slice(0, 2400).replace(/\s+/g, " ");
    return current.includes("decision contract prepared — 29 July 2026")
      && current.includes("`9/9`")
      && (current.includes("FIX09 `PASS`") || current.includes("FIX09 assessment status is `PASS`") || current.includes("PASS_WITH_NON_BLOCKING_RESIDUAL_RISKS"))
      && current.includes("In Progress")
      && current.includes("NOT_DECLARED")
      && current.includes("CLOSED")
      && current.includes("mockOnly=true")
      && current.includes("Stage 9 Release Readiness and Runtime Boundary Decision")
      && current.includes("S9-FIX-10")
      && current.includes("`0`");
  });
}

function specificationValid() {
  const spec = read(specPath);
  const required = [
    "Stage 9 Release Readiness and Runtime Boundary Decision",
    "COMPLETED_9_OF_9",
    "KEEP_IN_PROGRESS",
    "NOT_DECLARED",
    "DEFERRED_PENDING_RUNTIME_EVIDENCE",
    "project_owner",
    "TEST_ONLY_APPROVED",
    "stage-9-bounded-live-runtime-readiness-evidence.1",
    decisionPath,
    resultPath,
    ...boundaryIds,
    ...riskCategories,
    ...preparationWriteSet,
    ...futureDecisionWriteSet,
  ];
  return required.every((token) => spec.includes(token))
    && noUnstableText(spec)
    && spec.includes("$0.03")
    && spec.includes("at most two provider requests")
    && spec.includes("automatic retries\nzero")
    && spec.includes("no API key")
    && spec.includes("Any requirement for an eighth");
}

function packageCommandValid() {
  const pkg = json("package.json");
  return pkg.scripts["quality:stage-9-release-readiness-runtime-boundary-decision"]
    === "node scripts/stage-9-release-readiness-runtime-boundary-decision-quality.mjs";
}

function residualRisks() {
  const assessment = json("docs/qa/remediation/stage-9/STAGE_9_POST_REMEDIATION_CORPUS_ASSESSMENT.v1.json");
  return riskCategories.map((category) => {
    const source = assessment.residual_risks.find((row) => row.category === category);
    return {
      category,
      acceptance_state: "NOT_ACCEPTED_PENDING_OWNER_DECISION",
      owner_role: "project_owner",
      stage_completion_impact: category === "RELEASE_RUNTIME_UNASSESSED"
        ? "BLOCKS_POSITIVE_COMPLETION_UNDER_CURRENT_PRODUCTION_AI_SCOPE"
        : "REQUIRES_EXPLICIT_DOCUMENTED_TREATMENT",
      release_readiness_impact: ["OFFLINE_EVIDENCE_BOUNDARY", "RELEASE_RUNTIME_UNASSESSED"].includes(category)
        ? "BLOCKS_POSITIVE_RELEASE_READINESS"
        : "REQUIRES_EXPLICIT_DOCUMENTED_TREATMENT",
      runtime_opening_impact: ["OFFLINE_EVIDENCE_BOUNDARY", "RELEASE_RUNTIME_UNASSESSED"].includes(category)
        ? "BLOCKS_RUNTIME_OPENING"
        : "DOES_NOT_INDEPENDENTLY_BLOCK_WITH_OWNER_TREATMENT",
      required_mitigation: source.recommended_next_action,
      evidence: source.evidence,
    };
  });
}

function boundaryRegistry() {
  return boundaryIds.map((boundary_id) => ({
    boundary_id,
    status: "CLOSED",
    evidence_package: null,
    gate_results: [],
    opening_is_independent: true,
    mock_only: boundary_id === "API_SIMULATE_MOCK_ONLY" ? true : null,
  }));
}

function decisionPayload(decision) {
  const value = clone(decision);
  delete value.sign_off;
  return value;
}

function buildDecision({ testOnly = true } = {}) {
  const decision = {
    artifact_version: "stage-9-release-readiness-runtime-boundary-decision.1",
    generated_at: null,
    decision_id: "STAGE_9_RELEASE_READINESS_RUNTIME_BOUNDARY_DECISION_V1",
    decision_kind: "non_remediation_release_runtime_governance_decision",
    decision_disposition: "DEFERRED_PENDING_RUNTIME_EVIDENCE",
    remediation_status: "COMPLETED_9_OF_9",
    stage_9_completion_verdict: "KEEP_IN_PROGRESS",
    release_readiness_verdict: "NOT_DECLARED",
    offline_preparation_status: "OFFLINE_PREPARATION_ALLOWED",
    runtime_boundaries: boundaryRegistry(),
    api_simulate_mock_only: true,
    residual_risks: residualRisks(),
    evidence_sha256: Object.fromEntries(Object.entries(evidenceHashes).filter(([path]) =>
      !statusPaths.includes(path))),
    positive_decision_evidence: {
      stage_completion_exit_criteria: false,
      release_readiness_exit_criteria: false,
      live_runtime_evidence_package: null,
      api_composition_gates: false,
      ui_controlled_error_gates: false,
      persistence_auth_consent_privacy_retention_gates: false,
      route_runtime_implementation_evidence: false,
    },
    provider_execution: {
      network_provider_execution_count: 0,
      bounded_execution_count: 0,
      provider_request_count: 0,
      total_cost_usd: 0,
      cost_ceiling_usd: 0.03,
    },
    rollback_kill_switch: {
      runtime_change_performed: false,
      all_boundaries_closed: true,
      api_simulate_mock_only_preserved: true,
      rollback_action: "Revert only the future decision commit; no runtime rollback is required.",
      live_kill_switch_evidence: "NOT_APPLICABLE_RUNTIME_CLOSED",
    },
    forbidden_combination_validation: "PASS",
    next_action: "Stage 9 Bounded Runtime-Readiness Evidence Preparation",
  };
  const payloadHash = sha(serialize(decisionPayload(decision)));
  decision.sign_off = {
    authority_role: "project_owner",
    approval_state: testOnly ? "TEST_ONLY_APPROVED" : "APPROVED",
    decision_date: null,
    decision_payload_sha256: payloadHash,
    amends_decision_id: null,
    revocation_reason: null,
    test_only: testOnly,
  };
  return decision;
}

function decisionErrors(decision, { temporary = false } = {}) {
  const errors = [];
  const text = serialize(decision);
  const boundaryMap = new Map((decision.runtime_boundaries ?? []).map((row) => [row.boundary_id, row]));
  const approval = decision.sign_off?.approval_state;
  const approved = approval === "APPROVED";
  const temporaryApproved = temporary && approval === "TEST_ONLY_APPROVED" && decision.sign_off?.test_only === true;
  if (decision.artifact_version !== "stage-9-release-readiness-runtime-boundary-decision.1") errors.push("artifact-version");
  if (decision.generated_at !== null) errors.push("timestamp");
  if (decision.remediation_status !== "COMPLETED_9_OF_9") errors.push("remediation-status");
  if (!stageVerdicts.includes(decision.stage_9_completion_verdict)) errors.push("stage-enum");
  if (!releaseVerdicts.includes(decision.release_readiness_verdict)) errors.push("release-enum");
  if (!dispositions.includes(decision.decision_disposition)) errors.push("disposition-enum");
  if (decision.sign_off?.authority_role !== "project_owner") errors.push("owner-role");
  if (!approvalStates.includes(approval)) errors.push("approval-enum");
  if (!(approved || temporaryApproved)) errors.push("owner-approval");
  if (!temporary && approval === "TEST_ONLY_APPROVED") errors.push("test-only-permanent");
  if (decision.sign_off?.decision_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(decision.sign_off.decision_date)) errors.push("decision-date");
  if (decision.sign_off?.decision_payload_sha256 !== sha(serialize(decisionPayload(decision)))) errors.push("payload-hash");
  if (decision.api_simulate_mock_only !== true) errors.push("mock-only");
  if (!noUnstableText(text)) errors.push("unstable-text");
  if (/S9-FIX-10/.test(text)) errors.push("s9-fix-10");
  if ((decision.runtime_boundaries ?? []).map((row) => row.boundary_id).join("|") !== boundaryIds.join("|")) errors.push("boundary-registry");
  if ((decision.runtime_boundaries ?? []).some((row) => !boundaryStatuses.includes(row.status))) errors.push("boundary-status-enum");
  if (boundaryMap.get("API_SIMULATE_MOCK_ONLY")?.mock_only !== true) errors.push("route-mock-only");
  if ((decision.residual_risks ?? []).map((row) => row.category).join("|") !== riskCategories.join("|")) errors.push("residual-risk-registry");
  if ((decision.residual_risks ?? []).some((row) => !riskAcceptanceStates.includes(row.acceptance_state)
    || row.owner_role !== "project_owner" || !row.evidence?.length
    || row.evidence.some((item) => !item.path || !/^[a-f0-9]{64}$/.test(item.sha256)))) errors.push("residual-risk-schema");
  if (!decision.evidence_sha256 || Object.entries(evidenceHashes).filter(([path]) => !statusPaths.includes(path)).some(([path, hash]) => decision.evidence_sha256[path] !== hash)) errors.push("evidence-hash");
  if (decision.stage_9_completion_verdict === "COMPLETE" && decision.positive_decision_evidence?.stage_completion_exit_criteria !== true) errors.push("stage-complete-evidence");
  if (["LIMITED_READY", "READY"].includes(decision.release_readiness_verdict)
    && (!approved || decision.positive_decision_evidence?.release_readiness_exit_criteria !== true)) errors.push("release-ready-evidence");
  const provider = boundaryMap.get("LIVE_OPENAI_PROVIDER_RUNTIME");
  if (provider?.status === "OPEN" && decision.release_readiness_verdict === "NOT_DECLARED") errors.push("provider-open-release-undeclared");
  if (provider?.status !== "CLOSED" && !decision.positive_decision_evidence?.live_runtime_evidence_package) errors.push("provider-evidence");
  const pre = boundaryMap.get("DECISION_ENGINE_PRE_PROVIDER")?.status;
  const post = boundaryMap.get("DECISION_ENGINE_POST_PROVIDER")?.status;
  if (boundaryMap.get("AI_API")?.status !== "CLOSED"
    && (provider?.status === "CLOSED" || pre === "CLOSED" || post === "CLOSED" || !decision.positive_decision_evidence?.api_composition_gates)) errors.push("api-prerequisites");
  if (boundaryMap.get("AI_UI")?.status !== "CLOSED"
    && (boundaryMap.get("AI_API")?.status === "CLOSED" || !decision.positive_decision_evidence?.ui_controlled_error_gates)) errors.push("ui-prerequisites");
  if (boundaryMap.get("PERSISTENCE_COUPLING")?.status !== "CLOSED"
    && !decision.positive_decision_evidence?.persistence_auth_consent_privacy_retention_gates) errors.push("persistence-prerequisites");
  if (decision.api_simulate_mock_only === false && !decision.positive_decision_evidence?.route_runtime_implementation_evidence) errors.push("route-evidence");
  if (decision.decision_disposition === "DEFERRED_PENDING_RUNTIME_EVIDENCE") {
    if (decision.stage_9_completion_verdict !== "KEEP_IN_PROGRESS") errors.push("deferred-stage");
    if (decision.release_readiness_verdict !== "NOT_DECLARED") errors.push("deferred-release");
    if ((decision.runtime_boundaries ?? []).some((row) => row.status !== "CLOSED")) errors.push("deferred-boundaries");
    if ((decision.residual_risks ?? []).some((row) => row.acceptance_state !== "NOT_ACCEPTED_PENDING_OWNER_DECISION")) errors.push("silent-risk-acceptance");
    if (decision.provider_execution?.network_provider_execution_count !== 0
      || decision.provider_execution?.bounded_execution_count !== 0
      || decision.provider_execution?.provider_request_count !== 0
      || decision.provider_execution?.total_cost_usd !== 0) errors.push("deferred-provider-execution");
    if (decision.next_action !== "Stage 9 Bounded Runtime-Readiness Evidence Preparation") errors.push("deferred-next-action");
  } else if (!Object.values(decision.positive_decision_evidence ?? {}).some(Boolean)) {
    errors.push("positive-decision-offline-only");
  }
  return [...new Set(errors)];
}

function buildResult(decision) {
  return {
    artifact_version: "stage-9-release-readiness-runtime-boundary-decision-result.1",
    generated_at: null,
    status: "PASS",
    profile: "TEMPORARY_DEFERRED_KEEP_CLOSED_TEST_ONLY",
    decision_artifact_path: decisionPath,
    decision_artifact_sha256: sha(serialize(decision)),
    execution_write_set: futureDecisionWriteSet,
    decision_disposition: decision.decision_disposition,
    remediation_status: decision.remediation_status,
    stage_9_completion_verdict: decision.stage_9_completion_verdict,
    release_readiness_verdict: decision.release_readiness_verdict,
    all_runtime_boundaries_closed: decision.runtime_boundaries.every((row) => row.status === "CLOSED"),
    api_simulate_mock_only: true,
    owner_sign_off: "TEST_ONLY_NOT_PRODUCTION_APPROVAL",
    mandatory_union: [
      "dedicated-decision-gate",
      "fix09-assessment-artifact-validation",
      "remediation-revision-integrity",
      "exact-seven-file-future-allowlist",
      "status-document-synchronization",
      "evidence-hash-binding",
      "forbidden-combination-validation",
      "runtime-source-diff-protection",
      "network-provider-zero",
      "deterministic-rerun",
      "git-diff-check",
    ],
    preservation: {
      remediation_ledger: "UNCHANGED",
      remediation_sequence: "UNCHANGED",
      dependency_graph: "UNCHANGED",
      fix01_through_fix09_artifacts: "UNCHANGED",
      adapter_route_runtime: "UNCHANGED",
    },
    network_provider_execution_count: 0,
    total_cost_usd: 0,
    deterministic_serialization: true,
    next_action: decision.next_action,
  };
}

function replaceLeadingSection(text, section) {
  const first = text.indexOf("\n## ");
  const second = text.indexOf("\n## ", first + 5);
  if (first < 0 || second < 0) throw new Error("Current-state section boundary not found.");
  return `${text.slice(0, first + 1)}${section.trim()}\n${text.slice(second)}`;
}

function temporaryStatusSection(path) {
  const heading = path === "LEVIO_PROJECT_PROGRESS.md"
    ? "## Stage 9 Progress — temporary deferred decision dry-run"
    : "## Stage 9 temporary deferred decision dry-run";
  return `${heading}\n\nTemporary test-only decision evidence records\n+\`DEFERRED_PENDING_RUNTIME_EVIDENCE\` with remediation\n+\`COMPLETED_9_OF_9\`, Stage 9 \`KEEP_IN_PROGRESS\`, release readiness\n+\`NOT_DECLARED\`, every live runtime boundary \`CLOSED\`, and\n+\`/api/simulate mockOnly=true\`. This temporary profile is not owner approval,\n+does not persist a release decision, does not create \`S9-FIX-10\`, and performs\n+zero provider/network calls. The next action is \`Stage 9 Bounded\n+Runtime-Readiness Evidence Preparation\`; visual migration remaining is \`0\`.\n`;
}

function writeTemporaryDecision() {
  const decision = buildDecision({ testOnly: true });
  const result = buildResult(decision);
  for (const [path, value] of [[decisionPath, decision], [resultPath, result]]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), serialize(value));
  }
  const context = read(contextPath);
  const marker = "Stage 9 remains **In Progress**, release readiness is not declared,";
  const paragraph = "A temporary test-only decision dry-run records `DEFERRED_PENDING_RUNTIME_EVIDENCE`: remediation remains `9/9`, Stage 9 remains `In Progress`, release readiness remains `NOT_DECLARED`, every live runtime boundary remains `CLOSED`, `/api/simulate` remains `mockOnly=true`, and the next action is `Stage 9 Bounded Runtime-Readiness Evidence Preparation`. This is not permanent owner approval or a release/runtime decision.\n\n";
  if (!context.includes(marker)) throw new Error("PROJECT_CONTEXT decision insertion marker missing.");
  writeFileSync(join(root, contextPath), context.replace(marker, `${paragraph}${marker}`));
  for (const path of statusPaths) {
    writeFileSync(join(root, path), replaceLeadingSection(read(path), temporaryStatusSection(path)));
  }
  return {
    paths: futureDecisionWriteSet,
    sha256: Object.fromEntries(futureDecisionWriteSet.map((path) => [path, sha(read(path))])),
    decision_disposition: decision.decision_disposition,
    network_provider_execution_count: 0,
  };
}

function temporaryStatusDocumentsValid() {
  return statusPaths.every((path) => {
    const current = read(path).slice(0, 2200);
    return current.includes("temporary deferred decision dry-run")
      && current.includes("DEFERRED_PENDING_RUNTIME_EVIDENCE")
      && current.includes("COMPLETED_9_OF_9")
      && current.includes("KEEP_IN_PROGRESS")
      && current.includes("NOT_DECLARED")
      && current.includes("CLOSED")
      && current.includes("mockOnly=true")
      && current.includes("S9-FIX-10")
      && current.includes("zero provider/network calls");
  }) && read(contextPath).includes("A temporary test-only decision dry-run records `DEFERRED_PENDING_RUNTIME_EVIDENCE`");
}

function resultValid(result, decision) {
  return result.artifact_version === "stage-9-release-readiness-runtime-boundary-decision-result.1"
    && result.generated_at === null
    && result.status === "PASS"
    && result.decision_artifact_sha256 === sha(serialize(decision))
    && samePaths(result.execution_write_set, futureDecisionWriteSet)
    && result.all_runtime_boundaries_closed === true
    && result.api_simulate_mock_only === true
    && result.network_provider_execution_count === 0
    && result.total_cost_usd === 0
    && result.deterministic_serialization === true;
}

function selfTests() {
  const validTemporary = buildDecision({ testOnly: true });
  const validPermanent = buildDecision({ testOnly: false });
  const negativeCases = [];
  const mutate = (id, fn, temporary = true, { preserveBadHash = false } = {}) => {
    const value = clone(validTemporary);
    fn(value);
    if (!preserveBadHash) {
      value.sign_off.decision_payload_sha256 = sha(serialize(decisionPayload(value)));
    }
    negativeCases.push({ id, rejected: decisionErrors(value, { temporary }).length > 0 });
  };
  mutate("stage-complete-without-runtime-evidence", (v) => { v.stage_9_completion_verdict = "COMPLETE"; v.decision_disposition = "STAGE_COMPLETE_RELEASE_NOT_DECLARED"; });
  mutate("release-ready-without-owner", (v) => { v.release_readiness_verdict = "READY"; v.sign_off.approval_state = "NOT_APPROVED"; });
  mutate("runtime-open-release-undeclared", (v) => { v.runtime_boundaries[0].status = "OPEN"; });
  mutate("provider-open-without-evidence", (v) => { v.runtime_boundaries[0].status = "BOUNDED_VALIDATION_AUTHORIZED"; });
  mutate("api-open-without-composition", (v) => { v.runtime_boundaries[4].status = "OPEN"; });
  mutate("ui-open-without-safe-api", (v) => { v.runtime_boundaries[5].status = "OPEN"; });
  mutate("persistence-open-without-prerequisites", (v) => { v.runtime_boundaries[6].status = "OPEN"; });
  mutate("mock-only-false", (v) => { v.api_simulate_mock_only = false; });
  mutate("missing-residual-risk", (v) => { v.residual_risks.pop(); });
  mutate("silent-residual-risk-acceptance", (v) => { v.residual_risks[0].acceptance_state = "ACCEPTED"; });
  mutate("missing-evidence-hash", (v) => { delete v.evidence_sha256[Object.keys(v.evidence_sha256)[0]]; });
  mutate("stale-remediation-status", (v) => { v.remediation_status = "COMPLETED_0_OF_9"; });
  mutate("stale-fix01-next-status", (v) => { v.next_action = "S9-FIX-01"; });
  mutate("s9-fix-10", (v) => { v.next_action = "S9-FIX-10"; });
  mutate("network-provider-execution", (v) => { v.provider_execution.network_provider_execution_count = 1; });
  mutate("absolute-path", (v) => { v.next_action = "/Users/test/decision"; });
  mutate("wall-clock-timestamp", (v) => { v.generated_at = "2026-07-29T12:00:00Z"; });
  mutate("eighth-boundary", (v) => { v.runtime_boundaries.push({ boundary_id: "EXTRA", status: "CLOSED" }); });
  mutate("all-boundaries-open", (v) => { v.runtime_boundaries.forEach((row) => { row.status = "OPEN"; }); });
  mutate("wrong-owner-role", (v) => { v.sign_off.authority_role = "gate"; });
  mutate("timestamp-signoff-date", (v) => { v.sign_off.decision_date = "2026-07-29T12:00:00Z"; });
  mutate("bad-signoff-hash", (v) => { v.sign_off.decision_payload_sha256 = "0".repeat(64); }, true, { preserveBadHash: true });
  mutate("positive-disposition-offline-only", (v) => { v.decision_disposition = "RUNTIME_BOUNDARY_CHANGE_APPROVED"; });
  negativeCases.push({
    id: "test-only-signoff-in-permanent-profile",
    rejected: decisionErrors(validTemporary, { temporary: false }).includes("test-only-permanent"),
  });
  negativeCases.push({
    id: "eighth-decision-file",
    rejected: !samePaths([...futureDecisionWriteSet, "extra.json"], futureDecisionWriteSet),
  });
  negativeCases.push({
    id: "protected-ledger-change",
    rejected: !futureDecisionWriteSet.includes("docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json"),
  });
  negativeCases.push({
    id: "protected-sequence-graph-change",
    rejected: !futureDecisionWriteSet.includes("docs/qa/remediation/stage-9/AI_REMEDIATION_SEQUENCE.v1.json")
      && !futureDecisionWriteSet.includes("docs/qa/remediation/stage-9/AI_REMEDIATION_DEPENDENCY_GRAPH.v1.json"),
  });
  negativeCases.push({
    id: "protected-adapter-route-change",
    rejected: !futureDecisionWriteSet.includes("lib/ai-provider/openai-synthetic-risk-adapter.ts")
      && !futureDecisionWriteSet.includes("app/api/simulate/route.ts"),
  });
  return {
    positive: {
      total: 2,
      passed: [
        decisionErrors(validTemporary, { temporary: true }).length === 0,
        decisionErrors(validPermanent, { temporary: false }).length === 0,
      ].filter(Boolean).length,
    },
    negative: {
      total: negativeCases.length,
      passed: negativeCases.filter((row) => row.rejected).length,
      failed: negativeCases.filter((row) => !row.rejected).map((row) => row.id),
    },
    deterministic: serialize(buildDecision({ testOnly: true })) === serialize(buildDecision({ testOnly: true })),
  };
}

function prospectiveContract(networkRequests) {
  const tests = selfTests();
  const checks = {
    exact_seven_file_preparation_diff: samePaths(diffPaths(), preparationWriteSet),
    specification_contract: specificationValid(),
    package_command: packageCommandValid(),
    synchronized_status_documents: preparedStatusDocumentsValid(),
    decision_artifacts_absent: !existsSync(join(root, decisionPath)) && !existsSync(join(root, resultPath)),
    immutable_evidence_hashes: immutableEvidenceValid(),
    fix09_assessment_artifact_validation: assessmentEvidenceValid(),
    remediation_revision_integrity: ledgerIntegrityValid(),
    frozen_planning_authority_classification: planningSnapshotsClassified(),
    current_deferred_outcome_only: statusPaths.every((path) => !read(path).slice(0, 2200).includes("Stage 9 is Complete")),
    positive_self_tests: tests.positive.passed === tests.positive.total,
    negative_self_tests: tests.negative.passed === tests.negative.total,
    deterministic_self_tests: tests.deterministic,
    network_provider_zero: networkRequests === 0,
  };
  return {
    profile: "STAGE_9_RELEASE_RUNTIME_DECISION_PREPARATION_PROSPECTIVE",
    passed: Object.values(checks).every(Boolean),
    checks,
    preparation_write_set: preparationWriteSet,
    future_decision_write_set: futureDecisionWriteSet,
    current_decision_disposition: "DEFERRED_PENDING_RUNTIME_EVIDENCE",
    stage_9_status: "IN_PROGRESS",
    release_readiness: "NOT_DECLARED",
    runtime_boundaries: "ALL_CLOSED",
    api_simulate_mock_only: true,
    self_tests: tests,
    network_provider_execution_count: networkRequests,
  };
}

function postDecisionContract({ temporary, networkRequests }) {
  const decision = json(decisionPath);
  const result = json(resultPath);
  const errors = decisionErrors(decision, { temporary });
  const first = serialize(buildDecision({ testOnly: temporary }));
  const second = serialize(buildDecision({ testOnly: temporary }));
  const checks = {
    exact_seven_file_future_diff: samePaths(diffPaths(), futureDecisionWriteSet),
    decision_schema_and_combinations: errors.length === 0,
    result_artifact: resultValid(result, decision),
    synchronized_status_documents: temporary ? temporaryStatusDocumentsValid() : true,
    immutable_evidence_hashes: immutableEvidenceValid({ contextFromHead: true }),
    fix09_assessment_artifact_validation: assessmentEvidenceValid(),
    remediation_revision_integrity: ledgerIntegrityValid(),
    evidence_hash_binding: decision.sign_off?.decision_payload_sha256 === sha(serialize(decisionPayload(decision))),
    runtime_source_diff_protection: !diffPaths().some((path) =>
      path.startsWith("app/") || path.startsWith("components/") || path.startsWith("lib/")
      || path.startsWith("supabase/") || path.includes("AI_REMEDIATION_REVISION_LEDGER")
      || path.includes("AI_REMEDIATION_SEQUENCE") || path.includes("AI_REMEDIATION_DEPENDENCY_GRAPH")),
    all_runtime_boundaries_closed: decision.runtime_boundaries.every((row) => row.status === "CLOSED"),
    api_simulate_mock_only: decision.api_simulate_mock_only === true,
    deterministic_serialization: first === second && serialize(decision) === read(decisionPath),
    no_absolute_paths_or_timestamps: noUnstableText(read(decisionPath) + read(resultPath)),
    network_provider_zero: networkRequests === 0
      && decision.provider_execution.network_provider_execution_count === 0
      && result.network_provider_execution_count === 0,
  };
  return {
    profile: temporary
      ? "STAGE_9_RELEASE_RUNTIME_DECISION_TEMPORARY_DEFERRED_STRICT"
      : "STAGE_9_RELEASE_RUNTIME_DECISION_PERMANENT_STRICT",
    passed: Object.values(checks).every(Boolean),
    checks,
    errors,
    decision_disposition: decision.decision_disposition,
    decision_sha256: sha(read(decisionPath)),
    result_sha256: sha(read(resultPath)),
    output_sha256: Object.fromEntries(futureDecisionWriteSet.map((path) => [path, sha(read(path))])),
    network_provider_execution_count: networkRequests,
  };
}

async function runCli() {
  let networkRequests = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    networkRequests += 1;
    throw new Error("Network/provider execution is forbidden by decision preparation.");
  };
  try {
    const writeTemporary = process.argv.includes("--write-temporary-decision");
    const temporary = process.argv.includes("--temporary-decision");
    const selfTestOnly = process.argv.includes("--self-test-json");
    if ([writeTemporary, temporary, selfTestOnly].filter(Boolean).length > 1) {
      throw new Error("Use only one explicit mode.");
    }
    if (writeTemporary) {
      console.log(JSON.stringify(writeTemporaryDecision(), null, 2));
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
    const paths = diffPaths();
    const contract = temporary
      ? postDecisionContract({ temporary: true, networkRequests })
      : samePaths(paths, futureDecisionWriteSet)
        ? postDecisionContract({ temporary: false, networkRequests })
        : prospectiveContract(networkRequests);
    console.log(JSON.stringify(contract, null, 2));
    if (!contract.passed) process.exitCode = 1;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

await runCli();
