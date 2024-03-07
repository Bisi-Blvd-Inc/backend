const staffService = require("../../services/staff.services");
const userCollection = require("../../models/user");
const { pick } = require("lodash");
const { sendstaffMail } = require("../../helpers/users");
const bcrypt = require("bcrypt");

const addStaff = async (req, res) => {
  try {
    const {
      email,
      firstName,
    } = req.body;
    const exist = await userCollection.findOne({
      email: email
    });
    if (exist) {
      return res.status(200).json({
        status: 400,
        message: "Staff already exist",
        success: false,
      });
    } else {
      const obj = {
        ...req.body
      };

      const createdStaff = await staffService.post(obj);
      sendstaffMail(
        email,
        firstName,
        createdStaff._id
      );
      return res.status(200).json({
        success: true,
        message: "Staff Add successfully..",
        data: createdStaff,
      });


    }
  } catch (error) {
    console.log(error);
  }
};

const getAllStaff = async (req, res) => {
  try {
    let { id, pageNo, limit } = req.params;

    const response = await staffService.get(id, Number(pageNo), Number(limit));
    const count = await userCollection.count({ addedBy: id, isDeleted: false });
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
        totalCount: count,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getStaffById = async (req, res) => {
  try {
    let { userid, id } = req.params;

    const response = await staffService.getone(userid, id);
    if (!response) {
      return res.status(200).json({
        message: "Data not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Data get successfully",
        data: response,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const createStaffPassword = async (req, res, next) => {
  try {
    const Id = req.params.id;
    const passwordhash = await bcrypt.hash(req.body.password, 10);

    let result = await staffService.update(
      {
        _id: Id,
      },
      { password: passwordhash },
      { fields: { _id: 1 }, new: true }
    );
    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "Password Created successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const editStaffDetail = async (req, res, next) => {
  try {
    const Id = req.params.id;

    const data = pick(req.body, [
      "firstName",
      "email",
      "mobile",
      "selectedCountry",
      "role",
      "permission",
    ]);
    let result = await staffService.update(
      {
        _id: Id
      },
      { $set: { ...data } },
      { fields: { _id: 1 }, new: true }
    );
    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "Updated successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};
const updateStaffPassword = async (req, res, next) => {
  try {
    const Id = req.params.id;
    const data = pick(req.body, [
      "password"
    ]);
    let result = await staffService.updateOne(
      {
        addedBy: Id,
      },
      { password: password },
      { fields: { _id: 1 }, new: true }
    );
    return res.status(200).json({
      status: 200,
      success: true,
      data: result,
      message: "Update password successfully",
    });
  } catch (error) {
    return res
      .status(200)
      .json({ status: 401, success: false, message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const id = req.params.id;
    const userid = req.params.userId;
    const response = await userCollection.deleteOne({ addedBy: userid, _id: id });
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

const UserSearch = async (req, res) => {
  try {
    let { userid } = req.params;
    let text1 = req.query.text.trim();
    const regex = new RegExp(text1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const response = await userCollection.find({
      addedBy: userid,
      firstName: regex
    }
    );
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

module.exports = {
  addStaff,
  getAllStaff,
  editStaffDetail,
  deleteStaff,
  UserSearch,
  createStaffPassword,
  updateStaffPassword,
  getStaffById
};

