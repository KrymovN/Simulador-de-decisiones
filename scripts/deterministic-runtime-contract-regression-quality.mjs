import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const nextBin = join(rootDir, "node_modules", "next", "dist", "bin", "next");
const buildIdPath = join(rootDir, ".next", "BUILD_ID");
const routePath = join(rootDir, "app", "api", "simulate", "route.ts");
const adapterPath = join(rootDir, "lib", "decision-engine", "simulation-response-public-adapter.ts");
const contractVersion = "simulate-api-v1-mock";
const maxInputLength = 1200;
const maxBodyLength = 8192;

const checks = [];
let server;

const exactTopLevelKeys = ["contractVersion", "data", "error", "meta", "requestId", "status"];
const exactMetaKeys = ["apiReady", "generatedAt", "lang", "maxBodyLength", "maxInputLength", "mockOnly", "safeRender"];
const exactErrorKeys = ["code", "message"];
const exactDataKeys = ["generatedAt", "input", "lang", "simulation", "thinkingStages"];
const exactSimulationKeys = [
  "category",
  "date",
  "decision",
  "detailCopy",
  "id",
  "impacts",
  "privacy",
  "result",
  "scenarios",
  "signals",
  "status",
  "strategicConclusion",
  "tags",
  "timeline",
];
const exactSignalKeys = ["advantage", "confidence", "latency", "risk"];
const exactImpactKeys = ["copy", "label", "value"];
const exactTimelineKeys = ["copy", "period", "title"];
const exactThinkingStageKeys = ["detail", "title"];
const allowedScenarioKeys = [
  "consequences",
  "copy",
  "label",
  "potentialBenefit",
  "probability",
  "recommendation",
  "riskLevel",
  "score",
  "signal",
  "title",
  "warnings",
];
const forbiddenPublicMarkers = [
  "traceability",
  "controlledFailures",
  "runnerVersion",
  "builderVersion",
  "providerSdkUsed",
  "apiKeyRead",
  "environmentRead",
  "responseMapping",
  "orchestratorTrace",
  "SimulationResponseV2Draft",
  "DecisionContext",
  "stack",
  "TypeError",
  "SyntaxError",
  "providerPayload",
  "modelCallsExecuted",
  "model-call",
  "apiKey",
];

function pass(name) {
  checks.push({ name, passed: true });
}

function fail(name, message) {
  checks.push({ name, passed: false, message });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertCheck(name, condition, message) {
  if (condition) {
    pass(name);
  } else {
    fail(name, message);
  }
}

function sortedKeys(value) {
  return Object.keys(value).sort();
}

function assertExactKeys(value, expected, label) {
  assert(JSON.stringify(sortedKeys(value)) === JSON.stringify([...expected].sort()), `${label} keys changed.`);
}

function randomPort() {
  return 5300 + Math.floor(Math.random() * 1000);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, {
        method: "GET",
        headers: { "user-agent": "levio-contract-regression-quality" },
      });

      if (response.status < 500) {
        return;
      }
    } catch {
      // Production server is still starting.
    }

    await wait(300);
  }

  throw new Error("Timed out while waiting for next start.");
}

async function withServer(run) {
  if (!existsSync(buildIdPath)) {
    throw new Error("Missing .next/BUILD_ID. Run npm run build before this gate.");
  }

  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;

  server = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: rootDir,
    env: {
      ...process.env,
      LEVIO_AUTH_RUNTIME_ENABLED: "false",
      NEXT_PUBLIC_LEVIO_AUTH_RUNTIME_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForServer(baseUrl);
    await run(baseUrl);
  } catch (error) {
    if (serverOutput) {
      console.error(serverOutput.trim());
    }
    throw error;
  } finally {
    server.kill("SIGTERM");
  }
}

