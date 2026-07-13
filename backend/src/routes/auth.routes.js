const express = require("express");
const authenticate = require("../middleware/authenticate");
const { loginLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiters");
const validate = require("../validators/validate");
const {
  loginRules, forgotPasswordRules, resetPasswordRules,
  changePasswordRules, selectOrganizationRules, selectSocietyRules,
} = require("../validators/auth.validators");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", loginLimiter, loginRules, validate, authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", authenticate, authController.me);

router.get("/organizations", authenticate, authController.listOrganizations);
router.get("/societies", authenticate, authController.listSocieties);
router.post("/select-organization", authenticate, selectOrganizationRules, validate, authController.selectOrganization);
router.post("/select-society", authenticate, selectSocietyRules, validate, authController.selectSociety);

router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post("/reset-password", resetPasswordRules, validate, authController.resetPassword);
router.post("/change-password", authenticate, changePasswordRules, validate, authController.changePassword);

module.exports = router;
