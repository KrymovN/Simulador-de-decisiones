import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const simulator = readFileSync(join(rootDir, "components", "HomeSimulator.tsx"), "utf8");
const controller = readFileSync(
  join(rootDir, "components", "home-simulator-processing.ts"),
  "utf8",
);
const simulatorCss = readFileSync(join(rootDir, "app", "styles", "simulator.css"), "utf8");
const homepageCss = readFileSync(join(rootDir, "app", "styles", "homepage.css"), "utf8");

const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, condition: Boolean(condition), detail });
}

function includes(source, value, name) {
  check(name, source.includes(value), `Expected source to include: ${value}`);
}

function excludes(source, value, name) {
  check(name, !source.includes(value), `Expected source to exclude: ${value}`);
}

function ordered(source, values, name) {
  let cursor = -1;
  const valid = values.every((value) => {
    const next = source.indexOf(value, cursor + 1);
    if (next < 0) {
      return false;
    }
    cursor = next;
    return true;
  });
  check(name, valid, `Expected ordered values: ${values.join(" -> ")}`);
}

ordered(
  controller,
  [
    '"Comprendiendo la situación"',
    '"Detectando variables críticas"',
    '"Simulando escenarios"',
    '"Evaluando riesgos y beneficios"',
    '"Preparando marco de decisión"',
  ],
  "Processing stages retain exact 01-05 order",
);
for (const phase of [
  "idle",
  "preparing",
  "step-active",
  "step-completing",
  "result-reveal",
  "complete",
]) {
  includes(controller, `| "${phase}"`, `Explicit state machine includes ${phase}`);
}
includes(simulator, "runProcessingSequence(", "HomeSimulator uses one sequential scheduler");
includes(simulator, "for (let index = 0; index < PROCESSING_STAGE_TITLES.length", "Scheduler walks stages once in DOM order");
includes(simulator, 'phase: "step-active", stepIndex: index', "Scheduler activates exactly the current indexed step");
includes(simulator, 'phase: "step-completing", stepIndex: index', "Scheduler explicitly completes the current step");
includes(simulator, "await waitForProcessingFrame(controller)", "Next activation is separated by an animation frame");
includes(simulator, "await waitForProcessingDelay(controller, activeDwell)", "Every active step has bounded reading time");
includes(simulator, "await waitForProcessingDelay(controller, completingHandoff)", "Every step has an explicit completion handoff");
includes(simulator, "await waitForProcessingDelay(controller, nextStepGap)", "Every next step has a bounded inter-step gap");
check(
  "Nominal five-stage sequence remains within calm short-demo range",
  /activeDwell:\s*680/.test(controller) &&
    /completingHandoff:\s*420/.test(controller) &&
    /nextStepGap:\s*80/.test(controller),
);

includes(simulator, "textareaRef.current?.blur()", "Submit blurs the active textarea before preparation");
includes(simulator, 'phase: "preparing"', "Processing panel renders in neutral preparing state");
ordered(
  simulator,
  [
    'emitProcessingTrace("processing-container-ready")',
    "await waitForMobileViewportStability(controller)",
    'setProcessingState({ phase: "step-active", stepIndex: index',
  ],
  "Step 01 starts only after panel paint and viewport stabilization",
);
includes(controller, "minimumObservationTime = 240", "Viewport stability uses a bounded observation floor");
includes(controller, "requiredStableFrames = 6", "Viewport stability requires consecutive stable frames");
includes(controller, "fallbackTime = 960", "Viewport stability has a bounded fallback");
includes(controller, "window.visualViewport", "Safe preparation reads Safari visualViewport");

excludes(simulator, "scrollIntoView(", "HomeSimulator no longer uses browser-defined scrollIntoView");
includes(controller, 'window.matchMedia("(max-width: 640px)")', "Auto-follow is mobile-scoped");
includes(controller, "alreadyVisible", "Safe corridor skips scroll for visible cards");
includes(controller, "safeTop", "Safe corridor defines a protected upper boundary");
includes(controller, "safeBottom", "Safe corridor defines a protected Safari-toolbar boundary");
includes(simulator, '"preparation"', "Preparation can place the complete compact panel before step 01");
includes(controller, 'targetKind === "preparation"', "Compact mobile panel is positioned in one preparation scroll");
includes(controller, "panelRect.height <= safeBottom - safeTop", "Whole-panel preparation is limited to panels that fit the safe corridor");
includes(controller, "targetRect.bottom - safeBottom + 16", "Auto-follow computes only the required forward distance");
includes(controller, "Math.min(targetY, boundaryBottom - safeBottom)", "Stage auto-follow is clamped to the processing boundary");
includes(controller, "easeInOutSine", "Bounded RAF scroll uses calm deterministic easing");
includes(controller, "duration = Math.min(620, Math.max(420", "Auto-follow duration stays bounded");
includes(controller, 'behavior: "auto"', "RAF controller owns interpolation without native smooth-scroll overlap");
includes(controller, 'pageRoot.classList.add("home-simulator-auto-follow")', "RAF scroll temporarily neutralizes inherited smooth scrolling");
includes(controller, 'pageRoot.classList.remove("home-simulator-auto-follow")', "RAF scroll always releases its scroll-behavior lock");
includes(simulatorCss, "html.home-simulator-auto-follow", "Scroll-behavior lock is explicitly Safari-safe");
includes(controller, 'window.addEventListener("touchstart"', "Touch interaction cancels auto-follow");
includes(controller, 'window.addEventListener("wheel"', "Wheel interaction cancels auto-follow");
includes(controller, 'window.addEventListener("pointerdown"', "Pointer interaction cancels auto-follow");
includes(controller, "userInterruptedAutoFollow", "Manual interruption suppresses later auto-follow");
includes(controller, "controller.cancelled", "Every scroll and scheduler path observes cancellation");

