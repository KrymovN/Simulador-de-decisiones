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
const mark = read("components", "LevioMark.tsx");
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

const heroBlock = blockBetween(home, '<section\n        className="minimal-home__hero"', '<div\n            className="minimal-home__preview-block"');
const headerBlock = blockBetween(home, '<header className="minimal-home__header reference-header">', "</header>");
const previewBlock = blockBetween(home, 'data-home-assembly-group="preview"', 'data-home-assembly-group="process-section"');
const processBlock = blockBetween(home, 'data-home-assembly-group="process-section"', 'data-home-assembly-group="capabilities-section"');
const capabilityBlock = blockBetween(home, 'data-home-assembly-group="capabilities-section"', 'data-home-assembly-group="final-cta"');
const finalBlock = blockBetween(home, 'data-home-assembly-group="final-cta"', '<footer className="minimal-home__footer">');
const footerBlock = home.slice(home.indexOf('<footer className="minimal-home__footer">'));
const motionCss = css.slice(css.indexOf("/* One-time homepage assembly."));
const previewMotionCss = blockBetween(
  motionCss,
  '.minimal-home.home-assembly-enabled [data-home-assembly-group="preview"][data-home-assembly-state="pending"]',
  ".minimal-home.home-assembly-enabled .minimal-home__section-heading",
);
const phoneCss = blockBetween(css, "@media (max-width: 560px)", "@media (prefers-reduced-motion: reduce)");
const reducedCss = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
const publicHomepageSurface = `${home}\n${simulator}`;

includes(home, "<HomepageAssemblyController />", "Homepage mounts one bounded assembly controller");
check(
  "Homepage keeps exactly four post-Hero assembly groups",
  (home.match(/data-home-assembly-group=/g) ?? []).length === 4,
  "Expected preview, process, capabilities, and final CTA groups only.",
);
for (const group of ["preview", "process-section", "capabilities-section", "final-cta"]) {
  includes(home, `data-home-assembly-group="${group}"`, `Assembly group exists: ${group}`);
}

excludes(heroBlock, "data-home-assembly-group", "Hero is outside the scroll assembly lifecycle");
includes(heroBlock, '<h1 id="hero-title">', "Hero heading renders directly in stable layout geometry");
excludes(heroBlock, "data-home-assembly-item", "Hero heading has no pending or settled motion state");
excludes(controller, "FIRST_SCROLL_SELECTOR", "Controller removes the first-scroll Hero lifecycle");
excludes(controller, "first-scroll", "Controller has no Hero scroll trigger");
excludes(motionCss, '[data-home-assembly-group="hero"]', "CSS has no Hero assembly selector");
excludes(motionCss, "#hero-title", "CSS never transforms the Hero heading");
includes(css, "margin-bottom: 30px", "Hero keeps a stable 30px heading-to-description gap");
includes(home, "Explora escenarios, compara alternativas y entiende sus posibles consecuencias antes de tomar una decisión.", "Hero uses the approved product copy");
excludes(home, "preview demostrativo", "Hero removes the rejected preview wording");

