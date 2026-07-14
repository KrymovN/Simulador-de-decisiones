"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HomepageAnchorLink from "./HomepageAnchorLink";

const homepageNavigation = [
  { label: "Inicio", href: "#inicio" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Criterios", href: "#criterios" },
  { label: "Simulador", href: "#simulador" },
] as const;

type HomepageNavigationHref = (typeof homepageNavigation)[number]["href"];

export default function HomepageNavigation() {
  const [activeHref, setActiveHref] = useState<HomepageNavigationHref>("#inicio");

  useEffect(() => {
    let frame = 0;

    function updateActiveSection() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const headerHeight = document.querySelector<HTMLElement>(".reference-header")?.offsetHeight ?? 0;
        const activationLine = headerHeight + 36;
        let nextActive: HomepageNavigationHref = homepageNavigation[0].href;

        for (const item of homepageNavigation) {
          const section = document.querySelector<HTMLElement>(item.href);
          if (section && section.getBoundingClientRect().top <= activationLine) {
            nextActive = item.href;
          }
        }

        setActiveHref(nextActive);
      });
    }

    function restoreHistoryAnchor() {
      const target = document.querySelector<HTMLElement>(window.location.hash);

      if (!target) {
        updateActiveSection();
        return;
      }

      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "auto", block: "start" });
        updateActiveSection();
      });
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);
    window.addEventListener("popstate", restoreHistoryAnchor);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
      window.removeEventListener("popstate", restoreHistoryAnchor);
    };
  }, []);

  return (
    <nav className="site-nav reference-nav" aria-label="Acceso principal">
      {homepageNavigation.map((item) => (
        <HomepageAnchorLink
          aria-current={activeHref === item.href ? "page" : undefined}
          className={activeHref === item.href ? "nav-active" : undefined}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </HomepageAnchorLink>
      ))}
      <Link className="nav-cta" href="/login">
        Iniciar sesión
      </Link>
    </nav>
  );
}
