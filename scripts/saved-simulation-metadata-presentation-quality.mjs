import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const startingHead = "9cf45dc883e1d7edaf06ff23f18c4cdc853d6c76";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const before = (path) => execFileSync(
  "git",
  ["show", `${startingHead}:${path}`],
  { cwd: root, encoding: "utf8" },
);

const componentPath = "components/SavedSimulationsHistorySurface.tsx";
const presenterPath = "lib/saved-decision-simulations/product-surface.ts";
const component = read(componentPath);
const presenter = read(presenterPath);
const exportSurface = read("lib/user-data-controls/account-data-export-surface.ts");
const exportRoute = read("app/dashboard/privacy/export/route.ts");
const checks = [];

function add(id, passed, detail) {
  checks.push({ id, passed: Boolean(passed), detail });
}

const detailStart = component.indexOf("export function SavedSimulationDetailSurface");
const detailSource = component.slice(detailStart);

add(
  "detail-hides-source-runtime-label",
  !detailSource.includes("simulation.sourceLabel"),
  "Saved detail still exposes the presenter source/runtime label.",
);
add(
  "detail-hides-raw-engine-status",
  !detailSource.includes("simulation.engineStatusLabel") &&
    !presenter.includes("engineStatusLabel:") &&
    !presenter.includes("engineStatusLabel: string"),
  "Saved detail still exposes decisionEngineOutput.status.",
);
add(
  "mock-identifier-cannot-render",
  !detailSource.includes("recommendationState") &&
    !detailSource.includes("decisionEngineOutput") &&
    !detailSource.includes("mock_") &&
    !presenter.includes("engineStatusLabel: simulation.decisionEngineOutput.status"),
  "A mock/runtime identifier can still reach the detail presentation.",
);
add(
  "plain-spanish-result-type",
  presenter.includes('resultTypeLabel: "Orientativo"') &&
    component.includes("<span>Tipo de resultado</span>") &&
    component.includes("<strong>{simulation.resultTypeLabel}</strong>"),
  "Detail must present a neutral, understandable Spanish result type.",
);
add(
  "stale-export-copy-removed",
  !detailSource.includes("simulation.exportLabel") &&
    !detailSource.includes("Incluida en futura exportación") &&
    !detailSource.includes("Incluida en la exportación de datos") &&
    !presenter.includes("exportLabel:"),
  "Record detail still renders export metadata or stale future wording.",
);
add(
  "export-contract-is-current-and-owner-scoped",
  exportSurface.includes("readSavedSimulationsHistorySurface") &&
    exportSurface.includes('savedSimulations: "owner_scoped_saved_simulation_history"') &&
    exportRoute.includes("readAccountDataExportSurface") &&
    exportRoute.includes('attachment; filename="levio-account-data-export.json"'),
  "Existing account export does not support the decision to remove future placeholder copy.",
);
add(
  "clarity-and-risk-preserved",
  component.includes("<span>Claridad</span>") &&
    component.includes("<strong>{simulation.confidenceLabel}</strong>") &&
    component.includes("<span>Riesgo</span>") &&
    component.includes("<strong>{simulation.riskLabel}</strong>"),
  "User-relevant clarity or risk metadata was removed.",
);
add(
  "useful-state-and-language-preserved",
  detailSource.includes("simulation.lifecycleLabel") &&
    detailSource.includes("simulation.languageLabel"),
  "Useful reopen state or language metadata was removed.",
);
add(
  "saved-detail-hierarchy-preserved",
  component.includes('aria-label="Situación simulada"') &&
    component.includes("saved-records-input__content") &&
    component.indexOf('aria-label="Situación simulada"') <
      component.indexOf('className="simulation-detail-hero'),
  "Closed saved-detail hierarchy changed.",
);
add(
  "persistence-save-reopen-contracts-unchanged",
  [
    "lib/saved-decision-simulations/contracts.ts",
    "lib/saved-decision-simulations/runtime.ts",
    "lib/persistence-runtime/simulation-record-persistence.ts",
    "lib/persistence-runtime/contracts.ts",
    "lib/persistence-runtime/supabase-provider.ts",
  ].every((path) => read(path) === before(path)),
  "Persistence, save, or reopen contracts changed.",
);
add(
  "export-contract-unchanged",
  exportSurface === before("lib/user-data-controls/account-data-export-surface.ts") &&
    exportRoute === before("app/dashboard/privacy/export/route.ts"),
  "Account export behavior changed.",
);
add(
  "saved-record-layout-css-unchanged",
  read("app/styles/saved-records-surfaces.css") ===
    before("app/styles/saved-records-surfaces.css"),
  "Saved-record detail CSS changed for a metadata-only correction.",
);

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowed = new Set([
  componentPath,
  presenterPath,
  "lib/simulator-result-presentation.ts",
  "scripts/saved-simulation-detail-hierarchy-quality.mjs",
  "scripts/saved-simulation-metadata-presentation-quality.mjs",
  "scripts/saved-simulation-result-presentation-parity-quality.mjs",
  "scripts/stage-7-saved-simulation-deletion-execution-quality.mjs",
  "package.json",
]);
const unexpected = [...new Set(changed)].filter((path) => !allowed.has(path));
add(
  "exact-bounded-write-set",
  unexpected.length === 0,
  `Unexpected changed paths: ${unexpected.join(", ") || "none"}.`,
);

for (const item of checks) {
  console[item.passed ? "log" : "error"](`${item.passed ? "PASS" : "FAIL"} ${item.id}`);
  if (!item.passed) console.error(`  ${item.detail}`);
}
console.log(`${checks.filter((item) => item.passed).length}/${checks.length} checks passed.`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
