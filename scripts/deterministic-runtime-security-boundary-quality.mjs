import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const nextBin = join(rootDir, "node_modules", "next", "dist", "bin", "next");
const buildIdPath = join(rootDir, ".next", "BUILD_ID");
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

function randomPort() {
  return 4700 + Math.floor(Math.random() * 1000);
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
        headers: { "user-agent": "levio-security-boundary-quality" },
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
      "user-agent": `levio-security-boundary-quality-${options.source}`,
      "x-forwarded-for": `203.0.113.${options.source}`,
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

function assertPublicEnvelope(payload, expectedStatus) {
  assert(payload.contractVersion === contractVersion, "Unexpected contractVersion.");
  assert(typeof payload.requestId === "string" && payload.requestId.length > 8, "Missing requestId.");
  assert(payload.status === expectedStatus, "Unexpected public status.");
  assert(payload.meta?.lang === "es", "Unexpected meta.lang.");
  assert(payload.meta?.safeRender === true, "safeRender must stay true.");
  assert(payload.meta?.mockOnly === true, "mockOnly must stay true.");
  assert(payload.meta?.apiReady === true, "apiReady must stay true.");
  assert(payload.meta?.maxInputLength === maxInputLength, "Unexpected maxInputLength.");
  assert(payload.meta?.maxBodyLength === maxBodyLength, "Unexpected maxBodyLength.");
  assert(typeof payload.meta?.generatedAt === "string", "Missing generatedAt.");

  if (expectedStatus === "completed") {
    assert(payload.error === null, "Completed envelope must not include error.");
    assert(payload.data && typeof payload.data === "object", "Completed envelope must include data.");
    return;
  }

  assert(payload.data === null, "Failed envelope must keep data:null.");
  assert(payload.error && typeof payload.error.code === "string", "Failed envelope requires error.code.");
  assert(typeof payload.error.message === "string", "Failed envelope requires error.message.");
}

function assertNoInternalLeakage(payload) {
  const serialized = JSON.stringify(payload);
  const forbidden = [
    "traceability",
    "controlledFailures",
    "runnerVersion",
    "builderVersion",
    "providerSdkUsed",
    "apiKeyRead",
    "environmentRead",
    "stack",
    "TypeError",
    "SyntaxError",
    "SimulationResponseV2Draft",
    "DecisionContext",
  ];

  for (const marker of forbidden) {
    assert(!serialized.includes(marker), `Public response leaked ${marker}.`);
  }
}

async function expectSecurityCase(baseUrl, name, options, expected) {
  try {
    const { response, payload } = await postSimulation(baseUrl, options);

    assert(response.status === expected.httpStatus, `Expected HTTP ${expected.httpStatus}, received ${response.status}.`);
    assertPublicEnvelope(payload, expected.status);
    assert(payload.error?.code === expected.errorCode, `Expected ${expected.errorCode}, received ${payload.error?.code}.`);
    assertNoInternalLeakage(payload);
    pass(name);
  } catch (error) {
    fail(name, error instanceof Error ? error.message : String(error));
  }
}

async function runApiChecks(baseUrl) {
  await expectSecurityCase(
    baseUrl,
    "Security boundary rejects non-JSON content type",
    { source: 1, headers: { "content-type": "text/plain" }, body: "input=hola" },
    { httpStatus: 415, status: "failed", errorCode: "invalid_content_type" },
  );

  await expectSecurityCase(
    baseUrl,
    "Security boundary rejects malformed JSON",
    { source: 2, headers: { "content-type": "application/json" }, body: "{not-json" },
    { httpStatus: 400, status: "failed", errorCode: "invalid_json" },
  );

  const invalidPayloadCases = [
    ["JSON null", "null"],
    ["JSON array", "[]"],
    ["JSON string", JSON.stringify("hola")],
    ["JSON number", "42"],
    ["input object", JSON.stringify({ input: { nested: "hola" } })],
    ["input array", JSON.stringify({ input: ["hola"] })],
    ["unsupported lang", JSON.stringify({ input: "Explorar una decision", lang: "en" })],
    ["non-string lang", JSON.stringify({ input: "Explorar una decision", lang: 7 })],
    ["unknown field", JSON.stringify({ input: "Explorar una decision", debug: true })],
    ["prototype-like field", "{\"input\":\"Explorar una decision\",\"__proto__\":{\"debug\":true}}"],
    ["provider-like field", JSON.stringify({ input: "Explorar una decision", providerPayload: { model: "x" } })],
  ];

  for (let index = 0; index < invalidPayloadCases.length; index += 1) {
    const [label, body] = invalidPayloadCases[index];
    await expectSecurityCase(
      baseUrl,
      `Security boundary rejects ${label}`,
      { source: 10 + index, headers: { "content-type": "application/json" }, body },
      { httpStatus: 400, status: "failed", errorCode: "invalid_payload" },
    );
  }

  await expectSecurityCase(
    baseUrl,
    "Security boundary rejects missing input",
    { source: 40, headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: "es" }) },
    { httpStatus: 400, status: "failed", errorCode: "input_required" },
  );

  await expectSecurityCase(
    baseUrl,
    "Security boundary rejects empty input",
    { source: 41, headers: { "content-type": "application/json" }, body: JSON.stringify({ input: "   ", lang: "es" }) },
    { httpStatus: 400, status: "failed", errorCode: "input_required" },
  );

  await expectSecurityCase(
    baseUrl,
    "Security boundary rejects oversized body",
    {
      source: 42,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "x".repeat(maxBodyLength + 100), lang: "es" }),
    },
    { httpStatus: 413, status: "failed", errorCode: "body_too_large" },
  );

  await expectSecurityCase(
    baseUrl,
    "Security boundary rejects oversized input",
    {
      source: 43,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "x".repeat(maxInputLength + 1), lang: "es" }),
    },
    { httpStatus: 413, status: "failed", errorCode: "input_too_long" },
  );

  try {
    const { response, payload } = await postSimulation(baseUrl, {
      source: 60,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input: "Lanzar una oferta premium con riesgo operativo", lang: "es" }),
    });

    assert(response.status === 200, `Expected HTTP 200, received ${response.status}.`);
    assertPublicEnvelope(payload, "completed");
    assertNoInternalLeakage(payload);
    pass("Security boundary preserves valid public request behavior");
  } catch (error) {
    fail("Security boundary preserves valid public request behavior", error instanceof Error ? error.message : String(error));
  }
}

function assertSourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function assertSourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function runRouteSourceChecks() {
  const source = readFileSync(routePath, "utf8");
  const validationIndex = source.indexOf("validateSimulatePayload(bodyResult.body, requestId)");
  const runnerIndex = source.indexOf("runInternalSimulationPipeline({");
  const adapterIndex = source.indexOf("adaptSimulationResponseV2ToPublicSimulatorEnvelope({");

  assertSourceIncludes(source, "ALLOWED_PAYLOAD_FIELDS", "Route defines explicit payload allow-list");
  assertSourceIncludes(source, "isRecord(body)", "Route rejects non-object JSON payloads");
  assertSourceIncludes(source, "Object.keys(body)", "Route inspects all top-level payload fields");
  assertSourceIncludes(source, "Object.prototype.hasOwnProperty.call(body, \"input\")", "Route requires explicit input field");
  assertSourceIncludes(source, "typeof body.input !== \"string\"", "Route rejects non-string input");
  assertSourceIncludes(source, "body.lang !== \"es\"", "Route rejects unsupported public lang values");
  assertSourceIncludes(source, "isJsonContentType(contentType)", "Route validates JSON media type before body parsing");
  assertSourceIncludes(source, "readJsonBody(req, requestId)", "Route parses body before payload validation");
  assertSourceIncludes(source, "validatePublicSimulationEnvelopeShape(response)", "Route validates public response before returning");
  assertCheck(
    "Payload validation happens before deterministic runner",
    validationIndex > -1 && runnerIndex > -1 && validationIndex < runnerIndex,
    "Route must validate payload before running the pipeline.",
  );
  assertCheck(
    "Public adapter remains after deterministic runner",
    runnerIndex > -1 && adapterIndex > -1 && runnerIndex < adapterIndex,
    "Route must keep runner before public adapter.",
  );
  assertSourceExcludes(source, "Response.json(runnerResult", "Route never returns runner internals directly");
  assertSourceExcludes(source, "runnerResult.error?.message", "Route does not leak runner error messages publicly");
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

  console.log(`\nDeterministic runtime security boundary quality gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  runRouteSourceChecks();
  await withServer(runApiChecks);
} catch (error) {
  fail("Deterministic runtime security boundary quality gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
