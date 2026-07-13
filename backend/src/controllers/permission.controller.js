const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const { Permission } = require("../models");

const list = catchAsync(async (req, res) => {
  const permissions = await Permission.find({}).sort({ module: 1, action: 1 }).lean();
  const grouped = permissions.reduce((acc, p) => {
    acc[p.module] = acc[p.module] || [];
    acc[p.module].push(p);
    return acc;
  }, {});
  return new ApiResponse(200, { permissions, grouped }, "OK").send(res);
});

module.exports = { list };
