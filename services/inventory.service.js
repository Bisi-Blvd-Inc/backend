const inventoryCollection = require("../models/inventory");
const mongoose = require("mongoose");

const post = (payload) => inventoryCollection.create(payload);

const get = (condition) => {
  return inventoryCollection.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(condition) , isDeleted : false } },
    {
      $lookup: {
        from: "businessService",
        localField: "service",
        foreignField: "_id",
        as: "service",
      },
    },

    { $sort: { name: -1 } },
    {
      $facet: {
     
        data: [{ $skip: 0 }, { $limit: 1000 }],
      },
    },
  ]);
};

const getInventoryById = (id)=>{
  return inventoryCollection.findOne({_id:id}).populate("service")
}
const getAll = () => {
  return inventoryCollection.find({ isDeleted: false });
};

const update = (condition, payload) => {
  return inventoryCollection.findByIdAndUpdate(condition, payload);
};

const getInventoryBySearch = (text, pageNo, limit) => {
  return inventoryCollection
    .find({
      $or: [{ name: { $regex: String(text), $options: "i" } }],
      isDeleted: false,
    }).populate("service")
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit);
};

module.exports = {
  post,
  getAll,
  update,
  get,
  getInventoryById,
  getInventoryBySearch,
};
