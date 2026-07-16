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
  authShell: join(rootDir, "components", "AuthShell.tsx"),
  authStateView: join(rootDir, "components", "auth", "AuthStateView.tsx"),
  dashboardLayout: join(rootDir, "app", "dashboard", "layout.tsx"),
  dashboardShell: join(rootDir, "components", "DashboardShell.tsx"),
  dashboardHome: join(rootDir, "app", "dashboard", "page.tsx"),
  dashboardMemory: join(rootDir, "app", "dashboard", "memory", "page.tsx"),
  dashboardProfile: join(rootDir, "app", "dashboard", "profile", "page.tsx"),
  dashboardProfileAccountState: join(rootDir, "components", "dashboard", "DashboardProfileAccountState.tsx"),
  dashboardPrivacy: join(rootDir, "app", "dashboard", "privacy", "page.tsx"),
  dashboardSecurity: join(rootDir, "app", "dashboard", "security", "page.tsx"),
  privacyPanel: join(rootDir, "components", "PrivacyPanel.tsx"),
  securityPanel: join(rootDir, "components", "SecurityPanel.tsx"),
  personalArea: join(rootDir, "lib", "personalArea.ts"),
};

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

function read(path) {
  return readFileSync(path, "utf8");
}

function readSources() {
  return Object.fromEntries(
    Object.entries(sourcePaths).map(([key, path]) => [key, read(path)]),
  );
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

function randomPort() {
  return 5800 + Math.floor(Math.random() * 1000);
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
        headers: { "user-agent": "levio-public-site-trust-readiness-quality" },
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

function runPositioningSourceChecks(sources) {
  sourceIncludes(sources.home, "Levio analiza la situación, identifica la información relevante, compara escenarios, evalúa riesgos y organiza criterios de decisión.", "Home explains the simulation process without AI positioning");
  sourceIncludes(sources.home, "escenarios, riesgos y consecuencias", "Home keeps scenarios/risks/consequences line");
  sourceIncludes(sources.home, "trade-offs", "Home keeps tradeoffs positioning");
  sourceIncludes(sources.home, "Preview público con respuestas de ejemplo", "Home keeps demonstrative public state");
  sourceExcludes(sources.home, "asistente de IA", "Home avoids unnecessary AI-assistant positioning");
  sourceIncludes(sources.homeSimulator, "Vista previa determinista", "HomeSimulator keeps deterministic preview status");
  sourceIncludes(sources.homeSimulator, "Vista previa determinista · Respuestas de ejemplo", "HomeSimulator keeps an AI-neutral deterministic preview status");
  sourceIncludes(sources.homeSimulator, "MAX_SIMULATION_INPUT_LENGTH", "HomeSimulator keeps the bounded public input disclosure");
  sourceIncludes(sources.homeSimulator, "Simulación demostrativa con respuestas de ejemplo.", "Result copy keeps an AI-neutral demonstrative boundary");
  sourceExcludes(sources.homeSimulator, "conexión con IA real", "HomeSimulator removes unnecessary Real AI reminders");
  sourceIncludes(sources.homeSimulator, "sin presentarse como predicción lista para producción", "HomeSimulator avoids production-readiness promise");
}

function runAuthReadinessSourceChecks(sources) {
  sourceIncludes(sources.authShell, "arquitectura temporal de acceso para demostración", "Auth shell discloses temporary access architecture");
  sourceMatches(
    sources.authShell,
    /antes\s+de\s+procesar\s+datos\s+personales\s+reales/,
    "Auth shell blocks personal-data production promise",
  );
  sourceIncludes(sources.authStateView, "Acceso configurado", "Auth status copy avoids account wording");
  sourceIncludes(sources.authStateView, "Acceso no configurado", "Signed-out status copy avoids account wording");
  sourceIncludes(sources.login, "Acceso preparado", "Login is positioned as prepared access");
  sourceIncludes(sources.login, "condicionado a la configuración del sistema de acceso", "Login discloses access-system condition");
  sourceIncludes(sources.login, "Preparar enlace de acceso", "Login CTA avoids production account promise");
  sourceIncludes(sources.login, "Preparar acceso", "Login links to prepared access instead of account creation");
  sourceIncludes(sources.register, "Acceso preparado", "Register is positioned as prepared access");
  sourceIncludes(sources.register, "cuando estén disponibles", "Register copy defers future controls");
  sourceIncludes(sources.register, "Registro por correo condicionado a la configuración del sistema de acceso.", "Register discloses access-system condition");
  sourceIncludes(sources.register, "Ya tengo acceso preparado", "Register avoids existing-account promise");
  sourceIncludes(sources.forgotPassword, "no se envían correos reales", "Recovery page discloses no real emails");
  sourceIncludes(sources.forgotPassword, "La recuperación productiva todavía no está activada", "Recovery action discloses deferred production recovery");
}

function runLegalReadinessSourceChecks(sources) {
  sourceIncludes(sources.privacyPolicy, "política legal final", "Privacy page discloses non-final legal status");
  sourceIncludes(sources.privacyPolicy, "respuestas de ejemplo", "Privacy page discloses example simulator state");
  sourceIncludes(sources.privacyPolicy, "se almacenan localmente en este navegador", "Privacy page discloses local-only saved simulations");
  sourceIncludes(sources.privacyPolicy, "Antes de procesar datos personales reales en producción", "Privacy page defers production personal-data processing");
  sourceIncludes(sources.terms, "borrador provisional", "Terms page discloses provisional status");
  sourceMatches(
    sources.terms,
    /No\s+constituyen\s+asesoramiento\s+legal,\s+financiero,\s+médico/,
    "Terms page blocks legal/financial/medical advice promise",
  );
  sourceIncludes(sources.terms, "no debe utilizarse todavía para introducir datos sensibles", "Terms page blocks sensitive-data readiness");
  sourceIncludes(sources.terms, "garantías legales finales", "Terms page defers legal-grade guarantees");
}

function runDashboardPlaceholderSourceChecks(sources) {
  sourceIncludes(sources.dashboardLayout, "requireAuthenticatedDashboardSession", "Dashboard routes remain behind auth guard");
  sourceIncludes(sources.dashboardShell, "Vista preparada del motor de simulación de decisiones.", "Dashboard shell uses prepared-view positioning");
  sourceIncludes(sources.dashboardShell, "account.accountState", "Dashboard shell uses validated account runtime state");
  sourceIncludes(sources.dashboardShell, "Privacidad", "Dashboard privacy badge remains present");
  sourceIncludes(sources.dashboardShell, "Preparada", "Dashboard privacy badge avoids production-grade promise");
  sourceIncludes(sources.dashboardHome, "Vista preparada", "Dashboard home avoids personal-area promise");
  sourceIncludes(sources.dashboardHome, "decisiones de ejemplo", "Dashboard home discloses example decisions");
  sourceIncludes(sources.dashboardHome, "cuando exista backend productivo", "Dashboard home defers memory backend");
  sourceIncludes(sources.dashboardMemory, "La memoria no es un chat ni una conversación guardada.", "Memory page avoids chat/history positioning");
  sourceIncludes(sources.dashboardMemory, "capa futura de contexto estratégico", "Memory page positions memory as future only");
  sourceIncludes(sources.dashboardMemory, "cuando exista backend y trazabilidad real", "Memory cleanup defers real backend");
  sourceIncludes(sources.dashboardProfileAccountState, "Datos preparados de acceso", "Profile avoids account data promise");
  sourceExcludes(sources.dashboardProfileAccountState, "Campo de contraseña futura", "Profile does not collect an unused future password");
  sourceIncludes(sources.dashboardProfileAccountState, "modo de solo lectura", "Profile editing is honestly unavailable");
  sourceIncludes(sources.dashboardPrivacy, "etapas productivas", "Privacy dashboard defers production controls");
  sourceIncludes(sources.dashboardSecurity, "cuando exista auth productivo", "Security dashboard defers production auth");
  sourceIncludes(sources.dashboardSecurity, "Contraseña de ejemplo", "Security password form is example-only");
  sourceIncludes(sources.securityPanel, "Sesión actual validada", "Security panel uses real account session state");
  sourceIncludes(sources.securityPanel, "gestión avanzada siguen preparados", "Security panel keeps advanced controls deferred");
  assertCheck(
    "Privacy panel exposes bounded deletion planning without account deletion",
    sources.privacyPanel.includes("/dashboard/privacy/deletion") &&
      sources.privacyPanel.includes("sin ejecutar la eliminación"),
    "Missing the canonical Stage 7 deletion-plan boundary.",
  );
  sourceIncludes(sources.personalArea, "futura persistencia aprobada", "Personal area data defers persistence");
}

function runPrematurePromiseSourceChecks(sources) {
  const publicSurface = [
    sources.home,
    sources.homeSimulator,
    sources.login,
    sources.register,
    sources.forgotPassword,
    sources.privacyPolicy,
    sources.terms,
    sources.authShell,
    sources.authStateView,
    sources.dashboardShell,
    sources.dashboardHome,
    sources.dashboardMemory,
    sources.dashboardProfile,
    sources.dashboardPrivacy,
    sources.dashboardSecurity,
    sources.privacyPanel,
    sources.securityPanel,
    sources.personalArea,
  ].join("\n");

  const forbiddenExactPhrases = [
    "Crear cuenta",
    "Ya tengo cuenta",
    "Datos preparados de cuenta",
    "Área personal",
    "Nivel de privacidad",
    "Protección de cuenta",
    "Estado de protección de cuenta",
    "Contraseña actual",
    "Recupera tu entrada al espacio estratégico",
    "runtime de IA real está conectado",
    "OpenAI",
    "ChatGPT",
    "AI Chat",
    "Answer Engine",
    "Generic Assistant",
    "Stripe",
    "checkout",
    "plan de pago",
    "suscripción activa",
    "memoria permanente",
    "beta cerrada disponible",
    "lanzamiento público disponible",
    "decisión correcta garantizada",
  ];

  for (const phrase of forbiddenExactPhrases) {
    sourceExcludes(publicSurface, phrase, `Public copy avoids premature promise: ${phrase}`);
  }

  sourceMatches(
    sources.terms,
    /No\s+constituyen\s+asesoramiento\s+legal,\s+financiero,\s+médico/,
    "Terms explicitly block high-stakes advice positioning",
  );
  sourceMatches(
    sources.home,
    /Levio organiza alternativas y muestra rutas demostrativas/,
    "Home positions output as demonstrative routes",
  );
}

async function fetchHtml(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "user-agent": "levio-public-site-trust-readiness-quality" },
  });
  const html = await response.text();

  return { response, html };
}

