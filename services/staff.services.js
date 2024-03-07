const staffCollection = require("../models/user");
const post = (payload) => staffCollection.create(payload);
const get = (userid , pageNo, limit) => {
  return staffCollection
    .find({ addedBy :userid, isDeleted: false })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ _id: -1 });
};

const getone = (userid , id) => {
  return staffCollection.findOne({addedBy : userid , _id : id});
};


const getAll = () => {
  return staffCollection.find({ isDeleted: false });
};

const update = (condition, payload) => {
  return staffCollection.findByIdAndUpdate(condition, payload);
};
const updateOne = (condition, payload) => {
  return staffCollection.updateOne(condition, payload);
};
const getUsersBySearch = (text, pageNo, limit) => {
  return staffCollection
    .find({
      $or: [{ name: { $regex: String(text), $options: "i" } }],
      isDeleted: false,
    })
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit);
};

module.exports = {
  post,
  getAll,
  update,
  get,
  getUsersBySearch,
  updateOne,
  getone
};
