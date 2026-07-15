import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const css = read("app", "styles", "homepage.css");
const assembly = read("components", "HomepageAssemblyController.tsx");
const navigation = read("components", "HomepageNavigation.tsx");
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

includes(home, "HomepageAssemblyController", "Homepage mounts the bounded assembly controller");
includes(home, "data-home-assembly-group", "Homepage declares bounded assembly groups");
excludes(home, "MotionLetters", "Homepage has no per-letter motion markup");
excludes(css, "@keyframes", "Homepage assembly uses interruptible transitions instead of keyframes");
excludes(css, "infinite", "Homepage has no infinite decorative motion");
excludes(css, "animation-timeline", "Homepage has no scroll-linked decorative timeline");
includes(css, "opacity: 0.12;", "Reveal uses restrained opacity");
includes(css, "transform: translate3d", "Reveal uses GPU-friendly bounded translation");
includes(assembly, "completedGroups", "One-time completion registry prevents replay");
includes(assembly, "observer?.unobserve(group)", "Completed groups stop being observed");
includes(css, "@media (prefers-reduced-motion: reduce)", "Reduced motion remains explicit");
includes(css, "animation: none !important", "Reduced motion renders the immediate final state");
includes(css, "transition-duration: 0.01ms !important", "Reduced motion collapses transitions");

includes(css, "@media (max-width: 860px)", "Phone/tablet breakpoint remains explicit");
includes(css, ".minimal-home__hero", "Hero owns the responsive flow");
includes(css, "grid-template-columns: 1fr;", "Hero becomes a single column");
includes(css, "grid-template-columns: repeat(2, minmax(0, 1fr))", "Full navigation remains reachable at narrow widths");
includes(css, "width: auto !important", "Legacy full-width mobile nav items are neutralized");
excludes(css, "overflow-x: auto", "Mobile nav has no touch-scroll overflow");
includes(css, "min-height: 44px", "Mobile navigation keeps accessible targets");
includes(css, "min-height: 168px", "Mobile textarea remains readable");
includes(css, ".minimal-home__process-grid", "Process grid keeps a phone layout");
includes(css, ".minimal-home__capability-grid", "Capability grid keeps a phone layout");
excludes(css, "100vw", "Mobile layout avoids viewport-scrollbar overflow");

includes(home, 'id="como-funciona"', "Process anchor remains");
includes(home, 'id="criterios"', "Criteria anchor remains");
includes(home, 'id="simulador"', "Simulator anchor remains");
includes(home, "processSteps.map", "All six process cards stay data-driven");
includes(home, "capabilities.map", "All four capability cards stay data-driven");
includes(navigation, "if (!historyAnchor)", "Navigation history restoration remains safe");
includes(simulator, "MAX_SIMULATION_INPUT_LENGTH = 1200", "Simulator input contract remains bounded");
includes(simulator, 'aria-label="Simular decisión"', "Simulator action keeps its accessible name");
includes(simulateRoute, "mockOnly: true", "Public runtime remains mockOnly");
check(
  "Mobile public surface has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create/.test(`${home}\n${navigation}\n${simulator}`),
  "OpenAI transport leaked into the public mobile surface.",
);
includes(packageJson, '"quality:mobile-homepage-motion-parity"', "Mobile regression gate remains registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nMobile homepage simplification regression: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
