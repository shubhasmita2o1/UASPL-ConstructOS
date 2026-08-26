const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: null },
    description: { type: String, trim: true, default: "" },
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
    status: {
      type: String,
      enum: ["Active", "OnHold", "Completed", "Cancelled"],
      default: "Active",
    },
    startDate: { type: Date, default: null },
    targetEndDate: { type: Date, default: null },
    actualEndDate: { type: Date, default: null },
    budgetAmount: { type: Number, default: 0 },
    currency: { type: String, trim: true, uppercase: true, default: "INR" },
    projectManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    address: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

projectSchema.index({ organization: 1, society: 1 });
projectSchema.index({ organization: 1, createdAt: -1 });
projectSchema.index({ organization: 1, phase: 1 });
projectSchema.index({ society: 1, name: 1 });
projectSchema.index({ organization: 1, code: 1 }, { unique: true, sparse: true });
projectSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);