const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { ACCESS_COOKIE } = require("../config/cookies");
const { verifyAccessToken } = require("../services/token.service");

/** Verifies the access-token cookie and attaches req.user. 401 if missing/invalid/expired. */
function authenticate(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return next(ApiError.unauthorized("Not authenticated"));

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      orgId: payload.orgId || null,
      societyId: payload.societyId || null,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      accessTokenExpiresAt: new Date(payload.exp * 1000).toISOString(),
    };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Access token expired", [{ code: "TOKEN_EXPIRED" }]));
    }
    return next(ApiError.unauthorized("Invalid access token"));
  }
}

module.exports = authenticate;
