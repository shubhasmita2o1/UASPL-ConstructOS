const express = require("express");
const authRoutes = require("./auth.routes");
const roleRoutes = require("./role.routes");
const permissionRoutes = require("./permission.routes");
const userRoutes = require("./user.routes");
const organizationRoutes = require("./organization.routes");
const societyRoutes = require("./society.routes");
const auditLogRoutes = require("./auditLog.routes");

const router = express.Router();

router.get("/health", (req, res) => res.status(200).json({ success: true, message: "OK" }));

router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/societies", societyRoutes);
router.use("/audit-logs", auditLogRoutes);

module.exports = router;
