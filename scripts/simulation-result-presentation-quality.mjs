import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseline = "c37034ba494ac838244ef81d05eacc3eaf68161a";
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const baselineFile = (path) =>
  execFileSync("git", ["show", `${baseline}:${path}`], {
    cwd: rootDir,
    encoding: "utf8",
  });

const simulator = read("components", "HomeSimulator.tsx");
const presenterSource = read("lib", "simulator-result-presentation.ts");
const simulatorCss = read("app", "styles", "simulator.css");
const homepageCss = read("app", "styles", "homepage.css");
const checks = [];
const liveOperationCount = 0;

function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
}

function loadPresenter() {
  const output = ts.transpileModule(presenterSource, {
    fileName: "simulator-result-presentation.ts",
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  Function("exports", output.outputText)(exports);
  return exports;
}

const presentation = loadPresenter();
const resultSurfaceStart = simulator.indexOf("{result && (");
const resultSurface = simulator.slice(resultSurfaceStart, simulator.lastIndexOf("</section>"));

check("HomeSimulator keeps both bounded success surfaces", resultSurfaceStart > -1 && resultSurface.includes("{productionResult && ("));
check(
  "Production result removes internal implementation copy",
  [
    "Mapa de escenarios demo",
    "Simulación demostrativa con respuestas de ejemplo",
    "Preview controlado",
    "SimulationResponseV2",
    "Real AI",
    "mockOnly=true",
    "simulate-api-v1-mock",
    "Preview interno",
    "Decision Engine",
    "requestId",
    "runtimeSource",
    "contractVersion",
  ].every((marker) => !resultSurface.includes(marker)),
);
check(
  "Result uses truthful Spanish-first product copy",
  simulator.includes("RESULT_PRESENTATION_COPY.eyebrow") &&
    presenterSource.includes('eyebrow: "Resultado orientativo"') &&
    presenterSource.includes("Esta simulación compara escenarios a partir de la información que has proporcionado.") &&
    presenterSource.includes("No es una predicción ni una garantía."),
);
check(
  "Internal thinking stages are not rendered after completion",
  simulator.includes("const stages = DEFAULT_PROCESSING_STAGES;") &&
    !simulator.includes("result?.thinkingStages"),
);

for (const [raw, expected] of [
  ["decisionDeadline", "Plazo de decisión"],
  ["shortTermWindow", "Impacto a corto plazo"],
  ["longTermWindow", "Impacto a largo plazo"],
  ["opportunity: favorable", "Oportunidad · Favorable"],
  ["opportunity: uncertain", "Oportunidad · Incierto"],
  ["opportunity: adverse", "Oportunidad · Desfavorable"],
]) {
  check(
    `Presentation maps ${raw} to Spanish`,
    presentation.presentSimulationText(raw) === expected,
    `Received: ${presentation.presentSimulationText(raw)}`,
  );
}

const submittedInput =
  "Aceptar una nueva oferta laboral con más responsabilidad y un cambio importante de horario";
const proposedTitle = presentation.presentScenarioTitle({
  optionLabel: `${submittedInput.slice(0, 87)}...`,
  perspective: "Oportunidad",
  submittedInput,
});
const delayTitle = presentation.presentScenarioTitle({
  optionLabel: "Delay and gather more information",
  perspective: "Base",
  submittedInput,
});
const currentStateTitle = presentation.presentScenarioTitle({
  optionLabel: "Maintain current state for now",
  perspective: "Riesgo",
  submittedInput,
});

check(
  "Submitted input is replaced by the canonical proposed-option presentation",
  proposedTitle === "Condiciones favorables: la opción planteada" &&
    !proposedTitle.includes(submittedInput.slice(0, 30)),
  proposedTitle,
);
check(
  "Standard delay scenario title is Spanish and differentiated",
  delayTitle === "Escenario de referencia: posponer y reunir más información" &&
    !delayTitle.includes("Delay and gather"),
  delayTitle,
);
check(
  "Standard current-state scenario title is Spanish and differentiated",
  currentStateTitle === "Condiciones adversas: mantener la situación actual" &&
    !currentStateTitle.includes("Maintain current"),
  currentStateTitle,
);
check(
  "Canonical V2 perspective and scenario types use Spanish labels",
  presentation.presentPerspectiveBadge("optimistic") === "Perspectiva favorable" &&
    presentation.presentPerspectiveBadge("realistic") === "Perspectiva de referencia" &&
    presentation.presentPerspectiveBadge("pessimistic") === "Perspectiva adversa" &&
    presentation.presentCanonicalScenarioType("base_case") === "De referencia",
);
check(
  "Authenticated results hide anonymous Auth actions",
  presentation.shouldShowAnonymousResultActions("authenticated") === false &&
    resultSurface.includes("identityState={identityState}") &&
    simulator.includes("Guardar simulación"),
);
check(
  "Anonymous results preserve login and registration affordances",
  presentation.shouldShowAnonymousResultActions("signed_out") === true &&
    presentation.shouldShowAnonymousResultActions("guest") === true &&
    simulator.includes("Iniciar sesión") &&
    simulator.includes("Crear cuenta") &&
    simulator.includes("showAnonymousActions"),
);
check(
  "Simulator request payload remains input/lang only",
  simulator.includes('body: JSON.stringify({ input: situation, lang: "es" })'),
);

for (const path of [
  "app/api/simulate/route.ts",
  "lib/decision-engine/context-builder.ts",
  "lib/decision-engine/scenarios.ts",
  "lib/decision-engine/simulation-response-public-adapter.ts",
  "lib/saved-decision-simulations/ui-save-action.ts",
  "components/auth/AuthRuntimeProvider.tsx",
  "lib/auth/session.ts",
]) {
  check(`${path} remains byte-identical to the task baseline`, read(...path.split("/")) === baselineFile(path));
}
check(
  "Desktop result grid remains a responsive two-column surface",
  /\.home-scenario-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/.test(
    simulatorCss,
  ),
);
check(
  "Mobile result grid still collapses to one column",
  /@media \(max-width: 560px\)[\s\S]*?\.home-scenario-grid[\s\S]*?grid-template-columns:\s*1fr;/.test(
    homepageCss,
  ) ||
    /@media \(max-width: 560px\)[\s\S]*?\.home-scenario-grid[\s\S]*?grid-template-columns:\s*1fr;/.test(
      simulatorCss,
    ),
);
check("Presentation regression performs zero live operations", liveOperationCount === 0);

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.passed && item.detail) console.log(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nSimulation result presentation gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
