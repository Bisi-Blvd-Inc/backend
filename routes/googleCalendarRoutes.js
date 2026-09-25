const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const db = require("../config/firebase");
const { authMiddleware } = require("../middlewares/frontend/authMiddleware");
const {
  loadOAuthClient,
  signState,
  verifyState,
  saveConnection,
  getAuthorizedClient,
} = require("../services/googleCalendar.service");


// db is null when config/firebase.js couldn't load its service account key
// (see that file) — fail these routes individually instead of the whole
// server refusing to start.
router.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({
      success: false,
      message: "Google Calendar integration is not configured on this server",
    });
  }
  next();
});


// Helper: authorized Google client for a subscriber (throws if not connected)
async function authorize(userId) {
  const auth = await getAuthorizedClient(userId);
  if (!auth) {
    throw new Error("Google Calendar not connected.");
  }
  return auth;
}

// ---------------------------
// ROUTE: Get Google Auth URL
// ---------------------------
router.get("/auth-url", authMiddleware, async (req, res) => {
  try {
    const userId = req._user;

    const oAuth2Client = loadOAuthClient();

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: signState(userId), // signed + short-lived; verified in the callback
    });

    res.json({ url: authUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

// ---------------------------
// ROUTE: Handle OAuth Callback
// ---------------------------
router.get("/oauth2callback", async (req, res) => {
  try {
    let userId;
    try {
      userId = verifyState(req.query.state);
    } catch (stateErr) {
      return res.status(400).json({
        error: "This connection link is invalid or has expired. Please start again from the Calendar page.",
      });
    }
    const oAuth2Client = loadOAuthClient();
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({
        error: "Authorization code missing",
      });
    }

    const { tokens } = await oAuth2Client.getToken(code);
    await saveConnection(userId, { ...tokens, connected_at: undefined });
    await db
      .collection("users")
      .doc(String(userId))
      .collection("calendarConnection")
      .doc("google")
      .set({ connected_at: new Date() }, { merge: true });

    res.send("Google Calendar connected successfully. You can close this window.");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTE: List Calendar Events
// ---------------------------
router.get("/events", authMiddleware, async (req, res) => {
  try {
    const userId = req._user;
    const auth = await authorize(userId);
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
    });
    
    const events = response.data.items || [];
    
    for (const event of events) {
    await db
        .collection("users")
        .doc(String(userId))
        .collection("calendarEvents")
        .doc(event.id)
        .set({
            title: event.summary || "",
            description: event.description || "",
            start_time: event.start?.dateTime || event.start?.date || null,
            end_time: event.end?.dateTime || event.end?.date || null,
            location: event.location || "",
            guests: event.attendees || [],
            meet_link: event.hangoutLink || "",
            visibility: event.visibility || "",
            last_synced_at: new Date(),
        }); 
}
    res.json(response.data.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTE: Create Calendar Event
// ---------------------------
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const userId = req._user;
    const auth = await authorize(userId);
    const calendar = google.calendar({ version: "v3", auth });
    
    if (!req.body?.summary) {
      return res.status(400).json({
        error: "Event summary is required",
      });
    }
    const event = req.body;

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    await db
      .collection("users")
      .doc(String(userId))
      .collection("calendarEvents")
      .doc(response.data.id)
      .set({
        title: response.data.summary || "",
        description: response.data.description || "",
        start_time: response.data.start?.dateTime || response.data.start?.date || null,
        end_time: response.data.end?.dateTime || response.data.end?.date || null,
        location: response.data.location || "",
        guests: response.data.attendees || [],
        meet_link: response.data.hangoutLink || "",
        visibility: response.data.visibility || "",
        last_synced_at: new Date(),
      });

    res.json({
      success: true,
      event: response.data,
  });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
 });

// ---------------------------
// ROUTE: Delete Calendar Event
// ---------------------------
router.delete("/delete/:eventId", authMiddleware, async (req, res) => {
  try {
    const userId = req._user;
    const auth = await authorize(userId);
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: req.params.eventId,
    });
    await db
      .collection("users")
      .doc(String(userId))
      .collection("calendarEvents")
      .doc(req.params.eventId)
      .delete();

    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTE: Check Google Calendar Connection Status
// ---------------------------
router.get("/status", authMiddleware, async (req, res) => {
  try {

    const userId = req._user;

    const doc = await db
      .collection("users")
      .doc(String(userId))
      .collection("calendarConnection")
      .doc("google")
      .get();

    res.json({
      success: true,
      connected: doc.exists,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
module.exports = router;
