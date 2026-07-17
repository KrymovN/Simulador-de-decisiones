export const PROCESSING_STAGE_TITLES = [
  "Comprendiendo la situación",
  "Detectando variables críticas",
  "Simulando escenarios",
  "Evaluando riesgos y beneficios",
  "Preparando marco de decisión",
] as const;

export type ProcessingPhase =
  | "idle"
  | "preparing"
  | "step-active"
  | "step-completing"
  | "result-reveal"
  | "complete";

export type ProcessingState = {
  phase: ProcessingPhase;
  stepIndex: number;
  resultVisible: boolean;
};

export const IDLE_PROCESSING_STATE: ProcessingState = {
  phase: "idle",
  stepIndex: -1,
  resultVisible: false,
};

export const PROCESSING_TIMING = {
  activeDwell: 680,
  completingHandoff: 420,
  nextStepGap: 80,
  finalResultGap: 180,
  resultReveal: 460,
  reducedActiveDwell: 360,
  reducedCompletingHandoff: 140,
  reducedNextStepGap: 50,
} as const;

type CancelPendingTask = () => void;

export type ProcessingRunController = {
  id: number;
  abortController: AbortController;
  cancelled: boolean;
  userInterruptedAutoFollow: boolean;
  pendingTasks: Set<CancelPendingTask>;
  removeInteractionListeners: (() => void) | null;
};

export type AutoFollowResult = {
  performed: boolean;
  alreadyVisible: boolean;
  cancelled: boolean;
  distance: number;
};

type ProcessingTraceDetail = Record<string, string | number | boolean>;

export function emitProcessingTrace(event: string, detail: ProcessingTraceDetail = {}) {
  const traceDetail = {
    event,
    timestamp: performance.now(),
    ...detail,
  };

  window.dispatchEvent(
    new CustomEvent("levio:processing-trace", {
      detail: traceDetail,
    }),
  );
}

export function createProcessingRunController(id: number): ProcessingRunController {
  const controller: ProcessingRunController = {
    id,
    abortController: new AbortController(),
    cancelled: false,
    userInterruptedAutoFollow: false,
    pendingTasks: new Set(),
    removeInteractionListeners: null,
  };

  const cancelAutoFollow = () => {
    controller.userInterruptedAutoFollow = true;
    emitProcessingTrace("auto-follow-cancelled", { reason: "manual-interaction" });
  };
  const cancelFromKeyboard = (event: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
      cancelAutoFollow();
    }
  };

  window.addEventListener("touchstart", cancelAutoFollow, { passive: true });
  window.addEventListener("touchmove", cancelAutoFollow, { passive: true });
  window.addEventListener("wheel", cancelAutoFollow, { passive: true });
  window.addEventListener("pointerdown", cancelAutoFollow, { passive: true });
  window.addEventListener("keydown", cancelFromKeyboard);

  controller.removeInteractionListeners = () => {
    window.removeEventListener("touchstart", cancelAutoFollow);
    window.removeEventListener("touchmove", cancelAutoFollow);
    window.removeEventListener("wheel", cancelAutoFollow);
    window.removeEventListener("pointerdown", cancelAutoFollow);
    window.removeEventListener("keydown", cancelFromKeyboard);
  };

  return controller;
}

export function cancelProcessingRun(controller: ProcessingRunController | null) {
  if (!controller || controller.cancelled) {
    return;
  }

  controller.cancelled = true;
  controller.abortController.abort();
  controller.removeInteractionListeners?.();
  controller.removeInteractionListeners = null;
  document.documentElement.classList.remove("home-simulator-auto-follow");
  Array.from(controller.pendingTasks).forEach((cancel) => cancel());
  controller.pendingTasks.clear();
}

export function releaseProcessingRun(controller: ProcessingRunController) {
  controller.removeInteractionListeners?.();
  controller.removeInteractionListeners = null;
}

export function waitForProcessingDelay(controller: ProcessingRunController, delay: number) {
  return new Promise<boolean>((resolve) => {
    if (controller.cancelled) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (completed: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      controller.pendingTasks.delete(cancel);
      resolve(completed && !controller.cancelled);
    };
    const cancel = () => finish(false);
    const timer = window.setTimeout(() => finish(true), delay);
    controller.pendingTasks.add(cancel);
  });
}

export function waitForProcessingFrame(controller: ProcessingRunController) {
  return new Promise<boolean>((resolve) => {
    if (controller.cancelled) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (completed: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      window.cancelAnimationFrame(frame);
      controller.pendingTasks.delete(cancel);
      resolve(completed && !controller.cancelled);
    };
    const cancel = () => finish(false);
    const frame = window.requestAnimationFrame(() => finish(true));
    controller.pendingTasks.add(cancel);
  });
}

function isMobileProcessingViewport() {
  return window.matchMedia("(max-width: 640px)").matches ||
    (window.visualViewport?.width ?? window.innerWidth) <= 640;
}

function readVisualViewport() {
  const viewport = window.visualViewport;

  return {
    height: viewport?.height ?? window.innerHeight,
    offsetTop: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth,
  };
}

