const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { Society } = require("../models");

const list = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.organizationId) filter.organization = req.query.organizationId;
  const societies = await Society.find(filter).sort({ name: 1 }).lean();
  return new ApiResponse(200, societies, "OK").send(res);
});

const getOne = catchAsync(async (req, res) => {
  const society = await Society.findById(req.params.id).lean();
  if (!society) throw ApiError.notFound("Society not found");
  return new ApiResponse(200, society, "OK").send(res);
});

module.exports = { list, getOne };
