const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { User, Organization, Society, Session, RefreshToken } = require("../models");
const authService = require("../services/auth.service");
const permissionService = require("../services/permission.service");
const mailService = require("../services/mail.service");
const auditService = require("../services/audit.service");
const { sha256 } = require("../utils/crypto");
const { ACCESS_COOKIE, REFRESH_COOKIE, accessCookieOptions, refreshCookieOptions, clearCookieOptions, clearRefreshCookieOptions } = require("../config/cookies");

function serializeUser(user, roles) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId || null,
    avatar: user.avatar || null,
    title: user.title || null,
    role: roles[0]?.slug || null,
    roles: roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
    mustChangePassword: !!user.mustChangePassword,
  };
}

function setAuthCookies(res, { accessToken, refreshToken, remember }) {
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(remember));
}

/** ISO timestamp for a freshly-signed access token, so the client can schedule a silent refresh without ever reading the httpOnly cookie. */
function freshAccessTokenExpiresAt() {
  return new Date(Date.now() + accessCookieOptions().maxAge).toISOString();
}

const login = catchAsync(async (req, res) => {
  const { identifier, password, remember } = req.body;

  let user;
  try {
    user = await authService.authenticateCredentials(identifier, password);
  } catch (err) {
    await auditService.record({ action: "auth.login", status: "failure", metadata: { identifier }, req });
    throw err;
  }

  const session = await authService.createSession({ user, remember, req });
  const { accessToken, refreshToken, roles, permissions } = await authService.issueTokensForSession({ user, session, remember, req });
  setAuthCookies(res, { accessToken, refreshToken, remember: !!remember });

  const { organizations } = await permissionService.buildAccessContext(user._id);
  await auditService.record({ actor: user._id, action: "auth.login", status: "success", req });

  return new ApiResponse(200, {
    user: serializeUser(user, roles),
    permissions,
    organizations,
    accessTokenExpiresAt: freshAccessTokenExpiresAt(),
  }, "Signed in").send(res);
});

const logout = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE];
  await authService.logoutByRefreshToken(rawToken);
  res.clearCookie(ACCESS_COOKIE, clearCookieOptions());
  res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
  return new ApiResponse(200, null, "Signed out").send(res);
});

const refresh = catchAsync(async (req, res) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE];
  const { accessToken, refreshToken, remember } = await authService.rotateRefreshToken({ rawToken, req });
  setAuthCookies(res, { accessToken, refreshToken, remember });
  return new ApiResponse(200, { accessTokenExpiresAt: freshAccessTokenExpiresAt() }, "Session refreshed").send(res);
});

const me = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.status !== "active") throw ApiError.unauthorized("Account no longer active");

  const { roles, permissions, organizations } = await permissionService.buildAccessContext(user._id);
  const [organization, society] = await Promise.all([
    req.user.orgId ? Organization.findById(req.user.orgId).lean() : null,
    req.user.societyId ? Society.findById(req.user.societyId).lean() : null,
  ]);

  return new ApiResponse(200, {
    user: serializeUser(user, roles),
    permissions,
    organizations,
    organization: organization || null,
    society: society || null,
    accessTokenExpiresAt: req.user.accessTokenExpiresAt,
  }, "OK").send(res);
});

const listOrganizations = catchAsync(async (req, res) => {
  const { organizations } = await permissionService.buildAccessContext(req.user.id);
  return new ApiResponse(200, organizations, "OK").send(res);
});

const listSocieties = catchAsync(async (req, res) => {
  const { organizationId } = req.query;
  if (!organizationId) throw ApiError.badRequest("organizationId is required");
  const societies = await permissionService.getSocietiesForOrganization(req.user.id, organizationId);
  return new ApiResponse(200, societies, "OK").send(res);
});

const selectOrganization = catchAsync(async (req, res) => {
  const { organizationId } = req.body;
  const { organizations } = await permissionService.buildAccessContext(req.user.id);
  const allowed = organizations.some((o) => String(o._id) === String(organizationId));
  if (!allowed) throw ApiError.forbidden("You do not have access to this organization");

  const rawToken = req.cookies?.[REFRESH_COOKIE];
  const tokenDoc = await RefreshToken.findOne({ tokenHash: sha256(rawToken || "") });
  if (!tokenDoc) throw ApiError.unauthorized("Session not found");

  const session = await Session.findById(tokenDoc.session);
  session.organization = organizationId;
  session.society = null;
  await session.save();

  const user = await User.findById(req.user.id);
  const accessToken = await authService.reissueAccessTokenForSession({ session, user });
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());

  const societies = await permissionService.getSocietiesForOrganization(req.user.id, organizationId);
  await auditService.record({ actor: user._id, action: "auth.select_organization", organization: organizationId, req });

  return new ApiResponse(200, { societies, accessTokenExpiresAt: freshAccessTokenExpiresAt() }, "Organization selected").send(res);
});

const selectSociety = catchAsync(async (req, res) => {
  const { societyId } = req.body;
  if (!req.user.orgId) throw ApiError.badRequest("Select an organization first");

  const society = await Society.findOne({ _id: societyId, organization: req.user.orgId });
  if (!society) throw ApiError.forbidden("You do not have access to this society");

  const rawToken = req.cookies?.[REFRESH_COOKIE];
  const tokenDoc = await RefreshToken.findOne({ tokenHash: sha256(rawToken || "") });
  if (!tokenDoc) throw ApiError.unauthorized("Session not found");

  const session = await Session.findById(tokenDoc.session);
  session.society = societyId;
  await session.save();

  const user = await User.findById(req.user.id);
  const accessToken = await authService.reissueAccessTokenForSession({ session, user });
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());

  await auditService.record({ actor: user._id, action: "auth.select_society", organization: req.user.orgId, society: societyId, req });

  return new ApiResponse(200, { accessTokenExpiresAt: freshAccessTokenExpiresAt() }, "Society selected").send(res);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (user) {
    const rawToken = await authService.generatePasswordResetToken(user);
    await mailService.sendPasswordResetEmail(user, rawToken);
    await auditService.record({ actor: user._id, action: "auth.forgot_password", req });
  }
  // Always respond the same way to avoid leaking which emails are registered.
  return new ApiResponse(200, null, "If that email is registered, a reset link has been sent").send(res);
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await authService.consumePasswordResetToken(token);

  await user.setPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.mustChangePassword = false;
  await user.save();

  await authService.revokeAllSessionsForUser(user._id);
  await auditService.record({ actor: user._id, action: "auth.reset_password", req });

  return new ApiResponse(200, null, "Password has been reset. Please sign in again").send(res);
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+passwordHash");

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw ApiError.badRequest("Current password is incorrect");

  await user.setPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  await auditService.record({ actor: user._id, action: "auth.change_password", req });

  return new ApiResponse(200, null, "Password changed").send(res);
});

module.exports = {
  login,
  logout,
  refresh,
  me,
  listOrganizations,
  listSocieties,
  selectOrganization,
  selectSociety,
  forgotPassword,
  resetPassword,
  changePassword,
};
