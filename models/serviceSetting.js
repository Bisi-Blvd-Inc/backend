var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var serviceSettingSchema = new Schema(
  {
    service: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: "businessService" },
        serviceTime: {
          hours: { type: Number, default: 0 },
          minutes: { type: Number, default: 0 },
        },
        price: { type: Number, default: 0 },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "serviceSetting",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var serviceSchema = mongoose.model("serviceSetting", serviceSettingSchema);

module.exports = serviceSchema;
