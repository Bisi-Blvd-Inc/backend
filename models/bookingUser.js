var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var bookingUserSchema = new Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: Number },
    address: { type: String },
    dob: { type: Date },
    userProfileImg: { type: String },
    role: { type: Number, enum: [1, 2, 3], default: 3 },
    isDeleted: { type: Boolean, default: false },
    tags: { type: Array },
    addedBy: { type: Schema.Types.ObjectId, ref: "userBookingSchema" },
  },

  {
    collection: "userBooking",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var User = mongoose.model("UserBooking", bookingUserSchema);

module.exports = User;
