var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var emailSetting = new Schema(
  {
    description1: {
        type: String,
        default:""
    },
    description2: {
        type: String,
        default:""
    },
    endsWith: { type: String,
        default:"" },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "emailSetting",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var serviceSchema = mongoose.model("emailSettingService", emailSetting);

module.exports = serviceSchema;
