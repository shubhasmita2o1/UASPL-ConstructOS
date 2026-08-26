const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const validate = require("../validators/validate");
const controller = require("../controllers/item.controller");

const router = express.Router();

router.use(authenticate, attachTenantContext, enforceTenantMembership);

router.get("/", requirePermission("item.view"), controller.list);

router.get(
  "/:id",
  requirePermission("item.view"),
  param("id").isMongoId(),
  validate,
  controller.getOne,
);

router.post(
  "/",
  requirePermission("item.create"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("organizationId").optional().isMongoId(),
  validate,
  controller.create,
);

router.patch(
  "/:id",
  requirePermission("item.edit"),
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  validate,
  controller.update,
);

router.delete(
  "/:id",
  requirePermission("item.delete"),
  param("id").isMongoId(),
  validate,
  controller.remove,
);

module.exports = router;