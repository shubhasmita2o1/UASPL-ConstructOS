const express = require("express");
const authenticate = require("../middleware/authenticate");
const { requireAnyPermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const permissionController = require("../controllers/permission.controller");

const router = express.Router();

// Phase 6: consistent auth + tenant context (permissions catalog is global-readable
// for role managers; membership still enforced when a workspace is selected)
router.use(authenticate, attachTenantContext, enforceTenantMembership);

router.get(
  "/",
  requireAnyPermission(["role.manage", "role.view", "roles.manage", "permissions.manage"]),
  permissionController.list,
);

module.exports = router;