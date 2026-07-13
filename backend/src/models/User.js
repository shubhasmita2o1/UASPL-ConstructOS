const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const env = require("../config/env");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    employeeId: { type: String, trim: true, unique: true, sparse: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    title: { type: String, trim: true },
    avatar: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive", "locked"], default: "active" },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },

    passwordChangedAt: { type: Date, default: null },
    mustChangePassword: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.index({ status: 1 });

userSchema.virtual("isLocked").get(function isLocked() {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
  this.passwordChangedAt = new Date();
};

userSchema.methods.registerFailedLogin = function registerFailedLogin() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= env.MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
};

userSchema.methods.registerSuccessfulLogin = function registerSuccessfulLogin(ip) {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  this.lastLoginAt = new Date();
  this.lastLoginIp = ip;
};

module.exports = mongoose.model("User", userSchema);
