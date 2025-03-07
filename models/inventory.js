var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var InventorySchema = new Schema(
  {
    name: { type: String,required: true  },
    price: { type: Number,required: true  },
    productstock: { type: Number,required: true  },
    service: [{ type: Schema.Types.ObjectId, ref: "businessService" }],
    productimgs: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    estUsage: [
      {
        serviceId: { type: Schema.Types.ObjectId, ref: "businessService" },
        value: { type: Number, default: 0 },
      }
    ],
    description: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);


var Inventory = mongoose.model("Inventory", InventorySchema);

module.exports = Inventory;
