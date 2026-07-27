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
const s9Fix03ResultPath = "docs/qa/remediation/stage-9/results/STAGE_9_HIGH_RISK_CLARIFICATION_REFUSAL_RESULT.v1.json";
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
const S9_FIX_03_PROSPECTIVE_ALLOWED = [
  "lib/ai-decision-material/fixtures.ts",
  "scripts/stage-9-high-risk-reference-quality.mjs",
  "package.json",
  ledgerPath,
  s9Fix03ResultPath,
  projectContextPath,
];
const S9_FIX_03_PROSPECTIVE_REQUIRED = S9_FIX_03_PROSPECTIVE_ALLOWED
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
const EXPECTED_S9_FIX_03_EVENT = {
  event_version: "stage-9-ai-remediation-revision-event.1",
  substep_id: "S9-FIX-03",
  remediation_entry_ids: ["S9-REM-EXPECTED-002"],
  shared_rule_id: "high_risk_clarification_refusal_expected_reference",
  result_artifact_path: s9Fix03ResultPath,
  generated_at: null,
  implementation_commit_message: "fix(stage-9): correct high-risk references",
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
const committedLedgerText = execFileSync(
  "git",
  ["show", `HEAD:${ledgerPath}`],
  { cwd: root, encoding: "utf8" },
);

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

function validateS9Fix03Result(candidateResult) {
  return candidateResult
    && candidateResult.substep_id === "S9-FIX-03"
    && candidateResult.candidate_id === "S9-REM-EXPECTED-002";
}

function evaluateLedgerProfile({
  candidateLedgerText,
  changedPaths,
  protectedArtifactChanged = false,
  projectContextSectionValid = true,
  prospectiveResult = null,
  eventOrderOverride = null,
  requestedProfile = null,
  futureEventWildcard = false,
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
  const normalizedChanged = [...new Set(changedPaths.map(normalizeRepoPath))].sort();
  const contextValid = !normalizedChanged.includes(projectContextPath)
    || projectContextSectionValid;
  const pathsValidFor = (allowed, required) => {
    const allowedSet = new Set(allowed);
    return normalizedChanged.every((path) => allowedSet.has(path))
      && required.every((path) => normalizedChanged.includes(path))
      && changedPaths.every((path) =>
        path === normalizeRepoPath(path) && !path.startsWith("/") && !path.startsWith(".git/"));
  };
  const supportedProfileRequested =
    requestedProfile === "S9-FIX-02" || requestedProfile === "S9-FIX-03";
  if (requestedProfile !== null && !supportedProfileRequested) {
    return {
      accepted: false,
      mode: "rejected",
      reason: "unknown-requested-profile",
      boundaryPreserved,
      deterministicSerialization,
    };
  }

  const inferredProfile = requestedProfile
    ?? (appendedEvents.length === 2 && appendedEvents[1]?.substep_id === "S9-FIX-03"
      ? "S9-FIX-03"
      : null);

  if (inferredProfile === "S9-FIX-02") {
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
      && pathsValidFor(S9_FIX_02_PROSPECTIVE_ALLOWED, S9_FIX_02_PROSPECTIVE_REQUIRED)
      && contextValid
      && !protectedArtifactChanged
      && !futureEventWildcard
      && validateS9Fix02Result(prospectiveResult);
    return {
      accepted,
      mode: accepted ? "prospective-s9-fix-02" : "rejected",
      boundaryPreserved,
      deterministicSerialization,
    };
  }

  if (inferredProfile === "S9-FIX-03") {
    const eventValid = appendedEvents.length === 2
      && same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT)
      && same(appendedEvents[1], EXPECTED_S9_FIX_03_EVENT);
    const orderValid = orderedEvents.length === 3
      && canonicalJson(orderedEvents[0]) === baselineLedgerText
      && same(orderedEvents[1], EXPECTED_S9_FIX_02_EVENT)
      && same(orderedEvents[2], EXPECTED_S9_FIX_03_EVENT);
    const accepted = boundaryPreserved
      && deterministicSerialization
      && same(Object.keys(candidateLedger), prospectiveLedgerKeys)
      && eventValid
      && orderValid
      && pathsValidFor(S9_FIX_03_PROSPECTIVE_ALLOWED, S9_FIX_03_PROSPECTIVE_REQUIRED)
      && contextValid
      && !protectedArtifactChanged
      && !futureEventWildcard
      && validateS9Fix03Result(prospectiveResult);
    return {
      accepted,
      mode: accepted ? "prospective-s9-fix-03" : "rejected",
      boundaryPreserved,
      s9Fix02EventBoundaryPreserved:
        same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT),
      deterministicSerialization,
    };
  }

  const qualityControlDiffAccepted = changedPaths.length === 0
    || exactPathSet(changedPaths, QUALITY_CONTROL_ALLOWED);
  if (candidateLedgerText === committedLedgerText) {
    const accepted = boundaryPreserved
      && deterministicSerialization
      && qualityControlDiffAccepted
      && !protectedArtifactChanged
      && !futureEventWildcard;
    return {
      accepted,
      mode: accepted ? "committed-baseline-s9-fix-02" : "rejected",
      boundaryPreserved,
      s9Fix02EventBoundaryPreserved:
        same(appendedEvents[0], EXPECTED_S9_FIX_02_EVENT),
      deterministicSerialization,
    };
  }

  if (appendedEvents.length === 0) {
    const accepted = boundaryPreserved
      && deterministicSerialization
      && candidateLedgerText === baselineLedgerText
      && same(Object.keys(candidateLedger), baselineLedgerKeys)
      && qualityControlDiffAccepted
      && !protectedArtifactChanged
      && !futureEventWildcard;
    return {
      accepted,
      mode: accepted ? "baseline-s9-fix-01" : "rejected",
      boundaryPreserved,
      deterministicSerialization,
    };
  }
  return {
    accepted: false,
    mode: "rejected",
    reason: "missing-profile-context",
    boundaryPreserved,
    deterministicSerialization,
  };
}

