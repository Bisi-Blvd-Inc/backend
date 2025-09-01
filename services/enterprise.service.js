const EnterpriseCollection = require("../models/enterprise.js");
const UserCollection = require("../models/user.js");
const { v4: uuidv4 } = require("uuid");

const createEnterprise = async (data) => {
  const enterprise = new EnterpriseCollection(data);
  return await enterprise.save();
};

const updateById = async (id, obj) => {
  return await EnterpriseCollection.findByIdAndUpdate(id, obj);
};

// This needs to be modified, as we're not sure what deleting an enterprise would mean
const deleteById = async (id) => {
  return await EnterpriseCollection.findByIdAndDelete(id);
};

const addEnterpriseKey = async (enterpriseId) => {
  const newKey = uuidv4();
  const enterprise = await EnterpriseCollection.findById(enterpriseId);

  if (!enterprise) {
    throw new Error("Enterprise not found");
  }

  if (enterprise.userKeys.length >= enterprise.licenses) {
    throw new Error("Maximum number of keys already assigned");
  }

  enterprise.userKeys.push({ key: newKey });
  return await enterprise.save();
};

const deleteEnterpriseKey = async (key) => {
  const enterprise = await EnterpriseCollection.findOne({
    "userKeys.key": key,
  });

  if (!enterprise) {
    throw new Error("Key not found in any enterprise");
  }

  const keyEntry = enterprise.userKeys.find((k) => k.key === key);
  const userId = keyEntry?.user;

  let userDeleted = false;
  if (userId) {
    const response = await UserCollection.updateOne(
      { _id: userId },
      { $set: { withEnterprise: false, isEnterpriseAdmin: false } }
    );
    userDeleted = response.modifiedCount > 0;
  }

  enterprise.userKeys = enterprise.userKeys.filter((k) => k.key !== key);
  const updatedEnterprise = await enterprise.save();

  return {
    updatedEnterprise,
    userDeleted,
  };
};

const getEnterpriseByUserId = async (userId) => {
  return await EnterpriseCollection.findOne({ "userKeys.user": userId })
    .populate({
      path: "businessType",
      model: "Business",
    })
    .populate({
      path: "userKeys.user",
      model: "User",
      populate: [
        {
          path: "businessType",
          model: "Business",
        },
        {
          path: "goalsCompanyBudget",
          select: "companyBudget accurateGoals",
        },
        {
          path: "bookings",
          select: "bookingStatus startDateTime servicePrice",
        },
        {
          path: "expenses",
          select: "summaryObject",
        },
      ],
    });
};

const getEnterpriseByKey = async (key) => {
  return await EnterpriseCollection.findOne({
    userKeys: {
      $elemMatch: {
        key: key,
        user: null,
      },
    },
  }).select("enterpriseName _id businessType");
};

const get = async (pageNo, limit) => {
  return await EnterpriseCollection.find()
    .skip(parseInt(pageNo - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate("businessType");
};

const getEnterpriseById = async (id) => {
  return await EnterpriseCollection.findById(id)
    .populate("businessType")
    .populate("userKeys.user");
};

module.exports = {
  createEnterprise,
  getEnterpriseByUserId,
  get,
  getEnterpriseById,
  updateById,
  deleteById,
  getEnterpriseByKey,
  addEnterpriseKey,
  deleteEnterpriseKey,
};
