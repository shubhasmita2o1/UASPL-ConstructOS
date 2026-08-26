const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Department } = require("../models");
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

  if (req.query.isActive === "true") filter.isActive = true;
  if (req.query.isActive === "false") filter.isActive = false;
  if (req.query.q) {
    const term = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: new RegExp(term, "i") }, { code: new RegExp(term, "i") }];
  }

  const [total, items] = await Promise.all([
    Department.countDocuments(filter),
    Department.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return new ApiResponse(200, { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) }, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const doc = await Department.findById(req.params.id).lean();
  if (!doc) throw ApiError.notFound("Department not found");
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

  const doc = await Department.create({
    name,
    code,
    description: req.body.description || "",
    organization: organizationId,
    isActive: req.body.isActive !== false,
    createdBy: req.user.id,
  });

  await auditService.record({
    actor: req.user.id,
    action: "department.create",
    targetType: "Department",
    targetId: doc._id,
    organization: organizationId,
    req,
  });
  return new ApiResponse(201, doc, "Department created").send(res);
});

const update = catchAsync(async (req, res) => {
  const doc = await Department.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Department not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });

  if (req.body.name !== undefined) doc.name = String(req.body.name).trim();
  if (req.body.code !== undefined) doc.code = String(req.body.code).trim().toUpperCase();
  if (req.body.description !== undefined) doc.description = req.body.description;
  if (req.body.isActive !== undefined) doc.isActive = !!req.body.isActive;
  await doc.save();

  await auditService.record({
    actor: req.user.id,
    action: "department.update",
    targetType: "Department",
    targetId: doc._id,
    organization: doc.organization,
    metadata: { fields: Object.keys(req.body) },
    req,
  });
  return new ApiResponse(200, doc, "Department updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const doc = await Department.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Department not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  doc.isActive = false;
  await doc.save();
  await auditService.record({
    actor: req.user.id,
    action: "department.delete",
    targetType: "Department",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Department deactivated").send(res);
});

module.exports = { list, getOne, create, update, remove };
