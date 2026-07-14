const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: required("MONGO_URI"),
  CLIENT_URL: required("CLIENT_URL"),

  ACCESS_TOKEN_SECRET: required("ACCESS_TOKEN_SECRET"),
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_SECRET: required("REFRESH_TOKEN_SECRET"),
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  REFRESH_TOKEN_REMEMBER_EXPIRES_IN: process.env.REFRESH_TOKEN_REMEMBER_EXPIRES_IN || "30d",

  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",

  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  MAX_LOGIN_ATTEMPTS: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  ACCOUNT_LOCK_MINUTES: Number(process.env.ACCOUNT_LOCK_MINUTES) || 15,
  PASSWORD_RESET_TOKEN_MINUTES: Number(process.env.PASSWORD_RESET_TOKEN_MINUTES) || 30,

  SEED_SUPER_ADMIN_EMAIL: process.env.SEED_SUPER_ADMIN_EMAIL || "admin@uaspl.in",
  SEED_SUPER_ADMIN_PASSWORD: process.env.SEED_SUPER_ADMIN_PASSWORD || "",

  SEED_VENDOR_EMAIL: process.env.SEED_VENDOR_EMAIL || "",
  SEED_VENDOR_PASSWORD: process.env.SEED_VENDOR_PASSWORD || "",

  SEED_ORG_ADMIN_EMAIL: process.env.SEED_ORG_ADMIN_EMAIL || "",
  SEED_ORG_ADMIN_PASSWORD: process.env.SEED_ORG_ADMIN_PASSWORD || "",

  SEED_PROJECT_MANAGER_EMAIL: process.env.SEED_PROJECT_MANAGER_EMAIL || "",
  SEED_PROJECT_MANAGER_PASSWORD: process.env.SEED_PROJECT_MANAGER_PASSWORD || "",

  SEED_SITE_ENGINEER_EMAIL: process.env.SEED_SITE_ENGINEER_EMAIL || "",
  SEED_SITE_ENGINEER_PASSWORD: process.env.SEED_SITE_ENGINEER_PASSWORD || "",
};

module.exports = env;
