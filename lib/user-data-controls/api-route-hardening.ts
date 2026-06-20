import type { LevioAuthRuntimeContext } from "../auth/types";
import type { UserDataControlsApiRouteOperation } from "./api-route-foundation";

export const USER_DATA_CONTROLS_API_ROUTE_HARDENING_VERSION =
  "4.3Z-route-hardening-foundation.1" as const;
export const USER_DATA_CONTROLS_API_ROUTE_HARDENING_MODE =
  "route_hardening_foundation_only" as const;

export type UserDataControlsApiRouteHardeningVersion =
  typeof USER_DATA_CONTROLS_API_ROUTE_HARDENING_VERSION;
export type UserDataControlsApiRouteHardeningMode =
  typeof USER_DATA_CONTROLS_API_ROUTE_HARDENING_MODE;

export type UserDataControlsApiRouteHardeningBlockedReason =
  | "route_hardening_unavailable"
  | "rate_limit_exceeded"
  | "abuse_detected"
  | "origin_missing"
  | "origin_invalid"
  | "csrf_failed"
  | "session_revoked";

export type UserDataControlsApiRouteHardeningEvidence = {
  stage: "4.3Z";
  routeHardeningFoundationOnly: true;
  serverSideOnly: true;
  failClosedByDefault: true;
  routeSpecificRateLimiting: true;
  abuseProtectionFoundation: true;
  csrfProtectionFoundation: true;
  originRefererValidationFoundation: true;
  revokedSessionHandlingFoundation: true;
  inMemoryLimiterOnly: true;
  routeEnablementChanged: false;
  publicUiIntegrated: false;
  exportFilesCreated: false;
  deletionWritesEnabled: false;
  openAiIntegrated: false;
  billingIntegrated: false;
  subscriptionsIntegrated: false;
  productBehaviorChanged: false;
  rollback: "disable_LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED_or_disable_hardening_configuration";
};

export type UserDataControlsApiRouteHardeningAllowedResult = {
  status: "allowed";
  evidence: UserDataControlsApiRouteHardeningEvidence;
};

export type UserDataControlsApiRouteHardeningBlockedResult = {
  status: "blocked";
  reason: UserDataControlsApiRouteHardeningBlockedReason;
  message: string;
  evidence: UserDataControlsApiRouteHardeningEvidence;
};

export type UserDataControlsApiRouteHardeningResult =
  | UserDataControlsApiRouteHardeningAllowedResult
  | UserDataControlsApiRouteHardeningBlockedResult;

export type UserDataControlsRateLimitEntry = {
  count: number;
  resetAt: number;
};

export type UserDataControlsRateLimitStore = Map<string, UserDataControlsRateLimitEntry>;

export type UserDataControlsApiRouteHardeningConfig = {
  enabled: boolean;
  allowedOrigins: string[];
  csrfHeaderName?: string;
  csrfCookieName?: string;
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
  maxRequestBytes?: number;
  now?: () => number;
  rateLimitStore?: UserDataControlsRateLimitStore;
};

export type UserDataControlsApiRouteHardeningFoundation = {
  version: UserDataControlsApiRouteHardeningVersion;
  mode: UserDataControlsApiRouteHardeningMode;
  enabled: boolean;
  writesEnabled: false;
  evidence: UserDataControlsApiRouteHardeningEvidence;
  validateRequest(input: {
    operation: UserDataControlsApiRouteOperation;
    request: Request;
  }): UserDataControlsApiRouteHardeningResult;
  validateAuthContext(input: {
    operation: UserDataControlsApiRouteOperation;
    authContext: LevioAuthRuntimeContext;
  }): UserDataControlsApiRouteHardeningResult;
  resetRateLimit(): void;
};

const DEFAULT_CSRF_HEADER = "x-levio-csrf-token";
const DEFAULT_CSRF_COOKIE = "levio_csrf";
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 30;
const DEFAULT_MAX_REQUEST_BYTES = 32_768;
const defaultRateLimitStore: UserDataControlsRateLimitStore = new Map();

function enabledFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function splitOrigins(value: string | undefined): string[] {
  return value
    ? value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeOrigins(values: string[]): string[] {
  const origins = values
    .map(normalizeOrigin)
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(origins));
}

export function readUserDataControlsApiRouteHardeningConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): UserDataControlsApiRouteHardeningConfig {
  const appUrl = env.LEVIO_APP_URL || env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const allowedOrigins = normalizeOrigins([
    appUrl,
    ...splitOrigins(env.LEVIO_USER_DATA_CONTROLS_ALLOWED_ORIGINS),
  ]);

  return {
    enabled: !enabledFlag(env.LEVIO_USER_DATA_CONTROLS_ROUTE_HARDENING_DISABLED),
    allowedOrigins,
    csrfHeaderName: env.LEVIO_USER_DATA_CONTROLS_CSRF_HEADER || DEFAULT_CSRF_HEADER,
    csrfCookieName: env.LEVIO_USER_DATA_CONTROLS_CSRF_COOKIE || DEFAULT_CSRF_COOKIE,
    rateLimitWindowMs: positiveInteger(
      env.LEVIO_USER_DATA_CONTROLS_RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS,
    ),
    rateLimitMaxRequests: positiveInteger(
      env.LEVIO_USER_DATA_CONTROLS_RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    ),
    maxRequestBytes: positiveInteger(
      env.LEVIO_USER_DATA_CONTROLS_MAX_REQUEST_BYTES,
      DEFAULT_MAX_REQUEST_BYTES,
    ),
  };
}

export function userDataControlsApiRouteHardeningEvidence(): UserDataControlsApiRouteHardeningEvidence {
  return {
    stage: "4.3Z",
    routeHardeningFoundationOnly: true,
    serverSideOnly: true,
    failClosedByDefault: true,
    routeSpecificRateLimiting: true,
    abuseProtectionFoundation: true,
    csrfProtectionFoundation: true,
    originRefererValidationFoundation: true,
    revokedSessionHandlingFoundation: true,
    inMemoryLimiterOnly: true,
    routeEnablementChanged: false,
    publicUiIntegrated: false,
    exportFilesCreated: false,
    deletionWritesEnabled: false,
    openAiIntegrated: false,
    billingIntegrated: false,
    subscriptionsIntegrated: false,
    productBehaviorChanged: false,
    rollback:
      "disable_LEVIO_USER_DATA_CONTROLS_API_ROUTES_ENABLED_or_disable_hardening_configuration",
  };
}

function allowed(): UserDataControlsApiRouteHardeningAllowedResult {
  return {
    status: "allowed",
    evidence: userDataControlsApiRouteHardeningEvidence(),
  };
}

function blocked(
  reason: UserDataControlsApiRouteHardeningBlockedReason,
  message: string,
): UserDataControlsApiRouteHardeningBlockedResult {
  return {
    status: "blocked",
    reason,
    message,
    evidence: userDataControlsApiRouteHardeningEvidence(),
  };
}

function readClientAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    if (first?.trim()) {
      return first.trim();
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown-client";
}

function readRequestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");

  if (origin) {
    return normalizeOrigin(origin);
  }

  const referer = request.headers.get("referer");

  if (!referer) {
    return null;
  }

  return normalizeOrigin(referer);
}

function hasOriginHeader(request: Request): boolean {
  return Boolean(request.headers.get("origin") || request.headers.get("referer"));
}

function parseCookieHeader(value: string | null): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    value
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf("=");
        if (separator === -1) {
          return [entry, ""];
        }

        return [
          decodeURIComponent(entry.slice(0, separator).trim()),
          decodeURIComponent(entry.slice(separator + 1).trim()),
        ];
      }),
  );
}

function tokenUsable(value: string | undefined | null): value is string {
  return typeof value === "string" && value.length >= 12 && value.length <= 256;
}

