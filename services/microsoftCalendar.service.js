const axios = require("axios");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");
const { encryptSecret, decryptSecret } = require("../helpers/paymentCrypto");

const STATE_PURPOSE = "microsoft-calendar-connect";

// "common" lets both work/school (Microsoft 365) and personal (Outlook.com,
// Hotmail) accounts sign in. The app registration must allow both.
const AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH = "https://graph.microsoft.com/v1.0";

// Calendars.ReadWrite lets us create/update/delete the events we push and,
// later, read busy time. offline_access is what returns a refresh token.
const SCOPES = ["offline_access", "User.Read", "Calendars.ReadWrite"];

// Refresh a little early so a request never starts with a token about to die.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

const isConfigured = () =>
  !!db &&
  !!process.env.MICROSOFT_CLIENT_ID &&
  !!process.env.MICROSOFT_CLIENT_SECRET &&
  !!process.env.MICROSOFT_REDIRECT_URI;

const connectionRef = (userId) =>
  db
    .collection("users")
    .doc(String(userId))
    .collection("calendarConnection")
    .doc("microsoft");

// The OAuth "state" round-trips through Microsoft, so it must be tamper-proof
// (same reasoning as the Google flow): a raw user id would let anyone attach
// their own Microsoft account to someone else's Bisi Books account.
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

const buildAuthUrl = (userId) => {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    response_mode: "query",
    scope: SCOPES.join(" "),
    // Always show the account/consent screen so a subscriber with several
    // Microsoft accounts picks the right calendar.
    prompt: "select_account",
    state: signState(userId),
  });
  return `${AUTHORITY}/authorize?${params.toString()}`;
};

const tokenRequest = async (fields) => {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    scope: SCOPES.join(" "),
    ...fields,
  });
  const { data } = await axios.post(`${AUTHORITY}/token`, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
};

const exchangeCode = (code) =>
  tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
  });

// Tokens are stored encrypted (same helper as the Stripe keys and the Google
// tokens). Microsoft rotates the refresh token on every refresh, so a new one
// must always be saved when it comes back.
const saveConnection = async (userId, tokens, extra = {}) => {
  const data = { last_synced_at: new Date(), ...extra };
  if (tokens.access_token) data.access_token = encryptSecret(tokens.access_token);
  if (tokens.refresh_token) data.refresh_token = encryptSecret(tokens.refresh_token);
  if (tokens.expires_in) data.expiry_date = Date.now() + Number(tokens.expires_in) * 1000;
  await connectionRef(userId).set(data, { merge: true });
};

// Display name for the status line ("Connected as ...").
const fetchAccountEmail = async (accessToken) => {
  try {
    const { data } = await axios.get(`${GRAPH}/me?$select=mail,userPrincipalName`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.mail || data.userPrincipalName || null;
  } catch (err) {
    return null;
  }
};

// Returns a valid access token for this subscriber, or null when they haven't
// connected Outlook. Expired tokens are refreshed and saved back.
const getAccessToken = async (userId) => {
  if (!isConfigured()) return null;
  const doc = await connectionRef(userId).get();
  if (!doc.exists) return null;
  const token = doc.data();
  if (!token.refresh_token && !token.access_token) return null;

  const stillValid =
    token.access_token && token.expiry_date && token.expiry_date - Date.now() > REFRESH_MARGIN_MS;
  if (stillValid) return decryptSecret(token.access_token);

  const refreshed = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: decryptSecret(token.refresh_token),
  });
  await saveConnection(userId, refreshed);
  return refreshed.access_token;
};

// Authenticated Graph call for one subscriber. Throws the axios error so the
// caller can look at err.response.status (404 = event gone).
const graphRequest = async (userId, method, path, body) => {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) return null;
  const response = await axios({
    method,
    url: `${GRAPH}${path}`,
    data: body,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
};

const getStatus = async (userId) => {
  const doc = await connectionRef(userId).get();
  if (!doc.exists) return { connected: false };
  return { connected: true, account: doc.data().account_email || null };
};

// Used by the Disconnect button and by account deletion. Microsoft has no
// public revoke call for a single app's token, so this removes our stored
// tokens; the subscriber can also remove the app at account.microsoft.com.
const disconnect = async (userId) => {
  if (!db) return;
  await connectionRef(userId).delete();
};

module.exports = {
  isConfigured,
  signState,
  verifyState,
  buildAuthUrl,
  exchangeCode,
  saveConnection,
  fetchAccountEmail,
  getAccessToken,
  graphRequest,
  getStatus,
  disconnect,
};