export async function waitForMobileViewportStability(controller: ProcessingRunController) {
  if (!isMobileProcessingViewport()) {
    emitProcessingTrace("viewport-stable", { mobile: false, elapsed: 0 });
    return true;
  }

  const startedAt = performance.now();
  const minimumObservationTime = 240;
  const fallbackTime = 960;
  const requiredStableFrames = 6;
  let stableFrames = 0;
  let previous = readVisualViewport();

  while (!controller.cancelled && performance.now() - startedAt < fallbackTime) {
    if (!(await waitForProcessingFrame(controller))) {
      return false;
    }

    const current = readVisualViewport();
    const significantChange =
      Math.abs(current.height - previous.height) > 1 ||
      Math.abs(current.offsetTop - previous.offsetTop) > 1 ||
      Math.abs(current.width - previous.width) > 1;

    stableFrames = significantChange ? 0 : stableFrames + 1;
    previous = current;

    if (
      performance.now() - startedAt >= minimumObservationTime &&
      stableFrames >= requiredStableFrames
    ) {
      emitProcessingTrace("viewport-stable", {
        mobile: true,
        elapsed: Math.round(performance.now() - startedAt),
        height: Math.round(current.height),
        offsetTop: Math.round(current.offsetTop),
      });
      return true;
    }
  }

  if (!controller.cancelled) {
    const current = readVisualViewport();
    emitProcessingTrace("viewport-stable", {
      mobile: true,
      fallback: true,
      elapsed: Math.round(performance.now() - startedAt),
      height: Math.round(current.height),
      offsetTop: Math.round(current.offsetTop),
    });
  }

  return !controller.cancelled;
}

function easeInOutSine(progress: number) {
  return -(Math.cos(Math.PI * progress) - 1) / 2;
}

export async function followTargetInsideMobileSafeCorridor(
  controller: ProcessingRunController,
  target: HTMLElement | null,
  boundary: HTMLElement | null,
  targetKind: "preparation" | "step" | "result",
): Promise<AutoFollowResult> {
  const noScroll: AutoFollowResult = {
    performed: false,
    alreadyVisible: false,
    cancelled: false,
    distance: 0,
  };

  if (
    !target ||
    controller.cancelled ||
    controller.userInterruptedAutoFollow ||
    !isMobileProcessingViewport() ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return {
      ...noScroll,
      cancelled: controller.cancelled || controller.userInterruptedAutoFollow,
    };
  }

  const viewport = readVisualViewport();
  const safeTop = viewport.offsetTop + 84;
  const safeBottom = viewport.offsetTop + viewport.height - 104;
  let targetRect = target.getBoundingClientRect();
  if (targetKind === "preparation" && boundary) {
    const panelRect = boundary.getBoundingClientRect();
    if (panelRect.height <= safeBottom - safeTop) {
      target = boundary;
      targetRect = panelRect;
    }
  }
  const alreadyVisible = targetRect.top >= safeTop && targetRect.bottom <= safeBottom;

  emitProcessingTrace("auto-follow-check", {
    target: targetKind,
    alreadyVisible,
    targetTop: Math.round(targetRect.top),
    targetBottom: Math.round(targetRect.bottom),
    safeTop: Math.round(safeTop),
    safeBottom: Math.round(safeBottom),
  });

  if (alreadyVisible || targetRect.bottom <= safeBottom) {
    return { ...noScroll, alreadyVisible: true };
  }

  const startY = window.scrollY;
  const requiredDistance = targetRect.bottom - safeBottom + 16;
  let targetY = startY + requiredDistance;

  if (boundary) {
    const boundaryBottom = startY + boundary.getBoundingClientRect().bottom;
    targetY = Math.min(targetY, boundaryBottom - safeBottom);
  }

  const maximumY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  targetY = Math.min(Math.max(startY, targetY), maximumY);
  const distance = targetY - startY;

  if (distance < 4) {
    return { ...noScroll, alreadyVisible: true };
  }

  const duration = Math.min(620, Math.max(420, 420 + distance * 0.28));
  const startedAt = performance.now();
  const pageRoot = document.documentElement;
  pageRoot.classList.add("home-simulator-auto-follow");
  emitProcessingTrace("auto-follow-start", {
    target: targetKind,
    distance: Math.round(distance),
    duration: Math.round(duration),
  });

  try {
    while (!controller.cancelled && !controller.userInterruptedAutoFollow) {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      window.scrollTo({
        top: startY + distance * easeInOutSine(progress),
        left: 0,
        behavior: "auto",
      });

      if (progress >= 1) {
        emitProcessingTrace("auto-follow-end", {
          target: targetKind,
          distance: Math.round(window.scrollY - startY),
        });
        return {
          performed: true,
          alreadyVisible: false,
          cancelled: false,
          distance: window.scrollY - startY,
        };
      }

      if (!(await waitForProcessingFrame(controller))) {
        break;
      }
    }

    emitProcessingTrace("auto-follow-end", {
      target: targetKind,
      cancelled: true,
      distance: Math.round(window.scrollY - startY),
    });
    return {
      performed: window.scrollY !== startY,
      alreadyVisible: false,
      cancelled: true,
      distance: window.scrollY - startY,
    };
  } finally {
    pageRoot.classList.remove("home-simulator-auto-follow");
  }
}
