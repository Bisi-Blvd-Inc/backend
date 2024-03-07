var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var upgradeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    cardDetails: { type: Object },
    planDeatils: { type: Object },
    subscriptionStatus: { type: Boolean, default: false },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    invoiceNumber: {
      type: String,
    },
    stripeCustomerId: { type: String },
    subscription: { type: Object },
    paymentMethod: { type: Object },
    paymentStatus: { type: Number },
  },
  { collection: "upgrade", timestamps: { createdAt: true, updatedAt: true } }
);

var Upgrade = mongoose.model("Upgrade", upgradeSchema);

module.exports = Upgrade;
