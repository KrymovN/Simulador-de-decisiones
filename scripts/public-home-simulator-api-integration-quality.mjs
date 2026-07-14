import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const nextBin = join(rootDir, "node_modules", "next", "dist", "bin", "next");
const buildIdPath = join(rootDir, ".next", "BUILD_ID");
const pagePath = join(rootDir, "app", "page.tsx");
const simulatorPath = join(rootDir, "components", "HomeSimulator.tsx");
const contractVersion = "simulate-api-v1-mock";
const maxInputLength = 1200;
const maxBodyLength = 8192;

const checks = [];
let server;

const forbiddenPublicLeakageMarkers = [
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

function read(path) {
  return readFileSync(path, "utf8");
}

function randomPort() {
  return 5600 + Math.floor(Math.random() * 1000);
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
        headers: { "user-agent": "levio-home-simulator-api-integration-quality" },
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
      "content-type": "application/json",
      "user-agent": `levio-home-simulator-api-integration-quality-${options.source}`,
      "x-forwarded-for": `198.51.100.${options.source}`,
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

function sourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function sourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function assertNoInternalLeakage(payload) {
  const serialized = JSON.stringify(payload);

  for (const marker of forbiddenPublicLeakageMarkers) {
    assert(!serialized.includes(marker), `Public response leaked ${marker}.`);
  }
}

function assertPublicEnvelope(payload, expectedStatus) {
  assert(payload.contractVersion === contractVersion, "contractVersion changed.");
  assert(typeof payload.requestId === "string" && payload.requestId.length > 8, "requestId is missing.");
  assert(payload.status === expectedStatus, `Expected status ${expectedStatus}, received ${payload.status}.`);
  assert(payload.meta?.lang === "es", "meta.lang changed.");
  assert(payload.meta?.safeRender === true, "safeRender must stay true.");
  assert(payload.meta?.mockOnly === true, "mockOnly must stay true.");
  assert(payload.meta?.apiReady === true, "apiReady must stay true.");
  assert(payload.meta?.maxInputLength === maxInputLength, "maxInputLength changed.");
  assert(payload.meta?.maxBodyLength === maxBodyLength, "maxBodyLength changed.");
  assert(typeof payload.meta?.generatedAt === "string", "generatedAt is missing.");
  assertNoInternalLeakage(payload);
}

function assertCompletedEnvelope(payload) {
  assertPublicEnvelope(payload, "completed");
  assert(payload.error === null, "Completed response must keep error:null.");
  assert(payload.data && typeof payload.data === "object", "Completed response must include data.");
  assert(payload.data.simulation && typeof payload.data.simulation === "object", "Completed response must include simulation.");
  assert(Array.isArray(payload.data.thinkingStages), "Completed response must include thinkingStages.");
  assert(Array.isArray(payload.data.simulation.scenarios), "Completed response must include scenarios.");
  assert(payload.data.simulation.scenarios.length > 0, "Completed response must include at least one scenario.");
}

function assertFailedEnvelope(payload, expectedErrorCode) {
  assertPublicEnvelope(payload, "failed");
  assert(payload.data === null, "Failed response must keep data:null.");
  assert(payload.error?.code === expectedErrorCode, `Expected ${expectedErrorCode}, received ${payload.error?.code}.`);
  assert(typeof payload.error?.message === "string" && payload.error.message.length > 0, "Failed response requires safe message.");
  assert(!("simulation" in payload), "Failed envelope must not expose simulation at top level.");
  assert(!("scenario" in payload), "Failed envelope must not expose scenario at top level.");
  assert(!("scenarios" in payload), "Failed envelope must not expose scenarios at top level.");
  assert(!("recommendation" in payload), "Failed envelope must not expose recommendation at top level.");
}

async function expectIntegrationCase(baseUrl, name, options, expected) {
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

function runSimulatorSourceChecks() {
  const source = read(simulatorPath);
  const successIndex = source.indexOf('if (simulationResult.status === "completed")');
  const resultSetIndex = source.indexOf("setResult(simulationResult.simulation)");
  const failureIndex = source.indexOf("setResult(null)");
  const errorIndex = source.indexOf("setErrorState({");

  sourceIncludes(source, 'fetch("/api/simulate"', "HomeSimulator uses approved /api/simulate route");
  sourceIncludes(source, 'body: JSON.stringify({ input: situation, lang: "es" })', "HomeSimulator sends only approved input/lang payload");
  sourceIncludes(source, "isSimulateApiResponse(payload)", "HomeSimulator validates public envelope before handling");
  sourceIncludes(source, 'payload.status === "failed"', "HomeSimulator branches failed envelopes explicitly");
  sourceIncludes(source, "throw new SimulateApiFailure", "HomeSimulator converts fail-close envelopes to controlled UI state");
  sourceIncludes(source, "setPreviewState(null)", "HomeSimulator clears preview metadata on failed envelopes");
  sourceIncludes(source, "No se ha generado una simulación local de sustitución.", "HomeSimulator tells users there is no local substitute");
  sourceIncludes(source, "{result && (", "HomeSimulator renders simulation artifacts only when result exists");
  sourceIncludes(source, "result?.thinkingStages ??", "HomeSimulator guards thinking stages before result exists");
  sourceIncludes(source, "result.simulation.scenarios.map", "HomeSimulator scenario rendering is success-only");
  sourceIncludes(source, "data: null", "HomeSimulator public response type models failed data:null");
  sourceIncludes(source, "error: null", "HomeSimulator public response type models completed error:null");
  sourceIncludes(source, "value.contractVersion !== SIMULATE_API_CONTRACT_VERSION", "HomeSimulator rejects unexpected contract version");
  sourceIncludes(source, "safeRender !== true", "HomeSimulator checks safeRender before render");
  sourceIncludes(source, "mockOnly !== true", "HomeSimulator checks mockOnly before render");
  sourceIncludes(source, "apiReady !== true", "HomeSimulator checks apiReady before render");
  sourceIncludes(source, "la conexión con IA real aún no está activada", "HomeSimulator keeps Real AI deferred copy");
  sourceIncludes(source, "Simulación demo completada.", "HomeSimulator has controlled success message");
  sourceIncludes(source, "Simulación detenida. No se generó un resultado local de sustitución.", "HomeSimulator has controlled failure message");
  sourceIncludes(source, 'simulateError?.code === "rate_limited"', "HomeSimulator recognizes public rate-limit error code");
  sourceIncludes(source, "Límite temporal alcanzado", "HomeSimulator maps rate-limit errors to safe title");
  sourceIncludes(source, "Simulación no ejecutada", "HomeSimulator maps other public errors to safe title");
  sourceIncludes(source, 'aria-live={errorState ? "assertive" : "polite"}', "HomeSimulator keeps safe status announcement");

  assertCheck(
    "HomeSimulator sets result only on completed branch",
    successIndex > -1 && resultSetIndex > -1 && successIndex < resultSetIndex,
    "setResult(simulationResult.simulation) must remain inside the completed branch.",
  );
  assertCheck(
    "HomeSimulator fails closed before rendering error state",
    failureIndex > -1 && errorIndex > -1 && failureIndex < errorIndex,
    "Failed handling must clear result before setting error UI.",
  );

  sourceExcludes(source, "buildMockSimulation(", "HomeSimulator does not call local fallback builder");
  sourceExcludes(source, "ResponseV2Draft", "HomeSimulator does not know internal draft type");
  sourceExcludes(source, "DecisionContext", "HomeSimulator does not know internal decision context");
  sourceExcludes(source, "traceability", "HomeSimulator does not read traceability metadata");
  sourceExcludes(source, "controlledFailures", "HomeSimulator does not read controlled failure internals");
  sourceExcludes(source, "providerPayload", "HomeSimulator does not read provider payload");
  sourceExcludes(source, "providerSdkUsed", "HomeSimulator does not read provider SDK metadata");
  sourceExcludes(source, "apiKey", "HomeSimulator does not read API key metadata");
  sourceExcludes(source, "process.env", "HomeSimulator does not read environment configuration");
  sourceExcludes(source, "OpenAI", "HomeSimulator does not mention OpenAI runtime");
}

function runHomePositioningChecks() {
  const pageSource = read(pagePath);
  const simulatorSource = read(simulatorPath);
  const combinedSource = `${pageSource}\n${simulatorSource}`;

  sourceIncludes(pageSource, "<HomeSimulator />", "Public Home keeps HomeSimulator mounted");
  sourceIncludes(pageSource, "Sistema de simulación de decisiones", "Public Home keeps Decision Simulation Engine positioning");
  sourceIncludes(pageSource, "No una respuesta. Una simulación de futuros posibles.", "Public Home rejects answer-engine positioning");
  sourceIncludes(pageSource, "Motor de simulación para decisiones con consecuencias reales.", "Public Home footer keeps simulation-engine positioning");
  sourceIncludes(pageSource, "Preview público con respuestas de ejemplo", "Public Home keeps demonstrative public state");
  sourceIncludes(pageSource, "la conexión con IA real todavía no está activada", "Public Home keeps Real AI deferred truth boundary");
  sourceIncludes(simulatorSource, "Vista previa determinista · IA real aún no conectada", "HomeSimulator keeps the concise deterministic preview disclosure");

  sourceExcludes(combinedSource, "AI Chat", "Public Home does not position Levio as AI Chat");
  sourceExcludes(combinedSource, "Answer Engine", "Public Home does not position Levio as Answer Engine");
  sourceExcludes(combinedSource, "Generic Assistant", "Public Home does not position Levio as generic assistant");
  sourceExcludes(combinedSource, "ChatGPT", "Public Home does not mention ChatGPT");
  sourceExcludes(combinedSource, "Stripe", "Public Home does not mention billing provider");
  sourceExcludes(combinedSource, "billing", "Public Home does not promise billing");
  sourceExcludes(combinedSource, "closed beta", "Public Home does not promise closed beta");
  sourceExcludes(combinedSource, "memoria de cuenta", "Public Home does not promise account memory");
  sourceIncludes(simulatorSource, "sin presentarse como predicción lista para producción", "HomeSimulator keeps production-readiness disclaimer");
}

async function runApiEnvelopeChecks(baseUrl) {
  await expectIntegrationCase(
    baseUrl,
    "Home integration accepts successful deterministic envelope",
    {
      source: 31,
      body: JSON.stringify({ input: "Comparar una oferta laboral con riesgo familiar", lang: "es" }),
    },
    { httpStatus: 200, status: "completed" },
  );

  await expectIntegrationCase(
    baseUrl,
    "Home integration accepts REFUSED data-null envelope",
    {
      source: 32,
      body: JSON.stringify({ input: "Estoy pensando en matarme", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "REFUSED" },
  );

  await expectIntegrationCase(
    baseUrl,
    "Home integration accepts CLARIFICATION_REQUIRED data-null envelope",
    {
      source: 33,
      body: JSON.stringify({ input: "Explorar una decision de salud esta semana", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "CLARIFICATION_REQUIRED" },
  );

  await expectIntegrationCase(
    baseUrl,
    "Home integration accepts CANNOT_RECOMMEND data-null envelope",
    {
      source: 34,
      body: JSON.stringify({ input: "Decidir si cambio mi tratamiento medico", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "CANNOT_RECOMMEND" },
  );

  await expectIntegrationCase(
    baseUrl,
    "Home integration accepts INVALID_PAYLOAD data-null envelope",
    {
      source: 35,
      body: JSON.stringify({ input: "Comparar una decision", debug: true }),
    },
    { httpStatus: 400, status: "failed", errorCode: "invalid_payload" },
  );
}

async function runRuntimeHomeChecks(baseUrl) {
  try {
    const response = await fetch(baseUrl, {
      headers: { "user-agent": "levio-home-simulator-api-integration-quality" },
    });
    const html = await response.text();

    assert(response.status === 200, `Expected / to return 200, received ${response.status}.`);
    assert(html.includes('id="decision-input"'), "Runtime HTML must include simulator textarea.");
    assert(html.includes("Vista previa determinista · IA real aún no conectada"), "Runtime HTML must keep the concise deterministic preview disclosure.");
    assert(html.includes("Preview público"), "Runtime HTML must include public preview status.");
    assert(html.includes("conexión con IA real"), "Runtime HTML must keep deferred Real AI copy.");
    assert(!/Application error|Internal Server Error|Unhandled Runtime Error/i.test(html), "Runtime HTML contains fatal error marker.");
    pass("Runtime Home mounts simulator with safe public positioning");
  } catch (error) {
    fail("Runtime Home mounts simulator with safe public positioning", error instanceof Error ? error.message : String(error));
  }
}

function printSummary() {
  const failed = checks.filter((check) => !check.passed);
  const passed = checks.length - failed.length;

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
  }

  console.log(`\nPublic HomeSimulator API integration quality gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  runSimulatorSourceChecks();
  runHomePositioningChecks();
  await withServer(async (baseUrl) => {
    await runApiEnvelopeChecks(baseUrl);
    await runRuntimeHomeChecks(baseUrl);
  });
} catch (error) {
  fail("Public HomeSimulator API integration quality gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
