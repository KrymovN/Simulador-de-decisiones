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
const finalSection = blockBetween(home, 'data-home-assembly-group="final-cta"', '<footer className="minimal-home__footer">');
const motionCss = css.slice(css.indexOf("/* One-time homepage assembly."));
const mobileCss = blockBetween(css, "@media (max-width: 860px)", "@media (max-width: 560px)");
const reducedCss = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
const finalMotionCss = blockBetween(
  css,
  '.minimal-home.home-assembly-enabled [data-home-assembly-group="final-cta"] {',
  "@media (hover: hover) and (pointer: fine)",
);
const scrollHandler = blockBetween(controller, "const handleScroll", "const handleReducedMotionChange");
const footerBlock = home.slice(home.indexOf('<footer className="minimal-home__footer">'));
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
for (const group of ["process-section", "capabilities-section", "final-cta"]) {
  const groupBlock = group === "process-section" ? processSection : group === "capabilities-section" ? capabilitySection : finalSection;
  includes(groupBlock, 'data-home-motion-vector="right-to-left"', `${group} declares the shared right-to-left vector`);
}
includes(home, 'data-home-motion-vector="upward"', "Hero declares its bounded upward exception");
check(
  "Controller creates exactly one IntersectionObserver instance",
  (controller.match(/new IntersectionObserver/g) ?? []).length === 1,
  "Homepage must use one shared section observer.",
);
includes(controller, "observer?.observe(group)", "Observer watches section containers");
excludes(controller, "observer.observe(item)", "Observer never watches individual items");
excludes(controller, "ITEM_SELECTOR", "Controller does not query or sequence items");
excludes(processSection, 'data-home-assembly-group="process-cards"', "Process cards share the section trigger");
excludes(capabilitySection, 'data-home-assembly-group="capability-cards"', "Capability cards share the section trigger");

includes(controller, "const activatedGroups = new WeakSet<HTMLElement>()", "Activation registry is monotonic");
includes(controller, "observer?.unobserve(group)", "Activated sections leave observation");
includes(controller, 'setAssemblyState(group, "assembled")', "Sections receive one assembled state");
includes(controller, 'setAssemblyState(group, "settled")', "Sections reach a stable settled state");
excludes(scrollHandler, 'setAssemblyState(group, "pending")', "Upward scroll cannot restore pending state");
includes(scrollHandler, "window.requestAnimationFrame", "Scroll work is frame-batched");
excludes(controller, "scrollTimer", "Short scroll timers do not drive motion");
excludes(controller, ".style.transform", "Scroll position never writes transforms");
excludes(controller, "scrollProgress", "Continuous scroll progress mapping is absent");
excludes(motionCss, "animation-timeline", "Homepage motion has no view timeline");
excludes(motionCss, "scroll-timeline", "Homepage motion has no scroll timeline");
excludes(motionCss, "@keyframes", "Homepage assembly uses interruptible transitions, not keyframes");
includes(controller, 'mobileMotion.matches ? "0px 0px -6% 0px" : "0px 0px -14% 0px"', "Mobile sections trigger earlier than desktop sections");
includes(controller, "group.dataset.homeAssemblySettleMobileMs", "Mobile sections use bounded shorter settle timing");

includes(css, "--home-assembly-ease: cubic-bezier(0.22, 1, 0.36, 1)", "All assembly uses the shared easing");
includes(css, "--home-assembly-duration: 760ms", "Desktop assembly uses the shared duration");
includes(css, "--home-assembly-distance: 48px", "Desktop assembly uses the shared distance");
includes(mobileCss, "--home-assembly-duration: 620ms", "Mobile assembly shortens duration");
includes(mobileCss, "--home-assembly-stagger: 60ms", "Mobile assembly shortens stagger");
includes(mobileCss, "--home-assembly-distance: 28px", "Mobile assembly shortens distance");
includes(css, "transform: translate3d(var(--home-assembly-from-x), var(--home-assembly-from-y), 0)", "Pending items use compositor-friendly translation");
check(
  "Assembled and settled item states both clear transforms",
  (motionCss.match(/transform: none;/g) ?? []).length >= 4,
  "Final geometry must not retain assembly transforms.",
);
excludes(motionCss, "--home-assembly-to-x", "No persistent horizontal destination offset remains");
excludes(motionCss, "--home-assembly-to-y", "No persistent vertical destination offset remains");
includes(css, "will-change: auto", "Settled state releases compositor hints");

includes(css, '[data-home-assembly-group="hero"] #hero-title', "Hero has one controlled assembly selector");
includes(css, "--home-assembly-from-y: 26px", "Hero starts slightly below its stable layout position");
includes(css, "--motion-duration: 820ms", "Hero uses one bounded transition duration");
excludes(css, "#hero-title {\n  transform:", "Hero has no competing base transform");
excludes(controller, "hero-title", "Controller does not directly transform the hero title");

