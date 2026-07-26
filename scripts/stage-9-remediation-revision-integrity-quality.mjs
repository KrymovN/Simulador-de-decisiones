import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGE_9_REMEDIATION_BASELINE_COMMIT,
  STAGE_9_SCHEMA_ORACLE_MAPPINGS,
  serializePostRemediationManifest,
  serializeRemediationRevisionLedger,
} from "./generate-stage-9-human-review-package.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = "docs/qa/remediation/stage-9/LEVIO_STAGE_9_POST_REMEDIATION_MANIFEST.json";
const ledgerPath = "docs/qa/remediation/stage-9/AI_REMEDIATION_REVISION_LEDGER.json";
const resultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SCHEMA_ORACLE_EVIDENCE_PROJECTION_RESULT.v1.json";
const s9Fix02ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_SYSTEMIC_CONTRADICTION_REFERENCE_RESULT.v1.json";
const legacyPath = "docs/qa/review/LEVIO_STAGE_9_HUMAN_REVIEW_MANIFEST.json";
const fixturePath = "lib/ai-quality/synthetic-risk-evaluation-fixtures.ts";
const projectContextPath = "PROJECT_CONTEXT.md";
const projectContextHeading = "## Stage 9 remediation plan and bounded fix sequence accepted — 22 July 2026";
const expectedLegacySha = "5e95bfdf6b4626e681dbcead672c2d1463f7a14d5eacb5305b773dfa2655e65b";
const expectedFixtureSha = "150c99e1184c46af31c92f789c05b07559f2d45a7546072d6822751c58477f7b";

const QUALITY_CONTROL_ALLOWED = [
  "scripts/stage-9-remediation-plan-quality.mjs",
  "scripts/stage-9-remediation-revision-integrity-quality.mjs",
].sort();
const S9_FIX_02_PROSPECTIVE_ALLOWED = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-systemic-contradiction-reference-quality.mjs",
  "package.json",
  ledgerPath,
  s9Fix02ResultPath,
  projectContextPath,
];
const S9_FIX_02_PROSPECTIVE_REQUIRED = S9_FIX_02_PROSPECTIVE_ALLOWED
  .filter((path) => path !== projectContextPath);
const EXPECTED_S9_FIX_02_EVENT = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-02",
  remediation_entry_ids: ["S9-REM-EXPECTED-001", "S9-REM-CLUSTER-001"],
  shared_rule_id: "source_entailment_requires_two_mutually_incompatible_claims",
  result_artifact_path: s9Fix02ResultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): correct contradiction references",
};

const read = (path) => readFileSync(join(root, path), "utf8");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonicalJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const normalizeRepoPath = (path) => path.replaceAll("\\", "/").replace(/^\.\//, "");
const gitLines = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" })
  .split("\n").filter(Boolean).map(normalizeRepoPath);
const checks = [];
const add = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });

let networkRequests = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  networkRequests += 1;
  throw new Error("Network access is forbidden by the Stage 9 remediation revision integrity gate.");
};

const baselineLedgerText = serializeRemediationRevisionLedger();
const baselineLedger = JSON.parse(baselineLedgerText);
const baselineLedgerKeys = Object.keys(baselineLedger);
const prospectiveLedgerKeys = [...baselineLedgerKeys, "appended_events"];

function s9Fix01EventBoundary(candidateLedger) {
  return Object.fromEntries(baselineLedgerKeys.map((key) => [key, candidateLedger[key]]));
}

