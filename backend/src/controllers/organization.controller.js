const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Organization } = require("../models");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");

const ALLOWED_CREATE = [
  "name", "code", "plan", "status", "city", "industry", "gstin",
  "website", "founded", "address", "description", "logoColor", "contact",
];

const ALLOWED_UPDATE = [
  "name", "code", "plan", "status", "city", "industry", "gstin",
  "website", "founded", "address", "description", "logoColor", "contact",
];

function pick(body, keys) {
  const out = {};
  for (const key of keys) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

function normalizeOrg(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  o.id = String(o._id);
  return o;
}

const list = catchAsync(async (req, res) => {
  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const query = isGlobal ? {} : { _id: { $in: organizations.map((o) => o._id) } };

  // Optional filters from query string
  if (req.query.status) query.status = req.query.status;
  if (req.query.plan) query.plan = req.query.plan;
  if (req.query.q) {
    const term = String(req.query.q).trim();
    if (term) {
      query.$or = [
        { name: new RegExp(term, "i") },
        { city: new RegExp(term, "i") },
        { industry: new RegExp(term, "i") },
        { code: new RegExp(term, "i") },
      ];
    }
  }

  const results = await Organization.find(query).sort({ name: 1 }).lean();
  return new ApiResponse(200, results.map(normalizeOrg), "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  await permissionService.assertScopeAccess(req.user, { organization: req.params.id });
  const organization = await Organization.findById(req.params.id).lean();
  if (!organization) throw ApiError.notFound("Organization not found");
  return new ApiResponse(200, normalizeOrg(organization), "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const payload = pick(req.body, ALLOWED_CREATE);
  if (!payload.name || !String(payload.name).trim()) {
    throw ApiError.badRequest("Organization name is required");
  }
  if (!payload.status) payload.status = "Onboarding";
  if (!payload.plan) payload.plan = "Business";

  const organization = await Organization.create(payload);
  await auditService.record({
    actor: req.user.id,
    action: "organization.create",
    targetType: "Organization",
    targetId: organization._id,
    organization: organization._id,
    req,
  });
  return new ApiResponse(201, normalizeOrg(organization), "Organization created").send(res);
});

const update = catchAsync(async (req, res) => {
  await permissionService.assertScopeAccess(req.user, { organization: req.params.id });
  const organization = await Organization.findById(req.params.id);
  if (!organization) throw ApiError.notFound("Organization not found");

  const payload = pick(req.body, ALLOWED_UPDATE);
  Object.assign(organization, payload);
  await organization.save();

  await auditService.record({
    actor: req.user.id,
    action: "organization.update",
    targetType: "Organization",
    targetId: organization._id,
    organization: organization._id,
    metadata: { fields: Object.keys(payload) },
    req,
  });
  return new ApiResponse(200, normalizeOrg(organization), "Organization updated").send(res);
});

/** Soft-delete: set status to Archived (keeps history). */
const remove = catchAsync(async (req, res) => {
  await permissionService.assertScopeAccess(req.user, { organization: req.params.id });
  const organization = await Organization.findById(req.params.id);
  if (!organization) throw ApiError.notFound("Organization not found");

  organization.status = "Archived";
  await organization.save();

  await auditService.record({
    actor: req.user.id,
    action: "organization.archive",
    targetType: "Organization",
    targetId: organization._id,
    organization: organization._id,
    req,
  });
  return new ApiResponse(200, normalizeOrg(organization), "Organization archived").send(res);
});

module.exports = { list, getOne, create, update, remove };