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
    roleMap.set(String(a.role._id), {
      id: a.role._id,
      name: a.role.name,
      slug: a.role.slug,
      sidebarMenus: a.role.sidebarMenus || [],
      dashboardWidgets: a.role.dashboardWidgets || [],
    });
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
 * @param {"organization"|"society"} parentType
 * @param {string} parentId
 * @param {string} userId
 */
async function getScopedChildren(parentType, parentId, userId) {
  const { isGlobal, assignments } = await buildAccessContext(userId);

  let ChildModel;
  let parentField;
  let childField;
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
 * Projects the user may access within a given society.
 */
function getProjectsForSociety(userId, societyId) {
  return getScopedChildren("society", societyId, userId);
}

/**
 * Throws ApiError.forbidden() unless the caller has access to every part of
 * the requested scope. Global-scope roles (Super Admin) always pass.
 *
 * @param {{id: string}|string} reqUser
 * @param {{organization?: string, society?: string, project?: string}} requestedScope
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

/**
 * Build a Mongo filter fragment that restricts results to organizations
 * the user may access. Global → {}.
 * For documents that store tenant as `organization` field.
 */
async function organizationFilterForUser(userId) {
  const { isGlobal, organizations } = await buildAccessContext(userId);
  if (isGlobal) return {};
  return { organization: { $in: organizations.map((o) => o._id) } };
}

/**
 * Resolve the organization id that must be stamped on a new document.
 * Prefer session workspace; optionally accept a body/query candidate only
 * if membership allows it. Never accept an unvalidated client id.
 *
 * @param {{id: string, orgId?: string}|string} reqUser
 * @param {string|null} candidateOrgId
 * @returns {Promise<string>} organizationId
 */
async function resolveCreateOrganizationId(reqUser, candidateOrgId = null) {
  const userId = typeof reqUser === "string" ? reqUser : reqUser?.id;
  const sessionOrg = typeof reqUser === "object" ? reqUser.orgId || null : null;
  const { isGlobal, organizations } = await buildAccessContext(userId);

  if (candidateOrgId) {
    const allowed =
      isGlobal ||
      organizations.some((o) => String(o._id) === String(candidateOrgId));
    if (!allowed) throw ApiError.forbidden("You do not have access to this organization");
    return String(candidateOrgId);
  }

  if (sessionOrg) {
    const allowed =
      isGlobal || organizations.some((o) => String(o._id) === String(sessionOrg));
    if (!allowed) throw ApiError.forbidden("You do not have access to this organization");
    return String(sessionOrg);
  }

  throw ApiError.badRequest("No organization selected for this session");
}

module.exports = {
  buildAccessContext,
  getScopedChildren,
  getSocietiesForOrganization,
  getProjectsForSociety,
  assertScopeAccess,
  hasPermission,
  organizationFilterForUser,
  resolveCreateOrganizationId,
};