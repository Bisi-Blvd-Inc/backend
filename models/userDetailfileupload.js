var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userDetailfileuploadsoapSchema = new Schema(
  {
    filesType: { type: String , default:null },
    fileName: { type: String, default:null},
    file: { type: String, default:null},
    addedByuser: { type: Schema.Types.ObjectId},
    addedByowner: { type: Schema.Types.ObjectId},
  },
  { collection: "userDetailfileupload", timestamps: { createdAt: true, updatedAt: true } }
);

var userDetailfileupload = mongoose.model("userDetailfileupload", userDetailfileuploadsoapSchema);

module.exports = userDetailfileupload;
