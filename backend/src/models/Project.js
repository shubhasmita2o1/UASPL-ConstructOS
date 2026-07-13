const mongoose = require("mongoose");

// Minimal reference model: exists so Role.dataScope="project" and UserRole
// scoping have a real collection to point at. The full Projects module
// (src/pages/project/*) continues to run on its own mock store.
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    phase: {
      type: String,
      enum: ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"],
      default: "Feasibility",
    },
  },
  { timestamps: true },
);

projectSchema.index({ organization: 1, society: 1 });

module.exports = mongoose.model("Project", projectSchema);