function classifyActualChangeSet({
  candidateLedgerText,
  changedPaths,
  s9Fix02Result = null,
  s9Fix03Result = null,
  ...profileInput
}) {
  const s9Fix03Phase = exactPathSet(changedPaths, S9_FIX_03_PROSPECTIVE_REQUIRED)
    || exactPathSet(changedPaths, S9_FIX_03_PROSPECTIVE_ALLOWED);
  const s9Fix02Phase = exactPathSet(changedPaths, S9_FIX_02_PROSPECTIVE_REQUIRED)
    || exactPathSet(changedPaths, S9_FIX_02_PROSPECTIVE_ALLOWED);
  const requestedProfile = s9Fix03Phase
    ? "S9-FIX-03"
    : s9Fix02Phase
      ? "S9-FIX-02"
      : null;
  const prospectiveResult = requestedProfile === "S9-FIX-03"
    ? s9Fix03Result
    : requestedProfile === "S9-FIX-02"
      ? s9Fix02Result
      : null;

  return evaluateLedgerProfile({
    candidateLedgerText,
    changedPaths,
    ...profileInput,
    prospectiveResult,
    requestedProfile,
  });
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

function prospectiveS9Fix03Ledger(overrides = {}) {
  const event = { ...EXPECTED_S9_FIX_03_EVENT, ...(overrides.event ?? {}) };
  return {
    ...structuredClone(baselineLedger),
    appended_events: overrides.events ?? [
      structuredClone(EXPECTED_S9_FIX_02_EVENT),
      event,
    ],
    ...(overrides.ledger ?? {}),
  };
}

function prospectiveS9Fix03Result(overrides = {}) {
  return {
    substep_id: "S9-FIX-03",
    candidate_id: "S9-REM-EXPECTED-002",
    ...overrides,
  };
}

function runProspectiveSelfTests() {
  const requiredDiff = [...S9_FIX_02_PROSPECTIVE_REQUIRED];
  const baseInput = {
    candidateLedgerText: canonicalJson(prospectiveLedger()),
    changedPaths: requiredDiff,
    prospectiveResult: prospectiveResult(),
    requestedProfile: "S9-FIX-02",
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

function runS9Fix03ProspectiveSelfTests() {
  const requiredDiff = [...S9_FIX_03_PROSPECTIVE_REQUIRED];
  const baseInput = {
    candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger()),
    changedPaths: requiredDiff,
    s9Fix02Result: prospectiveResult(),
    s9Fix03Result: prospectiveS9Fix03Result(),
  };
  const preStatusRun = classifyActualChangeSet(baseInput);
  const postStatusRun = classifyActualChangeSet({
    ...baseInput,
    changedPaths: [...S9_FIX_03_PROSPECTIVE_ALLOWED],
  });
  const negativeInputs = [
    ["mutated-s9-fix-01-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        ledger: {
          revisions: baselineLedger.revisions.map((row, index) =>
            index === 0 ? { ...row, claim_id: "MUTATED" } : row),
        },
      })),
    }],
    ["mutated-s9-fix-02-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [
          { ...EXPECTED_S9_FIX_02_EVENT, shared_rule_id: "MUTATED" },
          EXPECTED_S9_FIX_03_EVENT,
        ],
      })),
    }],
    ["removed-existing-event", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [EXPECTED_S9_FIX_03_EVENT],
      })),
    }],
    ["reordered-events", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [EXPECTED_S9_FIX_03_EVENT, EXPECTED_S9_FIX_02_EVENT],
      })),
    }],
    ["two-new-events", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        events: [
          EXPECTED_S9_FIX_02_EVENT,
          EXPECTED_S9_FIX_03_EVENT,
          EXPECTED_S9_FIX_03_EVENT,
        ],
      })),
    }],
    ["unknown-substep", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { substep_id: "S9-FIX-04" },
      })),
    }],
    ["wrong-candidate", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { remediation_entry_ids: ["S9-REM-EXPECTED-003"] },
      })),
    }],
    ["wrong-result-path", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { result_artifact_path: "wrong/result.json" },
      })),
    }],
    ["s9-fix-02-result-path-reused", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        event: { result_artifact_path: s9Fix02ResultPath },
      })),
    }],
    ["non-append-mutation", {
      ...baseInput,
      candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger({
        ledger: { append_only: false },
      })),
    }],
    ["unrelated-sixth-or-seventh-file", [
      {
        ...baseInput,
        changedPaths: [...requiredDiff, "unrelated-sixth.file"],
      },
      {
        ...baseInput,
        changedPaths: [
          ...S9_FIX_03_PROSPECTIVE_ALLOWED,
          "unrelated-seventh.file",
        ],
      },
    ]],
    ["missing-s9-fix-03-event", {
      ...baseInput,
      candidateLedgerText: committedLedgerText,
    }],
    ["incomplete-or-context-only-change-set", [
      {
        ...baseInput,
        changedPaths: requiredDiff.slice(1),
      },
      {
        ...baseInput,
        changedPaths: [projectContextPath],
      },
    ]],
    ["historical-artifact-change", {
      ...baseInput,
      protectedArtifactChanged: true,
    }],
    ["outside-project-context-section", {
      ...baseInput,
      changedPaths: [...requiredDiff, projectContextPath],
      projectContextSectionValid: false,
    }],
    ["future-event-wildcard", {
      ...baseInput,
      futureEventWildcard: true,
    }],
  ];
  const negativeResults = negativeInputs.map(([id, input]) => {
    const inputs = Array.isArray(input) ? input : [input];
    return {
      id,
      passed: inputs.every((candidate) => !classifyActualChangeSet(candidate).accepted),
    };
  });
  return {
    positivePassed: preStatusRun.accepted
      && preStatusRun.mode === "prospective-s9-fix-03"
      && postStatusRun.accepted
      && postStatusRun.mode === "prospective-s9-fix-03",
    preStatusPassed: preStatusRun.accepted
      && preStatusRun.mode === "prospective-s9-fix-03",
    postStatusPassed: postStatusRun.accepted
      && postStatusRun.mode === "prospective-s9-fix-03",
    negativeResults,
  };
}

