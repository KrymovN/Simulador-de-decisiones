import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const uiRoots = [join(rootDir, "app"), join(rootDir, "components")];
const checks = [];

function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function assertCheck(name, condition, message) {
  checks.push({ name, passed: Boolean(condition), message: condition ? undefined : message });
}

function sourceIncludes(source, text, name) {
  assertCheck(name, source.includes(text), `Missing source invariant: ${text}`);
}

function sourceExcludes(source, text, name) {
  assertCheck(name, !source.includes(text), `Forbidden source pattern present: ${text}`);
}

function routeExists(pathname) {
  if (pathname === "/") {
    return existsSync(join(rootDir, "app", "page.tsx"));
  }

  const segments = pathname.split("/").filter(Boolean);
  const routeDir = join(rootDir, "app", ...segments);
  return existsSync(join(routeDir, "page.tsx")) || existsSync(join(routeDir, "route.ts"));
}

const sourceFiles = uiRoots.flatMap(collectSourceFiles);
const sources = new Map(sourceFiles.map((path) => [relative(rootDir, path), read(path)]));
const allUiSource = Array.from(sources.values()).join("\n");
const home = sources.get("app/page.tsx") ?? "";
const simulator = sources.get("components/HomeSimulator.tsx") ?? "";
const unavailable = sources.get("components/UnavailableAction.tsx") ?? "";
const dashboardHome = sources.get("app/dashboard/page.tsx") ?? "";
const decisions = sources.get("app/dashboard/decisions/page.tsx") ?? "";
const memory = sources.get("app/dashboard/memory/page.tsx") ?? "";
const profile = sources.get("components/dashboard/DashboardProfileAccountState.tsx") ?? "";
const security = sources.get("app/dashboard/security/page.tsx") ?? "";
const notFound = sources.get("app/not-found.tsx") ?? "";
const simulateRoute = sources.get("app/api/simulate/route.ts") ?? "";

