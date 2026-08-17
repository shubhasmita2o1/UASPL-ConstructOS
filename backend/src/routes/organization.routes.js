const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission, requireAnyPermission } = require("../middleware/authorize");
const validate = require("../validators/validate");
const organizationController = require("../controllers/organization.controller");

const router = express.Router();
router.use(authenticate);

const VIEW_ANY = ["organization.view", "organization.create", "organization.edit"];

router.get("/", requireAnyPermission(VIEW_ANY), organizationController.list);

router.get(
  "/:id",
  requireAnyPermission(VIEW_ANY),
  param("id").isMongoId(),
  validate,
  organizationController.getOne,
);

router.post(
  "/",
  requirePermission("organization.create"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("plan").optional().isIn(["Starter", "Business", "Enterprise"]),
  body("status").optional().isIn(["Active", "Onboarding", "Suspended", "Archived"]),
  validate,
  organizationController.create,
);

router.patch(
  "/:id",
  requirePermission("organization.edit"),
  param("id").isMongoId(),
  body("plan").optional().isIn(["Starter", "Business", "Enterprise"]),
  body("status").optional().isIn(["Active", "Onboarding", "Suspended", "Archived"]),
  validate,
  organizationController.update,
);

router.delete(
  "/:id",
  requirePermission("organization.delete"),
  param("id").isMongoId(),
  validate,
  organizationController.remove,
);

module.exports = router;