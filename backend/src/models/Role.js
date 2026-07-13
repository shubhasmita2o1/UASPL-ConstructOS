const mongoose = require("mongoose");

const DATA_SCOPES = ["global", "organization", "society", "project", "building"];

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    sidebarMenus: [{ type: String, trim: true }],
    dashboardWidgets: [{ type: String, trim: true }],
    dataScope: { type: String, enum: DATA_SCOPES, default: "project" },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roleSchema.index({ slug: 1, organization: 1 }, { unique: true });

roleSchema.statics.DATA_SCOPES = DATA_SCOPES;

module.exports = mongoose.model("Role", roleSchema);
