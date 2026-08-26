const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Unit } = require("../models");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");

async function buildOrgFilter(req) {
  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const accessible = organizations.map((o) => o._id);
  const filter = {};
  if (!isGlobal) filter.organization = { $in: accessible };
  if (req.query.organizationId) {
    const requested = String(req.query.organizationId);
    const allowed = isGlobal || accessible.some((id) => String(id) === requested);
    filter.organization = allowed ? requested : { $in: [] };
  } else if (req.organizationId) {
    const allowed = isGlobal || accessible.some((id) => String(id) === String(req.organizationId));
    if (allowed) filter.organization = req.organizationId;
  }
  return filter;
}

const list = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const filter = await buildOrgFilter(req);
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;
  if (req.query.q) {
    const term = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: new RegExp(term, "i") }, { symbol: new RegExp(term, "i") }];
  }
  const [total, items] = await Promise.all([
    Unit.countDocuments(filter),
    Unit.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return new ApiResponse(200, { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) }, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const doc = await Unit.findById(req.params.id).lean();
  if (!doc) throw ApiError.notFound("Unit not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  return new ApiResponse(200, doc, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const organizationId = await permissionService.resolveCreateOrganizationId(
    req.user,
    req.body.organizationId || null,
  );
  const name = String(req.body.name || "").trim();
  const symbol = String(req.body.symbol || "").trim();
  if (!name) throw ApiError.badRequest("Name is required");
  if (!symbol) throw ApiError.badRequest("Symbol is required");

  const doc = await Unit.create({
    name,
    symbol,
    organization: organizationId,
    isActive: req.body.isActive !== false,
    createdBy: req.user.id,
  });
  await auditService.record({
    actor: req.user.id,
    action: "unit.create",
    targetType: "Unit",
    targetId: doc._id,
    organization: organizationId,
    req,
  });
  return new ApiResponse(201, doc, "Unit created").send(res);
});

const update = catchAsync(async (req, res) => {
  const doc = await Unit.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Unit not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  if (req.body.name !== undefined) doc.name = String(req.body.name).trim();
  if (req.body.symbol !== undefined) doc.symbol = String(req.body.symbol).trim();
  if (req.body.isActive !== undefined) doc.isActive = !!req.body.isActive;
  await doc.save();
  await auditService.record({
    actor: req.user.id,
    action: "unit.update",
    targetType: "Unit",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Unit updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const doc = await Unit.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Unit not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  doc.isActive = false;
  await doc.save();
  await auditService.record({
    actor: req.user.id,
    action: "unit.delete",
    targetType: "Unit",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Unit deactivated").send(res);
});

module.exports = { list, getOne, create, update, remove };
