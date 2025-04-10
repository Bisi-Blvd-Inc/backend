var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const PointSchema = new Schema({
  type: { type: String, default: "Point" },
  coordinates: { type: [Number] },
});
var BookingSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    service: [{ type: Schema.Types.ObjectId, ref: "businessService" }],
    classes: [{ type: Schema.Types.ObjectId, ref: "businessClass" }],
    serviceType: {
      type: String,
      enum: ["Service", "Class"],
      default: "Service",
    },
    numberOfSeats: { type: Number, default: 1 },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    benificialName: { type: String },
    benificialEmail: { type: String },
    selectedCountry: { type: String },
    selectedBenificialCountry: { type: String },
    benificialPhone: { type: String },
    isDeleted: { type: Boolean, default: false },
    eventColor: {
      type: String,
      enum: [
        "#b1cced",
        "#cf0018",
        "#7eb0eb",
        "#ed8d8b",
        "#a4e8b9",
        "#206cc4",
        "#528d64",
        "#b6b6b6",
      ],
      default: "#cf0018",
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["Confirmed", "Completed", "Cancelled"],
      default: "Confirmed",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User" },
    startDate: { type: Date },
    endDate: { type: Date },
    startDateTime: { type: String },
    servicePrice: { type: Number },
    bookingType: { type: String },
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
    show: { type: Boolean, default: false },
    checkinDate: { type: Date },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    bookingFor: { type: Schema.Types.ObjectId, ref: "Customer" },
    scheduleexist: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);
BookingSchema.index({ location: "2dsphere" });

var Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
