const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createRateLimiter } = require("../src/middleware/rateLimit");
const express = require("express");

process.env.NODE_ENV = "test";

function buildApp(limiterOpts) {
  const app = express();
  const limiter = createRateLimiter(limiterOpts);
  app.use(limiter);
  app.get("/test", (_req, res) => res.json({ ok: true }));
  return app;
}

test("under the limit: responds 200 with correct RateLimit headers", async () => {
  const app = buildApp({ windowMs: 60_000, max: 5 });
  const res = await request(app).get("/test");

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["ratelimit-limit"], "5");
  assert.equal(res.headers["ratelimit-remaining"], "4");
  assert.ok(Number(res.headers["ratelimit-reset"]) > 0, "RateLimit-Reset should be a positive unix timestamp");
});

test("RateLimit-Remaining decrements on each request", async () => {
  const app = buildApp({ windowMs: 60_000, max: 5 });

  for (let i = 1; i <= 4; i++) {
    const res = await request(app).get("/test");
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["ratelimit-remaining"], String(5 - i));
  }
});

test("exceeding the limit returns 429 with correct body and headers", async () => {
  const max = 3;
  const app = buildApp({ windowMs: 60_000, max });

  for (let i = 0; i < max; i++) {
    await request(app).get("/test");
  }

  const res = await request(app).get("/test");
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.error, "Too many requests, try again later");
  assert.equal(res.headers["ratelimit-limit"], String(max));
  assert.equal(res.headers["ratelimit-remaining"], "0");
});

test("after the window expires the counter resets and requests are allowed", async () => {
  const windowMs = 100;
  const app = buildApp({ windowMs, max: 2 });

  await request(app).get("/test");
  await request(app).get("/test");

  const blockedRes = await request(app).get("/test");
  assert.equal(blockedRes.statusCode, 429);

  await new Promise((resolve) => setTimeout(resolve, windowMs + 20));

  const afterReset = await request(app).get("/test");
  assert.equal(afterReset.statusCode, 200);
  assert.equal(afterReset.headers["ratelimit-remaining"], "1");
});

test("auth-specific limiter triggers 429 before the global limit", async () => {
  const authMax = 2;
  const globalMax = 100;

  const authApp = buildApp({ windowMs: 60_000, max: authMax });
  const globalApp = buildApp({ windowMs: 60_000, max: globalMax });

  for (let i = 0; i < authMax; i++) {
    const res = await request(authApp).get("/test");
    assert.equal(res.statusCode, 200);
  }
  const authBlocked = await request(authApp).get("/test");
  assert.equal(authBlocked.statusCode, 429);

  for (let i = 0; i < authMax + 1; i++) {
    const res = await request(globalApp).get("/test");
    assert.equal(res.statusCode, 200);
  }
});
