import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const startingHead = "1264bfbff4784f6aa2297da3efe7737d2164e110";
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const before = (path) => execFileSync(
  "git",
  ["show", `${startingHead}:${path}`],
  { cwd: root, encoding: "utf8" },
);
const checks = [];

function add(id, passed, detail) {
  checks.push({ id, passed: Boolean(passed), detail });
}

function loadPresentation() {
  const source = read("lib/simulator-result-presentation.ts");
  const output = ts.transpileModule(source, {
    fileName: "simulator-result-presentation.ts",
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  Function("exports", output.outputText)(exports);
  return exports;
}

const presentation = loadPresentation();
const presenter = read("lib/saved-decision-simulations/product-surface.ts");
const component = read("components/SavedSimulationsHistorySurface.tsx");
const css = read("app/styles/saved-records-surfaces.css");
const historyStart = component.indexOf("export function SavedSimulationsHistorySurface");
const detailStart = component.indexOf("export function SavedSimulationDetailSurface");
const historySource = component.slice(historyStart, detailStart);

add(
  "internal-summary-copy-is-presented-in-plain-spanish",
  presentation.presentSimulationText("Simulación determinística limitada por contexto incompleto") ===
      "Resultado orientativo con contexto incompleto." &&
    presentation.presentSimulationText("Simulacion deterministica preparada para revision") ===
      "Resultado orientativo preparado para revisión.",
  "Legacy deterministic summary copy was not mapped through the shared presentation boundary.",
);
add(
  "history-source-label-is-product-language",
  presenter.includes('return "Resultado orientativo";') &&
    presenter.includes("summary: presentSimulationText(summaryFromSimulation(simulation))") &&
    !presenter.includes('return "Motor determinista"') &&
    !presenter.includes('return "Runtime Real AI controlado"') &&
    !presenter.includes('return "Proveedor AI interno"'),
  "History presenter still exposes an engine, runtime, or provider label.",
);
add(
  "history-renders-no-internal-implementation-copy",
  historySource.includes("{simulation.sourceLabel}") &&
    historySource.includes("{simulation.summary}") &&
    !/Motor determinista|simulaci[oó]n determin[ií]stica|Runtime Real AI|Proveedor AI interno/i.test(historySource),
  "History component contains internal implementation wording.",
);
add(
  "useful-history-fields-remain-intact",
  [
    "simulation.createdLabel",
    "simulation.title",
    "simulation.statusLabel",
    "simulation.confidenceLabel",
    "simulation.riskLabel",
  ].every((token) => historySource.includes(token)),
  "Date, title, status, clarity, or risk disappeared from the history card.",
);
add(
  "history-actions-remain-intact",
  historySource.includes("Abrir simulación") &&
    historySource.includes("Archivar") &&
    historySource.includes("simulation.href") &&
    historySource.includes("archiveSavedSimulationFromDashboard"),
  "Open or archive behavior changed.",
);
add(
  "persistence-and-lifecycle-contracts-unchanged",
  [
    "lib/saved-decision-simulations/contracts.ts",
    "lib/saved-decision-simulations/runtime.ts",
    "lib/saved-decision-simulations/ui-save-action.ts",
    "lib/persistence-runtime/simulation-record-persistence.ts",
    "lib/persistence-runtime/contracts.ts",
    "lib/persistence-runtime/supabase-provider.ts",
  ].every((path) => read(path) === before(path)),
  "Persistence, save/reopen, archive, or deletion behavior changed.",
);
add(
  "desktop-and-mobile-history-layout-remains-bounded",
  css === before("app/styles/saved-records-surfaces.css") &&
    css.includes("grid-template-columns: minmax(180px, 0.8fr) minmax(220px, 1fr) minmax(220px, 0.8fr) auto") &&
    css.includes("overflow-wrap: anywhere;") &&
    css.includes("overflow-x: clip;") &&
    css.includes("@media (max-width: 560px)"),
  "Existing responsive history-card layout or overflow protection changed.",
);
add(
  "shared-detail-presentation-remains-unchanged",
  component.slice(detailStart) === before("components/SavedSimulationsHistorySurface.tsx").slice(
    before("components/SavedSimulationsHistorySurface.tsx").indexOf("export function SavedSimulationDetailSurface"),
  ),
  "Closed saved-detail presentation changed.",
);
add(
  "history-presentation-gate-is-registered",
  read("package.json").includes('"quality:saved-simulation-history-presentation"'),
  "Dedicated history presentation gate is not registered.",
);

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowed = new Set([
  "lib/simulator-result-presentation.ts",
  "lib/saved-decision-simulations/product-surface.ts",
  "scripts/simulation-response-v2-persistence-flow-quality.mjs",
  "scripts/saved-simulation-history-presentation-quality.mjs",
  "scripts/saved-simulation-detail-hierarchy-quality.mjs",
  "scripts/saved-simulation-metadata-presentation-quality.mjs",
  "scripts/saved-simulation-result-presentation-parity-quality.mjs",
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
