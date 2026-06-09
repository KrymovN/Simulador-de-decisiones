"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

type HomepageAnchorLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: `#${string}`;
};

export default function HomepageAnchorLink({
  children,
  href,
  onClick,
  ...props
}: HomepageAnchorLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = document.querySelector<HTMLElement>(href);

    if (!target) {
      return;
    }

    event.preventDefault();

    const section = target.closest<HTMLElement>("section");
    section?.classList.add("anchor-reveal-synced");
    window.history.pushState(null, "", href);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: href === "#decision-input" ? "center" : "start",
    });
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
