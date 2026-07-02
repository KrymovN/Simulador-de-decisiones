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

const validationPath = join(rootDir, "lib", "decision-engine", "simulation-pipeline-runner-validation.ts");
const { runSimulationPipelineRunnerValidation } = require(validationPath);
const result = runSimulationPipelineRunnerValidation();

for (const check of result.cases) {
  if (check.passed) {
    console.log(`PASS ${check.name}`);
  } else {
    console.error(`FAIL ${check.name}`);
    console.error(`  ${check.message}`);
  }
}

if (!result.passed) {
  process.exitCode = 1;
}
