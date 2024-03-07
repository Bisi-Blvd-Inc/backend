var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var InventorySchema = new Schema(
  {
    name: { type: String,required: true  },
    price: { type: Number,required: true  },
    productstock: { type: Number,required: true  },
    service: [{ type: Schema.Types.ObjectId, ref: "businessService" }],
    productimg: { type: String },
    isDeleted: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);


var Inventory = mongoose.model("Inventory", InventorySchema);

module.exports = Inventory;
