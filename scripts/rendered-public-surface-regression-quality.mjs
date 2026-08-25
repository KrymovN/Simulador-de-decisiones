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
  authShell: join(rootDir, "components", "AuthShell.tsx"),
  authStateView: join(rootDir, "components", "auth", "AuthStateView.tsx"),
  publicSecondaryShell: join(rootDir, "components", "PublicSecondaryShell.tsx"),
  privacyPolicy: join(rootDir, "app", "privacy-policy", "page.tsx"),
  terms: join(rootDir, "app", "terms", "page.tsx"),
  dashboardLayout: join(rootDir, "app", "dashboard", "layout.tsx"),
  dashboardHome: join(rootDir, "app", "dashboard", "page.tsx"),
  dashboardSecurity: join(rootDir, "app", "dashboard", "security", "page.tsx"),
  dashboardShell: join(rootDir, "components", "DashboardShell.tsx"),
  css: join(rootDir, "app", "globals.css"),
  homeCss: join(rootDir, "app", "styles", "homepage.css"),
  publicSecondaryCss: join(rootDir, "app", "styles", "public-secondary.css"),
  packageJson: join(rootDir, "package.json"),
  simulateRoute: join(rootDir, "app", "api", "simulate", "route.ts"),
};

const publicPages = [
  {
    label: "Home",
    path: "/",
    status: 200,
    includes: [
      'class="site-shell minimal-home"',
      'id="hero-title"',
      "Decide antes",
      "Comenzar simulación",
      'id="decision-input"',
      "Preview público",
      "Empieza con una decisión real.",
    ],
  },
  {
    label: "Login",
    path: "/login",
    status: 200,
    includes: [
      'class="auth-shell"',
      "Inicia sesión en Levio.",
      "Iniciar sesión",
      "Crear cuenta",
      "¿Problemas para acceder?",
      'type="email"',
    ],
  },
  {
    label: "Register",
    path: "/register",
    status: 200,
    includes: [
      'class="auth-shell"',
      "Crea tu cuenta de Levio.",
      "Iniciar sesión",
      "Crear cuenta",
      "¿Problemas para acceder?",
      "política de privacidad",
      "términos de uso",
    ],
  },
  {
    label: "Forgot Password",
    path: "/forgot-password",
    status: 307,
    redirectTo: "/login",
    includes: [],
  },
  {
    label: "Privacy",
    path: "/privacy-policy",
    status: 200,
    includes: [
      'class="public-secondary public-secondary--legal"',
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
      'class="public-secondary public-secondary--legal"',
      "Términos de uso provisionales",
      "asesoramiento legal",
      "garantías legales finales",
    ],
  },
  {
    label: "Not Found",
    path: "/codex-public-secondary-not-found-smoke",
    status: 404,
    includes: [
      'class="public-secondary public-secondary--system"',
      "Esta ruta no existe.",
      "Volver al inicio",
      "Abrir simulador",
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
  sourceIncludes(sources.home, 'className="minimal-home__final-cta"', "Home keeps final CTA rendered");
  sourceIncludes(sources.homeSimulator, 'id="decision-input"', "HomeSimulator keeps stable textarea anchor");
  sourceIncludes(sources.homeSimulator, "Vista previa determinista", "HomeSimulator keeps the concise deterministic preview line");
  sourceIncludes(sources.homeSimulator, "Vista previa determinista · Respuestas de ejemplo", "HomeSimulator keeps AI-neutral deterministic preview copy");
  sourceExcludes(sources.homeSimulator, "conexión con IA real", "HomeSimulator removes unnecessary Real AI reminders");
  sourceIncludes(sources.dashboardLayout, "requireAuthenticatedDashboardSession", "Dashboard routes remain protected before authenticated content renders");
  sourceExcludes(sources.dashboardHome, "Vista preparada", "Dashboard landing removes the prepared scaffold");
  sourceExcludes(sources.dashboardHome, "mockSimulations", "Dashboard landing removes mock simulations");
  sourceExcludes(sources.dashboardHome, "personalArea", "Dashboard landing removes example personal-area data");
  sourceIncludes(sources.dashboardHome, "Aún no tienes simulaciones guardadas.", "Dashboard landing keeps the truthful empty state");
  sourceIncludes(sources.dashboardHome, "readSavedSimulationsHistorySurface({ limit: 3 })", "Dashboard landing uses persisted simulations");
  sourceIncludes(sources.dashboardSecurity, "cuando exista auth productivo", "Dashboard security placeholder source remains prepared");
  sourceExcludes(sources.dashboardShell, "Vista preparada del motor de simulación de decisiones.", "Dashboard shell removes prepared positioning");
  sourceIncludes(sources.dashboardShell, "account.email", "Dashboard shell keeps authenticated identity");
  sourceIncludes(sources.dashboardShell, "Cerrar sesión", "Dashboard shell keeps logout available");
  sourceIncludes(sources.simulateRoute, 'const SIMULATE_API_CONTRACT_VERSION = "simulate-api-v1-mock"', "Simulate route keeps approved contractVersion");
  sourceIncludes(sources.simulateRoute, "mockOnly: true", "Simulate route keeps mockOnly public flag");
  sourceIncludes(sources.simulateRoute, "safeRender: true", "Simulate route keeps safeRender public flag");
  sourceIncludes(sources.simulateRoute, "apiReady: true", "Simulate route keeps apiReady public flag");
  sourceIncludes(sources.login, "shouldCreateUser: false", "Login preserves passwordless OTP without implicit registration");
  sourceExcludes(sources.login, "auth-mode-switch", "Login removes the upper account mode switch");
  sourceIncludes(sources.login, 'className="auth-secondary-actions"', "Login keeps both secondary actions below the primary form");
  sourceIncludes(sources.login, "¿Problemas para acceder?", "Login exposes passwordless access help");
  sourceIncludes(sources.login, "Levio no utiliza contraseña", "Login help explains the passwordless mechanism");
  sourceIncludes(sources.login, "Inicio de sesión completado", "Login exposes the completed-in-another-tab title");
  sourceIncludes(
    sources.login,
    "Has iniciado sesión correctamente en otra pestaña. Ya puedes cerrar esta pestaña.",
    "Login exposes the completed-in-another-tab guidance",
  );
  sourceIncludes(sources.login, 'setLoginTabState("pending_email")', "Login records tab-local pending email state");
  sourceIncludes(
    sources.login,
    'setLoginTabState("completed_elsewhere")',
    "Login maps cross-tab authentication to an in-place completed state",
  );
  sourceIncludes(sources.register, "shouldCreateUser: true", "Registration preserves passwordless OTP account creation");
  sourceExcludes(sources.register, "auth-mode-switch", "Registration removes the upper account mode switch");
  sourceIncludes(sources.register, 'className="auth-secondary-actions"', "Registration keeps secondary actions below the primary form");
  sourceIncludes(sources.register, '<Link className="auth-secondary-action" href="/login">', "Registration keeps sign-in as secondary navigation");
  sourceIncludes(sources.register, "¿Problemas para acceder?", "Registration exposes passwordless access help");
  assertCheck(
    "Login and registration share one secondary-action row each",
    (sources.login.match(/className="auth-secondary-actions"/g) ?? []).length === 1 &&
      (sources.register.match(/className="auth-secondary-actions"/g) ?? []).length === 1,
    "Auth entry surfaces do not share the expected secondary-row structure.",
  );
  sourceIncludes(sources.authStateView, "if (!signedOutLabel)", "Anonymous auth state renders no error or status notice");
  sourceIncludes(sources.forgotPassword, 'redirect("/login")', "Unused password recovery scaffold redirects to login");
  assertCheck(
    "Rendered auth sources contain no prepared/demo scaffold terminology",
    !/(?:acceso preparado|preparar enlace de acceso|preparar acceso|recuperación preparada|arquitectura temporal|demostración)/i.test(
      [
        sources.login,
        sources.register,
        sources.forgotPassword,
        sources.authShell,
        sources.authStateView,
        sources.publicSecondaryShell,
        sources.homeSimulator,
        sources.privacyPolicy,
        sources.terms,
      ].join("\n"),
    ),
    "Prepared/demo terminology remains in an auth source.",
  );
}

function runResponsiveGuardrailChecks(sources) {
  sourceIncludes(sources.css, "overflow-x: hidden", "Global CSS blocks body-level horizontal overflow");
  sourceIncludes(sources.homeCss, "width: min(1180px, calc(100% - 48px))", "Home shell uses viewport-safe width");
  sourceIncludes(sources.css, "width: min(1240px, calc(100% - 48px))", "Auth shell uses viewport-safe width");
  sourceIncludes(sources.css, "@media (max-width: 860px)", "Tablet/mobile breakpoint remains present");
  sourceIncludes(sources.css, "@media (max-width: 560px)", "Small mobile breakpoint remains present");
  sourceIncludes(sources.homeCss, ".minimal-home .decision-console .simulator-composition", "Simulator input row has responsive CSS");
  sourceIncludes(sources.homeCss, ".minimal-home .decision-input-shell textarea", "Simulator textarea spacing is guarded");
  sourceIncludes(sources.homeCss, ".minimal-home .decision-console .voice-input-button", "Voice button has stable rendered placement");
  sourceMatches(
    sources.homeCss,
    /@media\s+\(max-width:\s*560px\)[\s\S]*?\.minimal-home\s+\.decision-input-shell\s+textarea[\s\S]*?min-height:\s*168px;/,
    "Mobile HomeSimulator textarea has enough rendered height for placeholder and voice control",
  );
  sourceIncludes(sources.homeCss, "text-wrap: balance", "CTA and hero headings keep wrap guardrails");
  sourceIncludes(sources.homeCss, "text-wrap: pretty", "Long public copy keeps readable wrap guardrails");
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
    if (page.redirectTo) {
      assertCheck(`${page.label} returns a redirect response`, response.status === 307, "Expected a 307 redirect.");
    } else {
      assertRenderedSize(page.label, html);
    }
    assertNoFatalRenderedMarkers(page.label, html);

    for (const text of page.includes) {
      htmlIncludes(html, text, `${page.label} rendered HTML includes ${text}`);
    }
    if (["Login", "Register", "Forgot Password"].includes(page.label)) {
      assertCheck(
        `${page.label} rendered HTML removes prepared/demo auth copy`,
        !/(?:Acceso preparado|Preparar enlace de acceso|Preparar acceso|Recuperación preparada|arquitectura temporal)/i.test(html),
        "Temporary auth scaffold copy remains in rendered HTML.",
      );
    }
  }

  for (const redirect of protectedRedirects) {
    const { response, html } = await fetchRenderedHtml(baseUrl, redirect.path);
    const finalUrl = response.url.replace(baseUrl, "");

    assertCheck(
      `${redirect.label} redirects to production login boundary`,
      finalUrl.startsWith("/login?next=%2Fdashboard") &&
        (
          finalUrl.includes("reason=auth_config_missing") ||
          finalUrl.includes("reason=auth_runtime_disabled")
        ),
      `Expected protected dashboard redirect to login, received ${finalUrl}.`,
    );
    assertRenderedSize(`${redirect.label} redirect`, html);
    assertNoFatalRenderedMarkers(`${redirect.label} redirect`, html);
    htmlIncludes(html, "Iniciar sesión", `${redirect.label} redirect renders production login copy`);
    htmlIncludes(html, "Crear cuenta", `${redirect.label} redirect keeps the registration mode visible`);
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
