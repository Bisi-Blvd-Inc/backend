var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var rejectImportschema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    error: {
        type: Array,
    }
  },
  {
    collection: "rejectImports",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var rejectImportsSchema = mongoose.model("rejectImports", rejectImportschema);

module.exports = rejectImportsSchema;
