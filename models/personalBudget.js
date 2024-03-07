var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema(
  {
    income: {
      type: Object,
    },
    housing: { type: Object },
    transportation: { type: Object },
    houseHold: { type: Object },
    loanPayments: { type: Object },
    personalInsurance: { type: Object },
    discretionary: { type: Object },
    companyExpenses: { type: Object },
    summaryObject: { type: Object },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "personalBudget",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var personalBudget = mongoose.model("personalBudget", userSchema);
//
module.exports = personalBudget;
