/**
 * Phase 7 — Security & audit tests
 * Run: npm test
 */
process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/uaspl_test_security";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test-access-secret-phase7";
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "test-refresh-secret-phase7";
process.env.MAX_LOGIN_ATTEMPTS = process.env.MAX_LOGIN_ATTEMPTS || "5";
process.env.ACCOUNT_LOCK_MINUTES = process.env.ACCOUNT_LOCK_MINUTES || "15";
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || "4";

const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const {
  User,
  Organization,
  Society,
  Role,
  Permission,
  UserRole,
  AuditLog,
  Session,
} = require("../src/models");
const { signAccessToken } = require("../src/services/token.service");
const { ACCESS_COOKIE, REFRESH_COOKIE } = require("../src/config/cookies");

let mongod;
let app;
let orgA;
let orgB;
let societyA;
let societyB;
let userA;
let userB;
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
  const keys = [
    "society.view",
    "society.create",
    "organization.view",
    "organization.create",
    "user.view",
    "user.create",
    "audit.view",
  ];
  const perms = {};
  for (const key of keys) {
    const [module, action] = key.split(".");
    const label = `${module[0].toUpperCase()}${module.slice(1)} — ${action}`;
    perms[key] = await Permission.create({ key, module, action, label, description: key });
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

  userA = new User({ name: "User A", email: "usera@sec.local", mustChangePassword: false, status: "active" });
  await userA.setPassword("Password1!");
  await userA.save();

  userB = new User({ name: "User B", email: "userb@sec.local", mustChangePassword: false, status: "active" });
  await userB.setPassword("Password1!");
  await userB.save();

  superUser = new User({ name: "Super", email: "super@sec.local", mustChangePassword: false, status: "active" });
  await superUser.setPassword("Password1!");
  await superUser.save();

  await UserRole.create({ user: userA._id, role: roleOrgAdmin._id, organization: orgA._id, isActive: true });
  await UserRole.create({ user: userB._id, role: roleOrgAdmin._id, organization: orgB._id, isActive: true });
  await UserRole.create({ user: superUser._id, role: roleSuper._id, organization: null, isActive: true });
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

const ORG_ADMIN_PERMS = [
  "society.view",
  "organization.view",
  "organization.create",
  "user.view",
  "audit.view",
];

describe("Auth audit events", () => {
  test("1. Failed login creates AuditLog status failure action auth.login", async () => {
    const before = await AuditLog.countDocuments({ action: "auth.login", status: "failure" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "usera@sec.local", password: "WrongPassword!" });
    expect(res.status).toBe(401);
    const after = await AuditLog.countDocuments({ action: "auth.login", status: "failure" });
    expect(after).toBeGreaterThan(before);
  });

  test("2. Successful login creates success audit", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "usera@sec.local", password: "Password1!" });
    expect(res.status).toBe(200);
    const row = await AuditLog.findOne({ action: "auth.login", status: "success", actor: userA._id }).sort({
      createdAt: -1,
    });
    expect(row).not.toBeNull();
  });
});

describe("Audit log tenant isolation", () => {
  test("3. Org A admin listing audit logs does not see Org B–scoped entries", async () => {
    await AuditLog.create({
      actor: userB._id,
      action: "society.create",
      organization: orgB._id,
      status: "success",
    });
    await AuditLog.create({
      actor: userA._id,
      action: "society.create",
      organization: orgA._id,
      status: "success",
    });

    const res = await request(app)
      .get("/api/audit-logs")
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));

    expect(res.status).toBe(200);
    const items = res.body.data?.items || [];
    for (const item of items) {
      if (item.organization) {
        expect(String(item.organization)).toBe(String(orgA._id));
      }
    }
    const hasB = items.some((i) => String(i.organization) === String(orgB._id));
    expect(hasB).toBe(false);
  });
});

describe("Session self-service", () => {
  test("4. User can list own sessions after login", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "usera@sec.local", password: "Password1!" });
    expect(login.status).toBe(200);
    const cookies = login.headers["set-cookie"] || [];
    const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");

    const res = await request(app).get("/api/auth/sessions").set("Cookie", cookieHeader);
    expect(res.status).toBe(200);
    const items = res.body.data || [];
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.some((s) => s.isCurrent === true)).toBe(true);
  });

  test("5. User can revoke own session; revoked session cannot refresh", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "usera@sec.local", password: "Password1!" });
    expect(login.status).toBe(200);
    const cookies = login.headers["set-cookie"] || [];
    const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");

    const list = await request(app).get("/api/auth/sessions").set("Cookie", cookieHeader);
    const sessionId = (list.body.data || [])[0]?.id;
    expect(sessionId).toBeTruthy();

    const rev = await request(app).delete(`/api/auth/sessions/${sessionId}`).set("Cookie", cookieHeader);
    expect(rev.status).toBe(200);

    const session = await Session.findById(sessionId);
    expect(session.revokedAt).not.toBeNull();

    const refresh = await request(app).post("/api/auth/refresh").set("Cookie", cookieHeader);
    expect(refresh.status).toBe(401);
  });

  test("6. Token reuse path audits and does not issue new tokens", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "usera@sec.local", password: "Password1!" });
    const cookies = login.headers["set-cookie"] || [];
    const refreshPart = cookies.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
    expect(refreshPart).toBeTruthy();
    const rawRefresh = refreshPart.split(";")[0].split("=").slice(1).join("=");

    // First refresh rotates successfully
    const r1 = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${rawRefresh}`);
    expect(r1.status).toBe(200);

    // Reuse old refresh token → should fail and write audit
    const before = await AuditLog.countDocuments({ action: "auth.refresh_reuse" });
    const r2 = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${rawRefresh}`);
    expect(r2.status).toBe(401);
    const after = await AuditLog.countDocuments({ action: "auth.refresh_reuse" });
    expect(after).toBeGreaterThan(before);
  });
});

describe("Phase 6 regression smoke", () => {
  test("7. Non-global cannot create organization", async () => {
    const res = await request(app)
      .post("/api/organizations")
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }))
      .send({ name: "Should Fail", plan: "Business" });
    expect(res.status).toBe(403);
  });

  test("8. Cross-tenant society get still 403/404", async () => {
    const res = await request(app)
      .get(`/api/societies/${societyB._id}`)
      .set("Cookie", authCookie(userA, { orgId: orgA._id, permissions: ORG_ADMIN_PERMS }));
    expect([403, 404]).toContain(res.status);
  });
});