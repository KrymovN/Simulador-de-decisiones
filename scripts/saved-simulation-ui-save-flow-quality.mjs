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

const runtimeValidationPath = join(
  rootDir,
  "lib",
  "saved-decision-simulations",
  "runtime-validation.ts",
);
const productSurfaceValidationPath = join(
  rootDir,
  "lib",
  "saved-decision-simulations",
  "product-surface-validation.ts",
);

const { runSavedDecisionSimulationsRuntimeValidation } =
  require(runtimeValidationPath);
const { runSavedSimulationsProductSurfaceValidation } =
  require(productSurfaceValidationPath);

function reportCase(prefix, validationCase) {
  if (validationCase.passed) {
    console.log(`PASS ${prefix} ${validationCase.caseId}`);
  } else {
    console.error(`FAIL ${prefix} ${validationCase.caseId}`);
    for (const issue of validationCase.issues) {
      console.error(`  ${issue}`);
    }
  }
}

const runtimeResult = await runSavedDecisionSimulationsRuntimeValidation();
const productSurfaceResult = await runSavedSimulationsProductSurfaceValidation();

for (const validationCase of runtimeResult.cases) {
  reportCase("runtime", validationCase);
}

for (const validationCase of productSurfaceResult.cases) {
  reportCase("product-surface", validationCase);
}

if (!runtimeResult.passed || !productSurfaceResult.passed) {
  process.exitCode = 1;
}
