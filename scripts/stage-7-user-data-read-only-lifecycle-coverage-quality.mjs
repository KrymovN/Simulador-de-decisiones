import { readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();

function readProjectFile(...segments) {
  return readFileSync(join(rootDir, ...segments), "utf8");
}

const exportSurface = readProjectFile(
  "lib",
  "user-data-controls",
  "account-data-export-surface.ts",
);
const deletionSurface = readProjectFile(
  "lib",
  "user-data-controls",
  "account-data-deletion-surface.ts",
);
const retentionSurface = readProjectFile(
  "lib",
  "user-data-controls",
  "account-data-retention-surface.ts",
);
const packageJson = readProjectFile("package.json");

const checks = [];

function assertCheck(caseId, condition, issue) {
  checks.push({ caseId, passed: Boolean(condition), issue });
}

const resourceCoverage = [
  {
    resource: "saved-simulations",
    exportEvidence: ["savedSimulations", "readSavedSimulationsHistorySurface"],
    deletionEvidence: ["savedSimulations", "readSavedSimulationsHistorySurface"],
    retentionEvidence: ["savedSimulations", "listDecisionSimulations"],
  },
  {
    resource: "simulation-drafts",
    exportEvidence: ["simulationDrafts", "listSimulationDrafts"],
    deletionEvidence: ["simulationDrafts", "listSimulationDraftsForDeletion"],
    retentionEvidence: ["simulationDrafts", "listSimulationDraftsForRetention"],
  },
  {
    resource: "simulation-history",
    exportEvidence: ["simulationHistory", "listSimulationHistoryEntries"],
    deletionEvidence: [
      "simulationHistory",
      "listSimulationHistoryEntriesForDeletion",
    ],
    retentionEvidence: [
      "simulationHistory",
      "listSimulationHistoryEntriesForRetention",
    ],
  },
];

for (const resource of resourceCoverage) {
  for (const [control, surface, evidence] of [
    ["export", exportSurface, resource.exportEvidence],
    ["deletion-planning", deletionSurface, resource.deletionEvidence],
    ["retention-status", retentionSurface, resource.retentionEvidence],
  ]) {
    assertCheck(
      `stage-7-${resource.resource}-${control}-coverage`,
      evidence.every((token) => surface.includes(token)),
      `${resource.resource} must remain covered by the ${control} surface.`,
    );
  }
}

assertCheck(
  "stage-7-read-only-lifecycle-surfaces-fail-closed",
  [exportSurface, deletionSurface, retentionSurface].every(
    (surface) =>
      surface.includes('status: "blocked"') &&
      surface.includes('reason: "auth_required" | "read_failed"'),
  ),
  "All lifecycle surfaces must fail closed on unresolved auth or read state.",
);

assertCheck(
  "stage-7-read-only-lifecycle-does-not-open-destructive-execution",
  !deletionSurface.includes("deleteSimulation") &&
    deletionSurface.includes('execution: "not_executed"') &&
    retentionSurface.includes('retentionJobs: "not_started"') &&
    retentionSurface.includes('databaseWrites: "not_executed"'),
  "Aggregate lifecycle coverage must remain planning/status-only.",
);

assertCheck(
  "stage-7-read-only-lifecycle-coverage-gate-registered",
  packageJson.includes(
    '"quality:stage-7-user-data-read-only-lifecycle-coverage"',
  ),
  "Package scripts must register the aggregate Stage 7 lifecycle coverage gate.",
);

for (const check of checks) {
  if (check.passed) {
    console.log(`PASS ${check.caseId}`);
  } else {
    console.error(`FAIL ${check.caseId}`);
    console.error(`  ${check.issue}`);
  }
}

const passed = checks.filter((check) => check.passed).length;
console.log(`${passed}/${checks.length} checks passed.`);

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1;
}
