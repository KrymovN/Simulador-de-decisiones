import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const startingHead = "d6eed9cc28a9bc326ea4d7981d574c20d542724c";
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

function loadPresenter() {
  const source = read("lib/simulator-result-presentation.ts");
  const output = ts.transpileModule(source, {
    fileName: "simulator-result-presentation.ts",
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  Function("exports", output.outputText)(exports);
  return exports;
}

const presentation = loadPresenter();
const savedPresenter = read("lib/saved-decision-simulations/product-surface.ts");
const savedDetail = read("components/SavedSimulationsHistorySurface.tsx");
const liveSurface = read("components/HomeSimulator.tsx");
const submittedInput =
  "Aceptar una nueva oferta laboral con más responsabilidad y un cambio importante de horario";
const titles = [
  presentation.presentScenarioTitle({
    optionLabel: `${submittedInput.slice(0, 72)}...`,
    perspective: "optimistic",
    submittedInput,
  }),
  presentation.presentScenarioTitle({
    optionLabel: submittedInput,
    perspective: "realistic",
    submittedInput,
  }),
  presentation.presentScenarioTitle({
    optionLabel: submittedInput,
    perspective: "pessimistic",
    submittedInput,
  }),
  presentation.presentScenarioTitle({
    optionLabel: "Delay and gather more information",
    perspective: "Base",
    submittedInput,
  }),
];
const productionDelayTitle = presentation.presentScenarioTitle({
  optionLabel: "Delay and gather more information",
  perspective: "optimistic",
  submittedInput,
});

add(
  "shared-title-semantics",
  JSON.stringify(titles) === JSON.stringify([
    "Condiciones favorables: la opción planteada",
    "Escenario de referencia: la opción planteada",
    "Condiciones adversas: la opción planteada",
    "Escenario de referencia: posponer y reunir más información",
  ]),
  `Unexpected titles: ${JSON.stringify(titles)}`,
);
add(
  "no-input-title-repetition-or-truncation",
  titles.slice(0, 3).every((title) => !title.includes(submittedInput.slice(0, 24)) && !title.includes("...")),
  "A reopened scenario title still repeats or truncates the submitted input.",
);
add(
  "delay-title-is-spanish",
  !titles[3].includes("Delay and gather") && titles[3].includes("posponer y reunir más información"),
  titles[3],
);
add(
  "scenario-four-uses-canonical-favorable-semantics",
  productionDelayTitle === "Condiciones favorables: posponer y reunir más información" &&
    presentation.presentCanonicalScenarioType("favorable") === "Favorable" &&
    read("lib/decision-engine/scenarios.ts").includes(
      'const PERSPECTIVES: ScenarioPerspective[] = ["optimistic", "realistic", "pessimistic"]',
    ) &&
    read("lib/decision-engine/scenarios.ts").includes(
      "eligibleOptions.flatMap((option) =>\n      PERSPECTIVES.map((perspective)",
    ) &&
    read("lib/decision-engine/context-builder.ts").indexOf('id: "option_proposed_action"') <
      read("lib/decision-engine/context-builder.ts").indexOf('id: "option_delay_gather_information"'),
  productionDelayTitle,
);

const contextItems = presentation.presentScenarioContextItems([
  "decisionDeadline",
  "shortTermWindow",
]);
add(
  "canonical-context-is-structured-not-flattened",
  JSON.stringify(contextItems) === JSON.stringify(["Plazo de decisión", "Impacto a corto plazo"]) &&
    savedPresenter.includes("contextItems,") &&
    !savedPresenter.includes("context: [...triggerConditions, ...consequences") &&
    savedDetail.includes('<ul aria-label="Condiciones y consecuencias del escenario">') &&
    savedDetail.includes("scenario.contextItems.map") &&
    !savedDetail.includes("Plazo de decisión Impacto a corto plazo"),
  JSON.stringify(contextItems),
);

const internalDescriptions = [
  ["optimistic", "Ruta optimistic generada por el Decision Engine para una simulacion deterministica."],
  ["realistic", "Ruta realistic generada por el Decision Engine para una simulación determinística."],
  ["pessimistic", "Ruta pessimistic generada por el Decision Engine para una simulacion deterministica."],
];
const presentedDescriptions = internalDescriptions.map(([perspective, description]) =>
  presentation.presentScenarioDescription({ description, perspective }),
);
add(
  "internal-descriptions-become-product-copy",
  presentedDescriptions.every((description) =>
    !/Decision Engine|simulaci[oó]n determin[ií]stica|Ruta (?:optimistic|realistic|pessimistic)/i.test(description)
  ) && presentedDescriptions.every((description) => description.startsWith("Este escenario")),
  JSON.stringify(presentedDescriptions),
);
add(
  "saved-presenter-reuses-live-source-of-truth",
  savedPresenter.includes('from "../simulator-result-presentation"') &&
    savedPresenter.includes("presentScenarioTitle({ optionLabel, perspective, submittedInput })") &&
    savedPresenter.includes("presentScenarioDescription({") &&
    savedPresenter.includes("presentCanonicalScenarioType(canonicalType)") &&
    !savedPresenter.includes("PERSPECTIVE_LABELS"),
  "Saved presenter does not reuse the approved live presentation source.",
);
add(
  "scenario-number-and-meaning-preserved",
  savedPresenter.includes('`Escenario ${index + 1}`') &&
    savedPresenter.includes('!["optimistic", "realistic", "pessimistic"].includes(rawLabel)') &&
    !savedPresenter.includes("stringValue(record.status)") &&
    savedPresenter.includes("triggerConditions") &&
    savedPresenter.includes("uncertaintyReasons") &&
    savedPresenter.includes("consequences") &&
    savedPresenter.includes("warnings"),
  "Reopened scenarios lost numbering or useful canonical context.",
);
add(
  "live-result-rendering-unchanged",
  liveSurface === before("components/HomeSimulator.tsx") &&
    liveSurface.includes("presentScenarioTitle({") &&
    liveSurface.includes("presentSimulationText(item)"),
  "Live result rendering changed.",
);
add(
  "plain-language-deletion-copy",
  savedDetail.includes(
    "Eliminar afecta solo a esta simulación guardada. No elimina otros datos de tu cuenta.",
  ) &&
    !savedDetail.includes("runtime interno") &&
    !savedDetail.includes("historial técnico"),
  "Saved detail still exposes implementation terminology.",
);
add(
  "deletion-contract-unchanged",
  [
    "lib/saved-decision-simulations/ui-save-action.ts",
    "lib/saved-decision-simulations/runtime.ts",
    "lib/persistence-runtime/simulation-record-persistence.ts",
    "lib/persistence-runtime/supabase-provider.ts",
  ].every((path) => read(path) === before(path)),
  "Deletion behavior changed.",
);
add(
  "canonical-generation-and-persistence-unchanged",
  [
    "lib/decision-engine/simulation-response-public-adapter.ts",
    "lib/persistence-runtime/simulation-record-persistence.ts",
    "lib/saved-decision-simulations/contracts.ts",
    "lib/saved-decision-simulations/runtime.ts",
  ].every((path) => read(path) === before(path)),
  "Canonical generation, storage, or reopen contracts changed.",
);
add(
  "saved-detail-layout-css-unchanged",
  read("app/styles/saved-records-surfaces.css") === before("app/styles/saved-records-surfaces.css"),
  "Saved scenario layout CSS changed.",
);

const changed = [
  ...execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }).split("\n"),
  ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n"),
].filter(Boolean);
const allowed = new Set([
  "lib/simulator-result-presentation.ts",
  "lib/saved-decision-simulations/product-surface.ts",
  "components/SavedSimulationsHistorySurface.tsx",
  "scripts/saved-simulation-detail-hierarchy-quality.mjs",
  "scripts/saved-simulation-history-presentation-quality.mjs",
  "scripts/saved-simulation-metadata-presentation-quality.mjs",
  "scripts/simulation-response-v2-persistence-flow-quality.mjs",
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
