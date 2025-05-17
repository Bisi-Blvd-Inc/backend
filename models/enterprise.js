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
    businessType: [{ type: Schema.Types.ObjectId, ref: "Business" }],
    licenses: { type: Number, required: true },
    userKeys: [
      {
        key: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", default: null },
      },
    ],
  },
  {
    collection: "Enterprise",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

const Enterprise = mongoose.model("Enterprise", enterpriseSchema);

module.exports = Enterprise;
