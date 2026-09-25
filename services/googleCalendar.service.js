const fs = require("fs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const db = require("../config/firebase");
const { encryptSecret, decryptSecret } = require("../helpers/paymentCrypto");

const STATE_PURPOSE = "google-calendar-connect";

const isConfigured = () => !!db && !!process.env.GOOGLE_CREDENTIALS_PATH;

function loadOAuthClient() {
  const credentials = JSON.parse(
    fs.readFileSync(process.env.GOOGLE_CREDENTIALS_PATH, "utf8")
  );
  const oauthConfig = credentials.web || credentials.installed;
  if (!oauthConfig) {
    throw new Error("Invalid credentials.json. Missing web or installed section.");
  }
  const { client_id, client_secret, redirect_uris } = oauthConfig;
  // Staging and production each have their own callback address in the
  // credentials file; pick the right one per environment.
  return new google.auth.OAuth2(
    client_id,
    client_secret,
    process.env.GOOGLE_REDIRECT_URI || redirect_uris[0]
  );
}

const connectionRef = (userId) =>
  db
    .collection("users")
    .doc(String(userId))
    .collection("calendarConnection")
    .doc("google");

// The OAuth "state" round-trips through Google, so it must be tamper-proof:
// a raw user id here would let anyone attach their own Google account to
// someone else's Bisi Books account.
const signState = (userId) =>
  jwt.sign({ uid: String(userId), p: STATE_PURPOSE }, process.env.FRONTEND_JWT_SECRET, {
    expiresIn: "10m",
  });

const verifyState = (state) => {
  const decoded = jwt.verify(state, process.env.FRONTEND_JWT_SECRET);
  if (decoded.p !== STATE_PURPOSE || !decoded.uid) {
    throw new Error("Invalid calendar connection state");
  }
  return decoded.uid;
};

// Tokens are stored encrypted (same helper as the Stripe keys). Values saved
// before encryption existed are plain text and still read fine.
const saveConnection = async (userId, tokens) => {
  const data = { last_synced_at: new Date() };
  if (tokens.access_token) data.access_token = encryptSecret(tokens.access_token);
  if (tokens.refresh_token) data.refresh_token = encryptSecret(tokens.refresh_token);
  if (tokens.expiry_date) data.expiry_date = tokens.expiry_date;
  await connectionRef(userId).set(data, { merge: true });
};

// Returns an authorized Google client for this subscriber, or null when they
// haven't connected a calendar. Refreshed access tokens are saved back.
const getAuthorizedClient = async (userId) => {
  if (!isConfigured()) return null;
  const doc = await connectionRef(userId).get();
  if (!doc.exists) return null;
  const token = doc.data();
  const client = loadOAuthClient();
  client.setCredentials({
    access_token: decryptSecret(token.access_token),
    refresh_token: decryptSecret(token.refresh_token),
    expiry_date: token.expiry_date,
  });
  client.on("tokens", (newTokens) => {
    saveConnection(userId, newTokens).catch((err) =>
      console.error("Could not save refreshed Google token:", err.message)
    );
  });
  return client;
};

module.exports = {
  isConfigured,
  loadOAuthClient,
  signState,
  verifyState,
  saveConnection,
  getAuthorizedClient,
};
