// controllers/society.controller.js
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Society } = require("../models");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");

const list = catchAsync(async (req, res) => {
  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const accessibleOrgIds = organizations.map((o) => o._id);

  const filter = {};
  if (!isGlobal) filter.organization = { $in: accessibleOrgIds };

  // Optional narrow: only if membership allows the requested org
  if (req.query.organizationId) {
    const requested = String(req.query.organizationId);
    const allowed =
      isGlobal || accessibleOrgIds.some((id) => String(id) === requested);
    filter.organization = allowed ? requested : { $in: [] };
  } else if (req.organizationId) {
    // Prefer current workspace when present
    const allowed =
      isGlobal || accessibleOrgIds.some((id) => String(id) === String(req.organizationId));
    if (allowed) filter.organization = req.organizationId;
  }

  const societies = await Society.find(filter).sort({ name: 1 }).lean();
  return new ApiResponse(200, societies, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const society = await Society.findById(req.params.id).lean();
  if (!society) throw ApiError.notFound("Society not found");

  await permissionService.assertScopeAccess(req.user, {
    organization: society.organization,
  });

  return new ApiResponse(200, society, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const organizationId = await permissionService.resolveCreateOrganizationId(
    req.user,
    req.body.organizationId || null,
  );

  const name = String(req.body.name || "").trim();
  if (!name) throw ApiError.badRequest("Society name is required");

  const society = await Society.create({
    name,
    organization: organizationId,
    address: req.body.address,
    buildings: req.body.buildings,
    units: req.body.units,
    phase: req.body.phase,
    createdBy: req.user.id,
  });

  await auditService.record({
    actor: req.user.id,
    action: "society.create",
    targetType: "Society",
    targetId: society._id,
    organization: organizationId,
    req,
  });

  return new ApiResponse(201, society, "Society created").send(res);
});

const update = catchAsync(async (req, res) => {
  const society = await Society.findById(req.params.id);
  if (!society) throw ApiError.notFound("Society not found");

  await permissionService.assertScopeAccess(req.user, {
    organization: society.organization,
  });

  // Never allow moving a society to another tenant via body
  const { name, address, buildings, units, phase } = req.body;
  if (name !== undefined) society.name = name;
  if (address !== undefined) society.address = address;
  if (buildings !== undefined) society.buildings = buildings;
  if (units !== undefined) society.units = units;
  if (phase !== undefined) society.phase = phase;
  await society.save();

  await auditService.record({
    actor: req.user.id,
    action: "society.update",
    targetType: "Society",
    targetId: society._id,
    organization: society.organization,
    req,
  });

  return new ApiResponse(200, society, "Society updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const society = await Society.findById(req.params.id);
  if (!society) throw ApiError.notFound("Society not found");

  await permissionService.assertScopeAccess(req.user, {
    organization: society.organization,
  });

  await society.deleteOne();

  await auditService.record({
    actor: req.user.id,
    action: "society.delete",
    targetType: "Society",
    targetId: society._id,
    organization: society.organization,
    req,
  });

  return new ApiResponse(200, null, "Society deleted").send(res);
});

module.exports = { list, getOne, create, update, remove };