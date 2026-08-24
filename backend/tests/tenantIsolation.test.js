/**
 * Phase 6 — Tenant isolation tests
 *
 * Seeds two orgs, societies, projects, users + UserRole memberships, then
 * asserts cross-tenant list/get/update/create are rejected and Super Admin
 * can access across tenants.
 *
 * Run: npm test
 */
process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/uaspl_test_isolation";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test-access-secret-phase6";
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "test-refresh-secret-phase6";

const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const {
  User,
  Organization,
  Society,
  Project,
  Role,
  Permission,
  UserRole,
} = require("../src/models");
const permissionService = require("../src/services/permission.service");
const { signAccessToken } = require("../src/services/token.service");
const { ACCESS_COOKIE } = require("../src/config/cookies");

let mongod;
let app;
let orgA;
let orgB;
let societyA;
let societyB;
let projectA;
let projectB;
let userA; // org A admin
let userB; // org B admin
let superUser;
let roleOrgAdmin;
let roleSuper;

function authCookie(user, { orgId = null, permissions = ["*"] } = {}) {
  const token = signAccessToken({
    userId: user._id,
    orgId: orgId || null,
    societyId: null,
    projectId: null,
    roles: [],
    permissions,
  });
  return `${ACCESS_COOKIE}=${token}`;
}

async function seed() {
  // Minimal permission docs (keys used by routes)
  const keys = [
    "society.view",
    "society.create",
    "society.edit",
    "society.delete",
    "project.view",
    "project.create",
    "project.edit",
    "project.delete",
    "user.view",
    "user.create",
    "user.edit",
    "organization.view",
    "organization.create",
    "organization.edit",
  ];
  const perms = {};
  for (const key of keys) {
    const [resource, action] = key.split(".");
    perms[key] = await Permission.create({ key, resource, action, description: key });
  }
  const allPermIds = Object.values(perms).map((p) => p._id);

  roleSuper = await Role.create({
    name: "Super Admin",
    slug: "super_admin",
    dataScope: "global",
    isSystem: true,
    isActive: true,
    permissions: allPermIds,
  });

  roleOrgAdmin = await Role.create({
    name: "Org Admin",
    slug: "org_admin",
    dataScope: "organization",
    isSystem: true,
    isActive: true,
    permissions: allPermIds,
  });

  orgA = await Organization.create({ name: "Org A", code: "ORGA", status: "Active", plan: "Business" });
  orgB = await Organization.create({ name: "Org B", code: "ORGB", status: "Active", plan: "Business" });

  societyA = await Society.create({ name: "Society A", organization: orgA._id });
  societyB = await Society.create({ name: "Society B", organization: orgB._id });

  projectA = await Project.create({
    name: "Project A",
    organization: orgA._id,
    society: societyA._id,
  });
  projectB = await Project.create({
    name: "Project B",
    organization: orgB._id,
    society: societyB._id,
  });

  userA = new User({
    name: "User A",
    email: "usera@test.local",
    mustChangePassword: false,
    status: "active",
  });
  await userA.setPassword("Password1!");
  await userA.save();

  userB = new User({
    name: "User B",
    email: "userb@test.local",
    mustChangePassword: false,
    status: "active",
  });
  await userB.setPassword("Password1!");
  await userB.save();

  superUser = new User({
    name: "Super",
    email: "super@test.local",
    mustChangePassword: false,
    status: "active",
  });
  await superUser.setPassword("Password1!");
  await superUser.save();

  await UserRole.create({
    user: userA._id,
    role: roleOrgAdmin._id,
    organization: orgA._id,
    isActive: true,
  });
  await UserRole.create({
    user: userB._id,
    role: roleOrgAdmin._id,
    organization: orgB._id,
    isActive: true,
  });
  await UserRole.create({
    user: superUser._id,
    role: roleSuper._id,
    organization: null,
    isActive: true,
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  // Clear require cache so env/db pick up the memory URI if needed
  await mongoose.connect(process.env.MONGO_URI);
  await seed();
  // Load app after env is set
  app = require("../src/app");
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const ORG_ADMIN_PERMS = [
  "society.view",
  "society.create",
  "society.edit",
  "society.delete",
  "project.view",
  "project.create",
  "project.edit",
  "project.delete",
  "user.view",
  "user.create",
  "user.edit",
  "organization.view",
];

// ─── Societies ───────────────────────────────────────────────────────────────

describe("Society isolation", () => {
  test("1. User in Org A cannot LIST societies of Org B", async () => {
    const res = await request(app)
      .get("/api/societies")
      .query({ organizationId: String(orgB._id) })
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));

    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((s) => String(s._id));
    expect(ids).not.toContain(String(societyB._id));
    // Must only see own tenant (or empty when filtered to foreign org)
    for (const s of res.body.data || []) {
      expect(String(s.organization)).toBe(String(orgA._id));
    }
  });

  test("2. User in Org A cannot GET society belonging to Org B", async () => {
    const res = await request(app)
      .get(`/api/societies/${societyB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));

    // 403 preferred; 404 also acceptable if no data leak
    expect([403, 404]).toContain(res.status);
    if (res.body?.data) {
      expect(String(res.body.data._id)).not.toBe(String(societyB._id));
    }
  });

  test("3. User in Org A cannot UPDATE/DELETE Org B society", async () => {
    const patch = await request(app)
      .patch(`/api/societies/${societyB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }))
      .send({ name: "Hacked" });
    expect([403, 404]).toContain(patch.status);

    const del = await request(app)
      .delete(`/api/societies/${societyB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));
    expect([403, 404]).toContain(del.status);

    const still = await Society.findById(societyB._id);
    expect(still).not.toBeNull();
    expect(still.name).toBe("Society B");
  });

  test("4. User in Org A cannot CREATE society under Org B organizationId", async () => {
    const res = await request(app)
      .post("/api/societies")
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }))
      .send({ name: "Forged Society", organizationId: String(orgB._id) });

    expect([403, 400]).toContain(res.status);

    const forged = await Society.findOne({ name: "Forged Society" });
    expect(forged).toBeNull();
  });
});

// ─── Projects ────────────────────────────────────────────────────────────────

describe("Project isolation", () => {
  test("5a. User in Org A cannot LIST projects of Org B", async () => {
    const res = await request(app)
      .get("/api/projects")
      .query({ organizationId: String(orgB._id) })
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));

    expect(res.status).toBe(200);
    for (const p of res.body.data || []) {
      expect(String(p.organization)).toBe(String(orgA._id));
    }
    const ids = (res.body.data || []).map((p) => String(p._id));
    expect(ids).not.toContain(String(projectB._id));
  });

  test("5b. User in Org A cannot GET project of Org B", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));
    expect([403, 404]).toContain(res.status);
  });

  test("5c. User in Org A cannot UPDATE project of Org B", async () => {
    const res = await request(app)
      .patch(`/api/projects/${projectB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }))
      .send({ name: "Hacked Project" });
    expect([403, 404]).toContain(res.status);
    const still = await Project.findById(projectB._id);
    expect(still.name).toBe("Project B");
  });

  test("5d. User in Org A cannot CREATE project under Org B", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }))
      .send({
        name: "Forged Project",
        organizationId: String(orgB._id),
        societyId: String(societyB._id),
      });
    expect([403, 400]).toContain(res.status);
    const forged = await Project.findOne({ name: "Forged Project" });
    expect(forged).toBeNull();
  });
});

