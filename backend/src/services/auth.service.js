const crypto = require("crypto");
const { User, Session, RefreshToken } = require("../models");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { generateToken, sha256, msFromDuration } = require("../utils/crypto");
const { signAccessToken, createRefreshTokenPair } = require("./token.service");
const { buildAccessContext } = require("./permission.service");
const auditService = require("./audit.service");

async function findByIdentifier(identifier) {
  const value = String(identifier || "")
    .trim()
    .toLowerCase();
  return User.findOne({ $or: [{ email: value }, { employeeId: value }] }).select("+passwordHash");
}

/** Validates credentials, applying lockout rules. Throws ApiError on any failure. */
async function authenticateCredentials(identifier, password) {
  const user = await findByIdentifier(identifier);
  if (!user) throw ApiError.unauthorized("Invalid email/employee ID or password");

  if (user.status === "inactive") throw ApiError.forbidden("This account has been deactivated");
  if (user.status === "locked")
    throw ApiError.locked("This account has been locked by an administrator");
  if (user.isLocked)
    throw ApiError.locked("Account locked due to too many failed attempts. Try again later.");

  const valid = await user.comparePassword(password);
  if (!valid) {
    user.registerFailedLogin();
    await user.save();
    throw ApiError.unauthorized("Invalid email/employee ID or password");
  }

  user.registerSuccessfulLogin();
  await user.save();
  return user;
}

async function issueTokensForSession({ user, session, remember, req }) {
  const { roles, permissions } = await buildAccessContext(user._id);
  const accessToken = signAccessToken({
    userId: user._id,
    orgId: session.organization,
    societyId: session.society,
    projectId: session.project,
    roles: roles.map((r) => r.slug),
    permissions,
  });

  const { raw, tokenHash, expiresAt } = createRefreshTokenPair(remember);
  await RefreshToken.create({
    user: user._id,
    session: session._id,
    tokenHash,
    family: session._family || crypto.randomUUID(),
    remember,
    expiresAt,
    userAgent: req?.headers?.["user-agent"] || null,
    ip: req?.ip || null,
  });

  return { accessToken, refreshToken: raw, roles, permissions };
}

async function createSession({ user, remember, req }) {
  const duration = remember ? env.REFRESH_TOKEN_REMEMBER_EXPIRES_IN : env.REFRESH_TOKEN_EXPIRES_IN;
  const session = await Session.create({
    user: user._id,
    organization: null,
    society: null,
    userAgent: req?.headers?.["user-agent"] || null,
    ip: req?.ip || null,
    expiresAt: new Date(Date.now() + msFromDuration(duration)),
  });
  session._family = crypto.randomUUID();
  return session;
}

/**
 * Rotates a refresh token. Reuse of an already-revoked token indicates the
 * token was stolen: the entire family and session are revoked as a breach response.
 */
async function rotateRefreshToken({ rawToken, req }) {
  if (!rawToken) throw ApiError.unauthorized("Missing refresh token");
  const tokenHash = sha256(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash }).populate("session");
  if (!existing) throw ApiError.unauthorized("Invalid session");

  if (existing.revokedAt) {
    await RefreshToken.updateMany(
      { family: existing.family, revokedAt: null },
      { revokedAt: new Date() },
    );
    await Session.findByIdAndUpdate(existing.session?._id, { revokedAt: new Date() });

    // Phase 7: security event — stolen/reused refresh token
    await auditService.record({
      actor: existing.user,
      action: "auth.refresh_reuse",
      status: "failure",
      targetType: "Session",
      targetId: existing.session?._id || null,
      metadata: { family: existing.family, reason: "refresh_token_reuse" },
      req,
    });

    throw ApiError.unauthorized("Session revoked, please sign in again");
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized("Session expired, please sign in again");
  }

  const session = existing.session;
  if (!session || session.revokedAt) throw ApiError.unauthorized("Session no longer valid");

  const user = await User.findById(existing.user);
  if (!user || user.status !== "active") throw ApiError.unauthorized("Account no longer active");

  const { raw, tokenHash: newHash, expiresAt } = createRefreshTokenPair(existing.remember);

  existing.revokedAt = new Date();
  existing.replacedByTokenHash = newHash;
  await existing.save();

  await RefreshToken.create({
    user: user._id,
    session: session._id,
    tokenHash: newHash,
    family: existing.family,
    remember: existing.remember,
    expiresAt,
    userAgent: req?.headers?.["user-agent"] || null,
    ip: req?.ip || null,
  });

  session.lastActiveAt = new Date();
  await session.save();

  const { roles, permissions } = await buildAccessContext(user._id);
  const accessToken = signAccessToken({
    userId: user._id,
    orgId: session.organization,
    societyId: session.society,
    projectId: session.project,
    roles: roles.map((r) => r.slug),
    permissions,
  });

  return { accessToken, refreshToken: raw, remember: existing.remember, user, session };
}

