var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userdetailsoapSchema = new Schema(
  {
    userBookingId: { type: Schema.Types.ObjectId, ref: "bookingUserSchema" },
    level: { type: Number },
    subjective: { type: String },
    objective: { type: String},
    assessment: { type: String },
    plan: { type: String },
    additionalNotes: { type: String },
    files: { type: Object },
    addedBy: { type: Schema.Types.ObjectId},

  },
  { collection: "userdetailsoap", timestamps: { createdAt: true, updatedAt: true } }
);

var Userdetailsoap = mongoose.model("userdetailsoap", userdetailsoapSchema);

module.exports = Userdetailsoap;