function contentLengthTooLarge(request: Request, maxRequestBytes: number): boolean {
  const raw = request.headers.get("content-length");
  if (!raw) {
    return false;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > maxRequestBytes;
}

function abuseSignalPresent(request: Request): boolean {
  const signal = request.headers.get("x-levio-abuse-signal")?.trim().toLowerCase();
  return signal === "1" || signal === "true" || signal === "detected" || signal === "block";
}

function methodOverridePresent(request: Request): boolean {
  return Boolean(
    request.headers.get("x-http-method-override") ||
      request.headers.get("x-method-override"),
  );
}

export function createUserDataControlsApiRouteHardeningFoundation(
  config: UserDataControlsApiRouteHardeningConfig,
): UserDataControlsApiRouteHardeningFoundation {
  const now = config.now ?? Date.now;
  const store = config.rateLimitStore ?? defaultRateLimitStore;
  const csrfHeaderName = (config.csrfHeaderName ?? DEFAULT_CSRF_HEADER).toLowerCase();
  const csrfCookieName = config.csrfCookieName ?? DEFAULT_CSRF_COOKIE;
  const allowedOrigins = normalizeOrigins(config.allowedOrigins);
  const rateLimitWindowMs = config.rateLimitWindowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS;
  const rateLimitMaxRequests =
    config.rateLimitMaxRequests ?? DEFAULT_RATE_LIMIT_MAX_REQUESTS;
  const maxRequestBytes = config.maxRequestBytes ?? DEFAULT_MAX_REQUEST_BYTES;

  function validateOrigin(request: Request): UserDataControlsApiRouteHardeningResult {
    if (!hasOriginHeader(request)) {
      return blocked(
        "origin_missing",
        "User Data Controls route hardening requires an Origin or Referer header.",
      );
    }

    const origin = readRequestOrigin(request);

    if (!origin || !allowedOrigins.includes(origin)) {
      return blocked(
        "origin_invalid",
        "User Data Controls route hardening rejected the request origin.",
      );
    }

    return allowed();
  }

  function validateCsrf(request: Request): UserDataControlsApiRouteHardeningResult {
    const headerToken = request.headers.get(csrfHeaderName);
    const cookieToken = parseCookieHeader(request.headers.get("cookie"))[csrfCookieName];

    if (!tokenUsable(headerToken) || !tokenUsable(cookieToken) || headerToken !== cookieToken) {
      return blocked(
        "csrf_failed",
        "User Data Controls route hardening rejected the CSRF token.",
      );
    }

    return allowed();
  }

  function validateAbuse(request: Request): UserDataControlsApiRouteHardeningResult {
    if (contentLengthTooLarge(request, maxRequestBytes)) {
      return blocked(
        "abuse_detected",
        "User Data Controls route hardening rejected an oversized request.",
      );
    }

    if (abuseSignalPresent(request) || methodOverridePresent(request)) {
      return blocked(
        "abuse_detected",
        "User Data Controls route hardening rejected an abusive request signal.",
      );
    }

    return allowed();
  }

  function validateRateLimit(input: {
    operation: UserDataControlsApiRouteOperation;
    request: Request;
  }): UserDataControlsApiRouteHardeningResult {
    const origin = readRequestOrigin(input.request) ?? "unknown-origin";
    const key = `${input.operation}:${origin}:${readClientAddress(input.request)}`;
    const currentTime = now();
    const current = store.get(key);

    if (!current || current.resetAt <= currentTime) {
      store.set(key, {
        count: 1,
        resetAt: currentTime + rateLimitWindowMs,
      });
      return allowed();
    }

    if (current.count >= rateLimitMaxRequests) {
      return blocked(
        "rate_limit_exceeded",
        "User Data Controls route hardening rate limit exceeded.",
      );
    }

    store.set(key, {
      ...current,
      count: current.count + 1,
    });

    return allowed();
  }

  function validateRequest(input: {
    operation: UserDataControlsApiRouteOperation;
    request: Request;
  }): UserDataControlsApiRouteHardeningResult {
    if (!config.enabled) {
      return blocked(
        "route_hardening_unavailable",
        "User Data Controls route hardening is disabled by configuration.",
      );
    }

    if (allowedOrigins.length === 0) {
      return blocked(
        "route_hardening_unavailable",
        "User Data Controls route hardening requires at least one allowed origin.",
      );
    }

    const origin = validateOrigin(input.request);
    if (origin.status === "blocked") {
      return origin;
    }

    const csrf = validateCsrf(input.request);
    if (csrf.status === "blocked") {
      return csrf;
    }

    const abuse = validateAbuse(input.request);
    if (abuse.status === "blocked") {
      return abuse;
    }

    return validateRateLimit(input);
  }

  function validateAuthContext(input: {
    operation: UserDataControlsApiRouteOperation;
    authContext: LevioAuthRuntimeContext;
  }): UserDataControlsApiRouteHardeningResult {
    if (input.authContext.identityState === "signed_out") {
      if (input.authContext.error?.code === "session_revoked") {
        return blocked(
          "session_revoked",
          "User Data Controls route hardening rejected a revoked session.",
        );
      }

      return allowed();
    }

    if (input.authContext.sessionStatus === "revoked") {
      return blocked(
        "session_revoked",
        "User Data Controls route hardening rejected a revoked session.",
      );
    }

    return allowed();
  }

  return {
    version: USER_DATA_CONTROLS_API_ROUTE_HARDENING_VERSION,
    mode: USER_DATA_CONTROLS_API_ROUTE_HARDENING_MODE,
    enabled: config.enabled,
    writesEnabled: false,
    evidence: userDataControlsApiRouteHardeningEvidence(),
    validateRequest,
    validateAuthContext,
    resetRateLimit() {
      store.clear();
    },
  };
}
