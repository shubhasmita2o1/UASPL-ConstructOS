const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const validate = require("../validators/validate");
const controller = require("../controllers/stakeholder.controller");

const router = express.Router();

router.use(authenticate, attachTenantContext, enforceTenantMembership);

router.get("/", requirePermission("stakeholder.view"), controller.list);

router.get(
  "/:id",
  requirePermission("stakeholder.view"),
  param("id").isMongoId(),
  validate,
  controller.getOne,
);

router.post(
  "/",
  requirePermission("stakeholder.create"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("organizationId").optional().isMongoId(),
  validate,
  controller.create,
);

router.patch(
  "/:id",
  requirePermission("stakeholder.edit"),
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  validate,
  controller.update,
);

router.delete(
  "/:id",
  requirePermission("stakeholder.delete"),
  param("id").isMongoId(),
  validate,
  controller.remove,
);

module.exports = router;
