import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const checks = [];

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

function pass(name) {
  checks.push({ name, passed: true });
}

function fail(name, message) {
  checks.push({ name, passed: false, message });
}

function assertCheck(name, condition, message) {
  if (condition) {
    pass(name);
  } else {
    fail(name, message);
  }
}

function assertSourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function assertSourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function runRouteSourceChecks() {
  const routePath = join(rootDir, "app", "api", "simulate", "route.ts");
  const source = readFileSync(routePath, "utf8");

  assertSourceIncludes(source, "DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER", "Route checks deterministic runtime marker");
  assertSourceIncludes(source, "runnerResult.runtime.rollbackSafe", "Route checks rollback-safe runtime metadata");
  assertSourceIncludes(source, "validatePublicSimulationEnvelopeShape(response)", "Route validates public envelope before returning");
  assertSourceIncludes(source, "simulationFailedResponse(requestId)", "Route has shared rollback-safe fallback");
  assertSourceIncludes(source, "catch", "Route wraps deterministic runtime with controlled catch fallback");
  assertSourceIncludes(source, '"SIMULATION_FAILED"', "Route preserves SIMULATION_FAILED fallback code");
  assertSourceIncludes(source, "data: null", "Route fallback keeps failed data:null contract");
  assertSourceIncludes(source, "mockOnly: true", "Route fallback preserves mockOnly=true");
  assertSourceIncludes(source, "safeRender: true", "Route fallback preserves safeRender=true");
  assertSourceIncludes(source, "apiReady: true", "Route fallback preserves apiReady=true");
  assertSourceExcludes(source, "runnerResult.error?.message", "Route does not leak runner error messages publicly");
  assertSourceExcludes(source, "Response.json(runnerResult", "Route never returns runner internals directly");
  assertSourceExcludes(source, "Response.json(runnerResult.response", "Route never returns SimulationResponseV2Draft directly");
  assertSourceExcludes(source, "traceability", "Route source does not expose internal traceability");
  assertSourceExcludes(source, "process.env", "Route does not read environment configuration");
  assertSourceExcludes(source, "openai", "Route does not import OpenAI runtime");
  assertSourceExcludes(source, "fetch(", "Route does not perform provider/network fetch");
}

function printSummary() {
  const failed = checks.filter((check) => !check.passed);
  const passed = checks.length - failed.length;

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
  }

  console.log(`\nDeterministic runtime observability quality gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  const validationPath = join(
    rootDir,
    "lib",
    "decision-engine",
    "deterministic-runtime-observability-validation.ts",
  );
  const { runDeterministicRuntimeObservabilityValidation } = require(validationPath);
  const result = runDeterministicRuntimeObservabilityValidation();

  for (const check of result.cases) {
    if (check.passed) {
      pass(check.name);
    } else {
      fail(check.name, check.message);
    }
  }

  runRouteSourceChecks();
} catch (error) {
  fail("Deterministic runtime observability quality gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
