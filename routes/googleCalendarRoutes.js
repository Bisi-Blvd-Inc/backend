const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const db = require("../config/firebase");
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../../middlewares/frontend/authMiddleware");

// Load Google credentials
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH;

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


// Helper: Load OAuth2 client
function loadOAuthClient() {
  const credentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, "utf8")
  );

  const oauthConfig =
    credentials.web || credentials.installed;

  if (!oauthConfig) {
    throw new Error(
      "Invalid credentials.json. Missing web or installed section."
    );
  }

  const {
    client_id,
    client_secret,
    redirect_uris,
  } = oauthConfig;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
}
// Helper: Authorize client with saved token
/*
async function authorize() {
  const oAuth2Client = loadOAuthClient();

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  throw new Error("Google Calendar token.json not found. Please authenticate.");
}
*/

async function authorize(userId) {
  const oAuth2Client = loadOAuthClient();

  const doc = await db
    .collection("users")
    .doc(userId)
    .collection("calendarConnection")
    .doc("google")
    .get();

  if (!doc.exists) {
    throw new Error("Google Calendar not connected.");
  }

  const token = doc.data();

  oAuth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
  });

  return oAuth2Client;
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
      scope: ["https://www.googleapis.com/auth/calendar"],
      state: userId, // Pass userId in state to identify the user in the callback
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
    const userId = req.query.state; // Retrieve userId from state parameter
    const oAuth2Client = loadOAuthClient();
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({
        error: "Authorization code missing",
    }); 
  }

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await db
      .collection("users")
      .doc(userId)
      .collection("calendarConnection")
      .doc("google")
      .set({
        access_token: tokens.access_token || "",
        refresh_token: tokens.refresh_token || "",
        connected_at: new Date(),
        last_synced_at: new Date(),
      });

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
        .doc(userId)
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
      .doc(userId)
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
      .doc(userId)
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
      .doc(userId)
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
