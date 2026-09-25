const express = require("express");
const router = express.Router();
const bankController = require("../../controllers/frontend/bank.controller");

// Mounted at /frontend/bank with authMiddleware applied by the parent
// router (routes/frontend/index.js), matching the convention used for
// /frontend/company and /frontend/personal.
//
// The webhook endpoint is NOT here — Plaid calls it server-to-server with
// no user JWT, and it needs the raw request body for signature
// verification before Express's global JSON parser consumes it. It's
// registered directly in app.js, ahead of that parser. See the comment
// there for why.

router.post("/link-token", bankController.createLinkToken);
router.post("/exchange-token", bankController.exchangeToken);
router.post("/complete-reconnect", bankController.completeReconnect);
router.get("/status", bankController.getConnectionStatus);
router.post("/disconnect", bankController.disconnectBank);
router.get("/transactions", bankController.getTransactions);
router.get("/budget-comparison", bankController.getBudgetComparison);

module.exports = router;
