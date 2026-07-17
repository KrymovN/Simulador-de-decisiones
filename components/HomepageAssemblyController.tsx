"use client";

import { useEffect } from "react";

const GROUP_SELECTOR = "[data-home-assembly-group]";
const PREVIEW_SELECTOR = '[data-home-assembly-trigger="preview"]';
const PROCESS_SECTION_SELECTOR = '[data-home-assembly-group="process-section"]';
const CAPABILITY_SECTION_SELECTOR = '[data-home-assembly-group="capabilities-section"]';
const FINAL_CTA_SELECTOR = '[data-home-assembly-trigger="final-cta"]';
const MOBILE_CARD_SELECTOR = "[data-home-mobile-card]";
const MOBILE_CARD_BREAKPOINT = "(max-width: 560px)";
const DEFAULT_SETTLE_MS = 1000;
const PREVIEW_ACTIVATION_RATIO = 0.62;
const PROCESS_ACTIVATION_RATIO = 0.6;
const PROCESS_ACTIVATION_RATIO_MOBILE = 0.58;
const MOBILE_CARD_ACTIVATION_RATIO = 0.68;
const PREVIEW_SCROLL_NOISE_TOLERANCE = 2;
const PREVIEW_MIN_SCROLL_Y = 24;

type AssemblyState = "pending" | "assembled" | "settled";

function setAssemblyState(target: HTMLElement, state: AssemblyState) {
  target.dataset.homeAssemblyState = state;
}

function visualViewportMetrics() {
  const viewport = window.visualViewport;
  return {
    height: viewport?.height ?? window.innerHeight,
    top: viewport?.offsetTop ?? 0,
  };
}

function centralRootMargin(activationRatio: number) {
  const viewport = visualViewportMetrics();
  const activationLine = viewport.top + viewport.height * activationRatio;
  const bottomInset = Math.max(0, Math.round(window.innerHeight - activationLine));
  return `0px 0px -${bottomInset}px 0px`;
}

function isAtVisualActivationLine(target: HTMLElement, activationRatio: number) {
  const viewport = visualViewportMetrics();
  const activationLine = viewport.top + viewport.height * activationRatio;
  const bounds = target.getBoundingClientRect();
  return bounds.top <= activationLine && bounds.bottom > viewport.top;
}

