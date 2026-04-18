const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const request = require("supertest");

process.env.NODE_ENV = "test";

const app = require("../src/app");

function authHeader() {
  const token = jwt.sign({ sub: 1, username: "tester" }, "test-secret", {
    expiresIn: "1h",
  });
  return `Bearer ${token}`;
}

test("GET / serves the frontend", async () => {
  const response = await request(app).get("/");
  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"] || "", /text\/html/);
});

test("POST /api/auth/register validates required fields", async () => {
  const response = await request(app).post("/api/auth/register").send({});
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.errors, [
    "username is required",
    "email is required",
    "password is required",
  ]);
});

test("POST /api/auth/login validates required fields", async () => {
  const response = await request(app).post("/api/auth/login").send({ email: "" });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.errors, ["email is required", "password is required"]);
});

test("protected routes reject invalid bearer tokens", async () => {
  const response = await request(app)
    .post("/api/museums")
    .set("Authorization", "Bearer not-a-real-token")
    .send({});

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, "Invalid token");
});

test("GET /api/museums/:id validates museum id", async () => {
  const response = await request(app).get("/api/museums/not-a-number");
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "museum id must be a positive integer");
});

test("GET /api/artifacts/:id validates artifact id", async () => {
  const response = await request(app).get("/api/artifacts/0");
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "artifact id must be a positive integer");
});

test("GET /api/comments/:targetType/:targetId validates target type", async () => {
  const response = await request(app).get("/api/comments/painting/1");
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Invalid target type");
});

test("GET /api/comments/:targetType/:targetId validates target id", async () => {
  const response = await request(app).get("/api/comments/museum/abc");
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "target id must be a positive integer");
});

test("GET /api/ratings/:targetType/:targetId validates target type", async () => {
  const response = await request(app).get("/api/ratings/painting/1");
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Invalid target type");
});

test("GET /api/ratings/:targetType/:targetId validates target id", async () => {
  const response = await request(app).get("/api/ratings/museum/abc");
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "target id must be a positive integer");
});

test("POST /api/museums validates payload with auth", async () => {
  const response = await request(app)
    .post("/api/museums")
    .set("Authorization", authHeader())
    .send({ name: "", location: 123, description: "" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.errors, [
    "name is required",
    "location is required",
    "description is required",
  ]);
});

test("POST /api/artifacts validates payload with auth", async () => {
  const response = await request(app)
    .post("/api/artifacts")
    .set("Authorization", authHeader())
    .send({
      museum_id: "x",
      name: "",
      description: "",
      historical_background: "",
      category: "",
      image_url: 1,
      tags: 2,
    });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.errors, [
    "museum_id must be a positive integer",
    "name is required",
    "description is required",
    "historical_background is required",
    "category is required",
    "image_url must be a string",
    "tags must be a comma-separated string",
  ]);
});

test("POST /api/comments validates payload with auth", async () => {
  const response = await request(app)
    .post("/api/comments")
    .set("Authorization", authHeader())
    .send({
      target_type: "painting",
      target_id: "abc",
      content: "",
    });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.errors, [
    "target_id must be a positive integer",
    "content is required",
    "target_type must be museum or artifact",
  ]);
});

test("POST /api/ratings validates score and target type with auth", async () => {
  const response = await request(app)
    .post("/api/ratings")
    .set("Authorization", authHeader())
    .send({
      target_type: "painting",
      target_id: "abc",
      score: 9,
    });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.errors, [
    "target_id must be a positive integer",
    "score must be an integer between 1 and 5",
    "target_type must be museum or artifact",
  ]);
});

test("PUT and DELETE id routes validate positive integer ids", async () => {
  const token = authHeader();

  const museumUpdate = await request(app)
    .put("/api/museums/abc")
    .set("Authorization", token)
    .send({});
  assert.equal(museumUpdate.statusCode, 400);
  assert.equal(museumUpdate.body.error, "museum id must be a positive integer");

  const museumDelete = await request(app)
    .delete("/api/museums/abc")
    .set("Authorization", token);
  assert.equal(museumDelete.statusCode, 400);
  assert.equal(museumDelete.body.error, "museum id must be a positive integer");

  const artifactUpdate = await request(app)
    .put("/api/artifacts/abc")
    .set("Authorization", token)
    .send({});
  assert.equal(artifactUpdate.statusCode, 400);
  assert.equal(artifactUpdate.body.error, "artifact id must be a positive integer");

  const artifactDelete = await request(app)
    .delete("/api/artifacts/abc")
    .set("Authorization", token);
  assert.equal(artifactDelete.statusCode, 400);
  assert.equal(artifactDelete.body.error, "artifact id must be a positive integer");
});

