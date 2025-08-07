const businessClassService = require("../../services/businessClass.service");

const create = async (req, res) => {
  try {
    const {
      name,
      price,
      instructor,
      description,
      date,
      seats,
      difficultyLevel,
      location,
      isReoccurring,
      reoccurringDays,
      reoccurringEndDate,
      startTime,
      endTime,
    } = req.body;
    const payload = {
      name,
      price,
      instructor,
      description,
      date,
      seats,
      difficultyLevel,
      location,
      isReoccurring,
      reoccurringDays,
      reoccurringEndDate,
      startTime,
      endTime,
      addedBy: req._user,
    };
    const result = await businessClassService.createClass(payload);
    if (result) {
      return res.status(200).json({
        message: "Classes added successfully",
        success: true,
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Unable to add classes",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const { pageNo, limit } = req.query;
    const results = await businessClassService.getClass(pageNo, limit);
    return res.status(200).json({
      message: "Classes get successfully",
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const result = await businessClassService.getClassById(req._user);
    if (result) {
      return res.status(200).json({
        message: "Classes get successfully",
        success: true,
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
};

const updateClass = async (req, res) => {
  try {
    const payload = req.body;
    const result = await businessClassService.updateById(
      req.params.id,
      payload
    );
    if (result) {
      return res.status(200).json({
        message: "Classes updated successfully",
        success: true,
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
};

const searchClass = async (req, res) => {
  try {
    const { pageNo, limit, text } = req.query;
    const classes = await businessClassService.getClassSearch(
      pageNo,
      limit,
      text
    );
    res.status(200).json({ classes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const result = await businessClassService.deleteById(req.params.id);
    if (result) {
      return res.status(200).json({
        message: "Classes deleted successfully",
        success: true,
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
};

module.exports = {
  create,
  getAllClasses,
  getClassById,
  updateClass,
  searchClass,
  deleteClass,
};
