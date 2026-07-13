const mongoose = require("mongoose");

const societySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    address: { type: String, trim: true },
    buildings: { type: Number, default: 0 },
    units: { type: Number, default: 0 },
    phase: {
      type: String,
      enum: ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"],
      default: "Feasibility",
    },
  },
  { timestamps: true },
);

societySchema.index({ organization: 1, name: 1 });

module.exports = mongoose.model("Society", societySchema);
