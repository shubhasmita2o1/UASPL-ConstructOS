const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: null },
    contact: { type: contactSchema, default: () => ({}) },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
    pan: { type: String, trim: true, uppercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blacklisted"],
      default: "Active",
    },
    notes: { type: String, trim: true, default: "" },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

vendorSchema.index({ organization: 1, code: 1 }, { unique: true, sparse: true });
vendorSchema.index({ organization: 1, name: 1 });
vendorSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.models.Item || mongoose.model("Item", itemSchema);