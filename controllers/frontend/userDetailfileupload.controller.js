const userfile = require("../../services/userfileupload.services");
const mongoose = require("mongoose");
const userfileModel = require("../../models/userDetailfileupload");

const userSoapservices = require("../../services/usersoap.services");

const addfilesupdate = async (req, res) => {
  try {
    let { id } = req.params;
    const { name } = req.body;
    const userID = mongoose.Types.ObjectId(id);

    const findUser = await userfile.findOne({ addedByuser: id });
    const Id = req._user;
    if (!findUser) {
      {
        const obj = Object.assign({}, req.body);

        if (name === "appointmentFiles") {
          const obj = {
            appointmentFiles: [],
            customerFiles: [],
            formsFiles: [],
            addedByuser: id,
            addedByowner: Id,
          };
          const title = req.body.title;
          const file = req.file.filename;
          obj.appointmentFiles = { file, title };

          const response = await userfile.post(obj);
          return res.status(200).json({
            success: true,
            message: "Added successfully",
            data: response,
          });
        } else if (name === "customerFiles") {
          const obj = {
            appointmentFiles: [],
            customerFiles: [],
            formsFiles: [],
            addedByuser: id,
            addedByowner: Id,
          };
          const title = req.body.title;
          const file = req.file.filename;
          obj.customerFiles = { file, title };

          const response = await userfile.post(obj);
          return res.status(200).json({
            success: true,
            message: "Added successfully",
            data: response,
          });
        } else {
          const obj = {
            appointmentFiles: [],
            customerFiles: [],
            formsFiles: [],
            addedByuser: id,
            addedByowner: Id,
          };
          const title = req.body.title;
          const file = req.file.filename;
          obj.formsFiles = { file, title };
          const response = await userfile.post(obj);
          return res.status(200).json({
            success: true,
            message: "Added successfully",
            data: response,
          });
        }
      }
    } else {
      if (name === "appointmentFiles") {
        const file = req.file.filename;
        const obj = { $push: { appointmentFiles: { title, file } } };

        const response = await userfile.update({ addedByuser: userID }, obj);
        return res.status(200).json({
          success: true,
          message: "Updated successfully",
          data: response,
        });
      } else if (name === "customerFiles") {
        const title = req.body.title;
        const file = req.file.filename;
        const obj = { $push: { customerFiles: { title, file } } };

        const response = await userfile.update({ addedByuser: userID }, obj);
        return res.status(200).json({
          success: true,
          message: "Updated successfully",
          data: response,
        });
      } else {
        const title = req.body.title;
        const file = req.file.filename;
        const obj = { $push: { formsFiles: { title, file } } };

        const response = await userfile.update({ addedByuser: userID }, obj);
        return res.status(200).json({
          success: true,
          message: "Updated successfully",
          data: response,
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};

const getFilesData = async (req, res) => {
  try {
    let { id } = req.params;
    const response = await userfile.getFileswithId({
      addedByuser: id,
    });
    if (!response) {
      return res.status(200).json({
        message: "User not found",
        status: 404,
      });
    } else {
      return res.status(200).json({
        message: "Users get successfully",
        data: response,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};


const deletearrayindex = async (req, res) => {
  const userId = req.params.id;
  const index = req.body.data.index;
  const name = req.body.data.name;

  try {
    const result = await userfileModel.findOneAndUpdate(
      { addedByuser: userId },
      { $set: { [`${name}.${index}`]: null } },
      { new: true }
    );

    const respnse =  await userfileModel.findOneAndUpdate(
      { addedByuser: userId },
      { 
        $pull: { [name]: null },
      },
      { new: true }
    );
    if (respnse) {
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
        data: respnse,
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
  addfilesupdate,
  getFilesData,
  deletearrayindex,
};
