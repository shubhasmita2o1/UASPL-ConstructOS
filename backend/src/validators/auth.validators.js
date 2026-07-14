const { body } = require("express-validator");

const loginRules = [
  body("identifier").trim().notEmpty().withMessage("Email or employee ID is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("remember").optional().isBoolean().toBoolean(),
];

const forgotPasswordRules = [
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
];

const resetPasswordRules = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const changePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const selectOrganizationRules = [
  body("organizationId").isMongoId().withMessage("Valid organizationId is required"),
];

const selectSocietyRules = [
  body("societyId").isMongoId().withMessage("Valid societyId is required"),
];

const selectProjectRules = [
  body("projectId").isMongoId().withMessage("Valid projectId is required"),
];

module.exports = {
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
  selectOrganizationRules,
  selectSocietyRules,
  selectProjectRules,
};
