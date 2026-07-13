const { UserRole, Organization, Society } = require("../models");

/**
 * Loads a user's active role assignments and merges them into a single
 * access context: distinct roles, the union of every role's permissions,
 * and the set of organizations the user may operate in.
 *
 * A role with dataScope "global" (Super Admin) grants access to every
 * organization; the "super_admin" slug also adds a "*" permission key as a
 * safety net so future permissions don't require re-seeding that role.
 */
async function buildAccessContext(userId) {
  const assignments = await UserRole.find({ user: userId, isActive: true })
    .populate({ path: "role", populate: { path: "permissions", select: "key" } })
    .populate("organization")
    .populate({ path: "society", populate: { path: "organization" } })
    .populate({ path: "project", populate: { path: "organization" } })
    .lean();

  const active = assignments.filter((a) => a.role && a.role.isActive);

  const permissionSet = new Set();
  const roleMap = new Map();
  const orgIds = new Set();
  let isGlobal = false;

  for (const a of active) {
    roleMap.set(String(a.role._id), { id: a.role._id, name: a.role.name, slug: a.role.slug });
    for (const p of a.role.permissions || []) permissionSet.add(p.key);
    if (a.role.slug === "super_admin") permissionSet.add("*");
    if (a.role.dataScope === "global") isGlobal = true;

    if (a.organization) orgIds.add(String(a.organization._id ?? a.organization));
    if (a.society?.organization) orgIds.add(String(a.society.organization._id ?? a.society.organization));
    if (a.project?.organization) orgIds.add(String(a.project.organization._id ?? a.project.organization));
  }

  const organizations = isGlobal
    ? await Organization.find({}).sort({ name: 1 }).lean()
    : await Organization.find({ _id: { $in: [...orgIds] } }).sort({ name: 1 }).lean();

  return {
    roles: [...roleMap.values()],
    permissions: [...permissionSet],
    isGlobal,
    organizations,
    assignments: active,
  };
}

/** Societies the user may access within a given organization. */
async function getSocietiesForOrganization(userId, organizationId) {
  const { isGlobal, assignments } = await buildAccessContext(userId);

  const hasOrgLevelAccess = isGlobal
    || assignments.some(
      (a) => ["organization", "global"].includes(a.role.dataScope)
        && String(a.organization?._id ?? a.organization ?? "") === String(organizationId),
    );

  if (hasOrgLevelAccess) {
    return Society.find({ organization: organizationId }).sort({ name: 1 }).lean();
  }

  const societyIds = new Set();
  for (const a of assignments) {
    if (a.society && String(a.society.organization?._id ?? a.society.organization) === String(organizationId)) {
      societyIds.add(String(a.society._id));
    }
  }

  return Society.find({ _id: { $in: [...societyIds] }, organization: organizationId }).sort({ name: 1 }).lean();
}

function hasPermission(permissions, key) {
  return permissions.includes("*") || permissions.includes(key);
}

module.exports = { buildAccessContext, getSocietiesForOrganization, hasPermission };
