const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
process.env.NODE_ENV = "test";
const app = require("../src/app");

test("GET /api/health returns ok", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: "ok" });
});

test("POST /api/museums requires auth", async () => {
  const response = await request(app).post("/api/museums").send({});
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, "Login required");
});

test("DELETE /api/auth/profile requires auth", async () => {
  const response = await request(app).delete("/api/auth/profile");
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, "Login required");
});
