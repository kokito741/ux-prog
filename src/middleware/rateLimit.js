const rateLimit = require("express-rate-limit");

function createRateLimiter({ windowMs, max }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, try again later" },
  });
}

module.exports = { createRateLimiter };