check(
  "Preview contract contains exactly three approved phrases",
  (trustBlock.match(/^  "/gm) ?? []).length === 3 && [
    "Preview público con respuestas de ejemplo",
    "Escenarios comparables",
    "Riesgo y consecuencia",
  ].every((phrase) => trustBlock.includes(phrase)),
  "Preview phrases are missing, duplicated, or changed.",
);
includes(previewList, "trustSignals.map", "Preview phrases render as three whole list rows");
includes(previewList, "data-home-assembly-item", "Preview trio shares the hero trigger");
includes(css, ".minimal-home__preview-note ul {\n  display: grid", "Preview preserves non-overlapping row geometry");
for (const [child, delay] of [[1, 40], [2, 110], [3, 180]]) {
  includes(css, `[data-home-preview-phrases] li:nth-child(${child})`, `Preview row ${child} has deterministic sequencing`);
  includes(css, `--motion-delay: ${delay}ms`, `Preview row ${child} keeps its fixed delay`);
}
excludes(home, "minimal-home__preview-status", "Homepage removes the duplicate preview technical status node");
excludes(home, "La conexión con IA real todavía no está activada.", "Homepage does not duplicate the simulator IA status");
includes(simulator, "conexión con IA real aún no está activada", "Technical IA status remains under HomeSimulator");

check(
  "Both section headings use the same wrapper-level motion grammar",
  (home.match(/className="minimal-home__section-heading" data-home-assembly-item/g) ?? []).length === 2,
  "Both headings must be single assembly items.",
);
excludes(processSection, "data-home-assembly-direction", "Process heading has no opposing direction override");
excludes(capabilitySection, "data-home-assembly-direction", "Capability heading has no opposing direction override");
includes(css, ".minimal-home.home-assembly-enabled .minimal-home__section-heading", "Section headings share one CSS motion rule");
includes(css, "--motion-delay: 0ms", "Headings start before card sequences");

check(
  "Process section keeps six cards under one trigger",
  (processSection.match(/className="minimal-home__process-card"/g) ?? []).length === 1 && home.includes("processSteps.map"),
  "Process cards must remain data-driven under the section group.",
);
includes(css, "--motion-phase-delay: 260ms", "Desktop cards begin after controlled heading overlap");
for (const [child, index, delay] of [[1, 0, 260], [2, 1, 350], [3, 2, 440], [4, 3, 530], [5, 4, 620], [6, 5, 710]]) {
  includes(css, `.minimal-home__process-card:nth-child(${child}) { --motion-index: ${index}; --motion-delay: ${delay}ms; }`, `Desktop process card ${child} keeps fixed 01→06 timing`);
}
for (const [child, delay] of [[1, 180], [2, 240], [3, 300], [4, 360], [5, 420], [6, 480]]) {
  includes(mobileCss, `.minimal-home__process-card:nth-child(${child}) { --motion-delay: ${delay}ms; }`, `Mobile process card ${child} keeps shortened timing`);
}

for (const [child, index, delay] of [[1, 0, 260], [2, 1, 350], [3, 2, 440], [4, 3, 530]]) {
  includes(css, `.minimal-home__capability-card:nth-child(${child}) { --motion-index: ${index}; --motion-delay: ${delay}ms; }`, `Desktop capability card ${child} keeps fixed timing`);
}
for (const [child, delay] of [[1, 160], [2, 220], [3, 280], [4, 340]]) {
  includes(mobileCss, `.minimal-home__capability-card:nth-child(${child}) { --motion-delay: ${delay}ms; }`, `Mobile capability card ${child} keeps shortened timing`);
}

includes(finalMotionCss, "transform: translate3d(var(--home-assembly-distance), 0, 0)", "Final CTA enters right-to-left as one container");
excludes(finalMotionCss, "translate3d(-", "Final CTA never enters left-to-right");
check(
  "Final CTA headline keeps exactly three stable word clusters",
  (blockBetween(home, "const finalHeadlineClusters", "const footerColumns").match(/^  "/gm) ?? []).length === 3,
  "Final headline cluster count changed.",
);
excludes(finalSection, "data-home-assembly-item", "Final CTA does not layer competing child transforms");
excludes(finalMotionCss, "width", "Final CTA motion does not animate width");
excludes(finalMotionCss, "letter-spacing", "Final CTA motion does not animate letter spacing");
includes(finalMotionCss, "pointer-events: none", "Moving final CTA cannot retain overlay hit areas");
includes(finalMotionCss, "pointer-events: auto", "Settled final CTA restores interaction");

includes(css, "overflow: clip", "Homepage contains horizontal assembly overflow");
excludes(css, "overflow-x: auto", "Mobile navigation does not create horizontal scrolling");
includes(css, '[data-home-assembly-state="pending"] [data-home-assembly-item] {\n  pointer-events: none;', "Pending transformed items cannot retain hidden hit areas");
includes(home, 'className="minimal-home__header-login" href="/login"', "Login remains a bounded direct header link");
excludes(navigation, "Iniciar sesión", "Login has no duplicate navigation overlay");
includes(css, ".minimal-home__header {\n  position: sticky;\n  top: 0;\n  z-index: 20;", "Header stacking remains explicit");
includes(css, ".minimal-home .decision-console button:focus-visible", "Keyboard focus remains visible");

includes(reducedCss, "transition-delay: 0ms !important", "Reduced motion removes stagger");
includes(reducedCss, "opacity: 1 !important", "Reduced motion exposes all content");
includes(reducedCss, "transform: none !important", "Reduced motion uses final geometry");
includes(reducedCss, "pointer-events: auto !important", "Reduced motion restores all interactions");
includes(reducedCss, "will-change: auto !important", "Reduced motion releases compositor hints");

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
includes(packageJson, '"quality:homepage-motion-stabilization"', "Dedicated motion stabilization gate is registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage motion stabilization gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
