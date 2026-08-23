const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    phase: {
      type: String,
      enum: ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"],
      default: "Feasibility",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

projectSchema.index({ organization: 1, society: 1 });
projectSchema.index({ organization: 1, createdAt: -1 });
projectSchema.index({ organization: 1, phase: 1 });
projectSchema.index({ society: 1, name: 1 });

module.exports = mongoose.model("Project", projectSchema);