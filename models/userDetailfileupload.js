var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userDetailfileuploadsoapSchema = new Schema(
  {
    appointmentFiles: { type: Array , default:null },
    customerFiles: { type: Array, default:null},
    formsFiles: { type: Array, default:null},
    addedByuser: { type: Schema.Types.ObjectId},
    addedByowner: { type: Schema.Types.ObjectId},
  },
  { collection: "userDetailfileupload", timestamps: { createdAt: true, updatedAt: true } }
);

var userDetailfileupload = mongoose.model("userDetailfileupload", userDetailfileuploadsoapSchema);

module.exports = userDetailfileupload;
