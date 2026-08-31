import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

require.extensions[".ts"] = function loadTypeScriptModule(module, filename) {
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2020,
    },
  });

  module._compile(output.outputText, filename);
};

const validationPath = join(
  rootDir,
  "lib",
  "decision-engine",
  "deterministic-clarification-round-trip-validation.ts",
);
const { runDeterministicClarificationRoundTripValidation } = require(validationPath);
const result = runDeterministicClarificationRoundTripValidation();
const home = readFileSync(join(rootDir, "components", "HomeSimulator.tsx"), "utf8");
const page = readFileSync(join(rootDir, "app", "page.tsx"), "utf8");

const sourceCases = [
  {
    name: "HomeSimulator renders clarification questions and continuation action",
    passed:
      home.includes("data-clarification-question={question.id}") &&
      home.includes("Continuar simulación") &&
      home.includes("handleClarificationSubmit"),
  },
  {
    name: "HomeSimulator preserves answer state and same-simulation identity",
    passed:
      home.includes("setClarificationAnswers") &&
      home.includes("simulationId: clarificationState.simulationId") &&
      home.includes("clarificationState.input"),
  },
  {
    name: "existing save and anonymous login handoff remain connected",
    passed:
      home.includes("saveCompletedSimulationFromUi({ simulation })") &&
      home.includes('"/login?next=%2Fdashboard%2Fsimulations"') &&
      home.includes('href="/register"'),
  },
  {
    name: "misleading sample-answer preview copy is removed",
    passed:
      !home.includes("Respuestas de ejemplo") &&
      !page.includes("Preview público con respuestas de ejemplo"),
  },
  {
    name: "HomeSimulator remains provider-isolated",
    passed:
      !home.includes("OpenAI") &&
      !home.includes("process.env") &&
      home.includes('fetch("/api/simulate"'),
  },
];

for (const check of [...result.cases, ...sourceCases]) {
  if (check.passed) {
    console.log(`PASS ${check.name}`);
  } else {
    console.error(`FAIL ${check.name}`);
    if (check.message) console.error(`  ${check.message}`);
  }
}

if (!result.passed || sourceCases.some((item) => !item.passed)) {
  process.exitCode = 1;
}
