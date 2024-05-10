const notesService = require("../../services/notes.service");
const create = async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    const Id = req._user;
    const obj = {
      title: title,
      description: description,
      addedByuser: userId,
      addedBy: Id,
    };
    const createdData = await notesService.post(obj);
    return res.status(200).json({
      success: true,
      message: "Notes added successfully",
      data: createdData,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await notesService.getAll({addedByuser : id});
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
module.exports = {
  create,
  getAll,
};
