const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Society } = require("../models");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");
const { bumpCounter, refreshOrganizationCounters } = require("../services/organizationStats.service");

const list = catchAsync(async (req, res) => {
  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const accessibleOrgIds = organizations.map((o) => o._id);

  const filter = {};
  if (!isGlobal) filter.organization = { $in: accessibleOrgIds };

  if (req.query.organizationId) {
    const requested = String(req.query.organizationId);
    const allowed = isGlobal || accessibleOrgIds.some((id) => String(id) === requested);
    filter.organization = allowed ? requested : { $in: [] };
  } else if (req.organizationId) {
    const allowed =
      isGlobal || accessibleOrgIds.some((id) => String(id) === String(req.organizationId));
    if (allowed) filter.organization = req.organizationId;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const term = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: new RegExp(term, "i") }, { code: new RegExp(term, "i") }, { city: new RegExp(term, "i") }];
  }

  const societies = await Society.find(filter).sort({ name: 1 }).lean();
  return new ApiResponse(200, societies, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const society = await Society.findById(req.params.id).lean();
  if (!society) throw ApiError.notFound("Society not found");
  await permissionService.assertScopeAccess(req.user, { organization: society.organization });
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
    code: req.body.code ? String(req.body.code).trim().toUpperCase() : null,
    organization: organizationId,
    address: req.body.address,
    city: req.body.city || "",
    state: req.body.state || "",
    pincode: req.body.pincode || "",
    registrationNumber: req.body.registrationNumber || "",
    buildings: req.body.buildings ?? req.body.totalBuildings ?? 0,
    units: req.body.units ?? req.body.totalUnits ?? 0,
    totalBuildings: req.body.totalBuildings ?? req.body.buildings ?? 0,
    totalUnits: req.body.totalUnits ?? req.body.units ?? 0,
    phase: req.body.phase,
    status: req.body.status || "Active",
    contact: req.body.contact || {},
    notes: req.body.notes || "",
    createdBy: req.user.id,
  });

  await bumpCounter(organizationId, "societies", 1);

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

  const fields = [
    "name", "address", "city", "state", "pincode", "registrationNumber",
    "buildings", "units", "totalBuildings", "totalUnits", "phase", "status", "notes",
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) society[f] = req.body[f];
  }
  if (req.body.code !== undefined) {
    society.code = req.body.code ? String(req.body.code).trim().toUpperCase() : null;
  }
  if (req.body.contact !== undefined) society.contact = req.body.contact;
  await society.save();

  await auditService.record({
    actor: req.user.id,
    action: "society.update",
    targetType: "Society",
    targetId: society._id,
    organization: society.organization,
    metadata: { fields: Object.keys(req.body) },
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

  const orgId = society.organization;
  await society.deleteOne();
  await refreshOrganizationCounters(orgId);

  await auditService.record({
    actor: req.user.id,
    action: "society.delete",
    targetType: "Society",
    targetId: society._id,
    organization: orgId,
    req,
  });

  return new ApiResponse(200, null, "Society deleted").send(res);
});

module.exports = { list, getOne, create, update, remove };
