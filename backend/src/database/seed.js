/* Idempotent seed: permission catalog, 5 default roles, one org/society, one Super Admin user. */
const crypto = require("crypto");
const env = require("../config/env");
const connectDB = require("../config/db");
const { User, Organization, Society, Role, Permission, UserRole } = require("../models");

const PERMISSIONS = [
  ["project.view", "project", "view"], ["project.create", "project", "create"],
  ["project.edit", "project", "edit"], ["project.delete", "project", "delete"],

  ["organization.view", "organization", "view"], ["organization.create", "organization", "create"],
  ["organization.edit", "organization", "edit"],

  ["society.view", "society", "view"],

  ["user.view", "user", "view"], ["user.create", "user", "create"],
  ["user.edit", "user", "edit"], ["user.delete", "user", "delete"],

  ["role.view", "role", "view"], ["role.manage", "role", "manage"],

  ["users.manage", "users", "manage"], ["roles.manage", "roles", "manage"],
  ["permissions.manage", "permissions", "manage"],

  ["drawing.upload", "drawing", "upload"], ["drawing.review", "drawing", "review"],
  ["drawing.approve", "drawing", "approve"],

  ["inventory.issue", "inventory", "issue"], ["inventory.receive", "inventory", "receive"],

  ["finance.view", "finance", "view"], ["finance.approve", "finance", "approve"],

  ["reports.view", "reports", "view"], ["reports.export", "reports", "export"],

  ["settings.manage", "settings", "manage"],
];

const ROLE_PERMISSION_MAP = {
  super_admin: "*",
  org_admin: [
    "organization.view", "organization.edit", "society.view",
    "project.view", "project.create", "project.edit",
    "user.view", "user.create", "user.edit",
    "users.manage", "roles.manage",
    "drawing.review", "drawing.approve",
    "inventory.issue", "inventory.receive",
    "finance.view", "finance.approve",
    "reports.view", "reports.export",
    "settings.manage",
  ],
  project_manager: [
    "project.view", "project.edit",
    "drawing.upload", "drawing.review", "drawing.approve",
    "inventory.issue", "inventory.receive",
    "finance.view", "reports.view",
  ],
  site_engineer: [
    "project.view", "drawing.upload", "drawing.review",
    "inventory.receive", "reports.view",
  ],
  vendor: ["project.view", "drawing.upload", "inventory.receive"],
};

const ROLES = [
  { slug: "super_admin", name: "Super Admin", description: "Full platform access across every organization.", dataScope: "global", isSystem: true },
  { slug: "org_admin", name: "Organization Admin", description: "Manages a single organization end to end.", dataScope: "organization", isSystem: true },
  { slug: "project_manager", name: "Project Manager", description: "Owns delivery for assigned projects.", dataScope: "project", isSystem: true },
  { slug: "site_engineer", name: "Site Engineer", description: "Executes and reports on assigned projects.", dataScope: "project", isSystem: true },
  { slug: "vendor", name: "Vendor", description: "Restricted access to assigned purchase orders and documents.", dataScope: "project", isSystem: true },
];

async function upsertPermissions() {
  const byKey = new Map();
  for (const [key, module, action] of PERMISSIONS) {
    const label = `${module[0].toUpperCase()}${module.slice(1)} — ${action}`;
    const doc = await Permission.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, module, action, label } },
      { upsert: true, returnDocument: "after" },
    );
    byKey.set(key, doc);
  }
  return byKey;
}

async function upsertRoles(permissionsByKey) {
  const allPermissionIds = [...permissionsByKey.values()].map((p) => p._id);
  const rolesBySlug = new Map();

  for (const roleDef of ROLES) {
    const wanted = ROLE_PERMISSION_MAP[roleDef.slug];
    const permissionIds = wanted === "*"
      ? allPermissionIds
      : wanted.map((key) => permissionsByKey.get(key)?._id).filter(Boolean);

    const role = await Role.findOneAndUpdate(
      { slug: roleDef.slug, organization: null },
      {
        $setOnInsert: { ...roleDef, organization: null, permissions: permissionIds, sidebarMenus: [], dashboardWidgets: [] },
      },
      { upsert: true, returnDocument: "after" },
    );
    rolesBySlug.set(roleDef.slug, role);
  }
  return rolesBySlug;
}

