const create = catchAsync(async (req, res) => {
  const {
    name,
    email,
    employeeId,
    phone,
    title,
    password,
    roleId,
    role: roleFromBody,
    organizationId,
    societyId,
    projectId,
  } = req.body;

  const { isGlobal } = await permissionService.buildAccessContext(req.user.id);

  // Never trust client organizationId alone — resolve via membership / session.
  // Always require a target organization for user creation (including Super Admin:
  // pass body.organizationId or select a workspace session).
  const resolvedOrgId = await permissionService.resolveCreateOrganizationId(
    req.user,
    organizationId || null,
  );

  // Role: accept roleId or role. Required for non-global; global may omit and
  // fall back to the system org_admin role when seeding membership.
  let resolvedRoleId = roleId || roleFromBody || null;
  if (!resolvedRoleId) {
    if (!isGlobal) {
      throw ApiError.badRequest("A role is required when creating a user");
    }
    const defaultRole = await Role.findOne({ slug: "org_admin", isActive: true }).lean();
    if (!defaultRole) {
      throw ApiError.badRequest("roleId is required (default org_admin role not found)");
    }
    resolvedRoleId = defaultRole._id;
  }

  // Optional society / project — only if caller may access that scope
  let resolvedSocietyId = societyId || null;
  let resolvedProjectId = projectId || null;
  if (resolvedSocietyId || resolvedProjectId) {
    await permissionService.assertScopeAccess(req.user, {
      organization: resolvedOrgId,
      society: resolvedSocietyId || undefined,
      project: resolvedProjectId || undefined,
    });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  const user = new User({
    name,
    email,
    employeeId: employeeId || undefined,
    phone,
    title,
    mustChangePassword: true,
  });
  await user.setPassword(password);
  await user.save();

  let assignment;
  try {
    assignment = await UserRole.findOneAndUpdate(
      {
        user: user._id,
        role: resolvedRoleId,
        organization: resolvedOrgId,
        society: resolvedSocietyId || null,
        project: resolvedProjectId || null,
      },
      {
        $set: {
          assignedBy: req.user.id,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).populate("role", "name slug");
  } catch (err) {
    // Avoid orphan users with zero org membership
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  await auditService.record({
    actor: req.user.id,
    action: "user.create",
    targetType: "User",
    targetId: user._id,
    organization: resolvedOrgId,
    req,
  });

  await auditService.record({
    actor: req.user.id,
    action: "user.assign_role",
    targetType: "User",
    targetId: user._id,
    organization: resolvedOrgId,
    metadata: {
      role: resolvedRoleId,
      organization: resolvedOrgId,
      society: resolvedSocietyId,
      project: resolvedProjectId,
    },
    req,
  });

  const payload = {
    ...(typeof user.toObject === "function" ? user.toObject() : user),
    roleAssignments: [assignment],
  };
  return new ApiResponse(201, payload, "User created").send(res);
});