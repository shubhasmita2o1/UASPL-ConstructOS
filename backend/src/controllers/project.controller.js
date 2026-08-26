const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Project, Society } = require("../models");
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
  if (req.query.societyId) filter.society = req.query.societyId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.phase) filter.phase = req.query.phase;
  if (req.query.q) {
    const term = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ name: new RegExp(term, "i") }, { code: new RegExp(term, "i") }];
  }

  const projects = await Project.find(filter)
    .populate("society", "name code")
    .populate("projectManager", "name email")
    .sort({ name: 1 })
    .lean();
  return new ApiResponse(200, projects, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("society", "name code")
    .populate("projectManager", "name email")
    .lean();
  if (!project) throw ApiError.notFound("Project not found");

  await permissionService.assertScopeAccess(req.user, {
    organization: project.organization,
    society: project.society?._id || project.society,
    project: project._id,
  });

  return new ApiResponse(200, project, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const organizationId = await permissionService.resolveCreateOrganizationId(
    req.user,
    req.body.organizationId || null,
  );

  const societyId = req.body.societyId || req.body.society;
  if (!societyId) throw ApiError.badRequest("societyId is required");

  const society = await Society.findById(societyId);
  if (!society) throw ApiError.notFound("Society not found");
  if (String(society.organization) !== String(organizationId)) {
    throw ApiError.forbidden("Society does not belong to the selected organization");
  }

  await permissionService.assertScopeAccess(req.user, {
    organization: organizationId,
    society: society._id,
  });

  const name = String(req.body.name || "").trim();
  if (!name) throw ApiError.badRequest("Project name is required");

  const project = await Project.create({
    name,
    code: req.body.code ? String(req.body.code).trim().toUpperCase() : null,
    description: req.body.description || "",
    organization: organizationId,
    society: society._id,
    phase: req.body.phase,
    status: req.body.status || "Active",
    startDate: req.body.startDate || null,
    targetEndDate: req.body.targetEndDate || null,
    actualEndDate: req.body.actualEndDate || null,
    budgetAmount: Number(req.body.budgetAmount) || 0,
    currency: req.body.currency || "INR",
    projectManager: req.body.projectManager || null,
    address: req.body.address || "",
    createdBy: req.user.id,
  });

  await bumpCounter(organizationId, "projects", 1);

  await auditService.record({
    actor: req.user.id,
    action: "project.create",
    targetType: "Project",
    targetId: project._id,
    organization: organizationId,
    society: society._id,
    req,
  });

  return new ApiResponse(201, project, "Project created").send(res);
});

const update = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound("Project not found");

  await permissionService.assertScopeAccess(req.user, {
    organization: project.organization,
    society: project.society,
    project: project._id,
  });

  // Never allow changing organization
  const fields = [
    "name", "description", "phase", "status", "startDate", "targetEndDate",
    "actualEndDate", "budgetAmount", "currency", "projectManager", "address",
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) project[f] = req.body[f];
  }
  if (req.body.code !== undefined) {
    project.code = req.body.code ? String(req.body.code).trim().toUpperCase() : null;
  }

  // Society change only if same organization
  if (req.body.societyId || req.body.society) {
    const newSocietyId = req.body.societyId || req.body.society;
    const society = await Society.findById(newSocietyId);
    if (!society) throw ApiError.notFound("Society not found");
    if (String(society.organization) !== String(project.organization)) {
      throw ApiError.forbidden("Cannot move project to a society in another organization");
    }
    project.society = society._id;
  }

  await project.save();

  await auditService.record({
    actor: req.user.id,
    action: "project.update",
    targetType: "Project",
    targetId: project._id,
    organization: project.organization,
    society: project.society,
    metadata: { fields: Object.keys(req.body) },
    req,
  });

  return new ApiResponse(200, project, "Project updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound("Project not found");

  await permissionService.assertScopeAccess(req.user, {
    organization: project.organization,
    society: project.society,
    project: project._id,
  });

  const orgId = project.organization;
  const societyId = project.society;
  await project.deleteOne();
  await refreshOrganizationCounters(orgId);

  await auditService.record({
    actor: req.user.id,
    action: "project.delete",
    targetType: "Project",
    targetId: project._id,
    organization: orgId,
    society: societyId,
    req,
  });

  return new ApiResponse(200, null, "Project deleted").send(res);
});

module.exports = { list, getOne, create, update, remove };
