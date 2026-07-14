const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Organization } = require("../models");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");

const list = catchAsync(async (req, res) => {
  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const query = isGlobal ? {} : { _id: { $in: organizations.map((o) => o._id) } };
  const results = await Organization.find(query).sort({ name: 1 }).lean();
  return new ApiResponse(200, results, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  await permissionService.assertScopeAccess(req.user, { organization: req.params.id });
  const organization = await Organization.findById(req.params.id).lean();
  if (!organization) throw ApiError.notFound("Organization not found");
  return new ApiResponse(200, organization, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const organization = await Organization.create(req.body);
  await auditService.record({ actor: req.user.id, action: "organization.create", targetType: "Organization", targetId: organization._id, req });
  return new ApiResponse(201, organization, "Organization created").send(res);
});

const update = catchAsync(async (req, res) => {
  await permissionService.assertScopeAccess(req.user, { organization: req.params.id });
  const organization = await Organization.findById(req.params.id);
  if (!organization) throw ApiError.notFound("Organization not found");
  Object.assign(organization, req.body);
  await organization.save();
  await auditService.record({ actor: req.user.id, action: "organization.update", targetType: "Organization", targetId: organization._id, req });
  return new ApiResponse(200, organization, "Organization updated").send(res);
});

module.exports = { list, getOne, create, update };
