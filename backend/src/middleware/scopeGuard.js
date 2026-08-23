const ApiError = require("../utils/ApiError");
const permissionService = require("../services/permission.service");

/**
 * After authenticate(), copy token claims onto the request in a stable shape.
 * Prefer these over reading req.user.orgId in every controller.
 */
function attachTenantContext(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized("Not authenticated"));

  req.organizationId = req.user.orgId || null;
  req.societyId = req.user.societyId || null;
  req.projectId = req.user.projectId || null;
  next();
}

/** Ensures the session has selected an organization (workspace). */
function requireOrganization(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
  const orgId = req.organizationId || req.user.orgId;
  if (!orgId) {
    return next(ApiError.badRequest("No organization selected for this session"));
  }
  req.organizationId = orgId;
  next();
}

function requireSociety(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
  if (!req.user.societyId) {
    return next(ApiError.badRequest("No society selected for this session"));
  }
  req.societyId = req.user.societyId;
  next();
}

function requireProject(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
  if (!req.user.projectId) {
    return next(ApiError.badRequest("No project selected for this session"));
  }
  req.projectId = req.user.projectId;
  next();
}

/**
 * Validates that the caller's membership includes the session organization
 * (or the caller is global). Call after authenticate + attachTenantContext
 * when the route is tenant-scoped.
 */
function enforceTenantMembership(req, res, next) {
  return (async () => {
    if (!req.user) return next(ApiError.unauthorized("Not authenticated"));

    const orgId = req.organizationId || req.user.orgId;
    if (!orgId) {
      // Allow routes that work without a selected workspace (e.g. list my orgs).
      return next();
    }

    try {
      await permissionService.assertScopeAccess(req.user, { organization: orgId });
      req.organizationId = String(orgId);
      return next();
    } catch (err) {
      return next(err);
    }
  })();
}

/**
 * When a route has :organizationId (or similar), ensure it matches the
 * session org for non-global users. Super Admin / global dataScope bypasses.
 */
function matchOrganizationParam(paramName = "organizationId") {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
    if (req.user.permissions?.includes("*")) return next();

    const paramValue = req.params[paramName];
    const sessionOrg = req.organizationId || req.user.orgId;
    if (paramValue && sessionOrg && String(paramValue) !== String(sessionOrg)) {
      return next(ApiError.forbidden("You do not have access to this organization"));
    }
    next();
  };
}

/**
 * Load a document by id, assert its organization matches the caller's
 * allowed tenant, then attach to req.resource.
 *
 * Usage: loadAndAssertOrg(Society, "id")
 * Expects Model with field `organization` (ObjectId).
 */
function loadAndAssertOrg(Model, paramName = "id", options = {}) {
  const { notFoundMessage = "Resource not found", orgField = "organization" } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) return next(ApiError.unauthorized("Not authenticated"));

      const doc = await Model.findById(req.params[paramName]);
      if (!doc) return next(ApiError.notFound(notFoundMessage));

      const resourceOrg = doc[orgField];
      if (!resourceOrg) {
        // Unscoped resource: only global callers
        await permissionService.assertScopeAccess(req.user, {});
      } else {
        await permissionService.assertScopeAccess(req.user, {
          organization: resourceOrg,
        });
      }

      req.resource = doc;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  attachTenantContext,
  requireOrganization,
  requireSociety,
  requireProject,
  enforceTenantMembership,
  matchOrganizationParam,
  loadAndAssertOrg,
};