import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const css = read("app", "styles", "homepage.css");
const controller = read("components", "HomepageAssemblyController.tsx");
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

const footerBlock = home.slice(home.indexOf('<footer className="minimal-home__footer"'));
const clientSurface = `${home}\n${controller}\n${simulator}`;

includes(home, "<HomepageAssemblyController />", "Homepage mounts the assembly controller once");
check(
  "Assembly controller is mounted exactly once",
  (home.match(/<HomepageAssemblyController\s*\/>/g) ?? []).length === 1,
  "Expected one homepage assembly controller mount.",
);
includes(controller, 'const completedGroups = new WeakSet<HTMLElement>()', "Controller owns a one-time completion registry");
includes(controller, 'setAssemblyState(group, "assembled")', "Controller exposes the bounded transition state");
includes(controller, 'setAssemblyState(group, "settled")', "Controller exposes the stable final state");
includes(controller, "observer?.unobserve(group)", "Completed groups leave IntersectionObserver");
includes(controller, 'window.addEventListener("scroll", handleScroll, { passive: true })', "First-scroll trigger is passive");
includes(controller, "window.setTimeout(() =>", "Scroll work is batched without relying on background animation frames");
includes(controller, "currentScrollY > previousScrollY", "Hero responds only to the first downward scroll");
includes(controller, "else assemble(group)", "Scroll geometry deterministically advances visible groups");
includes(controller, 'matchMedia("(prefers-reduced-motion: reduce)")', "Reduced-motion preference is honored in JavaScript");
includes(controller, "groups.forEach((group) => settle(group))", "Reduced motion resolves directly to final state");
excludes(controller, 'setAssemblyState(group, "pending")\n        previousScrollY', "Scroll-up cannot restore pending state");

includes(home, 'data-home-assembly-group="hero-title"', "Hero title owns a first-scroll assembly group");
includes(home, 'data-home-assembly-trigger="first-scroll"', "Hero assembly has an explicit first-scroll trigger");
includes(home, "Preview público con respuestas de ejemplo", "First truthful preview phrase remains");
includes(home, "Escenarios comparables", "Second truthful preview phrase remains");
includes(home, "Riesgo y consecuencia", "Third truthful preview phrase remains");
includes(home, 'data-home-assembly-group="process-heading"', "Process heading assembles from one side");
includes(home, 'data-home-assembly-group="capabilities-heading"', "Capability heading assembles from the opposite side");
includes(home, 'data-home-assembly-group="process-cards"', "Six process cards share one staged group");
includes(home, "data-home-assembly-order={processSteps.length - index - 1}", "Process-card stagger runs from the rightmost card to the left");
includes(home, 'data-home-assembly-group="capability-cards"', "Capability cards have a moderate entry group");
includes(home, 'data-home-assembly-group="final-cta"', "Final CTA has a bounded entry group");
includes(home, "finalHeadlineClusters.map", "Final headline uses three readable clusters");
excludes(home, "MotionLetters", "Final headline avoids per-letter runtime markup");

includes(css, "--home-assembly-duration: 620ms", "Assembly duration is bounded and centralized");
includes(css, "--home-assembly-stagger: 82ms", "Assembly stagger is bounded and centralized");
includes(css, 'data-home-assembly-group="hero-title"', "Hero title keeps its upward final offset");
includes(css, 'data-home-assembly-group="preview-signals"', "Preview phrases have dedicated restrained directions");
includes(css, 'data-home-assembly-group="process-cards"', "Process cards enter right-to-left sequentially");
includes(css, "transition-delay: calc(var(--home-assembly-order", "Card sequence uses a bounded stagger");
includes(css, "@media (prefers-reduced-motion: reduce)", "Reduced-motion CSS boundary exists");
includes(css, "transform: none !important", "Reduced motion renders stable final geometry");
excludes(css, "animation-timeline", "Homepage does not depend on scroll timelines");
excludes(css, "infinite", "Homepage assembly has no infinite loop");

includes(css, ".minimal-home .decision-console .voice-input-button", "Voice control remains scoped to the homepage simulator");
includes(css, "border-radius: 50%", "Voice control is circular instead of square");
includes(css, ".minimal-home .decision-console .primary-simulation-control", "Simulation action has a dedicated clean rule");
includes(css, "border-radius: 999px", "Simulator actions and text criteria use gentle pill geometry");
includes(simulator, "MAX_SIMULATION_INPUT_LENGTH = 1200", "Simulator keeps the 1200-character boundary");
includes(simulator, "safeRender !== true", "Simulator keeps safeRender validation");
includes(simulator, "mockOnly !== true", "Simulator keeps mockOnly validation");
includes(simulator, "apiReady !== true", "Simulator keeps apiReady validation");
includes(simulateRoute, "mockOnly: true", "Public route remains deterministic and mock-only");

includes(footerBlock, "Sistema de simulación de decisiones", "Footer uses the approved simulation-system wording");
check("Footer copy does not use motor", !/motor/i.test(footerBlock), "Footer still uses the forbidden word motor.");
check(
  "Public assembly client has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create|openai-synthetic-risk-adapter\.server/.test(clientSurface),
  "OpenAI transport leaked into the public homepage client.",
);
includes(packageJson, '"quality:homepage-one-time-assembly-refinement"', "Dedicated refinement gate is registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage one-time assembly refinement gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
