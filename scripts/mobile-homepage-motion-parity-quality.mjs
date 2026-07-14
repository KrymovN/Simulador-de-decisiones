import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const css = read("app", "globals.css");
const controller = read("components", "HomepageMotionController.tsx");
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

const processBlock = home.match(/data-home-motion-group="process"[\s\S]*?<\/section>/)?.[0] ?? "";
const criteriaBlock = home.match(/data-home-motion-group="criteria"[\s\S]*?<\/section>/)?.[0] ?? "";
const parityCss = css.slice(css.indexOf("/* Mobile motion parity:"));
const motionClientSurface = `${home}\n${controller}\n${simulator}`;

includes(home, 'import HomepageMotionController from "../components/HomepageMotionController"', "Homepage mounts the shared motion controller");
includes(home, "<HomepageMotionController />", "Homepage activates one shared motion lifecycle");
includes(controller, 'const GROUP_SELECTOR = "[data-home-motion-group]"', "Controller uses grouped section targets");
includes(controller, 'const ITEM_SELECTOR = "[data-home-motion-item]"', "Controller assigns a stable item sequence");
includes(controller, "new IntersectionObserver(", "Mobile normal motion uses IntersectionObserver");
check(
  "Controller creates one observer lifecycle rather than one observer per card",
  (controller.match(/new IntersectionObserver\(/g) ?? []).length === 1,
  "Expected exactly one IntersectionObserver constructor.",
);
includes(controller, "observer?.disconnect()", "Observer lifecycle disconnects safely");
includes(controller, 'window.addEventListener("scroll", finalizeSkippedGroups, { passive: true })', "Fast-scroll finalization uses one passive listener");
includes(controller, "requestAnimationFrame", "Scroll and resize work is frame-throttled");
includes(controller, 'window.addEventListener("pageshow", restoreVisibleState)', "Back/Forward restoration is handled");
includes(navigation, "if (!historyAnchor)", "Empty Back/Forward hashes do not reach querySelector");
includes(controller, 'document.addEventListener("visibilitychange", handleVisibilityChange)', "Visibility restoration is handled");
includes(controller, 'window.matchMedia("(prefers-reduced-motion: reduce)")', "Reduced motion is detected independently");
includes(controller, "if (reducedMotion.matches)", "Reduced motion takes a final-state branch");
includes(controller, "if (width <= 480)", "Phone viewport has bounded configuration");
includes(controller, "if (width <= 860)", "Tablet portrait has bounded configuration");
includes(controller, "MAX_ENHANCED_WIDTH = 1024", "Tablet landscape remains inside enhanced motion");
includes(controller, "rootMargin: config.rootMargin", "Observer trigger adapts by viewport");
includes(controller, "revealedGroups", "One-time reveal state prevents irritating replay");
includes(controller, 'group.dataset.homeMotionState = "visible"', "Every observed group has a deterministic final state");
excludes(controller, "navigator.userAgent", "Motion does not use user-agent sniffing");
check(
  "Touch and coarse pointer do not disable normal motion",
  !/pointer:\s*coarse|hover:\s*none|matchMedia\([^)]*(?:pointer|hover)/.test(controller),
  "Pointer/hover capability must not force a static state.",
);

includes(home, 'data-home-motion-group="process"', "Cómo piensa Levio is an observed group");
includes(home, 'data-home-motion-group="criteria"', "Criteria is an observed group");
includes(home, 'data-home-motion-group="simulator"', "Simulator entrance is an observed group");
includes(simulator, "data-home-motion-item", "Simulator panel participates without changing its behavior");
check(
  "All six process cards receive the shared item state",
  processBlock.includes("processSteps.map") && processBlock.includes("data-home-motion-item"),
  "Process-card map is not wired to the shared motion item state.",
);
check(
  "All four criteria cards receive the shared item state",
  criteriaBlock.includes("lowerCapabilities.map") && criteriaBlock.includes("data-home-motion-item"),
  "Criteria-card map is not wired to the shared motion item state.",
);

includes(parityCss, "@media (max-width: 1024px)", "Responsive parity CSS covers phone and tablet");
includes(parityCss, '[data-home-motion-state="pending"]', "Normal motion has a visible intermediate pending state");
includes(parityCss, "opacity: 0.08 !important", "Pending opacity progression remains noticeable");
includes(parityCss, "translate3d", "Motion uses compositor-friendly transforms");
includes(parityCss, '[data-home-motion-state="visible"]', "Normal motion has an explicit final state");
includes(parityCss, "opacity: 1 !important", "Final state is readable");
includes(parityCss, "--home-motion-order", "Items retain a sequential stagger");
includes(parityCss, "@media (prefers-reduced-motion: reduce)", "Reduced motion is a separate CSS contract");
includes(parityCss, "transition: none !important", "Reduced motion removes staggered movement");
check(
  "New motion CSS animates only transform and opacity",
  !/(?:transition|animation)[^;]*(?:width|height|top|left|filter|box-shadow)/.test(parityCss),
  "Layout or paint-heavy property found in mobile parity transitions.",
);

check(
  "Public client motion surface has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create|openai-synthetic-risk-adapter\.server/.test(motionClientSurface),
  "OpenAI transport leaked into the public motion surface.",
);
check(
  "Motion controller performs no network request",
  !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/.test(controller),
  "Network-capable API found in the motion controller.",
);
includes(simulateRoute, "mockOnly: true", "Public simulator remains mockOnly");
includes(packageJson, '"quality:mobile-homepage-motion-parity"', "Dedicated mobile motion gate is registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nMobile homepage motion parity gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
