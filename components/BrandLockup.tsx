import Link from "next/link";
import type { ReactNode } from "react";
import LevioMark from "./LevioMark";

type BrandLockupProps = {
  ariaLabel?: string;
  className?: string;
  mark?: ReactNode;
  markSize?: "sm" | "md" | "lg";
  nameClassName?: string;
  priority?: boolean;
};

export default function BrandLockup({
  ariaLabel,
  className = "",
  mark,
  markSize = "md",
  nameClassName,
  priority = false,
}: BrandLockupProps) {
  const classes = [className, "brand-lockup"].filter(Boolean).join(" ");

  return (
    <Link aria-label={ariaLabel} className={classes} href="/">
      {mark ?? <LevioMark size={markSize} priority={priority} />}
      <span className={nameClassName}>levio.es</span>
    </Link>
  );
}