includes(previewBlock, 'data-home-assembly-trigger="preview"', "Preview owns a separate one-time trigger");
includes(previewBlock, 'data-home-motion-vector="right-to-left"', "Preview uses the shared right-to-left vector");
for (const phrase of [
  "Preview público con respuestas de ejemplo",
  "Escenarios comparables",
  "Riesgos y consecuencias",
]) {
  includes(previewBlock, phrase === "Preview público con respuestas de ejemplo" ? "trustSignals.map" : "trustSignals.map", `Preview renders approved phrase through the canonical trio: ${phrase}`);
  includes(home, phrase, `Approved preview phrase exists: ${phrase}`);
}
includes(controller, 'const PREVIEW_SELECTOR = \'[data-home-assembly-trigger="preview"]\';', "Controller identifies preview independently");
includes(controller, "window.visualViewport", "Activation geometry accounts for Safari visual viewport");
includes(controller, "const PREVIEW_ACTIVATION_RATIO = 0.66", "Preview retains its dedicated visual activation line");
includes(controller, "const PREVIEW_SCROLL_NOISE_TOLERANCE = 2", "Preview defines a bounded scroll noise tolerance");
includes(controller, "const PREVIEW_MIN_SCROLL_Y = 24", "Preview requires a safe positive scroll position");
includes(controller, "let previousValidScrollY = Math.max(0, window.scrollY)", "Controller stores the previous non-negative scroll position");
includes(controller, "const downwardDelta = currentScrollY - previousValidScrollY", "Preview activation derives a genuine scroll delta");
includes(controller, "currentScrollY < 0", "Negative pull-to-refresh offsets cannot arm preview");
includes(controller, "Math.abs(downwardDelta) > PREVIEW_SCROLL_NOISE_TOLERANCE", "Noise does not replace the previous valid scroll baseline");
includes(controller, "currentScrollY >= PREVIEW_MIN_SCROLL_Y", "Preview rejects zero and near-zero scroll offsets");
includes(controller, "downwardDelta > PREVIEW_SCROLL_NOISE_TOLERANCE", "Preview requires positive downward movement beyond noise");
includes(controller, "previewDownwardArmed = true", "A genuine downward movement monotonically arms preview");
includes(controller, "isAtVisualActivationLine(target, PREVIEW_ACTIVATION_RATIO)", "Scroll activation also requires preview to cross its visual line");
includes(controller, 'window.addEventListener("scroll", handlePreviewScroll, { passive: true })', "Preview uses one passive scroll activation path");
excludes(controller, "observeAtVisualLine(previewGroups", "Initial IntersectionObserver callbacks cannot activate preview");
excludes(controller, 'window.visualViewport?.addEventListener("resize"', "Safari visualViewport resize never recreates or activates preview lifecycle");
includes(controller, "settleRestoredPreview(currentScrollY)", "Restored deep positions use the immediate settle path");
includes(controller, "target.getBoundingClientRect().bottom <= visualTop", "Preview above a restored viewport cannot remain pending");
includes(css, "--home-preview-duration: 720ms", "Desktop preview uses a readable bounded duration");
includes(css, "--home-preview-stagger: 90ms", "Preview uses a calm readable stagger");
includes(css, "--home-preview-distance: 32px", "Desktop preview travel remains bounded but perceptible");
includes(css, "--home-preview-ease: cubic-bezier(0.4, 0, 0.2, 1)", "Preview avoids the former front-loaded easing");
includes(css, "opacity: 0.58", "Desktop preview remains readable before activation");
includes(phoneCss, "--home-preview-duration: 680ms", "Mobile preview uses a bounded readable duration");
includes(phoneCss, "--home-preview-distance: 24px", "Mobile preview travel remains viewport-safe");
includes(phoneCss, "opacity: 0.62", "Mobile preview remains readable before activation");
includes(previewMotionCss, "transform: translate3d(var(--home-preview-distance), 0, 0)", "Preview retains the shared right-to-left direction");
includes(previewMotionCss, "opacity var(--home-preview-duration) var(--home-preview-ease)", "Preview opacity uses the dedicated restrained timing");
includes(previewMotionCss, "transform var(--home-preview-duration) var(--home-preview-ease)", "Preview travel uses the dedicated restrained timing");
includes(previewMotionCss, "--motion-delay: 0ms", "Preview first phrase starts without arbitrary latency");
includes(previewMotionCss, "--motion-delay: 90ms", "Preview second phrase owns the intended stagger");
includes(previewMotionCss, "--motion-delay: 180ms", "Preview third phrase owns the intended stagger");
excludes(previewMotionCss, "cubic-bezier(0.22, 1, 0.36, 1)", "Preview no longer uses the front-loaded assembly easing");
includes(previewBlock, 'data-home-assembly-settle-ms="960"', "Desktop settle timer covers the full preview sequence");
includes(previewBlock, 'data-home-assembly-settle-mobile-ms="900"', "Mobile settle timer covers the full preview sequence");

includes(headerBlock, '<LevioMark size="lg" priority />', "Above-the-fold header mark requests priority loading");
includes(mark, "priority?: boolean", "Levio mark exposes a bounded priority option");
includes(mark, "priority={priority}", "Levio mark forwards Next/Image priority semantics");
includes(mark, 'src="/levio-reference-mark.png"', "Exact approved ring asset remains in use");
includes(css, ".minimal-home .levio-mark {\n  background: transparent", "Homepage mark has no opaque black first-paint placeholder");
includes(css, ".minimal-home .levio-mark-lg {\n  width: 38px;\n  height: 38px", "Header mark reserves fixed dimensions against layout shift");
excludes(footerBlock, '<LevioMark size="md" priority', "Footer mark is not unnecessarily high priority");

includes(processBlock, 'data-home-assembly-trigger="section"', "Process section uses a later section trigger");
includes(capabilityBlock, 'data-home-assembly-trigger="section"', "Capabilities section uses a later section trigger");
includes(controller, "observeAtVisualLine(sectionGroups, useMobileCards ? 0.62 : 0.66)", "Section headings activate in the central visual zone");
check(
  "Desktop section cards retain group-level activation",
  css.includes("@media (min-width: 561px)") && motionCss.includes('[data-home-assembly-trigger="section"][data-home-assembly-state="pending"] :is(.minimal-home__process-card, .minimal-home__capability-card)'),
  "Desktop cards must assemble as section groups.",
);
includes(processBlock, 'data-home-mobile-card="process"', "Process cards opt into mobile per-card activation");
includes(capabilityBlock, 'data-home-mobile-card="capability"', "Capability cards opt into mobile per-card activation");
includes(controller, 'const MOBILE_CARD_SELECTOR = "[data-home-mobile-card]"', "Controller queries one mobile-card target set");
includes(controller, "observeAtVisualLine(mobileCards, 0.68)", "One shared observer call watches all mobile cards near eye level");
check(
  "Controller creates observers through one shared constructor path",
  (controller.match(/new IntersectionObserver/g) ?? []).length === 1,
  "Observer creation must stay centralized rather than per card.",
);
includes(phoneCss, '[data-home-mobile-card][data-home-assembly-state="pending"]', "Mobile cards own individual pending states");
includes(phoneCss, '[data-home-mobile-card][data-home-assembly-state="assembled"]', "Mobile cards own individual assembled states");
includes(phoneCss, '[data-home-mobile-card][data-home-assembly-state="settled"]', "Mobile cards own individual stable states");