async function runRuntimePublicPageChecks(baseUrl) {
  const cases = [
    {
      path: "/",
      includes: [
        "Preview público con respuestas de ejemplo",
        "Vista previa determinista",
        "Respuestas de ejemplo",
        "Levio analiza la situación",
      ],
    },
    {
      path: "/login",
      includes: [
        "Acceso preparado",
        "Preparar enlace de acceso",
        "Preparar acceso",
      ],
    },
    {
      path: "/register",
      includes: [
        "Acceso preparado",
        "cuando estén disponibles",
        "Ya tengo acceso preparado",
      ],
    },
    {
      path: "/forgot-password",
      includes: [
        "Recuperación preparada",
        "En este MVP no se envían correos reales.",
        "La recuperación de contraseña no está activada para esta fase.",
      ],
    },
    {
      path: "/privacy-policy",
      includes: [
        "Política de privacidad provisional.",
        "no es una política legal final",
        "se almacenan localmente en este navegador",
      ],
    },
    {
      path: "/terms",
      includes: [
        "Términos de uso provisionales.",
        "No constituyen asesoramiento legal, financiero, médico",
        "no debe utilizarse todavía",
      ],
    },
  ];

  for (const pageCase of cases) {
    try {
      const { response, html } = await fetchHtml(baseUrl, pageCase.path);

      assert(response.status === 200, `${pageCase.path} returned ${response.status}.`);
      assert(!/Application error|Internal Server Error|Unhandled Runtime Error/i.test(html), `${pageCase.path} contains fatal error marker.`);

      for (const text of pageCase.includes) {
        assert(html.includes(text), `${pageCase.path} missing runtime copy: ${text}`);
      }

      assert(!html.includes("Crear cuenta"), `${pageCase.path} still promises account creation.`);
      assert(!html.includes("OpenAI"), `${pageCase.path} mentions OpenAI.`);
      assert(!html.includes("ChatGPT"), `${pageCase.path} mentions ChatGPT.`);
      assert(!html.includes("Stripe"), `${pageCase.path} mentions Stripe.`);
      pass(`Runtime public page trust copy: ${pageCase.path}`);
    } catch (error) {
      fail(`Runtime public page trust copy: ${pageCase.path}`, error instanceof Error ? error.message : String(error));
    }
  }

  try {
    const response = await fetch(`${baseUrl}/dashboard`, {
      headers: { "user-agent": "levio-public-site-trust-readiness-quality" },
      redirect: "manual",
    });
    const location = response.headers.get("location") ?? "";

    assert(response.status >= 300 && response.status < 400, `Expected dashboard redirect, received ${response.status}.`);
    assert(location.includes("/login"), `Dashboard redirect must point to login, received ${location}.`);
    pass("Runtime dashboard placeholder stays behind auth redirect");
  } catch (error) {
    fail("Runtime dashboard placeholder stays behind auth redirect", error instanceof Error ? error.message : String(error));
  }
}

function printSummary() {
  const failed = checks.filter((check) => !check.passed);
  const passed = checks.length - failed.length;

  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`${icon} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
  }

  console.log(`\nPublic site trust/readiness quality gate: ${passed}/${checks.length} passed.`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

try {
  const sources = readSources();

  runPositioningSourceChecks(sources);
  runAuthReadinessSourceChecks(sources);
  runLegalReadinessSourceChecks(sources);
  runDashboardPlaceholderSourceChecks(sources);
  runPrematurePromiseSourceChecks(sources);
  await withServer(runRuntimePublicPageChecks);
} catch (error) {
  fail("Public site trust/readiness quality gate execution", error instanceof Error ? error.message : String(error));
} finally {
  printSummary();
}
