"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DashboardAccountState } from "../../lib/auth/dashboard-account";

type DashboardAccountContextValue = {
  account: DashboardAccountState;
};

const DashboardAccountContext = createContext<DashboardAccountContextValue | null>(null);

export function DashboardAccountProvider({
  account,
  children,
}: {
  account: DashboardAccountState;
  children: ReactNode;
}) {
  return (
    <DashboardAccountContext.Provider value={{ account }}>
      {children}
    </DashboardAccountContext.Provider>
  );
}

export function useDashboardAccount() {
  const context = useContext(DashboardAccountContext);

  if (!context) {
    throw new Error("useDashboardAccount must be used inside DashboardAccountProvider.");
  }

  return context;
}
