const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// De-identified record kept after a subscriber deletes their account, so the
// business can still see tenure, plan and usage trends. It must never hold
// anything that identifies a person or business (no user id, name, email,
// phone, business name, address or free text); Apple's account-deletion rule
// (5.1.1(v)) requires personal data to be removed on deletion.
const deletedAccountSummarySchema = new Schema(
  {
    summaryId: { type: String, required: true, unique: true },
    signedUpMonth: { type: String },
    lastLoginMonth: { type: String },
    loginCount: { type: Number, default: 0 },
    tenureDays: { type: Number },
    planName: { type: String },
    hadActiveSubscription: { type: Boolean },
    hadBankConnection: { type: Boolean },
    bookingsCount: { type: Number, default: 0 },
    customersCount: { type: Number, default: 0 },
    servicesCount: { type: Number, default: 0 },
    country: { type: String },
    state: { type: String },
    businessTypes: [{ type: Schema.Types.ObjectId, ref: "Business" }],
    reasonCode: { type: String },
    deletedMonth: { type: String },
  },
  { collection: "deletedAccountSummary", timestamps: { createdAt: true } }
);

module.exports = mongoose.model(
  "DeletedAccountSummary",
  deletedAccountSummarySchema
);
