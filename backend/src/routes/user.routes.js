const express = require("express");
const authenticate = require("../middleware/authenticate");
const { requireAnyPermission } = require("../middleware/authorize");
const validate = require("../validators/validate");
const {
  createUserRules, updateUserRules, idParamRule, assignRoleRules, revokeRoleRules,
} = require("../validators/user.validators");
const userController = require("../controllers/user.controller");

const router = express.Router();
router.use(authenticate);

const VIEW_ANY = ["user.view", "user.create", "user.edit", "users.manage"];
const EDIT_ANY = ["user.edit", "users.manage"];

router.get("/", requireAnyPermission(VIEW_ANY), userController.list);
router.get("/:id", requireAnyPermission(VIEW_ANY), idParamRule, validate, userController.getOne);
router.post("/", requireAnyPermission(["user.create", "users.manage"]), createUserRules, validate, userController.create);
router.patch("/:id", requireAnyPermission(EDIT_ANY), updateUserRules, validate, userController.update);
router.delete("/:id", requireAnyPermission(["user.delete", "users.manage"]), idParamRule, validate, userController.remove);
router.post("/:id/unlock", requireAnyPermission(EDIT_ANY), idParamRule, validate, userController.unlock);
router.post("/:id/lock", requireAnyPermission(EDIT_ANY), idParamRule, validate, userController.lock);
router.post("/:id/reset-password", requireAnyPermission(EDIT_ANY), idParamRule, validate, userController.resetPassword);
router.post("/:id/force-logout", requireAnyPermission(EDIT_ANY), idParamRule, validate, userController.forceLogout);
router.post("/:id/roles", requireAnyPermission(EDIT_ANY), assignRoleRules, validate, userController.assignRole);
router.delete("/:id/roles/:userRoleId", requireAnyPermission(EDIT_ANY), revokeRoleRules, validate, userController.revokeRole);

module.exports = router;