async function upsertOrgAndSociety() {
  const organization = await Organization.findOneAndUpdate(
    { name: "UASPL Mumbai" },
    {
      $setOnInsert: {
        name: "UASPL Mumbai", plan: "Enterprise", status: "Active",
        city: "Mumbai, MH", logoColor: "oklch(0.58 0.16 240)",
        projects: 24, societies: 18, members: 312,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const society = await Society.findOneAndUpdate(
    { name: "Sea Pearl CHS", organization: organization._id },
    {
      $setOnInsert: {
        name: "Sea Pearl CHS", organization: organization._id,
        address: "Bandra West, Mumbai", buildings: 4, units: 312, phase: "Execution",
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  return { organization, society };
}

async function upsertSuperAdmin(superAdminRole) {
  const email = env.SEED_SUPER_ADMIN_EMAIL;
  let user = await User.findOne({ email });
  let temporaryPassword = null;

  if (!user) {
    temporaryPassword = env.SEED_SUPER_ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
    user = new User({
      name: "Platform Administrator",
      email,
      title: "Platform Administrator",
      mustChangePassword: true,
    });
    await user.setPassword(temporaryPassword);
    await user.save();
  }

  await UserRole.findOneAndUpdate(
    { user: user._id, role: superAdminRole._id, organization: null, society: null, project: null },
    { $setOnInsert: { user: user._id, role: superAdminRole._id, isActive: true } },
    { upsert: true, returnDocument: "after" },
  );

  return { user, temporaryPassword };
}

/** Seeds a demo login for a non-global role, scoped to the seed org/society. Skipped if no email/password is configured. */
async function upsertScopedDemoUser({ email, password, name, title, role, organization, society }) {
  if (!email || !password) return null;

  let user = await User.findOne({ email });
  let created = false;

  if (!user) {
    user = new User({ name, email, title, mustChangePassword: true });
    await user.setPassword(password);
    await user.save();
    created = true;
  }

  await UserRole.findOneAndUpdate(
    { user: user._id, role: role._id, organization: organization?._id ?? null, society: society?._id ?? null, project: null },
    { $setOnInsert: { user: user._id, role: role._id, isActive: true } },
    { upsert: true, returnDocument: "after" },
  );

  return { user, created };
}

async function run() {
  await connectDB();

  const permissionsByKey = await upsertPermissions();
  const rolesBySlug = await upsertRoles(permissionsByKey);
  const { organization, society } = await upsertOrgAndSociety();
  const { user, temporaryPassword } = await upsertSuperAdmin(rolesBySlug.get("super_admin"));

  console.log("\n[seed] Permission catalog, default roles, seed organization/society ready.");
  console.log(`[seed] Super Admin: ${user.email}`);
  if (temporaryPassword) {
    console.log(`[seed] Temporary password: ${temporaryPassword}`);
    console.log("[seed] mustChangePassword is set — you'll be asked to change it after first login.");
  } else {
    console.log("[seed] Super Admin already existed — password unchanged.");
  }

  const vendorResult = await upsertScopedDemoUser({
    email: env.SEED_VENDOR_EMAIL,
    password: env.SEED_VENDOR_PASSWORD,
    name: "Demo Vendor",
    title: "Vendor Contact",
    role: rolesBySlug.get("vendor"),
    organization,
    society,
  });
  if (vendorResult) {
    console.log(`[seed] Vendor demo user: ${vendorResult.user.email} ${vendorResult.created ? "(created)" : "(already existed)"}`);
  } else {
    console.log("[seed] Skipped vendor demo user — set SEED_VENDOR_EMAIL/SEED_VENDOR_PASSWORD in .env to create one.");
  }

  await require("mongoose").disconnect();
}

run().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
