import { type NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectPath } from "../redirects";
import type { LevioAuthErrorCode } from "../types";
import { createSupabaseRouteHandlerClient } from "./server";

function classifyCallbackFailure(value: string | null | undefined): LevioAuthErrorCode | null {
  const normalized = value?.toLowerCase() ?? "";

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes("expired") ||
    normalized.includes("otp_expired") ||
    normalized.includes("token_expired") ||
    normalized.includes("flow_state_not_found")
  ) {
    return "callback_expired";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("denied") ||
    normalized.includes("access_denied") ||
    normalized.includes("unauthorized")
  ) {
    return "callback_cancelled";
  }

  if (
    normalized.includes("invalid") ||
    normalized.includes("malformed") ||
    normalized.includes("replay") ||
    normalized.includes("token") ||
    normalized.includes("code_verifier") ||
    normalized.includes("bad_code") ||
    normalized.includes("pkce")
  ) {
    return "callback_invalid";
  }

  return null;
}

function authErrorRedirect(request: NextRequest, code: LevioAuthErrorCode) {
  return NextResponse.redirect(new URL(`/login?auth_error=${code}`, request.url));
}

export async function handleSupabaseAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");
  const providerErrorCode = requestUrl.searchParams.get("error_code");
  const providerErrorDescription = requestUrl.searchParams.get("error_description");
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard");

  if (providerError || providerErrorCode || providerErrorDescription) {
    const classifiedError = classifyCallbackFailure(
      `${providerError ?? ""} ${providerErrorCode ?? ""} ${providerErrorDescription ?? ""}`,
    );

    return authErrorRedirect(request, classifiedError ?? "provider_error");
  }

  if (!code) {
    return authErrorRedirect(request, "callback_missing_code");
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const supabase = createSupabaseRouteHandlerClient(request, response);

  if (!supabase) {
    return authErrorRedirect(request, "auth_config_missing");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return authErrorRedirect(request, classifyCallbackFailure(error.message) ?? "callback_exchange_failed");
  }

  return response;
}
