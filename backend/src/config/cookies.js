const env = require("./env");
const { msFromDuration } = require("../utils/crypto");

const ACCESS_COOKIE = "uaspl_at";
const REFRESH_COOKIE = "uaspl_rt";

const baseOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  domain: env.COOKIE_DOMAIN,
};

function accessCookieOptions() {
  return { ...baseOptions, path: "/", maxAge: msFromDuration(env.ACCESS_TOKEN_EXPIRES_IN) };
}

function refreshCookieOptions(remember) {
  const duration = remember ? env.REFRESH_TOKEN_REMEMBER_EXPIRES_IN : env.REFRESH_TOKEN_EXPIRES_IN;
  return { ...baseOptions, path: "/api/auth", maxAge: msFromDuration(duration) };
}

function clearCookieOptions() {
  return { ...baseOptions, path: "/" };
}

function clearRefreshCookieOptions() {
  return { ...baseOptions, path: "/api/auth" };
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  clearCookieOptions,
  clearRefreshCookieOptions,
};
