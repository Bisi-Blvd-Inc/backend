var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CustomizeLinkSchema = new Schema(
  {
    Description: { type: String, required: true },
    Theme: { type: String, required: true },
    Title: { type: String, required: true },
    Paymentonline: { type: String, required: true },
    Paymentoffline:{ type: String, required: true },
    logo: { type: String },
    linkImg: { type: String },
    isDeleted: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var CustomizeLink = mongoose.model("CustomizeLink", CustomizeLinkSchema);

module.exports = CustomizeLink;
