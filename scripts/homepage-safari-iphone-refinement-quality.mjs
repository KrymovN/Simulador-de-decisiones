import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const css = read("app", "globals.css");
const controller = read("components", "HomepageMotionController.tsx");
const simulator = read("components", "HomeSimulator.tsx");
const simulateRoute = read("app", "api", "simulate", "route.ts");
const packageJson = read("package.json");
const publicMotionSurface = `${home}\n${controller}\n${simulator}`;
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

includes(home, 'data-home-motion-group="decision-intelligence"', "Decision heading and cards use one narrative group");
excludes(home, 'data-home-motion-group="decision-heading"', "Detached decision-heading observer is removed");
excludes(home, 'data-home-motion-group="decision-cards"', "Detached decision-card observer is removed");
includes(home, 'className="future-branches-composition"', "Future heading and cards share one composition");
excludes(home, 'data-home-motion-group="future-heading"', "Detached future-heading observer is removed");
check(
  "Narrative profile covers the four owner-reviewed zones",
  (home.match(/data-home-motion-profile="narrative"/g) ?? []).length === 4,
  "Expected decision, future, criteria and simulator narrative profiles.",
);
includes(home, 'data-home-motion-direction="left"', "Narrative includes viewer-left entrances");
includes(home, 'data-home-motion-direction="right"', "Narrative includes viewer-right entrances");
includes(home, 'data-home-motion-direction="rise"', "Narrative includes lower-to-final entrances");
includes(simulator, 'data-home-motion-direction="rise"', "Simulator panel has an explicit entrance direction");

includes(controller, 'rootMargin: "0px 0px -30% 0px"', "Phone reveal waits for meaningful viewport entry");
includes(controller, 'narrativeDuration: "820ms"', "Phone narrative movement remains readable");
includes(controller, 'narrativeStagger: "145ms"', "Phone narrative sequence remains visible");
includes(controller, "window.innerHeight * 0.62", "Restoration settles only materially reached content");
excludes(controller, "window.innerHeight * 0.9", "Premature ninety-percent finalization is removed");
includes(controller, 'group.dataset.homeMotionState = "settled"', "Animation releases to a deterministic settled state");
includes(controller, "settleTimers", "Visible state has bounded lifecycle cleanup");
includes(controller, "entry.boundingClientRect.top < 0", "Fast scrolling settles skipped groups");
includes(controller, 'window.addEventListener("pageshow", restoreVisibleState)', "Back-forward restoration stays supported");
includes(controller, 'window.matchMedia("(prefers-reduced-motion: reduce)")', "Reduced motion remains explicit");

includes(css, "opacity: 0.14 !important", "Pending state remains readable while visibly unfinished");
includes(css, "var(--home-motion-x, 0)", "Motion uses per-item horizontal direction");
includes(css, "var(--home-motion-y, 30px)", "Motion uses per-item vertical direction");
includes(css, '[data-home-motion-state="settled"]', "Settled visual state is explicit");
includes(css, "[data-home-motion-item] .motion-letter", "Nested letter timelines cannot conflict with group motion");
includes(css, "border-color: rgba(255, 211, 106, 0.62)", "Decision and criteria cards use stronger gold separation");
includes(css, "border-color: rgba(255, 211, 106, 0.72)", "Simulator panel has stronger visual framing");
includes(css, "width: 188px", "Desktop simulator primary control is compact");
includes(css, "width: 176px", "Phone simulator primary control is compact");
includes(css, "border-radius: 999px", "Primary simulator control uses a pill silhouette");
includes(simulator, 'aria-label="Simular decisión"', "Primary simulator control keeps its accessible name");
includes(simulator, 'aria-label={isListening ? "Detener dictado por voz" : "Dictar situación"}', "Microphone keeps its accessible stateful name");

check(
  "Homepage refinement does not add network-capable motion code",
  !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/.test(controller),
  "Network API found in homepage motion controller.",
);
check(
  "Public refinement surface has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create|openai-synthetic-risk-adapter\.server/.test(publicMotionSurface),
  "OpenAI transport leaked into public homepage code.",
);
includes(simulateRoute, "mockOnly: true", "Public simulator remains deterministic and mockOnly");
includes(simulator, "MAX_SIMULATION_INPUT_LENGTH = 1200", "Public input limit remains 1200 characters");
includes(packageJson, '"quality:homepage-safari-iphone-refinement"', "Dedicated refinement gate is registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage Safari iPhone refinement gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
