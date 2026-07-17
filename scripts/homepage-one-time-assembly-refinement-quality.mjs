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
const processNarrativeCss = blockBetween(
  motionCss,
  '.minimal-home.home-assembly-enabled [data-home-assembly-group="process-section"] [data-home-process-narrative]',
  ".minimal-home.home-assembly-enabled .minimal-home__process-card",
);
const tabletCss = blockBetween(css, "@media (max-width: 860px)", "@media (max-width: 560px)");
const phoneCss = blockBetween(css, "@media (max-width: 560px)", "@media (prefers-reduced-motion: reduce)");
const phoneProcessNarrativeCss = blockBetween(
  phoneCss,
  '.minimal-home.home-assembly-enabled [data-home-assembly-group="process-section"][data-home-assembly-state="pending"] [data-home-process-narrative]',
  '.minimal-home.home-assembly-enabled [data-home-mobile-card][data-home-assembly-state="pending"]',
);
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
includes(controller, "const PREVIEW_ACTIVATION_RATIO = 0.62", "Preview activates in the useful visual viewport zone");
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
includes(css, "--home-preview-duration: 900ms", "Desktop preview uses a readable bounded duration");
includes(css, "--home-preview-stagger: 120ms", "Preview uses a calm readable stagger");
includes(css, "--home-preview-distance: 64px", "Desktop preview travel is visibly distinct from settled geometry");
includes(css, "--home-preview-ease: cubic-bezier(0.4, 0, 0.2, 1)", "Preview avoids the former front-loaded easing");
includes(previewMotionCss, "opacity: 0.3", "Desktop preview is visibly pending before activation");
includes(phoneCss, "--home-preview-duration: 820ms", "Mobile preview uses a bounded readable duration");
includes(phoneCss, "--home-preview-stagger: 100ms", "Mobile preview preserves a readable stagger");
includes(phoneCss, "--home-preview-distance: 44px", "Mobile preview travel remains visible and viewport-safe");
includes(phoneCss, "opacity: 0.34", "Mobile preview is visibly pending while remaining readable");
includes(css, "font-size: 0.86rem", "Preview phrases have a stronger desktop content hierarchy");
includes(phoneCss, "font-size: 0.84rem", "Preview phrases remain balanced on narrow iPhone widths");
includes(previewMotionCss, "transform: translate3d(var(--home-preview-distance), 0, 0)", "Preview retains the shared right-to-left direction");
includes(previewMotionCss, "opacity var(--home-preview-duration) var(--home-preview-ease)", "Preview opacity uses the dedicated restrained timing");
includes(previewMotionCss, "transform var(--home-preview-duration) var(--home-preview-ease)", "Preview travel uses the dedicated restrained timing");
includes(previewMotionCss, "--motion-delay: 0ms", "Preview first phrase starts without arbitrary latency");
includes(previewMotionCss, "--motion-delay: 120ms", "Preview second phrase owns the intended stagger");
includes(previewMotionCss, "--motion-delay: 240ms", "Preview third phrase owns the intended stagger");
excludes(previewMotionCss, "cubic-bezier(0.22, 1, 0.36, 1)", "Preview no longer uses the front-loaded assembly easing");
includes(previewBlock, 'data-home-assembly-settle-ms="1200"', "Desktop settle timer covers the full preview sequence");
includes(previewBlock, 'data-home-assembly-settle-mobile-ms="1080"', "Mobile settle timer covers the full preview sequence");
includes(controller, "needsSeparatedPendingPaint ? 2 : 1", "Preview and process narrative receive a painted pending frame before assembly");

includes(headerBlock, '<LevioMark size="lg" priority />', "Above-the-fold header mark requests priority loading");
includes(mark, "priority?: boolean", "Levio mark exposes a bounded priority option");
includes(mark, "priority={priority}", "Levio mark forwards Next/Image priority semantics");
includes(mark, 'src="/levio-reference-mark.png"', "Exact approved ring asset remains in use");
includes(css, ".minimal-home .levio-mark {\n  background: transparent", "Homepage mark has no opaque black first-paint placeholder");
includes(css, ".minimal-home .levio-mark-lg {\n  width: 38px;\n  height: 38px", "Header mark reserves fixed dimensions against layout shift");
excludes(footerBlock, '<LevioMark size="md" priority', "Footer mark is not unnecessarily high priority");

