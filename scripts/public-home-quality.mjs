import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const nextBin = join(rootDir, "node_modules", "next", "dist", "bin", "next");
const buildIdPath = join(rootDir, ".next", "BUILD_ID");
const pagePath = join(rootDir, "app", "page.tsx");
const simulatorPath = join(rootDir, "components", "HomeSimulator.tsx");
const cssPath = join(rootDir, "app", "globals.css");
const packagePath = join(rootDir, "package.json");

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

function read(path) {
  return readFileSync(path, "utf8");
}

function randomPort() {
  return 5200 + Math.floor(Math.random() * 1000);
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
        headers: { "user-agent": "levio-public-home-quality" },
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
    throw new Error("Missing .next/BUILD_ID. Run npm run build before npm run quality:public-home.");
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
    await run(baseUrl, serverOutput);
  } catch (error) {
    if (serverOutput) {
      console.error(serverOutput.trim());
    }
    throw error;
  } finally {
    server.kill("SIGTERM");
  }
}

function sourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function sourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function htmlIncludes(html, text, name) {
  assertCheck(name, html.includes(text), `Missing HTML invariant: ${text}`);
}

function runMobileResponsiveChecks(pageSource, simulatorSource, css) {
  sourceIncludes(css, "overflow-x: hidden", "Global CSS blocks obvious horizontal overflow");
  sourceIncludes(css, "width: min(1180px, calc(100% - 36px))", "Base site shell uses viewport-safe width");
  sourceIncludes(css, "@media (max-width: 860px)", "Mobile/tablet breakpoint exists");
  sourceIncludes(css, "@media (max-width: 480px)", "Small mobile breakpoint exists");
  sourceIncludes(css, ".reference-hero .hero-motion-title", "Hero mobile motion target is styled");
  sourceIncludes(css, ".reference-workspace .decision-console", "Public simulator shell is styled");
  sourceIncludes(css, ".reference-workspace .decision-console .input-row", "Simulator input row has responsive styling");
  sourceIncludes(css, "#decision-input", "Decision input has dedicated CSS guardrails");
  sourceIncludes(css, ".reference-workspace .decision-input-shell textarea", "Textarea mobile spacing is guarded");
  sourceIncludes(css, ".reference-workspace .decision-console .input-row .voice-input-button", "Voice button has stable touch styling");
  sourceIncludes(css, "min-height: 44px", "Mobile navigation keeps accessible touch target height");
  sourceIncludes(css, "prefers-reduced-motion: reduce", "Reduced-motion mode is supported");

  sourceIncludes(pageSource, 'id="hero-title"', "Hero title anchor remains present");
  sourceIncludes(pageSource, 'href="#decision-input"', "Primary simulator CTA points to simulator input");
  sourceIncludes(pageSource, 'id="escenarios"', "Public simulator workspace section remains present");
  sourceIncludes(pageSource, 'id="motor"', "Process section remains present");
  sourceIncludes(pageSource, 'id="producto"', "Product/capabilities section remains present");
  sourceIncludes(pageSource, "<HomeSimulator />", "Home keeps public simulator mounted");
  sourceIncludes(simulatorSource, 'id="decision-input"', "Simulator textarea id remains stable");
  sourceIncludes(simulatorSource, "maxLength={MAX_SIMULATION_INPUT_LENGTH}", "Simulator input length remains bounded");
}

function runAccessibilityChecks(pageSource, simulatorSource) {
  sourceIncludes(pageSource, 'aria-labelledby="hero-title"', "Hero section is labelled");
  sourceIncludes(pageSource, 'aria-label="Accesos principales"', "Hero CTA group has accessible label");
  sourceIncludes(pageSource, 'aria-label="Acceso principal"', "Primary nav has accessible label");
  sourceIncludes(pageSource, 'aria-label="Señales del producto"', "Trust signal list has accessible label");
  sourceIncludes(pageSource, 'aria-labelledby="workspace-title"', "Workspace section is labelled");

  sourceIncludes(simulatorSource, 'aria-label="Simulador inicial de decisión"', "Simulator section has accessible label");
  sourceIncludes(simulatorSource, '<label htmlFor="decision-input">', "Textarea has explicit label");
  sourceIncludes(simulatorSource, 'id="decision-input"', "Textarea id matches label target");
  sourceIncludes(simulatorSource, 'type="submit"', "Submit action is a real submit button");
  sourceIncludes(simulatorSource, 'Simular decisión', "Submit button has clear text");
  sourceIncludes(simulatorSource, 'aria-live={errorState ? "assertive" : "polite"}', "Status region announces state changes");
  sourceIncludes(simulatorSource, 'role={errorState ? "alert" : "status"}', "Error/success states are not visual-only");
  sourceIncludes(simulatorSource, 'aria-label={isListening ? "Detener dictado por voz" : "Iniciar dictado por voz"}', "Voice action has clear aria label");
  sourceIncludes(simulatorSource, "aria-pressed={isListening}", "Voice toggle exposes pressed state");
  sourceIncludes(simulatorSource, 'aria-label="Etapas de simulación del motor"', "Thinking stages have accessible label");
  sourceIncludes(simulatorSource, 'aria-label="Acciones posteriores a la simulación"', "Post-result actions have accessible label");
  sourceIncludes(simulatorSource, "No se ha generado una simulación local de sustitución.", "Controlled error copy is user-visible");
  sourceIncludes(simulatorSource, "Simulación demo completada.", "Successful completion copy is user-visible");
}

