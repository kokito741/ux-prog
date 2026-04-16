const path = require("path");
const express = require("express");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { requireAuth } = require("./middleware/auth");
const { requiredString, integerId, ratingScore } = require("./middleware/validation");

const app = express();
const jwtSecret = process.env.JWT_SECRET || "change-me";
const validTargetTypes = new Set(["museum", "artifact"]);

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const errors = [
    requiredString(username, "username", 80),
    requiredString(email, "email", 255),
    requiredString(password, "password", 255),
  ].filter(Boolean);

  if (errors.length) return res.status(400).json({ errors });

  try {
    const hash = await argon2.hash(password);
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username.trim(), email.trim().toLowerCase(), hash]
    );
    return res.status(201).json({ id: result.insertId, username: username.trim() });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    return res.status(500).json({ error: "Could not register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const errors = [requiredString(email, "email", 255), requiredString(password, "password", 255)].filter(Boolean);
  if (errors.length) return res.status(400).json({ errors });

  const [rows] = await pool.execute(
    "SELECT id, username, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: user.id, username: user.username }, jwtSecret, { expiresIn: "12h" });
  return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

app.get("/api/museums", async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT m.id, m.name, m.location, m.description, m.image_url,
            ROUND(AVG(r.score), 2) AS average_rating
     FROM museums m
     LEFT JOIN ratings r ON r.target_type = 'museum' AND r.target_id = m.id
     GROUP BY m.id
     ORDER BY m.name`
  );
  res.json(rows);
});

app.post("/api/museums", requireAuth, async (req, res) => {
  const { name, location, description, image_url } = req.body;
  const errors = [
    requiredString(name, "name", 255),
    requiredString(location, "location", 255),
    requiredString(description, "description", 4000),
  ].filter(Boolean);
  if (image_url && typeof image_url !== "string") errors.push("image_url must be a string");
  if (errors.length) return res.status(400).json({ errors });

  const [result] = await pool.execute(
    "INSERT INTO museums (name, location, description, image_url) VALUES (?, ?, ?, ?)",
    [name.trim(), location.trim(), description.trim(), (image_url || "").trim() || null]
  );
  res.status(201).json({ id: result.insertId });
});

app.get("/api/museums/:id", async (req, res) => {
  const idErr = integerId(req.params.id, "museum id");
  if (idErr) return res.status(400).json({ error: idErr });
  const museumId = Number(req.params.id);

  const [[museum]] = await pool.execute(
    `SELECT m.id, m.name, m.location, m.description, m.image_url,
            ROUND(AVG(r.score), 2) AS average_rating
     FROM museums m
     LEFT JOIN ratings r ON r.target_type = 'museum' AND r.target_id = m.id
     WHERE m.id = ?
     GROUP BY m.id`,
    [museumId]
  );
  if (!museum) return res.status(404).json({ error: "Museum not found" });

  const [artifacts] = await pool.execute(
    "SELECT id, museum_id, name, image_url, description, historical_background, category, tags FROM artifacts WHERE museum_id = ? ORDER BY name",
    [museumId]
  );
  res.json({ ...museum, artifacts });
});

app.put("/api/museums/:id", requireAuth, async (req, res) => {
  const idErr = integerId(req.params.id, "museum id");
  if (idErr) return res.status(400).json({ error: idErr });
  const { name, location, description, image_url } = req.body;
  const errors = [
    requiredString(name, "name", 255),
    requiredString(location, "location", 255),
    requiredString(description, "description", 4000),
  ].filter(Boolean);
  if (image_url && typeof image_url !== "string") errors.push("image_url must be a string");
  if (errors.length) return res.status(400).json({ errors });

  const [result] = await pool.execute(
    "UPDATE museums SET name = ?, location = ?, description = ?, image_url = ? WHERE id = ?",
    [name.trim(), location.trim(), description.trim(), (image_url || "").trim() || null, Number(req.params.id)]
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Museum not found" });
  res.json({ message: "Museum updated" });
});

app.delete("/api/museums/:id", requireAuth, async (req, res) => {
  const idErr = integerId(req.params.id, "museum id");
  if (idErr) return res.status(400).json({ error: idErr });
  const [result] = await pool.execute("DELETE FROM museums WHERE id = ?", [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ error: "Museum not found" });
  res.status(204).send();
});

app.get("/api/artifacts", async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT a.id, a.museum_id, a.name, a.image_url, a.description, a.historical_background, a.category, a.tags,
            ROUND(AVG(r.score), 2) AS average_rating
     FROM artifacts a
     LEFT JOIN ratings r ON r.target_type = 'artifact' AND r.target_id = a.id
     GROUP BY a.id
     ORDER BY a.name`
  );
  res.json(rows);
});

app.post("/api/artifacts", requireAuth, async (req, res) => {
  const { museum_id, name, image_url, description, historical_background, category, tags } = req.body;
  const errors = [
    integerId(museum_id, "museum_id"),
    requiredString(name, "name", 255),
    requiredString(description, "description", 4000),
    requiredString(historical_background, "historical_background", 4000),
    requiredString(category, "category", 120),
  ].filter(Boolean);
  if (image_url && typeof image_url !== "string") errors.push("image_url must be a string");
  if (tags && typeof tags !== "string") errors.push("tags must be a comma-separated string");
  if (errors.length) return res.status(400).json({ errors });

  const [result] = await pool.execute(
    `INSERT INTO artifacts (museum_id, name, image_url, description, historical_background, category, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      Number(museum_id),
      name.trim(),
      (image_url || "").trim() || null,
      description.trim(),
      historical_background.trim(),
      category.trim(),
      (tags || "").trim() || null,
    ]
  );
  res.status(201).json({ id: result.insertId });
});

app.get("/api/artifacts/:id", async (req, res) => {
  const idErr = integerId(req.params.id, "artifact id");
  if (idErr) return res.status(400).json({ error: idErr });
  const artifactId = Number(req.params.id);
  const [[artifact]] = await pool.execute(
    `SELECT a.id, a.museum_id, a.name, a.image_url, a.description, a.historical_background, a.category, a.tags,
            ROUND(AVG(r.score), 2) AS average_rating
     FROM artifacts a
     LEFT JOIN ratings r ON r.target_type = 'artifact' AND r.target_id = a.id
     WHERE a.id = ?
     GROUP BY a.id`,
    [artifactId]
  );
  if (!artifact) return res.status(404).json({ error: "Artifact not found" });
  res.json(artifact);
});

app.get("/api/artifacts/:id/similar", async (req, res) => {
  const idErr = integerId(req.params.id, "artifact id");
  if (idErr) return res.status(400).json({ error: idErr });
  const artifactId = Number(req.params.id);
  const [[artifact]] = await pool.execute("SELECT category, tags FROM artifacts WHERE id = ?", [artifactId]);
  if (!artifact) return res.status(404).json({ error: "Artifact not found" });

  const [rows] = await pool.execute(
    `SELECT id, museum_id, name, image_url, description, category, tags
     FROM artifacts
     WHERE id <> ? AND (
       category = ? OR (? IS NOT NULL AND tags IS NOT NULL AND tags <> '' AND FIND_IN_SET(SUBSTRING_INDEX(?, ',', 1), tags))
     )
     LIMIT 8`,
    [artifactId, artifact.category, artifact.tags, artifact.tags]
  );
  res.json(rows);
});

app.put("/api/artifacts/:id", requireAuth, async (req, res) => {
  const idErr = integerId(req.params.id, "artifact id");
  if (idErr) return res.status(400).json({ error: idErr });
  const { museum_id, name, image_url, description, historical_background, category, tags } = req.body;
  const errors = [
    integerId(museum_id, "museum_id"),
    requiredString(name, "name", 255),
    requiredString(description, "description", 4000),
    requiredString(historical_background, "historical_background", 4000),
    requiredString(category, "category", 120),
  ].filter(Boolean);
  if (image_url && typeof image_url !== "string") errors.push("image_url must be a string");
  if (tags && typeof tags !== "string") errors.push("tags must be a comma-separated string");
  if (errors.length) return res.status(400).json({ errors });

  const [result] = await pool.execute(
    `UPDATE artifacts
     SET museum_id = ?, name = ?, image_url = ?, description = ?, historical_background = ?, category = ?, tags = ?
     WHERE id = ?`,
    [
      Number(museum_id),
      name.trim(),
      (image_url || "").trim() || null,
      description.trim(),
      historical_background.trim(),
      category.trim(),
      (tags || "").trim() || null,
      Number(req.params.id),
    ]
  );
  if (!result.affectedRows) return res.status(404).json({ error: "Artifact not found" });
  res.json({ message: "Artifact updated" });
});

app.delete("/api/artifacts/:id", requireAuth, async (req, res) => {
  const idErr = integerId(req.params.id, "artifact id");
  if (idErr) return res.status(400).json({ error: idErr });
  const [result] = await pool.execute("DELETE FROM artifacts WHERE id = ?", [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ error: "Artifact not found" });
  res.status(204).send();
});

app.get("/api/comments/:targetType/:targetId", async (req, res) => {
  const { targetType, targetId } = req.params;
  if (!validTargetTypes.has(targetType)) return res.status(400).json({ error: "Invalid target type" });
  const idErr = integerId(targetId, "target id");
  if (idErr) return res.status(400).json({ error: idErr });

  const [rows] = await pool.execute(
    `SELECT c.id, c.content, c.created_at, u.username
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.target_type = ? AND c.target_id = ?
     ORDER BY c.created_at DESC`,
    [targetType, Number(targetId)]
  );
  res.json(rows);
});

app.post("/api/comments", requireAuth, async (req, res) => {
  const { target_type, target_id, content } = req.body;
  const errors = [integerId(target_id, "target_id"), requiredString(content, "content", 2000)].filter(Boolean);
  if (!validTargetTypes.has(target_type)) errors.push("target_type must be museum or artifact");
  if (errors.length) return res.status(400).json({ errors });

  const [result] = await pool.execute(
    "INSERT INTO comments (user_id, target_type, target_id, content) VALUES (?, ?, ?, ?)",
    [req.user.id, target_type, Number(target_id), content.trim()]
  );
  res.status(201).json({ id: result.insertId });
});

app.get("/api/ratings/:targetType/:targetId", async (req, res) => {
  const { targetType, targetId } = req.params;
  if (!validTargetTypes.has(targetType)) return res.status(400).json({ error: "Invalid target type" });
  const idErr = integerId(targetId, "target id");
  if (idErr) return res.status(400).json({ error: idErr });

  const [[avg]] = await pool.execute(
    "SELECT ROUND(AVG(score), 2) AS average_rating, COUNT(*) AS total_ratings FROM ratings WHERE target_type = ? AND target_id = ?",
    [targetType, Number(targetId)]
  );
  res.json(avg);
});

app.post("/api/ratings", requireAuth, async (req, res) => {
  const { target_type, target_id, score } = req.body;
  const errors = [integerId(target_id, "target_id"), ratingScore(score)].filter(Boolean);
  if (!validTargetTypes.has(target_type)) errors.push("target_type must be museum or artifact");
  if (errors.length) return res.status(400).json({ errors });

  await pool.execute(
    `INSERT INTO ratings (user_id, target_type, target_id, score)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE score = VALUES(score)`,
    [req.user.id, target_type, Number(target_id), Number(score)]
  );
  res.status(201).json({ message: "Rating saved" });
});

app.use((error, _req, res, _next) => {
  if (error && error.code && String(error.code).startsWith("ER_")) {
    return res.status(500).json({ error: "Database error" });
  }
  return res.status(500).json({ error: "Unexpected server error" });
});

module.exports = app;
