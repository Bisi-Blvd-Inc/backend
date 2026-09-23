const mongoose = require("mongoose");
const bankConnectionCollection = require("../../models/bankConnection");
const bankTransactionCollection = require("../../models/bankTransaction");
const personalBudgetCollection = require("../../models/personalBudget");
const plaidProvider = require("../../services/bankProvider/plaid.provider");
const { encryptSecret, decryptSecret } = require("../../helpers/paymentCrypto");
const { BUDGET_CATEGORIES } = require("../../helpers/budgetCategoryMap");

const createLinkToken = async (req, res) => {
  try {
    // If there's an existing connection in "error" status, put Link into
    // update mode (re-auths the same item) instead of connecting a new
    // one — see the comment on plaidProvider.createLinkToken.
    const existingConnection = await bankConnectionCollection.findOne({
      userId: req._user,
      isDeleted: false,
      status: "error",
    });
    const existingAccessToken = existingConnection
      ? decryptSecret(existingConnection.accessTokenEncrypted)
      : undefined;

    const linkToken = await plaidProvider.createLinkToken(
      req._user,
      existingAccessToken
    );
    return res.status(200).json({ success: true, linkToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const exchangeToken = async (req, res) => {
  try {
    const { publicToken } = req.body;
    if (!publicToken) {
      return res
        .status(400)
        .json({ success: false, message: "publicToken is required" });
    }

    const { accessToken, itemId, institutionId, institutionName } =
      await plaidProvider.exchangePublicToken(publicToken);

    const connection = await bankConnectionCollection.findOneAndUpdate(
      { userId: req._user, itemId },
      {
        userId: req._user,
        itemId,
        accessTokenEncrypted: encryptSecret(accessToken),
        institutionId,
        institutionName,
        status: "connected",
        errorCode: null,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Bank account connected successfully",
      data: {
        institutionName: connection.institutionName,
        status: connection.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Called instead of exchangeToken when Link ran in "update mode" (an
// existing errored connection was being re-authenticated). Plaid doesn't
// issue a new access_token in that flow — the existing one stays valid —
// so there's nothing to exchange, just clear the error status.
const completeReconnect = async (req, res) => {
  try {
    const connection = await bankConnectionCollection.findOneAndUpdate(
      { userId: req._user, isDeleted: false, status: "error" },
      { status: "connected", errorCode: null },
      { new: true }
    );
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "No errored bank connection found to reconnect",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Bank account reconnected successfully",
      data: { institutionName: connection.institutionName, status: connection.status },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getConnectionStatus = async (req, res) => {
  try {
    const connection = await bankConnectionCollection.findOne({
      userId: req._user,
      isDeleted: false,
    });
    if (!connection) {
      return res.status(200).json({ success: true, data: null });
    }
    return res.status(200).json({
      success: true,
      data: {
        institutionName: connection.institutionName,
        status: connection.status,
        lastSyncedAt: connection.lastSyncedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const disconnectBank = async (req, res) => {
  try {
    await bankConnectionCollection.updateOne(
      { userId: req._user, isDeleted: false },
      { isDeleted: true, status: "disconnected" }
    );
    return res
      .status(200)
      .json({ success: true, message: "Bank account disconnected" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { month } = req.query;
    const query = { userId: req._user, removed: false };
    if (month) {
      const start = new Date(`${month}-01T00:00:00`);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid month — expected format YYYY-MM",
        });
      }
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      query.date = { $gte: start, $lt: end };
    }
    const transactions = await bankTransactionCollection
      .find(query)
      .sort({ date: -1 });
    return res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Sums actual transactions by budget category for a month, diffed against
// the subscriber's stored projected budget for that category (from
// personalBudget.summaryObject — see budgetCategoryMap.js for why the
// category list mirrors that model's existing fields rather than
// introducing a new schema).
const getBudgetComparison = async (req, res) => {
  try {
    const monthParam = req.query.month;
    const now = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
    if (isNaN(now.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid month — expected format YYYY-MM",
      });
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const actualsByCategory = await bankTransactionCollection.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(req._user),
          removed: false,
          date: { $gte: start, $lt: end },
          budgetCategory: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$budgetCategory",
          actual: { $sum: "$amount" },
        },
      },
    ]);
    const actualsMap = Object.fromEntries(
      actualsByCategory.map((row) => [row._id, row.actual])
    );

    // The projected monthly amount per category already exists — the
    // Personal Budget wizard computes and stores it as
    // summaryObject.totalMonthly{Category} (e.g. totalMonthlyHousing),
    // per src/pages/personalBudgetIncome.jsx. No new field needed.
    const personalBudget = await personalBudgetCollection.findOne({
      addedBy: req._user,
    });
    const summary = personalBudget?.summaryObject || {};

    const comparison = BUDGET_CATEGORIES.map((category) => {
      const summaryKey = `totalMonthly${category[0].toUpperCase()}${category.slice(1)}`;
      const projected = Number(summary[summaryKey]) || 0;
      const actual = actualsMap[category] || 0;
      return {
        category,
        projected,
        actual,
        delta: actual - projected,
        percentUsed: projected > 0 ? Math.round((actual / projected) * 100) : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
        comparison,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Separate from the existing Stripe webhook pattern
// (controllers/frontend/user.controller.js: userWebhook), which has no
// signature verification. This route is mounted with express.raw() (see
// routes/frontend/bank.router.js) specifically so the raw body bytes are
// available for signature verification — real bank data, not treated as
// a lower-stakes integration.
const handleWebhook = async (req, res) => {
  try {
    const isValid = await plaidProvider.verifyWebhookSignature(
      req.body, // raw Buffer, from express.raw()
      req.headers["plaid-verification"]
    );
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid webhook signature" });
    }

    const payload = JSON.parse(req.body.toString("utf8"));
    const { webhook_type: webhookType, webhook_code: webhookCode, item_id: itemId } = payload;

    if (webhookType === "TRANSACTIONS") {
      const connection = await bankConnectionCollection.findOne({ itemId });
      if (connection) {
        // Actual sync work happens in the scheduled sweep (services/bankSync.service.js)
        // to keep this handler fast and avoid duplicating the sync logic —
        // just flag it so the next sweep picks this item up first.
        await bankConnectionCollection.updateOne(
          { _id: connection._id },
          { $set: { needsSync: true } }
        );
      }
    } else if (webhookType === "ITEM" && webhookCode === "ERROR") {
      await bankConnectionCollection.updateOne(
        { itemId },
        {
          $set: {
            status: "error",
            errorCode: payload.error?.error_code || "UNKNOWN",
          },
        }
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Plaid webhook error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLinkToken,
  exchangeToken,
  completeReconnect,
  getConnectionStatus,
  disconnectBank,
  getTransactions,
  getBudgetComparison,
  handleWebhook,
};
