"use server";

import { buildAuthRedirectUrl, readAuthRuntimeConfig } from "./config";
import { sanitizeRedirectPath } from "./redirects";

export async function prepareEmailOtpAuthRedirect(input: {
  nextPath?: string;
}) {
  const config = readAuthRuntimeConfig();

  if (config.status === "disabled") {
    return {
      status: "blocked" as const,
      reason: config.reason.code,
      message: "Auth Runtime is not configured for email access.",
    };
  }

  const nextPath = sanitizeRedirectPath(input.nextPath ?? "/dashboard", "/dashboard");

  try {
    return {
      status: "ready" as const,
      emailRedirectTo: buildAuthRedirectUrl("/auth/callback", nextPath),
      nextPath,
    };
  } catch {
    return {
      status: "blocked" as const,
      reason: "auth_config_missing" as const,
      message: "Auth redirect configuration is not approved.",
    };
  }
}
