const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const permissionService = require("../services/permission.service");

/**
 * Intentionally minimal: activeProjects is the one number the existing
 * dashboard can honestly show from real data today. Extend this as more
 * modules (finance, drawings, approvals) get real backend collections.
 */
const summary = catchAsync(async (req, res) => {
  const projects = await permissionService.getProjectsForSociety(req.user.id, req.user.societyId);
  return new ApiResponse(200, { activeProjects: projects.length }, "OK").send(res);
});

module.exports = { summary };
