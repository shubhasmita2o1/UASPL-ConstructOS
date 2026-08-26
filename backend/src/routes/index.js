const express = require("express");
const authRoutes = require("./auth.routes");
const roleRoutes = require("./role.routes");
const permissionRoutes = require("./permission.routes");
const userRoutes = require("./user.routes");
const organizationRoutes = require("./organization.routes");
const societyRoutes = require("./society.routes");
const projectRoutes = require("./project.routes");
const auditLogRoutes = require("./auditLog.routes");
const dashboardRoutes = require("./dashboard.routes");
const departmentRoutes = require("./department.routes");
const unitRoutes = require("./unit.routes");
const itemRoutes = require("./item.routes");
const vendorRoutes = require("./vendor.routes");
const stakeholderRoutes = require("./stakeholder.routes");

const router = express.Router();

router.get("/health", (req, res) => res.status(200).json({ success: true, message: "OK" }));

router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/societies", societyRoutes);
router.use("/projects", projectRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/departments", departmentRoutes);
router.use("/units", unitRoutes);
router.use("/items", itemRoutes);
router.use("/vendors", vendorRoutes);
router.use("/stakeholders", stakeholderRoutes);

module.exports = router;