const userService = require("../../services/user.service");
const bookingUsersService = require("../../services/bookingUser.service");
const customerService = require("../../services/customer.service");
const userCollection = require("../../models/user");
const customerCollection = require("../../models/customer");
const userBooking = require("../../models/bookingUser");
const notificationCollection = require("../../models/notification")


const createUser = async (req, res) => {
  try {
    const { name, email, phone, role, tags } = req.body;
    let user = {
      name,
      email,
      phone,
      role,
      tags,
    };

    const customerId = await customerService.findOne({
      email,
    });
    if (customerId)
      return res.status(401).json({
        success: false,
        message: "User already exists",
      });
    else {
      const createdUser = await customerService.post(user);
      return res.status(200).json({
        success: true,
        message: "User added succesfully",
        data: createdUser,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getUser = async (req, res) => {
  try {
    let { pageNo, limit } = req.params;
    const response = await userService.getUserWithPagination(Number(pageNo), Number(limit));
    const count = await userCollection.count({ role: 3, isDeleted: false });
    if (!response) {
      return res.status(200).json({
        message: "User not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Users get successfully",
        data: response,
        totalCount: count,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getBookingUsersList = async (req, res) => {
  try {
    const response = await bookingUsersService.findUser({ role: 3, isDeleted: false });
    if (!response) {
      return res.status(200).json({
        message: "User not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Users get successfully",
        data: response,
        count: response.length,
        status: 200,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const editBookingUser = async (req, res, next) => {
  try {
    const { name, phone, email, address, dob, tags } = req.body;
    const Id = req.params.id;

    if (!Id) {
      return res.status(401).json({
        success: false,
        message: "Id is required",
      });
    }

    const data = {
      name: name,
      phone: phone,
      address: address,
      dob: dob,
      email: email,
      tags: tags,
    };

    if (req.file) {
      let userProfileImg = req.file.filename;
      data.userProfileImg = userProfileImg;
    }

    let result = await bookingUsersService.update(Id, data);

    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "BookingUser data updated successfully",
    });

  } catch (error) {
    return res.status(401).json({
      status: 401,
      success: false,
      message: error.message,
    });
  }
};


const deleteUBookingUser = async (req, res) => {
  try {
    const response = await bookingUsersService.deleteUser(
      { _id: req.params.id },
      {
        isDeleted: true,
      }
    );
    if (response) {
      return res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No User Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const searchBookingUser = async (req, res) => {
  try {
    let { text, pageNo, limit } = req.query;
    let text1 = text.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const response = await userBooking
      .find({ name: regex })
      .skip((pageNo - 1) * limit)
      .limit(Number(limit));

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No User Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      data: error,
      message: error.message,
      success: false,
    });
  }
};
const getBookingUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const response = await bookingUsersService.findOne(id);
    if (response) {
      return res.status(200).json({
        success: true,
        message: "User of this Id is...",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No User Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const multiDeleteBookingUser = async (req, res) => {
  try {
    const response = await customerCollection.deleteMany({
      _id: { $in: req.body.data },
    });


    const response1 = await notificationCollection.deleteMany({
      customerId: { $in: req.body.data }, type: "User"
    });



    if (response) {
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Theme Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

module.exports = {
  createUser,
  getUser,
  editBookingUser,
  deleteUBookingUser,
  searchBookingUser,
  getBookingUserById,
  getBookingUsersList,
  multiDeleteBookingUser,
};
