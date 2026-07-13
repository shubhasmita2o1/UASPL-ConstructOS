const mongoose = require("mongoose");

// A single scoped role assignment. A user accumulates multiple rows to hold
// multiple roles, each possibly scoped to a different organization/society/project.
const userRoleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    building: { type: String, default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userRoleSchema.index({ user: 1, role: 1, organization: 1, society: 1, project: 1 }, { unique: true });
userRoleSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("UserRole", userRoleSchema);
