var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userdetailnotesSchema = new Schema(
  {
    title: { type: String },
    description: { type: String},
    addedByuser: { type: Schema.Types.ObjectId},
    addedBy: { type: Schema.Types.ObjectId},
  },
  { collection: "userdetailnotes", timestamps: { createdAt: true, updatedAt: true } }
);

var Userdetailnotes = mongoose.model("userdetailnotes", userdetailnotesSchema);

module.exports = Userdetailnotes;
