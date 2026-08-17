const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    plan: { type: String, enum: ["Starter", "Business", "Enterprise"], default: "Business" },
    status: {
      type: String,
      enum: ["Active", "Onboarding", "Suspended", "Archived"],
      default: "Onboarding",
    },
    city: { type: String, trim: true, default: "" },
    industry: { type: String, trim: true, default: "Redevelopment" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
    website: { type: String, trim: true, default: "" },
    founded: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    logoColor: { type: String, default: "oklch(0.58 0.16 240)" },
    contact: { type: contactSchema, default: () => ({}) },
    // Denormalized counters (kept in sync later when societies/projects wire up)
    projects: { type: Number, default: 0 },
    societies: { type: Number, default: 0 },
    members: { type: Number, default: 0 },
  },
  { timestamps: true },
);

organizationSchema.index({ name: 1 });
organizationSchema.index({ status: 1 });

module.exports = mongoose.model("Organization", organizationSchema);