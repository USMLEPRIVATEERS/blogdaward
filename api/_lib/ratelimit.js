// =============================================
// WARD ACADEMY - Best-effort rate limiting
// =============================================
// NOTE: This is an in-memory, PER-INSTANCE limiter. On serverless (Vercel) each
// warm instance keeps its own counters, so under heavy fan-out the effective
// limit is higher than configured. It meaningfully raises the bar against
// online brute force / credential stuffing from a single source, but for
// guaranteed global enforcement back it with a shared store (Upstash Redis /
// Vercel KV) keyed the same way. Fails OPEN on internal error (never blocks a
// legitimate request because of a limiter bug).

const buckets = new Map(); // key -> { count, resetAt }

/**
 * Fixed-window counter. Returns { allowed, retryAfter (seconds) }.
 */
function checkRateLimit(key, { max, windowMs }) {
  try {
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now >= b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count++;

    // Opportunistic cleanup so the map can't grow unbounded.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k);
      }
    }

    if (b.count > max) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
    }
    return { allowed: true, retryAfter: 0 };
  } catch (e) {
    return { allowed: true, retryAfter: 0 };
  }
}

/**
 * Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
 */
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown';
}

/**
 * Enforce login throttling by BOTH source IP and target identifier (CPF).
 * Returns { ok: true } or { ok: false, retryAfter }.
 */
function enforceLoginRateLimit(req, identifier) {
  const ip = getClientIp(req);
  // Per-IP: catches credential stuffing (many accounts from one source)
  const byIp = checkRateLimit(`login:ip:${ip}`, { max: 30, windowMs: 60 * 1000 });
  if (!byIp.allowed) return { ok: false, retryAfter: byIp.retryAfter };
  // Per-identifier: catches targeted brute force against one account
  if (identifier) {
    const byId = checkRateLimit(`login:id:${identifier}`, { max: 8, windowMs: 5 * 60 * 1000 });
    if (!byId.allowed) return { ok: false, retryAfter: byId.retryAfter };
  }
  return { ok: true };
}

module.exports = { checkRateLimit, getClientIp, enforceLoginRateLimit };
