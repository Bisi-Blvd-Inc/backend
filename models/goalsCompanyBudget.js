var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema(
  {
    companyBudget: { type: Object },
    service: [{ type: Object }],
    calculatedgoals: { type: Object },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    accurateGoals: { type: Object },
  },

  {
    collection: "goalsCompanyBudget",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var goalsCompanyBudget = mongoose.model("goalsCompanyBudget", userSchema);
//
module.exports = goalsCompanyBudget;
