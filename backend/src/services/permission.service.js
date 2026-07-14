const { UserRole, Organization, Society, Project } = require("../models");
const ApiError = require("../utils/ApiError");

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
    .populate({ path: "project", populate: [{ path: "organization" }, { path: "society" }] })
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
    if (a.society?.organization)
      orgIds.add(String(a.society.organization._id ?? a.society.organization));
    if (a.project?.organization)
      orgIds.add(String(a.project.organization._id ?? a.project.organization));
  }

  const organizations = isGlobal
    ? await Organization.find({}).sort({ name: 1 }).lean()
    : await Organization.find({ _id: { $in: [...orgIds] } })
        .sort({ name: 1 })
        .lean();

  return {
    roles: [...roleMap.values()],
    permissions: [...permissionSet],
    isGlobal,
    organizations,
    assignments: active,
  };
}

/**
 * Child-scope documents a user may access under a given parent: Societies
 * under an Organization, or Projects under a Society. Roles scoped at the
 * parent level (or broader) see every child; narrower roles only see the
 * children their own UserRole assignments explicitly point at.
 *
 * Generalizes what used to be two near-identical functions
 * (getSocietiesForOrganization / getProjectsForSociety) into one, so a future
 * scope level (e.g. Buildings under a Project) only needs a new branch here
 * instead of a third copy of the same fetch-all-or-filter-by-ids shape.
 *
 * @param {"organization"|"society"} parentType
 * @param {string} parentId
 * @param {string} userId
 */
async function getScopedChildren(parentType, parentId, userId) {
  const { isGlobal, assignments } = await buildAccessContext(userId);

  let ChildModel;
  let parentField; // field on the child document pointing back at parentId
  let childField; // field on a UserRole assignment pointing at one specific child
  let hasParentLevelAccess = isGlobal;

  if (parentType === "organization") {
    ChildModel = Society;
    parentField = "organization";
    childField = "society";
    hasParentLevelAccess ||= assignments.some(
      (a) =>
        ["organization", "global"].includes(a.role.dataScope) &&
        String(a.organization?._id ?? a.organization ?? "") === String(parentId),
    );
  } else if (parentType === "society") {
    const society = await Society.findById(parentId).lean();
    if (!society) return [];
    ChildModel = Project;
    parentField = "society";
    childField = "project";
    hasParentLevelAccess ||=
      assignments.some(
        (a) =>
          ["organization", "global"].includes(a.role.dataScope) &&
          String(a.organization?._id ?? a.organization ?? "") === String(society.organization),
      ) ||
      assignments.some(
        (a) =>
          a.role.dataScope === "society" &&
          String(a.society?._id ?? a.society ?? "") === String(parentId),
      );
  } else {
    throw new Error(`getScopedChildren: unsupported parentType "${parentType}"`);
  }

  if (hasParentLevelAccess) {
    return ChildModel.find({ [parentField]: parentId }).sort({ name: 1 }).lean();
  }

  const childIds = new Set();
  for (const a of assignments) {
    const child = a[childField];
    const childParent = childField === "society" ? child?.organization : child?.society;
    if (child && String(childParent?._id ?? childParent ?? "") === String(parentId)) {
      childIds.add(String(child._id));
    }
  }

  return ChildModel.find({ _id: { $in: [...childIds] }, [parentField]: parentId })
    .sort({ name: 1 })
    .lean();
}

/** Societies the user may access within a given organization. */
function getSocietiesForOrganization(userId, organizationId) {
  return getScopedChildren("organization", organizationId, userId);
}

/**
 * Projects the user may access within a given society. Kept as a named
 * wrapper around getScopedChildren so existing call sites don't need to change.
 */
function getProjectsForSociety(userId, societyId) {
  return getScopedChildren("society", societyId, userId);
}

/**
 * Throws ApiError.forbidden() unless the caller has access to every part of
 * the requested scope. Global-scope roles (Super Admin) always pass. This is
 * the single place tenant/scope access should be checked from — controllers
 * should call this instead of re-deriving access with their own inline logic.
 *
 * @param {{id: string}|string} reqUser - req.user (or a raw userId string)
 * @param {{organization?: string, society?: string, project?: string}} requestedScope
 *   Any subset may be provided. Passing none at all (e.g. assigning a
 *   global/unscoped role) is only permitted for global-scope callers —
 *   a non-global caller must always name a scope they actually have access to.
 */
async function assertScopeAccess(reqUser, requestedScope = {}) {
  const userId = typeof reqUser === "string" ? reqUser : reqUser?.id;
  const { organization, society, project } = requestedScope;
  const { isGlobal, organizations } = await buildAccessContext(userId);
  if (isGlobal) return;

  if (!organization && !society && !project) {
    throw ApiError.forbidden("You do not have access to this scope");
  }

  if (organization) {
    const allowed = organizations.some((o) => String(o._id) === String(organization));
    if (!allowed) throw ApiError.forbidden("You do not have access to this organization");
  }

  if (society) {
    const doc = await Society.findById(society).lean();
    if (!doc) throw ApiError.notFound("Society not found");
    const accessible = await getScopedChildren("organization", doc.organization, userId);
    if (!accessible.some((s) => String(s._id) === String(society))) {
      throw ApiError.forbidden("You do not have access to this society");
    }
  }

  if (project) {
    const doc = await Project.findById(project).lean();
    if (!doc) throw ApiError.notFound("Project not found");
    const accessible = await getScopedChildren("society", doc.society, userId);
    if (!accessible.some((p) => String(p._id) === String(project))) {
      throw ApiError.forbidden("You do not have access to this project");
    }
  }
}

function hasPermission(permissions, key) {
  return permissions.includes("*") || permissions.includes(key);
}

module.exports = {
  buildAccessContext,
  getScopedChildren,
  getSocietiesForOrganization,
  getProjectsForSociety,
  assertScopeAccess,
  hasPermission,
};
