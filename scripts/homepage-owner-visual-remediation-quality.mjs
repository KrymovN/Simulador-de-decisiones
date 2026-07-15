import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const css = read("app", "styles", "homepage.css");
const layout = read("app", "layout.tsx");
const navigation = read("components", "HomepageNavigation.tsx");
const anchorLink = read("components", "HomepageAnchorLink.tsx");
const simulator = read("components", "HomeSimulator.tsx");
const simulateRoute = read("app", "api", "simulate", "route.ts");
const packageJson = read("package.json");
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

function blockBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  if (startIndex < 0 || endIndex < 0) {
    return "";
  }

  return source.slice(startIndex, endIndex);
}

const processBlock = blockBetween(home, 'id="como-funciona"', 'id="criterios"');
const capabilityBlock = blockBetween(home, 'id="criterios"', 'className="minimal-home__final-cta"');
const criteriaBlock = blockBetween(simulator, 'className="simulator-criteria"', 'className="simulator-action-cluster"');
const publicClientSurface = `${home}\n${navigation}\n${anchorLink}\n${simulator}`;
const forbiddenVisualTechnology = /<svg|<canvas|WebGL|three(?:\.js)?|particle|DecisionSingularity|hero-approved|hero-approved-network-bg/i;
const cssRulesUsingBrand = css
  .split("}")
  .filter((rule) => rule.includes("var(--home-brand"));

includes(layout, "import './styles/homepage.css';", "Scoped homepage stylesheet is mounted after shared styles");
includes(home, 'className="site-shell minimal-home"', "Homepage owns one isolated visual root");
includes(home, 'className="minimal-home__hero"', "Hero uses the bounded two-column composition");
includes(home, 'className="minimal-home__hero-copy"', "Hero keeps a dedicated copy column");
includes(home, 'className="minimal-home__simulator" id="simulador"', "HomeSimulator occupies the real hero product column");
includes(home, "<HomeSimulator />", "Existing HomeSimulator remains mounted once");
check(
  "HomeSimulator is mounted exactly once",
  (home.match(/<HomeSimulator\s*\/>/g) ?? []).length === 1,
  "Expected one real public simulator surface.",
);
excludes(home, 'from "next/image"', "Homepage no longer imports an image component");
excludes(home, "HomepageMotionController", "Heavy grouped motion controller is removed from the homepage");
excludes(home, "MotionLetters", "Per-letter animation markup is removed");
check(
  "Homepage has no cosmic or heavy visual technology",
  !forbiddenVisualTechnology.test(home),
  "Hero image, SVG, Canvas, WebGL, particle, or singularity markup remains.",
);
check(
  "Retired hero raster asset is deleted",
  !existsSync(join(rootDir, "public", "hero-approved-network-bg.png")),
  "The retired cosmic hero raster remains in public/.",
);
check(
  "Retired grouped motion controller is deleted",
  !existsSync(join(rootDir, "components", "HomepageMotionController.tsx")),
  "The unused homepage motion controller remains.",
);

includes(navigation, '{ label: "Inicio", href: "#inicio" }', "Header keeps canonical Inicio route");
includes(navigation, '{ label: "Cómo funciona", href: "#como-funciona" }', "Header keeps Cómo funciona route");
includes(navigation, '{ label: "Criterios", href: "#criterios" }', "Header keeps Criterios route");
includes(navigation, '{ label: "Simulador", href: "#simulador" }', "Header keeps Simulador route");
includes(navigation, 'href="/login"', "Header keeps the real login route");
includes(css, ".minimal-home .reference-nav .nav-active::after", "Active navigation has a scoped neutral underline");
includes(css, "background: var(--home-muted-strong) !important;", "Active navigation underline is neutral");
includes(css, ".minimal-home .reference-nav .nav-cta", "Login remains a bordered monochrome action");

includes(home, "Decide antes", "Canonical hero heading remains");
includes(home, "Comenzar simulación", "The approved primary CTA remains");
includes(home, "Preview público con respuestas de ejemplo", "Truthful preview signal remains");
includes(home, "Un sistema de simulación de decisiones, no un asistente de IA.", "Approved product positioning remains");
excludes(home, "usuarios", "Homepage does not invent user statistics");
excludes(home, "simulaciones realizadas", "Homepage does not invent simulation counts");