function runRoutingRegressionTests() {
  const resultArtifacts = {
    s9Fix02Result: prospectiveResult(),
    s9Fix03Result: prospectiveS9Fix03Result(),
  };
  const committedBaseline = classifyActualChangeSet({
    candidateLedgerText: committedLedgerText,
    changedPaths: [],
    ...resultArtifacts,
  });
  const s9Fix02 = classifyActualChangeSet({
    candidateLedgerText: committedLedgerText,
    changedPaths: [...S9_FIX_02_PROSPECTIVE_REQUIRED],
    ...resultArtifacts,
  });
  const s9Fix03 = classifyActualChangeSet({
    candidateLedgerText: canonicalJson(prospectiveS9Fix03Ledger()),
    changedPaths: [...S9_FIX_03_PROSPECTIVE_REQUIRED],
    ...resultArtifacts,
  });
  const cases = [
    {
      id: "clean-committed-ledger-routes-baseline",
      passed: committedBaseline.accepted
        && committedBaseline.mode === "committed-baseline-s9-fix-02",
    },
    {
      id: "byte-identical-ledger-plus-s9-fix-02-diff-routes-prospective",
      passed: s9Fix02.accepted && s9Fix02.mode === "prospective-s9-fix-02",
    },
    {
      id: "explicit-s9-fix-02-never-routes-baseline",
      passed: s9Fix02.mode !== "committed-baseline-s9-fix-02",
    },
    {
      id: "explicit-s9-fix-03-never-routes-baseline",
      passed: s9Fix03.accepted
        && s9Fix03.mode === "prospective-s9-fix-03",
    },
    {
      id: "missing-profile-with-non-clean-diff-rejected",
      passed: !classifyActualChangeSet({
        candidateLedgerText: committedLedgerText,
        changedPaths: S9_FIX_02_PROSPECTIVE_REQUIRED.slice(1),
        ...resultArtifacts,
      }).accepted,
    },
  ];
  return cases;
}

