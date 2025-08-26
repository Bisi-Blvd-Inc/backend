const enterpriseService = require("../../services/enterprise.service");
const enterpriseCollection = require("../../models/enterprise");
const { Parser } = require("json2csv");
const bcrypt = require("bcrypt");
const {
  sendLeadConnectorWebhook,
} = require("../../helpers/marketingConnector");
const { sendActivationMail } = require("../../helpers/users");
const { v4: uuidv4 } = require("uuid");
const authService = require("../../services/auth.services");

const createEnterprise = async (req, res) => {
  try {
    const {
      enterpriseName,
      contactName,
      phone,
      email,
      businessType,
      password,
    } = req.body;

    const user = await authService.findOne({ email, isDeleted: false });
    if (
      (user?.HistoryActivateStatus === true && user?.status === 1) ||
      user?.status === 1 ||
      (user?.HistoryActivateStatus === false && user?.status === 0)
    ) {
      return res.status(400).json({ message: "Email Already Exists" });
    }

    if (password) {
      bcrypt.hash(password.toString(), 10, async (err, hash) => {
        try {
          if (err) {
            return res.status(400).json({ error: "Something went wrong" });
          }

          const newUser = {
            email,
            password: hash,
            firstName: contactName,
            businessName: enterpriseName,
            phone,
            businessType,
            withEnterprise: true,
            isEnterpriseAdmin: true,
            role: 2,
          };
          const createdUser = await authService.post(newUser);

          sendLeadConnectorWebhook(createdUser);
          await sendActivationMail(email);

          const enterprise = await enterpriseService.createEnterprise({
            ...req.body,
            password: hash,
            userKeys: [
              {
                key: uuidv4(),
                user: createdUser._id,
              },
            ],
          });

          return res.status(200).json({
            success: true,
            message: "Enterprise created successfully. Please verify email!",
            data: enterprise,
          });
        } catch (error) {
          return res.status(500).json({
            message: error.message,
            data: {},
            success: false,
          });
        }
      });
    }
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

const addEnterpriseKey = async (req, res) => {
  try {
    const enterprise = await enterpriseService.addEnterpriseKey(req.params.id);
    if (!enterprise) {
      return res.status(404).json({
        error: "Enterprise not found or License max reached",
        success: false,
      });
    }
    return res.status(200).json({
      message: "License key added successfully",
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

const deleteEnterpriseKey = async (req, res) => {
  try {
    const { updatedEnterprise, userDeleted } =
      await enterpriseService.deleteEnterpriseKey(req.params.key);
    if (updatedEnterprise) {
      return res.status(200).json({
        message: `License key deleted successfully${
          userDeleted ? " and user removed" : ""
        }`,
        success: true,
        data: updatedEnterprise,
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

const exportEnterpriseKeysCsv = async (req, res) => {
  try {
    const { id } = req.params;

    const enterprise = await enterpriseCollection
      .findById(id)
      .populate("userKeys.user", "firstName lastName email");

    if (!enterprise) {
      return res.status(404).json({ message: "Enterprise not found" });
    }

    const exportData = enterprise.userKeys.map((entry) => ({
      Key: entry.key,
      FirstName: entry.user?.firstName || "-",
      LastName: entry.user?.lastName || "-",
      Email: entry.user?.email || "-",
    }));

    const fields = ["Key", "FirstName", "LastName", "Email"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(exportData);

    res.header("Content-Type", "text/csv");
    res.attachment(`enterprise_user_keys_${enterprise._id}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  createEnterprise,
  getWithPagination,
  getEnterpriseById,
  updateEnterprise,
  deleteEnterprise,
  addEnterpriseKey,
  deleteEnterpriseKey,
  exportEnterpriseKeysCsv,
};
