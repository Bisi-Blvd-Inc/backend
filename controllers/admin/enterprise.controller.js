const enterpriseService = require("../../services/enterprise.service");
const enterpriseCollection = require("../../models/enterprise")

const createEnterprise = async (req, res) => {
  try {
    const enterprise = await enterpriseService.createEnterprise(req.body);
    return res.status(200).json({
      message: "Enterprise created successfully",
      success: true,
      data: enterprise,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
      success: false,
    });
  }
};

const updateEnterprise = async (req, res) => {
  try {
    const result = await enterpriseService.updateById(req.params.id, req.body);
    if (result) {
      return res.status(200).json({
        message: "Enterprise updated successfully",
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

const deleteEnterprise = async (req, res) => {
  try {
    const result = await enterpriseService.deleteById(req.params.id);
    if (result) {
      return res.status(200).json({
        message: "Enterprise deleted successfully",
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

const getWithPagination = async (req, res) => {
  try {
    let { pageNo, limit } = req.params;
    const enterprises = await enterpriseService.get(
      Number(pageNo),
      Number(limit)
    );

    const count = await enterpriseCollection.countDocuments();

    return res.status(200).json({
      message: "Enterprises fetched successfully",
      success: true,
      data: enterprises,
      count: count,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
      success: false,
    });
  }
};

const getEnterpriseById = async (req, res) => {
  try {
    const enterprise = await enterpriseService.getEnterpriseById(req.params.id);
    if (!enterprise) {
      return res
        .status(404)
        .json({ error: "Enterprise not found", success: false });
    }
    return res.status(200).json({
      message: "Enterprise fetched successfully",
      success: true,
      data: enterprise,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
      success: false,
    });
  }
};

module.exports = {
  createEnterprise,
  getWithPagination,
  getEnterpriseById,
  updateEnterprise,
  deleteEnterprise,
};
