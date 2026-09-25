const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One bank connection per subscriber for v1 — this codebase treats a User
// as the tenant (there's no separate Company/Business entity to attach a
// connection to instead). accessTokenEncrypted is encrypted the same way
// as payment-processor secrets (helpers/paymentCrypto.js) since it's read
// access to a live bank account, more sensitive than a Stripe customer id.
const bankConnectionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["plaid"], default: "plaid" },
    itemId: { type: String, required: true },
    accessTokenEncrypted: { type: String, required: true },
    institutionId: { type: String },
    institutionName: { type: String },
    status: {
      type: String,
      enum: ["connected", "error", "disconnected"],
      default: "connected",
    },
    // Set when status is "error" (e.g. Plaid's ITEM_LOGIN_REQUIRED) so the
    // frontend can show a specific "reconnect your bank" prompt.
    errorCode: { type: String },
    cursor: { type: String }, // Plaid transactions-sync cursor, incremental
    lastSyncedAt: { type: Date },
    // Set by the webhook handler so the next sweep prioritizes this item
    // instead of waiting for its regular turn.
    needsSync: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    collection: "bankConnection",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

bankConnectionSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model("BankConnection", bankConnectionSchema);
