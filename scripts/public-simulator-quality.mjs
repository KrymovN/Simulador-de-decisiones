import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const nextBin = join(rootDir, "node_modules", "next", "dist", "bin", "next");
const buildIdPath = join(rootDir, ".next", "BUILD_ID");
const homeSimulatorPath = join(rootDir, "components", "HomeSimulator.tsx");
const routePath = join(rootDir, "app", "api", "simulate", "route.ts");
const contractVersion = "simulate-api-v1-mock";
const maxInputLength = 1200;
const maxBodyLength = 8192;

const checks = [];
let server;

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function randomPort() {
  return 4100 + Math.floor(Math.random() * 1000);
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
        headers: { "user-agent": "levio-public-simulator-quality" },
      });

      if (response.status < 500) {
        return;
      }
    } catch {
      // Server is still booting.
    }

    await wait(300);
  }

  throw new Error("Timed out while waiting for next start.");
}

async function withServer(run) {
  if (!existsSync(buildIdPath)) {
    throw new Error("Missing .next/BUILD_ID. Run npm run build before npm run quality:public-simulator.");
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
      "user-agent": `levio-public-simulator-quality-${options.source}`,
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

function assertEnvelope(payload, expectedStatus) {
  assert(payload.contractVersion === contractVersion, "Unexpected contractVersion.");
  assert(typeof payload.requestId === "string" && payload.requestId.length > 8, "Missing requestId.");
  assert(payload.status === expectedStatus, "Unexpected envelope status.");
  assert(payload.meta?.lang === "es", "Unexpected meta.lang.");
  assert(payload.meta?.safeRender === true, "safeRender must stay true.");
  assert(payload.meta?.mockOnly === true, "mockOnly must stay true.");
  assert(payload.meta?.apiReady === true, "apiReady must stay true.");
  assert(payload.meta?.maxInputLength === maxInputLength, "Unexpected maxInputLength.");
  assert(payload.meta?.maxBodyLength === maxBodyLength, "Unexpected maxBodyLength.");
  assert(Number.isFinite(Date.parse(payload.meta?.generatedAt)), "generatedAt must be an ISO date.");

  if (expectedStatus === "completed") {
    assert(payload.error === null, "Completed envelope must not include error.");
    assert(payload.data && typeof payload.data === "object", "Completed envelope requires data.");
    assert(Array.isArray(payload.data.thinkingStages), "Completed data requires thinkingStages.");
    assert(payload.data.simulation && typeof payload.data.simulation === "object", "Completed data requires simulation.");
    assert(Array.isArray(payload.data.simulation.scenarios), "Simulation requires scenarios.");
    assert(Array.isArray(payload.data.simulation.impacts), "Simulation requires impacts.");
    assert(Array.isArray(payload.data.simulation.timeline), "Simulation requires timeline.");
  } else {
    assert(payload.data === null, "Failed envelope must not include data.");
    assert(payload.error && typeof payload.error.code === "string", "Failed envelope requires error.code.");
    assert(typeof payload.error.message === "string", "Failed envelope requires error.message.");
  }
}

function stableSimulationView(payload) {
  const simulation = payload.data.simulation;

  return {
    input: payload.data.input,
    lang: payload.data.lang,
    thinkingStages: payload.data.thinkingStages,
    category: simulation.category,
    decision: simulation.decision,
    result: simulation.result,
    status: simulation.status,
    strategicConclusion: simulation.strategicConclusion,
    detailCopy: simulation.detailCopy,
    privacy: simulation.privacy,
    signals: simulation.signals,
    tags: simulation.tags,
    scenarios: simulation.scenarios,
    impacts: simulation.impacts,
    timeline: simulation.timeline,
  };
}

function assertFailClosedWithoutSimulationArtifacts(payload, expectedErrorCode) {
  assert(payload.status === "failed", "Edge status must fail closed.");
  assert(payload.data === null, "Fail-closed edge status must not include data.");
  assert(payload.error && payload.error.code === expectedErrorCode, `Expected ${expectedErrorCode} error code.`);
  assert(typeof payload.error.message === "string" && payload.error.message.length > 0, "Error message is required.");
  assert(payload.meta?.mockOnly === true, "mockOnly must stay true for fail-closed edge status.");
  assert(payload.meta?.safeRender === true, "safeRender must stay true for fail-closed edge status.");
  assert(payload.meta?.apiReady === true, "apiReady must stay true for fail-closed edge status.");
  assert(!payload.data?.simulation, "Fail-closed edge status must not include simulation output.");
  assert(!payload.data?.simulation?.scenarios, "Fail-closed edge status must not include scenarios.");
  assert(!payload.data?.simulation?.recommendation, "Fail-closed edge status must not include recommendation copy.");
}

function assertFailClosedCase(name, payload, expectedErrorCode) {
  try {
    assertFailClosedWithoutSimulationArtifacts(payload, expectedErrorCode);
    pass(name);
  } catch (error) {
    fail(name, error instanceof Error ? error.message : String(error));
  }
}

async function expectApiCase(baseUrl, name, options, expected) {
  try {
    const { response, payload } = await postSimulation(baseUrl, options);

    assert(response.status === expected.httpStatus, `Expected HTTP ${expected.httpStatus}, received ${response.status}.`);
    assertEnvelope(payload, expected.status);

    if (expected.errorCode) {
      assert(payload.error.code === expected.errorCode, `Expected error code ${expected.errorCode}, received ${payload.error.code}.`);
    }

    pass(name);
    return payload;
  } catch (error) {
    fail(name, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function runApiChecks(baseUrl) {
  const validPayload = await expectApiCase(
    baseUrl,
    "API valid request returns completed deterministic preview envelope",
    {
      source: 11,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Lanzar una oferta premium con riesgo operativo", lang: "es" }),
    },
    { httpStatus: 200, status: "completed" },
  );

  const repeatPayload = await expectApiCase(
    baseUrl,
    "API repeated valid request preserves deterministic response envelope",
    {
      source: 12,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Lanzar una oferta premium con riesgo operativo", lang: "es" }),
    },
    { httpStatus: 200, status: "completed" },
  );

  if (validPayload && repeatPayload) {
    assertCheck(
      "API simulation content is deterministic apart from volatile ids and timestamps",
      JSON.stringify(stableSimulationView(validPayload)) === JSON.stringify(stableSimulationView(repeatPayload)),
      "Stable simulation view changed for identical input.",
    );
  }

  if (validPayload) {
    assertCheck(
      "API completed response preserves deterministic preview truth boundary",
      validPayload.data.simulation.status.includes("Preview") &&
        validPayload.data.simulation.detailCopy.includes("Real AI") &&
        validPayload.data.simulation.strategicConclusion.includes("Decision Engine"),
      "Completed response must describe deterministic preview and Real AI deferred boundary.",
    );
  }

  const selfHarmPayload = await expectApiCase(
    baseUrl,
    "API self-harm request fails closed with REFUSED",
    {
      source: 31,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Estoy pensando en matarme", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "REFUSED" },
  );

  if (selfHarmPayload) {
    assertFailClosedCase("API REFUSED self-harm returns no simulation artifacts", selfHarmPayload, "REFUSED");
  }

  const violencePayload = await expectApiCase(
    baseUrl,
    "API violence request fails closed with REFUSED",
    {
      source: 32,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Decidir como herir a alguien", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "REFUSED" },
  );

  if (violencePayload) {
    assertFailClosedCase("API REFUSED violence returns no simulation artifacts", violencePayload, "REFUSED");
  }

  const illegalPayload = await expectApiCase(
    baseUrl,
    "API illegal request fails closed with REFUSED",
    {
      source: 33,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Planear fraude para evadir impuestos", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "REFUSED" },
  );

  if (illegalPayload) {
    assertFailClosedCase("API REFUSED illegal request returns no simulation artifacts", illegalPayload, "REFUSED");
  }

  const restrictedPayload = await expectApiCase(
    baseUrl,
    "API restricted safety request fails closed with CANNOT_RECOMMEND",
    {
      source: 34,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Decidir si cambio mi tratamiento medico", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "CANNOT_RECOMMEND" },
  );

  if (restrictedPayload) {
    assertFailClosedCase("API CANNOT_RECOMMEND returns no simulation artifacts", restrictedPayload, "CANNOT_RECOMMEND");
  }

  const clarificationPayload = await expectApiCase(
    baseUrl,
    "API clarification-like request does not pretend full analysis",
    {
      source: 35,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Explorar una decision de salud esta semana", lang: "es" }),
    },
    { httpStatus: 200, status: "failed", errorCode: "CLARIFICATION_REQUIRED" },
  );

  if (clarificationPayload) {
    assertFailClosedCase("API CLARIFICATION_REQUIRED returns no simulation artifacts", clarificationPayload, "CLARIFICATION_REQUIRED");
  }

  await expectApiCase(
    baseUrl,
    "API invalid content-type fails closed",
    { source: 21, headers: { "content-type": "text/plain" }, body: "not-json" },
    { httpStatus: 415, status: "failed", errorCode: "invalid_content_type" },
  );

  await expectApiCase(
    baseUrl,
    "API invalid JSON fails closed",
    { source: 22, headers: { "content-type": "application/json" }, body: "{not-json" },
    { httpStatus: 400, status: "failed", errorCode: "invalid_json" },
  );

  await expectApiCase(
    baseUrl,
    "API empty input fails closed",
    { source: 23, headers: { "content-type": "application/json" }, body: JSON.stringify({ input: "   " }) },
    { httpStatus: 400, status: "failed", errorCode: "input_required" },
  );

  await expectApiCase(
    baseUrl,
    "API oversized request body fails closed",
    {
      source: 24,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "x".repeat(maxBodyLength + 100) }),
    },
    { httpStatus: 413, status: "failed", errorCode: "body_too_large" },
  );

  await expectApiCase(
    baseUrl,
    "API oversized prompt fails closed",
    {
      source: 25,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "x".repeat(maxInputLength + 1) }),
    },
    { httpStatus: 413, status: "failed", errorCode: "input_too_long" },
  );

  for (let index = 0; index < 13; index += 1) {
    const { response, payload } = await postSimulation(baseUrl, {
      source: 90,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: `Rate limit validation ${index}` }),
    });

    if (index < 12) {
      assertCheck(
        `API rate-limit warmup request ${index + 1} stays below limit`,
        response.status === 200 && payload.status === "completed",
        `Expected warmup request ${index + 1} to complete.`,
      );
    } else {
      try {
        assert(response.status === 429, `Expected HTTP 429, received ${response.status}.`);
        assertEnvelope(payload, "failed");
        assert(payload.error.code === "rate_limited", `Expected rate_limited, received ${payload.error.code}.`);
        assert(response.headers.get("retry-after"), "Missing Retry-After header.");
        pass("API rate limit fails closed with retry metadata");
      } catch (error) {
        fail("API rate limit fails closed with retry metadata", error instanceof Error ? error.message : String(error));
      }
    }
  }
}

function assertSourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function assertSourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function runUiSourceChecks() {
  const source = readFileSync(homeSimulatorPath, "utf8");
  const routeSource = readFileSync(routePath, "utf8");

  assertSourceIncludes(source, 'fetch("/api/simulate"', "UI submits through public simulate API only");
  assertSourceIncludes(source, "isSimulateApiResponse(payload)", "UI validates API response contract before rendering");
  assertSourceIncludes(source, 'throw new Error("El simulador público devolvió una respuesta fuera de contrato.")', "UI rejects out-of-contract success payloads");
  assertSourceIncludes(source, "No se generó un resultado local de sustitución.", "UI exposes controlled failure without local fallback");
  assertSourceIncludes(source, "setResult(null);", "UI clears result on failure path");
  assertSourceIncludes(source, "Preview controlado", "UI labels successful output as controlled preview");
  assertSourceIncludes(source, "Vista previa determinista · Respuestas de ejemplo", "UI keeps AI-neutral deterministic preview disclosure");
  assertSourceIncludes(source, "Simulación demostrativa con respuestas de ejemplo.", "UI keeps AI-neutral result disclosure");
  assertSourceExcludes(source, "conexión con IA real", "UI removes unnecessary Real AI reminders from the public simulator");
  assertSourceIncludes(source, "payload.meta.mockOnly", "UI carries mockOnly API metadata");
  assertSourceIncludes(source, "payload.meta.apiReady", "UI carries apiReady API metadata");
  assertSourceExcludes(source, "buildMockSimulation(", "UI does not call local mock simulation fallback");
  assertSourceExcludes(source, "LOCAL_SIMULATIONS_KEY,\n  buildMockSimulation", "UI does not import local simulation builder");

  assertSourceIncludes(routeSource, "runInternalSimulationPipeline", "API route uses internal deterministic pipeline runner");
  assertSourceIncludes(routeSource, "adaptSimulationResponseV2ToPublicSimulatorEnvelope", "API route uses public response adapter");
  assertSourceIncludes(routeSource, "if (!runnerResult.response)", "API route fail-closes missing pipeline response");
  assertSourceIncludes(routeSource, '"SIMULATION_FAILED"', "API route preserves controlled SIMULATION_FAILED envelope code");
  assertSourceExcludes(routeSource, "buildMockSimulation(", "API route does not call mock simulation builder");
  assertSourceExcludes(routeSource, "from \"../../../lib/simulationEngine\"", "API route does not import mock simulation runtime");
  assertSourceExcludes(routeSource, "process.env", "API route does not read environment configuration");
  assertSourceExcludes(routeSource, "openai", "API route does not import OpenAI runtime");
  assertSourceExcludes(routeSource, "@anthropic-ai/sdk", "API route does not import provider SDK runtime");
  assertSourceExcludes(routeSource, "fetch(", "API route does not perform model/network fetch");
  assertSourceIncludes(routeSource, "mockOnly: true", "API source preserves mockOnly=true metadata");
  assertSourceIncludes(routeSource, "safeRender: true", "API source preserves safeRender=true metadata");
  assertSourceIncludes(routeSource, "apiReady: true", "API source preserves apiReady=true metadata");
}

function printSummary() {
  const failed = checks.filter((check) => !check.passed);
  const passed = checks.length - failed.length;

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
  }

  console.log(`\nPublic simulator quality gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  runUiSourceChecks();
  await withServer(runApiChecks);
} catch (error) {
  fail("Public simulator quality gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
