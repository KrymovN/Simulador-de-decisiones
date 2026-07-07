"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserAuthClient } from "../../lib/auth/supabase/client";
import type { LevioIdentityState } from "../../lib/auth/types";

type AuthRuntimeClientState = {
  identityState: LevioIdentityState;
  email?: string;
  error?: string;
};

type AuthRuntimeContextValue = AuthRuntimeClientState & {
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthRuntimeContext = createContext<AuthRuntimeContextValue | null>(null);

function mapUserToState(user: User | null): AuthRuntimeClientState {
  if (!user) {
    return { identityState: "signed_out" };
  }

  return {
    identityState: "authenticated",
    email: user.email ?? undefined,
  };
}

export function AuthRuntimeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthRuntimeClientState>({ identityState: "anonymous" });
  const supabase = useMemo(() => createSupabaseBrowserAuthClient(), []);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      setState({
        identityState: "signed_out",
        error: "auth_config_missing",
      });
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      setState({
        identityState: "auth_error",
        error: "session_invalid",
      });
      return;
    }

    setState(mapUserToState(user));
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Logout must remain idempotent from the product UI perspective.
      }
    }

    setState({ identityState: "signed_out" });
  }, [supabase]);

  useEffect(() => {
    void refreshSession();

    if (!supabase) {
      return undefined;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });

    return () => subscription.unsubscribe();
  }, [refreshSession, supabase]);

  const value = useMemo<AuthRuntimeContextValue>(
    () => ({
      ...state,
      refreshSession,
      signOut,
    }),
    [refreshSession, signOut, state],
  );

  return <AuthRuntimeContext.Provider value={value}>{children}</AuthRuntimeContext.Provider>;
}

export function useAuthRuntime() {
  const context = useContext(AuthRuntimeContext);

  if (!context) {
    throw new Error("useAuthRuntime must be used inside AuthRuntimeProvider.");
  }

  return context;
}
