const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Item, Unit } = require("../models");
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
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = await buildOrgFilter(req);
  if (req.query.type) filter.type = req.query.type;
  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;
  if (req.query.q) {
    const term = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: new RegExp(term, "i") },
      { code: new RegExp(term, "i") },
      { category: new RegExp(term, "i") },
    ];
  }
  const [total, items] = await Promise.all([
    Item.countDocuments(filter),
    Item.find(filter)
      .populate("unit", "name symbol")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);
  return new ApiResponse(200, { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) }, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const doc = await Item.findById(req.params.id).populate("unit", "name symbol").lean();
  if (!doc) throw ApiError.notFound("Item not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  return new ApiResponse(200, doc, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const organizationId = await permissionService.resolveCreateOrganizationId(
    req.user,
    req.body.organizationId || null,
  );
  const name = String(req.body.name || "").trim();
  const code = String(req.body.code || "").trim().toUpperCase();
  if (!name) throw ApiError.badRequest("Name is required");
  if (!code) throw ApiError.badRequest("Code is required");

  let unitId = req.body.unit || null;
  if (unitId) {
    const unit = await Unit.findById(unitId);
    if (!unit) throw ApiError.badRequest("Unit not found");
    if (String(unit.organization) !== String(organizationId)) {
      throw ApiError.badRequest("Unit must belong to the same organization");
    }
  }

  const doc = await Item.create({
    name,
    code,
    description: req.body.description || "",
    type: req.body.type || "Material",
    unit: unitId,
    category: req.body.category || "",
    hsnSac: req.body.hsnSac || "",
    standardRate: Number(req.body.standardRate) || 0,
    organization: organizationId,
    isActive: req.body.isActive !== false,
    createdBy: req.user.id,
  });

  await auditService.record({
    actor: req.user.id,
    action: "item.create",
    targetType: "Item",
    targetId: doc._id,
    organization: organizationId,
    req,
  });
  return new ApiResponse(201, doc, "Item created").send(res);
});

const update = catchAsync(async (req, res) => {
  const doc = await Item.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Item not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });

  if (req.body.name !== undefined) doc.name = String(req.body.name).trim();
  if (req.body.code !== undefined) doc.code = String(req.body.code).trim().toUpperCase();
  if (req.body.description !== undefined) doc.description = req.body.description;
  if (req.body.type !== undefined) doc.type = req.body.type;
  if (req.body.category !== undefined) doc.category = req.body.category;
  if (req.body.hsnSac !== undefined) doc.hsnSac = req.body.hsnSac;
  if (req.body.standardRate !== undefined) doc.standardRate = Number(req.body.standardRate) || 0;
  if (req.body.isActive !== undefined) doc.isActive = !!req.body.isActive;
  if (req.body.unit !== undefined) {
    if (req.body.unit) {
      const unit = await Unit.findById(req.body.unit);
      if (!unit) throw ApiError.badRequest("Unit not found");
      if (String(unit.organization) !== String(doc.organization)) {
        throw ApiError.badRequest("Unit must belong to the same organization");
      }
      doc.unit = unit._id;
    } else {
      doc.unit = null;
    }
  }
  await doc.save();

  await auditService.record({
    actor: req.user.id,
    action: "item.update",
    targetType: "Item",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Item updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const doc = await Item.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Item not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  doc.isActive = false;
  await doc.save();
  await auditService.record({
    actor: req.user.id,
    action: "item.delete",
    targetType: "Item",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Item deactivated").send(res);
});

module.exports = { list, getOne, create, update, remove };
