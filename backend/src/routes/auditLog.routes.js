const express = require("express");
const authenticate = require("../middleware/authenticate");
const { requireAnyPermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const auditLogController = require("../controllers/auditLog.controller");

const router = express.Router();

const VIEW_ANY = [
  "user.view",
  "user.edit",
  "users.manage",
  "role.view",
  "role.manage",
  "roles.manage",
  "permissions.manage",
  "audit.view",
];

router.use(authenticate, attachTenantContext, enforceTenantMembership);
router.get("/", requireAnyPermission(VIEW_ANY), auditLogController.list);

module.exports = router;