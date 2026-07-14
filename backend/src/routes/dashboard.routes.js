const express = require("express");
const authenticate = require("../middleware/authenticate");
const { requireSociety } = require("../middleware/scopeGuard");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/summary", authenticate, requireSociety, dashboardController.summary);

module.exports = router;
