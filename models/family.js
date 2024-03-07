var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FamilySchema = new Schema(
  {
    relation: { type: String, required: true },
    users: { type: Schema.Types.ObjectId, ref: "Customer" },
    addedByowner: { type: Schema.Types.ObjectId, ref: "User" },
    addedByuser:{ type: Schema.Types.ObjectId, required: true },
  },
  {
    collection: "family",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var Family = mongoose.model("Family", FamilySchema);

module.exports = Family;
