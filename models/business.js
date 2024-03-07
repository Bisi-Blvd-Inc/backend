var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var businessSchema = new Schema(
  {
    businessType: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    collection: "business",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

businessSchema.virtual("service", {
  ref: "businessService",
  localField: "_id",
  foreignField: "businessTypeId",
});

var Business = mongoose.model("Business", businessSchema);

module.exports = Business;
