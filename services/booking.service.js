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

const getUpcomingAppointmentsByEmail = (userEmail) => {
  return bookingCollection.find({email: userEmail, startDate: { $gte: new Date() }}).sort({ startDate: 1 }).populate("service").populate("classes").populate("products");
};

const findinvoicecutomerID = (condition) => {
  return bookingCollection.find(condition).populate("bookingFor");
};

// Add this function to your booking.service.js file

/**
 * Finds all users who have created bookings for a specific customer email.
 * @param {string} email - The customer's email to search for in the bookings.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects who created the bookings.
 */
const getRecentProvidersByBookingEmail = (email) => {
  return bookingCollection.aggregate([
    {
      $match: {
        email: email,
      },
    },
    {
      $group: {
        _id: "$userId",
        lastAppointmentDate: { $max: "$startDate" }
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: "$user._id",
        businessName: "$user.businessName",
        email: "$user.email",
        lastAppointmentDate: "$lastAppointmentDate",
      },
    },
    {
      $sort: {
        lastAppointmentDate: -1,
      },
    },
  ]);
};


/**
 * Fetches a paginated history of bookings for a specific email.
 * @param {string} email - The customer's email.
 * @param {number} limit - The number of bookings to return per page.
 * @param {number} offset - The number of bookings to skip (for pagination).
 * @returns {Promise<Object>} A promise that resolves to an object with booking data and page info.
 */
const fetchBookingHistoryByEmail = async (email, limit = 10, offset = 0) => {
  const numLimit = parseInt(limit, 10) || 10;
  const numOffset = parseInt(offset, 10) || 0;

  const aggregationResult = await bookingCollection.aggregate([
    // Stage 1: Find all bookings matching the email
    {
      $match: { email: email },
    },
    // Stage 2: Sort by start date to show the most recent bookings first
    {
      $sort: { startDate: -1 },
    },
    // Stage 3: Use $facet to create two parallel pipelines: one for data, one for metadata
    {
      $facet: {
        // Pipeline for the paginated data
        data: [
          { $skip: numOffset },
          { $limit: numLimit },
          // Populate related fields for the paginated results
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
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "business",
            },
          },
          {
            $addFields: {
              businessName: { $arrayElemAt: ["$business.businessName", 0] }
            }
          },
          {
            $project: {
              business: 0
            }
          },
        ],
        // Pipeline for the pagination metadata
        metadata: [{ $count: "total" }],
      },
    },
    // Stage 4: Reshape the output for a cleaner response
    {
      $project: {
        data: "$data",
        pageInfo: {
          // Use $ifNull to handle cases where there are no results
          total: { $ifNull: [{ $arrayElemAt: ["$metadata.total", 0] }, 0] },
          // Use $literal to treat the variables as values, not projection flags
          limit: { $literal: numLimit },
          offset: { $literal: numOffset },
        },
      },
    },
  ]);

  // Aggregation returns an array, we need the first (and only) element
  const result = aggregationResult[0];

  // If there are no results, provide a default structure
  if (!result.pageInfo.total) {
    return {
      data: [],
      pageInfo: {
        total: 0,
        limit: numLimit,
        offset: numOffset,
      },
    };
  }

  return result;
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
  findinvoicecutomerID,
  getUpcomingAppointmentsByEmail,
  getRecentProvidersByBookingEmail,
  fetchBookingHistoryByEmail
};
