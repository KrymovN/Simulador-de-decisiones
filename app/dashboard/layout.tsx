import type { ReactNode } from "react";
import { DashboardAccountProvider } from "../../components/dashboard/DashboardAccountProvider";
import { buildDashboardAccountState } from "../../lib/auth/dashboard-account";
import { requireAuthenticatedDashboardSession } from "../../lib/auth/guards";

export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await requireAuthenticatedDashboardSession("/dashboard");
  const account = buildDashboardAccountState(session);

  return (
    <DashboardAccountProvider account={account}>
      {children}
    </DashboardAccountProvider>
  );
}
