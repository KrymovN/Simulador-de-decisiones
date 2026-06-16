import { readAuthRuntimeConfig } from "./config";
import { normalizeRegisteredUserSession } from "./identity";
import { createSupabaseServerClient } from "./supabase/server";
import type { LevioAuthRuntimeContext } from "./types";

export async function readServerAuthSession(): Promise<LevioAuthRuntimeContext> {
  const config = readAuthRuntimeConfig();

  if (config.status === "disabled") {
    return {
      identityState: "signed_out",
      error: config.reason,
    };
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return {
      identityState: "signed_out",
      error: {
        code: "auth_config_missing",
        message: "Supabase auth runtime configuration is missing.",
      },
    };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return {
      identityState: "signed_out",
      error: {
        code: sessionError ? "session_invalid" : "session_missing",
        message: sessionError?.message ?? "No authenticated Supabase session is available.",
      },
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      identityState: "signed_out",
      error: {
        code: "session_invalid",
        message: userError?.message ?? "Supabase user validation failed.",
      },
    };
  }

  const normalized = normalizeRegisteredUserSession(session, user);

  if (normalized.sessionStatus === "expired") {
    return {
      identityState: "signed_out",
      error: {
        code: "session_expired",
        message: "The authenticated session has expired.",
      },
    };
  }

  return normalized;
}

export async function readClientVisibleAuthState() {
  const context = await readServerAuthSession();

  if (context.identityState === "signed_out") {
    return {
      identityState: context.identityState,
      error: context.error,
    };
  }

  return {
    identityState: context.identityState,
    principalType: context.principal.principalType,
    email: context.principal.email,
    sessionStatus: context.sessionStatus,
    assuranceLevel: context.assuranceLevel,
    expiresAt: context.expiresAt,
  };
}