ordered(
  simulator,
  [
    'emitProcessingTrace("step-completed-start", { step: index + 1 })',
    "PROCESSING_TIMING.finalResultGap",
    "const simulationResult = await simulationPromise",
    'emitProcessingTrace("result-reveal-start")',
  ],
  "Result reveal begins only after completed step 05 and final gap",
);
check(
  "Result safe-corridor follow is invoked no more than once",
  (simulator.match(/followTargetInsideMobileSafeCorridor\(controller, resultHeading/g) ?? []).length === 1,
);
includes(simulator, 'phase: "result-reveal"', "Result has an explicit reveal phase");
includes(simulator, "resultVisible: false", "Result renders before reveal movement is enabled");
includes(simulator, "resultVisible: true", "Result transitions to its stable visible state");

includes(controller, "pendingTasks", "Timers and RAF callbacks are centrally tracked");
includes(controller, "controller.abortController.abort()", "Sequence cancellation aborts the in-flight request");
includes(controller, "controller.removeInteractionListeners?.()", "Sequence cleanup removes interaction listeners");
includes(simulator, "cancelProcessingRun(processingRunRef.current)", "Unmount cancels the active sequence");
includes(simulator, "if (processingRunRef.current)", "Repeated submit cannot create parallel sequences");
includes(simulator, "disabled={isRunning}", "Submit remains disabled while processing");
includes(simulator, "signal: AbortSignal", "Public request accepts a lifecycle abort signal");
includes(simulator, "signal,", "Fetch is connected to the sequence abort signal");

includes(simulator, 'aria-live="polite"', "Current processing status uses polite live announcements");
includes(simulator, 'aria-current={visualState === "active" ? "step"', "Only active card exposes aria-current step");
includes(simulator, "processingStepAccessibleState", "Card state is exposed independently of color");
includes(simulator, 'role="list"', "Processing panel exposes list semantics");
includes(simulator, 'role="listitem"', "Each processing card exposes listitem semantics");
includes(homepageCss, "@media (prefers-reduced-motion: reduce)", "Homepage keeps a reduced-motion contract");
includes(homepageCss, ".simulation-output.is-result-pending", "Reduced motion keeps result content visible");
includes(controller, '(prefers-reduced-motion: reduce)', "Reduced motion suppresses programmatic auto-follow");

includes(simulatorCss, "420ms cubic-bezier(0.4, 0, 0.2, 1)", "Card transitions use the calm Safari-safe timing curve");
includes(simulatorCss, ".thinking-step.is-completing", "Completing cards have a distinct transition state");
includes(simulatorCss, ".thinking-step.is-completed", "Completed cards remain distinctly readable");
excludes(simulatorCss, "scale(", "Processing visuals do not use scale flashes");
includes(homepageCss, ".minimal-home .thinking-step.is-active", "Homepage active card remains explicit and restrained");
includes(homepageCss, ".minimal-home .thinking-step.is-completed", "Homepage completed card remains readable");
includes(homepageCss, "overflow-anchor: none", "Dynamic result mount cannot trigger browser scroll anchoring");

includes(simulator, "MAX_SIMULATION_INPUT_LENGTH = 1200", "Input limit remains 1200");
includes(simulator, 'fetch("/api/simulate"', "Approved public API route remains unchanged");
includes(simulator, "safeRender !== true", "safeRender validation remains fail-close");
includes(simulator, "mockOnly !== true", "mockOnly validation remains fail-close");
includes(simulator, "apiReady !== true", "apiReady validation remains fail-close");
includes(simulator, "saveCompletedSimulationFromUi", "Save flow remains connected");
excludes(simulator, "OpenAI", "HomeSimulator still has no live provider integration");

const failed = checks.filter((item) => !item.condition);
for (const item of checks) {
  console.log(`${item.condition ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.condition && item.detail) {
    console.log(`  ${item.detail}`);
  }
}

console.log(`\nHomeSimulator processing-sequence quality gate: ${checks.length - failed.length}/${checks.length} passed.`);

if (failed.length > 0) {
  process.exitCode = 1;
}
