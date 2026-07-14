"use client";

import { useEffect } from "react";

const GROUP_SELECTOR = "[data-home-motion-group]";
const ITEM_SELECTOR = "[data-home-motion-item]";
const MAX_ENHANCED_WIDTH = 1024;

type MotionConfig = {
  distance: string;
  duration: string;
  rootMargin: string;
  stagger: string;
};

function getMotionConfig(width: number): MotionConfig {
  if (width <= 480) {
    return {
      distance: "18px",
      duration: "520ms",
      rootMargin: "0px 0px -16% 0px",
      stagger: "90ms",
    };
  }

  if (width <= 860) {
    return {
      distance: "22px",
      duration: "560ms",
      rootMargin: "0px 0px -18% 0px",
      stagger: "105ms",
    };
  }

  return {
    distance: "24px",
    duration: "600ms",
    rootMargin: "0px 0px -20% 0px",
    stagger: "115ms",
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
    let observer: IntersectionObserver | null = null;
    let resizeFrame = 0;
    let scrollFrame = 0;

    function revealGroup(group: HTMLElement) {
      group.dataset.homeMotionState = "visible";
      revealedGroups.add(group);
      observer?.unobserve(group);
    }

    function prepareGroup(group: HTMLElement) {
      const items = Array.from(group.querySelectorAll<HTMLElement>(ITEM_SELECTOR));

      items.forEach((item, index) => {
        item.style.setProperty("--home-motion-order", String(index));
      });

      const rect = group.getBoundingClientRect();
      const alreadyReached = rect.top <= window.innerHeight * 0.9;

      if (revealedGroups.has(group) || alreadyReached) {
        revealGroup(group);
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
        groups.forEach(revealGroup);
        return;
      }

      if (window.innerWidth > MAX_ENHANCED_WIDTH) {
        groups.forEach((group) => {
          delete group.dataset.homeMotionState;
        });
        return;
      }

      if (!("IntersectionObserver" in window)) {
        groups.forEach(revealGroup);
        return;
      }

      const config = getMotionConfig(window.innerWidth);
      shell.style.setProperty("--home-motion-distance", config.distance);
      shell.style.setProperty("--home-motion-duration", config.duration);
      shell.style.setProperty("--home-motion-stagger", config.stagger);
      groups.forEach(prepareGroup);
      shell.classList.add("home-motion-enhanced");

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
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
            revealGroup(group);
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
          if (group.getBoundingClientRect().top <= window.innerHeight * 0.9) {
            revealGroup(group);
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
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", finalizeSkippedGroups);
      window.removeEventListener("pageshow", restoreVisibleState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotion.removeEventListener("change", configureMotion);
      shell.classList.remove("home-motion-enhanced", "home-motion-reduced");
      shell.style.removeProperty("--home-motion-distance");
      shell.style.removeProperty("--home-motion-duration");
      shell.style.removeProperty("--home-motion-stagger");
    };
  }, []);

  return null;
}
