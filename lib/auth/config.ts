import type { AuthRuntimeConfig, LevioAuthError } from "./types";
import { sanitizeRedirectPath } from "./redirects";

const DEFAULT_APP_URL = "http://localhost:3000";

function isDisabledFlag(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "0" || normalized === "false" || normalized === "off";
}

function splitAllowlist(value: string | undefined, appUrl: string) {
  const entries = value
    ? value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

  return Array.from(new Set([appUrl, ...entries]));
}

function disabledConfig(error: LevioAuthError): AuthRuntimeConfig {
  const appUrl = process.env.LEVIO_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_APP_URL;

  return {
    status: "disabled",
    provider: "supabase",
    reason: error,
    appUrl,
    redirectAllowlist: splitAllowlist(process.env.LEVIO_AUTH_REDIRECT_ALLOWLIST, appUrl),
  };
}

export function readAuthRuntimeConfig(): AuthRuntimeConfig {
  const appUrl = process.env.LEVIO_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const provider = process.env.LEVIO_AUTH_PROVIDER || "supabase";

  if (isDisabledFlag(process.env.LEVIO_AUTH_RUNTIME_ENABLED)) {
    return disabledConfig({
      code: "auth_runtime_disabled",
      message: "Levio auth runtime is disabled by configuration.",
    });
  }

  if (provider !== "supabase") {
    return disabledConfig({
      code: "provider_error",
      message: "Unsupported auth provider configured for Levio auth runtime.",
    });
  }

  try {
    new URL(appUrl);
    if (supabaseUrl) {
      new URL(supabaseUrl);
    }
  } catch {
    return disabledConfig({
      code: "auth_config_missing",
      message: "Auth runtime URL configuration is invalid.",
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return disabledConfig({
      code: "auth_config_missing",
      message: "Supabase auth runtime configuration is missing.",
    });
  }

  return {
    status: "enabled",
    provider: "supabase",
    supabaseUrl,
    supabaseAnonKey,
    appUrl,
    redirectAllowlist: splitAllowlist(process.env.LEVIO_AUTH_REDIRECT_ALLOWLIST, appUrl),
  };
}

export function readBrowserAuthRuntimeConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    if (supabaseUrl) {
      new URL(supabaseUrl);
    }
  } catch {
    return {
      status: "disabled" as const,
      provider: "supabase" as const,
      reason: {
        code: "auth_config_missing" as const,
        message: "Supabase auth runtime URL configuration is invalid.",
      },
    };
  }

  if (!supabaseUrl || !supabaseAnonKey || isDisabledFlag(process.env.NEXT_PUBLIC_LEVIO_AUTH_RUNTIME_ENABLED)) {
    return {
      status: "disabled" as const,
      provider: "supabase" as const,
      reason: {
        code: "auth_config_missing" as const,
        message: "Supabase auth runtime configuration is missing.",
      },
    };
  }

  return {
    status: "enabled" as const,
    provider: "supabase" as const,
    supabaseUrl,
    supabaseAnonKey,
  };
}

function originFromUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function redirectOriginAllowed(config: AuthRuntimeConfig, origin: string) {
  return config.redirectAllowlist
    .map(originFromUrl)
    .filter((value): value is string => Boolean(value))
    .includes(origin);
}

export function buildAuthRedirectUrl(pathname = "/auth/callback", nextPath = "/dashboard") {
  const config = readAuthRuntimeConfig();

  if (config.status === "disabled") {
    throw new Error("Auth Runtime is not enabled for redirect construction.");
  }

  const appOrigin = originFromUrl(config.appUrl);

  if (!appOrigin || !redirectOriginAllowed(config, appOrigin)) {
    throw new Error("Auth redirect origin is not approved by Levio auth config.");
  }

  if (pathname !== "/auth/callback") {
    throw new Error("Auth callback route is not approved by Levio auth config.");
  }

  const redirectUrl = new URL(pathname, appOrigin);
  redirectUrl.searchParams.set("next", sanitizeRedirectPath(nextPath, "/dashboard"));

  return redirectUrl.toString();
}

export { sanitizeRedirectPath };
