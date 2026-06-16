import type { ReactNode } from "react";
import { requireAuthenticatedDashboardSession } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireAuthenticatedDashboardSession("/dashboard");

  return children;
}
