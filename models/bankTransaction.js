const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bankTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bankConnectionId: {
      type: Schema.Types.ObjectId,
      ref: "BankConnection",
      required: true,
    },
    plaidTransactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }, // Plaid sign convention: positive = money out
    isoCurrencyCode: { type: String, default: "USD" },
    date: { type: Date, required: true },
    merchantName: { type: String },
    description: { type: String },
    // Plaid's own category (Plaid Personal Finance Category primary label)
    plaidCategory: { type: String },
    // Mapped into this app's fixed budget categories — see
    // helpers/budgetCategoryMap.js. Null until mapped/categorized.
    budgetCategory: { type: String },
    pending: { type: Boolean, default: false },
    removed: { type: Boolean, default: false }, // Plaid sync can report a transaction removed
  },
  {
    collection: "bankTransaction",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

bankTransactionSchema.index({ userId: 1, date: -1 });
bankTransactionSchema.index({ bankConnectionId: 1 });

module.exports = mongoose.model("BankTransaction", bankTransactionSchema);
