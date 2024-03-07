const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const NotificationSchema = mongoose.Schema(
  {
    title: {
      type: String,
      default: "Notification",
    },
    text: {
      type: String,
    },
    type: {
      type: String,
    },
    clientName: {
      type: String,
    },
    role: { type: Number, enum: [1, 2], default: 1 },
    subtitle: String,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    bookingFor: { type: Schema.Types.ObjectId, ref: "Customer" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User" },
    service: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    redirect: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("Notification", NotificationSchema);