assertCheck(
  "No empty hash links",
  !/href\s*=\s*["']#["']/.test(allUiSource),
  "A visible control uses href=\"#\".",
);
assertCheck(
  "No empty href values",
  !/href\s*=\s*["']\s*["']/.test(allUiSource),
  "A visible control uses an empty href.",
);
sourceExcludes(allUiSource, "javascript:void(0)", "No javascript:void navigation");
assertCheck(
  "No known empty click handlers",
  !/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(allUiSource),
  "A visible control has an empty click handler.",
);
assertCheck(
  "No non-semantic clickable div/span controls",
  !/<(?:div|span)[^>]*onClick\s*=/.test(allUiSource),
  "A div or span is used as a click control.",
);

assertCheck(
  "Legacy mock feedback control removed",
  !existsSync(join(rootDir, "components", "MockFeedbackButton.tsx")) && !allUiSource.includes("MockFeedbackButton"),
  "The misleading MockFeedbackButton surface is still reachable.",
);
sourceIncludes(unavailable, "disabled type=\"button\"", "Unavailable actions use native disabled semantics");
sourceIncludes(unavailable, "<small>{explanation}</small>", "Unavailable actions keep a persistent explanation");
assertCheck(
  "Every unavailable action includes an explanation",
  Array.from(sources.values()).every((source) => {
    const uses = source.match(/<UnavailableAction\b/g)?.length ?? 0;
    const explanations = source.match(/\bexplanation=/g)?.length ?? 0;
    return uses === explanations;
  }),
  "An UnavailableAction is missing its visible explanation.",
);

sourceExcludes(dashboardHome, "`/dashboard/simulations/${featuredSimulation.id}`", "Featured demo card does not target persisted detail route");
sourceExcludes(dashboardHome, "`/dashboard/simulations/${simulation.id}`", "Demo list does not target persisted detail route");
sourceExcludes(decisions, "`/dashboard/simulations/${decision.linkedSimulationId}`", "Prepared decisions do not target persisted detail route");
sourceIncludes(dashboardHome, "Esta tarjeta es demostrativa y no corresponde a una simulación guardada.", "Featured demo card explains unavailable detail");
sourceIncludes(decisions, "Este ejemplo no corresponde a una simulación guardada de la cuenta.", "Prepared decision explains unavailable detail");

sourceIncludes(profile, "disabled type=\"text\"", "Prepared profile fields are not silently editable");
sourceIncludes(profile, "El perfil se muestra en modo de solo lectura", "Profile explains read-only state");
sourceExcludes(profile, "Campo de contraseña futura", "Prepared profile no longer collects an unused password");
sourceIncludes(security, "input disabled", "Unavailable security fields reject input");
sourceIncludes(security, "Cambio no disponible", "Password action is honestly unavailable");
sourceIncludes(security, "2FA no disponible", "2FA action is honestly unavailable");
sourceIncludes(memory, 'checked={scope.active} disabled type="checkbox"', "Memory examples use non-interactive checkbox semantics");

assertCheck(
  "Custom 404 recovery surface exists",
  existsSync(join(rootDir, "app", "not-found.tsx")),
  "app/not-found.tsx is missing.",
);
sourceIncludes(notFound, "Esta ruta no existe.", "404 explains missing route");
sourceIncludes(notFound, 'href="/"', "404 links back to home");
sourceIncludes(notFound, 'href="/#decision-input"', "404 links to simulator");

sourceIncludes(simulator, 'key={`${scenario.label}-${scenario.title}`}', "Scenario rendering uses stable unique composite keys");
sourceIncludes(simulator, 'aria-label={isListening ? "Detener dictado por voz" : "Iniciar dictado por voz"}', "Voice icon control has an accessible name");
sourceIncludes(simulator, 'fetch("/api/simulate"', "Simulator keeps its approved public endpoint");
sourceIncludes(simulateRoute, 'const SIMULATE_API_CONTRACT_VERSION = "simulate-api-v1-mock"', "Simulator contract remains mock-compatible");
sourceIncludes(simulateRoute, "mockOnly: true", "Simulator remains mockOnly");

sourceIncludes(home, 'href: "/privacy-policy"', "Public footer keeps privacy link");
sourceIncludes(home, 'href: "/terms"', "Public footer keeps terms link");
sourceIncludes(home, 'href: "mailto:hola@levio.es"', "Public footer keeps contact link");
sourceIncludes(home, 'href="/login"', "Public auth CTA keeps login target");
sourceIncludes(home, 'href: "/dashboard"', "Public workspace CTA keeps protected dashboard target");

const literalHrefs = Array.from(allUiSource.matchAll(/href\s*=\s*["']([^"']+)["']/g), (match) => match[1]);
const internalRoutes = Array.from(new Set(literalHrefs.filter((href) => href.startsWith("/"))));
const missingRoutes = internalRoutes.filter((href) => {
  const pathname = href.split(/[?#]/, 1)[0] || "/";
  return !routeExists(pathname);
});
assertCheck(
  "Literal internal href targets exist",
  missingRoutes.length === 0,
  `Missing route target(s): ${missingRoutes.join(", ")}`,
);

const homeAnchors = Array.from(new Set(literalHrefs.filter((href) => href.startsWith("#"))));
const homeAnchorTargets = `${home}\n${simulator}`;
const missingAnchors = homeAnchors.filter((href) => !homeAnchorTargets.includes(`id="${href.slice(1)}"`));
assertCheck(
  "Homepage anchor targets exist",
  missingAnchors.length === 0,
  `Missing homepage anchor target(s): ${missingAnchors.join(", ")}`,
);

const clientReachableProviderLeak = Array.from(sources.entries()).filter(([path, source]) => {
  const clientReachable = path.startsWith("components/") || source.includes('"use client"');
  return clientReachable && (/from\s+["']openai["']/.test(source) || source.includes("openai-synthetic-risk-adapter.server"));
});
assertCheck(
  "No OpenAI SDK or live adapter in client-reachable UI",
  clientReachableProviderLeak.length === 0,
  `Provider import leaked into: ${clientReachableProviderLeak.map(([path]) => path).join(", ")}`,
);
assertCheck(
  "No OpenAI network endpoint in product UI",
  !/api\.openai\.com|responses\.create/.test(allUiSource),
  "A product UI module contains a live OpenAI call.",
);

const failed = checks.filter((check) => !check.passed);
for (const check of checks) {
  console.log(`${check.passed ? "PASS" : "FAIL"} ${check.name}${check.message ? ` - ${check.message}` : ""}`);
}
console.log(`\nPublic interaction hardening gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
