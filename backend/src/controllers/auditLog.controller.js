const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const { AuditLog } = require("../models");

const list = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const { targetType, targetId, action } = req.query;

  const filter = {};
  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;
  if (action) filter.action = new RegExp(`^${action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");

  const [total, items] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).populate("actor", "name email").sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
  ]);

  return new ApiResponse(200, {
    items, total, page, pages: Math.max(Math.ceil(total / limit), 1),
  }, "OK").send(res);
});

module.exports = { list };
