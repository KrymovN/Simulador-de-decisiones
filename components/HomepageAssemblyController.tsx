"use client";

import { useEffect } from "react";

const GROUP_SELECTOR = "[data-home-assembly-group]";
const FIRST_SCROLL_SELECTOR = '[data-home-assembly-trigger="first-scroll"]';
const DEFAULT_SETTLE_MS = 1400;
const MOBILE_BREAKPOINT = "(max-width: 860px)";

type AssemblyState = "pending" | "assembled" | "settled";

function setAssemblyState(group: HTMLElement, state: AssemblyState) {
  group.dataset.homeAssemblyState = state;
}

export default function HomepageAssemblyController() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".minimal-home");
    if (!shell) return;

    const groups = Array.from(shell.querySelectorAll<HTMLElement>(GROUP_SELECTOR));
    const firstScrollGroups = Array.from(shell.querySelectorAll<HTMLElement>(FIRST_SCROLL_SELECTOR));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMotion = window.matchMedia(MOBILE_BREAKPOINT);
    const activatedGroups = new WeakSet<HTMLElement>();
    const settleTimers = new Map<HTMLElement, number>();
    const assemblyFrames = new Map<HTMLElement, number>();
    let observer: IntersectionObserver | null = null;
    let scrollFrame = 0;
    let previousScrollY = window.scrollY;

    shell.classList.add("home-assembly-enabled");

    const settle = (group: HTMLElement) => {
      const timer = settleTimers.get(group);
      if (timer) window.clearTimeout(timer);
      const frame = assemblyFrames.get(group);
      if (frame) window.cancelAnimationFrame(frame);
      settleTimers.delete(group);
      assemblyFrames.delete(group);
      activatedGroups.add(group);
      observer?.unobserve(group);
      setAssemblyState(group, "settled");
    };

    const assemble = (group: HTMLElement, immediately = false) => {
      if (activatedGroups.has(group)) return;
      if (immediately || reducedMotion.matches) {
        settle(group);
        return;
      }

      activatedGroups.add(group);
      observer?.unobserve(group);
      const frame = window.requestAnimationFrame(() => {
        assemblyFrames.delete(group);
        if (reducedMotion.matches) {
          settle(group);
          return;
        }
        setAssemblyState(group, "assembled");
        const requestedSettleMs = Number(
          mobileMotion.matches
            ? group.dataset.homeAssemblySettleMobileMs ?? group.dataset.homeAssemblySettleMs
            : group.dataset.homeAssemblySettleMs,
        );
        const settleAfter = Number.isFinite(requestedSettleMs) ? requestedSettleMs : DEFAULT_SETTLE_MS;
        settleTimers.set(group, window.setTimeout(() => settle(group), settleAfter));
      });
      assemblyFrames.set(group, frame);
    };

    if (reducedMotion.matches) {
      groups.forEach((group) => settle(group));
      return () => {
        shell.classList.remove("home-assembly-enabled");
      };
    }

    groups.forEach((group) => setAssemblyState(group, "pending"));

    if (window.scrollY > 16) {
      firstScrollGroups.forEach((group) => settle(group));
      const revealLine = window.innerHeight * 0.82;
      groups.forEach((group) => {
        if (!group.matches(FIRST_SCROLL_SELECTOR) && group.getBoundingClientRect().top <= revealLine) settle(group);
      });
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const group = entry.target as HTMLElement;
            if (entry.isIntersecting && !group.matches(FIRST_SCROLL_SELECTOR)) assemble(group);
          });
        },
        {
          rootMargin: mobileMotion.matches ? "0px 0px -6% 0px" : "0px 0px -14% 0px",
          threshold: 0.04,
        },
      );

      groups.forEach((group) => {
        if (!group.matches(FIRST_SCROLL_SELECTOR) && !activatedGroups.has(group)) observer?.observe(group);
      });
    } else {
      groups.filter((group) => !group.matches(FIRST_SCROLL_SELECTOR)).forEach((group) => settle(group));
    }

    const handleScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const currentScrollY = window.scrollY;
        if (currentScrollY > previousScrollY && currentScrollY > 16) {
          firstScrollGroups.forEach((group) => assemble(group));
        }
        groups.forEach((group) => {
          if (!activatedGroups.has(group) && group.getBoundingClientRect().bottom < 0) settle(group);
        });
        previousScrollY = currentScrollY;
      });
    };

    const handleReducedMotionChange = () => {
      if (!reducedMotion.matches) return;
      observer?.disconnect();
      groups.forEach((group) => settle(group));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    reducedMotion.addEventListener("change", handleReducedMotionChange);

    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      observer?.disconnect();
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      assemblyFrames.forEach((frame) => window.cancelAnimationFrame(frame));
      settleTimers.clear();
      assemblyFrames.clear();
      window.removeEventListener("scroll", handleScroll);
      reducedMotion.removeEventListener("change", handleReducedMotionChange);
      shell.classList.remove("home-assembly-enabled");
    };
  }, []);

  return null;
}
