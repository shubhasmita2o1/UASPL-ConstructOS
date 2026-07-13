const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { User, UserRole } = require("../models");
const auditService = require("../services/audit.service");
const authService = require("../services/auth.service");
const { generateToken } = require("../utils/crypto");

async function withRoles(users) {
  const list = Array.isArray(users) ? users : [users];
  const ids = list.map((u) => u._id);
  const assignments = await UserRole.find({ user: { $in: ids }, isActive: true })
    .populate("role", "name slug")
    .populate("organization", "name")
    .populate("society", "name")
    .populate("project", "name")
    .lean();

  const byUser = new Map();
  for (const a of assignments) {
    const key = String(a.user);
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key).push(a);
  }

  const result = list.map((u) => ({ ...u, roleAssignments: byUser.get(String(u._id)) || [] }));
  return Array.isArray(users) ? result : result[0];
}

const list = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const { q, status, role } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { email: regex }, { employeeId: regex }];
  }

  let userIds = null;
  if (role) {
    const roleAssignments = await UserRole.find({ role, isActive: true }).distinct("user");
    userIds = roleAssignments.map(String);
    filter._id = { $in: userIds };
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  const enriched = await withRoles(users);

  return new ApiResponse(200, {
    items: enriched,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
  }, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound("User not found");
  const enriched = await withRoles(user);
  return new ApiResponse(200, enriched, "OK").send(res);
});

const create = catchAsync(async (req, res) => {
  const { name, email, employeeId, phone, title, password } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  const user = new User({ name, email, employeeId: employeeId || undefined, phone, title, mustChangePassword: true });
  await user.setPassword(password);
  await user.save();

  await auditService.record({ actor: req.user.id, action: "user.create", targetType: "User", targetId: user._id, req });
  return new ApiResponse(201, user, "User created").send(res);
});

const update = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const { name, title, employeeId, phone, status } = req.body;
  if (name !== undefined) user.name = name;
  if (title !== undefined) user.title = title;
  if (employeeId !== undefined) user.employeeId = employeeId || undefined;
  if (phone !== undefined) user.phone = phone;
  if (status !== undefined) user.status = status;
  await user.save();

  if (status === "inactive") await authService.revokeAllSessionsForUser(user._id);

  await auditService.record({ actor: req.user.id, action: "user.update", targetType: "User", targetId: user._id, req });
  return new ApiResponse(200, user, "User updated").send(res);
});

const remove = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (String(user._id) === String(req.user.id)) throw ApiError.badRequest("You cannot delete your own account");

  await UserRole.deleteMany({ user: user._id });
  await authService.revokeAllSessionsForUser(user._id);
  await user.deleteOne();

  await auditService.record({ actor: req.user.id, action: "user.delete", targetType: "User", targetId: user._id, req });
  return new ApiResponse(200, null, "User deleted").send(res);
});

const unlock = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  if (user.status === "locked") user.status = "active";
  await user.save();

  await auditService.record({ actor: req.user.id, action: "user.unlock", targetType: "User", targetId: user._id, req });
  return new ApiResponse(200, user, "Account unlocked").send(res);
});

const lock = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (String(user._id) === String(req.user.id)) throw ApiError.badRequest("You cannot lock your own account");

  user.status = "locked";
  await user.save();
  await authService.revokeAllSessionsForUser(user._id);

  await auditService.record({ actor: req.user.id, action: "user.lock", targetType: "User", targetId: user._id, req });
  return new ApiResponse(200, user, "Account locked").send(res);
});

const resetPassword = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const temporaryPassword = generateToken(9);
  await user.setPassword(temporaryPassword);
  user.mustChangePassword = true;
  await user.save();
  await authService.revokeAllSessionsForUser(user._id);

  await auditService.record({ actor: req.user.id, action: "user.reset_password", targetType: "User", targetId: user._id, req });
  return new ApiResponse(200, { temporaryPassword }, "Password reset").send(res);
});

const forceLogout = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  await authService.revokeAllSessionsForUser(user._id);

  await auditService.record({ actor: req.user.id, action: "user.force_logout", targetType: "User", targetId: user._id, req });
  return new ApiResponse(200, null, "All sessions revoked").send(res);
});

const assignRole = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const { role, organization, society, project, building } = req.body;
  const assignment = await UserRole.findOneAndUpdate(
    { user: user._id, role, organization: organization || null, society: society || null, project: project || null },
    { $set: { building: building || null, assignedBy: req.user.id, isActive: true } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).populate("role", "name slug");

  await auditService.record({ actor: req.user.id, action: "user.assign_role", targetType: "User", targetId: user._id, metadata: { role, organization, society, project }, req });
  return new ApiResponse(201, assignment, "Role assigned").send(res);
});

const revokeRole = catchAsync(async (req, res) => {
  const assignment = await UserRole.findOne({ _id: req.params.userRoleId, user: req.params.id });
  if (!assignment) throw ApiError.notFound("Role assignment not found");

  assignment.isActive = false;
  await assignment.save();

  await auditService.record({ actor: req.user.id, action: "user.revoke_role", targetType: "User", targetId: req.params.id, metadata: { userRoleId: assignment._id }, req });
  return new ApiResponse(200, null, "Role removed").send(res);
});

module.exports = {
  list, getOne, create, update, remove,
  unlock, lock, resetPassword, forceLogout,
  assignRole, revokeRole,
};
