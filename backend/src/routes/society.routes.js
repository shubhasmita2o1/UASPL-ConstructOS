const express = require("express");
const { param } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const validate = require("../validators/validate");
const societyController = require("../controllers/society.controller");

const router = express.Router();
router.use(authenticate);

router.get("/", requirePermission("society.view"), societyController.list);
router.get("/:id", requirePermission("society.view"), param("id").isMongoId(), validate, societyController.getOne);

module.exports = router;
