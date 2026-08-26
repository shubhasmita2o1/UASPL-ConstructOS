const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const validate = require("../validators/validate");
const controller = require("../controllers/department.controller");

const router = express.Router();

router.use(authenticate, attachTenantContext, enforceTenantMembership);

router.get("/", requirePermission("department.view"), controller.list);

router.get(
  "/:id",
  requirePermission("department.view"),
  param("id").isMongoId(),
  validate,
  controller.getOne,
);

router.post(
  "/",
  requirePermission("department.create"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("organizationId").optional().isMongoId(),
  validate,
  controller.create,
);

router.patch(
  "/:id",
  requirePermission("department.edit"),
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  validate,
  controller.update,
);

router.delete(
  "/:id",
  requirePermission("department.delete"),
  param("id").isMongoId(),
  validate,
  controller.remove,
);

module.exports = router;
