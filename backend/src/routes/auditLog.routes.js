const express = require("express");
const authenticate = require("../middleware/authenticate");
const { requireAnyPermission } = require("../middleware/authorize");
const auditLogController = require("../controllers/auditLog.controller");

const router = express.Router();

const VIEW_ANY = ["user.view", "user.edit", "users.manage", "role.view", "role.manage", "roles.manage", "permissions.manage"];

router.get("/", authenticate, requireAnyPermission(VIEW_ANY), auditLogController.list);

module.exports = router;
