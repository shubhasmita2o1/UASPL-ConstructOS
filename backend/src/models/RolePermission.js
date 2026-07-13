const mongoose = require("mongoose");

// Append-only audit ledger of grant/revoke events on Role.permissions.
// Role.permissions remains the live, queried assignment; this collection
// exists purely so permission changes on a role are auditable over time.
const rolePermissionSchema = new mongoose.Schema(
  {
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    permission: { type: mongoose.Schema.Types.ObjectId, ref: "Permission", required: true },
    action: { type: String, enum: ["granted", "revoked"], required: true },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

rolePermissionSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model("RolePermission", rolePermissionSchema);