includes(finalBlock, 'data-home-assembly-trigger="final-cta"', "Final CTA owns a dedicated late trigger");
includes(controller, "observeAtVisualLine(finalCtaGroups, 0.72)", "Final CTA activates only after meaningful viewport entry");
includes(motionCss, '[data-home-assembly-group="final-cta"][data-home-assembly-state="pending"]', "Final CTA has a bounded pending state");
includes(motionCss, "transform: translate3d(var(--home-assembly-distance), 0, 0)", "Final CTA enters right-to-left");
excludes(finalBlock, "data-home-assembly-item", "Final CTA avoids competing child assembly transforms");
includes(motionCss, "pointer-events: none", "Pending moving surfaces cannot retain overlay hit areas");
includes(motionCss, "pointer-events: auto", "Settled surfaces restore interactions");

includes(controller, "const activatedTargets = new WeakSet<HTMLElement>()", "Activation registry is monotonic");
includes(controller, "activatedTargets.add(target)", "Every activation permanently records completion");
includes(controller, "unobserve(target)", "Activated targets leave observation");
excludes(controller, 'setAssemblyState(target, "pending")\n', "Activation flow never reverses a target to pending");
excludes(controller, ".style.transform", "Controller never maps scroll position to transforms");
excludes(controller, "scrollProgress", "Continuous scroll progress mapping is absent");
excludes(motionCss, "animation-timeline", "Homepage has no scroll timeline");
excludes(motionCss, "scroll-timeline", "Homepage has no scroll timeline alias");
check(
  "All assembled and settled motion states clear transforms",
  (motionCss.match(/transform: none;/g) ?? []).length >= 8,
  "Motion destinations must use final layout geometry.",
);
includes(motionCss, "will-change: auto", "Settled states release compositor hints");

includes(reducedCss, "transition-delay: 0ms !important", "Reduced motion removes all stagger");
includes(reducedCss, "opacity: 1 !important", "Reduced motion exposes all content");
includes(reducedCss, "transform: none !important", "Reduced motion renders final geometry");
includes(reducedCss, "pointer-events: auto !important", "Reduced motion restores interactions");
includes(reducedCss, "will-change: auto !important", "Reduced motion releases compositor hints");

includes(home, "Levio analiza la situación, identifica la información relevante, compara escenarios, evalúa riesgos y organiza criterios de decisión.", "Process section uses approved AI-neutral copy");
includes(simulator, "Vista previa determinista · Respuestas de ejemplo · Máx.", "Simulator status uses approved AI-neutral copy");
includes(simulator, "Simulación demostrativa con respuestas de ejemplo.", "Simulator result uses approved AI-neutral copy");
for (const phrase of ["asistente de IA", "IA real", "conexión con IA", "preview demostrativo"]) {
  excludes(publicHomepageSurface, phrase, `Public homepage removes prohibited phrase: ${phrase}`);
}

includes(simulator, "MAX_SIMULATION_INPUT_LENGTH = 1200", "Simulator keeps the 1200-character boundary");
includes(simulator, "safeRender !== true", "Simulator keeps safeRender validation");
includes(simulator, "mockOnly !== true", "Simulator keeps mockOnly validation");
includes(simulator, "apiReady !== true", "Simulator keeps apiReady validation");
includes(simulator, 'aria-label="Simular decisión"', "Simulator submit accessibility name remains");
includes(simulateRoute, "mockOnly: true", "Public runtime remains deterministic and mock-only");
includes(css, "overflow: clip", "Homepage clips horizontal assembly overflow");
excludes(css, "overflow-x: auto", "Mobile navigation creates no horizontal scrolling");
includes(home, 'className="minimal-home__header-login" href="/login"', "Login remains a bounded direct header link");
excludes(navigation, "Iniciar sesión", "Login has no duplicate navigation overlay");
check(
  "Public client surface has no OpenAI transport",
  !/from\s+["']openai["']|api\.openai\.com|responses\.create|openai-synthetic-risk-adapter\.server/.test(publicHomepageSurface),
  "OpenAI transport leaked into public homepage code.",
);
includes(packageJson, '"quality:homepage-motion-stabilization"', "Dedicated motion/copy gate remains registered");

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.name}${item.passed ? "" : ` - ${item.issue}`}`);
}

const failed = checks.filter((item) => !item.passed);
console.log(`\nHomepage Safari preview/first-paint gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
