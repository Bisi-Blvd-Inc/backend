const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { authMiddleware } = require("../middlewares/frontend/authMiddleware");
const microsoft = require("../services/microsoftCalendar.service");

// db is null when config/firebase.js couldn't load its service account key,
// and the Microsoft app settings are set per environment. Fail these routes
// individually instead of the whole server refusing to start.
router.use((req, res, next) => {
  if (!microsoft.isConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Outlook Calendar integration is not configured on this server",
    });
  }
  next();
});

const page = (message) =>
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Outlook Calendar</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;text-align:center"><p>${message}</p></body></html>`;

// Start the connection: the app sends the subscriber here, we hand back the
// Microsoft sign-in address (with a signed, 10-minute state).
router.get("/auth-url", authMiddleware, (req, res) => {
  try {
    res.json({ url: microsoft.buildAuthUrl(req._user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Microsoft sends the browser back here after sign-in.
router.get("/oauth2callback", async (req, res) => {
  try {
    if (req.query.error) {
      // e.g. the subscriber clicked Cancel, or an admin blocked the app.
      return res
        .status(400)
        .send(page("Outlook Calendar was not connected. You can close this window and try again from the Calendar page."));
    }

    let userId;
    try {
      userId = microsoft.verifyState(req.query.state);
    } catch (stateErr) {
      return res
        .status(400)
        .send(page("This connection link is invalid or has expired. Please start again from the Calendar page."));
    }
    if (!req.query.code) {
      return res.status(400).send(page("Authorization code missing. Please start again from the Calendar page."));
    }

    const tokens = await microsoft.exchangeCode(req.query.code);
    const account = await microsoft.fetchAccountEmail(tokens.access_token);
    await microsoft.saveConnection(userId, tokens, {
      connected_at: new Date(),
      account_email: account,
    });

    res.send(page("Outlook Calendar connected successfully. You can close this window."));
  } catch (err) {
    console.error("Outlook Calendar connect failed:", err.response ? err.response.data : err.message);
    res.status(500).send(page("We couldn't finish connecting Outlook Calendar. Please try again."));
  }
});

router.get("/status", authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, ...(await microsoft.getStatus(req._user)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/disconnect", authMiddleware, async (req, res) => {
  try {
    await microsoft.disconnect(req._user);
    res.json({ success: true, message: "Outlook Calendar disconnected" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
