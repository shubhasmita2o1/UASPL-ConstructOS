const mongoose = require("mongoose");

// Collection reserved for a future notification-delivery module; not wired
// to any UI yet (Header's notification bell remains on its own mock data).
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, trim: true, required: true },
    title: { type: String, trim: true, required: true },
    message: { type: String, trim: true },
    link: { type: String, trim: true, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
