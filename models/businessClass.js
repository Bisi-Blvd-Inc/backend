var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var businessClassSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: 0, required: true },
    classTime: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
    },
    availableSeats: { type: Number, default: 0, required: true },
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "businessClass",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var businessClass = mongoose.model("businessClass", businessClassSchema);

module.exports = businessClass;
