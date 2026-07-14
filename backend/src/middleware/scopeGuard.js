const ApiError = require("../utils/ApiError");

/** Ensures the verified access token carries an organization scope. */
function requireOrganization(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
  if (!req.user.orgId)
    return next(ApiError.badRequest("No organization selected for this session"));
  next();
}

/** Ensures the verified access token carries a society scope. */
function requireSociety(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
  if (!req.user.societyId) return next(ApiError.badRequest("No society selected for this session"));
  next();
}

/** Ensures the verified access token carries a project scope. */
function requireProject(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
  if (!req.user.projectId) return next(ApiError.badRequest("No project selected for this session"));
  next();
}

/**
 * When a route has an :organizationId param, ensures it matches the caller's
 * token-scoped organization (Super Admin / global-scope roles bypass this).
 */
function matchOrganizationParam(paramName = "organizationId") {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
    if (req.user.permissions.includes("*")) return next();
    const paramValue = req.params[paramName];
    if (paramValue && req.user.orgId && paramValue !== req.user.orgId) {
      return next(ApiError.forbidden("You do not have access to this organization"));
    }
    next();
  };
}

module.exports = { requireOrganization, requireSociety, requireProject, matchOrganizationParam };
