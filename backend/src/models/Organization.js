const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    plan: { type: String, enum: ["Starter", "Business", "Enterprise"], default: "Business" },
    status: { type: String, enum: ["Active", "Onboarding", "Suspended", "Archived"], default: "Active" },
    city: { type: String, trim: true },
    logoColor: { type: String, default: "oklch(0.58 0.16 240)" },
    projects: { type: Number, default: 0 },
    societies: { type: Number, default: 0 },
    members: { type: Number, default: 0 },
  },
  { timestamps: true },
);

organizationSchema.index({ name: 1 });

module.exports = mongoose.model("Organization", organizationSchema);
