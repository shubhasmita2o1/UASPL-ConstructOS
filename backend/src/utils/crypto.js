const crypto = require("crypto");

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const DURATION_UNITS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

/** Converts strings like "15m", "7d", "30d" into milliseconds. */
function msFromDuration(duration) {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(String(duration).trim());
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const [, amount, unit] = match;
  return Number(amount) * DURATION_UNITS[unit];
}

module.exports = { generateToken, sha256, msFromDuration };
