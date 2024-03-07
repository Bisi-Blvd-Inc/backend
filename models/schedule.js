var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var calenderSchema = new Schema(
  {
    scheduledData: {
      type: Array,
    },
    isDeleted: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },

  {
    collection: "Schedule",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var User = mongoose.model("Schedule", calenderSchema);

module.exports = User;