async function postSimulation(baseUrl, options) {
  const response = await fetch(`${baseUrl}/api/simulate`, {
    method: "POST",
    headers: {
      "user-agent": `levio-contract-regression-quality-${options.source}`,
      "x-forwarded-for": `192.0.2.${options.source}`,
      ...(options.headers ?? {}),
    },
    body: options.body,
  });
  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response, received: ${text.slice(0, 120)}`);
  }

  return { response, payload };
}

function assertNoInternalLeakage(payload) {
  const serialized = JSON.stringify(payload);

  for (const marker of forbiddenPublicMarkers) {
    assert(!serialized.includes(marker), `Public envelope leaked ${marker}.`);
  }
}

function assertBaseEnvelope(payload, expectedStatus) {
  assertExactKeys(payload, exactTopLevelKeys, "Top-level public envelope");
  assert(payload.contractVersion === contractVersion, "contractVersion changed.");
  assert(typeof payload.requestId === "string" && payload.requestId.length > 8, "requestId contract changed.");
  assert(payload.status === expectedStatus, "status contract changed.");
  assertExactKeys(payload.meta, exactMetaKeys, "Public meta");
  assert(payload.meta.lang === "es", "meta.lang changed.");
  assert(payload.meta.safeRender === true, "safeRender changed.");
  assert(payload.meta.mockOnly === true, "mockOnly changed.");
  assert(payload.meta.apiReady === true, "apiReady changed.");
  assert(payload.meta.maxInputLength === maxInputLength, "maxInputLength changed.");
  assert(payload.meta.maxBodyLength === maxBodyLength, "maxBodyLength changed.");
  assert(Number.isFinite(Date.parse(payload.meta.generatedAt)), "generatedAt must remain parseable ISO date.");
  assertNoInternalLeakage(payload);
}

function assertCompletedEnvelope(payload) {
  assertBaseEnvelope(payload, "completed");
  assert(payload.error === null, "Completed envelope error must stay null.");
  assert(payload.data && typeof payload.data === "object", "Completed envelope data changed.");
  assertExactKeys(payload.data, exactDataKeys, "Completed data");
  assert(payload.data.lang === "es", "data.lang changed.");
  assert(typeof payload.data.input === "string" && payload.data.input.length > 0, "data.input changed.");
  assert(Number.isFinite(Date.parse(payload.data.generatedAt)), "data.generatedAt must remain parseable ISO date.");
  assert(Array.isArray(payload.data.thinkingStages), "thinkingStages must remain an array.");
  assert(payload.data.thinkingStages.length === 5, "thinkingStages count changed.");

  for (const stage of payload.data.thinkingStages) {
    assertExactKeys(stage, exactThinkingStageKeys, "thinking stage");
    assert(typeof stage.title === "string" && typeof stage.detail === "string", "thinking stage shape changed.");
  }

  const simulation = payload.data.simulation;
  assert(simulation && typeof simulation === "object", "simulation object changed.");
  assertExactKeys(simulation, exactSimulationKeys, "Public simulation");
  assertExactKeys(simulation.signals, exactSignalKeys, "Public signals");
  assert(Array.isArray(simulation.tags), "simulation.tags changed.");
  assert(Array.isArray(simulation.scenarios), "simulation.scenarios changed.");
  assert(Array.isArray(simulation.impacts), "simulation.impacts changed.");
  assert(Array.isArray(simulation.timeline), "simulation.timeline changed.");
  assert(simulation.scenarios.length > 0, "Expected at least one public scenario.");
  assert(simulation.impacts.length === 3, "Public impacts count changed.");
  assert(simulation.timeline.length === 3, "Public timeline count changed.");

  for (const scenario of simulation.scenarios) {
    const keys = sortedKeys(scenario);
    for (const key of keys) {
      assert(allowedScenarioKeys.includes(key), `Unexpected public scenario key ${key}.`);
    }
    assert(typeof scenario.label === "string", "scenario.label changed.");
    assert(typeof scenario.title === "string", "scenario.title changed.");
    assert(typeof scenario.copy === "string", "scenario.copy changed.");
    assert(typeof scenario.signal === "string", "scenario.signal changed.");
    assert(typeof scenario.score === "string", "scenario.score changed.");
  }

  for (const impact of simulation.impacts) {
    assertExactKeys(impact, exactImpactKeys, "Public impact");
  }

  for (const item of simulation.timeline) {
    assertExactKeys(item, exactTimelineKeys, "Public timeline item");
  }
}

function assertFailedEnvelope(payload, expectedErrorCode) {
  assertBaseEnvelope(payload, "failed");
  assert(payload.data === null, "Failed envelope data must remain null.");
  assertExactKeys(payload.error, exactErrorKeys, "Public error");
  assert(payload.error.code === expectedErrorCode, `Expected ${expectedErrorCode}, received ${payload.error.code}.`);
  assert(typeof payload.error.message === "string" && payload.error.message.length > 0, "Public error message changed.");
  assert(!("simulation" in payload), "Failed envelope must not expose simulation.");
  assert(!("scenarios" in payload), "Failed envelope must not expose scenarios.");
  assert(!("recommendation" in payload), "Failed envelope must not expose recommendation.");
}

async function expectContractCase(baseUrl, name, options, expected) {
  try {
    const { response, payload } = await postSimulation(baseUrl, options);

    assert(response.status === expected.httpStatus, `Expected HTTP ${expected.httpStatus}, received ${response.status}.`);

    if (expected.status === "completed") {
      assertCompletedEnvelope(payload);
    } else {
      assertFailedEnvelope(payload, expected.errorCode);
    }

    pass(name);
  } catch (error) {
    fail(name, error instanceof Error ? error.message : String(error));
  }
}

async function runApiChecks(baseUrl) {
  await expectContractCase(
    baseUrl,
    "Contract regression preserves successful deterministic envelope",
    {
      source: 11,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Lanzar una oferta premium con riesgo operativo", lang: "es" }),
    },
    { httpStatus: 200, status: "completed" },
  );

  await expectContractCase(
    baseUrl,
    "Contract regression preserves REFUSED fail-close envelope",
    {
      source: 21,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Estoy pensando en matarme", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "REFUSED" },
  );

  await expectContractCase(
    baseUrl,
    "Contract regression preserves CLARIFICATION_REQUIRED fail-close envelope",
    {
      source: 22,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Explorar una decision de salud esta semana", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "CLARIFICATION_REQUIRED" },
  );

  await expectContractCase(
    baseUrl,
    "Contract regression preserves CANNOT_RECOMMEND fail-close envelope",
    {
      source: 23,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Decidir si cambio mi tratamiento medico", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "CANNOT_RECOMMEND" },
  );

  await expectContractCase(
    baseUrl,
    "Contract regression preserves invalid_payload fail-close envelope",
    {
      source: 24,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Explorar una decision", debug: true }),
    },
    { httpStatus: 400, status: "failed", errorCode: "invalid_payload" },
  );
}

function assertSourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function assertSourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function runSourceChecks() {
  const routeSource = readFileSync(routePath, "utf8");
  const adapterSource = readFileSync(adapterPath, "utf8");
  const validationIndex = routeSource.indexOf("validateSimulatePayload(bodyResult.body, requestId)");
  const runnerIndex = routeSource.indexOf("runInternalSimulationPipeline({");
  const adapterIndex = routeSource.indexOf("adaptSimulationResponseV2ToPublicSimulatorEnvelope({");
  const publicValidationIndex = routeSource.indexOf("validatePublicSimulationEnvelopeShape(response)");

  assertSourceIncludes(routeSource, "simulationFailedResponse(requestId)", "Route keeps SIMULATION_FAILED fallback helper");
  assertSourceIncludes(routeSource, "catch", "Route catches runner/adapter exceptions");
  assertSourceIncludes(routeSource, "validatePublicSimulationEnvelopeShape(response)", "Route validates public envelope before return");
  assertSourceIncludes(routeSource, "if (!runnerResult.response)", "Route fails closed when runner returns no response");
  assertSourceIncludes(routeSource, "runnerResult.runtime.marker !== DETERMINISTIC_ENGINE_PREVIEW_RUNTIME_MARKER", "Route checks runtime marker before public response");
  assertSourceIncludes(routeSource, "!runnerResult.runtime.rollbackSafe", "Route checks rollback metadata before public response");
  assertCheck(
    "Security boundary remains before runner",
    validationIndex > -1 && runnerIndex > -1 && validationIndex < runnerIndex,
    "Payload validation must stay before deterministic runner.",
  );
  assertCheck(
    "Public adapter remains after runner",
    runnerIndex > -1 && adapterIndex > -1 && runnerIndex < adapterIndex,
    "Public adapter must stay after deterministic runner.",
  );
  assertCheck(
    "Public envelope validation remains after adapter",
    adapterIndex > -1 && publicValidationIndex > -1 && adapterIndex < publicValidationIndex,
    "Public envelope validation must stay after adapter.",
  );
  assertSourceExcludes(routeSource, "Response.json(runnerResult", "Route never returns runner internals directly");
  assertSourceExcludes(routeSource, "Response.json(runnerResult.response", "Route never returns SimulationResponseV2Draft directly");
  assertSourceExcludes(routeSource, "runnerResult.error?.message", "Route does not leak runner error messages publicly");
  assertSourceExcludes(routeSource, "process.env", "Route does not read environment configuration");
  assertSourceExcludes(routeSource, "openai", "Route does not import OpenAI runtime");
  assertSourceExcludes(routeSource, "fetch(", "Route does not perform provider/network fetch");

  assertSourceIncludes(adapterSource, "contractVersion: SIMULATE_API_CONTRACT_VERSION", "Adapter owns public contractVersion");
  assertSourceIncludes(adapterSource, "data: null", "Adapter failed envelopes keep data:null");
  assertSourceIncludes(adapterSource, "validatePublicSimulationEnvelopeShape", "Adapter exports public envelope validator");
  assertSourceExcludes(adapterSource, "process.env", "Adapter does not read environment configuration");
  assertSourceExcludes(adapterSource, "openai", "Adapter does not import OpenAI runtime");
}

function printSummary() {
  const failed = checks.filter((check) => !check.passed);
  const passed = checks.length - failed.length;

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
  }

  console.log(`\nDeterministic runtime contract regression quality gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  runSourceChecks();
  await withServer(runApiChecks);
} catch (error) {
  fail("Deterministic runtime contract regression quality gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