export default function HomepageAssemblyController() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".minimal-home");
    if (!shell) return;

    const groups = Array.from(shell.querySelectorAll<HTMLElement>(GROUP_SELECTOR));
    const previewGroups = Array.from(shell.querySelectorAll<HTMLElement>(PREVIEW_SELECTOR));
    const processGroups = Array.from(shell.querySelectorAll<HTMLElement>(PROCESS_SECTION_SELECTOR));
    const capabilityGroups = Array.from(shell.querySelectorAll<HTMLElement>(CAPABILITY_SECTION_SELECTOR));
    const finalCtaGroups = Array.from(shell.querySelectorAll<HTMLElement>(FINAL_CTA_SELECTOR));
    const mobileCards = Array.from(shell.querySelectorAll<HTMLElement>(MOBILE_CARD_SELECTOR));
    const processMobileCards = mobileCards.filter((card) => card.dataset.homeMobileCard === "process");
    const allTargets = [...groups, ...mobileCards];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileCardsEnabled = window.matchMedia(MOBILE_CARD_BREAKPOINT);
    const activatedTargets = new WeakSet<HTMLElement>();
    const settledTargets = new WeakSet<HTMLElement>();
    const targetObservers = new Map<HTMLElement, IntersectionObserver>();
    const settleTimers = new Map<HTMLElement, number>();
    const assemblyFrames = new Map<HTMLElement, number>();
    const observers = new Set<IntersectionObserver>();
    let rebuildFrame = 0;
    let previewScrollFrame = 0;
    let previousValidScrollY = Math.max(0, window.scrollY);
    let previewDownwardArmed = false;
    let reevaluateVisibleProcessCards = () => {};

    shell.classList.add("home-assembly-enabled");

    const unobserve = (target: HTMLElement) => {
      targetObservers.get(target)?.unobserve(target);
      targetObservers.delete(target);
    };

    const settle = (target: HTMLElement) => {
      const timer = settleTimers.get(target);
      if (timer) window.clearTimeout(timer);
      const frame = assemblyFrames.get(target);
      if (frame) window.cancelAnimationFrame(frame);
      settleTimers.delete(target);
      assemblyFrames.delete(target);
      activatedTargets.add(target);
      settledTargets.add(target);
      unobserve(target);
      setAssemblyState(target, "settled");
      if (target.matches(PROCESS_SECTION_SELECTOR)) reevaluateVisibleProcessCards();
    };

    const requestedSettleTime = (target: HTMLElement) => {
      const rawValue = mobileCardsEnabled.matches
        ? target.dataset.homeAssemblySettleMobileMs ?? target.dataset.homeAssemblySettleMs
        : target.dataset.homeAssemblySettleMs;
      const parsedValue = Number(rawValue);
      return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_SETTLE_MS;
    };

    const assemble = (target: HTMLElement, immediately = false) => {
      if (activatedTargets.has(target)) return;
      if (immediately || reducedMotion.matches) {
        settle(target);
        return;
      }

      activatedTargets.add(target);
      unobserve(target);
      const commitAssembly = () => {
        assemblyFrames.delete(target);
        if (reducedMotion.matches) {
          settle(target);
          return;
        }
        setAssemblyState(target, "assembled");
        settleTimers.set(
          target,
          window.setTimeout(() => settle(target), requestedSettleTime(target)),
        );
      };

      const scheduleCommit = (framesRemaining: number) => {
        const frame = window.requestAnimationFrame(() => {
          assemblyFrames.delete(target);
          if (framesRemaining > 1) {
            scheduleCommit(framesRemaining - 1);
            return;
          }
          commitAssembly();
        });
        assemblyFrames.set(target, frame);
      };

      const needsSeparatedPendingPaint = target.matches(PREVIEW_SELECTOR)
        || target.matches(PROCESS_SECTION_SELECTOR);
      scheduleCommit(needsSeparatedPendingPaint ? 2 : 1);
    };

    const disconnectObservers = () => {
      observers.forEach((observer) => observer.disconnect());
      observers.clear();
      targetObservers.clear();
    };

    const observeAtVisualLine = (
      targets: HTMLElement[],
      activationRatio: number,
      canAssemble: (target: HTMLElement) => boolean = () => true,
    ) => {
      const pendingTargets = targets.filter((target) => !activatedTargets.has(target));
      if (pendingTargets.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;
            if (entry.isIntersecting && canAssemble(target)) assemble(target);
          });
        },
        {
          rootMargin: centralRootMargin(activationRatio),
          threshold: 0.01,
        },
      );
      observers.add(observer);
      pendingTargets.forEach((target) => {
        targetObservers.set(target, observer);
        observer.observe(target);
      });
    };

    const settleRestoredPreview = (currentScrollY: number) => {
      if (currentScrollY < PREVIEW_MIN_SCROLL_Y) return;
      const visualTop = visualViewportMetrics().top;
      previewGroups.forEach((target) => {
        if (!activatedTargets.has(target) && target.getBoundingClientRect().bottom <= visualTop) {
          settle(target);
        }
      });
    };

    const processPreviewScroll = () => {
      previewScrollFrame = 0;
      const currentScrollY = window.scrollY;
      if (!Number.isFinite(currentScrollY) || currentScrollY < 0) return;

      const downwardDelta = currentScrollY - previousValidScrollY;
      if (Math.abs(downwardDelta) > PREVIEW_SCROLL_NOISE_TOLERANCE) {
        previousValidScrollY = currentScrollY;
      }
      settleRestoredPreview(currentScrollY);

      const genuineDownwardScroll = currentScrollY >= PREVIEW_MIN_SCROLL_Y
        && downwardDelta > PREVIEW_SCROLL_NOISE_TOLERANCE;
      if (genuineDownwardScroll) previewDownwardArmed = true;
      if (!previewDownwardArmed || !genuineDownwardScroll) return;

      previewGroups.forEach((target) => {
        if (
          !activatedTargets.has(target)
          && isAtVisualActivationLine(target, PREVIEW_ACTIVATION_RATIO)
        ) {
          assemble(target);
        }
      });
    };

    const handlePreviewScroll = () => {
      if (previewScrollFrame) return;
      previewScrollFrame = window.requestAnimationFrame(processPreviewScroll);
    };

    const settleTargetsAboveViewport = (targets: HTMLElement[]) => {
      const visualTop = visualViewportMetrics().top;
      targets.forEach((target) => {
        if (!activatedTargets.has(target) && target.getBoundingClientRect().bottom <= visualTop) {
          settle(target);
        }
      });
    };

    const processNarrativeIsSettled = () => processGroups.every(
      (target) => settledTargets.has(target),
    );

    const canAssembleMobileCard = (target: HTMLElement) => (
      target.dataset.homeMobileCard !== "process" || processNarrativeIsSettled()
    );

    reevaluateVisibleProcessCards = () => {
      if (!mobileCardsEnabled.matches || !processNarrativeIsSettled()) return;
      const visualTop = visualViewportMetrics().top;
      processMobileCards.forEach((card) => {
        if (activatedTargets.has(card)) return;
        if (card.getBoundingClientRect().bottom <= visualTop) {
          settle(card);
        } else if (isAtVisualActivationLine(card, MOBILE_CARD_ACTIVATION_RATIO)) {
          assemble(card);
        }
      });
    };

    const configureObservers = () => {
      disconnectObservers();

      if (reducedMotion.matches || !("IntersectionObserver" in window)) {
        allTargets.forEach((target) => settle(target));
        return;
      }

      const useMobileCards = mobileCardsEnabled.matches;
      mobileCards.forEach((card) => {
        if (useMobileCards) {
          if (!activatedTargets.has(card)) setAssemblyState(card, "pending");
        } else {
          delete card.dataset.homeAssemblyState;
        }
      });

      settleTargetsAboveViewport(groups);
      if (useMobileCards) settleTargetsAboveViewport(mobileCards);

      observeAtVisualLine(
        processGroups,
        useMobileCards ? PROCESS_ACTIVATION_RATIO_MOBILE : PROCESS_ACTIVATION_RATIO,
      );
      observeAtVisualLine(capabilityGroups, useMobileCards ? 0.62 : 0.66);
      observeAtVisualLine(finalCtaGroups, 0.72);
      if (useMobileCards) {
        observeAtVisualLine(mobileCards, MOBILE_CARD_ACTIVATION_RATIO, canAssembleMobileCard);
      }
    };

    const scheduleObserverRebuild = () => {
      if (rebuildFrame) return;
      rebuildFrame = window.requestAnimationFrame(() => {
        rebuildFrame = 0;
        configureObservers();
      });
    };

    groups.forEach((group) => setAssemblyState(group, "pending"));
    configureObservers();
    window.addEventListener("scroll", handlePreviewScroll, { passive: true });

    const handleReducedMotionChange = () => {
      if (reducedMotion.matches) {
        disconnectObservers();
        allTargets.forEach((target) => settle(target));
      } else {
        configureObservers();
      }
    };

    reducedMotion.addEventListener("change", handleReducedMotionChange);
    mobileCardsEnabled.addEventListener("change", scheduleObserverRebuild);
    window.addEventListener("resize", scheduleObserverRebuild, { passive: true });

    return () => {
      if (rebuildFrame) window.cancelAnimationFrame(rebuildFrame);
      if (previewScrollFrame) window.cancelAnimationFrame(previewScrollFrame);
      disconnectObservers();
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      assemblyFrames.forEach((frame) => window.cancelAnimationFrame(frame));
      settleTimers.clear();
      assemblyFrames.clear();
      reducedMotion.removeEventListener("change", handleReducedMotionChange);
      mobileCardsEnabled.removeEventListener("change", scheduleObserverRebuild);
      window.removeEventListener("scroll", handlePreviewScroll);
      window.removeEventListener("resize", scheduleObserverRebuild);
      shell.classList.remove("home-assembly-enabled");
    };
  }, []);

  return null;
}
