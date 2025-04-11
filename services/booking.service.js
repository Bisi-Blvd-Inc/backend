const bookingCollection = require("../models/booking");
const customerCollection = require("../models/customer");
const mongoose = require("mongoose");

const post = (payload) => bookingCollection.create(payload);
const update = (condition, payload) => {
  return bookingCollection.findByIdAndUpdate(condition, payload).populate("service");
};
const get = (condition) => {
  return bookingCollection.findById(condition);
};
const findOne = (condition) => {
  return bookingCollection.findOne(condition);
};
const findByName = (name, userId) => {
  return customerCollection.aggregate([
    {
      $match: {
        $and: [
          { userId: mongoose.Types.ObjectId(userId) },

          {
            $or: [
              { name: { $regex: String(name), $options: "i" } },
              { email: { $regex: String(name), $options: "i" } },
            ],
          },
        ],
      },
    },
  ]);
};
const findById = (id) => {
  return bookingCollection.findOne({ _id: id }).populate("service").populate("classes").populate("products");
};
const find = (condition) => {
  const [paymentStatus, service, startDate, endDate] = condition;
  return bookingCollection.aggregate([
    [
      {
        $project: {
          startDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$startDate",
            },
          },
          endDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$endDate",
            },
          },
          name: 1,
          email: 1,
          service: 1,
          paymentStatus: 1,
        },
      },
      {
        $match: {

          endDate: endDate,

        },
      },
      {
        $lookup: {
          from: "businessService",
          localField: "service",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $lookup: {
          from: "businessClass",
          localField: "classes",
          foreignField: "_id",
          as: "classes",
        },
      },
      {
        $lookup: {
          from: "Product",
          localField: "products",
          foreignField: "_id",
          as: "products",
        },
      },
    ],
  ]);
};
const GetAllListwithLimit = (condition) => {
  return bookingCollection.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(condition) } },
    {
      $lookup: {
        from: "businessService",
        localField: "service",
        foreignField: "_id",
        as: "service",
      },
    },
    {
      $lookup: {
        from: "businessClass",
        localField: "classes",
        foreignField: "_id",
        as: "classes",
      },
    },
    {
      $lookup: {
        from: "Product",
        localField: "products",
        foreignField: "_id",
        as: "products",
      },
    },

    { $sort: { name: -1 } },
    {
      $facet: {

        data: [{ $skip: 0 }, { $limit: 1000 }], // add projection here wish you re-shape the docs
      },
    },
  ]);
};

const allConfirmedBooking = (condition) => {
  return bookingCollection.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(condition), bookingStatus: "Confirmed" } },
    {
      $lookup: {
        from: "businessService",
        localField: "service",
        foreignField: "_id",
        as: "service",
      },
    },
    {
      $lookup: {
        from: "businessClass",
        localField: "classes",
        foreignField: "_id",
        as: "classes",
      },
    },
    {
      $lookup: {
        from: "Product",
        localField: "products",
        foreignField: "_id",
        as: "products",
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

const getBooingWithDate = async (userId, startDate, endDate) => {
  return bookingCollection.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },

    {
      $lookup: {
        from: "businessService",
        localField: "service",
        foreignField: "_id",
        as: "service",
      },
    },
    {
      $lookup: {
        from: "businessClass",
        localField: "classes",
        foreignField: "_id",
        as: "classes",
      },
    },
    {
      $lookup: {
        from: "Product",
        localField: "products",
        foreignField: "_id",
        as: "products",
      },
    },

    {
      $match: {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },

    {
      $facet: {
        metadata: [{ $count: "total" }, { $addFields: { page: 1 } }],

        data: [{ $skip: 0 }, { $limit: 4 }],
      },
    },
  ]);
};

const findWithName = (payload) => {
  return bookingCollection.find({ name: payload });
};

const findWithEmail = (condition) => {
  return customerCollection.find({ email: condition });
};
const findCustomerWithName = (condition) => {
  return customerCollection.find({ name: condition });
};
const findBycutomerID = (condition) => {
  return bookingCollection.find(condition).populate("service").populate("classes").populate("products");
};


const findinvoicecutomerID = (condition) => {
  return bookingCollection.find(condition).populate("bookingFor");
};

module.exports = {
  post,
  update,
  get,
  findOne,
  find,
  findById,
  findByName,
  GetAllListwithLimit,
  allConfirmedBooking,
  getBooingWithDate,
  findWithName,
  findWithEmail,
  findCustomerWithName,
  findBycutomerID,
  findinvoicecutomerID
};
