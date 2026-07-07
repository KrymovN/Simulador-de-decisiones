import { readAuthRuntimeConfig } from "./config";
import { normalizeRegisteredUserSession } from "./identity";
import { createSupabaseServerClient } from "./supabase/server";
import type { LevioAuthError, LevioAuthErrorCode, LevioAuthRuntimeContext } from "./types";

function classifySessionFailure(value: string | undefined, fallback: LevioAuthErrorCode): LevioAuthErrorCode {
  const normalized = value?.toLowerCase() ?? "";

  if (!normalized) {
    return fallback;
  }

  if (normalized.includes("expired") || normalized.includes("jwt expired")) {
    return "session_expired";
  }

  if (
    normalized.includes("revoked") ||
    normalized.includes("refresh_token_not_found") ||
    normalized.includes("session_not_found") ||
    normalized.includes("invalid refresh token")
  ) {
    return "session_revoked";
  }

  return fallback;
}

function buildSessionError(code: LevioAuthErrorCode): LevioAuthError {
  const messages: Record<LevioAuthErrorCode, string> = {
    auth_runtime_disabled: "Levio auth runtime is disabled by configuration.",
    auth_config_missing: "Supabase auth runtime configuration is missing.",
    session_missing: "No authenticated Supabase session is available.",
    session_invalid: "Authenticated session validation failed.",
    session_expired: "The authenticated session has expired.",
    session_revoked: "The authenticated session is no longer active.",
    callback_missing_code: "The auth callback did not include a valid code.",
    callback_invalid: "The auth callback code is invalid.",
    callback_expired: "The auth callback code has expired.",
    callback_cancelled: "The auth callback was cancelled.",
    callback_exchange_failed: "The auth callback code could not be exchanged.",
    provider_error: "The auth provider rejected the request.",
  };

  return {
    code,
    message: messages[code],
  };
}

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
    const code = sessionError
      ? classifySessionFailure(sessionError.message, "session_invalid")
      : "session_missing";

    return {
      identityState: "signed_out",
      error: buildSessionError(code),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const code = userError
      ? classifySessionFailure(userError.message, "session_invalid")
      : "session_invalid";

    return {
      identityState: "signed_out",
      error: buildSessionError(code),
    };
  }

  const normalized = normalizeRegisteredUserSession(session, user);

  if (normalized.sessionStatus === "expired") {
    return {
      identityState: "signed_out",
      error: buildSessionError("session_expired"),
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
