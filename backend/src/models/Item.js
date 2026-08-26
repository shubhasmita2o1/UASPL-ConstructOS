const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["Material", "Service", "Both"],
      default: "Material",
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", default: null },
    category: { type: String, trim: true, default: "" },
    hsnSac: { type: String, trim: true, default: "" },
    standardRate: { type: Number, default: 0 },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

itemSchema.index({ organization: 1, code: 1 }, { unique: true });
itemSchema.index({ organization: 1, name: 1 });
itemSchema.index({ organization: 1, type: 1 });


module.exports = mongoose.models.Item || mongoose.model("Item", itemSchema);
