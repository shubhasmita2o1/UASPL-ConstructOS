const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { generateToken, sha256, msFromDuration } = require("../utils/crypto");

function signAccessToken({ userId, orgId, societyId, projectId, roles, permissions }) {
  return jwt.sign(
    {
      sub: String(userId),
      orgId: orgId ? String(orgId) : null,
      societyId: societyId ? String(societyId) : null,
      projectId: projectId ? String(projectId) : null,
      roles,
      permissions,
    },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
}

/** Opaque refresh token: raw value goes in the cookie, only its hash is stored. */
function createRefreshTokenPair(remember) {
  const raw = generateToken(48);
  const tokenHash = sha256(raw);
  const duration = remember ? env.REFRESH_TOKEN_REMEMBER_EXPIRES_IN : env.REFRESH_TOKEN_EXPIRES_IN;
  const expiresAt = new Date(Date.now() + msFromDuration(duration));
  return { raw, tokenHash, expiresAt };
}

module.exports = { signAccessToken, verifyAccessToken, createRefreshTokenPair };
