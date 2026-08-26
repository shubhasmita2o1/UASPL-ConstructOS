/**
 * Phase 8 — Master data tenant-scoped CRUD
 * Run: npm test
 */
process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test-access-secret-phase8";
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "test-refresh-secret-phase8";
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || "4";

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
  Vendor,
  Item,
  Unit,
} = require("../src/models");
const { signAccessToken } = require("../src/services/token.service");
const { ACCESS_COOKIE } = require("../src/config/cookies");

let mongod;
let app;
let orgA;
let orgB;
let societyA;
let societyB;
let userA;
let userB;
let roleOrgAdmin;

const MASTER_PERMS = [
  "society.view",
  "society.create",
  "society.delete",
  "project.view",
  "project.create",
  "project.delete",
  "vendor.view",
  "vendor.create",
  "vendor.edit",
  "vendor.delete",
  "item.view",
  "item.create",
  "item.edit",
  "item.delete",
  "unit.view",
  "unit.create",
  "department.view",
  "department.create",
  "stakeholder.view",
  "stakeholder.create",
];

function authCookie(user, { orgId = null, permissions = MASTER_PERMS } = {}) {
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
  const unique = [...new Set([...MASTER_PERMS, "organization.view"])];
  const perms = {};
  for (const key of unique) {
    const [module, action] = key.split(".");
    perms[key] = await Permission.create({
      key,
      module,
      action,
      label: key,
      description: key,
    });
  }
  roleOrgAdmin = await Role.create({
    name: "Org Admin",
    slug: "org_admin",
    dataScope: "organization",
    isSystem: true,
    isActive: true,
    permissions: Object.values(perms).map((p) => p._id),
  });

  orgA = await Organization.create({
    name: "Org A",
    code: "ORGA",
    status: "Active",
    plan: "Business",
    societies: 0,
    projects: 0,
  });
  orgB = await Organization.create({
    name: "Org B",
    code: "ORGB",
    status: "Active",
    plan: "Business",
    societies: 0,
    projects: 0,
  });
  societyA = await Society.create({ name: "Society A", organization: orgA._id, code: "SA" });
  societyB = await Society.create({ name: "Society B", organization: orgB._id, code: "SB" });
  await Organization.findByIdAndUpdate(orgA._id, { societies: 1 });
  await Organization.findByIdAndUpdate(orgB._id, { societies: 1 });

  userA = new User({
    name: "User A",
    email: "usera@master.local",
    mustChangePassword: false,
    status: "active",
  });
  await userA.setPassword("Password1!");
  await userA.save();

  userB = new User({
    name: "User B",
    email: "userb@master.local",
    mustChangePassword: false,
    status: "active",
  });
  await userB.setPassword("Password1!");
  await userB.save();

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
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  await seed();
  app = require("../src/app");
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe("Vendor CRUD tenant scope", () => {
  test("1. Org A can CRUD vendor in Org A", async () => {
    const create = await request(app)
      .post("/api/vendors")
      .set("Cookie", authCookie(userA, { orgId: orgA._id }))
      .send({ name: "Vendor A1", code: "VA1", organizationId: String(orgA._id) });
    expect(create.status).toBe(201);
    const id = create.body.data?._id;
    expect(id).toBeTruthy();

    const get = await request(app)
      .get(`/api/vendors/${id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id }));
    expect(get.status).toBe(200);

    const patch = await request(app)
      .patch(`/api/vendors/${id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id }))
      .send({ city: "Mumbai" });
    expect(patch.status).toBe(200);
  });

  test("2. Org A cannot get/update Org B vendor", async () => {
    const vendorB = await Vendor.create({
      name: "Vendor B",
      code: "VB1",
      organization: orgB._id,
    });

    const get = await request(app)
      .get(`/api/vendors/${vendorB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id }));
    expect([403, 404]).toContain(get.status);

    const patch = await request(app)
      .patch(`/api/vendors/${vendorB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id }))
      .send({ name: "Hacked" });
    expect([403, 404]).toContain(patch.status);
  });

  test("3. Org A cannot create vendor with organizationId = Org B", async () => {
    const res = await request(app)
      .post("/api/vendors")
      .set("Cookie", authCookie(userA, { orgId: orgA._id }))
      .send({ name: "Cross", code: "CROSS", organizationId: String(orgB._id) });
    expect(res.status).toBe(403);
  });
});

describe("Item scoped", () => {
  test("4. Item create requires valid org; list scoped", async () => {
    const unit = await Unit.create({
      name: "Numbers",
      symbol: "Nos",
      organization: orgA._id,
    });

    const create = await request(app)
      .post("/api/items")
      .set("Cookie", authCookie(userA, { orgId: orgA._id }))
      .send({
        name: "Cement",
        code: "CEM01",
        type: "Material",
        unit: String(unit._id),
        organizationId: String(orgA._id),
      });
    expect(create.status).toBe(201);

    await Item.create({
      name: "Steel B",
      code: "STL-B",
      organization: orgB._id,
      type: "Material",
    });

    const list = await request(app)
      .get("/api/items")
      .set("Cookie", authCookie(userA, { orgId: orgA._id }));
    expect(list.status).toBe(200);
    for (const it of list.body.data?.items || []) {
      expect(String(it.organization)).toBe(String(orgA._id));
    }
  });
});

describe("Project code uniqueness per org", () => {
  test("5. Project code unique per organization (two orgs can reuse same code)", async () => {
    await Project.create({
      name: "P1",
      code: "SAME",
      organization: orgA._id,
      society: societyA._id,
    });
    await Project.create({
      name: "P2",
      code: "SAME",
      organization: orgB._id,
      society: societyB._id,
    });
    let failed = false;
    try {
      await Project.create({
        name: "P3",
        code: "SAME",
        organization: orgA._id,
        society: societyA._id,
      });
    } catch (err) {
      failed = true;
    }
    expect(failed).toBe(true);
  });
});

describe("Organization counters", () => {
  test("6. Society/project create updates Organization counter", async () => {
    const before = await Organization.findById(orgA._id).lean();

    const soc = await request(app)
      .post("/api/societies")
      .set("Cookie", authCookie(userA, { orgId: orgA._id }))
      .send({
        name: "New Society Counter",
        code: "NSC1",
        organizationId: String(orgA._id),
      });
    expect(soc.status).toBe(201);

    const afterSoc = await Organization.findById(orgA._id).lean();
    expect(afterSoc.societies).toBe((before.societies || 0) + 1);

    const proj = await request(app)
      .post("/api/projects")
      .set("Cookie", authCookie(userA, { orgId: orgA._id }))
      .send({
        name: "New Project Counter",
        code: "NPC1",
        societyId: String(societyA._id),
        organizationId: String(orgA._id),
      });
    expect(proj.status).toBe(201);

    const afterProj = await Organization.findById(orgA._id).lean();
    expect(afterProj.projects).toBe((before.projects || 0) + 1);
  });
});

describe("Phase 6 smoke", () => {
  test("7. Cross-tenant society still blocked", async () => {
    const res = await request(app)
      .get(`/api/societies/${societyB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id }));
    expect([403, 404]).toContain(res.status);
  });
});