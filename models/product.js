var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ProductSchema = new Schema(
  {
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory" },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    userId: { type: Schema.Types.ObjectId, ref: "Customer" },
  },
  {
    collection: "product",
    timestamps: { createdAt: true, updatedAt: true },
  }
);

var Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
