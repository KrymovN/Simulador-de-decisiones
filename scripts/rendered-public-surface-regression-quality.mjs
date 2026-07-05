import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const nextBin = join(rootDir, "node_modules", "next", "dist", "bin", "next");
const buildIdPath = join(rootDir, ".next", "BUILD_ID");

const sourcePaths = {
  home: join(rootDir, "app", "page.tsx"),
  homeSimulator: join(rootDir, "components", "HomeSimulator.tsx"),
  login: join(rootDir, "app", "login", "page.tsx"),
  register: join(rootDir, "app", "register", "page.tsx"),
  forgotPassword: join(rootDir, "app", "forgot-password", "page.tsx"),
  privacyPolicy: join(rootDir, "app", "privacy-policy", "page.tsx"),
  terms: join(rootDir, "app", "terms", "page.tsx"),
  dashboardLayout: join(rootDir, "app", "dashboard", "layout.tsx"),
  dashboardHome: join(rootDir, "app", "dashboard", "page.tsx"),
  dashboardSecurity: join(rootDir, "app", "dashboard", "security", "page.tsx"),
  dashboardShell: join(rootDir, "components", "DashboardShell.tsx"),
  css: join(rootDir, "app", "globals.css"),
  packageJson: join(rootDir, "package.json"),
  simulateRoute: join(rootDir, "app", "api", "simulate", "route.ts"),
};

const publicPages = [
  {
    label: "Home",
    path: "/",
    status: 200,
    includes: [
      'class="site-shell"',
      'id="hero-title"',
      "Decide antes",
      "Comenzar simulación",
      'id="decision-input"',
      "Preview público",
      "Comenzar ahora",
    ],
  },
  {
    label: "Login",
    path: "/login",
    status: 200,
    includes: [
      'class="auth-shell"',
      "Acceso preparado",
      "Preparar enlace de acceso",
      'type="email"',
    ],
  },
  {
    label: "Register",
    path: "/register",
    status: 200,
    includes: [
      'class="auth-shell"',
      "Prepara tu acceso",
      "Solicitar enlace de acceso",
      "política de privacidad",
      "términos de uso",
    ],
  },
  {
    label: "Forgot Password",
    path: "/forgot-password",
    status: 200,
    includes: [
      'class="auth-shell"',
      "Recuperación preparada",
      "Ver estado de recuperación",
      "no se envían correos reales",
    ],
  },
  {
    label: "Privacy",
    path: "/privacy-policy",
    status: 200,
    includes: [
      'class="auth-shell"',
      "Política de privacidad provisional",
      "política legal final",
      "se almacenan localmente en este navegador",
    ],
  },
  {
    label: "Terms",
    path: "/terms",
    status: 200,
    includes: [
      'class="auth-shell"',
      "Términos de uso provisionales",
      "asesoramiento legal",
      "garantías legales finales",
    ],
  },
];

const protectedRedirects = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Dashboard security", path: "/dashboard/security" },
];

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

function readSources() {
  return Object.fromEntries(
    Object.entries(sourcePaths).map(([key, path]) => [key, read(path)]),
  );
}

