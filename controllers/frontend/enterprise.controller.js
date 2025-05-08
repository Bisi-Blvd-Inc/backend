const enterpriseService = require("../../services/enterprise.service");

const joinEnterprise = async (req, res) => {
  const { enterpriseKey, userId } = req.body;
  try {
    const updated = await enterpriseService.addUserToEnterprise(
      enterpriseKey,
      userId
    );
    if (!updated) {
      return res
        .status(404)
        .json({ error: "Invalid enterprise key", success: false });
    }
    return res.status(200).json({
      message: "Enterprise joined successfully",
      success: true,
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
      success: false,
    });
  }
};

const getEnterpriseByUserId = async (req, res) => {
  try {
    const enterprise = await enterpriseService.getEnterpriseByUserId(req._user);
    if (!enterprise) {
      return res
        .status(404)
        .json({ error: "Enterprise not found for this user" });
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

const getEnterpriseByKey = async (req, res) => {
  try {
    const enterprise = await enterpriseService.getEnterpriseByKey(
      req.params.key
    );
    if (!enterprise) {
      return res
        .status(404)
        .json({ error: "Enterprise not found for this user" });
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
  joinEnterprise,
  getEnterpriseByUserId,
  getEnterpriseByKey,
};
