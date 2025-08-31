const enterpriseService = require("../../services/enterprise.service");
const Enterprise = require("../../models/enterprise");
const { v4: uuidv4 } = require("uuid");

const joinEnterprise = async (req, res) => {
  try {
    const { key, userId } = req.body;

    const enterprise = await Enterprise.findOne({
      userKeys: {
        $elemMatch: {
          key: key,
          user: null,
        },
      },
    });

    if (!enterprise) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or already used key" });
    }

    const updated = await Enterprise.updateOne(
      { _id: enterprise._id, "userKeys.key": key },
      { $set: { "userKeys.$.user": userId } }
    );

    return res.status(200).json({
      success: true,
      message: "User assigned to enterprise",
      data: updated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: err.message });
  }
};

const getEnterpriseByUserId = async (req, res) => {
  try {
    const enterprise = await enterpriseService.getEnterpriseByUserId(
      req.params.id
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

const getEnterpriseByKey = async (req, res) => {
  try {
    const enterprise = await enterpriseService.getEnterpriseByKey(
      req.params.key
    );
    if (!enterprise) {
      return res.status(404).json({ error: "Invalid or already used code" });
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

const generateAndSendActivationKey = async (req, res) => {
  try {
    const { enterpriseId, email } = req.body;

    const enterprise = await Enterprise.findById(enterpriseId);
    if (!enterprise) {
      return res
        .status(404)
        .json({ success: false, message: "Enterprise not found" });
    }

    let existingKey = enterprise.userKeys.find(
      (k) => k.email === email && !k.user
    );

    if (existingKey) {
      await sendEmail(email, existingKey.key);
      return res.status(200).json({
        success: true,
        message: "Activation code resent",
      });
    }

    if (enterprise.userKeys?.length >= enterprise.licenses) {
      const unusedKey = enterprise.userKeys.find((k) => !k.user);
      if (unusedKey) {
        unusedKey.email = email;
        await enterprise.save();
        await sendEmail(email, unusedKey.key);
        return res.status(200).json({
          success: true,
          message: "Activation code sent",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "No licenses available",
        });
      }
    }

    const newKey = uuidv4();
    enterprise.userKeys.push({ key: newKey, email });
    await enterprise.save();

    await sendEmail(email, newKey);

    return res.status(200).json({
      success: true,
      message: "Activation code sent",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

module.exports = {
  joinEnterprise,
  getEnterpriseByUserId,
  getEnterpriseByKey,
  generateAndSendActivationKey,
};
