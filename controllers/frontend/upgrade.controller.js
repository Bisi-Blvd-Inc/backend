const userCollection = require("../../models/user");
const upgradeService = require("../../services/upgrade.service");

const createPlan = async (req, res) => {
  try {
    const {
      cardDetails,
      planDeatils,
      subscriptionStatus,
      subscriptionStartDate,
      fcmToken,
      subscriptionEndDate,
    } = req.body;


    let userId = req._user;
    const upgrade_obj = {
      cardDetails,
      planDeatils,
      subscriptionStatus,
      fcmToken,
      subscriptionStartDate,
      subscriptionEndDate,
      userId,
    };
    const user1 = await userCollection.findById(userId);

    const createPlanUpgrade = await upgradeService.post(upgrade_obj);
    if (createPlanUpgrade) {
    
    return res.status(200).json({
      success: true,
      message: user1.paymentStatus == 0  ?  "Plan purchase is successfully completed "  : "Plan successfully upgraded",
      data: createPlanUpgrade,
    });
  }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const removePlan = async (req, res) => {
  const Id = req.params.id;
  try {
    const response = await upgradeService.remove(Id);
    if (response) {
      return res.status(200).json({
        success: true,
        message: "Upgrade Plan Removed Successfully",
        data: response,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No Upgrade Plan Found",
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
  createPlan,
  removePlan,
};
