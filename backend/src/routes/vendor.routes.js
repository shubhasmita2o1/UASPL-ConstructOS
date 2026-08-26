const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const validate = require("../validators/validate");
const controller = require("../controllers/vendor.controller");

const router = express.Router();

router.use(authenticate, attachTenantContext, enforceTenantMembership);

router.get("/", requirePermission("vendor.view"), controller.list);

router.get(
  "/:id",
  requirePermission("vendor.view"),
  param("id").isMongoId(),
  validate,
  controller.getOne,
);

router.post(
  "/",
  requirePermission("vendor.create"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("organizationId").optional().isMongoId(),
  validate,
  controller.create,
);

router.patch(
  "/:id",
  requirePermission("vendor.edit"),
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  validate,
  controller.update,
);

router.delete(
  "/:id",
  requirePermission("vendor.delete"),
  param("id").isMongoId(),
  validate,
  controller.remove,
);

module.exports = router;