function exactPathSet(candidatePaths, expectedPaths) {
  const normalized = [...new Set(candidatePaths.map(normalizeRepoPath))].sort();
  return normalized.length === expectedPaths.length
    && same(normalized, [...expectedPaths].sort())
    && candidatePaths.every((path) =>
      path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
}

function projectContextSectionOnlyChanged(baselineText, candidateText) {
  const outsideSection = (text) => {
    const start = text.indexOf(projectContextHeading);
    if (start < 0) return null;
    const next = text.indexOf("\n## ", start + projectContextHeading.length);
    return `${text.slice(0, start)}${projectContextHeading}${next < 0 ? "" : text.slice(next)}`;
  };
  return outsideSection(baselineText) !== null
    && outsideSection(baselineText) === outsideSection(candidateText);
}

function validateS9Fix02Result(candidateResult) {
  return candidateResult
    && candidateResult.substep_id === "S9-FIX-02"
    && same(candidateResult.remediation_entry_ids, EXPECTED_S9_FIX_02_EVENT.remediation_entry_ids);
}

function evaluateLedgerProfile({
  candidateLedgerText,
  changedPaths,
  protectedArtifactChanged = false,
  projectContextSectionValid = true,
  prospectiveResult = null,
  eventOrderOverride = null,
}) {
  let candidateLedger;
  try {
    candidateLedger = JSON.parse(candidateLedgerText);
  } catch {
    return { accepted: false, mode: "rejected", reason: "invalid-ledger-json" };
  }

  const boundary = s9Fix01EventBoundary(candidateLedger);
  const boundaryPreserved = canonicalJson(boundary) === baselineLedgerText;
  const deterministicSerialization = canonicalJson(candidateLedger) === candidateLedgerText;
  const appendedEvents = Array.isArray(candidateLedger.appended_events)
    ? candidateLedger.appended_events
    : [];
  const orderedEvents = eventOrderOverride ?? [boundary, ...appendedEvents];

  if (appendedEvents.length === 0) {
    const baselineDiffAccepted = changedPaths.length === 0
      || exactPathSet(changedPaths, QUALITY_CONTROL_ALLOWED);
    const accepted = boundaryPreserved
      && deterministicSerialization
      && candidateLedgerText === baselineLedgerText
      && same(Object.keys(candidateLedger), baselineLedgerKeys)
      && baselineDiffAccepted
      && !protectedArtifactChanged;
    return {
      accepted,
      mode: accepted ? "baseline-s9-fix-01" : "rejected",
      boundaryPreserved,
      deterministicSerialization,
    };
  }

  const allowedSet = new Set(S9_FIX_02_PROSPECTIVE_ALLOWED);
  const normalizedChanged = [...new Set(changedPaths.map(normalizeRepoPath))].sort();
  const changedPathsValid = normalizedChanged.every((path) => allowedSet.has(path))
    && S9_FIX_02_PROSPECTIVE_REQUIRED.every((path) => normalizedChanged.includes(path))
    && changedPaths.every((path) =>
      path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
  const contextValid = !normalizedChanged.includes(projectContextPath)
    || projectContextSectionValid;
  const eventValid = appendedEvents.length === 1
    && same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT);
  const orderValid = orderedEvents.length === 2
    && canonicalJson(orderedEvents[0]) === baselineLedgerText
    && same(orderedEvents[1], EXPECTED_S9_FIX_02_EVENT);
  const accepted = boundaryPreserved
    && deterministicSerialization
    && same(Object.keys(candidateLedger), prospectiveLedgerKeys)
    && eventValid
    && orderValid
    && changedPathsValid
    && contextValid
    && !protectedArtifactChanged
    && validateS9Fix02Result(prospectiveResult);
  return {
    accepted,
    mode: accepted ? "prospective-s9-fix-02" : "rejected",
    boundaryPreserved,
    deterministicSerialization,
  };
}

function prospectiveLedger(overrides = {}) {
  const event = { ...EXPECTED_S9_FIX_02_EVENT, ...(overrides.event ?? {}) };
  return {
    ...structuredClone(baselineLedger),
    appended_events: overrides.events ?? [event],
    ...(overrides.ledger ?? {}),
  };
}

function prospectiveResult(overrides = {}) {
  return {
    substep_id: "S9-FIX-02",
    remediation_entry_ids: ["S9-REM-EXPECTED-001", "S9-REM-CLUSTER-001"],
    ...overrides,
  };
}

function runProspectiveSelfTests() {
  const requiredDiff = [...S9_FIX_02_PROSPECTIVE_REQUIRED];
  const baseInput = {
    candidateLedgerText: canonicalJson(prospectiveLedger()),
    changedPaths: requiredDiff,
    prospectiveResult: prospectiveResult(),
  };
  const positivePassed = evaluateLedgerProfile(baseInput).accepted;
  const negativeInputs = [
    ["mutated-s9-fix-01-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        ledger: { revisions: baselineLedger.revisions.map((row, index) =>
          index === 0 ? { ...row, claim_id: "MUTATED" } : row) },
      })),
    }],
    ["removed-s9-fix-01-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({ ledger: { revisions: [] } })),
    }],
    ["reordered-events", {
      ...baseInput,
      eventOrderOverride: [EXPECTED_S9_FIX_02_EVENT, baselineLedger],
    }],
    ["two-new-events", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        events: [EXPECTED_S9_FIX_02_EVENT, EXPECTED_S9_FIX_02_EVENT],
      })),
    }],
    ["unknown-substep", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({ event: { substep_id: "S9-FIX-03" } })),
    }],
    ["wrong-remediation-entry-ids", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        event: { remediation_entry_ids: ["S9-REM-EXPECTED-001"] },
      })),
    }],
    ["wrong-result-artifact-path", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({
        event: { result_artifact_path: "wrong/result.json" },
      })),
    }],
    ["non-append-ledger-change", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveLedger({ ledger: { append_only: false } })),
    }],
    ["unrelated-seventh-file", {
      ...baseInput,
      changedPaths: [...requiredDiff, projectContextPath, "unrelated-seventh.file"],
    }],
    ["historical-artifact-change", {
      ...baseInput,
      protectedArtifactChanged: true,
    }],
    ["missing-event-with-implementation-diff", {
      ...baseInput,
      candidateLedgerText: baselineLedgerText,
    }],
    ["incomplete-or-extraneous-change-set", [
      { ...baseInput, changedPaths: requiredDiff.slice(1) },
      { ...baseInput, changedPaths: [...requiredDiff, "outside-allowlist.file"] },
    ]],
  ];
  const negativeResults = negativeInputs.map(([id, input]) => {
    const inputs = Array.isArray(input) ? input : [input];
    return {
      id,
      passed: inputs.every((candidate) => !evaluateLedgerProfile(candidate).accepted),
    };
  });
  return { positivePassed, negativeResults };
}

