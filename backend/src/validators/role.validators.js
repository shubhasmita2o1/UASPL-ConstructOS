const { body, param } = require("express-validator");
const Role = require("../models/Role");

const createRoleRules = [
  body("name").trim().notEmpty().withMessage("Role name is required"),
  body("description").optional().trim(),
  body("dataScope").optional().isIn(Role.DATA_SCOPES).withMessage("Invalid data scope"),
  body("organization").optional({ nullable: true }).isMongoId(),
  body("permissions").optional().isArray().withMessage("permissions must be an array"),
  body("permissions.*").optional().isMongoId(),
  body("sidebarMenus").optional().isArray(),
  body("dashboardWidgets").optional().isArray(),
];

const updateRoleRules = [
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  body("description").optional().trim(),
  body("dataScope").optional().isIn(Role.DATA_SCOPES),
  body("sidebarMenus").optional().isArray(),
  body("dashboardWidgets").optional().isArray(),
];

const idParamRule = [param("id").isMongoId()];

const updatePermissionsRules = [
  param("id").isMongoId(),
  body("permissions").isArray().withMessage("permissions must be an array"),
  body("permissions.*").isMongoId(),
];

const updateStatusRules = [
  param("id").isMongoId(),
  body("isActive").isBoolean().withMessage("isActive must be boolean"),
];

module.exports = { createRoleRules, updateRoleRules, idParamRule, updatePermissionsRules, updateStatusRules };
