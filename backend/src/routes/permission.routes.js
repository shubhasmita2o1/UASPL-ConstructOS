const express = require("express");
const authenticate = require("../middleware/authenticate");
const { requireAnyPermission } = require("../middleware/authorize");
const permissionController = require("../controllers/permission.controller");

const router = express.Router();

router.get("/", authenticate, requireAnyPermission(["role.manage", "role.view", "roles.manage", "permissions.manage"]), permissionController.list);

module.exports = router;