includes(processBlock, 'data-home-assembly-trigger="section"', "Process section uses a later section trigger");
includes(capabilityBlock, 'data-home-assembly-trigger="section"', "Capabilities section uses a later section trigger");
includes(processBlock, "data-home-process-narrative", "Process heading and subtitle form one narrative group");
check(
  "Process narrative owns exactly two staged items",
  (processBlock.match(/data-home-process-narrative-item/g) ?? []).length === 2,
  "Heading and subtitle must be the only narrative items.",
);
includes(controller, "const PROCESS_ACTIVATION_RATIO = 0.6", "Desktop process narrative activates in the useful central zone");
includes(controller, "const PROCESS_ACTIVATION_RATIO_MOBILE = 0.58", "Mobile process narrative activates later at eye level");
includes(controller, "observeAtVisualLine(capabilityGroups, useMobileCards ? 0.62 : 0.66)", "Capability activation semantics remain unchanged");
includes(css, "--home-process-narrative-duration: 980ms", "Desktop process narrative has a readable bounded duration");
includes(css, "--home-process-narrative-stagger: 130ms", "Desktop subtitle follows the heading with controlled stagger");
includes(css, "--home-process-narrative-distance: 72px", "Desktop process narrative visibly arrives from the right");
includes(tabletCss, "--home-process-narrative-duration: 900ms", "Tablet process narrative avoids the former short responsive profile");
includes(tabletCss, "--home-process-narrative-distance: 56px", "Tablet process narrative retains perceptible travel");
includes(phoneCss, "--home-process-mobile-spatial-distance: 40px", "Mobile narrative wrapper uses viewport-safe spatial travel");
includes(phoneCss, "--home-process-mobile-spatial-duration: 1040ms", "Mobile wrapper has a Safari-readable spatial duration");
includes(phoneCss, "--home-process-mobile-opacity-duration: 820ms", "Mobile text opacity has a bounded independent duration");
includes(phoneCss, "--home-process-mobile-subtitle-delay: 130ms", "Mobile subtitle follows through a controlled opacity delay");
includes(phoneCss, "--home-process-mobile-ease: cubic-bezier(0.33, 0, 0.67, 1)", "Mobile narrative uses a symmetric non-front-loaded easing");
includes(phoneProcessNarrativeCss, "transform: translate3d(var(--home-process-mobile-spatial-distance), 0, 0)", "Only the mobile narrative wrapper owns spatial travel");
includes(phoneProcessNarrativeCss, "transition: transform var(--home-process-mobile-spatial-duration) var(--home-process-mobile-ease)", "Mobile wrapper owns the single spatial transition");
check(
  "Mobile process narrative has exactly one spatial start transform",
  (phoneProcessNarrativeCss.match(/translate3d\(/g) ?? []).length === 1,
  "Heading and subtitle must not own competing spatial translations.",
);
includes(phoneProcessNarrativeCss, '[data-home-process-narrative-item] {\n    opacity: 0.24;\n    transform: none;', "Mobile heading uses opacity without a child transform");
includes(phoneProcessNarrativeCss, '[data-home-process-narrative-item]:is(p) {\n    opacity: 0.16;', "Mobile subtitle owns a readable pending opacity");
includes(phoneProcessNarrativeCss, "transition: opacity var(--home-process-mobile-opacity-duration) var(--home-process-mobile-ease)", "Mobile child text animates opacity only");
includes(phoneProcessNarrativeCss, "transition-delay: var(--home-process-mobile-subtitle-delay)", "Mobile subtitle delay is applied without a second spatial layer");
includes(processNarrativeCss, "opacity: 0.14", "Process narrative does not look settled before activation");
includes(processNarrativeCss, "transform: translate3d(var(--home-process-narrative-distance), 0, 0)", "Process narrative uses one right-to-left vector");
includes(processNarrativeCss, "transition-delay: var(--home-process-narrative-delay)", "Heading and subtitle share one controlled transition grammar");
includes(processNarrativeCss, "transform: none", "Process narrative clears fractional transforms after assembly");
includes(processNarrativeCss, "will-change: auto", "Settled process narrative releases compositor hints");
includes(processBlock, 'data-home-assembly-settle-ms="2280"', "Desktop process settle covers narrative then existing cards");
includes(processBlock, 'data-home-assembly-settle-mobile-ms="1120"', "Mobile process settle covers the single wrapper transition");
includes(css, "--home-process-cards-phase-delay: calc(var(--home-process-narrative-duration) + 80ms)", "Desktop process cards wait for the narrative group");
includes(controller, "processNarrativeIsSettled()", "Mobile process cards wait for narrative completion");
includes(controller, "const PROCESS_MOBILE_HANDOFF_DELAY_MS = 90", "Mobile card queue starts after an explicit narrative handoff");
includes(controller, "const PROCESS_MOBILE_CARD_LAUNCH_GAP_MS = 210", "Mobile process cards use a readable sequential launch gap");
includes(controller, 'target.matches(PROCESS_SECTION_SELECTOR)) scheduleProcessCardHandoff()', "Narrative settle schedules the bounded handoff instead of releasing cards immediately");
excludes(controller, 'target.matches(PROCESS_SECTION_SELECTOR)) reevaluateVisibleProcessCards()', "Narrative settle never starts multiple eligible cards in the same callback");
includes(controller, 'target.dataset.homeProcessCardQueue = "handoff"', "Process section exposes the explicit handoff state");
includes(controller, 'target.dataset.homeProcessCardQueue = "armed"', "Process queue exposes its armed state for runtime evidence");
includes(controller, "processCardQueue.sort", "Eligible process cards are ordered before launch");
includes(controller, "processCardOrder.get(left)", "Queue sorting follows canonical DOM order");
includes(controller, "processCardLaunchTimer = window.setTimeout", "Only one queued process card launches before the next gap");
includes(controller, "enqueueProcessCards(eligibleProcessCards)", "Fast-scroll batches enter the sequential process queue");
includes(controller, "|| (processNarrativeIsSettled() && processCardQueueArmed)", "Process cards require both narrative settle and armed handoff");
includes(controller, "if (processNarrativeIsSettled()) {\n          scheduleProcessCardHandoff();", "Responsive rebuild preserves the narrative-to-card handoff");
check(
  "Desktop section cards retain group-level activation",
  css.includes("@media (min-width: 561px)") && motionCss.includes('[data-home-assembly-trigger="section"][data-home-assembly-state="pending"] :is(.minimal-home__process-card, .minimal-home__capability-card)'),
  "Desktop cards must assemble as section groups.",
);
includes(processBlock, 'data-home-mobile-card="process"', "Process cards opt into mobile per-card activation");
includes(capabilityBlock, 'data-home-mobile-card="capability"', "Capability cards opt into mobile per-card activation");
includes(controller, 'const MOBILE_CARD_SELECTOR = "[data-home-mobile-card]"', "Controller queries one mobile-card target set");
includes(controller, "handleEligibleMobileCards,", "One shared mobile observer routes process entries through the queue");
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
includes(controller, 'target.dataset.homeProcessCardQueue = "settled"', "Reduced motion arms no delayed visual queue");
includes(controller, "processCardQueue = [];\n        queuedProcessCards.clear();\n        processCardQueueArmed = true;", "Reduced motion clears queued launches before exposing final state");

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
console.log(`\nHomepage mobile narrative/card handoff gate: ${checks.length - failed.length}/${checks.length} passed.`);
if (failed.length > 0) process.exitCode = 1;