function runPerformanceSafetyChecks(pageSource, simulatorSource, packageSource) {
  const packageJson = JSON.parse(packageSource);
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
  const dependencyNames = Object.keys(dependencies);
  const forbiddenDependencies = [
    "openai",
    "ai",
    "@anthropic-ai/sdk",
    "langchain",
    "playwright",
    "@playwright/test",
    "cypress",
    "puppeteer",
  ];

  for (const dependency of forbiddenDependencies) {
    assertCheck(
      `No unexpected heavy/provider dependency: ${dependency}`,
      !dependencyNames.includes(dependency),
      `${dependency} must not be introduced for this gate.`,
    );
  }

  sourceExcludes(pageSource, "fetch(", "Home page does not add client/server data fetch");
  sourceExcludes(pageSource, "process.env", "Home page does not read environment configuration");
  sourceExcludes(simulatorSource, "OpenAI", "Simulator does not mention OpenAI runtime");
  sourceExcludes(simulatorSource, "process.env", "Simulator does not read environment configuration");
  sourceExcludes(simulatorSource, "buildMockSimulation(", "Simulator does not call local mock fallback builder");
  sourceExcludes(simulatorSource, "local fallback", "Simulator does not reintroduce local fallback wording");
  sourceIncludes(simulatorSource, 'fetch("/api/simulate"', "Simulator keeps single public API request path");
  sourceIncludes(simulatorSource, "isSimulateApiResponse(payload)", "Simulator validates API payload before render");
  sourceIncludes(simulatorSource, "runtime de IA real aún no está conectado", "Simulator keeps Real AI deferred truth boundary");
}

async function runRuntimeHtmlChecks(baseUrl) {
  try {
    const response = await fetch(baseUrl, {
      headers: { "user-agent": "levio-public-home-quality" },
    });
    const html = await response.text();

    assert(response.status === 200, `Expected / to return 200, received ${response.status}.`);
    assert(html.length > 20_000, "Home HTML is unexpectedly small.");
    assert(html.length < 260_000, `Home HTML is unexpectedly large: ${html.length} bytes.`);

    pass("Home route returns successful production HTML");
    pass("Home HTML remains within lightweight public flow size budget");

    htmlIncludes(html, 'id="hero-title"', "Runtime HTML includes hero title");
    htmlIncludes(html, 'id="decision-input"', "Runtime HTML includes simulator textarea");
    htmlIncludes(html, 'id="escenarios"', "Runtime HTML includes simulator workspace");
    htmlIncludes(html, 'id="motor"', "Runtime HTML includes process section");
    htmlIncludes(html, 'id="producto"', "Runtime HTML includes product section");
    htmlIncludes(html, "Comenzar simulación", "Runtime HTML includes primary CTA");
    htmlIncludes(html, "Ver cómo funciona", "Runtime HTML includes secondary CTA");
    htmlIncludes(html, "Simular decisión", "Runtime HTML includes simulator submit action");
    htmlIncludes(html, "Preview público", "Runtime HTML includes mock preview status");
    htmlIncludes(html, "runtime de IA real conectado", "Runtime HTML keeps Real AI deferred copy");

    assertCheck(
      "Runtime HTML does not contain fatal Next.js error markers",
      !/Application error|Internal Server Error|NEXT_NOT_FOUND|Unhandled Runtime Error/i.test(html),
      "Fatal runtime marker found in Home HTML.",
    );
  } catch (error) {
    fail("Home route runtime HTML checks", error instanceof Error ? error.message : String(error));
  }
}

function printSummary() {
  const failed = checks.filter((check) => !check.passed);
  const passed = checks.length - failed.length;

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
  }

  console.log(`\nPublic home quality gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  const pageSource = read(pagePath);
  const simulatorSource = read(simulatorPath);
  const css = read(cssPath);
  const packageSource = read(packagePath);

  runMobileResponsiveChecks(pageSource, simulatorSource, css);
  runAccessibilityChecks(pageSource, simulatorSource);
  runPerformanceSafetyChecks(pageSource, simulatorSource, packageSource);
  await withServer(runRuntimeHtmlChecks);
} catch (error) {
  fail("Public home quality gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
