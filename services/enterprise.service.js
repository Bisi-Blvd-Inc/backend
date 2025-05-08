const EnterpriseCollection = require("../models/enterprise.js");
const { v4: uuidv4 } = require("uuid");

const createEnterprise = async (data) => {
  const enterpriseKey = uuidv4();
  const enterprise = new EnterpriseCollection({ ...data, enterpriseKey });
  return await enterprise.save();
};

const updateById = async (id, obj) => {
  return await EnterpriseCollection.findByIdAndUpdate(id, obj);
};

const deleteById = async (id) => {
  return await EnterpriseCollection.findByIdAndDelete(id);
};

const getEnterpriseByUserId = async (userId) => {
  return await EnterpriseCollection.findOne({ users: userId });
};

const getEnterpriseByKey = async (key) => {
  return await Enterprise.findOne({ enterpriseKey: key });
};

const addUserToEnterprise = async (enterpriseKey, userId) => {
  return await EnterpriseCollection.findOneAndUpdate(
    { enterpriseKey },
    { $addToSet: { users: userId } },
    { new: true }
  );
};

const getAllEnterprises = async () => {
  return await EnterpriseCollection.find()
    .populate("businessType users")
    .sort({ updatedAt: -1, createdAt: -1 });
};

const getEnterpriseById = async (id) => {
  return await EnterpriseCollection.findById(id).populate("businessType users");
};

module.exports = {
  createEnterprise,
  getEnterpriseByUserId,
  addUserToEnterprise,
  getAllEnterprises,
  getEnterpriseById,
  updateById,
  deleteById,
  getEnterpriseByKey,
};
