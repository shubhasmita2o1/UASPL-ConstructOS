const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { AuditLog } = require("../models");
const permissionService = require("../services/permission.service");
const mongoose = require("mongoose");

const list = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const { targetType, targetId, action, actor, status, from, to, organizationId } = req.query;

  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const accessibleOrgIds = organizations.map((o) => o._id);

  const filter = {};

  // Tenant isolation
  if (!isGlobal) {
    filter.organization = { $in: accessibleOrgIds };
  }

  // Prefer session workspace when set and allowed
  if (req.organizationId) {
    const allowed =
      isGlobal ||
      accessibleOrgIds.some((id) => String(id) === String(req.organizationId));
    if (allowed) filter.organization = req.organizationId;
  }

  // Optional explicit organizationId query (global: any; non-global: must be accessible)
  if (organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw ApiError.badRequest("organizationId must be a valid id");
    }
    if (
      !isGlobal &&
      !accessibleOrgIds.some((id) => String(id) === String(organizationId))
    ) {
      throw ApiError.forbidden("You do not have access to this organization");
    }
    filter.organization = organizationId;
  }

  if (targetType) filter.targetType = targetType;

  if (targetId) {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw ApiError.badRequest("targetId must be a valid id");
    }
    filter.targetId = targetId;
  }

  if (actor) {
    if (!mongoose.Types.ObjectId.isValid(actor)) {
      throw ApiError.badRequest("actor must be a valid id");
    }
    filter.actor = actor;
  }

  if (status !== undefined && status !== "") {
    if (status !== "success" && status !== "failure") {
      throw ApiError.badRequest('status must be "success" or "failure"');
    }
    filter.status = status;
  }

  if (action) {
    const escaped = String(action).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.action = new RegExp("^" + escaped, "i");
  }

  if (from || to) {
    filter.createdAt = {};
    let fromDate = null;
    let toDate = null;
    if (from) {
      fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        throw ApiError.badRequest("Invalid from date");
      }
      filter.createdAt.$gte = fromDate;
    }
    if (to) {
      toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw ApiError.badRequest("Invalid to date");
      }
      filter.createdAt.$lte = toDate;
    }
    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw ApiError.badRequest("from must be before or equal to to");
    }
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