const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Society } = require("../models");
const permissionService = require("../services/permission.service");

const list = catchAsync(async (req, res) => {
  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const accessibleOrgIds = organizations.map((o) => o._id);

  const filter = {};
  if (!isGlobal) filter.organization = { $in: accessibleOrgIds };
  if (req.query.organizationId) {
    const requested = req.query.organizationId;
    filter.organization =
      isGlobal || accessibleOrgIds.some((id) => String(id) === String(requested))
        ? requested
        : { $in: [] };
  }

  const societies = await Society.find(filter).sort({ name: 1 }).lean();
  return new ApiResponse(200, societies, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const society = await Society.findById(req.params.id).lean();
  if (!society) throw ApiError.notFound("Society not found");

  // Centralized in permission.service.js so this check can't drift from the
  // identical one in organization.controller.js.
  await permissionService.assertScopeAccess(req.user, { organization: society.organization });

  return new ApiResponse(200, society, "OK").send(res);
});

module.exports = { list, getOne };
