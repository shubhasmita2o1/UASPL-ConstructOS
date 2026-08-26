const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Vendor } = require("../models");
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
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    const term = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: new RegExp(term, "i") },
      { code: new RegExp(term, "i") },
      { gstin: new RegExp(term, "i") },
      { city: new RegExp(term, "i") },
    ];
  }
  const [total, items] = await Promise.all([
    Vendor.countDocuments(filter),
    Vendor.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return new ApiResponse(200, { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) }, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const doc = await Vendor.findById(req.params.id).lean();
  if (!doc) throw ApiError.notFound("Vendor not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  return new ApiResponse(200, doc, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const organizationId = await permissionService.resolveCreateOrganizationId(
    req.user,
    req.body.organizationId || null,
  );
  const name = String(req.body.name || "").trim();
  if (!name) throw ApiError.badRequest("Name is required");
  const code = req.body.code ? String(req.body.code).trim().toUpperCase() : null;

  const doc = await Vendor.create({
    name,
    code,
    contact: req.body.contact || {},
    gstin: req.body.gstin || "",
    pan: req.body.pan || "",
    address: req.body.address || "",
    city: req.body.city || "",
    state: req.body.state || "",
    pincode: req.body.pincode || "",
    category: req.body.category || "",
    status: req.body.status || "Active",
    notes: req.body.notes || "",
    organization: organizationId,
    createdBy: req.user.id,
  });

  await auditService.record({
    actor: req.user.id,
    action: "vendor.create",
    targetType: "Vendor",
    targetId: doc._id,
    organization: organizationId,
    req,
  });
  return new ApiResponse(201, doc, "Vendor created").send(res);
});

const update = catchAsync(async (req, res) => {
  const doc = await Vendor.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Vendor not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });

  const fields = [
    "name", "gstin", "pan", "address", "city", "state", "pincode", "category", "status", "notes",
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) doc[f] = req.body[f];
  }
  if (req.body.code !== undefined) {
    doc.code = req.body.code ? String(req.body.code).trim().toUpperCase() : null;
  }
  if (req.body.contact !== undefined) doc.contact = req.body.contact;
  await doc.save();

  await auditService.record({
    actor: req.user.id,
    action: "vendor.update",
    targetType: "Vendor",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Vendor updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const doc = await Vendor.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Vendor not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  doc.status = "Inactive";
  await doc.save();
  await auditService.record({
    actor: req.user.id,
    action: "vendor.delete",
    targetType: "Vendor",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Vendor deactivated").send(res);
});

module.exports = { list, getOne, create, update, remove };
