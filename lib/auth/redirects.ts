const AUTH_ENTRY_PATHS = new Set(["/login", "/register", "/forgot-password", "/auth/callback"]);

export function sanitizeRedirectPath(value: string | null, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  let parsed: URL;

  try {
    parsed = new URL(value, "https://levio.local");
  } catch {
    return fallback;
  }

  if (parsed.origin !== "https://levio.local") {
    return fallback;
  }

  if (AUTH_ENTRY_PATHS.has(parsed.pathname) || parsed.pathname.startsWith("/api")) {
    return fallback;
  }

  if (!parsed.pathname.startsWith("/dashboard")) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function buildLoginRedirectPath(reason: string, nextPath = "/dashboard") {
  const safeNext = sanitizeRedirectPath(nextPath, "/dashboard");
  return `/login?next=${encodeURIComponent(safeNext)}&reason=${encodeURIComponent(reason)}`;
}