includes(processBlock, "processSteps.map", "Canonical process sequence remains data-driven");
check(
  "Canonical six-step process remains intact",
  (home.match(/title: "/g) ?? []).length >= 10 && processBlock.includes('padStart(2, "0")'),
  "Expected the six repository-approved process steps with visible sequence numbers.",
);
check(
  "Process cards are text-only",
  !/<svg|<img|<Image|icon|orbit|connector/i.test(processBlock),
  "Process section contains non-text decorative content.",
);
includes(capabilityBlock, "capabilities.map", "Capabilities keep an even data-driven grid");
check(
  "Capability cards are text-only",
  !/<svg|<img|<Image|icon|orbit/i.test(capabilityBlock),
  "Capability section contains non-text decorative content.",
);
check(
  "Criteria pills are text-only",
  !/<svg|<img|<Image|icon/i.test(criteriaBlock) && ["Resultado", "Riesgo", "Tiempo", "Recursos"].every((label) => criteriaBlock.includes(label)),
  "Criteria pills must contain only the four approved text labels.",
);

includes(css, "--home-bg: #050505", "Palette is centralized on a near-black background token");
includes(css, "--home-text: #f4f4f4", "Palette is centralized on a white text token");
includes(css, "--home-line: #292929", "Neutral border token is centralized");
includes(css, "--home-radius-sm: 6px", "Card radius is tokenized");
includes(css, "--home-motion-duration: 180ms", "Motion duration is tokenized");
check(
  "Gold token usage is restricted to brand and primary CTA rules",
  cssRulesUsingBrand.length > 0 && cssRulesUsingBrand.every((rule) => /brand-lockup|brand-name|levio-mark|minimal-home__primary-cta|--home-brand/.test(rule)),
  "A gold token is used outside the brand mark/name or primary CTA.",
);
check(
  "Gold literals exist only in the palette declaration",
  (css.match(/#e4ad35|#f0c052/g) ?? []).length === 2,
  "Gold was hardcoded outside the centralized palette.",
);
check(
  "Only the primary CTA uses a decorative gradient",
  (css.match(/linear-gradient\(/g) ?? []).length === 1 && css.includes(".minimal-home .minimal-home__primary-cta"),
  "A gradient remains outside the single primary CTA.",
);
includes(css, ".minimal-home__step-number", "Step numbers have a dedicated neutral style");
includes(css, "color: var(--home-muted-strong);", "Step and supporting hierarchy use neutral color");
includes(css, ".minimal-home__process-card", "Process cards use scoped minimal surfaces");
includes(css, ".minimal-home__capability-card", "Capability cards use scoped minimal surfaces");
excludes(css, "radial-gradient", "Homepage visual layer has no decorative glow gradients");
excludes(css, "animation-iteration-count", "Homepage has no infinite animation loop");

includes(simulator, "MAX_SIMULATION_INPUT_LENGTH = 1200", "HomeSimulator keeps the 1200-character limit");
includes(simulator, 'fetch("/api/simulate"', "HomeSimulator keeps the approved public API route");
includes(simulator, 'body: JSON.stringify({ input: situation, lang: "es" })', "HomeSimulator request payload remains bounded");
includes(simulator, "isSimulateApiResponse(payload)", "HomeSimulator validates the public envelope");
includes(simulator, "safeRender !== true", "HomeSimulator preserves safeRender validation");
includes(simulator, "mockOnly !== true", "HomeSimulator preserves mockOnly validation");
includes(simulator, "apiReady !== true", "HomeSimulator preserves apiReady validation");
includes(simulator, 'id="decision-input"', "HomeSimulator keeps the stable textarea ID");
includes(simulator, 'aria-label="Simular decisión"', "HomeSimulator keeps the submit action accessible name");
includes(simulator, 'aria-label={isListening ? "Detener dictado por voz" : "Dictar situación"}', "Voice action keeps its accessible name");
includes(simulator, 'aria-live={errorState ? "assertive" : "polite"}', "Safe status announcements remain");
includes(simulateRoute, "mockOnly: true", "Public runtime remains deterministic and mockOnly");
includes(css, ".minimal-home .decision-console .primary-simulation-control", "Simulator submit control has a scoped monochrome rule");
includes(css, "background: var(--home-surface-raised);", "Simulator action stays monochrome");

includes(css, "grid-template-columns: minmax(0, 0.82fr) minmax(460px, 1.18fr)", "Desktop hero uses a bounded copy/product grid");
includes(css, "@media (max-width: 860px)", "Tablet/mobile layout breakpoint exists");
includes(css, "grid-template-columns: 1fr;", "Mobile hero resolves to a single-column flow");
includes(css, "-webkit-overflow-scrolling: touch", "Scrollable mobile navigation is Safari-safe");
includes(css, "min-height: 168px", "Phone textarea keeps a readable Safari-safe height");
includes(css, "overflow: clip", "Homepage contains decorative/layout overflow without 100vw dependence");
excludes(css, "100vw", "Homepage avoids Safari scrollbar-width overflow traps");
includes(css, "@media (prefers-reduced-motion: reduce)", "Reduced-motion boundary is explicit");
includes(css, "animation: none !important", "Reduced motion removes reveal animations");
includes(css, "transition-duration: 0.01ms !important", "Reduced motion collapses transitions");
includes(css, "--home-assembly-duration: 620ms", "Bounded product-grade assembly timing remains");

check(
  "Public client surface has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create|openai-synthetic-risk-adapter\.server/.test(publicClientSurface),
  "OpenAI transport leaked into public homepage code.",
);
includes(packageJson, '"quality:homepage-owner-visual-remediation"', "Dedicated homepage simplification gate remains registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage bounded visual simplification gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
