import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (...segments) => readFileSync(join(rootDir, ...segments), "utf8");
const home = read("app", "page.tsx");
const css = read("app", "styles", "homepage.css");
const controller = read("components", "HomepageAssemblyController.tsx");
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

function blockBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  return startIndex >= 0 && endIndex >= 0 ? source.slice(startIndex, endIndex) : "";
}

const trustBlock = blockBetween(home, "const trustSignals", "const finalHeadlineClusters");
const previewList = blockBetween(home, '<ul aria-label="Señales del producto" data-home-preview-phrases>', "</ul>");
const processSection = blockBetween(home, 'data-home-assembly-group="process-section"', 'data-home-assembly-group="capabilities-section"');
const capabilitySection = blockBetween(home, 'data-home-assembly-group="capabilities-section"', 'data-home-assembly-group="final-cta"');
const mobileCss = css.slice(css.indexOf("@media (max-width: 560px)"));
const scrollHandler = blockBetween(controller, "const handleScroll", "const handleReducedMotionChange");
const footerBlock = home.slice(home.indexOf('<footer className="minimal-home__footer"'));
const cssRulesUsingBrand = css.split("}").filter((rule) => rule.includes("var(--home-brand"));
const clientSurface = `${home}\n${navigation}\n${controller}\n${simulator}`;

includes(home, "<HomepageAssemblyController />", "Homepage mounts one bounded assembly controller");
check(
  "Homepage declares exactly four section-level assembly groups",
  (home.match(/data-home-assembly-group=/g) ?? []).length === 4,
  "Expected hero, process, capabilities, and final CTA groups only.",
);
for (const group of ["hero", "process-section", "capabilities-section", "final-cta"]) {
  includes(home, `data-home-assembly-group="${group}"`, `Section-level group exists: ${group}`);
}
excludes(processSection, 'data-home-assembly-group="process-cards"', "Process cards do not own an observer group");
excludes(capabilitySection, 'data-home-assembly-group="capability-cards"', "Capability cards do not own an observer group");
includes(controller, "observer?.observe(group)", "Observer watches section containers");
excludes(controller, "observer.observe(item)", "Observer never watches individual items");
excludes(controller, "querySelectorAll<HTMLElement>(ITEM_SELECTOR)", "Controller does not sequence child items at runtime");

check(
  "Preview contract contains exactly three approved phrases",
  (trustBlock.match(/copy:/g) ?? []).length === 3 && [
    "Preview público con respuestas de ejemplo",
    "Escenarios comparables",
    "Riesgo y consecuencia",
  ].every((phrase) => trustBlock.includes(phrase)),
  "Preview phrases are missing, duplicated, or changed.",
);
includes(previewList, "trustSignals.map", "Preview phrases render as three whole list items");
includes(previewList, "data-home-assembly-item", "Each preview phrase participates as one whole animated item");
excludes(previewList, "minimal-home__preview-status", "IA status is outside the animated preview phrase list");
includes(home, '<p className="minimal-home__preview-status">La conexión con IA real todavía no está activada.</p>', "IA status remains a separate static line");
excludes(css, ".minimal-home__preview-note li + li::before {\n  content: \"·\"", "Preview rows have no synthetic inline separators");
includes(css, ".minimal-home__preview-note ul {\n  display: grid", "Preview phrases retain readable row structure");

includes(controller, "const completedGroups = new WeakSet<HTMLElement>()", "Completion registry is monotonic");
includes(controller, "observer?.unobserve(group)", "Completed sections leave the observer");
includes(controller, 'setAssemblyState(group, "assembled")', "Section receives one assembling state");
includes(controller, 'setAssemblyState(group, "settled")', "Section reaches a stable settled state");
includes(controller, "window.requestAnimationFrame(() =>", "Visible state is applied through requestAnimationFrame");
excludes(controller, "scrollTimer", "Scroll timer does not drive visual sequencing");
includes(scrollHandler, "window.requestAnimationFrame", "First-scroll work is frame-batched");
excludes(scrollHandler, 'setAssemblyState(group, "pending")', "Scroll up cannot restore pending state");
includes(controller, "group.dataset.homeAssemblySettleMs", "Each section settles after its bounded maximum duration");
includes(css, "will-change: auto", "Settled state releases will-change");

includes(css, "--home-assembly-ease: cubic-bezier(0.22, 1, 0.36, 1)", "Safari correction uses the approved smooth easing");
includes(css, '--home-assembly-to-y: -72px', "Desktop hero has a clearly readable upward lift");
includes(mobileCss, '--home-assembly-to-y: -38px', "Mobile hero uses a restrained upward lift");
includes(css, '--motion-duration: 1020ms', "Hero transition has readable duration");
includes(css, "translate3d", "Motion uses compositor-friendly translation");

