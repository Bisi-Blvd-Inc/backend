const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

// Load Google credentials
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH;
const TOKEN_PATH = path.join(__dirname, "../config/token.json");

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
async function authorize() {
  const oAuth2Client = loadOAuthClient();

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  throw new Error("Google Calendar token.json not found. Please authenticate.");
}

// ---------------------------
// ROUTE: Get Google Auth URL
// ---------------------------
router.get("/auth-url", async (req, res) => {
  try {
    const oAuth2Client = loadOAuthClient();

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar"],
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
    const oAuth2Client = loadOAuthClient();
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({
        error: "Authorization code missing",
    }); 
  }

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    res.send("Google Calendar connected successfully. You can close this window.");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTE: List Calendar Events
// ---------------------------
router.get("/events", async (req, res) => {
  try {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTE: Create Calendar Event
// ---------------------------
router.post("/create", async (req, res) => {
  try {
    const auth = await authorize();
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

    res.json({ success: true, event: response.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTE: Delete Calendar Event
// ---------------------------
router.delete("/delete/:eventId", async (req, res) => {
  try {
    const auth = await authorize();
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: req.params.eventId,
    });

    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// ROUTE: Check Google Calendar Connection Status
// ---------------------------
router.get("/status", (req, res) => {
  res.json({
    success: true,
    credentialsExists: fs.existsSync(CREDENTIALS_PATH),
    tokenExists: fs.existsSync(TOKEN_PATH),
  });
});
module.exports = router;
