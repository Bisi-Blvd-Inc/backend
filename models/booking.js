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
    googleEventId: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);
BookingSchema.index({ location: "2dsphere" });

// Mirror bookings to the subscriber's connected Google Calendar. Every create
// and update in the app goes through Booking.create / findByIdAndUpdate, so
// hooking here covers the owner's calendar and client booking links alike.
// These run in the background and swallow their own errors — a calendar
// problem must never fail or slow down saving a booking.
const calendarSync = () => require("../services/calendarSync.service");

BookingSchema.post("save", function (doc) {
  try {
    calendarSync().syncBookingInBackground(doc._id);
  } catch (err) {
    console.error("Calendar sync hook (save) failed:", err.message);
  }
});

BookingSchema.post("findOneAndUpdate", function (doc) {
  try {
    if (doc) calendarSync().syncBookingInBackground(doc._id);
  } catch (err) {
    console.error("Calendar sync hook (update) failed:", err.message);
  }
});

BookingSchema.pre("deleteOne", { document: false, query: true }, async function () {
  try {
    const existing = await this.model
      .findOne(this.getFilter())
      .select("userId googleEventId")
      .lean();
    this._calendarEventToRemove =
      existing && existing.googleEventId
        ? { userId: existing.userId, googleEventId: existing.googleEventId }
        : null;
  } catch (err) {
    this._calendarEventToRemove = null;
  }
});

BookingSchema.post("deleteOne", { document: false, query: true }, function () {
  try {
    if (this._calendarEventToRemove) {
      calendarSync().removeEventInBackground(this._calendarEventToRemove);
    }
  } catch (err) {
    console.error("Calendar sync hook (delete) failed:", err.message);
  }
});

var Booking = mongoose.model("Booking", BookingSchema);

module.exports = Booking;
