const argon2 = require("argon2");

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "test") return "test-secret";
  throw new Error("JWT_SECRET environment variable is required");
}

function positiveIntFromEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getArgon2Options() {
  return {
    type: argon2.argon2id,
    memoryCost: positiveIntFromEnv("ARGON2_MEMORY_COST_KIB", 131072),
    timeCost: positiveIntFromEnv("ARGON2_TIME_COST", 4),
    parallelism: positiveIntFromEnv("ARGON2_PARALLELISM", 1),
    hashLength: positiveIntFromEnv("ARGON2_HASH_LENGTH", 32),
    saltLength: positiveIntFromEnv("ARGON2_SALT_LENGTH", 16),
  };
}

module.exports = {
  getJwtSecret,
  getArgon2Options,
};
