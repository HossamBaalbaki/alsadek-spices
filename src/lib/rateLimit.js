// Simple in-memory rate limiter — works for single-server / Vercel deployments.
// Key is usually IP address. windowMs = window in ms, max = max hits in window.

const store = new Map(); // key → { count, resetAt }

// Clean up expired entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (val.resetAt < now) store.delete(key);
    }
  }, 10 * 60 * 1000);
}

/**
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 * Call this at the top of any API route handler.
 */
export function rateLimit(key, { windowMs = 60_000, max = 20 } = {}) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  store.set(key, entry);

  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

/** Extract the real IP from Next.js request headers. */
export function getIP(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Return a 429 response with Retry-After header. */
export function tooManyRequests(resetAt) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
