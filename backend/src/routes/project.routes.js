const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const {
  attachTenantContext,
  enforceTenantMembership,
} = require("../middleware/scopeGuard");
const validate = require("../validators/validate");
const projectController = require("../controllers/project.controller");

const router = express.Router();

// Phase 6: auth + tenant context on every project route
router.use(authenticate, attachTenantContext, enforceTenantMembership);

const PHASES = ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"];

router.get("/", requirePermission("project.view"), projectController.list);

router.get(
  "/:id",
  requirePermission("project.view"),
  param("id").isMongoId(),
  validate,
  projectController.getOne,
);

router.post(
  "/",
  requirePermission("project.create"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("societyId").optional().isMongoId(),
  body("society").optional().isMongoId(),
  body("organizationId").optional().isMongoId(),
  body("phase").optional().isIn(PHASES),
  validate,
  projectController.create,
);

router.patch(
  "/:id",
  requirePermission("project.edit"),
  param("id").isMongoId(),
  body("name").optional().trim().notEmpty(),
  body("phase").optional().isIn(PHASES),
  validate,
  projectController.update,
);

router.delete(
  "/:id",
  requirePermission("project.delete"),
  param("id").isMongoId(),
  validate,
  projectController.remove,
);

module.exports = router;