for (const [child, index, delay] of [[1, 5, 870], [2, 4, 740], [3, 3, 610], [4, 2, 480], [5, 1, 350], [6, 0, 220]]) {
  includes(css, `.minimal-home__process-card:nth-child(${child}) { --motion-index: ${index}; --motion-delay: ${delay}ms; }`, `Desktop process card ${child} has deterministic 06→01 timing`);
}
for (const [child, index, delay] of [[1, 0, 220], [2, 1, 350], [3, 2, 480], [4, 3, 610], [5, 4, 740], [6, 5, 870]]) {
  includes(mobileCss, `.minimal-home__process-card:nth-child(${child}) { --motion-index: ${index}; --motion-delay: ${delay}ms; }`, `Mobile process card ${child} follows 01→06 reading order`);
}
for (const [child, index, delay] of [[1, 3, 600], [2, 2, 460], [3, 1, 320], [4, 0, 180]]) {
  includes(css, `.minimal-home__capability-card:nth-child(${child}) { --motion-index: ${index}; --motion-delay: ${delay}ms; }`, `Desktop capability card ${child} enters right-to-left`);
}
for (const [child, index, delay] of [[1, 0, 180], [2, 1, 315], [3, 2, 450], [4, 3, 585]]) {
  includes(mobileCss, `.minimal-home__capability-card:nth-child(${child}) { --motion-index: ${index}; --motion-delay: ${delay}ms; }`, `Mobile capability card ${child} follows DOM order`);
}
includes(css, "--motion-index", "CSS custom properties own deterministic sequencing");
includes(css, "--motion-delay", "CSS custom properties own deterministic delays");

includes(home, 'className="minimal-home__header-login" href="/login"', "Login is a direct header child");
excludes(navigation, "Iniciar sesión", "Login is outside the navigation link container");
excludes(css, "overflow-x: auto", "Mobile navigation has no horizontal scrolling");
excludes(css, "-webkit-overflow-scrolling", "Mobile navigation does not rely on swipe overflow");
includes(css, "grid-template-columns: repeat(2, minmax(0, 1fr))", "Narrow header navigation uses a bounded two-column grid");
includes(css, "padding: max(16px, env(safe-area-inset-top))", "Mobile header respects Safari safe area");
includes(css, ".minimal-home .minimal-home__header-login {\n    grid-column: 2;", "Mobile login remains visible in header row one");

includes(css, "@media (hover: hover) and (pointer: fine)", "Card hover is limited to real hover pointers");
includes(css, "@media (hover: none), (pointer: coarse)", "Touch cards have a separate state contract");
includes(css, "-webkit-tap-highlight-color: transparent", "Safari card tap flash is neutralized");
includes(css, "transform: translateY(-2px)", "Fine-pointer hover lift stays restrained");
includes(css, "transform: translateY(1px)", "Touch active feedback is short and restrained");
includes(css, ".minimal-home .decision-console button:focus-visible", "Keyboard focus remains visible");

check(
  "Final headline keeps exactly three readable clusters",
  (blockBetween(home, "const finalHeadlineClusters", "const footerColumns").match(/copy:/g) ?? []).length === 3,
  "Final headline cluster count changed.",
);
excludes(blockBetween(home, 'className="minimal-home__final-actions"', "</section>"), "data-home-assembly-item", "Final CTA actions stay geometrically stable");
includes(css, "--motion-duration: 960ms", "Final CTA cluster motion is smooth and bounded");

includes(css, "@media (prefers-reduced-motion: reduce)", "Reduced-motion fallback is explicit");
includes(css, "transition-delay: 0ms !important", "Reduced motion removes stagger delays");
includes(css, "opacity: 1 !important", "Reduced motion exposes all content immediately");
includes(css, "transform: none !important", "Reduced motion uses final stable geometry");

includes(simulator, "MAX_SIMULATION_INPUT_LENGTH = 1200", "Simulator keeps the 1200-character boundary");
includes(simulator, "safeRender !== true", "Simulator keeps safeRender validation");
includes(simulator, "mockOnly !== true", "Simulator keeps mockOnly validation");
includes(simulator, "apiReady !== true", "Simulator keeps apiReady validation");
includes(simulator, 'aria-label="Simular decisión"', "Simulator submit accessibility name remains");
includes(simulateRoute, "mockOnly: true", "Public runtime remains deterministic and mock-only");
includes(footerBlock, "Sistema de simulación de decisiones para explorar escenarios, riesgos y consecuencias antes de actuar.", "Approved footer copy remains exact");
check(
  "Gold remains restricted to brand and primary CTA rules",
  cssRulesUsingBrand.length > 0 && cssRulesUsingBrand.every((rule) => /brand-lockup|brand-name|levio-mark|minimal-home__primary-cta|--home-brand/.test(rule)),
  "Gold token leaked outside approved rules.",
);
check(
  "Public client surface has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create|openai-synthetic-risk-adapter\.server/.test(clientSurface),
  "OpenAI transport leaked into public homepage code.",
);
includes(packageJson, '"quality:homepage-safari-iphone-motion-correction"', "Dedicated Safari/iPhone correction gate is registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage Safari/iPhone motion correction gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
