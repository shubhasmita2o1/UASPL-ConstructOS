const express = require("express");
const authenticate = require("../middleware/authenticate");
const { requireAnyPermission } = require("../middleware/authorize");
const validate = require("../validators/validate");
const {
  createRoleRules, updateRoleRules, idParamRule, updatePermissionsRules, updateStatusRules,
} = require("../validators/role.validators");
const roleController = require("../controllers/role.controller");

const router = express.Router();
router.use(authenticate);

const VIEW_ANY = ["role.manage", "role.view", "roles.manage", "permissions.manage"];
const MANAGE_ANY = ["role.manage", "roles.manage"];

router.get("/", requireAnyPermission(VIEW_ANY), roleController.list);
router.get("/:id", requireAnyPermission(VIEW_ANY), idParamRule, validate, roleController.getOne);
router.get("/:id/users", requireAnyPermission(VIEW_ANY), idParamRule, validate, roleController.listAssignedUsers);
router.post("/", requireAnyPermission(MANAGE_ANY), createRoleRules, validate, roleController.create);
router.patch("/:id", requireAnyPermission(MANAGE_ANY), updateRoleRules, validate, roleController.update);
router.patch("/:id/permissions", requireAnyPermission([...MANAGE_ANY, "permissions.manage"]), updatePermissionsRules, validate, roleController.updatePermissions);
router.patch("/:id/status", requireAnyPermission(MANAGE_ANY), updateStatusRules, validate, roleController.updateStatus);
router.post("/:id/duplicate", requireAnyPermission(MANAGE_ANY), idParamRule, validate, roleController.duplicate);
router.delete("/:id", requireAnyPermission(MANAGE_ANY), idParamRule, validate, roleController.remove);

module.exports = router;