async function logoutByRefreshToken(rawToken) {
  if (!rawToken) return;
  const tokenHash = sha256(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });
  if (!existing) return;
  existing.revokedAt = new Date();
  await existing.save();
  await Session.findByIdAndUpdate(existing.session, { revokedAt: new Date() });
}

async function revokeAllSessionsForUser(userId) {
  await Session.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
}

/** Re-issues the access token after org/society selection, embedding the new scope in its claims. */
async function reissueAccessTokenForSession({ session, user }) {
  const { roles, permissions } = await buildAccessContext(user._id);
  const accessToken = signAccessToken({
    userId: user._id,
    orgId: session.organization,
    societyId: session.society,
    projectId: session.project,
    roles: roles.map((r) => r.slug),
    permissions,
  });
  return accessToken;
}

async function generatePasswordResetToken(user) {
  const raw = generateToken(32);
  user.passwordResetTokenHash = sha256(raw);
  user.passwordResetExpires = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000);
  await user.save();
  return raw;
}

async function consumePasswordResetToken(rawToken) {
  const tokenHash = sha256(rawToken);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires +passwordHash");
  if (!user) throw ApiError.badRequest("Reset link is invalid or has expired");
  return user;
}

// ─── Phase 7: session self-service ───────────────────────────────────────────

async function listActiveSessionsForUser(userId) {
  return Session.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActiveAt: -1 })
    .lean();
}

/** Revoke one session owned by userId; also revokes related refresh tokens. */
async function revokeSessionForUser(userId, sessionId) {
  const session = await Session.findOne({ _id: sessionId, user: userId });
  if (!session) throw ApiError.notFound("Session not found");
  if (session.revokedAt) return session;
  session.revokedAt = new Date();
  await session.save();
  await RefreshToken.updateMany(
    { session: session._id, revokedAt: null },
    { revokedAt: new Date() },
  );
  return session;
}

/** Revoke all sessions for user except optional keepSessionId. */
async function revokeOtherSessionsForUser(userId, keepSessionId = null) {
  const filter = { user: userId, revokedAt: null };
  if (keepSessionId) filter._id = { $ne: keepSessionId };
  const sessions = await Session.find(filter).select("_id");
  const ids = sessions.map((s) => s._id);
  if (!ids.length) return 0;
  await Session.updateMany({ _id: { $in: ids } }, { revokedAt: new Date() });
  await RefreshToken.updateMany(
    { session: { $in: ids }, revokedAt: null },
    { revokedAt: new Date() },
  );
  return ids.length;
}

/** Resolve current Session from a raw refresh token cookie value. */
async function findSessionByRefreshToken(rawToken) {
  if (!rawToken) return null;
  const tokenHash = sha256(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash, revokedAt: null }).lean();
  if (!existing) return null;
  return Session.findById(existing.session).lean();
}

module.exports = {
  authenticateCredentials,
  createSession,
  issueTokensForSession,
  rotateRefreshToken,
  logoutByRefreshToken,
  revokeAllSessionsForUser,
  reissueAccessTokenForSession,
  generatePasswordResetToken,
  consumePasswordResetToken,
  listActiveSessionsForUser,
  revokeSessionForUser,
  revokeOtherSessionsForUser,
  findSessionByRefreshToken,
};