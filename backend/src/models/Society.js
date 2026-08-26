const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const societySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: null },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },
    buildings: { type: Number, default: 0 },
    units: { type: Number, default: 0 },
    totalBuildings: { type: Number, default: 0 },
    totalUnits: { type: Number, default: 0 },
    phase: {
      type: String,
      enum: ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"],
      default: "Feasibility",
    },
    status: {
      type: String,
      enum: ["Active", "Onboarding", "OnHold", "Closed"],
      default: "Active",
    },
    contact: { type: contactSchema, default: () => ({}) },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

societySchema.index({ organization: 1, name: 1 });
societySchema.index({ organization: 1, createdAt: -1 });
societySchema.index({ organization: 1, phase: 1 });
societySchema.index({ organization: 1, code: 1 }, { unique: true, sparse: true });
societySchema.index({ organization: 1, status: 1 });

module.exports = mongoose.models.Society || mongoose.model("Society", societySchema);