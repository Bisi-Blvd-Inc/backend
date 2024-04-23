const userfile = require("../../services/userfileupload.services");
const mongoose = require("mongoose");
const userfileModel = require("../../models/userDetailfileupload");

const userSoapservices = require("../../services/usersoap.services");

const addfilesupdate = async (req, res) => {
  try {
    // return console.log(req.body , req.file.filename)
    let { id } = req.params;
    const {fileName , filesType } = req.body;
  
 
    const Id = req._user;
    // if (!findUser) {
    const obj = {
      fileName:fileName,
      filesType: filesType,
      file : req.file.filename,
      addedByuser: id,
      addedByowner: Id,
      };
     const response = await userfile.post(obj);
     return res.status(200).json({
              success: true,
              message: "Added successfully",
              data: response,
     });
    // }
    // if (!findUser) {
    //   {
    //     const obj = Object.assign({}, req.body);

    //     if (name === "appointmentFiles") {
    //       const obj = {
    //         appointmentFiles: [],
    //         customerFiles: [],
    //         formsFiles: [],
    //         addedByuser: id,
    //         addedByowner: Id,
    //       };
    //       const title = req.body.title;
    //       const file = req.file.filename;
    //       obj.appointmentFiles = { file, title };

    //       const response = await userfile.post(obj);
    //       return res.status(200).json({
    //         success: true,
    //         message: "Added successfully",
    //         data: response,
    //       });
    //     } else if (name === "customerFiles") {
    //       const obj = {
    //         appointmentFiles: [],
    //         customerFiles: [],
    //         formsFiles: [],
    //         addedByuser: id,
    //         addedByowner: Id,
    //       };
    //       const title = req.body.title;
    //       const file = req.file.filename;
    //       obj.customerFiles = { file, title };

    //       const response = await userfile.post(obj);
    //       return res.status(200).json({
    //         success: true,
    //         message: "Added successfully",
    //         data: response,
    //       });
    //     } else {
    //       const obj = {
    //         appointmentFiles: [],
    //         customerFiles: [],
    //         formsFiles: [],
    //         addedByuser: id,
    //         addedByowner: Id,
    //       };
    //       const title = req.body.title;
    //       const file = req.file.filename;
    //       obj.formsFiles = { file, title };
    //       const response = await userfile.post(obj);
    //       return res.status(200).json({
    //         success: true,
    //         message: "Added successfully",
    //         data: response,
    //       });
    //     }
    //   }
    // } else {
    //   if (name === "appointmentFiles") {
    //     const file = req.file.filename;
    //     const obj = { $push: { appointmentFiles: { title, file } } };

    //     const response = await userfile.update({ addedByuser: userID }, obj);
    //     return res.status(200).json({
    //       success: true,
    //       message: "Updated successfully",
    //       data: response,
    //     });
    //   } else if (name === "customerFiles") {
    //     const title = req.body.title;
    //     const file = req.file.filename;
    //     const obj = { $push: { customerFiles: { title, file } } };

    //     const response = await userfile.update({ addedByuser: userID }, obj);
    //     return res.status(200).json({
    //       success: true,
    //       message: "Updated successfully",
    //       data: response,
    //     });
    //   } else {
    //     const title = req.body.title;
    //     const file = req.file.filename;
    //     const obj = { $push: { formsFiles: { title, file } } };

    //     const response = await userfile.update({ addedByuser: userID }, obj);
    //     return res.status(200).json({
    //       success: true,
    //       message: "Updated successfully",
    //       data: response,
    //     });
    //   }
    // }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
      success: false,
    });
  }
};
const filesupdate = async (req, res) => {
  try {
    let { id } = req.params;
    const {fileName , filesType } = req.body;
    const obj = {
      fileName:fileName,
      filesType: filesType,
      file : req.file.filename,
      };
    const response = await userfile.update({ _id: id } , obj);
    if (response) {
     return res.status(200).json({
              success: true,
              message: "Updated successfully",
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
const filesupdateNofile = async (req, res) => {
  try {
    let { id } = req.params;
    const {fileName , filesType ,file } = req.body;
    const obj = {
      fileName:fileName,
      filesType: filesType,
      file : file,
      };
    const response = await userfile.update({ _id: id } , obj);
    if (response) {
     return res.status(200).json({
              success: true,
              message: "Updated successfully",
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
const searchProductByDateAndName = async (req, res) => {
  try {
    let { date, text, id } = req.query;
    let trimmedText = text.trim();
    const regex = new RegExp(trimmedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const query = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query['createdAt'] = { $gte: startOfDay, $lte: endOfDay };
    }
    if (text) {
      query['fileName'] = regex;
    }
    if (id) {
      query['addedByuser'] = mongoose.Types.ObjectId(id);
    }

    const response = await userfile.getFileswithId(query);

    if (response) {
      return res.status(200).json({
        success: true,
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No Data Found',
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

const deletearrayindex = async (req, res) => {
  const userId = req.params.id;
  try {
    const respnse =  await userfileModel.findByIdAndDelete(
      { _id : userId }
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
  filesupdate,
  searchProductByDateAndName,
  filesupdateNofile
};
