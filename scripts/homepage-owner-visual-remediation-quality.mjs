import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const navigation = read("components", "HomepageNavigation.tsx");
const anchorLink = read("components", "HomepageAnchorLink.tsx");
const simulator = read("components", "HomeSimulator.tsx");
const css = read("app", "globals.css");
const simulateRoute = read("app", "api", "simulate", "route.ts");
const packageJson = read("package.json");
const clientUi = `${navigation}\n${anchorLink}\n${simulator}`;
const checks = [];

function check(name, condition, issue) {
  checks.push({ name, passed: Boolean(condition), issue });
}

function includes(source, value, name) {
  check(name, source.includes(value), `Missing invariant: ${value}`);
}

function excludes(source, value, name) {
  check(name, !source.includes(value), `Forbidden invariant remains: ${value}`);
}

includes(navigation, '{ label: "Inicio", href: "#inicio" }', "Header keeps canonical Inicio entry");
includes(navigation, '{ label: "Cómo funciona", href: "#como-funciona" }', "Header exposes Cómo funciona");
includes(navigation, '{ label: "Criterios", href: "#criterios" }', "Header exposes Criterios");
includes(navigation, '{ label: "Simulador", href: "#simulador" }', "Header exposes Simulador");
includes(navigation, 'href="/login"', "Header preserves canonical login route");
excludes(navigation, "Escenarios", "Header removes Escenarios entry");
excludes(navigation, "Riesgos", "Header removes Riesgos entry");
excludes(navigation, "Ventajas", "Header removes Ventajas entry");
excludes(navigation, "Espacio local", "Signed-out header removes duplicate Espacio local");
includes(navigation, 'aria-current={activeHref === item.href ? "page" : undefined}', "Header exposes active section semantics");
includes(navigation, "function restoreHistoryAnchor()", "Back and forward navigation restore the semantic anchor");
includes(navigation, 'target.scrollIntoView({ behavior: "auto", block: "start" })', "History restoration is deterministic and sticky-header safe");

includes(home, 'id="inicio"', "Homepage has canonical Inicio section ID");
includes(home, 'id="como-funciona"', "Homepage has canonical Cómo funciona section ID");
includes(home, 'id="criterios"', "Homepage has canonical Criterios section ID");
includes(home, 'id="simulador"', "Homepage has canonical Simulador section ID");
excludes(home, 'id="motor"', "Legacy motor anchor is removed");
excludes(home, 'id="producto"', "Legacy producto anchor is removed");
excludes(home, 'id="escenarios"', "Legacy escenarios anchor is removed");
includes(anchorLink, 'block: "start"', "Anchor scrolling uses semantic start alignment");
includes(css, "--homepage-anchor-offset", "Sticky-header-safe anchor token exists");
includes(css, "#como-funciona", "Cómo funciona receives anchor offset");
includes(css, "#criterios", "Criterios receives anchor offset");
includes(css, "#simulador", "Simulador receives anchor offset");

includes(css, "@keyframes homepageProcessReveal", "Process cards use bounded reveal keyframes");
includes(css, "animation-timeline: view(block) !important", "Process cards use viewport-relative animation timing");
includes(css, ".reference-process-card:nth-child(6)", "All six process cards have explicit sequence coverage");
includes(css, "entry 8% cover 26%", "Final process card completes in the early viewport range");
includes(css, "@media (prefers-reduced-motion: reduce)", "Reduced-motion boundary remains present");
includes(css, "animation: none !important", "Reduced motion shows process cards without reveal animation");
includes(css, "border-color: rgba(255, 211, 106, 0.62)", "Process and criteria cards have stronger gold separation");
includes(css, "font-size: clamp(1.22rem, 1.75vw, 1.64rem)", "Criteria title has section-level hierarchy");

includes(simulator, 'className="input-row simulator-composition"', "Simulator uses one integrated composition");
includes(simulator, 'className="simulator-action-cluster"', "Simulator actions form one bounded cluster");
includes(simulator, 'aria-label={isListening ? "Detener dictado por voz" : "Dictar situación"}', "Microphone keeps a meaningful accessible name");
excludes(simulator, '<span>{isListening ? "Detener" : "Dictar"}</span>', "Persistent DICTAR label is removed");
includes(simulator, 'aria-label="Simular decisión"', "Primary simulator control has an accessible name");
includes(simulator, 'className="primary-simulation-control"', "Primary simulator control has dedicated semantic styling");
includes(css, "border-radius: 999px", "Primary simulator control uses the approved compact pill silhouette");
includes(simulator, "Vista previa determinista · IA real aún no conectada", "Short deterministic preview disclosure remains");
includes(simulator, "MAX_SIMULATION_INPUT_LENGTH", "Simulator preserves the approved input limit");
includes(simulator, 'fetch("/api/simulate"', "Simulator preserves the public API endpoint");
includes(simulateRoute, "mockOnly: true", "Public simulator remains mockOnly");
check(
  "Client UI has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create|openai-synthetic-risk-adapter\.server/.test(clientUi),
  "OpenAI transport leaked into public client UI.",
);
includes(packageJson, '"quality:homepage-owner-visual-remediation"', "Dedicated homepage owner-remediation gate is registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage owner visual remediation gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
