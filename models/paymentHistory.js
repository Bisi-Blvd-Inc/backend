const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const paymentSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    amount: {
      type: Number,
    },
    paymentStatus: {
      type: String,
    },
    paymentIntent:{
      type: String,
    },
    paymentMthod: {
      type: String,
    },
    invoiceNumber: {
      type: String,
    },
    stripeDetail: {
      type: Object,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Payment", paymentSchema);