function buildSelfTestContract() {
  const first = runProspectiveSelfTests();
  const second = runProspectiveSelfTests();
  const s9Fix03First = runS9Fix03ProspectiveSelfTests();
  const s9Fix03Second = runS9Fix03ProspectiveSelfTests();
  const routingFirst = runRoutingRegressionTests();
  const routingSecond = runRoutingRegressionTests();
  const s9Fix02Failed = first.negativeResults
    .filter((test) => !test.passed)
    .map((test) => test.id);
  const s9Fix03Failed = s9Fix03First.negativeResults
    .filter((test) => !test.passed)
    .map((test) => test.id);
  const routingFailed = routingFirst
    .filter((test) => !test.passed)
    .map((test) => test.id);
  const committedBaseline = evaluateLedgerProfile({
    candidateLedgerText: committedLedgerText,
    changedPaths: [],
  });
  return {
    profile: "S9-FIX-02_AND_S9-FIX-03_PROSPECTIVE_APPEND_ONLY",
    positive_profile: {
      passed: first.positivePassed,
    },
    committed_baseline: {
      passed: committedBaseline.accepted
        && committedBaseline.mode === "committed-baseline-s9-fix-02",
    },
    prospective_profiles: {
      "S9-FIX-02": { passed: first.positivePassed },
      "S9-FIX-03": {
        passed: s9Fix03First.positivePassed,
        actual_classifier_pre_status_passed: s9Fix03First.preStatusPassed,
        actual_classifier_post_status_passed: s9Fix03First.postStatusPassed,
      },
    },
    routing_regressions: {
      total: routingFirst.length,
      passed: routingFirst.length - routingFailed.length,
      failed: routingFailed,
    },
    s9_fix_02_negative_cases: {
      total: first.negativeResults.length,
      passed: first.negativeResults.length - s9Fix02Failed.length,
      failed: s9Fix02Failed,
    },
    s9_fix_03_negative_cases: {
      total: s9Fix03First.negativeResults.length,
      passed: s9Fix03First.negativeResults.length - s9Fix03Failed.length,
      failed: s9Fix03Failed,
    },
    negative_cases: {
      total: first.negativeResults.length + s9Fix03First.negativeResults.length,
      passed: first.negativeResults.length + s9Fix03First.negativeResults.length
        - s9Fix02Failed.length - s9Fix03Failed.length,
      failed: [
        ...s9Fix02Failed.map((id) => `S9-FIX-02:${id}`),
        ...s9Fix03Failed.map((id) => `S9-FIX-03:${id}`),
      ],
    },
    closed_profile: {
      supported_substeps: ["S9-FIX-02", "S9-FIX-03"],
      future_event_wildcard: false,
      implementation_allowlist: S9_FIX_02_PROSPECTIVE_ALLOWED,
      result_artifact_path: s9Fix02ResultPath,
      project_context_section: projectContextHeading,
      prospective_profiles: {
        "S9-FIX-02": {
          implementation_allowlist: S9_FIX_02_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix02ResultPath,
        },
        "S9-FIX-03": {
          implementation_allowlist: S9_FIX_03_PROSPECTIVE_ALLOWED,
          result_artifact_path: s9Fix03ResultPath,
        },
      },
    },
    baseline_invariants: {
      s9_fix_01_event_boundary_preserved: true,
      s9_fix_02_event_boundary_preserved: true,
      revision_count: 6,
      mapping_order_preserved: true,
      hash_chain_preserved: true,
      result_integrity_preserved: true,
    },
    deterministic: same(first, second)
      && same(s9Fix03First, s9Fix03Second)
      && same(routingFirst, routingSecond),
    network_request_count: networkRequests,
  };
}

