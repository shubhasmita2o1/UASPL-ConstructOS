const env = require("../config/env");
const ApiError = require("../utils/ApiError");

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error.name === "ValidationError") {
      error = new ApiError(400, "Validation failed", Object.values(error.errors).map((e) => e.message));
    } else if (error.code === 11000) {
      error = new ApiError(409, "A record with this value already exists", [error.keyValue]);
    } else if (error.name === "CastError") {
      error = new ApiError(400, `Invalid value for ${error.path}`);
    } else if (error.name === "JsonWebTokenError") {
      error = new ApiError(401, "Invalid token");
    } else {
      error = new ApiError(error.statusCode || 500, error.message || "Internal server error");
    }
  }

  if (error.statusCode >= 500) {
    console.error("[error]", err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
