const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

unitSchema.index({ organization: 1, symbol: 1 }, { unique: true });
unitSchema.index({ organization: 1, name: 1 });

module.exports = mongoose.models.Unit || mongoose.model("Unit", unitSchema);
