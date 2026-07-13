const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Role, RolePermission, UserRole } = require("../models");
const auditService = require("../services/audit.service");

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

async function recordPermissionDiff({ roleId, before, after, actorId }) {
  const beforeSet = new Set(before.map(String));
  const afterSet = new Set(after.map(String));
  const granted = [...afterSet].filter((id) => !beforeSet.has(id));
  const revoked = [...beforeSet].filter((id) => !afterSet.has(id));

  const entries = [
    ...granted.map((permission) => ({ role: roleId, permission, action: "granted", grantedBy: actorId })),
    ...revoked.map((permission) => ({ role: roleId, permission, action: "revoked", grantedBy: actorId })),
  ];
  if (entries.length) await RolePermission.insertMany(entries);
}

const list = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const { q } = req.query;

  const filter = {};
  if (q) {
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { description: regex }];
  }

  const [total, roles] = await Promise.all([
    Role.countDocuments(filter),
    Role.find(filter).populate("permissions", "key label module").sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
  ]);

  return new ApiResponse(200, {
    items: roles,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  }, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const role = await Role.findById(req.params.id).populate("permissions", "key label module");
  if (!role) throw ApiError.notFound("Role not found");
  return new ApiResponse(200, role, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const { name, description, dataScope, organization, permissions = [], sidebarMenus = [], dashboardWidgets = [] } = req.body;
  const slug = slugify(name);

  const exists = await Role.findOne({ slug, organization: organization || null });
  if (exists) throw ApiError.conflict("A role with this name already exists");

  const role = await Role.create({
    name, slug, description, dataScope, organization: organization || null,
    permissions, sidebarMenus, dashboardWidgets,
  });

  await recordPermissionDiff({ roleId: role._id, before: [], after: permissions, actorId: req.user.id });
  await auditService.record({ actor: req.user.id, action: "role.create", targetType: "Role", targetId: role._id, req });

  return new ApiResponse(201, role, "Role created").send(res);
});

const update = catchAsync(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System roles cannot be renamed or reconfigured");

  const { name, description, dataScope, sidebarMenus, dashboardWidgets } = req.body;
  if (name !== undefined) { role.name = name; role.slug = slugify(name); }
  if (description !== undefined) role.description = description;
  if (dataScope !== undefined) role.dataScope = dataScope;
  if (sidebarMenus !== undefined) role.sidebarMenus = sidebarMenus;
  if (dashboardWidgets !== undefined) role.dashboardWidgets = dashboardWidgets;
  await role.save();

  await auditService.record({ actor: req.user.id, action: "role.update", targetType: "Role", targetId: role._id, req });
  return new ApiResponse(200, role, "Role updated").send(res);
});

const updatePermissions = catchAsync(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System role permissions are managed by the platform");

  const before = role.permissions.map(String);
  role.permissions = req.body.permissions;
  await role.save();

  await recordPermissionDiff({ roleId: role._id, before, after: role.permissions, actorId: req.user.id });
  await auditService.record({ actor: req.user.id, action: "role.update_permissions", targetType: "Role", targetId: role._id, req });

  const populated = await Role.findById(role._id).populate("permissions", "key label module");
  return new ApiResponse(200, populated, "Permissions updated").send(res);
});

const updateStatus = catchAsync(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem && !req.body.isActive) throw ApiError.forbidden("System roles cannot be disabled");

  role.isActive = req.body.isActive;
  await role.save();

  await auditService.record({ actor: req.user.id, action: "role.update_status", targetType: "Role", targetId: role._id, metadata: { isActive: role.isActive }, req });
  return new ApiResponse(200, role, "Role status updated").send(res);
});

const duplicate = catchAsync(async (req, res) => {
  const source = await Role.findById(req.params.id);
  if (!source) throw ApiError.notFound("Role not found");

  let name = `${source.name} Copy`;
  let slug = slugify(name);
  let suffix = 2;
  while (await Role.findOne({ slug, organization: source.organization })) {
    name = `${source.name} Copy ${suffix}`;
    slug = slugify(name);
    suffix += 1;
  }

  const clone = await Role.create({
    name, slug,
    description: source.description,
    organization: source.organization,
    permissions: source.permissions,
    sidebarMenus: source.sidebarMenus,
    dashboardWidgets: source.dashboardWidgets,
    dataScope: source.dataScope,
    isSystem: false,
    isActive: true,
  });

  await recordPermissionDiff({ roleId: clone._id, before: [], after: clone.permissions, actorId: req.user.id });
  await auditService.record({ actor: req.user.id, action: "role.duplicate", targetType: "Role", targetId: clone._id, metadata: { sourceRole: source._id }, req });

  return new ApiResponse(201, clone, "Role duplicated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.isSystem) throw ApiError.forbidden("System roles cannot be deleted");

  const inUse = await UserRole.exists({ role: role._id, isActive: true });
  if (inUse) throw ApiError.conflict("This role is assigned to one or more users and cannot be deleted");

  await role.deleteOne();
  await auditService.record({ actor: req.user.id, action: "role.delete", targetType: "Role", targetId: role._id, req });
  return new ApiResponse(200, null, "Role deleted").send(res);
});

const listAssignedUsers = catchAsync(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Role not found");

  const assignments = await UserRole.find({ role: role._id, isActive: true })
    .populate("user", "name email employeeId status")
    .populate("organization", "name")
    .populate("society", "name")
    .populate("project", "name")
    .sort({ createdAt: -1 })
    .lean();

  return new ApiResponse(200, assignments, "OK").send(res);
});

module.exports = {
  list, getOne, create, update, updatePermissions, updateStatus, duplicate, remove,
  listAssignedUsers,
};