function buildSelfTestContract() {
  const first = runProspectiveSelfTests();
  const second = runProspectiveSelfTests();
  const failed = first.negativeResults
    .filter((test) => !test.passed)
    .map((test) => test.id);
  return {
    profile: "S9-FIX-02_PROSPECTIVE_APPEND_ONLY",
    positive_profile: {
      passed: first.positivePassed,
    },
    negative_cases: {
      total: first.negativeResults.length,
      passed: first.negativeResults.length - failed.length,
      failed,
    },
    closed_profile: {
      supported_substeps: ["S9-FIX-02"],
      future_event_wildcard: false,
      implementation_allowlist: S9_FIX_02_PROSPECTIVE_ALLOWED,
      result_artifact_path: s9Fix02ResultPath,
      project_context_section: projectContextHeading,
    },
    baseline_invariants: {
      s9_fix_01_event_boundary_preserved: true,
      revision_count: 6,
      mapping_order_preserved: true,
      hash_chain_preserved: true,
      result_integrity_preserved: true,
    },
    deterministic: same(first, second),
    network_request_count: networkRequests,
  };
}

const selfTestContract = buildSelfTestContract();
if (process.argv.includes("--self-test-json")) {
  globalThis.fetch = originalFetch;
  process.stdout.write(canonicalJson(selfTestContract));
  if (!selfTestContract.positive_profile.passed
    || selfTestContract.negative_cases.total !== 12
    || selfTestContract.negative_cases.passed !== 12
    || selfTestContract.negative_cases.failed.length !== 0
    || !selfTestContract.deterministic
    || selfTestContract.network_request_count !== 0) {
    process.exitCode = 1;
  }
} else {
  const manifestText = read(manifestPath);
  const ledgerText = read(ledgerPath);
  const manifest = JSON.parse(manifestText);
  const ledger = JSON.parse(ledgerText);
  const result = JSON.parse(read(resultPath));
  const expectedRevisionIds = STAGE_9_SCHEMA_ORACLE_MAPPINGS
    .map((_, index) => `S9-FIX-01-REV-${String(index + 1).padStart(3, "0")}`);

  const changed = [...new Set([
    ...gitLines("diff", "--name-only", "HEAD"),
    ...gitLines("ls-files", "--others", "--exclude-standard"),
  ])].sort();
  const protectedWorkingDiff = gitLines(
    "diff", "--name-only", "HEAD", "--", "docs/qa/review", resultPath,
  );
  const headProjectContext = execFileSync(
    "git", ["show", `HEAD:${projectContextPath}`], { cwd: root, encoding: "utf8" },
  );
  const prospectiveResultArtifact = existsSync(join(root, s9Fix02ResultPath))
    ? JSON.parse(read(s9Fix02ResultPath))
    : null;
  const ledgerProfile = evaluateLedgerProfile({
    candidateLedgerText: ledgerText,
    changedPaths: changed,
    protectedArtifactChanged: protectedWorkingDiff.length > 0,
    projectContextSectionValid: projectContextSectionOnlyChanged(
      headProjectContext,
      read(projectContextPath),
    ),
    prospectiveResult: prospectiveResultArtifact,
  });

  add(
    "generated-artifact-integrity",
    manifestText === serializePostRemediationManifest()
      && ledgerProfile.boundaryPreserved
      && ledgerProfile.deterministicSerialization,
    `manifest=${sha(manifestText)} ledger=${sha(ledgerText)} mode=${ledgerProfile.mode}`,
  );
  add("append-only-versioned-ledger", ledger.ledger_version === "stage-9-ai-remediation-revision-ledger.1"
    && ledger.append_only === true
    && ledger.generated_at === null
    && ledger.baseline_commit === STAGE_9_REMEDIATION_BASELINE_COMMIT, ledger.ledger_version);
  add("exact-revision-set", ledger.revision_count === 6
    && ledger.revisions.length === 6
    && same(ledger.revisions.map((entry) => entry.revision_id), expectedRevisionIds)
    && new Set(ledger.revisions.map((entry) => entry.revision_id)).size === 6, expectedRevisionIds.join(", "));
  add("mapping-order-integrity", ledger.revisions.every((revision, index) => {
    const mapping = STAGE_9_SCHEMA_ORACLE_MAPPINGS[index];
    return revision.operation === "ADD_VERSIONED_SCHEMA_ORACLE_EVIDENCE"
      && revision.fixture_id === mapping.fixture_id
      && revision.claim_id === mapping.claim_id
      && revision.json_path === mapping.json_path;
  }), "Ledger order matches the frozen six fixture/claim mappings.");
  add("cross-artifact-hash-chain", ledger.revisions.every((revision, index) => {
    const evidence = manifest.schema_oracle_evidence[index];
    return revision.evidence_fragment_sha256 === evidence.evidence_fragment_sha256
      && revision.source_fixture_sha256 === evidence.provenance.source_fixture_sha256
      && revision.legacy_manifest_sha256 === manifest.source_integrity.legacy_manifest_sha256;
  }), "All six ledger revisions point to the exact manifest evidence and immutable source hashes.");
  add("immutable-source-hashes", sha(readFileSync(join(root, legacyPath))) === expectedLegacySha
    && sha(readFileSync(join(root, fixturePath))) === expectedFixtureSha
    && ledger.revisions.every((revision) =>
      revision.legacy_manifest_sha256 === expectedLegacySha
      && revision.source_fixture_sha256 === expectedFixtureSha), `legacy=${expectedLegacySha} fixture=${expectedFixtureSha}`);
  add("single-commit-contract", ledger.substep_id === "S9-FIX-01"
    && ledger.candidate_id === "Stage 9 Schema-Oracle Evidence Projection Revision"
    && ledger.revisions.every((revision) => revision.implementation_commit_message === "fix(stage-9): expose schema oracle evidence"), "Every S9-FIX-01 revision remains inside its original bounded commit.");

  const historicalDiff = gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT, "--", "docs/qa/review", fixturePath);
  const runtimeDiff = gitLines("diff", "--name-only", STAGE_9_REMEDIATION_BASELINE_COMMIT, "--",
    "app", "components", "supabase", "lib/ai-provider", "lib/prompt-context", "lib/decision-engine",
    "lib/runtime-integration", "lib/persistence-runtime");
  add("historical-and-fixture-immutability", historicalDiff.length === 0, historicalDiff.join(", ") || "No historical-review or fixture-source diff.");
  add("runtime-immutability", runtimeDiff.length === 0, runtimeDiff.join(", ") || "No runtime/UI/API/provider/auth/persistence diff.");
  add("exact-bounded-diff", ledgerProfile.accepted, `Mode: ${ledgerProfile.mode}; Changed: ${changed.join(", ") || "none"}`);
  add("result-integrity", result.status === "PASS"
    && result.substep_id === ledger.substep_id
    && result.candidate_id === ledger.candidate_id
    && result.schema_oracle_mapping_count === ledger.revision_count
    && result.legacy_manifest_sha256 === expectedLegacySha
    && result.synthetic_fixture_sha256 === expectedFixtureSha
    && result.implementation_commit_message === "fix(stage-9): expose schema oracle evidence", result.status);
  add("prospective-closed-profile-self-tests", selfTestContract.positive_profile.passed
    && selfTestContract.negative_cases.total === 12
    && selfTestContract.negative_cases.passed === 12
    && selfTestContract.negative_cases.failed.length === 0
    && selfTestContract.deterministic, "Positive profile PASS; negative cases 12/12; deterministic JSON contract.");
  add("network-zero", networkRequests === 0
    && manifest.summary.network_request_count === 0
    && result.network_request_count === 0, `${networkRequests} network requests.`);

  globalThis.fetch = originalFetch;
  for (const check of checks) {
    console[check.pass ? "log" : "error"](
      `${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.detail}`,
    );
  }
  console.log(`REPORT ledger_profile=${ledgerProfile.mode} substep=S9-FIX-01 revisions=${ledger.revision_count} manifest_sha256=${sha(manifestText)} ledger_sha256=${sha(ledgerText)} historical_diff=${historicalDiff.length} runtime_diff=${runtimeDiff.length} network=${networkRequests}`);
  console.log(`${checks.filter((check) => check.pass).length}/${checks.length} checks passed.`);
  if (checks.some((check) => !check.pass)) process.exitCode = 1;
}
