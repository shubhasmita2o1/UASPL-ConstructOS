const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const { AuditLog } = require("../models");
const permissionService = require("../services/permission.service");

const list = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const { targetType, targetId, action } = req.query;

  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);

  const filter = {};
  if (!isGlobal) {
    filter.organization = { $in: organizations.map((o) => o._id) };
  }
  // Prefer workspace when selected
  if (req.organizationId) {
    const allowed =
      isGlobal ||
      organizations.some((o) => String(o._id) === String(req.organizationId));
    if (allowed) filter.organization = req.organizationId;
  }

  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;
  if (action) {
    filter.action = new RegExp(
      `^${String(action).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    );
  }

  const [total, items] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .populate("actor", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return new ApiResponse(
    200,
    { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) },
    "OK",
  ).send(res);
});

module.exports = { list };