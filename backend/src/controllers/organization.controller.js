const create = catchAsync(async (req, res) => {
  // Creating an Organization = creating a tenant. Only global / platform admins.
  const { isGlobal } = await permissionService.buildAccessContext(req.user.id);
  if (!isGlobal) {
    throw ApiError.forbidden("Only platform administrators can create organizations");
  }

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