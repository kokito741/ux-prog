function requiredString(value, field, max = 5000) {
  if (typeof value !== "string" || !value.trim()) {
    return `${field} is required`;
  }
  if (value.trim().length > max) {
    return `${field} is too long`;
  }
  return null;
}

function integerId(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return `${field} must be a positive integer`;
  }
  return null;
}

function ratingScore(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return "score must be an integer between 1 and 5";
  }
  return null;
}

module.exports = {
  requiredString,
  integerId,
  ratingScore,
};
