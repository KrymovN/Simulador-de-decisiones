"use client";

import { useEffect } from "react";

const GROUP_SELECTOR = "[data-home-assembly-group]";
const ITEM_SELECTOR = "[data-home-assembly-item]";
const FIRST_SCROLL_SELECTOR = '[data-home-assembly-trigger="first-scroll"]';
const ASSEMBLY_DURATION_MS = 620;
const ASSEMBLY_STAGGER_MS = 82;

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
    const completedGroups = new WeakSet<HTMLElement>();
    const settleTimers = new Map<HTMLElement, number>();
    let observer: IntersectionObserver | null = null;
    let scrollTimer = 0;
    let previousScrollY = window.scrollY;

    shell.classList.add("home-assembly-enabled");

    groups.forEach((group) => {
      group.querySelectorAll<HTMLElement>(ITEM_SELECTOR).forEach((item, index) => {
        item.style.setProperty("--home-assembly-order", item.dataset.homeAssemblyOrder ?? String(index));
      });
    });

    const settle = (group: HTMLElement) => {
      const timer = settleTimers.get(group);
      if (timer) window.clearTimeout(timer);
      settleTimers.delete(group);
      completedGroups.add(group);
      observer?.unobserve(group);
      setAssemblyState(group, "settled");
    };

    const assemble = (group: HTMLElement, immediately = false) => {
      if (completedGroups.has(group)) return;
      if (immediately || reducedMotion.matches) {
        settle(group);
        return;
      }

      completedGroups.add(group);
      observer?.unobserve(group);
      setAssemblyState(group, "assembled");

      const itemCount = group.querySelectorAll(ITEM_SELECTOR).length;
      const settleAfter = ASSEMBLY_DURATION_MS + Math.max(0, itemCount - 1) * ASSEMBLY_STAGGER_MS + 100;
      settleTimers.set(group, window.setTimeout(() => settle(group), settleAfter));
    };

    const advanceReachedGroups = (settleVisibleGroups = false) => {
      const revealLine = window.innerHeight * 0.82;
      groups.forEach((group) => {
        if (completedGroups.has(group)) return;
        const rect = group.getBoundingClientRect();
        if (rect.bottom < 0) {
          settle(group);
          return;
        }
        if (group.matches(FIRST_SCROLL_SELECTOR) || rect.top > revealLine) return;
        if (settleVisibleGroups) settle(group);
        else assemble(group);
      });
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
      advanceReachedGroups(true);
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const group = entry.target as HTMLElement;
            if (entry.isIntersecting && !group.matches(FIRST_SCROLL_SELECTOR)) assemble(group);
          });
        },
        { rootMargin: "0px 0px -18% 0px", threshold: 0.08 },
      );

      groups.forEach((group) => {
        if (!group.matches(FIRST_SCROLL_SELECTOR) && !completedGroups.has(group)) observer?.observe(group);
      });
    } else {
      groups.filter((group) => !group.matches(FIRST_SCROLL_SELECTOR)).forEach((group) => settle(group));
    }

    const handleScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = 0;
        const currentScrollY = window.scrollY;
        if (currentScrollY > previousScrollY && currentScrollY > 16) {
          firstScrollGroups.forEach((group) => assemble(group));
        }
        advanceReachedGroups();
        previousScrollY = currentScrollY;
      }, 16);
    };

    const handleReducedMotionChange = () => {
      if (!reducedMotion.matches) return;
      observer?.disconnect();
      groups.forEach((group) => settle(group));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    reducedMotion.addEventListener("change", handleReducedMotionChange);

    return () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      observer?.disconnect();
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      settleTimers.clear();
      window.removeEventListener("scroll", handleScroll);
      reducedMotion.removeEventListener("change", handleReducedMotionChange);
      shell.classList.remove("home-assembly-enabled");
    };
  }, []);

  return null;
}
