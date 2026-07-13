const { body, param } = require("express-validator");

const createUserRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("employeeId").optional({ nullable: true }).trim(),
  body("phone").optional({ nullable: true }).trim(),
  body("title").optional({ nullable: true }).trim(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const updateUserRules = [
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  body("title").optional({ nullable: true }).trim(),
  body("employeeId").optional({ nullable: true }).trim(),
  body("phone").optional({ nullable: true }).trim(),
  body("status").optional().isIn(["active", "inactive", "locked"]),
];

const idParamRule = [param("id").isMongoId()];

const assignRoleRules = [
  param("id").isMongoId(),
  body("role").isMongoId().withMessage("A valid role is required"),
  body("organization").optional({ nullable: true }).isMongoId(),
  body("society").optional({ nullable: true }).isMongoId(),
  body("project").optional({ nullable: true }).isMongoId(),
];

const revokeRoleRules = [
  param("id").isMongoId(),
  param("userRoleId").isMongoId(),
];

module.exports = { createUserRules, updateUserRules, idParamRule, assignRoleRules, revokeRoleRules };
