const admin = require("firebase-admin");

// The Google Calendar feature's Firestore integration needs this key file,
// which is a secret and isn't checked into git. Rather than let a missing
// key crash the entire server at boot (it previously took down every route,
// not just Calendar), fail gracefully here: export null, and the routes
// that depend on it return a clear 503 instead of the whole app crash-looping.
let db = null;
try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  db = admin.firestore();
} catch (err) {
  console.warn(
    "Firebase not initialized — config/serviceAccountKey.json is missing or invalid. Google Calendar features are disabled until it's added.",
    err.message
  );
}

module.exports = db;