// ─── Users ───────────────────────────────────────────────────────────────────

describe("User isolation", () => {
  test("6. User in Org A cannot list/get users that only belong to Org B", async () => {
    const list = await request(app)
      .get("/api/users")
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));

    expect(list.status).toBe(200);
    const items = list.body.data?.items || list.body.data || [];
    const emails = items.map((u) => u.email);
    expect(emails).not.toContain("userb@test.local");
    // Own user may or may not appear depending on filter; foreign must not

    const get = await request(app)
      .get(`/api/users/${userB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));
    expect([403, 404]).toContain(get.status);
  });
});

// ─── resolveCreateOrganizationId ─────────────────────────────────────────────

describe("resolveCreateOrganizationId", () => {
  test("7. rejects foreign organizationId for non-global user", async () => {
    await expect(
      permissionService.resolveCreateOrganizationId(
        { id: String(userA._id), orgId: String(orgA._id) },
        String(orgB._id),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("7b. accepts own organizationId for non-global user", async () => {
    const id = await permissionService.resolveCreateOrganizationId(
      { id: String(userA._id), orgId: String(orgA._id) },
      String(orgA._id),
    );
    expect(String(id)).toBe(String(orgA._id));
  });
});

// ─── Super Admin positive control ────────────────────────────────────────────

describe("Super Admin cross-tenant access", () => {
  test("8. Super Admin / global scope CAN access across orgs", async () => {
    const listSoc = await request(app)
      .get("/api/societies")
      .set("Cookie", authCookie(superUser, { orgId: null, permissions: ["*"] }));
    expect(listSoc.status).toBe(200);
    const socIds = (listSoc.body.data || []).map((s) => String(s._id));
    expect(socIds).toContain(String(societyA._id));
    expect(socIds).toContain(String(societyB._id));

    const getSocB = await request(app)
      .get(`/api/societies/${societyB._id}`)
      .set("Cookie", authCookie(superUser, { permissions: ["*"] }));
    expect(getSocB.status).toBe(200);

    const listProj = await request(app)
      .get("/api/projects")
      .set("Cookie", authCookie(superUser, { permissions: ["*"] }));
    expect(listProj.status).toBe(200);
    const projIds = (listProj.body.data || []).map((p) => String(p._id));
    expect(projIds).toContain(String(projectA._id));
    expect(projIds).toContain(String(projectB._id));

    const resolved = await permissionService.resolveCreateOrganizationId(
      { id: String(superUser._id), orgId: null },
      String(orgB._id),
    );
    expect(String(resolved)).toBe(String(orgB._id));
  });
});