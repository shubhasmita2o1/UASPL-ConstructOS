const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Organization } = require("../models");
const auditService = require("../services/audit.service");

const list = catchAsync(async (req, res) => {
  const organizations = await Organization.find({}).sort({ name: 1 }).lean();
  return new ApiResponse(200, organizations, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
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
  const organization = await Organization.findById(req.params.id);
  if (!organization) throw ApiError.notFound("Organization not found");
  Object.assign(organization, req.body);
  await organization.save();
  await auditService.record({ actor: req.user.id, action: "organization.update", targetType: "Organization", targetId: organization._id, req });
  return new ApiResponse(200, organization, "Organization updated").send(res);
});

module.exports = { list, getOne, create, update };
