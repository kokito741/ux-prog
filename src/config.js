function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "test") return "test-secret";
  throw new Error("JWT_SECRET environment variable is required");
}

module.exports = {
  getJwtSecret,
};
