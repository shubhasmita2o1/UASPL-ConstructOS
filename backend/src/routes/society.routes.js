const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const validate = require("../validators/validate");
const societyController = require("../controllers/society.controller");

const router = express.Router();

// Phase 6: auth + tenant context on every society route
router.use(authenticate, attachTenantContext, enforceTenantMembership);

const PHASES = ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"];

router.get("/", requirePermission("society.view"), societyController.list);

router.get(
  "/:id",
  requirePermission("society.view"),
  param("id").isMongoId(),
  validate,
  societyController.getOne,
);

router.post(
  "/",
  requirePermission("society.create"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("organizationId").optional().isMongoId(),
  body("phase").optional().isIn(PHASES),
  validate,
  societyController.create,
);

router.patch(
  "/:id",
  requirePermission("society.edit"),
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  body("phase").optional().isIn(PHASES),
  validate,
  societyController.update,
);

router.delete(
  "/:id",
  requirePermission("society.delete"),
  param("id").isMongoId(),
  validate,
  societyController.remove,
);

module.exports = router;