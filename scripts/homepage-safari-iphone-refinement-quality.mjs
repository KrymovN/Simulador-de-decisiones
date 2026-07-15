import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const css = read("app", "styles", "homepage.css");
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

includes(css, "width: min(1180px, calc(100% - 48px))", "Desktop frame is viewport-bounded");
includes(css, "grid-template-columns: minmax(0, 0.82fr) minmax(460px, 1.18fr)", "Desktop hero uses minmax-safe columns");
includes(css, "min-width: 0", "Grid children can shrink without Safari overflow");
includes(css, "overflow: clip", "Homepage contains visual overflow");
excludes(css, "100vw", "Homepage avoids scrollbar-dependent viewport sizing");
excludes(css, "position: fixed", "Homepage adds no fixed decorative layer");
excludes(css, "backdrop-filter", "Homepage avoids expensive glass effects");
excludes(css, "mask-image", "Homepage avoids decorative mask rendering");
excludes(css, "radial-gradient", "Homepage avoids glow layers");
excludes(css, "animation-timeline", "Homepage avoids scroll-timeline compatibility risk");

includes(css, "@media (max-width: 860px)", "Tablet breakpoint exists");
includes(css, "@media (max-width: 560px)", "iPhone breakpoint exists");
includes(css, "width: min(100% - 28px, 520px)", "iPhone frame keeps symmetric safe gutters");
includes(css, "-webkit-overflow-scrolling: touch", "Nav keeps WebKit momentum scrolling");
includes(css, "overscroll-behavior-inline: contain", "Horizontal nav scroll stays contained");
includes(css, "width: auto !important", "Old full-width nav behavior cannot reappear");
includes(css, "min-height: 44px", "Navigation keeps a 44px touch target");
includes(css, "min-height: 168px", "Textarea stays readable on iPhone");
includes(css, "font-variant-numeric: tabular-nums", "Counter and steps do not jitter");
includes(css, "overflow-wrap", "Long simulator output has a wrapping guardrail");
includes(css, "@media (prefers-reduced-motion: reduce)", "Reduced motion is Safari-accessible");
includes(css, "scroll-behavior: auto !important", "Reduced motion disables smooth scrolling");

includes(css, ".minimal-home__header::after", "Legacy decorative header line is explicitly neutralized");
includes(css, ".minimal-home .reference-nav a::before", "Legacy nav separators are explicitly neutralized");
includes(css, "content: none !important", "Inherited nav decorations cannot win the cascade");
includes(css, ".minimal-home .levio-mark::before", "Legacy logo pseudo-layers are removed");
includes(css, "text-shadow: none", "Brand name avoids non-ring glow");

includes(home, 'className="minimal-home__simulator" id="simulador"', "Simulator follows hero copy in source order");
includes(home, 'className="minimal-home__process-card"', "Process stays a text-card section");
includes(home, 'className="minimal-home__capability-card"', "Capabilities stay a text-card section");
excludes(home, "<svg", "Homepage sections add no SVG illustration");
excludes(home, "<Image", "Homepage adds no raster hero image");
includes(simulator, 'aria-label={isListening ? "Detener dictado por voz" : "Dictar situación"}', "Voice action keeps stateful accessibility");
includes(simulator, 'aria-label="Simular decisión"', "Submit action keeps accessibility");
includes(simulateRoute, "mockOnly: true", "Public runtime remains deterministic and mockOnly");
includes(packageJson, '"quality:homepage-safari-iphone-refinement"', "Safari regression gate remains registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage Safari/iPhone simplification regression: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) {
  process.exitCode = 1;
}
