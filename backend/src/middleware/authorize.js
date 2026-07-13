const ApiError = require("../utils/ApiError");

function has(permissions, key) {
  return permissions.includes("*") || permissions.includes(key);
}

function requirePermission(key) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
    if (!has(req.user.permissions, key)) return next(ApiError.forbidden(`Missing permission: ${key}`));
    next();
  };
}

function requireAnyPermission(keys) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
    if (!keys.some((key) => has(req.user.permissions, key))) {
      return next(ApiError.forbidden(`Missing one of permissions: ${keys.join(", ")}`));
    }
    next();
  };
}

function requireAllPermissions(keys) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
    if (!keys.every((key) => has(req.user.permissions, key))) {
      return next(ApiError.forbidden(`Missing required permissions: ${keys.join(", ")}`));
    }
    next();
  };
}

module.exports = { requirePermission, requireAnyPermission, requireAllPermissions };