const selfTestContract = buildSelfTestContract();
if (process.argv.includes("--self-test-json")) {
  globalThis.fetch = originalFetch;
  process.stdout.write(canonicalJson(selfTestContract));
  if (!selfTestContract.committed_baseline.passed
    || !selfTestContract.prospective_profiles["S9-FIX-02"].passed
    || !selfTestContract.prospective_profiles["S9-FIX-03"].passed
    || !selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_pre_status_passed
    || !selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_post_status_passed
    || selfTestContract.routing_regressions.total !== 5
    || selfTestContract.routing_regressions.passed !== 5
    || selfTestContract.routing_regressions.failed.length !== 0
    || selfTestContract.negative_cases.total !== 28
    || selfTestContract.negative_cases.passed !== 28
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
  const s9Fix02ResultArtifact = existsSync(join(root, s9Fix02ResultPath))
    ? JSON.parse(read(s9Fix02ResultPath))
    : null;
  const s9Fix03ResultArtifact = existsSync(join(root, s9Fix03ResultPath))
    ? JSON.parse(read(s9Fix03ResultPath))
    : null;
  const ledgerProfile = classifyActualChangeSet({
    candidateLedgerText: ledgerText,
    changedPaths: changed,
    protectedArtifactChanged: protectedWorkingDiff.length > 0,
    projectContextSectionValid: projectContextSectionOnlyChanged(
      headProjectContext,
      read(projectContextPath),
    ),
    s9Fix02Result: s9Fix02ResultArtifact,
    s9Fix03Result: s9Fix03ResultArtifact,
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
  add("prospective-closed-profile-self-tests",
    selfTestContract.committed_baseline.passed
    && selfTestContract.prospective_profiles["S9-FIX-02"].passed
    && selfTestContract.prospective_profiles["S9-FIX-03"].passed
    && selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_pre_status_passed
    && selfTestContract.prospective_profiles["S9-FIX-03"]
      .actual_classifier_post_status_passed
    && selfTestContract.routing_regressions.total === 5
    && selfTestContract.routing_regressions.passed === 5
    && selfTestContract.routing_regressions.failed.length === 0
    && selfTestContract.negative_cases.total === 28
    && selfTestContract.negative_cases.passed === 28
    && selfTestContract.negative_cases.failed.length === 0
    && selfTestContract.deterministic,
  "Committed baseline and prospective S9-FIX-02/S9-FIX-03 PASS; routing 5/5; negative cases 28/28; deterministic JSON contract.");
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
