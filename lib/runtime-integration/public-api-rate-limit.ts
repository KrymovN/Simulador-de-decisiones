export type PublicApiRateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

type RateLimitBucket = {
  count: number;
  windowStartedAt: number;
};

type PublicApiRateLimiterOptions = {
  maxBuckets: number;
  maxRequests: number;
  windowMs: number;
};

export function getPublicRequestSource(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const vercelForwardedFor = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const connectingIp = req.headers.get("cf-connecting-ip")?.trim();
  const userAgent = req.headers.get("user-agent")?.trim();

  return (
    forwardedFor ||
    realIp ||
    vercelForwardedFor ||
    connectingIp ||
    `anonymous:${userAgent || "unknown"}`
  );
}

export function createPublicApiRateLimiter(options: PublicApiRateLimiterOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  function prune(now: number) {
    for (const [source, bucket] of buckets) {
      if (now - bucket.windowStartedAt >= options.windowMs) {
        buckets.delete(source);
      }
    }

    while (buckets.size >= options.maxBuckets) {
      const oldestSource = buckets.keys().next().value;
      if (typeof oldestSource !== "string") {
        break;
      }
      buckets.delete(oldestSource);
    }
  }

  return {
    check(source: string, now = Date.now()): PublicApiRateLimitResult {
      let bucket = buckets.get(source);

      if (!bucket || now - bucket.windowStartedAt >= options.windowMs) {
        prune(now);
        buckets.set(source, {
          count: 1,
          windowStartedAt: now,
        });
        return { limited: false };
      }

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.windowStartedAt + options.windowMs - now) / 1000),
      );

      if (bucket.count >= options.maxRequests) {
        return {
          limited: true,
          retryAfterSeconds,
        };
      }

      bucket.count += 1;
      return { limited: false };
    },
    reset() {
      buckets.clear();
    },
  };
}

export type PublicApiRateLimiter = ReturnType<typeof createPublicApiRateLimiter>;
