"use client";

import Link from "next/link";
import { useAuthRuntime } from "./auth/AuthRuntimeProvider";

export default function HomepageAccountLink() {
  const { identityState } = useAuthRuntime();
  const accountDestination =
    identityState === "authenticated"
      ? { href: "/dashboard", label: "Mi espacio" }
      : { href: "/login", label: "Iniciar sesión" };

  return (
    <Link className="minimal-home__header-login" href={accountDestination.href}>
      {accountDestination.label}
    </Link>
  );
}
