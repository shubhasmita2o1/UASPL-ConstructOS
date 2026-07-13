const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, trim: true, default: null },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    status: { type: String, enum: ["success", "failure"], default: "success" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true },
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
