// controllers/project.controller.js
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Project, Society } = require("../models");
const auditService = require("../services/audit.service");
const permissionService = require("../services/permission.service");

const list = catchAsync(async (req, res) => {
  const { isGlobal, organizations } = await permissionService.buildAccessContext(req.user.id);
  const accessibleOrgIds = organizations.map((o) => o._id);

  const filter = {};
  if (!isGlobal) filter.organization = { $in: accessibleOrgIds };

  // Optional narrow by organizationId query or session workspace
  if (req.query.organizationId) {
    const requested = String(req.query.organizationId);
    const allowed =
      isGlobal || accessibleOrgIds.some((id) => String(id) === requested);
    filter.organization = allowed ? requested : { $in: [] };
  } else if (req.organizationId) {
    const allowed =
      isGlobal || accessibleOrgIds.some((id) => String(id) === String(req.organizationId));
    if (allowed) filter.organization = req.organizationId;
  }

  // Optional narrow by societyId (must still be within accessible orgs)
  if (req.query.societyId) {
    const society = await Society.findById(req.query.societyId).lean();
    if (!society) {
      filter._id = { $in: [] };
    } else {
      const orgAllowed =
        isGlobal || accessibleOrgIds.some((id) => String(id) === String(society.organization));
      if (!orgAllowed) {
        filter._id = { $in: [] };
      } else {
        filter.society = society._id;
        // Keep org filter consistent with the society's org
        filter.organization = society.organization;
      }
    }
  } else if (req.societyId) {
    filter.society = req.societyId;
  }

  const projects = await Project.find(filter).sort({ name: 1 }).lean();
  return new ApiResponse(200, projects, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id).lean();
  if (!project) throw ApiError.notFound("Project not found");

  await permissionService.assertScopeAccess(req.user, {
    organization: project.organization,
    society: project.society,
    project: project._id,
  });

  return new ApiResponse(200, project, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const organizationId = await permissionService.resolveCreateOrganizationId(
    req.user,
    req.body.organizationId || null,
  );

  const societyId = req.body.societyId || req.body.society || null;
  if (!societyId) throw ApiError.badRequest("Society is required");

  const society = await Society.findById(societyId).lean();
  if (!society) throw ApiError.notFound("Society not found");
  if (String(society.organization) !== String(organizationId)) {
    throw ApiError.forbidden("Society does not belong to the selected organization");
  }

  // Ensure caller can access that society (non-global)
  await permissionService.assertScopeAccess(req.user, {
    organization: organizationId,
    society: society._id,
  });

  const name = String(req.body.name || "").trim();
  if (!name) throw ApiError.badRequest("Project name is required");

  const project = await Project.create({
    name,
    organization: organizationId,
    society: society._id,
    phase: req.body.phase,
    createdBy: req.user.id,
  });

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

  // Never allow moving a project to another tenant or society via body
  const { name, phase } = req.body;
  if (name !== undefined) project.name = name;
  if (phase !== undefined) project.phase = phase;
  await project.save();

  await auditService.record({
    actor: req.user.id,
    action: "project.update",
    targetType: "Project",
    targetId: project._id,
    organization: project.organization,
    society: project.society,
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