var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const PointSchema = new Schema({
  type: { type: String, default: "Point" },
  coordinates: { type: [Number] },
});
var customerSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    service: [{ type: Schema.Types.ObjectId, ref: "businessService" }],
    isDeleted: { type: Boolean, default: false },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    bookingStatus: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "awaiting",
        "confirmed",
        "show",
        "noShow",
        "readyToStart",
        "inProgress",
        "complete",
        "personalTask",
        "personalTaskBlocked",
        "cancel",
        "reject",
      ],
      default: "accepted",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    location: PointSchema,
    startDate: { type: Date },
    endDate: { type: Date },
    startDateTime: { type: String },
    selectedCountry:{type:String},
    selectedBenificialCountry:{type:String},
    endDateTime: { type: String },
    paymentType: {
      type: String,
      enum: [
        "Paid",
        "UnPaid",
        "Online",
        "Offline",
        "GooglePay",
        "ApplePay",
        "Paypal",
        "Zelle",
        "CashApp",
        "Venmo",
        "Cash",
        "CreditCard",
      ],
      default: "UnPaid",
    },
    phoneNumber: { type: String },
    userProfileImg: { type: String },
    dob: { type: Date },
    tags: { type: Object },
    address: { type: Object },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);
customerSchema.index({ location: "2dsphere" });

var Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
