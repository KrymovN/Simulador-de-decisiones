import { type NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectPath } from "../redirects";
import { createSupabaseRouteHandlerClient } from "./server";

export async function handleSupabaseAuthCallback(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error") || requestUrl.searchParams.get("error_code");
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"), "/dashboard");

  if (providerError) {
    return NextResponse.redirect(new URL("/login?auth_error=provider_error", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?auth_error=callback_missing_code", request.url));
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const supabase = createSupabaseRouteHandlerClient(request, response);

  if (!supabase) {
    return NextResponse.redirect(new URL("/login?auth_error=auth_config_missing", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?auth_error=callback_exchange_failed", request.url));
  }

  return response;
}