function randomPort() {
  return 6100 + Math.floor(Math.random() * 1000);
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
        headers: { "user-agent": "levio-rendered-public-surface-regression" },
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

function sourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function sourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function sourceMatches(source, pattern, name) {
  assertCheck(name, pattern.test(source), `Missing source pattern: ${pattern}`);
}

function htmlIncludes(html, text, name) {
  assertCheck(name, html.includes(text), `Missing rendered HTML invariant: ${text}`);
}

function runRenderedSurfaceSourceChecks(sources) {
  sourceIncludes(sources.home, '<HomeSimulator />', "Home keeps HomeSimulator mounted");
  sourceIncludes(sources.home, 'className="reference-cta-banner"', "Home keeps final CTA rendered");
  sourceIncludes(sources.homeSimulator, 'id="decision-input"', "HomeSimulator keeps stable textarea anchor");
  sourceIncludes(sources.homeSimulator, "Simulación de decisiones disponible 24/7", "HomeSimulator keeps 24/7 decision simulation line");
  sourceIncludes(sources.homeSimulator, "sin conexión todavía a IA real", "HomeSimulator keeps Real AI deferred copy");
  sourceIncludes(sources.dashboardLayout, "requireAuthenticatedDashboardSession", "Dashboard routes remain protected before placeholders render publicly");
  sourceIncludes(sources.dashboardHome, "Vista preparada", "Dashboard placeholder source remains prepared");
  sourceIncludes(sources.dashboardSecurity, "cuando exista auth productivo", "Dashboard security placeholder source remains prepared");
  sourceIncludes(sources.dashboardShell, "Vista preparada del motor de simulación de decisiones.", "Dashboard shell keeps prepared positioning");
  sourceIncludes(sources.simulateRoute, 'const SIMULATE_API_CONTRACT_VERSION = "simulate-api-v1-mock"', "Simulate route keeps approved contractVersion");
  sourceIncludes(sources.simulateRoute, "mockOnly: true", "Simulate route keeps mockOnly public flag");
  sourceIncludes(sources.simulateRoute, "safeRender: true", "Simulate route keeps safeRender public flag");
  sourceIncludes(sources.simulateRoute, "apiReady: true", "Simulate route keeps apiReady public flag");
}

function runResponsiveGuardrailChecks(sources) {
  sourceIncludes(sources.css, "overflow-x: hidden", "Global CSS blocks body-level horizontal overflow");
  sourceIncludes(sources.css, "width: min(1180px, calc(100% - 36px))", "Home shell uses viewport-safe width");
  sourceIncludes(sources.css, "width: min(1240px, calc(100% - 48px))", "Auth shell uses viewport-safe width");
  sourceIncludes(sources.css, "@media (max-width: 860px)", "Tablet/mobile breakpoint remains present");
  sourceIncludes(sources.css, "@media (max-width: 560px)", "Small mobile breakpoint remains present");
  sourceIncludes(sources.css, ".reference-workspace .decision-console .input-row", "Simulator input row has responsive CSS");
  sourceIncludes(sources.css, ".reference-workspace .decision-input-shell textarea", "Simulator textarea voice-button spacing is guarded");
  sourceIncludes(sources.css, ".reference-workspace .decision-console .input-row .voice-input-button", "Voice button has stable rendered placement");
  sourceMatches(
    sources.css,
    /@media\s+\(max-width:\s*560px\)[\s\S]*?\.reference-workspace\s+\.decision-console\s+textarea[\s\S]*?min-height:\s*168px;/,
    "Mobile HomeSimulator textarea has enough rendered height for placeholder and voice control",
  );
  sourceIncludes(sources.css, "text-wrap: balance", "CTA and hero headings keep wrap guardrails");
  sourceIncludes(sources.css, "text-wrap: pretty", "Long public copy keeps readable wrap guardrails");
}

function runNoPrematurePromiseChecks(sources) {
  const publicSurface = [
    sources.home,
    sources.homeSimulator,
    sources.login,
    sources.register,
    sources.forgotPassword,
    sources.privacyPolicy,
    sources.terms,
    sources.dashboardHome,
    sources.dashboardSecurity,
    sources.dashboardShell,
  ].join("\n");

  const forbidden = [
    "OpenAI",
    "ChatGPT",
    "AI Chat",
    "Answer Engine",
    "Public Launch",
    "Closed Beta",
    "paid plan",
    "production billing",
    "permanent memory",
    "guaranteed decision",
    "legal-grade",
  ];

  for (const phrase of forbidden) {
    sourceExcludes(publicSurface, phrase, `Rendered public source avoids premature promise: ${phrase}`);
  }
}

async function fetchRenderedHtml(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "user-agent": "levio-rendered-public-surface-regression" },
  });
  const html = await response.text();
  return { response, html };
}

function assertNoFatalRenderedMarkers(label, html) {
  assertCheck(
    `${label} rendered HTML has no fatal runtime markers`,
    !/Application error|Internal Server Error|Unhandled Runtime Error|NEXT_NOT_FOUND/i.test(html),
    "Fatal runtime marker found in rendered HTML.",
  );
}

function assertRenderedSize(label, html) {
  assertCheck(
    `${label} rendered HTML is not empty`,
    html.trim().length > 2_000,
    `Rendered HTML is unexpectedly small: ${html.length} bytes.`,
  );
  assertCheck(
    `${label} rendered HTML remains bounded`,
    html.length < 320_000,
    `Rendered HTML is unexpectedly large: ${html.length} bytes.`,
  );
}

async function runRuntimeRenderedChecks(baseUrl) {
  for (const page of publicPages) {
    const { response, html } = await fetchRenderedHtml(baseUrl, page.path);

    assertCheck(
      `${page.label} route returns expected status`,
      response.status === page.status,
      `Expected ${page.status}, received ${response.status}.`,
    );
    assertRenderedSize(page.label, html);
    assertNoFatalRenderedMarkers(page.label, html);

    for (const text of page.includes) {
      htmlIncludes(html, text, `${page.label} rendered HTML includes ${text}`);
    }
  }

  for (const redirect of protectedRedirects) {
    const { response, html } = await fetchRenderedHtml(baseUrl, redirect.path);
    const finalUrl = response.url.replace(baseUrl, "");

    assertCheck(
      `${redirect.label} redirects to prepared login boundary`,
      finalUrl.startsWith("/login?next=%2Fdashboard") &&
        (
          finalUrl.includes("reason=auth_config_missing") ||
          finalUrl.includes("reason=auth_runtime_disabled")
        ),
      `Expected protected dashboard redirect to login, received ${finalUrl}.`,
    );
    assertRenderedSize(`${redirect.label} redirect`, html);
    assertNoFatalRenderedMarkers(`${redirect.label} redirect`, html);
    htmlIncludes(html, "Acceso preparado", `${redirect.label} redirect renders prepared access copy`);
  }
}

function printSummary() {
  const failed = checks.filter((check) => !check.passed);
  const passed = checks.length - failed.length;

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
  }

  console.log(`\nRendered public surface regression gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  const sources = readSources();

  runRenderedSurfaceSourceChecks(sources);
  runResponsiveGuardrailChecks(sources);
  runNoPrematurePromiseChecks(sources);
  await withServer(runRuntimeRenderedChecks);
} catch (error) {
  fail("Rendered public surface regression gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
