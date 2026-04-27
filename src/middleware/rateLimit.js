function createRateLimiter({ windowMs, max }) {
  const store = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store) {
      if (now > data.resetAt) {
        store.delete(key);
      }
    }
  }, windowMs);

  if (cleanup.unref) {
    cleanup.unref();
  }

  return function rateLimitMiddleware(req, res, next) {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const data = store.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > data.resetAt) {
      data.count = 0;
      data.resetAt = now + windowMs;
    }

    data.count += 1;
    store.set(key, data);

    const remaining = Math.max(0, max - data.count);
    const resetSec = Math.ceil(data.resetAt / 1000);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSec);

    if (data.count > max) {
      return res.status(429).json({ error: "Too many requests, try again later" });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
