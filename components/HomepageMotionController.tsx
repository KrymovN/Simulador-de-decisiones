"use client";

import { useEffect } from "react";

const GROUP_SELECTOR = "[data-home-motion-group]";
const ITEM_SELECTOR = "[data-home-motion-item]";
const MAX_ENHANCED_WIDTH = 1024;

type MotionConfig = {
  distance: string;
  narrativeDuration: string;
  narrativeStagger: string;
  rootMargin: string;
  standardDuration: string;
  standardStagger: string;
};

function getMotionConfig(width: number): MotionConfig {
  if (width <= 480) {
    return {
      distance: "36px",
      narrativeDuration: "820ms",
      narrativeStagger: "145ms",
      rootMargin: "0px 0px -30% 0px",
      standardDuration: "680ms",
      standardStagger: "115ms",
    };
  }

  if (width <= 860) {
    return {
      distance: "34px",
      narrativeDuration: "760ms",
      narrativeStagger: "130ms",
      rootMargin: "0px 0px -26% 0px",
      standardDuration: "650ms",
      standardStagger: "110ms",
    };
  }

  return {
    distance: "30px",
    narrativeDuration: "720ms",
    narrativeStagger: "120ms",
    rootMargin: "0px 0px -22% 0px",
    standardDuration: "620ms",
    standardStagger: "105ms",
  };
}

export default function HomepageMotionController() {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".site-shell");

    if (!shell) {
      return;
    }

    const groups = Array.from(shell.querySelectorAll<HTMLElement>(GROUP_SELECTOR));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealedGroups = new WeakSet<HTMLElement>();
    const settleTimers = new Map<HTMLElement, number>();
    let observer: IntersectionObserver | null = null;
    let resizeFrame = 0;
    let scrollFrame = 0;

    function settleGroup(group: HTMLElement) {
      const timer = settleTimers.get(group);
      if (timer) {
        window.clearTimeout(timer);
        settleTimers.delete(group);
      }
      group.dataset.homeMotionState = "settled";
      revealedGroups.add(group);
      observer?.unobserve(group);
    }

    function revealGroup(group: HTMLElement, immediate = false) {
      if (immediate) {
        settleGroup(group);
        return;
      }

      group.dataset.homeMotionState = "visible";
      revealedGroups.add(group);
      observer?.unobserve(group);

      const items = Array.from(group.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
      const duration = Number.parseFloat(group.style.getPropertyValue("--home-motion-group-duration")) || 680;
      const stagger = Number.parseFloat(group.style.getPropertyValue("--home-motion-group-stagger")) || 115;
      const totalDuration = duration + Math.max(0, items.length - 1) * stagger + 100;
      const timer = window.setTimeout(() => settleGroup(group), totalDuration);
      settleTimers.set(group, timer);
    }

    function prepareGroup(group: HTMLElement, config: MotionConfig) {
      const items = Array.from(group.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
      const narrative = group.dataset.homeMotionProfile === "narrative";

      group.style.setProperty(
        "--home-motion-group-duration",
        narrative ? config.narrativeDuration : config.standardDuration,
      );
      group.style.setProperty(
        "--home-motion-group-stagger",
        narrative ? config.narrativeStagger : config.standardStagger,
      );

      items.forEach((item, index) => {
        const direction = item.dataset.homeMotionDirection ?? "rise";
        item.style.setProperty("--home-motion-order", String(index));
        item.style.setProperty(
          "--home-motion-x",
          direction === "left" ? `-${config.distance}` : direction === "right" ? config.distance : "0px",
        );
        item.style.setProperty("--home-motion-y", direction === "rise" ? config.distance : "8px");
      });

      const rect = group.getBoundingClientRect();
      const restoredPastGroup = window.scrollY > 0 && rect.top <= window.innerHeight * 0.62;

      if (revealedGroups.has(group) || restoredPastGroup) {
        settleGroup(group);
      } else {
        group.dataset.homeMotionState = "pending";
      }
    }

    function clearObserver() {
      observer?.disconnect();
      observer = null;
    }

    function configureMotion() {
      clearObserver();
      shell.classList.remove("home-motion-enhanced", "home-motion-reduced");

      if (reducedMotion.matches) {
        shell.classList.add("home-motion-reduced");
        groups.forEach((group) => settleGroup(group));
        return;
      }

      if (window.innerWidth > MAX_ENHANCED_WIDTH) {
        groups.forEach((group) => {
          delete group.dataset.homeMotionState;
        });
        return;
      }

      if (!("IntersectionObserver" in window)) {
        groups.forEach((group) => settleGroup(group));
        return;
      }

      const config = getMotionConfig(window.innerWidth);
      shell.style.setProperty("--home-motion-distance", config.distance);
      groups.forEach((group) => prepareGroup(group, config));
      shell.classList.add("home-motion-enhanced");

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.boundingClientRect.top < 0) {
              revealGroup(entry.target as HTMLElement, true);
            } else if (entry.isIntersecting) {
              revealGroup(entry.target as HTMLElement);
            }
          });
        },
        {
          root: null,
          rootMargin: config.rootMargin,
          threshold: [0, 0.08],
        },
      );

      groups.forEach((group) => {
        if (group.dataset.homeMotionState === "pending") {
          observer?.observe(group);
        }
      });
    }

    function finalizeSkippedGroups() {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        groups.forEach((group) => {
          if (
            group.dataset.homeMotionState === "pending" &&
            group.getBoundingClientRect().bottom < 0
          ) {
            revealGroup(group, true);
          }
        });
      });
    }

    function handleResize() {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(configureMotion);
    }

    function restoreVisibleState() {
      requestAnimationFrame(() => {
        groups.forEach((group) => {
          if (group.getBoundingClientRect().top <= window.innerHeight * 0.62) {
            revealGroup(group, true);
          }
        });
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        restoreVisibleState();
      }
    }

    configureMotion();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", finalizeSkippedGroups, { passive: true });
    window.addEventListener("pageshow", restoreVisibleState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.addEventListener("change", configureMotion);

    return () => {
      clearObserver();
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(scrollFrame);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      settleTimers.clear();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", finalizeSkippedGroups);
      window.removeEventListener("pageshow", restoreVisibleState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotion.removeEventListener("change", configureMotion);
      shell.classList.remove("home-motion-enhanced", "home-motion-reduced");
      shell.style.removeProperty("--home-motion-distance");
      groups.forEach((group) => {
        group.style.removeProperty("--home-motion-group-duration");
        group.style.removeProperty("--home-motion-group-stagger");
      });
    };
  }, []);

  return null;
}
