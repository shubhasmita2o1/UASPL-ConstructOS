const express = require("express");
const { body, param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission, requireAnyPermission } = require("../middleware/authorize");
const validate = require("../validators/validate");
const organizationController = require("../controllers/organization.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", requireAnyPermission(["organization.view", "organization.create", "organization.edit"]), organizationController.list);
router.get(
  "/:id",
  requireAnyPermission(["organization.view", "organization.create", "organization.edit"]),
  param("id").isMongoId(),
  validate,
  organizationController.getOne,
);
router.post(
  "/",
  requirePermission("organization.create"),
  body("name").trim().notEmpty(),
  validate,
  organizationController.create,
);
router.patch(
  "/:id",
  requirePermission("organization.edit"),
  param("id").isMongoId(),
  validate,
  organizationController.update,
);

module.exports = router;
