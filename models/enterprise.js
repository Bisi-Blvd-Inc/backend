const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const enterpriseSchema = new Schema(
  {
    enterpriseName: { type: String, required: true },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    headquarters: { type: String },
    enterpriseSource: { type: String },
    businessType: { type: Schema.Types.ObjectId, ref: "Business" },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    licenses: { type: Number, required: true },
    enterpriseKey: { type: String, unique: true, required: true },
  },
  {
    collection: "Enterprise",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

const Enterprise = mongoose.model("Enterprise", enterpriseSchema);

module.exports = Enterprise;
