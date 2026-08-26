const mongoose = require("mongoose");

const stakeholderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Client", "Consultant", "Authority", "Other"],
      default: "Other",
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    contact: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    linkedSociety: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

stakeholderSchema.index({ organization: 1, type: 1 });
stakeholderSchema.index({ organization: 1, name: 1 });

module.exports = mongoose.models.Stakeholder || mongoose.model("Stakeholder", stakeholderSchema);