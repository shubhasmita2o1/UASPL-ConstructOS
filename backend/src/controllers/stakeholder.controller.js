const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Stakeholder, Society } = require("../models");
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
      { email: new RegExp(term, "i") },
      { contact: new RegExp(term, "i") },
    ];
  }
  const [total, items] = await Promise.all([
    Stakeholder.countDocuments(filter),
    Stakeholder.find(filter)
      .populate("linkedSociety", "name code")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);
  return new ApiResponse(200, { items, total, page, pages: Math.max(Math.ceil(total / limit), 1) }, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const doc = await Stakeholder.findById(req.params.id).populate("linkedSociety", "name code").lean();
  if (!doc) throw ApiError.notFound("Stakeholder not found");
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

  let linkedSociety = req.body.linkedSociety || null;
  if (linkedSociety) {
    const society = await Society.findById(linkedSociety);
    if (!society) throw ApiError.badRequest("Society not found");
    if (String(society.organization) !== String(organizationId)) {
      throw ApiError.badRequest("Society must belong to the same organization");
    }
  }

  const doc = await Stakeholder.create({
    name,
    type: req.body.type || "Other",
    organization: organizationId,
    contact: req.body.contact || "",
    email: req.body.email || "",
    phone: req.body.phone || "",
    address: req.body.address || "",
    linkedSociety,
    isActive: req.body.isActive !== false,
    createdBy: req.user.id,
  });

  await auditService.record({
    actor: req.user.id,
    action: "stakeholder.create",
    targetType: "Stakeholder",
    targetId: doc._id,
    organization: organizationId,
    req,
  });
  return new ApiResponse(201, doc, "Stakeholder created").send(res);
});

const update = catchAsync(async (req, res) => {
  const doc = await Stakeholder.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Stakeholder not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });

  for (const f of ["name", "type", "contact", "email", "phone", "address"]) {
    if (req.body[f] !== undefined) doc[f] = req.body[f];
  }
  if (req.body.isActive !== undefined) doc.isActive = !!req.body.isActive;
  if (req.body.linkedSociety !== undefined) {
    if (req.body.linkedSociety) {
      const society = await Society.findById(req.body.linkedSociety);
      if (!society) throw ApiError.badRequest("Society not found");
      if (String(society.organization) !== String(doc.organization)) {
        throw ApiError.badRequest("Society must belong to the same organization");
      }
      doc.linkedSociety = society._id;
    } else {
      doc.linkedSociety = null;
    }
  }
  await doc.save();

  await auditService.record({
    actor: req.user.id,
    action: "stakeholder.update",
    targetType: "Stakeholder",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Stakeholder updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const doc = await Stakeholder.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Stakeholder not found");
  await permissionService.assertScopeAccess(req.user, { organization: doc.organization });
  doc.isActive = false;
  await doc.save();
  await auditService.record({
    actor: req.user.id,
    action: "stakeholder.delete",
    targetType: "Stakeholder",
    targetId: doc._id,
    organization: doc.organization,
    req,
  });
  return new ApiResponse(200, doc, "Stakeholder deactivated").send(res);
});

module.exports = { list, getOne, create, update, remove };
